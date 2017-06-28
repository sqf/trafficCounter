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
};

exports.printProgramInstructions = function() {
    console.log("Press <q> to quit.");
    console.log("Press <c> if you detected a car.");
    console.log("Press <d> if you detected a fast car.");
    console.log("Press <t> if you detected a truck.");
    console.log("Press <5> if you detected a fast truck.");
    console.log("Press <b> if you detected a bus.");
    console.log("Press <g> if you detected a fast bus.");
    console.log("Press <r> if you detected a bicycle.");
    console.log("Press <4> if you detected a fast bicycle.");
    console.log("Press <m> if you detected a motorcycle.");
    console.log("Press <j> if you detected a fast motorcycle.");
    console.log("Fast means more than 40 kph. \n");
};

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