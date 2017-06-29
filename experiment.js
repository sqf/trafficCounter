var fs = require('fs');
var td = require("testdouble");
var trafficCounter = require("./trafficCounter.js");
var utils = require("./utils.js");

var getCurrentSignalStrength = td.replace(utils, "getCurrentSignalStrength");


function takeThirdElementFromLine(element) {
    return element.split(" ")[2];
}

function checkIfNumber(element) {
    return !isNaN(element);
}
var array = fs.readFileSync("inputs/2017-6-28 17:40:21:230 DEBUG").toString().split("\n").
    map(takeThirdElementFromLine).filter(checkIfNumber);

td.when(getCurrentSignalStrength("wlxf81a671a3127")).thenReturn.apply(null, array);

trafficCounter.count();
