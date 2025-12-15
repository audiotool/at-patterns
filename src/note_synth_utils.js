import {notesFromString} from "./utils.js";
import {lshift, rshift, reverse, palindrome} from "./string_operations.js"
import { getOrCreateChannel } from "./connection.js"

export async function createSynth(device, globals) {
    
    await globals.nexus.modify((t) => {
	// create a noteSynth
	const noteSynth = t.create(device.synthType, {
	    position_x: Math.round(Math.random() * 1000),
	    position_y: Math.round(Math.random() * 1000),
	});
	
	// get or create a free channel, connect 
	let channelInputLocation = getOrCreateChannel(t);		
	t.create("desktopAudioCable", {
	    fromSocket: noteSynth.fields.audioOutput.location,
	    toSocket: channelInputLocation,
	})
	
	// create note track, collection. region ...
	const noteTrack = t.create("noteTrack", {
	    player: noteSynth.location,
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
	    collection: noteCollection.location,
	})

	// keep the IDs so we can fill the pattern later on ...
	device.noteCollectionId = noteCollection.id;
	device.noteCollectionLocation = noteCollection.location;
	device.noteIds = [];
	
	device.id = noteSynth.id;
    });
    
    return device;
}

export async function updateSynthNotes(device, globals) {    
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
	device.transposeBy ?? 0,
	device.durationModifier ?? 1,
    );
    
    await globals.nexus.modify((t) => { 
	noteEntities.forEach((n) => {
	    let nc = t.create("note", n);
	    device.noteIds.push(nc.id);
	})
    });
}

export async function updateSynthPreset(device, globals) {

    // nothing to do ...
    if (device.presetName === "") {
	return;
    }
    
    const presets = await globals.client.api.presets.list(
	// entity type to find a preset for. Not all entities are supported.
	device.synthType,
	// optional text search for the name of the preset
	device.presetName,
    );
    
    const synthPreset = presets[0] ?? throw_("no preset found")
    
    await globals.nexus.modify((t) => {
	let synth = t.entities.getEntity(device.id);
	t.applyPresetTo(synth, synthPreset);
    });
}

export function populateNoteSynth(device) {
    ///////////
    // RESET //
    ///////////
    
    device._reset = function() {
	device.noteString = "";
	device.effectiveNoteString = null;
	device.presetName = "";
	device.transposeBy = 0;
	device.durationModifier = 1;
    }
    
    ///////////////////////////
    // SYNTH PRESET INTERFACE //
    ///////////////////////////
    
    // create a callback to evaluate the pattern string        
    device.preset = function(preset) {
	device.presetName = preset;
	
	// pass on device for function chaining
	return device;
    }

    //////////////////////////
    // SYNTH NOTES INTERFACE //
    //////////////////////////

    device.notes = function(notes) {
	device.noteString = notes;
	
	// pass on device for function chaining
	return device;
    }

    // reverse notes
    device.reverse = function() {	    
	device.effectiveNoteString = reverse(device.effectiveNoteString ?? device.noteString, " ");	
		
	return device;
    }

    // shift left
    device.lshift = function(n) {
	device.effectiveNoteString = lshift(device.effectiveNoteString ?? device.noteString, " ", n);
		
	return device;
    }

    // shift right
    device.rshift = function(n) {
	device.effectiveNoteString = rshift(device.effectiveNoteString ?? device.noteString, " ", n);	
		
	return device;
    }

    // transpose by semitones
    device.transpose = function(n) {
	device.transposeBy = n;
	
	return device;
    }

    // create palindrome from pattern
    device.palindrome = function(n) {
	device.effectiveNoteString = palindrome(device.effectiveNoteString ?? device.noteString, " ", n);	

	return device;
    }

    // twice as fast
    device.doubletime = function() {
	device.durationModifier *= 0.5;
	
	return device;
    }

    // twice as fast
    device.halftime = function() {
	device.durationModifier *= 2;
	
	return device;
    }

    // twice as fast
    device.modtime = function(fact) {
	device.durationModifier *= fact;
	
	return device;
    }
}

export async function cloneNoteSynth(device, devices, queues, globals, cls) {
    let newName = device.name + "_clone";

    if (devices[newName]) {
	console.log("[at-patterns] " + device.synthType + " CLONE with name " + newName + " already exists!")
	// update clone instead of reset ...
	devices[newName].presetName = device.presetName;
	devices[newName].noteString = device.noteString;
	devices[newName].effectiveNoteString = device.effectiveNoteString;
	devices[newName].transposeBy = device.transposeBy;
	devices[newName].durationModifier = device.durationModifier;
		
	cls(devices[newName]);
	
	await updateSynthPreset(devices[newName], globals);
	await updateSynthNotes(devices[newName], globals);
	
    } else {
	console.log("[at-patterns] create " + device.synthType + " CLONE with name " + newName);

	var newDevice = {
	    name: newName,
	    synthType: device.synthType,
	    presetName: device.presetName,
	    noteString: device.noteString,
	    effectiveNoteString: device.effectiveNoteString,
	    transposeBy: device.transposeBy,
	    durationModifier: device.durationModifier,
	};
	
	var newQueue = [];
	
	await createSynth(newDevice, globals);

	const _update = async function() {
	    await updateSynthPreset(newDevice, globals);
	    await updateSynthNotes(newDevice, globals);
	};
		
	// generate the main language interface for new device
	populateNoteSynth(newDevice);

	// create clone function
	newDevice.clone = function(cls2) {	
	    newQueue.push(async function() {
		cloneNoteSynth(newDevice, devices, queues, globals, cls2);
	    });
	    
	    // NEW device gets passed through
	    return newDevice;
	}

	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	newDevice._update = function() {
	    newQueue.push(_update);
	}
	
	// transfer relevant data 
	devices[newName] = newDevice;
	queues[newName] = newQueue;
	
	cls(newDevice);
	
	// initial update 
	await _update();

	return newDevice;
    }                
}
