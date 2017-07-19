/*
    Module for broadcasting messages to Cuddy nodes
    CuddyCore v. 0.0.0
*/

var NodesLedgerProcessor = require('./NodesLedgerProcessor.js');

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

    i = 0;
    while (i < recipientNodesCount) {

      recipient_node = NodesLedgerProcessor.getRandomNodeDetails();
      result = WebSocketClientManager.sendMessage (recipient_node.ip + ":" + recipient_node.port, JSON.stringify(ContractNode));

      i++;
    }

    return db.getData("/nodes/" + nodeID.toString());

  },

  broadcastContract: function (contract, recipientNodesCount) {

        var Contract = {
          method: "PUBLISH_CONTRACT",
          contract: contract
        }

    return db.getData("/nodes/" + nodeID.toString());

  },

};
