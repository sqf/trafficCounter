var fs = require('fs');
var program = require('commander');
const readline = require('readline');
var td = require("testdouble");
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
var utils = require("./utils.js");

// Configuration
var threshold = 7;
var thresholdForFastVehicles = 10;
var apName = "wlxf81a671a3127";
var minimumTimePeriodBetweenPassingVehicles = 100;
var minimumVehiclePassingTime = 250;
var minimumRiseOfSignal = 3;

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
if(typeof program.simulate === 'string' || program.simulate instanceof String) {
    simulate(program.simulate);
} else {
    console.log("You must specify a path to log!");
}

function count(isSimulation) {
    utils.printProgramInstructions();
    var vehicleCounter = 0;
    var userDetectionResults = {
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
    var occupancy = 0; // total time
    var isVehiclePassing = false;

    var signalStrengthWithoutNoise = Number(fs.readFileSync("calibrationResult").toString());
    var whenProgramStarted = new Date();
    var filePathAndName = "results/" + utils.printDateAndTime(whenProgramStarted).replace(/:/g, "_");
    var filePathAndNameDebug = filePathAndName + " DEBUG";
    var initialInfo = "";
    if(isSimulation) {
        initialInfo += "This is a simulation.\n"
    }
    initialInfo += "Counting started at " + utils.printDateAndTime(whenProgramStarted) +
        "\nCalibration value (average no vehicle signal strength) is " +
        signalStrengthWithoutNoise + " dBm" + "\nThreshold value is " + threshold + " dBm" +
        "\nThreshold for fast vehicles is " + thresholdForFastVehicles + " dBm" +
        "\nMinimum period between passing vehicles: " + minimumTimePeriodBetweenPassingVehicles + " ms" +
        "\nMinimum vehicle passing time: " + minimumVehiclePassingTime + " ms" +
        "\nMinimum rise of signal after vehicle passed: " + minimumRiseOfSignal + " dBm \n\n";
    console.log(initialInfo);

    fs.writeFile(filePathAndName, initialInfo);
    fs.writeFile(filePathAndNameDebug, initialInfo);

    function logThatUserDetected(vehicle) {
        var tNow = new Date();
        console.log(utils.printDateAndTime(tNow) + " You detected a " + vehicle + "!");
        fs.appendFileSync(filePathAndName, utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!\n");
        fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!\n");
    }

    process.stdin.on('keypress', (str, key) => {
        switch(key.sequence) {
            case "q":
                handleQuitingProgram();
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
        var whenProgramFinished = new Date();
        var totalProgramDuration = whenProgramFinished - whenProgramStarted;
        var occupancyRatio = occupancy / totalProgramDuration;
        var summaryInfo = "\nProgram finished at " + utils.printDateAndTime(whenProgramFinished) +
            "\nTotal program duration: " + totalProgramDuration + " ms.\n\n" +
            "Program results: " + "\ncounted vehicles: " + vehicleCounter + "\noccupancy: " + occupancy + " ms" +
            "\noccupancy ratio: " + occupancyRatio + "\n\n"
            + "User detected: " + "\n" + utils.printUserDetectionResults(userDetectionResults);
        console.log(summaryInfo);
        fs.appendFileSync(filePathAndName, summaryInfo);
        fs.appendFileSync(filePathAndNameDebug, summaryInfo);
        process.exit();
    }

    function checkIsItPossibleThatVehicleIsPassing(currentSignalStrength, tNow) {
        if((currentSignalStrength <= signalStrengthWithoutNoise - threshold) &&
            !(tNow - momentWhenVehiclePassed > minimumTimePeriodBetweenPassingVehicles)) {
            console.log(utils.printDateAndTime(tNow) +
                " Zadzialalo zabezpieczenie z czasem!\n");
            fs.appendFileSync(filePathAndName, utils.printDateAndTime(tNow) +
                " Zadzialalo zabezpieczenie z czasem!\n");
            fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(tNow) +
                " Zadzialalo zabezpieczenie z czasem!\n");
        }
        return currentSignalStrength <= signalStrengthWithoutNoise - threshold &&
            tNow - momentWhenVehiclePassed > minimumTimePeriodBetweenPassingVehicles;
    }

    function checkMinimumTimeOfPassingRule(tNow, momentWhenVehicleAppeared, minimumVehiclePassingTime) {
        return tNow - momentWhenVehicleAppeared > minimumVehiclePassingTime
    }

    // Below value is initialized with time when program started to allow count a first vehicle.
    var momentWhenVehiclePassed = whenProgramStarted;
    var momentWhenVehicleAppeared;
    var theLowestSignalStrength;
    setInterval(function()
    {
        var tNow = new Date();
        var currentSignalStrength = Number(utils.getCurrentSignalStrength(apName));  /// co tu sie u licha dzieje??

        if(!currentSignalStrength) {
            handleQuitingProgram();
        }

        //console.log("aaaa currentSignalStrength", currentSignalStrength.toString());

        if(checkIsItPossibleThatVehicleIsPassing(currentSignalStrength, tNow)) {
            if(!isVehiclePassing) {
                momentWhenVehicleAppeared = tNow;
                fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(momentWhenVehicleAppeared) + " Vehicle is passing!\n");
                console.log(utils.printDateAndTime(momentWhenVehicleAppeared) + " Vehicle is passing!");
            }
            if(currentSignalStrength < theLowestSignalStrength || isNaN(theLowestSignalStrength)) {
                theLowestSignalStrength = currentSignalStrength;
            }
            isVehiclePassing = true;
        }
        if (currentSignalStrength > signalStrengthWithoutNoise - threshold && isVehiclePassing === true) {
            if(!checkMinimumTimeOfPassingRule(tNow, momentWhenVehicleAppeared, minimumVehiclePassingTime) &&
                theLowestSignalStrength > signalStrengthWithoutNoise - thresholdForFastVehicles)
            {
                fs.appendFileSync(filePathAndNameDebug, "zadzialo zabezpieczenie z lowSig: ");
                theLowestSignalStrength = null;
                isVehiclePassing = false;
            } else {
                if(currentSignalStrength - theLowestSignalStrength >= minimumRiseOfSignal) {
                    vehicleCounter++;
                    var timeOfPassing = tNow - momentWhenVehicleAppeared;
                    var vehicleInfo = utils.printDateAndTime(tNow) + " Vehicle passed!" +
                        " Time of passing: " + timeOfPassing + " ms.\n";
                    fs.appendFileSync(filePathAndName, vehicleInfo);
                    fs.appendFileSync(filePathAndNameDebug, vehicleInfo);
                    console.log(vehicleInfo + "Vehicle counter: " + vehicleCounter + "\n");
                    isVehiclePassing = false;
                    theLowestSignalStrength = null;
                    occupancy += timeOfPassing;
                } else {
                    var wynik = currentSignalStrength - theLowestSignalStrength;
                    var wynik2 = theLowestSignalStrength - currentSignalStrength;
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

        fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(tNow) + " " + currentSignalStrength + "\n");
    }, utils.getProperIntervalBetweenMeasurements(isSimulation));
}

function simulate(pathToFile) {
    console.log("Using " + pathToFile + " as input.");
    var linesFromLog = fs.readFileSync(pathToFile).toString().split("\n");
    var calibrationValue = linesFromLog[1].match(/-\d\d/)[0];
    console.log("Read calibration value is ", calibrationValue);
    fs.writeFileSync("calibrationResult", calibrationValue);
    var rssiValues = linesFromLog.map(utils.takeThirdElementFromLine).filter(utils.checkIfNumber);

    var getCurrentSignalStrength = td.replace(utils, "getCurrentSignalStrength");
    td.when(getCurrentSignalStrength("wlxf81a671a3127")).thenReturn.apply(null, rssiValues);

    count(true);
}
