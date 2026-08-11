# Backlog

Ordered roughly by value. Promote an item into the table in
[REQUIREMENTS.md](REQUIREMENTS.md) with an `FR-` id before starting work on it.

## Agreed (have IDs)

| ID | Item | Notes |
|---|---|---|
| FR-17 | Headless test runner | Needs Node, which the build machine lacks. `selfTest()` returns plain data, so a runner is ~20 lines once Node exists. Keep the in-browser badge either way. |
| FR-18 | Persist session state | `localStorage` for tonic/mode/progression + ear-trainer score. Low risk, self-contained. |
| FR-19 | Printable one-page chart | Print stylesheet: current mode's scale, grips and progressions on one sheet for the music stand. |

## Proposed (no ID yet)

**Musical**

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
