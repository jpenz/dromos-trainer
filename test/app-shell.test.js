import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("the installable app shell links its offline assets", () => {
  const html = read("index.html");
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /serviceWorker\.register\("sw\.js"\)/);
  assert.match(html, /data-view="solo"/);
  assert.match(html, /data-view="styles"/);
  assert.match(html, /data-view="analyze"/);
  assert.match(html, /data-view="concepts"/);
  assert.match(html, /data-view="coach"/);
  assert.match(html, /data-view="video"/);
  assert.match(html, /data-solo-section="road"/);
  assert.match(html, /data-solo-section="phrase"/);
  assert.match(html, /data-solo-section="targets"/);
  assert.match(html, /id="soloMapControls"/);
  assert.match(html, /id="phrasePatternGrid"/);
  assert.match(html, /id="pathTargetFocus"/);
  assert.match(html, /id="targetRouteGrid"/);
  assert.match(read("js/app.js"), /id="soloTimingMatrix"/);
  assert.match(html, /data-solo-focus="triad"/);
  assert.match(html, /id="grooveStyle"/);
  assert.match(html, /id="tglBass"/);
  assert.match(html, /id="tglDrums"/);
  assert.match(html, /id="cycleCompingControls"/);
  assert.match(html, /data-style-section="foundation"/);
  assert.match(html, /js\/styles\.js/);
  assert.match(html, /js\/analysis\.js/);
  assert.match(html, /js\/studies\.js/);
  assert.match(html, /js\/musicxml\.js/);
  assert.match(html, /js\/resources\.js/);
  assert.match(html, /js\/video\.js/);
  assert.match(html, /js\/guitar-voicings\.js/);
  assert.match(html, /js\/ear-drills\.js/);
  assert.match(html, /js\/coach\.js/);
  assert.match(html, /id="coachApp"/);
  assert.match(html, /id="pageGuide"/);
  assert.match(html, /id="profileApp"/);
  assert.match(html, /id="tuningSel"/);
  assert.match(html, /id="changeGuide"/);
  assert.match(html, /id="journeyAnnouncement"/);
  assert.match(html, /id="earMap"/);
  assert.match(html, /id="earFamilyChoices"/);
  assert.match(html, /id="earMapHomeSel"/);
  assert.match(html, /id="btnEarMapCheck"/);
  assert.match(html, /id="btnEarCheck"/);
  assert.match(html, /id="videoStudy"/);
  assert.match(read("js/coach.js"), /coachFreeTierConsent/);
  assert.match(read("api/release.js"), /VERCEL_GIT_COMMIT_SHA/);
  assert.match(html, /js\/profiles\.js/);
  assert.match(html, /js\/harmony-journey\.js/);
  assert.match(html, /id="scoreFile"/);
  assert.match(html, /id="analysisInstrument"/);
  assert.match(read("js/tuning.js"), /Laouto \(mainland\)/);
  assert.match(read("js/app.js"), /seventh \|\| chordTone\(chord, "R"\)/,
    "triad lessons must use the root anchor instead of inventing a seventh");
  assert.match(read("js/app.js"), /renderSoloRoad/);
  assert.match(read("js/app.js"), /function renderPathTargetRoute/);
  assert.match(read("js/app.js"), /otherShapes: state\.solo\.section === "targets" \? allTriads/,
    "the Solo Changes map must expose all triad inversions behind the active shape");
  assert.match(read("js/practice.js"), /MELODIC_ROUTES/);
  assert.match(read("js/app.js"), /function renderSoloTimingMatrix/);
  assert.match(read("js/audio.js"), /function playGrooveBeat/);
  assert.match(read("js/audio.js"), /playChord\(chord\.notes, "strum", t, "guitar"\)/,
    "ear checks must use the same warm chord reference independent of the visual instrument");
  assert.doesNotMatch(read("js/app.js"), /filter\(\(i\) => cycle\[i\]\.fn !== "V"\)/,
    "the pivot drill must never create misleading ii-to-I jumps by deleting dominants");
  assert.match(read("css/styles.css"), /prefers-reduced-motion: reduce/);
  assert.match(read("js/audio.js"), /beatsPerBar/);
  assert.match(read("js/guitar-voicings.js"), /function fullVoicings/);
  assert.match(read("js/app.js"), /function newEarMap/);
  assert.match(read("js/app.js"), /function checkEarMap/);
  assert.match(read("js/ear-drills.js"), /harmonicMinor/);
  assert.match(read("js/app.js"), /function renderPageGuide/);
  assert.match(read("js/app.js"), /function stopPlay\(\) \{ AU\.stopAll\(\);/,
    "changing a drill must clear path timers and ringing voices as well as transport");
  assert.match(read("js/audio.js"), /function stopAll\(\)/);
  assert.match(read("sw.js"), /fetch\(event\.request\)[\s\S]*caches\.match\(event\.request\)/,
    "online sessions must prefer the deployed app and use cache only as an offline fallback");
  assert.match(read("js/fretboard.js"), /get N_FRETS\(\)/,
    "the road must use the selected instrument's fret range");
});

test("phone layout contains wide fretboards instead of widening the page", () => {
  const css = read("css/styles.css");
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.stage \{ position: relative; min-width: 0; \}/);
  assert.match(css, /\.fretboard-wrap \{[\s\S]*max-width: 100%;/);
});
