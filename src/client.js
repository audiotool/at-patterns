import { createAudiotoolClient } from "@audiotool/nexus";
import { createArrayTyped, getLoginStatus } from "@audiotool/nexus/utils";

// setup the client
export async function setupClient(globals) {
    
    // Create client and set authentication
    console.log("[at-patterns] setup client");

    //var pat = document.getElementById('pat').value;
    var project = document.getElementById('project').value;

    // check if current tab is logged in for some user
    const status = await getLoginStatus({
	clientId: "b2bbd30e-2a6d-432f-b7eb-6897c09565fb",
	redirectUrl: "http://127.0.0.1:5173/",
	scope: "project:write",
    });
     
    // if user isn't logged in, create a login button and wait
    if (!status.loggedIn) {
	console.log("[at-patterns] not logged in!");	
	document.querySelector('#login_status').textContent = "Please log in!"
	document.querySelector('#login_button').onclick = function(){ status.login(); };
	await new Promise(() => {}) // wait forever  
    } else {
	console.log("[at-patterns] logged in!");
	document.querySelector('#login_status').textContent = "Connected & Logged in!"
    }

    console.log("[at-patterns] setup client");

    // Create an audiotool client authorized with the current user
    globals["client"] = await createAudiotoolClient({
	authorization: status
    })
    
    console.log("[at-patterns] client ready!");
    
    globals["nexus"] = await globals.client.createSyncedDocument({
	mode: "online",
	// Open the project, copy the URL, paste here
	project: "https://beta.audiotool.com/studio?project=" + project,
    })

    console.log("[at-patterns] connected to project");
    
    // Start syncing
    await globals.nexus.start()    
}
