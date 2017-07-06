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

addNewNodeToContract: function (contract_id, nodeID) {

  nodes_count = (module.exports.countNodesInContract(contract_id)+1).toString();

  db.push("/contracts/" + contract_id.toString() + "/nodes/" + nodes_count, nodeID);
  db.save();
  return true;

},


removeJunkContracts: function () {


},

checkForExpirations: function () {


},

pushContract: function (contract_id, contract) {

    db.push("/contracts/" + contract_id.toString(), contract);
    db.save();
    return true;

},


getContract: function (contract_id) {

    contract = db.getData("/contracts/" + contract_id.toString());

    return contract;

},


downloadContractsLedger: function  (nodes_number) {


},

getContractNodesIds: function  (contract_id) {

  contract_nodes_ids = db.getData("/contracts/" + contract_id.toString() + "/nodes");

  return contract_nodes_ids;


},

countNodesInContract: function  (contract_id) {

  return Object.keys(module.exports.getContractNodesIds(contract_id)).length;

},

/*
    Returns nodeID string for provided node index
*/
getContractNodeIDByIndex: function  (contract_id, node_index) {

  contract_node_id = db.getData("/contracts/" + contract_id.toString() + "/nodes/" + node_index.toString());
  return contract_node_id.toString();

},

/*
    Returns JSON containing full ledger of contracts
*/
getContractsLedgerContent: function () {

  return db.getData("/contracts");

},


getContractNodeByIndex: function (contract_id, node_index) {

  return db.getData("/contracts");

},

getContractNodeByID: function (contract_id, nodeID) {

  return db.getData("/contracts");

}


};
