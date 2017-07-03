/* 
    Cuddy alfa version 
    0.0.0
*/

/* Ladgers */

// For ladger of contracts
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

// For ladger of reputation
var Node = {
    nodeId: "default", // uniq hash, don't know if needed
    ip: "255.255.255",
    port: 7733, // port to comunicate
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



/* Events listening */

const DEFAULT_PORT_PUBLIC = 80;
const DEFAULT_PORT_COMUNICATION = 7733;
