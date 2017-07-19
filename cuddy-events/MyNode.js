/*
    Module for local node management
    CuddyCore v. 0.0.0
*/


var fs = require('fs');
var osenv = require('osenv');
var Structures = require('../resources/Structures.js');
var Constants = require('../resources/Constants.js');
var Hashes = require('jshashes');
var crypto = require('crypto');
var NodesLedgerProcessor = require('./NodesLedgerProcessor.js');
var CollectTokenManager = require('./Collect.js');
var ContractsLedgerProcessor = require('./ContractsLedgerProcessor.js');


const CONFIG_SAVE_LOCATION = Constants.CONFIG_SAVE_LOCATION;
const LEDGERS_DEFAULT_SAVE_LOCATION = Constants.LEDGERS_DEFAULT_SAVE_LOCATION;
const CONTAINERS_DEFAULT_SAVE_LOCATION = Constants.CONTAINERS_DEFAULT_SAVE_LOCATION;

var user_home_path = osenv.home();

function filePathExists(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err && err.code === 'ENOENT') {
        return resolve(false);
      } else if (err) {
        return reject(err);
      }
      if (stats.isFile() || stats.isDirectory()) {
        return resolve(true);
      }
    });
  });
}

/// Init JSON database ////

var JsonDB = require('node-json-db');

var db = new JsonDB(CONFIG_SAVE_LOCATION + "/local-node-config", true, true);

///////


module.exports = {


  init: function () {



    if (filePathExists(module.exports.getLedgersSaveLocation() + "/cuddy-nodes-ledger.json") != true) {
        NodesLedgerProcessor.generateDefaultLedgerStructure();
    }

    if (filePathExists(module.exports.getLedgersSaveLocation() + "/cuddy-contracts-ledger.json") != true) {
        ContractsLedgerProcessor.generateDefaultLedgerStructure();
    }

    if (filePathExists(module.exports.getLedgersSaveLocation() + "/cuddy-local-collect-tokens-ledger.json") != true) {
        CollectTokenManager.generateDefaultLedgerStructure();
    }



    return true;

  },

  getContainersSaveLocation: function () {

    if (module.exports.ifConfigFileExist()) {
      return db.getData("/config/containers_path");
    } else {
      return CONTAINERS_DEFAULT_SAVE_LOCATION;
    }

  },

  getLedgersSaveLocation: function () {

    if (module.exports.ifConfigFileExist()) {
      return db.getData("/config/ledgers_path");
    } else {
      return LEDGERS_DEFAULT_SAVE_LOCATION;
    }

  },

  getLocalNodeDetails: function () {

    return db.getData("/config/node");

  },

  getLocalNodeID: function () {

    return db.getData("/config/node/id");

  },

  getLocalNodeAddress: function () {

    return db.getData("/config/node/address");

  },

  getLocalNodeIp: function () {

    return db.getData("/config/node/Ip");

  },

  getLocalNodePort: function () {

    return db.getData("/config/node/port");

  },

  // Check if config file exist
  ifConfigFileExist: function () {

    if (filePathExists(CONFIG_SAVE_LOCATION + "/local-node-config.json")) {
      return true;
    } else {
      return false;
    }

  },

  saveLocalNodeDetails: function (local_node) {

    return db.push("/config/node", local_node);

  },

  saveLocalNodeIP: function (nodeIP) {

    return db.push("/config/node/address", nodeIP);

  },

  getRootNodes: function () {

    return db.getData("/config/root_nodes");

  },

  generateDefaultConfig: function (local_node) {

    var localNodeConfigStructure = {
      config: {

        node: {
          id: "",
          address: "",
          port: 6689
        },

        network: {
          upnp: 1,
          bandwidth: {
            upload: 0,
            download: 0
          }
        },

        initialized: 0,
        ledgers_path: LEDGERS_DEFAULT_SAVE_LOCATION,
        containers_path: CONTAINERS_DEFAULT_SAVE_LOCATION,

        contract_negotiation: {
          max_file_size: 0,
          max_complexity: 0,
            excution: {
              enabled: 0,
              php: 0,
              ruby: 0
            }
        },

        max_used_space: 0,
        root_nodes: {
            "63h6c38ch63c983ch698w": {
              "ip": "root.pl.cuddy.network",
              "port": 6689
            }
        }


      }
    }

    return db.push("/", localNodeConfigStructure);

  },

  isFirstRun: function (local_node) {

    if (module.exports.ifConfigFileExist() != true) {
        module.exports.generateDefaultConfig();
    }

    is_initialized = db.getData("/config/initialized").toString();

    if (is_initialized == "1") {
      return false;
    } else {
      return true;
    }

  },

  setInitialized: function () {
    // initialized == first run

    return db.push("/config/initialized", 1);
    return true;

  },



  generateNodeID: function () {
     // Generate unicate NodeID

     var NodeID = crypto.randomBytes(40).toString('hex');
       //console.log(NodeID);
     return NodeID;
  }

};

module.exports.ifConfigFileExist();
