/* chord-path.js — scale-locked ways to play, outline, approach, and leave
 * the chord selected in the Harmony Matrix. Pure logic; no DOM.
 *
 * The module never predicts repertoire. Successors come only from the exact
 * adjacency data in Modes.PROGRESSIONS, and scale doors retain ChordMap's
 * evidence labels. Connector lines use only the selected fixed collection.
 */
(function () {
  "use strict";

  const M = window.Modes;
  const CM = window.ChordMap;
  const TRIAD_FAMILY = {
    maj: "maj", min: "min", dim: "dim", aug: "aug",
    maj7: "maj", dom7: "maj", m7: "min", m7b5: "dim",
    dim7: "dim", mMaj7: "min", maj7sharp5: "aug"
  };

  const mod12 = (value) => ((value % 12) + 12) % 12;
  const pcKey = (notes, count) => notes.slice(0, count || notes.length)
    .map((note) => note.pc).sort((a, b) => a - b).join(",");

  function progressionChords(tonic, modeId, progression, depth) {
    if (depth === "seventh") return M.buildProgression(tonic, modeId, progression.id).chords;
    let previous = null;
    return progression.chords.map(([offset, quality]) => {
      const chord = M.buildChord(tonic, modeId, offset, TRIAD_FAMILY[quality] || quality, previous);
      previous = chord.bottomMidi;
      return chord;
    });
  }

  function motion(fromPc, toPc) {
    let semitones = mod12(toPc - fromPc);
    if (semitones > 6) semitones -= 12;
    return {
      semitones,
      direction: semitones === 0 ? "hold" : semitones > 0 ? "up" : "down",
      label: semitones === 0 ? "hold the common tone" : `${Math.abs(semitones)} semitone${Math.abs(semitones) === 1 ? "" : "s"} ${semitones > 0 ? "up" : "down"}`
    };
  }

  function commonTones(left, right) {
    return left.notes.filter((note) => right.notes.some((next) => next.pc === note.pc));
  }

  function guideMove(from, to) {
    const fromThird = from.notes[1];
    const toThird = to.notes[1];
    return {
      from: fromThird,
      to: toThird,
      motion: motion(fromThird.pc, toThird.pc),
      common: commonTones(from, to)
    };
  }

  function arpeggios(chord) {
    const notes = chord.notes;
    const last = notes.length - 1;
    const patterns = notes.length === 4 ? [
      { id: "climb", label: "Climb", intent: "Hear the complete seventh chord from root to colour.", indexes: [0, 1, 2, 3] },
      { id: "guide-turn", label: "Guide-tone turn", intent: "Put the 3rd and 7th at the front of your ear.", indexes: [1, 3, 2, 1] },
      { id: "fall-home", label: "Fall to root", intent: "Let the colour tone descend through the chord into home.", indexes: [3, 2, 1, 0] }
    ] : [
      { id: "climb", label: "Climb", intent: "State root, colour, then stability.", indexes: [0, 1, 2] },
      { id: "turn", label: "Turn", intent: "Return to the 3rd so the chord quality remains audible.", indexes: [0, 1, 2, 1] },
      { id: "third-first", label: "3rd first", intent: "Start on the note that names major, minor, diminished, or augmented colour.", indexes: [1, 2, 0, 1] }
    ];
    return patterns.map((pattern) => Object.assign({}, pattern, {
      notes: pattern.indexes.map((index) => notes[Math.min(last, index)])
    }));
  }

  function approaches(tonic, modeId, chord, targetIndex) {
    const scale = M.scaleOf(tonic, modeId);
    const target = chord.notes[Math.max(0, Math.min(chord.notes.length - 1, targetIndex || 0))];
    const scaleIndex = scale.findIndex((note) => note.pc === target.pc);
    if (scaleIndex < 0) return [];
    const below = scale[(scaleIndex + 6) % 7];
    const twoBelow = scale[(scaleIndex + 5) % 7];
    const above = scale[(scaleIndex + 1) % 7];
    const twoAbove = scale[(scaleIndex + 2) % 7];
    const targetNote = Object.assign({}, target, { degree: scale[scaleIndex].degree });
    return [
      { id: "rise", label: "Rise into it", intent: `Hear ${target.roleLabel} as an arrival from below.`, notes: [twoBelow, below, targetNote] },
      { id: "fall", label: "Fall into it", intent: `Approach ${target.roleLabel} from the upper road.`, notes: [twoAbove, above, targetNote] },
      { id: "enclose", label: "Scale enclosure", intent: `Surround ${target.roleLabel} with its two diatonic neighbours, then settle.`, notes: [below, above, targetNote] }
    ];
  }

  function successors(tonic, modeId, chord, depth) {
    const selectedKey = pcKey(chord.notes, depth === "seventh" ? 4 : 3);
    const grouped = new Map();
    (M.PROGRESSIONS[modeId] || []).forEach((progression) => {
      const chords = progressionChords(tonic, modeId, progression, depth);
      chords.forEach((candidate, index) => {
        if (index >= chords.length - 1 || pcKey(candidate.notes, depth === "seventh" ? 4 : 3) !== selectedKey) return;
        const next = chords[index + 1];
        const key = `${next.rootPc}:${next.quality}`;
        if (!grouped.has(key)) grouped.set(key, { chord: next, maps: [] });
        grouped.get(key).maps.push({
          id: progression.id,
          label: progression.label,
          group: progression.group || "Working route",
          tier: progression.tier || "Practice map",
          why: progression.why
        });
      });
    });
    return Array.from(grouped.values()).map((item) => Object.assign(item, {
      guide: guideMove(chord, item.chord)
    })).sort((left, right) => right.maps.length - left.maps.length || left.chord.rootPc - right.chord.rootPc);
  }

  function changedNotes(left, right) {
    const leftOnly = left.notes.filter((note) => !right.notes.some((target) => target.pc === note.pc));
    const rightOnly = right.notes.filter((note) => !left.notes.some((source) => source.pc === note.pc));
    return { leftOnly, rightOnly };
  }

  function doors(tonic, modeId, chord, depth) {
    const relationships = CM.relationships(tonic, modeId);
    const sourceHome = CM.harmonize(tonic, modeId, depth)[0];
    const sourceKey = pcKey(chord.notes, depth === "seventh" ? 4 : 3);
    const out = [];
    relationships.exact.concat(relationships.parallel, relationships.transitions).forEach((relationship) => {
      const targetChords = CM.harmonize(relationship.tonic, relationship.modeId, depth);
      const targetHome = targetChords[0];
      const exactPivot = targetChords.find((candidate) => pcKey(candidate.notes, depth === "seventh" ? 4 : 3) === sourceKey);
      if (exactPivot) {
        out.push({
          kind: "pivot",
          label: relationship.label,
          tonic: relationship.tonic,
          modeId: relationship.modeId,
          targetDegree: exactPivot.degreeIndex,
          targetChord: exactPivot,
          shared: relationship.shared,
          why: relationship.why,
          instruction: `Hold ${chord.symbol}; re-hear it from ${chord.roman} as ${exactPivot.roman}, then confirm ${relationship.tonic} with ${targetHome.symbol}.`,
          preview: [sourceHome, chord, targetHome]
        });
        return;
      }

      const sameRoot = targetChords.find((candidate) => candidate.rootPc === chord.rootPc);
      if (relationship.kind === "parallel" && sameRoot) {
        const changes = changedNotes(chord, sameRoot);
        out.push({
          kind: "recolour",
          label: relationship.label,
          tonic: relationship.tonic,
          modeId: relationship.modeId,
          targetDegree: sameRoot.degreeIndex,
          targetChord: sameRoot,
          shared: relationship.shared,
          why: relationship.why,
          instruction: changes.leftOnly.length && changes.rightOnly.length
            ? `Keep the root; move ${changes.leftOnly.map((note) => note.name).join(" · ")} to ${changes.rightOnly.map((note) => note.name).join(" · ")}, then hear ${sameRoot.roman} in the new colour.`
            : `Keep the root and re-hear ${sameRoot.symbol} inside the parallel collection.`,
          preview: [chord, sameRoot, targetHome]
        });
        return;
      }

      if (relationship.kind === "cycle" && modeId === "major" && chord.degreeIndex === 0) {
        const newTwo = targetChords[1];
        const changes = changedNotes(chord, newTwo);
        const targetProgression = (M.PROGRESSIONS.major || []).find((item) => item.id === "ii-V-I");
        out.push({
          kind: "role-change",
          label: relationship.label,
          tonic: relationship.tonic,
          modeId: relationship.modeId,
          targetDegree: 1,
          targetChord: newTwo,
          shared: relationship.shared,
          why: relationship.why,
          instruction: changes.leftOnly.length && changes.rightOnly.length
            ? `${chord.symbol} becomes ${newTwo.symbol}: move ${changes.leftOnly[0].name} to ${changes.rightOnly[0].name}. The old I is now ii; continue ii–V–I.`
            : `Re-hear the old I as the new ii, then continue ii–V–I.`,
          preview: targetProgression ? [chord].concat(progressionChords(relationship.tonic, "major", targetProgression, depth)) : [chord, newTwo, targetHome]
        });
      }
    });
    return out;
  }

  function extension(tonic, modeId, degreeIndex, depth) {
    const otherDepth = depth === "seventh" ? "triad" : "seventh";
    const chord = CM.harmonize(tonic, modeId, otherDepth)[degreeIndex];
    return {
      depth: otherDepth,
      chord,
      added: otherDepth === "seventh" ? chord.notes[3] : null,
      label: otherDepth === "seventh" ? "Add the diatonic 7th" : "Strip to the triad skeleton"
    };
  }

  function instrumentPath(notes) {
    if (!window.Tuning || !notes.length) return null;
    const opens = window.Tuning.open();
    const names = window.Tuning.names();
    let winner = null;
    opens.forEach((openMidi, stringIndex) => {
      const candidates = notes.map((note) => {
        const frets = [];
        for (let fret = 0; fret <= 15; fret++) if (mod12(openMidi + fret) === note.pc) frets.push(fret);
        return frets;
      });
      if (candidates.some((list) => !list.length)) return;
      candidates[candidates.length - 1].forEach((targetFret) => {
        const frets = new Array(notes.length);
        frets[frets.length - 1] = targetFret;
        for (let index = frets.length - 2; index >= 0; index--) {
          frets[index] = candidates[index].slice().sort((left, right) => Math.abs(left - frets[index + 1]) - Math.abs(right - frets[index + 1]))[0];
        }
        const travel = frets.slice(1).reduce((total, fret, index) => total + Math.abs(fret - frets[index]), 0);
        const span = Math.max.apply(null, frets) - Math.min.apply(null, frets);
        const score = travel + span * 0.35 + Math.abs(targetFret - 7) * 0.08;
        if (!winner || score < winner.score) winner = {
          score,
          stringIndex,
          course: names[stringIndex],
          frets,
          placements: notes.map((note, index) => ({ stringIndex, fret: frets[index], note }))
        };
      });
    });
    return winner;
  }

  function build(tonic, modeId, chord, depth, targetIndex) {
    return {
      arpeggios: arpeggios(chord),
      approaches: approaches(tonic, modeId, chord, targetIndex),
      successors: successors(tonic, modeId, chord, depth),
      doors: doors(tonic, modeId, chord, depth),
      extension: extension(tonic, modeId, chord.degreeIndex, depth)
    };
  }

  function selfTest() {
    const results = [];
    const add = (name, pass, got, want) => results.push({ name, pass, got, want });
    const dMajor = CM.harmonize("D", "major", "triad");
    const dTwo = dMajor[1];
    const next = successors("D", "major", dTwo, "triad");
    add("major ii has a verified V successor", next.some((item) => item.chord.symbol === "A"), next.map((item) => item.chord.symbol).join(" "), "A");
    const dHomeDoors = doors("D", "major", dMajor[0], "triad");
    add("major I exposes the whole-step ii role change", dHomeDoors.some((door) => door.kind === "role-change" && door.tonic === "C" && door.targetChord.symbol === "Dm"), dHomeDoors.map((door) => `${door.tonic}:${door.targetChord.symbol}`).join(" "), "C:Dm");
    const line = approaches("D", "hijaz", CM.harmonize("D", "hijaz")[0], 1);
    const scalePcs = new Set(M.scaleOf("D", "hijaz").map((note) => note.pc));
    add("approach lines stay inside the selected collection", line.every((item) => item.notes.every((note) => scalePcs.has(note.pc))), "scale locked", "scale locked");
    const restore = window.Tuning && window.Tuning.currentId();
    if (window.Tuning) {
      let holes = 0;
      window.Tuning.TUNINGS.forEach((tuning) => {
        window.Tuning.set(tuning.id);
        M.TONICS.forEach((tonic) => M.MODE_ORDER.forEach((modeId) => {
          CM.harmonize(tonic, modeId).forEach((chord) => {
            approaches(tonic, modeId, chord, 1).forEach((item) => { if (!instrumentPath(item.notes)) holes++; });
          });
        }));
      });
      window.Tuning.set(restore);
      add("every connector has a 0–15 fret single-course path on every tuning", holes === 0, holes, 0);
    }
    return { ok: results.every((result) => result.pass), results };
  }

  window.ChordPath = {
    progressionChords, motion, commonTones, guideMove, arpeggios, approaches,
    successors, doors, extension, instrumentPath, build, selfTest
  };
})();
