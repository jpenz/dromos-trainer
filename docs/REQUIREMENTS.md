# Requirements & Feature Tracking

Every requirement has a stable ID. **Reference the ID in commits, branches and PRs**
(`FR-12: add streak persistence`). Source files carry `@req` / `@inv` comments that
point back here.

Status: `DONE` shipped & verified · `WIP` in progress · `TODO` agreed, not started ·
`IDEA` unrefined (see [BACKLOG.md](BACKLOG.md))

---

## 1. Functional requirements

| ID | Feature | Status | Owner | Implemented in | Acceptance criteria |
|---|---|---|---|---|---|
| **FR-01** | ii–V–I pivot cycle engine | DONE | — | `js/theory.js` | Generates 18 chords from rules (not a hardcoded table) and matches the MI-07a ground truth |
| **FR-02** | SVG fretboard rendering | DONE | — | `js/fretboard.js` | Generated from the selected tuning, with frets, inlays, nut, upright labels, and an internally scrollable neck |
| **FR-03** | Interval colour system | DONE | — | `css/styles.css`, `js/modes.js` | Root/3rd/5th/7th each a fixed colour, identical on fretboard, readout chips and legend |
| **FR-04** | Voice-leading animation | DONE | — | `js/app.js` | Moved voices get a white ring, a `↓` badge and a pop animation; held voices stay flat |
| **FR-05** | Guitar audio | DONE | — | `js/audio.js` | Karplus–Strong pluck, no external libs, no network. Strum / arpeggio / block |
| **FR-06** | Bar transport | DONE | — | `js/audio.js` | Lookahead scheduler, 40–200 BPM, metronome, loop, optional 2-bar I |
| **FR-07** | Cycle drills | DONE | — | `js/app.js` | Full cycle / single ii–V–I / pivot-only |
| **FR-08** | Dromos (mode) system | DONE | — | `js/modes.js` | Major, Minor, Ousak, Hijaz with scale, Greek name, blurb, flavour degrees |
| **FR-09** | Progression banks | DONE | — | `js/modes.js` | Ranked progressions per mode with a `why`; chords match MI-07b exactly |
| **FR-10** | Flavour-note highlighting | DONE | — | `js/fretboard.js` | ♭2/2 and ♭3/3 of the current mode carry an orange ring everywhere they appear |
| **FR-11** | Scale overlay | DONE | — | `js/fretboard.js` | Toggle shows every mode degree across the neck, labelled, tonic and flavour degrees distinct |
| **FR-12** | Ear trainer | DONE | — | `js/app.js` | Plays cadence **+ descending run**, 4-way guess, score/streak/best, reveals flavour notes |
| **FR-13** | Tonic transposition | DONE | — | `js/modes.js` | All 12 tonics; spelling stays diatomically legal (MI-04) |
| **FR-14** | Theory self-test badge | DONE | — | `js/app.js` | Header shows `n/n theory tests passing`; failures logged to console |
| **FR-15** | Keyboard shortcuts | DONE | — | `js/app.js` | Space, ← →, and 1–6 practice-area switching where appropriate |
| **FR-16** | Responsive + left-handed | DONE | — | `css/styles.css` | Single column < 900px; lefty mirrors the neck but keeps labels upright |
| **FR-20** | Scale paths | DONE | — | `js/practice.js` | 3/str, 2/str, in-position box, and horizontal single-string layouts; every combination fits the neck on every tuning |
| **FR-21** | Picking strokes & crossings | DONE | — | `js/practice.js` | Strict alternate strokes marked ⊓/V; each string change classified inside/outside per MI-11 and colour-coded on the path |
| **FR-22** | Expanding/contracting cells | DONE | — | `js/practice.js` | 3→8 notes then 8→3; target is always the last note |
| **FR-23** | Audiation (sing the target) | DONE | — | `js/audio.js`, `js/app.js` | Playback leaves a silent beat where the target belongs; reveal plays it back for self-checking |
| **FR-24** | Instrument tunings | DONE | — | `js/tuning.js` | Guitar, drop D, bouzouki tetrachordo (C F A D), bouzouki trichordo (D A D). Switching redraws everything; chords thin gracefully when strings < notes |
| **FR-25** | Triad map | DONE | — | `js/triads.js` | Every triad shape on the neck, grouped by string set and inversion; works on all tunings |
| **FR-26** | Voice-led triads through changes | DONE | — | `js/triads.js` | For each chord in a progression, the shape with least finger travel from the previous one; reports fingers moved and frets travelled |
| **FR-27** | Practice curriculum path | DONE | — | `index.html`, `js/app.js` | Hear → Map → Comp → Solo → Recall path remains visible and each step opens the matching practice area with a concrete cue |
| **FR-28** | Solo target map | DONE | — | `js/modes.js`, `js/fretboard.js`, `js/app.js` | Shows the dromos-specific pentatonic frame plus current/next 3rd or guide-tone landing notes through the selected progression |
| **FR-29** | Mainland laouto tuning | DONE | — | `js/tuning.js` | `A D G C` tuning produces playable grips, triads, and scale paths without guitar-only assumptions |
| **FR-30** | Installable offline browser shell | DONE | — | `manifest.webmanifest`, `sw.js` | Browser can cache the static app for repeat offline use; still opens directly from `file://` without requiring service workers |
| **FR-37** | Foundation and Greek-style pulse explorer | DONE | — | `js/styles.js`, `js/app.js` | Separates transferable improvisation foundation from selectable Greek pulse/style maps; each meter displays a complete grouping and explicitly sends harmonic choice back to Song Map |
| **FR-38** | Transparent song/part analyzer | DONE | — | `js/analysis.js`, `js/app.js` | Player-entered progression or chord-aligned notes yield a visible functional map, strong-note plan, concept explanations, and a practice decision—without pretending to transcribe or conclusively identify an audio recording |
| **FR-39** | MECE concept pyramid | DONE | — | `js/analysis.js`, `js/app.js` | Answer-first concept library separates Time/Form, Modal-Harmonic Map, Melodic Route, and Touch/Instrument Role; every layer includes a Greek/Balkan lens and one drill |
| **FR-40** | Authorised Greek study starters | DONE | — | `js/studies.js`, `js/app.js` | Three source-labelled, user-authorised excerpts load directly into the Analyzer; no lyrics, audio, full score, or complete arrangement is stored |
| **FR-41** | Score-to-study analysis and instrument map | DONE | — | `js/musicxml.js`, `js/app.js`, `js/fretboard.js` | An uncompressed, partwise MusicXML score with chord symbols loads locally into the Analyzer; every selected harmony has a compact tuning-aware chart, target rings, and readable tab |
| **FR-42** | Research-backed bouzouki reference shelf | DONE | — | `js/resources.js`, `js/app.js` | Concepts includes linked, source-labelled Trigas method/material families and complementary published methods, each tied to an original app practice use |
| **FR-43** | AI Practice Coach | TODO | — | planned: server endpoint + `js/coach.js` | Answers theory/practice questions in context and may return one validated, user-visible action that opens the relevant exercise, song map, study, or Analyzer state |
| **FR-17** | Headless test runner | DONE | — | `package.json`, `test/` | `npm test` runs theory, dromos pentatonic, laouto, and app-shell regressions without a browser |
| **FR-18** | Persist session state | TODO | — | — | Tonic/mode/progression/score survive reload via `localStorage` |
| **FR-19** | Printable one-page chart | TODO | — | — | Print stylesheet producing a music-stand sheet of the current mode |

---

## 2. Music invariants (MI)

**These encode domain knowledge. Breaking one is a correctness bug, not a style
choice.** Each is asserted by a self-test where marked.

| ID | Invariant | Asserted? |
|---|---|---|
| **MI-01** | The pivot cycle descends by whole step through exactly 6 keys (C → B♭ → A♭ → G♭ → E → D) and closes back on C one octave lower. | ✅ |
| **MI-02** | Cycle voicings: `m7` and `maj7` in root position (R‑3‑5‑7); `dom7` with the 5th in the bass (5‑♭7‑R‑3). | ✅ |
| **MI-03** | At every cycle transition **exactly two voices hold and two move down** by ≤ a whole step. Compared by *pitch class*, not MIDI — the cycle legitimately spirals down an octave, so absolute pitch would false-positive at the loop point. | ✅ |
| **MI-04** | Scale and chord spelling is **diatonic**: one letter name per scale degree; chord tones spelled in thirds from the root letter. This is why `A Hijaz` = `A B♭ C♯ D E F G` and not an enharmonic mess. | ✅ |
| **MI-04b** | Pragmatic exception: `C♭ F♭ E♯ B♯` are simplified to `B E F C`. Guitarists read `B`, not `C♭`. | — |
| **MI-05** | A mode's **flavour degrees are its 2nd and 3rd**. These two notes alone distinguish all four modes, which is the whole pedagogy: Major `2,4` · Minor `2,3` · Ousak `1,3` · Hijaz `1,4` (semitones above tonic). All four pairs must stay distinct. | ✅ |
| **MI-06** | **Ousak and Minor produce identical chords.** They differ only in the melodic 2nd degree. Therefore the ear trainer **must play a melodic run**, not only chords — chords alone make the question unanswerable. | ✅ |
| **MI-07a** | Cycle ground-truth chord table — see `GROUND_TRUTH` in `js/theory.js`. | ✅ |
| **MI-07b** | Progression ground-truth table — see `EXPECTED` in `js/modes.js`. | ✅ |
| **MI-08** | In Hijaz the **♭VII is minor** (`Cm` in D Hijaz, `Gm` in A Hijaz). A major ♭VII would be a different mode. This is the most commonly mis-transcribed chord in the app. | ✅ |
| **MI-11** | **Inside vs outside picking.** With strict alternate picking: *ascending* a string, `up→down` is **outside** and `down→up` is **inside**; *descending*, `down→up` is **outside** and `up→down` is **inside**. Verified against known pedagogy — 2 notes/string ascending from a downstroke is all-outside; 3 notes/string alternates. Both are asserted. | ✅ |
| **MI-12** | **Nothing may hardcode six strings.** String count, open pitches and names come from `window.Tuning`. A bouzouki has four courses (three for a trichordo), and every layout, grip and overlay must work on all of them. | ✅ |
| **MI-13** | **Inversion is named by the bass note**, not by fingering: 0 = root position, 1 = 3rd in bass, 2 = 5th in bass. Asserted for every generated shape. | ✅ |
| **MI-14** | Sevenths sit on top of a triad: `maj7`/`7` → major, `m7`/`m` → minor, `m7♭5` → diminished. This mapping is what the Triads view teaches — see [SOLOING.md](SOLOING.md) §5. | — |
| **MI-15** | Pentatonic is mode-specific: Major = major pentatonic; Minor/Ousak = minor pentatonic; Hijaz = dominant pentatonic. Hijaz must include its major 3rd, never ♭3. | ✅ |
| **MI-16** | A Greek style is not a dromos. Its displayed beat groups must total the meter numerator, and every style map must direct the player back to a separate dromos/song map. | ✅ |
| **MI-17** | Analyzer output is explanatory, not falsely certain: a context-dependent reading must be labelled `possible`, `may`, or `often`; no chord sequence alone is declared a definitive style, key change, or transcription. | ✅ |
| **MI-18** | Imported and starter studies are bounded: only user-authorised excerpts or user-selected local MusicXML are analyzed. The app does not OCR PDFs, transcribe audio, cache a repertoire database, or reproduce commercial notation. | ✅ |
| **MI-19** | The AI coach is advisory and action-bounded: the browser never holds an API secret; it may navigate or prefill a user-visible exercise only after a schema-validated action. It must not invent score content, change data externally, or present a theoretical reading as certain when context is incomplete. | — |
| **MI-09** | Hijaz on the 5th of a minor key is the *Piraeotikos* relationship: **A Hijaz = D harmonic minor from A**. The Andalusian cadence `Dm–C–B♭–A` lands on that Hijaz tonic — this is the intended teaching bridge between the Minor and Hijaz banks. | — |

### The reference tables

**MI-07b — progression banks, tonic D** (and A for Hijaz)

| Mode | Progression | Chords |
|---|---|---|
| Major | ii – V – I | `Em7 A7 Dmaj7` |
| Major | I – vi – ii – V | `Dmaj7 Bm7 Em7 A7` |
| Major | IV – V – I | `G A D` |
| Major | ♭VII – I | `C D` |
| Minor | iiø – V7 – i | `Em7♭5 A7 Dm7` |
| Minor | iv – V – i | `Gm A7 Dm` |
| Minor | iv – ♭VII – i | `Gm C Dm` |
| Minor | i – ♭VII – ♭VI – V | `Dm C B♭ A` |
| Ousak | i – ♭VII – i | `Dm C Dm` |
| Ousak | iv – ♭VII – i | `Gm C Dm` |
| Ousak | ♭VI – ♭VII – i | `B♭ C Dm` |
| Hijaz | I – ♭II – I | `D E♭ D` |
| Hijaz | I – iv – I | `D Gm D` |
| Hijaz | I – iv – ♭VII – I | `D Gm Cm D` |
| Hijaz | ♭II – I | `E♭ D` |
| Hijaz (A) | I – iv – ♭VII – I | `A Dm Gm A` |

**Scales, tonic D**

| Mode | Formula | On D |
|---|---|---|
| Major | 1 2 3 4 5 6 7 | `D E F♯ G A B C♯` |
| Minor | 1 2 ♭3 4 5 ♭6 ♭7 | `D E F G A B♭ C` |
| Ousak | 1 ♭2 ♭3 4 5 ♭6 ♭7 | `D E♭ F G A B♭ C` |
| Hijaz | 1 ♭2 3 4 5 ♭6 ♭7 | `D E♭ F♯ G A B♭ C` |

---

## 3. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| **NFR-01** | **Zero install, zero network.** No build step, no package manager, no CDN. Opens from `file://`. | DONE |
| **NFR-02** | No external dependencies whatsoever — audio is hand-rolled Web Audio, charts are hand-rolled SVG. | DONE |
| **NFR-03** | Theory core (`theory.js`, `modes.js`) is **pure logic with no DOM access** and is independently testable. | DONE |
| **NFR-04** | Animation stays smooth at 60fps; no layout thrash on chord change. | DONE |
| **NFR-05** | Usable on a phone propped on a music stand. | DONE |
| **NFR-06** | Every pushed change is checked by a reproducible syntax/test workflow. | DONE — `npm run check`, `npm test`, and GitHub Actions CI |

---

## 4. Traceability

| Module | Requirements | Invariants | Test entry point |
|---|---|---|---|
| `js/theory.js` | FR-01 | MI-01, MI-02, MI-03, MI-07a | `Theory.selfTest()` |
| `js/modes.js` | FR-08, FR-09, FR-10, FR-13, FR-28 | MI-04, MI-05, MI-06, MI-07b, MI-08, MI-15 | `Modes.selfTest()` + `npm test` |
| `js/styles.js` | FR-37 | MI-16 | `StyleLibrary.selfTest()` + `npm test` |
| `js/analysis.js` | FR-38, FR-39 | MI-17 | `AnalysisEngine.selfTest()` + `npm test` |
| `js/studies.js` | FR-40 | MI-18 | `StudyLibrary.selfTest()` + `npm test` |
| `js/musicxml.js` | FR-41 | MI-18 | `MusicXmlImport.selfTest()` + `npm test` |
| `js/resources.js` | FR-42 | MI-18 | `ResourceLibrary.selfTest()` + `npm test` |
| `js/fretboard.js` | FR-02, FR-03, FR-10, FR-11, FR-16 | MI-10, MI-12 | via `Modes.selfTest()` |
| `js/practice.js` | FR-20, FR-21, FR-22, FR-23 | MI-11, MI-12 | `Practice.selfTest()` |
| `js/tuning.js` | FR-24, FR-29 | MI-12 | via the other suites |
| `js/triads.js` | FR-25, FR-26 | MI-12, MI-13, MI-14 | `Triads.selfTest()` |
| `js/audio.js` | FR-05, FR-06, FR-23 | MI-06 (`playPrompt`) | audible |
| `js/app.js` | FR-04, FR-07, FR-12, FR-14, FR-15 | — | visual |
| `index.html`, `sw.js` | FR-27, FR-30 | — | `npm test` + browser verification |

### The core practice routine (FR-20…FR-23)

The Solo Lab implements one combined technique + audiation routine:

1. **Alternate pick with a loose wrist**, starting from a core position, then the
   positions **above and below** it, then **horizontally** along one string.
2. **Vary where the strings break** (3/str, 2/str, box) — this is what changes the
   inside/outside crossing pattern, which is the actual technical content.
3. **Pick a target note and pre-hear it.** Start with 3 notes, add one each pass to
   the octave, then take one away back down to 3.
4. **Pause and sing the target internally** before it sounds — that is what the
   silent beat in playback is for. Reveal to check yourself.
