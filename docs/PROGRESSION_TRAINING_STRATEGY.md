# Progression, hearing, and solo-training strategy

Status: proposed correction after release 34 review

## Answer first

Dromos must stop treating **a progression**, **a bar-by-bar arrangement**, and
**a practice transformation** as the same object.

`ii–V–I–I` is the clearest example:

- it has **three chord identities**: `ii`, `V`, `I`;
- it has **four harmonic slots**: `ii | V | I | I`;
- it has **one four-bar phrase** whose last two bars establish resolution;
- a slow target-note drill may expand it to eight bars, but that expansion is
  not a different song progression and must not be presented as one.

The correct product model therefore has three layers:

1. **Song harmony:** evidence-backed chord identities and their usual functional
   motion.
2. **Phrase arrangement:** explicit harmonic slots, durations, meter, cadence,
   and repeat behavior.
3. **Practice lens:** Hear, Comp, Target, Phrase, or Technique; a lens may slow,
   thin, repeat, or isolate the phrase without rewriting its harmonic identity.

## Why release 34 needs refinement

Release 34 fixed a real problem: selectable routes now reach home and the visible
roadmap agrees with playback. Its generic duration rule is still too broad:

- the duration is inferred from the number of chord events;
- all four-chord routes are expanded to eight bars whether or not that is their
  best song-feel arrangement;
- `I–vi–ii–V` was changed into a five-event progression even though, as a
  turnaround, `V` normally resolves to the first `I` of the repeat;
- a slow solo-target arrangement can therefore be mistaken for a claim about
  common Greek-song harmonic rhythm.

The release should remain a regression-safe checkpoint, but its inferred timing
must be replaced by authored phrase data before production promotion.

## The content architecture

### 1. Song Changes library - what harmony is doing

This is the authoritative progression bank used by Hear, Harmony, Matrix, and
the Song-following side of Solo.

Organize entries by musical job rather than chord count:

| Family | Ear question | Examples already in scope |
|---|---|---|
| Home motion | Did we leave home, and did we return? | `i–III–i`, `i–♭VII–i`, `I–♭II–I` |
| Cadence | What creates the final pull into home? | `iiø–V7–i`, `iv–V7–i`, `♭II–I` |
| Predominant route | How did the music approach the cadence? | `♭VI–iiø–V7–i`, `IV–V–I` |
| Turnaround | How does the end create the next beginning? | `I–vi–ii–V ↻ I` |
| Modal pedal/drone | Is harmony intentionally sparse? | tonic/fifth pedal, one home chord plus cadence |
| Song form or modulation | How do sections or tonal centers change? | future imported/user-entered Song Maps |

The drone/pedal family is essential. Greek practice must not imply that every
melodic dromos requires continuously changing Western triads.

### 2. Harmonic phrase - when each event happens

Every library item owns an explicit phrase template. Nothing derives duration
from `chords.length`.

```js
{
  id: "ii-V-I",
  label: "ii – V – I",
  events: [
    { degree: 2, quality: "m7", bars: 1, role: "predominant" },
    { degree: 7, quality: "dom7", bars: 1, role: "cadence" },
    { degree: 0, quality: "maj7", bars: 2, role: "resolve" }
  ],
  resolution: { type: "within-phrase", destinationEvent: 2 },
  evidence: { status: "verified", sources: [] }
}
```

The turnaround remains four events and resolves across its repeat boundary:

```js
{
  id: "I-vi-ii-V",
  label: "I – vi – ii – V",
  events: [I, vi, ii, V],
  resolution: { type: "repeat-to-start", fromEvent: 3, toEvent: 0 }
}
```

The roadmap previews the returning `I` as the destination without pretending it
is a fifth independent event. With Loop off, playback appends one audible tonic
resolution tail and then stops.

### 3. Practice lenses - how the same phrase is studied

| Lens | Timeline | Player's job | Where it belongs |
|---|---|---|---|
| Hear the song | Authored song-feel slots | Sing bass/root, identify function, predict resolution | Ear / Harmony |
| Map the song | Same slots | See current/next shape and full phrase | Harmony / Solo |
| Comp the song | Same slots | Connect practical triads or selected voicings in meter | Harmony |
| Target slow | Durations doubled, harmony unchanged | Land one 3rd/guide tone per change | Solo - Follow changes |
| Target in time | Authored slots | Use 1-2 connectors and arrive with the real change | Solo - Follow changes |
| Phrase craft | Authored slots, drone, or one cadence cell | Build a short tetrachord phrase, space, ornament, response | Solo - Phrase Lab |
| Motor technique | Loop one movement independent of song form | Ta-ka, crossings, tremolo, ornaments, position/key evolution | Picking |

Solo should expose a compact three-step speed ladder:

1. **Landmarks:** one target, Slow Target timing.
2. **Connect:** target plus one or two approach notes, Song timing.
3. **Perform:** full phrase in the selected Greek pulse, with space and a
   self-scored landing gate.

This preserves one harmonic truth while letting the player earn speed.

## What qualifies as “common in songs”

No entry receives that label merely because its chords fit a scale.

| Evidence grade | Meaning | Product wording |
|---|---|---|
| A - repertoire/corpus | Repeatedly documented in analyzed recordings or owned/licensed repertoire maps | Common recorded motion |
| B - published method | Printed as a basic/usual movement by an identifiable Greek-music method | Method-verified movement |
| C - song-specific | Entered or imported from one score/recording | In this song |
| D - trainer-derived | App-authored reduction, transposition, target loop, or voice-leading cell | Practice arrangement - not a repertoire claim |

Each progression must store its evidence grade, source IDs, stylistic/historical
scope, and whether the harmony is modal, functional, hybrid, or pedal-based.
The UI should show one short badge; the full source boundary belongs in Learn.

Current Ousak and Hijaz banks are useful equal-tempered teaching maps, but they
must remain labelled as such until their exact chord movements and harmonic
rhythms are verified against the relevant method pages or repertoire corpus.

## Ear-training sequence

The curriculum should move from stable anchors to real music:

1. Hear and sing the tonic/home chord.
2. Sing the bass/root route before naming chord qualities.
3. Classify home, away, cadence, and resolve.
4. Track one horizontal guide-tone line, usually 3rds first and then 3rds/7ths.
5. Identify inversion/voicing only after function is reliable.
6. Transcribe the same progression from a real or user-entered song map.
7. Comp it, then improvise while preserving the audible target line.

Every answer reveal must show: key, dromos, bar grid, chord symbol, Roman
function, bass note, guide tone, resolution destination, and exactly what the
player heard.

## Screen responsibilities

- **Hear:** scored recognition and prediction. No fretboard before the answer.
- **Harmony:** progression library, phrase grid, bass movement, practical
  voicings, and meter-aware playback.
- **Solo / Follow changes:** the same phrase and clock as Harmony, with current
  and next target notes over the full neck.
- **Solo / Phrase Lab:** melodic grammar that may use one chord, a drone, or one
  cadence; tetrachord limits, contour, repetition/variation, space, and ornaments.
- **Picking:** physical execution. It may borrow a target or dromos but does not
  define common song harmony.
- **Song Map:** user-entered or imported form with section labels and authentic
  harmonic rhythm. It can become a Hear, Comp, or Solo assignment without being
  flattened into the generic progression bank.

## Rollout

### Phase 1 - correct the data contract

1. Replace length-derived phrase timing with explicit event durations.
2. Restore `I–vi–ii–V` as a four-event repeat-resolving turnaround.
3. Add `within-phrase`, `repeat-to-start`, `half-cadence`, and `open/pedal`
   resolution types.
4. Keep Harmony, Solo roadmap, bass, animation, and transport on the same event
   timeline.
5. Add Slow Target as a transformation, not a progression mutation.

### Phase 2 - evidence audit

1. Grade every current bank entry A-D.
2. Verify exact movements against Pagiatis, Trigas, Mystakidis, Pennanen/Delegos,
   and authorized song maps.
3. Remove or relabel any unsupported “common” or style-specific claim.
4. Add pedal/drone and one-chord modal studies so chord density matches the
   repertoire layer.

### Phase 3 - curriculum and UI

1. Add the Landmarks -> Connect -> Perform ladder to Solo.
2. Add root/bass singing and guide-tone singing to Hear.
3. Add section-aware Song Map forms and A/B looping.
4. Recommend the next lens from performance data: function errors go to Hear;
   shape errors to Harmony; late targets to Solo; uneven execution to Picking.

## Release invariants

Automated tests must prove:

1. every phrase event has an explicit positive duration;
2. the sum of durations equals the rendered and played phrase length;
3. a resolved loop reaches tonic either within the phrase or across a declared
   repeat edge;
4. Loop off appends the declared resolution tail when needed;
5. practice transformations never change chord identity, order, function, or
   evidence metadata;
6. Harmony and Solo produce the same event index at every transport boundary;
7. odd-meter styles retain their real beat grouping while chord durations remain
   measured in that meter's bars;
8. “common” is impossible without A or B evidence;
9. a drone/pedal study never displays invented triad changes;
10. answer reveals are generated from the exact event objects sent to audio.

## Product decision

Do not promote release 34's generic duration inference to production as the final
model. Keep the shared-clock fix, then implement Phase 1 before adding more
progressions. New progression research should populate evidence and phrase data,
not expand a flat list of chord arrays.

## Research basis

- [Pennanen, *The Development of Chordal Harmony in Greek Rebetika and Laika
  Music, 1930s to 1960s*](https://doi.org/10.1080/09681229708567262) analyzes
  droning, relative major/minor, modal harmony, and common-practice harmony from
  interviews and a large recording corpus. This supports multiple harmony
  families rather than one universal chord-scale treatment.
- [Delegos, *Modality vs. Chordal Harmony: Phases of the
  Confrontation*](https://taju.uniarts.fi/server/api/core/bitstreams/3abf845c-5602-4e49-814f-5bae2c015d0c/content)
  documents repertoire ranging from root/fifth drone accompaniment to fuller,
  hybrid chordal practice and song-specific cadence chords.
- [Pagiatis, *Greek Folk Scales and Their Practical
  Approach*](https://fagottobooks.gr/en/60-oi-laikoi-dromoi-kai-i-praktiki-efarmogi-tous.html)
  explicitly joins instrument fingerings, basic/secondary chords, usual chord
  movements, characteristic melodies, and authentic folk rhythms. Exact app
  entries still require page-level verification; the catalogue description alone
  does not validate every current chord array.
- [Trigas, four-string bouzouki method overview](https://www.trigas.gr/vangelis-trikas-methodos-gia-trichordo-bouzouki/)
  connects graded songs to the corresponding technique and theory chapters. This
  supports progression-to-repertoire transfer rather than isolated pattern
  accumulation.
- [Berklee Harmonic Ear Training](https://online.berklee.edu/courses/harmonic-ear-training-recognizing-chord-progressions)
  sequences bass lines, major/minor identity, voice leading, guide tones,
  inversion, chromatic harmony, II-V patterns, and real-song transcription. The
  proposed Hear sequence adapts that learning order to the app's Greek/modal
  scope rather than copying its repertoire.
