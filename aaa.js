//var exec = require('exec');
const execSync = require('child_process').execSync;
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
        return avg
    }, 2000)

}

function count() {
    var counter = 0;

    var isVehiclePassing = false;

    setInterval(function()
    {
        var currentSignalStrength = getCurrentSignalStrength();

        //console.log("aaaa currentSignalStrength", currentSignalStrength.toString());

        if(currentSignalStrength > signalStrengthWithoutNoise )
        {
            isVehiclePassing = true;
            //console.log("Low signal strength!!!");
        }
        if (currentSignalStrength <= signalStrengthWithoutNoise && isVehiclePassing === true)
        {
            //console.log("counter++");
            counter++;
            isVehiclePassing = false;
        }
    }, 50);

    setInterval(function ()
    {
        console.log("counter: ", counter);
    }, 500)
}
