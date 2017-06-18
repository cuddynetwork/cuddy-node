'use strict'

const application = require('../package')
console.log('XHD Core ' + application.version + ' loading...')

const fs = require('fs')
let R
try {
  R = require('ramda')
} catch (e) {
  console.log('\x1b[31mRun \x1b[33mnpm install\x1b[31m first.\x1b[0m')
  process.exit()
}

const configPath = __dirname + '/../config.js'
const configPathInit = __dirname + '/../data/init-config.js'
if (!fs.existsSync(configPath)) {
  console.log('Creating configuration file...')
  fs.writeFileSync(configPath, fs.readFileSync(configPathInit))
}
const config = require('../config')

console.log('Checking configuration...')
if (!config.walletHost) {
  console.log('\x1b[31mconfig.walletHost cannot be null.\x1b[0m')
  process.exit()
}
if (config.blockchainMemory) {
  console.log('\x1b[31mBlockchainMemory mode is forbidden.\x1b[0m')
  process.exit()
}

const storage = require('./Storage')
storage.config = config
storage.session.version = application.version
console.log(config)

require('./Debugger')
const helper = require('./helper')
const hours = require('./Hours')
const Address = require('./Address')
const blockchain = require('./Blockchain')
const Block = require('./Block')
const Tx = require('./Tx')
const net = require('./Net')
const p2p = require('./P2P')
const miner = require('./Miner')
const synchronizer = require('./Synchronizer')
const ifc = require('./Interface')

if (!storage.config.rpcHost) {
  storage.config.rpcHost = 'localhost'
  console.log('\x1b[33mconfig.rpcHost set to default: ' + storage.config.rpcHost + '\x1b[0m')
}
if (!storage.config.rpcPort) {
  storage.config.rpcPort = 5839
  console.log('\x1b[33mconfig.rpcPort set to default: ' + storage.config.rpcPort + '\x1b[0m')
}
const rpcServer = require('./RpcServer')

const log = (...data) => {
  storage.trigger('log', ...data) || console.log(...data)
}

storage.logIgnoreModules = {P2P: true, THR: true, BLK: true, RPC: true}
storage.logTrackModule = null

if (process.argv[2] === '--clear-storage') {
  storage.freeTxs = {}
  storage.flush()
  process.exit()
}

for (const i in storage.freeTxs) {
  const freeTx = storage.freeTxs[i]
  if (freeTx && (freeTx.t < helper.unixTime() - 1800)) {
    delete storage.freeTxs[i]
  }
}

setInterval(() => {
  storage.flush()
}, 60000)

storage.on('fatalError', (msg) => {
  ifc.close()
  console.log('Fatal error: ' + msg)
  process.exit(0)
})

net.once('error', (msg) => {
  ifc.close()
  console.log(msg)
  process.exit(0)
})

net.once('online', () => {
  log('CORE: Synchronizing blockchain...')
  synchronizer.remote(() => {
    log('CORE: Blockchain synchronized')
    if (config.minerMode) {
      miner.run(R.map(i => Address.hashToRaw(i), config.minerAddresses))
    }
  })
})

net.on('offline', () => {
})

var onNewBlock = (hash, block, unpacked) => {
  let deleted = 0
  for (let i in unpacked.txHashList) {
    if (Tx.freeTxDelete(unpacked.txHashList[i])) {
      deleted++
    }
  }
  
  miner.restart()
}

synchronizer.on('blockAfterAccept', (afterHash, hash, block, unpacked) => {
  onNewBlock(hash, block, unpacked)
})

synchronizer.on('blockFoundAccept', (hash, block, unpacked) => {
  onNewBlock(hash, block, unpacked)
})

synchronizer.on('txInfoAccept', (hash, tx, fee) => {
  if (fee >= Tx.MIN_FEE) {
    log('CORE: Free tx accepted')
    Tx.freeTxAdd(hash, tx, fee)
    
    miner.restart()
  }
  synchronizer.broadcastTx(hash, tx)
})

hours.sync((err, res) => {
  if (err) {
    console.log('Error while synchronizing time', err)
    process.exit()
  }
  
  const cursorUp = '\x1b[1A'
  const cursorRight = '\x1b[1C'
  
  log('CORE: Blockchain is caching...')
  synchronizer.cache((cached) => {
    log(cursorUp + cursorRight.repeat(30) + cached + '%')
  })
  log('CORE: Blockchain is cached')
  
  ifc.open()
  
  /*
  ifc.key('f5', () => {
    if (storage.session.syncSpeed > 1) {
      storage.session.syncSpeed--
    }
    storage.session.stat.snc = storage.session.syncSpeed
  })

  ifc.key('f6', () => {
    if (storage.session.syncSpeed < 9) {
      storage.session.syncSpeed++
    }
    storage.session.stat.snc = storage.session.syncSpeed
  })
  */

  ifc.key('f7', () => {
    if (synchronizer.isPromiscuous()) {
      synchronizer.setPromiscuous(false)
      log('CORE: {red-fg}promiscuous mode OFF{/red-fg}')
    } else {
      synchronizer.setPromiscuous(true)
      log('CORE: {green-fg}promiscuous mode ON{/green-fg}')
    }
  })

  ifc.key('f8', () => {
    const addresses = R.keys(storage.servers)
    addresses.sort()
    log(addresses)
  })

  ifc.key(['f10', 'C-c'], () => {
    storage.flush()
    process.exit(0)
  })

  ifc.key('C-p', () => {
    storage.logIgnoreModules.P2P = !storage.logIgnoreModules.P2P
    log('Log ignore modules: [' + R.join(', ', R.keys(R.filter(i => i, storage.logIgnoreModules))) + ']')
  })

  ifc.key('C-t', () => {
    storage.logIgnoreModules.THR = !storage.logIgnoreModules.THR
    storage.logTrackModule = storage.logIgnoreModules.THR ? null : 'THR'
    log('Log ignore modules: [' + R.join(', ', R.keys(R.filter(i => i, storage.logIgnoreModules))) + ']')
  })

  ifc.key('C-b', () => {
    storage.logIgnoreModules.BLK = !storage.logIgnoreModules.BLK
    log('Log ignore modules: [' + R.join(', ', R.keys(R.filter(i => i, storage.logIgnoreModules))) + ']')
  })

  ifc.key('C-r', () => {
    storage.logIgnoreModules.RPC = !storage.logIgnoreModules.RPC
    log('Log ignore modules: [' + R.join(', ', R.keys(R.filter(i => i, storage.logIgnoreModules))) + ']')
  })
  
  ifc.key('C-d', () => {
    if (storage.session.debugMode) {
      log('DEBUG MODE OFF')
      storage.session.debugMode = false
    } else {
      log('DEBUG MODE ON: Server socket [L Listen C Close] Miner [R Restart]')
      storage.session.debugMode = true
    }
  })
  
  ifc.key('l', () => {
    if (storage.session.debugMode) {
      p2p.listen(storage.config.myServerPort)
      log('Listening server socket')
    }
  })
  
  ifc.key('c', () => {
    if (storage.session.debugMode) {
      p2p.closeServer()
      log('Closed server socket')
    }
  })
  
  ifc.key('r', () => {
    if (storage.session.debugMode) {
      miner.restart()
    }
  })
  
  net.connect()
})

/* Wallet */
const express = require('express')
const bodyParser = require('body-parser')

const login = process.argv[2] || 'wallet'
const base = __dirname + '/../templates/'

const Wallet = require('./Wallet')
const WCache = require('./WCache')

storage.session.login = login
storage.localSession.wallet = Wallet(login)
storage.localSession.wcache = WCache(login)
const {wallet} = storage.localSession
var opened = false

const def = (value) => {
  return value !== undefined
}

const updateData = (callback) => {
  helper.stopwatch((ready) => {
    wallet.updateData((updated) => {
      ready()
      callback && callback(updated)
    })
  }, true, (time) => {
    log('WLT', '<UpdateData> Balances ready in ' + time + ' ms')
  })
}

const sendData = (socket) => {
  const walletData = wallet.getData()
  socket.json.send({
    balances: walletData.balances,
    balancesSoft: walletData.balancesSoft,
    balancesUnconfirmed: walletData.balancesUnconfirmed,
    txs: walletData.txs,
    txsSoft: walletData.txsSoft,
    allAmount: (walletData.allAmount / 100000000).toFixed(8),
    allAmountSoft: (walletData.allAmountSoft / 100000000).toFixed(8),
    allAmountUnconfirmed: (walletData.allAmountUnconfirmed / 100000000).toFixed(8)
  })
}

const sendCoins = (data, callback) => {
  wallet.sendCoins(data, callback)
}

const app = express()
app.use(bodyParser.urlencoded({extended: false}))
const server = app.listen(config.walletPort, config.walletHost)
const io = require('socket.io').listen(server)
var walletTimer = null

var freeTxChanged = false
storage.on('freeTxAdd', () => {
  freeTxChanged = true
})
storage.on('freeTxDelete', () => {
  freeTxChanged = true
})

io.sockets.on('connection', (socket) => {
  if (walletTimer) {
    clearInterval(walletTimer)
  }
  walletTimer = setInterval(() => {
    if (freeTxChanged || wallet.isBlockchainChanged()) {
      freeTxChanged = false
      updateData((updated) => {
        updated && sendData(socket)
      })
    }
  }, 10000)
  socket.on('message', (data) => {
    if (!opened) {
      socket.json.send({reload: true})
    } else if (data.get === 'balances') {
      sendData(socket)
    } else if (data.post === 'address') {
      wallet.attachAddress(Address.create())
      updateData((updated) => {
        updated && sendData(socket)
      })
    } else if (data.post === 'coins') {
      if (data.sender.length) {
        data.senders = [data.sender]
      }
      sendCoins(data, (result) => {
        socket.json.send({noty: result})
        // updateData()
        sendData(socket)
      })
    }
  })
})
app.get('/', (req, res) => {
  if (synchronizer.isReady()) {
    res.send(fs.readFileSync(base + 'index.html', 'utf8').replace('%LOGIN%', login))
  } else {
    res.send(fs.readFileSync(base + 'sync.html', 'utf8'))
  }
})
app.get('/assets/*', (req, res) => {
  let url = req.params[0]
  if (R.contains(url, ['bootstrap.min.css'])) {
    res.set('Content-type', 'text/css')
    res.send(fs.readFileSync(base + url, 'utf8'))
  } else if (R.contains(url, ['jquery.min.js', 'bootstrap.min.js', 'jquery.noty.packaged.min.js'])) {
    res.set('Content-type', 'application/javascript')
    res.send(fs.readFileSync(base + url, 'utf8'))
  }
})
app.post('/', (req, res) => {
  let created = wallet.create(req.body.password)
  if (created) {
    wallet.attachAddress(Address.create())
  } else {
    wallet.open(req.body.password)
  }
  updateData((updated) => {
    if (updated) {
      opened = true
      let errors = ''
      res.send(fs.readFileSync(base + 'wallet.html', 'utf8').replace('%ERRORS%', errors))
    } else {
      res.redirect('/')
    }
  })
})