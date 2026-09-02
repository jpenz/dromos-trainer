/* ear-drills.js — strict, explainable Recall-question vocabulary.
 * Pure logic. Keeps a harmonic label, scale collection, chord sequence and
 * feedback explanation in one place so the UI cannot mark an ambiguous map
 * correct merely because it shares a few chords with another one.
 */
(function () {
  "use strict";

  const M = window.Modes;
  const FAMILY_ORDER = ["major", "minor", "harmonicMinor", "ousak", "hijaz"];

  function family(id) {
    const mode = M.MODES[id];
    if (!mode) return null;
    return {
      id,
      label: mode.name,
      greek: mode.greek,
      signature: mode.signature,
      category: id === "harmonicMinor" ? "functional minor" : id === "ousak" || id === "hijaz" ? "dromos colour" : "tonal collection"
    };
  }

  function families() { return FAMILY_ORDER.map(family).filter(Boolean); }

  function progressions(familyId) {
    return (M.PROGRESSIONS[familyId] || []).filter((progression) => progression.earSafe);
  }

  function progression(familyId, progressionId) {
    return progressions(familyId).find((item) => item.id === progressionId) || null;
  }

  function answerLabel(answer) {
    const item = family(answer.modeId);
    return `${answer.tonic} ${item ? item.label : answer.modeId}`;
  }

  function scaleNames(answer) {
    return M.scaleOf(answer.tonic, answer.modeId).map((note) => note.name).join(" ");
  }

  function chordSymbols(answer) {
    return M.buildProgression(answer.tonic, answer.modeId, answer.progressionId).chords.map((chord) => chord.symbol);
  }

  function homeChord(answer) {
    const chords = M.buildProgression(answer.tonic, answer.modeId, answer.progressionId).chords;
    return chords.slice().reverse().find((chord) => chord.rootPc === M.parseName(answer.tonic).pc) || chords[0];
  }

  function choicePrompt(familyId) {
    const item = family(familyId);
    if (!item) return "Choose a colour family, then test it against the home and the change.";
    return `Test ${item.label}: listen for ${item.signature}; then see whether its cadence makes the final chord feel like home.`;
  }

  function hint(answer, level) {
    const base = "Find the home first: hum the pitch that feels finished, then replay the final chord.";
    if (level < 1) return base;
    const clues = {
      major: "There is a bright major 3rd above home. Listen for ii–V pressure or a clear IV–V arrival.",
      minor: "The 7th stays lowered: there is no leading-tone semitone into home. Listen for i–♭VII–i or ♭VI–♭VII–i.",
      harmonicMinor: "Listen for the raised 7 resolving by semitone into 1. That leading tone belongs to a V7 → i functional cadence.",
      ousak: "Listen for ♭2 beside ♭3 in the descending colour. In this strict exercise the ♭VII chord is minor, not major.",
      hijaz: "Listen for ♭2 followed by a major 3rd. Its characteristic cadence returns to a major I, and its ♭VII is minor."
    };
    if (level < 2) return clues[answer.modeId];
    const p = progression(answer.modeId, answer.progressionId);
    return `Map clue: the answer uses ${p ? p.label : "the selected progression"}. Now name the family that makes that cadence and scale agree.`;
  }

  function isCoherent(answer) {
    const p = progression(answer.modeId, answer.progressionId);
    if (!p) return false;
    const scalePcs = new Set(M.scaleOf(answer.tonic, answer.modeId).map((note) => note.pc));
    return M.buildProgression(answer.tonic, answer.modeId, answer.progressionId).chords
      .every((chord) => chord.notes.every((note) => scalePcs.has(note.pc)));
  }

  function explanation(answer) {
    const item = family(answer.modeId);
    const p = progression(answer.modeId, answer.progressionId);
    return {
      label: answerLabel(answer),
      category: item.category,
      signature: item.signature,
      scale: scaleNames(answer),
      progression: p ? p.label : "",
      chords: chordSymbols(answer),
      why: p ? p.why : ""
    };
  }

  function selfTest() {
    const examples = [
      { tonic: "D", modeId: "harmonicMinor", progressionId: "iio-V-i" },
      { tonic: "D", modeId: "minor", progressionId: "i-bVII-i" },
      { tonic: "D", modeId: "ousak", progressionId: "i-bVII-i" },
      { tonic: "D", modeId: "hijaz", progressionId: "I-iv-bVII-I" }
    ];
    const results = [
      { name: "Recall exposes a separate harmonic-minor family", pass: families().some((item) => item.id === "harmonicMinor") },
      { name: "D harmonic minor iiø–V7–i stays inside its declared collection", pass: isCoherent(examples[0]) && chordSymbols(examples[0]).join(" ") === "Em7♭5 A7 Dm" },
      { name: "D natural minor i–♭VII–i has a major ♭VII", pass: isCoherent(examples[1]) && chordSymbols(examples[1]).join(" ") === "Dm C Dm" },
      { name: "D Ousak strict Recall uses a minor ♭VII", pass: isCoherent(examples[2]) && chordSymbols(examples[2]).join(" ") === "Dm Cm Dm" },
      { name: "D Hijaz preserves its minor ♭VII", pass: isCoherent(examples[3]) && chordSymbols(examples[3]).join(" ") === "D Gm Cm D" }
    ];
    return { ok: results.every((result) => result.pass), results };
  }

  window.EarDrills = { FAMILY_ORDER, family, families, progressions, progression, answerLabel, scaleNames, chordSymbols, homeChord, choicePrompt, hint, isCoherent, explanation, selfTest };
})();
