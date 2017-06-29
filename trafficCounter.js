var fs = require('fs');
var program = require('commander');
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
var utils = require("./utils.js");

// Configuration
var threshold = 8;
var apName = "wlxf81a671a3127";
var minimumTimePeriodBetweenPassingVehicles = 200;

program
    .version('0.0.1')
    .option('-k, --calibrate', 'calibrate program')
    .option('-c, --count', 'count vehicles');
    //.option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
program.on('--help', function() {
    console.log("Run --calibrate when there are no vehicles.");
    console.log("It will take a few seconds to proceed.");
})
    .parse(process.argv);

if(program.calibrate) utils.calibrate(apName);
if(program.count) count();

function count() {
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
        "fast motorcycle": 0,
        "match": 0
    };
    var occupancy = 0; // total time
    var isVehiclePassing = false;

    var signalStrengthWithoutNoise = Number(fs.readFileSync("calibrationResult").toString());
    var whenProgramStarted = new Date();
    var filePathAndName = "results/" + utils.printDateAndTime(whenProgramStarted).replace(/:/g, "_");
    var filePathAndNameDebug = filePathAndName + " DEBUG";
    var initialInfo = "Counting started at " + utils.printDateAndTime(whenProgramStarted) +
        "\nCalibration value (average no vehicle signal strength) is " +
        signalStrengthWithoutNoise + "dBm" + "\nThreshold value is " + threshold + " dBm\n\n";
    console.log(initialInfo);

    fs.writeFile(filePathAndName, initialInfo);
    fs.writeFile(filePathAndNameDebug, initialInfo);

    function logThatUserDetected(vehicle) {
        console.log("You detected a " + vehicle + "!");
        var tNow = new Date();
        fs.appendFileSync(filePathAndName, utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!\n");
        fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!\n");

        if(isVehiclePassing) {
            console.log("Match!");
            userDetectionResults["match"]++;
        }
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

    function checkIsVehiclePassing(currentSignalStrength, tNow) {
        return currentSignalStrength <= signalStrengthWithoutNoise - threshold &&
            tNow - momentWhenVehiclePassed > minimumTimePeriodBetweenPassingVehicles;
    }

    // Below value is initialized with time when program started to allow count a first vehicle.
    var momentWhenVehiclePassed = whenProgramStarted;
    var momentWhenVehicleAppeared;
    setInterval(function()
    {
        var tNow = new Date();
        var currentSignalStrength = utils.getCurrentSignalStrength(apName);

        //console.log("aaaa currentSignalStrength", currentSignalStrength.toString());

        if(checkIsVehiclePassing(currentSignalStrength, tNow)) {
            if(!isVehiclePassing) {
                momentWhenVehicleAppeared = tNow;
                console.log(utils.printDateAndTime(momentWhenVehicleAppeared) + " Vehicle is passing!");
            }
            isVehiclePassing = true;
        }
        if (currentSignalStrength > signalStrengthWithoutNoise - threshold && isVehiclePassing === true) {
            vehicleCounter++;
            momentWhenVehiclePassed = new Date();
            var timeOfPassing = momentWhenVehiclePassed - momentWhenVehicleAppeared;
            var vehicleInfo = utils.printDateAndTime(tNow) + " Vehicle passed!" +
                " Time of passing: " + timeOfPassing + " ms.\n";
            fs.appendFileSync(filePathAndName, vehicleInfo);
            fs.appendFileSync(filePathAndNameDebug, vehicleInfo);
            console.log(vehicleInfo + "Vehicle counter: " + vehicleCounter + "\n");
            isVehiclePassing = false;
            occupancy += timeOfPassing;
        }

        fs.appendFileSync(filePathAndNameDebug, utils.printDateAndTime(tNow) + " " + currentSignalStrength + "\n");
    }, 10);
}

exports.count = count;
