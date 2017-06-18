'use strict'

/* Work with blocks
*  Block format
*
*  hash         32 B        Header hash
*  --------------- HEADER ---------------
*  ver           1 B        Block version
*  prevBlock    32 B        Hash of previous block
*  time          8 B        Time of generation (+- 5 sec.)
*  diff         32 B        Maximum value of header hash
*  nonce         8 B        Nonce
*  txCount       4 B        Count of transactions (tx)
*  txHashList 32 * txCount  List of tx hashes
*  --------------------------------------
*  transactions with size (for fast reading) and without hash field
*/

const R = require('ramda')

const helper = require('./helper')
const storage = require('./Storage')
const WCache = require('./WCache')
const hours = require('./Hours')
const PacketBig = require('./PacketBig')
const blockchain = require('./Blockchain')
const BlockHelper = require('./BlockHelper')
const Tx = require('./Tx')

const ERR_NULL = 'null'
const ERR_TOO_BIG = 'Too big'
const ERR_UNPACK_FAILED = 'Unpack failed'
const ERR_WRONG_VERSION = 'Wrong version'
const ERR_WRONG_HASH = 'Wrong hash'
const ERR_WRONG_PREVBLOCK = 'Wrong prevBlock'
const ERR_WRONG_TIME = 'Wrong time'
const ERR_WRONG_DIFF = 'Wrong diff'
const ERR_TOO_EASY_HASH = 'Too easy hash'
const ERR_WRONG_TX = 'Wrong tx'

const functions = {
  // Pack, unpack, update and work with hashes
  pack: (data) => {
    const packet = PacketBig().packNumber(data.ver, 1).packFixed(data.prevBlock).packNumber64(data.time).packFixed(data.diff).packNumber64(data.nonce)
    packet.packNumber(data.txList.length, 4)
    R.forEach((hash) => {
      packet.packFixed(hash)
    }, data.txHashList)
    const header = Buffer.from(packet.get())
    
    R.forEach((tx) => {
      packet.packNumber(tx.length, 4).packFixed(tx)
    }, data.txList)
    return {header: header, entire: packet.get()}
  },
  set: (buffer, data) => {
    if (data.prevBlock !== undefined) {
      data.prevBlock.copy(buffer, 1)
    }
    if (data.time !== undefined) {
      PacketBig().packNumber64(data.time).get().copy(buffer, 33)
    }
    if (data.diff !== undefined) {
      data.diff.copy(buffer, 41)
    }
    if (data.nonce !== undefined) {
      PacketBig().packNumber64(data.nonce).get().copy(buffer, 73)
    }
    if (data.nonceRaw !== undefined) {
      data.nonceRaw.copy(buffer, 73)
    }
    if (data.nonceLow !== undefined) {
      buffer.writeIntBE(data.nonceLow, 76, 5)
    }
  },
  calcHash: (data, target = null) => {
    const hash = helper.hash(data)
    return (hash.compare(target || data.slice(41, 73)) > 0 ? false : hash)
  },
  attachHash: (hash, data) => {
    return Buffer.concat([hash, data])
  },
  getHash: (data) => {
    return data.slice(0, 32)
  },
  detachHash: (data) => {
    return data.slice(32)
  },
  unpack: (data) => {
    return BlockHelper.unpack(data)
  },
  unpackPrevBlock: (data) => {
    return data.slice(1, 33)
  },
  unpackTime: (data) => {
    return PacketBig(data.slice(33, 41)).unpackNumber64()
  },
  unpackDiff: (data) => {
    return data.slice(41, 73)
  },
  unpackNonce: (data) => {
    return data.slice(73, 81)
  },
  unpackHashList: (data) => {
    return BlockHelper.unpackHashList(data)
  },
  // Get
  getLast: () => {
    var lastId = blockchain.getLength() - 1
    if (lastId === -1) {
      return false
    } else {
      var lastBlock = blockchain.get(lastId)
      return {id: lastId, hash: lastBlock.hash, data: lastBlock.data}
    }
  },
  getByTimeCount: (from, to) => {
    var count = 0
    var max = blockchain.getLength() - 1
    for (let i = max; i >= 0; i--) {
      const time = functions.unpackTime(blockchain.get(i).data)
      if (time < from) {
        break
      } else if ((time >= from) && (time <= to)) {
        count++
      }
    }
    return count
  },
  getWithBuffer: (field, value) => {
    return blockchain.each((block) => {
      if (functions.unpack(block.data)[field].equals(value)) {
        return block
      }
    })
  },
  getConfirmationsCount: (hash) => {
    const blockId = blockchain.getWithHash(hash, true)
    return blockId ? blockchain.getLength() - 1 - blockId : -1
  },
  // Properties and validation
  getAddressBalance: (address, id = null) => {
    const maxId = (id === null ? blockchain.getLength() : id)
    let balance = 0
    let txs = []
    blockchain.eachTo(maxId, (block) => {
      const blockUnpacked = functions.unpack(block.data)
      for (let i in blockUnpacked.txList) {
        const tx = blockUnpacked.txList[i]
        const txHash = blockUnpacked.txHashList[i]
        const txUnpacked = Tx.unpack(tx)
        for (let t in txUnpacked.txOuts) {
          t = parseInt(t)
          const txOut = txUnpacked.txOuts[t]
          if (txOut.address.equals(address)) {
            const txWithOutSpent = Tx.isOutSpent(txHash, t)
            const txWithOutSpentFreeTxs = Tx.isOutSpentFreeTxs(txHash, t)
            txs.push({blockId: block.id, blockTime: blockUnpacked.time, hash: txHash, outN: t, value: txOut.value, spent: txWithOutSpent, spentFreeTxs: txWithOutSpentFreeTxs, confirmations: maxId - block.id})
            if (!txWithOutSpent && !txWithOutSpentFreeTxs) {
              balance += txOut.value
            }
          }
        }
      }
    })
    return {balance: balance, txs: txs}
  },
  getAddressBalanceSep: (address, id = null) => {
    const maxId = (id === null ? blockchain.getLength() : id)
    let balanceSoft = 0
    let balanceHard = 0
    let txsSoft = []
    let txsHard = []
    blockchain.eachTo(maxId, (block) => {
      const blockUnpacked = functions.unpack(block.data)
      for (let i in blockUnpacked.txList) {
        const tx = blockUnpacked.txList[i]
        const txHash = blockUnpacked.txHashList[i]
        const txUnpacked = Tx.unpack(tx)
        for (let t in txUnpacked.txOuts) {
          t = parseInt(t)
          const txOut = txUnpacked.txOuts[t]
          if (txOut.address.equals(address)) {
            const txWithOutSpent = Tx.isOutSpent(txHash, t)
            const txWithOutSpentFreeTxs = Tx.isOutSpentFreeTxs(txHash, t)
            const confirmations = maxId - block.id
            if (confirmations < Tx.MIN_CONFIRMATIONS) {
              txsSoft.push({blockId: block.id, blockTime: blockUnpacked.time, hash: txHash, outN: t, value: txOut.value, spent: txWithOutSpent, spentFreeTxs: txWithOutSpentFreeTxs, confirmations: confirmations})
            } else {
              txsHard.push({blockId: block.id, blockTime: blockUnpacked.time, hash: txHash, outN: t, value: txOut.value, spent: txWithOutSpent, spentFreeTxs: txWithOutSpentFreeTxs, confirmations: confirmations})
            }
            if (!txWithOutSpent && !txWithOutSpentFreeTxs) {
              if (confirmations < Tx.MIN_CONFIRMATIONS) {
                balanceSoft += txOut.value
              } else {
                balanceHard += txOut.value
              }
            }
          }
        }
      }
    })
    return {balanceSoft: balanceSoft, balanceHard: balanceHard, txsSoft: txsSoft, txsHard: txsHard}
  },
  getAddressesBalance: (addresses, id = null) => {
    const maxId = (id === null ? blockchain.getLength() : id)
    let balance = 0
    let txs = []
    blockchain.eachTo(maxId, (block) => {
      const blockUnpacked = functions.unpack(block.data)
      for (let i in blockUnpacked.txList) {
        const tx = blockUnpacked.txList[i]
        const txHash = blockUnpacked.txHashList[i]
        const txUnpacked = Tx.unpack(tx)
        for (let t in txUnpacked.txOuts) {
          t = parseInt(t)
          const txOut = txUnpacked.txOuts[t]
          if (R.contains(txOut.address, addresses)) {
            const txWithOutSpent = Tx.isOutSpent(txHash, t)
            const txWithOutSpentFreeTxs = Tx.isOutSpentFreeTxs(txHash, t)
            txs.push({blockId: block.id, blockTime: blockUnpacked.time, hash: txHash, outN: t, address: txOut.address, value: txOut.value, spent: txWithOutSpent, spentFreeTxs: txWithOutSpentFreeTxs, confirmations: maxId - block.id})
            if (!txWithOutSpent && !txWithOutSpentFreeTxs) {
              balance += txOut.value
            }
          }
        }
      }
    })
    return {balance: balance, txs: txs}
  },
  getAddressesBalanceSep: (addresses, id = null, callbacks = {}, login = null) => {
    const maxId = (id === null ? blockchain.getLength() : id)
    let result = {}
    for (let i in addresses) {
      const addr = addresses[i]
      result[addr.hashed] = {
        raw: addr.raw,
        keys: addr.keys,
        balanceSoft: 0,
        balanceHard: 0,
        txsSoft: [],
        txsHard: []
      }
    }
    const rawAddresses = R.map((addr) => {
      return addr.raw
    }, addresses)
    const blockchainLength = blockchain.getLength()
    
    const wcache = WCache(login || storage.session.login)
    
    const processTx = ({addressHashed, blockId, blockTime, hash, outN, value, txIns}) => {
      const txWithOutSpent = Tx.isOutSpent(hash, outN)
      const txWithOutSpentFreeTxs = Tx.isOutSpentFreeTxs(hash, outN)
      const confirmations = maxId - blockId
      const isHard = confirmations >= Tx.MIN_CONFIRMATIONS || txIns && Tx.isOwn(txIns, rawAddresses)
      if (isHard) {
        result[addressHashed].txsHard.push({blockId, blockTime, hash, outN, value, spent: txWithOutSpent, spentFreeTxs: txWithOutSpentFreeTxs, confirmations})
      } else {
        result[addressHashed].txsSoft.push({blockId, blockTime, hash, outN, value, spent: txWithOutSpent, spentFreeTxs: txWithOutSpentFreeTxs, confirmations})
      }
      if (!txWithOutSpent && !txWithOutSpentFreeTxs) {
        if (isHard) {
          result[addressHashed].balanceHard += value
        } else {
          result[addressHashed].balanceSoft += value
        }
      }
      if (!txWithOutSpent) {
        txs.push({addressHashed, blockId, blockTime, hash, outN, value})
      }
    }
    
    let minId = 0
    let txs = []
    const {blockId, txs: txsLoaded} = wcache.get('checkpoint') || {}
    if (blockId && txsLoaded) {
      minId = blockId + 1
      
      R.forEach((txLoaded) => {
        processTx(txLoaded)
      }, txsLoaded)
      
      callbacks.onCheckpointLoaded && callbacks.onCheckpointLoaded(blockId)
    }
    
    blockchain.eachFromTo(minId, maxId, (block) => {
      const blockUnpacked = functions.unpack(block.data)
      for (let i in blockUnpacked.txList) {
        const tx = blockUnpacked.txList[i]
        const txHash = blockUnpacked.txHashList[i]
        const txUnpacked = Tx.unpack(tx)
        for (let t in txUnpacked.txOuts) {
          t = parseInt(t)
          const txOut = txUnpacked.txOuts[t]
          if (R.contains(txOut.address, rawAddresses)) {
            let addressHashed
            for (let a in addresses) {
              if (addresses[a].raw.equals(txOut.address)) {
                addressHashed = addresses[a].hashed
                break
              }
            }
            
            let unique = true
            for (let r in result[addressHashed].txsSoft) {
              const txCheck = result[addressHashed].txsSoft[r]
              if (txHash.equals(txCheck.hash) && (t === txCheck.outN)) {
                unique = false
                break
              }
            }
            if (!unique) {
              continue
            }
            for (let r in result[addressHashed].txsHard) {
              const txCheck = result[addressHashed].txsHard[r]
              if (txHash.equals(txCheck.hash) && (t === txCheck.outN)) {
                unique = false
                break
              }
            }
            if (!unique) {
              continue
            }
            
            processTx({addressHashed, blockId: block.id, blockTime: blockUnpacked.time, hash: txHash, outN: t, value: txOut.value, txIns: txUnpacked.txIns})
          }
        }
      }
      if (block.id === blockchainLength - 1000 && block.id > minId + 500) {
        wcache.set('checkpoint', {blockId: block.id, txs})
        callbacks.onCheckpointCreated && callbacks.onCheckpointCreated(block.id)
      }
    })
    return result
  },
  // id - ID of current block
  calcDiff: (id, prevDiff, blocksCount) => {
    if (!(id % 60)) {
      if ((blocksCount > 70) && (prevDiff.compare(Buffer.from('000000000000000000000000000000000000000000000000000000000000FFFF', 'hex')) > 0)) {
        return helper.shiftBuffer(prevDiff)
      } else if ((blocksCount < 50) && (prevDiff.compare(Buffer.from('000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex')) < 0)) {
        return helper.unshiftBuffer(prevDiff, true)
      }
    }
    return prevDiff
  },
  known: (hash) => {
    return blockchain.known(hash)
  },
  isValidNew: (hash, packed, callback, promiscuous = false) => {
    const lastBlock = functions.getLast()
    functions.isValidExisting(lastBlock ? lastBlock.id + 1 : 0, hash, packed, callback, lastBlock, promiscuous)
  },
  // id - ID of current block. If it is new block, then id=last.id+1
  isValidExisting: (id, hash, packed, callback, prepared = null, promiscuous = false) => {
    const blockSize = packed.length
    if (blockSize > 1048576) {
      callback(false, ERR_TOO_BIG, {size: blockSize})
      return
    }
    
    const lastBlock = id ? prepared || blockchain.get(id - 1) : {hash: Buffer.from('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex')}
    
    // unpacked !== false
    const unpacked = functions.unpack(packed)
    if (!unpacked) {
      callback(false, ERR_UNPACK_FAILED, {info: BlockHelper.getError()})
      return
    }
    
    // ver === 1 or ver === 2
    if ((unpacked.ver !== 1) && (unpacked.ver !== 2)) {
      callback(false, ERR_WRONG_VERSION)
      return
    }
    
    // hash
    const calcedHash = helper.hash(unpacked.ver === 1 ? packed : unpacked.headerRaw)
    if (!calcedHash.equals(hash)) {
      callback(false, ERR_WRONG_HASH)
      return
    }
    
    // prevBlock
    if (!unpacked.prevBlock.equals(lastBlock.hash)) {
      callback(false, ERR_WRONG_PREVBLOCK)
      return
    }
    
    // time
    const lastBlockUnpacked = lastBlock.data ? functions.unpack(lastBlock.data) : false
    if (lastBlockUnpacked && ((unpacked.time < lastBlockUnpacked.time - 60) || (unpacked.time > hours.now() + 60))) {
      callback(false, ERR_WRONG_TIME)
      return
    }
    
    // diff
    if (lastBlockUnpacked && !unpacked.diff.equals(functions.calcDiff(id, lastBlockUnpacked.diff, functions.getByTimeCount(lastBlockUnpacked.time - 3600, lastBlockUnpacked.time)))
      || !lastBlockUnpacked && !unpacked.diff.equals(Buffer.from('000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 'hex'))) {
      callback(false, ERR_WRONG_DIFF)
      return
    }
    
    // hash <= diff
    if (hash.compare(unpacked.diff) > 0) {
      callback(false, ERR_TOO_EASY_HASH)
      return
    }
    
    // tx
    let checked = 0
    let txUnpackedList = []
    for (let i in unpacked.txList) {
      txUnpackedList.push(Tx.unpack(unpacked.txList[i]))
    }
    
    if (promiscuous) {
      callback(true, ERR_NULL, {unpacked, txUnpackedList})
      return
    }
    
    const toCheck = unpacked.txCount - 1
    let notFirstBlockTxsFee = 0
    let stopChecking = false
    
    let checkFirstTx = () => {
      Tx.isValid(unpacked.txHashList[0], unpacked.txList[0], {blockCurTxId: 0, blockOtherTxs: txUnpackedList}, id, true, (valid, err) => {
        if (valid) {
          callback(true, ERR_NULL, {unpacked, txUnpackedList})
        } else {
          callback(false, ERR_WRONG_TX, {index: 0, info: err})
          stopChecking = true
        }
      }, notFirstBlockTxsFee, txUnpackedList[0])
    }
    
    for (let i = toCheck; i > 0; i--) {
      Tx.isValid(unpacked.txHashList[i], unpacked.txList[i], {blockCurTxId: i, blockOtherTxs: txUnpackedList}, id, false, (valid, err, info) => {
        if (valid) {
          checked++
          notFirstBlockTxsFee += info.fee
        } else {
          callback(false, ERR_WRONG_TX, {index: i, info: err, hash: unpacked.txHashList[i]})
          stopChecking = true
        }
        if (checked === toCheck) {
          checkFirstTx()
        }
      }, 0, txUnpackedList[i])
      if (stopChecking) {
        return
      }
    }
    toCheck || checkFirstTx()
  }
}
module.exports = functions
module.exports.ERR_NULL = ERR_NULL
module.exports.ERR_TOO_BIG = ERR_TOO_BIG
module.exports.ERR_UNPACK_FAILED = ERR_UNPACK_FAILED
module.exports.ERR_WRONG_VERSION = ERR_WRONG_VERSION
module.exports.ERR_WRONG_HASH = ERR_WRONG_HASH
module.exports.ERR_WRONG_PREVBLOCK = ERR_WRONG_PREVBLOCK
module.exports.ERR_WRONG_TIME = ERR_WRONG_TIME
module.exports.ERR_WRONG_DIFF = ERR_WRONG_DIFF
module.exports.ERR_TOO_EASY_HASH = ERR_TOO_EASY_HASH
module.exports.ERR_WRONG_TX = ERR_WRONG_TX