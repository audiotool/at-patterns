# at-patterns - Live-Coding Audiotool with JavaScript

Originally a contribution to our little, internal Nexus SDK hackathon.

You can select presets and play notes, and play around with the sequences in a pattern-oriented manner.

Once we can access time information through the Nexus API, things will REALLY start to become interesting
because then we might be able to add time-based modifications (i.e. "every 2 bars, reverse the pattern").

## Techincal Details

* Vite with Vanilla JS
* single-page application

## Running: 

* clone this repo
* run `npm install @audiotool/nexus`
* run `npm install` 
* run `npm run dev` 

## Random Ideas:

* reduce number of updates to make it snappier 
* a post window to show preset query results, errors, etc
* a preset browser, `listPresets("space")` -> postWindow etc ...
* a device browser, `listDevices()` -> postWindow
* `playLoop` to play a loop of various length (if that is available at some point)
* parameter automation pattern as pattern ?
* note region length of device note regions 
