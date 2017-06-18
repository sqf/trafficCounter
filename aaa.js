var fs = require('fs');
var program = require('commander');
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
var utils = require("./utils.js");

// Configuration
var threshold = 5;
var thresholdForBigVehicles = 15;
var apName = "wlxf81a671a3127";
var minimumTimePeriodBetweenPassingVehicles = 200;

program
    .version('0.0.1')
    .option('-k, --calibrate', 'Run when there are no vehicles. It will take a few seconds to proceed.')
    .option('-c, --count', 'Count vehicles')
    .option('-d, --countAndDebug', 'Count vehicles and save measurements to a file')
    //.option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
    .parse(process.argv);

if (program.calibrate) utils.calibrate(apName);
if (program.count) count();
if (program.countAndDebug) countAndDebug();

function count() {
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
    console.log("Fast means more than 40 kph.");
    console.log("Threshold for a car is set to ", threshold);
    console.log("Threshold for a big vehicle is set to ", thresholdForBigVehicles);
    var carCounter = 0;
    var bigVehicleCounter = 0;
    var isVehiclePassing = false;
    var isBigVehiclePassing = false;
    
    var signalStrengthWithoutNoise = parseFloat(fs.readFileSync("calibrationResult").toString());
    var t = new Date();
    var filePathAndName = "results/" + utils.printDateAndTime(t);
    var filePathAndNameDebug = filePathAndName + " DEBUG";
    console.log("Average no vehicle signal strength is: ", signalStrengthWithoutNoise);
    fs.writeFile(filePathAndName,
        "Counting started at " + t + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm"
        + "\nThreshold value is " + threshold + " dBm"
        + "\nThreshold value for a big vehicle is " + thresholdForBigVehicles + " dBm", function(err) {
        if(err) {
            return console.log(err);
        }
        });


    fs.writeFile(filePathAndNameDebug,
        "Counting started at " + t + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm"
        + "\nThreshold value is " + threshold + " dBm"
        + "\nThreshold value for a big vehicle is " + thresholdForBigVehicles + " dBm", function(err) {
            if(err) {
                return console.log(err);
            }
        });

    function logThatUserDetected(vehicle) {
        console.log("You detected a " + vehicle + "!");
        var tNow = new Date();
        fs.appendFileSync(filePathAndName, "\n" + utils.printDateAndTime(tNow) + " User detected a " + vehicle + "!");
        fs.appendFileSync(filePathAndNameDebug, "\n" + utils.printDateAndTime(tNow) + " User detected a " + vehicle +"!");
    }

    process.stdin.on('keypress', (str, key) => {
        switch(key.sequence) {
            case "q":
                process.exit();
            case "c":
                logThatUserDetected("car");
                break;
            case "d":
                logThatUserDetected("fast car");
                break;
            case "t":
                logThatUserDetected("truck");
                break;
            case "5":
                logThatUserDetected("fast truck");
                break;
            case "b":
                logThatUserDetected("bus");
                break;
            case "g":
                logThatUserDetected("fast bus");
                break;
            case "r":
                logThatUserDetected("bicycle");
                break;
            case "4":
                logThatUserDetected("fast bicycle");
                break;
            case "m":
                logThatUserDetected("motorcycle");
                break;
            case "j":
                logThatUserDetected("fast motorcycle");
                break;
        }
    });

    function checkisVehiclePassing(currentSignalStrength, tNow) {
        return currentSignalStrength < signalStrengthWithoutNoise - threshold &&
            tNow.getTime() - momentWhenVehiclePassed > minimumTimePeriodBetweenPassingVehicles;
    }

    // Below value is initialized with time when program started to allow count a first vehicle.
    var momentWhenVehiclePassed = t.getTime();
    setInterval(function()
    {
        var tNow = new Date();
        var currentSignalStrength = utils.getCurrentSignalStrength(apName);

        //console.log("aaaa currentSignalStrength", currentSignalStrength.toString());
        fs.appendFileSync(filePathAndNameDebug, "\n" + utils.printDateAndTime(tNow) + " " + currentSignalStrength);
        //console.log(tNow.getTime() - momentWhenVehiclePassed);

        if(checkisVehiclePassing(currentSignalStrength, tNow))
        {
            isVehiclePassing = true;
            if(currentSignalStrength < signalStrengthWithoutNoise - thresholdForBigVehicles)
                isBigVehiclePassing = true;
        }
        if (currentSignalStrength >= signalStrengthWithoutNoise - threshold && isVehiclePassing === true)
        {
            if(isBigVehiclePassing) {
                bigVehicleCounter++;
                fs.appendFileSync(filePathAndName, "\n" + utils.printDateAndTime(tNow) + " Big vehicle detected!");
                fs.appendFileSync(filePathAndNameDebug, "\n" + utils.printDateAndTime(tNow) + " Big vehicle detected!");
                console.log("Big vehicle detected!");
            } else {
                carCounter++;
                fs.appendFileSync(filePathAndName, "\n" + utils.printDateAndTime(tNow) + " Car detected!");
                fs.appendFileSync(filePathAndNameDebug, "\n" + utils.printDateAndTime(tNow) + " Car detected!");
                console.log("Car detected!");
            }

            isVehiclePassing = false;
            isBigVehiclePassing = false;
            console.log("carCounter: ", carCounter);
            console.log("bigVehicleCounter: ", bigVehicleCounter);
            momentWhenVehiclePassed = new Date().getTime();
        }
    }, 10);
}
