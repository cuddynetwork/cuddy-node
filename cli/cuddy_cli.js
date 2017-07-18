var WebSocketClientManager = require('../cuddy-events/WebSocketClientManager.js');
var NodesLedgerProcessor = require('../cuddy-events/NodesLedgerProcessor.js');
var request = require('request');
var fs = require('fs');
var program = require('commander');
var colors = require('colors/safe');
var dateTime = require('node-datetime');
var crypto = require('crypto');

var dt = dateTime.create();
dt.format('m/d/Y H:M:S');

my_nodes_ledger_array = [];

program
  .version('0.1.0')
  .option('-u, --upload <file_path>', 'Upload resource (file) to the Cuddy network', upload_resource)
  .option('-c, --clones [clones]', 'Set the number of initial clones')
  .parse(process.argv);


function upload_resource(file_path) {
  console.log(new Date(dt.now()) + colors.green(" Requested upload file: " + file_path));

  console.log(new Date(dt.now()) + colors.green(" Brodacasting contract negotiation request to network..."));


  node_details = NodesLedgerProcessor.getRandomNodeDetails();

  var ContractID = crypto.randomBytes(32).toString('hex');
  var ApplicantHash = crypto.randomBytes(36).toString('hex');

  console.log(new Date(dt.now()) + colors.green(" Contract negotiated with: " + JSON.stringify(node_details)));

  console.log(new Date(dt.now()) + colors.green(" Sending COLLECT to remote node and requesting Collect Token..."));

  var Collect = {
    method: "COLLECT",
    parametrs: {
      data_size: 1024,
      applicant_hash: ApplicantHash,
      contract_id: ContractID
    }

  }

  collect_token_id = WebSocketClientManager.sendMessage ("localhost:6689", JSON.stringify(Collect), next);

          function next(collect_token_tmp) {
              collect_token_json = JSON.parse(collect_token_tmp);

              collect_token = collect_token_json.collect_token;

              console.log(new Date(dt.now()) + colors.green(" Received Collect Token."));


              console.log(new Date(dt.now()) + colors.green(" Started uploading to remote node."));

              /*
              * Send file to remote node
              *
              */

              url = "http://" + node_details.ip + ":" + node_details.port + "/upload?collect_token=" + collect_token;
              var req = request.post(url, function (err, resp, body) {
                if (err) {
                  console.log('Error!');
                } else {
                  console.log('URL: ' + body);
                }
              });
              var form = req.form();
              form.append('file', fs.createReadStream("/home/lakewik/chemicalbalance.js"));






          }

  //console.log(collect_token_id);



console.log(file_path);

}

local_nods_ledger = NodesLedgerProcessor.getNodes();
for (var nodeID in local_nods_ledger) {
  my_nodes_ledger_array.push(nodeID);
}

var Sync = {
  method: "SYNC_NODES_LEDGER",
  nodes_ledger: my_nodes_ledger_array


}

var Collect = {
  method: "COLLECT",
  parametrs: {
    data_size: 1024,
    applicant_hash: "324234hju23hi",
    contract_id: "dsadattas5d76anda78nydasayugdsad877878d709jsa8d097a"
  }

}



//WebSocketClientManager.sendMessage ("localhost:6689", JSON.stringify(Collect));
