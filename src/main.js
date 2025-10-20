import './style.css'

import {javascript} from "@codemirror/lang-javascript";
import {EditorView, basicSetup} from "codemirror";

// client stuff
import {setupClient} from "./client.js"

// device handling ...
import {_beatbox8} from  "./beatbox8.js"
import {_heisenberg} from  "./heisenberg.js"
import {_pulverisateur} from  "./pulverisateur.js"
import {_space} from  "./space.js"
import {_bassline} from  "./bassline.js"

import imgUrl from './at-transparent.png'

document.querySelector('#app').innerHTML = `
  <div>    
    <h1><img src="${imgUrl}" width="80px"></img> - script</h1>
    <h2>Live-code with <a href="https://beta.audiotool.com">Audiotool</a>!</h2>
    <div class="settings">
      <label for="pat">Personal Access Token</label>
      <input type="text" id="pat" name="pat" size="40" value=""/>
      <label for="project">Project</label>
    <input type="text" id="project" name="project" size="40" value="">
    </div>
    <div class="card">
      <button id="setup_client" type="button">Connect</button>
      <button id="eval_code" type="button">Eval Code</button>
    </div>
    <h3>Read, Set, Code!!</h3>
    <div id="code-editor"></div>
    <div>Pattern Syntax (use capital letters for accent):<br>
        o -> kick<br>
        x -> snare<br>
        c -> clap<br>
        - -> pause<br>
    </div>
  </div>
`

// global state

// global info, nexus state, etc
var globals = {};

// device data
var devices = {};

// async execution queues 
var queues = {};

// create editor
const view = new EditorView({
    doc: "Start document",
    parent: document.getElementById('code-editor'),
    extensions: [
	basicSetup,
	javascript({typescript: true})
    ]
})

// set initial content
view.dispatch({changes: {
    from: 0,
    to: view.state.doc.length,
    insert: 'beatbox8("hi").pattern("x-o-x-o-C-C-C-O-")'
}})

// setup buttons
document.querySelector('#setup_client').onclick = function() { setupClient(globals) }
document.querySelector('#eval_code').onclick = async function(){ await evalCode() }

// evaluate the code from the textarea
async function evalCode() {
    if (!globals.nexus) {
	console.error("[at-script] NOT CONNECTED");
	return;
    }
    
    console.log("[at-script] eval code");

    eval(view.state.doc.toString());

    // execute the device updates
    // do it here so the order is observed (i.e. updates after creation)
    for (const [key, device] of Object.entries(devices)) {
	device._update();
    }
    
    // execute the async chains
    for (const [key, queue] of Object.entries(queues)) {
	console.log("[at-script] execute update queue for " + key);
	var n_fun = queue.length;
	for (var i = 0; i < n_fun; i++) {
	    await queue.shift()();
	}		    
    }
}

// LANGUAGE FUNCTIONS

// DEVICES
function beatbox8(devName) {
    return _beatbox8(devName, globals, devices, queues);
}

function pulv(devName) {
    return _pulverisateur(devName, globals, devices, queues);
}

function heisenberg(devName) {
    return _heisenberg(devName, globals, devices, queues);
}

function space(devName) {
    return _space(devName, globals, devices, queues);
}

function bassline(devName) {
    return _bassline(devName, globals, devices, queues);
}










