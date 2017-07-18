'use strict'

const moment = require('moment')

const config = require('./config')
const helper = require('./lib/helper')
const hours = require('./lib/Hours')
const storage = require('./lib/Storage')
const Block = require('./lib/Block')
const Packet = require('./lib/Packet')

storage.config = config
const rpcClient = require('./lib/RpcClient')

const log = (...data) => {
  console.log('[' + moment().format('HH:mm:ss') + ']#', ...data)
}

hours.sync((err, res) => {
  if (err) {
    log('Error while synchronizing time', err)
    process.exit()
  }
  
  log('Miner runned')

  var hashesPerCycle = 100000
  var nonce = 0
  var working = false

  const args = process.argv
  for (let i = 2; i < args.length; i++) {
    if ((args[i] === '--hpc') && (args[i + 1] !== undefined)) {
      hashesPerCycle = args[i + 1]
    } else if ((args[i] === '--nonce') && (args[i + 1] !== undefined)) {
      const buffer = Buffer.alloc(8, 0x00)
      let argNonce = args[i + 1]
      if (argNonce.length % 2) {
        argNonce = '0' + argNonce
      }
      const nonceBuffer = Buffer.from(argNonce, 'hex')
      nonceBuffer.copy(buffer, 8 - nonceBuffer.length)
      nonce = Packet(buffer).unpackNumber64()
    }
  }

  const initNonce = nonce
  var hps = 0

  log('Configuration')
  log('HPC     :', hashesPerCycle)
  log('Nonce   :', nonce)

  function continueMining() {
    if (working) {
      log('Already mining')
      return
    }
    working = true
    
    //Adding genesis hash
	const block = helper.baseToBuf("")
	const result = res.result
	Block.set(block, {
          nonce: nonce
        })
	rpcClient.call('blockFound', {hash: helper.bufToBase("ca1c5612161b1f75fdb2b2be0043b5790e0e2f4fd9c919b9c419618ea4368558"), blockData: helper.bufToBase(block), txHashList: false}, (res) => {
            res && res.status && log(res.status)
          })
	log('Add genesis')

    
    log('Requesting fresh data')
    rpcClient.call('getMiningTask', {nonce: initNonce, hps: hps}, (res) => {
      if (!res || !res.result) {
        log('Request error')
        setTimeout(continueMining, 1000)
        working = false
        return
      }
      
      const result = res.result
      if (!result.active) {
        log('Mining suspended')
        hps = 0
        working = false
        setTimeout(continueMining, 1000)
        return
      }
      
      const block = helper.baseToBuf(result.blockData)
      const header = block.slice(0, result.blockHeaderSize)
      
      log('Received fresh data, block size', block.length, 'bytes')
      
      let hash
      const timeStart = helper.unixTimeMs()
      for (let i = 0; i < hashesPerCycle; i++) {
        nonce = (nonce < 0xffffffffffff0000 ? nonce + 1 : 0)
        Block.set(block, {
          nonce: nonce
        })
        hash = Block.calcHash(header)
        if (hash) {
          log('FOUND', hash.toString('hex'))
          rpcClient.call('blockFound', {hash: helper.bufToBase(hash), blockData: helper.bufToBase(block), txHashList: result.txHashList}, (res) => {
            res && res.status && log(res.status)
          })
          setTimeout(continueMining, 500)
          working = false
          return
        }
      }
      
      const duration = helper.unixTimeMs() - timeStart
      hps = parseInt(hashesPerCycle * 1000 / duration)
      log('HPS', hps, 'Diff', Block.unpackDiff(header).toString('hex'))
      
      working = false
      continueMining()
    })
  }

  continueMining()
})
