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
| **FR-02** | SVG fretboard rendering | DONE | — | `js/fretboard.js` | Generated from the selected tuning, with frets, inlays, nut and upright labels; the full neck fits without horizontal scrolling, using one continuous row on tablet/desktop and two readable 12-fret rows on phones |
| **FR-03** | Interval colour system | DONE | — | `css/styles.css`, `js/modes.js` | Root/3rd/5th/7th each a fixed colour, identical on fretboard, readout chips and legend |
| **FR-04** | Voice-leading animation | DONE | — | `js/app.js` | Moved voices get a white ring, a `↓` badge and a pop animation; held voices stay flat |
| **FR-05** | Fretted-string audio | DONE | — | `js/audio.js` | Speaker-safe hybrid pluck with normalized Karplus–Strong excitation, quiet fundamental support, polyphony-aware gain, compression, and iOS gesture priming; adapts guitar, bouzouki and laouto without external samples |
| **FR-06** | Bar transport | DONE | — | `js/audio.js` | Lookahead scheduler, 40–200 BPM, metronome, loop, optional 2-bar I |
| **FR-07** | Changes Gym | DONE | — | `js/app.js`, `js/harmony-journey.js` | One shared ii–V–I pivot exercise with 1/3/6-key boundaries; screen and audio wrap from the same journey model |
| **FR-08** | Modal + harmonic map system | DONE | — | `js/modes.js` | Major, Natural minor, Harmonic minor, Ousak, Hijaz with scale, Greek name, blurb, and signature degrees |
| **FR-09** | Progression banks | DONE | — | `js/modes.js` | Ranked progressions per mode with a `why`; chords match MI-07b exactly |
| **FR-10** | Flavour-note highlighting | DONE | — | `js/fretboard.js` | ♭2/2 and ♭3/3 of the current mode carry an orange ring everywhere they appear |
| **FR-11** | Scale overlay | DONE | — | `js/fretboard.js` | Toggle shows every mode degree across the neck, labelled, tonic and flavour degrees distinct |
| **FR-12** | Ear trainer | DONE | — | `js/app.js`, `js/ear-drills.js` | Plays a scale-and-harmony-coherent chord cadence twice with no answer-leaking scale run; provides a 5-way reversible guess, progressive hints, explicit check, score/streak/best, reference tonic, stop/replay, and an exact post-answer reveal |
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
| **FR-26** | Voice-led triads through changes | DONE | — | `js/triads.js` | Dynamic programming chooses the lowest-cost complete route on one fixed string set and neck area; optional loop closure prices the final-to-first move and reports per-voice movement |
| **FR-27** | Practice curriculum path | DONE | — | `index.html`, `js/app.js` | Hear → Map → Comp → Solo → Recall path remains visible and each step opens the matching practice area with a concrete cue |
| **FR-28** | Solo target map | DONE | — | `js/modes.js`, `js/fretboard.js`, `js/app.js` | Shows the dromos-specific pentatonic frame plus current/next 3rd or guide-tone landing notes through the selected progression |
| **FR-29** | Mainland laouto tuning | DONE | — | `js/tuning.js` | `A D G C` tuning produces playable grips, triads, and scale paths without guitar-only assumptions |
| **FR-30** | Installable offline browser shell | DONE | — | `manifest.webmanifest`, `sw.js` | Versioned shell assets and network-first same-origin requests show the current deployment online, with the cache used as an offline fallback; `file://` still works without service workers |
| **FR-37** | Foundation and Greek-style pulse explorer | DONE | — | `js/styles.js`, `js/app.js` | Separates transferable improvisation foundation from selectable Greek pulse/style maps; each meter displays a complete grouping and explicitly sends harmonic choice back to Song Map |
| **FR-38** | Transparent song/part analyzer | DONE | — | `js/analysis.js`, `js/app.js` | Player-entered progression or chord-aligned notes yield a visible functional map, strong-note plan, concept explanations, and a practice decision—without pretending to transcribe or conclusively identify an audio recording |
| **FR-39** | MECE concept pyramid | DONE | — | `js/analysis.js`, `js/app.js` | Answer-first concept library separates Time/Form, Modal-Harmonic Map, Melodic Route, and Touch/Instrument Role; every layer includes a Greek/Balkan lens and one drill |
| **FR-40** | Authorised Greek study starters | DONE | — | `js/studies.js`, `js/app.js` | Three source-labelled, user-authorised excerpts load directly into the Analyzer; no lyrics, audio, full score, or complete arrangement is stored |
| **FR-41** | Score-to-study analysis and instrument map | DONE | — | `js/musicxml.js`, `js/app.js`, `js/fretboard.js` | An uncompressed, partwise MusicXML score with chord symbols loads locally into the Analyzer; every selected harmony has a compact tuning-aware chart, target rings, and readable tab |
| **FR-42** | Research-backed bouzouki reference shelf | DONE | — | `js/resources.js`, `js/app.js` | Concepts includes linked, source-labelled Trigas method/material families and complementary published methods, each tied to an original app practice use |
| **FR-43** | AI Practice Coach | WIP | — | `api/coach.js`, `js/coach.js` | Answers theory/practice questions in context and may return one validated, user-visible action that opens the relevant exercise, song map, study, or Analyzer state; becomes live once Vercel/Neon secrets are configured |
| **FR-44** | Private practice history and adaptive recommendations | WIP | — | `api/progress.js`, `api/_lib/recommendations.js`, `js/coach.js` | A signed anonymous-device profile records coach messages and practice events, returns a progress summary, and recommends the next drill; cross-device sign-in is intentionally deferred |
| **FR-45** | Full-neck Solo Road | DONE | — | `js/modes.js`, `js/practice.js`, `js/fretboard.js`, `js/app.js` | Player chooses tonic, dromos and progression; sees a 24-fret lower/upper road, active Roman-numeral chord box, selectable technique shape, number pattern and target map on every supported tuning |
| **FR-46** | Functional-map ear checks | DONE | — | `js/app.js`, `js/ear-drills.js`, `js/audio.js` | A second ear drill can anchor a selected home or test it blind, then requires the player to identify the home, modal/harmonic family, and written Roman-numeral progression before an explicit reveal |
| **FR-47** | Guided curriculum navigation | DONE | — | `index.html`, `js/app.js`, `css/styles.css` | Persistent left-side curriculum makes the learning order explicit; every page presents purpose, 3-step use instructions and relevant context |
| **FR-48** | Public video study lab | DONE | — | `js/video.js`, `js/resources.js`, `js/app.js` | Public lesson embeds stay hosted by YouTube; a player can choose a source lesson, set A/B markers, loop, slow down and route the observation back to Song Map without extracting third-party media |
| **FR-49** | Melodic routes and triad landscape | DONE | — | `js/practice.js`, `js/triads.js`, `js/fretboard.js`, `js/app.js` | Shape shows target rings for this/next chord and five constrained melodic routes; Changes shows solid nearest triad, faint all-position inversions, quiet pentatonic connectors, and the current/next landing notes on every supported instrument |
| **FR-50** | Pulse-aware practice ensemble | DONE | — | `js/styles.js`, `js/audio.js`, `js/app.js` | The chosen Greek pulse sets transport length/accent grouping; optional root-and-fifth bass and light grouped percussion support the selected harmonic map and animate the Solo timing matrix |
| **FR-51** | Practical guitar chord cycle | DONE | — | `js/guitar-voicings.js`, `js/triads.js`, `js/fretboard.js`, `js/app.js` | Cycle has a Practical Chords lens for every app dromos/progression: validated common open/E/A-family six-string forms through fret 15, triad inversions, and compact four-note choices |
| **FR-52** | Shared Now → Next harmony journey | DONE | — | `js/harmony-journey.js`, `js/fretboard.js`, `js/app.js` | Full Cycle, one ii–V–I, honest I→ii pivot pairs, Song Map, manual steps and playback share one current/next model; the next playable grip is outlined, chord/function text remains explicit, and reduced-motion users receive the same information without animation |
| **FR-53** | Named local player profiles | DONE | — | `js/profiles.js`, `js/coach.js`, `js/app.js` | Up to eight validated profiles on this device keep stable settings, instrument and independent ear progress; Dre defaults to tetrachordo bouzouki, coach tokens are namespaced per player, and the UI explicitly avoids claiming cloud authentication |
| **FR-54** | Dromos Chord Map | DONE | — | `js/chord-map.js`, `js/app.js` | Derives all seven triads from the selected tonic/dromos, shows lawful Roman quality, diatonic chord tones and trainer-derived prominence, sounds a real 0–15-fret grip on every tuning, and compares all five dromoi in an internally scrollable table |
| **FR-55** | Studio ear reference and exact answer reveal | DONE | — | `assets/audio/salamander/`, `js/audio.js`, `js/app.js`, `sw.js` | Recall uses a self-hosted, pitch-stable sampled piano across questions with an offline additive fallback; Start/Replay/Stop never change the answer, and checking reveals the exact home, scale degrees, Roman progression, chord symbols, chord tones and R/3/5/7 roles generated by the sounding progression object |
| **FR-56** | Standalone Harmony Matrix | DONE | — | `js/chord-map.js`, `js/app.js`, `index.html`, `css/styles.css` | A top-level page compares only the five verified systems as scale rows against degree columns 1–7; triads are the default, lawful stacked sevenths are optional, working roles and documented-route use stay visibly distinct, and opening a row reveals only evidence-labelled exact sisters, six-note parallel switches, progression doors, and the ii–V–I whole-step cycle transition |
| **FR-57** | Solo harmony journey | DONE | — | `js/app.js`, `js/fretboard.js`, `index.html`, `css/styles.css` | Solo opens on Follow Changes with an exclusive full-scale, pentatonic, or triads-only background; one solid playable current triad and one dashed playable coming triad sit above it; the selected current/next chord tone defaults to exactly one 3rd address in each shape and advances with playback; other current inversions remain optional, and the large full neck folds instead of scrolling |
| **FR-58** | Soloist Toolkit | DONE | — | `js/toolkit.js`, `js/app.js`, `css/styles.css` | Three MECE pillars—Land, Move, Speak—route sourced, self-scored practice tools into the active Solo map; keyboard tabs retain focus after rendering, Formula Bank cards genuinely swap, and text-only tools do not promise missing fretboard overlays |
| **FR-59** | Pulse-first Comp curriculum | DONE | — | `js/styles.js`, `js/app.js`, `index.html`, `css/styles.css` | Comp starts with three progressive levels for every Greek pulse preset: accents only, disclosed bass/chord skeleton, then free right hand around preserved anchors; Hasaposerviko is selectable, transport plays the progression, and the visible cursor follows the current pulse before triad-shape work |
| **FR-60** | Directional road disclosure | DONE | — | `js/modes.js`, `js/app.js` | Solo Road distinguishes Ousak's verified ascending mobile 2nd/6th from its core descending trainer collection and explicitly states when any other scale is re-used in both directions because no additional directional form is encoded |
| **FR-17** | Headless test runner | DONE | — | `package.json`, `test/` | `npm test` runs theory, dromos pentatonic, laouto, and app-shell regressions without a browser |
| **FR-18** | Persist stable player state | DONE | — | `js/profiles.js`, `js/app.js` | Tonic, mode, progression, tuning, tempo, view and ear scores survive reload per named local player; unanswered prompts, imported score content, timers and audio are deliberately excluded |
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
| **MI-05** | Every Recall map has a distinct **signature set**. Major `2,3` · Natural minor `2,♭3` · Harmonic minor `♭3,7` · Ousak `♭2,♭3` · Hijaz `♭2,3`. The leading tone is required to distinguish the two minor systems. | ✅ |
| **MI-06** | Every scored Recall prompt is **scale-and-harmony coherent**: all chord tones belong to its declared collection. Therefore Harmonic minor `iiø–V7–i`, Natural minor `i–♭VII–i`, and strict Ousak `i–♭VIIm–i` cannot be silently conflated. The app may discuss repertoire-specific mixture only in the Analyzer, with uncertainty. | ✅ |
| **MI-07a** | Cycle ground-truth chord table — see `GROUND_TRUTH` in `js/theory.js`. | ✅ |
| **MI-07b** | Progression ground-truth table — see `EXPECTED` in `js/modes.js`. | ✅ |
| **MI-07c** | Derived Chord Map ground truth — all seven stacked triads for tonic D must match the reference table below; odd diminished/augmented results remain visible and Ousak degree 2 remains explicitly labelled as an equal-tempered practice compromise. | ✅ |
| **MI-08** | In Hijaz the **♭VII is minor** (`Cm` in D Hijaz, `Gm` in A Hijaz). A major ♭VII would be a different mode. This is the most commonly mis-transcribed chord in the app. | ✅ |
| **MI-09** | Hijaz on the 5th of a minor key is the *Piraeotikos* relationship: **A Hijaz = D harmonic minor from A**. The Andalusian cadence `Dm–C–B♭–A` lands on that Hijaz tonic — this is the intended teaching bridge between the Minor and Hijaz banks. | — |
| **MI-10** | Every chord the app displays must produce a playable grip on every supported tuning. A reduced-course instrument may thin a voicing, but the neck must never silently render no chord. | ✅ |
| **MI-11** | **Inside vs outside picking.** With strict alternate picking: *ascending* a string, `up→down` is **outside** and `down→up` is **inside**; *descending*, `down→up` is **outside** and `up→down` is **inside**. Verified against known pedagogy — 2 notes/string ascending from a downstroke is all-outside; 3 notes/string alternates. Both are asserted. | ✅ |
| **MI-12** | **Nothing may hardcode six strings.** String count, open pitches and names come from `window.Tuning`. A bouzouki has four courses (three for a trichordo), and every layout, grip and overlay must work on all of them. | ✅ |
| **MI-13** | **Inversion is named by the bass note**, not by fingering: 0 = root position, 1 = 3rd in bass, 2 = 5th in bass. Asserted for every generated shape. | ✅ |
| **MI-14** | Sevenths sit on top of a triad: `maj7`/`7` → major, `m7`/`m` → minor, `m7♭5` → diminished. This mapping is what the Triads view teaches — see [SOLOING.md](SOLOING.md) §5. | — |
| **MI-15** | Pentatonic is mode-specific: Major = major pentatonic; Minor/Ousak = minor pentatonic; Hijaz = dominant pentatonic. Hijaz must include its major 3rd, never ♭3. | ✅ |
| **MI-16** | A Greek style is not a dromos. Its displayed beat groups must total the meter numerator, and every style map must direct the player back to a separate dromos/song map. | ✅ |
| **MI-17** | Analyzer output is explanatory, not falsely certain: a context-dependent reading must be labelled `possible`, `may`, or `often`; no chord sequence alone is declared a definitive style, key change, or transcription. | ✅ |
| **MI-18** | Imported and starter studies are bounded: only user-authorised excerpts or user-selected local MusicXML are analyzed. The app does not OCR PDFs, transcribe audio, cache a repertoire database, or reproduce commercial notation. | ✅ |
| **MI-19** | The AI coach is advisory and action-bounded: the browser never holds an API secret; it may navigate or prefill a user-visible exercise only after a schema-validated action. It must not invent score content, change data externally, or present a theoretical reading as certain when context is incomplete. While configured for Gemini Free Tier, the browser must show and require acknowledgement of the provider's data-use disclosure before sending a question. | ✅ |
| **MI-20** | Video Study is a hosted-reference tool, not a media library: it links only to public original-host embeds, keeps A/B/speed state in the browser, and never downloads, extracts, transcribes or republishes third-party video. | ✅ |
| **MI-21** | A melodic route must distinguish **target**, **connector**, and optional **approach** roles. A non-dromos approach is never presented as a default scale tone: it belongs on a weak pulse and resolves immediately by step, only where the song language supports it. | ✅ |
| **MI-22** | The practice ensemble is a timing aid, not an assertion of a complete traditional arrangement: it may state chord roots/fifths and group accents, but it must not prescribe repertoire-specific bass or drum parts. The chosen style controls grouped pulse, while the Song Map remains responsible for dromos and harmony. | ✅ |
| **MI-23** | A displayed full guitar form must be a validated six-string open or movable E/A-family form, consist only of chord tones, and remain at fret 15 or lower. Complex qualities with no clean full form must offer compact chord-tone voicings rather than an invented barre. | ✅ |
| **MI-24** | A generated triad route must stay on one adjacent three-string set for the complete progression. When a drill loops, route selection must price the last-to-first transition; a displayed triad skeleton must not claim to contain an omitted seventh. | ✅ |
| **MI-25** | Rendered theory and sound share one source: every progression chord's Roman function, symbol, pitch spelling, interval glyph and frequency must agree. If a theoretical root is simplified (`F♭` → `E`), its chord tones are respelled from the displayed root (`E–G♯–B`, never `E–A♭–B`). | ✅ — exhaustive 2,088-tone test |
| **MI-26** | The Harmony Matrix may compare only Major, Natural minor, Harmonic minor, Ousak, and Hijaz. “Working role” is computed independently from documented-map frequency. A scale door must disclose its evidence: all seven notes identical, six of seven notes shared with the changed degree named, a documented source progression containing the target tonic, or the explicit ii–V–I rule in which the old I becomes the next ii one whole step below. A suggested door is a comparison/practice lens, never an automatic claim that a song has modulated. | ✅ |
| **MI-27** | A Solo Now/Next landing and both displayed triads are derived from the same current/next chord objects that drive playback. The default target is each chord's actual 3rd (`3` or `♭3`), never an invented seventh. Target rings are position-scoped to one playable address in the voice-led current/coming shapes—not sprayed across every matching pitch on the neck—and visual arrival occurs on the transport's chord boundary. | ✅ |
| **MI-28** | Comp may free the right hand only after preserving the selected pulse's Level-1 anchors. Zeibekiko marks 1/3/5/7 and leaves 8–9 unfilled; Hasapiko states bass on 1/chord on 2 before adding the walk; sparse Tsifteteli 1/4 accents remain distinct from its Level-2 eight-subdivision 3+3+2 study; Hasaposerviko remains a fast two-beat bass/chord preset. | ✅ |
| **MI-29** | A directional dromos claim must be represented as directional data. Only Ousak's verified ascending mobile 2nd/6th is currently encoded; every other selected map discloses that the trainer repeats its declared fixed collection descending rather than inventing a sourced seira. | ✅ |
### The reference tables

**MI-07b — progression banks, tonic D** (and A for Hijaz)

| Mode | Progression | Chords |
|---|---|---|
| Major | ii – V – I | `Em7 A7 Dmaj7` |
| Major | I – vi – ii – V | `Dmaj7 Bm7 Em7 A7` |
| Major | IV – V – I | `G A D` |
| Major | ♭VII – I | `C D` |
| Natural minor | i – III – i | `Dm F Dm` |
| Natural minor | i – ♭VII – i | `Dm C Dm` |
| Natural minor | iv – ♭VII – i | `Gm C Dm` |
| Natural minor | ♭VI – ♭VII – i | `B♭ C Dm` |
| Harmonic minor | iiø – V7 – i | `Em7♭5 A7 Dm` |
| Harmonic minor | iv – V7 – i | `Gm A7 Dm` |
| Harmonic minor | ♭VI – iiø – V7 – i | `B♭ Em7♭5 A7 Dm` |
| Ousak (strict Recall) | i – ♭VIIm – i | `Dm Cm Dm` |
| Ousak (strict Recall) | ♭II – i | `E♭ Dm` |
| Ousak (strict Recall) | ♭II – ♭VIIm – i | `E♭ Cm Dm` |
| Hijaz | I – ♭II – I | `D E♭ D` |
| Hijaz | I – iv – I | `D Gm D` |
| Hijaz | I – iv – ♭VII – I | `D Gm Cm D` |
| Hijaz | ♭II – I | `E♭ D` |
| Hijaz (A) | I – iv – ♭VII – I | `A Dm Gm A` |

**MI-07c — derived triads, tonic D**

| Mode | Roman qualities | Chords |
|---|---|---|
| Major | `I ii iii IV V vi vii°` | `D Em F♯m G A Bm C♯°` |
| Natural minor | `i ii° ♭III iv v ♭VI ♭VII` | `Dm E° F Gm Am B♭ C` |
| Harmonic minor | `i ii° ♭III+ iv V ♭VI vii°` | `Dm E° F+ Gm A B♭ C♯°` |
| Ousak equal-tempered practice map | `i ♭II ♭III iv v° ♭VI ♭vii` | `Dm E♭ F Gm A° B♭ Cm` |
| Hijaz equal-tempered practice map | `I ♭II iii° iv v° ♭VI+ ♭vii` | `D E♭ F♯° Gm A° B♭+ Cm` |

**MI-07d — derived sevenths, tonic D**

| Mode | Roman qualities | Chords |
|---|---|---|
| Major | `Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7` | `Dmaj7 Em7 F♯m7 Gmaj7 A7 Bm7 C♯m7♭5` |
| Natural minor | `i7 iiø7 ♭IIImaj7 iv7 v7 ♭VImaj7 ♭VII7` | `Dm7 Em7♭5 Fmaj7 Gm7 Am7 B♭maj7 C7` |
| Harmonic minor | `i(maj7) iiø7 ♭III+maj7 iv7 V7 ♭VImaj7 vii°7` | `Dm(maj7) Em7♭5 Fmaj7♯5 Gm7 A7 B♭maj7 C♯°7` |
| Ousak equal-tempered practice map | `i7 ♭IImaj7 ♭III7 iv7 vø7 ♭VImaj7 ♭vii7` | `Dm7 E♭maj7 F7 Gm7 Am7♭5 B♭maj7 Cm7` |
| Hijaz equal-tempered practice map | `I7 ♭IImaj7 iii°7 iv(maj7) vø7 ♭VI+maj7 ♭vii7` | `D7 E♭maj7 F♯°7 Gm(maj7) Am7♭5 B♭maj7♯5 Cm7` |

**Scales, tonic D**

| Mode | Formula | On D |
|---|---|---|
| Major | 1 2 3 4 5 6 7 | `D E F♯ G A B C♯` |
| Natural minor | 1 2 ♭3 4 5 ♭6 ♭7 | `D E F G A B♭ C` |
| Harmonic minor | 1 2 ♭3 4 5 ♭6 7 | `D E F G A B♭ C♯` |
| Ousak | 1 ♭2 ♭3 4 5 ♭6 ♭7 | `D E♭ F G A B♭ C` |
| Hijaz | 1 ♭2 3 4 5 ♭6 ♭7 | `D E♭ F♯ G A B♭ C` |

---

## 3. Non-functional requirements

| ID | Requirement | Status |
|---|---|---|
| **NFR-01** | **Zero install for the player; offline-capable core.** No build step or CDN is required, and the curriculum opens from `file://`. Optional account/coach features require their deployed API and network. | DONE |
| **NFR-02** | No browser runtime package or CDN dependencies. Playback and charts use native Web Audio/SVG; the compact piano sample subset is self-hosted with attribution and an offline synthesized fallback. The optional server API keeps its declared Neon driver dependency. | DONE |
| **NFR-03** | Theory core (`theory.js`, `modes.js`) is **pure logic with no DOM access** and is independently testable. | DONE |
| **NFR-04** | Animation stays smooth at 60fps; no layout thrash on chord change. | DONE |
| **NFR-05** | Usable on a phone propped on a music stand. | DONE |
| **NFR-06** | Every pushed change is checked by a reproducible syntax/test workflow. | DONE — `npm run check`, `npm test`, and GitHub Actions CI |
| **NFR-07** | Inert features fail tests: app-rendered controls require a handled contract, JavaScript-applied classes require CSS, literal DOM IDs must exist, every index script must enter the offline shell, and every exported module self-test must run. Each gate proves itself against an in-memory sabotage. | DONE |

---

## 4. Traceability

| Module | Requirements | Invariants | Test entry point |
|---|---|---|---|
| `js/theory.js` | FR-01 | MI-01, MI-02, MI-03, MI-07a | `Theory.selfTest()` |
| `js/modes.js`, `js/ear-drills.js` | FR-08, FR-09, FR-10, FR-12, FR-13, FR-28, FR-46, FR-55, FR-60 | MI-04, MI-05, MI-06, MI-07b, MI-08, MI-15, MI-25, MI-29 | `Modes.selfTest()` + `EarDrills.selfTest()` + exhaustive display/sound and movement-policy audits in `npm test` |
| `js/chord-map.js` | FR-54, FR-56 | MI-04, MI-07c, MI-07d, MI-10, MI-12, MI-26 | `ChordMap.selfTest()` + exhaustive triad/seventh, scale-door, and 60-map/5-tuning checks in `npm test` |
| `js/styles.js` | FR-37, FR-50, FR-59 | MI-16, MI-22, MI-28 | `StyleLibrary.selfTest()` + exact three-level skeleton regressions in `npm test` |
| `js/toolkit.js` | FR-58 | — | `SoloToolkit.selfTest()` + keyboard/focus and promise/behavior regressions in `npm test` and browser |
| `js/analysis.js` | FR-38, FR-39 | MI-17 | `AnalysisEngine.selfTest()` + `npm test` |
| `js/studies.js` | FR-40 | MI-18 | `StudyLibrary.selfTest()` + `npm test` |
| `js/musicxml.js` | FR-41 | MI-18 | `MusicXmlImport.selfTest()` + `npm test` |
| `js/resources.js` | FR-42 | MI-18 | `ResourceLibrary.selfTest()` + `npm test` |
| `api/coach.js`, `js/coach.js` | FR-43 | MI-19 | `test/coach-server.test.js` + client self-test |
| `api/progress.js`, `api/session.js`, `api/_lib/recommendations.js` | FR-44 | MI-19 | `test/coach-server.test.js` |
| `js/fretboard.js` | FR-02, FR-03, FR-10, FR-11, FR-16, FR-57 | MI-10, MI-12, MI-27 | geometry contract + Solo full-neck source/browser regression + `Modes.selfTest()` |
| `js/practice.js` | FR-20, FR-21, FR-22, FR-23, FR-49 | MI-11, MI-12, MI-21 | `Practice.selfTest()` |
| `js/guitar-voicings.js` | FR-51 | MI-23 | `GuitarVoicings.selfTest()` + `npm test` |
| `js/tuning.js` | FR-24, FR-29 | MI-12 | via the other suites |
| `js/triads.js` | FR-25, FR-26, FR-49, FR-56 | MI-12, MI-13, MI-14, MI-24 | `Triads.selfTest()` + exhaustive compact-seventh grip checks in `npm test` |
| `js/audio.js` | FR-05, FR-06, FR-23, FR-50, FR-55 | MI-06, MI-22, MI-25 | `AudioEngine.selfTest()` + browser sample-load/stop/replay regression |
| `js/app.js` | FR-04, FR-07, FR-12, FR-14, FR-15, FR-45…47, FR-49…51, FR-56…60 | MI-22, MI-26…29 | visual + Solo Now/Next, toolkit focus, Comp transport/pulse browser regression + `npm test` |
| `js/video.js` | FR-48 | MI-20 | catalog self-test + host-controlled embed |
| `index.html`, `sw.js` | FR-27, FR-30, FR-47…48 | — | `npm test` + browser verification |

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
