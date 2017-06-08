//var exec = require('exec');
const execSync = require('child_process').execSync;
var fs = require('fs');
var program = require('commander');
var datetime = new Date();

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
    return parseFloat(execSync('./wifi-scan-station wlxf81a671a3127').toString());
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
    var counter = 0;

    var isVehiclePassing = false;
    var signalStrengthWithoutNoise = parseFloat(fs.readFileSync("calibrationResult").toString());
    var t = new Date();
    var filePathAndName = "results/" + t.toDateString() + " " + t.getUTCHours() + " " + t.getUTCMinutes() + " " + t.getUTCSeconds();
    console.log("Average no vehicle signal strength is: ", signalStrengthWithoutNoise);
    fs.writeFile(filePathAndName,
        "Counting started at " + t + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm", function(err) {
        if(err) {
            return console.log(err);
        }
        });


    fs.writeFile(filePathAndName + " DEBUG",
        "Counting started at " + t + "\nCalibration value is " + signalStrengthWithoutNoise + "dBm", function(err) {
            if(err) {
                return console.log(err);
            }
        });
    setInterval(function()
    {
        var tNow = new Date();
        var currentSignalStrength = getCurrentSignalStrength();

        console.log("aaaa currentSignalStrength", currentSignalStrength.toString());
        fs.appendFileSync(filePathAndName + " DEBUG", "\n" + tNow + tNow.getUTCMilliseconds() + " " + currentSignalStrength);

        if(currentSignalStrength > signalStrengthWithoutNoise - 5)
        {
            isVehiclePassing = true;
            //console.log("Low signal strength!!!");
        }
        if (currentSignalStrength <= signalStrengthWithoutNoise - 5 && isVehiclePassing === true)
        {
            //console.log("counter++");
            counter++;
            fs.appendFileSync(filePathAndName, "\n" + tNow + " Vehicle detected !");
            fs.appendFileSync(filePathAndName + " DEBUG", "\n" + tNow + tNow.getUTCMilliseconds() + " Vehicle detected !");
            isVehiclePassing = false;
        }
    }, 50);

    setInterval(function ()
    {
        console.log("counter: ", counter);
    }, 500)
}
