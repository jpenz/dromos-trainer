/* melody-harmony.js — melody-note hearing, harmonisation, and voice-leading.
 * Pure logic, no DOM. Exposes window.MelodyHarmony.
 *
 * A melody pitch does not imply one correct chord. This module therefore
 * separates three claims that are easy to blur in a teaching UI:
 *   1. the pitch's scale-degree identity,
 *   2. every derived chord in the selected collection that contains it, and
 *   3. only the next-chord moves evidenced by Modes.PROGRESSIONS.
 */
(function () {
  "use strict";

  const M = window.Modes;
  const CM = window.ChordMap;
  const mod12 = (value) => ((value % 12) + 12) % 12;

  const DEGREE_HEARING = {
    "1": { short: "home", hear: "Settled against the tonic. Use it to reset your ear before comparing colour tones." },
    "♭2": { short: "tight upper neighbour", hear: "The smallest step above home. Hear the friction first, then its pull back toward 1." },
    "2": { short: "open neighbour", hear: "One whole step above home. It can travel in either direction, so the harmony decides its job." },
    "♭3": { short: "minor identity", hear: "This is the note that makes the home sound minor. Compare it directly with 3." },
    "3": { short: "major identity", hear: "This is the note that makes the home sound major. Hear its brightness against 1 and 5." },
    "4": { short: "lean above the 3rd", hear: "Stable in the scale but tense over a tonic chord; compare holding it with letting it fall to the 3rd." },
    "♭6": { short: "dark upper colour", hear: "A strong minor/modal colour above 5. Its chord context determines whether it rests or continues." },
    "6": { short: "open upper colour", hear: "A bright upper colour that can belong to the harmony or act as a connecting tone." },
    "5": { short: "frame tone", hear: "A stable support above home. It identifies the tonal frame less strongly than the 3rd." },
    "♭7": { short: "modal seventh", hear: "A whole step below home. It gives a softer, modal return instead of a leading-tone pull." },
    "7": { short: "leading tone", hear: "A half step below home. Pre-hear it resolving upward to 1." }
  };

  const CHORD_TONE_WEIGHT = { "3": 34, b3: 34, "7": 29, b7: 27, bb7: 25, R: 17, b5: 14, "#5": 14, "5": 9 };
  const ROLE_WEIGHT = { home: 38, cadence: 32, primary: 24, colour: 15, derived: 0 };

  function midiForPc(pc, near) {
    const center = Number.isFinite(near) ? near : 67;
    const candidates = [];
    for (let midi = 48; midi <= 84; midi++) if (mod12(midi) === mod12(pc)) candidates.push(midi);
    candidates.sort((left, right) => Math.abs(left - center) - Math.abs(right - center) || left - right);
    return candidates[0];
  }

  function audibleNote(note, near) {
    const midi = midiForPc(note.pc, near);
    return Object.assign({}, note, { midi, freq: 440 * Math.pow(2, (midi - 69) / 12) });
  }

  function degreeHearing(note, degreeIndex) {
    const copy = DEGREE_HEARING[note.degree] || { short: "scale colour", hear: "Compare it with the tonic, then hear how the chord changes its meaning." };
    return {
      short: copy.short,
      hear: copy.hear,
      zone: degreeIndex < 4 ? "lower tetrachord · degrees 1–4" : "upper tetrachord · degrees 5–8",
      flavour: !!note.isFlavour
    };
  }

  function melodyRoleCopy(role) {
    if (role === "3" || role === "b3") return "As the 3rd, the melody states the chord quality clearly.";
    if (["7", "b7", "bb7"].includes(role)) return "As the 7th, the melody adds colour and a strong voice-leading job.";
    if (role === "R") return "As the root, the melody sounds direct and settled but says less about major or minor.";
    if (["b5", "#5"].includes(role)) return "As an altered 5th, the melody is a defining colour that needs deliberate handling.";
    return "As the 5th, the melody is stable and open; the other voices must state the chord quality.";
  }

  function nextOptions(tonic, modeId, degreeIndex) {
    const scale = M.scaleOf(tonic, modeId);
    const scaleNote = scale[degreeIndex];
    if (!scaleNote) return [];
    const grouped = new Map();
    (M.PROGRESSIONS[modeId] || []).forEach((progression) => {
      const labels = progression.label.split(/\s+–\s+/);
      progression.chords.forEach(([offset], index) => {
        if (offset !== scaleNote.off) return;
        const nextIndex = (index + 1) % progression.chords.length;
        const [nextOffset, nextQuality] = progression.chords[nextIndex];
        const key = `${nextOffset}:${nextQuality}`;
        if (!grouped.has(key)) {
          const chord = M.buildChord(tonic, modeId, nextOffset, nextQuality);
          chord.degreeLabel = labels[nextIndex] || chord.degreeLabel;
          grouped.set(key, {
            nextOffset,
            quality: nextQuality,
            chord,
            routes: [],
            returnsHome: nextOffset === 0
          });
        }
        grouped.get(key).routes.push({
          id: progression.id,
          label: progression.label,
          tier: progression.tier,
          group: progression.group,
          wraps: index === progression.chords.length - 1,
          why: progression.why
        });
      });
    });
    return Array.from(grouped.values()).map((option) => Object.assign(option, {
      evidenceCount: option.routes.length,
      evidenceLabel: `${option.routes.length} trainer map${option.routes.length === 1 ? "" : "s"}`
    })).sort((left, right) =>
      right.evidenceCount - left.evidenceCount || Number(right.returnsHome) - Number(left.returnsHome) || left.nextOffset - right.nextOffset);
  }

  function candidateChords(tonic, modeId, degreeIndex, depth) {
    const scale = M.scaleOf(tonic, modeId);
    const melody = scale[degreeIndex];
    if (!melody) return [];
    return CM.harmonize(tonic, modeId, depth).map((chord) => {
      const chordTone = chord.notes.find((note) => note.pc === melody.pc);
      if (!chordTone) return null;
      const successors = nextOptions(tonic, modeId, chord.degreeIndex);
      const score = (CHORD_TONE_WEIGHT[chordTone.role] || 0) +
        (ROLE_WEIGHT[chord.workingRole.id] || 0) +
        Math.round(chord.prominence.ratio * 20) + Math.min(8, successors.length * 2);
      return {
        chord,
        chordTone,
        score,
        successors,
        roleReason: melodyRoleCopy(chordTone.role),
        evidence: chord.prominence.mapsUsed
          ? `${chord.workingRole.label} · degree appears in ${chord.prominence.mapsUsed}/${chord.prominence.totalMaps} trainer maps`
          : "Derived from the scale · no route in the current trainer bank",
        evidenceKind: chord.prominence.mapsUsed ? "documented-route" : "derived-only"
      };
    }).filter(Boolean).sort((left, right) => right.score - left.score || left.chord.degreeIndex - right.chord.degreeIndex)
      .map((candidate, index) => Object.assign(candidate, {
        rankLabel: index === 0 ? "Start here" : index === 1 ? "Compare next" : "Another colour"
      }));
  }

  function nearestChordTarget(from, chord) {
    const isGuide = (note) => ["3", "b3", "7", "b7", "bb7"].includes(note.role);
    const pool = chord.notes.map((note) => audibleNote(note, from.midi)).sort((left, right) =>
      Math.abs(left.midi - from.midi) - Math.abs(right.midi - from.midi) ||
      Number(isGuide(right)) - Number(isGuide(left)) || left.midi - right.midi);
    const nearest = pool[0];
    const nearestGuide = pool.filter(isGuide)[0];
    // A guide tone is a valuable destination only when the hand and the ear can
    // reach it as a genuinely small move. Do not turn "target the 3rd" into a
    // needless leap when a root or 5th resolves by half/whole step.
    return nearestGuide && Math.abs(nearestGuide.midi - from.midi) <= 2
      ? nearestGuide
      : nearest;
  }

  function enhancementMoves(prompt, candidate, successor) {
    if (!prompt || !candidate) return [];
    const melody = prompt.note;
    const scale = prompt.scale;
    const chord = candidate.chord;
    const next = successor && successor.chord;
    const moves = [];

    if (next && next.notes.some((note) => note.pc === melody.pc)) {
      const heldRole = next.notes.find((note) => note.pc === melody.pc).role;
      moves.push({
        id: "common-tone", label: "Hold the common top note", badge: "oblique motion",
        detail: `${melody.name} stays while ${chord.symbol} moves to ${next.symbol}; hear its job change to ${heldRole}.`,
        listen: "Keep the pitch absolutely still and listen to the harmony re-name it.",
        kind: "line", notes: [melody, Object.assign({}, melody)], chords: [chord, next]
      });
    }

    if (next) {
      const target = nearestChordTarget(melody, next);
      const distance = Math.abs(target.midi - melody.midi);
      const isGuide = ["3", "b3", "7", "b7", "bb7"].includes(target.role);
      moves.push({
        id: "guide-thread",
        label: isGuide ? "Answer with a nearby guide tone" : "Answer with the nearest chord tone",
        badge: isGuide ? "3rd / 7th target" : "shortest useful move",
        detail: `${melody.name} → ${target.name} (${target.roleLabel} of ${next.symbol}) · ${distance} semitone${distance === 1 ? "" : "s"}.`,
        listen: "Sing the destination before the chord changes; let the line make the new chord audible.",
        kind: "line", notes: [melody, target], chords: [chord, next]
      });
    }

    const shadowIndex = (prompt.degreeIndex + 5) % 7;
    const shadow = audibleNote(scale[shadowIndex], melody.midi - 3);
    while (shadow.midi >= melody.midi) shadow.midi -= 12;
    shadow.freq = 440 * Math.pow(2, (shadow.midi - 69) / 12);
    const shadowTone = chord.notes.find((note) => note.pc === shadow.pc);
    moves.push({
      id: "third-shadow", label: "Add a diatonic 3rd below", badge: "Chiotis-linked practice",
      exampleId: "chiotis-double-voice",
      detail: `${melody.name} over ${shadow.name}${shadowTone ? ` · ${shadow.name} is ${shadowTone.roleLabel} of ${chord.symbol}` : " · scale colour, not a chord tone here"}.`,
      listen: shadowTone
        ? "Play the single melody first, then add the lower voice without changing its rhythm."
        : "Audition the friction; keep it only if the line resolves clearly into the chord.",
      kind: "pair", notes: [shadow, melody], chords: [chord]
    });
    return moves;
  }

  function buildPrompt(options) {
    const tonic = options && options.tonic || "D";
    const modeId = options && M.MODES[options.modeId] ? options.modeId : "major";
    const degreeIndex = Math.max(0, Math.min(6, Number(options && options.degreeIndex) || 0));
    const depth = options && options.depth === "seventh" ? "seventh" : "triad";
    const scale = M.scaleOf(tonic, modeId);
    const note = audibleNote(scale[degreeIndex], 69);
    const candidates = candidateChords(tonic, modeId, degreeIndex, depth);
    return {
      tonic,
      modeId,
      mode: M.MODES[modeId],
      degreeIndex,
      depth,
      scale,
      note,
      hearing: degreeHearing(note, degreeIndex),
      homeChord: CM.harmonize(tonic, modeId, "triad")[0],
      candidates
    };
  }

  function selfTest() {
    const results = [];
    const add = (name, pass, detail) => results.push({ name, pass, detail });
    let prompts = 0;
    let candidates = 0;
    let transitions = 0;
    let valid = true;
    M.TONICS.forEach((tonic) => M.MODE_ORDER.forEach((modeId) => {
      for (let degreeIndex = 0; degreeIndex < 7; degreeIndex++) {
        const prompt = buildPrompt({ tonic, modeId, degreeIndex });
        prompts++;
        valid = valid && prompt.note.pc === prompt.scale[degreeIndex].pc && mod12(prompt.note.midi) === prompt.note.pc;
        valid = valid && prompt.candidates.length === 3;
        prompt.candidates.forEach((candidate) => {
          candidates++;
          valid = valid && candidate.chord.notes.some((note) => note.pc === prompt.note.pc);
          candidate.successors.forEach((successor) => {
            transitions++;
            valid = valid && successor.routes.every((route) => {
              const progression = M.PROGRESSIONS[modeId].find((item) => item.id === route.id);
              return progression && progression.chords.some(([offset], index) =>
                offset === candidate.chord.scaleNote.off && progression.chords[(index + 1) % progression.chords.length][0] === successor.nextOffset);
            });
          });
          const successor = candidate.successors[0] || null;
          enhancementMoves(prompt, candidate, successor).forEach((move) => {
            valid = valid && move.notes.every((note) => Number.isFinite(note.midi) && Number.isFinite(note.freq));
          });
        });
      }
    }));
    add("all tonic/dromos/degree prompts remain coherent", valid, `${prompts} prompts · ${candidates} candidates · ${transitions} evidenced transitions`);
    const seventh = buildPrompt({ tonic: "D", modeId: "harmonicMinor", degreeIndex: 6, depth: "seventh" });
    add("seventh depth gives four lawful harmonisations", seventh.candidates.length === 4, seventh.candidates.map((item) => item.chord.symbol).join(" "));
    const derived = buildPrompt({ tonic: "D", modeId: "hijaz", degreeIndex: 2 }).candidates.find((item) => item.chord.degreeIndex === 2);
    add("derived-only chords stay disclosed", derived && derived.evidenceKind === "derived-only" && derived.successors.length === 0, derived && derived.evidence);
    return { ok: results.every((result) => result.pass), results };
  }

  window.MelodyHarmony = {
    DEGREE_HEARING,
    midiForPc,
    audibleNote,
    degreeHearing,
    nextOptions,
    candidateChords,
    enhancementMoves,
    buildPrompt,
    selfTest
  };
})();
