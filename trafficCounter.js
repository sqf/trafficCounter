"use strict";
let fs = require('fs');
let program = require('commander');
const readline = require('readline');
let td = require("testdouble");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
let utils = require("./utils.js");

// Configuration
const threshold = 6;
const thresholdForFastVehicles = 10;
const apName = "wlxf81a671a3127";
const minimumTimePeriodBetweenPassingVehicles = 100;
const minimumVehiclePassingTime = 250;
const minimumRiseOfSignal = 3;
const minimumDropOfSignal = 3;

program
    .version('0.0.1')
    .option('-k, --calibrate', 'calibrate program')
    .option('-c, --count', 'count vehicles')
    .option('-s, --simulate [pathToLog]', 'simulate counting');
    //.option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
program.on('--help', function() {
    console.log("Run --calibrate when there are no vehicles.");
    console.log("It will take a few seconds to proceed.");
})
    .parse(process.argv);

if(program.calibrate) utils.calibrate(apName);
if(program.count) count();
if(program.simulate) {
    if(typeof program.simulate === 'string' || program.simulate instanceof String) {
        simulate(program.simulate);
    } else {
        console.log("You must specify a path to log!");
    }
}


function count(isSimulation) {
    utils.printProgramInstructions();
    let vehicleCounter = 0;
    let userDetectionResults = {
        "car": 0,
        "fast car": 0,
        "truck": 0,
        "fast truck": 0,
        "bus": 0,
        "fast bus": 0,
        "bicycle": 0,
        "fast bicycle": 0,
        "motorcycle": 0,
        "fast motorcycle": 0
    };
    let occupancy = 0; // total time
    let isVehiclePassing = false;

    let signalStrengthWithoutNoise = Number(fs.readFileSync("calibrationResult").toString());
    let whenProgramStarted = new Date();
    let filePathAndName = "results/" + utils.printDateAndTime(whenProgramStarted).replace(/:/g, "_");
    let filePathAndNameDebug = filePathAndName + " DEBUG";
    let initialInfo = "";
    if(isSimulation) {
        initialInfo += "This is a simulation.\n"
    }
    initialInfo += "Counting started at " + utils.printDateAndTime(whenProgramStarted) +
        "\nCalibration value (average no vehicle signal strength) is " +
        signalStrengthWithoutNoise + " dBm" + "\nThreshold value is " + threshold + " dBm" +
        "\nThreshold for fast vehicles is " + thresholdForFastVehicles + " dBm" +
        "\nMinimum period between passing vehicles: " + minimumTimePeriodBetweenPassingVehicles + " ms" +
        "\nMinimum vehicle passing time: " + minimumVehiclePassingTime + " ms" +
        "\nMinimum rise of signal after vehicle passed: " + minimumRiseOfSignal + " dBm" +
        "\nMinimum drop of signal when vehicle passing: " + minimumDropOfSignal + " dBm \n\n";
    console.log(initialInfo);

    fs.writeFile(filePathAndName, initialInfo);
    fs.writeFile(filePathAndNameDebug, initialInfo);

    function logThatUserDetected(vehicle) {
        let tNow = new Date();
        console.log(utils.printDateAndTime(tNow) + " You detected a " + vehicle + "!");
        fs.appendFileSync(filePathAndName, utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!\n");
        fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!\n");
    }

    process.stdin.on('keypress', (str, key) => {
        switch(key.sequence) {
            case "q":
                handleQuitingProgram();
                break;
            case "c":
                userDetectionResults["car"]++;
                logThatUserDetected("car");
                break;
            case "d":
                userDetectionResults["fast car"]++;
                logThatUserDetected("fast car");
                break;
            case "t":
                userDetectionResults["truck"]++;
                logThatUserDetected("truck");
                break;
            case "5":
                userDetectionResults["fast truck"]++;
                logThatUserDetected("fast truck");
                break;
            case "b":
                userDetectionResults["bus"]++;
                logThatUserDetected("bus");
                break;
            case "g":
                userDetectionResults["fast bus"]++;
                logThatUserDetected("fast bus");
                break;
            case "r":
                userDetectionResults["bicycle"]++;
                logThatUserDetected("bicycle");
                break;
            case "4":
                userDetectionResults["fast bicycle"]++;
                logThatUserDetected("fast bicycle");
                break;
            case "m":
                userDetectionResults["motorcycle"]++;
                logThatUserDetected("motorcycle");
                break;
            case "j":
                userDetectionResults["fast motorcycle"]++;
                logThatUserDetected("fast motorcycle");
                break;
        }
    });

    function handleQuitingProgram() {
        let whenProgramFinished = new Date();
        let totalProgramDuration = whenProgramFinished - whenProgramStarted;
        let occupancyRatio = occupancy / totalProgramDuration;
        let summaryInfo = "\nProgram finished at " + utils.printDateAndTime(whenProgramFinished) +
            "\nTotal program duration: " + totalProgramDuration + " ms.\n\n" +
            "Program results: " + "\ncounted vehicles: " + vehicleCounter + "\noccupancy: " + occupancy + " ms" +
            "\noccupancy ratio: " + occupancyRatio + "\n\n"
            + "User detected: " + "\n" + utils.printUserDetectionResults(userDetectionResults);
        console.log(summaryInfo);
        fs.appendFileSync(filePathAndName, summaryInfo);
        fs.appendFileSync(filePathAndNameDebug, summaryInfo);
        process.exit();
    }

    function checkIsItPossibleThatVehicleIsPassing(currentSignalStrength, previousSignalStrength, tNow) {
        return currentSignalStrength <= signalStrengthWithoutNoise - threshold &&
            tNow - momentWhenVehiclePassed > minimumTimePeriodBetweenPassingVehicles &&
            previousSignalStrength - currentSignalStrength > minimumDropOfSignal;
    }

    function checkMinimumTimeOfPassingRule(tNow, momentWhenVehicleAppeared, minimumVehiclePassingTime) {
        return tNow - momentWhenVehicleAppeared > minimumVehiclePassingTime
    }

    // Below value is initialized with time when program started to allow count a first vehicle.
    let momentWhenVehiclePassed = whenProgramStarted;
    let momentWhenVehicleAppeared;
    let theLowestSignalStrength;
    let previousSignalStrength;
    let currentSignalStrength = 0;
    setInterval(function()
    {
        let tNow = new Date();
        previousSignalStrength = Number(JSON.parse(JSON.stringify(currentSignalStrength)));
        currentSignalStrength = Number(utils.getCurrentSignalStrength(apName));

        if(!currentSignalStrength) {
            handleQuitingProgram();
        }

        //console.log("aaaa currentSignalStrength", currentSignalStrength.toString());

        if(checkIsItPossibleThatVehicleIsPassing(currentSignalStrength, previousSignalStrength, tNow)) {
            if(!isVehiclePassing) {
                momentWhenVehicleAppeared = tNow;
                fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(momentWhenVehicleAppeared) + " Vehicle is passing!");
                console.log(utils.printDateAndTime(momentWhenVehicleAppeared) + " Vehicle is passing!");
            }
            if(currentSignalStrength < theLowestSignalStrength || isNaN(theLowestSignalStrength)) {
                theLowestSignalStrength = currentSignalStrength;
            }
            isVehiclePassing = true;
        }
        if(currentSignalStrength < theLowestSignalStrength && !isNaN(theLowestSignalStrength)) {
            theLowestSignalStrength = currentSignalStrength;
        }
        if(currentSignalStrength > signalStrengthWithoutNoise - threshold && isVehiclePassing === true) {
            if(!checkMinimumTimeOfPassingRule(tNow, momentWhenVehicleAppeared, minimumVehiclePassingTime) &&
                theLowestSignalStrength > signalStrengthWithoutNoise - thresholdForFastVehicles)
            {
                fs.appendFileSync(filePathAndNameDebug, "zadzialo zabezpieczenie z lowSig: ");
                theLowestSignalStrength = null;
                isVehiclePassing = false;
            } else {
                if(currentSignalStrength - theLowestSignalStrength > minimumRiseOfSignal ||
                    theLowestSignalStrength < signalStrengthWithoutNoise - thresholdForFastVehicles) {
                    vehicleCounter++;
                    let timeOfPassing = tNow - momentWhenVehicleAppeared;
                    let vehicleInfo = utils.printDateAndTime(tNow) + " Vehicle passed!" +
                        " Time of passing: " + timeOfPassing + " ms. The lowest signal strength: " +
                        theLowestSignalStrength + "\n";
                    fs.appendFileSync(filePathAndName, vehicleInfo);
                    fs.appendFileSync(filePathAndNameDebug, vehicleInfo);
                    console.log(vehicleInfo + "Vehicle counter: " + vehicleCounter + "\n");
                    isVehiclePassing = false;
                    theLowestSignalStrength = null;
                    occupancy += timeOfPassing;
                } else {
                    let wynik = currentSignalStrength - theLowestSignalStrength;
                    fs.appendFileSync(filePathAndNameDebug, "zadzialo zabezpieczenie, currentSignalStrength : ");
                    fs.appendFileSync(filePathAndNameDebug, currentSignalStrength);
                    fs.appendFileSync(filePathAndNameDebug, "zadzialo zabezpieczenie, theLowestSignalStrength : ");
                    fs.appendFileSync(filePathAndNameDebug, theLowestSignalStrength);
                    fs.appendFileSync(filePathAndNameDebug, "zadzialo zabezpieczenie, wynik : ");
                    fs.appendFileSync(filePathAndNameDebug, wynik);
                    isVehiclePassing = false;
                }
            }
        }
        let totalProgramDuration =  tNow - whenProgramStarted;
        fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(tNow) + " " + totalProgramDuration + " " +
            currentSignalStrength + "\n");
    }, utils.getProperIntervalBetweenMeasurements(isSimulation));
}

function simulate(pathToFile) {
    console.log("Using " + pathToFile + " as input.");
    let linesFromLog = fs.readFileSync(pathToFile).toString().split("\n");
    let calibrationValue = linesFromLog[1].match(/-\d\d/)[0];
    console.log("Read calibration value is ", calibrationValue);
    fs.writeFileSync("calibrationResult", calibrationValue);
    let rssiValues = linesFromLog.map(utils.takeThirdElementFromLine).filter(utils.checkIfNumber);

    let getCurrentSignalStrength = td.replace(utils, "getCurrentSignalStrength");
    td.when(getCurrentSignalStrength(apName)).thenReturn.apply(null, rssiValues);

    count(true);
}
