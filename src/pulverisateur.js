import {notesFromString} from "./utils.js";

// DEVICE CONSTRUCTOR
export function _pulverisateur(devName, globals, devices, queues) {

    // create device queues            
    if (devices[devName]) {
	console.log("[at-script] pulverisateur with name " + devName + " already exists!")
	return devices[devName];	
    } else {		
	console.log("[at-script] create pulverisateur with name " + devName);
	
	var device = {};
	var queue = [];

	device.name = devName;
	
	queue.push(async function() {
	    return createPulverisateur(devName, device, globals)	    
	});

	// EVERY DEVICE NEEDS TO IMPLEMENT THIS
	device._update = async function(device, globals) {
	    await updatePulverisateurPreset(device, globals);
	    await updatePulverisateurNotes(device, globals);
	}

	///////////
	// CLONE //
	///////////

	// not sure yet how to do a generic way for that ... 
	
	device.clone = function(cls) {
	    let newName = device.name + "_clone";
	    let cloneDev = _pulverisateur(newName, globals, devices, queues);

	    // transfer relevant data 
	    cloneDev.preset = device.preset;
	    cloneDev.noteString = device.noteString;
	    
	    queue.push(async function() {		
		await cloneDev._update(device, globals);		
	    })
	    
	    cls(cloneDev);
	}
	
	///////////////////////////
	// PULV PRESET INTERFACE //
	///////////////////////////
	
	// create a callback to evaluate the pattern string        
	device.preset = function(preset) {
	    device.presetName = preset;
	    
	    // ASYNC PART FOR NEXUS MODIFICATION, executed later
	    queue.push(async function() {		
		await device._update(device, globals);		
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
		await device._update(device, globals);		
	    })

	    // pass on device for function chaining
	    return device;
	}
	
	devices[devName] = device;
	queues[devName] = queue;	
    }

    // pass on device for function chaining
    return device
}

async function createPulverisateur(devName, device, globals) {
    
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
	});
	
	const noteCollection = t.create("noteCollection", {})
	const noteRegion = t.create("noteRegion", {
	    track: noteTrack.location,
	    region: {
		colorIndex: 0,
		positionTicks: 0,
		durationTicks: 15360 * 2 ,
		loopDurationTicks: 15360 * 2,
		loopOffsetTicks: 0,
		enabled: true,
		displayName: devName + "Notes",
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
    await globals.nexus.modify((t) => { 
	device.noteIds.forEach((i) => t.remove(i));
	device.noteIds = []
    });

    // create new notes
    var noteEntities = notesFromString(device.noteString, device.noteCollectionLocation);
    await globals.nexus.modify((t) => { 
	noteEntities.forEach((n) => {
	    let nc = t.create("note", n);
	    device.noteIds.push(nc.id);
	})
    });
}
