/*
    Multithread module for serving resources to user browser and requesting excution if needed
    CuddyCore v. 0.0.0
*/

function MakeFirstConnections(){

//Make connections list
var MyConnections = [];

// Init from config
var InitStorageFile = require('data/init-storage.json');
var InitStorageServers;
InitStorageFile.readFile('file', 'utf8', function (err, data) {
  if (err) throw err;
  InitStorageServers = JSON.parse(data);
  InitStorageServers=InitStorageServers["servers"];
});

// Ping servers from init list

}