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
    }
    
} 

/* Events listening */

const DEFAULT_PORT_PUBLIC = 80;
const DEFAULT_PORT_COMUNICATION = 7733;

