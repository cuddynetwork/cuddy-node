/*
    Module for local node management
    CuddyCore v. 0.0.0
*/


var fs = require('fs');
var osenv = require('osenv');
var Structures = require('../resources/Structures.js');
var Constants = require('../resources/Constants.js');

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

  getLocalNodeDetails: function () {

    return db.getData("/config/node");

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
        ledgers_path: "",
        containers_path: "",

        contract_negotiation: {
          max_file_size: 0,
          max_complexity: 0,
            excution: {
              enabled: 0,
              php: 0,
              ruby: 0
            }
        },

        max_used_space: 0


      }
    }

    return db.push("/", localNodeConfigStructure);

  },

  isFirstRun: function (local_node) {

    is_initialized = db.getData("/config/initialized").toString();

    if (is_initialized == "1") {
      return false;
    } else {
      return true;
    }

  }

};

module.exports.ifConfigFileExist();
