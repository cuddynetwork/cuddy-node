/*
    Module for broadcasting messages to Cuddy nodes
    CuddyCore v. 0.0.0
*/

var NodesLedgerProcessor = require('./NodesLedgerProcessor.js');
var WebSocketClientManager = require('./WebSocketClientManager.js');


module.exports = {

  broadcastContractNode: function (contractID, nodeID, recipientNodesCount) {

      var ContractNode = {
        method: "PUBLISH_CONTRACT_NODE",
        node: {
          id: nodeID
        },
        store_begin: 0,
        contract: contractID

      }

        total_nodes_in_ledger = NodesLedgerProcessor.countNodesInLedger();

      /*
      * It will broadcast to all nodes if not enough nodes in your ledger
      */

      if (recipientNodesCount > total_nodes_in_ledger) {
        recipientNodesCount = total_nodes_in_ledger;

        recipientNodes = NodesLedgerProcessor.getNodes();

          for (var recipient_node in recipientNodes) {
            console.log("Broadcasting PUBLISH_CONTRACT_NODE to remote node " + recipientNodes[recipient_node].ip + ":" + recipientNodes[recipient_node].port + "...");
            result = WebSocketClientManager.sendMessage (recipientNodes[recipient_node].ip + ":" + recipientNodes[recipient_node].port, JSON.stringify(ContractNode));
          }

      } else {

      i = 0;
      while (i < recipientNodesCount) {
        recipient_node = NodesLedgerProcessor.getRandomNodeDetails();
        console.log("Broadcasting PUBLISH_CONTRACT_NODE to remote node " + recipient_node.ip + ":" + recipient_node.port + "...");
        result = WebSocketClientManager.sendMessage (recipient_node.ip + ":" + recipient_node.port, JSON.stringify(ContractNode));

        i++;
      }

    }

      return true

  },

  broadcastContract: function (contract, recipientNodesCount) {

        var Contract = {
          method: "PUBLISH_CONTRACT",
          contract: contract
        }

        i = 0;

        total_nodes_in_ledger = NodesLedgerProcessor.countNodesInLedger();

        /*
        * It will broadcast to all nodes if not enough nodes in your ledger
        */

        if (recipientNodesCount > total_nodes_in_ledger) {
          recipientNodesCount = total_nodes_in_ledger;

          recipientNodes = NodesLedgerProcessor.getNodes();

            for (var recipient_node in recipientNodes) {
              console.log("Broadcasting PUBLISH_CONTRACT to remote node " + recipientNodes[recipient_node].ip + ":" + recipientNodes[recipient_node].port + "...");
              result = WebSocketClientManager.sendMessage (recipientNodes[recipient_node].ip + ":" + recipientNodes[recipient_node].port, JSON.stringify(Contract));
            }


        } else {

        while (i < recipientNodesCount) {

          recipient_node = NodesLedgerProcessor.getRandomNodeDetails();
          console.log("Broadcasting PUBLISH_CONTRACT to remote node " + recipient_node.ip + ":" + recipient_node.port + "...");
          result = WebSocketClientManager.sendMessage (recipient_node.ip + ":" + recipient_node.port, JSON.stringify(Contract));

          i++;
        }

      }

    return true

  },

  broadcastContractToNode: function (contract, nodeDetails) {

          var Contract = {
            method: "PUBLISH_CONTRACT",
            contract: contract
          }

          /*
          * It will broadcast contract to specified node
          */

            recipient_node = nodeDetails;
            console.log("Broadcasting PUBLISH_CONTRACT to remote node " + recipient_node.ip + ":" + recipient_node.port + "...");
            result = WebSocketClientManager.sendMessage (recipient_node.ip + ":" + recipient_node.port, JSON.stringify(Contract));

      return true

    },

};

//module.exports.broadcastContractNode("dsadattas5d76anda78nydasayugdsad877878d709jsa8d097a", "dssfddgdfgdgg", 20);
