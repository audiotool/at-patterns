export function getOrCreateChannel(t) {
    // get the first channel that doesn't have
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

    // if no channel exists, create one 
    if (firstFreeChannel === undefined) {
	console.log("[at-patterns] no free channel, create one");
	const mc = t.create("mixerChannel", {});
	return mc.fields.audioInput.location;
    } else {
	return firstFreeChannel.fields.audioInput.location;
    }
    
}
