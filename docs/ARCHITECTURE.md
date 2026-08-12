# Architecture

## Why it looks like this

The app is **vanilla ES5-ish JS with no build step**. That is a deliberate constraint,
not laziness: it was built on a machine with no Node, and it means the app opens by
double-clicking `index.html`, works offline, and will still run in ten years. Before
adding a framework or a bundler, read NFR-01/02 in [REQUIREMENTS.md](REQUIREMENTS.md).

Modules attach one global each (`window.Theory`, `window.Modes`, `window.Fretboard`,
`window.AudioEngine`) and are loaded in dependency order by `index.html`.

## Module map

```
index.html
  └─ css/styles.css        all styling; interval colours are CSS vars
  └─ js/theory.js   ──►  Theory     pure. the ii–V–I pivot CYCLE only
  └─ js/modes.js    ──►  Modes      pure. dromoi, spelling, progression banks
  └─ js/fretboard.js──►  Fretboard  grip finding + SVG rendering (DOM out only)
  └─ js/audio.js    ──►  AudioEngine Web Audio synth + bar transport
  └─ js/app.js      ──►  (controller) state, views, wiring. the only place
                                     that knows about both music and DOM
```

**Dependency rule:** `theory.js` and `modes.js` must never touch the DOM.
`fretboard.js` never touches audio. `app.js` is the only module allowed to know
about everything. Keeping this true is what makes the theory testable.

## The two engines

There are deliberately **two separate chord engines**, because they answer different
musical questions:

| | `theory.js` — Cycle | `modes.js` — Progressions |
|---|---|---|
| Purpose | The single ii–V–I pivot spiral | Five modal/harmonic maps × ranked progression banks |
| Voicings | Strict 4-note, fixed inversion rules (MI-02) | Root position, 3 or 4 notes |
| Voice leading | **Enforced**: exactly 2 held / 2 moved (MI-03) | Register continuity only, not asserted |
| Spelling | Legacy per-key flat/sharp table | Diatonic letter-per-degree (MI-04) |
| Tonic | Fixed 6-key path | Any of 12 |

> **Known duplication.** The two spellers should eventually be unified on
> `modes.js`'s diatonic speller. They are not yet, because `theory.js`'s table is
> pinned by the MI-07a ground truth (which uses the guitarist-friendly `B` rather
> than the strictly-correct `C♭`). Tracked as a cleanup in [BACKLOG.md](BACKLOG.md).

## Data shapes

```js
// a note inside a chord voicing
{ midi, pc, role:"b7", roleLabel:"♭7", colorGroup:"seventh", name:"C", freq }

// a chord
{ symbol:"Gm", rootName:"G", rootPc, quality:"min", degreeLabel:"4",
  notes:[...low→high], bottomMidi }

// a scale degree (Modes.scaleOf)
{ pc, off, name:"E♭", degree:"♭2", isFlavour:true, isTonic:false }

// a fret placement (Fretboard.findGrip)
{ stringIndex:0..5 /* low E = 0 */, fret:0..15, note }
```

`colorGroup` is the single source of truth for colour. It is emitted by the theory
layer and consumed as a `data-group` attribute by CSS. Never hardcode a colour in JS.

## Rendering flow

```
user action / transport tick
        │
        ▼
   app.js  state mutation
        │
        ├─► Modes.buildProgression()  or  Theory.buildCycle()[i]
        │        └─ chord {notes[]}
        │
        ├─► Fretboard.findGrip(notes, preferredPos)
        │        └─ searches every contiguous string set × every neck position,
        │           scores by  span*3 + distanceFromPreferredPosition + lowFret*0.05
        │           → most compact playable shape wins
        │
        └─► Fretboard.render(svg, {grip, scaleNotes, flavourPcs, moveClass, ...})
                 └─ full redraw (cheap: ~100 SVG nodes) then CSS animates
```

Redraw is wholesale rather than diffed. At this node count it is well under a frame,
and it removes a whole class of stale-state bugs.

## Audio

`AudioEngine` renders a **Karplus–Strong** plucked string into an `AudioBuffer`
(noise burst → averaging comb filter), cached per rounded frequency. No samples, no
library, no network.

The transport uses the standard **lookahead scheduler** pattern: a 25 ms `setInterval`
schedules audio events up to 100 ms ahead on the sample-accurate `AudioContext` clock,
and hands the caller the scheduled `when` so the UI can be synced with `setTimeout`.
Never drive audio timing from `setInterval` directly — it drifts.

## Testing

Tests live beside the logic as `selfTest()` and run **on every page load**; the header
badge shows `n/n theory tests passing`. Failures are `console.error`ed with a
want/got diff.

```js
Theory.selfTest()   // cycle: ground truth + voice-leading invariants
Modes.selfTest()    // progressions, scale spellings, MI-05, MI-06
```

There is no headless runner yet (FR-17) because the build machine has no Node. If you
add one, keep the in-browser badge — it is the fastest possible feedback while
dialling music by ear.
