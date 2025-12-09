import { createAudiotoolClient } from "@audiotool/nexus";
import { createArrayTyped } from "@audiotool/nexus/utils";

// setup the client
export async function setupClient(globals) {
    console.log("[at-patterns] setup client");
    // Create client and set authentication

    var pat = document.getElementById('pat').value;
    var project = document.getElementById('project').value;    
    
    globals["client"] = await createAudiotoolClient({
	pat: pat,
    });
    
    console.log("[at-patterns] authenticated");
    
    globals["nexus"] = await globals.client.createSyncedDocument({
	mode: "online",
	// Open the project, copy the URL, paste here
	project: "https://beta.audiotool.com/studio?project=" + project,
    })

    console.log("[at-patterns] connected to project");
    
    // Start syncing
    await globals.nexus.start()    
}
