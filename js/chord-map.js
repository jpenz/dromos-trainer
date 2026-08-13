/* chord-map.js — derived diatonic triads for every tonic and dromos.
 * Pure logic, no DOM. Exposes window.ChordMap.
 *
 * Chords are stacked directly from Modes.scaleOf. Prominence is not a genre
 * claim: it is an exact count of the documented maps in Modes.PROGRESSIONS.
 */
(function () {
  "use strict";

  const M = window.Modes;
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];
  const QUALITY_BY_INTERVALS = {
    "0,4,7": "maj",
    "0,3,7": "min",
    "0,3,6": "dim",
    "0,4,8": "aug"
  };

  const mod12 = (value) => ((value % 12) + 12) % 12;

  function qualityAt(scale, degreeIndex) {
    const root = scale[degreeIndex].pc;
    const intervals = [0, 2, 4].map((offset) =>
      mod12(scale[(degreeIndex + offset) % 7].pc - root));
    const quality = QUALITY_BY_INTERVALS[intervals.join(",")];
    if (!quality) throw new Error(`Unsupported stacked triad: ${intervals.join(",")}`);
    return quality;
  }

  function romanFor(scaleNote, degreeIndex, quality) {
    const accidental = String(scaleNote.degree || "").replace(/[0-9]/g, "");
    const upper = quality === "maj" || quality === "aug";
    const numeral = upper ? ROMAN[degreeIndex] : ROMAN[degreeIndex].toLowerCase();
    return accidental + numeral + (quality === "dim" ? "°" : quality === "aug" ? "+" : "");
  }

  function prominenceFor(tonic, modeId, degreeOffset) {
    const maps = M.PROGRESSIONS[modeId] || [];
    const containing = maps.filter((map) => map.chords.some(([offset]) => offset === degreeOffset));
    const occurrences = maps.reduce((total, map) =>
      total + map.chords.filter(([offset]) => offset === degreeOffset).length, 0);
    const variants = [];
    maps.forEach((map) => map.chords.forEach(([offset, quality]) => {
      if (offset !== degreeOffset || variants.some((variant) => variant.quality === quality)) return;
      variants.push({ quality, symbol: M.buildChord(tonic, modeId, offset, quality).symbol });
    }));
    const mapsUsed = containing.length;
    const label = mapsUsed === maps.length && maps.length
      ? "Core in this trainer"
      : mapsUsed >= Math.ceil(maps.length / 2) && mapsUsed
        ? "Common in this trainer"
        : mapsUsed ? "Appears in this trainer" : "Study-only here";
    return {
      mapsUsed,
      totalMaps: maps.length,
      occurrences,
      ratio: maps.length ? mapsUsed / maps.length : 0,
      label,
      mapIds: containing.map((map) => map.id),
      variants
    };
  }

  function harmonize(tonic, modeId) {
    if (!M.MODES[modeId]) throw new Error(`Unknown dromos: ${modeId}`);
    const scale = M.scaleOf(tonic, modeId);
    return scale.map((scaleNote, degreeIndex) => {
      const quality = qualityAt(scale, degreeIndex);
      const chord = M.buildChord(tonic, modeId, scaleNote.off, quality);
      return Object.assign(chord, {
        degreeIndex,
        degreeNumber: degreeIndex + 1,
        scaleNote,
        roman: romanFor(scaleNote, degreeIndex, quality),
        prominence: prominenceFor(tonic, modeId, scaleNote.off),
        practiceNote: modeId === "ousak" && degreeIndex === 1
          ? "Equal-tempered practice compromise: useful for fixed-fret harmony, not a claim that Ousak's mobile melodic 2nd behaves like an ordinary Western scale degree."
          : ""
      });
    });
  }

  function road(tonic, modeId) {
    const sections = M.tetrachordsOf(tonic, modeId);
    const withGaps = (notes) => notes.map((note, index) => {
      const next = notes[index + 1];
      const gap = next ? mod12(next.pc - note.pc) : null;
      return Object.assign({}, note, {
        gap,
        gapLabel: gap == null ? "" : gap === 1 ? "½" : gap === 2 ? "1" : gap === 3 ? "1½" : String(gap / 2)
      });
    });
    return { lower: withGaps(sections.lower), upper: withGaps(sections.upper), scale: sections.scale };
  }

  function comparison(tonic) {
    return M.MODE_ORDER.map((modeId) => ({
      modeId,
      mode: M.MODES[modeId],
      chords: harmonize(tonic, modeId)
    }));
  }

  function selfTest() {
    const results = [];
    const add = (name, pass, got, want) => results.push({ name, pass, got, want });
    const expected = {
      major: ["D", "Em", "F♯m", "G", "A", "Bm", "C♯°"],
      minor: ["Dm", "E°", "F", "Gm", "Am", "B♭", "C"],
      harmonicMinor: ["Dm", "E°", "F+", "Gm", "A", "B♭", "C♯°"],
      ousak: ["Dm", "E♭", "F", "Gm", "A°", "B♭", "Cm"],
      hijaz: ["D", "E♭", "F♯°", "Gm", "A°", "B♭+", "Cm"]
    };
    Object.keys(expected).forEach((modeId) => {
      const got = harmonize("D", modeId).map((chord) => chord.symbol);
      add(`D ${modeId} derived triads`, got.join(" ") === expected[modeId].join(" "), got.join(" "), expected[modeId].join(" "));
    });
    const romans = {
      major: "I ii iii IV V vi vii°",
      minor: "i ii° ♭III iv v ♭VI ♭VII",
      harmonicMinor: "i ii° ♭III+ iv V ♭VI vii°",
      ousak: "i ♭II ♭III iv v° ♭VI ♭vii",
      hijaz: "I ♭II iii° iv v° ♭VI+ ♭vii"
    };
    Object.keys(romans).forEach((modeId) => {
      const got = harmonize("D", modeId).map((chord) => chord.roman).join(" ");
      add(`D ${modeId} roman qualities`, got === romans[modeId], got, romans[modeId]);
    });
    const ousakSecond = harmonize("D", "ousak")[1];
    add("Ousak degree 2 states the practice compromise", /equal-tempered practice compromise/i.test(ousakSecond.practiceNote), ousakSecond.practiceNote, "explicit compromise");
    const hijazHome = harmonize("D", "hijaz")[0].prominence;
    add("prominence is derived from map counts", hijazHome.mapsUsed === 4 && hijazHome.totalMaps === 4 && hijazHome.occurrences === 7,
      `${hijazHome.mapsUsed}/${hijazHome.totalMaps}; ${hijazHome.occurrences}`, "4/4; 7");
    return { ok: results.every((result) => result.pass), results };
  }

  window.ChordMap = { qualityAt, romanFor, prominenceFor, harmonize, road, comparison, selfTest };
})();
