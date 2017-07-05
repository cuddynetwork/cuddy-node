/*
    Cuddy alfa version
    0.0.0
*/

var WebSocketServer = require('websocket').server;
var http = require('http');
var Hashes = require('jshashes')
var crypto = require('crypto');
var KBucket = require('k-bucket');
var colors = require('colors/safe');
var dateTime = require('node-datetime');
var WebSocketClient = require('websocket').client;


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

var dt = dateTime.create();
dt.format('m/d/Y H:M:S');

var kBucket = new KBucket({
    localNodeId: new Buffer("ffcdd3449fe7c039ae93aac4831768ace43c6ffa243103d1b871f90add264b9121876e9576309183") // default: random data
})

var PongQueue = [];

var CollectTokensBucket = [];

firstrun = true; //TMP

if (firstrun) {

  console.log(colors.green("Performing initial node initialization...."));

  generateNodeID(function(id) {
      console.log(id);
  });


}

localNodeID = "ffcdd3449fe7c039ae93aac4831768ace43c6ffa243103d1b871f90add264b9121876e9576309183";
localNodeIP = "89.231.22.170";
localNodePort = "6689";

console.log(new Date(dt.now()) + " " + colors.green('Cuddy node started!'));

/* Broadcast node to the Cuddy network */

var client = new WebSocketClient();

client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});

client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
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

    function annouceNode() {
        if (connection.connected) {
            var number = Math.round(Math.random() * 0xFFFFFF);
            //connection.sendUTF(number.toString());
            connection.sendUTF('{ "method": "NODE_ANNOUCE", "age": 42,   "nodes": [{  "address": "lakewik.pl",    "port": 6689,    "hostname": "node1.cuddy.lakewik.pl",    "nodeID": "iudsnyfsyfsdfndsi"}] }');

          var FindNodeRequest = {
            method: "FIND_NODE"
          }

            //connection.sendUTF(JSON.stringify(FindNodeRequest));
            setTimeout(annouceNode, 5000);
        }
    }
  //  sendNumber();
  annouceNode();
});



client.connect('ws://cuddy.network:6689//', 'cuddy-protocol');


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
            connection.sendUTF(JSON.stringify(NodeAnnouceResponse));

        }  else if (json.name == "PING") {
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

              connection.sendUTF(JSON.stringify(PongResponse));
        }
         else if (json.name == "PONG") {
            /// handle Pong with to que get (PongQueue)
            connection.sendUTF('{  }');

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
