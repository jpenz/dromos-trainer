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
  const TRIAD_QUALITY_BY_INTERVALS = {
    "0,4,7": "maj",
    "0,3,7": "min",
    "0,3,6": "dim",
    "0,4,8": "aug"
  };
  const SEVENTH_QUALITY_BY_INTERVALS = {
    "0,4,7,11": "maj7",
    "0,4,7,10": "dom7",
    "0,3,7,10": "m7",
    "0,3,6,10": "m7b5",
    "0,3,6,9": "dim7",
    "0,3,7,11": "mMaj7",
    "0,4,8,11": "maj7sharp5"
  };

  const mod12 = (value) => ((value % 12) + 12) % 12;

  function qualityAt(scale, degreeIndex, depth) {
    const root = scale[degreeIndex].pc;
    const offsets = depth === "seventh" ? [0, 2, 4, 6] : [0, 2, 4];
    const intervals = offsets.map((offset) =>
      mod12(scale[(degreeIndex + offset) % 7].pc - root));
    const quality = (depth === "seventh" ? SEVENTH_QUALITY_BY_INTERVALS : TRIAD_QUALITY_BY_INTERVALS)[intervals.join(",")];
    if (!quality) throw new Error(`Unsupported stacked ${depth === "seventh" ? "seventh chord" : "triad"}: ${intervals.join(",")}`);
    return quality;
  }

  function romanFor(scaleNote, degreeIndex, quality) {
    const accidental = String(scaleNote.degree || "").replace(/[0-9]/g, "");
    const upper = ["maj", "aug", "maj7", "dom7", "maj7sharp5"].includes(quality);
    const numeral = upper ? ROMAN[degreeIndex] : ROMAN[degreeIndex].toLowerCase();
    const suffix = ({ dim: "°", aug: "+", maj7: "maj7", dom7: "7", m7: "7", m7b5: "ø7", dim7: "°7", mMaj7: "(maj7)", maj7sharp5: "+maj7" })[quality] || "";
    return accidental + numeral + suffix;
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

  function workingRole(modeId, degreeOffset, prominence) {
    const maps = M.PROGRESSIONS[modeId] || [];
    const cadenceMaps = maps.filter((map) => map.chords.some((chord, index) =>
      chord[0] === degreeOffset && map.chords[index + 1] && map.chords[index + 1][0] === 0));
    if (degreeOffset === 0) return { id: "home", label: "Home", cadenceMaps: cadenceMaps.map((map) => map.id) };
    if (cadenceMaps.length) return { id: "cadence", label: "Returns home", cadenceMaps: cadenceMaps.map((map) => map.id) };
    if (prominence.mapsUsed >= Math.ceil(prominence.totalMaps / 2) && prominence.mapsUsed) {
      return { id: "primary", label: "Primary", cadenceMaps: [] };
    }
    if (prominence.mapsUsed) return { id: "colour", label: "Working colour", cadenceMaps: [] };
    return { id: "derived", label: "Derived only", cadenceMaps: [] };
  }

  function harmonize(tonic, modeId, depth) {
    if (!M.MODES[modeId]) throw new Error(`Unknown dromos: ${modeId}`);
    const chordDepth = depth === "seventh" ? "seventh" : "triad";
    const scale = M.scaleOf(tonic, modeId);
    return scale.map((scaleNote, degreeIndex) => {
      const quality = qualityAt(scale, degreeIndex, chordDepth);
      const chord = M.buildChord(tonic, modeId, scaleNote.off, quality);
      const prominence = prominenceFor(tonic, modeId, scaleNote.off);
      return Object.assign(chord, {
        degreeIndex,
        degreeNumber: degreeIndex + 1,
        depth: chordDepth,
        scaleNote,
        roman: romanFor(scaleNote, degreeIndex, quality),
        prominence,
        workingRole: workingRole(modeId, scaleNote.off, prominence),
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

  function comparison(tonic, depth) {
    return M.MODE_ORDER.map((modeId) => ({
      modeId,
      mode: M.MODES[modeId],
      scale: M.scaleOf(tonic, modeId),
      chords: harmonize(tonic, modeId, depth),
      progressions: M.PROGRESSIONS[modeId]
    }));
  }

  const setOf = (notes) => new Set(notes.map((note) => note.pc));
  const sameSet = (left, right) => left.size === right.size && Array.from(left).every((pc) => right.has(pc));
  const sharedCount = (left, right) => Array.from(left).filter((pc) => right.has(pc)).length;
  function tonicForPc(pc) { return M.TONICS.find((name) => M.parseName(name).pc === mod12(pc)); }

  function exactRelationshipLabel(sourceMode, targetMode) {
    if (sourceMode === "major" && targetMode === "minor") return "Relative minor";
    if (sourceMode === "minor" && targetMode === "major") return "Relative major";
    if (sourceMode === "harmonicMinor" && targetMode === "hijaz") return "Hijaz on V";
    if (sourceMode === "hijaz" && targetMode === "harmonicMinor") return "Harmonic-minor parent";
    return "Same-note sister";
  }

  function relationships(tonic, modeId) {
    const sourceScale = M.scaleOf(tonic, modeId);
    const sourceSet = setOf(sourceScale);
    const sourcePc = M.parseName(tonic).pc;
    const exact = [];
    M.TONICS.forEach((targetTonic) => M.MODE_ORDER.forEach((targetModeId) => {
      if (targetTonic === tonic && targetModeId === modeId) return;
      const targetScale = M.scaleOf(targetTonic, targetModeId);
      if (!sameSet(sourceSet, setOf(targetScale))) return;
      const targetOffset = mod12(M.parseName(targetTonic).pc - sourcePc);
      const doorMaps = (M.PROGRESSIONS[modeId] || []).filter((map) => map.chords.some(([offset]) => offset === targetOffset));
      exact.push({
        kind: "exact",
        label: exactRelationshipLabel(modeId, targetModeId),
        tonic: targetTonic,
        modeId: targetModeId,
        shared: 7,
        doorMaps: doorMaps.map((map) => map.id),
        why: doorMaps.length
          ? `All seven notes are shared, and ${doorMaps.map((map) => map.label).join(" / ")} already places ${targetTonic} inside a working route.`
          : "All seven notes are shared. Only the heard home and each note's job change."
      });
    }));
    exact.sort((left, right) => right.doorMaps.length - left.doorMaps.length || M.MODE_ORDER.indexOf(left.modeId) - M.MODE_ORDER.indexOf(right.modeId));

    const parallelMode = ({ minor: "harmonicMinor", harmonicMinor: "minor", ousak: "hijaz", hijaz: "ousak" })[modeId];
    const parallel = [];
    if (parallelMode) {
      const targetScale = M.scaleOf(tonic, parallelMode);
      const targetSet = setOf(targetScale);
      const fromOnly = sourceScale.filter((note) => !targetSet.has(note.pc));
      const toOnly = targetScale.filter((note) => !sourceSet.has(note.pc));
      parallel.push({
        kind: "parallel",
        label: modeId === "minor" || modeId === "harmonicMinor" ? "Cadence switch" : "Parallel colour switch",
        tonic,
        modeId: parallelMode,
        shared: sharedCount(sourceSet, targetSet),
        doorMaps: [],
        why: `Keep the same home and six notes; hear ${fromOnly.map((note) => note.name).join(" · ")} move to ${toOnly.map((note) => note.name).join(" · ")}. This is a comparison lens, not an automatic modulation.`
      });
    }

    const transitions = [];
    if (modeId === "major") {
      const targetTonic = tonicForPc(sourcePc - 2);
      transitions.push({
        kind: "cycle",
        label: "ii–V–I chain",
        tonic: targetTonic,
        modeId: "major",
        shared: sharedCount(sourceSet, setOf(M.scaleOf(targetTonic, "major"))),
        doorMaps: ["Changes Gym"],
        why: `Old ${tonic} I becomes ${targetTonic} ii. Rehear the same root as a new job, then complete ii–V–I one whole step lower.`
      });
    }
    return { exact, parallel, transitions };
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
      const got = harmonize("D", modeId, "triad").map((chord) => chord.symbol);
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
    const seventhExpected = {
      major: ["Dmaj7", "Em7", "F♯m7", "Gmaj7", "A7", "Bm7", "C♯m7♭5"],
      minor: ["Dm7", "Em7♭5", "Fmaj7", "Gm7", "Am7", "B♭maj7", "C7"],
      harmonicMinor: ["Dm(maj7)", "Em7♭5", "Fmaj7♯5", "Gm7", "A7", "B♭maj7", "C♯°7"],
      ousak: ["Dm7", "E♭maj7", "F7", "Gm7", "Am7♭5", "B♭maj7", "Cm7"],
      hijaz: ["D7", "E♭maj7", "F♯°7", "Gm(maj7)", "Am7♭5", "B♭maj7♯5", "Cm7"]
    };
    Object.keys(seventhExpected).forEach((modeId) => {
      const got = harmonize("D", modeId, "seventh").map((chord) => chord.symbol);
      add(`D ${modeId} derived sevenths`, got.join(" ") === seventhExpected[modeId].join(" "), got.join(" "), seventhExpected[modeId].join(" "));
    });
    const ousakSecond = harmonize("D", "ousak")[1];
    add("Ousak degree 2 states the practice compromise", /equal-tempered practice compromise/i.test(ousakSecond.practiceNote), ousakSecond.practiceNote, "explicit compromise");
    const hijazHome = harmonize("D", "hijaz")[0].prominence;
    add("prominence is derived from map counts", hijazHome.mapsUsed === 4 && hijazHome.totalMaps === 4 && hijazHome.occurrences === 7,
      `${hijazHome.mapsUsed}/${hijazHome.totalMaps}; ${hijazHome.occurrences}`, "4/4; 7");
    return { ok: results.every((result) => result.pass), results };
  }

  window.ChordMap = { qualityAt, romanFor, prominenceFor, workingRole, harmonize, road, comparison, relationships, selfTest };
})();
