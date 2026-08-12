/* modes.js — modal system (dromoi), diatonic spelling, chord + progression banks.
 * Pure logic, no DOM. Exposes window.Modes.
 *
 * Implements: FR-08 (mode system), FR-09 (progression banks),
 *             FR-10 (flavour degrees), FR-13 (tonic transposition)
 * Invariants:  MI-04 (diatonic spelling), MI-05 (flavour degrees),
 *              MI-06 (Ousak/Minor share chords)
 * See docs/REQUIREMENTS.md before changing anything in this file.
 */
(function () {
  "use strict";

  // ---- letter-based (diatonic) spelling -----------------------------------
  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

  function parseName(name) {
    const li = LETTERS.indexOf(name[0].toUpperCase());
    let acc = 0;
    for (const ch of name.slice(1)) {
      if (ch === "♭" || ch === "b") acc--;
      else if (ch === "♯" || ch === "#") acc++;
    }
    return { letterIdx: li, acc, pc: (((LETTER_PC[li] + acc) % 12) + 12) % 12 };
  }

  function accStr(n) {
    if (n === 0) return "";
    if (n === -1) return "♭";
    if (n === -2) return "♭♭";
    if (n === 1) return "♯";
    if (n === 2) return "♯♯";
    return "?";
  }

  // Name a pitch class using a REQUIRED letter (keeps chord/scale spelling legal).
  function nameFor(letterIdx, pc) {
    const li = ((letterIdx % 7) + 7) % 7;
    let d = (((pc - LETTER_PC[li]) % 12) + 12) % 12;
    if (d > 6) d -= 12;                       // -> roughly -5..6
    return LETTERS[li] + accStr(d);
  }

  // Pragmatic fallback: guitarists read B, not C♭ (MI-04b).
  const SIMPLIFY = {
    "C♭": "B", "F♭": "E", "E♯": "F", "B♯": "C"
  };
  function simplify(name) { return SIMPLIFY[name] || name; }

  // semitone -> default diatonic step, for degrees borrowed from outside the mode
  const DEFAULT_STEP = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6];
  const DEGREE_LABEL = ["1", "♭2", "2", "♭3", "3", "4", "♯4", "5", "♭6", "6", "♭7", "7"];

  // ---- chord qualities ----------------------------------------------------
  // letterSteps: how many letter-names above the root each chord tone sits.
  const QUALITY = {
    maj:  { offsets: [0, 4, 7],      steps: [0, 2, 4],    sym: "",             roles: ["R", "3", "5"] },
    min:  { offsets: [0, 3, 7],      steps: [0, 2, 4],    sym: "m",            roles: ["R", "b3", "5"] },
    dim:  { offsets: [0, 3, 6],      steps: [0, 2, 4],    sym: "°",       roles: ["R", "b3", "b5"] },
    aug:  { offsets: [0, 4, 8],      steps: [0, 2, 4],    sym: "+",            roles: ["R", "3", "#5"] },
    maj7: { offsets: [0, 4, 7, 11],  steps: [0, 2, 4, 6], sym: "maj7",         roles: ["R", "3", "5", "7"] },
    m7:   { offsets: [0, 3, 7, 10],  steps: [0, 2, 4, 6], sym: "m7",           roles: ["R", "b3", "5", "b7"] },
    dom7: { offsets: [0, 4, 7, 10],  steps: [0, 2, 4, 6], sym: "7",            roles: ["R", "3", "5", "b7"] },
    m7b5: { offsets: [0, 3, 6, 10],  steps: [0, 2, 4, 6], sym: "m7♭5",    roles: ["R", "b3", "b5", "b7"] }
  };

  const ROLE_LABEL = {
    R: "R", b3: "♭3", 3: "3", 5: "5", b5: "♭5", "#5": "♯5",
    b7: "♭7", 7: "7"
  };
  const ROLE_GROUP = {
    R: "root", b3: "third", 3: "third", 5: "fifth", b5: "fifth", "#5": "fifth",
    b7: "seventh", 7: "seventh"
  };

  // ---- the four modes -----------------------------------------------------
  // `flavour` = the 2nd and 3rd degrees. These two notes alone separate all
  // four modes (MI-05) — they drive the flavour highlight and the ear trainer.
  const MODES = {
    major: {
      id: "major", name: "Major", greek: "Μαγιόνε",
      scale: [0, 2, 4, 5, 7, 9, 11],
      flavour: [2, 4],
      blurb: "Ionian. The ii–V–I engine — everything else is a variation."
    },
    minor: {
      id: "minor", name: "Minor", greek: "Μπουσελίκ",
      scale: [0, 2, 3, 5, 7, 8, 10],          // natural minor; V7 borrows the raised 7th
      flavour: [2, 3],
      blurb: "Natural minor, with the harmonic-minor V7 available as a borrowed dominant."
    },
    ousak: {
      id: "ousak", name: "Ousak", greek: "Ουσάκ",
      scale: [0, 1, 3, 5, 7, 8, 10],          // Phrygian
      flavour: [1, 3],
      blurb: "Phrygian in equal temperament (the true 2nd is neutral — which is why no chord is built on it). Same chords as minor; the ♭2 lives in the melody."
    },
    hijaz: {
      id: "hijaz", name: "Hijaz", greek: "Χιτζάζ",
      scale: [0, 1, 4, 5, 7, 8, 10],          // Phrygian dominant
      flavour: [1, 4],
      blurb: "Major tonic, minor ♭VII. The ♭2–♯3 gap is the sound. Hijaz on the 5th of a minor key = Piraeotikos."
    }
  };

  const MODE_ORDER = ["major", "minor", "ousak", "hijaz"];

  // The reliable five-note frame for each dromos. It keeps the player out of
  // the way of the harmony, leaving the characteristic 2nd/3rd as intentional
  // arrival notes rather than another scale run. Hijaz needs a *dominant*
  // pentatonic: its major 3rd is non-negotiable.
  const PENTATONIC = {
    major: { offsets: [0, 2, 4, 7, 9], name: "major pentatonic" },
    minor: { offsets: [0, 3, 5, 7, 10], name: "minor pentatonic" },
    ousak: { offsets: [0, 3, 5, 7, 10], name: "minor pentatonic" },
    hijaz: { offsets: [0, 4, 5, 7, 10], name: "dominant pentatonic" }
  };

  // ---- progression banks --------------------------------------------------
  // deg = semitones above the TONIC. Verified against docs/REQUIREMENTS.md
  // table MI-07; do not edit chords without updating that table + the tests.
  const PROGRESSIONS = {
    major: [
      { id: "ii-V-I", label: "ii – V – I", tag: "core",
        chords: [[2, "m7"], [7, "dom7"], [0, "maj7"]],
        why: "The engine. Everything else is a variation." },
      { id: "I-vi-ii-V", label: "I – vi – ii – V", tag: "core",
        chords: [[0, "maj7"], [9, "m7"], [2, "m7"], [7, "dom7"]],
        why: "Loops forever — the best ear-training vamp there is." },
      { id: "IV-V-I", label: "IV – V – I", tag: "folk",
        chords: [[5, "maj"], [7, "maj"], [0, "maj"]],
        why: "No leading-tone 7th. The dimotiko cadence, not the jazz one." },
      { id: "bVII-I", label: "♭VII – I", tag: "modal",
        chords: [[10, "maj"], [0, "maj"]],
        why: "Modal brightening. All over modern laïko and entechno." }
    ],
    minor: [
      { id: "iio-V-i", label: "iiø – V7 – i", tag: "core",
        chords: [[2, "m7b5"], [7, "dom7"], [0, "m7"]],
        why: "The jazz minor engine. The half-diminished is the sound." },
      { id: "iv-V-i", label: "iv – V – i", tag: "core",
        chords: [[5, "min"], [7, "dom7"], [0, "min"]],
        why: "Harmonic minor. The raised 7th inside the V7 is the tension." },
      { id: "iv-bVII-i", label: "iv – ♭VII – i", tag: "modal",
        chords: [[5, "min"], [10, "maj"], [0, "min"]],
        why: "Natural minor. Softer, no leading tone, more folk." },
      { id: "andalusian", label: "i – ♭VII – ♭VI – V", tag: "gateway",
        chords: [[0, "min"], [10, "maj"], [8, "maj"], [7, "maj"]],
        why: "Andalusian cadence. Lands on the V — and that V is a Hijaz tonic." }
    ],
    ousak: [
      { id: "i-bVII-i", label: "i – ♭VII – i", tag: "core",
        chords: [[0, "min"], [10, "maj"], [0, "min"]],
        why: "The vamp. Half of rebetiko sits here." },
      { id: "iv-bVII-i", label: "iv – ♭VII – i", tag: "core",
        chords: [[5, "min"], [10, "maj"], [0, "min"]],
        why: "The 4–7–1." },
      { id: "bVI-bVII-i", label: "♭VI – ♭VII – i", tag: "core",
        chords: [[8, "maj"], [10, "maj"], [0, "min"]],
        why: "The big lift into the tonic." }
    ],
    hijaz: [
      { id: "I-bII-I", label: "I – ♭II – I", tag: "core",
        chords: [[0, "maj"], [1, "maj"], [0, "maj"]],
        why: "The signature. If you play one Hijaz move, play this." },
      { id: "I-iv-I", label: "I – iv – I", tag: "core",
        chords: [[0, "maj"], [5, "min"], [0, "maj"]],
        why: "Major tonic pulling against a minor subdominant." },
      { id: "I-iv-bVII-I", label: "I – iv – ♭VII – I", tag: "core",
        chords: [[0, "maj"], [5, "min"], [10, "min"], [0, "maj"]],
        why: "The 1–4–7–1. Note the ♭VII is MINOR — that is Hijaz, not minor." },
      { id: "bII-I", label: "♭II – I", tag: "cadence",
        chords: [[1, "maj"], [0, "maj"]],
        why: "The cadence on its own. Drill it until it is reflex." }
    ]
  };

  // ---- builders -----------------------------------------------------------
  const TONICS = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

  function scaleOf(tonicName, modeId) {
    const mode = MODES[modeId];
    const t = parseName(tonicName);
    return mode.scale.map((off, i) => {
      const pc = (t.pc + off) % 12;
      return {
        pc, off,
        name: simplify(nameFor(t.letterIdx + i, pc)),
        degree: DEGREE_LABEL[off],
        isFlavour: mode.flavour.indexOf(off) >= 0,
        isTonic: off === 0
      };
    });
  }

  function flavourPcs(tonicName, modeId) {
    const t = parseName(tonicName);
    return MODES[modeId].flavour.map((off) => (t.pc + off) % 12);
  }

  function pentatonicOf(tonicName, modeId) {
    const frame = PENTATONIC[modeId];
    const scale = scaleOf(tonicName, modeId);
    return frame.offsets.map((off) => {
      const note = scale.find((n) => n.off === off);
      // Every current pentatonic is a subset of its parent mode. Keeping a
      // defensive fallback makes later mode additions fail usefully, not silently.
      if (note) return Object.assign({}, note);
      const tonic = parseName(tonicName);
      const pc = (tonic.pc + off) % 12;
      return {
        pc, off, name: simplify(nameFor(tonic.letterIdx + DEFAULT_STEP[off], pc)),
        degree: DEGREE_LABEL[off], isFlavour: false, isTonic: off === 0
      };
    });
  }

  // Build a chord from a scale degree (semitones above tonic) + quality.
  function buildChord(tonicName, modeId, degOff, qualityId, prevBottomMidi) {
    const t = parseName(tonicName);
    const q = QUALITY[qualityId];
    const mode = MODES[modeId];
    const rootPc = (t.pc + degOff) % 12;

    // root letter: prefer the mode's own degree, else the default diatonic step
    const idxInScale = mode.scale.indexOf(degOff);
    const rootLetter = t.letterIdx + (idxInScale >= 0 ? idxInScale : DEFAULT_STEP[degOff]);
    const rootName = simplify(nameFor(rootLetter, rootPc));

    // place bottom note near the previous chord (simple register continuity)
    let bottom;
    if (prevBottomMidi == null) {
      const base = 55; // ~G3
      bottom = base - ((((base - rootPc) % 12) + 12) % 12);
    } else {
      const k = Math.round((prevBottomMidi - rootPc) / 12);
      const cands = [rootPc + 12 * k, rootPc + 12 * (k - 1), rootPc + 12 * (k + 1)];
      cands.sort((a, b) => {
        const da = Math.abs(a - prevBottomMidi), db = Math.abs(b - prevBottomMidi);
        return da === db ? a - b : da - db;
      });
      bottom = cands[0];
    }
    if (bottom < 43) bottom += 12;      // keep grips on the neck
    if (bottom > 60) bottom -= 12;

    const notes = q.offsets.map((off, i) => {
      const midi = bottom + off;
      const pc = (((midi % 12) + 12) % 12);
      const role = q.roles[i];
      return {
        midi, pc, role,
        roleLabel: ROLE_LABEL[role],
        colorGroup: ROLE_GROUP[role],
        name: simplify(nameFor(rootLetter + q.steps[i], pc)),
        freq: 440 * Math.pow(2, (midi - 69) / 12)
      };
    });

    return {
      rootPc, rootName, quality: qualityId,
      symbol: rootName + q.sym,
      degreeLabel: DEGREE_LABEL[degOff],
      notes, bottomMidi: bottom
    };
  }

  function buildProgression(tonicName, modeId, progId) {
    const prog = PROGRESSIONS[modeId].find((p) => p.id === progId) || PROGRESSIONS[modeId][0];
    let prevBottom = null;
    const chords = prog.chords.map(([deg, q]) => {
      const c = buildChord(tonicName, modeId, deg, q, prevBottom);
      prevBottom = c.bottomMidi;
      return c;
    });
    return { prog, chords };
  }

  // Descending run through the mode — the ear trainer needs MELODY, because
  // Ousak and Minor are chord-identical (MI-06).
  function descendingRun(tonicName, modeId, baseMidi) {
    const t = parseName(tonicName);
    const base = baseMidi == null ? 62 : baseMidi;           // ~D4
    const root = base - ((((base - t.pc) % 12) + 12) % 12);
    const offs = MODES[modeId].scale.slice().reverse();       // 7..1
    const seq = [root + 12].concat(offs.map((o) => root + o));
    return seq.map((m) => ({ midi: m, freq: 440 * Math.pow(2, (m - 69) / 12) }));
  }

  // ---- self-test ----------------------------------------------------------
  // Locks the documented chord spellings (docs/REQUIREMENTS.md, MI-07).
  const EXPECTED = {
    "D|major|ii-V-I": "Em7 A7 Dmaj7",
    "D|major|IV-V-I": "G A D",
    "D|minor|iio-V-i": "Em7♭5 A7 Dm7",
    "D|minor|iv-V-i": "Gm A7 Dm",
    "D|minor|andalusian": "Dm C B♭ A",
    "D|ousak|iv-bVII-i": "Gm C Dm",
    "D|hijaz|I-bII-I": "D E♭ D",
    "D|hijaz|I-iv-bVII-I": "D Gm Cm D",
    "A|hijaz|I-iv-bVII-I": "A Dm Gm A"
  };

  function selfTest() {
    const results = [];
    let ok = true;

    Object.keys(EXPECTED).forEach((k) => {
      const [tonic, modeId, progId] = k.split("|");
      const got = buildProgression(tonic, modeId, progId).chords.map((c) => c.symbol).join(" ");
      const pass = got === EXPECTED[k];
      if (!pass) ok = false;
      results.push({ i: k, want: EXPECTED[k], got, pass });
    });

    // scale spellings that must use one letter per degree
    const scaleChecks = {
      "A|hijaz": "A B♭ C♯ D E F G",
      "D|hijaz": "D E♭ F♯ G A B♭ C",
      "D|ousak": "D E♭ F G A B♭ C",
      "D|major": "D E F♯ G A B C♯"
    };
    Object.keys(scaleChecks).forEach((k) => {
      const [tonic, modeId] = k.split("|");
      const got = scaleOf(tonic, modeId).map((n) => n.name).join(" ");
      const pass = got === scaleChecks[k];
      if (!pass) ok = false;
      results.push({ i: k + " scale", want: scaleChecks[k], got, pass });
    });

    // The solo map must choose the right five-note skeleton. Hijaz is the
    // important guard: minor pentatonic would put a ♭3 against its major tonic.
    const pentChecks = {
      "D|major": "D E F♯ A B",
      "D|minor": "D F G A C",
      "D|ousak": "D F G A C",
      "D|hijaz": "D F♯ G A C"
    };
    Object.keys(pentChecks).forEach((k) => {
      const [tonic, modeId] = k.split("|");
      const got = pentatonicOf(tonic, modeId).map((n) => n.name).join(" ");
      const pass = got === pentChecks[k];
      if (!pass) ok = false;
      results.push({ i: k + " pentatonic", want: pentChecks[k], got, pass });
    });

    // MI-06: Ousak and Minor must produce identical chords for iv-bVII-i
    const a = buildProgression("D", "minor", "iv-bVII-i").chords.map((c) => c.symbol).join(" ");
    const b = buildProgression("D", "ousak", "iv-bVII-i").chords.map((c) => c.symbol).join(" ");
    const same = a === b;
    if (!same) ok = false;
    results.push({ i: "MI-06 ousak==minor chords", want: a, got: b, pass: same });

    // MI-05: every mode must differ from every other in its flavour pair
    const pairs = MODE_ORDER.map((m) => MODES[m].flavour.join(","));
    const uniq = new Set(pairs);
    const distinct = uniq.size === MODE_ORDER.length;
    if (!distinct) ok = false;
    results.push({ i: "MI-05 flavour pairs distinct", want: "4 unique", got: uniq.size + " unique", pass: distinct });

    // MI-10: every chord the app can display must produce a playable grip.
    // (A silent "no grip" once hid every V7 in the cycle behind an empty neck.)
    if (window.Fretboard && window.Tuning) {
      const misses = [];
      let checked = 0;
      const restore = window.Tuning.currentId();
      window.Tuning.TUNINGS.forEach((tun) => {
        window.Tuning.set(tun.id);
        if (window.Theory) {
          window.Theory.buildCycle().forEach((c) => {
            checked++;
            if (!window.Fretboard.findGrip(c.notes, null)) misses.push(tun.id + " cycle:" + c.symbol);
          });
        }
        TONICS.forEach((t) => MODE_ORDER.forEach((m) => {
          PROGRESSIONS[m].forEach((p) => buildProgression(t, m, p.id).chords.forEach((c) => {
            checked++;
            if (!window.Fretboard.findGrip(c.notes, null)) misses.push(tun.id + " " + t + "/" + m + ":" + c.symbol);
          }));
        }));
      });
      window.Tuning.set(restore);
      const pass = misses.length === 0;
      if (!pass) ok = false;
      results.push({
        i: "MI-10 every chord is playable",
        want: checked + " grips",
        got: pass ? checked + " grips" : misses.length + " unplayable: " + misses.slice(0, 5).join(", "),
        pass
      });
    }

    return { ok, results };
  }

  window.Modes = {
    MODES, MODE_ORDER, PROGRESSIONS, TONICS, QUALITY, DEGREE_LABEL, PENTATONIC,
    parseName, nameFor, simplify,
    scaleOf, flavourPcs, pentatonicOf, buildChord, buildProgression, descendingRun,
    selfTest
  };
})();
