/*
    Module for obtaining location of resources by contractID and locatinng contracts
    CuddyCore v. 0.0.0
*/



module.exports = {

  isContractExistOnNode: function (contractID, nodeID) {

    return db.getData("/config/node");

  },

  getContractNode: function (obtainMethod) {
  /* obtainMethod - randomNodeSelect ['random'] or selectBestNode ['bestnode']
   *
   */
    return db.getData("/config/node");

  },



  };
