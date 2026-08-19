# Backlog

Ordered roughly by value. Promote an item into the table in
[REQUIREMENTS.md](REQUIREMENTS.md) with an `FR-` id before starting work on it.

## Agreed (have IDs)

| ID | Item | Notes |
|---|---|---|
| FR-17 | Headless test runner | DONE — Node tests cover theory, dromos pentatonic identity, laouto maps, style pulses, and the static app shell. Keep the in-browser badge as a second check. |
| FR-18 | Persist session state | `localStorage` for tonic/mode/progression + ear-trainer score. Low risk, self-contained. |
| FR-19 | Printable one-page chart | Print stylesheet: current mode's scale, grips and progressions on one sheet for the music stand. |
| FR-31 | Song-change ear drills | Prompt an isolated progression; player names functions before revealing the chord/neck map. |
| FR-32 | Meter, count-in and backing loop | 2/4, 4/4, 7/8, 9/8; supports the actual rhythmic context of rebetiko, laïko and nisiotika. |
| FR-33 | Local practice history | Persist sessions, weak targets and spaced review on-device with no account requirement. |
| FR-34 | Phrase Lab | Partial: original full-neck lower/upper road, number contours and resolution targets are now done in FR-45. Remaining work is stylistically reviewed dromos-specific `seira` and call/response material. |
| FR-35 | Rhythm & comping lab | Instrument-specific right-hand patterns and sparse accompaniment in real Greek meters; mainland laouto is treated as rhythmic as well as melodic. |
| FR-36 | User song-map studio | User enters/transcribes functions by ear, then reveals triads, targets and positions; avoids a copyrighted-song database. |
| FR-37 | Foundation and Greek-style pulse explorer | DONE — modern improvisation foundation plus Zeibekiko, Kalamatianos, Hasapiko, Tsifteteli, and Roumba pulse maps; backing/count-in remains FR-32. |
| FR-38 | Transparent song/part analyzer | DONE — analyzes user-entered chord maps and chord-aligned note fragments, including conditional modal-mixture and secondary-function explanations; raw audio transcription remains a separate future decision. |
| FR-39 | MECE concept pyramid | DONE — answer-first concept library with Time/Form, Modal-Harmonic Map, Melodic Route, and Touch/Instrument Role. |
| FR-40 | Authorised Greek study starters | DONE — three source-labelled excerpts from the user-approved library load into the Analyzer without copying a complete arrangement. |
| FR-41 | Score-to-study analysis and instrument map | DONE — local uncompressed MusicXML chord symbols and notes populate analysis; each change gets tuning-aware chart/tab. PDF OCR, .mxl decompression and audio transcription are intentionally separate decisions. |
| FR-42 | Research-backed bouzouki reference shelf | DONE — Trigas course/material families and selected complementary methods are linked and tied to original drills. |
| FR-43 | AI Practice Coach | WIP — Vercel Function, low-cost Gemini 3.1 Flash-Lite default, schema-validated exercise actions, and browser UI are committed. Provision Neon and Vercel secrets to activate it. |
| FR-44 | Private practice history and adaptive recommendations | WIP — signed anonymous device profiles, conversation/event persistence, progress summary and next-drill recommendations are implemented; account sign-in remains a separate product decision. |

## Proposed (no ID yet)

**Musical — these serve [SOLOING.md](SOLOING.md) directly, in priority order**

- **Licensed bouzouki source annotation and teacher review.** Register owned editions
  and lesson access for Trigas, Avlonitis, Karantinis, Filippatos, and other methods;
  store concept/page/timecode metadata rather than copied notation. Validate stroke
  vocabulary, practical fingerings, and dromos phrase claims with trichordo and
  tetrachordo teachers before scoring them.
- **Recorded/licensed bouzouki reference set.** A dry, pitch-stable sample family
  with controlled attack, tremolo layers, and velocity variation would improve
  technique demonstration. Keep sampled piano as the neutral ear-test reference.

- **Loop / backing player.** You cannot practise soloing without the changes playing
  underneath. The transport already schedules chords; this is mostly UI. *Highest
  value remaining.* (Promote with FR-32.)
- **Pentatonic overlay + flavour targets.** Show the mode's pentatonic skeleton on
  the neck, with the flavour notes as separate "arrival" targets (SOLOING §1–2).
  Note Hijaz needs the DOMINANT pentatonic, not the minor one.
- **Tetrachord view.** Split the mode into its two four-note cells and drill inside
  one at a time (SOLOING §3). The most Greek-specific feature not yet built.
- **Meter.** 9/8 zeibekiko, 7/8 kalamatianos, 2/4 syrtos. Everything is 4/4 today,
  which makes idiomatic phrasing impossible (SOLOING §8).
- **Guide-tone line display** through a progression — the 3rds and 7ths as a
  connected line, the way the cycle view shows voice leading.
- **Drone mode** for nisiotika practice.

**Musical — other**

- **More dromoi.** Niavent, Sabah, Kartzigar, Rast, Houzam, Piraeotikos. See the
  "add a mode" recipe in [CONTRIBUTING.md](../CONTRIBUTING.md). Watch MI-05.
- **The Piraeotikos bridge as a guided drill.** MI-09 says the Andalusian cadence
  `Dm–C–B♭–A` lands on a Hijaz tonic. A drill that vamps the Andalusian and then
  drops you into A Hijaz over the held A would teach the single most useful
  relationship in the app. Currently only documented, not taught.
- **Melodic phrases, not just scales.** The ear trainer plays a plain descending run.
  Idiomatic *seira* (characteristic melodic turns) per dromos would be far more
  musical and much better ear training.
- **Rhythm.** Everything is straight 4/4. Greek repertoire lives in 9/8 (zeibekiko),
  7/8 (kalamatiano) and 4/4 tsifteteli. A meter selector would change how playable
  this is against real songs.
- **Voice-leading enforcement for progressions.** The cycle asserts 2-held/2-moved
  (MI-03); the progression engine only keeps register continuity. Optional
  smooth-voicing mode with drop-2/drop-3 shapes.

**Interaction**

- **Playable grip alternatives.** `findGrip` returns one shape; a picker showing the
  3–4 playable shapes per chord would suit real practice better than the position
  cycler.
- **Chord-tone vs scale-tone toggle in the overlay.** Currently the scale overlay
  and the grip compete for attention on busy modes.
- **Metronome subdivisions / count-in.** Count-in was specified but never built.
- **URL state.** Shareable links (`?mode=hijaz&tonic=A&prog=I-iv-bVII-I`) — pairs
  naturally with FR-18.

**Engineering**

- **Unify the two spellers.** `theory.js` keeps a legacy per-key flat/sharp table;
  `modes.js` has the correct diatonic speller. Migrating the cycle onto it means
  reconciling MI-04b (`B` vs `C♭` in the G♭/A♭m region of the cycle). Do this
  *before* adding more keys to the cycle, not after.
- **Split `app.js`.** It is the only large file and now carries three views. If it
  grows again, split per view behind a tiny view interface.
- **Audio: velocity and voicing balance.** The pluck is uniform; real strums are not.

## Explicitly out of scope

- Frameworks, bundlers, package managers, CDNs — see NFR-01/02. If you genuinely need
  one, raise it as a decision first; it changes what this project *is*.
- Microtonality. Ousak's true neutral 2nd and Hijaz's stretched 3rd are real, but
  equal temperament is what a guitar plays. Documented in the Ousak blurb instead.
