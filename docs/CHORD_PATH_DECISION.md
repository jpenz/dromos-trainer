# Matrix Chord Path — product and toolkit decision

Date: 2026-08-17  
Requirement: FR-64 / MI-33

## Answer first

A Matrix cell now opens one inline workspace organized around four player
questions:

1. **Play it** — validated voicings on the selected instrument.
2. **Outline it** — chord-tone cells plus the scale-derived triad/seventh layer.
3. **Enter it** — short, single-course scale lines into a chosen R/3/5/7.
4. **Leave it** — exact next chords from the verified Song Maps, followed by
   clearly separated mode/key doors.

The drawer stays under the selected scale row. That makes the chosen key, scale,
degree, chord, and alternatives visible as one decision instead of sending the
player to a detached inspector.

## Pedagogical boundary

The transferable foundation is well supported: Berklee's guitar voice-leading
guidance prioritizes common tones, stepwise motion, and short leaps; Open Music
Theory distinguishes a pivot chord from merely borrowing a chord and explains
why shared-chord relationships make closely related keys easier to hear.

The Greek-instrument application remains narrower. Trigas's official tetrachordo
method scope explicitly joins chord analysis/arpeggios, ornaments, dromoi and
their harmony, accompaniment, rhythm, and taximi. That supports teaching these
subjects as connected skills. It does **not** license the app to manufacture a
generic lick or claim that a derived Western sequence is idiomatic Greek
repertoire. Therefore:

- arpeggio orders are labelled as technique cells, not quoted phrases;
- automatic connectors use only the displayed fixed-fret collection;
- chromatic ornaments are left to sourced repertoire study;
- “can follow” is literal adjacency in `Modes.PROGRESSIONS`;
- a mode/key door states its evidence and never declares that a song modulated.

Sources:

- [Vangelis Trigas — Tetrachordo Bouzouki Method No. 3](https://www.trigas.gr/book/methodos-gia-tetrachordo-bouzouki-no-3/)
- [Berklee Online — Voice Leading for Guitar](https://online.berklee.edu/takenote/voice-leading-for-guitar/)
- [Open Music Theory — Extended tonicization and modulation](https://viva.pressbooks.pub/openmusictheory/chapter/extended-tonicization-and-modulation-to-closely-related-keys/)

## Toolkit review

No runtime package was added.

- **SVGuitar** can render attractive six-string chord boxes, but the app must
  support tetrachordo, trichordo, mainland laouto, drop-D guitar, interval
  colours, scale layers, and target rings in the same visual grammar. The
  existing tuning-driven SVG engine already does that.
- **fretboard-js** contains interesting feasibility/transition concepts, but its
  different representation and rendering assumptions would duplicate the
  tested `Triads`/`Fretboard` solvers.
- **D3 or a graph library** would add weight for a very small directed graph.
  The progression bank already supplies exact edges, and native layout is more
  readable than a force graph on iPad.
- **Animation libraries** are unnecessary. Matrix selection is a state change,
  and CSS transitions plus the existing Web Audio timing are sufficient while
  respecting reduced-motion settings.
- **Accessible disclosure packages** are unnecessary. The interaction uses
  native buttons with visible state; WebAIM recommends native HTML controls and
  warns that custom disclosure/ARIA widgets are easy to implement incorrectly.

Reviewed references:

- [SVGuitar](https://github.com/omnibrain/svguitar)
- [fretboard-js](https://github.com/joelle-o-world/fretboard-js)
- [WebAIM — Disclosures and Accordions](https://webaim.org/techniques/disclosures/)

## Verification contract

The test suite audits every tonic × verified mode × degree at both triad and
seventh depth. It proves that approaches remain in the scale, successors are
real adjacency, door identities are truthful, and each connector has a one-course
0–15-fret realization on all five tunings. The general inert-control and offline
shell gates also cover every new rendered action and the new module.
