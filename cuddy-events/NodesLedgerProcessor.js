/*
    Module for processing Cuddy nodes ledger
    CuddyCore v. 0.0.0
*/


var Structures = require('../resources/Structures.js');
var Constants = require('../resources/Constants.js');

var Node = Structures.Node;
var Contract = Structures.Contract;

const LEDGERS_DEFAULT_SAVE_LOCATION = Constants.LEDGERS_DEFAULT_SAVE_LOCATION;


/// Init JSON database ////

var JsonDB = require('node-json-db');

var db = new JsonDB(LEDGERS_DEFAULT_SAVE_LOCATION + "/cuddy-nodes-ledger", true, true);

///////

module.exports = {

  getNodeDetailsByID: function (nodeID) {

    return db.getData("/nodes/" + nodeID.toString());

  },

  getNodes: function () {

    return db.getData("/nodes");

  },

  insertNode: function (nodeID, node_details) {

    return db.push("/nodes/" + nodeID.toString(), node_details);

  },

  insertNodes: function (nodes) {

    return db.push("/nodes/", nodes);

  },

  getRandomNodeDetails: function () {

    nodes = db.getData("/nodes");
    random_node = nodes[Object.keys(nodes)[Math.floor(Math.random()*Object.keys(nodes).length)]]
    return random_node;

  },

  countNodesInLedger: function () {

    nodes = db.getData("/nodes");
    nodes_count = Object.keys(nodes).length;
    return nodes_count;

  },


  isNodeInLedger: function (nodeID) {

    try {
      node = db.getData("/nodes/" + nodeID.toString());
      return true;
    } catch (err) {
      return false;
    }

  },

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

//console.log(module.exports.countNodesInLedger());
