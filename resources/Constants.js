/*
    Constants for Cuddy
    CuddyCore v. 0.0.0
*/

var osenv = require('osenv');

var user_home_path = osenv.home();

exports.CONTAINERS_DEFAULT_SAVE_LOCATION = user_home_path + "/.cuddy/content";
exports.LEDGERS_DEFAULT_SAVE_LOCATION = user_home_path + "/.cuddy/ledgers";
exports.CONFIG_SAVE_LOCATION = user_home_path + "/.cuddy/";
exports.DEFAULT_PORT_PUBLIC = 80;
exports.DEFAULT_PORT_PUBLIC_SSL = 443;
exports.DEFAULT_PORT_COMUNICATION = 6689;
exports.DEFAULT_TOKEN_EXPIRATION_PERIOD = 86400; // one day
exports.DEFAULT_PORT_CONTENT_RECEIVING = 6691;
exports.INITIAL_NODE_ANNOUNCEMENT_MESSAGE_RECIPIENTS_COUNT = 12;
exports.MAX_MEMORY_AVAILABLE = 8000000000; // bits / 1GB
exports.DEFAULT_PORT_CUDDY_RPC = 6686;
