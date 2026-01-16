# at-patterns Documentation

at-patterns is a small DSL for live coding audiotool. It uses a pattern-oriented paradigm inspired 
by languages like TidalCycles or Strudel. It's still WIP and a bit limited at the moment, but still
fun to play around with. Here's how it works. 

## Setup

* at-patterns needs an Audiotool project (ideally empty) open in another browser tab
* the open project should be playing and looping the first bar
* to connect the app, copy the project ID from the project tab's address line to the "Project ID" field in at-patterns and press "Connect"
* login first if you need to

## Creating a Device (and Play a Sound)

To create a device with a default preset, and play some notes, do the following:

```javascript
// create pulverisateur with name "hi"
// play some notes
pulv("hi").notes("a4:4 c4:4 e4:4 a4:4")
```

You'll see the device appear in your Audiotool project.

To play a rhythm with the beatbox8, use the `patterns` function instead of `notes`:

```javascript
beatbox8("hi").pattern("x-o-x-o-C-C-C-O-")
```

### Note Syntax 

`<noteOctave>:<duration>` -> i.e. `a4:4` has pitch a4 and a quarter note duration.

## Selecting a Preset

Use the `preset` function to select a preset:

```javascript
// create pulverisateur with name "hi"
// select preset "Trance Keys"
// play some notes
pulv("hi").preset("Trance Keys").notes("a4:4 c4:4 e4:4 a4:4")
```

## Playing with Patterns: 

There's a few functions implemented to manipulate notes & patterns. Here's an example:

The `palindrome` functions concatenates the notes with a mirrored version of itself.

```javascript
// create pulverisateur with name "hi"
// select preset "Trance Keys"
// play some notes
// apply palindrome
pulv("hi").preset("Trance Keys").notes("a4:4 c4:4 e4:4 a4:4").palindrome()
```

To squeeze it into the same bar that we're looping in our project, it makes sense to 
combine it with the `doubletime` function which speeds up the playback.

```javascript
// create pulverisateur with name "hi"
// select preset "Trance Keys"
// play some notes
// apply palindrome
pulv("hi").preset("Trance Keys").notes("a4:4 c4:4 e4:4 a4:4").palindrome().doubletime()
```

### Layering 

A popular technique in live coding is layering, where a sequence is layered (or juxtaposed) with a slightly modified 
version of itself. The `clone` functions allows us to do this in **at-patterns**:

This will create another device of the same type and preset.

```javascript

```

## Available Functions:

Some of these (as marked) currently only work on notes, not beatbox patterns ... 

* `palindrome()` -> concatenate pattern with mirrored version of itself (notes only)
* `halftime()` -> play twice as slow (notes only)
* `doubletime()` -> play twice as fast (notes only)
* `modtime(f)` -> apply factor `f` to all note durations (notes only)
* `transpose(n)` -> shift by `n` semitones (can be negative) (notes only)
* `reverse()` -> reverse pattern
* `rshift(n)` -> shift/rotate right by `n` steps
* `lshift(n)` -> shift/rotate left by `n` steps






