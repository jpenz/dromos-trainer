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
  assert.match(html, /data-view="examples"/);
  assert.match(html, /data-view="chordmap"/);
  assert.match(html, /data-view="melody"/);
  assert.match(html, /data-nav="melody"/);
  assert.match(html, /data-nav="picking"/);
  assert.match(html, /id="pickingSetup"/);
  assert.match(html, /id="panelPicking"/);
  assert.match(html, /id="pickingExerciseSel"/);
  assert.match(html, /id="pickingRunMap"/);
  assert.match(html, /data-picking-run="loop"/);
  assert.match(html, /data-picking-run="evolve"/);
  assert.match(html, /id="tglPickingMetronome"/);
  assert.match(html, /id="tglPickingCountIn"/);
  assert.match(html, /id="pickingBpm"[^>]*min="30"[^>]*max="220"/);
  assert.match(html, /id="pickingBpmNum"[^>]*min="30"[^>]*max="220"/,
    "exact BPM entry accompanies the slider");
  assert.match(html, /data-picking-subdivision="1"/,
    "quarters are the floor of the subdivision control (measured-tremolo ladder needs them)");
  assert.match(html, /data-picking-subdivision="8" class="hidden"/,
    "32nds ship gated - they unlock only inside the tremolo family");
  const appSrc = read("js/app.js");
  assert.match(appSrc, /if \(state\.picking\.subdivision === 8 && !PICKING_TREMOLO_FAMILY\[exercise\.id\]\)/,
    "leaving the tremolo family clamps 32nds back down");
  assert.match(appSrc, /Printed anchors: Trinity 60\/72\/88/,
    "tempo levels declare which numbers are printed anchors vs app defaults");
  assert.match(html, /js\/bouzouki-knowledge\.js\?v=\d+/);
  assert.match(html, /js\/picking-lab\.js\?v=\d+/);
  assert.match(html, /id="pickingMasterySpine"/);
  assert.match(read("js/picking-lab.js"), /Horizontal ↔ tiered A\/B/);
  assert.match(read("js/picking-lab.js"), /Alternate ↔ glide triplets/);
  assert.match(read("js/picking-lab.js"), /D–D–U.*U–D–D/,
    "Pennanen's documented glide families need an explicit, source-bounded comparison");
  assert.match(html, /id="pickingTonicSel"[^>]*aria-describedby="pickingKeyHelp"/,
    "Picking must expose Key as an explained first-screen control");
  assert.match(read("js/app.js"), /glyph: "↓"[^\n]*label: "Ta · downstroke"/);
  assert.match(read("js/app.js"), /glyph: "↑"[^\n]*label: "Ka · upstroke"/);
  assert.match(read("js/picking-lab.js"), /Every note picked/);
  assert.match(read("js/picking-lab.js"), /not a .*transcription|not copied|not his prescribed exercise/i);
  assert.match(html, /id="panelMelody"/);
  // The scale rail and the answer buttons showed the same seven degrees; they
  // are one row now, so the degree surface is the choices grid itself.
  assert.match(html, /id="melodyChoices"[^>]*aria-label="Scale-degree answer choices"/);
  assert.doesNotMatch(html, /id="melodyScaleRail"/, "one row of seven degrees, not two");
  assert.match(read("js/app.js"), /data-melody-degree="\$\{index\}"[\s\S]*?tetrachord[\s\S]*?escapeHtml\(note\.degree\)[\s\S]*?m\.revealed \? escapeHtml\(note\.name\)/,
    "the merged degree button keeps the rail's tetrachord, degree, and revealed spelling");
  assert.match(html, /id="melodyCandidates"/);
  assert.match(html, /id="melodyNext"/);
  assert.match(html, /id="melodyMoves"/);
  assert.match(html, /js\/melody-harmony\.js\?v=\d+/);
  assert.match(html, /id="btnSingStart"/);
  assert.match(html, /id="singInputSel"/);
  assert.match(html, /id="singGauge"/);
  assert.match(html, /js\/pitch-lab\.js\?v=\d+/);
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
  assert.match(html, /js\/chord-map\.js\?v=\d+/);
  assert.match(html, /js\/chord-path\.js\?v=\d+/);
  assert.match(html, /js\/page-guides\.js\?v=\d+/);
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
  // The two per-drill home rows became ONE control with two states (blueprint
  // 2.5), so the gate now asserts the single training-home selector.
  assert.match(html, /id="earHomeSel"/);
  assert.match(html, /id="btnEarMapCheck"/);
  assert.match(html, /id="btnEarCheck"/);
  assert.match(html, /id="videoStudy"/);
  assert.match(html, /id="panelExamples"/);
  assert.match(html, /id="tacticalExamples"/);
  assert.match(html, /js\/tactical-examples\.js\?v=\d+/);
  assert.match(read("js/app.js"), /function renderTacticalExamples/);
  assert.match(read("js/app.js"), /function tacticalInstrumentRoute/);
  assert.match(read("js/app.js"), /Math\.min\(15, tuning\.frets\)/,
    "tactical examples need a bounded route on the selected instrument");
  assert.match(read("js/app.js"), /data-open-tactical-example/);
  assert.match(read("js/tactical-examples.js"), /not a transcription/,
    "generated tactical drills must not masquerade as a named player's lick");
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
  assert.match(read("js/audio.js"), /function ensureRunning\(\)/,
    "iPad playback needs an awaitable AudioContext unlock path");
  assert.match(read("js/audio.js"), /document\.addEventListener\("pointerdown", prime/,
    "audio must start inside the earliest user gesture");
  assert.match(html, /id="btnSoundCheck"/);
  assert.match(html, /id="audioReadyStatus"/);
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
  assert.match(read("js/app.js"), /Answer first/);
  assert.match(read("js/page-guides.js"), /every guide has the full answer-first pyramid/);
  assert.match(read("js/app.js"), /function renderChordMap/);
  assert.match(read("js/app.js"), /function renderChordPathInline/,
    "clicking a Matrix chord must open the four-question chord path in its selected row");
  assert.match(read("js/app.js"), /data-chord-path-lens/);
  assert.match(read("js/app.js"), /data-chord-path-shape/);
  assert.match(read("js/app.js"), /data-chord-path-approach/);
  assert.match(read("js/app.js"), /data-chord-path-successor/);
  assert.match(read("js/chord-path.js"), /Modes\.PROGRESSIONS|M\.PROGRESSIONS/,
    "successor suggestions must come from the verified progression bank");
  assert.match(read("js/app.js"), /targetNowPcs: \[target\.pc\]/,
    "Chord Map must render the current R/3/5 target from the same derived chord used by audio");
  assert.match(read("js/app.js"), /AU\.playSequence\(chord\.notes, 0\.38\)/,
    "the visible R→3rd→5th sequence must be audible");
  assert.match(read("js/app.js"), /function stopPlay\(\) \{[\s\S]{0,700}AU\.stopAll\(\);/,
    "changing a drill must clear path timers and ringing voices as well as transport");
  assert.match(read("js/audio.js"), /function stopAll\(\)/);
  // Assert the invariant, not proximity in the source: the count-in clicks
  // are gated on o.metronome and scheduled beat-by-beat on the audio clock.
  assert.match(read("js/audio.js"), /if \(o\.metronome\) \{\s*\n\s*for \(let beat = 0; beat < countInBeats; beat\+\+\) click\(/,
    "picking runs need a cancel-safe count-in and metronome on the shared audio clock");
  assert.match(read("js/app.js"), /PK\.buildPracticePlan/,
    "Picking Loop and Evolve must share the tested pure run planner");
  assert.match(read("sw.js"), /fetch\(event\.request\)[\s\S]*caches\.match\(event\.request\)/,
    "online sessions must prefer the deployed app and use cache only as an offline fallback");
  assert.match(read("js/fretboard.js"), /get N_FRETS\(\)/,
    "the road must use the selected instrument's fret range");
  // Version pins used to be written out by hand here, so every legitimate
  // cache bump broke the suite while the real defect — an asset whose version
  // in index.html and sw.js drift apart, leaving users on a stale file —
  // slipped through. Check the invariant instead of the numbers.
  const swSrc = read("sw.js");
  const htmlVersions = [...html.matchAll(/((?:js|css)\/[\w.-]+\.(?:js|css))\?v=(\d+)/g)];
  assert.ok(htmlVersions.length > 20, "expected the shell to version its assets");
  htmlVersions.forEach(([, file, version]) => {
    const inSw = new RegExp(`\\./${file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?v=(\\d+)`).exec(swSrc);
    if (!inSw) return; // not every asset is part of the offline shell
    assert.equal(inSw[1], version,
      `${file} is v${version} in index.html but v${inSw[1]} in sw.js — offline users would get a stale file`);
  });
  assert.match(read("sw.js"), /js\/chord-map\.js\?v=\d+/, "Harmony Matrix must work in the offline shell");
  assert.match(read("sw.js"), /js\/chord-path\.js\?v=\d+/, "Chord Path must work in the offline shell");
  // Derived, not pinned: a literal here rotted once (test said 34, release
  // said 34, cache said 40 — stale together). The release identity must
  // equal whatever version the service worker actually ships.
  const cacheVersion = read("sw.js").match(/const CACHE = "dromos-trainer-v(\d+)";/)[1];
  assert.match(read("api/release.js"), new RegExp(`appVersion: "${cacheVersion}"`),
    "api/release appVersion must match the sw.js cache version");
  assert.match(html, /css\/styles\.css\?v=\d+/);
  assert.match(html, /js\/fretboard\.js\?v=\d+/);
  assert.match(html, /js\/audio\.js\?v=\d+/);
  assert.match(html, /js\/app\.js\?v=\d+/);
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
  assert.match(app, /neckZone: "both", allTargets: true/,
    "the default Solo lesson must expose the target in both halves of the neck");
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
  // Intent, not literal source: the coming chord must render as a real
  // playable grip gated on the layer toggle — never as text alone. Pinning
  // the exact expression breaks on every legitimate change to the gate.
  assert.match(app, /nextGrip:[^\n]*layers\.next[^\n]*nextGrip[^\n]*null/,
    "the coming chord must be a complete playable dashed triad gated on layers.next, not only a text label");
  assert.match(app, /targetNotes: state\.solo\.section === "targets" && state\.solo\.allTargets \? targetNotes : null/);
  assert.match(app, /targetScope: state\.solo\.allTargets \? "all" : "positions"/);
  assert.match(app, /targetNowPlacements: state\.solo\.allTargets \? null : currentTargetPlacements/);
  assert.match(app, /targetNextPlacements: state\.solo\.allTargets \? null : layers\.next \? nextTargetPlacements : \[\]/);
  assert.match(fretboard, /nowPositionSet\.has\(key\)/);
  assert.match(fretboard, /nextPositionSet\.has\(key\)/,
    "shape-only mode must still limit rings to the selected playable addresses");
  assert.match(app, /data-solo-neck-zone="\$\{id\}"/);
  assert.match(app, /function applySoloNeckFocus/);
  assert.match(fretboard, /for \(let row = 0; row < ROWS; row\+\+\)/,
    "the nearest-target tracer must repeat in both rendered neck rows");
  // Layers are INDEPENDENT by request: a player must be able to strip the
  // neck to scales only or triads only. The old radio behaviour (picking one
  // background cleared the other) is deliberately gone, so assert the new
  // contract instead — a free toggle plus explicit isolation presets.
  assert.match(app, /state\.solo\.layers\[key\] = !state\.solo\.layers\[key\]/,
    "every solo layer must toggle independently");
  assert.doesNotMatch(app, /state\.solo\.layers\.scale = key === "scale"/,
    "the mutually-exclusive background radio must not come back");
  ["scales", "triads", "all"].forEach((preset) => {
    assert.ok(app.includes(`data-solo-isolate="${preset}"`), `missing the "${preset}" isolation preset`);
  });
  assert.match(app, /data-solo-isolate/, "isolation presets must be wired");
  assert.match(css, /body\[data-view="solo"\]\[data-solo-section="targets"\] main \{ width: min\(1360px, 100%\)/);
  assert.match(css, /\.solo-neck-hud\.lean-phase/,
    "the next target must receive a visible pre-arrival state");
  assert.match(css, /\.solo-neck-zones/);
  assert.match(css, /\.fb-dot\.neck-muted/);
  assert.match(css, /svg\.lean-phase \.fb-dot\.next-shape/,
    "the complete coming triad must brighten before the chord boundary");
});

test("Picking articulation and Harmony references use separate honest voices", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  const audio = read("js/audio.js");
  assert.match(html, /value="bouzouki" selected>Bouzouki pick · clear paired courses/);
  assert.doesNotMatch(html, /value="clean">Clean guitar/);
  assert.doesNotMatch(html, /value="auto">Match selected instrument/);
  assert.match(app, /picking: \{[^}]*voice: "bouzouki"/);
  assert.match(app, /function pickingReferenceVoice/);
  assert.match(app, /function playPickingSoundCheck/);
  assert.match(audio, /paired\.detune\.setValueAtTime\(3\.8, when\)/,
    "the practice pluck needs a short paired-course attack, not reverb or a drone");
  assert.match(audio, /function trainingNoteDuration/);
});

test("Harmony progression workout transposes verified modal routes", () => {
  const app = read("js/app.js");
  assert.match(app, /function cycleCompingEntries/);
  assert.match(app, /const PRACTICE_KEY_OFFSETS = \[0, 5, 10, 3, 8, 1\]/);
  assert.match(app, /id="cycleWorkoutTonic"/);
  assert.match(app, /Why this route:/);
  assert.match(app, /Same Greek\/modal route, transposed by fourths/);
  assert.match(app, /journey\.label = "Progression workout"/,
    "the Now card must not mislabel a modal workout as Song Map");
  assert.match(app, /Course-safe 4/,
    "non-guitar instruments must not receive six-string guitar grips");
});

test("focus colours retain labels, shape cues, and readable secondary text", () => {
  const css = read("css/styles.css");
  assert.match(css, /--bg: #0F1418/);
  assert.match(css, /--text: #F7F4EC/);
  assert.match(css, /--muted: rgba\(247, 244, 236, 0\.78\)/);
  assert.match(css, /--faint: rgba\(247, 244, 236, 0\.64\)/);
  assert.match(css, /\.dot-next-ring[^}]*stroke-dasharray/,
    "Next must remain dashed so timing is not encoded by colour alone");
});

test("the full fretboard never widens the page and folds on phones", () => {
  const css = read("css/styles.css");
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.stage \{ position: relative; min-width: 0; \}/);
  assert.match(css, /\.fretboard-wrap \{[\s\S]*max-width: 100%;/);
  assert.match(css, /\.fretboard-wrap \{[\s\S]*overflow: hidden/);
  // A min-width on the board is allowed ONLY inside a view-scoped wrap that
  // scrolls the board within its own frame (the analysis-board idiom); the
  // page itself must never widen.
  const minWidthRules = css.match(/[^{}]*#fretboard[^{}]*\{[^}]*min-width:[^}]*\}/g) || [];
  for (const rule of minWidthRules) {
    assert.match(rule, /body\[data-view="picking"\] \.fretboard-wrap/,
      "a #fretboard min-width must be scoped to a scrolling wrap, not the page");
  }
  assert.match(css, /body\[data-view="picking"\] \.fretboard-wrap \{ overflow-x: auto; \}/,
    "the picking wrap must scroll the wide board inside its own frame");
  assert.match(read("js/fretboard.js"), /matchMedia\("\(max-width: 620px\)"\)/);
  assert.match(read("js/fretboard.js"), /data-neck-layout/);
});

test("picking loops live on the audio clock and the board stays whole", () => {
  const audio = read("js/audio.js");
  // Seamless loop: iterations are bar-aligned and scheduled on the audio
  // clock; the JS timer only queues the next iteration ahead of the seam.
  assert.match(audio, /const loopSpan = o\.loop \? Math\.max\(barSpan, Math\.ceil\(total \/ barSpan[^)]*\) \* barSpan\) : total;/,
    "looping drills must pad to whole bars so the click never phase-shifts");
  assert.match(audio, /const iterStart = t0 \+ iteration \* loopSpan;/,
    "each iteration starts at an exact audio-clock offset, never currentTime");
  assert.match(audio, /iterStart \+ loopSpan - 0\.4/,
    "the next iteration is queued ahead of the seam, not after it");
  assert.match(audio, /o\.startAt && o\.startAt > ctx\.currentTime \? o\.startAt/,
    "callers can chain segments gaplessly on the audio clock");
  const app = read("js/app.js");
  assert.match(app, /playPickingStage\(plan, stageIndex \+ 1, token, stageEnd\);/,
    "evolve stages hand off at the exact end time of the previous stage");
  assert.match(app, /loop: looping,\n\s*startAt,/,
    "loop mode goes to the audio engine, not a setTimeout restart");
  assert.doesNotMatch(app, /setTimeout\(\(\) => playPickingStage/,
    "no JS-timer restarts between picking repeats");
  assert.match(app, /neckMode: "full",\n\s*flavourPcs: M\.flavourPcs\(state\.tonic, state\.modeId\)\n\s*\}\);\n\s*svg\(\)\.setAttribute\("aria-label", `\$\{window\.Tuning\.current\(\)\.name\} \$\{exercise\.title\} picking path`\);/,
    "the picking board is one unbroken neck");
  assert.match(app, /const ROUTE_LOCKED = \{ "outside-pairs": true, "mixed-crossings": true, "triplet-grammar": true, "sextolet-glide": true, "full-neck-ladder": true \};/,
    "the route toggle applies everywhere except drills whose mechanics fix a layout");
  assert.match(app, /if \(state\.picking\.playing\) \{ stopPlay\(\); renderPickingLab\(\); return; \}/,
    "the big button is Start AND Stop — one control for a non-technical player");
  const html = read("index.html");
  assert.match(html, /class="transport-bar picking-transport"[\s\S]{0,400}class="deck-start">▶ Start</,
    "start, speed, key and scale live in one always-visible transport bar");
  assert.match(html, /picking-transport[\s\S]{0,1600}id="pickingTonicSel"[\s\S]{0,400}id="pickingModeSel"/,
    "key and scale selection are consistent, in the transport");
  assert.match(html, /Loops smoothly until you press stop/,
    "the deck says in plain words what Start does");
  assert.match(html, /<details class="deck-advanced">/,
    "evolve\/stage\/voice options fold away from the first-time player");
  // Setup is four dropdowns, with the exercise select grouped by mastery stage.
  assert.match(app, /\$\("pickingExerciseSel"\)\.innerHTML = BK\.MASTERY_PHASES\.map/,
    "the exercise dropdown is built from the six-stage plan, not a card rail");
  assert.doesNotMatch(html, /pickingExerciseRail|pickingCategories|data-picking-mode/,
    "the card rail, category nav, and mode seg are gone — dropdowns replaced them");
  // Placement ergonomics: cross-course jumps are cost-gated and chunks come
  // from the position-true path builder, so no drill leaps two courses.
  assert.match(app, /const courseCost = \[0, 1\.4, 7, 11\];/,
    "multi-course jumps must be heavily penalised in placement scoring");
  assert.match(app, /function pickingChunkNodes\(context\) \{[\s\S]{0,1200}pickingScalePathNodes\(context, 8\)/,
    "chunk-builder routes through the position-true path builder");
  // Board reads as intervals with stroke above, finger below, chunk ring.
  assert.match(app, /labelMode: "degree", lefty: state\.lefty, showStrokes: true, largeNeck: true,/,
    "the picking board shows intervals; note names live in the event tiles");
  assert.match(read("js/fretboard.js"), /class: "finger-mark"/,
    "suggested finger renders under each path dot");
  assert.match(read("js/fretboard.js"), /\(n\.road \? " road-" \+ n\.road : ""\)/,
    "tetrachord road colouring rides the dot classes");
  // Timing grammar: a drill that declares its own subdivision must win on
  // selection, and an evolve run must return the lab to where it started.
  assert.match(app, /if \(exercise\.subdivision\) state\.picking\.subdivision = exercise\.subdivision;/,
    "triplet drills must not open as straight eighths");
  assert.match(app, /state\.picking\.runHome = \{ tonic: state\.tonic, position: state\.lab\.position \};/,
    "an evolve run records home before it travels");
  assert.match(app, /state\.lab\.position = state\.picking\.runHome\.position;/,
    "an evolve run restores home when it finishes");
  // Finger honesty: past the four-fret window the mark is a stretch flag,
  // never a fabricated finger number — and a traveling line (segment wider
  // than a hand) shows no numbers at all.
  assert.match(app, /: "⇧",/,
    "out-of-window notes must show the stretch flag, not finger 4 again");
  assert.match(app, /return span > 5 \? null : Math\.min\.apply\(null, fretted\);/,
    "segments wider than a hand must suppress finger numbers entirely");
  assert.match(app, /const startString = layout === "horizontal" \? window\.Tuning\.open\(\)\.length - 1 : state\.lab\.startString;/,
    "along-the-string lines live on the top course, where melody lives");
  assert.match(html, /id="pickingPositionSel"/,
    "the neck position that steers every drill must be a visible control");
  // The arp-chunk octave is the real octave (exact midi), never a unison.
  assert.match(app, /openMidi\[placement\.stringIndex\] \+ placement\.fret === targetMidi/,
    "the four-note chunk's top must be the true octave above the chunk root");
});

test("the shell has one purpose system, honest chrome, and working escape hatches", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  const css = read("css/styles.css");
  // One purpose system: the page guide. The two parallel ones are gone.
  assert.doesNotMatch(html, /id="coachCue"|id="modePurpose"|id="pageTitle"/,
    "coachCue, modePurpose, and pageTitle were three competing purpose systems");
  // Chrome comes from one capability table, not hand-kept CSS view lists.
  assert.match(app, /const VIEW_CHROME = \{/,
    "per-view chrome must be one table");
  assert.doesNotMatch(css, /body\[data-view="ear"\] \.transport-bar,/,
    "the rotted hand-kept transport list must not return");
  assert.match(css, /body\.chrome-no-transport \.transport-bar:not\(\.picking-transport\) \{ display: none; \}/,
    "chrome classes drive visibility; the picking transport is exempt");
  // The settings drawer can actually be closed.
  assert.match(html, /id="drawerClose"/,
    "the drawer needs a close button");
  assert.match(app, /if \(e\.key === "Escape" && drawer\.open\) drawer\.open = false;/,
    "Escape closes the drawer");
  // Typing in a textarea is never hijacked by shortcuts.
  assert.match(app, /e\.target\.tagName === "TEXTAREA"/,
    "the global keydown guard must exempt textareas");
  // Band-keys evolve is reachable (the whitelist omission killed it).
  assert.match(app, /\["position", "key", "band", "both"\]/,
    "the movement whitelist must include band");
  // Compact nav: 6 primary destinations + a More sheet.
  assert.match(html, /id="navMore"[\s\S]{0,200}id="navSecondary"/,
    "the reference group folds behind More on compact screens");
  // Motion + layout tokens exist and reduced motion zeroes them.
  assert.match(css, /--h-primary: 48px; --h-control: 40px; --h-chip: 32px;/,
    "control-height tokens are the sizing law");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\n  :root \{ --dur-1: 0ms; --dur-2: 0ms; --dur-3: 0ms; \}/,
    "reduced motion zeroes the kit in one place");
  // Motion kit: view transitions with a working fallback and a motion gate.
  assert.match(app, /if \(document\.startViewTransition && motionOK\(\) && !document\.hidden && state\.view && state\.view !== v\)/,
    "view switches use the View Transitions API only when supported AND motion is allowed");
  assert.match(css, /#stage \{ view-transition-name: stage; \}/,
    "the stage morphs between views instead of teleporting");
  assert.match(css, /@supports \(animation-timing-function: linear\(0, 1\)\)/,
    "the spring easing upgrades progressively behind @supports");
  // Today is the landing, its duplicate rail is gone, and progress is real.
  assert.match(read("js/profiles.js"), /view: "today",/,
    "the nav lists Today first, so Today is the default view");
  assert.doesNotMatch(html, /id="practicePath"/,
    "the verbatim duplicate of the Today grid must not return");
  assert.match(app, /const visited = todayVisits\(\);/,
    "Today cards reflect what was actually visited today");
  // Interaction canon: beat-synced pulses, one focus ring, designed states.
  assert.match(app, /setTimeout\(\(\) => beatPulse\(!!\(pulseBeat && pulseBeat\.first\)\), delay\);/,
    "the interface pulses on the transport's beat, scheduled to the audio clock");
  assert.match(app, /if \(index % state\.picking\.subdivision === 0\) beatPulse\(false, \[\$\("btnPickingPlay"\)\]\);/,
    "the picking Start button pulses on the drill's click beats");
  assert.match(css, /:focus-visible \{ outline: 2px solid var\(--turquoise\); outline-offset: 2px;/,
    "one focus ring everywhere");
  assert.match(css, /@starting-style \{\n  \.roadmap-chord, \.today-card, \.picking-event \{ opacity: 0;/,
    "re-rendered collections enter, they do not pop");
  assert.match(read("js/fretboard.js"), /gg\.style\.animationDelay = /,
    "fretboard dots cascade in");
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
  // The skeleton leads the page, so the control that starts it is next to it
  // instead of only in the footer transport, and it mirrors the one transport.
  const panel = (html.match(/<div id="panelTriads"[\s\S]*?\n            <\/div>/) || [""])[0];
  assert.match(panel, /id="btnCompPlay"/, "Comp needs a visible Play beside the skeleton it starts");
  assert.ok(panel.indexOf("compSkeleton") < panel.indexOf("btnCompPlay"),
    "the pulse skeleton is the answer object and leads its own primary action");
  assert.match(app, /\$\("btnCompPlay"\)\.onclick = togglePlay/,
    "the panel Play must drive the one transport, not a second playback state");
  assert.match(app, /const comp = \$\("btnCompPlay"\)[^]*comp\.textContent = text/,
    "the panel Play must mirror the transport label instead of lying about state");
  // The pulse line pointed at a Play the CSS hid and at a settings group that
  // had been renamed; both claims must match what actually ships.
  assert.match(app, /COMP_IDLE_LINE = "Press ▶ Play under this skeleton/,
    "Comp's status line must name the control that really starts the pulse");
  assert.doesNotMatch(app, /Bass and drums in Practice setup/,
    "the drawer group is called Practice ensemble");
  assert.match(app, /function resetCompPulse/,
    "a stopped skeleton must stop claiming a beat is sounding");
  // Layer 2 per the disclosure doctrine: one Setup fold holds the shape config.
  assert.match(panel, /<details id="triadSetup"[\s\S]*id="setSel"[\s\S]*id="triadZoneSel"[\s\S]*id="tglAllShapes"[\s\S]*<\/details>/,
    "strings, neck area, and the faint-shapes toggle belong in one Setup fold");
});
