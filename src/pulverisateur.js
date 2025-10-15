import {createSynth, populateNoteSynth, updateSynthPreset, updateSynthNotes} from "./note_synth_utils.js"

// DEVICE CONSTRUCTOR
export function _pulverisateur(devName, globals, devices, queues) {
    // create device queues            
    if (devices[devName]) {
	console.log("[at-script] pulverisateur with name " + devName + " already exists!")
	devices[devName]._reset();
	return devices[devName];	
    } else {		
	console.log("[at-script] create pulverisateur with name " + devName);
	
	var device = {
	    name: devName,
	    synthType: "pulverisateur",
	};
	var queue = [];
	
	queue.push(async function() {
	    return createSynth(device, globals)	    
	});
	
	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	const _update = async function() {
	    await updateSynthPreset(device, globals);
	    await updateSynthNotes(device, globals);
	}

	// generate the main language interface 
	populateNoteSynth(device, queue, _update);
	
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
	
	devices[devName] = device;
	queues[devName] = queue;	
    }

    // pass on device for function chaining
    return device
}











