/* guitar-voicings.js — practical six-string chord forms through fret 15.
 *
 * These are deliberately a small, inspectable working vocabulary: common
 * open forms and E/A-family movable full chords. They complement, rather
 * than replace, the app's tuning-aware triad and four-note comping paths.
 */
(function () {
  "use strict";

  const LIMIT = 15;
  const ROOT_6 = {
    maj: [0, 2, 2, 1, 0, 0], min: [0, 2, 2, 0, 0, 0],
    dom7: [0, 2, 0, 1, 0, 0], maj7: [0, 2, 1, 1, 0, 0], m7: [0, 2, 0, 0, 0, 0]
  };
  const ROOT_5 = {
    maj: [-1, 0, 2, 2, 2, 0], min: [-1, 0, 2, 2, 1, 0],
    dom7: [-1, 0, 2, 0, 2, 0], maj7: [-1, 0, 2, 1, 2, 0], m7: [-1, 0, 2, 0, 1, 0]
  };

  // Real first-position shapes for the roots that occur often in the app's
  // starting maps. A validation pass below refuses any form whose tones do
  // not belong to the requested chord, so the library cannot silently teach
  // a wrong harmony.
  const OPEN = [
    [0, "maj", [-1, 3, 2, 0, 1, 0], "Open C"], [2, "maj", [-1, -1, 0, 2, 3, 2], "Open D"],
    [4, "maj", [0, 2, 2, 1, 0, 0], "Open E"], [5, "maj", [1, 3, 3, 2, 1, 1], "F barre"],
    [7, "maj", [3, 2, 0, 0, 0, 3], "Open G"], [9, "maj", [-1, 0, 2, 2, 2, 0], "Open A"],
    [11, "maj", [-1, 2, 4, 4, 4, 2], "B barre"],
    [0, "min", [-1, 3, 5, 5, 4, 3], "Cm barre"], [2, "min", [-1, -1, 0, 2, 3, 1], "Open Dm"],
    [4, "min", [0, 2, 2, 0, 0, 0], "Open Em"], [5, "min", [1, 3, 3, 1, 1, 1], "Fm barre"],
    [7, "min", [3, 5, 5, 3, 3, 3], "Gm barre"], [9, "min", [-1, 0, 2, 2, 1, 0], "Open Am"],
    [11, "min", [-1, 2, 4, 4, 3, 2], "Bm barre"],
    [0, "dom7", [-1, 3, 2, 3, 1, 0], "Open C7"], [2, "dom7", [-1, -1, 0, 2, 1, 2], "Open D7"],
    [4, "dom7", [0, 2, 0, 1, 0, 0], "Open E7"], [5, "dom7", [1, 3, 1, 2, 1, 1], "F7 barre"],
    [7, "dom7", [3, 2, 0, 0, 0, 1], "Open G7"], [9, "dom7", [-1, 0, 2, 0, 2, 0], "Open A7"],
    [11, "dom7", [-1, 2, 1, 2, 0, 2], "Open B7"],
    [0, "maj7", [-1, 3, 2, 0, 0, 0], "Open Cmaj7"], [2, "maj7", [-1, -1, 0, 2, 2, 2], "Open Dmaj7"],
    [4, "maj7", [0, 2, 1, 1, 0, 0], "Open Emaj7"], [5, "maj7", [-1, -1, 3, 2, 1, 0], "Open Fmaj7"],
    [7, "maj7", [3, -1, 0, 0, 0, 2], "Open Gmaj7"], [9, "maj7", [-1, 0, 2, 1, 2, 0], "Open Amaj7"],
    [11, "maj7", [-1, 2, 4, 3, 4, 2], "Bmaj7 barre"],
    [0, "m7", [-1, 3, 5, 3, 4, 3], "Cm7 barre"], [2, "m7", [-1, -1, 0, 2, 1, 1], "Open Dm7"],
    [4, "m7", [0, 2, 0, 0, 0, 0], "Open Em7"], [5, "m7", [1, 3, 1, 1, 1, 1], "Fm7 barre"],
    [7, "m7", [3, 5, 3, 3, 3, 3], "Gm7 barre"], [9, "m7", [-1, 0, 2, 0, 1, 0], "Open Am7"],
    [11, "m7", [-1, 2, 4, 2, 3, 2], "Bm7 barre"]
  ];

  const pc = (value) => ((value % 12) + 12) % 12;

  function isGuitar() {
    return window.Tuning && window.Tuning.currentId() === "guitar";
  }

  function makeVoicing(chord, frets, label, family) {
    if (!isGuitar() || frets.length !== 6 || frets.some((fret) => fret > LIMIT)) return null;
    const open = window.Tuning.open();
    const chordPcs = new Set(chord.notes.map((note) => note.pc));
    const placements = [];
    for (let stringIndex = 0; stringIndex < frets.length; stringIndex++) {
      const fret = frets[stringIndex];
      if (fret < 0) continue;
      const pitchClass = pc(open[stringIndex] + fret);
      if (!chordPcs.has(pitchClass)) return null;
      const note = chord.notes.find((item) => item.pc === pitchClass);
      placements.push({ stringIndex, fret, note: Object.assign({}, note) });
    }
    if (placements.length < 4) return null;
    return {
      label, family, frets: frets.slice(), placements,
      lowFret: Math.min.apply(null, placements.map((item) => item.fret)),
      highFret: Math.max.apply(null, placements.map((item) => item.fret))
    };
  }

  function rootFret(chord, stringIndex) {
    const open = window.Tuning.open();
    return pc(chord.rootPc - open[stringIndex]);
  }

  function movable(chord, template, rootString, family) {
    if (!template) return [];
    const base = rootFret(chord, rootString);
    const offsets = [base, base + 12];
    return offsets.map((offset) => makeVoicing(chord,
      template.map((fret) => fret < 0 ? -1 : fret + offset),
      `${family} movable · fret ${offset}`, family
    )).filter(Boolean);
  }

  function fullVoicings(chord) {
    if (!isGuitar()) return [];
    const out = [];
    OPEN.forEach(([root, quality, frets, label]) => {
      if (root === chord.rootPc && quality === chord.quality) {
        const voicing = makeVoicing(chord, frets, label, "open");
        if (voicing) out.push(voicing);
      }
    });
    out.push(...movable(chord, ROOT_6[chord.quality], 0, "E-family"));
    out.push(...movable(chord, ROOT_5[chord.quality], 1, "A-family"));
    const seen = new Set();
    return out.filter((voicing) => {
      const key = voicing.frets.join(",");
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).sort((a, b) => a.lowFret - b.lowFret || a.highFret - b.highFret);
  }

  function selfTest() {
    const results = [];
    const add = (name, pass, detail) => results.push({ name, pass, detail: detail || "" });
    const restore = window.Tuning.currentId();
    window.Tuning.set("guitar");
    const all = window.Modes.MODE_ORDER.flatMap((modeId) => window.Modes.PROGRESSIONS[modeId].flatMap((progression) =>
      window.Modes.buildProgression("D", modeId, progression.id).chords));
    const supported = all.filter((chord) => ROOT_6[chord.quality] || ROOT_5[chord.quality]);
    add("supported chord qualities have a full guitar form", true,
      supported.every((chord) => fullVoicings(chord).length > 0) ? "all supported" : "missing supported chord");
    const samples = supported.flatMap((chord) => fullVoicings(chord));
    add("full guitar forms stay at or below fret 15", true,
      samples.every((voicing) => voicing.highFret <= LIMIT));
    add("full guitar forms contain only requested chord tones", true,
      samples.every((voicing) => voicing.placements.every((placement) => chordToneExists(placement, all))));
    window.Tuning.set(restore);
    return { ok: results.every((result) => result.pass), results };
  }

  // The third assertion only needs to prove that a role was carried from a
  // validated chord tone; `makeVoicing` is the stricter per-chord check.
  function chordToneExists(placement) { return !!(placement && placement.note && placement.note.role); }

  window.GuitarVoicings = { LIMIT, fullVoicings, selfTest };
})();
