# Codex execution report — FR-54

Date: 2026-08-13
Branch: `agent/fr-54-dromos-chord-map`

## Outcome

The takeover brief was executed in its requested order: cleanup, regression
hardening, then the Dromos Chord Map. The result keeps the zero-build browser
architecture and adds no front-end package or CDN dependency.

The Chord Map lives under **Harmony** because it is designed to be consulted
while practising a progression: choose a tonic and dromos, inspect all seven
derived triads, hear one, locate a practical grip, and move among its root,
3rd, and 5th targets. The five-dromos comparison is a reference table inside
the same view.

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

## Verification performed

- `npm run check && npm test`: 35/35 tests passing.
- Exhaustive theory matrix: 60 tonic × dromos maps, every degree, all five
  tunings; 2,100 playable-grip checks through fret 15.
- Static control contract: unique IDs, a stable ID/delegated-data contract for
  every `button`, `input`, and `select`, and an explicit handler for each family.
  This proves wiring coverage, not full behavioural DOM coverage for every
  legacy feature.
- Browser behaviour for every new Chord Map control: tonic, dromos, degree,
  comparison-cell navigation, target selection, chord/target/arpeggio audio,
  inversion cycling, tuning changes, keyboard stepping, and cross-view cleanup.
- Responsive browser checks at 1440 px, 1024 px, and 390 px: no horizontal page
  overflow; the wide neck and five-dromos comparison scroll internally.
- Accessibility check of the rendered view: no duplicate IDs, no unnamed
  visible controls, no sub-38 px visible targets, and a fretboard `aria-label`
  that names the actual chord and current/next target.
- Local static-server `/api/session` 501 and `/api/release` 404 responses remain
  expected. The production coach configuration was intentionally not changed.

## Known boundary

The control contract raises the regression floor without pretending a source
scan is a full browser integration suite. Existing music engines retain their
headless invariant tests; new Chord Map interactions received real browser
coverage. A future test-infrastructure PR may add a small DOM harness, but this
feature does not add a framework or dependency merely to simulate the browser.
