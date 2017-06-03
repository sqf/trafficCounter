//var exec = require('exec');
const execSync = require('child_process').execSync;
console.log("aaaajanusz");

var signalStrengthWithoutNoise = execSync('./wifi-scan-station wlo1');

console.log("signalStrengthWithoutNoise: ", signalStrengthWithoutNoise.toString());

var counter = 0;

var isVehiclePassing = false;

setInterval(function() 
{
	var currentSignalStrength = execSync('./wifi-scan-station wlo1');

	console.log("aaaa currentSignalStrength", currentSignalStrength.toString());

	if(currentSignalStrength > signalStrengthWithoutNoise )
	{
		isVehiclePassing = true;
		console.log("Low signal strength!!!");
	}
	if (currentSignalStrength <= signalStrengthWithoutNoise && isVehiclePassing === true) 
	{
		console.log("counter++");
		counter++;
		isVehiclePassing = false;
	}
}, 1000);

