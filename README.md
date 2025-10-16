# livecode-at - Live-Coding Audiotool with JavaScript

A contribution to our little, internal Nexus SDK hackathon.

The Idea is to be able to live-code pattern-devices with JavaScript. So far it's very limitied as you can
only live-code beatbox8 patterns.

Future Ideas could include adding effects, modifying parameters, and so on.

Once we can access time information through the Nexus API, things will REALLY start to become interesting
because then we might be able to add time-based modifications (i.e. "every 2 bars, reverse the pattern").

## Techincal Details

* Vite with Vanilla JS
* single-page application

## Running: 

* clone repo
* download nexus sdk (https://rpc.audiotool.com/dev/nexus/nexus.tgz) and place in repo's root folder
* run `npm install audiotool-nexus-0.0.4.tgz`
* run `npm install` 
* run `npm run dev` 

## Random Ideas:

* **FIND BETTER NAME**
* reduce number of updates to make it snappier 
* post window for connection state, 
* a preset browser, `listPresets("space")` -> postWindow etc ...
* a device browser, `listDevices()` -> postWindow
* `playLoop` to play a loop of various length (if that is available at some point)
* parameter automation pattern as pattern ?
* note region length of device note regions 
