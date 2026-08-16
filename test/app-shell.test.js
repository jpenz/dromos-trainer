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
  assert.match(html, /data-view="chordmap"/);
  assert.match(html, /data-nav="matrix"/);
  assert.match(html, /id="panelChordMap"/);
  assert.match(html, /id="chordMapRoad"/);
  assert.match(html, /id="chordMapDegrees"/);
  assert.match(html, /id="chordMapCompare"/);
  assert.match(html, /data-chord-map-depth="triad"/);
  assert.match(html, /data-chord-map-depth="seventh"/);
  assert.match(html, /id="matrixProgressions"/);
  assert.match(html, /id="matrixRelationships"/);
  assert.match(html, /Returns directly to home/,
    "the working-role legend must describe a direct return without overclaiming a formal cadence");
  assert.match(html, /js\/chord-map\.js\?v=17/);
  assert.match(html, /data-solo-section="road"/);
  assert.match(html, /data-solo-section="phrase"/);
  assert.match(html, /data-solo-section="targets"/);
  assert.ok(html.indexOf('data-solo-section="targets"') < html.indexOf('data-solo-section="road"'),
    "Follow Changes must be the first Solo activity");
  assert.match(html, /data-solo-section="targets" class="active"/,
    "Solo opens on the harmony journey instead of burying it behind another activity");
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
  assert.match(read("js/audio.js"), /scheduleProgressionPrompt\(chords, bpm, voice\)/,
    "ear checks must use one explicit reference voice independent of the visual instrument");
  assert.match(read("js/audio.js"), /STUDIO_PIANO_SAMPLES/,
    "ear checks need the sampled studio-piano reference instead of a synthesized instrument default");
  assert.match(html, /id="btnEarStop"/);
  assert.match(html, /id="earReveal"/);
  assert.doesNotMatch(read("js/app.js"), /filter\(\(i\) => cycle\[i\]\.fn !== "V"\)/,
    "the pivot drill must never create misleading ii-to-I jumps by deleting dominants");
  assert.match(read("css/styles.css"), /prefers-reduced-motion: reduce/);
  assert.match(read("js/audio.js"), /beatsPerBar/);
  assert.match(read("js/guitar-voicings.js"), /function fullVoicings/);
  assert.match(read("js/app.js"), /function newEarMap/);
  assert.match(read("js/app.js"), /function checkEarMap/);
  assert.match(read("js/ear-drills.js"), /harmonicMinor/);
  assert.match(read("js/app.js"), /function renderPageGuide/);
  assert.match(read("js/app.js"), /function renderChordMap/);
  assert.match(read("js/app.js"), /targetNowPcs: \[target\.pc\]/,
    "Chord Map must render the current R/3/5 target from the same derived chord used by audio");
  assert.match(read("js/app.js"), /AU\.playSequence\(chord\.notes, 0\.38\)/,
    "the visible R→3rd→5th sequence must be audible");
  assert.match(read("js/app.js"), /function stopPlay\(\) \{[^}]*AU\.stopAll\(\);/,
    "changing a drill must clear path timers and ringing voices as well as transport");
  assert.match(read("js/audio.js"), /function stopAll\(\)/);
  assert.match(read("sw.js"), /fetch\(event\.request\)[\s\S]*caches\.match\(event\.request\)/,
    "online sessions must prefer the deployed app and use cache only as an offline fallback");
  assert.match(read("js/fretboard.js"), /get N_FRETS\(\)/,
    "the road must use the selected instrument's fret range");
  assert.match(read("sw.js"), /js\/chord-map\.js\?v=17/, "Harmony Matrix must work in the offline shell");
  assert.match(read("api/release.js"), /appVersion: "20"/,
    "the public deployment identity must match the current offline shell release");
  assert.match(html, /css\/styles\.css\?v=20/);
  assert.match(html, /js\/fretboard\.js\?v=19/);
  assert.match(html, /js\/app\.js\?v=20/);
  // Drive this from the source, not a hand-kept version number: a literal
  // assertion here breaks on every legitimate cache bump and, worse, passes
  // when a newly added script never reaches the offline shell.
  const sw = read("sw.js");
  assert.match(sw, /const CACHE = "dromos-trainer-v\d+";/, "the cache must carry an explicit version");
  const shellScripts = [...html.matchAll(/<script src="(js\/[\w.-]+)\?v=\d+"><\/script>/g)].map((m) => m[1]);
  assert.ok(shellScripts.length > 15, "expected the shell to load the app's script set");
  shellScripts.forEach((src) => {
    assert.ok(sw.includes(`./${src}?v=`), `${src} is loaded by index.html but missing from the service-worker shell`);
  });
  assert.match(read("css/styles.css"), /\.harmony-matrix-scroll \{[^}]*overflow-x: auto/,
    "the five-dromos matrix must scroll internally instead of widening the page");
});

test("Solo Follow Changes is a full-neck current-to-next harmony journey", () => {
  const app = read("js/app.js");
  const fretboard = read("js/fretboard.js");
  const css = read("css/styles.css");
  assert.match(app, /solo: \{ section: "targets", focus: "third"/,
    "the first Solo experience must target each chord's actual 3rd");
  assert.match(app, /class="solo-neck-hud"/);
  assert.match(app, /Play now · \$\{escapeHtml\(cur\.degreeLabel\)\}/);
  assert.match(app, /Prepare next · \$\{escapeHtml\(next\.degreeLabel\)\}/);
  assert.match(app, /triadSpelling\(cur\)/);
  assert.match(app, /triadSpelling\(next\)/);
  assert.match(app, /largeNeck: true/);
  assert.match(app, /return note\.roleLabel \|\| note\.degree \|\| phase/,
    "target dots must keep 3/flat-3 and use rings—not replacement text—for timing");
  assert.match(fretboard, /focusFold = !!opts\.largeNeck/);
  assert.match(fretboard, /data-neck-emphasis/);
  assert.match(fretboard, /const passiveOverlay = kind === "scale" \|\| kind === "pentatonic" \|\| kind === "road"/,
    "the scale layer must not repaint a scale degree over a chord-role target");
  assert.match(app, /nextGrip: layers\.next \? nextGrip : null/,
    "the coming chord must be a complete playable dashed triad, not only a text label");
  assert.match(app, /targetScope: "positions"/);
  assert.match(app, /targetNowPlacements: currentTargetPlacements/);
  assert.match(app, /targetNextPlacements: layers\.next \? nextTargetPlacements : \[\]/);
  assert.match(fretboard, /nowPositionSet\.has\(key\)/);
  assert.match(fretboard, /nextPositionSet\.has\(key\)/,
    "Now/Next rings must be limited to the selected playable addresses");
  assert.match(app, /state\.solo\.layers\.scale = key === "scale"/);
  assert.match(app, /state\.solo\.layers\.pentatonic = key === "pentatonic"/,
    "full scale and pentatonic must be clear alternative backgrounds");
  assert.match(css, /body\[data-view="solo"\]\[data-solo-section="targets"\] main \{ width: min\(1360px, 100%\)/);
  assert.match(css, /\.solo-neck-hud\.lean-phase/,
    "the next target must receive a visible pre-arrival state");
  assert.match(css, /svg\.lean-phase \.fb-dot\.next-shape/,
    "the complete coming triad must brighten before the chord boundary");
});

test("the full fretboard never widens the page and folds on phones", () => {
  const css = read("css/styles.css");
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.stage \{ position: relative; min-width: 0; \}/);
  assert.match(css, /\.fretboard-wrap \{[\s\S]*max-width: 100%;/);
  assert.match(css, /\.fretboard-wrap \{[\s\S]*overflow: hidden/);
  assert.doesNotMatch(css, /#fretboard[^{}]*\{[^}]*min-width:/);
  assert.match(read("js/fretboard.js"), /matchMedia\("\(max-width: 620px\)"\)/);
  assert.match(read("js/fretboard.js"), /data-neck-layout/);
});

test("Solo Toolkit choices keep keyboard focus and promise only implemented behavior", () => {
  const app = read("js/app.js");
  const toolkit = read("js/toolkit.js");
  assert.match(app, /role="tab" aria-selected="\$\{p\.id === tk\.pillar\}" aria-controls="soloToolkitPanel" tabindex=/,
    "pillar choices need complete tab semantics and roving focus");
  assert.match(app, /role="toolbar" aria-label=/,
    "tool choices are a toolbar, not a second incomplete tab interface");
  assert.match(app, /requestAnimationFrame\(\(\) => focusToolkitControl/,
    "a keyboard selection must restore focus after render replaces its source button");
  assert.match(app, /data-tk-formula-slot/);
  assert.match(app, /TK\.swapFormulaCard/,
    "Formula Bank's promised card swap must be an actual interaction");
  assert.doesNotMatch(toolkit, /map ghosts the shape/,
    "Motif Ladder cannot promise a fretboard ghost that is not rendered");
  assert.doesNotMatch(toolkit, /second voice is under your eyes/,
    "Thirds Shadow must describe its written rail rather than imply a neck overlay");
});

test("Comp starts from a Greek pulse skeleton and transport actually enters the page", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  assert.match(html, /id="compSkeleton"/);
  assert.match(app, /S\.compPlan\(state\.groove\.styleId, state\.triads\.rhythmLevel\)/);
  assert.match(app, /data-comp-level/);
  assert.match(app, /state\.view === "triads"[^]*pb = \{ kind: "triads"/,
    "Play on Comp must start a real progression transport");
  assert.match(app, /state\.view === "triads"[^]*updateCompPulse\(beatInBar\)/,
    "transport must move a visible cursor through the selected pulse");
});
