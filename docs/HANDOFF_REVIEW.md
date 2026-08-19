# Handoff: review brief for the next model

> **Current-state note (2026-08-17):** this review records an earlier release.
> FR-63/MI-32 now add explicit, on-device Melody sing-back. The statements below
> that the app has no microphone are historical and must not override the live
> requirements or `docs/PITCH_SINGBACK_DECISION.md`.

Copy everything below the line into the reviewing model, with the repo attached
or cloned. It is written to be self-contained: it states what the app is, what
just changed and why, what is deliberately NOT there, and the exact standards
this codebase is held to.

---

## Your job

You are reviewing and continuing **Dromos Trainer**, a Greek-music (rebetiko /
laiko) practice web app for bouzouki (4-course CFAD and 3-course), guitar, and
mainland laouto. Repo: `jpenz/dromos-trainer`. It is a zero-build static site
plus `/api` serverless functions on Vercel, deployed at
https://dromos-trainer.vercel.app.

The owner is an advanced player and builder. He does not want features added to
have features. Every exercise must earn its place against the best practice of
**this genre**, and anything imported from jazz pedagogy must be labelled as
such and justified by transfer, not by tradition.

## Read these first, in this order

1. `docs/REQUIREMENTS.md` — the invariants (MI-*) and features (FR-*). Chord
   spellings are locked here and mirrored in tests. Do not edit chord tables
   without updating both.
2. `js/theory.js` — the 18-chord ii–V–I wheel through six keys falling by whole
   step (C, B♭, A♭, G♭, E, D). Ground truth is asserted in `selfTest`.
3. `js/harmony-journey.js` — ONE source of truth for current/next harmony. The
   guide, the strips and playback all consume it, so the display cannot drift
   from the audio. Bar durations live here (`durationBars`).
4. `js/modes.js` — dromoi, scales, pentatonic frames, tetrachords, and the
   per-dromos progression banks.
5. `js/app.js` — the whole UI and playback controller (large; read by section).
6. `js/audio.js` — Karplus-Strong pluck voices, an additive piano voice, the
   Greek-pulse transport.

## The architecture rule that matters most

**The screen must never claim something the audio does not do.** That is why
`harmony-journey.js` exists and why playback, the progression strips and the
change guide all read from it. If you add a visual cue, wire it to the same
model the transport uses.

## What just changed (and why)

A five-lens sourced research pass (Greek dromoi pedagogy, laiko/rebetiko
harmony, 3rds-targeting pedagogy, Greek rhythm comping, practice-app UX)
followed by an adversarial trim produced these changes. All are shipped.

### Exercise set consolidated
- "Full Cycle" and "ii–V–I" were **the same exercise** as the pivot drill at
  different zoom levels. They are gone as tabs and are now `Keys: 1 / 3 / 6`
  settings of the flagship **Changes Gym** (`state.gym`).
- Every key is **four 4/4 bars: ii · V · I · I**. The tonic holds two bars
  (`state.holdI`, on by default), then the pivot lands on the downbeat of bar 5.
- The pivot moment is explained where it happens: *"Same chord, new job. Its
  3rd drops one fret (F♯ → F) and your I becomes the next key's ii."*
- **Skeleton drill** (`gymNotes`): one whole note per chord, just the 3rd. It
  is the documented first "playing the changes" exercise. It is NOT gated — the
  app has no microphone or pitch detection, so it cannot detect a clean pass,
  and inventing an unlock would be a lie.
- **Taximi bridge**: instead of pivoting, the pulse stops and a drone sounds on
  the next tonic for a free, unmetered phrase. A taximi is unmetered by
  definition, so it has no bar count and waits for the player to resume.

### Solo map layers
- Nearest-thread tracer on the neck (`soloLandingThread` + `opts.tracer`): it
  connects the CLOSEST pair of now/next landing tones, up to a minor 3rd, and
  **draws nothing when the closest move is a leap**. It must stay honest — in D
  major the sweet 2→3 is E→C♯, a minor 3rd, not a half step.
- Lean → arrive choreography via `svg.lean-phase` / `svg.arrive-phase`.
- One-course road toggle (single-string discipline), and Ousak **mobile tones**
  (sharpened 2nd/6th on the way up) as hollow dots. Crucially, mobile tones are
  a fretboard hint ONLY and never enter the strict ear-training collections —
  MI-06 still holds.
- Steps renamed: Road / Frame / Cells / Changes / **Taximi** (new capstone).

### Song Map tiers
`Piraeus · modal` leads (the i–III relative-major oscillation was added; it is
the most-cited early rebetiko progression), `Laiko · Westernized` follows. This
mirrors the documented historical layering: functional Western harmony is a
later laiko layer, not the modal core.

### Audio
Every plucked note used to layer a fundamental oscillator that sustained up to
0.8s — audible as a **sine drone humming under the chord** after the strings
decayed. It is now a 0.11s attack thump; the string model carries the tone
(longer decay coefficients, more body, softer tail). Chords ring for the whole
bar (`beatsPerBar * secPerBeat() * 1.08`) instead of a fixed 2.2s.

## What was deliberately CUT, and must not be re-added casually

The adversarial pass removed these. If you want them back, bring evidence:

- **Staff-notation strip** for the guide-tone thread. The app is fretboard-first
  and the neck line already carries the lesson.
- **Auto-inserted chromatic approach notes** ("Barry Harris beat arithmetic").
  The source documents bebop dominant scales, not a generic algorithm, and
  auto-generated chromatic filler does not transfer to modal laiko lines.
- **Hard unlock gating** on the skeleton drill. No input channel exists to
  detect a clean pass.
- **Banning the plain metronome.** Greek pulses are the default backing, but
  the click stays selectable — practising dromoi to a metronome is itself
  documented pedagogy.
- **"Aim at: <recording>" pairings.** Attractive, but every dromos/progression
  pairing would need a citable source; inventing them is fabrication. If you
  build this, gate it: no documented pairing → show nothing.

## Standards you must hold

1. **No unsourced claims in player-facing copy.** If the app says Greek
   musicians do something, it must be true or explicitly labelled as a gym
   exercise. The Changes Gym carries a permanent honesty line for exactly this
   reason: the whole-step pivot wheel is a voice-leading gym, not a documented
   kompania device.
2. **Tests are the contract.** `npm run check && npm test` must pass (currently
   30/30). Music invariants run in a `vm` sandbox in `test/core.test.js`;
   shell/wiring assertions live in `test/redesign-shell.test.js`. Add a test
   with any behavioural change.
3. **No build step.** Plain ES5-compatible browser JS in IIFEs on `window`, no
   bundler, no framework, no dependencies. Keep it that way.
4. **Comments explain constraints, not narration.** Match the existing density.
5. **The service worker is network-first** (`sw.js`), so online players always
   get fresh code; the cache is an offline fallback only.

## Open items worth your judgement

- `/api` returns 503 `coach_not_configured` in production: the Vercel project
  has **no environment variables** set. The coach needs `COACH_SESSION_SECRET`,
  `DATABASE_URL` (Neon) and `GEMINI_API_KEY`. The UI degrades gracefully and
  says so. Nothing is broken; it is unprovisioned.
- The Changes Gym at `Keys: 3` still renders the 18-chord journey model, so the
  change guide can preview a 4th key at the wrap while the audio loops 3. An
  accepted edge; fixing it properly means teaching `harmony-journey.js` about
  key counts.
- Comp was specced to be rebuilt "skeleton first" per Greek pulse (zeibekiko
  anchoring 1/3/5/7 with the 7-8-9 tail unfilled; hasapiko bass-on-1 /
  chord-on-2; tsifteteli stressing 1 and 4). **Not yet built.** This is the
  largest remaining piece of the research spec.
- The Solo map currently follows the Song Map progression. Wiring it to follow
  the Changes Gym loop was specced as the first integration slice.

## How to verify your work

```bash
npm run check && npm test
```

Then serve the repo statically (`python3 -m http.server`) and check in a
browser: the `/api` calls will 501/404 locally, which is expected. Confirm
the left nav, the Changes Gym key settings, the pivot banner text, and the
Solo → 4 Changes tracer. Production deploys automatically on push to `main`.
