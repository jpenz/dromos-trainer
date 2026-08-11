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
| **FR-02** | SVG fretboard rendering | DONE | — | `js/fretboard.js` | 6 strings × 15 frets, inlays, nut, high E on top, horizontally scrollable |
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
| **FR-15** | Keyboard shortcuts | DONE | — | `js/app.js` | Space, ← →, 1/2/3 view switch |
| **FR-16** | Responsive + left-handed | DONE | — | `css/styles.css` | Single column < 900px; lefty mirrors the neck but keeps labels upright |
| **FR-17** | Headless test runner | TODO | — | — | Tests runnable from CLI without a browser (needs Node — not installed on the build machine) |
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

---

## 4. Traceability

| Module | Requirements | Invariants | Test entry point |
|---|---|---|---|
| `js/theory.js` | FR-01 | MI-01, MI-02, MI-03, MI-07a | `Theory.selfTest()` |
| `js/modes.js` | FR-08, FR-09, FR-10, FR-13 | MI-04, MI-05, MI-06, MI-07b, MI-08 | `Modes.selfTest()` |
| `js/fretboard.js` | FR-02, FR-03, FR-10, FR-11, FR-16 | — | visual |
| `js/audio.js` | FR-05, FR-06 | MI-06 (`playPrompt`) | audible |
| `js/app.js` | FR-04, FR-07, FR-12, FR-14, FR-15 | — | visual |
