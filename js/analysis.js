/* analysis.js — transparent, deterministic study analysis for chord maps and
 * chord-aligned note lines. It explains observations; it never guesses that a
 * single chord has only one possible musical meaning.
 */
(function () {
  "use strict";

  const NATURAL_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const MODE_DEGREES = {
    major: [
      [0, "I"], [2, "ii"], [4, "iii"], [5, "IV"], [7, "V"], [9, "vi"], [11, "vii°"]
    ],
    minor: [
      [0, "i"], [2, "ii°"], [3, "♭III"], [5, "iv"], [7, "v"], [8, "♭VI"], [10, "♭VII"]
    ],
    ousak: [
      [0, "i"], [1, "♭II"], [3, "♭III"], [5, "iv"], [7, "v"], [8, "♭VI"], [10, "♭VII"]
    ],
    hijaz: [
      [0, "I"], [1, "♭II"], [4, "III"], [5, "iv"], [7, "V"], [8, "♭VI"], [10, "♭VII"]
    ]
  };
  const MODE_OFFSETS = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    ousak: [0, 1, 3, 5, 7, 8, 10],
    hijaz: [0, 1, 4, 5, 7, 8, 10]
  };
  const QUALITY_TONES = {
    major: [[0, "R", 0], [4, "3", 2], [7, "5", 4]],
    minor: [[0, "R", 0], [3, "♭3", 2], [7, "5", 4]],
    dominant: [[0, "R", 0], [4, "3", 2], [7, "5", 4], [10, "♭7", 6]],
    maj7: [[0, "R", 0], [4, "3", 2], [7, "5", 4], [11, "7", 6]],
    min7: [[0, "R", 0], [3, "♭3", 2], [7, "5", 4], [10, "♭7", 6]],
    halfdim: [[0, "R", 0], [3, "♭3", 2], [6, "♭5", 4], [10, "♭7", 6]],
    dim: [[0, "R", 0], [3, "♭3", 2], [6, "♭5", 4]],
    aug: [[0, "R", 0], [4, "3", 2], [8, "♯5", 4]]
  };
  const PYRAMID = [
    {
      id: "time",
      title: "1. Time and form",
      question: "Where is the phrase in the pulse and song form?",
      why: "Meter, grouping, section, and accompaniment density decide how much space a line needs.",
      drill: "Clap one full cycle of the style pulse, comp it with one shape, then sing one answer before playing it."
    },
    {
      id: "map",
      title: "2. Modal-harmonic map",
      question: "What is home, what moves, and what colour is being introduced?",
      why: "A dromos and a chord progression create different kinds of expectation; identify both before choosing a scale route.",
      drill: "Name each chord’s function aloud, then play only root and 3rd through the changes."
    },
    {
      id: "line",
      title: "3. Melodic route",
      question: "Which target makes the change audible, and how will the line reach it?",
      why: "Triads and guide tones make the harmony clear; pentatonic/tetrachord notes, approaches, and motifs connect them.",
      drill: "Choose one target per chord. Use at most two travelling notes before each target, then repeat with a different rhythm."
    },
    {
      id: "touch",
      title: "4. Touch and instrument role",
      question: "How should this phrase be articulated without obscuring the music?",
      why: "Slides, ornaments, vibrato, tremolo, pick direction, and comp density are expression and function—not decoration piled on top.",
      drill: "Play the same four-note answer plain, then with one idiomatic ornament; keep the pulse and target unchanged."
    }
  ];

  function mod12(value) { return ((value % 12) + 12) % 12; }

  function parsePitch(raw) {
    const match = String(raw || "").trim().match(/^([A-Ga-g])([#♯b♭]?)/);
    if (!match) return null;
    const letter = match[1].toUpperCase();
    const accidental = match[2].replace("♯", "#").replace("♭", "b");
    const delta = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
    return { raw: match[0], letter, accidental, pc: mod12(NATURAL_PC[letter] + delta) };
  }

  function parseChord(raw) {
    const token = String(raw || "").trim();
    const pitch = parsePitch(token);
    if (!pitch) return null;
    const suffix = token.slice(pitch.raw.length).replace(/−/g, "-");
    const lower = suffix.toLowerCase();
    let quality = "major";
    if (/m7[♭b]5|ø/.test(lower)) quality = "halfdim";
    else if (/dim|°/.test(lower)) quality = "dim";
    else if (/aug|\+/.test(lower)) quality = "aug";
    else if (/^(?:maj|M)(?:7|9|11|13)?/.test(suffix) || /maj7|m7\+/.test(lower)) quality = "maj7";
    else if (/^m(?:7|9|11|13)?|^-/.test(lower)) quality = /7|9|11|13/.test(lower) ? "min7" : "minor";
    else if (/(?:^|[^a-z])7|9|11|13/.test(lower)) quality = "dominant";
    return Object.assign({ raw: token, suffix, quality }, pitch);
  }

  function parseProgression(text) {
    return String(text || "")
      // Keep the ASCII dash intact: `C-7` is a valid lead-sheet spelling for Cm7.
      .split(/[\s,|→–]+/)
      .map(parseChord)
      .filter(Boolean);
  }

  function spellTone(chord, semitones, letterSteps) {
    const letterIndex = LETTERS.indexOf(chord.letter);
    const letter = LETTERS[(letterIndex + letterSteps) % LETTERS.length];
    const desired = mod12(chord.pc + semitones);
    let diff = mod12(desired - NATURAL_PC[letter]);
    if (diff > 6) diff -= 12;
    const accidental = diff === -1 ? "♭" : diff === 1 ? "♯" : diff === 0 ? "" : diff === -2 ? "♭♭" : "♯♯";
    return { name: letter + accidental, pc: desired };
  }

  function tonesFor(chord) {
    return (QUALITY_TONES[chord.quality] || QUALITY_TONES.major).map(([semitones, role, steps]) =>
      Object.assign({ role, semitones }, spellTone(chord, semitones, steps)));
  }

  function degreeFor(pc, tonicPc, modeId) {
    const rel = mod12(pc - tonicPc);
    const match = (MODE_DEGREES[modeId] || MODE_DEGREES.major).find(([offset]) => offset === rel);
    return match ? { offset: rel, label: match[1] } : { offset: rel, label: null };
  }

  function labelsFor(chord, next, context) {
    const degree = degreeFor(chord.pc, context.tonicPc, context.modeId);
    const nextDegree = next ? degreeFor(next.pc, context.tonicPc, context.modeId) : null;
    const isDominantMove = next && mod12(next.pc - chord.pc) === 5 && (chord.quality === "dominant" || chord.quality === "major");
    const notes = [];
    let label = degree.label || "chromatic";

    if (context.modeId === "minor" && degree.offset === 7 && (chord.quality === "major" || chord.quality === "dominant")) {
      label = chord.quality === "dominant" ? "V7" : "V";
      notes.push({ type: "harmonic-minor", title: "Raised-7th dominant pull", detail: "Major V in minor introduces the leading tone. Hear its 3rd resolve by semitone into the tonic or a stable chord tone." });
    }
    if (context.modeId === "minor" && degree.offset === 5 && (chord.quality === "major" || chord.quality === "dominant")) {
      label = chord.quality === "dominant" ? "IV7" : "IV";
      notes.push({ type: "modal-mixture", title: "Major IV in minor", detail: "This raises the 6th relative to natural minor, often giving a Dorian/modal colour. If it then resolves up a fourth, hear it also as a possible dominant function toward the next chord." });
    }
    if (context.modeId === "hijaz" && degree.offset === 1) {
      notes.push({ type: "hijaz-bII", title: "Hijaz ♭II tension", detail: "The ♭II is a defining colour against the tonic. Let its friction resolve by ear; do not treat it as a generic major-key passing chord." });
    }
    if (isDominantMove) {
      const destination = nextDegree && nextDegree.label ? nextDegree.label : next.raw;
      if (next.pc === context.tonicPc) {
        notes.push({ type: "cadence", title: "Dominant resolution", detail: "This chord points directly to home. Aim for its 3rd or 7th before the change, then resolve to a tonic-chord tone." });
      } else {
        notes.push({ type: "secondary", title: "Possible secondary dominant", detail: "It resolves up a fourth to " + destination + ". Hear it as a temporary pull toward that next chord, not automatically as a permanent key change." });
      }
    }
    if (next && degree.label === "♭VII" && next.pc === context.tonicPc) {
      notes.push({ type: "modal-return", title: "Modal ♭VII → home", detail: "This is a modal return rather than a leading-tone dominant cadence. The melody, bass, and dromos decide how strongly it feels resolved." });
    }
    return { degree, label, notes };
  }

  function strongTones(chord) {
    const tones = tonesFor(chord);
    const guides = tones.filter((tone) => tone.role === "3" || tone.role === "♭3" || tone.role === "7" || tone.role === "♭7");
    return guides.length ? guides : tones.filter((tone) => tone.role === "3" || tone.role === "♭3" || tone.role === "R");
  }

  function analyzeProgression(text, context) {
    const chords = parseProgression(text);
    const tonic = parsePitch(context && context.tonic ? context.tonic : "D") || parsePitch("D");
    const modeId = context && MODE_OFFSETS[context.modeId] ? context.modeId : "minor";
    const ctx = { tonicPc: tonic.pc, modeId };
    const records = chords.map((chord, index) => {
      const next = chords[index + 1] || null;
      const classification = labelsFor(chord, next, ctx);
      return Object.assign({ chord, tones: tonesFor(chord), strong: strongTones(chord), next }, classification);
    });
    const concepts = records.flatMap((record) => record.notes.map((note) => Object.assign({ chord: record.chord.raw }, note)));
    const homeLabel = tonic.raw + " " + ({ major: "Major", minor: "Minor", ousak: "Ousak", hijaz: "Hijaz" }[modeId]);
    const summary = records.length
      ? "In " + homeLabel + ", this is " + records.map((record) => record.label).join(" – ") + ". " + (concepts[0] ? concepts[0].title + " is the first thing to hear." : "Start by making each chord change audible with its 3rd.")
      : "Enter chord symbols such as Dm Gm A7 Dm to build a harmonic map.";
    const linePlan = records.map((record, index) => {
      const now = record.strong.map((tone) => tone.name + " (" + tone.role + ")").join(" · ");
      const next = records[index + 1];
      const arriving = next ? next.strong.map((tone) => tone.name + " (" + tone.role + ")").join(" · ") : "resolve into the home chord";
      return { chord: record.chord.raw, now, arriving };
    });
    return { chords, tonic, modeId, records, concepts, summary, linePlan, scaleOffsets: MODE_OFFSETS[modeId] };
  }

  function parseLine(text) {
    return String(text || "").split("|").map((segment) => {
      const parts = segment.split(":");
      if (parts.length < 2) return null;
      const chord = parseChord(parts.shift());
      const notes = parts.join(":").trim().split(/[\s,]+/).map(parsePitch).filter(Boolean);
      return chord && notes.length ? { chord, notes } : null;
    }).filter(Boolean);
  }

  function analyzeLine(text, context) {
    const tonic = parsePitch(context && context.tonic ? context.tonic : "D") || parsePitch("D");
    const modeId = context && MODE_OFFSETS[context.modeId] ? context.modeId : "minor";
    const scale = new Set(MODE_OFFSETS[modeId].map((offset) => mod12(tonic.pc + offset)));
    const segments = parseLine(text).map((segment) => {
      const tones = tonesFor(segment.chord);
      const annotated = segment.notes.map((note) => {
        const chordTone = tones.find((tone) => tone.pc === note.pc);
        return {
          name: note.raw.replace("#", "♯").replace("b", "♭"),
          kind: chordTone ? "chord" : scale.has(note.pc) ? "inside" : "outside",
          role: chordTone ? chordTone.role : scale.has(note.pc) ? "dromos tone" : "approach / colour"
        };
      });
      const landing = annotated[annotated.length - 1];
      return { chord: segment.chord.raw, notes: annotated, landing };
    });
    const summary = segments.length
      ? segments.map((segment) => segment.chord + " lands on " + segment.landing.name + " (" + segment.landing.role + ")").join(" · ")
      : "Use chord-aligned text, for example: Dm: A C D | Gm: B♭ A G | A7: C♯ E G | Dm: F E D";
    return { segments, summary };
  }

  function selfTest() {
    const results = [];
    const check = (name, pass, detail) => results.push({ name, pass, detail: detail || "" });
    const minor = analyzeProgression("Dm Gm A7 Dm", { tonic: "D", modeId: "minor" });
    check("minor V7 is recognised as harmonic pull", minor.records[2].notes.some((note) => note.type === "harmonic-minor"));
    check("A7 targets C♯ as its 3rd", minor.records[2].strong.some((tone) => tone.name === "C♯" && tone.role === "3"));
    const dorian = analyzeProgression("Am D E", { tonic: "A", modeId: "minor" });
    check("major IV in minor is qualified as modal mixture", dorian.records[1].notes.some((note) => note.type === "modal-mixture"));
    const secondary = analyzeProgression("Am D G", { tonic: "A", modeId: "minor" });
    check("secondary function remains explicitly conditional", secondary.records[1].notes.some((note) => note.title === "Possible secondary dominant"));
    const hijaz = analyzeProgression("D E♭ Gm Cm D", { tonic: "D", modeId: "hijaz" });
    check("Hijaz ♭II is labelled as colour", hijaz.records[1].notes.some((note) => note.type === "hijaz-bII"));
    const line = analyzeLine("Dm: A C D | A7: C♯ E G", { tonic: "D", modeId: "minor" });
    check("line analysis identifies chord-tone landings", line.segments[1].landing.role === "♭7");
    check("pyramid layers are MECE teaching buckets", new Set(PYRAMID.map((item) => item.id)).size === 4 && PYRAMID.length === 4);
    return { ok: results.every((result) => result.pass), results };
  }

  window.AnalysisEngine = { MODE_DEGREES, MODE_OFFSETS, PYRAMID, parseChord, parseProgression, analyzeProgression, analyzeLine, selfTest };
})();
