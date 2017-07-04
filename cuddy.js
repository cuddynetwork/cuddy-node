/*
    Cuddy alfa version
    0.0.0
*/

var WebSocketServer = require('websocket').server;
var http = require('http');
var Hashes = require('jshashes')
var crypto = require('crypto');

/* Constants */

const DEFAULT_PORT_PUBLIC = 80;
const DEFAULT_PORT_COMUNICATION = 6689;

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

var PongQueue = [];

firstrun = true; //TMP

if (firstrun) {

  console.log("Performing initial node initialization....");

  generateNodeID(function(id) {
      console.log(id);
  });


}

console.log('Cuddy node started!');

/* Broadcast node to the Cuddy network */


var NodePool = []

/* Ledgers */

// For ledger of contracts
var Contract = {
    tx : "default",
    type: "static", // static or script
    submited: 0, //timestamp of submmision
    expireDate: 0, //timestamp of expiration
    fee: {
        storage: 0,
        execution: 0,
        transfer: 0
    },
    requestAll: 0, // how much requests has been made
    usedTransfer: 0, // each node will update that after work with consensus
    proccessUsage: 0, // some unit to control proccess power usage
    lastStoragePayPeriode: 0, // timestamp of last pay time for storage
    nodes: {
        //must be a vector of nodes
    },
    complexity: 0, //calculated by node which recived contract,
    size: 0, //can be check by node to verify if not forgery
    reqLastMinute: 0, //amount of resource request (will be used to ajust amount of nodes to store file)

    dataChecksum: "default", // calculated from data
    userChecksum: "default" // calculated from dataChecksum and private key, can by verify by public key and dataCheckSum
};

// For ledger of reputation
var Node = {
    nodeId: "default", // unique hash
    ip: "255.255.255",
    port: 6689, // port to comunicate
    startTime: 0, // Timestamp of node first notice in the network
    lastActive: 0, //Last activity of node in the network
    checkPositive: 0, //Possitive check by another node
    checkNoResponse: 0, //Without response / timeout
    checkNegative: 0, // With incorect checksum
    capacityAvaiable: 0, // In bytes
    capacityUsed: 0, // Used capacity, not know if needed, we can calculate it from ladgerOfContracts

};

// My connections, to stop spaming each other with a lot of information, use maximum 5 nodes to push and get information, one communicate will be recived only 5 times in worstes scenario

// max length of vector about 5 nodes
var Connection = {
    NodeId: "default",
    ip: "255.255.255" // more can get from NodeLadger, no need for save twice
}

var CloneRequest = {
    contractID: "default"

}


//curent_node.ip = "345";



/* Create WebSocket Listening Server */

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
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

  console.log('Remote node with address ' + connection.remoteAddress + ' connected!');

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
        console.log('Received invalid JSON message from remote node');
     return;
      }
        //console.log('Received ' + message.utf8Data);

          //console.log(json.node.address);

        if (json.method == "COLLECT") {
            /// handle Collect request
            console.log('Received COLLECT request from remote client');

        } else if (json.method == "NEGOTIATE") {
            /// handle Contract Negotiation request
            console.log('Received NEGOTIATE request from remote client');

        } else if (json.method == "NODE_ANNOUCE") {
            /// handle other node annoucement request
            console.log('Received NODE_ANNOUCE message from remote client');

            i = 0;
            for(var attribute in json.node){

               new_node = Node;
               new_node.ip = json.node[i].address;
               new_node.port = json.node[i].port;
               new_node.nodeId = json.node[i].nodeID;
               i++;

               //console.log(new_node);

              //  console.log(json.node[0].address);

               NodePool.push(new_node);
            }

            NodePool.push(Node);

            NodePool.push("B");
            NodePool.push("C");


            console.log(NodePool);


        } else if (json.method == "GET_KNOWN_NODES") {
            /// handle other node annoucement request
            console.log('Received GET_KNOWN_NODES request from remote client');

            console.log('Sending NODE_ANNOUCE to remote node');

        }  else if (json.name == "PING") {
            /// handle Ping with Pong responde send


        }
         else if (json.name == "PONG") {
            /// handle Pong with to que get (PongQueue)

          }

    }
  });

  connection.on('close', function(connection) {
    // close user connection
  });
});


// Connections Init

$.getScript('cuddy_events/Connections.js', function(){
    MakeFirstConnections();
});
