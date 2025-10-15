import {lshift, rshift, reverse} from "./string_operations.js"

// DEVICE CONSTRUCTOR
export function _beatbox8(devName, globals, devices, queues) {

    // create device queues            
    if (devices[devName]) {
	console.log("[at-script] beatbox8 with name " + devName + " already exists!")
	devices[devName]._reset();
	return devices[devName];	
    } else {		
	console.log("[at-script] create beatbox8 with name " + devName);
	
	var device = {};
	var queue = [];

	device.name = devName;
	
	queue.push(async function() {
	    return createBeatbox8(device, globals)	    
	});

	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	const _update = async function() {
	    await updateBeatbox8Pattern(device, globals);
	};

	populate_beatbox8(device, queue, _update);

	///////////
	// CLONE //
	///////////

	// not sure yet how to do a generic way for that ... 		
	device.clone = function(cls) {
	    queue.push(async function () {
		clone_beatbox8(device, devices, queues, globals, cls);
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

async function clone_beatbox8(device, devices, queues, globals, cls) {
    let newName = device.name + "_clone";

    if (devices[newName]) {
	console.log("[at-script] beatbox8 CLONE with name " + newName + " already exists!")
	// update clone instead of reset ...
	devices[newName].rawPattern = device.rawPattern;
	devices[newName].effectivePattern = device.effectivePattern;
	
	await updateBeatbox8Pattern(devices[newName], globals);
	
	cls(devices[newName]);
	
    } else {
	console.log("[at-script] create beatbox8 CLONE with name " + newName);

	var newDevice = {
	    name: newName,	    
	    effectivePattern: device.effectivePattern,
	    rawPattern: device.rawPattern,
	};
	
	var newQueue = [];
	
	await createBeatbox8(newDevice, globals);

	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	const _clone_update = async function() {
	    await updateBeatbox8Pattern(newDevice, globals);
	}

	// generate the main language interface for new device
	populate_beatbox8(newDevice, newQueue, _clone_update);

	// create clone function
	newDevice.clone = function(cls2) {	
	    newQueue.push(async function() {
		clone_beatbox8(newDevice, devices, queues, globals, cls2);
	    });
	    
	    // NEW device gets passed through
	    return newDevice;
	}

	// transfer relevant data 
	devices[newName] = newDevice;
	queues[newName] = newQueue;

	// initial update 
	await _clone_update();
	
	cls(newDevice);	
    }
}

function populate_beatbox8(device, queue, _update) {
    ////////////////////
    // RESET FUNCTION //
    ////////////////////
    
    device._reset = function() {
	device.rawPattern = "";
	device.effectivePattern = null;
    }
    
    /////////////////////////////////
    // BEATBOX 8 PATTERN INTERFACE //
    /////////////////////////////////
    
    // create a callback to evaluate the pattern string        
    device.pattern = function(pattern) {
	device.rawPattern = pattern;
	
	// ASYNC PART FOR NEXUS MODIFICATION, executed later
	queue.push(async function() {		
	    await _update();		
	})

	// pass on device for function chaining
	return device;
    }

    // shift the pattern right by n steps
    device.rshift = function(n) {	    
	device.effectivePattern = rshift(device.effectivePattern ?? device.rawPattern, "", n);	
	
	// ASYNC PART FOR THE NEXUS MODIFICATION, executed after eval
	queue.push(async function() {	
	    await _update();
	});

	// pass on device for function chaining
	return device;
    }

    // shift the pattern left by n steps
    device.lshift = function(n) {
	device.effectivePattern = lshift(device.effectivePattern ?? device.rawPattern, "", n);	
	
	// ASYNC PART FOR THE NEXUS MODIFICATION, executed after eval
	queue.push(async function() {	
	    await _update();
	});

	// pass on device for function chaining
	return device;
    }

    // shift the pattern left by n steps
    device.reverse = function(n) {
	device.effectivePattern = reverse(device.effectivePattern ?? device.rawPattern, "");	
	
	// ASYNC PART FOR THE NEXUS MODIFICATION, executed after eval
	queue.push(async function() {	
	    await _update();
	});

	// pass on device for function chaining
	return device;
    }
}

// INNER FUNCTIONS
async function createBeatbox8(device, globals) {
    
    await globals.nexus.modify((t) => {
	// create a beatbox8
	const beatbox8 = t.create("beatbox8", {});

	// this creates an (empty) pattern for the beatbox8
	const beatbox8pattern = t.create("beatbox8Pattern", {
	    // patterns point to a "pattern slot", an empty field in an array. Here we attach it to slot 1. There can be
	    // at most 1 pattern per slot. 
	    slot: beatbox8.fields.patterns.array[0].location,	
	});
	
	// this places the beatbox on the desktop (random location)
	let x =
	    t.create("desktopPlacement", {
		entity: beatbox8.location,
		x: Math.round(Math.random() * 1000),
		y: Math.round(Math.random() * 1000),
	    });

	// connect the beatbox to the first channel that doesn't have
	// something pointing to its audio input
	const firstFreeChannel = t.entities
	      .ofTypes("mixerChannel")
	      .get()
	      .filter(
		  (channel) =>
		  t.entities.pointingTo
		      .locations(channel.fields.audioInput.location)
		      .get().length === 0
	      )[0];

	// as for this example we expect a free channel to be there on the given
	// project
	if (firstFreeChannel === undefined) {
	    console.error("[at-script] can't create device, no free channel")
	}
	
	t.create("audioConnection", {
	    fromSocket: beatbox8.fields.audioOutput.location,
	    toSocket: firstFreeChannel.fields.audioInput.location,
	})

	// keep the IDs so we can fill the pattern later on ...
	device.id = beatbox8.id;
	device.pattern_id = beatbox8pattern.id;
    });
    
    return device;
}

// parse the string and update the pattern
async function updateBeatbox8Pattern(device, globals) {
    await globals.nexus.modify((t) => {
	// pattern "parser" ...
	let finalPattern = device.effectivePattern ?? device.rawPattern;
	
	let chars = finalPattern.split("");	    
	let pat = t.entities.getEntity(device.pattern_id);

	// update the pattern length
	t.update(pat.fields.length, chars.length);

	// update the pattern steps according to the characters in the string
	chars.forEach((c,i) => {	    
	    switch (c) {
	    case 'x':  {		    
		t.update(pat.fields.steps.array[i].fields.accent, false);

		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[0], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[1], true);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[2], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[3], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[4], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[5], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[6], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[7], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[8], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[9], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[10], false);
		
		break;
	    }
	    case 'o': {
		t.update(pat.fields.steps.array[i].fields.accent, false);

		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[0], true);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[1], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[2], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[3], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[4], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[5], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[6], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[7], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[8], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[9], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[10], false);
		break;
	    }
	    case 'X': {
		t.update(pat.fields.steps.array[i].fields.accent, true);

		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[0], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[1], true);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[2], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[3], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[4], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[5], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[6], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[7], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[8], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[9], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[10], false);
		break;
	    }
	    case 'O': {
		t.update(pat.fields.steps.array[i].fields.accent, true);

		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[0], true);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[1], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[2], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[3], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[4], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[5], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[6], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[7], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[8], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[9], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[10], false);
		break;
	    }
	    case 'C': {
		t.update(pat.fields.steps.array[i].fields.accent, true);

		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[0], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[1], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[2], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[3], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[4], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[5], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[6], true);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[7], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[8], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[9], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[10], false);
		break;
	    }
	    case 'c': {
		t.update(pat.fields.steps.array[i].fields.accent, false);

		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[0], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[1], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[2], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[3], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[4], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[5], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[6], true);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[7], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[8], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[9], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[10], false);
		break;
	    }
	    case '-': {
		t.update(pat.fields.steps.array[i].fields.accent, false);

		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[0], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[1], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[2], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[3], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[4], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[5], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[6], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[7], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[8], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[9], false);
		t.update(pat.fields.steps.array[i].fields.activeInstruments.array[10], false);
		break;
	    }				
	    default: console.log(c)
	    }
	});	    	    	    	    	    
    });	
}
