/* tuning.js — instrument/tuning registry. Exposes window.Tuning.
 *
 * Implements: FR-24 (instrument tunings)
 * Invariant:   MI-12 (nothing may hardcode 6 strings)
 *
 * Every module that touches the neck must read string count and open pitches
 * from here — never from a literal 6. A bouzouki has four courses.
 */
(function () {
  "use strict";

  const TUNINGS = [
    {
      id: "guitar",
      name: "Guitar",
      sub: "standard E A D G B E",
      // low -> high, MIDI
      open: [40, 45, 50, 55, 59, 64],
      names: ["E", "A", "D", "G", "B", "E"],
      frets: 24
    },
    {
      id: "bouzouki4",
      name: "Bouzouki (tetrachordo)",
      sub: "C F A D — the 4-course Greek tuning",
      // C3 F3 A3 D4 — the guitar's top four strings, each down a whole step
      open: [48, 53, 57, 62],
      names: ["C", "F", "A", "D"],
      frets: 24
    },
    {
      id: "laouto4",
      name: "Laouto (mainland)",
      sub: "A D G C — the 4-course mainland laouto tuning",
      // low -> high: A2 D3 G3 C4
      open: [45, 50, 55, 60],
      names: ["A", "D", "G", "C"],
      frets: 24
    },
    {
      id: "bouzouki3",
      name: "Bouzouki (trichordo)",
      sub: "D A D — the older 3-course tuning",
      open: [50, 57, 62],
      names: ["D", "A", "D"],
      frets: 24
    },
    {
      id: "guitarDropD",
      name: "Guitar (drop D)",
      sub: "D A D G B E",
      open: [38, 45, 50, 55, 59, 64],
      names: ["D", "A", "D", "G", "B", "E"],
      frets: 24
    }
  ];

  let currentId = "guitar";

  function get(id) { return TUNINGS.find((t) => t.id === (id || currentId)) || TUNINGS[0]; }

  window.Tuning = {
    TUNINGS,
    current: () => get(),
    currentId: () => currentId,
    set: (id) => { if (get(id)) currentId = id; return get(); },
    open: () => get().open.slice(),
    names: () => get().names.slice(),
    count: () => get().open.length,
    frets: () => get().frets
  };
})();
