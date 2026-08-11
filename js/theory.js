/* theory.js — music core: notes, intervals, voicing generation, cycle builder.
 * Pure logic, no DOM. Exposes window.Theory.
 * The whole ii–V–I pivot cycle is GENERATED from rules, then asserted against
 * a hand-verified ground-truth table (see selfTest()).
 */
(function () {
  "use strict";

  // ---- Note spelling ------------------------------------------------------
  const FLAT_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const SHARP_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

  function spell(pc, acc) {
    pc = ((pc % 12) + 12) % 12;
    return (acc === "sharp" ? SHARP_NAMES : FLAT_NAMES)[pc];
  }

  // ---- Intervals ----------------------------------------------------------
  // role keys: R, b3, 3, 5, b7, 7  (mapped from semitones above the chord root)
  const ROLE_BY_SEMITONE = { 0: "R", 3: "b3", 4: "3", 7: "5", 10: "b7", 11: "7" };
  const ROLE_LABEL = { R: "R", b3: "♭3", 3: "3", 5: "5", b7: "♭7", 7: "7" };
  const ROLE_LONG = { R: "Root", b3: "minor 3rd", 3: "major 3rd", 5: "5th", b7: "minor 7th", 7: "major 7th" };
  // Four color families used everywhere (fretboard, readout, legend):
  const ROLE_COLORGROUP = { R: "root", b3: "third", 3: "third", 5: "fifth", b7: "seventh", 7: "seventh" };

  function roleFor(rootPc, notePc) {
    return ROLE_BY_SEMITONE[(((notePc - rootPc) % 12) + 12) % 12] || "?";
  }

  // ---- Chord shapes (semitone offsets from the LOWEST voiced note) --------
  // min7 / maj7 = root position (root on bottom).
  // dom7 = 5th in the bass  ->  5, ♭7, R, 3 ascending.
  const SHAPES = {
    m7: { offsets: [0, 3, 7, 10], bottomInterval: 0, symbol: "m7" },   // R b3 5 b7
    dom7: { offsets: [0, 3, 5, 9], bottomInterval: 7, symbol: "7" },   // 5 b7 R 3
    maj7: { offsets: [0, 4, 7, 11], bottomInterval: 0, symbol: "maj7" } // R 3 5 7
  };

  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---- Key path (descending whole steps, loops back to C) -----------------
  const KEYS = [
    { name: "C", tonic: 0, acc: "flat" },
    { name: "B♭", tonic: 10, acc: "flat" },
    { name: "A♭", tonic: 8, acc: "flat" },
    { name: "G♭", tonic: 6, acc: "flat" },
    { name: "E", tonic: 4, acc: "sharp" },
    { name: "D", tonic: 2, acc: "sharp" }
  ];

  // Build one chord object with voiced pitches placed near `prevBottom` midi.
  function makeChord(key, fn, quality, rootPc, prevBottom) {
    const shape = SHAPES[quality];
    const bottomPc = (rootPc + shape.bottomInterval) % 12;

    // choose octave for the bottom note nearest prevBottom, tie -> lower.
    let bottomMidi;
    if (prevBottom == null) {
      // anchor first chord's bottom near middle register
      const base = 62; // ~D4
      bottomMidi = base - (((base - bottomPc) % 12 + 12) % 12);
    } else {
      const k = Math.round((prevBottom - bottomPc) / 12);
      const cand = [bottomPc + 12 * k, bottomPc + 12 * (k - 1), bottomPc + 12 * (k + 1)];
      cand.sort((a, b) => {
        const da = Math.abs(a - prevBottom), db = Math.abs(b - prevBottom);
        return da === db ? a - b : da - db; // nearest, prefer lower on tie
      });
      bottomMidi = cand[0];
    }

    const notes = shape.offsets.map((off) => {
      const midi = bottomMidi + off;
      const pc = ((midi % 12) + 12) % 12;
      const role = roleFor(rootPc, pc);
      return {
        midi,
        pc,
        role,
        roleLabel: ROLE_LABEL[role],
        colorGroup: ROLE_COLORGROUP[role],
        name: spell(pc, key.acc),
        freq: midiToFreq(midi)
      };
    });

    return {
      key: key.name,
      keyAcc: key.acc,
      fn: fn,                       // "ii" | "V" | "I"
      quality,                      // "m7" | "dom7" | "maj7"
      rootPc,
      rootName: spell(rootPc, key.acc),
      symbol: spell(rootPc, key.acc) + shape.symbol,
      notes,                        // low -> high
      bottomMidi
    };
  }

  // Build the full 18-chord cycle (6 keys x ii-V-I), voice-led.
  function buildCycle() {
    const chords = [];
    let prevBottom = null;
    KEYS.forEach((key) => {
      const specs = [
        { fn: "ii", quality: "m7", rootPc: (key.tonic + 2) % 12 },
        { fn: "V", quality: "dom7", rootPc: (key.tonic + 7) % 12 },
        { fn: "I", quality: "maj7", rootPc: key.tonic }
      ];
      specs.forEach((s) => {
        const c = makeChord(key, s.fn, s.quality, s.rootPc, prevBottom);
        chords.push(c);
        prevBottom = c.bottomMidi;
      });
    });
    return chords;
  }

  // For a transition prev -> cur, classify each cur note as held or moved,
  // by PITCH CLASS (voice-leading is octave-agnostic; this also makes the
  // loop-closing pivot — which resets down an octave — read correctly).
  function transition(prev, cur) {
    if (!prev) return cur.notes.map(() => "new");
    const prevPcs = new Set(prev.notes.map((n) => n.pc));
    return cur.notes.map((n) => (prevPcs.has(n.pc) ? "held" : "moved"));
  }

  // smallest semitone distance between two pitch classes (0..6)
  function pcDistance(a, b) {
    const d = (((a - b) % 12) + 12) % 12;
    return Math.min(d, 12 - d);
  }

  function isPivot(prev, cur) {
    // pivot = the I(maj7) of one key becoming the ii(m7) of the next.
    return !!prev && prev.fn === "I" && cur.fn === "ii";
  }

  // ---- Self test: generated cycle must match the verified ground truth ----
  const GROUND_TRUTH = [
    ["Dm7", "D F A C"], ["G7", "D F G B"], ["Cmaj7", "C E G B"],
    ["Cm7", "C E♭ G B♭"], ["F7", "C E♭ F A"], ["B♭maj7", "B♭ D F A"],
    ["B♭m7", "B♭ D♭ F A♭"], ["E♭7", "B♭ D♭ E♭ G"], ["A♭maj7", "A♭ C E♭ G"],
    ["A♭m7", "A♭ B E♭ G♭"], ["D♭7", "A♭ B D♭ F"], ["G♭maj7", "G♭ B♭ D♭ F"],
    ["F♯m7", "F♯ A C♯ E"], ["B7", "F♯ A B D♯"], ["Emaj7", "E G♯ B D♯"],
    ["Em7", "E G B D"], ["A7", "E G A C♯"], ["Dmaj7", "D F♯ A C♯"]
  ];

  function selfTest() {
    const cycle = buildCycle();
    const results = [];
    let ok = true;

    // 1) chord symbols + note names match ground truth
    cycle.forEach((c, i) => {
      const gotNames = c.notes.map((n) => n.name).join(" ");
      const [wantSym, wantNames] = GROUND_TRUTH[i];
      const pass = c.symbol === wantSym && gotNames === wantNames;
      if (!pass) ok = false;
      results.push({ i, want: wantSym + " = " + wantNames, got: c.symbol + " = " + gotNames, pass });
    });

    // 2) every transition moves exactly 2 voices, each down by <= a whole step
    for (let i = 1; i <= cycle.length; i++) {
      const prev = cycle[i - 1];
      const cur = cycle[i % cycle.length]; // include wrap back to start
      const cls = transition(prev, cur);
      const moved = cls.filter((x) => x === "moved").length;
      const held = cls.filter((x) => x === "held").length;
      // moved voices: each must be within a whole step of some prev pitch class
      const prevPcs = prev.notes.map((n) => n.pc);
      let stepOk = true;
      cur.notes.forEach((n, k) => {
        if (cls[k] === "moved") {
          const near = Math.min(...prevPcs.map((p) => pcDistance(p, n.pc)));
          if (near > 2) stepOk = false;
        }
      });
      const pass = moved === 2 && held === 2 && stepOk;
      if (!pass) ok = false;
      results.push({
        i: "→" + (i % cycle.length),
        want: "2 held / 2 moved ≤ whole-step",
        got: held + " held / " + moved + " moved" + (stepOk ? "" : " (leap!)"),
        pass
      });
    }

    return { ok, results };
  }

  window.Theory = {
    KEYS, SHAPES, ROLE_LABEL, ROLE_LONG, ROLE_COLORGROUP,
    spell, roleFor, midiToFreq,
    buildCycle, transition, isPivot, selfTest
  };
})();
