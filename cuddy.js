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


/* Constants */

const DEFAULT_PORT_PUBLIC = Constants.DEFAULT_PORT_PUBLIC;
const DEFAULT_PORT_COMUNICATION = Constants.DEFAULT_PORT_COMUNICATION;

function searchMoreNodes(nodes_count) {
    // Search and return Cuddy nodes
}

function generateNodeID() {
   // Generate unicate NodeID

   var NodeID = crypto.randomBytes(40).toString('hex');
     console.log(NodeID);
   return NodeID;
}

/* Initialization */

var dt = dateTime.create();
dt.format('m/d/Y H:M:S');

var kBucket = new KBucket({
    localNodeId: new Buffer("ffcdd3449fe7c039ae93aac4831768ace43c6ffa243103d1b871f90add264b9121876e9576309183") // default: random data
})

var CollectTokensBucket = [];

firstrun = true; //TMP

if (firstrun) {

  console.log(colors.green("Performing initial node initialization...."));

  generateNodeID(function(id) {
      console.log(id);
  });


}

localNodeID = "fdcdd3449fe7c039ae93aac4831768ace43c6ffa243103d1b871f90add264b9121876e9576309183";
localNodeIP = "79.231.22.170";
localNodePort = "6689";

//var Node = Structures.Node;
var Contract = Structures.Contract;

console.log(new Date(dt.now()) + " " + colors.green('Cuddy node started!'));

/* Broadcast node to the Cuddy network */

var client = new WebSocketClient();

connections_array = [];

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connections_array.push(connection);
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }
    });







});

//module.exports.annouceNode();

function annouceNode () {

  if (connections_array[0].connected) {
        var nodesArray = [];

        var node =  {
            address: localNodeIP,
            port: localNodePort,
            nodeID: localNodeID
        }

        nodesArray.push(node);

        var NodeAnnouceRequest = {
          method: "NODE_ANNOUCE",
          nodes: nodesArray
        }

        connections_array[0].sendUTF(JSON.stringify(NodeAnnouceRequest));
      }
        setTimeout(annouceNode, 5000);

}


function getOtherNodes() {
    if (connections_array[0].connected) {

      var FindNodeRequest = {
        method: "FIND_NODE"
      }
        connections_array[0].sendUTF(JSON.stringify(FindNodeRequest));
        setTimeout(getOtherNodes, 5000);
    }
}



//client.connect('ws://cuddy.network:6689//', 'cuddy-protocol');
  //setTimeout(getOtherNodes, 5000);
    //setTimeout(annouceNode, 5000);
//annouceNode();
//getOtherNodes();
//client.emit("sdsd");

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
  httpServer: server,
  autoAcceptConnections: true
});


function arrayBufferToString(buffer){
    var byteArray = new Uint8Array(buffer);
    var str = "", cc = 0, numBytes = 0;
    for(var i=0, len = byteArray.length; i<len; ++i){
        var v = byteArray[i];
        if(numBytes > 0){
            //2 bit determining that this is a tailing byte + 6 bit of payload
            if((cc&192) === 192){
                //processing tailing-bytes
                cc = (cc << 6) | (v & 63);
            }else{
                throw new Error("this is no tailing-byte");
            }
        }else if(v < 128){
            //single-byte
            numBytes = 1;
            cc = v;
        }else if(v < 192){
            //these are tailing-bytes
            throw new Error("invalid byte, this is a tailing-byte")
        }else if(v < 224){
            //3 bits of header + 5bits of payload
            numBytes = 2;
            cc = v & 31;
        }else if(v < 240){
            //4 bits of header + 4bit of payload
            numBytes = 3;
            cc = v & 15;
        }else{
            //UTF-8 theoretically supports up to 8 bytes containing up to 42bit of payload
            //but JS can only handle 16bit.
            throw new Error("invalid encoding, value out of range")
        }

        if(--numBytes === 0){
            str += String.fromCharCode(cc);
        }
    }
    if(numBytes){
        throw new Error("the bytes don't sum up");
    }
    return str;
}

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
            console.log(new Date(dt.now()) + " " + 'Received COLLECT request from remote client');

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
              var contact = {
                  id: new Buffer(json.nodes[i].nodeID),
                  host: json.nodes[i].address,
                  port: json.nodes[i].port
              };

              if (kBucket.get(new Buffer(json.nodes[i].nodeID)) == null) {
              // add contact to bucket
                console.log(new Date(dt.now()) + " " + colors.yellow('Contact ' +  JSON.stringify(json.nodes[i]) + ' not in bucket, adding'));


              kBucket.add(contact)

            } else {
                console.log(new Date(dt.now()) + " " + 'Contact ' + JSON.stringify(json.nodes[i]) + ' already exist in bucket');
            }

            i++;
          }


       } else if (json.method == "FIND_NODE") {
            /// send to other node nodes which you know
            console.log(new Date(dt.now()) + " " + 'Received FIND_NODE request from remote client');


            var kbucketNodesArray = kBucket.toArray()
            var bucketNodesArray = []

            i = 0;
            for(var attribute in kbucketNodesArray){
              bufferNodeID = kbucketNodesArray[i].id;
              nodeID = arrayBufferToString(bufferNodeID);
              port = kbucketNodesArray[i].port;
              address = kbucketNodesArray[i].host;

              var node = {
                nodeID: nodeID,
                port: port,
                address: address
              }

              bucketNodesArray.push(node);
              i++;
            }

            var NodeAnnouceResponse = {
              method: "NODE_ANNOUCE",
              nodes: bucketNodesArray
            }

            console.log(new Date(dt.now()) + " " + 'Sending NODE_ANNOUCE to remote node');
            WebSocketClientManager.sendMessage (connection.remoteAddress + ":6689", JSON.stringify(NodeAnnouceResponse));
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
                  ContractsLedgerProcessor.pushContract(json.contract.tx, json.contract);

                  connection.sendUTF('{"result":"SAVED"}');

          }  else if (json.method == "PUBLISH_CONTRACT_NODE") {

                  console.log(new Date(dt.now()) + " " + 'Received PUBLISH_CONTRACT message from remote client, inserting contract '+JSON.stringify(json.contract) + ' to ledger');

                  /// publish node that contains contract content
                  ContractsLedgerProcessor.addNewNodeToContract(json.contract.tx, json.contract);

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
