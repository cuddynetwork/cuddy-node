/*
    Cuddy alfa version
    0.0.0
*/

var WebSocketServer = require('websocket').server;
var http = require('http');
var Hashes = require('jshashes');
var crypto = require('crypto');
var KBucket = require('k-bucket');
var colors = require('colors/safe');
var dateTime = require('node-datetime');
var WebSocketClient = require('websocket').client;
const getIP = require('external-ip')();

var ContractsLedgerProcessor = require('./cuddy-events/ContractsLedgerProcessor.js');
var WebSocketClientManager = require('./cuddy-events/WebSocketClientManager.js');
var Structures = require('./resources/Structures.js');
var Constants = require('./resources/Constants.js');
var LocalNode = require('./cuddy-events/MyNode.js');
var NodesLedgerProcessor = require('./cuddy-events/NodesLedgerProcessor.js');


/* Constants */

const DEFAULT_PORT_PUBLIC = Constants.DEFAULT_PORT_PUBLIC;
const DEFAULT_PORT_COMUNICATION = Constants.DEFAULT_PORT_COMUNICATION;
const DEFAULT_TOKEN_EXPIRATION_PERIOD = Constants.DEFAULT_TOKEN_EXPIRATION_PERIOD;
const INITIAL_NODE_ANNOUNCEMENT_MESSAGE_RECIPIENTS_COUNT = Constants.INITIAL_NODE_ANNOUNCEMENT_MESSAGE_RECIPIENTS_COUNT;


function searchMoreNodes(nodes_count) {
    // Search and return Cuddy nodes
}



/* Initialization */

var dt = dateTime.create();
dt.format('m/d/Y H:M:S');

var CollectTokensBucket = [];

firstrun = LocalNode.isFirstRun();

console.log(colors.green(new Date(dt.now()) + " NETWORK :: Trying to obtain your external IP address...."));


getIP((err, ip) => {
   if (err) {
       throw err;
   }
   console.log(ip);
   var localNodeIP = ip;
});

if (firstrun) {

  console.log(new Date(dt.now()) + colors.green(" NODE :: Performing initial node initialization...."));

  var localNodeID = LocalNode.generateNodeID();

  var localNodePort = DEFAULT_PORT_COMUNICATION;

  console.log(new Date(dt.now()) + colors.green(" Your Node ID is: " + localNodeID.toString()));

  var LocalNodeDetails = {
    id: localNodeID,
    address:  localNodeIP,
    port: localNodePort
  }

  LocalNode.saveLocalNodeDetails(LocalNodeDetails);
  LocalNode.setInitialized();


} else {

  var LocalNodeDetails = LocalNode.getLocalNodeDetails();
  var localNodeID = LocalNodeDetails.id;
  if (localNodeIP !=  LocalNodeDetails.address) {
    LocalNode.saveLocalNodeIP(localNodeIP);
  } else {
    var localNodeIP = LocalNodeDetails.address;
  }
  var localNodePort = LocalNodeDetails.port;

}

//var Node = Structures.Node;
var Contract = Structures.Contract;

console.log(new Date(dt.now()) + " " + colors.green('Cuddy node started!'));

/* Load ROOT-NODES */
root_nodes = LocalNode.getRootNodes();

/* Insert ROOT-NODES to nodes ledger */
for (var attr in root_nodes) {
    NodesLedgerProcessor.insertNode(attr, root_nodes[attr]);
}


/* Synchronize your global ledgers with root nodes */

/* Broadcast this node to the Cuddy network */

recipientNodesCount = INITIAL_NODE_ANNOUNCEMENT_MESSAGE_RECIPIENTS_COUNT;
nodes_in_ledger_count = NodesLedgerProcessor.countNodesInLedger();
if (nodes_in_ledger_count < recipientNodesCount) {
  recipientNodesCount = nodes_in_ledger_count;
}

i = 0;
while (i < recipientNodesCount) {
  random_node_details = NodesLedgerProcessor.getRandomNodeDetails()

  var local_node = {
    nodeID: localNodeID,
    port: localNodePort,
    address: localNodeIP
  }

  var NodeAnnouceMessage = {
    method: "NODE_ANNOUCE",
    nodes: local_node
  }

  console.log(new Date(dt.now()) + " " + colors.green('Broadcasting your node to network... Iteration ' + (i+1).toString()));

  WebSocketClientManager.sendMessage (random_node_details.ip + ":" + random_node_details.port, JSON.stringify(NodeAnnouceMessage));
  i++;
}


/* Create WebSocket Listening Server */

var server = http.createServer(function(request, response) {
  // process HTTP request.
  // Also this is used to initial serving websockets

  //console.log(request);

  if (request.url == "/cuddy_contracts_ledger") {

      console.log(new Date(dt.now()) + " " + 'Received contracts ledger upload HTTP request from remote client');

      response.writeHead(200, {"Content-Type": "text/json"});

      current_contract_ledger_content = ContractsLedgerProcessor.getContractsLedgerContent();

      response.write( JSON.stringify(current_contract_ledger_content));
      response.end();
  } else {

    console.log(new Date(dt.now()) + " " + colors.yellow('Received unrecognized HTTP request from remote client'));
    response.writeHead(200, {"Content-Type": "text/json"});
    response.write('{"error":"UNRECOGNIZED_REQUEST"}');
    response.end();

  }


});
server.listen(DEFAULT_PORT_COMUNICATION, function() { });


// create the server
wsServer = new WebSocketServer({
  httpServer: server
});


/* Events listening */

// WebSocket server

wsServer.on('request', function(request) {

  var connection = request.accept('cuddy-protocol', request.origin);

  console.log(new Date(dt.now()) + " " + colors.green('Remote node with address ' + connection.remoteAddress + ' connected!'));

  //client.connect('ws://' + connection.remoteAddress.replace("::ffff:", "") + ':6689//', 'cuddy-protocol');

  //console.log(connection);


  connection.on('connect', function(connection) {
    // close user connection
    console.log();

  });

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    if (message.type === 'utf8') {
      //process WebSocket message
      //try to parse JSON
      try {
        var json = JSON.parse(message.utf8Data);
        //console.log(json.name);

      } catch (e) {
        console.log(new Date(dt.now()) + " " + colors.red('Received invalid JSON message from remote node'));
     return;
      }


        if (json.method == "COLLECT") {
            /// handle Collect request
            var collectTokenDetails = {
                totalIncomingDataSize: json.parametrs.data_size,
                expiration_time: DEFAULT_TOKEN_EXPIRATION_PERIOD + new Date(),
                applicant_hash: json.parametrs.applicant_hash,
                for_contract: json.parametrs.contract_id
            }

            collectTokenId = CollectTokenManager.generateCollectToken();

            CollectTokenManager.putCollectTokenAndDetails(collectTokenId, collectTokenDetails);

            console.log(new Date(dt.now()) + " " + 'Received COLLECT request from remote client');

            connection.sendUTF('{"collect_token":"' + collectTokenId + '"}');

        } else if (json.method == "NEGOTIATE") {
            /// handle Contract Negotiation request
            console.log(new Date(dt.now()) + " " + 'Received NEGOTIATE request from remote client');

        } else if (json.method == "NODE_ANNOUCE") {
            /// handle other node annoucement request
            console.log(new Date(dt.now()) + " " + 'Received NODE_ANNOUCE message from remote client');

            i = 0;
            for(var attribute in json.nodes){

              //console.log(JSON.stringify(json.nodes[0]));

              nodeid = json.nodes[i].nodeID;
              var node_details = {
                  ip: json.nodes[i].address,
                  port: json.nodes[i].port
              };

              if (NodesLedgerProcessor.isNodeInLedger(nodeid)) {
                  NodesLedgerProcessor.insertNode(nodeid, node_details);
                  console.log(new Date(dt.now()) + " " + 'Adding node ' + JSON.stringify(json.nodes[i]) + ' to ledger');
              }  else {
                  console.log(new Date(dt.now()) + " " + 'Node ' + JSON.stringify(json.nodes[i]) + ' already exist in ledger');
              }

            i++;
          }


       } else if (json.method == "FIND_NODE") {
            /// send to other node nodes which you know
            console.log(new Date(dt.now()) + " " + 'Received FIND_NODE request from remote client');

            asked_nodeID = json.parametrs.nodeID.toString();
            asked_node_details = NodesLedgerProcessor.getNodeDetailsByID(asked_nodeID);

            var node = {
              nodeID: asked_nodeID,
              port: asked_node_details.port,
              address: asked_node_details.address
            }

            var NodeAnnouceResponse = {
              method: "NODE_ANNOUCE",
              nodes: node
            }

            console.log(new Date(dt.now()) + " " + 'Sending NODE_ANNOUCE to remote node' + connection.remoteAddress);
            WebSocketClientManager.sendMessage (connection.remoteAddress.replace("::ffff:", "") + ":6689", JSON.stringify(NodeAnnouceResponse));
            //connection.sendUTF();

        }  else if (json.method == "PING") {
            /// handle Ping with Pong responde send
            console.log(new Date(dt.now()) + " " + 'Received PING message from remote client, so sending PONG :D');

            var PongResponse = {
              method: "PONG",
              node: {
                  nodeID: localNodeID,
                  address: localNodeIP,
                  port: localNodePort
                }
            }

              /// create new client connection

              connection.sendUTF(JSON.stringify(PongResponse));
        }
         else if (json.method == "PONG") {
            /// handle Pong with to que get (PongQueue)
            connection.sendUTF('{  }');

          }  else if (json.method == "SYNC_NODES_LEDGER") {
              my_nodes_ledger_array = []
              remote_nodes_ledger = json.nodes_ledger;
              local_nods_ledger = NodesLedgerProcessor.getNodes();
              for (var nodeID in local_nods_ledger) {
                my_nodes_ledger_array.push(nodeID);
              }

              console.log(my_nodes_ledger_array);
              console.log(remote_nodes_ledger);

              nodes_ids_to_annouce = my_nodes_ledger_array.filter(function(x) { return remote_nodes_ledger.indexOf(x) < 0 })

              nodes_to_annouce_array = [];

              for (var index in nodes_ids_to_annouce) {

                node_details = NodesLedgerProcessor.getNodeDetailsByID(nodes_ids_to_annouce[index]);

                var node = {
                  nodeID: nodes_ids_to_annouce[index],
                  port: node_details.port,
                  address: node_details.address
                }

              nodes_to_annouce_array.push(node);
            }

              console.log(nodes_ids_to_annouce);


              var NodeAnnouceResponse = {
                method: "NODE_ANNOUCE",
                nodes: nodes_to_annouce_array
              }

              console.log(new Date(dt.now()) + " " + 'Sending NODE_ANNOUCE to remote node' + connection.remoteAddress);
              WebSocketClientManager.sendMessage (connection.remoteAddress.replace("::ffff:", "") + ":6689", JSON.stringify(NodeAnnouceResponse));


              /// handle Pong with to que get (PongQueue)
              connection.sendUTF('{  }');

            } else if (json.method == "PUBLISH_CONTRACT") {

                  console.log(new Date(dt.now()) + " " + 'Received PUBLISH_CONTRACT message from remote client, inserting contract '+JSON.stringify(json.contract) + ' to ledger');

                  /// publish negotiated contract to the network
                  ContractsLedgerProcessor.pushContract(JSON.stringify(json.contract.tx), JSON.stringify(json.contract));

                  connection.sendUTF('{"result":"SAVED"}');

          }  else if (json.method == "PUBLISH_CONTRACT_NODE") {

                  console.log(new Date(dt.now()) + " " + 'Received PUBLISH_CONTRACT_NODE message from remote client, inserting node ' + JSON.stringify(json.node.id) + ' contract '+JSON.stringify(json.contract) + ' to ledger');

                  /// publish node that contains contract content
                  ContractsLedgerProcessor.addNewNodeToContract(JSON.stringify(json.contract_id), JSON.stringify(json.node.id));

                  connection.sendUTF('{"result":"SAVED"}');

          } else {
            console.log(new Date(dt.now()) + " " + 'Received unrecognized message from remote client' + JSON.stringify(json));
          }
    }
  });

  connection.on('close', function(connection) {
    // close user connection

  });  console.log(new Date(dt.now()) + " " + colors.blue('Remote node with address ' + connection.remoteAddress + ' disconnected!'));

});


// Connections Init

//$.getScript('cuddy_events/Connections.js', function(){
//    MakeFirstConnections();//
//});
