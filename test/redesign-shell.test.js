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

test("Melody leads with Start plus the seven degrees and stages everything else", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  const panel = html.slice(html.indexOf('<div id="panelMelody"'), html.indexOf('<section id="melodyReveal"'));

  // Acceptance gate (blueprint 2.6): the question asked for 21 controls before
  // the reveal. Count what is actually on screen - static controls outside the
  // Setup fold plus one rendered button per scale degree.
  const outsideSetup = panel.replace(/<details[\s\S]*?<\/details>/g, "");
  const staticControls = (outsideSetup.match(/<(?:button|select|input)\b/g) || []).length;
  assert.match(app, /scale\.map\(\(note, index\) => \{[\s\S]*?data-melody-degree="\$\{index\}"/,
    "the degree buttons are rendered one per scale degree");
  const degreeButtons = 7;
  assert.ok(staticControls + degreeButtons < 12,
    `the melody question must ask fewer than 12 controls before the reveal, found ${staticControls + degreeButtons}`);
  assert.match(outsideSetup, /id="btnMelodyNew" class="melody-start"/, "Start is the one primary action");
  assert.match(read("css/styles.css"), /\.melody-start \{[^}]*min-height: var\(--h-primary\)/,
    "the primary action ships at the 48px primary height");

  // Setup fold holds the configuration and the reference audio.
  const setup = panel.match(/<details class="melody-setup[\s\S]*?<\/details>/)[0];
  ["melodyTonicSel", 'data-melody-mode="hijaz"', 'data-melody-depth="seventh"', "btnMelodyHome", "btnMelodyStop"]
    .forEach((hook) => assert.ok(setup.includes(hook), `${hook} belongs in the one Setup fold`));

  // Staged reveal: identity and what-can-follow first, the rest behind More.
  const reveal = html.slice(html.indexOf('<section id="melodyReveal"'), html.indexOf('<!-- Ear trainer -->'));
  const more = reveal.match(/<details id="melodyMore"[\s\S]*?<\/details>/)[0];
  ["melodyCandidates", "melodyMoves", "melodySing"].forEach((id) =>
    assert.ok(more.includes(`id="${id}"`), `${id} is second-layer detail behind More`));
  ["melodyIdentity", "melodyNext"].forEach((id) =>
    assert.ok(!more.includes(`id="${id}"`) && reveal.includes(`id="${id}"`), `${id} must stay visible on check`));
  assert.match(app, /melodyNextTitle"\)\.textContent = selected/,
    "with the chord colours folded away, the anticipation heading must name its chord");
  assert.match(app, /melodyMore"\)\.ontoggle[\s\S]*?stopPitchListening/,
    "closing the fold must stop a live microphone");

  // The two standing fine-print paragraphs became one honesty line in the guide.
  assert.doesNotMatch(html, /class="melody-boundary"/, "standing disclaimer paragraphs are banned");
  assert.match(read("js/page-guides.js"), /boundary: "Chord membership is derived from the selected scale/);
  assert.match(app, /guide\.boundary \? `<p class="guide-boundary"/, "the honesty line renders inside the collapsed guide");
test("the video lab leads with the library and survives a player that never loads", () => {
  const video = read("js/video.js");
  const css = read("css/styles.css");
  const library = video.indexOf('class="video-library"');
  const layout = video.indexOf('class="video-layout"');
  assert.ok(library > -1 && layout > library,
    "choosing a lesson is step 1, so the library must render above the player");
  // The offline-capable app's worst failure: with no error and no timeout path
  // the "Open on YouTube" fallback could never render.
  assert.match(video, /script\.onerror/, "a blocked API script must reach the fallback");
  assert.match(video, /API_TIMEOUT/, "a silent API must time out into the fallback");
  assert.match(video, /function showFallback/, "an unreachable lesson needs a link, not an empty box");
  assert.match(css, /\.video-offline/, "the fallback link needs a visible treatment");
  // Nothing that needs the embedded player may look live before it is ready.
  assert.match(video, /play\.disabled = !ready/, "Play must be disabled until the player is ready");
  assert.match(video, /slider\.disabled = !ready/, "the A/B sliders must wait for a real duration");
  assert.doesNotMatch(video, /max="300"/, "the A/B range must be a variable ceiling, not a hardcoded 5:00");
  assert.doesNotMatch(video, /video-study-tip/, "the study tip duplicated the page guide step for step");
  assert.match(read("js/app.js"), /Set A and Set B mark the loop/,
    "the Video view needs its own keyboard hint instead of the false Space/arrows line");
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

test("Greek Pulse opens on the pulse it is named after (blueprint 2.11)", () => {
  const html = read("index.html");
  const app = read("js/app.js");
  const css = read("css/styles.css");
  assert.match(html, /data-style-section="greek" class="active"/,
    "the destination called Greek Pulse must open on the Greek pulse maps");
  assert.match(app, /styles: \{ section: "greek"/, "the default section must match the shipped markup");
  assert.ok(html.indexOf('id="styleExplorer"') < html.indexOf('id="foundationGuide"'),
    "the default section must ship visible instead of relying on a render to unhide it");
  assert.doesNotMatch(html, /id="styleExplorer" class="style-explorer hidden"/,
    "the shipped markup must not hide the default section");

  const explorer = (app.match(/\$\("styleExplorer"\)\.innerHTML = `[\s\S]*?`;/) || [""])[0];
  assert.ok(explorer, "the Greek section must still render from one template");
  assert.ok(explorer.indexOf("pulse-strip") < explorer.indexOf("style-jobs"),
    "the pulse strip leads the card instead of sitting mid-card under prose");
  assert.ok(explorer.indexOf("pulse-strip") < explorer.indexOf('id="btnOpenSongMap"'),
    "the primary action sits directly under the answer it acts on");
  assert.doesNotMatch(explorer, /<span>Map next<\/span>/,
    "'then open Song Map' is stated once, as the button");
  assert.doesNotMatch(app, /class="style-intro"/, "standing intro paragraphs are the page guide's job");
  assert.doesNotMatch(css, /\.style-intro/, "the deleted intro must not keep dead CSS");
  assert.match(app, /class="foundation-card"[\s\S]*?style-source/,
    "the provenance note folds into the last foundation card");

  assert.match(app, /hint: "Choose a pulse map/, "the keyboard hint must come from the view table");
  assert.match(app, /space: false, arrows: false/,
    "a page with no transport must not swallow Space or the arrow keys");
  assert.match(app, /keys\.space === false && e\.code === "Space"/);
  assert.match(css, /\.style-actions \.primary-mini \{ min-height: var\(--h-primary\)/,
    "the one primary action must be a primary-height control");
});
