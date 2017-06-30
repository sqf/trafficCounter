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
var array = fs.readFileSync("inputs/2017-6-28_17_19_09_516_DEBUG").toString().split("\n").
    map(takeThirdElementFromLine).filter(checkIfNumber);

//td.when(getCurrentSignalStrength("wlxf81a671a3127"), {delay: 100}).thenDo(function(){ setTimeout(function () {},10) });
td.when(getCurrentSignalStrength("wlxf81a671a3127")).thenReturn.apply(null, array);
//td.when(getCurrentSignalStrength("wlxf81a671a3127")).thenReturnAfter10ms.apply(null, array);

trafficCounter.count(true);
