/* 
    Cuddy alfa version 
    0.0.0
*/

/* Ladgers */

var Contract = {
    tx : "default",
    submited: 0, //timestamp of submmision
    expireDate: 0, //timestamp of expiration
    fee: {
        storage: 0,
        proccessing: 0,
        transfer: 0
    },
    nodes: {
        //must be a vector of nodes
    },
    complexity: 0, //calculated by node which recived contract,
    size: 0, //can be check by node to verify if not forgery
    reqLastMinute: 0, //amount of resource request (will be used to ajust amount of nodes to store file)
    dataChecksum: "default", // calculated from data
    userChecksum: "default" // calculated from dataChecksum and private key, can by verify by public key and dataCheckSum
    
} 

/* Events listening */

const DEFAULT_PORT_PUBLIC = 80;
const DEFAULT_PORT_COMUNICATION = 7733;

