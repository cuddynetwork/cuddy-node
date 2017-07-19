/*
    Module for processing contract negotiation on your node
    CuddyCore v. 0.0.0
*/

/// Function for handling contract negotiation on this node
function processContractNegotiation() {

  if (contract.fileSize <= MAX_ALLOWED_FILE_SIZE) {

        if (contract.complexity <= MAX_ALLOWED_COMPLEXITY) {
            
            // CHECK IF NEEDED WITH THIS RATINGS
            var VariableBaseOnContractNeed = 1
            var NodesMinAmount = 5 * VariableBaseOnContractNeed
            
            
            var ListOfNodes = getContractNodes(contract.tx);
            
            var NodeTem,NodeRatting;
            var SumUpRating = 0;
            var i=0;
            while(ListOfNodes[i]){
                NodeTem = getNodeDetailsByID(ListOfNodes[i]);
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
                    
                    var RateCompetitive = competitive.storage * fee.storage + 
                        competitive.execution * fee.execution + 
                        competitive.transfer * fee.transfer;
                    //contract.fee.storage
                }    
            }
            
            
            

        }
    }

}
