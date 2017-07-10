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

function searchMoreNodes(nodes_count) {
    // Search and return Cuddy nodes
}



/* Initialization */

var dt = dateTime.create();
dt.format('m/d/Y H:M:S');

var kBucket = new KBucket({
    localNodeId: new Buffer("ffcdd3449fe7c039ae93aac4831768ace43c6ffa243103d1b871f90add264b9121876e9576309183") // default: random data
})

var CollectTokensBucket = [];

firstrun = LocalNode.isFirstRun();

if (firstrun) {

  console.log(colors.green("Performing initial node initialization...."));

  var localNodeID = LocalNode.generateNodeID();
  var localNodeIP = "89.231.22.170";
  var localNodePort = "6689";

  console.log(colors.green("Your Node ID is: " + localNodeID.toString()));

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
  var localNodeAddress = LocalNodeDetails.address;
  var localNodePort = LocalNodeDetails.port;

}

//var Node = Structures.Node;
var Contract = Structures.Contract;

console.log(new Date(dt.now()) + " " + colors.green('Cuddy node started!'));

/* Broadcast node to the Cuddy network */


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
              }  else {
                  console.log(new Date(dt.now()) + " " + 'Contact ' + JSON.stringify(json.nodes[i]) + ' already exist in ledger');
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
            console.log(new Date(dt.now()) + " " + 'Received unrecognized message from remote client');
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
