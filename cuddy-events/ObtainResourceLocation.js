/*
    Module for obtaining location of resources by contractID and locatinng contracts
    CuddyCore v. 0.0.0
*/

var Structures = require('../resources/Structures.js');
var Tools = require('../tools/tools.js');
var ContractsLedgerProcessor = require('./ContractsLedgerProcessor.js');


var Node = Structures.Node;
var Contract = Structures.Contract;

/// Init JSON database ////

var JsonDB = require('node-json-db');

var db = new JsonDB("/home/lakewik/.cuddy/ledgers/cuddy-nodes-ledger", true, true);

///////


module.exports = {

  getContractNodeId: function (contractID, obtainMethod, excludes) {
  /* obtainMethod - randomNodeSelect ['random'] or selectBestNode ['bestnode']
   *
   */

   if (obtainMethod == "random") {

     contract_nodes = ContractsLedgerProcessor.getContractNodes(contractID);

     var contract_nodes_array = {contract_nodes}
     var node_Ids_array = [];


     for(var nodeID in contract_nodes){
       node_Ids_array.push(nodeID);
     }

     /// exclude
     i = 0;
     for (var item in excludes) {
        i++;
        try {
          var index = node_Ids_array.indexOf(excludes[item]);
          if (index > -1) {
            node_Ids_array.splice(index, 1);
          }
        } catch (err) {

        }
     }

     contract_nodes_count = ContractsLedgerProcessor.countNodesInContract(contractID);
     randomed_number = Tools.randomInt(0, contract_nodes_count-i);

     node_id = node_Ids_array[randomed_number];

   }

    return node_id.toString();

  },



  };
