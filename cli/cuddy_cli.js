var WebSocketClientManager = require('../cuddy-events/WebSocketClientManager.js');
var NodesLedgerProcessor = require('../cuddy-events/NodesLedgerProcessor.js');


my_nodes_ledger_array = [];

local_nods_ledger = NodesLedgerProcessor.getNodes();
for (var nodeID in local_nods_ledger) {
  my_nodes_ledger_array.push(nodeID);
}

var Sync = {
  method: "SYNC_NODES_LEDGER",
  nodes_ledger: my_nodes_ledger_array


}

WebSocketClientManager.sendMessage ("localhost:6689", JSON.stringify(Sync));
