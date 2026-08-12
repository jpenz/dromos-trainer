import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (file) => readFileSync(path.join(root, file), "utf8");

function loadCore() {
  const context = vm.createContext({ console, window: {} });
  ["js/tuning.js", "js/theory.js", "js/modes.js", "js/styles.js", "js/analysis.js", "js/practice.js", "js/triads.js", "js/fretboard.js"]
    .forEach((file) => vm.runInContext(source(file), context, { filename: file }));
  return context.window;
}

test("music invariants pass outside the browser", () => {
  const app = loadCore();
  const suites = [app.Theory.selfTest(), app.Modes.selfTest(), app.StyleLibrary.selfTest(), app.AnalysisEngine.selfTest(), app.Practice.selfTest(), app.Triads.selfTest()];
  const failures = suites.flatMap((suite) => suite.results.filter((result) => !result.pass));
  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
});

test("Greek style pulses are complete and never prescribe a dromos", () => {
  const { StyleLibrary } = loadCore();
  const zeibekiko = StyleLibrary.byId("zeibekiko");
  assert.deepEqual(Array.from(zeibekiko.groups), [2, 2, 2, 3]);
  assert.equal(StyleLibrary.beatMap(zeibekiko).length, 9);
  StyleLibrary.STYLES.forEach((style) => {
    assert.match(style.route, /dromos|Song Map/i, style.title + " must separate pulse from harmonic colour");
  });
});

test("analyzer explains modal colour while preserving harmonic uncertainty", () => {
  const { AnalysisEngine } = loadCore();
  const analysis = AnalysisEngine.analyzeProgression("Am D G", { tonic: "A", modeId: "minor" });
  const majorFour = analysis.records[1];
  assert.equal(majorFour.label, "IV");
  assert.ok(majorFour.notes.some((note) => note.type === "modal-mixture"));
  assert.ok(majorFour.notes.some((note) => note.type === "secondary"), "D → G is also a possible temporary dominant pull");
  const line = AnalysisEngine.analyzeLine("Dm: A C D | A7: C♯ E G", { tonic: "D", modeId: "minor" });
  assert.equal(line.segments[1].landing.role, "♭7");
  assert.equal(AnalysisEngine.parseProgression("C-7 F7 B♭M7").length, 3,
    "lead-sheet dash notation for minor chords must remain a single chord token");
  assert.equal(AnalysisEngine.parseChord("B♭M7").quality, "maj7");
});

test("the pentatonic frame preserves each dromos identity", () => {
  const { Modes } = loadCore();
  assert.deepEqual(
    Array.from(Modes.pentatonicOf("D", "hijaz"), (note) => note.name),
    ["D", "F♯", "G", "A", "C"],
    "Hijaz must use dominant—not minor—pentatonic"
  );
  assert.deepEqual(
    Array.from(Modes.pentatonicOf("D", "ousak"), (note) => note.name),
    ["D", "F", "G", "A", "C"]
  );
});

test("mainland laouto supports grips, triads, and scale paths", () => {
  const { Tuning, Modes, Fretboard, Practice, Triads } = loadCore();
  Tuning.set("laouto4");
  assert.equal(Tuning.current().sub, "A D G C — the 4-course mainland laouto tuning");

  const { chords } = Modes.buildProgression("D", "hijaz", "I-iv-bVII-I");
  chords.forEach((chord) => assert.ok(Fretboard.findGrip(chord.notes), chord.symbol + " needs a playable grip"));
  assert.ok(Triads.pathThrough(chords).every(Boolean), "every progression chord needs a triad map");
  assert.ok(Practice.buildPath("D", "hijaz", { layout: "3nps", position: 5 }), "a scale path must fit the neck");
});
