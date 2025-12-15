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
    <div id="header">

      <div id="headings">
        <h1><img src="${imgUrl}" width="12px"></img> - patterns</h1>
      </div>

      <div id="config">      
        <label for="project">Project ID</label>
        <input type="text" id="project" name="project" size="40" value="">
        <button id="setup_client" type="button">Connect</button>
        <button id="login_button" type="button">Login</button>
        <span id="login_status">Please connect to project!</span>
      </div>
   
    </div> 

    <br/>

    <div id="editor">
      <h2 id="editor_header">Code Editor</h2>
      <button id="eval_code" type="button">Evaluate Code</button>
      <div id="code-editor"></div>     
    </div>

    <br/>

    <div id="documentation">
        <h2>Live-code with <a href="https://beta.audiotool.com">Audiotool</a>!</h2>
        <div class="example-card">
            <strong>How to use:</strong>
              <br>1.) Open empty project in Audiotool!
              <br>2.) Enter project id above & connect (login if needed)!
              <br>3.) Loop first bar of project & start playback!
              <br>4.) Code!

        </div>
        <div class="example-card">        
          <strong>Available devices:</strong>
            <br><span class="code-example">pulv</span>
            <br><span class="code-example">space</span>
            <br><span class="code-example">heisenberg</span>
            <br><span class="code-example">beatbox8</span>
            <br><span class="code-example">bassline</span>
        </div>
        <div class="example-card">
           <strong>Pattern Syntax</strong> (use capital letters for accent):<br>
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
    insert: '// play a pattern on a beatbox8\nbeatbox8("hi").pattern("x-o-x-o-C-C-C-O-")\n\n// select a pulv preset and play some notes\npulv("ha").preset("Trance Keys").notes("a4:4 c4:4 e4:4 a4:4")\n\n'
}})

// setup buttons
document.querySelector('#setup_client').onclick = function() { setupClient(globals) }
document.querySelector('#eval_code').onclick = async function(){ await evalCode() }

// evaluate the code from the textarea
async function evalCode() {
    if (!globals.nexus) {
	console.error("[at-patterns] NOT CONNECTED");
	return;
    }
    
    console.log("[at-patterns] eval code");

    eval(view.state.doc.toString());

    // execute the device updates
    // do it here so the order is observed (i.e. updates after creation)
    for (const [key, device] of Object.entries(devices)) {
	device._update();
    }
    
    // execute the async chains
    for (const [key, queue] of Object.entries(queues)) {
	console.log("[at-patterns] execute update queue for " + key);
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
