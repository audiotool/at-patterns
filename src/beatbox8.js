import {lshift, rshift, reverse} from "./string_operations.js"

// DEVICE CONSTRUCTOR
export function _beatbox8(devName, globals, devices, queues) {

    // create device queues            
    if (devices[devName]) {
	console.log("[at-patterns] beatbox8 with name " + devName + " already exists!")
	devices[devName]._reset();
	return devices[devName];	
    } else {		
	console.log("[at-patterns] create beatbox8 with name " + devName);
	
	var device = {};
	var queue = [];

	device.name = devName;
	
	queue.push(async function() {
	    return createBeatbox8(device, globals)	    
	});

	// EVERY DEVICE NEEDS TO IMPLEMENT THIS	

	populate_beatbox8(device);

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

	device._update = function() {
	    queue.push(async function() {
		await updateBeatbox8Pattern(device, globals);
	    });
	};
	
	devices[devName] = device;	
	queues[devName] = queue;	
    }

    // pass on device for function chaining
    return device
}

async function clone_beatbox8(device, devices, queues, globals, cls) {
    let newName = device.name + "_clone";

    if (devices[newName]) {
	console.log("[at-patterns] beatbox8 CLONE with name " + newName + " already exists!")
	// update clone instead of reset ...
	devices[newName].rawPattern = device.rawPattern;
	devices[newName].effectivePattern = device.effectivePattern;
	
	cls(devices[newName]);
	
	await updateBeatbox8Pattern(devices[newName], globals);			
    } else {
	console.log("[at-patterns] create beatbox8 CLONE with name " + newName);

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

	new_device._update = function() {
	    newQueue.push(_clone_update);
	}
	
	devices[newName] = newDevice;
	queues[newName] = newQueue;
	
	cls(newDevice);
	
	// initial update directly ...
	await _clone_update();
    }
}

function populate_beatbox8(device) {
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
	
	// pass on device for function chaining
	return device;
    }

    // shift the pattern right by n steps
    device.rshift = function(n) {	    
	device.effectivePattern = rshift(device.effectivePattern ?? device.rawPattern, "", n);	

	// pass on device for function chaining
	return device;
    }

    // shift the pattern left by n steps
    device.lshift = function(n) {
	device.effectivePattern = lshift(device.effectivePattern ?? device.rawPattern, "", n);	

	// pass on device for function chaining
	return device;
    }

    // shift the pattern left by n steps
    device.reverse = function(n) {
	device.effectivePattern = reverse(device.effectivePattern ?? device.rawPattern, "");	
	
	// pass on device for function chaining
	return device;
    }
}

// INNER FUNCTIONS
async function createBeatbox8(device, globals) {
    
    await globals.nexus.modify((t) => {
	// create a beatbox8
	const beatbox8 = t.create("beatbox8", {
	    position_x: Math.round(Math.random() * 1000),
	    position_y: Math.round(Math.random() * 1000),
	});
	
	// this creates an (empty) pattern for the beatbox8
	const beatbox8pattern = t.create("beatbox8Pattern", {
	    // patterns point to a "pattern slot", an empty field in an array. Here we attach it to slot 1. There can be
	    // at most 1 pattern per slot. 
	    slot: beatbox8.fields.patternSlots.array[0].location,	
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
	    console.error("[at-patterns] can't create device, no free channel")
	}
	
	t.create("desktopAudioCable", {
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

	    t.update(pat.fields.steps.array[i].fields.isAccented, false);
	    
	    t.update(pat.fields.steps.array[i].fields.bassdrumIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.snaredrumIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.tomCongaLowIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.tomCongaMidIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.tomCongaHighIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.rimClavesIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.clapMaracasIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.cowbellIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.cymbalIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.openHihatIsActive, false);
	    t.update(pat.fields.steps.array[i].fields.closedHihatIsActive, false);

	    switch (c) {		
	    case 'x':  {		    		
		t.update(pat.fields.steps.array[i].fields.snaredrumIsActive, true);
		break;
	    }
	    case 'o': {
		t.update(pat.fields.steps.array[i].fields.bassdrumIsActive, true);
		break;
	    }
	    case 'X': {
		t.update(pat.fields.steps.array[i].fields.isAccented, true);
		t.update(pat.fields.steps.array[i].fields.snaredrumIsActive, true);
		break;
	    }
	    case 'O': {
		t.update(pat.fields.steps.array[i].fields.isAccented, true);
		t.update(pat.fields.steps.array[i].fields.bassdrumIsActive, true);
		break;
	    }
	    case 'C': {
		t.update(pat.fields.steps.array[i].fields.isAccented, true);
		t.update(pat.fields.steps.array[i].fields.clapMaracasIsActive, true);
		break;
	    }
	    case 'c': {
		t.update(pat.fields.steps.array[i].fields.clapMaracasIsActive, true);
		break;
	    }
	    case '-': {		
		break;
	    }				
	    default: console.log(c)
	    }
	});	    	    	    	    	    
    });	
}
