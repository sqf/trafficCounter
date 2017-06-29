var td = require("testdouble");
var trafficCounter = require("./trafficCounter.js");
var utils = require("./utils.js");

var getCurrentSignalStrength = td.replace(utils, "getCurrentSignalStrength");
td.when(getCurrentSignalStrength("wlxf81a671a3127")).thenReturn("-65", "-75", "-65");

trafficCounter.count();
