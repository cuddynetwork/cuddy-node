/*
    Module for generating and managing Collect token for incoming data
    CuddyCore v. 0.0.0
*/


var Structures = require('../resources/Structures.js');
var Constants = require('../resources/Constants.js');

const LEDGERS_DEFAULT_SAVE_LOCATION = Constants.LEDGERS_DEFAULT_SAVE_LOCATION;


/// Init JSON database ////

var JsonDB = require('node-json-db');

var db = new JsonDB(LEDGERS_DEFAULT_SAVE_LOCATION + "/.cuddy/ledgers/cuddy-local-collect-tokens-ledger", true, true);



module.exports = {

  isTokenExist: function(collect_token_id) {

    try {
      db.getData("/collect_tokens/" + collect_token_id.toString()).toString();
      return true;
    } catch (err) {
      return false;
    }

  },

  generateCollectToken: function() {

    var collectToken = crypto.randomBytes(64).toString('hex');
    return collectToken;

  },

  putCollectTokenAndDetails: function(collect_token, token_details) {

      db.push("/collect_tokens/" + collect_token.toString(), token_details);
      return true;

  },

  getCollectTokenDetails: function(collect_token_id) {

    var collectTokenDetails = db.getData("/collect_tokens/" + collect_token_id.toString()).toString();
    return collectTokenDetails;

  },

  getCollectTokenContract: function(collect_token_id) {

    var collectTokenContract = db.getData("/collect_tokens/" + collect_token_id.toString() + "/for_contract").toString();
    return collectTokencontract;

  }

};
