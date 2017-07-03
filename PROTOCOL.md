# Cuddy protocol specification

Protocol data type is JSON. Data transfer is done by HTTP or HTTPS connection


**CLONE** - clone file from other node
    Parametrs and message structure:
     
```
{
      "method": "CLONE",
      "params": {
        "address": "89.231.22.170",
        "post": "7733",
        "hostname": "node1.cuddy.lakewik.pl",
        "nodeID": "d5f7ae35768db5bd4ab02056cc408525d94780bd",
        "fileID": "9hsfd667sf78sfn8sdjfj87s",
        "fileSize": "43223432", # in Bps
        "fileHash": "35643656", # in Bps
      
      },
      "id": "7b6a2ab35da6826995abf3310a4875097df88cdb"
    }
  ```


**REPORT_STATUS** - send information to NETWORK (save in blockchain???) if file is downloaded successfully 
				and send information about average transfer bandwidtch to update node reputation, 
				including file size to obtain current demand and adjust mirrors number

```
				{
  "method": "REPORT_STATUS",
  "params": {
  
  "node": {
    "address": "89.231.22.170",
    "post": "7733",
    "hostname": "node1.cuddy.lakewik.pl",
    "nodeID": "d5f7ae35768db5bd4ab02056cc408525d94780bd",
	},
	
    "averageTransferSpeed": "d5f7ae35768db5bd4ab02056cc408525d94780bd",
	"result": "SUCCESS", # result may be SUCCESS or FAILURE or TRANSFER_TOO_SLOW
    "operationHash": "d5f7ae35768db5bd4ab02056cc408525d94780bd",
  },
  
  "id": "7b6a2ab35da6826995abf3310a4875097df88cdb"
}
```


Downloading file can be done with:
GET request structure: ```http://[https://]node_address:node_port/tx/contractId```

**COLLECT** - get collect token to get file and save on node, This method will return token which can be used to autchorize data channel
```
	 {
  "method": "COLLECT",
  "params": {
  "node": {
    "address": "89.231.22.170",
    "post": "7733",
    "hostname": "node1.cuddy.lakewik.pl",
    "nodeID": "d5f7ae35768db5bd4ab02056cc408525d94780bd",
	},
	
    "contractID": "d5f7ae35768db5bd4ab02056cc408525d94780bd",
    "fileSize": "2", # 3 transfer priority levels,
    "fileHash": "2", # SHA-516 cryptographic file hash,
    "fileType": "static", # static or script
	
  },
  
  "id": "7b6a2ab35da6826995abf3310a4875097df88cdb"
}
  ```


Request for upload resource to node
POST request structure: 
```http://[https://]node_address:node_port/node_id/contract_id/file_id?token=collect_token```

If upload success the node requesting to save file location in blockchain by broadcasting transaction and clone file to other node



**AUDIT** - check, if given file exist, by requesting node to generate cryptographic hash

**NEGOTIATE** - negotiate contract for public file storage, contract negotiation is dependent on file size, geolocation and node reputation 
			(uptime, response time, bandwidth, success and failure rate)
			
```
	 {
  "method": "NEGOTIATE",
  "params": {
    "transferFee": "d5f7ae35768db5bd4ab02056cc408525d94780bd",
    "excutionFee": "2", # 3 transfer priority levels,
    "storageFee": "2", # fee per one hour of storage
    "fileType": "static", # static or script
	
  },
  
  "id": "7b6a2ab35da6826995abf3310a4875097df88cdb"
}
  ```




**PING** - check if node is online
	Parametrs and message structure:
  
```
      {
      "method": "PING",
      "params": {
        "address": "89.231.22.170",
        "post": "7733",
        "hostname": "node1.cuddy.lakewik.pl",
      
      },
      "id": "7b6a2ab35da6826995abf3310a4875097df88cdb"
    }
       ```
	
	Response structure:
	
```	
	{
      "method": "PONG",
      "params": {
        "address": "89.231.22.170",
        "post": "7733",
        "hostname": "node1.cuddy.lakewik.pl",
      
      },
      "id": "7b6a2ab35da6826995abf3310a4875097df88cdb"
    }
    ```
	
