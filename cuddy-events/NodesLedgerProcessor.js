/*
    Module for processing Cuddy nodes ledger
    CuddyCore v. 0.0.0
*/


var Structures = require('../resources/Structures.js');


var Node = Structures.Node;
var Contract = Structures.Contract;

/// Init JSON database ////

var JsonDB = require('node-json-db');

var db = new JsonDB("/home/lakewik/.cuddy/cuddy-nodes-ledger", true, true);

///////

module.exports = {

  getNodeDetailsByID: function (nodeID) {

    return db.getData("/nodes/" + nodeID.toString());

  },
  insertNode: function (nodeID, node_details) {

    return db.push("/nodes/" + nodeID.toString(), node_details);

  }

};

//  Node ledger structure
var Node = {
    ip: "255.255.255.255",
    port: 6689, // port to comunicate
    startTime: 0, // Timestamp of node first notice in the network
    lastActive: 0, //Last activity of node in the network
    checkPositive: 0, //Possitive check by another node
    checkNoResponse: 0, //Without response / timeout
    checkNegative: 0, // With incorect checksum
    capacityAvaiable: 0, // In bytes
    capacityUsed: 0, // Used capacity, not know if needed, we can calculate it from ladgerOfContracts

};

//module.exports.insertNode("piesek", Node);
