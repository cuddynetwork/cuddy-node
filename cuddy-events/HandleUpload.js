/*
    Multithread module for handling resource upload requests from clients
    CuddyCore v. 0.0.0
*/

var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');

var dateTime = require('node-datetime');

var http = require('http');

var CollectTokenManager = require('./Collect.js');
var Constants = require('../resources/Constants.js');

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

                collect_token_contract = CollectTokenManager.getCollectTokenContract(collect_token_id);

                // create an incoming form object
                var form = new formidable.IncomingForm();

                form.multiples = false;

                // store all uploads in the /resources directory
                form.uploadDir = CONTAINERS_DEFAULT_SAVE_LOCATION;

                // every time a file has been uploaded successfully,
                // rename it to it's orignal name
                form.on('file', function(field, file) {
                    fs.rename(file.path, path.join(form.uploadDir, file.name));
                });

                // log any errors that occur
                form.on('error', function(err) {
                    console.log('An error has occured: \n' + err);
                });

                // once all the files have been uploaded, send a response to the client
                form.on('end', function() {
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

server.listen(DEFAULT_PORT_CONTENT_RECEIVING, function() {});
