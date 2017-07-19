/*
    Multithread module for handling resource upload requests from clients
    CuddyCore v. 0.0.0
*/

var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var colors = require('colors/safe');

var dateTime = require('node-datetime');
var mkdirp = require('mkdirp');


var http = require('http');

var CollectTokenManager = require('./Collect.js');
var Constants = require('../resources/Constants.js');
var ContractsLedgerProcessor = require('./ContractsLedgerProcessor.js');
var LocalNode = require('./MyNode.js');
var Broadcaster = require('./Broadcaster.js');




const DEFAULT_PORT_CONTENT_RECEIVING = Constants.DEFAULT_PORT_CONTENT_RECEIVING;
const LEDGERS_DEFAULT_SAVE_LOCATION = Constants.LEDGERS_DEFAULT_SAVE_LOCATION;
const CONTAINERS_DEFAULT_SAVE_LOCATION = Constants.CONTAINERS_DEFAULT_SAVE_LOCATION;

var dt = dateTime.create();
dt.format('m/d/Y H:M:S');

var server = http.createServer(function(req, res) {

    if (req.url.indexOf("/upload") > -1) {
        var url_splitted = req.url.split("?collect_token=");

        if (typeof url_splitted[1] !== 'undefined' && url_splitted[1] != "") {

            collect_token_id = url_splitted[1].replace("/", "");

            console.log(new Date(dt.now()) + " " + 'Received resource upload request from remote client, contract ' + collect_token_id);

            if (CollectTokenManager.isTokenExist(collect_token_id)) {

                collect_token_contract_id = CollectTokenManager.getCollectTokenContract(collect_token_id);

                // create an incoming form object
                var form = new formidable.IncomingForm();

                form.multiples = false;

                // store all uploads in the /resources directory
                form.uploadDir = CONTAINERS_DEFAULT_SAVE_LOCATION + "/" + collect_token_contract_id.toString();

                mkdirp(form.uploadDir, function(err) {
                  // path exists unless there was an error
                });

                // every time a file has been uploaded successfully,
                // rename it to it's orignal name
                form.on('file', function(field, file) {
                    fs.rename(file.path, path.join(form.uploadDir, collect_token_contract_id.toString()));
                });

                // log any errors that occur
                form.on('error', function(err) {
                    console.log('An error has occured: \n' + err);
                });

                // once all the files have been uploaded, send a response to the client
                form.on('end', function() {
                    currentTimestamp = Math.round(new Date().getTime()/1000);
                    console.log(currentTimestamp);
                    ContractsLedgerProcessor.addNewNodeToContract(collect_token_contract_id, LocalNode.getLocalNodeID(), currentTimestamp)
                    Broadcaster.broadcastContractNode(collect_token_contract_id, LocalNode.getLocalNodeID(), 20)
                    res.end('success');
                });

                // parse the incoming request containing the form data
                form.parse(req);

            } else {
                res.end('Unauthorized! The collect token has expired or not exist!');
            }


        } else {
            console.log(new Date(dt.now()) + " " + 'Received resource upload request from remote client, but missing collect token in request ');
            res.end('Missing collect token!');
        }

    }




});

module.exports = {

  init: function (nodeID) {
    console.log(new Date(dt.now()) + " " + colors.green('Starting resource upload handler!'));
    try {
      server.listen(DEFAULT_PORT_CONTENT_RECEIVING, function() {});
      console.log(new Date(dt.now()) + " " + colors.green('Resource upload handler started!'));
    } catch (err) {
      console.log(new Date(dt.now()) + " " + colors.red('Error while initializing resource upload handler!'));
    }
    return true;

  }

};
