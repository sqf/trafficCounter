"use strict";
const execSync = require('child_process').execSync;
let fs = require('fs');

exports.calibrate = function(apName) {
    console.log("Calibration...");
    let noVehicleValues = [];
    let fetchNoVehicleValues = setInterval(function() {
        let currentSignalStrength = getCurrentSignalStrength(apName);
        console.log("currentSignalStrength", currentSignalStrength);
        noVehicleValues.push(currentSignalStrength)
    }, 50);

    setTimeout(function() {
        clearInterval(fetchNoVehicleValues);
        let sum = noVehicleValues.reduce(function(a, b) { return a + b; });
        let avg = (sum / noVehicleValues.length).toFixed();
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
    let str = "";
    for(let key in results) {
        if (!results.hasOwnProperty(key)) continue;
        str = str + key + ": " + results[key] + "\n";
    }
    return str;
};

exports.getProperIntervalBetweenMeasurements = function(isSimulation) {
    if(isSimulation) {
        return 15;
    } else {
        return 10;
    }
};

exports.takeThirdElementFromLine = function(element) {
    return element.split(" ")[2];
};

exports.checkIfNumber = function(element) {
    return !isNaN(element);
};

function getCurrentSignalStrength(apName) {
    return Number(execSync('./wifi-scan-station ' + apName).toString());
}

exports.getCurrentSignalStrength = getCurrentSignalStrength;