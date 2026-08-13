import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("the v14 shell exposes the eight primary destinations and shared chrome", () => {
  const html = read("index.html");
  ["today", "hear", "harmony", "solo", "repertoire", "learn", "coach", "progress"].forEach((nav) => {
    assert.match(html, new RegExp(`data-nav="${nav}"`), `missing primary destination ${nav}`);
  });
  assert.match(html, /data-harmony-mode="full"/);
  assert.match(html, /data-harmony-mode="iiVI"/);
  assert.match(html, /data-harmony-mode="pivot"/);
  assert.match(html, /id="settingsDrawer"/);
  assert.match(html, /id="panelToday"/);
  assert.match(html, /id="panelProgress"/);
  assert.match(html, /id="voiceSel"/, "the chord voice selector must be user-visible");
  assert.match(html, /id="tglPickup"/, "the V-of-ii pickup must be a real option");
  assert.match(html, /data-solo-focus="sweet"/, "the sweet 2→3 landing lens must exist");
  assert.match(html, /data-solo-focus="pedal"/, "the one-note (common tone) lens must exist");
  assert.match(html, /class="transport-bar"/);
});

test("playback speaks the redesigned musical language", () => {
  const app = read("js/app.js");
  assert.match(app, /function schedulePickup/, "five-of-two pickup scheduling must exist");
  assert.match(app, /chordReferenceVoice/, "chord voice selection must drive playback");
  assert.match(app, /function commonTone/, "the one-note drill needs a common-tone finder");
  assert.match(app, /function playLeanDemo/, "the audible lean demo must exist");
  assert.match(app, /data-hear-lean/, "the lean demo must be reachable from the Solo recipe");
  assert.match(app, /Pivot wheel: play ii–V–I–I/, "the pivot drill must explain the reinterpretation");
  assert.doesNotMatch(app, /referenceVoice: "guitar"/, "playback must not hardcode the chord voice");
  assert.match(read("js/audio.js"), /function playPianoNoteAt/, "a piano reference voice must exist");
  assert.match(read("js/practice.js"), /sweet-lean/, "the sweet 2→3 melodic route must exist");
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
