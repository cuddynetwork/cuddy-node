/*
    Module for processing Cuddy contracts
    CuddyCore v. 0.0.0
*/

var Structures = require('../resources/Structures.js');


var Node = Structures.Node;
var Contract = Structures.Contract;

/// Init JSON database ////

var JsonDB = require('node-json-db');

var db = new JsonDB("cuddy-contracts-ledger", true, true);

//db.save();

module.exports = {

removeJunkContracts: function () {


},

checkForExpirations: function () {


},

pushContract: function (id, contract) {

    db.push("/contracts/" + id.toString(),contract);
    db.save();
    return true;

},

downloadContractsLedger: function  (nodes_number) {


},


getContractsLedgerContent: function () {

  return db.getData("/contracts");

}


};
