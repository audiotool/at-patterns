function isCharNumber(c) {
    return c >= '0' && c <= '9';
}

export function restDurationFromString(rest) {
    var splitRest = rest.split(":");

    var restDuration = 15360 / parseInt(splitRest[1]);

    return restDuration;
}

// c4:4 -> c, octave 4, quarter note 
export function noteFromString(note) {
    var splitNote = note.split(":");

    var duration = 15360 / parseInt(splitNote[1]);

    var noteName = [];
    var octave = [];

    var splitFirst = splitNote[0].split("");

    var i = 0;
    for (i = 0; i < splitFirst.length; i++) {
	if (!isCharNumber(splitFirst[i])) {
	    noteName.push(splitFirst[i])
	} else {
	    octave.push(splitFirst[i])
	}
    }
    var octaveNum;
    if (octave.length === 0) {
	octaveNum = 4;
    } else {
	octaveNum = parseInt(octave.join(""));
    }
        
    var base = 12;
    var mod = 0;
    switch (noteName.join("")) {
    case "c": mod = 0; break;
    case "c#": mod = 1; break;
    case "db": mod = 1; break;
    case "d": mod = 2; break;
    case "d#": mod = 3; break;
    case "eb": mod = 3; break;
    case "e": mod = 4; break;
    case "f": mod = 5; break;
    case "f#": mod = 6; break;
    case "gb": mod = 6; break;
    case "g": mod = 7; break;
    case "g#": mod = 8; break;
    case "a": mod = 9; break;
    case "a#": mod = 10; break;
    case "bb": mod = 10; break;
    case "b": mod = 11; break;
	
    default: console.log("invalid note name");
    }
    
    const noteNum = base * octaveNum + mod;

    return {
	//noteCollection: noteCollection.location,
	positionTicks: 0,
	durationTicks: duration,
	pitch: noteNum,
	velocity: 1,
    };
    
}

export function notesFromString(notes, location, transpose, durMod) {
    const singleNotes = notes.split(" ");

    var noteEntities = [];
    var pos = 0;
    
    singleNotes.forEach((n) => {
	// rest
	if (n.startsWith("r")) {
	    pos += restDurationFromString(n) * durMod;	    
	} else {
	    var noteEntity = noteFromString(n);	    
	    noteEntity.pitch = noteEntity.pitch + transpose;
	    noteEntity.noteCollection = location;
	    noteEntity.positionTicks = pos;
	    noteEntity.durationTicks = Math.floor(noteEntity.durationTicks * durMod);
	    pos += noteEntity.durationTicks;
	    noteEntities.push(noteEntity);
	}
    })

    return noteEntities;
}
