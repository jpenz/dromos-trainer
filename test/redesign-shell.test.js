import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("the shell exposes ten primary destinations including Melody and the standalone matrix", () => {
  const html = read("index.html");
  ["today", "hear", "melody", "harmony", "matrix", "solo", "repertoire", "learn", "coach", "progress"].forEach((nav) => {
    assert.match(html, new RegExp(`data-nav="${nav}"`), `missing primary destination ${nav}`);
  });
  // Full Cycle and ii–V–I folded into the Changes Gym as key-count settings;
  // "pivot" is the one remaining harmony mode.
  assert.match(html, /data-harmony-mode="pivot"/);
  assert.match(html, /data-view="chordmap"/, "the Harmony Matrix keeps a stable deep-link view id");
  const harmonyTabs = (html.match(/<nav id="harmonyTabs"[\s\S]*?<\/nav>/) || [""])[0];
  assert.doesNotMatch(harmonyTabs, /data-view="chordmap"/,
    "the matrix must be a primary destination instead of another Harmony sub-tab");
  assert.doesNotMatch(html, /data-harmony-mode="full"/, "Full Cycle must not survive as a separate tab");
  assert.doesNotMatch(html, /data-harmony-mode="iiVI"/, "ii–V–I must not survive as a separate tab");
  assert.match(html, /data-gym-keys="1"/, "the gym needs the 1-key on-ramp");
  assert.match(html, /data-gym-keys="6"/, "the gym needs the six-key wheel");
  assert.match(html, /id="tglGymSkeleton"/, "the whole-note skeleton drill must be a real option");
  assert.match(html, /id="btnTaximiBridge"/, "the taximi bridge must sit next to the gym");
  assert.match(html, /voice-leading gym, not folklore/, "the honesty line must ship");
  assert.match(html, /data-taximi-stage="low"/, "the taximi arc capstone must exist");
  assert.match(html, /data-solo-section="cell"[^>]*>5 Taximi/, "solo step 5 is the taximi capstone");
  assert.match(html, /id="settingsDrawer"/);
  assert.match(html, /id="panelToday"/);
  assert.match(html, /id="panelProgress"/);
  assert.match(html, /id="voiceSel"/, "the chord voice selector must be user-visible");
  assert.match(html, /id="tglPickup"/, "the V-of-ii pickup must be a real option");
  assert.match(html, /data-solo-focus="sweet"/, "the sweet 2→3 landing lens must exist");
  assert.match(html, /data-solo-focus="pedal"/, "the one-note (common tone) lens must exist");
  assert.match(html, /class="transport-bar"/);
  assert.match(html, /id="cycleRoadmap"/, "Changes Gym needs a readable six-chord look-ahead");
  assert.match(html, /id="panelMelody"/, "melody-to-harmony practice must be a standalone destination");
});

test("playback speaks the redesigned musical language", () => {
  const app = read("js/app.js");
  assert.match(app, /function schedulePickup/, "five-of-two pickup scheduling must exist");
  assert.match(app, /chordReferenceVoice/, "chord voice selection must drive playback");
  assert.match(app, /function commonTone/, "the one-note drill needs a common-tone finder");
  assert.match(app, /function playLeanDemo/, "the audible lean demo must exist");
  assert.match(app, /data-hear-lean/, "the lean demo must be reachable from the Solo recipe");
  assert.match(app, /Same chord, new job\./, "the pivot moment must explain the reinterpretation");
  assert.match(app, /function gymNotes/, "the skeleton drill must reduce chords to their 3rd");
  assert.match(app, /function taximiBridge/, "the taximi bridge must exist");
  assert.match(app, /function startDrone/, "an unmetered tonic drone must exist");
  assert.match(app, /function gymSequence/, "the gym must chain keys*3 chords from the current group");
  assert.match(app, /view: "chordmap", label: "Matrix · Reference"/,
    "the matrix needs its own visible training cue instead of inheriting Song Map instructions");
  assert.doesNotMatch(app, /referenceVoice: "guitar"/, "playback must not hardcode the chord voice");
  assert.match(read("js/audio.js"), /function playPianoNoteAt/, "a piano reference voice must exist");
  assert.match(read("js/practice.js"), /sweet-lean/, "the sweet 2→3 melodic route must exist");
  assert.match(app, /function renderCycleRoadmap/, "the pivot map must expose six upcoming chords from the shared journey");
  assert.match(app, /class="solo-progression-roadmap"/, "Solo must keep the complete progression and every selected target above the neck");
  assert.match(app, /function renderMelodyLab/, "the melody note must route into an interactive harmony comparison");
  assert.match(app, /navigator\.mediaDevices\.getUserMedia/, "sing-back must use an explicit browser microphone grant");
  assert.match(app, /function startPitchListening/, "melody practice must connect sung recall to the revealed degree");
  assert.match(app, /Never connect the microphone to destination/, "the microphone must not create a speaker feedback path");
  assert.match(read("js/pitch-lab.js"), /analyzeAgainstTarget/, "live vocal feedback must distinguish pitch class from tuning accuracy");
  assert.match(read("js/pitch-lab.js"), /never uploads or records/, "the microphone privacy boundary must be explicit in the implementation");
  assert.match(read("js/audio.js"), /playSequence\(notes, spacing, when, referenceVoice\)/,
    "single-note ear prompts must use the same pitch-stable reference voice as chord prompts");
});

test("the held tonic stays audible and visible, not implied", () => {
  const app = read("js/app.js");
  const holdReturns = app.match(/hold: true, notes:/g) || [];
  assert.ok(holdReturns.length >= 2, "held bars must re-comp the chord in cycle AND progression playback");
  assert.match(app, /pchip-held/, "the prog strip must render the held tonic bar as its own chip");
  assert.match(app, /data-held-for/, "held chips must be addressable for the bar-accurate cursor");
  assert.match(app, /function markHeldBar/, "playback must move the highlight onto the held bar");
  assert.doesNotMatch(app, /c\.fn \|\| c\.scaleDegree/, "numeric scaleDegree must never shadow the roman function");
  const css = read("css/styles.css");
  assert.match(css, /\.pchip\.pchip-held/, "held chips need their own visual treatment");
  assert.match(css, /held-sounding/, "the sounding held bar needs an active state");
});

test("the design system defines the redesigned tokens", () => {
  const css = read("css/styles.css");
  assert.match(css, /--terracotta: #D4763B/);
  assert.match(css, /--turquoise: #52A89D/);
  assert.match(css, /--aegean: #5B87B5/);
  assert.match(css, /--font-display: "Fraunces"/);
  assert.match(css, /env\(safe-area-inset-bottom\)/, "safe areas must be respected");
  assert.match(css, /prefers-reduced-motion: reduce/);
});
