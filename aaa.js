//var exec = require('exec');
const execSync = require('child_process').execSync;
var fs = require('fs');
var program = require('commander');
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

var datetime = new Date();

var threshold = 5;
program
    .version('0.0.1')
    .option('-k, --calibrate', 'Run when there are no vehicles. It will take a few seconds to proceed.')
    .option('-c, --count', 'Count vehicles')
    .option('-d, --countAndDebug', 'Count vehicles and save measurements to a file')
    //.option('-c, --cheese [type]', 'Add the specified type of cheese [marble]', 'marble')
    .parse(process.argv);

if (program.calibrate) calibrate();
if (program.count) count();
if (program.countAndDebug) countAndDebug();

function getCurrentSignalStrength() {
    return parseFloat(execSync('./wifi-scan-station wlo1').toString());i
}

function calibrate ()
{
	console.log("Calibration...");
	var noVehicleValues = [];
	var fetchNoVehicleValues = setInterval(function () {
        var currentSignalStrength = getCurrentSignalStrength();
        console.log("currentSignalStrength", currentSignalStrength);
        noVehicleValues.push(currentSignalStrength)
    }, 50);

	setTimeout(function () {
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
        return avg
    }, 2000)

}

function count() {
    console.log("Press <q> to quit.");
    console.log("Press <c> if you detected a car.");
    console.log("Press <t> if you detected a truck.");
    console.log("Press <b> if you detected a bus.");
    console.log("Press <r> if you detected a bicycle.");
    console.log("Press <m> if you detected a motorcycle.");
    var counter = 0;
    var isVehiclePassing = false;
    
    var signalStrengthWithoutNoise = parseFloat(fs.readFileSync("calibrationResult").toString());
    var t = new Date();
    var filePathAndName = "results/" + t.toDateString() + " " + t.getUTCHours() + " " + t.getUTCMinutes() + " " + t.getUTCSeconds();
    var filePathAndNameDebug = filePathAndName + " DEBUG";
    console.log("Average no vehicle signal strength is: ", signalStrengthWithoutNoise);
    fs.writeFile(filePathAndName,
        "Counting started at " + t + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm", function(err) {
        if(err) {
            return console.log(err);
        }
        });


    fs.writeFile(filePathAndNameDebug,
        "Counting started at " + t + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm", function(err) {
            if(err) {
                return console.log(err);
            }
        });

    function logThatUserDetected(vehicle) {
        console.log("You detected a " + vehicle + "!");
        var tNow = new Date();
        fs.appendFileSync(filePathAndName, "\n" + tNow + tNow.getUTCMilliseconds() + " User detected a " + vehicle + "!");
        fs.appendFileSync(filePathAndNameDebug, "\n" + tNow + tNow.getUTCMilliseconds() + " User detected a " + vehicle +"!");
    }

    process.stdin.on('keypress', (str, key) => {
        switch(key.sequence) {
            case "q":
                process.exit();
            case "c":
                logThatUserDetected("car");
                break;
            case "t":
                logThatUserDetected("truck");
                break;
            case "b":
                logThatUserDetected("bus");
                break;
            case "r":
                logThatUserDetected("bicycle");
                break;
            case "m":
                logThatUserDetected("motorcycle");
                break;
        }
    });
    setInterval(function()
    {
        var tNow = new Date();
        var currentSignalStrength = getCurrentSignalStrength();

        //console.log("aaaa currentSignalStrength", currentSignalStrength.toString());
        fs.appendFileSync(filePathAndNameDebug, "\n" + tNow + tNow.getUTCMilliseconds() + " " + currentSignalStrength);

        if(currentSignalStrength > signalStrengthWithoutNoise - threshold)
        {
            isVehiclePassing = true;
            //console.log("Low signal strength!!!");
        }
        if (currentSignalStrength <= signalStrengthWithoutNoise - threshold && isVehiclePassing === true)
        {
            //console.log("counter++");
            counter++;
            fs.appendFileSync(filePathAndName, "\n" + tNow + " Vehicle detected!");
            fs.appendFileSync(filePathAndNameDebug, "\n" + tNow + tNow.getUTCMilliseconds() + " Vehicle detected!");
            isVehiclePassing = false;
            console.log("counter: ", counter);
        }
    }, 10);
}
