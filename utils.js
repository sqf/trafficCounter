const execSync = require('child_process').execSync;
var fs = require('fs');

exports.calibrate = function(apName) {
    console.log("Calibration...");
    var noVehicleValues = [];
    var fetchNoVehicleValues = setInterval(function() {
        var currentSignalStrength = getCurrentSignalStrength(apName);
        console.log("currentSignalStrength", currentSignalStrength);
        noVehicleValues.push(currentSignalStrength)
    }, 50);

    setTimeout(function() {
        clearInterval(fetchNoVehicleValues);
        var sum = noVehicleValues.reduce(function(a, b) { return a + b; });
        var avg = (sum / noVehicleValues.length).toFixed();
        console.log("Calibration done. Average = ", avg);
        fs.writeFile("calibrationResult", avg, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("Results saved to a file.");
        });
        return avg;
    }, 2000)
};

exports.printDateAndTime = function(date) {
    return date.toLocaleString() + ":" + date.getUTCMilliseconds();
}

exports.printUserDetectionResults = function(results) {
    var str = "";
    for(var key in results) {
        if (!results.hasOwnProperty(key)) continue;
        str = str + key + ": " + results[key] + "\n";
    }
    return str;
};

function getCurrentSignalStrength(apName) {
    return parseFloat(execSync('./wifi-scan-station ' + apName).toString());
}

exports.getCurrentSignalStrength = getCurrentSignalStrength;