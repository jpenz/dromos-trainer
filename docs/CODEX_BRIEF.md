# Codex brief: review, harden, and build the Dromos Chord Map

You are taking over **Dromos Trainer** (`jpenz/dromos-trainer`), a Greek-music
(rebetiko / laiko) practice web app for bouzouki (4-course CFAD and 3-course),
guitar, and mainland laouto. Live at https://dromos-trainer.vercel.app, zero
build step, deployed on Vercel from `main`.

Read `docs/HANDOFF_REVIEW.md` first — it carries the architecture rules, what a
recent research pass changed, and what was deliberately cut. Then
`docs/REQUIREMENTS.md` for the FR-* features and MI-* invariants. This brief
assumes both.

You have three jobs, in this order: **review and clean up**, **test every
feature**, then **build the Chord Map feature**. Do not start the feature
before the first two are done — the feature depends on code you will touch.

---

## Ground rules (non-negotiable)

1. **No build step, no dependencies, no framework.** Plain browser JS in IIFEs
   attached to `window`. `package.json` has no runtime deps and must keep none.
   If you reach for a bundler, you have misunderstood the project.
2. **The screen must never claim something the audio does not do.**
   `js/harmony-journey.js` is the single source of truth for current/next
   harmony; the change guide, the progression strips and the transport all read
   from it so the display cannot drift from playback. Any new visual cue wires
   into the same model.
3. **Derive, don't tabulate — then assert the derivation.** `js/theory.js`
   generates the 18-chord cycle from rules and checks it against a
   `GROUND_TRUTH` table in `selfTest()`. Follow that pattern: compute, then lock
   the computation with a ground-truth assertion.
4. **Diatonic spelling (MI-04).** One letter name per scale degree; chord tones
   spelled in thirds from the root letter. `A Hijaz` is `A B♭ C♯ D E F G`, never
   an enharmonic mess. Use the existing `nameFor` / `simplify` helpers in
   `js/modes.js`; do not write new spelling logic.
5. **No unsourced musical claims in player-facing copy.** If the UI asserts that
   Greek musicians do something, it must be true or explicitly labelled as a
   practice-gym construct. Precedent: the Changes Gym carries a permanent line
   saying the whole-step pivot wheel is a voice-leading gym, not folklore.
6. `npm run check && npm test` must pass. It is **30/30 today** and must only
   grow. Music invariants run in a `vm` sandbox (`test/core.test.js`); DOM and
   wiring assertions read source text (`test/redesign-shell.test.js`).

---

## Job 1 — Code review and cleanup

Goal: best-in-class **functionality**, not a rewrite. Preserve behaviour unless
it is a bug. Land this as a series of small reviewable PRs, not one giant diff.

### Known issues to fix (found, not yet addressed)

- **`js/modes.js:108` contradicts `js/modes.js:183`.** The Ousak blurb says "the
  true 2nd is neutral — which is why no chord is built on it", but the Ousak
  progression bank ships `♭II – i` with a major chord built on exactly that
  degree. Resolve it honestly: either the blurb needs to distinguish the
  authentic neutral 2nd (a melodic phenomenon) from the equal-tempered practice
  compromise the app deliberately adopts, or the bank entry needs justification.
  **This matters for Job 3** — a naive harmoniser will hit this same wall.
- **The progression-bank `group` labels now mix two schemes.** A recent change
  retagged the minor bank to `Piraeus · modal` and the harmonic-minor bank to
  `Laiko · Westernized` (a historical layering), but left Ousak, Hijaz and part
  of the major bank on the original job-based labels (`Home loops`, `Cadences`,
  `Modal motion`, `Song endings`, `Turnarounds`, `Lift into home`). The Song Map
  therefore renders a mix of historical tiers and functional jobs as sibling
  headers. Pick one scheme, or make the two axes explicit and orthogonal (a
  tier *and* a job). Update `renderProg`'s grouping and the tests either way.
- **`js/app.js` is 2,864 lines** and owns state, every renderer, playback and
  all event wiring. Do not rewrite it. Do evaluate extracting cohesive,
  side-effect-light units behind the same `window.*` IIFE convention — the
  solo-lab renderers and the cycle/gym renderers are the two most separable
  clusters. If extraction risks behaviour drift, say so and leave it; a
  justified "leave it" is an acceptable outcome.
- **Full fretboard re-render on every state change.** `FB.render` rebuilds the
  entire SVG. Measure before optimising: if it is imperceptible at the app's
  actual sizes, leave it and record the measurement.

### Review checklist

- Dead code, unreachable branches, and duplicated logic (especially between the
  cycle/gym renderers and the progression renderers, which have drifted).
- Event handlers assigned with `.onclick =` in re-rendered innerHTML — confirm
  none leak or double-bind after repeated renders.
- Accessibility: keyboard reachability of every control, `aria-live` regions
  that actually announce, focus not lost on re-render, and the fretboard's
  `aria-label` staying truthful.
- Mobile and tablet: the transport bar, the settings drawer, and wide fretboards
  must not force horizontal page scroll.
- `localStorage` failure paths (private mode) — already guarded in places;
  confirm everywhere.
- Error handling in `api/` — `api/_lib/validation.js` bounds request bodies;
  confirm every endpoint uses it and that failures degrade to a usable UI.

---

## Job 2 — Test every feature

Today's suite covers music invariants well and UI wiring shallowly (by grepping
source text, which proves a handler exists but not that it works).

Raise the floor:

- **Every interactive control** in `index.html` should have a test proving it
  changes the state it claims to. Where a real DOM is needed, you may add a
  lightweight harness — `node:test` plus a minimal DOM shim is acceptable *if*
  it stays a devDependency-free approach or a single well-justified devDep.
  State your choice and why.
- **Every dromos × every tonic (5 × 12 = 60)** must produce legal spelling,
  playable grips on all five tunings, and a coherent progression bank. Some of
  this exists; make it exhaustive.
- **Audio contracts** without a real AudioContext: assert scheduling shape (a
  chord rings for the bar, the fundamental thump stays short, held bars re-comp)
  as `js/audio.js` invariants. Some exist; extend rather than duplicate.
- **The Changes Gym**: key counts 1/3/6 produce the right sequences; the tonic
  holds two bars; the pivot lands on the downbeat of bar 5 with the same root
  and a new key.
- Report coverage honestly. If something cannot be tested without a browser,
  say so explicitly rather than writing a test that asserts nothing.

---

## Job 3 — Build the Dromos Chord Map

**What the owner asked for, verbatim in intent:** pick a key, and see in a
visual, structured way the chords in the scale at each number position, across
each scale, every chord — and the most prominent chords of each scale.

### The deliverable

A new reference view: for a chosen **tonic** and **dromos**, a structured chart
of the chord built on **each scale degree (1–7)**, showing:

- the **degree number** and its **roman numeral** with correct case and quality
  (`i`, `♭II`, `iiø`, `V7`, `♭VII`…),
- the **chord symbol** in the current key (`Dm`, `E♭`, `A7`…),
- its **chord tones** spelled diatonically,
- a **prominence weighting** — which chords are the working vocabulary of that
  dromos versus which are theoretically available but rarely used,
- and it must be **playable**: selecting a chord sounds it and shows a real grip
  on the current instrument's neck.

It should also support **comparing across dromoi** — the same degree row read
across Major / Natural minor / Harmonic minor / Ousak / Hijaz — because that
comparison is precisely what teaches a player why the dromoi feel different.

### How to derive it (and the traps)

1. **Harmonise the actual collection.** Stack thirds from `MODES[modeId].scale`
   itself; do not hand-author a table. `buildChord(tonic, modeId, degOff,
   qualityId, prevBottom)` exists but takes an explicit quality — you will need
   to *derive* the quality from the scale's own intervals, then feed it through
   the existing builder so spelling and voicing stay consistent.
2. **Then lock it** with a ground-truth table in the style of `MI-07a`/`MI-07b`,
   added to `docs/REQUIREMENTS.md` as `MI-07c` and asserted in `Modes.selfTest()`.
3. **Trap — degenerate chords.** Stacking thirds in these collections produces
   diminished, augmented and (in Hijaz especially) genuinely odd triads. Show
   them truthfully; do not silently "correct" them to something more familiar.
   Where a stacked triad is not idiomatic, say so in the cell rather than hiding
   it — the honest label *is* the lesson.
4. **Trap — Ousak's degree 2.** See the contradiction flagged in Job 1. Whatever
   you decide, degree 2 of Ousak must be handled deliberately and explained in
   the UI, never emitted as if it were an ordinary diatonic triad.
5. **Trap — prominence must not be invented.** Do **not** assert "these are the
   primary chords" from your own musical intuition. Two defensible sources:
   - **Derive it from the app's own register**: compute which chords actually
     appear across `PROGRESSIONS[modeId]`, weighted by how many progressions use
     them and in what function. This is self-consistent, verifiable, updates
     automatically when the banks change, and can be stated plainly: *"the
     chords this trainer's documented progressions actually use."* Drive the
     display from the data structure, never from a parallel hand-kept list that
     can silently fall out of sync.
   - **Or cite** a real reference (Greek method books pair each dromos with its
     primary and secondary chords) — but only with a verifiable citation.
   If you cannot source a claim, show the derived weighting and label it as
   derived. Silence beats fabrication.
6. **Do not feed this into scored ear drills** without checking MI-06: every
   scored Recall prompt must be scale-and-harmony coherent, and a full
   harmonisation will contain chords that break that coherence. The chart is
   reference and practice material; `earSafe` gating stays as it is.

### Placement and interaction

- Live it under **Harmony** as a sibling of Changes Gym / Song Map / Comp, or
  under **Learn**. Justify the choice; the deciding question is whether a player
  reaches for it while practising (Harmony) or while studying (Learn).
- Follow the existing design system: tokens `--terracotta` `--turquoise`
  `--aegean`, fonts Fraunces / Inter / IBM Plex Mono, the `.seg` and chip
  patterns already used by the mode tabs and progression strips.
- Responsive: the comparison grid must scroll inside its own container, never
  scroll the page horizontally.
- Reuse `FB.findGrip`, `TR.allShapes` and `AU.playChord` — do not write new
  fretboard or audio code for this.
- Respect `prefers-reduced-motion`, which the stylesheet already honours.

### Definition of done

- `npm run check && npm test` green, with new tests for the harmoniser, the
  prominence derivation, and the view's wiring.
- `MI-07c` ground truth added to `docs/REQUIREMENTS.md` and asserted in code.
- All 60 tonic × dromos combinations render legally on all five tunings.
- Every displayed chord is audible and shows a playable grip.
- No claim in the UI that you cannot source or that is not labelled as derived.

---

## Working agreement

- Small PRs against `main`, each independently reviewable, each green.
- Push to `main` deploys to production automatically. Verify the deployment and
  the live page after each merge; do not leave production broken.
- Report what you actually did, including what you chose not to do and why. A
  justified "I left this alone because the risk outweighed the gain" is a good
  outcome. Silent scope creep is not.
- One open item you will notice: `/api` returns 503 `coach_not_configured` in
  production because the Vercel project has no environment variables set
  (`COACH_SESSION_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY`). That is
  unprovisioned, not broken — the UI degrades gracefully and says so. Do not
  "fix" it by removing the coach.
