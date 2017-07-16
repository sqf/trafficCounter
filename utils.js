"use strict";
const execSync = require('child_process').execSync;
const fs = require('fs');
const sget = require('sget');

exports.calibrate = (networkInterface) => {
    console.log("Calibration...");
    let noVehicleValues = [];
    let fetchNoVehicleValues = setInterval(() => {
        let currentRssi = getCurrentRssi(networkInterface);
        console.log("currentRssi:", currentRssi);
        noVehicleValues.push(currentRssi)
    }, 50);

    setTimeout(() => {
        clearInterval(fetchNoVehicleValues);
        let sum = noVehicleValues.reduce((a, b) => a + b);
        let avg = (sum / noVehicleValues.length).toFixed();
        console.log("Calibration done. Average = ", avg);
        fs.writeFile("calibrationResult", avg, (err) => {
            if (err) {
                return console.log(err);
            }
            console.log("Results saved to a file.");
        });
        return avg;
    }, 5000)
};

exports.printDateAndTime = (date) => {
    return date.toLocaleString() + ":" + date.getUTCMilliseconds();
};

exports.printProgramInstructions = () => {
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

exports.printUserDetectionResults = (results) => {
    let str = "";
    for (let key in results) {
        if (!results.hasOwnProperty(key)) continue;
        str = str + key + ": " + results[key] + "\n";
    }
    return str;
};

exports.getProperIntervalBetweenMeasurements = (isSimulation) => {
    if (isSimulation) {
        return 15;
    } else {
        return 10;
    }
};

exports.takeThirdElementFromLine = (element) => {
    return element.split(" ")[2];
};

exports.checkIfNumber = (element) => {
    return !isNaN(element);
};

function getWirelessInterfaceName() {
    try {
        let wirelessInterface = fs.readFileSync("wirelessInterfaceName").toString();
        console.log("Wireless interface read from a file: ", wirelessInterface);
        return wirelessInterface;
    }
    catch (err) {
        try {
            let wirelessInterfaces = execSync("ip link list").toString().split("\n");
            wirelessInterfaces = wirelessInterfaces.filter((element) => {
                return element.includes(": ");
            }).map((element) => {
                console.log(element.split(" ")[0] + " " + element.split(" ")[1].slice(0, -1));
                return element.split(" ")[1].slice(0, -1);
            });
            console.log("Which network interface would you like to use?");
            let index = JSON.parse(JSON.stringify(Number(sget()) - 1));
            console.log("Interface " + wirelessInterfaces[index] + " will be used.");
            return wirelessInterfaces[index];
        } catch (err) {
            console.log(err);
            console.log("Automatic fetch of interface name failed. " +
                "Please put the name to a file called 'wirelessInterfaceName' and try again.");
            process.exit();
        }
    }
}

function getCurrentRssi(apName) {
    return Number(execSync('./wifi-scan-station ' + apName).toString());
}

exports.getCurrentRssi = getCurrentRssi;
exports.getWirelessInterfaceName = getWirelessInterfaceName;