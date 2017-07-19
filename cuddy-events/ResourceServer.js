/*
    Multithread module for serving resources to user browser and requesting excution if needed
    CuddyCore v. 0.0.0
*/

var Constants = require('../resources/Constants.js');
var LocalNode = require('./MyNode.js');

var http = require('http');
var dateTime = require('node-datetime');
var colors = require('colors/safe');

var ContractsLedgerProcessor = require('./ContractsLedgerProcessor.js');
var ResourceLocationObtainer = require('./ObtainResourceLocation.js');
var NodesLedgerProcessor = require('./NodesLedgerProcessor.js');

const DEFAULT_PORT_PUBLIC = Constants.DEFAULT_PORT_PUBLIC;
const DEFAULT_PORT_PUBLIC_SSL = Constants.DEFAULT_PORT_PUBLIC_SSL;
const CONTAINERS_DEFAULT_SAVE_LOCATION = Constants.CONTAINERS_DEFAULT_SAVE_LOCATION;

var fs = require('fs');

var LocalNodeDetails = LocalNode.getLocalNodeDetails();
var localNodeID = LocalNodeDetails.id;
var localNodeAddress = LocalNodeDetails.address;
var localNodePort = LocalNodeDetails.port;

/* Initialization */

var dt = dateTime.create();
dt.format('m/d/Y H:M:S');

var server = http.createServer(function(request, response) {

if (request.url.indexOf("/download") > -1) {

  var url_splitted = request.url.split("/download");

  //console.log(url_splitted[1]);

  requested_contract_id = url_splitted[1].replace("/", "");

  /// if content is not absent on your node, redirect to node, which have this resource
  if (ContractsLedgerProcessor.isContractExistOnNode(requested_contract_id, localNodeID)) {

  console.log(new Date(dt.now()) + " " + 'Received resource download request from remote client, contract ' + requested_contract_id);



  fs.readFile(CONTAINERS_DEFAULT_SAVE_LOCATION + "/" + requested_contract_id + "/" + requested_contract_id, "binary", function(err, file) {
    if(err) {
      response.writeHead(500, {"Content-Type": "text/html"});
      response.write("<h1>Internal Server Error</h1>" + "\n");
      response.end();
      return;
    }

    response.writeHead(200);
    response.write(file, "binary");
    response.end();
});

} else {
  //// redirect to other node
  excludes = [];
  excludes.push(localNodeID);
  other_node_id = ResourceLocationObtainer.getContractNodeId(requested_contract_id, "random", excludes);

  other_node_details = NodesLedgerProcessor.getNodeDetailsByID(other_node_id);

  console.log(other_node_details);


    console.log('http://' + other_node_details.ip.toString() + ":" + other_node_details.port.toString() + "/download/" + requested_contract_id);

    response.writeHead(302, {
      'Location': 'http://' + other_node_details.ip.toString() + ":" + other_node_details.port.toString() + "/download/" + requested_contract_id
    });
    response.end();


}

} else {

  console.log(new Date(dt.now()) + " " + colors.red('Received unrecognized HTTP request from remote client'));
  response.writeHead(200, {"Content-Type": "text/json"});
  response.write('{"error":"UNRECOGNIZED_REQUEST"}');
  response.end();

}


});

module.exports = {

  init: function (nodeID) {
    console.log(new Date(dt.now()) + " " + colors.green('Starting resource server module!'));
    try {
      server.listen(DEFAULT_PORT_PUBLIC, function() { });
      console.log(new Date(dt.now()) + " " + colors.green('Resource server module started!'));
    } catch (err) {
      console.log(new Date(dt.now()) + " " + colors.red('Error while initializing resource server module!'));
    }

    return true;

  }

};



//excludes = [];
//excludes.push("63h6c38ch63c983ch698w");
//console.log(ResourceLocationObtainer.getContractNodeId("dsadattas5d76anda78nydasayugdsad877878d709jsa8d097a", "random", excludes))
//console.log(ContractsLedgerProcessor.isContractExistOnNode("dsadattas5d76anda78nydasayugdsad877878d709jsa8d097a", "piesek"));
