# Codex brief 2 — audit, harden, and finish the Solo lab

You are taking over **Dromos Trainer** (`jpenz/dromos-trainer`), live at
https://dromos-trainer.vercel.app. Zero build step, deploys from `main`.

Read in this order before touching anything:
1. `docs/HANDOFF_REVIEW.md` — architecture rules and what a research pass changed.
2. `docs/CODEX_BRIEF.md` — the first takeover brief. Much of it is done; the
   open items at its end are still open.
3. `docs/REQUIREMENTS.md` — FR-* features, MI-* invariants. Chord spellings are
   locked here and mirrored in tests.

This brief assumes all three. It has four jobs, in order.

---

## The laws of this codebase

Violating any of these is a defect regardless of how good the feature is.

1. **No build step, no dependencies, no framework.** Plain browser JS in IIFEs
   on `window`. `package.json` has no runtime deps and must keep none.
2. **The screen must never claim something the audio does not do.**
   `js/harmony-journey.js` is the single source of truth for current/next
   harmony; guide, strips and transport all read it.
3. **The app has no microphone.** It cannot hear the player. Never ship a
   feature that implies detection — no scoring of performance, no unlock
   gating, no "we heard you play X". Pass tests are self-scored by design.
4. **Derive, don't tabulate — then assert the derivation.** `js/theory.js`
   generates the cycle and checks it against a `GROUND_TRUTH` table. Follow it.
5. **Diatonic spelling (MI-04).** Use `Modes.nameFor` / `Modes.simplify`. Note:
   `parseName` returns `letterIdx`, not `li` — getting this wrong silently
   produces `C?` and `undefined` in the UI (it already happened once).
6. **No unsourced musical claims in player-facing copy.** Imports from other
   traditions wear a visible label. Precedent: the Changes Gym ships a
   permanent "voice-leading gym, not folklore" line; the Soloist Toolkit has
   `importLabel` badges.
7. **`npm run check && npm test` must pass. 41/41 today, and must only grow.**

---

## Job 1 — Adversarial audit

Do this first and report before changing anything else. You are looking for
the class of defect that passes review because the UI *looks* finished.

### The specific failure mode to hunt

Three times now, work has shipped where a feature was **declared but inert**:
a toolkit flag no code consumed, a CSS class applied with no rule behind it, a
`data-*` attribute wired to nothing. Each looked complete on screen. A gate in
`test/core.test.js` now catches this for `SoloToolkit.choreo` keys only.

**Generalise that gate.** Write checks that fail when:
- any `data-*` attribute rendered by `js/app.js` has no matching handler,
- any CSS class applied in JS has no rule in `css/styles.css`,
- any element id referenced by `$("...")` does not exist in `index.html`,
- any `js/*.js` loaded by `index.html` is missing from the `sw.js` shell
  (this one exists — extend the pattern, do not duplicate it),
- any exported `selfTest()` is not actually run by `test/core.test.js`.

Prove each new gate by breaking the thing it guards and showing it fails.
A gate you have not seen fail is not a gate.

### Also audit

- **Dead code and drift** between the cycle/gym renderers and the progression
  renderers, which have diverged over several passes.
- **`js/app.js` size.** It is very large and owns state, every renderer,
  playback and all wiring. Do not rewrite it. Do evaluate extracting cohesive
  units behind the same IIFE convention — the Solo lab renderers and the
  toolkit rails are the most separable. **A justified "leave it" is an
  acceptable and expected outcome**; a speculative refactor that risks
  behaviour drift is not.
- **Accessibility**: keyboard reachability of the toolkit pillars/tools/phases
  (they are `role="tab"` — verify the pattern is complete or simplify the
  roles), focus survival across re-render, `aria-live` regions that actually
  announce, and the fretboard `aria-label` staying truthful as layers change.
- **Mobile**: the toolkit card, phrase-arc chips and side rails at 375px. The
  fretboard already scrolls; nothing else may force horizontal page scroll.
- **Performance**: `FB.render` rebuilds the entire SVG on every state change,
  and the Solo map is now the heaviest view. **Measure before optimising** and
  record the measurement; if it is imperceptible, say so and leave it.

---

## Job 2 — Finish what is genuinely unfinished

These are known gaps, not speculation.

### 2a. Comp — the largest outstanding piece
An earlier research pass specced Comp to be rebuilt **skeleton-first** per
Greek pulse, and it was never built. The documented shape:
- **zeibekiko** anchors on 1/3/5/7 with the 7-8-9 tail left unfilled,
- **hasapiko** bass-on-1 / chord-on-2 with the bass walking,
- **tsifteteli** stresses 1 and 4 (the fuller 3+3+2 cycle is a level-2 pattern,
  not the same thing — do not conflate them),
- **hasaposerviko** is fast hasapiko, worth a preset.
Level 1 is accents only, level 2 adds the idiomatic pattern, level 3 frees the
right hand. The pulse group data already exists in `js/styles.js`.

### 2b. Toolkit tools that are text-only
Several Soloist Toolkit tools describe an exercise the map does not yet
support: **Formula Bank** deals from a disclosed app-derived deck rather than
real phrases; **Motif Ladder** has a phrase meter but does not visualise the
cell moving to the next degree; **Thirds & Sixths Shadow** lists diatonic third
pairs but does not overlay the second voice on the neck. Decide per tool
whether to build the visual or simplify the copy so it stops promising one.
**Simplifying the copy is a legitimate outcome** — an honest text tool beats a
half-drawn animation.

### 2c. Descending forms
Several dromoi differ ascending vs descending. Only Ousak's mobile 2nd/6th is
modelled (`Modes.mobileTonesOf`, rendered as hollow dots). Either extend the
model with sourced data or state the limitation in the UI. Do not invent
descending forms — sources disagree, which is exactly why the wider dromoi in
the Field Guide carry no interval numbers.

### 2d. Provisioning, not code
`/api` returns 503 `coach_not_configured` in production because the Vercel
project has **no environment variables** (`COACH_SESSION_SECRET`,
`DATABASE_URL`, `GEMINI_API_KEY`). The UI degrades gracefully and says so.
**Do not "fix" this by deleting the coach.** Flag it; the owner provisions it.

---

## Job 3 — Test every feature for real

Current coverage is strong on music invariants (run in a `vm` sandbox) and
shallow on UI, which is asserted by grepping source text — that proves a
handler exists, not that it works.

- Every interactive control should have a test proving it changes the state it
  claims to. If you add a DOM harness, keep it dependency-free or justify one
  devDependency explicitly.
- Every dromos × every tonic (5 × 12 = 60) across all five tunings: legal
  spelling, playable grips, coherent progression bank. Some exists; make it
  exhaustive.
- The Soloist Toolkit in **every dromos**: no pillar may go empty, mode-gated
  tools must degrade gracefully (Cadence Ramp is scoped to major/minor
  taximia by source and must vanish elsewhere without breaking selection).
- **Report coverage honestly.** If something cannot be tested without a
  browser, say so rather than writing a test that asserts nothing.

---

## Job 4 — One judgement call, argued

After the audit, pick **the single change that would most improve the app for
a player** and argue for it against at least two alternatives you rejected.
Constraints: it must be defensible from the app's own evidence base (the
workshop transcript findings in `docs/`, the research already in the repo), it
must not require a microphone, and it must fit the laws above.

Then build it.

Candidates you may consider, or reject with reasons: the Solo map does not yet
follow the Changes Gym loop (only Song Map progressions); there is no way to
measure progress over months; the Taximi capstone has no recording or playback;
nothing in the app currently teaches the transcription loop the workshop
teacher actually recommended (write it down → do NOT play along → play it back
→ "where am I lost?").

---

## Working agreement

- Small PRs against `main`, each independently reviewable, each green.
- Push to `main` deploys to production. **Verify the live page after each
  merge** — do not leave production broken.
- Report what you did, what you chose **not** to do, and why. A justified
  "I left this alone because the risk outweighed the gain" is a good outcome.
  Silent scope creep is not.
- If you find something in this brief that is wrong, say so and do the right
  thing instead. The brief is a starting position, not an instruction to
  follow off a cliff.
