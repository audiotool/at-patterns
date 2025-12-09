import {createSynth, populateNoteSynth, updateSynthPreset, cloneNoteSynth, updateSynthNotes} from "./note_synth_utils.js"

// DEVICE CONSTRUCTOR
export function _heisenberg(devName, globals, devices, queues) {
    // create device queues            
    if (devices[devName]) {
	console.log("[at-patterns] heisenberg with name " + devName + " already exists!")
	devices[devName]._reset();
	return devices[devName];	
    } else {		
	console.log("[at-patterns] create heisenberg with name " + devName);
	
	var device = {
	    name: devName,
	    synthType: "heisenberg",
	};
	var queue = [];
	
	queue.push(async function() {
	    return createSynth(device, globals)	    
	});
	
	// generate the main language interface 
	populateNoteSynth(device);
	
	///////////
	// CLONE //
	///////////

	// not sure yet how to do a generic way for that ... 	
	device.clone = function(cls) {
	    queue.push(async function () {
		cloneNoteSynth(device, devices, queues, globals, cls);
	    });
	
	    // ORIGINAL device gets passed through
	    return device;
	}

	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	device._update = function() {
	    queue.push(async function() {
		await updateSynthPreset(device, globals);
		await updateSynthNotes(device, globals);
	    });	    
	}
	
	devices[devName] = device;
	queues[devName] = queue;	
    }

    // pass on device for function chaining
    return device
}











