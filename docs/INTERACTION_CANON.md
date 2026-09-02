# Interaction Canon — Dromos Trainer

Every interactive element in this app has **designed** states and feedback. This canon is
the law for every page PR and every future control; the redesign blueprint
(`docs/REDESIGN_BLUEPRINT.md`) owns information architecture, this document owns **feel**.
Zero dependencies; every mechanism is CSS or the existing WAAPI/View-Transitions kit;
`prefers-reduced-motion` zeroes all of it through the duration tokens.

## 1. The state system (every control, no exceptions)

| State | Treatment | Timing |
|---|---|---|
| Rest | token-styled per component | — |
| Hover (fine pointers only) | 1px lift + `--line-strong` border | `--dur-1 --ease-out` |
| Focus-visible | 2px `--turquoise` ring, 2px offset — identical everywhere | instant |
| Active/press | compress to `scale(.97)` — works on touch, where hover doesn't exist | `--dur-1` |
| Disabled | `.45` opacity, no pointer events, no hover | — |

Applies to: `.mini`, `.tbtn`, `.seg button`, `.deck-start`, `.today-card`, `.roadmap-chord`,
`.picking-levels button`, `select`, `summary`, `input[type=range]` thumbs.

## 2. The beat is the heartbeat of the interface

While the transport plays, the interface breathes **in time**:
- The Play button carries a pulse ring on every beat; beat 1 of the rhythm pulses stronger.
- The `.roadmap-chord.now` chip pulses with the same clock.
- In the Picking Lab, the Start/Stop button pulses on every click beat of the drill.

Mechanism: the transport's existing `onBeat(when, now)` callback fans out to
`beatPulse()`, scheduled to the audio clock (`when - now`), gated by `motionOK()`.
Pulses are class-retriggered CSS animations at `--dur-1`; they never touch layout.

## 3. Play is a morph, not a label swap

`▶ Play ↔ ■ Stop` changes ride a scale tick (`press-tick` keyframes, `--dur-2 --ease-spring`)
so starting and stopping *feel* like actions, not text edits.

## 4. Things enter, they don't pop

Re-rendered content animates in through `@starting-style` (new DOM nodes fire entrance
transitions natively — no JS): roadmap chips, today cards, picking event tiles, banners.
Fretboard path dots cascade in with a 12ms-per-dot stagger. Exits are instant —
never make the player wait to leave.

## 5. Sound has visual acknowledgment

Any control that triggers audio shows its press state immediately (compress), regardless
of audio-context readiness; readiness itself speaks through the existing status lines
(`audio-ready-status`), never through silence.

## 6. Empty and first-run states are designed, not blank

The `.empty-state` component (one line of purpose + one action) stands in wherever a list
or result area can be empty. A blank region is a bug.

## 7. Accessibility is part of the craft

Focus order follows the visual pyramid; `:focus-visible` is always visible; touch targets
are ≥44px on coarse pointers (token-enforced); `aria-live` announcements stay; reduced
motion collapses all of the above to instant, complete state changes.

## Integration checklist (added to every page PR's acceptance gate)

1. Every interactive element responds to hover/focus/press per §1.
2. If the page can play audio, something pulses on the beat per §2.
3. Re-rendered collections animate in per §4.
4. No blank empty regions per §6.
5. Verified once with reduced motion enabled.
