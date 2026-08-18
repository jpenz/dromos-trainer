# Architecture

## Why it looks like this

The app is **vanilla ES5-ish JS with no build step**. That is a deliberate constraint,
not laziness: it was built on a machine with no Node, and it means the app opens by
double-clicking `index.html`, works offline, and will still run in ten years. Before
adding a framework or a bundler, read NFR-01/02 in [REQUIREMENTS.md](REQUIREMENTS.md).

Modules attach one global each (`window.Theory`, `window.Modes`, `window.ChordMap`,
`window.ChordPath`, `window.Fretboard`, `window.AudioEngine`, `window.PitchLab`) and
are loaded in dependency order by `index.html`.

## Module map

```
index.html
  └─ css/styles.css        all styling; interval colours are CSS vars
  └─ js/profiles.js ──►  PlayerProfiles validated local learner state only
  └─ js/theory.js   ──►  Theory     pure. the ii–V–I pivot CYCLE only
  └─ js/harmony-journey.js ► HarmonyJourney shared current/next sequence model
  └─ js/modes.js    ──►  Modes      pure. dromoi, spelling, progression banks
  └─ js/chord-map.js ─►  ChordMap   pure. derived harmony + scale relationships
  └─ js/chord-path.js►  ChordPath  pure. arpeggios, connectors, successors + doors
  └─ js/triads.js   ──►  Triads     pure. inversion catalog + route optimizer
  └─ js/fretboard.js──►  Fretboard  grip finding + SVG rendering (DOM out only)
  └─ js/audio.js    ──►  AudioEngine Web Audio synth + bar transport
  └─ js/pitch-lab.js──►  PitchLab   pure. YIN pitch detection + target scoring
  └─ js/app.js      ──►  (controller) state, views, wiring. the only place
                                     that knows about both music and DOM
```

**Dependency rule:** `theory.js` and `modes.js` must never touch the DOM.
`fretboard.js` never touches audio. `app.js` is the only module allowed to know
about everything. Keeping this true is what makes the theory testable.

`pitch-lab.js` is also pure: it accepts `Float32Array` samples and returns pitch,
clarity, cents, and a target classification. Only `app.js` may request microphone
permission, own a `MediaStream`, or update the DOM. The stream feeds an analyser
but never the audio destination, so there is no monitor/feedback path. See
[PITCH_SINGBACK_DECISION.md](PITCH_SINGBACK_DECISION.md).

`chord-path.js` is the Matrix's evidence boundary. It may derive chord-tone cells,
scale-neighbour connectors, instrument paths, and triad/seventh extensions, but a
successor exists only when the same chord is followed by that chord in
`Modes.PROGRESSIONS`. Mode/key doors reuse `ChordMap.relationships()` and state
whether the sounding chord holds, its root holds while colour changes, or the
explicit major-I-to-new-ii cycle rule applies. `app.js` renders and sounds this
model; it must not add an unsupported route in player-facing copy.

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

Hear Movement and Triads & Comp take a different path: `Triads.pathThrough()` first
builds candidates on one adjacent string set, then uses dynamic programming to price
the **complete** progression. Its cost includes per-voice pitch movement, large-leap
penalties, hand span, and register drift. Looping drills also price the final-to-first
transition. This prevents a locally attractive inversion from causing an avoidable
jump later in the route.

Redraw is wholesale rather than diffed. At this node count it is well under a frame,
and it removes a whole class of stale-state bugs.

`HarmonyJourney` sits before rendering and playback. Full Cycle, one ii–V–I, Pivot,
and Song Map all ask it for the same `now`, `next`, and transition. A pivot is a
two-item adjacent `I → ii` pair; it never manufactures a route by deleting V chords.
The fretboard draws `nextGrip` as a static outline behind the active grip. CSS opacity
may cue the destination, but notes never slide between strings or frets.

## Player identity boundary

`PlayerProfiles` stores only validated, stable preferences and compact progress on
this device. It never persists an unanswered ear question, analyzer input, imported
score, timer, or audio state. The first profile is Dre on tetrachordo bouzouki. Each
local profile namespaces the opaque Coach token and therefore has separate anonymous
Neon history. This is not authentication or cloud sync; a future account system must
validate provider identity server-side and explicitly claim anonymous history.

## Audio

`AudioEngine` renders a normalized **hybrid plucked string**: a Karplus–Strong
`AudioBuffer` supplies the pick/string transient and a short, quiet oscillator supplies
fundamental pitch support on small tablet speakers. Per-voice gain falls as polyphony
increases. High-pass cleanup, instrument-specific filtering, a dynamics compressor,
and a conservative output stage protect against summed clipping. No samples, library,
or network are required.

Ear checks use a single warm guitar reference voice and chord cadences only, twice.
The selected instrument still controls the visual/playable map; it does not change
the Recall reference. Bass, percussion, and scale runs are off for ear questions.

The first real pointer/touch release primes a silent one-sample buffer so iPadOS can
resume the `AudioContext` inside a user gesture. Do not move audio initialization to a
timer or page-load callback.

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

`npm run check` syntax-checks every browser and server module. `npm test` runs the
pure music, app-shell, and coach-server regressions with Node's built-in test runner.
Keep the in-browser badge as well: it is the fastest feedback while changing music
data or listening by ear. Responsive releases also require explicit 1024 × 1366 and
390 × 844 browser passes; see [REVIEW_2026-08-12.md](REVIEW_2026-08-12.md).
