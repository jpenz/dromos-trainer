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
  // The held bar is now a TAIL on the sounding chord's own chip (blueprint
  // 2.3): still visible, still separately addressable, but it never reads as
  // an extra chord and never lights a second .active for one sounding bar.
  assert.match(app, /pchip-tail/, "the prog strip must render the held tonic bar as a visible tail");
  assert.match(app, /data-held-for/, "held bars must be addressable for the bar-accurate cursor");
  assert.match(app, /data-hold-step="\$\{i\}"/,
    "the hold tail carries its own step attribute, not the main chip's data-step");
  const stripMarkup = (app.match(/\$\("progStrip"\)\.innerHTML[\s\S]*?pchip-arrow/) || [""])[0];
  assert.doesNotMatch(stripMarkup, /pchip-tail[^`]*\bactive\b/,
    "the hold tail must never take .active alongside its own chord chip");
  assert.match(app, /function markHeldBar/, "playback must move the highlight onto the held bar");
  assert.doesNotMatch(app, /c\.fn \|\| c\.scaleDegree/, "numeric scaleDegree must never shadow the roman function");
  const css = read("css/styles.css");
  assert.match(css, /\.pchip-tail \{/, "the held tail needs its own visual treatment");
  assert.match(css, /held-sounding/, "the sounding held bar needs an active state");
});

test("Song Map leads with the strip, switches modes from one control, and claims no unheard motion", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  // LEAD: the strip IS the song map, so it paints before the Now/Next guide.
  const band = (html.match(/<section id="journeyBand"[\s\S]*?<\/section>\s*<!--/) || [""])[0];
  assert.ok(band.indexOf('id="progStrip"') > -1 && band.indexOf('id="progStrip"') < band.indexOf('id="changeGuide"'),
    "the song map strip leads the journey band, above the fretboard");
  // ONE mode switcher: the scale strip's five-mode comparator is gone and its
  // signature tones ride on the seg that actually writes state.modeId.
  assert.doesNotMatch(app, /data-jump=/, "a second mode switcher must not return to the scale strip");
  assert.match(app, /function modeSignatureTones/, "the surviving mode control carries the signature tones");
  assert.match(app, /#panelProg \[data-modeid\]/, "the mode seg is rendered from the mode data it compares");
  // One purpose sentence: the standing workbench paragraph is gone and the
  // dromos note is contextual to the selection.
  assert.doesNotMatch(html, /class="workbench-note"/, "standing explainer paragraphs are banned on this page");
  assert.match(html, /id="progModeNote"/, "the selected dromos gets one contextual line");
  // Changing the key respells every chord name on the page, cards included.
  assert.match(app, /if \(state\.view === "prog"\) \{ syncProgControls\(\); renderProg\(\); \}/,
    "a key change must rebuild the map cards, not only the strip");
  // FIRST PAINT: "moved"/"held" is a claim about a change the player heard.
  assert.match(app, /progMotionKey === progMapKey\(\)/,
    "moved/held colouring is gated on real movement inside this map");
  assert.match(app, /function markProgMoved/, "movement is recorded where the step actually changes");
  // Small tiers stop chroming a handful of cards with headings.
  assert.match(app, /const flat = count <= 2;/, "tier and job headings collapse for one- or two-map tiers");
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
