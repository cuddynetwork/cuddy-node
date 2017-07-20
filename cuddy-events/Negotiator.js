/*
    Module for processing contract negotiation on your node
    CuddyCore v. 0.0.0
*/

var LocalNode = require('./MyNode.js');

/// Function for handling contract negotiation on this node
function processContractNegotiation(contractProposal) {

  if (contractProposal.fileSize <= MAX_ALLOWED_FILE_SIZE) {

        if (contractProposal.complexity <= MAX_ALLOWED_COMPLEXITY) {

            // CHECK IF NEEDED WITH THIS RATINGS
            var VariableBaseOnContractNeed = 1;
            var NodesMinAmount = 5 * VariableBaseOnContractNeed;


            var ListOfNodes = LocalNode.getContractNodes(contractProposal.tx);

            var NodeTem,NodeRatting;
            var SumUpRating = 0;
            var i=0;
            for (nodeid in ListOfNodes){
                NodeTem = LocalNode.getNodeDetailsByID(ListOfNodes[nodeid]);
                if(NodeTem.checkPositive)!=0)
                    NodeRatting = NodeTem.checkPositive / (NodeTem.checkPositive + NodeTem.checkNoResponse)
                else
                    NodeRatting = 0

                SumUpRating += NodeRatting
                i++
            }

            if(SumUpRating < NodesMinAmount){
                // free space
                var SumUpLadger = 0
                // Sum whole ladger
                //to do
                if(SumUpLadger < MAX_MEMORY_AVAILABLE){
                 return true
                }
                else{
                    //CHECK IF competitive
                    //Find smallest RateCompetitive for this node
                    competitive = LocalNode.getLocalNodeCompetitive();

                    var RateCompetitive = competitive.storage * contractProposal.fee.storage +
                        competitive.execution * contractProposal.fee.execution +
                        competitive.transfer * contractProposal.fee.transfer;
                    //contract.fee.storage
                }
            }




        }
    }

}

/// TEST

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
    userChecksum: "default", // calculated from dataChecksum and private key, can by verify by public key and dataCheckSum
    sslEnabled: 0 // notify node if SSL (HTTPS) is enabled

};

processContractNegotiation(Contract);
