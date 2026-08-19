import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "js/pitch-lab.js"), "utf8");
const window = {};
vm.runInContext(source, vm.createContext({ window, Float32Array, Math, Number }), { filename: "js/pitch-lab.js" });
const PitchLab = window.PitchLab;

function sine(frequency, length = 2048, sampleRate = 48000) {
  const input = new Float32Array(length);
  for (let index = 0; index < length; index++) input[index] = 0.55 * Math.sin(2 * Math.PI * frequency * index / sampleRate);
  return input;
}

test("the live detector resolves sung-range fundamentals without a network model", () => {
  const detector = PitchLab.createDetector(2048, { minFrequency: 70 });
  [110, 220, 440, 659.255].forEach((expected) => {
    const found = detector.detect(sine(expected), 48000);
    const cents = 1200 * Math.log2(found.frequency / expected);
    assert.ok(found.clarity > 0.8, `${expected} Hz should be voiced clearly`);
    assert.ok(Math.abs(cents) < 5, `${expected} Hz drifted by ${cents.toFixed(2)} cents`);
  });
});

test("sing-back accepts any octave but rejects a steady wrong degree", () => {
  const lowA = PitchLab.analyzeAgainstTarget(220, 69, 0.98);
  const wrongB = PitchLab.analyzeAgainstTarget(PitchLab.midiToFrequency(71), 69, 0.98);
  assert.equal(lowA.status, "locked");
  assert.equal(lowA.note.name, "A");
  assert.equal(wrongB.status, "different-note");
  assert.equal(wrongB.correctPitchClass, false);
});

test("silence is not scored as an attempt", () => {
  const detector = PitchLab.createDetector(2048);
  const result = detector.detect(new Float32Array(2048), 48000);
  assert.equal(result.frequency, 0);
  assert.equal(result.reason, "quiet");
});
