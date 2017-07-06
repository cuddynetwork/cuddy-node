/*
    Module for processing content mirroring
    CuddyCore v. 0.0.0
*/

var http = require('http');
var fs = require('fs');
var ContractsLedgerProcessor = require('./ContractsLedgerProcessor.js');
var NodesLedgerProcessor = require('./NodesLedgerProcessor.js');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function mirrorResource(contract_id) {

  contract_nodes = ContractsLedgerProcessor.getContractNodes(contract_id);

  var contract_nodes_array = {contract_nodes}
  var node_Ids_array = [];


  for(var nodeID in contract_nodes){
    node_Ids_array.push(nodeID);
  }

  contract_nodes_count = ContractsLedgerProcessor.countNodesInContract(contract_id);
  randomed_number = randomInt(0, contract_nodes_count);

  randomed_node_id = node_Ids_array[randomed_number];

  //console.log(randomed_node_id);

  node_details = NodesLedgerProcessor.getNodeDetailsByID(randomed_node_id);

  //console.log(node_details);

  var file = fs.createWriteStream(contract_id);
  var request = http.get("http://" + node_details.ip + ":" + node_details.port + "/contract_id/download", function(response) {
    response.pipe(file);
  });

  /// add your node to contract ledger

  //ContractsLedgerProcessor.addNewNodeToContract(contract_id, "63h6c38ch63c983ch698w");



}

mirrorResource("dsadattas5d76anda78nydasayugdsad877878d709jsa8d097a");

ContractsLedgerProcessor.addNewNodeToContract("dsadattas5d76anda78nydasayugdsad877878d709jsa8d097a", "piesek");
console.log(ContractsLedgerProcessor.countNodesInContract("dsadattas5d76anda78nydasayugdsad877878d709jsa8d097a"));
