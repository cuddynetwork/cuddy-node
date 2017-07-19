/*
    RPC module for Cuddy
    0.0.0
*/

var Constants = require('../resources/Constants.js');

const DEFAULT_PORT_CUDDY_RPC = Constants.DEFAULT_PORT_CUDDY_RPC;


/* Create WebSocket Listening Server */

var server = http.createServer(function(request, response) {
  // process HTTP request.
  // Also this is used to initial serving websockets

});
server.listen(DEFAULT_PORT_CUDDY_RPC, function() { });


// create the server
wsServer = new WebSocketServer({
  httpServer: server
});


/* Events listening */

// WebSocket server

wsServer.on('request', function(request) {

  var connection = request.accept('cuddy-rpc-protocol', request.origin);

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


        if (json.method == "GET_MY_NODE_ACTIVE_CONTRACTS_NUMBER") {
            /* Returns the number of actual number of contracts
            *   currently stored on your node
            *  **Returns integer value in JSON**
            */

            var Response = {
              response: 10
            }

            connection.sendUTF(JSON.stringify(Response));

        } else if (json.method == "UPLOAD_RESOURCE") {
                /* Handling resource upload request and updating progress by WebSocket RPC
                */

                var Response = {
                  response: 10
                }

                connection.sendUTF(JSON.stringify(Response));

          } else if (json.method == "PUBLISH_CONTRACT_PROPOSAL") {
                    /* Broadcasting the contract proposal to network
                    */

                    var Response = {
                      response: 10
                    }

                    connection.sendUTF(JSON.stringify(Response));

                }  else {
            console.log(new Date(dt.now()) + " " + 'Received unrecognized message from remote client' + JSON.stringify(json));
          }
    }
  });

  connection.on('close', function(connection) {
    // close user connection

  });  console.log(new Date(dt.now()) + " " + colors.blue('Remote node with address ' + connection.remoteAddress + ' disconnected!'));

});
