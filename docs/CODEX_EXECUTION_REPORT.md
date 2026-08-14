# Codex execution report — FR-54 + FR-55 + FR-56

Date: 2026-08-13
Branch: `agent/harmony-matrix`

## Outcome

The takeover brief was executed in its requested order: cleanup, regression
hardening, then the Dromos Chord Map. The result keeps the zero-build browser
architecture and adds no front-end package or CDN dependency.

The original Chord Map now has a dedicated top-level **Matrix** destination. It
compares the same home key across exactly the five verified systems, with each
scale as a row and degrees 1–7 as columns. Triads are the default; a 7ths toggle
reveals every lawful four-note stack. Selecting a row opens its construction,
documented routes, and evidence-labelled sister/transition scales while the
same selected chord still drives the fretboard, target readout, and audio.

The follow-up consistency audit also completes FR-55: Hear now has an obvious
three-step start, fixed key/scale context, real Start/Replay/Stop controls, and an
answer reveal generated from the exact progression objects sent to audio. A compact
self-hosted Salamander piano subset replaces the modeled pluck as the scored-ear
default, while the additive voice remains a no-network/file fallback.

## Review and cleanup decisions

- Ousak now distinguishes its historically mobile/neutral melodic 2nd from the
  app's explicitly equal-tempered, fixed-fret practice map.
- Song Map metadata now has orthogonal `tier` and `group` axes, so historical
  layer and functional job no longer appear as competing sibling categories.
- Changes Gym key-count boundaries now come from the same journey sequence used
  by the guide and playback.
- `js/app.js` remains the controller. Extracting existing Solo/Gym renderers was
  rejected for this pass because it would create broad behaviour drift while
  adding no player value. New harmonisation logic was instead isolated in the
  pure, DOM-free `js/chord-map.js` IIFE.
- Full SVG rebuilds were measured at 0.6–0.8 ms for the five actual D-mode maps
  on the test machine. That is comfortably below a frame budget, so incremental
  SVG mutation was not introduced.
- Native SVG and existing fretboard primitives remain the right visual toolkit:
  the app works from `file://`, offline, and without a build step. A charting or
  animation dependency would increase failure modes without improving this
  specific fretboard rendering job.
- The fretboard no longer scrolls horizontally. A continuous full neck scales into
  tablet/desktop space; the phone contract folds 24 frets into two 12-fret rows.
- The old unexplained `C B♭ A♭ G♭ E D` decoration is now a labelled moving-key
  control derived from the active 1/3/6-key journey, with explicit Now and Next
  states and click-to-audition behavior.

## FR-54 theory and interaction contract

- Triad quality is derived by stacking scale degrees 1–3–5 from
  `Modes.scaleOf`; spelling and symbols continue through the existing mode
  helpers.
- `MI-07c` locks the complete D ground truth for Major, Natural minor, Harmonic
  minor, Ousak, and Hijaz.
- Diminished and augmented outcomes remain visible and are described as derived
  study material rather than silently replaced with familiar chords.
- Prominence is an exact count of the current documented Song Maps. It is never
  presented as a universal claim about Greek practice.
- The lower 1–4 / upper 5–8 view is labelled a four-note practice lens, not a
  universal historical tetrachord analysis.
- The visible target, next target, spoken cue, fretboard rings, and audio all
  originate from the same selected chord object.

## FR-56 Harmony Matrix contract

- Major, Natural minor, Harmonic minor, Ousak, and Hijaz are the complete scope;
  the interface does not imply that these five exhaust Greek modal practice.
- “Home”, “Returns home”, “Primary”, “Working colour”, and “Derived only” are
  functional study labels computed separately from the displayed documented-map
  usage count. A frequently occurring chord is not silently promoted to a
  universal genre rule.
- Opening a scale shows its formula, exact scale notes, actual documented routes,
  and only defensible doors: a seven-note relative/sister identity, a named
  six-note parallel switch, a route containing the destination tonic, or the
  whole-step ii–V–I pivot in which the old I becomes the next ii.
- Every door states the shared-note count and reason. It is explicitly a practice
  comparison, not proof that a song has modulated.
- The table fits without internal horizontal scrolling at iPad portrait width;
  on a phone only the table pans horizontally while the page and fretboard remain
  fixed to the viewport.

## Verification performed

- `npm run check && npm test`: 39/39 tests passing; 171/171 embedded theory
  invariants in the browser.
- Display/sound consistency matrix: 2,088 progression chord tones across every
  tonic, dromos and documented map; each symbol, spelling, interval glyph and
  sounding pitch is asserted. The audit found and fixed the `F♭`→`E` root
  respelling edge case (`E–G♯–B`, not `E–A♭–B`).
- Exhaustive theory matrix: 60 tonic × dromos maps, every degree, all five
  tunings; 2,100 playable-grip checks through fret 15.
- Exhaustive seventh matrix: all 60 tonic × dromos rows, 1,680 displayed chord
  tones, every declared quality, spelling/pitch-class match, and a playable
  compact four-note grip on every supported tuning.
- Scale-door regressions lock D minor→F major, D harmonic minor→A Hijaz, the
  Natural/Harmonic-minor and Ousak/Hijaz six-note switches, and the D-major→C-major
  cycle rule where D I becomes C ii.
- Static control contract: unique IDs, a stable ID/delegated-data contract for
  every `button`, `input`, and `select`, and an explicit handler for each family.
  This proves wiring coverage, not full behavioural DOM coverage for every
  legacy feature.
- Browser behaviour for every new Chord Map control: tonic, dromos, degree,
  comparison-cell navigation, target selection, chord/target/arpeggio audio,
  inversion cycling, tuning changes, keyboard stepping, and cross-view cleanup.
- Responsive geometry and source checks lock the no-scroll continuous/folded neck
  contract; the current live browser was rechecked at 1440 px with zero page or
  fretboard-wrapper overflow.
- Accessibility check of the rendered view: no duplicate IDs, no unnamed
  visible controls, no sub-38 px visible targets, and a fretboard `aria-label`
  that names the actual chord and current/next target.
- Local static-server `/api/session` 501 and `/api/release` 404 responses remain
  expected. The production coach configuration was intentionally not changed.
- Hear browser regression covered Start, replay, stop-without-losing-answer,
  disabled post-check controls, exact reveal, per-chord audition controls, and the
  known-home/full-map path with no console warnings or errors.
- Preview deployment identity is asserted against shell release 17, so the
  public release endpoint cannot silently report a stale application version.

## Known boundary

The control contract raises the regression floor without pretending a source
scan is a full browser integration suite. Existing music engines retain their
headless invariant tests; new Chord Map interactions received real browser
coverage. A future test-infrastructure PR may add a small DOM harness, but this
feature does not add a framework or dependency merely to simulate the browser.
