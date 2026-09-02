import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("the shell exposes eleven primary destinations including Melody, Picking, and the standalone matrix", () => {
  const html = read("index.html");
  ["today", "hear", "melody", "harmony", "matrix", "solo", "picking", "repertoire", "learn", "coach", "progress"].forEach((nav) => {
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
  // The honesty line moved from a standing paragraph into the folded Setup
  // note the app writes at runtime - assert it ships in the source of truth.
  assert.match(read("js/app.js"), /voice-leading gym, not folklore/, "the honesty line must ship");
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
  assert.match(css, /--terracotta: #F19A55/);
  assert.match(css, /--turquoise: #43C7C2/);
  assert.match(css, /--aegean: #65A7E8/);
  assert.match(css, /--font-display: "Fraunces"/);
  assert.match(css, /env\(safe-area-inset-bottom\)/, "safe areas must be respected");
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("the ear page leads with Start and never sounds before the player asks", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  const panel = html.slice(html.indexOf('<div id="panelEar"'), html.indexOf("<!-- Video study -->"));
  assert.ok(panel.length > 200, "the ear panel must still exist");

  // LEAD: Start and the guess grid come first; setup, audio status and score
  // all sit below the answer.
  assert.ok(panel.indexOf('id="btnEarNew"') < panel.indexOf('class="guess-grid"'),
    "Start must precede the guess grid");
  assert.ok(panel.indexOf('class="guess-grid"') < panel.indexOf('id="earSetup"'),
    "the guess grid must precede the folded Setup");
  assert.ok(panel.indexOf('id="earSetup"') < panel.indexOf('id="earScore"'),
    "the score is the last thing on the page");
  assert.doesNotMatch(panel, /ear-start-steps/, "the quick-start strip duplicated the guide steps");
  assert.doesNotMatch(panel, /ear-voice-note/, "the voice note restated the audio status line");
  assert.doesNotMatch(panel, /class="ear-hint"/, "standing ear-hint paragraphs merge into the feedback idle text");

  // ONE home control with two states instead of a per-drill row each.
  assert.match(panel, /id="earHomeSel"/);
  assert.doesNotMatch(panel, /earTonicSel|earMapHomeSel/, "the two home rows must be one control");
  assert.match(app, /function renderEarHome/);

  // The score summary answers the active drill; both totals stay one tap away.
  assert.match(panel, /<details id="earScore"/);
  assert.match(panel, /id="earScoreLine"/);
  assert.match(app, /Colour streak/);
  assert.match(app, /Map streak <b>/);

  // Opening the map tab must arm the drill silently.
  const setDrill = (app.match(/function setEarDrill\(drill\)[\s\S]*?\n {2}\}/) || [""])[0];
  assert.match(setDrill, /prepareEarMap\(false\)/, "switching tabs must prepare the map without playing it");
  assert.doesNotMatch(setDrill, /newEarMap\(\)|playEarMapPrompt\(\)/,
    "switching tabs must never start audio the player did not request");

  // Start buttons keep their ▶ glyph when they relabel.
  assert.match(app, /"▶ Next question"/);
  assert.match(app, /play \? "▶ Next map" : "▶ Start map"/);

  // Blind training reads the value the home select actually writes.
  assert.doesNotMatch(app, /home === "blind"/, 'the map home preset is "random", never "blind"');
  assert.match(app, /home === "random" \? "Home hidden/);

  // One vocabulary: the button says Check + reveal, so the copy must too.
  assert.doesNotMatch(app, /Check answer/);
  assert.doesNotMatch(app, /Choose the map you hear first/);
});
