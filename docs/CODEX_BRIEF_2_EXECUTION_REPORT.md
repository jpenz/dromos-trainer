# Codex Brief 2 execution report

Date: 2026-08-16  
Branch: `codex/brief-2-hardening`  
Input: merged PR #13, `docs/CODEX_BRIEF_2.md`

## Outcome

The brief was executed in its required order: read-only audit and report first,
then regression gates, then player-facing changes. The browser app remains
framework-free, build-free, and usable from its static/offline shell. Release
identity is now app version 20 with service-worker cache 21.

The largest player change is a pulse-first Comp curriculum. Comp now begins
with the selected Greek rhythm rather than a chord-shape browser, progresses
through three explicit levels, starts real transport, and moves a visible
pulse cursor while the progression sounds. The existing voice-led triads remain
the harmonic layer under that rhythmic job.

## Audit findings before changes

- Baseline was clean at merged commit `65357c5`: syntax checks and 41/41 tests
  passed.
- Static HTML controls had a contract test, but dynamically rendered controls,
  JavaScript-applied classes, literal DOM IDs, all offline scripts, and every
  exported module self-test were not guarded generically.
- The new gate immediately found one real inert class: `held-next` was applied
  to shared pitches in the coming triad but had no visual rule.
- Solo Toolkit used `role="tab"` without arrow navigation, roving `tabindex`, or
  a tab panel. Re-rendering a selection dropped keyboard focus to `<body>`.
- Formula Bank promised a card swap but rendered a fixed list. Motif Ladder and
  Thirds Shadow implied fretboard visualizations they did not render.
- Comp did not implement the brief's skeleton-first curriculum and could not
  start transport from the Comp page.
- Only Ousak's ascending mobile 2nd/6th was represented. The UI did not disclose
  that other descending runs simply reversed the declared fixed collection.
- `js/app.js` was 3,527 lines and spans unrelated application domains. Extraction
  is justified, but doing it before behavior contracts would have enlarged this
  change without adding player value.
- The brief's “no runtime dependencies” statement did not match the merged
  repository: the optional server API declares `@neondatabase/serverless`.
  Requirements now distinguish the dependency-free browser runtime from the
  declared API dependency.

## Regression hardening

`test/inert-contracts.test.js` adds five generalized gates:

1. every control rendered by `app.js` needs at least one handled `data-*`
   contract;
2. every literal class added/toggled by JavaScript needs a CSS selector;
3. every literal `$(id)` reference needs static or app-rendered markup;
4. every versioned script in `index.html` needs a service-worker shell entry;
5. every exported module `selfTest()` needs to run in the core Node suite.

Each gate also runs against a deliberately sabotaged in-memory source and must
throw. This proves the test detects the class of failure it claims to guard.

## Solo Toolkit decisions

- Land / Move / Speak now form one complete ARIA tab interface. Tool choices
  are a toolbar with pressed state rather than a second incomplete tablist.
- Arrow, Home, and End keys activate choices; focus is restored after the
  selected control is replaced by rendering, including on the frame after a
  keyboard event finishes.
- Formula Bank deals four unique app-derived routes. Pressing a card swaps only
  that slot for another unique route and restores focus to the changed card.
- Motif Ladder copy now says that the player supplies/transposes the cell and
  uses the visible chord strip and phase controls. It no longer promises a ghost
  overlay.
- Thirds Shadow names its written pair rail and explicitly says that the neck
  continues to show the primary landing map. It no longer implies a rendered
  second voice.

## Pulse-first Comp

Every style preset exposes three levels through pure `StyleLibrary.compPlan`
data, independently testable without the DOM:

- Level 1: accents only; clap or mute before adding harmony.
- Level 2: the disclosed bass/chord skeleton.
- Level 3: free right hand while preserving the same audible anchors.

The exact brief contracts are locked:

- Zeibekiko marks 1/3/5/7 and leaves 8–9 empty.
- Hasapiko starts bass on 1 / chord on 2, then adds one walking tone and reply.
- Sparse Tsifteteli 1/4 accents remain distinct from the separate eight-unit
  3+3+2 Level-2 study.
- Hasaposerviko is a selectable fast two-beat bass/chord preset.

Kalamatianos and Roumba receive disclosed trainer scaffolds derived from their
already declared beat groups. The UI labels every plan a trainer skeleton, not
a complete or universal traditional arrangement. The Song Map still owns the
dromos and harmony.

Comp transport now advances the selected progression, redraws the voice-led
triad, and highlights the relevant pulse unit. The global sampled-piano chord
voice remains the stable harmonic reference; optional bass and percussion stay
timing aids.

## Descending-model boundary

`Modes.movementPolicy()` makes the limitation explicit:

- Ousak: hollow dots are verified ascending alternatives for the 2nd and 6th;
  the descending trainer returns through the core fixed-fret collection.
- Major, Natural minor, Harmonic minor, and Hijaz: the app states that it uses
  the same declared collection in both directions and has encoded no additional
  directional form.

No interval collection was invented to fill a source disagreement.

## Highest-value player improvement chosen

The animated, playable Comp skeleton was selected over three alternatives:

- incremental SVG rendering, because measurement showed no frame-budget problem;
- immediate `app.js` extraction, because it adds maintenance value but no direct
  practice outcome and is safer after the new contracts;
- a speculative motif/thirds fretboard overlay, because the current UI has no
  captured phrase from which to derive a truthful player-specific overlay.

Comp transport was the strongest choice against the app's stated purpose: ear,
rhythm, studio/live readiness, and usable Greek accompaniment. Before this
change, its page could not play and placed shapes before pulse.

## Performance measurement

A DOM-construction benchmark rendered a 24-fret guitar D Hijaz map with scale,
pentatonic, and current/next target layers:

- 708 SVG nodes;
- 0.138 ms mean;
- 0.118 ms median;
- 0.247 ms p95;
- 0.557 ms maximum across 500 measured renders.

This excludes browser layout and paint, so it is not a full rendering profile.
The real browser interaction remained visually immediate; the observed problem
was whole-region focus loss, which was fixed. Incremental SVG mutation was not
introduced.

## Verification

- `npm run check`: pass.
- `npm test`: 50/50 pass.
- Inert contracts: all five real-source checks and all five sabotage proofs pass.
- Existing exhaustive map matrix remains intact: 12 tonics × 5 dromoi × 5
  tunings, including 2,100 playable triad checks and the full seventh-tone audit.
- Exact Comp regressions cover every preset at all three levels plus the four
  brief-specified rhythm contracts.
- Movement-policy regressions cover all five dromoi.
- Browser, 375 px viewport: each Solo Toolkit pillar and one tool within it
  selected correctly; focus remained on the chosen control; arrow navigation
  activated the next pillar; Formula Bank changed exactly one card.
- Browser, 375 px viewport: Guitar (6), tetrachordo bouzouki (4), mainland
  laouto (4), trichordo bouzouki (3), and drop-D guitar (6) all redrew the Solo
  map with the correct instrument in its accessible name and no page overflow.
- Browser: Comp changed from Hasapiko to Hasaposerviko, rendered the correct
  Level-2 jobs, started with Space, moved the visible cursor, and stopped cleanly.
- Reduced-motion CSS removes Comp transitions and existing Solo animations keep
  equivalent textual/ARIA state. The connected in-app browser did not expose a
  media-emulation capability, so runtime `prefers-reduced-motion` emulation is a
  remaining test-infrastructure gap rather than a claimed browser run.

## Known boundaries

- Production coach/account persistence still requires owner-side Vercel
  provisioning: `COACH_SESSION_SECRET`, `DATABASE_URL`, and model credentials.
  This change does not pretend code can supply those secrets.
- `app.js` should be extracted by stable domain after the new contracts settle;
  it should not be rewritten wholesale.
- Additional directional dromos behavior requires agreed, cited source data.
- Formula Bank remains an explicitly app-derived route rack, not a transcription
  or claim about canonical recorded phrases.
