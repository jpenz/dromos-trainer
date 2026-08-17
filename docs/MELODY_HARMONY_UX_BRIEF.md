# Executed product brief — Melody → Harmony and read-ahead UX

## Improved prompt

Design and ship a standalone **Melody → Harmony Lab** for Dromos Trainer. Its
job is to teach an intermediate guitar, bouzouki, or mainland-laouto player to:

1. hear one melody note against a known tonic and selected dromos;
2. identify its note name, scale degree, interval, tetrachord zone, and audible
   tendency without requiring perfect pitch;
3. compare every lawful triad or seventh chord in the selected collection that
   actually contains that pitch;
4. understand what the melody becomes inside each chord (root, 3rd, 5th, or
   7th) and how that changes the colour;
5. see only the next-chord options evidenced by Dromos Trainer's verified
   progression bank, clearly distinguishing those from scale-derived harmony;
6. audition practical top-voice/counter-line moves: hold a common tone, move to
   the nearest useful 3rd/7th, or replay the melody with a diatonic 3rd below;
7. route the result into the existing Harmony, Matrix, and Solo curriculum.

Do not label one chord “correct” from a melody pitch alone. Rank options as
practice starting points, show the reason, and keep derived theory separate
from repertoire evidence. The exact pitch/chord objects shown on screen must
be the objects sent to audio.

At the same time, improve the shared practice journey:

- Changes Gym shows six upcoming chords as a readable 3×2 roadmap, including
  the pivot where the same root changes function.
- Solo keeps the full selected progression above the fretboard and prints the
  active target interval and note for every chord, not only Now and Next.
- The navigation follows the player's learning sequence and separates practice
  destinations from reference/support destinations.
- Use one stable semantic visual language: terracotta + solid + “Now” for the
  current event; turquoise + dashed + “Next” for anticipation; amber for
  identity/flavour; Aegean for neutral orientation. Never rely on hue alone.
- Fit the full fretboard and primary roadmap in the available page width. Use
  progressive disclosure for explanation, but never hide the current musical
  job or the next destination.

### Acceptance contract

- All 12 tonics × 5 verified dromoi × 7 scale degrees produce the correct
  sounding pitch and exactly three containing triads (four seventh chords).
- Every suggested successor is an exact adjacency in `Modes.PROGRESSIONS`.
- Derived-only chords explicitly say that no current trainer route uses them.
- Home, note, candidate chord, successor, and counter-line audio use the
  pitch-stable sampled reference with the offline fallback.
- Start, replay, hint, check, audition, and stop preserve the question state.
- All controls work by keyboard; meaning survives reduced motion and colour
  vision differences; no page-level horizontal overflow at 375px.
- `npm run check && npm test` and real-browser desktop/mobile flows pass.

## Why this structure

- Berklee's theory/ear-training handbook frames movable-Do and scale degree as
  a note's relationship to tonic, supporting a known-home, relative-hearing
  workflow rather than a perfect-pitch quiz:
  <https://assets.online.berklee.edu/handbooks/berklee-online-music-theory-harmony-and-ear-training-handbook.pdf>
- Open Music Theory's voice-leading guidance prioritizes common tones, stepwise
  motion, and small moves between harmonies; its jazz chapter specifically
  identifies 3rds and 7ths as useful guide-tone lines:
  <https://viva.pressbooks.pub/openmusictheory/chapter/jazz-voicings/>.
- Its counterpoint introduction recommends performing the exercise so ear,
  voice, fingers, and mind internalize the relationship, which is why every
  visual choice is directly auditionable:
  <https://viva.pressbooks.pub/openmusictheory/chapter/species-counterpoint/>.
- Mayer's multimedia-learning review supports signaling and placing connected
  words/graphics together. That argues for a visible progression roadmap above
  the fretboard and explanation adjacent to the selected chord, not in a
  separate drawer:
  <https://www.cambridge.org/core/books/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles/C98AB3A6CE760DD63C048936EA0B3B44>.
- WCAG 2.2 requires meaning conveyed by colour to have a non-colour cue. The
  design therefore pairs colour with Now/Next text and solid/dashed borders:
  <https://www.w3.org/WAI/WCAG22/Understanding/use-of-color>.

Greek-specific phrase craft remains sourced through the existing Soloist
Toolkit: Chiotis-linked arrivals, mimisis, thirds/sixths shadow, cadence arc,
and placed breath. The new lab links to those concepts; it does not generate or
claim a repertoire-specific Greek counter-melody from a single note.

## Delivered slices

1. Pure melody/harmony model with exhaustive self-test.
2. Standalone ear-first page and pitch-stable audio interactions.
3. Evidence-labelled chord candidates, next moves, and counter-line auditions.
4. Six-chord Changes roadmap and full-progression Solo target roadmap.
5. Navigation, contrast, semantic-colour, responsive, and offline-shell update.
