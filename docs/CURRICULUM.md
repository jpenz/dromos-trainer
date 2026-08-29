# Dromos Trainer curriculum

## Purpose

Dromos Trainer develops an intermediate fretted player's ability to **hear a song's
harmonic motion, find it instantly on their own neck, comp it with economical
voicings, and solo through it intentionally**. It is for guitar, tetrachordo
bouzouki, trichordo bouzouki, and mainland laouto (`A D G C`).

The app is not a song recogniser and does not promise that theory replaces
listening. Its job is to close the gap between hearing a change, naming its
function, and executing a useful shape or line before the next chord arrives.

## The repeatable practice loop

| Step | Question the player answers | Trainer | Evidence of progress |
|---|---|---|---|
| 1. Hear | What function is moving, and where does it resolve? | Cycle | Player predicts the next `ii` when the `I` pivots down a whole step. |
| 2. Map | Which dromos/key/progression am I hearing? | Song Map | Player names the progression and sees its chord functions and flavour degrees. |
| 3. Comp | What is the closest useful three-note response? | Triads | Player follows a low-travel triad path in multiple string sets/inversions. |
| 4. Solo | Which notes make the line explain the harmony? | Solo Lab | Player starts from the mode's pentatonic frame and arrives on 3rds or guide tones at changes. |
| 5. Recall | Can I identify the colour without the fretboard? | Ear | Player identifies the dromos from cadence plus melody. |

Run the loop on one progression and one position before changing key, dromos, or
instrument. The default 20-minute session is four minutes per step.

Picking Lab is the motor-to-music path inside steps 3 and 4. Its fixed order is
**ta–ka attack → coordination → neck route → phrase language → performance
transfer**. Articulated lines receive one pick attack per displayed note. Tremolo is
an explicit sustain exercise, not the default pronunciation of a scale or phrase.
See [BOUZOUKI_MASTERY.md](BOUZOUKI_MASTERY.md) for the source hierarchy, exercise
gates, and lawful-ingestion boundary.

## Teaching principles

1. **Function before shape.** `ii–V–I` is heard and named before it is fingered.
   The Cycle is deliberately infinite: each `Imaj7` becomes the next `iim7`, so the
   learner cannot rely on a fixed beginning or ending.
2. **One neck, many instruments.** Every diagram is generated from the selected
   tuning. No guitar-only diagram is treated as universal.
3. **Triads are the harmonic minimum.** A player who can hear and connect the
   three-note shape can comp clearly and chord-solo without waiting for a full grip.
4. **Pentatonic is a frame, not the answer.** It provides safe motion; a targeted
   chord tone makes the line reveal the change. Hijaz specifically uses dominant
   pentatonic (`1 3 4 5 ♭7`), never minor pentatonic.
5. **Greek identity lives in melody, harmony, and pulse.** A shared pentatonic or
   a few common chord skeletons never proves a dromos. Recall uses strictly
   coherent practice maps; the Analyzer treats repertoire-specific mixture as
   context-dependent. Future rhythm work must support the repertoire's meter
   instead of forcing every practice loop into 4/4.
6. **Use landmarks, then phrase.** Start with a compact triad and the current/next
   target; connect them with a pentatonic frame or dromos-specific cell. A full-neck
   scale is context, not a soloing instruction.

See [RESEARCH.md](RESEARCH.md) for the books, teaching methods, and player-thinking
principles behind these decisions.

## Scope by release

### Current foundation

- Infinite ii–V–I pivot ear/visual drill.
- Major, Natural minor, Harmonic minor, Ousak, and Hijaz; progression banks and ear prompts.
- Generated grips, scale paths, triad maps, and low-travel triad paths.
- Guitar, drop-D guitar, tetrachordo bouzouki, trichordo bouzouki, and mainland
  laouto.
- Solo Lab target map: pentatonic frame plus current/next 3rd or guide-tone targets.
- Picking Lab: 13 provenance-labelled exercises progressing from ta–ka attack to a
  chord-target arrival, with articulation contracts, measured gates, looping, and
  key/position evolution.
- Foundation & Styles: a modern improvisation foundation, then selectable Zeibekiko,
  Kalamatianos, Hasapiko, Tsifteteli, and Roumba pulse maps. A style controls
  phrase placement and accompaniment role; Song Map still controls dromos and harmony.
- Study Analyzer: user-entered chord maps and chord-aligned solo fragments explain
  function, modal colour, target notes, and a next drill. It is transparent and
  conditional by design; it does not claim to transcribe or conclusively classify audio.
- Concept Pyramid: time/form, harmonic/modal map, melodic route, and touch/instrument
  role are taught as separate, complete causes of an intentional phrase.
- Installable, offline-capable browser app with no runtime dependency or build step.

### Next curriculum milestones

1. **Song-change ear drills:** hear an isolated progression, then identify its
   function by ear before revealing the neck.
2. **Idiomatic phrase library:** short *seira* for Ousak, Hijaz, Minor, Major,
   rebetiko, laïko, and nisiotika; avoid treating a descending scalar run as a style.
3. **Meter and backing practice:** 2/4, 4/4, 7/8, and 9/8 with count-in,
   subdivisions, and a simple backing/loop player.
4. **Song study maps:** a transparent, user-entered progression map—not a
   copyrighted-song database—so any heard song can be transcribed into functions,
   then practised across the selected instrument.
5. **Progress tracking:** local-only session history, weak targets, and spaced review.

## Quality bar

Every curriculum addition needs a requirement ID, a musical invariant where a rule
must never drift, a headless regression test, and an in-browser verification. The
app must remain touch-friendly at phone and iPad widths and work offline after its
first browser load.
