var url = require('url');
var fs = require('fs');
var path = require('path');
var platform = require('os').platform();
var Constants = require('./Constants.js');

const CONFIG_SAVE_LOCATION = Constants.CONFIG_SAVE_LOCATION;
const LEDGERS_DEFAULT_SAVE_LOCATION = Constants.LEDGERS_DEFAULT_SAVE_LOCATION;
const CONTAINERS_DEFAULT_SAVE_LOCATION = Constants.CONTAINERS_DEFAULT_SAVE_LOCATION;


var HOME = platform !== 'win32' ? process.env.HOME : process.env.USERPROFILE;

module.exports = function(program) {
  return {
    properties: {
      address: {
        description: 'Enter your public hostname or IP address',
        required: true,
        default: program.ip_address,
      },
      competitive_storage: {
        description: 'Enter the competitive factor for content storage',
        required: false,
        type: 'number',
        default: 1
      },
      competitive_excution: {
        description: 'Enter the competitive factor for web scripts excution',
        required: false,
        type: 'number',
        default: 1
      },
      competitive_transfer: {
        description: 'Enter the competitive factor for data transfer',
        required: false,
        type: 'number',
        default: 1
      },
      forward: {
        description: 'Use NAT traversal strategies to become available on the network (UPnP)',
        required: true,
        type: 'boolean',
        default: true,
      },
      seed: {
        description: 'Enter the URI of a known seed',
        required: false,
        default: '',
        message: 'Invalid seed URI supplied',
        conform: function(value) {
          if (!value) {
            return true;
          }

          var parsed = url.parse(value);
          var proto = parsed.protocol === 'cuddy:';
          var nodeid = parsed.path.substr(1).length === 40;
          var address = parsed.hostname && parsed.port;

          return proto && nodeid && address;
        }
      },
      ledgerdir: {
        description: 'Enter the path to store ledgers',
        required: true,
        default: LEDGERS_DEFAULT_SAVE_LOCATION,
        message: 'Directory already exists, refusing to overwrite',
        conform: function(value) {
        //  if (utils.fileDoesExist(value)) {
        //    return false;
        //  }
          fs.mkdirSync(value);
          return true;
        }
      },
      containersdir: {
        description: 'Enter the path to store containers (websites and web CDN data stored on your node)',
        required: true,
        default: CONTAINERS_DEFAULT_SAVE_LOCATION,
        message: 'Directory already exists, refusing to overwrite',
        conform: function(value) {
        //  if (utils.fileDoesExist(value)) {
      //      return false;
      //    }
          fs.mkdirSync(value);
          return true;
        }
      },
      loglevel: {
        description: 'Enter the verbosity level for the logs (0-4)',
        required: true,
        default: 3,
        type: 'number',
        message: 'Invalid level supplied, must be 0 - 4',
        conform: function(value) {
          return value <= 4 && value >= 0;
        }
      },
      space: {
        description: 'Enter the amount of storage space you can share',
        required: true,
        default: '2GB',
        message: 'Invalid format supplied, try 50MB, 2GB, or 1TB',
        conform: function(value) {
          var size = parseFloat(value);
          var unit = value.split(size)[1];

          return size && (['MB','GB','TB'].indexOf(unit) !== -1);
        }
      },

      payto: {
        description: 'Enter a CUD (CuddyCoin) payment address to receive rewards',
        required: true,
        conform: function(address) {
          return 4
        }
      },
      container_encryption: {
        description: 'Enable containers encryption (websites stored on your node will be encrypted)',
        required: true,
        default: false,
        type: 'boolean'
      },

      password: {
        description: 'Enter a password to protect your private key',
        hidden: true,
        replace: '*',
        required: true,
        default: "dsaf"
      },

      containsers_password: {
        description: 'Enter a password to encrypt containers',
        hidden: true,
        replace: '*',
        required: true,
        default: "dsaf"
      }
    }
  };
};
