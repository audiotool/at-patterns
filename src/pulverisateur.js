import {notesFromString} from "./utils.js";
import {lshift, rshift, reverse} from "./string_operations.js"

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
	};
	var queue = [];
	
	queue.push(async function() {
	    return createPulverisateur(device, globals)	    
	});
	
	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	const _update = async function() {
	    await updatePulverisateurPreset(device, globals);
	    await updatePulverisateurNotes(device, globals);
	}

	// generate the main language interface 
	populate_pulverisateur(device, queue, _update);
	
	///////////
	// CLONE //
	///////////

	// not sure yet how to do a generic way for that ... 	
	device.clone = function(cls) {
	    queue.push(async function () {
		clone_pulverisateur(device, devices, queues, globals, cls);
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

async function clone_pulverisateur(device, devices, queues, globals, cls) {
    let newName = device.name + "_clone";

    if (devices[newName]) {
	console.log("[at-script] pulverisateur CLONE with name " + newName + " already exists!")
	// update clone instead of reset ...
	devices[newName].presetName = device.presetName;
	devices[newName].noteString = device.noteString;
	devices[newName].effectiveNoteString = device.effectiveNoteString;
	devices[newName].transposeBy = device.transposeBy;
		
	cls(devices[newName]);
	
	await updatePulverisateurPreset(devices[newName], globals);
	await updatePulverisateurNotes(devices[newName], globals);
	
    } else {
	console.log("[at-script] create pulverisateur CLONE with name " + newName);

	var newDevice = {
	    name: newName,
	    presetName: device.presetName,
	    noteString: device.noteString,
	    effectiveNoteString: device.effectiveNoteString,
	    transposeBy: device.transposeBy,
	};
	
	var newQueue = [];
	
	await createPulverisateur(newDevice, globals);

	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	const _clone_update = async function() {
	    await updatePulverisateurPreset(newDevice, globals);
	    await updatePulverisateurNotes(newDevice, globals);
	}

	// generate the main language interface for new device
	populate_pulverisateur(newDevice, newQueue, _clone_update);

	// create clone function
	newDevice.clone = function(cls2) {	
	    newQueue.push(async function() {
		clone_pulverisateur(newDevice, devices, queues, globals, cls2);
	    });
	    
	    // NEW device gets passed through
	    return newDevice;
	}

	// transfer relevant data 
	devices[newName] = newDevice;
	queues[newName] = newQueue;
	
	cls(newDevice);
	
	// initial update 
	await _clone_update();
    }                
}

function populate_pulverisateur(device, queue, _update) {
    ///////////
    // RESET //
    ///////////
    
    device._reset = function() {
	device.noteString = "";
	device.effectiveNoteString = null;
	device.presetName = "";
	device.transposeBy = 0;
    }
    
    ///////////////////////////
    // PULV PRESET INTERFACE //
    ///////////////////////////
    
    // create a callback to evaluate the pattern string        
    device.preset = function(preset) {
	device.presetName = preset;
	
	// ASYNC PART FOR NEXUS MODIFICATION, executed later
	queue.push(async function() {		
	    await _update();		
	})

	// pass on device for function chaining
	return device;
    }

    //////////////////////////
    // PULV NOTES INTERFACE //
    //////////////////////////

    device.notes = function(notes) {
	device.noteString = notes;
	
	// ASYNC PART FOR NEXUS MODIFICATION, executed later
	queue.push(async function() {		
	    await _update();		
	})

	// pass on device for function chaining
	return device;
    }

    // reverse notes
    device.reverse = function() {	    
	device.effectiveNoteString = reverse(device.effectiveNoteString ?? device.noteString, " ");	
	
	// ASYNC PART FOR THE NEXUS MODIFICATION, executed after eval
	queue.push(async function() {	
	    await _update();
	});
	
	return device;
    }

    // shift left
    device.lshift = function(n) {
	device.effectiveNoteString = lshift(device.effectiveNoteString ?? device.noteString, " ", n);
	
	// ASYNC PART FOR THE NEXUS MODIFICATION, executed after eval
	queue.push(async function() {	
	    await _update();
	});
	
	return device;
    }

    // shift right
    device.rshift = function(n) {
	device.effectiveNoteString = rshift(device.effectiveNoteString ?? device.noteString, " ", n);	
	
	// ASYNC PART FOR THE NEXUS MODIFICATION, executed after eval
	queue.push(async function() {	
	    await _update();
	});
	
	return device;
    }

    device.transpose = function(n) {
	device.transposeBy = n;

	// ASYNC PART FOR THE NEXUS MODIFICATION, executed after eval
	queue.push(async function() {	
	    await _update();
	});
	
	return device;
    }
}


async function createPulverisateur(device, globals) {
    
    await globals.nexus.modify((t) => {
	// create a pulverisateur
	const pulverisateur = t.create("pulverisateur", {});
	
	// this places the beatbox on the desktop (random location)
	let x =
	    t.create("desktopPlacement", {
		entity: pulverisateur.location,
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
	    return;
	}
	
	t.create("audioConnection", {
	    fromSocket: pulverisateur.fields.audioOutput.location,
	    toSocket: firstFreeChannel.fields.audioInput.location,
	})

	// create note track, collection. region ...
	const noteTrack = t.create("noteTrack", {
	    player: pulverisateur.location,
	    orderAmongTracks: Math.random(),
	});
	
	const noteCollection = t.create("noteCollection", {})
	const noteRegion = t.create("noteRegion", {
	    track: noteTrack.location,
	    region: {
		colorIndex: 0,
		positionTicks: 0,
		durationTicks: 15360 * 1 ,
		loopDurationTicks: 15360 * 1,
		loopOffsetTicks: 0,
		enabled: true,
		displayName: device.name + "-Notes",
	    },
	    noteCollection: noteCollection.location,
	})

	// keep the IDs so we can fill the pattern later on ...
	device.noteCollectionId = noteCollection.id;
	device.noteCollectionLocation = noteCollection.location;
	device.noteIds = [];
	
	device.id = pulverisateur.id;
    });
    
    return device;
}


async function updatePulverisateurPreset(device, globals) {

    // nothing to do ...
    if (device.presetName === "") {
	return;
    }
    
    const presets = await globals.client.api.presets.list(
	// entity type to find a preset for. Not all entities are supported.
	"pulverisateur",
	// optional text search for the name of the preset
	device.presetName,
    );
    
    const pulvPreset = presets[0] ?? throw_("no preset found")
    
    await globals.nexus.modify((t) => {
	let pulv = t.entities.getEntity(device.id);
	t.applyPresetTo(pulv, pulvPreset);	
    });
}

async function updatePulverisateurNotes(device, globals) {    
    // delete current content
    if (device.noteIds) {
	await globals.nexus.modify((t) => { 
	    device.noteIds.forEach((i) => t.remove(i));
	    device.noteIds = []
	});
    }
    
    // nothing to do ...
    if (device.noteString === "") {
	return;
    }

    // create new notes
    var noteEntities = notesFromString(
	device.effectiveNoteString ?? device.noteString,
	device.noteCollectionLocation,
	device.transposeBy ?? 0
    );
    
    await globals.nexus.modify((t) => { 
	noteEntities.forEach((n) => {
	    let nc = t.create("note", n);
	    device.noteIds.push(nc.id);
	})
    });
}
