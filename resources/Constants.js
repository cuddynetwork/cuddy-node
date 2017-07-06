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
