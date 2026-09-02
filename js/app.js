/* app.js — views, wiring, animation, playback sync, shortcuts.
 * Implements FR-04..07, FR-11, FR-12, FR-15, FR-57, FR-65..68 / MI-27, MI-34..37. See docs/REQUIREMENTS.md.
 */
(function () {
  "use strict";
  const T = window.Theory, FB = window.Fretboard, AU = window.AudioEngine, M = window.Modes, S = window.StyleLibrary, A = window.AnalysisEngine,
    U = window.StudyLibrary, Q = window.MusicXmlImport, R = window.ResourceLibrary, V = window.VideoStudy, C = window.PracticeCoach, GV = window.GuitarVoicings, E = window.EarDrills,
    PP = window.PlayerProfiles, HJ = window.HarmonyJourney, SL = window.SongLibrary, CM = window.ChordMap, CP = window.ChordPath, MH = window.MelodyHarmony, PL = window.PitchLab, TK = window.SoloToolkit,
    PG = window.PageGuides, TE = window.TacticalExamples, BK = window.BouzoukiKnowledge, PK = window.PickingLab;

  const cycle = T.buildCycle();
  const N = cycle.length;

  const state = {
    view: "cycle",             // cycle | prog | ear | melody | triads | solo | picking | styles | video | analyze | concepts | coach
    // --- cycle view ---
    index: 0,
    cycleMode: "pivot",        // the Changes Gym; "full"/"iiVI" survive only as legacy preference values
    // Changes Gym settings: how many keys the wheel chains, the whole-note
    // skeleton drill, and the unmetered taximi bridge between keys.
    gym: { keys: 6, anchor: 0, skeleton: false, bridging: false, bridgeTimer: null },
    cycleComping: { focus: "hear", step: 0, kind: "full", voicingIndex: 0, stringSet: null, zone: "mid" },
    // --- progression view ---
    tonic: "D",
    modeId: "major",
    progId: "ii-V-I",
    progStep: 0,
    scaleOverlay: false,
    chordMap: { depth: "triad", degree: 0, targetIndex: 1, shapeIndex: 0, pathLens: "play" },
    // --- ear trainer ---
    ear: {
      drill: "colour", tonic: "D", answer: null, guess: null, hintLevel: 0, score: 0, total: 0, streak: 0, best: 0, locked: false,
      map: { answer: null, homePreset: "D", keyOptions: [], keyGuess: null, familyGuess: null, progressionGuess: null, hintLevel: 0, locked: false, score: 0, total: 0, streak: 0, best: 0 }
    },
    // --- melody note -> harmonic choices ---
    melody: {
      prompt: null, guess: null, revealed: false, hintLevel: 0, depth: "triad", selectedDegree: null, selectedSuccessor: 0,
      score: 0, total: 0, message: "The home stays known so the question trains relative hearing, not perfect pitch.",
      sing: { listening: false, requesting: false, deviceId: "", inputLabel: "Default system input", inputDevices: [], history: [], stableSince: 0, holdMs: 0, success: false, recorded: false, voicedFrames: 0 }
    },
    // --- triads ---
    triads: { step: 0, stringSet: null, zone: "mid", showAll: true, rhythmLevel: 1 },
    // --- solo lab ---
    solo: { section: "targets", focus: "third", lens: "full", oneCourse: false, phraseId: "ladder", routeId: "nearest-link", matrixBeat: 0, matrixPlan: [], neckZone: "both", allTargets: true,
      // Soloist Toolkit (FR-58): active pillar/tool and the phrase-arc phase.
      toolkit: { pillar: "land", toolId: "arrivals", phase: 0, formulaDeck: [0, 1, 2, 3] },
      // visual layers on the Changes map: the scale road and the targets are
      // meant to be seen TOGETHER, so both default on.
      layers: { scale: true, pentatonic: false, triads: false, next: true, shapes: true }, neckMode: "auto" },
    // --- foundation and Greek styles ---
    styles: { section: "foundation", styleId: "zeibekiko" },
    // --- source-bounded tactical example index ---
    examples: { category: "all", selectedId: "chiotis-mimisis" },
    // --- repertoire songs ---
    songs: { openId: "ta-mavra-matia-sou", tab: "chart" },
    // --- transparent analysis ---
    analysis: { tonic: "D", modeId: "minor", selected: 0, studyId: null, importStatus: "" },
    // --- scale lab ---
    lab: {
      drill: "path",           // path | phrase | cell
      layout: "3nps", position: 5, startDegree: 1, startString: 0,
      firstStroke: "down", updown: true, pathIndex: null,
      cellIdx: 0, audiate: true, revealed: false
    },
    // --- dedicated plectrum curriculum ---
    picking: {
      exerciseId: "down-up-clock", route: "tiered",
      variant: "alternate",
      subdivision: 2, firstStroke: "down", pathIndex: null, cleanPasses: 0, rungHistory: [], ceilingBpm: null, playing: false,
      runMode: "loop", repeats: 4, movement: "position", metronome: true, countIn: true,
      runIndex: null, activeSegment: null, voice: "bouzouki"
    },
    // --- shared ---
    labelMode: "interval",
    ghosts: false,
    lefty: false,
    position: null,
    bpm: 84,
    metronome: false,
    holdI: true,
    loop: true,
    strumStyle: "strum",
    // chord reference voice: sampled studio piano is the pitch-stable default.
    chordVoice: "studio",
    // optional "five of two": a dominant pickup on beat 3 of the phrase's
    // last bar that pulls the ear back to the ii chord (A7 -> Dm7 in C).
    pickupV2: false,
    // The pulse is deliberately a practice ensemble: grouped timing and
    // functional roots, not a substitute for a real rhythm section or a
    // claim that one generic pattern represents a whole Greek style.
    groove: { styleId: "hasapiko", bass: false, drums: false }
  };

  const $ = (id) => document.getElementById(id);
  const svg = () => $("fretboard");

  // UI-only preferences (voice, pickup) live outside the validated player
  // profile document so the profile schema and its tests stay untouched.
  const UI_PREFS_KEY = "dromos-ui-v14";
  function loadUiPreferences() {
    try {
      const raw = JSON.parse(localStorage.getItem(UI_PREFS_KEY) || "{}");
      // Old modeled clean/match voices migrate to the reliable piano. Picking
      // has its own short paired-course voice and no longer changes harmony.
      if (["studio", "piano"].includes(raw.chordVoice)) state.chordVoice = raw.chordVoice;
      if (["bouzouki", "studio", "piano"].includes(raw.pickingVoice)) state.picking.voice = raw.pickingVoice;
      if (typeof raw.pickupV2 === "boolean") state.pickupV2 = raw.pickupV2;
      if ([1, 3, 6].includes(raw.gymKeys)) state.gym.keys = raw.gymKeys;
      if (typeof raw.gymSkeleton === "boolean") state.gym.skeleton = raw.gymSkeleton;
    } catch { /* first run or blocked storage */ }
  }
  function saveUiPreferences() {
    try { localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ chordVoice: state.chordVoice, pickingVoice: state.picking.voice, pickupV2: state.pickupV2, gymKeys: state.gym.keys, gymSkeleton: state.gym.skeleton })); } catch { /* private mode */ }
  }
  // Harmony keeps a pitch-stable piano. Technique defaults to a short paired-
  // course pluck so attack timing is audible without changing ear-test timbre.
  function chordReferenceVoice() {
    return state.chordVoice === "piano" ? "piano" : "studio";
  }
  function pickingReferenceVoice() {
    return ["studio", "piano"].includes(state.picking.voice) ? state.picking.voice : "bouzouki";
  }

  function updateAudioReadyStatus(status, message) {
    const snapshot = status || AU.audioStatus();
    const copy = message || (snapshot.ready
      ? snapshot.studio === "loading" ? "Sound on · loading sampled piano…" : "Sound ready"
      : snapshot.state === "suspended" || snapshot.state === "interrupted" ? "Tap Test sound to restore audio" : "Tap Test sound if audio is silent");
    [$("audioReadyStatus"), $("pickingAudioReadyStatus")].filter(Boolean).forEach((target) => {
      target.dataset.state = snapshot.ready ? "ready" : snapshot.state;
      target.textContent = copy;
    });
  }

  async function readyPracticeAudio(referenceVoice) {
    updateAudioReadyStatus({ state: "starting", ready: false, studio: AU.studioStatus() }, "Starting audio…");
    const running = await AU.ensureRunning();
    if (!running) {
      updateAudioReadyStatus(AU.audioStatus(), "Audio is blocked · tap Test sound again");
      return false;
    }
    if (referenceVoice === "studio") {
      updateAudioReadyStatus({ state: "running", ready: true, studio: "loading" });
      await AU.prepareStudioPiano();
    }
    updateAudioReadyStatus(AU.audioStatus());
    return true;
  }

  async function playSoundCheck() {
    stopPlay();
    const voice = chordReferenceVoice();
    if (!await readyPracticeAudio(voice)) return;
    AU.playSequence([60, 64, 67, 72].map((midi) => ({ freq: T.midiToFreq(midi) })), 0.22, undefined, voice);
    updateAudioReadyStatus(AU.audioStatus(), `${voice === "studio" ? "Sampled piano" : "Warm keys"} playing`);
  }

  async function playPickingSoundCheck() {
    stopPlay();
    const voice = pickingReferenceVoice();
    if (!await readyPracticeAudio(voice)) return;
    AU.playSequence([62, 64, 65, 67, 69, 70, 72, 74].map((midi) => ({ freq: T.midiToFreq(midi) })), 0.18, undefined, voice);
    updateAudioReadyStatus(AU.audioStatus(), `${voice === "bouzouki" ? "Bouzouki pick" : voice === "studio" ? "Sampled piano" : "Warm keys"} playing · separate attacks`);
  }
  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));

  const PERSISTED_VIEWS = ["cycle", "prog", "chordmap", "ear", "melody", "triads", "solo", "picking", "styles", "video", "examples", "songs", "analyze", "concepts", "coach"];

  function stablePreferences() {
    return {
      tuningId: window.Tuning.currentId(), view: PERSISTED_VIEWS.includes(state.view) ? state.view : "cycle", tonic: state.tonic,
      modeId: state.modeId, progressionId: state.progId, bpm: state.bpm,
      cycleMode: state.cycleMode, cycleZone: state.cycleComping.zone,
      triadZone: state.triads.zone, labelMode: state.labelMode,
      lefty: state.lefty, loop: state.loop,
      ghosts: state.ghosts, scaleOverlay: state.scaleOverlay,
      metronome: state.metronome, holdI: state.holdI
    };
  }

  function persistPreferences(patch) {
    if (PP) PP.updatePreferences(Object.assign(stablePreferences(), patch || {}));
  }

  function applyPlayerProfile(profile) {
    if (!profile) return;
    const preferences = profile.preferences;
    window.Tuning.set(preferences.tuningId);
    state.tonic = preferences.tonic;
    state.modeId = preferences.modeId;
    state.progId = (M.PROGRESSIONS[state.modeId] || []).some((item) => item.id === preferences.progressionId)
      ? preferences.progressionId : M.PROGRESSIONS[state.modeId][0].id;
    state.bpm = preferences.bpm;
    // Legacy modes fold into the gym: "full" was the 6-key wheel, "iiVI" the
    // single-key on-ramp. Both are now key-count settings of one exercise.
    state.cycleMode = "pivot";
    if (preferences.cycleMode === "iiVI") state.gym.keys = 1;
    state.index = 0;
    state.gym.anchor = 0;
    state.cycleComping.zone = preferences.cycleZone;
    state.triads.zone = preferences.triadZone;
    state.labelMode = preferences.labelMode;
    state.lefty = preferences.lefty;
    state.loop = preferences.loop;
    state.ear.tonic = preferences.tonic;
    state.ear.score = profile.progress.earColour.correct;
    state.ear.total = profile.progress.earColour.attempts;
    state.ear.streak = profile.progress.earColour.streak;
    state.ear.best = profile.progress.earColour.best;
    state.ear.map.score = profile.progress.earMap.correct;
    state.ear.map.total = profile.progress.earMap.attempts;
    state.ear.map.streak = profile.progress.earMap.streak;
    state.ear.map.best = profile.progress.earMap.best;
    state.melody.sing.listening = false; state.melody.sing.requesting = false; state.melody.sing.history = []; state.melody.sing.stableSince = 0;
    state.melody.sing.holdMs = 0; state.melody.sing.success = false; state.melody.sing.recorded = false; state.melody.sing.voicedFrames = 0;
    state.ear.answer = null; state.ear.guess = null; state.ear.locked = false;
    state.ear.map.answer = null; state.ear.map.keyGuess = null; state.ear.map.familyGuess = null; state.ear.map.progressionGuess = null; state.ear.map.locked = false;
  }

  function instrumentShortName(tuningId) {
    return ({ guitar: "Guitar", guitarDropD: "Guitar drop D", bouzouki4: "Bouzouki 4", bouzouki3: "Bouzouki 3", laouto4: "Laouto 4" })[tuningId] || "Instrument";
  }

  function renderPlayerProfiles(keepOpen) {
    const root = $("profileApp");
    if (!root || !PP) return;
    const profiles = PP.list();
    const active = PP.active();
    root.innerHTML = `<details class="player-menu"${keepOpen ? " open" : ""}><summary aria-label="Player profile ${escapeHtml(active.displayName)}">
      <span class="player-avatar">${escapeHtml(active.displayName.slice(0, 1).toUpperCase())}</span><span class="player-summary"><b>${escapeHtml(active.displayName)}</b><span>${escapeHtml(instrumentShortName(active.preferences.tuningId))} · this device</span></span><span class="player-chevron">▾</span></summary>
      <div class="player-panel"><div class="player-panel-head"><b>Player profiles · this device</b><span>Separate instrument settings, ear scores, sing-back locks, and coach history. These are local profiles, not password-protected accounts.</span></div>
      <div class="player-list">${profiles.map((profile) => `<button class="player-choice${profile.id === active.id ? " active" : ""}" data-player-id="${profile.id}"><b>${escapeHtml(profile.displayName)}</b><span>${escapeHtml(instrumentShortName(profile.preferences.tuningId))} · ${profile.progress.earColour.correct + profile.progress.earMap.correct}/${profile.progress.earColour.attempts + profile.progress.earMap.attempts} ear checks · ${profile.progress.singPitch.correct} pitch locks</span><i>${profile.id === active.id ? "Active" : "Switch"}</i></button>`).join("")}</div>
      <form id="renamePlayerForm" class="player-form"><input id="renamePlayerName" maxlength="32" value="${escapeHtml(active.displayName)}" aria-label="Rename active player" /><button>Rename</button></form>
      <form id="addPlayerForm" class="player-form"><input id="newPlayerName" maxlength="32" placeholder="New player name" aria-label="New player name" /><button>Add player</button></form>
      <div class="player-manage"><span class="player-privacy">Stored only in this browser.</span>${profiles.length > 1 ? '<button id="removePlayer" type="button">Remove active</button>' : ""}</div></div></details>`;
    root.querySelectorAll("[data-player-id]").forEach((button) => {
      button.onclick = () => switchPlayer(button.getAttribute("data-player-id"));
    });
    root.querySelector("#renamePlayerForm").onsubmit = (event) => {
      event.preventDefault(); PP.rename(active.id, root.querySelector("#renamePlayerName").value); renderPlayerProfiles(true);
    };
    root.querySelector("#addPlayerForm").onsubmit = (event) => {
      event.preventDefault();
      const created = PP.create(root.querySelector("#newPlayerName").value);
      if (created) switchPlayer(created.id);
    };
    const remove = root.querySelector("#removePlayer");
    if (remove) remove.onclick = () => {
      if (window.confirm(`Remove ${active.displayName}'s local practice profile and scores from this browser?`)) {
        const next = PP.remove(active.id); switchPlayer(next.id);
      }
    };
  }

  function syncPersistentControls() {
    const tuning = $("tuningSel");
    if (tuning) tuning.value = window.Tuning.currentId();
    if ($("tuningSub")) $("tuningSub").textContent = window.Tuning.current().sub;
    if ($("bpm")) { $("bpm").value = state.bpm; $("bpmVal").textContent = state.bpm; }
    if ($("tonicSel")) $("tonicSel").value = state.tonic;
    if ($("tglLabel")) $("tglLabel").checked = state.labelMode === "note";
    if ($("tglLefty")) $("tglLefty").checked = state.lefty;
    if ($("tglLoop")) $("tglLoop").checked = state.loop;
    if ($("tglHoldI")) $("tglHoldI").checked = state.holdI;
    if ($("voiceSel")) $("voiceSel").value = state.chordVoice;
    if ($("tglPickup")) $("tglPickup").checked = state.pickupV2;
    syncHarmonyTabs();
  }

  function switchPlayer(profileId) {
    stopPitchListening({ record: false, quiet: true }); stopPlay();
    const profile = PP.switchTo(profileId);
    if (!profile) return;
    applyPlayerProfile(profile);
    state.position = null; state.progStep = 0; state.cycleComping.step = 0;
    syncPersistentControls(); renderPlayerProfiles(false);
    if (C && C.switchProfile) C.switchProfile(profile.id);
    setView(profile.preferences.view);
  }

  // ====================== primary navigation model ======================
  // Primary destinations follow the player's journey: orient, hear, connect
  // melody to harmony, map/comp, then solo. Reference tools follow beneath.
  const NAV_DEFAULT_VIEW = { today: "today", hear: "ear", melody: "melody", harmony: "cycle", matrix: "chordmap", solo: "solo", picking: "picking", repertoire: "songs", learn: "styles", coach: "coach", progress: "progress" };
  const VIEW_NAV = { today: "today", ear: "hear", melody: "melody", cycle: "harmony", prog: "harmony", chordmap: "matrix", triads: "harmony", solo: "solo", picking: "picking", songs: "repertoire", analyze: "repertoire", styles: "learn", video: "learn", examples: "learn", concepts: "learn", coach: "coach", progress: "progress" };
  const NAV_TITLES = { today: "Today", hear: "Ear", melody: "Melody → Harmony", harmony: "Harmony", matrix: "Harmony Matrix", solo: "Solo", picking: "Picking Lab", repertoire: "Repertoire", learn: "Learn", coach: "Coach", progress: "Progress" };

  // One sentence per workspace answering "what is this FOR" — the purposes the
  // pedagogy research settled on, in the player's language.
  function syncHarmonyTabs() {
    document.querySelectorAll("[data-harmony-mode]").forEach((button) =>
      button.classList.toggle("active", state.view === "cycle" && button.getAttribute("data-harmony-mode") === state.cycleMode));
  }

  const PRACTICE_STEPS = [
    { view: "cycle", label: "1 · Changes", detail: "Follow the ii–V–I pivot until the next key feels inevitable." },
    { view: "ear", label: "2 · Recall", detail: "Hear a colour or cadence, then name its home and change boxes." },
    { view: "melody", label: "3 · Melody", detail: "Name one melody note's scale job, compare its chords, and anticipate the next move." },
    { view: "prog", label: "4 · Map", detail: "Name the dromos, progression, and chord function before you play." },
    { view: "chordmap", label: "Matrix · Reference", detail: "Compare the five verified roads by number, then open a working progression or a justified sister scale." },
    { view: "triads", label: "5 · Comp", detail: "Clap the grouped pulse, add its bass/chord skeleton, then keep the changes close with practical triads." },
    { view: "solo", label: "6 · Solo", detail: "Use a pentatonic frame, then land on chord tones at each change." },
    { view: "picking", label: "7 · Picking", detail: "Make the attack, course changes, and accents survive inside the phrase." },
    { view: "styles", label: "8 · Pulse", detail: "Fit the phrase to a real Greek pulse without confusing rhythm and dromos." },
    { view: "video", label: "9 · Study", detail: "Watch one legal public lesson in a short A–B loop, then explain its map." }
  ];


  function pageGuideContext() {
    const instrument = window.Tuning.current().name;
    if (state.view === "cycle") return `${instrument} · ${state.gym.keys} key${state.gym.keys === 1 ? "" : "s"} · ${state.bpm} BPM`;
    if (state.view === "ear") {
      // "random" is the blind-training value the home select actually writes;
      // testing for "blind" here always fell through to the known-home copy.
      const home = state.ear.drill === "map" ? state.ear.map.homePreset : state.ear.tonic;
      return `${home === "random" ? "Home hidden · training blind" : `Known home ${home}`} · sampled studio piano`;
    }
    if (state.view === "analyze") return `${instrument} · ${state.analysis.tonic} ${M.MODES[state.analysis.modeId].name}`;
    if (state.view === "picking") return `${instrument} · ${state.tonic} ${M.MODES[state.modeId].name} · ${S.byId(state.groove.styleId).title} · ${state.bpm} BPM`;
    if (state.view === "styles") return state.styles.section === "greek" ? `Greek styles · ${S.byId(state.styles.styleId).title}` : "Foundation · general musical skills";
    if (["video", "concepts", "progress", "today"].includes(state.view)) return instrument;
    const mode = M.MODES[state.modeId];
    return `${instrument} · ${state.tonic} ${mode ? mode.name : ""}`;
  }

  function focusPageGuideTarget(targetId) {
    const target = targetId ? $(targetId) : null;
    if (!target) return;
    if (!target.matches("button, input, select, textarea, a[href], [tabindex]")) target.setAttribute("tabindex", "-1");
    target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    target.focus({ preventScroll: true });
    target.classList.remove("guide-target-pulse");
    void target.offsetWidth;
    target.classList.add("guide-target-pulse");
    window.setTimeout(() => target.classList.remove("guide-target-pulse"), 1800);
  }

  function renderPageGuide() {
    const guide = PG.resolve({
      view: state.view,
      cycleFocus: state.cycleComping.focus,
      earDrill: state.ear.drill,
      soloSection: state.solo.section,
      styleSection: state.styles.section
    });
    $("pageGuide").innerHTML = `<article class="learning-pyramid" data-guide-key="${escapeHtml(guide.key)}">
      <header class="guide-answer"><span>Answer first · ${escapeHtml(guide.purpose)}</span><h1>${escapeHtml(guide.answer)}</h1><p>${escapeHtml(guide.result)}</p><small>Current setup · ${escapeHtml(pageGuideContext())}</small></header>
      <div class="guide-first"><i>1</i><div><span>Start here</span><b>${escapeHtml(guide.steps[0])}</b></div></div>
      <details class="guide-workflow"><summary><span>Open the complete practice guide</span><b>3 steps · listening goal · success test</b></summary><div class="guide-workflow-body">
        <ol class="guide-steps" aria-label="How to use this page">${guide.steps.map((step, index) => `<li class="${index === 0 ? "is-first" : ""}"><i>${index + 1}</i><div><span>${index === 0 ? "Start here" : index === 1 ? "Then" : "Finish"}</span><b>${escapeHtml(step)}</b></div></li>`).join("")}</ol>
        <div class="guide-reason"><div><span>What to listen or look for</span><p>${escapeHtml(guide.why)}</p></div><div class="guide-success"><span>You are ready to move on when…</span><b>${escapeHtml(guide.done)}</b></div></div>
        ${guide.boundary ? `<p class="guide-boundary"><b>What this page does not claim:</b> ${escapeHtml(guide.boundary)}</p>` : ""}
        <details class="guide-explain"><summary>New here? Explain the words and screen controls</summary><div><dl>${guide.terms.map(([term, meaning]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(meaning)}</dd></div>`).join("")}</dl><p><b>Using the screen:</b> Tap a button once. The selected choice is highlighted. You may change choices until an exercise says <i>Check</i>. Use <i>Stop</i> whenever you need silence; changing pages also stops the sound.</p></div></details>
      </div></details>
    </article>`;
  }


  function currentPulse() {
    const style = S.byId(state.groove.styleId);
    return { style, beats: S.beatMap(style) };
  }

  function renderGrooveControls() {
    const select = $("grooveStyle");
    if (!select) return;
    select.innerHTML = S.STYLES.map((style) =>
      `<option value="${style.id}"${style.id === state.groove.styleId ? " selected" : ""}>${style.title} · ${style.meter} · ${style.pulse}</option>`
    ).join("");
    $("tglBass").checked = state.groove.bass;
    $("tglDrums").checked = state.groove.drums;
    const pulse = currentPulse();
    $("grooveHint").textContent = `${pulse.style.title}: ${pulse.style.pulse}. Root-and-fifth bass plus grouped percussion make the destination audible; this is a timing aid, not a full traditional arrangement.`;
  }

  function selectGrooveStyle(id) {
    stopPlay();
    state.groove.styleId = S.byId(id).id;
    state.styles.styleId = state.groove.styleId;
    state.solo.matrixBeat = 0;
    renderGrooveControls();
    if (state.view === "solo") renderSoloSection();
    if (state.view === "triads") renderTriads();
    if (state.view === "styles") renderStyles();
    // The picking panel shows the active pulse and its documented tempo band.
    if (state.view === "picking") renderPickingLab();
  }

  function rootPcOf(chord) {
    if (chord.rootPc != null) return chord.rootPc;
    const root = chord.notes && chord.notes.find((note) => note.role === "R");
    return root ? root.pc : null;
  }

  // ======================= shared fretboard draw =========================
  function drawChord(chordNotes, moveClass, extra) {
    const grip = FB.findGrip(chordNotes, state.position);
    FB.render(svg(), Object.assign({
      grip,
      ghosts: state.ghosts,
      allPositions: state.ghosts ? FB.allTonePositions(chordNotes) : null,
      labelMode: state.labelMode,
      lefty: state.lefty,
      moveClass: moveClass
    }, extra || {}));
    if (!grip) console.warn("no playable grip found", chordNotes);
    svg().setAttribute("aria-label", window.Tuning.current().name + " fretboard");
    return grip;
  }

  function pulseMoved() {
    requestAnimationFrame(() => {
      svg().querySelectorAll(".fb-dot.moved").forEach((n) => {
        n.classList.remove("flash"); void n.getBBox(); n.classList.add("flash");
      });
    });
  }

  function animateChangeGuide() {
    const guide = $("changeGuide");
    if (!guide || guide.classList.contains("hidden")) return;
    guide.classList.remove("is-cued");
    void guide.offsetWidth;
    guide.style.setProperty("--bar-ms", `${Math.round((60 / state.bpm) * currentPulse().beats.length * 1000)}ms`);
    guide.classList.add("is-cued");
  }

  function renderChangeGuide(journey, currentShape, nextShape) {
    const guide = $("changeGuide");
    if (!guide || !journey || !journey.now) return;
    const now = journey.now;
    const next = journey.next;
    const span = (shape) => shape && shape.placements && shape.placements.length
      ? `frets ${Math.min(...shape.placements.map((placement) => placement.fret))}–${Math.max(...shape.placements.map((placement) => placement.fret))}` : "hear the chord";
    const nowDetail = currentShape && (currentShape.inversionName || currentShape.label) || span(currentShape);
    const nextDetail = nextShape && (nextShape.inversionName || nextShape.label) || span(nextShape);
    const transition = journey.transition;
    const movement = !transition ? "End" : transition.kind === "pivot" ? "role pivot" : transition.kind === "resolution" ? "resolve" : transition.kind === "loop" ? "loop home" : "voice lead";
    const held = transition ? `${transition.heldPcs.length} tone${transition.heldPcs.length === 1 ? "" : "s"} stay` : "stop and recall";
    guide.innerHTML = `<article class="change-card now"><span>Now · ${escapeHtml(journey.label)} · ${journey.cursor + 1}/${journey.items.length}</span><strong>${escapeHtml(now.functionLabel)}</strong><b>${escapeHtml(now.symbol)}${now.keyLabel ? ` · ${escapeHtml(now.keyLabel)}` : ""}</b><small>${escapeHtml(nowDetail)}</small></article>
      <div class="change-motion"><b>${escapeHtml(movement)}</b><span>→</span><small>${escapeHtml(held)}</small></div>
      <article class="change-card next"><span>Next${next && journey.transition && journey.transition.kind === "pivot" ? " · new role" : ""}</span><strong>${next ? escapeHtml(next.functionLabel) : "End"}</strong><b>${next ? `${escapeHtml(next.symbol)}${next.keyLabel ? ` · ${escapeHtml(next.keyLabel)}` : ""}` : "Loop is off"}</b><small>${next ? escapeHtml(nextDetail) : "Let the home settle"}</small></article>
      <p class="change-ear-cue"><span>Hear / think</span>${escapeHtml(transition ? transition.cue : `Let ${now.symbol} finish before you move.`)}</p>
      ${state.pickupV2 && next && isTowardIi(next.chord) ? `<p class="change-pickup">Pickup: <b>${escapeHtml(T.spell((rootPcOf(next.chord) + 7) % 12, next.chord.keyAcc || "flat"))}7</b> on beat 3 of the last bar → ${escapeHtml(next.symbol)} · the “five of two”</p>` : ""}`;
    $("journeyAnnouncement").textContent = next
      ? `Now ${now.functionLabel}, ${now.symbol}${now.keyLabel ? ` in ${now.keyLabel}` : ""}. Next ${next.functionLabel}, ${next.symbol}${next.keyLabel ? ` in ${next.keyLabel}` : ""}.`
      : `Now ${now.functionLabel}, ${now.symbol}. Next, end.`;
    animateChangeGuide();
  }

  function cycleJourney() {
    // The Changes Gym plays ii-V-I-(I) and then the old I is reinterpreted as
    // the new ii a whole step down. Keys=1 stays inside one group (the
    // on-ramp); keys=3/6 chain groups. The shared journey model owns the key
    // count so the visible look-ahead wraps on the same chord as the audio.
    const journey = HJ.buildJourney({ kind: "cycle", cycle, mode: state.gym.keys === 1 ? "iiVI" : "full", keyCount: state.gym.keys, startIndex: state.gym.anchor, index: state.index, loop: state.loop, holdI: state.holdI });
    journey.label = "Changes Gym";
    return journey;
  }

  // Six-chord look-ahead: enough context to read a complete ii–V–I and the
  // beginning of the next key without shrinking the whole 18-chord wheel into
  // illegible chips. The same journey object also drives playback.
  function renderCycleRoadmap(journey) {
    const root = $("cycleRoadmap");
    if (!root || !journey || !journey.items.length || state.cycleComping.focus !== "hear") {
      if (root) root.classList.add("hidden");
      return;
    }
    const count = Math.min(6, journey.items.length);
    const visible = Array.from({ length: count }, (_, offset) =>
      journey.items[(journey.cursor + offset) % journey.items.length]);
    root.classList.remove("hidden");
    const pair = sequenceFor("pivot", state.index);
    const oldI = cycle[pair[0]], newIi = cycle[pair[1]];
    root.innerHTML = `<header><div><span>Chord roadmap · now + next ${count - 1}</span><b>Read ahead while your hands stay on the current shape</b></div><div class="roadmap-keys"><button data-roadmap-key="-1" class="mini" aria-label="Previous key in the pivot wheel">◀</button><span><b>${escapeHtml(oldI.symbol)}</b> I of ${escapeHtml(oldI.key)} → <b>${escapeHtml(newIi.symbol)}</b> ii of ${escapeHtml(newIi.key)}</span><button data-roadmap-key="1" class="mini" aria-label="Next key in the pivot wheel">▶</button></div></header>
      <div class="cycle-roadmap-grid">${visible.map((entry, offset) => {
        const previous = offset ? visible[offset - 1] : null;
        const pivot = previous && /^i$/i.test(previous.chord.fn || "") && /^ii/i.test(entry.chord.fn || "") && previous.keyLabel !== entry.keyLabel;
        const timing = offset === 0 ? "Now" : offset === 1 ? "Next" : `+${offset}`;
        return `<button data-cycle-roadmap="${entry.sourceIndex}" class="roadmap-chord${offset === 0 ? " now" : ""}${offset === 1 ? " next" : ""}">
          <span>${timing}${pivot ? " · pivot" : ""}</span><strong>${escapeHtml(entry.functionLabel)}</strong><b>${escapeHtml(entry.symbol)}</b><small>${escapeHtml(entry.keyLabel)}${entry.durationBars > 1 ? " · 2 bars" : " · 1 bar"}</small></button>`;
      }).join("")}</div>`;
    root.querySelectorAll("[data-roadmap-key]").forEach((button) => button.onclick = () => {
      stopPlay(); cancelTaximiBridge(); stepPivotPair(+button.getAttribute("data-roadmap-key"));
    });
    root.querySelectorAll("[data-cycle-roadmap]").forEach((button) => {
      button.onclick = () => { stopPlay(); setCycleIndex(+button.getAttribute("data-cycle-roadmap")); auditionCurrent("block"); };
    });
  }

  function renderProgressionWorkoutRoadmap(entries, cursor) {
    const root = $("cycleRoadmap");
    if (!root || !entries.length) return;
    const count = Math.min(6, entries.length);
    const visible = Array.from({ length: count }, (_, offset) => entries[(cursor + offset) % entries.length]);
    root.classList.remove("hidden");
    root.innerHTML = `<header><div><span>Progression roadmap · next ${count}</span><b>Same Greek/modal route, transposed by fourths</b></div><p>Orange is sounding · turquoise is next · the key label changes only at a complete progression boundary.</p></header>
      <div class="cycle-roadmap-grid">${visible.map((entry, offset) => `<button data-cycle-workout-step="${entries.indexOf(entry)}" class="roadmap-chord${offset === 0 ? " now" : ""}${offset === 1 ? " next" : ""}">
        <span>${offset === 0 ? "Now" : offset === 1 ? "Next" : `+${offset}`} · key ${escapeHtml(entry.tonic)}</span><strong>${escapeHtml(entry.chord.degreeLabel)}</strong><b>${escapeHtml(entry.chord.symbol)}</b><small>${escapeHtml(entry.chord.phraseRole)} · ${entry.chord.durationBars} bar${entry.chord.durationBars === 1 ? "" : "s"} · ${escapeHtml(M.MODES[state.modeId].name)}</small></button>`).join("")}</div>`;
    root.querySelectorAll("[data-cycle-workout-step]").forEach((button) => button.onclick = () => {
      stopPlay(); state.cycleComping.step = +button.getAttribute("data-cycle-workout-step"); state.cycleComping.voicingIndex = 0; renderCycle(); auditionCurrent("block");
    });
  }

  // The gym's playable sequence: keys*3 chords starting at the current key
  // group, wrapping around the six-key wheel.
  function gymSequence(idx) {
    return HJ.sequenceForKeyCount(state.gym.anchor == null ? idx : state.gym.anchor, cycle, state.gym.keys);
  }

  // Progression workouts move by fourths: a standard transposition route that
  // keeps the selected Greek/modal progression intact instead of pretending
  // every map has the major ii-V-I pivot's special whole-step modulation.
  const PRACTICE_KEY_OFFSETS = [0, 5, 10, 3, 8, 1];
  function practiceTonicAt(startTonic, offset) {
    const pc = (M.parseName(startTonic).pc + offset + 12) % 12;
    return M.TONICS.find((name) => M.parseName(name).pc === pc) || startTonic;
  }
  function cycleCompingEntries() {
    const count = Math.max(1, Math.min(state.gym.keys, PRACTICE_KEY_OFFSETS.length));
    const entries = [];
    PRACTICE_KEY_OFFSETS.slice(0, count).forEach((offset, keyIndex) => {
      const tonic = practiceTonicAt(state.tonic, offset);
      const built = M.buildProgression(tonic, state.modeId, state.progId);
      built.chords.forEach((chord, chordIndex) => entries.push({
        keyIndex, chordIndex, tonic,
        chord: Object.assign({}, chord, { key: tonic })
      }));
    });
    return entries;
  }

  function songJourney(chords, step) {
    return HJ.buildJourney({ kind: "song", chords, step, loop: state.loop, holdI: state.holdI });
  }

  // ============================ CYCLE VIEW ===============================
  function sequenceFor(mode, idx) {
    return HJ.sequenceForCycle(mode, idx, cycle);
  }
  const prevIndex = (i) => (i - 1 + N) % N;

  function fourNoteCompVoicing(chord) {
    if (chord.notes.length >= 4) return chord.notes.slice(0, 4);
    const root = chordTone(chord, "R");
    const third = chordTone(chord, "3") || chordTone(chord, "b3");
    const fifth = chordTone(chord, "5") || chordTone(chord, "b5") || chordTone(chord, "#5");
    return [root, fifth, Object.assign({}, root), third].filter(Boolean);
  }

  function compactFourVoicings(chord) {
    const seen = new Set();
    return [0, 2, 3, 5, 7, 9, 12, 15].map((position) => {
      const grip = FB.findGrip(fourNoteCompVoicing(chord), position);
      if (!grip || grip.placements.some((placement) => placement.fret > 15)) return null;
      const key = grip.placements.map((placement) => `${placement.stringIndex}:${placement.fret}`).join(",");
      if (seen.has(key)) return null;
      seen.add(key);
      return Object.assign({ label: `Compact 4 · fret ${grip.lowFret}`, family: "compact four" }, grip);
    }).filter(Boolean);
  }

  function cycleChordVoicings(chord) {
    const kind = state.cycleComping.kind;
    // Six-string CAGED/barre forms are useful on guitar, but they are not a
    // valid visual answer for a three- or four-course instrument. Bouzouki and
    // laouto use a course-safe four-note search instead of silently drawing a
    // guitar grip with impossible string indexes.
    if (kind === "full") {
      const isGuitar = /^guitar/.test(window.Tuning.currentId());
      return isGuitar && GV ? GV.fullVoicings(chord) : compactFourVoicings(chord);
    }
    if (kind === "triad") {
      const triadId = TR.TRIAD_OF[chord.quality] || "maj";
      return TR.allShapes(chord.rootPc, triadId, spellPc)
        .filter((shape) => shape.placements.every((placement) => placement.fret <= 15))
        .map((shape) => Object.assign({}, shape, { label: `${shape.inversionShort} triad · fret ${shape.lowFret}`, family: "triad" }));
    }
    return compactFourVoicings(chord);
  }

  function renderCycleCompingControls() {
    const root = $("cycleCompingControls");
    const c = state.cycleComping;
    root.classList.toggle("hidden", c.focus !== "chords");
    if (c.focus !== "chords") { root.innerHTML = ""; return; }
    const mode = M.MODES[state.modeId];
    const progressions = M.PROGRESSIONS[state.modeId];
    const { prog } = currentProgression();
    const entries = cycleCompingEntries();
    const chords = entries.map((entry) => entry.chord);
    c.step = Math.min(c.step, chords.length - 1);
    const entry = entries[c.step];
    const chord = entry.chord;
    const voicings = cycleChordVoicings(chord);
    c.voicingIndex = Math.min(c.voicingIndex, Math.max(0, voicings.length - 1));
    const isGuitar = /^guitar/.test(window.Tuning.currentId());
    const kindCopy = {
      full: isGuitar ? ["Full 6", "open + E/A-family"] : ["Course-safe 4", "playable on this tuning"],
      triad: ["Triad 3", "nearest 3-string forms"],
      four: ["Compact 4", "root + colour + guide"]
    };
    root.innerHTML = `
      <p class="cycle-voicing-help"><b>Progression workout:</b> choose a key, dromos, and common route. One key learns the sound; three or six transpose the same route by fourths. The original ii–V–I wheel remains in Voice-led triad route.</p>
      <div class="cycle-workout-key"><label for="cycleWorkoutTonic">Starting key<select id="cycleWorkoutTonic">${M.TONICS.map((tonic) => `<option value="${tonic}"${tonic === state.tonic ? " selected" : ""}>${tonic}</option>`).join("")}</select></label><span>${state.gym.keys} key${state.gym.keys === 1 ? "" : "s"} · same progression</span></div>
      <span class="panel-label">Dromos · ${mode.name} ${mode.greek}</span>
      <div class="cycle-mode-grid">${M.MODE_ORDER.map((modeId) => `<button data-cycle-chord-mode="${modeId}" class="${modeId === state.modeId ? "active" : ""}">${M.MODES[modeId].name}</button>`).join("")}</div>
      <div class="cycle-progression-list">${progressions.map((item) => `<button data-cycle-prog="${item.id}" class="${item.id === prog.id ? "active" : ""}"><b>${item.label}</b><span>${item.tag}</span></button>`).join("")}</div>
      <p class="cycle-voicing-help"><b>Why this route:</b> ${escapeHtml(prog.why)}</p>
      <div class="cycle-key-route" aria-label="Progression transposition route">${Array.from(new Set(entries.map((item) => item.tonic))).map((tonic, keyIndex) => `<button data-cycle-workout-key="${keyIndex}" class="${keyIndex === entry.keyIndex ? "active" : ""}"><i>${keyIndex + 1}</i><b>${tonic}</b><span>${escapeHtml(prog.label)}</span></button>`).join("")}</div>
      <span class="panel-label">Voicing weight</span>
      <div class="cycle-voice-kinds">${Object.entries(kindCopy).map(([id, [label, detail]]) => `<button data-cycle-voice-kind="${id}" class="${id === c.kind ? "active" : ""}"><b>${label}</b><span>${detail}</span></button>`).join("")}</div>
      <div class="cycle-chord-steps">${entries.map((item, index) => `<button data-cycle-chord-step="${index}" class="${index === c.step ? "active" : ""}"><i>${item.chord.degreeLabel}</i><b>${item.chord.symbol}</b><span>${item.tonic}</span></button>`).join("<span class=\"pchip-arrow\">→</span>")}</div>
      ${voicings.length ? `<div class="cycle-voicing-options">${voicings.map((item, index) => `<button data-cycle-voicing="${index}" class="${index === c.voicingIndex ? "active" : ""}"><b>${item.label}</b><span>${item.family} · frets ${item.lowFret}–${item.highFret || Math.max(...item.placements.map((placement) => placement.fret))}</span></button>`).join("")}</div>` : `<p class="cycle-voicing-help"><b>No six-string full form is defined for ${chord.symbol}.</b> Use Compact 4: it keeps the chord's defining tones without inventing an awkward barre.</p>`}
      <p class="cycle-voicing-help">Hear/think: roots locate the chord, 3rds name major or minor colour, and 7ths carry dominant pull. Prefer the smallest useful move; a full shape is an option, not a requirement.</p>`;
    $("cycleWorkoutTonic").onchange = (event) => {
      stopPlay(); state.tonic = event.target.value; c.step = 0; c.voicingIndex = 0; persistPreferences(); renderCycle();
    };
    root.querySelectorAll("[data-cycle-chord-mode]").forEach((button) => button.onclick = () => {
      stopPlay(); state.modeId = button.getAttribute("data-cycle-chord-mode"); state.progId = M.PROGRESSIONS[state.modeId][0].id;
      state.progStep = 0; c.step = 0; c.voicingIndex = 0; renderCycle();
    });
    root.querySelectorAll("[data-cycle-prog]").forEach((button) => button.onclick = () => {
      stopPlay(); state.progId = button.getAttribute("data-cycle-prog"); state.progStep = 0; c.step = 0; c.voicingIndex = 0; renderCycle();
    });
    root.querySelectorAll("[data-cycle-workout-key]").forEach((button) => button.onclick = () => {
      stopPlay();
      const keyIndex = +button.getAttribute("data-cycle-workout-key");
      const target = entries.findIndex((item) => item.keyIndex === keyIndex);
      c.step = Math.max(0, target); c.voicingIndex = 0; renderCycle(); auditionCurrent("block");
    });
    root.querySelectorAll("[data-cycle-voice-kind]").forEach((button) => button.onclick = () => {
      stopPlay(); c.kind = button.getAttribute("data-cycle-voice-kind"); c.voicingIndex = 0; renderCycle();
    });
    root.querySelectorAll("[data-cycle-chord-step]").forEach((button) => button.onclick = () => {
      stopPlay(); c.step = +button.getAttribute("data-cycle-chord-step"); c.voicingIndex = 0; renderCycle();
    });
    root.querySelectorAll("[data-cycle-voicing]").forEach((button) => button.onclick = () => {
      stopPlay(); c.voicingIndex = +button.getAttribute("data-cycle-voicing"); renderCycle();
    });
  }

  function syncCyclePathControls() {
    const c = state.cycleComping;
    const root = $("cyclePathControls");
    root.classList.toggle("hidden", c.focus !== "hear");
    if (c.focus !== "hear") return;
    const sets = TR.stringSets3();
    const names = window.Tuning.names();
    const automatic = Math.max(0, window.Tuning.count() - 3);
    if (c.stringSet != null && !sets.some((set) => set[0] === c.stringSet)) c.stringSet = null;
    $("cycleSetSel").innerHTML = `<option value="">Auto · ${names.slice(automatic, automatic + 3).join("–")}</option>` +
      sets.slice().reverse().map((set) => `<option value="${set[0]}"${c.stringSet === set[0] ? " selected" : ""}>${names.slice(set[0], set[0] + 3).join("–")}</option>`).join("");
    $("cycleZoneSel").innerHTML = Object.values(TR.POSITION_ZONES).map((zone) =>
      `<option value="${zone.id}"${c.zone === zone.id ? " selected" : ""}>${zone.label}</option>`).join("");
    $("cycleSetSel").onchange = (event) => {
      stopPlay(); c.stringSet = event.target.value === "" ? null : +event.target.value; renderCycle();
    };
    $("cycleZoneSel").onchange = (event) => {
      stopPlay(); c.zone = event.target.value; persistPreferences(); renderCycle();
    };
  }

  function cycleTriadPath() {
    return TR.pathThrough(cycle, {
      stringSet: state.cycleComping.stringSet,
      zone: state.cycleComping.zone,
      closeLoop: true,
      nameFor: (pc) => T.spell(pc, cycle[state.index].keyAcc)
    });
  }

  function shapeAudioNotes(shape) {
    const open = window.Tuning.open();
    return shape.placements.map((placement) => {
      const midi = placement.midi == null ? open[placement.stringIndex] + placement.fret : placement.midi;
      return { midi, freq: 440 * Math.pow(2, (midi - 69) / 12) };
    });
  }

  function renderCycleTriadRoute() {
    const path = cycleTriadPath();
    const cur = path[state.index];
    const previous = path[prevIndex(state.index)];
    const journey = cycleJourney();
    const nextShape = journey.next ? path[journey.next.sourceIndex] : null;
    if (!cur || !previous) return;
    const moveClass = cur.placements.map((placement, index) =>
      placement.midi === previous.placements[index].midi ? "held" : "moved");
    FB.render(svg(), {
      grip: { placements: cur.placements },
      nextGrip: nextShape ? { placements: nextShape.placements } : null,
      labelMode: state.labelMode,
      lefty: state.lefty,
      moveClass
    });
    svg().setAttribute("aria-label", `${window.Tuning.current().name} ${cur.setLabel} triad route for ${cur.chord.symbol}`);

    const metrics = TR.pathMetrics(path, true);
    const move = TR.pathMetrics([previous, cur], false).moves[0];
    const chordColour = cur.chord.notes.find((note) => note.role === "7" || note.role === "b7");
    const pathStats = $("cyclePathStats");
    pathStats.innerHTML = `<span><b>${path.length}</b> shapes</span><span><b>${metrics.averagePerVoice.toFixed(1)}</b> semitones / voice</span><span><b>${cur.setLabel}</b> fixed strings</span>`;
    const notes = cur.placements.slice().reverse().map((placement, reverseIndex) => {
      const originalIndex = cur.placements.length - 1 - reverseIndex;
      const cls = moveClass[originalIndex];
      return `<div class="note-chip ${cls}" data-group="${placement.note.colorGroup}">
        <span class="chip-role">${placement.note.roleLabel}</span>
        <span class="chip-name">${placement.note.name}</span>
        <span class="chip-tag">string ${window.Tuning.names()[placement.stringIndex]} · fret ${placement.fret}${cls === "held" ? " · hold" : ""}</span>
      </div>`;
    }).join("");
    $("readout").innerHTML = `<div class="ro-head">
      <span class="fn-badge ${cur.chord.fn === "ii" ? "fn-ii" : cur.chord.fn === "V" ? "fn-v" : "fn-i"}">${cur.chord.fn}</span>
      <span class="ro-symbol">${cur.chord.symbol}</span>
      <span class="ro-key">play ${cur.triadName} triad · ${cur.inversionName}</span>
    </div>
    <div class="tri-tags"><span class="tri-set">${cur.setLabel} strings</span><span class="tri-fret">frets ${cur.lowFret}–${Math.max(...cur.placements.map((placement) => placement.fret))}</span></div>
    <div class="tri-move"><b>${move ? move.voices.filter((distance) => distance > 0).length : 0}</b> voices move · <b>${move ? move.total : 0}</b> semitones total from ${previous.chord.symbol}</div>
    <div class="ro-notes">${notes}</div>
    <div class="ro-foot"><b>Think ${cur.chord.symbol}, play its triad skeleton</b> — keep the top line singable.</div>`;

    renderChangeGuide(journey, cur, nextShape);
    renderCycleRoadmap(journey);
    const pivotPair = sequenceFor("pivot", state.index);
    if (state.index === pivotPair[0]) {
      // The banner fires only when the CURRENT chord is the pivot - the I
      // that is about to become the next key's ii. On every other chord it
      // was noise firing at the wrong moment.
      const pair = pivotPair;
      const oldI = cycle[pair[0]], newIi = cycle[pair[1]];
      const oldThird = chordTone(oldI, "3");
      const newThird = chordTone(newIi, "b3");
      $("pivotBanner").innerHTML = state.gym.bridging
        ? $("pivotBanner").innerHTML
        : `<b>Same chord, new job.</b> Its 3rd drops one fret${oldThird && newThird ? ` (${escapeHtml(oldThird.name)} → ${escapeHtml(newThird.name)})` : ""} and your I becomes the next key's ii: <b>${oldI.symbol}</b> (I of ${oldI.key}) → <b>${newIi.symbol}</b> (ii of ${newIi.key}), a whole step down.`;
      $("pivotBanner").classList.add("show");
    } else {
      // The shared guide describes the forward transition. Do not add a second
      // banner about the chord we just left; past/future messages compete at the
      // exact moment a learner needs one clear destination.
      $("pivotBanner").classList.remove("show");
    }
    pulseMoved();
  }

  function renderCycleComping() {
    const entries = cycleCompingEntries();
    const chords = entries.map((entry) => entry.chord);
    const c = state.cycleComping;
    c.step = Math.min(c.step, Math.max(0, chords.length - 1));
    const chord = chords[Math.min(c.step, chords.length - 1)];
    const journey = songJourney(chords, c.step);
    journey.label = "Progression workout";
    const voicings = cycleChordVoicings(chord);
    const voicing = voicings[c.voicingIndex];
    const nextVoicings = journey.next ? cycleChordVoicings(journey.next.chord) : [];
    const nextVoicing = nextVoicings.length ? nextVoicings[Math.min(c.voicingIndex, nextVoicings.length - 1)] : null;
    if (!voicing) {
      FB.render(svg(), { labelMode: state.labelMode, lefty: state.lefty });
      $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${chord.degreeLabel}</span><span class="ro-symbol">${chord.symbol}</span></div><div class="ro-foot">Full/open forms are a guitar-specific vocabulary. Switch to guitar for six-string forms, or choose Compact 4 for a playable chord-tone set on this tuning.</div>`;
      renderChangeGuide(journey, null, nextVoicing);
      renderProgressionWorkoutRoadmap(entries, c.step);
      return;
    }
    FB.render(svg(), { grip: { placements: voicing.placements }, nextGrip: nextVoicing ? { placements: nextVoicing.placements } : null, labelMode: state.labelMode, lefty: state.lefty, flavourPcs: M.flavourPcs(state.tonic, state.modeId) });
    svg().setAttribute("aria-label", `${window.Tuning.current().name} ${voicing.label} for ${chord.symbol} in key ${entries[c.step].tonic}`);
    const tones = voicing.placements.slice().reverse().map((placement) => `<div class="note-chip held" data-group="${placement.note.colorGroup}"><span class="chip-role">${placement.note.roleLabel}</span><span class="chip-name">${placement.note.name}</span><span class="chip-tag">fret ${placement.fret}</span></div>`).join("");
    $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${chord.degreeLabel}</span><span class="ro-symbol">${chord.symbol}</span><span class="ro-key">key ${entries[c.step].tonic} · ${voicing.label}</span></div><div class="tri-tags"><span class="tri-set">${voicing.family}</span><span class="tri-fret">frets ${voicing.lowFret}–${voicing.highFret || Math.max(...voicing.placements.map((placement) => placement.fret))}</span></div><div class="ro-notes">${tones}</div><div class="ro-foot">Play the lowest note as a bass cue, then listen for the 3rd${chord.notes.some((note) => note.role === "7" || note.role === "b7") ? " and 7th" : ""}. Finish the complete route before the next key begins; its Roman numerals stay the same while every chord name moves.</div>`;
    renderChangeGuide(journey, voicing, nextVoicing);
    renderProgressionWorkoutRoadmap(entries, c.step);
  }

  function renderCycle() {
    document.querySelectorAll("[data-cycle-focus]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-cycle-focus") === state.cycleComping.focus));
    syncGymControls();
    syncCyclePathControls();
    renderCycleCompingControls();
    if (state.cycleComping.focus === "chords") { $("pivotBanner").classList.remove("show"); renderCycleComping(); return; }
    renderCycleTriadRoute();
  }


  function stepCycle(delta) {
    const seq = gymSequence(state.index);
    let pos = seq.indexOf(state.index); if (pos < 0) pos = 0;
    setCycleIndex(seq[(pos + delta + seq.length) % seq.length]);
  }
  function stepCycleComping(delta) {
    const chords = cycleCompingEntries();
    const c = state.cycleComping;
    c.step = (c.step + delta + chords.length) % chords.length;
    c.voicingIndex = 0;
    renderCycle();
  }
  function setCycleIndex(i) { state.index = ((i % N) + N) % N; renderCycle(); }

  function stepPivotPair(delta) {
    const pair = sequenceFor("pivot", state.index);
    state.index = (pair[0] + delta * 3 + N) % N;
    state.gym.anchor = state.index;
    renderCycle();
  }

  // ============================ SONGS ===================================
  // A repertoire chart, written the way a band writes one: sections, bars,
  // chords. The app adds what a paper chart cannot — send the song's own
  // chord vocabulary to the analyzer, or open the Solo map in its home key.
  function renderSongs() {
    if (!SL) return;
    const list = $("songList");
    if (list) {
      list.innerHTML = SL.SONGS.map((song) => {
        const open = song.id === state.songs.openId;
        return `<button data-song="${escapeHtml(song.id)}" class="song-card${open ? " active" : ""}" aria-pressed="${open}">
          <b>${escapeHtml(song.title)}</b>
          <i>${escapeHtml(song.titleGreek || "")}</i>
          <span>${escapeHtml(song.home)} · ${escapeHtml(song.meter)} · ${escapeHtml(song.feel || "")}${song.arrangement ? " · " + escapeHtml(song.arrangement) : ""}</span>
        </button>`;
      }).join("");
      list.querySelectorAll("[data-song]").forEach((b) => b.onclick = () => {
        state.songs.openId = b.getAttribute("data-song");
        renderSongs();
      });
    }
    renderSongChart();
  }

  // Which dromos explains this chart best? Computed, never asserted: run the
  // song's own chord vocabulary through the analyzer in every dromos and
  // count how many chords the mode can name. A chord the mode cannot name is
  // reported as chromatic — that count IS the evidence.
  function dromosFit(song) {
    if (!A || !SL) return [];
    const map = SL.chordMap(song);
    return M.MODE_ORDER.map((modeId) => {
      let named = 0, total = 0;
      try {
        const result = A.analyzeProgression(map, { tonic: song.home, modeId });
        (result.records || []).forEach((record) => {
          total += 1;
          if (record.degree && record.degree.label) named += 1;
        });
      } catch (error) { return null; }
      return { modeId, name: M.MODES[modeId].name, named, total, chromatic: total - named };
    }).filter(Boolean).sort((a, b) => b.named - a.named);
  }

  function fitHtml(song) {
    const fit = dromosFit(song);
    if (!fit.length) return "";
    const best = fit[0];
    return `<div class="song-fit">
      <span>Which dromos explains this chart?</span>
      ${fit.map((f) => `<b class="${f.modeId === best.modeId ? "best" : ""}">
        ${escapeHtml(f.name)}<i>${f.named}/${f.total}</i></b>`).join("")}
      <em>Counted by running the song's own chords through the analyzer: how many can each dromos name, and how many stay chromatic. ${escapeHtml(best.name)} names the most here — the evidence, not a verdict.</em>
    </div>`;
  }

  function barHtml(bar) {
    if (bar.kind === "break") return `<span class="song-break" aria-hidden="true"></span>`;
    if (bar.kind === "hold") return `<span class="song-bar held"><em>%</em><span class="song-slashes">/ / / /</span></span>`;
    const chords = bar.chords.map((c) =>
      `<b class="${c.stab ? "stab" : ""}">${escapeHtml(c.label)}${c.stab ? "<u>!</u>" : ""}</b>`).join("");
    return `<span class="song-bar${bar.accent ? " accent" : ""}">
      <span class="song-bar-chords">${chords}</span>
      <span class="song-slashes">/ / / /</span></span>`;
  }

  function renderSongChart() {
    const root = $("songChart");
    if (!root || !SL) return;
    const song = SL.byId(state.songs.openId) || SL.SONGS[0];
    if (!song) { root.innerHTML = ""; return; }
    const tab = state.songs.tab;
    const hasLyrics = (song.lyricSections || []).length > 0;

    const chartHtml = song.sections.map((section) => `
      <section class="song-section">
        <header><b>${escapeHtml(section.name)}</b>${section.repeat ? `<i>${escapeHtml(section.repeat)}</i>` : ""}</header>
        ${section.lines.map((line) => `<div class="song-line">${line.map(barHtml).join("")}</div>`).join("")}
        ${section.alternates ? `<p class="song-alt">${escapeHtml(section.alternates)}</p>` : ""}
        ${section.cue ? `<p class="song-cue">→ ${escapeHtml(section.cue)}</p>` : ""}
      </section>`).join("");

    const lyricsHtml = (song.lyricSections || []).map((section) => `
      <section class="song-section">
        <header><b>${escapeHtml(section.name)}</b></header>
        ${section.lines.map((line) => `<div class="lyric-line">${line.map((seg) => `
          <span class="lyric-seg">
            <b class="${seg.stab ? "stab" : ""}">${seg.chord ? escapeHtml(seg.chord) : ""}</b>
            <span>${escapeHtml(seg.text)}</span>
          </span>`).join("")}</div>`).join("")}
      </section>`).join("");

    root.innerHTML = `
      <header class="song-head">
        <div>
          <b>${escapeHtml(song.title)}</b>
          <span>${escapeHtml(song.titleGreek || "")}${song.composer ? " · " + escapeHtml(song.composer) : ""}</span>
        </div>
        <div class="song-meta">
          <span>${escapeHtml(song.home)}</span><span>${escapeHtml(song.meter)}</span>
          <span>${escapeHtml(song.feel || "")}</span><span>${SL.barCount(song)} bars</span>
        </div>
      </header>
      <p class="song-note">${escapeHtml(song.note || "")}</p>
      ${fitHtml(song)}
      <div class="song-tabs" role="tablist">
        <button role="tab" data-song-tab="chart" aria-selected="${tab === "chart"}" class="${tab === "chart" ? "active" : ""}">Chart</button>
        ${hasLyrics ? `<button role="tab" data-song-tab="lyrics" aria-selected="${tab === "lyrics"}" class="${tab === "lyrics" ? "active" : ""}">Lyrics</button>` : ""}
        <span class="song-actions">
          <button data-song-analyze>Analyze these changes</button>
          <button data-song-solo>Solo in ${escapeHtml(song.home)}</button>
        </span>
      </div>
      <div class="song-body">${tab === "lyrics" && hasLyrics ? lyricsHtml : chartHtml}</div>
      <footer class="song-credit">${escapeHtml(song.credit || "")}</footer>`;

    root.querySelectorAll("[data-song-tab]").forEach((b) => b.onclick = () => {
      state.songs.tab = b.getAttribute("data-song-tab");
      renderSongChart();
    });
    const analyze = root.querySelector("[data-song-analyze]");
    if (analyze) analyze.onclick = () => {
      // Hand the analyzer the song's OWN chord vocabulary — no invented map.
      const field = $("analysisChords");
      if (field) field.value = SL.chordMap(song);
      state.analysis.tonic = song.home;
      const best = dromosFit(song)[0];
      if (best) state.analysis.modeId = best.modeId;
      setView("analyze");
      syncAnalysisControls();
      const run = $("btnAnalyze");
      if (run) run.click();
    };
    const solo = root.querySelector("[data-song-solo]");
    if (solo) solo.onclick = () => {
      state.tonic = song.home;
      setView("solo");
    };
  }

  // ========================= PROGRESSION VIEW ============================
  function currentProgression() {
    return M.buildProgression(state.tonic, state.modeId, state.progId);
  }

  // "Moved" and "held" are claims about a change the player just heard. On the
  // first paint of a map, step 0's predecessor is the last bar of a loop that
  // has not sounded yet, so the colouring would describe motion nobody made.
  // The claim unlocks once the player actually moves inside THIS map; any new
  // map (from this page, the coach, Ear, Examples…) invalidates it by key.
  let progMotionKey = null;
  function progMapKey() { return state.modeId + "/" + state.progId; }
  function markProgMoved() { progMotionKey = progMapKey(); }

  function renderProg() {
    const { prog, chords } = currentProgression();
    const idx = Math.min(state.progStep, chords.length - 1);
    const cur = chords[idx];
    const prev = chords[(idx - 1 + chords.length) % chords.length];
    const journey = songJourney(chords, idx);
    const nextChord = journey.next ? journey.next.chord : null;
    const nextGrip = nextChord ? FB.findGrip(nextChord.notes, state.position) : null;
    const moveClass = progMotionKey === progMapKey()
      ? cur.notes.map((n) => prev.notes.some((p) => p.pc === n.pc) ? "held" : "moved")
      : cur.notes.map(() => "");

    const scale = M.scaleOf(state.tonic, state.modeId);
    drawChord(cur.notes, moveClass, {
      nextGrip,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      scaleNotes: state.scaleOverlay ? scale : null
    });

    const mode = M.MODES[state.modeId];
    renderChordReadout(cur.symbol, cur.degreeLabel, mode.name + " on " + state.tonic,
      cur.notes, moveClass, prog.why);

    // Song map strip — one chip per bar, so a held tonic shows its second bar
    // explicitly (ii · V · I · I) instead of hiding it in the audio. The held
    // bar is a TAIL on the same chip, never a second chord: it repeats neither
    // the numeral nor the name, and it carries its own step attribute so the
    // playback cursor cannot light two chips for one sounding chord.
    const nextIndex = journey.next ? journey.next.sourceIndex : -1;
    $("progStrip").innerHTML = chords.map((c, i) => {
      const main = `<button class="pchip${i < idx ? " played" : ""}${i === idx ? " active" : ""}${i === nextIndex ? " is-next" : ""}" data-step="${i}">
         <span class="pchip-deg">${c.degreeLabel}</span>
         <span class="pchip-sym">${c.symbol}</span></button>`;
      const held = barsFor(c) > 1 ? `<button class="pchip-tail" data-hold-step="${i}" data-held-for="${i}" aria-label="${c.symbol} holds through a second bar">
         <span class="pchip-hold">hold</span></button>` : "";
      return `<span class="pchip-pair${i === idx ? " on" : ""}${i < idx ? " played" : ""}">${main}${held}</span>`;
    }).join('<span class="pchip-arrow">→</span>');
    $("progStrip").querySelectorAll("[data-step], [data-hold-step]").forEach((b) => {
      const step = +(b.getAttribute("data-step") || b.getAttribute("data-hold-step"));
      b.onclick = () => { markProgMoved(); state.progStep = step; renderProg(); auditionProg(); };
    });

    renderScaleStrip(scale, mode);
    renderChangeGuide(journey, FB.findGrip(cur.notes, state.position), nextGrip);
    pulseMoved();
    $("pivotBanner").classList.remove("show");
  }

  // The strip shows the selected collection only. Its old five-mode comparator
  // was a second mode switcher standing next to the seg; the signature tones it
  // compared now ride on the seg buttons themselves (see syncProgControls), so
  // one visible control writes state.modeId.
  function renderScaleStrip(scale, mode) {
    let html = `<div class="scale-head"><b>${escapeHtml(mode.name)}</b> <span class="greek">${escapeHtml(mode.greek)}</span></div><div class="scale-notes">`;
    scale.forEach((n) => {
      const cls = n.isTonic ? "tonic" : n.isFlavour ? "flavour" : "";
      html += `<span class="snote ${cls}"><b>${n.name}</b><i>${n.degree}</i></span>`;
    });
    html += `</div>`;
    $("scaleStrip").innerHTML = html;
  }

  // Signature tones for one dromos in the current key — the comparison the
  // deleted scale-strip comparator used to make, now attached to the control
  // that actually selects the mode.
  function modeSignatureTones(id) {
    const s = M.scaleOf(state.tonic, id);
    return M.MODES[id].flavour.map((off) => {
      const note = s.find((x) => x.off === off);
      return note ? note.name : "?";
    }).join(" ");
  }

  function selectMode(id) {
    stopPlay();
    state.modeId = id;
    state.progId = M.PROGRESSIONS[id][0].id;
    state.progStep = 0;
    persistPreferences();
    syncProgControls();
    if (state.view === "solo") { renderSoloMapControls(); renderSoloSection(); }
    else renderProg();
    renderPageGuide();
  }

  function syncProgControls() {
    document.querySelectorAll("[data-modeid]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-modeid") === state.modeId));
    // One mode control: each choice shows its own signature tones in the
    // current key, and the selected map's documented note sits under the seg
    // instead of a standing explainer paragraph.
    document.querySelectorAll("#panelProg [data-modeid]").forEach((b) => {
      const id = b.getAttribute("data-modeid");
      const mode = M.MODES[id];
      if (!mode) return;
      b.innerHTML = `<b>${escapeHtml(mode.name)}</b><small>${escapeHtml(modeSignatureTones(id))}</small>`;
      b.title = `Signature tones: ${mode.signature}`;
    });
    const note = $("progModeNote");
    if (note) note.textContent = M.MODES[state.modeId] ? M.MODES[state.modeId].blurb : "";
    const list = M.PROGRESSIONS[state.modeId];
    const tiers = [];
    list.forEach((progression) => {
      const tierName = progression.tier || "Practice maps";
      let tier = tiers.find((item) => item.name === tierName);
      if (!tier) { tier = { name: tierName, jobs: [] }; tiers.push(tier); }
      const jobName = progression.group || "Core maps";
      let job = tier.jobs.find((item) => item.name === jobName);
      if (!job) { job = { name: jobName, items: [] }; tier.jobs.push(job); }
      job.items.push(progression);
    });
    // A heading is only worth its space when it groups more than one choice.
    // The major bank framed four cards with EIGHT heading elements. A tier of
    // one or two maps loses its header, and so does a job holding a single
    // map; the collapsed names ride on the card, so the documented historical
    // layering is never lost - only its chrome.
    $("progList").innerHTML = tiers.map((tier) => {
      const count = tier.jobs.reduce((total, job) => total + job.items.length, 0);
      const flat = count <= 2;
      return `<section class="progression-tier">
      ${flat ? "" : `<header><span>Layer</span><h3>${tier.name}</h3></header>`}
      ${tier.jobs.map((job) => {
        const jobHeader = !flat && tier.jobs.length > 1 && job.items.length > 1;
        const caption = [flat ? tier.name : "", jobHeader ? "" : job.name].filter(Boolean).join(" · ");
        return `<div class="progression-job">${jobHeader ? `<h4>${job.name}</h4>` : ""}
      ${job.items.map((progression) => {
        const symbols = M.buildProgression(state.tonic, state.modeId, progression.id).chords.map((chord) => chord.symbol).join(" → ");
        return `<button class="prog-item${progression.id === state.progId ? " active" : ""}" data-prog="${progression.id}">
          <span class="prog-function"><b>${progression.label}</b><i>${progression.tag}</i></span>
          <span class="prog-symbols">${symbols}</span>
          ${caption ? `<span class="prog-layer">${escapeHtml(caption)}</span>` : ""}
          <span class="prog-why">${progression.why}</span></button>`;
      }).join("")}</div>`;
      }).join("")}
    </section>`;
    }).join("");
    $("progList").querySelectorAll("[data-prog]").forEach((b) => {
      b.onclick = () => {
        stopPlay();
        state.progId = b.getAttribute("data-prog"); state.progStep = 0;
        persistPreferences();
        syncProgControls(); renderProg(); auditionProg();
      };
    });
  }

  // ======================= HARMONY MATRIX ==============================
  function chordMapShapes(chord) {
    const preferred = state.position == null ? 5 : state.position;
    return TR.allShapes(chord.rootPc, TR.TRIAD_OF[chord.quality] || chord.quality, spellPc)
      .filter((shape) => shape.placements.every((placement) => placement.fret <= 15))
      .sort((a, b) => Math.abs(a.lowFret - preferred) - Math.abs(b.lowFret - preferred) || a.lowFret - b.lowFret);
  }

  function chordMapVoicings(chord) {
    const triads = chordMapShapes(chord);
    const full = GV ? GV.fullVoicings(chord) : [];
    const compact = FB.findGrip(chord.notes, state.position);
    const choices = [];
    if (state.chordMap.depth === "triad") {
      triads.forEach((shape) => choices.push({
        kind: "triad", shape,
        label: `${shape.inversionName} · ${shape.setLabel}`,
        detail: `frets ${shape.lowFret}–${Math.max(...shape.placements.map((placement) => placement.fret))}`
      }));
      full.forEach((shape) => choices.push({
        kind: "full", shape,
        label: shape.label,
        detail: `${shape.family} · frets ${shape.lowFret}–${shape.highFret}`
      }));
    } else {
      if (compact) choices.push({
        kind: "compact", shape: compact,
        label: "Compact four-note grip",
        detail: `frets ${Math.min(...compact.placements.map((placement) => placement.fret))}–${Math.max(...compact.placements.map((placement) => placement.fret))}`
      });
      full.forEach((shape) => choices.push({
        kind: "full", shape,
        label: shape.label,
        detail: `${shape.family} · frets ${shape.lowFret}–${shape.highFret}`
      }));
    }
    if (!choices.length && compact) choices.push({ kind: "compact", shape: compact, label: "Compact grip", detail: "Auto-positioned" });
    return { triads, choices };
  }

  function currentChordMapSelection() {
    const chords = CM.harmonize(state.tonic, state.modeId, state.chordMap.depth);
    state.chordMap.degree = Math.max(0, Math.min(6, state.chordMap.degree));
    const chord = chords[state.chordMap.degree];
    const voicings = chordMapVoicings(chord);
    state.chordMap.shapeIndex = voicings.choices.length ? state.chordMap.shapeIndex % voicings.choices.length : 0;
    const choice = voicings.choices[state.chordMap.shapeIndex] || null;
    return {
      chords, chord,
      shapes: voicings.choices.map((item) => item.shape),
      triadShapes: voicings.triads,
      voicings: voicings.choices,
      voicing: choice,
      shape: choice ? choice.shape : FB.findGrip(chord.notes, state.position)
    };
  }

  function auditionChordMap(style) {
    const selected = currentChordMapSelection();
    const notes = selected.shape && selected.shape.placements ? shapeAudioNotes(selected.shape) : selected.chord.notes;
    AU.playChord(notes, style || "strum", undefined, chordReferenceVoice());
  }

  function selectChordMapDegree(index, shouldPlay) {
    stopPlay();
    state.chordMap.degree = Math.max(0, Math.min(6, Number(index) || 0));
    state.chordMap.targetIndex = 1;
    state.chordMap.shapeIndex = 0;
    renderChordMap();
    if (shouldPlay !== false) auditionChordMap("strum");
  }

  function revealChordPath() {
    const path = $("matrixChordPath");
    if (!path) return;
    const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    path.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "nearest" });
  }

  function renderChordMapRoad() {
    const lanes = CM.road(state.tonic, state.modeId);
    const laneHtml = (label, notes) => `<div class="chord-road-lane"><span>${label}</span><div>${notes.map((note, index) => {
      const degree = lanes.scale.findIndex((scaleNote) => scaleNote.pc === note.pc);
      return `<button data-chord-degree="${Math.max(0, degree)}" class="road-note${degree === state.chordMap.degree ? " active" : ""}${note.isFlavour ? " flavour" : ""}"><b>${escapeHtml(note.degree)}</b><strong>${escapeHtml(note.name)}</strong></button>${note.gap != null ? `<i aria-label="${note.gap} semitone${note.gap === 1 ? "" : "s"}"><span>${escapeHtml(note.gapLabel)}</span><small>step</small></i>` : ""}`;
    }).join("")}</div></div>`;
    $("chordMapRoad").innerHTML = laneHtml("Lower road · 1–4", lanes.lower) + laneHtml("Upper road · 5–8", lanes.upper);
  }

  function matrixProgressionChords(modeId, progression) {
    return CP.progressionChords(state.tonic, modeId, progression, state.chordMap.depth);
  }

  function matrixProgressionCopy(modeId, progression) {
    const symbols = matrixProgressionChords(modeId, progression).map((chord) => chord.symbol).join(" → ");
    return { symbols, label: progression.label, why: progression.why, group: progression.group || "Working route" };
  }

  function chordPathLocation(notes, shape) {
    const placements = shape && shape.placements ? notes.map((note) =>
      shape.placements.find((placement) => placement.note.role === note.role) ||
      shape.placements.find((placement) => placement.note.pc === note.pc)) : [];
    if (placements.length === notes.length && placements.every(Boolean)) {
      return {
        placements,
        label: placements.map((placement) => `${window.Tuning.names()[placement.stringIndex]}${placement.fret}`).join(" → ")
      };
    }
    const path = CP.instrumentPath(notes);
    return path ? { placements: path.placements, label: `${path.course} course · frets ${path.frets.join(" → ")}` } : { placements: [], label: "Hear first; locate near the selected grip." };
  }

  function chordPathNoteRun(notes) {
    return notes.map((note) => `<span data-group="${escapeHtml(note.colorGroup || "root")}"><i>${escapeHtml(note.roleLabel || note.degree || "·")}</i><b>${escapeHtml(note.name)}</b></span>`).join("");
  }

  function renderChordPathPlay(selected) {
    return `<div class="chord-path-copy"><b>See the same harmony in every practical place.</b><span>The selected ${selected.voicing ? selected.voicing.kind : "compact"} form is solid on the full neck. Choose another card to move the grip without changing the chord.</span></div>
      <div class="chord-shape-rail" aria-label="Playable ${escapeHtml(selected.chord.symbol)} voicings">${selected.voicings.map((item, index) => {
        const roles = item.shape.placements.map((placement) => placement.note.roleLabel).join(" · ");
        const locations = item.shape.placements.map((placement) => `${window.Tuning.names()[placement.stringIndex]}${placement.fret}`).join(" · ");
        return `<button data-chord-path-shape="${index}" class="${index === state.chordMap.shapeIndex ? "active" : ""}"><i>${escapeHtml(item.kind === "full" ? "Full chord" : item.kind === "compact" ? "Four notes" : "Triad")}</i><b>${escapeHtml(item.label)}</b><span>${escapeHtml(item.detail)}</span><small>${escapeHtml(roles)} · ${escapeHtml(locations)}</small></button>`;
      }).join("")}</div>
      <p class="chord-path-honesty">Instrument-relative: every displayed fret comes from ${escapeHtml(window.Tuning.current().name)} and stays at or below fret 15. Full guitar forms appear only when the validated library has one; other instruments use tuning-derived grips.</p>`;
  }

  function renderChordPathOutline(selected, model) {
    const extension = model.extension;
    const extensionCopy = extension.added
      ? `${extension.chord.symbol} adds ${extension.added.roleLabel} ${extension.added.name}, derived from the selected scale.`
      : `${extension.chord.symbol} keeps R–3–5 as the foundation under the selected seventh chord.`;
    return `<div class="chord-path-copy"><b>Turn the chord shape into a melodic object.</b><span>Start with the 3rd: it tells your ear what kind of chord this is. These are technique cells—not quoted Greek phrases.</span></div>
      <div class="chord-extension-card"><div><i>Scale-locked enhancement</i><b>${escapeHtml(extension.label)} · ${escapeHtml(extension.chord.symbol)}</b><span>${escapeHtml(extensionCopy)}</span></div><button data-chord-path-extension>▶ Hear</button></div>
      <div class="chord-pattern-grid">${model.arpeggios.map((pattern, index) => {
        const location = chordPathLocation(pattern.notes, selected.shape);
        return `<button data-chord-path-arp="${index}"><i>Arpeggio cell ${index + 1}</i><b>${escapeHtml(pattern.label)}</b><span class="chord-note-run">${chordPathNoteRun(pattern.notes)}</span><small>${escapeHtml(location.label)}</small><em>${escapeHtml(pattern.intent)}</em></button>`;
      }).join("")}</div>
      <p class="chord-path-honesty">Practice sequence: sing the note names, play the cell slowly, then change its rhythm while keeping the same chord-tone order.</p>`;
  }

  function renderChordPathConnect(selected, model) {
    const target = selected.chord.notes[state.chordMap.targetIndex % selected.chord.notes.length];
    return `<div class="chord-path-copy"><b>Enter ${escapeHtml(target.roleLabel)} ${escapeHtml(target.name)} so the chord sounds intentional.</b><span>Choose the landing first. The app then finds a short single-course line using only ${escapeHtml(state.tonic)} ${escapeHtml(M.MODES[state.modeId].name)}.</span></div>
      <div class="chord-path-targets"><span>Landing tone</span>${selected.chord.notes.map((note, index) => `<button data-chord-path-target="${index}" class="${index === state.chordMap.targetIndex ? "active" : ""}" data-group="${escapeHtml(note.colorGroup)}"><i>${escapeHtml(note.roleLabel)}</i><b>${escapeHtml(note.name)}</b></button>`).join("")}</div>
      <div class="chord-pattern-grid">${model.approaches.map((pattern, index) => {
        const location = CP.instrumentPath(pattern.notes);
        const locationCopy = location ? `${location.course} course · frets ${location.frets.join(" → ")}` : "Choose the nearest course by ear.";
        return `<button data-chord-path-approach="${index}"><i>Scale-only connector</i><b>${escapeHtml(pattern.label)}</b><span class="chord-note-run">${chordPathNoteRun(pattern.notes)}</span><small>${escapeHtml(locationCopy)}</small><em>${escapeHtml(pattern.intent)}</em></button>`;
      }).join("")}</div>
      <p class="chord-path-honesty">No automatic chromatic filler: each connector stays inside the displayed fixed-fret collection. Add ornaments only after the scale-only arrival is audible and repertoire supports them.</p>`;
  }

  function successorCard(item, index) {
    const common = item.guide.common.length ? item.guide.common.map((note) => note.name).join(" · ") : "none";
    const maps = item.maps.map((map) => map.label).join(" · ");
    return `<article class="chord-route-card"><header><div><i>${escapeHtml(item.maps[0].group)}</i><b>${escapeHtml(item.chord.symbol)}</b></div><button data-chord-path-successor="${index}">▶ Hear move</button></header><p><strong>3rd thread:</strong> ${escapeHtml(item.guide.from.name)} → ${escapeHtml(item.guide.to.name)} · ${escapeHtml(item.guide.motion.label)}.</p><p><strong>Common tones:</strong> ${escapeHtml(common)}.</p><small>Verified adjacency in ${escapeHtml(maps)}.</small></article>`;
  }

  function doorCard(door, index) {
    return `<article class="chord-door-card"><header><div><i>${escapeHtml(door.kind === "pivot" ? "Same chord · new job" : door.kind === "recolour" ? "Change the colour" : "Role-change chain")}</i><b>${escapeHtml(door.label)} · ${escapeHtml(door.tonic)} ${escapeHtml(M.MODES[door.modeId].name)}</b></div><span>${door.shared}/7 shared</span></header><p>${escapeHtml(door.instruction)}</p><small>${escapeHtml(door.why)}</small><footer><button data-chord-path-door-hear="${index}">▶ Hear context</button><button data-chord-path-door-open="${index}">Open ${escapeHtml(door.targetChord.roman)} ${escapeHtml(door.targetChord.symbol)} →</button></footer></article>`;
  }

  function renderChordPathContinue(selected, model) {
    return `<div class="chord-path-copy"><b>Separate song evidence from theory doors.</b><span>“Can follow” means an exact next chord in the app’s verified maps. A door shows a defensible way to re-hear or recolour the chord; it does not claim that a song has modulated.</span></div>
      <div class="chord-continue-grid"><section><h4>Likely next · inside this scale</h4><div class="chord-route-list">${model.successors.length ? model.successors.map(successorCard).join("") : `<p class="chord-path-empty">No verified Song Map places another chord directly after this exact ${state.chordMap.depth}. It remains a valid derived chord, but the app will not invent a route.</p>`}</div></section>
      <section><h4>Mode and key doors</h4><div class="chord-route-list">${model.doors.length ? model.doors.map(doorCard).join("") : `<p class="chord-path-empty">No chord-specific door is justified from this selection. Open a scale relationship below to compare the collections without calling it a modulation.</p>`}</div></section></div>`;
  }

  function renderChordPathInline(selected) {
    const model = CP.build(state.tonic, state.modeId, selected.chord, state.chordMap.depth, state.chordMap.targetIndex);
    const lens = state.chordMap.pathLens;
    const body = lens === "outline" ? renderChordPathOutline(selected, model)
      : lens === "connect" ? renderChordPathConnect(selected, model)
        : lens === "continue" ? renderChordPathContinue(selected, model)
          : renderChordPathPlay(selected);
    const tabs = [
      ["play", "1", "Play it", "voicings"],
      ["outline", "2", "Outline it", "arpeggios"],
      ["connect", "3", "Enter it", "scale lines"],
      ["continue", "4", "Leave it", "next + change"]
    ];
    return `<section id="matrixChordPath" class="matrix-chord-path" aria-label="Chord path for ${escapeHtml(selected.chord.symbol)}"><header class="chord-path-head"><div><span>Chord path · ${escapeHtml(window.Tuning.current().name)}</span><h3>${escapeHtml(selected.chord.roman)} · ${escapeHtml(selected.chord.symbol)}</h3></div><p>${escapeHtml(state.tonic)} ${escapeHtml(M.MODES[state.modeId].name)} · selected ${escapeHtml(state.chordMap.depth)} · target ${escapeHtml(selected.chord.notes[state.chordMap.targetIndex % selected.chord.notes.length].roleLabel)}</p></header>
      <nav class="chord-path-tabs" aria-label="Chord path questions">${tabs.map((tab) => `<button data-chord-path-lens="${tab[0]}" class="${lens === tab[0] ? "active" : ""}"><i>${tab[1]}</i><b>${tab[2]}</b><span>${tab[3]}</span></button>`).join("")}</nav>
      <div class="chord-path-body">${body}</div></section>`;
  }

  function renderChordMapComparison(selected) {
    const rows = CM.comparison(state.tonic, state.chordMap.depth);
    $("chordMapCompare").innerHTML = `<table class="harmony-matrix"><thead><tr><th scope="col">Scale / dromos</th>${Array.from({ length: 7 }, (_, degree) => `<th scope="col"><b>${degree + 1}</b><span>degree</span></th>`).join("")}</tr></thead><tbody>${rows.map((row) => {
      const selectedRow = row.modeId === state.modeId;
      const scaleNames = row.scale.map((note) => note.name).join(" · ");
      const chordCells = row.chords.map((chord, degree) => {
        const active = selectedRow && degree === state.chordMap.degree;
        const evidence = `${chord.prominence.mapsUsed}/${chord.prominence.totalMaps} maps`;
        return `<td class="matrix-cell role-${chord.workingRole.id}"><button class="${active ? "active" : ""}" data-compare-mode="${row.modeId}" data-chord-degree="${degree}" aria-label="${escapeHtml(row.mode.name)} degree ${degree + 1}, ${chord.roman}, ${chord.symbol}, ${chord.workingRole.label}, used in ${evidence}"><span class="matrix-cell-top"><i>${escapeHtml(chord.roman)}</i><em>${escapeHtml(chord.workingRole.label)}</em></span><b>${escapeHtml(chord.symbol)}</b><small>${chord.notes.map((note) => escapeHtml(note.name)).join(" · ")}</small><strong>${escapeHtml(evidence)}</strong></button></td>`;
      }).join("");
      const routes = row.progressions.map((progression) => {
        const copy = matrixProgressionCopy(row.modeId, progression);
        return `<button data-matrix-prog="${progression.id}" data-matrix-mode="${row.modeId}" title="${escapeHtml(copy.why)}"><b>${escapeHtml(copy.label)}</b><span>${escapeHtml(copy.symbols)}</span></button>`;
      }).join("");
      const chordPath = selectedRow ? `<tr class="matrix-path-row"><td colspan="8">${renderChordPathInline(selected)}</td></tr>` : "";
      return `<tr class="matrix-scale-row${selectedRow ? " selected" : ""}"><th scope="row"><button data-matrix-mode="${row.modeId}"><span>${escapeHtml(row.mode.name)}</span><b>${escapeHtml(row.mode.greek)}</b><small>${escapeHtml(row.mode.signature)}</small><em>${escapeHtml(scaleNames)}</em></button></th>${chordCells}</tr><tr class="matrix-route-row${selectedRow ? " selected" : ""}"><td colspan="8"><div><span>Working routes</span>${routes}</div></td></tr>${chordPath}`;
    }).join("")}</tbody></table>`;
  }

  function renderMatrixProgressions() {
    $("matrixProgressions").innerHTML = M.PROGRESSIONS[state.modeId].map((progression) => {
      const copy = matrixProgressionCopy(state.modeId, progression);
      return `<button data-matrix-prog="${progression.id}" data-matrix-mode="${state.modeId}"><span><i>${escapeHtml(copy.group)}</i><b>${escapeHtml(copy.label)}</b></span><strong>${escapeHtml(copy.symbols)}</strong><small>${escapeHtml(copy.why)}</small><em>▶ hear and compare</em></button>`;
    }).join("");
  }

  function renderMatrixRelationships() {
    const groups = CM.relationships(state.tonic, state.modeId);
    const relationships = groups.exact.concat(groups.parallel, groups.transitions);
    $("matrixRelationships").innerHTML = relationships.length ? relationships.map((relationship) => {
      const targetMode = M.MODES[relationship.modeId];
      const evidence = relationship.doorMaps.length ? `Door: ${relationship.doorMaps.join(" · ")}` : relationship.kind === "exact" ? "Same seven notes" : "Theory comparison";
      return `<button data-matrix-relation-mode="${relationship.modeId}" data-matrix-relation-tonic="${relationship.tonic}"><span><i>${escapeHtml(relationship.label)}</i><b>${escapeHtml(relationship.tonic)} ${escapeHtml(targetMode.name)}</b></span><strong>${relationship.shared}/7 notes shared</strong><small>${escapeHtml(relationship.why)}</small><em>${escapeHtml(evidence)} · open scale →</em></button>`;
    }).join("") : `<p>No verified sister-scale door is available from this row yet.</p>`;
  }

  function selectMatrixMode(modeId, shouldPlay) {
    stopPlay();
    state.modeId = modeId;
    state.progId = M.PROGRESSIONS[modeId][0].id;
    state.chordMap.degree = 0;
    state.chordMap.targetIndex = 1;
    state.chordMap.shapeIndex = 0;
    persistPreferences();
    renderChordMap();
    if (shouldPlay) auditionChordMap("strum");
  }

  function playMatrixProgression(modeId, progressionId) {
    stopPlay();
    state.modeId = modeId;
    state.progId = progressionId;
    state.chordMap.degree = 0;
    const progression = M.PROGRESSIONS[modeId].find((item) => item.id === progressionId) || M.PROGRESSIONS[modeId][0];
    const chords = matrixProgressionChords(modeId, progression);
    persistPreferences();
    renderChordMap();
    AU.playProgressionPrompt(chords, state.bpm, chordReferenceVoice());
  }

  function renderChordMap() {
    const selected = currentChordMapSelection();
    const chord = selected.chord;
    const scale = M.scaleOf(state.tonic, state.modeId);
    const mode = M.MODES[state.modeId];
    const targetIndex = state.chordMap.targetIndex % chord.notes.length;
    const nextTargetIndex = (targetIndex + 1) % chord.notes.length;
    const target = chord.notes[targetIndex];
    const nextTarget = chord.notes[nextTargetIndex];
    const grip = selected.shape && selected.shape.placements ? { placements: selected.shape.placements } : selected.shape;
    FB.render(svg(), {
      grip,
      otherShapes: selected.voicing && selected.voicing.kind === "triad" ? selected.triadShapes.filter((shape) => shape !== selected.shape) : [],
      scaleNotes: scale,
      targetNowPcs: [target.pc],
      targetNextPcs: [nextTarget.pc],
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      labelMode: state.labelMode,
      lefty: state.lefty
    });
    svg().setAttribute("aria-label", `${window.Tuning.current().name} ${state.tonic} ${mode.name} chord map: ${chord.roman} ${chord.symbol}; ${target.roleLabel} ${target.name} is the current target and ${nextTarget.roleLabel} ${nextTarget.name} is next in the target sequence`);
    $("stageLayers").innerHTML = `<span class="layer-chip on is-static"><i class="layer-swatch lc-scale"></i>full scale</span><span class="layer-chip on is-static"><i class="layer-swatch lc-triad"></i>${escapeHtml(chord.roman)} ${state.chordMap.depth === "seventh" ? "7th chord" : "triad"}</span><span class="layer-chip on is-static"><i class="layer-swatch lc-now"></i>target now · ${escapeHtml(target.roleLabel)} ${escapeHtml(target.name)}</span><span class="layer-chip on is-static"><i class="layer-swatch lc-next"></i>then · ${escapeHtml(nextTarget.roleLabel)} ${escapeHtml(nextTarget.name)}</span><span class="layer-note">${state.chordMap.depth === "triad" ? "Solid dots are this grip; faint dots are its other 0–15 fret inversions." : "The compact grip preserves the most useful available voices on the selected tuning."}</span>`;

    document.querySelectorAll("[data-chord-map-depth]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-chord-map-depth") === state.chordMap.depth));
    $("chordMapTonicSel").value = state.tonic;
    renderChordMapComparison(selected);
    $("chordMapDegrees").innerHTML = `<span><b>${escapeHtml(state.tonic)} ${escapeHtml(mode.name)}</b><small>${scale.map((note) => escapeHtml(note.name)).join(" · ")}</small></span><span><i>Selected ${state.chordMap.depth}</i><b>${escapeHtml(chord.roman)} · ${escapeHtml(chord.symbol)}</b><small>${escapeHtml(chord.workingRole.label)} · ${chord.prominence.mapsUsed}/${chord.prominence.totalMaps} working maps</small></span>`;
    renderChordMapRoad();
    renderMatrixProgressions();
    renderMatrixRelationships();

    const shapeCopy = selected.shape && selected.shape.placements
      ? `${selected.voicing ? selected.voicing.label : selected.shape.inversionName || "compact grip"} · frets ${Math.min(...selected.shape.placements.map((placement) => placement.fret))}–${Math.max(...selected.shape.placements.map((placement) => placement.fret))}`
      : "compact grip";
    const specialQuality = chord.quality === "dim" || chord.quality === "dim7" || chord.quality === "m7b5"
      ? "This diminished-family result is truthful scale stacking. Treat it as tension and voice-leading material; its working-map count says whether the curriculum actually asks for it."
      : chord.quality === "aug" || chord.quality === "maj7sharp5"
        ? "This augmented-family result is truthful scale stacking. Hear the raised 5th as colour before treating it as a default comping chord."
        : "Root locates the harmony, the 3rd names its colour, the 5th stabilizes or alters it, and the optional 7th sharpens its function.";
    const variants = chord.prominence.variants.length
      ? `Map versions: ${chord.prominence.variants.map((variant) => escapeHtml(variant.symbol)).join(" · ")}.`
      : "No current Song Map prescribes this degree; it remains visible because it is genuinely inside the selected collection.";
    $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${escapeHtml(chord.roman)}</span><span class="ro-symbol">${escapeHtml(chord.symbol)}</span><span class="ro-key">${escapeHtml(mode.name)} on ${escapeHtml(state.tonic)}</span></div>
      <div class="chord-map-evidence"><b>${escapeHtml(chord.workingRole.label)} · ${escapeHtml(chord.prominence.label)}</b><span>Used in ${chord.prominence.mapsUsed} of ${chord.prominence.totalMaps} documented Song Maps · ${chord.prominence.occurrences} appearance${chord.prominence.occurrences === 1 ? "" : "s"}. The role badge and the usage count are separate evidence.</span></div>
      <div class="chord-target-sequence"><span>Target sequence · not a predicted melody</span>${chord.notes.map((note, index) => `<button data-chord-target="${index}" class="${index === targetIndex ? "active" : index === nextTargetIndex ? "next" : ""}" data-group="${note.colorGroup}"><i>${escapeHtml(note.roleLabel)}</i><b>${escapeHtml(note.name)}</b><small>${index === targetIndex ? "hear now" : index === nextTargetIndex ? "then" : "after"}</small></button>`).join("")}</div>
      <p class="chord-target-cue"><b>Hear now:</b> ${escapeHtml(target.roleLabel)} ${escapeHtml(target.name)}. <b>Then:</b> ${escapeHtml(nextTarget.roleLabel)} ${escapeHtml(nextTarget.name)}. Sing it before touching the highlighted fret.</p>
      <div class="chord-map-actions"><button data-hear-chord>Hear chord</button><button data-hear-target>Hear ${escapeHtml(target.roleLabel)}</button><button data-hear-triad>Hear ${chord.notes.map((note) => escapeHtml(note.roleLabel)).join(" → ")}</button><button data-next-chord-shape${selected.shapes.length < 2 ? " disabled" : ""}>Next voicing · ${selected.shapes.length ? state.chordMap.shapeIndex + 1 : 1}/${Math.max(1, selected.shapes.length)}</button></div>
      <div class="tri-tags"><span class="tri-set">${escapeHtml(window.Tuning.current().name)}</span><span class="tri-fret">${escapeHtml(shapeCopy)}</span></div>
      <div class="ro-foot"><b>${escapeHtml(specialQuality)}</b> ${variants}${chord.practiceNote ? ` <span class="chord-practice-note">${escapeHtml(chord.practiceNote)}</span>` : ""}</div>`;

    document.querySelectorAll("[data-chord-degree]").forEach((button) => button.onclick = () => {
      const comparisonMode = button.getAttribute("data-compare-mode");
      if (comparisonMode) {
        state.modeId = comparisonMode;
        if (!M.PROGRESSIONS[state.modeId].some((progression) => progression.id === state.progId)) state.progId = M.PROGRESSIONS[state.modeId][0].id;
      }
      selectChordMapDegree(button.getAttribute("data-chord-degree"), true);
      revealChordPath();
    });
    document.querySelectorAll("[data-matrix-mode]").forEach((button) => {
      if (button.hasAttribute("data-matrix-prog")) return;
      button.onclick = () => selectMatrixMode(button.getAttribute("data-matrix-mode"), false);
    });
    document.querySelectorAll("[data-matrix-prog]").forEach((button) => button.onclick = () =>
      playMatrixProgression(button.getAttribute("data-matrix-mode"), button.getAttribute("data-matrix-prog")));
    document.querySelectorAll("[data-matrix-relation-mode]").forEach((button) => button.onclick = () => {
      stopPlay();
      state.tonic = button.getAttribute("data-matrix-relation-tonic");
      state.modeId = button.getAttribute("data-matrix-relation-mode");
      state.progId = M.PROGRESSIONS[state.modeId][0].id;
      state.chordMap.degree = 0; state.chordMap.targetIndex = 1; state.chordMap.shapeIndex = 0;
      persistPreferences(); renderChordMap(); auditionChordMap("strum");
    });
    document.querySelectorAll("[data-chord-path-lens]").forEach((button) => button.onclick = () => {
      state.chordMap.pathLens = button.getAttribute("data-chord-path-lens");
      renderChordMap();
    });
    document.querySelectorAll("[data-chord-path-shape]").forEach((button) => button.onclick = () => {
      stopPlay();
      state.chordMap.shapeIndex = +button.getAttribute("data-chord-path-shape");
      renderChordMap(); auditionChordMap("block");
    });
    document.querySelectorAll("[data-chord-path-target]").forEach((button) => button.onclick = () => {
      state.chordMap.targetIndex = +button.getAttribute("data-chord-path-target");
      renderChordMap();
    });
    const chordPathModel = CP.build(state.tonic, state.modeId, chord, state.chordMap.depth, state.chordMap.targetIndex);
    document.querySelectorAll("[data-chord-path-arp]").forEach((button) => button.onclick = () => {
      stopPlay();
      const pattern = chordPathModel.arpeggios[+button.getAttribute("data-chord-path-arp")];
      if (pattern) AU.playSequence(pattern.notes, 0.34);
    });
    document.querySelectorAll("[data-chord-path-approach]").forEach((button) => button.onclick = () => {
      stopPlay();
      const pattern = chordPathModel.approaches[+button.getAttribute("data-chord-path-approach")];
      if (pattern) AU.playSequence(pattern.notes, 0.32);
    });
    document.querySelectorAll("[data-chord-path-extension]").forEach((button) => button.onclick = () => {
      stopPlay(); AU.playSequence(chordPathModel.extension.chord.notes, 0.36);
    });
    document.querySelectorAll("[data-chord-path-successor]").forEach((button) => button.onclick = () => {
      stopPlay();
      const route = chordPathModel.successors[+button.getAttribute("data-chord-path-successor")];
      if (route) AU.playProgressionPrompt([chord, route.chord], state.bpm, chordReferenceVoice());
    });
    document.querySelectorAll("[data-chord-path-door-hear]").forEach((button) => button.onclick = () => {
      stopPlay();
      const door = chordPathModel.doors[+button.getAttribute("data-chord-path-door-hear")];
      if (door) AU.playProgressionPrompt(door.preview, state.bpm, chordReferenceVoice());
    });
    document.querySelectorAll("[data-chord-path-door-open]").forEach((button) => button.onclick = () => {
      const door = chordPathModel.doors[+button.getAttribute("data-chord-path-door-open")];
      if (!door) return;
      stopPlay(); state.tonic = door.tonic; state.modeId = door.modeId; state.progId = M.PROGRESSIONS[door.modeId][0].id;
      state.chordMap.degree = door.targetDegree; state.chordMap.targetIndex = 1; state.chordMap.shapeIndex = 0;
      persistPreferences(); renderChordMap(); auditionChordMap("strum");
    });
    $("readout").querySelectorAll("[data-chord-target]").forEach((button) => button.onclick = () => {
      state.chordMap.targetIndex = +button.getAttribute("data-chord-target"); renderChordMap();
    });
    $("readout").querySelector("[data-hear-chord]").onclick = () => auditionChordMap("strum");
    $("readout").querySelector("[data-hear-target]").onclick = () => AU.playSequence([target], 0.3);
    $("readout").querySelector("[data-hear-triad]").onclick = () => AU.playSequence(chord.notes, 0.38);
    $("readout").querySelector("[data-next-chord-shape]").onclick = () => {
      if (selected.shapes.length < 2) return;
      state.chordMap.shapeIndex = (state.chordMap.shapeIndex + 1) % selected.shapes.length;
      renderChordMap(); auditionChordMap("block");
    };
  }

  function stepProg(delta) {
    const { chords } = currentProgression();
    markProgMoved();
    state.progStep = (state.progStep + delta + chords.length) % chords.length;
    state.view === "solo" ? renderSoloSection() : renderProg();
  }
  function auditionProg() {
    const { chords } = currentProgression();
    AU.playChord(chords[Math.min(state.progStep, chords.length - 1)].notes, state.strumStyle, undefined, chordReferenceVoice());
  }

  // ====================== FOUNDATION & STYLE LAB ========================
  // This is deliberately separate from the dromos engine: a pulse tells a
  // player where a phrase belongs in time, while the Song Map tells them what
  // melodic/harmonic colour they are hearing.
  function renderStyles() {
    const section = state.styles.section;
    $("foundationGuide").classList.toggle("hidden", section !== "foundation");
    $("styleExplorer").classList.toggle("hidden", section !== "greek");
    document.querySelectorAll("[data-style-section]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-style-section") === section));

    if (section === "foundation") {
      $("foundationGuide").innerHTML = `
        <p class="style-intro">These are transferable modern improvisation skills. Learn them first; the Greek style maps then decide the pulse, accompaniment role, and phrase shape.</p>
        <div class="foundation-list">${S.FOUNDATION.map((item, index) => `
          <article class="foundation-card"><span>${index + 1}</span><div><h3>${item.title}</h3><p>${item.detail}</p></div></article>`).join("")}</div>
        <p class="style-source">Modern input: pentatonic triad clusters and chord-tone targeting are a route between familiar shapes and real harmony. The goal here is musical decision-making, not copying another player’s licks.</p>`;
      return;
    }

    const style = S.byId(state.styles.styleId);
    const beats = S.beatMap(style);
    $("styleExplorer").innerHTML = `
      <p class="style-intro">Select a pulse map. It gives you the feel, comping role, and phrasing job; then open Song Map to choose the tune’s actual dromos and harmony.</p>
      <div class="style-list" aria-label="Greek style maps">${S.STYLES.map((item) =>
        `<button class="style-choice${item.id === style.id ? " active" : ""}" data-style-id="${item.id}"><b>${item.title}</b><span>${item.greek} · ${item.meter}</span></button>`
      ).join("")}</div>
      <article class="style-detail">
        <div class="style-detail-head"><div><span class="style-meter">${style.meter}</span><h3>${style.title} <i>${style.greek}</i></h3></div><strong>${style.pulse}</strong></div>
        <p>${style.character}</p>
        <div class="pulse-strip" aria-label="${style.title} pulse: ${style.pulse}">${beats.map((beat) =>
          `<span class="pulse-beat${beat.first ? " group-start" : ""}" data-group="${beat.group}"><b>${beat.beat}</b>${beat.first ? `<i>${beat.size}</i>` : ""}</span>`
        ).join("")}</div>
        <div class="style-jobs">
          <div><span>Comp first</span><p>${style.comp}</p></div>
          <div><span>Phrase job</span><p>${style.phrase}</p></div>
          <div><span>Map next</span><p>${style.route}</p></div>
        </div>
        <button id="btnUseStyleGroove" class="mini">${state.groove.styleId === style.id ? "✓ Selected in Practice Ensemble" : "Use this pulse in Practice Ensemble"}</button>
        <button id="btnOpenSongMap" class="mini primary-mini">Open Song Map — choose the dromos</button>
      </article>`;
    $("styleExplorer").querySelectorAll("[data-style-id]").forEach((button) => {
      button.onclick = () => { state.styles.styleId = button.getAttribute("data-style-id"); renderStyles(); };
    });
    $("btnUseStyleGroove").onclick = () => selectGrooveStyle(style.id);
    $("btnOpenSongMap").onclick = () => setView("prog");
  }

  function setStyleSection(section) {
    state.styles.section = section;
    renderStyles();
    renderPageGuide();
  }

  // ====================== TACTICAL EXAMPLE INDEX ======================
  // Named-source claims and app-authored drills remain visibly separate.
  // A source can support the observed technique without implying that the
  // generated notes below are a transcription of a player's recorded phrase.
  function tacticalContext() {
    const style = S.byId(state.groove.styleId);
    return {
      tonic: state.tonic,
      modeId: state.modeId,
      progId: state.progId,
      instrument: window.Tuning.current().name,
      pulse: `${style.title} · ${style.meter} · ${style.pulse}`
    };
  }

  function openTacticalExample(id) {
    if (!TE) return;
    const template = TE.byId(id);
    if (!template) return;
    if (template.modeGate && !template.modeGate.includes(state.modeId)) {
      state.modeId = state.modeId === "minor" && template.modeGate.includes("harmonicMinor")
        ? "harmonicMinor" : template.modeGate[0];
      state.progId = M.PROGRESSIONS[state.modeId][0].id;
      state.progStep = 0;
      persistPreferences();
    }
    state.examples.category = template.category;
    state.examples.selectedId = template.id;
    setView("examples");
  }

  function useTacticalExample(example) {
    if (!example) return;
    if (example.toolId && TK) {
      const tool = TK.byId(example.toolId);
      if (!tool) return;
      state.solo.section = "targets";
      state.solo.toolkit.pillar = tool.pillar;
      state.solo.toolkit.toolId = tool.id;
      state.solo.toolkit.phase = 0;
      applyToolChoreo();
      setView("solo");
      return;
    }
    // Pennanen's tactile comparison belongs in the dedicated Picking Lab,
    // where horizontal and tiered versions are shown on the selected tuning.
    state.picking.exerciseId = "tactile-ab";
    setView("picking");
  }

  let tacticalPlaybackRequest = 0;
  function playTacticalExample(example) {
    if (!example || !example.notes.length) return;
    stopPlay();
    const request = ++tacticalPlaybackRequest;
    AU.prepareStudioPiano().then((ready) => {
      if (request !== tacticalPlaybackRequest || state.view !== "examples" || state.examples.selectedId !== example.id) return;
      AU.playSequence(example.notes, 0.34, undefined, ready ? "studio" : "piano");
    });
  }

  function tacticalInstrumentRoute(notes) {
    const tuning = window.Tuning.current();
    const maxFret = Math.min(15, tuning.frets);
    let previous = null;
    return notes.slice(0, 8).map((note) => {
      const candidates = [];
      tuning.open.forEach((openMidi, stringIndex) => {
        for (let fret = 0; fret <= maxFret; fret++) {
          if (((openMidi + fret) % 12 + 12) % 12 === note.pc) candidates.push({ stringIndex, fret });
        }
      });
      candidates.sort((left, right) => {
        const leftCost = previous
          ? Math.abs(left.fret - previous.fret) + Math.abs(left.stringIndex - previous.stringIndex) * 1.7
          : Math.abs(left.fret - 5) - left.stringIndex * 0.35;
        const rightCost = previous
          ? Math.abs(right.fret - previous.fret) + Math.abs(right.stringIndex - previous.stringIndex) * 1.7
          : Math.abs(right.fret - 5) - right.stringIndex * 0.35;
        return leftCost - rightCost || right.stringIndex - left.stringIndex || left.fret - right.fret;
      });
      previous = candidates[0] || previous;
      return previous ? { note, stringIndex: previous.stringIndex, fret: previous.fret, course: tuning.names[previous.stringIndex] } : null;
    }).filter(Boolean);
  }

  function renderTacticalExamples() {
    const root = $("tacticalExamples");
    if (!root || !TE) return;
    const ctx = tacticalContext();
    const built = new Map(TE.available(ctx).map((example) => [example.id, example]));
    const visibleTemplates = TE.TEMPLATES.filter((template) =>
      state.examples.category === "all" || template.category === state.examples.category);
    let selected = built.get(state.examples.selectedId);
    if (!selected || !visibleTemplates.some((template) => template.id === selected.id)) {
      const first = visibleTemplates.find((template) => built.has(template.id));
      selected = first ? built.get(first.id) : built.values().next().value;
      if (selected) state.examples.selectedId = selected.id;
    }
    const instrumentRoute = selected ? tacticalInstrumentRoute(selected.notes) : [];
    const categoryName = (id) => TE.CATEGORIES.find((category) => category.id === id)?.name || "Practice";
    root.innerHTML = `
      <section class="examples-context" aria-label="Tactical example key and scale">
        <div><span>All examples recalculate</span><b>Choose the same home and dromos as the music you are practising.</b></div>
        <label for="examplesTonicSel">Key<select id="examplesTonicSel">${M.TONICS.map((tonic) => `<option value="${escapeHtml(tonic)}"${tonic === state.tonic ? " selected" : ""}>${escapeHtml(tonic)}</option>`).join("")}</select></label>
        <div class="seg seg-5" aria-label="Tactical example scale or dromos">${M.MODE_ORDER.map((modeId) => `<button data-example-mode="${modeId}" class="${modeId === state.modeId ? "active" : ""}">${escapeHtml(M.MODES[modeId].name)}</button>`).join("")}</div>
      </section>
      <section class="examples-filter" aria-label="Tactical example categories">
        <button data-example-category="all" class="${state.examples.category === "all" ? "active" : ""}"><b>All</b><span>${TE.TEMPLATES.length} examples</span></button>
        ${TE.CATEGORIES.map((category) => `<button data-example-category="${category.id}" class="${state.examples.category === category.id ? "active" : ""}"><b>${escapeHtml(category.name)}</b><span>${escapeHtml(category.question)}</span></button>`).join("")}
      </section>
      <div class="examples-layout">
        <nav class="examples-index" aria-label="Tactical example index">${visibleTemplates.map((template) => {
          const example = built.get(template.id);
          const unavailable = !example;
          return `<button data-example-id="${template.id}" class="${selected && template.id === selected.id ? "active" : ""}"${unavailable ? " disabled" : ""}>
            <span>${escapeHtml(categoryName(template.category))}</span><b>${escapeHtml(template.title)}</b><small>${escapeHtml(template.figure)}${unavailable ? " · choose Major or Harmonic minor" : ""}</small>
          </button>`;
        }).join("")}</nav>
        ${selected ? `<article class="example-detail">
          <header><div><span>${escapeHtml(categoryName(selected.category))}</span><h2>${escapeHtml(selected.title)}</h2><p>${escapeHtml(selected.figure)}</p></div><i>Source-bounded</i></header>
          <section class="example-evidence"><span>What the source supports</span><p>${escapeHtml(selected.evidence)}</p>${selected.source.href ? `<a href="${escapeHtml(selected.source.href)}" target="_blank" rel="noopener noreferrer">Open source · ${escapeHtml(selected.source.name)}</a>` : `<small>${escapeHtml(selected.source.name)}</small>`}</section>
          <section class="example-setup"><span>Use it now</span><b>${escapeHtml(selected.setup)}</b><p>${escapeHtml(selected.noteLine)}</p></section>
          <section class="example-instrument"><span>One compact starting route · ${escapeHtml(window.Tuning.current().name)}</span><div>${instrumentRoute.map((placement) => `<b><i>${escapeHtml(placement.note.name)}</i><small>${escapeHtml(placement.course)} ${window.Tuning.current().open.length === 6 ? "string" : "course"} · fret ${placement.fret}</small></b>`).join("")}</div><p>First ${instrumentRoute.length} note${instrumentRoute.length === 1 ? "" : "s"} only, kept at fret 15 or lower. This is one practical start—not the only fingering. Pennanen's comparison still asks you to test a same-course route against this compact route for tone color.</p></section>
          <ol class="example-steps">${selected.steps.map((step, index) => `<li><i>${index + 1}</i><p>${escapeHtml(step)}</p></li>`).join("")}</ol>
          <div class="example-checks"><div><span>Listen for</span><p>${escapeHtml(selected.listen)}</p></div><div><span>Pass when</span><p>${escapeHtml(selected.pass)}</p></div></div>
          <p class="example-boundary"><b>Evidence boundary:</b> ${escapeHtml(selected.boundary)}</p>
          <footer><button class="mini" data-example-hear="${selected.id}">♪ Hear the note path</button><button class="mini" data-example-stop>■ Stop</button><button class="mini primary-mini" data-example-practise="${selected.id}">Open in ${selected.toolId ? "Solo Toolkit" : "Picking Path"}</button><button class="mini" data-example-all="${selected.category}">See all in this category</button></footer>
        </article>` : ""}
      </div>`;
    $("examplesTonicSel").onchange = (event) => {
      stopPlay(); state.tonic = event.target.value; state.progId = M.PROGRESSIONS[state.modeId][0].id; state.progStep = 0;
      persistPreferences(); renderTacticalExamples(); renderPageGuide();
    };
    root.querySelectorAll("[data-example-mode]").forEach((button) => button.onclick = () => {
      stopPlay(); state.modeId = button.getAttribute("data-example-mode"); state.progId = M.PROGRESSIONS[state.modeId][0].id; state.progStep = 0;
      persistPreferences(); renderTacticalExamples(); renderPageGuide();
    });
    root.querySelectorAll("[data-example-category]").forEach((button) => button.onclick = () => {
      state.examples.category = button.getAttribute("data-example-category"); renderTacticalExamples();
    });
    root.querySelectorAll("[data-example-id]").forEach((button) => button.onclick = () => {
      state.examples.selectedId = button.getAttribute("data-example-id"); renderTacticalExamples();
    });
    root.querySelector("[data-example-hear]")?.addEventListener("click", () => playTacticalExample(selected));
    root.querySelector("[data-example-stop]")?.addEventListener("click", stopPlay);
    root.querySelector("[data-example-practise]")?.addEventListener("click", () => useTacticalExample(selected));
    root.querySelector("[data-example-all]")?.addEventListener("click", () => { state.examples.category = "all"; renderTacticalExamples(); });
  }

  // ============================ ANALYZER ================================
  function syncAnalysisControls() {
    $("analysisTonic").value = state.analysis.tonic;
    document.querySelectorAll("[data-analysis-mode]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-analysis-mode") === state.analysis.modeId));
  }

  function analysisContext() {
    return { tonic: state.analysis.tonic, modeId: state.analysis.modeId };
  }

  function renderStudyStarters() {
    if (!U || !$("studyStarters")) return;
    $("studyStarters").innerHTML = `<span class="analysis-label">Authorised study starters</span><div class="study-list">${U.STUDIES.map((study) =>
      `<button class="study-choice${study.id === state.analysis.studyId ? " active" : ""}" data-study-id="${escapeHtml(study.id)}"><b>${escapeHtml(study.title)}</b><span>${escapeHtml(study.style)} · ${escapeHtml(study.focus)}</span><i>${escapeHtml(study.source)}</i></button>`
    ).join("")}</div>`;
    $("studyStarters").querySelectorAll("[data-study-id]").forEach((button) => {
      button.onclick = () => {
        const study = U.byId(button.getAttribute("data-study-id"));
        state.analysis.tonic = study.tonic;
        state.analysis.modeId = study.modeId;
        state.analysis.studyId = study.id;
        state.analysis.selected = 0;
        $("analysisChords").value = study.chords;
        $("analysisLine").value = "";
        syncAnalysisControls(); renderAnalyzer();
      };
    });
  }

  function setScoreImportStatus(message, tone) {
    state.analysis.importStatus = { message: message || "", tone: tone || "" };
    const status = $("scoreImportStatus");
    if (!status) return;
    status.textContent = state.analysis.importStatus.message;
    status.className = "score-import-status" + (state.analysis.importStatus.tone ? " " + state.analysis.importStatus.tone : "");
  }

  function colourGroup(role) {
    if (role === "R") return "root";
    if (role === "3" || role === "♭3") return "third";
    if (role === "5" || role === "♭5" || role === "♯5") return "fifth";
    return "seventh";
  }

  function analysisVoicing(record) {
    return record.tones.map((tone) => ({
      pc: tone.pc, name: tone.name, role: tone.role, roleLabel: tone.role, colorGroup: colourGroup(tone.role)
    }));
  }

  function tabForGrip(grip) {
    const tuning = window.Tuning.current();
    if (!grip) return "No compact grip found in the displayed range.";
    const placements = new Map(grip.placements.map((placement) => [placement.stringIndex, placement]));
    const lines = [];
    for (let stringIndex = tuning.open.length - 1; stringIndex >= 0; stringIndex--) {
      const placement = placements.get(stringIndex);
      lines.push(tuning.names[stringIndex].padEnd(2, " ") + "|" + (placement ? "--" + String(placement.fret).padStart(2, "-") + "--" : "------"));
    }
    return lines.join("\n");
  }

  function renderAnalysisInstrument(result) {
    const holder = $("analysisInstrument");
    if (!holder) return;
    if (!result.records.length) { holder.innerHTML = ""; return; }
    state.analysis.selected = Math.max(0, Math.min(state.analysis.selected, result.records.length - 1));
    const record = result.records[state.analysis.selected];
    const grip = FB.findGrip(analysisVoicing(record), state.position);
    const location = grip ? (grip.lowFret === 0 ? "open / first position" : "around fret " + grip.lowFret) + " · " + grip.span + "-fret span" : "no compact shape in this range";
    holder.innerHTML = `<section class="instrument-answer"><div><span>Instrument map</span><h3>${escapeHtml(record.chord.raw)} on ${escapeHtml(window.Tuning.current().name)}</h3><p>Auto-selected ${location}. Gold rings are the strong arrival tones; the shape is a compact voicing, not the only valid fingering.</p></div><div class="analysis-position-strip">${result.records.map((item, index) =>
      `<button data-analysis-chord="${index}" class="${index === state.analysis.selected ? "active" : ""}"><b>${escapeHtml(item.chord.raw)}</b><span>${escapeHtml(item.label)}</span></button>`
    ).join("")}</div><div class="analysis-fretboard-wrap"><svg id="analysisFretboard" role="img" aria-label="${escapeHtml(record.chord.raw)} chord chart"></svg></div><div class="analysis-tab"><b>Playable tab · high to low</b><pre>${escapeHtml(tabForGrip(grip))}</pre><p>Strong targets: ${record.strong.map((tone) => escapeHtml(tone.name + " (" + tone.role + ")")).join(" · ")}</p></div></section>`;
    holder.querySelectorAll("[data-analysis-chord]").forEach((button) => {
      button.onclick = () => { state.analysis.selected = +button.getAttribute("data-analysis-chord"); renderAnalyzer(); };
    });
    if (!grip) return;
    FB.render($("analysisFretboard"), {
      grip,
      ghosts: false,
      labelMode: state.labelMode,
      lefty: state.lefty,
      targetPcs: record.strong.map((tone) => tone.pc)
    });
  }

  function renderAnalyzer() {
    renderStudyStarters();
    const result = A.analyzeProgression($("analysisChords").value, analysisContext());
    const concepts = result.concepts.length
      ? `<div class="analysis-concepts">${result.concepts.map((concept) =>
        `<article class="analysis-concept"><span>${escapeHtml(concept.chord)}</span><div><b>${escapeHtml(concept.title)}</b><p>${escapeHtml(concept.detail)}</p></div></article>`
      ).join("")}</div>`
      : "";
    const map = result.records.length
      ? `<div class="analysis-map">${result.records.map((record, index) =>
        `<button class="analysis-chord${index === state.analysis.selected ? " active" : ""}" data-analysis-chord="${index}"><span class="analysis-function">${escapeHtml(record.label)}</span><b>${escapeHtml(record.chord.raw)}</b>
          <p>${record.strong.map((tone) => escapeHtml(tone.name + " (" + tone.role + ")")).join(" · ")}</p></button>`
      ).join("")}</div>`
      : "";
    const linePlan = result.linePlan.length
      ? `<div class="analysis-plan">${result.linePlan.map((step) =>
        `<article><b>Over ${escapeHtml(step.chord)}</b><span>Land now: ${escapeHtml(step.now)}</span><span>Hear next: ${escapeHtml(step.arriving)}</span></article>`
      ).join("")}</div>`
      : "";
    const lineText = $("analysisLine").value.trim();
    const line = lineText ? A.analyzeLine(lineText, analysisContext()) : null;
    const lineResult = line && line.segments.length
      ? `<section class="analysis-line"><h3>Line annotation</h3><p>${escapeHtml(line.summary)}</p>${line.segments.map((segment) =>
        `<div class="line-segment"><b>${escapeHtml(segment.chord)}</b>${segment.notes.map((note) =>
          `<span class="line-note ${note.kind}">${escapeHtml(note.name)}<i>${escapeHtml(note.role)}</i></span>`
        ).join("")}</div>`
      ).join("")}</section>`
      : lineText ? `<section class="analysis-line"><h3>Line annotation</h3><p>Use the form <b>Chord: notes | Chord: notes</b> so the app can explain each note against the harmony.</p></section>` : "";

    $("analysisResult").innerHTML = `
      <section class="analysis-answer"><span>Answer first</span><h3>${escapeHtml(result.summary)}</h3><p>Strong notes are not the only valid notes. They are the reliable arrivals that let you use dromos tones, approaches, motifs, and ornaments intentionally.</p></section>
      ${map}${concepts ? `<section class="analysis-section"><h3>What is happening</h3>${concepts}</section>` : ""}
      ${linePlan ? `<section class="analysis-section"><h3>Solo plan</h3>${linePlan}</section>` : ""}
      ${lineResult}`;
    $("analysisResult").querySelectorAll("[data-analysis-chord]").forEach((button) => {
      button.onclick = () => { state.analysis.selected = +button.getAttribute("data-analysis-chord"); renderAnalyzer(); };
    });
    renderAnalysisInstrument(result);
  }

  function renderConcepts() {
    const shelf = (items) => items.map((item) =>
      `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer"><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.focus)}</span><i><strong>App use:</strong> ${escapeHtml(item.use)}</i></a>`
    ).join("");
    $("conceptPyramid").innerHTML = `
      <section class="concept-apex"><span>Pyramid answer</span><h2>Make a phrase that reveals the song, sits in the pulse, and sounds like you.</h2><p>Work top-down: first the musical conclusion, then four non-overlapping causes. Do not solve a rhythm problem with a new scale, or a target-note problem with more speed.</p></section>
      <div class="concept-layers">${A.PYRAMID.map((item) => `
        <article class="concept-layer concept-${item.id}"><div><span>${escapeHtml(item.title)}</span><h3>${escapeHtml(item.question)}</h3></div><p>${escapeHtml(item.why)}</p><p class="concept-greek"><b>Greek/Balkan lens:</b> ${item.id === "time" ? "Feel the additive group first—9/4, 7/8, 5/8, or the song’s actual dance pulse—not a generic click." : item.id === "map" ? "Treat dromos as directional melodic behaviour plus harmony; a scale name by itself is not the whole map." : item.id === "line" ? "Use local triads and tetrachord/seira ideas to connect arrivals, rather than importing unrelated licks." : "Let bouzouki, guitar, or laouto articulation serve the vocal line and accompaniment role; ornament follows function."}</p><p class="concept-drill"><b>One drill:</b> ${escapeHtml(item.drill)}</p></article>`).join("")}</div>
      <section class="reference-shelf"><div><span>Research shelf</span><h2>Bouzouki methods inform the curriculum—without reproducing them.</h2><p>Use a source you own alongside the app: analyse its form, identify the map, choose targets, then test the answer in the correct pulse.</p></div><h3>Vangelis Trigas · verified course and material families</h3><div class="reference-list">${R ? shelf(R.TRIGAS) : ""}</div><h3>Other strong Greek bouzouki references</h3><div class="reference-list">${R ? shelf(R.OTHER) : ""}</div><h3>Community learning index · verify rights at the original source</h3><div class="reference-list">${R ? shelf(R.COMMUNITY) : ""}</div></section>`;
  }

  // =========================== PRACTICE COACH ===========================
  function coachContext() {
    return {
      view: state.view,
      tonic: state.tonic,
      modeId: state.modeId,
      progressionId: state.progId,
      progressionStep: state.progStep,
      tuningId: window.Tuning.currentId(),
      soloSection: state.solo.section,
      styleId: state.styles.styleId,
      studyId: state.analysis.studyId,
      bpm: state.bpm,
      analysisChords: $("analysisChords") ? $("analysisChords").value : "",
      analysisLine: $("analysisLine") ? $("analysisLine").value : ""
    };
  }

  function useCoachAction(action) {
    if (!action || typeof action !== "object") return;
    if (action.kind === "navigate") { setView(action.view); return; }
    if (action.kind === "song_map") {
      state.tonic = action.tonic; state.modeId = action.modeId; state.progId = action.progressionId; state.progStep = 0;
      setView("prog"); return;
    }
    if (action.kind === "study") {
      const study = U.byId(action.studyId);
      state.analysis.tonic = study.tonic; state.analysis.modeId = study.modeId; state.analysis.studyId = study.id; state.analysis.selected = 0;
      $("analysisChords").value = study.chords; $("analysisLine").value = "";
      setView("analyze"); return;
    }
    if (action.kind === "style") {
      state.styles.section = action.section;
      if (action.styleId) state.styles.styleId = action.styleId;
      setView("styles"); return;
    }
    if (action.kind === "solo_lab") {
      state.solo.section = action.section;
      setView("solo"); return;
    }
    if (action.kind === "analyzer") {
      state.analysis.tonic = action.tonic; state.analysis.modeId = action.modeId; state.analysis.studyId = null; state.analysis.selected = 0;
      $("analysisChords").value = action.chords; $("analysisLine").value = action.line || "";
      setView("analyze");
    }
  }

  // =========================== EAR TRAINER ===============================
  function earTonicNote() {
    const pc = M.parseName(state.ear.tonic).pc;
    const midi = 50 + pc;
    return { freq: 440 * Math.pow(2, (midi - 69) / 12) };
  }

  function earAudioStatus(message, stateName) {
    const status = $("earAudioStatus");
    if (!status) return;
    status.textContent = message;
    status.className = `ear-audio-status${stateName ? ` ${stateName}` : ""}`;
  }

  async function playEarTonic() {
    stopPlay();
    earAudioStatus(AU.studioStatus() === "ready" ? `Playing ${state.ear.tonic} home pitch` : "Loading the sampled studio piano…", "playing");
    const played = await AU.playReferenceChord([earTonicNote()], "block");
    if (played) earAudioStatus(`Home pitch: ${state.ear.tonic} · sampled studio piano · Stop anytime`, "playing");
  }

  // ONE home control with two states (blueprint 2.5): the colour drill always
  // names a training home, the map drill may hide it ("random" = train blind).
  function earHomeValue() {
    return state.ear.drill === "map" ? state.ear.map.homePreset : state.ear.tonic;
  }

  function renderEarHome() {
    const select = $("earHomeSel");
    if (!select) return;
    const isMap = state.ear.drill === "map";
    const value = earHomeValue();
    const blind = isMap && value === "random";
    select.innerHTML = (isMap ? `<option value="random">Blind — the app hides the home</option>` : "")
      + M.TONICS.map((tonic) => `<option value="${tonic}">${tonic}${isMap ? " — known home" : ""}</option>`).join("");
    select.value = value;
    $("btnEarHome").disabled = blind;
    $("btnEarHome").textContent = blind ? "Home hidden · training blind"
      : isMap ? `♪ Hear ${value} home chord` : `♪ Hear ${value}`;
    $("earHomeNote").textContent = blind
      ? "Blind: the home is part of the question, so nothing here plays it before you answer."
      : isMap ? `Known home ${value}: the map is built on it, and you can re-hear its home chord at any time.`
        : `Known home ${value}: the cadence is built on it, so you are naming colour, not absolute pitch.`;
  }

  function renderColourChoices() {
    document.querySelectorAll("[data-guess]").forEach((button) => {
      const id = button.getAttribute("data-guess");
      button.className = "guess-btn";
      button.disabled = state.ear.locked;
      if (!state.ear.locked && id === state.ear.guess) button.classList.add("selected");
      if (state.ear.locked && id === state.ear.answer) button.classList.add("right");
      else if (state.ear.locked && id === state.ear.guess) button.classList.add("wrong");
    });
    $("btnEarHint").disabled = state.ear.locked;
    $("btnEarCheck").disabled = state.ear.locked;
  }

  function newEarQuestion() {
    stopPlay();
    const ids = E ? E.FAMILY_ORDER : M.MODE_ORDER;
    // avoid repeating the same answer twice running
    let pick;
    do { pick = ids[Math.floor(Math.random() * ids.length)]; }
    while (ids.length > 1 && pick === state.ear.answer);
    state.ear.answer = pick;
    state.ear.guess = null;
    state.ear.hintLevel = 0;
    state.ear.locked = false;
    $("earReveal").classList.add("hidden");
    $("earReveal").innerHTML = "";
    $("btnEarNew").textContent = "▶ Next question";
    $("earFeedback").className = "ear-feedback";
    $("earFeedback").textContent = `Training home ${state.ear.tonic}. The cadence plays twice. Choose one colour family, ask for a hint if you need one, then Check + reveal.`;
    renderColourChoices();
    renderEarHome();
    playEarPrompt();
    renderEarScore();
  }

  // Changing the home invalidates the sounding question. Clear it back to the
  // idle state instead of firing a fresh cadence the player never asked for.
  function resetEarQuestion() {
    stopPlay();
    state.ear.answer = null;
    state.ear.guess = null;
    state.ear.hintLevel = 0;
    state.ear.locked = false;
    $("earReveal").classList.add("hidden");
    $("earReveal").innerHTML = "";
    $("btnEarNew").textContent = "▶ Start question";
    $("earFeedback").className = "ear-feedback";
    $("earFeedback").textContent = `Training home ${state.ear.tonic}. Press ▶ Start question when you are ready; the cadence then plays twice.`;
    renderColourChoices();
    renderEarScore();
  }

  async function playEarPrompt() {
    stopPlay();
    const id = state.ear.answer;
    if (!id) return;
    const prog = M.PROGRESSIONS[id][0];
    const { chords } = M.buildProgression(state.ear.tonic, id, prog.id);
    earAudioStatus(AU.studioStatus() === "ready" ? "Playing the cadence twice…" : "Loading the sampled studio piano…", "playing");
    const played = await AU.playProgressionPrompt(chords, state.bpm, "studio");
    if (played && id === state.ear.answer) earAudioStatus("Cadence playing twice · chords only · Stop anytime", "playing");
  }

  function selectColourGuess(guess) {
    if (state.ear.locked) return;
    state.ear.guess = guess;
    const label = E ? E.choicePrompt(guess) : `Test ${M.MODES[guess].name} against the home.`;
    $("earFeedback").className = "ear-feedback";
    $("earFeedback").textContent = label + " When you are ready, use Check + reveal.";
    renderColourChoices();
  }

  function hintColour() {
    if (!state.ear.answer || state.ear.locked) return;
    state.ear.hintLevel = Math.min(2, state.ear.hintLevel + 1);
    $("earFeedback").className = "ear-feedback";
    $("earFeedback").textContent = E ? E.hint({ tonic: state.ear.tonic, modeId: state.ear.answer, progressionId: M.PROGRESSIONS[state.ear.answer][0].id }, state.ear.hintLevel) : "Sing the home, then compare its characteristic degrees.";
  }

  function checkColourGuess() {
    if (state.ear.locked || !state.ear.guess) {
      if (!state.ear.locked) $("earFeedback").textContent = "Choose the colour family you hear first. Selection is reversible until you press Check + reveal.";
      return;
    }
    state.ear.locked = true;
    const correct = state.ear.guess === state.ear.answer;
    state.ear.total++;
    if (correct) {
      state.ear.score++; state.ear.streak++;
      state.ear.best = Math.max(state.ear.best, state.ear.streak);
    } else { state.ear.streak = 0; }

    if (PP) PP.recordProgress({ kind: "ear", drill: "colour", correct });
    if (C) C.track("ear_answered", { result: correct ? "correct" : "incorrect" }, coachContext(), false);
    renderPlayerProfiles(false);

    renderColourChoices();
    const answer = { tonic: state.ear.tonic, modeId: state.ear.answer, progressionId: M.PROGRESSIONS[state.ear.answer][0].id };
    const detail = E ? E.explanation(answer) : { label: M.MODES[state.ear.answer].name, signature: "signature tones", scale: "" };
    const built = M.buildProgression(answer.tonic, answer.modeId, answer.progressionId);
    const fb = $("earFeedback");
    fb.className = "ear-feedback " + (correct ? "ok" : "no");
    fb.innerHTML = (correct ? "✓ Correct — " : "✗ It was ") +
      `<b>${detail.label}</b> (${detail.category || "map"}). Signature: <b>${detail.signature}</b>. Scale: <b>${detail.scale}</b>.`;
    renderEarReveal("earReveal", answer, built, {
      summary: `You chose ${M.MODES[state.ear.guess].name}; the played answer was ${detail.label}.`,
      progression: detail.progression,
      why: detail.why
    });
    renderEarScore();
  }

  function renderEarReveal(rootId, answer, built, copy) {
    const root = $(rootId);
    const scale = M.scaleOf(answer.tonic, answer.modeId);
    root.classList.remove("hidden");
    root.innerHTML = `<header><span>Exactly what played</span><h3>${escapeHtml(E ? E.answerLabel(answer) : `${answer.tonic} ${M.MODES[answer.modeId].name}`)}</h3><p>${escapeHtml(copy.summary)}</p></header>
      <div class="ear-reveal-context"><span><b>Scale</b>${scale.map((note) => `${escapeHtml(note.name)} <i>${escapeHtml(note.degree)}</i>`).join(" · ")}</span><span><b>Boxes</b>${escapeHtml(copy.progression || built.prog.label)}</span></div>
      <div class="ear-played-chords">${built.chords.map((chord, index) => `<button data-ear-reveal-chord="${index}" aria-label="Play chord ${index + 1}: ${escapeHtml(chord.degreeLabel)} ${escapeHtml(chord.symbol)}"><span>${index + 1} · ${escapeHtml(chord.degreeLabel)}</span><b>${escapeHtml(chord.symbol)}</b><small>${chord.notes.map((note) => `${escapeHtml(note.name)} (${escapeHtml(note.roleLabel)})`).join(" · ")}</small><em>♪ hear this chord</em></button>`).join('<i aria-hidden="true">→</i>')}</div>
      <p class="ear-reveal-why"><b>Why it belongs:</b> ${escapeHtml(copy.why || "The chord tones and scale collection agree with the named map.")}</p>
      <div class="ear-reveal-actions"><button data-ear-reveal-replay>↻ Replay this exact sequence</button><button data-ear-reveal-map>Open it in Song Map</button></div>`;
    root.querySelectorAll("[data-ear-reveal-chord]").forEach((button) => button.onclick = () => {
      stopPlay();
      const chord = built.chords[+button.getAttribute("data-ear-reveal-chord")];
      earAudioStatus(`Playing ${chord.degreeLabel} · ${chord.symbol} · Stop anytime`, "playing");
      AU.playReferenceChord(chord.notes, "block");
    });
    root.querySelector("[data-ear-reveal-replay]").onclick = () => {
      stopPlay();
      earAudioStatus("Replaying the exact revealed sequence twice…", "playing");
      AU.playProgressionPrompt(built.chords, state.bpm, "studio");
    };
    root.querySelector("[data-ear-reveal-map]").onclick = () => {
      state.tonic = answer.tonic; state.modeId = answer.modeId; state.progId = answer.progressionId; state.progStep = 0; setView("prog");
    };
  }

  function earMapLabel(answer) {
    return E ? E.answerLabel(answer) : answer.tonic + " " + M.MODES[answer.modeId].name;
  }

  function selectEarMapChoices(answer) {
    const candidates = M.TONICS.filter((tonic) => tonic !== answer.tonic);
    const picked = [answer.tonic];
    while (picked.length < 4 && candidates.length) {
      picked.push(candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]);
    }
    return picked.sort(() => Math.random() - 0.5);
  }

  function newEarMap() { prepareEarMap(true); }

  // Opening the tab (or changing the home) must never make sound: the drill is
  // armed silently and only the player's Start press plays the map.
  function prepareEarMap(play) {
    stopPlay();
    const map = state.ear.map;
    const ids = E ? E.FAMILY_ORDER : M.MODE_ORDER;
    const modeId = ids[Math.floor(Math.random() * ids.length)];
    const tonic = map.homePreset === "random"
      ? ["C", "D", "E♭", "F", "G", "A", "B♭"][Math.floor(Math.random() * 7)]
      : map.homePreset;
    const bank = E ? E.progressions(modeId) : M.PROGRESSIONS[modeId];
    const progression = bank[Math.floor(Math.random() * bank.length)];
    map.answer = { tonic, modeId, progressionId: progression.id };
    map.keyOptions = map.homePreset === "random" ? selectEarMapChoices(map.answer) : [tonic];
    map.keyGuess = map.homePreset === "random" ? null : tonic;
    map.familyGuess = null; map.progressionGuess = null; map.hintLevel = 0; map.locked = false;
    $("earMapReveal").classList.add("hidden");
    $("earMapReveal").innerHTML = "";
    $("btnEarMapNew").textContent = play ? "▶ Next map" : "▶ Start map";
    $("earMapFeedback").className = "ear-feedback";
    $("earMapFeedback").textContent = play
      ? (map.homePreset === "random"
        ? "Listen twice. Choose the home, then the harmonic/dromos family and its change boxes."
        : `Training home ${tonic}. Listen twice, then identify the harmonic/dromos family and its change boxes.`)
      : (map.homePreset === "random"
        ? "Press ▶ Start map when you are ready. The changes play twice and the home stays hidden until you check."
        : `Training home ${tonic}. Press ▶ Start map when you are ready; the changes then play twice.`);
    renderEarHome();
    renderEarMap();
    if (play) playEarMapPrompt();
  }

  async function playEarMapPrompt() {
    stopPlay();
    const answer = state.ear.map.answer;
    if (!answer) return;
    const { chords } = M.buildProgression(answer.tonic, answer.modeId, answer.progressionId);
    earAudioStatus(AU.studioStatus() === "ready" ? "Playing the map twice…" : "Loading the sampled studio piano…", "playing");
    const played = await AU.playProgressionPrompt(chords, state.bpm, "studio");
    if (played && answer === state.ear.map.answer) earAudioStatus("Map playing twice · Stop anytime", "playing");
  }

  async function playEarMapHome() {
    stopPlay();
    const answer = state.ear.map.answer;
    if (!answer || state.ear.map.homePreset === "random") return;
    const chord = E ? E.homeChord(answer) : M.buildProgression(answer.tonic, answer.modeId, answer.progressionId).chords.slice(-1)[0];
    earAudioStatus(AU.studioStatus() === "ready" ? `Playing ${answer.tonic} home chord` : "Loading the sampled studio piano…", "playing");
    const played = await AU.playReferenceChord(chord.notes, "block");
    if (played) earAudioStatus(`Home chord: ${chord.symbol} · Stop anytime`, "playing");
  }

  function renderEarMap() {
    const map = state.ear.map;
    if (!map.answer) return;
    $("btnEarMapHint").disabled = map.locked;
    $("btnEarMapCheck").disabled = map.locked;
    $("earKeyChoices").innerHTML = map.homePreset === "random"
      ? map.keyOptions.map((tonic) => `<button data-ear-key="${tonic}" class="${map.keyGuess === tonic ? "selected " : ""}${map.locked && tonic === map.answer.tonic ? "right" : map.locked && tonic === map.keyGuess ? "wrong" : ""}"${map.locked ? " disabled" : ""}>${tonic}</button>`).join("")
      : `<div class="ear-home-anchor"><b>${map.answer.tonic}</b><span>Known training home. Open Setup to hear it again or to train blind.</span></div>`;
    $("earFamilyChoices").innerHTML = (E ? E.families() : M.MODE_ORDER.map((id) => ({ id, label: M.MODES[id].name, signature: "signature tones" }))).map((item) =>
      `<button data-ear-family="${item.id}" class="${map.familyGuess === item.id ? "selected " : ""}${map.locked && item.id === map.answer.modeId ? "right" : map.locked && item.id === map.familyGuess ? "wrong" : ""}"${map.locked ? " disabled" : ""}><b>${item.label}</b><span>${item.signature}</span></button>`
    ).join("");
    const progressions = map.familyGuess ? (E ? E.progressions(map.familyGuess) : M.PROGRESSIONS[map.familyGuess]) : [];
    $("earProgressionChoices").innerHTML = progressions.length
      ? progressions.map((progression) => `<button data-ear-prog="${progression.id}" class="${map.progressionGuess === progression.id ? "selected " : ""}${map.locked && map.familyGuess === map.answer.modeId && progression.id === map.answer.progressionId ? "right" : map.locked && progression.id === map.progressionGuess ? "wrong" : ""}"${map.locked ? " disabled" : ""}><b>${progression.label}</b><span>${progression.chords.map((chord) => M.DEGREE_LABEL[chord[0]]).join(" → ")}</span></button>`).join("")
      : `<p class="ear-choice-empty">Choose the map family first; the progression choices will then use its own Roman-numeral language.</p>`;
    $("earKeyChoices").querySelectorAll("[data-ear-key]").forEach((button) => button.onclick = () => {
      if (map.locked) return;
      map.keyGuess = button.getAttribute("data-ear-key"); renderEarMap();
    });
    $("earFamilyChoices").querySelectorAll("[data-ear-family]").forEach((button) => button.onclick = () => {
      if (map.locked) return;
      map.familyGuess = button.getAttribute("data-ear-family"); map.progressionGuess = null; renderEarMap();
    });
    $("earProgressionChoices").querySelectorAll("[data-ear-prog]").forEach((button) => button.onclick = () => {
      if (map.locked) return;
      map.progressionGuess = button.getAttribute("data-ear-prog"); renderEarMap();
    });
  }

  function hintEarMap() {
    const map = state.ear.map;
    if (!map.answer || map.locked) return;
    map.hintLevel = Math.min(2, map.hintLevel + 1);
    $("earMapFeedback").className = "ear-feedback";
    $("earMapFeedback").textContent = E ? E.hint(map.answer, map.hintLevel) : "Find the chord that feels final, then listen for the colour note above it.";
  }

  function checkEarMap() {
    const map = state.ear.map;
    if (map.locked) return;
    if (!map.keyGuess || !map.familyGuess || !map.progressionGuess) {
      $("earMapFeedback").className = "ear-feedback";
      $("earMapFeedback").textContent = "Complete the home, family, and change-box selections. You can change any selection before checking.";
      return;
    }
    map.locked = true; map.total++;
    const rightKey = map.keyGuess === map.answer.tonic;
    const rightFamily = map.familyGuess === map.answer.modeId;
    const rightProgression = map.progressionGuess === map.answer.progressionId;
    const correct = rightKey && rightFamily && rightProgression;
    if (correct) { map.score++; map.streak++; map.best = Math.max(map.best, map.streak); }
    else map.streak = 0;
    if (PP) PP.recordProgress({ kind: "ear", drill: "map", correct });
    if (C) C.track("ear_answered", { result: correct ? "correct" : "incorrect" }, coachContext(), false);
    renderPlayerProfiles(false);
    const detail = E ? E.explanation(map.answer) : null;
    const progression = E ? E.progression(map.answer.modeId, map.answer.progressionId) : M.PROGRESSIONS[map.answer.modeId].find((item) => item.id === map.answer.progressionId);
    const built = M.buildProgression(map.answer.tonic, map.answer.modeId, map.answer.progressionId);
    const chords = built.chords;
    const feedback = $("earMapFeedback");
    feedback.className = "ear-feedback " + (correct ? "ok" : "no");
    feedback.innerHTML = (correct ? "✓ You heard the whole map. " : "✗ Check the map. ") +
      `Home/map: <b>${earMapLabel(map.answer)}</b> (${detail ? detail.category : "map"}). Scale: <b>${detail ? detail.scale : ""}</b>. Boxes: <b>${progression.label}</b> · ${chords.map((chord) => `<b>${chord.symbol}</b>`).join(" → ")}. ${detail ? detail.why : ""}`;
    renderEarReveal("earMapReveal", map.answer, built, {
      summary: `You chose ${map.keyGuess} ${M.MODES[map.familyGuess].name} · ${(E ? E.progression(map.familyGuess, map.progressionGuess) : null)?.label || map.progressionGuess}; the played map is shown below.`,
      progression: progression.label,
      why: detail ? detail.why : ""
    });
    renderEarMap(); renderEarScore();
  }

  function setEarDrill(drill) {
    stopPlay();
    state.ear.drill = drill;
    $("earColour").classList.toggle("hidden", drill !== "colour");
    $("earMap").classList.toggle("hidden", drill !== "map");
    document.querySelectorAll("[data-ear-drill]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-ear-drill") === drill));
    const studioState = AU.studioStatus();
    earAudioStatus(studioState === "ready"
      ? "Sampled studio piano ready · Start, replay, or stop without changing your answer"
      : studioState === "fallback"
        ? "Warm-keys fallback ready · Start, replay, or stop without changing your answer"
        : "Studio piano loads on first play · Stop always keeps your answer choices", studioState === "ready" ? "ready" : "");
    if (drill === "map" && !state.ear.map.answer) prepareEarMap(false);
    else if (drill === "map") { renderEarHome(); renderEarMap(); }
    else renderEarHome();
    renderEarScore();
    if (state.view === "ear") renderPageGuide();
  }

  // The score line answers the drill you are actually doing; the other drill's
  // totals stay one tap away instead of competing with the answer.
  function renderEarScore() {
    const e = state.ear;
    const pct = e.total ? Math.round((e.score / e.total) * 100) : 0;
    const mpct = e.map.total ? Math.round((e.map.score / e.map.total) * 100) : 0;
    const isMap = e.drill === "map";
    const line = $("earScoreLine");
    if (!line) return;
    line.innerHTML = isMap
      ? `<span>Home + changes <b>${e.map.score}</b>/${e.map.total} <i>(${mpct}%)</i></span><span>Map streak <b>${e.map.streak}</b></span>`
      : `<span>Colour ID <b>${e.score}</b>/${e.total} <i>(${pct}%)</i></span><span>Colour streak <b>${e.streak}</b></span>`;
    $("earScoreTotals").innerHTML =
      `<span>Colour ID <b>${e.score}</b>/${e.total} <i>(${pct}%)</i> · best streak <b>${e.best}</b></span>
       <span>Home + changes <b>${e.map.score}</b>/${e.map.total} <i>(${mpct}%)</i> · best streak <b>${e.map.best}</b></span>`;
  }

  // ======================= MELODY -> HARMONY ===========================
  let melodyPlaybackRequest = 0;
  let pitchStream = null;
  let pitchContext = null;
  let pitchSource = null;
  let pitchAnalyser = null;
  let pitchDetector = null;
  let pitchBuffer = null;
  let pitchFrame = 0;
  let pitchLastAt = 0;

  function resetPitchSession() {
    const sing = state.melody.sing;
    sing.history = []; sing.stableSince = 0; sing.holdMs = 0;
    sing.success = false; sing.recorded = false; sing.voicedFrames = 0;
  }

  function pitchErrorMessage(error) {
    if (!window.isSecureContext) return "Microphone access needs HTTPS (or localhost). Open the deployed Vercel app, then try again.";
    const name = error && error.name;
    if (name === "NotAllowedError" || name === "SecurityError") return "Microphone access was blocked. Allow it in this site's browser settings, then press Enable mic again.";
    if (name === "NotFoundError") return "No microphone input is available. Connect or enable an input, then try again.";
    if (name === "NotReadableError" || name === "AbortError") return "The input is busy or unavailable. Close another recording app, reconnect the interface, and try again.";
    if (name === "OverconstrainedError") return "That input is no longer available. Choose Default system input and try again.";
    return "The browser could not start this microphone. Check its site permission and the system input, then try again.";
  }

  function setSingStatus(message, kind) {
    const status = $("singStatus");
    if (!status) return;
    status.textContent = message;
    status.className = `sing-status${kind ? ` ${kind}` : ""}`;
  }

  function renderSingInputs() {
    const select = $("singInputSel");
    if (!select) return;
    const sing = state.melody.sing;
    const current = sing.deviceId;
    select.innerHTML = `<option value="">Default system input</option>${sing.inputDevices.map((device, index) =>
      `<option value="${escapeHtml(device.deviceId)}">${escapeHtml(device.label || `Microphone ${index + 1}`)}</option>`).join("")}`;
    select.value = sing.inputDevices.some((device) => device.deviceId === current) ? current : "";
    select.disabled = !sing.inputDevices.length;
  }

  function renderSingTrainer(options) {
    const settings = options || {};
    const sing = state.melody.sing;
    const prompt = state.melody.prompt;
    if ($("singTargetName")) $("singTargetName").textContent = prompt ? prompt.note.name : "—";
    if ($("singTargetRole")) $("singTargetRole").textContent = prompt
      ? `degree ${prompt.note.degree} · ${prompt.hearing.short}` : "Check the note first";
    if ($("btnSingTarget")) $("btnSingTarget").disabled = !prompt || !state.melody.revealed || sing.listening || sing.requesting;
    if ($("btnSingStart")) {
      $("btnSingStart").disabled = !prompt || !state.melody.revealed || sing.listening || sing.requesting;
      $("btnSingStart").textContent = sing.requesting ? "● Requesting…" : sing.listening ? "● Listening…" : "● Enable mic + sing";
    }
    if ($("btnSingStop")) $("btnSingStop").disabled = !sing.listening && !sing.requesting;
    renderSingInputs();
    if (!settings.preserveFeedback && $("melodySing")) {
      $("melodySing").setAttribute("data-pitch", "idle");
      $("singDetectedNote").textContent = "—";
      $("singDetectedHz").textContent = "Waiting for a clear pitch";
      $("singCents").textContent = "—";
      $("singStabilityText").textContent = "—";
      $("singHold").textContent = "0.0 s";
      $("singNeedle").style.left = "50%";
      $("singGauge").setAttribute("aria-valuenow", "0");
      $("singStabilityFill").style.width = "0%";
      $("singInstruction").textContent = "Start the mic, sing on ‘ah,’ and keep the needle near the center for one second.";
    }
  }

  async function refreshPitchInputs() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      state.melody.sing.inputDevices = devices.filter((device) => device.kind === "audioinput");
      renderSingInputs();
    } catch { /* the active track still works when device enumeration is restricted */ }
  }

  function updatePitchUi(reading, raw, summary) {
    const sing = state.melody.sing;
    const section = $("melodySing");
    if (!section) return;
    if (!reading || raw.clarity < 0.72) {
      section.setAttribute("data-pitch", "idle");
      $("singDetectedNote").textContent = "—";
      $("singDetectedHz").textContent = raw.reason === "quiet" ? "Sing a little more clearly" : "Finding one steady note…";
      $("singInstruction").textContent = "Hold one comfortable ‘ah.’ Reduce room noise and keep the mic away from the speakers.";
      $("singHold").textContent = "0.0 s";
      return;
    }

    const cents = Math.round(reading.cents);
    const target = state.melody.prompt.note.name;
    const gaugeCents = Math.max(-50, Math.min(50, reading.cents));
    section.setAttribute("data-pitch", reading.status === "close" || reading.status === "adjust" ? "voiced" : reading.status);
    $("singDetectedNote").textContent = `${reading.note.name}${reading.note.octave}`;
    $("singDetectedHz").textContent = `${raw.frequency.toFixed(1)} Hz · ${Math.round(raw.clarity * 100)}% clear`;
    $("singCents").textContent = reading.correctPitchClass ? `${cents > 0 ? "+" : ""}${cents}¢` : "wrong note";
    $("singStabilityText").textContent = `${summary.stability}%`;
    $("singHold").textContent = `${(sing.holdMs / 1000).toFixed(1)} s`;
    $("singNeedle").style.left = `${50 + gaugeCents}%`;
    $("singGauge").setAttribute("aria-valuenow", String(Math.round(gaugeCents)));
    $("singStabilityFill").style.width = `${summary.stability}%`;
    if (!reading.correctPitchClass) {
      $("singInstruction").textContent = `You are singing ${reading.note.name}; the target is ${target}. Hear the scale degree, then move ${reading.direction === "flat" ? "up" : "down"} to it.`;
    } else if (reading.status === "locked") {
      $("singInstruction").textContent = sing.success ? `Locked: ${target} is now coming from your ear, not the instrument.` : "Centered. Keep the air and vowel steady until the hold completes.";
    } else if (reading.direction === "flat") {
      $("singInstruction").textContent = "Right note, slightly flat. Support the air and let the pitch rise toward center.";
    } else {
      $("singInstruction").textContent = "Right note, slightly sharp. Relax toward the center without dropping the tone.";
    }
  }

  function recordSingResult(correct) {
    const sing = state.melody.sing;
    if (sing.recorded || !PP) return;
    PP.recordProgress({ kind: "sing", correct: !!correct });
    sing.recorded = true;
    renderPlayerProfiles(false);
    if (state.view === "progress") renderProgress();
  }

  function pitchLoop(timestamp) {
    if (!state.melody.sing.listening || !pitchAnalyser || !pitchDetector) return;
    pitchFrame = window.requestAnimationFrame(pitchLoop);
    if (timestamp - pitchLastAt < 72) return;
    pitchLastAt = timestamp;
    pitchAnalyser.getFloatTimeDomainData(pitchBuffer);
    const raw = pitchDetector.detect(pitchBuffer, pitchContext.sampleRate);
    const sing = state.melody.sing;
    const prompt = state.melody.prompt;
    if (!prompt) { stopPitchListening({ record: false, quiet: true }); return; }
    const reading = raw.frequency && raw.clarity >= 0.72 ? PL.analyzeAgainstTarget(raw.frequency, prompt.note.midi, raw.clarity) : null;
    if (!reading) {
      sing.stableSince = 0; sing.holdMs = 0;
      updatePitchUi(null, raw, PL.summarize(sing.history));
      return;
    }
    sing.voicedFrames++;
    const previousReading = sing.history[sing.history.length - 1];
    if (previousReading && previousReading.note.pc !== reading.note.pc) sing.history = [];
    sing.history.push(reading);
    if (sing.history.length > 18) sing.history.shift();
    const summary = PL.summarize(sing.history);
    if (reading.absoluteCents <= 25 && raw.clarity >= 0.78) {
      if (!sing.stableSince) sing.stableSince = timestamp;
      sing.holdMs = timestamp - sing.stableSince;
    } else {
      sing.stableSince = 0; sing.holdMs = 0;
    }
    if (!sing.success && sing.holdMs >= 1000) {
      sing.success = true;
      recordSingResult(true);
      setSingStatus(`Pitch locked · ${prompt.note.name} held in tune for one second · saved to ${PP ? PP.active().displayName : "this profile"}`, "success");
    }
    updatePitchUi(reading, raw, summary);
  }

  function stopPitchListening(options) {
    const settings = Object.assign({ record: false, quiet: false }, options || {});
    const sing = state.melody.sing;
    const wasListening = sing.listening;
    const wasRequesting = sing.requesting;
    sing.listening = false; sing.requesting = false;
    if (pitchFrame) window.cancelAnimationFrame(pitchFrame);
    pitchFrame = 0; pitchLastAt = 0;
    if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) navigator.mediaDevices.removeEventListener("devicechange", refreshPitchInputs);
    if (pitchSource) { try { pitchSource.disconnect(); } catch { /* already disconnected */ } }
    if (pitchAnalyser) { try { pitchAnalyser.disconnect(); } catch { /* already disconnected */ } }
    if (pitchStream) pitchStream.getTracks().forEach((track) => track.stop());
    if (pitchContext && pitchContext.state !== "closed") pitchContext.close().catch(() => {});
    pitchStream = null; pitchContext = null; pitchSource = null; pitchAnalyser = null; pitchDetector = null; pitchBuffer = null;
    if (settings.record && wasListening && sing.voicedFrames >= 8 && !sing.success) recordSingResult(false);
    renderSingTrainer({ preserveFeedback: true });
    if (!settings.quiet && wasRequesting) setSingStatus("Microphone start cancelled. If the browser permission prompt remains open, dismiss it there too.");
    else if (!settings.quiet && wasListening && !sing.success) setSingStatus("Microphone stopped · your last feedback stays visible. Start again whenever you are ready.");
  }

  async function startPitchListening() {
    const prompt = state.melody.prompt;
    if (!prompt || !state.melody.revealed || state.melody.sing.requesting || state.melody.sing.listening) return;
    stopPlay();
    stopPitchListening({ record: false, quiet: true });
    resetPitchSession();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !PL) {
      setSingStatus("This browser does not provide live microphone analysis. Use current Safari, Chrome, or Edge over HTTPS.", "error");
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setSingStatus("This browser does not provide Web Audio input analysis. Use current Safari, Chrome, or Edge.", "error");
      return;
    }
    state.melody.sing.requesting = true;
    renderSingTrainer({ preserveFeedback: true });
    setSingStatus("Requesting microphone permission… audio stays inside this page.");
    const requestedDeviceId = state.melody.sing.deviceId;
    const audio = {
      channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false
    };
    if (requestedDeviceId) audio.deviceId = { exact: requestedDeviceId };
    try {
      // Create/resume during the original button gesture. This matters on iOS,
      // where doing it only after the asynchronous permission prompt can leave
      // the capture context suspended even though the stream was granted.
      pitchContext = new AudioContextClass({ latencyHint: "interactive" });
      if (pitchContext.state === "suspended") await pitchContext.resume();
      if (!state.melody.sing.requesting || state.view !== "melody" || state.melody.prompt !== prompt) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
      if (state.view !== "melody" || state.melody.prompt !== prompt || !state.melody.revealed || !state.melody.sing.requesting) {
        stream.getTracks().forEach((track) => track.stop()); return;
      }
      pitchStream = stream;
      pitchSource = pitchContext.createMediaStreamSource(stream);
      pitchAnalyser = pitchContext.createAnalyser();
      pitchAnalyser.fftSize = 2048;
      pitchAnalyser.smoothingTimeConstant = 0;
      pitchSource.connect(pitchAnalyser); // Never connect the microphone to destination: no feedback path.
      pitchBuffer = new Float32Array(pitchAnalyser.fftSize);
      pitchDetector = PL.createDetector(pitchAnalyser.fftSize, { minFrequency: 70, maxFrequency: 1050 });
      const track = stream.getAudioTracks()[0];
      const settings = track && track.getSettings ? track.getSettings() : {};
      state.melody.sing.inputLabel = track && track.label || "Browser-selected microphone";
      if (settings.deviceId) state.melody.sing.deviceId = settings.deviceId;
      state.melody.sing.requesting = false; state.melody.sing.listening = true;
      if (track) track.addEventListener("ended", () => {
        if (!state.melody.sing.listening) return;
        stopPitchListening({ record: false, quiet: true });
        setSingStatus("The microphone input disconnected. Reconnect it or choose another input, then start again.", "error");
      }, { once: true });
      await refreshPitchInputs();
      if (navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener("devicechange", refreshPitchInputs);
      renderSingTrainer({ preserveFeedback: false });
      setSingStatus(`Listening through ${state.melody.sing.inputLabel} · sing ${prompt.note.name} in any comfortable octave`);
      pitchFrame = window.requestAnimationFrame(pitchLoop);
    } catch (error) {
      stopPitchListening({ record: false, quiet: true });
      setSingStatus(pitchErrorMessage(error), "error");
    }
  }

  function playSingTarget() {
    const prompt = state.melody.prompt;
    if (!prompt || !state.melody.revealed) return;
    stopPitchListening({ record: false, quiet: true });
    resetPitchSession();
    renderSingTrainer({ preserveFeedback: false });
    withMelodyVoice((voice, when) => {
      AU.playSequence([prompt.note], 0.42, when, voice);
      AU.playSequence([prompt.note], 0.42, when + 0.8, voice);
    });
    setSingStatus(`Reference: ${prompt.note.name}, degree ${prompt.note.degree}. Let it stop, imagine it, then enable the mic and sing.`);
  }

  function melodyPromptFor(degreeIndex) {
    return MH.buildPrompt({ tonic: state.tonic, modeId: state.modeId, degreeIndex, depth: state.melody.depth });
  }

  function selectedMelodyCandidate() {
    const prompt = state.melody.prompt;
    if (!prompt) return null;
    return prompt.candidates.find((candidate) => candidate.chord.degreeIndex === state.melody.selectedDegree) || prompt.candidates[0] || null;
  }

  async function withMelodyVoice(callback) {
    const request = ++melodyPlaybackRequest;
    AU.stopAll(); AU.ensure();
    if ($("melodyAudioStatus")) $("melodyAudioStatus").textContent = "Loading the pitch-stable reference…";
    const studio = await AU.prepareStudioPiano();
    if (request !== melodyPlaybackRequest) return;
    if ($("melodyAudioStatus")) $("melodyAudioStatus").textContent = `${studio ? "Sampled studio piano" : "Warm-keys fallback"} · Stop sits in Setup`;
    callback(studio ? "studio" : "piano", AU.now() + 0.06);
  }

  function playMelodyPrompt(homeOnly) {
    const prompt = state.melody.prompt || melodyPromptFor(0);
    withMelodyVoice((voice, when) => {
      AU.playChord(prompt.homeChord.notes, "block", when, voice, 1.05);
      if (!homeOnly && state.melody.prompt) {
        AU.playSequence([prompt.note], 0.35, when + 1.15, voice);
        AU.playSequence([prompt.note], 0.35, when + 2.1, voice);
      }
    });
  }

  function playMelodyCandidate(candidate) {
    const prompt = state.melody.prompt;
    if (!prompt || !candidate) return;
    withMelodyVoice((voice, when) => {
      AU.playChord(candidate.chord.notes, "block", when, voice, 1.7);
      AU.playSequence([prompt.note], 0.3, when + 0.08, voice);
    });
  }

  function playMelodySuccessor(candidate, successor) {
    const prompt = state.melody.prompt;
    if (!prompt || !candidate || !successor) return;
    const moves = MH.enhancementMoves(prompt, candidate, successor);
    const thread = moves.find((move) => move.id === "guide-thread") || moves.find((move) => move.id === "common-tone");
    withMelodyVoice((voice, when) => {
      AU.playChord(candidate.chord.notes, "block", when, voice, 1.25);
      AU.playSequence([prompt.note], 0.3, when + 0.06, voice);
      AU.playChord(successor.chord.notes, "block", when + 1.45, voice, 1.45);
      if (thread) AU.playSequence([thread.notes[1]], 0.3, when + 1.51, voice);
    });
  }

  function playMelodyMove(move) {
    if (!move) return;
    withMelodyVoice((voice, when) => {
      if (move.kind === "pair") {
        AU.playChord(move.chords[0].notes, "block", when, voice, 1.55);
        AU.playChord(move.notes, "block", when + 0.06, voice, 1.45);
        return;
      }
      AU.playChord(move.chords[0].notes, "block", when, voice, 1.2);
      AU.playSequence([move.notes[0]], 0.3, when + 0.05, voice);
      if (move.chords[1]) AU.playChord(move.chords[1].notes, "block", when + 1.42, voice, 1.45);
      AU.playSequence([move.notes[1]], 0.3, when + 1.48, voice);
    });
  }

  function renderMelodyReveal() {
    const root = $("melodyReveal");
    const more = $("melodyMore");
    const prompt = state.melody.prompt;
    if (!prompt || !state.melody.revealed) { root.classList.add("hidden"); if (more) more.open = false; return; }
    root.classList.remove("hidden");
    $("melodyIdentity").innerHTML = `<div><span>Heard note</span><strong>${escapeHtml(prompt.note.name)}</strong><b>degree ${escapeHtml(prompt.note.degree)} · ${prompt.note.off} semitone${prompt.note.off === 1 ? "" : "s"} above ${escapeHtml(prompt.tonic)}</b></div>
      <div><span>Hear its job</span><strong>${escapeHtml(prompt.hearing.short)}</strong><p>${escapeHtml(prompt.hearing.hear)}</p></div>
      <div><span>Road location</span><strong>${escapeHtml(prompt.hearing.zone)}</strong><p>${prompt.hearing.flavour ? "Identity tone in this trainer — compare it directly with the tonic." : "Supporting scale tone — let the chord tell you whether it rests or travels."}</p></div>`;

    const selected = selectedMelodyCandidate();
    $("melodyCandidates").innerHTML = prompt.candidates.map((candidate) => `<button data-melody-candidate="${candidate.chord.degreeIndex}" class="melody-candidate${selected && candidate.chord.degreeIndex === selected.chord.degreeIndex ? " selected" : ""}" data-evidence="${candidate.evidenceKind}">
      <span>${escapeHtml(candidate.rankLabel)} · ${escapeHtml(candidate.chord.workingRole.label)}</span>
      <strong>${escapeHtml(candidate.chord.roman)}</strong><b>${escapeHtml(candidate.chord.symbol)}</b>
      <div><i>melody is ${escapeHtml(candidate.chordTone.roleLabel)}</i><em>${escapeHtml(prompt.note.name)}</em></div>
      <p>${escapeHtml(candidate.roleReason)}</p><small>${escapeHtml(candidate.evidence)}</small></button>`).join("");
    $("melodyCandidates").querySelectorAll("[data-melody-candidate]").forEach((button) => {
      button.onclick = () => {
        state.melody.selectedDegree = +button.getAttribute("data-melody-candidate");
        state.melody.selectedSuccessor = 0;
        const candidate = selectedMelodyCandidate();
        renderMelodyReveal(); playMelodyCandidate(candidate);
      };
    });

    const successors = selected ? selected.successors : [];
    const activeSuccessor = successors[Math.min(state.melody.selectedSuccessor, Math.max(0, successors.length - 1))] || null;
    // The chord colours now live behind "More", so the anticipation heading
    // has to name the chord these moves actually come from.
    $("melodyNextTitle").textContent = selected
      ? `What can follow ${selected.chord.symbol}?`
      : "What can follow?";
    $("melodyNext").innerHTML = successors.length ? successors.map((successor, index) => `<button data-melody-next="${index}" class="melody-next-card${successor === activeSuccessor ? " selected" : ""}">
      <span>${escapeHtml(successor.evidenceLabel)}${successor.returnsHome ? " · returns home" : ""}</span><strong>→ ${escapeHtml(successor.chord.degreeLabel)}</strong><b>${escapeHtml(successor.chord.symbol)}</b>
      <p>${escapeHtml(successor.routes.map((route) => route.label).join(" · "))}</p><small>${escapeHtml(successor.routes[0].group)} · ${escapeHtml(successor.routes[0].tier)}</small></button>`).join("")
      : `<div class="melody-empty"><b>No route is claimed here.</b><p>${escapeHtml(selected.chord.roman)} is a lawful scale-derived chord, but this trainer's verified ${escapeHtml(prompt.mode.name)} maps do not use that degree. Compare the colour; do not memorise it as a common next move.</p></div>`;
    $("melodyNext").querySelectorAll("[data-melody-next]").forEach((button) => {
      button.onclick = () => {
        state.melody.selectedSuccessor = +button.getAttribute("data-melody-next");
        const successor = selectedMelodyCandidate().successors[state.melody.selectedSuccessor];
        renderMelodyReveal(); playMelodySuccessor(selectedMelodyCandidate(), successor);
      };
    });

    const moves = MH.enhancementMoves(prompt, selected, activeSuccessor);
    const moveExamples = Array.from(new Map(moves.filter((move) => move.exampleId).map((move) => [move.exampleId, move])).values());
    $("melodyMoves").innerHTML = moves.map((move, index) => `<button data-melody-move="${index}" class="melody-move">
      <span>${escapeHtml(move.badge)}</span><strong>${escapeHtml(move.label)}</strong><b>♪ ${escapeHtml(move.detail)}</b><p><i>Listen:</i> ${escapeHtml(move.listen)}</p></button>`).join("") +
      (moveExamples.length ? `<div class="melody-example-links">${moveExamples.map((move) => `<button class="mini" data-open-tactical-example="${escapeHtml(move.exampleId)}">Why ${escapeHtml(move.label)}? See the exact practice example →</button>`).join("")}</div>` : "");
    $("melodyMoves").querySelectorAll("[data-melody-move]").forEach((button) => {
      button.onclick = () => playMelodyMove(moves[+button.getAttribute("data-melody-move")]);
    });
    $("melodyMoves").querySelectorAll("[data-open-tactical-example]").forEach((button) => {
      button.onclick = () => openTacticalExample(button.getAttribute("data-open-tactical-example"));
    });
    renderSingTrainer({ preserveFeedback: state.melody.sing.listening || state.melody.sing.voicedFrames > 0 });
  }

  function renderMelodyLab() {
    const m = state.melody;
    $("melodyTonicSel").innerHTML = M.TONICS.map((tonic) => `<option value="${tonic}"${tonic === state.tonic ? " selected" : ""}>${tonic}</option>`).join("");
    document.querySelectorAll("[data-melody-mode]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-melody-mode") === state.modeId));
    document.querySelectorAll("[data-melody-depth]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-melody-depth") === m.depth));
    const scale = m.prompt ? m.prompt.scale : M.scaleOf(state.tonic, state.modeId);
    // One row of seven, not two: the scale rail and the answer buttons showed
    // the same seven degrees side by side. The button now carries everything
    // the rail carried - tetrachord, degree, spelled name (hidden until the
    // reveal), identity-tone marker, and the heard degree.
    $("melodyChoices").innerHTML = scale.map((note, index) => {
      const heard = m.revealed && m.prompt && index === m.prompt.degreeIndex;
      const classes = [
        m.guess === index ? "selected" : "",
        heard ? "right" : "",
        m.revealed && m.guess === index && !heard ? "wrong" : "",
        note.isFlavour ? "flavour" : ""
      ].filter(Boolean).join(" ");
      return `<button data-melody-degree="${index}" class="${classes}"${!m.prompt || m.revealed ? " disabled" : ""}>
      <i>${index < 4 ? "lower tetrachord" : "upper tetrachord"}</i><b>${escapeHtml(note.degree)}</b><em>${m.revealed ? escapeHtml(note.name) : "?"}</em></button>`;
    }).join("");
    $("melodyChoices").querySelectorAll("[data-melody-degree]").forEach((button) => {
      button.onclick = () => { if (!m.revealed) { m.guess = +button.getAttribute("data-melody-degree"); renderMelodyLab(); } };
    });
    $("melodyQuestionTitle").textContent = m.prompt
      ? `Which scale degree did you hear in ${state.tonic} ${M.MODES[state.modeId].name}?`
      : `Known home: ${state.tonic} ${M.MODES[state.modeId].name}`;
    $("melodyFeedback").innerHTML = escapeHtml(m.message);
    $("melodyScore").textContent = `${m.score} / ${m.total}`;
    $("btnMelodyReplay").disabled = !m.prompt;
    $("btnMelodyHint").disabled = !m.prompt || m.revealed;
    $("btnMelodyCheck").disabled = !m.prompt || m.revealed;
    renderMelodyReveal();
  }

  function newMelodyQuestion() {
    stopPitchListening({ record: false, quiet: true });
    const previous = state.melody.prompt ? state.melody.prompt.degreeIndex : -1;
    let degreeIndex = Math.floor(Math.random() * 7);
    if (degreeIndex === previous) degreeIndex = (degreeIndex + 1) % 7;
    state.melody.prompt = melodyPromptFor(degreeIndex);
    state.melody.guess = null;
    state.melody.revealed = false;
    state.melody.hintLevel = 0;
    state.melody.selectedDegree = null;
    state.melody.selectedSuccessor = 0;
    state.melody.message = "Listen for distance and gravity against the known home; sing the answer before choosing.";
    renderMelodyLab(); playMelodyPrompt(false);
  }

  function hintMelodyQuestion() {
    const m = state.melody;
    if (!m.prompt || m.revealed) return;
    m.hintLevel = Math.min(2, m.hintLevel + 1);
    m.message = m.hintLevel === 1
      ? `It sits in the ${m.prompt.hearing.zone}. Hear the home and note again; do not count frets.`
      : `${m.prompt.hearing.flavour ? "It is one of this trainer's identity tones." : "It is a supporting scale tone."} Compare its pull with 1, then commit.`;
    renderMelodyLab(); playMelodyPrompt(false);
  }

  function checkMelodyQuestion() {
    const m = state.melody;
    if (!m.prompt || m.revealed) return;
    if (m.guess == null) { m.message = "Choose a scale degree before checking; your choice stays reversible until then."; renderMelodyLab(); return; }
    m.revealed = true; m.total++;
    const correct = m.guess === m.prompt.degreeIndex;
    if (correct) m.score++;
    m.selectedDegree = m.prompt.candidates[0].chord.degreeIndex;
    m.selectedSuccessor = 0;
    m.message = `${correct ? "✓" : "Not yet:"} the note was ${m.prompt.note.name}, degree ${m.prompt.note.degree} — ${m.prompt.hearing.short}. Now compare what changes when the chord beneath it changes.`;
    renderMelodyLab();
  }

  // ============================ SCALE LAB ================================
  const P = window.Practice;

  function soloTargetLabel(notes) {
    return notes.map((note) => `${note.name} (${note.roleLabel})`).join(" · ");
  }

  // Which landing target suits where you are in the phrase. The phrase roles
  // (Establish / Move / Cadence / Resolve) come from the progression's own
  // timing metadata, so this advice transposes with the route and never
  // hardcodes a key. It is a suggestion the player can ignore — the lens
  // stays whatever they picked.
  const ROLE_ADVICE = {
    Establish: { lens: "root", why: "state the home clearly before you colour it" },
    Move: { lens: "third", why: "the 3rd names each chord as it passes" },
    Cadence: { lens: "guide", why: "guide tones make the pull to home audible" },
    Resolve: { lens: "root", why: "land the root and let the phrase close" }
  };
  function roleAdviceHtml(chord) {
    const advice = chord && ROLE_ADVICE[chord.phraseRole];
    if (!advice) return "";
    const suits = advice.lens === state.solo.focus;
    return `<p class="role-advice${suits ? " suits" : ""}">
      <span>${escapeHtml(chord.phraseRole)}</span>
      ${suits
        ? `Your target fits this bar — ${escapeHtml(advice.why)}.`
        : `On this bar, try <button data-role-lens="${advice.lens}">${escapeHtml(landingLensName(advice.lens))}</button> — ${escapeHtml(advice.why)}.`}
    </p>`;
  }

  function landingLensName(focus) {
    if (focus === "root") return "roots";
    if (focus === "seam") return "resting tones";
    if (focus === "enclose") return "enclosed 3rds";
    if (focus === "triad") return "triad tones";
    if (focus === "guide") return "guide tones";
    if (focus === "sweet") return "sweet 2→3 leans";
    if (focus === "pedal") return "one common note";
    return "colour 3rds";
  }

  // ---- "one note over everything" (common-tone / pedal drill) ----------
  // Find the single pitch that sits best inside EVERY chord of the current
  // progression, name what it becomes over each chord, and let the last
  // chord resolve it. Interval labels are relative to each chord's root.
  const PEDAL_LABEL = { 0: "R", 1: "♭9", 2: "9", 3: "♭3", 4: "3", 5: "11", 6: "♯11", 7: "5", 8: "♭13", 9: "13", 10: "♭7", 11: "7" };
  const PEDAL_SCORE = { 0: 3, 3: 3, 4: 3, 7: 3, 10: 2.5, 11: 2.5, 2: 2, 9: 2, 5: 1, 6: 0.5, 1: 0.4, 8: 0.4 };
  function pedalRole(pc, chord) {
    const off = (((pc - rootPcOf(chord)) % 12) + 12) % 12;
    return { off, label: PEDAL_LABEL[off], score: PEDAL_SCORE[off] || 0 };
  }
  function commonTone() {
    const { chords } = currentProgression();
    let best = null;
    for (let pc = 0; pc < 12; pc++) {
      const roles = chords.map((chord) => pedalRole(pc, chord));
      const minScore = Math.min(...roles.map((role) => role.score));
      // reward a strong resolution on the final chord: the pedal must land home
      const total = roles.reduce((sum, role) => sum + role.score, 0) + (roles[roles.length - 1].score >= 3 ? 1.5 : 0);
      if (!best || minScore > best.minScore || (minScore === best.minScore && total > best.total)) {
        best = { pc, minScore, total };
      }
    }
    if (!best) return null;
    return { pc: best.pc, name: spellPc(best.pc), role: "pedal", roleLabel: "●", degree: "●" };
  }

  function targetRoleLabel(note, phase, focus) {
    // Ring style already says Now (solid terracotta) versus Next (dashed
    // turquoise). Keep the text inside the dot musical: 3/♭3, R, 5, or 7.
    // A player should never have to trade the note's job for a timing label.
    return note.roleLabel || note.degree || phase;
  }

  function triadTones(chord) {
    return chord.notes.filter((note) => ["R", "3", "b3", "5", "b5", "#5"].includes(note.role));
  }

  function triadSpelling(chord) {
    return triadTones(chord).map((note) => `${note.roleLabel} ${note.name}`).join(" · ");
  }

  function placementKey(placement) {
    return `${placement.stringIndex}:${placement.fret}`;
  }

  // Put each selected landing in the actual voice-led shape when possible.
  // Non-triad targets (2→3 leans, real sevenths, common tones) get one nearby
  // playable address—not every occurrence of that pitch across the neck.
  function targetPlacementsForGrip(targets, grip) {
    const shape = grip && grip.placements ? grip.placements : [];
    const used = new Set();
    return (targets || []).map((target) => {
      const inside = shape.find((placement) => placement.note.pc === target.pc && !used.has(placementKey(placement)));
      const candidates = inside ? [inside] : FB.allTonePositions([target]).slice().sort((a, b) => {
        const distance = (placement) => shape.length
          ? Math.min(...shape.map((anchor) => Math.abs(anchor.fret - placement.fret) + 2 * Math.abs(anchor.stringIndex - placement.stringIndex)))
          : Math.abs(placement.fret - 5);
        return distance(a) - distance(b) || Math.abs(a.fret - 5) - Math.abs(b.fret - 5);
      });
      const placement = candidates.find((candidate) => !used.has(placementKey(candidate)));
      if (!placement) return null;
      used.add(placementKey(placement));
      return Object.assign({}, placement, {
        note: Object.assign({}, target, { roleLabel: targetRoleLabel(target, "target", state.solo.focus), colorGroup: "target" })
      });
    }).filter(Boolean);
  }

  function renderPathTargetRoute(cur, next, curTargets, nextTargets) {
    const focus = state.solo.focus;
    const route = P.melodicRoute(state.solo.routeId);
    const focusRoot = $("pathTargetFocus");
    const routeRoot = $("targetRouteGrid");
    const hintRoot = $("targetRouteHint");
    if (!focusRoot || !routeRoot || !hintRoot) return;

    focusRoot.innerHTML = [
      ["third", "3rds · start here", "the colour note that makes each chord audible"],
      ["sweet", "Lean 2→3", "the 2 leans into the chord's 3rd"],
      ["triad", "Triad", "R, 3/♭3, 5"],
      ["guide", "Guides", "3rd + 7th, or 3rd + root"],
      ["pedal", "Common tone", "one note that the chords re-name"]
    ].map(([id, label, detail]) => `<button data-path-focus="${id}" class="${focus === id ? "active" : ""}"><b>${label}</b><span>${detail}</span></button>`).join("");
    focusRoot.querySelectorAll("[data-path-focus]").forEach((button) => {
      button.onclick = () => {
        stopPlay();
        state.solo.focus = button.getAttribute("data-path-focus");
        state.lab.pathIndex = null;
        renderLabPath();
      };
    });

    routeRoot.innerHTML = P.MELODIC_ROUTES.map((item) =>
      `<button data-melodic-route="${item.id}" class="${item.id === route.id ? "active" : ""}">
        <b>${item.label}</b><span>${item.budget}</span></button>`
    ).join("");
    routeRoot.querySelectorAll("[data-melodic-route]").forEach((button) => {
      button.onclick = () => {
        stopPlay();
        state.solo.routeId = button.getAttribute("data-melodic-route");
        state.lab.pathIndex = null;
        renderLabPath();
      };
    });

    hintRoot.innerHTML = `
      <div class="route-map"><span>Now · ${cur.degreeLabel} <b>${cur.symbol}</b></span><strong>${soloTargetLabel(curTargets)}</strong>
      <i>→</i><span>Next · ${next.degreeLabel} <b>${next.symbol}</b></span><strong>${soloTargetLabel(nextTargets)}</strong></div>
      <div class="route-rule"><span>${route.label} · ${route.budget}</span><b>${route.path}</b><p><em>Hear:</em> ${route.hear}</p><p><em>Think:</em> ${route.think}</p></div>
      <p class="route-instrument">On ${window.Tuning.current().name}, keep the destination in your ear while you choose the closest string set. The position is only the route's address; the target is the musical reason for moving.</p>`;
  }

  function labPathOpts() {
    const L = state.lab;
    return {
      layout: L.layout, position: L.position, startDegree: L.startDegree,
      startString: L.startString, firstStroke: L.firstStroke, updown: L.updown
    };
  }

  function renderLab() {
    const L = state.lab;
    $("labPath").classList.toggle("hidden", L.drill !== "path");
    $("labPhrase").classList.toggle("hidden", L.drill !== "phrase");
    $("labCell").classList.toggle("hidden", L.drill !== "cell");
    $("labSharedControls").classList.toggle("hidden", L.drill === "phrase");
    document.querySelectorAll("[data-drill]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-drill") === L.drill));
    $("btnLabPlay").textContent = L.drill === "phrase" ? "▶ Hear phrase (Space)" :
      L.drill === "cell" ? "▶ Hear cell (Space)" : "▶ Play path (Space)";
    if (L.drill === "path") renderLabPath();
    else if (L.drill === "phrase") renderLabPhrase();
    else renderLabCell();
  }

  function renderLabPath() {
    const L = state.lab;
    const path = P.buildPath(state.tonic, state.modeId, labPathOpts());
    if (!path) {
      $("readout").innerHTML = `<div class="ro-foot">No playable path here — try another position or layout.</div>`;
      return;
    }
    const { chords } = currentProgression();
    const index = Math.min(state.progStep, chords.length - 1);
    const cur = chords[index];
    const next = chords[(index + 1) % chords.length];
    const curTargets = soloTargets(cur, state.solo.focus);
    const nextTargets = soloTargets(next, state.solo.focus);
    FB.render(svg(), {
      path: path.nodes, pathIndex: L.pathIndex,
      labelMode: state.labelMode, lefty: state.lefty,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      targetNowPcs: curTargets.map((note) => note.pc),
      targetNextPcs: nextTargets.map((note) => note.pc),
      showStrokes: true
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " picking path");

    const m = path.meta;
    const mode = M.MODES[state.modeId];
    const layoutCue = {
      "3nps": "Three notes per string creates a repeatable alternate-picking cycle. Notice where inside and outside crossings alternate; do not speed up until both feel equally relaxed.",
      "2nps": "Two notes per string puts the string change in one consistent place. Keep the crossing that feels awkward visible and practise it as a two-string loop before playing the whole road.",
      box: "A box keeps the hand local. Use it to connect a target with a short, singable answer—not to prove that every note in the box must be played.",
      horizontal: "The horizontal road makes one string carry the line. Hear the destination first, then shift only after the phrase has a reason to change register."
    }[m.layout] || "Keep the target in your ear before you move the pick.";
    $("readout").innerHTML = `
      <div class="ro-head">
        <span class="fn-badge fn-deg">${m.layout}</span>
        <span class="ro-symbol" style="font-size:22px">${mode.name} on ${state.tonic}</span>
        <span class="ro-key">${cur.degreeLabel} · ${cur.symbol} → ${next.degreeLabel} · ${next.symbol}</span>
      </div>
      <div class="lab-stats">
        <span><b>${m.length}</b> notes</span>
        <span>frets <b>${m.lowFret}–${m.highFret}</b></span>
        <span class="x-out"><b>${m.outside}</b> outside</span>
        <span class="x-in"><b>${m.inside}</b> inside</span>
      </div>
      <div class="ro-foot">
        <b>Technique:</b> ${layoutCue}<br /><br />
        Strict alternate picking starts with a <b>${m.firstStroke}</b>stroke.
        <b class="x-out">Outside</b> crossings sweep around the pair;
        <b class="x-in">inside</b> ones trap the pick between the strings — those are
        the ones that break down first. Loose wrist, pick barely clearing the string,
        and drop the tempo until every crossing is clean. The rings are the ${landingLensName(state.solo.focus)} for this and the next chord: practise the road, then stop on one ring and hear why it belongs.
      </div>`;
    renderPathTargetRoute(cur, next, curTargets, nextTargets);
    $("posLabel").textContent = "Pos " + L.position;
  }

  function renderLabCell() {
    const L = state.lab;
    const cells = P.buildCells(state.tonic, state.modeId, { startDegree: L.startDegree });
    L.cellIdx = Math.min(L.cellIdx, cells.length - 1);
    const cell = cells[L.cellIdx];
    const laid = P.layCell(cell, L.position);

    FB.render(svg(), {
      path: laid.map((n, i) => Object.assign({ stroke: i % 2 === 0 ? "down" : "up" }, n)),
      pathIndex: L.revealed || !L.audiate ? laid.length - 1 : laid.length - 2,
      labelMode: state.labelMode, lefty: state.lefty, showStrokes: false
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " audiation cell");

    const hidden = L.audiate && !L.revealed;
    $("cellProgress").innerHTML = cells.map((c, i) =>
      `<span class="cellpip${i === L.cellIdx ? " on" : ""}${c.phase === "contract" ? " down" : ""}">${c.size}</span>`
    ).join("");

    $("cellBody").innerHTML = `
      <div class="cell-head">
        <span class="cell-size">${cell.size} notes</span>
        <span class="cell-phase ${cell.phase}">${cell.phase === "expand" ? "adding ↑" : "removing ↓"}</span>
        ${cell.isOctave ? '<span class="cell-oct">octave</span>' : ""}
      </div>
      <div class="cell-notes">
        ${cell.notes.map((n, i) => {
          const isT = i === cell.targetIdx;
          return `<span class="cnote${isT ? " target" : ""}${n.isTonic ? " tonic" : ""}${n.isFlavour ? " flavour" : ""}">
            <b>${isT && hidden ? "?" : n.name}</b><i>${isT && hidden ? "•" : n.degree}</i></span>`;
        }).join("")}
      </div>
      <div class="cell-target">
        ${hidden
          ? `Target is the <b>last</b> note. Hear it before you play it — the app leaves a
             silent beat where it belongs. <b>Sing it internally</b>, then reveal.`
          : `Target: <b>${cell.target.name}</b> — degree <b>${cell.target.degree}</b>${
             cell.isOctave ? " (the octave)" : ""}.`}
      </div>`;
    $("btnReveal").textContent = hidden ? "Reveal target" : "Hide target";
    $("readout").innerHTML = `
      <div class="ro-head"><span class="fn-badge fn-deg">${cell.size}</span>
      <span class="ro-symbol" style="font-size:22px">Audiation cell</span></div>
      <div class="ro-foot">Play the cell, leave the last note silent, sing it internally,
      then check yourself. Add a note each pass to the octave, then take one away.</div>`;
    $("posLabel").textContent = "Pos " + L.position;
  }

  function playLabPath() {
    const L = state.lab;
    const path = P.buildPath(state.tonic, state.modeId, labPathOpts());
    if (!path) return;
    AU.stopAll(); AU.ensure();
    AU.playPath(path.nodes, 60 / state.bpm / 2, {
      onStep: (i) => { L.pathIndex = i; renderLabPath(); },
      onDone: () => { L.pathIndex = null; renderLabPath(); }
    });
  }

  function playLabPhrase() {
    const L = state.lab;
    const phrase = P.buildPhrase(state.tonic, state.modeId, state.solo.phraseId, {
      position: L.position, firstStroke: L.firstStroke
    });
    AU.stopAll(); AU.ensure();
    AU.playPath(phrase.nodes, 60 / state.bpm / 2, {
      onStep: (index) => { L.pathIndex = index; renderLabPhrase(); },
      onDone: () => { L.pathIndex = null; renderLabPhrase(); }
    });
  }

  function playLabCell() {
    const L = state.lab;
    const cells = P.buildCells(state.tonic, state.modeId, { startDegree: L.startDegree });
    const cell = cells[L.cellIdx];
    AU.stopAll(); AU.ensure();
    const silent = (L.audiate && !L.revealed) ? [cell.targetIdx] : [];
    AU.playPath(cell.notes, 60 / state.bpm / 2, { silentIndices: silent });
  }

  function stepCell(delta) {
    const L = state.lab;
    const cells = P.buildCells(state.tonic, state.modeId, { startDegree: L.startDegree });
    L.cellIdx = (L.cellIdx + delta + cells.length) % cells.length;
    L.revealed = false;
    renderLabCell();
    playLabCell();
  }

  function shiftPosition(delta) {
    const L = state.lab;
    L.position = Math.max(0, Math.min(12, L.position + delta));
    renderLab();
    if (L.drill === "path") playLabPath();
    if (L.drill === "phrase") playLabPhrase();
  }

  // ============================ PICKING LAB =============================
  // Pennanen and the method sources support the technique categories. The
  // exact event rails are generated here for the selected tuning, key, road,
  // pulse and chord map; they are not copied repertoire or method notation.
  let pickingRunToken = 0;
  let pickingRunTimer = null;

  const PICKING_TREMOLO_FAMILY = {
    "mair-density-ladder": true, "tremolo-ladder": true,
    "counted-tremolo-groupings": true, "tremolo-entry-exit": true
  };

  // BPM level ladders. Anchors are printed sources (Trinity grade minima,
  // the Manolopoulos bouzouki thesis, Mair's 50-60 band, Julin's relayed
  // 100-130 tremolo band); every unanchored step is an app-design default
  // and the UI says so. Triplet values are ENTIRELY app defaults.
  const PICKING_TEMPO_LEVELS = {
    slowTech: [60, 72, 88, 100, 120],
    triplet: [55, 65, 75, 85, 95],
    sixteenth: [60, 80, 100, 120, 140],
    tremolo: [60, 100, 115, 130, 65]
  };

  function pickingTempoFamily(exercise) {
    if (PICKING_TREMOLO_FAMILY[exercise.id]) return "tremolo";
    if (exercise.subdivision === 3) return "triplet";
    if (exercise.subdivision === 4) return "sixteenth";
    return "slowTech";
  }

  function pickingExercise() {
    return PK.byId(state.picking.exerciseId);
  }

  function pickingNode(placement, note) {
    const midi = window.Tuning.open()[placement.stringIndex] + placement.fret;
    return {
      stringIndex: placement.stringIndex, fret: placement.fret, midi,
      freq: 440 * Math.pow(2, (midi - 69) / 12),
      note: Object.assign({}, note, {
        roleLabel: note.roleLabel || note.degree || note.role || "·",
        colorGroup: note.colorGroup || (String(note.role || "").includes("3") ? "third" : note.role === "R" ? "root" : "scaledeg")
      })
    };
  }

  function nearestPickingPlacement(note, anchor, position) {
    // Placements stay inside the working position (a one-hand fret window)
    // and cross at most one course per step: heavy cross-course jumps are
    // counter-idiomatic on bouzouki (Pennanen 1999), and a drill that leaps
    // two courses mid-chunk trains a movement no phrase uses.
    const all = FB.allTonePositions([note]).filter((placement) => placement.fret <= 15);
    const windowed = all.filter((placement) =>
      placement.fret === 0 || (placement.fret >= Math.max(1, position - 1) && placement.fret <= position + 5));
    const candidates = windowed.length ? windowed : all;
    const courseCost = [0, 1.4, 7, 11];
    candidates.sort((left, right) => {
      const score = (placement) => anchor
        ? Math.abs(placement.fret - anchor.fret) + courseCost[Math.min(3, Math.abs(placement.stringIndex - anchor.stringIndex))]
        : Math.abs(placement.fret - position);
      return score(left) - score(right) || left.fret - right.fret;
    });
    return candidates[0] || null;
  }

  function pickingArpeggioNodes(context) {
    const tonic = context.tonic;
    const position = context.position;
    const { chords } = M.buildProgression(tonic, state.modeId, state.progId);
    const index = Math.min(state.progStep, chords.length - 1);
    const current = chords[index];
    const next = chords[(index + 1) % chords.length];
    const tones = [
      current.notes.find((note) => note.role === "R"),
      current.notes.find((note) => String(note.role).includes("3")),
      current.notes.find((note) => String(note.role).includes("5"))
    ].filter(Boolean);
    const grip = FB.findGrip(tones, position);
    const nodes = tones.map((tone) => {
      const placement = grip && grip.placements.find((item) => item.note.pc === tone.pc);
      return placement ? pickingNode(placement, tone) : null;
    }).filter(Boolean);
    const nextThird = next.notes.find((note) => String(note.role).includes("3")) || next.notes[0];
    const landing = nextThird && nearestPickingPlacement(nextThird, nodes[nodes.length - 1], position);
    if (landing) nodes.push(pickingNode(landing, Object.assign({}, nextThird, { colorGroup: "target" })));
    return { nodes, current, next };
  }

  // ---- node prep for the research-backed exercise families (FR-70) ----
  function pickingModeId(context) {
    return (context && context.modeId) || state.modeId;
  }

  function pickingScalePathNodes(context, count) {
    const layout = state.picking.route === "tiered" ? "box" : "horizontal";
    // An along-the-string line lives where bouzouki melody lives — the top
    // course — while an across-the-strings run has to start low to climb.
    const startString = layout === "horizontal" ? window.Tuning.open().length - 1 : state.lab.startString;
    const path = P.buildPath(context.tonic, pickingModeId(context), {
      layout, position: context.position,
      startDegree: 1, startString, firstStroke: state.picking.firstStroke
    });
    return path ? path.nodes.slice(0, count || path.nodes.length) : [];
  }

  function pickingOpenCourseNodes() {
    return window.Tuning.open().map((midiOpen, stringIndex) => pickingNode(
      { stringIndex, fret: 0 },
      { degree: "open", name: window.Tuning.names()[stringIndex], colorGroup: "root" }
    ));
  }

  function pickingSkeletonNodes(context) {
    // Skeleton = tonic, tetrachord joint, 3rd, octave — degrees fixed by the
    // app's own chunk model, marked on a full one-position line.
    const modeId = pickingModeId(context);
    const road = M.tetrachordsOf(context.tonic, modeId);
    const jointPc = road.upper[0] ? road.upper[0].pc : road.lower[road.lower.length - 1].pc;
    const scale = M.scaleOf(context.tonic, modeId);
    const thirdPc = scale[2] ? scale[2].pc : scale[0].pc;
    const tonicPc = scale[0].pc;
    const nodes = pickingScalePathNodes(context, 8);
    return nodes.map((node, index) => Object.assign({}, node, {
      skeleton: node.note && (node.note.pc === tonicPc || node.note.pc === jointPc || node.note.pc === thirdPc) || index === nodes.length - 1
    }));
  }

  function pickingChunkNodes(context) {
    // The chunks ARE the scale in order, so the route comes from the same
    // position-true path builder every scale drill uses — no greedy
    // note-by-note placement that can wander off the position. Each node is
    // tagged lower/upper by its pitch class in the tetrachord road.
    const modeId = pickingModeId(context);
    const road = M.tetrachordsOf(context.tonic, modeId);
    const lowerPcs = new Set(road.lower.map((note) => note.pc));
    const nodes = pickingScalePathNodes(context, 8);
    return nodes.map((node, index) => Object.assign({}, node, {
      chunk: index < nodes.length - 1 && node.note && lowerPcs.has(node.note.pc) && index < 4 ? "lower" : "upper"
    }));
  }

  function pickingPivotNodes(context) {
    // Home phrase ending ON the pivot (= next band key's tonic), then the
    // destination's lower chunk launched from that pitch.
    const cycle = PK.BAND_KEY_CYCLE;
    const fromIndex = Math.max(0, cycle.findIndex((stage) =>
      stage.tonic === context.tonic.charAt(0) || stage.tonic === context.tonic));
    const to = cycle[(fromIndex + 1) % cycle.length];
    const toModeId = bandStageModeId(to.quality);
    const pivotPc = PK.bandPivotPc(fromIndex);
    const home = pickingScalePathNodes(context, 6);
    const nodes = home.map((node) => Object.assign({}, node));
    const scale = M.scaleOf(context.tonic, pickingModeId(context));
    const pivotNote = scale.find((note) => note.pc === pivotPc) || scale[0];
    let anchor = nodes[nodes.length - 1] || null;
    const pivotPlacement = nearestPickingPlacement(pivotNote, anchor, context.position);
    if (pivotPlacement) { const n = Object.assign(pickingNode(pivotPlacement, pivotNote), { pivot: true }); nodes.push(n); anchor = n; }
    const destRoad = M.tetrachordsOf(to.tonic, toModeId);
    destRoad.lower.forEach((note, index) => {
      const placement = nearestPickingPlacement(note, anchor, context.position);
      if (placement) { const n = Object.assign(pickingNode(placement, note), { launch: index === 0 }); nodes.push(n); anchor = n; }
    });
    return nodes;
  }

  function pickingArpCircuitNodes(context) {
    const { chords } = M.buildProgression(context.tonic, pickingModeId(context), state.progId);
    const nodes = [];
    let anchor = null;
    chords.forEach((chord) => {
      const triad = chord.notes.filter((note) => ["R", "3", "b3", "5", "b5", "#5"].includes(note.role));
      triad.concat(triad.length ? [triad[0]] : []).forEach((note, index) => {
        const placement = nearestPickingPlacement(note, anchor, context.position);
        if (!placement) return;
        const n = Object.assign(pickingNode(placement, note), {
          chordStart: index === 0, chordSymbol: chord.symbol
        });
        nodes.push(n); anchor = n;
      });
    });
    return nodes;
  }

  function pickingSequenceLadderNodes(context) {
    const modeId = pickingModeId(context);
    const { chords } = M.buildProgression(context.tonic, modeId, state.progId);
    const cell = pickingScalePathNodes(context, 6);
    const nodes = [];
    const pushCell = (phase, startNote) => {
      let anchor = nodes[nodes.length - 1] || null;
      if (startNote) {
        const placement = nearestPickingPlacement(startNote, anchor, context.position);
        if (placement) { nodes.push(Object.assign(pickingNode(placement, startNote), { cellStart: true, cellPhase: phase })); anchor = nodes[nodes.length - 1]; }
      }
      cell.slice(startNote ? 1 : 0).forEach((node, index) => {
        if (startNote) {
          // The restatement lives in the ANCHOR's register: each cell note is
          // re-placed by the chained window scorer, not copied at its home
          // frets — mimisis restates near the chord tone, it does not leap
          // back across the neck to the original shape.
          const placement = node.note && nearestPickingPlacement(node.note, anchor, context.position);
          if (placement) {
            const replaced = Object.assign(pickingNode(placement, node.note), { cellPhase: phase });
            nodes.push(replaced); anchor = replaced;
          }
          return;
        }
        nodes.push(Object.assign({}, node, { cellStart: index === 0, cellPhase: phase }));
      });
    };
    pushCell("state the cell", null);
    const anchorChord = chords[1] || chords[0];
    const anchorTone = anchorChord.notes.find((note) => note.role === "R") || anchorChord.notes[0];
    pushCell(`restate on ${anchorChord.symbol}`, anchorTone);
    pushCell("vary, then resolve", null);
    return nodes;
  }

  function pickingDescentNodes(context) {
    const run = M.descendingRun(context.tonic, pickingModeId(context));
    const nodes = [];
    let anchor = null;
    run.forEach((tone, index) => {
      const pc = ((tone.midi % 12) + 12) % 12;
      const scale = M.scaleOf(context.tonic, pickingModeId(context));
      const note = scale.find((entry) => entry.pc === pc) || { pc, name: "·", degree: "·" };
      const placement = nearestPickingPlacement(note, anchor, context.position);
      if (placement) { const n = pickingNode(placement, note); nodes.push(n); anchor = n; }
    });
    return nodes;
  }

  function pickingTransposeNodes(context) {
    // Phrase in the reference tonic D, a cue chord, the phrase in the cue key
    // (the next band key). The testimony warrants the mechanic; the phrase is
    // generated.
    const phrase = pickingScalePathNodes(Object.assign({}, context, { tonic: "D" }), 8)
      .map((node, index) => Object.assign({}, node, { phraseStart: index === 0, keyLabel: "phrase in D" }));
    const cycle = PK.BAND_KEY_CYCLE;
    const cueStage = cycle[(Math.max(0, cycle.findIndex((stage) => stage.tonic === "D")) + 1) % cycle.length];
    const cueModeId = bandStageModeId(cueStage.quality);
    const cueChord = M.buildProgression(cueStage.tonic, cueModeId, M.PROGRESSIONS[cueModeId][0].id).chords[0];
    const cueNode = Object.assign({}, phrase[phrase.length - 1] || {}, { cue: true, note: { degree: "cue", name: cueChord.symbol } });
    const target = pickingScalePathNodes(Object.assign({}, context, { tonic: cueStage.tonic, modeId: cueModeId }), 8)
      .map((node, index) => Object.assign({}, node, { phraseStart: index === 0, keyLabel: `same phrase in ${cueChord.symbol}` }));
    return phrase.concat([cueNode]).concat(target);
  }

  function pickingSkipThirdsNodes(context) {
    // Broken thirds on the routed road: 1-3, 2-4, 3-5... - every pair skips
    // the note between, and pairs near course boundaries skip a course.
    const road = pickingScalePathNodes(context, 8);
    const nodes = [];
    for (let index = 0; index + 2 < road.length; index++) {
      nodes.push(Object.assign({}, road[index], { pairStart: true }));
      nodes.push(Object.assign({}, road[index + 2]));
    }
    return nodes;
  }

  function pickingTraversalNodes() {
    // Every course low to high and back: the countdown's crossing chain.
    const open = pickingOpenCourseNodes();
    const order = [];
    for (let i = 0; i < open.length; i++) order.push(i);
    for (let i = open.length - 2; i >= 0; i--) order.push(i);
    return order.map((stringIndex) => Object.assign({}, open[stringIndex]));
  }

  function pickingMonopeniesNodes(context) {
    if (state.picking.variant === "fretted") {
      // Fretted tier: 1-2-3-4 chromatic cell on each course at the position.
      const open = window.Tuning.open();
      const base = Math.max(1, context.position || 1);
      const nodes = [];
      open.forEach((openMidi, stringIndex) => {
        for (let step = 0; step < 4; step++) {
          const fret = base + step;
          const midi = openMidi + fret;
          nodes.push({
            stringIndex, fret, midi,
            freq: 440 * Math.pow(2, (midi - 69) / 12),
            note: { degree: String(step + 1), name: "·", roleLabel: String(step + 1), colorGroup: "scaledeg", pc: ((midi % 12) + 12) % 12 }
          });
        }
      });
      return nodes;
    }
    return pickingTraversalNodes();
  }

  function pickingCrossingCellNodes(context) {
    // A two-course cell from the in-position box road: up to three notes on
    // one course, up to two on the course above it - the flip material.
    const road = pickingScalePathNodes(Object.assign({}, context), 12);
    const byCourse = {};
    road.forEach((node) => { (byCourse[node.stringIndex] = byCourse[node.stringIndex] || []).push(node); });
    const courses = Object.keys(byCourse).map(Number).sort((a, b) => a - b);
    let best = null;
    for (let i = 0; i + 1 < courses.length; i++) {
      const lower = byCourse[courses[i]], upper = byCourse[courses[i + 1]];
      if (!best || Math.min(lower.length, 3) + Math.min(upper.length, 2) > best.score) {
        best = { lower, upper, score: Math.min(lower.length, 3) + Math.min(upper.length, 2) };
      }
    }
    if (!best) return [];
    return best.lower.slice(0, 3).map((node) => Object.assign({}, node, { cell: "lower" }))
      .concat(best.upper.slice(0, 2).map((node) => Object.assign({}, node, { cell: "upper" })));
  }

  function pickingTriadLadderNodes(context) {
    // The same chord three times up the neck: root position, then each
    // inversion in the next window up, then back down. Placements ascend by
    // exact midi so every shape is the chord, never a re-voicing.
    const modeId = pickingModeId(context);
    const { chords } = M.buildProgression(context.tonic, modeId, state.progId);
    const tonicChord = chords.find((chord) => chord.notes.some((note) => note.role === "R" && note.pc === M.parseName(context.tonic).pc)) || chords[0];
    const triad = [
      tonicChord.notes.find((note) => note.role === "R"),
      tonicChord.notes.find((note) => String(note.role).includes("3")),
      tonicChord.notes.find((note) => String(note.role).includes("5"))
    ].filter(Boolean);
    if (triad.length < 3) return [];
    const open = window.Tuning.open();
    const all = FB.allTonePositions(triad).filter((placement) => placement.fret <= 15);
    const midiOf = (placement) => open[placement.stringIndex] + placement.fret;
    const lowestRoot = all.filter((placement) => placement.note.pc === triad[0].pc)
      .sort((left, right) => midiOf(left) - midiOf(right))[0];
    if (!lowestRoot) return [];
    const labels = ["root position · 1-3-5", "1st inversion · 3-5-1", "2nd inversion · 5-1-3"];
    const rotations = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    const climb = [];
    let floorMidi = midiOf(lowestRoot);
    rotations.forEach((rotation, inversionIndex) => {
      let prevMidi = floorMidi - 1;
      let prevString = -1;
      const shape = [];
      rotation.forEach((toneIndex, noteIndex) => {
        const tone = triad[toneIndex];
        // A shape is a GRIP: each tone sits on a higher course than the last
        // (falling back to any course only when the tuning runs out), so the
        // ladder never degrades into a one-string crawl.
        // Each shape STARTS on the root shape's course, so the three
        // inversions are three climbing windows on one string set - the
        // ladder form - instead of collapsing onto the open strings.
        const pool = all.filter((placement) => placement.note.pc === tone.pc && midiOf(placement) > prevMidi
          && (noteIndex > 0 || placement.stringIndex === lowestRoot.stringIndex));
        const climbing = pool.filter((placement) => placement.stringIndex > prevString);
        // After the shape's first note fixes the window, later tones stay in
        // that window (closest fret wins) - a CLOSED, movable shape, not a
        // voicing that borrows open strings and stops being transposable.
        const baseFret = shape.length ? shape[0].placement.fret : null;
        const usable = climbing.length ? climbing : pool;
        // Pitch first, window second: the tone is the NEXT chord tone above
        // the previous one (exact midi), and only among placements of that
        // pitch does window proximity choose - otherwise fret-closeness can
        // grab the right note name an octave too high.
        const targetMidi = usable.length ? Math.min.apply(null, usable.map(midiOf)) : null;
        const candidates = usable.filter((placement) => midiOf(placement) === targetMidi)
          .sort((left, right) => baseFret == null
            ? left.fret - right.fret
            : Math.abs(left.fret - baseFret) - Math.abs(right.fret - baseFret));
        if (candidates.length) {
          shape.push({ placement: candidates[0], tone });
          prevMidi = midiOf(candidates[0]);
          prevString = candidates[0].stringIndex;
        }
      });
      if (shape.length === 3) {
        shape.forEach((entry, noteIndex) => climb.push(Object.assign(pickingNode(entry.placement, entry.tone), {
          inversionStart: noteIndex === 0, positionShift: noteIndex === 0, inversionLabel: labels[inversionIndex]
        })));
        floorMidi = midiOf(shape[0].placement) + (inversionIndex === 0 ? 3 : 3);
      }
    });
    const descent = climb.slice(0, Math.max(0, climb.length - 3)).reverse().map((node, index) => Object.assign({}, node, {
      inversionStart: index % 3 === 0, positionShift: index % 3 === 0,
      inversionLabel: (node.inversionLabel || "") + " · down"
    }));
    return climb.concat(descent);
  }

  function pickingCourseTargetNodes() {
    // The targeting map: walk every course up and down, then every skip
    // pair (both directions). Built from the LIVE tuning so the 3-course
    // trichordo gets a valid map too, not an out-of-range course index.
    const open = pickingOpenCourseNodes();
    const last = open.length - 1;
    const order = [];
    for (let i = 0; i <= last; i++) order.push(i);
    for (let i = last - 1; i >= 0; i--) order.push(i);
    for (let from = 0; from <= last; from++) {
      for (let to = from + 2; to <= last; to++) { order.push(from, to, from); }
    }
    return order.map((stringIndex, index) => Object.assign({}, open[stringIndex], {
      skip: index > 0 && Math.abs(stringIndex - order[index - 1]) > 1
    }));
  }

  function pickingNeckLadderNodes(context) {
    // The same octave road rebuilt in each practical position, lowest to
    // highest and back down. Positions come from the app's own position
    // model; the ladder ORDER is Dromos design, stated in the exercise copy.
    const modeId = pickingModeId(context);
    // The ladder uses the box layout: every rung is a one-position window
    // played ACROSS all four courses, and the windows climb the whole neck.
    // Overlapping windows are thinned so each shift is a real hand move.
    const options = { layout: "box", startDegree: 1, firstStroke: state.picking.firstStroke, updown: false };
    const allRungs = P.positionsFor(context.tonic, modeId, options, context.position)
      .filter((rung) => rung.lowFret <= 12)
      .sort((left, right) => left.lowFret - right.lowFret);
    let ladder = [];
    allRungs.forEach((rung) => {
      if (!ladder.length || rung.lowFret >= ladder[ladder.length - 1].lowFret + 3) ladder.push(rung);
    });
    ladder = ladder.slice(0, 4);
    if (!ladder.length) ladder = [{ position: context.position, lowFret: context.position }];
    const segment = (rung) => {
      const path = P.buildPath(context.tonic, modeId, Object.assign({}, options, { position: rung.position }));
      if (!path) return [];
      // The box window often opens below the tonic; the road is 1 → 8.
      const start = path.nodes.findIndex((node) => node.note && String(node.note.degree) === "1");
      const from = start >= 0 ? start : 0;
      return path.nodes.slice(from, from + 8);
    };
    const nodes = [];
    ladder.forEach((rung) => segment(rung).forEach((node, index) => nodes.push(Object.assign({}, node, {
      positionShift: index === 0, positionLabel: `near fret ${rung.lowFret}`
    }))));
    ladder.slice(0, -1).reverse().forEach((rung) => segment(rung).reverse().forEach((node, index) => nodes.push(Object.assign({}, node, {
      positionShift: index === 0, positionLabel: `back to ${rung.lowFret}`
    }))));
    return nodes;
  }

  function pickingArpChunkNodes(context) {
    // Root-3rd-5th-octave per chord of the active progression. The octave is
    // placed at the exact midi an octave above the chunk's root so the top of
    // every chunk is a real launch note, never a unison restatement.
    const modeId = pickingModeId(context);
    const { chords } = M.buildProgression(context.tonic, modeId, state.progId);
    const openMidi = window.Tuning.open();
    const nodes = [];
    let anchor = null;
    chords.forEach((chord) => {
      const triad = [
        chord.notes.find((note) => note.role === "R"),
        chord.notes.find((note) => String(note.role).includes("3")),
        chord.notes.find((note) => String(note.role).includes("5"))
      ].filter(Boolean);
      if (!triad.length) return;
      // A chunk is a GRIP, not a line: the triad sits as one in-position
      // hand shape across the courses (same placement model as the
      // arpeggio-arrival drill), never chained up a single string.
      const grip = FB.findGrip(triad, context.position);
      let rootNode = null;
      triad.forEach((tone, index) => {
        const placement = (grip && grip.placements.find((item) => item.note.pc === tone.pc))
          || nearestPickingPlacement(tone, anchor, context.position);
        if (!placement) return;
        const node = Object.assign(pickingNode(placement, tone), { chordStart: index === 0, chordSymbol: chord.symbol });
        nodes.push(node); anchor = node;
        if (index === 0) rootNode = node;
      });
      if (rootNode) {
        const targetMidi = rootNode.midi + 12;
        const octaveCourseCost = [0, 1.4, 7, 11];
        const octaveScore = (placement) =>
          Math.abs(placement.fret - anchor.fret) +
          octaveCourseCost[Math.min(3, Math.abs(placement.stringIndex - anchor.stringIndex))];
        const tops = FB.allTonePositions([triad[0]])
          .filter((placement) => placement.fret <= 15 && openMidi[placement.stringIndex] + placement.fret === targetMidi)
          .sort((left, right) => octaveScore(left) - octaveScore(right));
        if (tops.length) {
          const node = Object.assign(
            pickingNode(tops[0], Object.assign({}, triad[0], { degree: "8", roleLabel: "8", colorGroup: "root" })),
            { chordSymbol: chord.symbol, octaveTop: true });
          nodes.push(node); anchor = node;
        }
      }
    });
    return nodes;
  }

  function pickingContourNodes(context) {
    return pickingScalePathNodes(context, 8);
  }

  function pickingBaseNodes(exercise, context) {
    if (exercise.sequence === "arpeggio") return pickingArpeggioNodes(context);
    if (exercise.sequence === "openCourses") return { nodes: pickingOpenCourseNodes(), current: null, next: null };
    if (exercise.sequence === "skeletonFill") return { nodes: pickingSkeletonNodes(context), current: null, next: null };
    if (exercise.sequence === "registerContrast") return { nodes: pickingContourNodes(context), current: null, next: null };
    if (exercise.sequence === "chunkBuilder") return { nodes: pickingChunkNodes(context), current: null, next: null };
    if (exercise.sequence === "ghammazPivot") return { nodes: pickingPivotNodes(context), current: null, next: null };
    if (exercise.sequence === "arpCircuit") return { nodes: pickingArpCircuitNodes(context), current: null, next: null };
    if (exercise.sequence === "sequenceLadder") return { nodes: pickingSequenceLadderNodes(context), current: null, next: null };
    if (exercise.sequence === "skeletonDescent") return { nodes: pickingDescentNodes(context), current: null, next: null };
    if (exercise.sequence === "instantTranspose") return { nodes: pickingTransposeNodes(context), current: null, next: null };
    if (exercise.sequence === "featherTouch") return { nodes: pickingOpenCourseNodes().slice(0, 1), current: null, next: null };
    if (exercise.sequence === "throughStroke") return { nodes: pickingOpenCourseNodes(), current: null, next: null };
    if (exercise.sequence === "mairLadder") return { nodes: pickingOpenCourseNodes().slice(0, 1), current: null, next: null };
    if (exercise.sequence === "skipThirds") return { nodes: pickingSkipThirdsNodes(context), current: null, next: null };
    if (exercise.sequence === "monopenies") return { nodes: pickingMonopeniesNodes(context), current: null, next: null };
    if (exercise.sequence === "traversalCountdown") return { nodes: pickingTraversalNodes(), current: null, next: null };
    if (exercise.sequence === "crossingFlip") return { nodes: pickingCrossingCellNodes(context), current: null, next: null };
    if (exercise.sequence === "triadLadder") return { nodes: pickingTriadLadderNodes(context), current: null, next: null };
    if (exercise.sequence === "courseTarget") return { nodes: pickingCourseTargetNodes(), current: null, next: null };
    if (exercise.sequence === "neckLadder") return { nodes: pickingNeckLadderNodes(context), current: null, next: null };
    if (exercise.sequence === "arpChunks") return { nodes: pickingArpChunkNodes(context), current: null, next: null };
    // Across the strings = the box window: in-position on every course and it
    // FOLLOWS the position control ("2nps" is one fixed shape per key that
    // ignores position — it parked beginners at fret 14). Along the string =
    // horizontal on the top course, where bouzouki melody lives. Drills whose
    // mechanics REQUIRE a layout (crossing grammars) keep their own.
    const routedLayout = state.picking.route === "tiered" ? "box" : "horizontal";
    const ROUTE_LOCKED = { "outside-pairs": true, "mixed-crossings": true, "triplet-grammar": true, "sextolet-glide": true, "full-neck-ladder": true };
    const layout = ROUTE_LOCKED[exercise.id] ? exercise.layout : routedLayout;
    const path = P.buildPath(context.tonic, pickingModeId(context), {
      layout, position: context.position, startDegree: state.lab.startDegree,
      startString: layout === "horizontal" ? window.Tuning.open().length - 1 : state.lab.startString,
      firstStroke: state.picking.firstStroke,
      updown: exercise.id === "outside-pairs" || exercise.id === "mixed-crossings" || exercise.id === "triplet-grammar"
    });
    const { chords } = M.buildProgression(context.tonic, pickingModeId(context), state.progId);
    const index = Math.min(state.progStep, chords.length - 1);
    return { nodes: path ? path.nodes : [], current: chords[index], next: chords[(index + 1) % chords.length] };
  }

  // A band-cycle stage's quality mapped onto the ACTIVE dromos family: minor
  // slots use the minor-family version, major slots the major-family. The
  // chunks are the invariant; the quality follows the singer.
  function bandStageModeId(quality) {
    const minorFamily = ["minor", "harmonicMinor", "ousak"];
    if (quality === "minor") return minorFamily.includes(state.modeId) ? state.modeId : "minor";
    return minorFamily.includes(state.modeId) ? "major" : state.modeId;
  }

  function buildPickingSession(context) {
    const exercise = pickingExercise();
    const resolved = Object.assign({ tonic: state.tonic, position: state.lab.position }, context || {});
    const base = pickingBaseNodes(exercise, resolved);
    const pulse = S.beatMap(S.byId(state.groove.styleId));
    const nodes = PK.buildSequence(exercise.id, base.nodes, pulse, state.picking.firstStroke, state.picking.variant);
    let priorPick = state.picking.firstStroke;
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      if (index > 0) node.crossing = P.crossingType(nodes[index - 1].stringIndex, node.stringIndex, priorPick);
      if (node.stroke) priorPick = node.stroke;
    }
    // The notes follow the selected RHYTHM, not just the click: each event
    // learns which beat of the rhythm it lands on (duration-aware, so dotted
    // formations stay honest). Group starts and beat one get visible marks;
    // drills that own structural accents keep them - this is a second,
    // rhythm-coloured channel, never an overwrite.
    let beatCursor = 0;
    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      const onBeat = Math.abs(beatCursor - Math.round(beatCursor)) < 1e-6;
      if (onBeat) {
        const beatIndex = Math.round(beatCursor) % pulse.length;
        node.rhythmBeat = beatIndex + 1;
        node.rhythmFirst = !!pulse[beatIndex].first;
        node.rhythmGroup = pulse[beatIndex].group;
      }
      beatCursor += (node.durMult > 0 ? node.durMult : 1) / state.picking.subdivision;
    }
    const frets = nodes.map((node) => node.fret);
    return {
      exercise, nodes, pulse, current: base.current, next: base.next, context: resolved,
      meta: {
        lowFret: frets.length ? Math.min(...frets) : 0,
        highFret: frets.length ? Math.max(...frets) : 0,
        inside: nodes.filter((node) => node.crossing === "inside").length,
        outside: nodes.filter((node) => node.crossing === "outside").length
      }
    };
  }

  function pickingPracticalPositions(tonic) {
    const exercise = pickingExercise();
    const compareLayout = state.picking.route === "tiered" ? "2nps" : "horizontal";
    const layout = exercise.sequence === "arpeggio" ? "2nps" : exercise.compare ? compareLayout : exercise.layout;
    const options = {
      layout, position: state.lab.position, startDegree: state.lab.startDegree,
      startString: state.lab.startString, firstStroke: state.picking.firstStroke,
      updown: exercise.id === "outside-pairs" || exercise.id === "mixed-crossings" || exercise.id === "triplet-grammar"
    };
    const positions = P.positionsFor(tonic, state.modeId, options, state.lab.position).filter((item) => item.lowFret <= 15);
    if (!positions.some((item) => item.position === state.lab.position)) {
      const current = P.buildPath(tonic, state.modeId, options);
      positions.push({ position: state.lab.position, lowFret: current ? current.meta.lowFret : state.lab.position });
    }
    return positions;
  }

  function pickingRunPlan() {
    if (state.picking.runMode === "loop") {
      // Infinite loop: one stage; the audio engine repeats it seamlessly.
      return [{ tonic: state.tonic, position: state.lab.position, label: "loop" }];
    }
    if (state.picking.runMode === "evolve" && state.picking.movement === "band") {
      // The band route: G D Dm Am E Em, ordered so each hop's pivot note IS
      // the destination tonic. Minor slots use the minor-family dromos.
      return PK.BAND_KEY_CYCLE.map((stage) => ({
        tonic: stage.tonic,
        modeId: bandStageModeId(stage.quality),
        position: state.lab.position,
        label: `${stage.tonic}${stage.quality === "minor" ? "m" : ""}`
      }));
    }
    return PK.buildPracticePlan({
      tonic: state.tonic, position: state.lab.position, repeats: state.picking.repeats,
      runMode: state.picking.runMode, movement: state.picking.movement,
      tonics: M.TONICS, positions: pickingPracticalPositions(state.tonic)
    });
  }

  function selectPickingExercise(id) {
    stopPlay();
    const exercise = PK.byId(id);
    state.picking.exerciseId = exercise.id;
    state.picking.variant = exercise.variants && exercise.variants.length ? exercise.variants[0].id : "alternate";
    // A triplet drill opened at subdivision 2 would play its grammar as
    // straight eighths — the drill's own grid wins, the seg still overrides.
    if (exercise.subdivision) state.picking.subdivision = exercise.subdivision;
    // 32nds (8/click) are measured-tremolo pedagogy (Mair/Calace import) and
    // unlock only inside the tremolo family; leaving it clamps back down.
    if (state.picking.subdivision === 8 && !PICKING_TREMOLO_FAMILY[exercise.id]) {
      state.picking.subdivision = exercise.subdivision || 2;
    }
    state.picking.pathIndex = null;
    state.picking.cleanPasses = 0;
    renderPickingLab();
    renderPageGuide();
  }

  function selectPickingMode(modeId) {
    stopPlay();
    state.modeId = M.MODES[modeId] ? modeId : "major";
    state.progId = M.PROGRESSIONS[state.modeId][0].id;
    state.progStep = 0;
    state.picking.cleanPasses = 0;
    persistPreferences();
    renderPickingLab();
    renderPageGuide();
  }

  function renderPickingSetup() {
    const exercise = pickingExercise();
    const currentPhase = BK.phaseForExercise(exercise.id);
    // One dropdown per decision: exercise (grouped by mastery stage), key,
    // scale, pulse. The 30-card rail and category nav collapsed into the
    // exercise select; the stage spine below keeps the plan visible.
    $("pickingExerciseSel").innerHTML = BK.MASTERY_PHASES.map((phase) =>
      `<optgroup label="Stage ${phase.step} · ${escapeHtml(phase.label)}">${phase.exerciseIds.map((id) => {
        const item = PK.byId(id);
        return `<option value="${item.id}"${item.id === exercise.id ? " selected" : ""}>${item.order}. ${escapeHtml(item.title)}</option>`;
      }).join("")}</optgroup>`
    ).join("");
    $("pickingExerciseSel").onchange = (event) => selectPickingExercise(event.target.value);
    $("pickingExerciseHelp").textContent = exercise.short;
    $("pickingTonicSel").innerHTML = M.TONICS.map((name) => `<option value="${name}"${name === state.tonic ? " selected" : ""}>${name}</option>`).join("");
    $("pickingTonicSel").onchange = (event) => {
      stopPlay(); state.tonic = event.target.value; state.progStep = 0; state.picking.cleanPasses = 0;
      persistPreferences(); renderPickingLab(); renderPageGuide();
    };
    const pickingModes = ["major", "minor", "harmonicMinor", "ousak", "hijaz"];
    $("pickingModeSel").innerHTML = pickingModes.map((id) =>
      `<option value="${id}"${id === state.modeId ? " selected" : ""}>${escapeHtml(M.MODES[id].name)}</option>`).join("");
    $("pickingModeSel").onchange = (event) => selectPickingMode(event.target.value);
    $("pickingPulseSel").innerHTML = S.STYLES.map((style) => `<option value="${style.id}"${style.id === state.groove.styleId ? " selected" : ""}>${escapeHtml(style.title)} · ${escapeHtml(style.meter)} · ${escapeHtml(style.pulse)}</option>`).join("");
    $("pickingPulseSel").onchange = (event) => { selectGrooveStyle(event.target.value); renderPickingLab(); renderPageGuide(); };
    $("pickingMasterySpine").innerHTML = BK.MASTERY_PHASES.map((phase) =>
      `<span class="${phase.id === currentPhase.id ? "active" : ""}"><i>${phase.step}</i><b>${escapeHtml(phase.label)}</b><small>${escapeHtml(phase.short)}</small></span>`
    ).join("");

  }

  function pickingTechniqueName(mark) {
    return ({ D: "downstroke", U: "upstroke", DG: "downstroke glide", UG: "upstroke glide", H: "hammer-on", P: "pull-off", SL: "slide" })[mark] || mark || "hold";
  }

  function pickingTechniqueMeta(mark) {
    return ({
      D: { glyph: "↓", short: "TA · DOWN", label: "Ta · downstroke", cue: "Pick moves toward the floor. Make one compact, clean attack.", direction: "down" },
      U: { glyph: "↑", short: "KA · UP", label: "Ka · upstroke", cue: "Pick returns toward you. Match the timing and volume of the downstroke.", direction: "up" },
      DG: { glyph: "↓↘", short: "GLIDE", label: "Downstroke glide", cue: "Continue the same down motion through the adjacent course; do not reset the hand.", direction: "down-glide" },
      UG: { glyph: "↑↖", short: "GLIDE", label: "Upstroke glide", cue: "Continue the same up motion through the adjacent course; keep it one connected gesture.", direction: "up-glide" },
      H: { glyph: "H", short: "HAMMER", label: "Hammer-on", cue: "Do not pick again. The left hand places the next attack exactly in time.", direction: "legato" },
      P: { glyph: "P", short: "PULL", label: "Pull-off", cue: "Do not pick again. Release sideways enough for the lower note to speak in time.", direction: "legato" },
      SL: { glyph: "SL", short: "SLIDE", label: "Slide", cue: "Keep finger pressure while the hand connects the two frets as one syllable.", direction: "legato" }
    })[mark] || { glyph: "·", short: "HOLD", label: "Hold", cue: "Let the previous note continue.", direction: "hold" };
  }

  function renderPickingRunPlan() {
    const plan = pickingRunPlan();
    document.querySelectorAll("[data-picking-run]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-picking-run") === state.picking.runMode));
    $("pickingRepeatsSel").value = String(state.picking.repeats);
    $("pickingBpm").value = String(state.bpm);
    if ($("pickingBpmNum")) $("pickingBpmNum").value = String(state.bpm);
    $("pickingBpmVal").textContent = `${state.bpm} BPM`;
    $("pickingMoveSel").value = state.picking.movement;
    $("pickingMoveSel").disabled = state.picking.runMode !== "evolve";
    $("pickingRepeatsSel").disabled = state.picking.runMode !== "evolve";
    $("tglPickingMetronome").checked = state.picking.metronome;
    $("tglPickingCountIn").checked = state.picking.countIn;
    $("pickingVoiceSel").value = state.picking.voice;
    const windows = P.positionsFor(state.tonic, state.modeId,
      { layout: "horizontal", startDegree: 1, startString: state.lab.startString, firstStroke: state.picking.firstStroke },
      state.lab.position).filter((rung) => rung.lowFret <= 12);
    if (!windows.some((rung) => rung.position === state.lab.position)) {
      windows.push({ position: state.lab.position, lowFret: state.lab.position });
      windows.sort((left, right) => left.lowFret - right.lowFret);
    }
    $("pickingPositionSel").innerHTML = windows.map((rung) =>
      `<option value="${rung.position}"${rung.position === state.lab.position ? " selected" : ""}>near fret ${rung.lowFret}</option>`).join("");
    $("pickingPositionSel").onchange = (event) => {
      stopPlay(); state.lab.position = +event.target.value; state.picking.cleanPasses = 0;
      persistPreferences(); renderPickingLab();
    };
    const movementLabel = state.picking.movement === "key" ? "circle-of-fourths keys"
      : state.picking.movement === "band" ? "the band keys G D Dm Am E Em"
      : state.picking.movement === "both" ? "keys and practical positions" : "practical positions";
    $("pickingRunSummary").textContent = state.picking.runMode === "loop"
      ? "Loop forever repeats one exact movement seamlessly until you press stop."
      : `${plan.length} stages through ${movementLabel}; each stage starts exactly where the last one ends.`;
    $("pickingRunMap").innerHTML = plan.map((stage, index) => {
      const current = state.picking.playing && index === state.picking.runIndex;
      const complete = state.picking.playing && state.picking.runIndex != null && index < state.picking.runIndex;
      return `<div class="picking-run-stage${current ? " current" : ""}${complete ? " complete" : ""}"><i>${complete ? "✓" : index + 1}</i><span><b>${escapeHtml(stage.tonic)} ${escapeHtml(M.MODES[state.modeId].short || M.MODES[state.modeId].name)}</b><small>${state.picking.runMode === "loop" ? "same route" : `shape near fret ${stage.lowFret}`}</small></span></div>`;
    }).join("");
  }

  function renderPickingLab() {
    renderPickingSetup();
    renderPickingRunPlan();
    const session = buildPickingSession(state.picking.playing ? state.picking.activeSegment : null);
    const exercise = session.exercise;
    const currentIndex = state.picking.pathIndex;
    // The board reads as intervals; the tiles below carry note names and tab.
    // Each dot: interval inside, stroke above, suggested finger below, and a
    // ring colour for its chunk of the dromos (lower/upper tetrachord road).
    const roadMap = M.tetrachordsOf(session.context.tonic, state.modeId);
    const lowerRoadPcs = new Set(roadMap.lower.map((note) => note.pc));
    const tonicRoadPc = roadMap.scale[0].pc;
    // Finger base is PER SEGMENT: a position shift moves the whole hand, so
    // the one-finger-per-fret map restarts at each segment's own low fret.
    const segmentStarts = [];
    session.nodes.forEach((node, index) => { if (index === 0 || node.positionShift) segmentStarts.push(index); });
    const fingerBases = segmentStarts.map((start, segIndex) => {
      const end = segIndex + 1 < segmentStarts.length ? segmentStarts[segIndex + 1] : session.nodes.length;
      const fretted = session.nodes.slice(start, end).filter((node) => node.fret > 0).map((node) => node.fret);
      if (!fretted.length) return 1;
      // A segment wider than a hand is a traveling line: the traditional
      // horizontal layout moves the whole hand with shifts and slides
      // (Pennanen), so per-fret finger numbers would be a fabrication.
      const span = Math.max.apply(null, fretted) - Math.min.apply(null, fretted);
      return span > 5 ? null : Math.min.apply(null, fretted);
    });
    const fingerBaseFor = (index) => {
      let segIndex = 0;
      segmentStarts.forEach((start, i) => { if (index >= start) segIndex = i; });
      return fingerBases[segIndex];
    };
    const displayPath = session.nodes.map((node, nodeIndex) => Object.assign({}, node, {
      finger: fingerBaseFor(nodeIndex) == null ? null
        : node.fret === 0 ? 0
        : node.fret - fingerBaseFor(nodeIndex) < 4 ? Math.max(1, node.fret - fingerBaseFor(nodeIndex) + 1)
        : "⇧",
      road: node.note && node.note.pc === tonicRoadPc ? "tonic"
        : node.note && lowerRoadPcs.has(node.note.pc) ? "lower"
        : node.note ? "upper" : null
    }));
    FB.render(svg(), {
      path: displayPath, pathIndex: currentIndex,
      labelMode: "degree", lefty: state.lefty, showStrokes: true, largeNeck: true,
      // One unbroken neck for picking: the drill lives in one position, and a
      // split board makes a simple path look like two puzzles. On narrow
      // screens the board scrolls inside its own container.
      neckMode: "full",
      flavourPcs: M.flavourPcs(state.tonic, state.modeId)
    });
    svg().setAttribute("aria-label", `${window.Tuning.current().name} ${exercise.title} picking path`);

    const category = PK.CATEGORIES.find((item) => item.id === exercise.category);
    const mastery = BK.phaseForExercise(exercise.id);
    const articulation = PK.ARTICULATIONS[exercise.articulation];
    const evidenceSources = exercise.sourceIds.map((id) => BK.sourceById(id)).filter(Boolean);
    const motionIndex = currentIndex == null ? 0 : currentIndex;
    const motionEvent = session.nodes[motionIndex] || {};
    const nextMotionEvent = session.nodes[(motionIndex + 1) % Math.max(1, session.nodes.length)] || {};
    const motion = pickingTechniqueMeta(motionEvent.technique);
    const nextMotion = pickingTechniqueMeta(nextMotionEvent.technique);
    const courseNames = window.Tuning.names();
    const rail = session.nodes.map((node, index) => {
      const note = node.note || {};
      const detail = node.crossing ? node.crossing : node.burst ? `${node.burst}-stroke burst` : node.phrase || "";
      const mark = pickingTechniqueMeta(node.technique);
      const tab = node.stringIndex != null && node.fret != null ? `${courseNames[node.stringIndex] || "?"}${node.fret}` : "";
      return `<button data-picking-step="${index}" class="picking-event${node.accent ? " accent" : ""}${node.rhythmFirst ? " on-one" : node.rhythmBeat ? " on-beat" : ""}${index === currentIndex ? " current" : ""}" aria-label="Step ${index + 1}, ${pickingTechniqueName(node.technique)}, ${escapeHtml(note.name || "note")}${tab ? `, ${escapeHtml(tab.replace(/(\D+)(\d+)/, "$1 string fret $2"))}` : ""}${detail ? `, ${escapeHtml(detail)}` : ""}"><i>${index + 1}</i><strong><u>${escapeHtml(mark.glyph)}</u><small>${escapeHtml(mark.short)}</small></strong>${node.rhythmBeat ? `<em class="beat-chip${node.rhythmFirst ? " one" : ""}">${node.rhythmBeat}</em>` : ""}<b>${escapeHtml(note.name || "·")}</b><em class="ev-tab">${escapeHtml(tab)}${tab ? " · " : ""}${escapeHtml(note.roleLabel || note.degree || "·")}</em><small>${escapeHtml(detail)}</small></button>`;
    }).join("");
    $("pickingLesson").innerHTML = `<header class="picking-lesson-head"><div><span>${exercise.order} of ${PK.EXERCISES.length} · stage ${mastery.step} · ${escapeHtml(mastery.label)}</span><h2>${escapeHtml(exercise.title)}</h2><p>${escapeHtml(exercise.short)}</p></div><div class="picking-head-badges"><i>${escapeHtml(window.Tuning.current().name)}</i><b>${escapeHtml(articulation.label)}</b></div></header>
      <div class="picking-articulation"><span>${escapeHtml(articulation.mnemonic)}</span><b>${escapeHtml(articulation.label)}</b><p>${escapeHtml(articulation.detail)}</p></div>
      <div class="picking-motion ${currentIndex == null ? "is-ready" : "is-playing"}" data-motion="${escapeHtml(motion.direction)}" aria-live="polite">
        <section class="picking-motion-now"><span>${currentIndex == null ? "Start with" : `Now · event ${motionIndex + 1}`}</span><b><i>${escapeHtml(motion.glyph)}</i>${escapeHtml(motion.label)}</b><p>${escapeHtml(motion.cue)}</p></section>
        <div class="picking-motion-visual" aria-hidden="true"><i class="pick-shape"></i><b></b><b></b><b></b><span>${motionEvent.accent ? "ACCENT" : "EVEN"}</span></div>
        <section class="picking-motion-next"><span>Prepare next</span><b><i>${escapeHtml(nextMotion.glyph)}</i>${escapeHtml(nextMotion.label)}</b><p>${escapeHtml(nextMotion.cue)}</p></section>
      </div>
      <div class="picking-stroke-key"><span><b>↓ D · TA</b> downstroke</span><span><b>↑ U · KA</b> upstroke</span><span><b>↓↘ DG</b> glide through</span><span><b>H</b> hammer-on</span><span><b>P</b> pull-off</span><span><b>SL</b> slide</span><span><b>1–4</b> one-finger-per-fret window (the modern, method-book layout) · <b>0</b> open · <b>⇧</b> stretch or small shift, your call</span><span>Traveling lines show no numbers: the traditional horizontal layout moves the whole hand with shifts and slides (Pennanen)</span><span class="road-key lower"><b>●</b> lower chunk</span><span class="road-key upper"><b>●</b> upper chunk</span><span class="road-key tonic"><b>●</b> tonic</span><em>Tap an event to hear it and see the motion.</em></div>
      <div class="picking-rhythm-ruler"><b>${escapeHtml(S.byId(state.groove.styleId).title)}</b><span>${escapeHtml(S.byId(state.groove.styleId).meter)} · ${escapeHtml(S.byId(state.groove.styleId).pulse)}</span><i>the click, the accents, and the beat chips below all follow this rhythm</i></div>
      <div class="picking-event-rail" style="--picking-events:${Math.min(12, Math.max(4, session.nodes.length))}">${rail}</div>
      <div class="picking-detail-grid"><section><span>Do this</span><ol>${exercise.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol></section><section><span>Listen for</span><p>${escapeHtml(exercise.listen)}</p></section><section class="picking-theory"><span>Theory inside the motion</span><b>Key ${escapeHtml(session.context.tonic)} · ${escapeHtml(M.MODES[state.modeId].name)}</b><p>${escapeHtml(exercise.theory)}</p><small>${escapeHtml(session.current && session.next ? `${session.current.degreeLabel} ${session.current.symbol} → ${session.next.degreeLabel} ${session.next.symbol}` : "Say every scale degree before you play it.")}</small></section><section><span>Pass when</span><p>${escapeHtml(exercise.pass)}</p></section></div>
      <details class="picking-evidence"><summary>${evidenceSources.length} evidence source${evidenceSources.length === 1 ? "" : "s"} + what Dromos generated</summary><div><span>What the source supports</span><p>${escapeHtml(exercise.evidence)}</p><nav>${evidenceSources.map((source) => `<a href="${escapeHtml(source.href)}" target="_blank" rel="noreferrer"><i>${escapeHtml(source.authority)}</i>${escapeHtml(source.name)} ↗</a>`).join("")}</nav><small><b>Generated exercise:</b> ${escapeHtml(exercise.boundary)}</small></div></details>`;
    $("pickingLesson").querySelectorAll("[data-picking-step]").forEach((button) => button.onclick = () => {
      stopPlay();
      const index = +button.getAttribute("data-picking-step");
      state.picking.pathIndex = index;
      const voice = pickingReferenceVoice();
      readyPracticeAudio(voice).then((ready) => {
        if (!ready) return;
        AU.playPath([session.nodes[index]], 0.35, { referenceVoice: voice, onDone: () => { state.picking.pathIndex = null; if (state.view === "picking") renderPickingLab(); } });
      });
      renderPickingLab();
    });

    $("pickingRouteChoice").classList.toggle("hidden", false);
    document.querySelectorAll("[data-picking-route]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-picking-route") === state.picking.route));
    document.querySelectorAll("[data-picking-subdivision]").forEach((button) => {
      const value = +button.getAttribute("data-picking-subdivision");
      button.classList.toggle("active", value === state.picking.subdivision);
      if (value === 8) button.classList.toggle("hidden", !PICKING_TREMOLO_FAMILY[exercise.id]);
    });
    const variants = exercise.variants || [];
    $("pickingVariantChoice").classList.toggle("hidden", !variants.length);
    $("pickingVariantButtons").innerHTML = variants.map((variant) => `<button data-picking-variant="${escapeHtml(variant.id)}" class="${variant.id === state.picking.variant ? "active" : ""}">${escapeHtml(variant.label)}</button>`).join("");
    $("pickingVariantButtons").querySelectorAll("[data-picking-variant]").forEach((button) => button.onclick = () => {
      stopPlay(); state.picking.variant = button.getAttribute("data-picking-variant"); state.picking.cleanPasses = 0; renderPickingLab();
    });
    $("btnPickingStroke").textContent = `Start · ${state.picking.firstStroke === "down" ? "↓ downstroke" : "↑ upstroke"}`;
    $("btnPickingPlay").textContent = state.picking.playing
      ? (state.picking.runMode === "loop" ? `■ Stop · loop ${state.picking.loopCount || 1}` : `■ Stop · stage ${state.picking.runIndex + 1}/${state.picking.repeats}`)
      : "▶ Start";
    $("btnPickingTempoUp").classList.toggle("hidden", state.picking.cleanPasses < 3);
    const band = S.byId(state.groove.styleId).tempoBand;
    const bandHtml = band
      ? band.low
        ? `<p class="picking-band"><b class="band-${band.strength}">${band.strength}</b> ${escapeHtml(S.byId(state.groove.styleId).title)} band ${band.low}–${band.high} BPM · <button data-picking-band-set="${band.low}">start at ${band.low}</button><small>${escapeHtml(band.note)}</small></p>`
        : `<p class="picking-band"><b class="band-${band.strength}">${band.strength}</b> ${escapeHtml(band.note)}</p>`
      : "";
    const ceiling = state.picking.ceilingBpm
      ? `<p class="picking-ceiling">Ceiling found today: <b>${state.picking.ceilingBpm} BPM</b>. Banked — this is a good place to end the block. It is your own judgement, logged, not a measurement. Skills consolidate between sessions: retest tomorrow before pushing higher (motor-consolidation research).</p>`
      : "";
    const tempoFamily = pickingTempoFamily(exercise);
    const levels = PICKING_TEMPO_LEVELS[tempoFamily];
    const levelsHtml = `<div class="picking-levels"><span>Levels · ${tempoFamily === "tremolo" ? "tremolo path" : tempoFamily === "triplet" ? "triplets" : tempoFamily === "sixteenth" ? "16ths" : "technique"}</span><b>${levels.map((bpm, index) => {
      const label = tempoFamily === "tremolo" && index === 4 ? `L5 · 32nds ${bpm}` : `L${index + 1} · ${bpm}`;
      const active = tempoFamily === "tremolo" && index === 4 ? state.picking.subdivision === 8 : state.bpm === bpm && state.picking.subdivision !== 8;
      return `<button data-picking-level="${index}" class="${active ? "active" : ""}">${label}</button>`;
    }).join("")}</b><small>Printed anchors: Trinity 60/72/88 · Manolopoulos 60→80→120→140 · Mair 50–60 · Julin 100–130 (relayed). Triplet values and unmarked steps are app defaults.</small></div>`;
    $("pickingPasses").innerHTML = `${levelsHtml}<div><span>Clean passes at ${state.bpm} BPM</span><b>${[0, 1, 2].map((index) => `<i class="${index < state.picking.cleanPasses ? "done" : ""}">${index < state.picking.cleanPasses ? "✓" : index + 1}</i>`).join("")}</b></div><p>${state.picking.cleanPasses < 3 ? "Log only a pass with even time, relaxed motion, and the stated listening goal." : "Three honest passes: raise 4 BPM, or stay here if the sound is not yet easy."}</p><p class="picking-science">Difficulty just past comfort is the documented learning zone (challenge-point research); the 4 BPM step is app design, not a validated size. Mixing in a slower block is supported at pilot scale.</p>${bandHtml}${ceiling}`;
    $("pickingPasses").querySelectorAll("[data-picking-level]").forEach((button) => button.onclick = () => {
      const index = +button.getAttribute("data-picking-level");
      stopPlay();
      if (tempoFamily === "tremolo" && index === 4) { state.picking.subdivision = 8; state.bpm = levels[4]; }
      else { if (state.picking.subdivision === 8) state.picking.subdivision = 4; state.bpm = levels[index]; }
      state.picking.cleanPasses = 0;
      AU.setBpm(state.bpm); persistPreferences(); syncPersistentControls(); renderPickingLab();
    });
    const bandBtn = $("pickingPasses").querySelector("[data-picking-band-set]");
    if (bandBtn) bandBtn.onclick = () => {
      state.bpm = +bandBtn.getAttribute("data-picking-band-set");
      state.picking.cleanPasses = 0;
      AU.setBpm(state.bpm); persistPreferences(); syncPersistentControls(); renderPickingLab();
    };

    const pulse = S.byId(state.groove.styleId);
    const chordContext = session.current && session.next ? `${session.current.degreeLabel} ${session.current.symbol} → ${session.next.degreeLabel} ${session.next.symbol}` : "dromos route";
    $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${escapeHtml(category ? category.label : exercise.category)}</span><span class="ro-symbol" style="font-size:22px">${escapeHtml(session.context.tonic)} ${escapeHtml(M.MODES[state.modeId].name)}</span><span class="ro-key">${escapeHtml(chordContext)}</span></div><div class="lab-stats"><span><b>${session.nodes.length}</b> events</span><span>frets <b>${session.meta.lowFret}–${session.meta.highFret}</b></span><span class="x-out"><b>${session.meta.outside}</b> outside</span><span class="x-in"><b>${session.meta.inside}</b> inside</span></div><div class="ro-foot"><b>Pulse:</b> ${escapeHtml(pulse.title)} · ${escapeHtml(pulse.meter)} · ${escapeHtml(pulse.pulse)}.<br /><b>Route:</b> ${exercise.compare ? escapeHtml(state.picking.route) : escapeHtml(exercise.layout)}. Audio previews pitch and timing; your pick supplies the attack, tremolo continuity, and ornaments.</div>`;
  }

  function finishPickingRun(token, plan) {
    if (token !== pickingRunToken) return;
    if (state.picking.runMode === "evolve" && state.picking.runHome) {
      state.tonic = state.picking.runHome.tonic;
      state.lab.position = state.picking.runHome.position;
      persistPreferences();
    }
    state.picking.playing = false;
    state.picking.pathIndex = null;
    state.picking.runIndex = null;
    state.picking.activeSegment = null;
    setPlayingUI(false);
    if (state.view === "picking") { renderPickingLab(); renderPageGuide(); }
  }

  function playPickingStage(plan, stageIndex, token, startAt) {
    if (token !== pickingRunToken) return;
    if (stageIndex >= plan.length) { finishPickingRun(token, plan); return; }
    const stage = plan[stageIndex];
    state.picking.runIndex = stageIndex;
    state.picking.activeSegment = stage;
    state.picking.pathIndex = null;
    const session = buildPickingSession(stage);
    if (!session.nodes.length) { finishPickingRun(token, plan); return; }
    renderPickingLab();
    const beatSpacing = 60 / state.bpm;
    const noteSpacing = beatSpacing / state.picking.subdivision;
    // Loop mode is an INFINITE, seamless loop: one session, scheduled
    // bar-aligned on the audio clock, until the player presses Stop.
    const looping = state.picking.runMode === "loop";
    // Gap-click levels: the click thins to group starts, then to bar one.
    const gapLevel = pickingExercise().id === "gap-click-pulse" ? state.picking.variant : null;
    const clickFilter = gapLevel === "groups" ? (beat, pulseBeat) => !!pulseBeat.first
      : gapLevel === "barone" ? (beat, pulseBeat, pulseLength) => beat % pulseLength === 0
      : null;
    const silentIndices = [];
    session.nodes.forEach((node, index) => { if (node.silent) silentIndices.push(index); });
    const stageEnd = AU.playPath(session.nodes, noteSpacing, {
      referenceVoice: pickingReferenceVoice(),
      silentIndices,
      metronome: state.picking.metronome,
      beatSpacing,
      clickFilter,
      loop: looping,
      startAt,
      onDoneLead: 0.35,
      pulse: session.pulse,
      countInBeats: stageIndex === 0 && state.picking.countIn ? session.pulse.length : 0,
      onStep: (index) => {
        if (token === pickingRunToken && state.view === "picking") {
          state.picking.pathIndex = index;
          if (index % state.picking.subdivision === 0) beatPulse(false, [$("btnPickingPlay")]);
          renderPickingLab();
        }
      },
      onLoop: (iteration) => {
        if (token !== pickingRunToken) return;
        state.picking.loopCount = iteration + 1;
        const play = $("btnPickingPlay");
        if (play) play.textContent = `■ Stop · loop ${iteration + 1}`;
      },
      onDone: looping ? null : () => {
        if (token !== pickingRunToken) return;
        state.picking.pathIndex = null;
        // Evolve stages hand off ON the audio clock: the next stage starts
        // exactly where this one ended, no restart gap.
        playPickingStage(plan, stageIndex + 1, token, stageEnd);
      }
    });
  }

  async function playPickingExercise() {
    stopPlay();
    if (!await readyPracticeAudio(pickingReferenceVoice())) return;
    const plan = pickingRunPlan();
    if (!plan.length) return;
    const token = ++pickingRunToken;
    state.picking.playing = true;
    state.picking.runIndex = 0;
    state.picking.loopCount = 0;
    state.picking.runHome = { tonic: state.tonic, position: state.lab.position };
    setPlayingUI(true, "■ Stop picking");
    playPickingStage(plan, 0, token);
  }

  function stepPickingExercise(delta) {
    const index = PK.EXERCISES.findIndex((exercise) => exercise.id === state.picking.exerciseId);
    selectPickingExercise(PK.EXERCISES[(index + delta + PK.EXERCISES.length) % PK.EXERCISES.length].id);
  }

  function logPickingPass() {
    if (state.picking.playing) return;
    state.picking.cleanPasses = Math.min(3, state.picking.cleanPasses + 1);
    renderPickingLab();
  }

  // The documented ladder protocol (Rawlinson practice-prescription pattern,
  // shown in-app as "documented teaching practice", never "optimal"): climb
  // +4 BPM after three self-scored clean passes, drop back one rung on a
  // miss, and when the session oscillates across the same adjacent rung pair
  // twice, that boundary IS the day's ceiling — bank it and move on.
  function recordRung(bpm) {
    const history = state.picking.rungHistory;
    history.push(bpm);
    if (history.length > 8) history.shift();
    // a→b→a→b→a on adjacent rungs = oscillation: the ceiling is found.
    if (history.length >= 5) {
      const tail = history.slice(-5);
      const a = tail[0], b = tail[1];
      const adjacent = Math.abs(a - b) === 4;
      const alternates = tail.every((value, index) => value === (index % 2 === 0 ? a : b));
      if (adjacent && alternates) {
        state.picking.ceilingBpm = Math.max(a, b);
        try {
          const store = JSON.parse(localStorage.getItem("dromos-picking-ceilings") || "{}");
          store[`${state.picking.exerciseId}:${state.picking.variant}`] =
            { bpm: state.picking.ceilingBpm, date: new Date().toISOString().slice(0, 10) };
          localStorage.setItem("dromos-picking-ceilings", JSON.stringify(store));
        } catch { /* private mode */ }
      }
    }
  }

  function raisePickingTempo() {
    if (state.picking.cleanPasses < 3) return;
    state.bpm = Math.min(180, state.bpm + 4);
    state.picking.cleanPasses = 0;
    recordRung(state.bpm);
    AU.setBpm(state.bpm); persistPreferences(); syncPersistentControls(); renderPickingLab(); renderPageGuide();
  }

  function missPickingPass() {
    if (state.picking.playing) return;
    state.picking.cleanPasses = 0;
    state.bpm = Math.max(40, state.bpm - 4);
    recordRung(state.bpm);
    AU.setBpm(state.bpm); persistPreferences(); syncPersistentControls(); renderPickingLab();
  }

  // ============================= TRIADS ==================================
  const TR = window.Triads;

  function spellPc(pc) {
    const scale = M.scaleOf(state.tonic, state.modeId);
    const hit = scale.find((n) => n.pc === pc);
    return hit ? hit.name : M.simplify(M.nameFor(0, pc));
  }

  // The one status line on Comp. It names the control that actually starts the
  // pulse (the panel Play beside the skeleton) and the drawer group that owns
  // bass/drums - the copy used to point at a hidden transport and at a settings
  // group that had been renamed "Practice ensemble".
  const COMP_IDLE_LINE = "Press ▶ Play under this skeleton to move the pulse through it. Bass and drums are optional timing aids in Settings → Practice ensemble.";

  function renderCompSkeleton(chord) {
    const root = $("compSkeleton");
    if (!root) return;
    const plan = S.compPlan(state.groove.styleId, state.triads.rhythmLevel);
    const labels = {
      accent: ["accent", "mute or clap"], bass: ["bass", "state the root"], chord: ["chord", chord.symbol],
      walk: ["walk", "one tone toward next root"], keep: ["anchor", "keep this audible"],
      free: ["free", "fill or leave space"], space: ["space", "do not fill"]
    };
    root.innerHTML = `<header><div><span>${escapeHtml(plan.style.title)} · ${escapeHtml(plan.style.meter)}</span><b>${escapeHtml(plan.style.pulse)}</b></div><i>trainer skeleton · not a complete style arrangement</i></header>
      <div class="comp-levels" role="group" aria-label="Comping rhythm level">${[1, 2, 3].map((level) =>
        `<button data-comp-level="${level}" aria-pressed="${level === plan.level}" class="${level === plan.level ? "active" : ""}"><b>Level ${level}</b><span>${level === 1 ? "accents" : level === 2 ? "bass + chord" : "free hand"}</span></button>`).join("")}</div>
      <div class="comp-pulse-grid" style="--comp-units:${plan.units};--comp-mobile-units:${Math.min(5, plan.units)}" data-comp-units="${plan.units}" aria-label="${escapeHtml(plan.style.title)} level ${plan.level} pulse">${plan.slots.map((slot) => {
        const label = labels[slot.action] || labels.space;
        return `<span data-comp-unit="${slot.unit}" class="comp-slot ${slot.action}${slot.groupStart ? " group-start" : ""}"><i>${slot.unit}</i><b>${escapeHtml(label[0])}</b><small>${escapeHtml(label[1])}</small></span>`;
      }).join("")}</div>
      <p class="comp-level-note">${escapeHtml(plan.note)}</p>
      <p class="comp-pulse-now" data-comp-now aria-live="polite">${COMP_IDLE_LINE}</p>`;
    root.querySelectorAll("[data-comp-level]").forEach((button) => button.onclick = () => {
      stopPlay();
      state.triads.rhythmLevel = +button.getAttribute("data-comp-level");
      renderTriads();
    });
  }

  function updateCompPulse(beatInBar) {
    const root = $("compSkeleton");
    if (!root || state.view !== "triads") return;
    const units = +root.querySelector("[data-comp-units]")?.getAttribute("data-comp-units") || 0;
    const beatCount = currentPulse().beats.length;
    root.querySelectorAll("[data-comp-unit]").forEach((slot) => {
      const unit = +slot.getAttribute("data-comp-unit");
      const slotBeat = Math.floor(((unit - 1) * beatCount) / Math.max(1, units));
      const current = beatInBar >= 0 && slotBeat === beatInBar;
      slot.classList.toggle("current", current);
      if (current) slot.setAttribute("aria-current", "true");
      else slot.removeAttribute("aria-current");
    });
    const now = root.querySelector("[data-comp-now]");
    if (now && beatInBar >= 0) now.textContent = `Beat ${beatInBar + 1} of ${beatCount} · keep the marked job clear.`;
  }

  // When playback stops the skeleton must stop claiming a beat is sounding.
  function resetCompPulse() {
    const root = $("compSkeleton");
    if (!root) return;
    root.querySelectorAll("[data-comp-unit]").forEach((slot) => {
      slot.classList.remove("current");
      slot.removeAttribute("aria-current");
    });
    const now = root.querySelector("[data-comp-now]");
    if (now) now.textContent = COMP_IDLE_LINE;
  }

  function renderTriads() {
    const { chords } = currentProgression();
    const t = state.triads;
    t.step = Math.min(t.step, chords.length - 1);
    const path = TR.pathThrough(chords, {
      stringSet: t.stringSet, zone: t.zone, closeLoop: state.loop, nameFor: spellPc
    });
    const cur = path[t.step];
    if (!cur) return;

    let others = TR.allShapes(chords[t.step].rootPc, cur.triadId, spellPc);
    others = others.filter((shape) => shape.stringSet[0] === cur.stringSet[0]);
    const zone = TR.POSITION_ZONES[t.zone] || TR.POSITION_ZONES.mid;
    const zoned = others.filter((shape) => shape.lowFret >= zone.min &&
      Math.max(...shape.placements.map((placement) => placement.fret)) <= zone.max);
    if (zoned.length) others = zoned;

    FB.render(svg(), {
      grip: { placements: cur.placements },
      otherShapes: t.showAll ? others : [],
      labelMode: state.labelMode, lefty: state.lefty,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId)
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " triad map");

    // movement from the previous shape
    let move = "";
    if (t.step > 0 && path[t.step - 1]) {
      const prev = path[t.step - 1];
      const moved = cur.placements.filter((p, i) => p.fret !== prev.placements[i].fret).length;
      const travel = cur.placements.reduce((a, p, i) => a + Math.abs(p.fret - prev.placements[i].fret), 0);
      move = `<div class="tri-move"><b>${moved}</b> of 3 fingers move · <b>${travel}</b> fret${travel === 1 ? "" : "s"} of travel from ${prev.chord.symbol}</div>`;
    }

    $("readout").innerHTML = `
      <div class="ro-head">
        <span class="fn-badge fn-deg">${cur.chord.degreeLabel}</span>
        <span class="ro-symbol">${cur.chord.symbol}</span>
        <span class="ro-key">${cur.triadName} triad</span>
      </div>
      <div class="tri-tags">
        <span class="tri-inv i-${cur.inversion}">${cur.inversionName}</span>
        <span class="tri-set">${cur.setLabel} strings</span>
        <span class="tri-fret">fret ${cur.lowFret}</span>
      </div>
      ${move}
      <div class="ro-notes">
        ${cur.placements.slice().reverse().map((p) => `
          <div class="note-chip held" data-group="${p.note.colorGroup}">
            <span class="chip-role">${p.note.roleLabel}</span>
            <span class="chip-name">${p.note.name}</span>
            <span class="chip-tag">fret ${p.fret}</span>
          </div>`).join("")}
      </div>
      <div class="ro-foot"><b>This is a route, not a chord dictionary.</b> ${others.length} inversions fit the selected string set and neck area; the highlighted one keeps the complete progression compact. Sevenths are colour on top of the triad — over <b>${cur.chord.symbol}</b> these three notes are the skeleton.</div>`;

    $("triadStrip").innerHTML = path.map((p, i) => p ? `
      <button class="pchip${i === t.step ? " active" : ""}" data-tstep="${i}">
        <span class="pchip-deg">${p.inversionShort} · f${p.lowFret}</span>
        <span class="pchip-sym">${p.chord.symbol}</span></button>` : "").join('<span class="pchip-arrow">→</span>');
    $("triadStrip").querySelectorAll("[data-tstep]").forEach((b) => {
      b.onclick = () => { t.step = +b.getAttribute("data-tstep"); renderTriads(); auditionTriad(); };
    });
    renderCompSkeleton(cur.chord);
  }

  function auditionTriad() {
    const { chords } = currentProgression();
    const path = TR.pathThrough(chords, { stringSet: state.triads.stringSet, zone: state.triads.zone, closeLoop: state.loop, nameFor: spellPc });
    const cur = path[Math.min(state.triads.step, path.length - 1)];
    if (!cur) return;
    AU.ensure();
    AU.playChord(cur.placements.map((p) => ({ freq: 440 * Math.pow(2, (p.midi - 69) / 12) })), "strum", undefined, chordReferenceVoice());
  }

  function stepTriad(d) {
    const { chords } = currentProgression();
    state.triads.step = (state.triads.step + d + chords.length) % chords.length;
    renderTriads(); auditionTriad();
  }

  function syncTriadControls() {
    const sets = TR.stringSets3();
    const names = window.Tuning.names();
    const automatic = Math.max(0, window.Tuning.count() - 3);
    $("setSel").innerHTML = `<option value="">Auto · ${names.slice(automatic, automatic + 3).join("–")}</option>` +
      sets.map((s) => `<option value="${s[0]}"${state.triads.stringSet === s[0] ? " selected" : ""}>${
        names.slice(s[0], s[0] + 3).join("-")} strings</option>`).join("");
    if (state.triads.stringSet != null && !sets.some((s) => s[0] === state.triads.stringSet)) {
      state.triads.stringSet = null;   // tuning changed under us
    }
    $("triadZoneSel").innerHTML = Object.values(TR.POSITION_ZONES).map((zone) =>
      `<option value="${zone.id}"${state.triads.zone === zone.id ? " selected" : ""}>${zone.label}</option>`).join("");
  }

  // ============================= SOLO LAB ================================
  function renderSoloMapControls() {
    const root = $("soloMapControls");
    if (!root) return;
    const mode = M.MODES[state.modeId];
    const progressions = M.PROGRESSIONS[state.modeId];
    const { chords } = currentProgression();
    root.innerHTML = `
      <div class="solo-map-head music-context"><div><b>${mode.name} on ${state.tonic}</b><span>Key ${state.tonic} · ${mode.greek} · ${window.Tuning.current().name}</span></div>
        <label>Home <select id="soloTonic">${M.TONICS.map((tonic) =>
          `<option value="${tonic}"${tonic === state.tonic ? " selected" : ""}>${tonic}</option>`).join("")}</select></label></div>
      <div class="solo-mode-grid">${M.MODE_ORDER.map((modeId) => {
        const item = M.MODES[modeId];
        return `<button data-solo-mode="${modeId}" class="${modeId === state.modeId ? "active" : ""}"><b>${item.name}</b><span>${item.greek}</span></button>`;
      }).join("")}</div>
      <div class="solo-progression-list">${progressions.map((progression) =>
        `<button data-solo-prog="${progression.id}" class="${progression.id === state.progId ? "active" : ""}"><b>${progression.label}</b><span>${progression.tag}</span></button>`
      ).join("")}</div>
      <div class="solo-current-change"><span>Now playing</span>${chords.map((chord, index) => {
        const main = `<button data-solo-step="${index}" class="${index === state.progStep ? "active" : ""}"><i>${chord.degreeLabel}</i><b>${chord.symbol}</b></button>`;
        const held = barsFor(chord) > 1 ? `<button data-solo-step="${index}" data-held-for="${index}" class="held${index === state.progStep ? " active" : ""}" aria-label="${chord.symbol} holds for a second bar"><i>${chord.degreeLabel}</i><b>${chord.symbol}</b><u>hold</u></button>` : "";
        return main + held;
      }).join('<em>→</em>')}</div>`;

    $("soloTonic").onchange = (event) => {
      stopPlay();
      state.tonic = event.target.value;
      renderSoloMapControls(); renderSoloSection();
    };
    root.querySelectorAll("[data-solo-mode]").forEach((button) => {
      button.onclick = () => {
        stopPlay();
        state.modeId = button.getAttribute("data-solo-mode");
        state.progId = M.PROGRESSIONS[state.modeId][0].id;
        state.progStep = 0;
        syncProgControls(); renderSoloMapControls(); renderSoloSection();
      };
    });
    root.querySelectorAll("[data-solo-prog]").forEach((button) => {
      button.onclick = () => {
        stopPlay();
        state.progId = button.getAttribute("data-solo-prog"); state.progStep = 0;
        renderSoloMapControls(); renderSoloSection(); auditionProg();
      };
    });
    root.querySelectorAll("[data-solo-step]").forEach((button) => {
      button.onclick = () => {
        stopPlay(); state.progStep = +button.getAttribute("data-solo-step");
        renderSoloMapControls(); renderSoloSection(); auditionProg();
      };
    });
  }

  function noteMatrix(notes, lane) {
    return notes.map((note) => `<span class="matrix-note ${lane}${note.isTonic ? " tonic" : ""}${note.isFlavour ? " flavour" : ""}">
      <b>${note.name}</b><i>${note.degree}</i></span>`).join("");
  }

  function renderSoloRoad() {
    const road = M.tetrachordsOf(state.tonic, state.modeId);
    const movement = M.movementPolicy(state.modeId);
    const { chords } = currentProgression();
    const current = chords[Math.min(state.progStep, chords.length - 1)];
    const lower = road.lower;
    const upper = road.upper;
    const lens = state.solo.lens;
    // Mobile ascending tones render as hollow road dots (Ousak's sharpened
    // 2nd/6th); the 2nd lives in the lower cell, the 6th in the upper.
    const mobile = M.mobileTonesOf(state.tonic, state.modeId)
      .map((note) => Object.assign({}, note, { road: note.off < 6 ? "lower" : "upper" }))
      .filter((note) => lens === "full" || (lens === "lower" ? note.road === "lower" : note.road === "upper"));
    const roadNotes = (lens === "lower" ? lower : lens === "upper" ? upper : lower.concat(upper.slice(0, -1))).concat(mobile);
    const focusTargets = soloTargets(current, state.solo.focus);

    FB.render(svg(), {
      roadNotes,
      roadString: state.solo.oneCourse ? "top" : null,
      targetPcs: focusTargets.map((note) => note.pc),
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      labelMode: state.labelMode, lefty: state.lefty,
      overlayRange: { from: 0, to: FB.N_FRETS }
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " full-neck Solo Road");

    $("soloRoad").innerHTML = `
      <div class="road-kicker"><b>Full-neck road</b><span>Each colour is a movable melodic neighbourhood, not a rule that replaces your ear.</span></div>
      <div class="road-lenses" aria-label="Solo road lens">
        <button data-road-lens="full" class="${lens === "full" ? "active" : ""}"><b>Whole road</b><span>1 → 8</span></button>
        <button data-road-lens="lower" class="${lens === "lower" ? "active" : ""}"><b>Lower cell</b><span>1 → 4</span></button>
        <button data-road-lens="upper" class="${lens === "upper" ? "active" : ""}"><b>Upper cell</b><span>5 → 8</span></button>
        <button data-road-one-course class="${state.solo.oneCourse ? "active" : ""}" aria-pressed="${state.solo.oneCourse}"><b>One course</b><span>a single string</span></button>
      </div>
      ${state.modeId === "ousak" ? '<p class="road-mobile-hint">Hollow dots are the two verified ascending alternatives.</p>' : ""}
      <p class="road-direction-boundary ${movement.status}"><b>${escapeHtml(movement.label)}:</b> ${escapeHtml(movement.detail)}</p>
      <div class="tetra-matrix">
        <section class="tetra-card lower"><div><b>First part</b><span>lower tetrachord · 1–4</span></div><div>${noteMatrix(lower, "lower")}</div></section>
        <section class="tetra-card upper"><div><b>Second part</b><span>upper tetrachord · 5–8</span></div><div>${noteMatrix(upper, "upper")}</div></section>
      </div>
      <div class="road-practice"><b>One musical cycle</b><ol><li>Sing 1–2–3–4, then 5–6–7–8.</li><li>Choose one position and find the same two colour lanes.</li><li>Use a four-note number pattern, then finish on a target in <strong>${current.symbol}</strong>.</li></ol></div>`;
    $("soloRoad").querySelectorAll("[data-road-lens]").forEach((button) => {
      button.onclick = () => { state.solo.lens = button.getAttribute("data-road-lens"); renderSoloRoad(); };
    });
    const oneCourse = $("soloRoad").querySelector("[data-road-one-course]");
    if (oneCourse) oneCourse.onclick = () => { state.solo.oneCourse = !state.solo.oneCourse; renderSoloRoad(); };

    $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${current.degreeLabel}</span>
      <span class="ro-symbol" style="font-size:22px">${current.symbol}</span><span class="ro-key">current box · ${M.MODES[state.modeId].name} on ${state.tonic}</span></div>
      <div class="road-readout"><span class="road-dot lower"></span><b>First part</b> ${lower.map((note) => note.name).join(" · ")}<br />
      <span class="road-dot upper"></span><b>Second part</b> ${upper.map((note) => note.name).join(" · ")}</div>
      <div class="ro-foot">Start with the road in one position. Only then connect it across the neck, so your eye sees intervals and destinations—not unrelated dots.</div>`;
  }

  function chordTone(chord, role) {
    return chord.notes.find((note) => note.role === role) || null;
  }

  // The Solo map's scale background: the full dromos as tetrachord-tagged
  // road notes (lower = blue, upper = violet), including Ousak's mobile
  // ascending tones as hollow dots. Rendered quiet — it is the floor, not
  // the message.
  function soloBackgroundRoad() {
    const road = M.tetrachordsOf(state.tonic, state.modeId);
    const mobile = M.mobileTonesOf(state.tonic, state.modeId)
      .map((note) => Object.assign({}, note, { road: note.off < 6 ? "lower" : "upper" }));
    return road.lower.concat(road.upper.slice(0, -1)).concat(mobile);
  }

  function soloTargets(chord, focus) {
    const third = chordTone(chord, "3") || chordTone(chord, "b3");
    if (focus === "root") {
      // The most final landing there is. Useful precisely because it is
      // blunt: it ends a phrase rather than colouring one.
      const root = chordTone(chord, "R");
      return root ? [root] : chord.notes.slice(0, 1);
    }
    if (focus === "seam") {
      // The dromos's own gravity rather than the chord's: the tones joining
      // the two tetrachords (degrees 4 and 5) are where a modal line rests
      // before it decides to go home. This is the app's tetrachord road
      // used as a landing target, not a claim about any particular song.
      const road = M.tetrachordsOf(state.tonic, state.modeId);
      const seam = [road.lower[road.lower.length - 1], road.upper[0]]
        .filter(Boolean)
        .map((note) => ({ pc: note.pc, name: note.name, role: note.degree, roleLabel: note.degree, degree: note.degree }));
      return seam.length ? seam : chord.notes.slice(0, 1);
    }
    if (focus === "enclose") {
      // Surround the target from a step above and a step below inside the
      // dromos, then land on it. A borrowed device (bebop enclosure), so the
      // UI labels it an import; the neighbours are taken from the dromos so
      // the approach never leaves the collection.
      if (!third) return chord.notes.slice(0, 1);
      const scale = M.scaleOf(state.tonic, state.modeId);
      const idx = scale.findIndex((note) => note.pc === third.pc);
      const out = [third];
      if (idx >= 0) {
        const above = scale[(idx + 1) % scale.length];
        const below = scale[(idx - 1 + scale.length) % scale.length];
        // Label approach notes by DIRECTION, not by scale degree: inside a
        // chord readout "F♯ (3)" reads as that chord's 3rd, which it is not.
        [[below, "↓"], [above, "↑"]].forEach(([note, arrow]) => {
          if (note && note.pc !== third.pc) {
            out.push({ pc: note.pc, name: note.name, role: "approach", roleLabel: arrow, degree: note.degree });
          }
        });
      }
      return out;
    }
    if (focus === "sweet") {
      // The practical Greek "sweet" move: the scale's 2nd (or ♭2 in Ousak and
      // Hijaz) leaning into the chord's 3rd exactly when the change arrives.
      const scale = M.scaleOf(state.tonic, state.modeId);
      const lean = scale[1];
      const sweet = [];
      if (lean) sweet.push({ pc: lean.pc, name: lean.name, role: "2", roleLabel: lean.degree, degree: lean.degree });
      if (third) sweet.push(third);
      return sweet.length ? sweet : chord.notes.slice(0, 1);
    }
    if (focus === "pedal") {
      const tone = commonTone();
      return tone ? [tone] : chord.notes.slice(0, 1);
    }
    if (focus === "triad") {
      return chord.notes.filter((note) => ["R", "3", "b3", "5", "b5", "#5"].includes(note.role));
    }
    if (focus === "guide") {
      const seventh = chordTone(chord, "7") || chordTone(chord, "b7");
      // Many Greek progression-bank chords are intentionally triads. A 7th is
      // the classic jazz guide tone, but inventing one would teach the wrong
      // harmony; on a triad, pair its colour-defining 3rd with the root anchor.
      return [third, seventh || chordTone(chord, "R")].filter(Boolean);
    }
    return third ? [third] : chord.notes.slice(0, 1);
  }

  function preferredSoloTarget(notes) {
    return notes.find((note) => ["3", "b3", "7", "b7"].includes(note.role)) || notes[0];
  }

  // The nearest melodic thread between this chord's landing tones and the next
  // chord's: the smallest real move (a step or a small leap, up to a minor
  // 3rd) that a hand can make without shifting. Returns null when the closest
  // available move is a genuine leap — the app should not draw a line that
  // implies a connection the player cannot hear.
  function soloLandingThread(curTargets, nextTargets) {
    let best = null;
    (curTargets || []).forEach((from) => {
      (nextTargets || []).forEach((to) => {
        const raw = (((to.pc - from.pc) % 12) + 12) % 12;
        const signed = raw > 6 ? raw - 12 : raw;
        const distance = Math.abs(signed);
        if (!distance || distance > 3) return;
        if (!best || distance < best.distance) best = { from, to, distance, direction: signed };
      });
    });
    return best;
  }

  // ---- "Hear the lean" — the audible half of the landing-lens drill ------
  // One bar of the current chord with the lean sung above it, then the next
  // chord arrives and the melody resolves exactly on the downbeat. Hearing
  // the resolution before playing it is the entire point of the lens.
  function melodyMidiAbove(pc, chord) {
    const top = chord.notes[chord.notes.length - 1].midi;
    let midi = top + (((pc - top) % 12) + 12) % 12;
    if (midi <= top) midi += 12;
    return midi;
  }

  function playLeanDemo(cur, next, curTargets, nextTargets) {
    AU.ensure();
    stopPlay();
    AU.stopAll();
    const spb = 60 / state.bpm;
    const t0 = AU.now() + 0.12;
    const voice = chordReferenceVoice();
    const lean = state.solo.focus === "sweet" ? curTargets[0] : preferredSoloTarget(curTargets);
    const landing = preferredSoloTarget(nextTargets);
    const leanMidi = melodyMidiAbove(lean.pc, cur);
    // resolve by the nearest step so a 2 falls/rises into the 3rd instead of
    // leaping registers; the one-note lens collapses to the same pitch.
    let landMidi = leanMidi + (((landing.pc - leanMidi) % 12) + 12) % 12;
    if (landMidi - leanMidi > 6) landMidi -= 12;
    // bar 1 — state the chord, sit on the lean (beat 2, again on the and-of-3)
    AU.playChord(cur.notes, "strum", t0, voice, 4 * spb);
    AU.playSequence([{ freq: T.midiToFreq(leanMidi) }], 0, t0 + spb);
    AU.playSequence([{ freq: T.midiToFreq(leanMidi) }], 0, t0 + 2.5 * spb);
    // bar 2 — the change arrives and the lean resolves on the downbeat
    const t1 = t0 + 4 * spb;
    AU.playChord(next.notes, "strum", t1, voice, 4 * spb);
    AU.playSequence([{ freq: T.midiToFreq(landMidi) }], 0, t1);
    return (t1 - t0) + 2.4 * spb; // seconds until the demo has rung out
  }

  function leanDemoLabel(focus) {
    return focus === "sweet" ? "♪ Hear the lean (2 → 3)"
      : focus === "pedal" ? "♪ Hear the one note re-named"
        : "♪ Hear the landing";
  }

  // This is a timing / target map, not a generated solo. It makes the job of
  // each pulse visible so the player can hear a destination, choose a small
  // connector, and leave enough space for the chord change to register.
  function buildSoloTimingPlan(cur, next, curTargets, nextTargets) {
    const pulse = currentPulse();
    const route = P.melodicRoute(state.solo.routeId);
    const frame = M.pentatonicOf(state.tonic, state.modeId);
    const currentTarget = preferredSoloTarget(curTargets);
    const nextTarget = preferredSoloTarget(nextTargets);
    const connectorNotes = frame.filter((note) => ![currentTarget.pc, nextTarget.pc].includes(note.pc));
    const connectors = connectorNotes.length ? connectorNotes : frame;
    const approachPc = (nextTarget.pc + 11) % 12;
    const approachName = M.simplify(M.nameFor(0, approachPc));

    return pulse.beats.map((beat, index) => {
      const last = index === pulse.beats.length - 1;
      if (index === 0) return { beat, role: "anchor", note: currentTarget, label: "Anchor", why: `State ${cur.symbol}` };
      if (last) return { beat, role: "arrival", note: nextTarget, label: "Arrive", why: `Make ${next.symbol} audible` };
      if (route.id === "triad-first") {
        const note = curTargets[(index - 1) % curTargets.length];
        return { beat, role: "triad", note, label: "Triad", why: `${note.roleLabel} of ${cur.symbol}` };
      }
      if (route.id === "nearest-link") {
        const note = index % 2 ? currentTarget : nextTarget;
        return { beat, role: "link", note, label: "Link", why: "Keep the move small" };
      }
      if (route.id === "sweet-lean") {
        const scale = M.scaleOf(state.tonic, state.modeId);
        const lean = scale[1] || frame[0];
        const note = index % 2 ? { pc: lean.pc, name: lean.name, roleLabel: lean.degree } : currentTarget;
        return { beat, role: index % 2 ? "approach" : "link", note,
          label: index % 2 ? "Lean" : "Sweet",
          why: index % 2 ? `${lean.name} leans toward the 3rd` : `the sweet colour of ${cur.symbol}` };
      }
      if (route.id === "approach-resolve" && index === pulse.beats.length - 2) {
        return {
          beat, role: "approach", note: { pc: approachPc, name: approachName, roleLabel: "±1" },
          label: "Approach", why: `weak pulse → ${nextTarget.name}`
        };
      }
      const note = connectors[(index - 1) % connectors.length];
      return { beat, role: route.id === "motif-space" && index % 2 === 0 ? "space" : "connector", note,
        label: route.id === "motif-space" && index % 2 === 0 ? "Space" : "Connect",
        why: route.id === "motif-space" && index % 2 === 0 ? "Let the phrase breathe" : "Inside the selected frame" };
    });
  }

  function updateSoloMatrixJourney(beatIndex) {
    const plan = state.solo.matrixPlan || [];
    if (!plan.length) return;
    const index = Math.max(0, Math.min(plan.length - 1, +beatIndex || 0));
    state.solo.matrixBeat = index;
    const step = plan[index];
    const root = $("soloTimingMatrix");
    if (root) {
      root.querySelectorAll("[data-matrix-beat]").forEach((button) => {
        const position = +button.getAttribute("data-matrix-beat");
        button.classList.toggle("active", position === index);
        button.classList.toggle("passed", position < index);
      });
    }
    const now = $("soloMatrixNow");
    if (now) now.innerHTML = `<b>${step.label}</b> · ${step.note.name} (${step.note.roleLabel || step.note.degree || "frame"}) — ${step.why}`;
    svg().querySelectorAll(".fb-dot.journey-active").forEach((dot) => dot.classList.remove("journey-active"));
    svg().querySelectorAll(`.fb-dot[data-pc="${step.note.pc}"]`).forEach((dot) => dot.classList.add("journey-active"));
    // Choreograph the change: on the lean/approach pulse the NEXT chord's
    // rings glow as a preview; on the arrival they ignite while the old
    // target collapses back to ghost. Pure CSS phases — nothing jumps.
    const lastStep = index === plan.length - 1;
    const leanStep = !lastStep && (step.role === "approach" || index >= plan.length - 2);
    svg().classList.toggle("lean-phase", leanStep);
    svg().classList.toggle("arrive-phase", lastStep);
    const hud = document.querySelector(".solo-neck-hud");
    if (hud) {
      hud.classList.toggle("lean-phase", leanStep);
      hud.classList.toggle("arrive-phase", lastStep);
    }
  }

  function renderSoloTimingMatrix(cur, next, curTargets, nextTargets) {
    const root = $("soloTimingMatrix");
    if (!root) return;
    // groupGrid lives on the matrix (where the beats are), not on the neck —
    // a doorway is a rhythmic fact. Applied here because the matrix rebuilds
    // its own markup after applyMapChoreo runs.
    const gTool = activeTool();
    root.classList.toggle("show-onsets", !!(gTool && gTool.choreo && gTool.choreo.groupGrid));
    const pulse = currentPulse();
    const route = P.melodicRoute(state.solo.routeId);
    const plan = buildSoloTimingPlan(cur, next, curTargets, nextTargets);
    state.solo.matrixPlan = plan;
    state.solo.matrixBeat = Math.max(0, Math.min(plan.length - 1, state.solo.matrixBeat));
    root.innerHTML = `
      <header><div><span>Timing matrix · ${pulse.style.title}</span><b>${pulse.style.meter} · ${pulse.style.pulse}</b></div><i>${route.label} · one job per pulse</i></header>
      <div class="solo-journey" aria-label="${pulse.style.title} melodic timing journey">${plan.map((step, index) =>
        `<button data-matrix-beat="${index}" class="journey-step ${step.role}${step.beat.first ? " group-start" : ""}">
          <i>${step.beat.beat}</i><span>${step.label}</span><b>${step.note.name}</b><em>${step.note.roleLabel || step.note.degree || "frame"}</em></button>`
      ).join("")}</div>
      <p id="soloMatrixNow" class="solo-matrix-now"></p>
      <p class="solo-matrix-note">The cursor follows the selected pulse while transport plays. This is a route map—not a mandatory lick: keep the rhythmic group, change the connector notes, and make the arrival clear.</p>`;
    root.querySelectorAll("[data-matrix-beat]").forEach((button) => {
      button.onclick = () => updateSoloMatrixJourney(+button.getAttribute("data-matrix-beat"));
    });
    updateSoloMatrixJourney(state.solo.matrixBeat);
  }

  // ===================== Soloist Toolkit (FR-58) ========================
  // Three pillars answering three questions. Choosing a tool re-choreographs
  // the map: it sets the landing lens, may show a phrase-arc meter, and may
  // open a side rail with the material that tool needs in the CURRENT key and
  // dromos — so every tool works in any key without a second diagram.
  function activeTool() {
    if (!TK) return null;
    const tool = TK.byId(state.solo.toolkit.toolId);
    if (tool && (!tool.modeGate || tool.modeGate.includes(state.modeId))) return tool;
    // The selected tool is not offered in this dromos: fall back to the first
    // available tool of the same pillar rather than showing a dead selection.
    const fallback = TK.availableTools(state.solo.toolkit.pillar, state.modeId)[0]
      || TK.availableTools("land", state.modeId)[0];
    if (fallback) { state.solo.toolkit.toolId = fallback.id; state.solo.toolkit.pillar = fallback.pillar; }
    return fallback || null;
  }

  function toolPhases(tool) {
    return (tool && tool.choreo && tool.choreo.phases) || null;
  }

  // ---- side rails: the tool's material, computed in the current key -----
  // These dromoi almost always close on the tonic, so listing final chords
  // just repeats it. The information a soloist needs is the APPROACH: which
  // chord hands you home, deduped, in the current key.
  function exitRailHtml() {
    const bank = M.PROGRESSIONS[state.modeId] || [];
    const seen = new Set();
    const exits = [];
    bank.forEach((p) => {
      const chords = M.buildProgression(state.tonic, state.modeId, p.id).chords;
      if (chords.length < 2) return;
      const last = chords[chords.length - 1];
      const approach = chords[chords.length - 2];
      const key = `${approach.symbol}>${last.symbol}`;
      if (seen.has(key)) return;
      seen.add(key);
      exits.push({ approach, last, label: p.label });
    });
    return `<div class="tool-rail"><span>Ways home · ${escapeHtml(M.MODES[state.modeId].name)} on ${escapeHtml(state.tonic)}</span>
      ${exits.map((e) => `<b>${escapeHtml(e.approach.symbol)} → ${escapeHtml(e.last.symbol)}<i>${escapeHtml(e.label)}</i></b>`).join("")}
      <em>Close a section by arriving on a tone of the destination chord. Mid-phrase, land wherever it sounds good.</em></div>`;
  }

  function thirdPairsRailHtml() {
    const scale = M.scaleOf(state.tonic, state.modeId);
    const pairs = scale.map((note, i) => ({ from: note, to: scale[(i + 2) % scale.length] }));
    return `<div class="tool-rail"><span>Parallel 3rds inside ${escapeHtml(M.MODES[state.modeId].name)}</span>
      ${pairs.map((p) => `<b>${escapeHtml(p.from.name)}<i>+ ${escapeHtml(p.to.name)}</i></b>`).join("")}
      <em>Play the phrase alone, then double it with the paired tone. Both voices stay in the dromos.</em></div>`;
  }

  function chromaticRailHtml() {
    const scale = M.scaleOf(state.tonic, state.modeId);
    const gaps = [];
    scale.forEach((note, i) => {
      const next = scale[(i + 1) % scale.length];
      const step = (((next.pc - note.pc) % 12) + 12) % 12;
      // Spell the passing tone from the LOWER note's own letter, so a whole
      // step D→E fills with D♯ rather than an illegal name built off C.
      if (step === 2) {
        const letter = M.parseName(note.name).letterIdx;
        gaps.push({ from: note, to: next, mid: M.simplify(M.nameFor(letter, (note.pc + 1) % 12)) });
      }
    });
    return `<div class="tool-rail"><span>Whole steps you may fill · weak beats only</span>
      ${gaps.length ? gaps.map((g) => `<b>${escapeHtml(g.from.name)} → ${escapeHtml(g.to.name)}<i>via ${escapeHtml(g.mid)}</i></b>`).join("")
        : "<b>—<i>no whole steps to fill</i></b>"}
      <em>The inserted tone must never land on a strong beat.</em></div>`;
  }

  function formulaRailHtml() {
    const routes = P ? P.MELODIC_ROUTES || [] : [];
    const tk = state.solo.toolkit;
    if (!Array.isArray(tk.formulaDeck) || tk.formulaDeck.some((index) => !routes[index])) {
      tk.formulaDeck = TK.dealFormulaDeck(routes.length);
    }
    const deck = tk.formulaDeck.map((index) => routes[index]).filter(Boolean);
    return `<div class="tool-rail"><span>Dealt this round · app-derived starter deck</span>
      ${deck.map((r, i) => `<button data-tk-formula-slot="${i}" class="formula-card" aria-label="Swap ${escapeHtml(["opener", "first mover", "second mover", "cadence"][i] || "card")}: ${escapeHtml(r.label)}"><b>${escapeHtml(["Opener", "Mover", "Mover", "Cadence"][i] || "Card")}</b><i>${escapeHtml(r.label)}</i><small>press to swap</small></button>`).join("")}
      <em>Chain them with no gap. Press one card to deal a different app-derived route; replace a card with a phrase from a recording when you are ready.</em></div>`;
  }

  // The four documented Chiotis arrivals. Selecting one marks the pass you
  // are on; the map names it above the neck so you know which finish is due.
  const ARRIVALS = [
    { id: "penia", name: "Penia", hint: "plain accented pick stroke" },
    { id: "slide", name: "Ghost slide", hint: "slide in from an indeterminate pitch" },
    { id: "tremolo", name: "Tremolo hold", hint: "fill the landing with 16ths or 32nds" },
    { id: "sweep", name: "Sweep", hint: "rake adjacent courses, finish on the target" }
  ];
  function arrivalRailHtml() {
    const active = state.solo.toolkit.arrival || "penia";
    return `<div class="tool-rail"><span>Arrival due this pass</span>
      ${ARRIVALS.map((a) => `<b><button data-tk-arrival="${a.id}" class="tk-arrival${a.id === active ? " active" : ""}">${escapeHtml(a.name)}</button><i>${escapeHtml(a.hint)}</i></b>`).join("")}
      <em>Same line four times, one arrival per pass. The target note does not change — only how you reach it.</em></div>`;
  }

  // The Greek pulse's group onsets are the landing doorways. Rather than
  // invent a second grid, this promotes the group starts already marked in
  // the timing matrix so the doorway is unmissable while the tool is active.
  function groupOnsetLabel() {
    const pulse = currentPulse();
    const starts = pulse.beats.filter((b) => b.first).map((b) => b.beat);
    return `<div class="tool-rail"><span>Group onsets · ${escapeHtml(pulse.style.title)} ${escapeHtml(pulse.style.meter)}</span>
      ${pulse.beats.map((b) => `<b class="${b.first ? "onset" : ""}">${b.beat}<i>${b.first ? "doorway" : "inside"}</i></b>`).join("")}
      <em>Land targets on beats ${starts.join(", ")} to lock to the dance; land inside a group to float.</em></div>`;
  }

  // A pacing reminder, not a judgement: the bar cycles every six seconds so
  // you can see a breath coming. The app has no microphone and never claims
  // to know whether you actually breathed.
  function breathRailHtml() {
    return `<div class="tool-rail"><span>Breath pacing · six seconds</span>
      <div class="breath-bar" aria-hidden="true"><i></i></div>
      <em>Aim the first note after each breath at a landing tone. This is a visual metronome for phrasing — nothing is being listened to.</em></div>`;
  }

  function toolRailHtml(tool) {
    const c = (tool && tool.choreo) || {};
    if (c.breathCue) return breathRailHtml();
    if (c.arrivalBadges) return arrivalRailHtml();
    if (c.groupGrid) return groupOnsetLabel();
    if (c.exitRail) return exitRailHtml();
    if (c.thirdPairsRail) return thirdPairsRailHtml();
    if (c.chromaticRail) return chromaticRailHtml();
    if (c.formulaCards) return formulaRailHtml();
    return "";
  }

  let toolkitFocusRequest = null;
  function focusToolkitControl(root, request) {
    if (!root || !request) return;
    const target = root.querySelector(`[${request.attribute}="${request.value}"]`);
    if (!target) return;
    try { target.focus({ preventScroll: true }); } catch { target.focus(); }
  }

  function restoreToolkitFocus(root) {
    const request = toolkitFocusRequest;
    toolkitFocusRequest = null;
    focusToolkitControl(root, request);
  }

  function wireToolkitKeys(root, selector) {
    const buttons = Array.from(root.querySelectorAll(selector));
    buttons.forEach((button, index) => {
      button.onkeydown = (event) => {
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        if (next == null) return;
        event.preventDefault();
        const attribute = selector.slice(1, -1);
        const request = { attribute, value: buttons[next].getAttribute(attribute) };
        buttons[next].click();
        // Keydown finishes on a node that renderSolo() just replaced. Restore
        // on the next frame as well so the browser cannot drop focus to body
        // after the removed node's event finishes.
        requestAnimationFrame(() => focusToolkitControl($("soloToolkit"), request));
      };
    });
  }

  function renderSoloToolkit() {
    const root = $("soloToolkit");
    if (!root || !TK) return;
    if (state.view !== "solo" || state.solo.section !== "targets") { root.innerHTML = ""; return; }
    const tool = activeTool();
    if (!tool) { root.innerHTML = ""; return; }
    const tk = state.solo.toolkit;
    const phases = toolPhases(tool);
    const labels = { "greek-core": "Greek core", "labeled-import": "Import", universal: "Universal" };
    root.innerHTML = `
      <div class="tk-pillars" role="tablist" aria-label="Soloist toolkit pillars">
        ${TK.PILLARS.map((p) => `<button id="tk-pillar-${p.id}" role="tab" aria-selected="${p.id === tk.pillar}" aria-controls="soloToolkitPanel" tabindex="${p.id === tk.pillar ? "0" : "-1"}" data-tk-pillar="${p.id}" class="${p.id === tk.pillar ? "active" : ""}"><b>${escapeHtml(p.name)}</b><span>${escapeHtml(p.question)}</span></button>`).join("")}
      </div>
      <div class="tk-tools" role="toolbar" aria-label="${escapeHtml(TK.PILLARS.find((pillar) => pillar.id === tk.pillar)?.name || "Soloist")} tools">
        ${TK.availableTools(tk.pillar, state.modeId).map((t) =>
          `<button aria-pressed="${t.id === tool.id}" data-tk-tool="${t.id}" class="${t.id === tool.id ? "active" : ""}">${escapeHtml(t.name)}</button>`).join("")}
      </div>
      <article id="soloToolkitPanel" class="tk-card" role="tabpanel" aria-labelledby="tk-pillar-${tk.pillar}" tabindex="0">
        <header><b>${escapeHtml(tool.name)}</b><span class="tk-badge tk-${tool.importLabel}">${labels[tool.importLabel]}</span></header>
        <p class="tk-logic">${escapeHtml(tool.logic)}</p>
        <div class="tk-do"><span>Do this</span><p>${escapeHtml(tool.exercise)}</p></div>
        <div class="tk-pass"><span>Pass</span><p>${escapeHtml(tool.pass)}</p></div>
        ${phases ? `<div class="tk-phases" aria-label="Phrase arc">${phases.map((label, i) =>
          `<button data-tk-phase="${i}" class="${i === tk.phase ? "active" : ""}"><i>${i + 1}</i>${escapeHtml(label)}</button>`).join("")}</div>` : ""}
        ${toolRailHtml(tool)}
        <footer class="tk-origin"><span>${escapeHtml(tool.origin)}</span><button class="mini" data-open-tactical-example="${escapeHtml(tool.exampleId)}">See exact tactical example →</button></footer>
      </article>`;
    root.querySelectorAll("[data-tk-pillar]").forEach((b) => b.onclick = () => {
      const id = b.getAttribute("data-tk-pillar");
      toolkitFocusRequest = { attribute: "data-tk-pillar", value: id };
      state.solo.toolkit.pillar = id;
      const first = TK.availableTools(id, state.modeId)[0];
      if (first) state.solo.toolkit.toolId = first.id;
      state.solo.toolkit.phase = 0;
      applyToolChoreo(); renderSolo();
    });
    root.querySelectorAll("[data-tk-tool]").forEach((b) => b.onclick = () => {
      const id = b.getAttribute("data-tk-tool");
      toolkitFocusRequest = { attribute: "data-tk-tool", value: id };
      state.solo.toolkit.toolId = id;
      state.solo.toolkit.phase = 0;
      applyToolChoreo(); renderSolo();
    });
    root.querySelectorAll("[data-tk-phase]").forEach((b) => b.onclick = () => {
      const phase = b.getAttribute("data-tk-phase");
      toolkitFocusRequest = { attribute: "data-tk-phase", value: phase };
      state.solo.toolkit.phase = +phase;
      renderSolo();
    });
    root.querySelectorAll("[data-tk-arrival]").forEach((b) => b.onclick = () => {
      const arrival = b.getAttribute("data-tk-arrival");
      toolkitFocusRequest = { attribute: "data-tk-arrival", value: arrival };
      state.solo.toolkit.arrival = arrival;
      renderSolo();
    });
    root.querySelectorAll("[data-tk-formula-slot]").forEach((button) => button.onclick = () => {
      const slot = +button.getAttribute("data-tk-formula-slot");
      toolkitFocusRequest = { attribute: "data-tk-formula-slot", value: String(slot) };
      state.solo.toolkit.formulaDeck = TK.swapFormulaCard(state.solo.toolkit.formulaDeck, slot, (P.MELODIC_ROUTES || []).length);
      renderSoloToolkit();
    });
    root.querySelector("[data-open-tactical-example]")?.addEventListener("click", (event) =>
      openTacticalExample(event.currentTarget.getAttribute("data-open-tactical-example")));
    wireToolkitKeys(root, "[data-tk-pillar]");
    wireToolkitKeys(root, "[data-tk-tool]");
    restoreToolkitFocus(root);
  }

  // The fretboard adapts to the active tool: tetrachord zones brighten per
  // phrase-arc phase, the pulse's group onsets can be emphasised, and the
  // leading-tone colour can shimmer. All driven by classes on the SVG so it
  // works for any key and any dromos without a second diagram.
  function applyMapChoreo() {
    const node = svg();
    if (!node) return;
    const tool = activeTool();
    const c = (tool && tool.choreo) || {};
    const phases = toolPhases(tool);
    const phase = state.solo.toolkit.phase;
    node.classList.remove("zone-lower", "zone-upper", "vii-shimmer");
    if (c.zoneSweep && phases) {
      if (phase === 0) node.classList.add("zone-lower");
      else if (phase === 1) node.classList.add("zone-upper");
    }
    if (c.viiShimmer && phases && phase === phases.length - 1) node.classList.add("vii-shimmer");
    // The leading tone / VII colour is a pitch class, so mark it for CSS.
    const scale = M.scaleOf(state.tonic, state.modeId);
    const seventh = scale[scale.length - 1];
    node.querySelectorAll(".fb-dot.is-vii").forEach((d) => d.classList.remove("is-vii"));
    if (c.viiShimmer && seventh) {
      node.querySelectorAll(`.fb-dot[data-pc="${seventh.pc}"]`).forEach((d) => d.classList.add("is-vii"));
    }
  }

  // A tool owns the landing lens, so selecting one re-points the rings.
  function applyToolChoreo() {
    const tool = activeTool();
    if (tool && tool.choreo && tool.choreo.focus) state.solo.focus = tool.choreo.focus;
    syncSoloFocusButtons();
  }
  function syncSoloFocusButtons() {
    document.querySelectorAll("[data-solo-focus]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-solo-focus") === state.solo.focus));
  }

  function soloTargetAddresses(note, fromFret, toFret, limit) {
    if (!note) return [];
    const courseNames = window.Tuning.names();
    return FB.allTonePositions([note])
      .filter((placement) => placement.fret >= fromFret && placement.fret <= toFret)
      .sort((a, b) => a.fret - b.fret || b.stringIndex - a.stringIndex)
      .slice(0, limit || 3)
      .map((placement) => `${courseNames[placement.stringIndex]} course · ${placement.fret ? `fret ${placement.fret}` : "open"}`);
  }

  function applySoloNeckFocus() {
    const node = svg();
    if (!node) return;
    const zone = state.solo.neckZone || "both";
    node.setAttribute("data-solo-neck-zone", zone);
    node.querySelectorAll(".fb-dot[data-fret]").forEach((dot) => {
      const fret = Number(dot.getAttribute("data-fret"));
      const outside = zone === "first" ? fret > 12 : zone === "second" ? fret < 13 : false;
      dot.classList.toggle("neck-muted", outside);
    });
  }

  // Layer chips live directly above the fretboard so the player can stack
  // the scale road, the pentatonic frame, triad shapes, and the now/next
  // landing targets without ever covering the neck.
  function renderSoloLayerChips(cur, next, curTargets, nextTargets, thread) {
    const root = $("stageLayers");
    if (!root) return;
    if (state.view === "chordmap") return;
    if (state.view !== "solo" || state.solo.section !== "targets") { root.innerHTML = ""; return; }
    if (!cur || !next) {
      const progression = currentProgression().chords;
      const index = Math.min(state.progStep, progression.length - 1);
      cur = progression[index];
      next = progression[(index + 1) % progression.length];
      curTargets = soloTargets(cur, state.solo.focus);
      nextTargets = soloTargets(next, state.solo.focus);
      thread = soloLandingThread(curTargets, nextTargets);
    }
    const layers = state.solo.layers;
    const chip = (id, on, swatch, label) => `<button data-solo-layer="${id}" class="layer-chip${on ? " on" : ""}" aria-pressed="${on}"><span class="layer-swatch ${swatch}"></span>${label}</button>`;
    const nowTarget = preferredSoloTarget(curTargets);
    const nextTarget = preferredSoloTarget(nextTargets);
    const mode = M.MODES[state.modeId];
    const holds = nowTarget.pc === nextTarget.pc;
    const progression = currentProgression();
    const tool = activeTool();
    const roadmap = progression.chords.map((chord, index) => {
      const target = preferredSoloTarget(soloTargets(chord, state.solo.focus));
      const status = index === state.progStep ? "Now" : index === (state.progStep + 1) % progression.chords.length ? "Next" : chord.phraseRole;
      const endBar = chord.startsAtBar + barsFor(chord) - 1;
      return `<button data-solo-roadmap-step="${index}" class="solo-roadmap-card${index === state.progStep ? " now" : ""}${index === (state.progStep + 1) % progression.chords.length ? " next" : ""}">
        <span>${status} · bar${endBar === chord.startsAtBar ? "" : "s"} ${chord.startsAtBar}${endBar === chord.startsAtBar ? "" : `–${endBar}`}</span>
        <strong>${escapeHtml(chord.degreeLabel)}</strong><b>${escapeHtml(chord.symbol)}</b>
        <small>${escapeHtml(chord.phraseRole)} · target ${escapeHtml(target.roleLabel)} ${escapeHtml(target.name)}</small></button>`;
    }).join("");
    // The loop wrap is the moment players lose: the phrase ends on a held
    // tonic and the next chord is the top of the progression again. Nothing
    // on the neck changes across the hold, so say it in words.
    const wrapsToTop = (state.progStep + 1) % progression.chords.length === 0 && progression.chords.length > 1;
    const motion = holds
      ? `${nowTarget.name} holds · the chord changes its meaning`
      : thread
      ? `${thread.from.name} ${thread.direction > 0 ? "↗" : "↘"} ${thread.to.name} · ${thread.distance === 1 ? "½ step" : thread.distance === 2 ? "whole step" : "minor 3rd"}`
      : `${nowTarget.name} → ${nextTarget.name} · pre-hear the leap`;
    root.innerHTML = `
      <section class="solo-progression-roadmap" aria-label="Complete Solo progression and landing targets">
        <header><div><span>Full progression · ${escapeHtml(progression.prog.label)} · ${progression.chords[0].phraseBars}-bar resolved phrase</span><b>${escapeHtml(state.tonic)} ${escapeHtml(mode.name)} · ${escapeHtml(landingLensName(state.solo.focus))}</b></div><p>${tool ? `<strong>${escapeHtml(tool.name)}</strong> · ${escapeHtml(tool.exercise.split(".")[0])}.` : "Say each target before its chord arrives."}</p></header>
        <div class="solo-roadmap-grid">${roadmap}</div>
      </section>
      <section class="solo-neck-hud" aria-label="Current and next solo landing" aria-live="polite">
        <article class="solo-hud-card now"><span>Play now · ${escapeHtml(cur.degreeLabel)}</span><strong>${escapeHtml(cur.symbol)}</strong><b><i>target</i> ${escapeHtml(nowTarget.roleLabel)} · ${escapeHtml(nowTarget.name)}</b><div class="solo-hud-triad">${escapeHtml(triadSpelling(cur))}</div><small>solid triad · the green <b>circle</b> is the note to play now</small></article>
        <div class="solo-hud-motion"><span>smallest useful move</span><b>${escapeHtml(motion)}</b><small>hear the destination before the chord changes</small></div>
        <article class="solo-hud-card next${wrapsToTop ? " wraps" : ""}"><span>Prepare next · ${escapeHtml(next.degreeLabel)}</span><strong>${escapeHtml(next.symbol)}</strong><b><i>target</i> ${escapeHtml(nextTarget.roleLabel)} · ${escapeHtml(nextTarget.name)}</b><div class="solo-hud-triad">${escapeHtml(triadSpelling(next))}</div><small>dashed triad · the amber <b>diamond</b> is where you are aiming; it turns into a green circle when it arrives</small></article>
      </section>
      <section class="solo-neck-zones" aria-label="Target locations in both halves of the neck">
        <header><div><span>Same target · two neck zones</span><b>Find ${escapeHtml(nowTarget.roleLabel)} ${escapeHtml(nowTarget.name)} now, then ${escapeHtml(nextTarget.roleLabel)} ${escapeHtml(nextTarget.name)} next</b></div><button data-solo-target-scope aria-pressed="${state.solo.allTargets}">${state.solo.allTargets ? "All target positions" : "Shape landing only"}</button></header>
        ${[["first", "Zone 1", 0, 12], ["second", "Zone 2", 13, 24]].map(([id, label, from, to]) => {
          const nowPlaces = soloTargetAddresses(nowTarget, from, Math.min(to, FB.N_FRETS), 3);
          const nextPlaces = soloTargetAddresses(nextTarget, from, Math.min(to, FB.N_FRETS), 3);
          return `<button data-solo-neck-zone="${id}" class="solo-neck-zone-card${state.solo.neckZone === id ? " active" : ""}">
            <span>${label} · frets ${from}–${Math.min(to, FB.N_FRETS)}</span>
            <b><i>Now</i> ${escapeHtml(nowPlaces.join(" · ") || "not available")}</b>
            <b><i>Next</i> ${escapeHtml(nextPlaces.join(" · ") || "not available")}</b>
          </button>`;
        }).join("")}
        <button data-solo-neck-zone="both" class="solo-neck-zone-card both${state.solo.neckZone === "both" ? " active" : ""}"><span>Whole neck</span><b><i>Now + Next</i> keep both rows visible</b><small>Recommended for learning the repeated map</small></button>
      </section>
      <div class="solo-layer-row">
        <span class="solo-layer-label">Scales</span>
        ${chip("scale", layers.scale, "lc-scale", `${state.tonic} ${mode.name} · two tetrachords`)}
        ${chip("pentatonic", layers.pentatonic, "lc-penta", `${state.tonic} ${M.PENTATONIC[state.modeId]?.name || "Pentatonic"}`)}
        <span class="solo-layer-divider" aria-hidden="true"></span>
        <span class="solo-layer-label">Triads</span>
        ${chip("shapes", layers.shapes, "lc-now", "Current + coming shape")}
        ${chip("next", layers.next, "lc-next", "Coming triad")}
        ${chip("triads", layers.triads, "lc-triad", "Other current positions")}
        <span class="solo-layer-divider" aria-hidden="true"></span>
        <span class="solo-layer-label">Neck</span>
        ${["auto", "full", "split"].map((m) => `<button data-solo-neck="${m}" class="layer-chip${state.solo.neckMode === m ? " on" : ""}" aria-pressed="${state.solo.neckMode === m}">${m === "auto" ? "Auto" : m === "full" ? "Full 24" : "Split 12+12"}</button>`).join("")}
        <span class="solo-layer-divider" aria-hidden="true"></span>
        <span class="solo-layer-label">Isolate</span>
        <button data-solo-isolate="scales" class="layer-chip">Scales only</button>
        <button data-solo-isolate="triads" class="layer-chip">Triads only</button>
        <button data-solo-isolate="all" class="layer-chip">Show all</button>
        <span class="layer-note"><b class="sig-now">green circle</b> = play now · <b class="sig-next">amber diamond</b> = aim next · every layer is independent, so you can strip the neck to one thing</span>
      </div>`;
    root.querySelectorAll("[data-solo-roadmap-step]").forEach((button) => {
      button.onclick = () => {
        stopPlay(); state.progStep = +button.getAttribute("data-solo-roadmap-step");
        renderSoloMapControls(); renderSolo(); auditionProg();
      };
    });
    root.querySelectorAll("[data-solo-neck]").forEach((button) => button.onclick = () => {
      state.solo.neckMode = button.getAttribute("data-solo-neck");
      renderSolo();
    });
    root.querySelectorAll("[data-solo-isolate]").forEach((button) => button.onclick = () => {
      const mode = button.getAttribute("data-solo-isolate");
      const L = state.solo.layers;
      if (mode === "scales") { L.scale = true; L.pentatonic = false; L.shapes = false; L.next = false; L.triads = false; }
      else if (mode === "triads") { L.scale = false; L.pentatonic = false; L.shapes = true; L.next = true; L.triads = true; }
      else { L.scale = true; L.pentatonic = false; L.shapes = true; L.next = true; L.triads = false; }
      renderSolo();
    });
    root.querySelectorAll("[data-solo-layer]").forEach((button) => {
      button.onclick = () => {
        // Every layer is independent: a player who wants only the scale, or
        // only the triads, should be able to strip the neck to it.
        const key = button.getAttribute("data-solo-layer");
        state.solo.layers[key] = !state.solo.layers[key];
        renderSolo();
      };
    });
    root.querySelectorAll("[data-solo-neck-zone]").forEach((button) => {
      button.onclick = () => {
        state.solo.neckZone = button.getAttribute("data-solo-neck-zone");
        renderSolo();
      };
    });
    const targetScopeButton = root.querySelector("[data-solo-target-scope]");
    if (targetScopeButton) targetScopeButton.onclick = () => {
      state.solo.allTargets = !state.solo.allTargets;
      renderSolo();
    };
  }

  function triadSeatHtml(cur, curTargets) {
    const seatRoles = [["R"], ["3", "b3"], ["5", "b5", "#5"]];
    const targetPcSet = new Set(curTargets.map((note) => note.pc));
    const seats = seatRoles.map((roles) => cur.notes.find((note) => roles.includes(note.role))).filter(Boolean);
    const outside = curTargets.filter((note) => !cur.notes.some((tone) => tone.pc === note.pc));
    return `<div class="triad-seat"><span>Triad of ${escapeHtml(cur.symbol)}</span>
      ${seats.map((note) => `<b class="${targetPcSet.has(note.pc) ? "seat-target" : ""}">${escapeHtml(note.roleLabel)}<i>${escapeHtml(note.name)}</i></b>`).join("")}
      ${outside.length ? `<em>${outside.map((note) => escapeHtml(note.name)).join(" · ")} sits outside the triad — it leans in and resolves</em>` : `<em>every target sits inside the shape under your hand</em>`}</div>`;
  }

  // ---- Shape cards: the progression as small, readable triad patterns ----
  // A player reading a ii–V–I wants to see three shapes and where the target
  // sits in each, not scan a 24-fret neck three times. Each card is the
  // voice-led triad for that chord, drawn at its real frets, with every tone
  // labelled by its role and the active landing target ringed.
  function shapeCardHtml(chord, shape, index) {
    if (!shape || !shape.placements || !shape.placements.length) {
      return `<article class="shape-card empty"><header><b>${escapeHtml(chord.degreeLabel)}</b><span>${escapeHtml(chord.symbol)}</span></header>
        <p>No compact shape on this instrument.</p></article>`;
    }
    const targets = soloTargets(chord, state.solo.focus);
    const targetPcs = new Set(targets.map((t) => t.pc));
    const frets = shape.placements.map((p) => p.fret);
    const lo = Math.max(0, Math.min(...frets) - 1);
    const hi = Math.max(...frets) + 1;
    const span = Math.max(3, hi - lo + 1);
    const strings = window.Tuning.names();
    const isNow = index === state.progStep;
    const isNext = index === (state.progStep + 1) % currentProgression().chords.length;
    const rows = [];
    for (let s = strings.length - 1; s >= 0; s--) {
      const cells = [];
      for (let f = lo; f <= lo + span - 1; f++) {
        const hit = shape.placements.find((p) => p.stringIndex === s && p.fret === f);
        if (hit) {
          const target = targetPcs.has(hit.note.pc);
          cells.push(`<i class="${target ? "t" : ""}">${escapeHtml(hit.note.roleLabel || "")}</i>`);
        } else cells.push(`<i class="e"></i>`);
      }
      rows.push(`<div class="shape-row"><u>${escapeHtml(strings[s])}</u>${cells.join("")}</div>`);
    }
    const fretNums = [];
    for (let f = lo; f <= lo + span - 1; f++) fretNums.push(`<i>${f}</i>`);
    return `<article class="shape-card${isNow ? " now" : ""}${isNext ? " next" : ""}" >
      <header><b>${escapeHtml(chord.degreeLabel)}</b><span>${escapeHtml(chord.symbol)}</span>
        <em>fret ${lo}</em></header>
      <div class="shape-grid">${rows.join("")}<div class="shape-row nums"><u></u>${fretNums.join("")}</div></div>
      <footer>target ${escapeHtml(targets.map((t) => `${t.roleLabel} ${t.name}`).join(" · "))}</footer>
    </article>`;
  }

  function renderShapeCards() {
    const root = $("soloShapeCards");
    if (!root) return;
    if (state.view !== "solo" || state.solo.section !== "targets") { root.innerHTML = ""; return; }
    const { chords, prog } = currentProgression();
    const path = TR.pathThrough(chords, { startFret: 5, nameFor: spellPc, closeLoop: true });
    root.innerHTML = `
      <header class="shape-cards-head">
        <div><span>Shape patterns · ${escapeHtml(prog.label)}</span>
        <b>The whole progression as ${chords.length} small patterns</b></div>
        <p>Each card is the voice-led triad at its real frets. Numbers under the grid are fret numbers; letters inside are the note's role. Ringed cells are the current landing target, so you can read where the ${escapeHtml(landingLensName(state.solo.focus))} sit across the whole ${escapeHtml(prog.label)} without scanning the neck.</p>
      </header>
      <div class="shape-cards">${chords.map((chord, i) => shapeCardHtml(chord, path[i], i)).join("")}</div>`;
  }

  function renderSolo() {
    const { chords } = currentProgression();
    const idx = Math.min(state.progStep, chords.length - 1);
    const cur = chords[idx];
    const next = chords[(idx + 1) % chords.length];
    const focus = state.solo.focus;
    const curTargets = soloTargets(cur, focus);
    const nextTargets = soloTargets(next, focus);
    const triadPath = TR.pathThrough(chords, { startFret: 5, nameFor: spellPc, closeLoop: true });
    const shape = triadPath[idx];
    const fallbackGrip = shape ? null : FB.findGrip(cur.notes, state.position);
    const activeGrip = shape ? { placements: shape.placements } : fallbackGrip;
    const nextShape = triadPath[(idx + 1) % triadPath.length];
    const nextFallbackGrip = nextShape ? null : FB.findGrip(next.notes, state.position);
    const nextGrip = nextShape ? { placements: nextShape.placements } : nextFallbackGrip;
    const currentTargetPlacements = targetPlacementsForGrip(curTargets, activeGrip);
    const nextTargetPlacements = targetPlacementsForGrip(nextTargets, nextGrip);
    const shapePositions = new Set([...(activeGrip?.placements || []), ...(nextGrip?.placements || [])].map(placementKey));
    const targetPlacements = currentTargetPlacements.concat(state.solo.layers.next ? nextTargetPlacements : [])
      .filter((placement) => !shapePositions.has(placementKey(placement)));
    const currentLanding = currentTargetPlacements.find((placement) => placement.note.pc === preferredSoloTarget(curTargets).pc) || currentTargetPlacements[0];
    const nextLanding = nextTargetPlacements.find((placement) => placement.note.pc === preferredSoloTarget(nextTargets).pc) || nextTargetPlacements[0];
    const triadId = TR.TRIAD_OF[cur.quality] || "maj";
    const allTriads = TR.allShapes(cur.rootPc, triadId, spellPc);
    // The view is deliberately whole-neck so the selected scale remains a
    // complete map. The playable current/coming shapes stay compact, while the
    // selected target pitch is repeated in both 0–12 and 13–24 so the learner
    // can recognise the same harmonic job anywhere on the instrument.
    const overlayRange = { from: 0, to: FB.N_FRETS };
    const pentatonic = M.pentatonicOf(state.tonic, state.modeId);

    const layers = state.solo.layers;
    const targetNotes = [];
    const targetPcs = new Set();
    curTargets.concat(layers.next ? nextTargets : []).forEach((note) => {
      if (targetPcs.has(note.pc)) return;
      targetPcs.add(note.pc);
      targetNotes.push(Object.assign({}, note, {
        roleLabel: targetRoleLabel(note, "target", focus), colorGroup: "target"
      }));
    });
    // The landing thread. Not every change has a stepwise lean (in D major the
    // sweet 2→3 is E→C♯, a minor 3rd), so the tracer connects the NEAREST pair
    // of now/next targets rather than a fixed pair, and stays silent when the
    // closest move is a leap. Nearest-tone connection is the whole lesson.
    const thread = soloLandingThread(curTargets, nextTargets);
    FB.render(svg(), {
      grip: layers.shapes ? activeGrip : null,
      nextGrip: layers.shapes && layers.next ? nextGrip : null,
      otherShapes: state.solo.section === "targets" ? allTriads.filter(() => layers.triads) : [],
      pentatonicNotes: state.solo.section === "targets" && layers.pentatonic ? pentatonic : null,
      // The scale background keeps its tetrachord identity: quiet road dots in
      // the lower/upper hues rather than a flat grey scale, so the two halves
      // of the dromos stay legible UNDER the pentatonic frame and the targets.
      roadNotes: state.solo.section === "targets" && layers.scale ? soloBackgroundRoad() : null,
      roadQuiet: true,
      targetNotes: state.solo.section === "targets" && state.solo.allTargets ? targetNotes : null,
      targetPlacements: state.solo.section === "targets" && !state.solo.allTargets ? targetPlacements : null,
      targetNowPcs: curTargets.map((note) => note.pc),
      targetNextPcs: layers.next ? nextTargets.map((note) => note.pc) : [],
      targetNowPlacements: state.solo.allTargets ? null : currentTargetPlacements,
      targetNextPlacements: state.solo.allTargets ? null : layers.next ? nextTargetPlacements : [],
      targetScope: state.solo.allTargets ? "all" : "positions",
      tracer: layers.next && thread && currentLanding && nextLanding
        ? state.solo.allTargets
          ? { fromPc: thread.from.pc, toPc: thread.to.pc }
          : { fromPc: thread.from.pc, toPc: thread.to.pc, fromPlacement: currentLanding, toPlacement: nextLanding }
        : null,
      overlayRange,
      largeNeck: true,
      neckMode: state.solo.neckMode,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      labelMode: state.labelMode,
      lefty: state.lefty
    });
    svg().setAttribute("aria-label", `${window.Tuning.current().name} soloing map: ${state.tonic} ${M.MODES[state.modeId].name} background; play ${cur.degreeLabel} ${cur.symbol} triad ${triadSpelling(cur)}, targeting ${soloTargetLabel(curTargets)}; prepare ${next.degreeLabel} ${next.symbol} triad ${triadSpelling(next)}, targeting ${soloTargetLabel(nextTargets)}`);
    applyMapChoreo();
    applySoloNeckFocus();
    renderSoloLayerChips(cur, next, curTargets, nextTargets, thread);
    renderShapeCards();
    renderSoloToolkit();

    const frame = M.PENTATONIC[state.modeId];
    const targetLabel = soloTargetLabel;
    const hasSeventhGuide = curTargets.concat(nextTargets).some((note) => note.role === "7" || note.role === "b7");
    const guideInstruction = hasSeventhGuide
      ? "Connect the 3rd and 7th with the smallest move you can hear; the line should explain the harmony even without a chord."
      : "This change uses triads: hear the 3rd as the colour, then land on the root when you want the resolution to feel final.";
    const route = P.melodicRoute(state.solo.routeId);
    const targetScopeSentence = state.solo.allTargets
      ? "The target ring repeats at every playable address in both neck zones; the solid and dashed shapes show the compact voice-led choice under one hand."
      : "The target ring is limited to the compact voice-led shape; switch to All target positions to learn the same note across both neck zones.";
    const focusSentence = focus === "triad"
      ? `The solid shape is the current voice-led triad; the dashed shape is the coming triad. ${targetScopeSentence}`
      : focus === "guide"
        ? `The solid and dashed shapes show the current and coming triads. ${targetScopeSentence}`
        : focus === "sweet"
          ? "One nearby ring marks the 2nd and one marks the chord's 3rd: sit on the 2, then let it fall or rise into the 3rd exactly when the harmony moves. That lean is where Greek melodies live."
          : focus === "pedal"
            ? "The two rings are playable addresses for the SAME note inside the moving shapes. Hold it through the progression and listen to the harmony re-name it."
            : `The solid shape is the chord sounding now; the dashed shape is the chord coming next. ${targetScopeSentence}`;
    const pedalInfo = focus === "pedal" ? commonTone() : null;
    const pedalTable = pedalInfo ? `<div class="pedal-table">${chords.map((chordItem, chordIndex) => {
      const role = pedalRole(pedalInfo.pc, chordItem);
      const last = chordIndex === chords.length - 1;
      const meaning = last
        ? "resolution — the one note finally sounds at home"
        : role.score >= 3 ? "chord tone: fully inside"
          : role.score >= 2 ? "colour tone: it re-flavours the chord"
            : "tension: hold it with intent, do not apologise for it";
      return `<div class="pedal-row${last ? " resolve" : ""}"><b>${escapeHtml(chordItem.symbol)}</b><i>${escapeHtml(pedalInfo.name)} = ${escapeHtml(role.label)}</i><span>${meaning}</span></div>`;
    }).join("")}</div>` : "";
    $("soloRecipe").innerHTML = `
      <div class="solo-frame"><b>${frame.name}</b><span>${pentatonic.map((note) => note.name).join(" · ")}</span></div>
      ${triadSeatHtml(cur, curTargets)}
      <div class="triad-landscape-key"><span class="landscape-solid">solid</span> play ${cur.symbol} now · <span class="landscape-faint">dashed</span> prepare ${next.symbol} · <span class="landscape-ring">ring</span> ${landingLensName(focus)}</div>
      <div class="solo-targets"><span>Now · <b>${cur.symbol}</b></span><strong>${targetLabel(curTargets)}</strong>
      <span>Next · <b>${next.symbol}</b></span><strong>${targetLabel(nextTargets)}</strong></div>
      ${roleAdviceHtml(cur)}
      ${thread
        ? `<p class="solo-thread"><b>The thread:</b> ${escapeHtml(thread.from.name)} → ${escapeHtml(thread.to.name)}, ${thread.distance === 1 ? "a half step" : thread.distance === 2 ? "a whole step" : "three frets"} on one string. The neck draws it; play only that move and the change is already audible.</p>`
        : `<p class="solo-thread quiet"><b>No stepwise thread here:</b> the closest landing is a leap, so aim with your ear and let the pentatonic carry you there.</p>`}
      ${pedalTable}
      <p>${focus === "third"
        ? "Treat the pentatonic as the sentence and the 3rd as the punctuation: arrive on it when the chord changes."
        : focus === "triad"
          ? "Treat the triad as the map of meaning: root feels settled, 3rd names the colour, and 5th keeps the line open. Connect only as much scale material as you need to reach the next triad."
          : focus === "sweet"
            ? "Sing the 2nd over the chord, then resolve it into the 3rd on the change. In Ousak and Hijaz the ♭2 leans even harder — one lean per phrase, placed exactly on the arrival, is the whole trick."
            : focus === "pedal"
              ? `One note over everything: hold ${pedalInfo ? pedalInfo.name : "the common tone"} through the full progression. Each chord re-names it (see the table), and the final chord resolves it — that is how a single note explains a whole song.`
              : guideInstruction}</p>
      <section class="solo-thinking"><span>Hear · think · play</span><ol>
        <li><b>Hear:</b> sing ${targetLabel(nextTargets)} before the chord moves. If you cannot sing it, stay on the current triad.</li>
        <li><b>Think:</b> ${route.path}</li>
        <li><b>Play:</b> ${route.budget}. ${route.think}</li>
      </ol><p>${focusSentence}</p><div class="solo-actions">
        <button class="solo-hear-lean" data-hear-lean>${leanDemoLabel(focus)}</button>
        <button class="solo-open-route" data-open-solo-path>Practise this route in Shape →</button>
      </div></section>
      <section id="soloTimingMatrix" class="solo-timing-matrix"></section>`;
    // The phrase-role suggestion renders inside the recipe, so it binds here.
    $("soloRecipe").querySelectorAll("[data-role-lens]").forEach((b) => b.onclick = () => {
      state.solo.focus = b.getAttribute("data-role-lens");
      syncSoloFocusButtons();
      renderSolo();
    });
    $("soloRecipe").querySelector("[data-open-solo-path]").onclick = () => setSoloSection("path");
    const leanBtn = $("soloRecipe").querySelector("[data-hear-lean]");
    leanBtn.onclick = () => {
      const seconds = playLeanDemo(cur, next, curTargets, nextTargets);
      leanBtn.disabled = true;
      leanBtn.textContent = "listening…";
      setTimeout(() => {
        if (!leanBtn.isConnected) return;
        leanBtn.disabled = false;
        leanBtn.textContent = leanDemoLabel(state.solo.focus);
      }, Math.round(seconds * 1000));
    };
    renderSoloTimingMatrix(cur, next, curTargets, nextTargets);

    $("readout").innerHTML = `
      <div class="ro-head"><span class="fn-badge fn-deg">${cur.degreeLabel}</span>
      <span class="ro-symbol">${cur.symbol}</span><span class="ro-key">into ${next.degreeLabel} · ${next.symbol}</span></div>
      <div class="tri-tags"><span class="tri-inv i-${shape ? shape.inversion : 0}">${shape ? shape.inversionName : "triad"}</span>
      <span class="tri-set">${frame.name}</span></div>
      <div class="tri-move"><b>Land now:</b> ${targetLabel(curTargets)}<br />
      <b>Hear next:</b> ${targetLabel(nextTargets)}</div>
      <div class="ro-foot">The full-neck landscape separates roles: solid = nearest triad, faint = other inversions, quiet = pentatonic connector, ring = current or next landing. Aim before you move; then use only enough notes to make the arrival feel inevitable.</div>`;
  }

  function renderLabPhrase() {
    const L = state.lab;
    const phrase = P.buildPhrase(state.tonic, state.modeId, state.solo.phraseId, {
      position: L.position, firstStroke: L.firstStroke
    });
    const pattern = phrase.pattern;
    FB.render(svg(), {
      path: phrase.nodes, pathIndex: L.pathIndex,
      labelMode: state.labelMode, lefty: state.lefty,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId), showStrokes: true
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " number-pattern phrase");

    $("phrasePatternGrid").innerHTML = P.PHRASE_PATTERNS.map((item) =>
      `<button data-phrase="${item.id}" class="${item.id === pattern.id ? "active" : ""}"><b>${item.label}</b><span>${item.job}</span></button>`
    ).join("");
    $("phrasePatternGrid").querySelectorAll("[data-phrase]").forEach((button) => {
      button.onclick = () => { state.solo.phraseId = button.getAttribute("data-phrase"); L.pathIndex = null; renderLabPhrase(); };
    });
    $("phrasePlan").innerHTML = `<div><span>How to use it</span><b>${pattern.job}</b><p>${pattern.cycle}</p></div>
      <div class="phrase-degrees">${pattern.degrees.map((degree, index) =>
        `<span${index === pattern.degrees.length - 1 ? " class=\"arrival\"" : ""}>${degree}</span>`).join("<i>→</i>")}</div>`;
    $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">phrase</span>
      <span class="ro-symbol" style="font-size:22px">${pattern.label}</span></div>
      <div class="lab-stats"><span>frets <b>${phrase.meta.lowFret}–${phrase.meta.highFret}</b></span><span>position <b>${L.position}</b></span></div>
      <div class="ro-foot">Carry ONE cell through every chord of the loop — say the numbers, then let the loop transpose them. 1–2–3–5 is the universal starter; the final note is the landing point for the chord you hear.</div>`;
    $("posLabel").textContent = "Pos " + L.position;
  }

  function renderSoloSection() {
    if (state.solo.section === "road") renderSoloRoad();
    else if (state.solo.section === "targets") renderSolo();
    else renderLab();
    renderSoloLayerChips();
  }

  function setSoloSection(section) {
    stopPlay();
    state.solo.section = section;
    document.body.setAttribute("data-solo-section", section);
    $("soloRoad").classList.toggle("hidden", section !== "road");
    $("soloTargets").classList.toggle("hidden", section !== "targets");
    $("panelLab").classList.toggle("hidden", !["path", "phrase", "cell"].includes(section));
    document.querySelectorAll("[data-solo-section]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-solo-section") === section));
    renderSoloMapControls();
    if (["path", "phrase", "cell"].includes(section)) {
      state.lab.drill = section;
      renderLab();
    } else {
      renderSoloSection();
    }
    renderPageGuide();
  }

  // ======================= shared chord readout ==========================
  // ============================ TODAY VIEW ===============================
  const TODAY_LOG_KEY = "dromos-today-visits";
  function todayStamp() { return new Date().toISOString().slice(0, 10); }
  function todayVisits() {
    try {
      const raw = JSON.parse(localStorage.getItem(TODAY_LOG_KEY) || "{}");
      return raw.date === todayStamp() && Array.isArray(raw.views) ? raw.views : [];
    } catch (error) { return []; }
  }
  function recordTodayVisit(view) {
    try {
      const views = todayVisits();
      if (!views.includes(view)) views.push(view);
      localStorage.setItem(TODAY_LOG_KEY, JSON.stringify({ date: todayStamp(), views }));
    } catch (error) { /* storage unavailable: cards simply stay unchecked */ }
  }

  function renderToday() {
    const root = $("todayApp");
    if (!root) return;
    const active = PP ? PP.active() : null;
    const name = active ? active.displayName : "Player";
    const e = state.ear;
    const pct = e.total ? Math.round((e.score / e.total) * 100) : null;
    const visited = todayVisits();
    let nextMarked = false;
    root.innerHTML = `
      <div class="today-hero"><span>Today's session</span>
        <h2>Καλή πρόβα, ${escapeHtml(name)}.</h2>
        <p>Work the cards in order on the ${escapeHtml(window.Tuning.current().name)}: hear it, name it, find it on the neck. Done cards get a check; start with the first one that has none.</p></div>
      <div class="today-grid">${PRACTICE_STEPS.map((step) => {
        const guide = PG.resolve({ view: step.view });
        const done = visited.includes(step.view);
        const upNext = !done && !nextMarked;
        if (upNext) nextMarked = true;
        return `<button class="today-card${done ? " done" : ""}${upNext ? " up-next" : ""}" data-today-view="${step.view}"><i>${done ? "✓ " : ""}${escapeHtml(step.label)}</i>${upNext ? `<em class="up-next-tag">Start here</em>` : ""}<b>${escapeHtml(guide ? guide.purpose : step.label)}</b><p>${escapeHtml(step.detail)}</p></button>`;
      }).join("")}</div>
      <div class="today-stats">
        <span>Ear colour <b>${e.score}/${e.total}</b>${pct == null ? "" : ` (${pct}%)`}</span>
        <span>Home + changes <b>${e.map.score}/${e.map.total}</b></span>
        <span>Sing-back locks <b>${active ? active.progress.singPitch.correct : 0}/${active ? active.progress.singPitch.attempts : 0}</b></span>
        <span>${state.ear.drill === "map" ? "Map streak" : "Colour streak"} <b>${state.ear.drill === "map" ? e.map.streak : e.streak}</b></span>
        <span>Instrument <b>${escapeHtml(window.Tuning.current().name)}</b></span>
      </div>`;
    root.querySelectorAll("[data-today-view]").forEach((button) => {
      button.onclick = () => setView(button.getAttribute("data-today-view"));
    });
  }

  // =========================== PROGRESS VIEW =============================
  function renderProgress() {
    const root = $("progressApp");
    if (!root || !PP) return;
    const active = PP.active();
    root.innerHTML = `
      <div class="progress-head"><h2>Profiles on this device</h2>
        <p>Separate instrument settings, ear scores, and coach history per player. Stored only in this browser — these are local profiles, not cloud accounts.</p></div>
      <div class="progress-list">${PP.list().map((profile) => {
        const colour = profile.progress.earColour, map = profile.progress.earMap, sing = profile.progress.singPitch;
        return `<div class="progress-card${profile.id === active.id ? " active" : ""}">
          <span class="player-avatar">${escapeHtml(profile.displayName.slice(0, 1).toUpperCase())}</span>
          <b>${escapeHtml(profile.displayName)}${profile.id === active.id ? " · active" : ""}</b>
          <small>${escapeHtml(instrumentShortName(profile.preferences.tuningId))} · last practice ${profile.progress.lastPracticedAt ? escapeHtml(String(profile.progress.lastPracticedAt).slice(0, 10)) : "—"}</small>
          <span class="progress-scores"><span><b>${colour.correct}/${colour.attempts}</b>colour</span><span><b>${map.correct}/${map.attempts}</b>map</span><span><b>${sing.correct}/${sing.attempts}</b>sing-back</span><span><b>${Math.max(colour.best, map.best, sing.best)}</b>best streak</span></span>
        </div>`;
      }).join("")}</div>`;
  }

  function renderChordReadout(symbol, badge, sub, notes, moveClass, foot) {
    const fnClass = { ii: "fn-ii", V: "fn-v", I: "fn-i" }[badge] || "fn-deg";
    let html = `<div class="ro-head">
      <span class="fn-badge ${fnClass}">${badge}</span>
      <span class="ro-symbol">${symbol}</span>
      <span class="ro-key">${sub}</span></div><div class="ro-notes">`;
    notes.slice().reverse().forEach((n, ri) => {
      const vi = notes.length - 1 - ri;
      const cls = moveClass ? moveClass[vi] : "held";
      html += `<div class="note-chip ${cls}" data-group="${n.colorGroup}">
        <span class="chip-role">${n.roleLabel}</span>
        <span class="chip-name">${n.name}</span>
        ${cls === "moved" ? '<span class="chip-tag">moved</span>' :
          cls === "held" ? '<span class="chip-tag held">held</span>' : ""}</div>`;
    });
    html += `</div><div class="ro-foot">${foot}</div>`;
    $("readout").innerHTML = html;
  }

  // ============================ playback =================================
  let pb = null;
  let playbackStartRequest = 0;
  let playbackLoading = false;
  // Prefer the bare roman function; degreeLabel is the display fallback and
  // scaleDegree last (it is numeric, "1"/"2", and must never win over romans).
  function functionTag(c) { return String((c && (c.fn || c.degreeLabel || c.scaleDegree)) || ""); }
  // Progression-bank chords own explicit 4-/8-bar phrase timing. The Changes
  // cycle has no such metadata and retains its user-controlled ii · V · I · I
  // fallback. Keeping the rule here makes visuals, bass motion, and transport
  // consult the same duration instead of guessing from a chord's name.
  function barsFor(c) {
    const declared = Number(c && c.durationBars);
    if (Number.isFinite(declared) && declared > 0) return Math.round(declared);
    return state.holdI && /^i$/i.test(functionTag(c)) ? 2 : 1;
  }
  function isTowardIi(c) { return /^ii(?![iv])/i.test(functionTag(c)); }

  // Skeleton mode: the documented first "playing the changes" exercise — one
  // whole note per chord, just the 3rd, until the guide-tone line is in the ear.
  function gymNotes(chord) {
    if (!state.gym.skeleton) return chord.notes;
    const third = chordTone(chord, "3") || chordTone(chord, "b3");
    return third ? [third] : chord.notes.slice(0, 1);
  }

  // Taximi bridge: instead of pivoting, the band stops, a drone sounds on the
  // NEXT key's tonic, and the player re-centers with a free, unmetered phrase
  // — the documented kompania device — then the cycle resumes in the new key.
  function cancelTaximiBridge() {
    if (!state.gym.bridging) return;
    if (state.gym.bridgeTimer) clearInterval(state.gym.bridgeTimer);
    state.gym.bridgeTimer = null;
    state.gym.bridging = false;
    const button = $("btnTaximiBridge");
    if (button) button.textContent = "Taximi bridge";
  }

  // A tonic drone: root + fifth + octave, low register, re-struck gently so
  // it sustains under an unmetered phrase. Returns the interval id.
  function startDrone(tonicPc) {
    let bottom = 36 + tonicPc;
    if (bottom < 38) bottom += 12;
    const notes = [bottom, bottom + 7, bottom + 12].map((midi) => ({ freq: 440 * Math.pow(2, (midi - 69) / 12) }));
    const strike = () => AU.playChord(notes, "block", undefined, chordReferenceVoice(), 6);
    strike();
    return setInterval(strike, 5000);
  }

  function taximiBridge() {
    if (state.gym.bridging) {
      cancelTaximiBridge();
      AU.stopAll();
      const pair = sequenceFor("pivot", state.index);
      setCycleIndex(pair[1]);
      startPlay();
      return;
    }
    stopPlay();
    AU.ensure();
    const pair = sequenceFor("pivot", state.index);
    const newIi = cycle[pair[1]];
    const tonicPc = (newIi.rootPc + 10) % 12;
    state.gym.bridging = true;
    state.gym.bridgeTimer = startDrone(tonicPc);
    const button = $("btnTaximiBridge");
    if (button) button.textContent = "Resume the band ▶";
    const banner = $("pivotBanner");
    banner.innerHTML = `Taximi bridge: drone on <b>${escapeHtml(newIi.key)}</b>. Set the new dromos with a free phrase — no meter, no count — then bring the band back in.`;
    banner.classList.add("show");
  }

  function syncGymControls() {
    document.querySelectorAll("[data-gym-keys]").forEach((button) =>
      button.classList.toggle("active", +button.getAttribute("data-gym-keys") === state.gym.keys));
    if ($("tglGymSkeleton")) $("tglGymSkeleton").checked = state.gym.skeleton;
    const progressionWorkout = state.cycleComping.focus === "chords";
    if ($("gymNote")) $("gymNote").textContent = progressionWorkout
      ? "Roman numerals stay fixed while the key moves by fourths — a practice route from the selected bank, not a claim that performances modulate this way."
      : "Each key drops a whole step (old I becomes the next ii) — a voice-leading gym, not folklore; Greek bands usually re-center with a taximi or a relative move.";
    if ($("btnTaximiBridge")) $("btnTaximiBridge").classList.toggle("hidden", progressionWorkout);
  }

  // Taximi capstone drone (Solo lab step 5): unmetered, tonic of the current
  // dromos, held until the player stops it.
  let soloDroneTimer = null;
  function cancelSoloDrone() {
    if (!soloDroneTimer) return;
    clearInterval(soloDroneTimer);
    soloDroneTimer = null;
    const button = $("btnTaximiDrone");
    if (button) button.textContent = "▶ Drone on the tonic";
  }

  // The strips render one chip per BAR (a held tonic gets a second "hold"
  // chip), so the moving highlight can show ii · V · I · I literally.
  function markHeldBar(index) {
    document.querySelectorAll("[data-held-for]").forEach((el) => {
      el.classList.toggle("held-sounding", +el.getAttribute("data-held-for") === index);
    });
  }

  function updateProgStripCursor() {
    markHeldBar(-1);
    document.querySelectorAll("#progStrip [data-step]").forEach((el) => {
      const on = +el.getAttribute("data-step") === state.progStep;
      el.classList.toggle("active", on);
      // The hold tail belongs to the same chip, so the pair carries the
      // outline; only ONE element per sounding chord ever reads as selected.
      if (el.parentElement) el.parentElement.classList.toggle("on", on);
    });
    document.querySelectorAll(".solo-current-change [data-solo-step]").forEach((el) => {
      el.classList.toggle("active", +el.getAttribute("data-solo-step") === state.progStep);
    });
  }

  // "Five of two": on beat 3 of the phrase's final bar, sound the dominant of
  // the upcoming ii (A7 -> Dm7 in C). A pickup, not a new harmony lane.
  function schedulePickup(nextChord, barStart) {
    if (!state.pickupV2 || !nextChord || !isTowardIi(nextChord)) return;
    const iiRoot = rootPcOf(nextChord);
    if (iiRoot == null) return;
    const rootPc = (iiRoot + 7) % 12;
    let bottom = 48 + rootPc;                 // keep the pickup mid-register
    while (bottom < 50) bottom += 12;
    const notes = [0, 4, 7, 10].map((off) => ({ freq: 440 * Math.pow(2, ((bottom + off) - 69) / 12) }));
    // Ring for roughly the remaining two beats so the pickup leads into the
    // next downbeat without sustaining over the new ii chord.
    AU.playChord(notes, "block", barStart + 2 * (60 / state.bpm), chordReferenceVoice(), Math.min(1.4, 2 * (60 / state.bpm)));
  }

  async function startPlay() {
    const request = ++playbackStartRequest;
    cancelTaximiBridge();
    cancelSoloDrone();
    AU.ensure();
    if (chordReferenceVoice() === "studio" && AU.studioStatus() !== "ready") {
      playbackLoading = true;
      setPlayingUI(true, "■ Stop loading");
      await AU.prepareStudioPiano();
      if (request !== playbackStartRequest) return;
      playbackLoading = false;
    }
    const pulse = currentPulse();
    if (state.view === "cycle" && state.cycleComping.focus === "chords") {
      const chords = cycleCompingEntries().map((entry) => entry.chord);
      pb = { kind: "comping", chords, len: chords.length, pos: state.cycleComping.step, barsLeft: 0, started: false };
    } else if (state.view === "cycle") {
      const seq = gymSequence(state.index);
      pb = { kind: "cycle", seq, route: cycleTriadPath(), pos: Math.max(0, seq.indexOf(state.index)), barsLeft: 0, started: false };
    } else if (state.view === "triads") {
      const { chords } = currentProgression();
      pb = { kind: "triads", len: chords.length, pos: state.triads.step, barsLeft: 0, started: false };
    } else if (state.view === "prog" || state.view === "solo") {
      const { chords } = currentProgression();
      pb = { kind: "prog", len: chords.length, pos: state.progStep, barsLeft: 0, started: false };
    } else {
      return;
    }

    AU.startTransport({
      bpm: state.bpm, beatsPerBar: pulse.beats.length, pulse: pulse.beats,
      groove: state.groove, metronome: state.metronome, strumStyle: state.strumStyle,
      onStop: () => setPlayingUI(false),
      onBar: (bar, when, now) => {
        const delay = Math.max(0, (when - now) * 1000);
        if (pb.kind === "cycle") {
          if (pb.barsLeft > 0) {
            pb.barsLeft--;
            setTimeout(animateChangeGuide, delay);
            if (pb.barsLeft === 0 && !state.gym.skeleton) schedulePickup(cycle[pb.seq[(pb.pos + 1) % pb.seq.length]], when);
            // Held bars still comp: the pulse stays solid through the long tonic.
            const held = cycle[pb.seq[pb.pos]];
            return { hold: true, notes: gymNotes(held), referenceVoice: chordReferenceVoice() };
          }
          if (pb.started) {
            const next = pb.pos + 1;
            if (next >= pb.seq.length && !state.loop) return null;
            pb.pos = next % pb.seq.length;
          }
          pb.started = true;
          const idx = pb.seq[pb.pos];
          const chord = cycle[idx];
          pb.barsLeft = barsFor(chord) - 1;
          setTimeout(() => setCycleIndex(idx), delay);
          const nextIndex = pb.seq[(pb.pos + 1) % pb.seq.length];
          const nextChord = cycle[nextIndex] || chord;
          if (pb.barsLeft === 0 && !state.gym.skeleton) schedulePickup(nextChord, when);
          return { notes: gymNotes(chord), referenceVoice: chordReferenceVoice(), bass: { rootPc: rootPcOf(chord), nextRootPc: rootPcOf(nextChord) } };
        }
        // progression playback
        if (pb.barsLeft > 0) {
          pb.barsLeft--;
          setTimeout(animateChangeGuide, delay);
          const heldPos = pb.pos;
          setTimeout(() => markHeldBar(heldPos), delay);
          const heldChords = pb.kind === "comping" ? pb.chords : currentProgression().chords;
          if (pb.barsLeft === 0) {
            schedulePickup(heldChords[(pb.pos + 1) % heldChords.length], when);
          }
          // Held bars still comp: the pulse stays solid through the long tonic.
          const held = heldChords[pb.pos];
          return { hold: true, notes: held ? held.notes : null, referenceVoice: chordReferenceVoice() };
        }
        if (pb.started) {
          const next = pb.pos + 1;
          if (next >= pb.len && !state.loop) return null;
          pb.pos = next % pb.len;
        }
        pb.started = true;
        const chords = pb.kind === "comping" ? pb.chords : currentProgression().chords;
        const c = chords[pb.pos];
        const nextChord = chords[(pb.pos + 1) % chords.length] || c;
        setTimeout(() => {
          if (pb.kind === "comping") {
            state.cycleComping.step = pb.pos;
            state.cycleComping.voicingIndex = 0;
            renderCycle();
          } else if (pb.kind === "triads") {
            state.triads.step = pb.pos;
            renderTriads();
          } else {
            markProgMoved();
            state.progStep = pb.pos;
            state.solo.matrixBeat = 0;
            state.view === "solo" ? renderSoloSection() : renderProg();
            updateProgStripCursor();
          }
        }, delay);
        pb.barsLeft = barsFor(c) - 1;
        if (pb.barsLeft === 0) schedulePickup(nextChord, when);
        return { notes: c.notes, referenceVoice: chordReferenceVoice(), bass: { rootPc: rootPcOf(c), nextRootPc: rootPcOf(nextChord) } };
      },
      onBeat: (bar, beatInBar, pulseBeat, event, when, now) => {
        const delay = Math.max(0, (when - now) * 1000);
        setTimeout(() => beatPulse(!!(pulseBeat && pulseBeat.first)), delay);
        if (state.view === "triads") {
          setTimeout(() => updateCompPulse(beatInBar), delay);
          return;
        }
        if (state.view !== "solo" || state.solo.section !== "targets") return;
        setTimeout(() => {
          if (state.view === "solo" && state.solo.section === "targets") updateSoloMatrixJourney(beatInBar);
        }, delay);
      }
    });
    setPlayingUI(true);
  }

  function stopPlay() {
    playbackStartRequest++; melodyPlaybackRequest++; tacticalPlaybackRequest++; playbackLoading = false;
    pickingRunToken++;
    if (pickingRunTimer) { clearTimeout(pickingRunTimer); pickingRunTimer = null; }
    state.picking.playing = false; state.picking.pathIndex = null; state.picking.runIndex = null; state.picking.activeSegment = null;
    AU.stopAll(); setPlayingUI(false);
  }
  function setPlayingUI(p, label) {
    const text = label || (p ? "⏸ Pause" : "▶ Play");
    const b = $("btnPlay");
    b.textContent = text;
    b.classList.toggle("playing", p);
    // Starting and stopping FEEL like actions: a spring tick on the morph.
    b.classList.remove("tick"); void b.offsetWidth; b.classList.add("tick");
    // Comp keeps its own Play next to the skeleton it starts; it mirrors the
    // transport rather than owning a second playback state.
    const comp = $("btnCompPlay");
    if (comp) {
      comp.textContent = text;
      comp.classList.toggle("playing", p);
      comp.classList.remove("tick"); void comp.offsetWidth; comp.classList.add("tick");
    }
    if (!p && state.view === "triads") resetCompPulse();
  }

  // Interaction canon §2: while anything plays, the interface pulses on the
  // beat. Class-retriggered CSS animation, scheduled to the audio clock,
  // gated by motionOK() so reduced motion stays still.
  function beatPulse(strong, targets) {
    if (!motionOK()) return;
    (targets || [$("btnPlay"), document.querySelector(".roadmap-chord.now")]).forEach((el) => {
      if (!el) return;
      el.classList.remove("on-pulse", "on-pulse-strong");
      void el.offsetWidth;
      el.classList.add(strong ? "on-pulse-strong" : "on-pulse");
    });
  }
  function togglePlay() {
    if (state.view === "picking") { state.picking.playing ? (stopPlay(), renderPickingLab()) : playPickingExercise(); return; }
    AU.isPlaying() || playbackLoading ? stopPlay() : startPlay();
  }

  function auditionCurrent(style) {
    AU.ensure();
    if (state.view === "cycle") {
      if (state.cycleComping.focus === "chords") {
        const chord = cycleCompingEntries()[state.cycleComping.step]?.chord;
        if (!chord) return;
        AU.playChord(chord.notes, style || state.strumStyle, undefined, chordReferenceVoice());
      } else {
        const shape = cycleTriadPath()[state.index];
        if (shape) AU.playChord(shapeAudioNotes(shape), style || state.strumStyle, undefined, chordReferenceVoice());
      }
    }
    else if (state.view === "chordmap") auditionChordMap(style);
    else if (state.view === "picking") playPickingExercise();
    else if (state.view === "prog" || state.view === "solo") auditionProg();
    else if (state.view === "triads") auditionTriad();
  }

  // ============================== views ==================================
  const VIEW_CHROME = {
    cycle: { transport: true, journey: true, readout: true, split: true },
    prog: { transport: true, journey: true, readout: true, split: true },
    triads: { transport: true, journey: true, readout: true, split: true },
    solo: { transport: true, journey: true, readout: true, split: true },
    chordmap: { transport: false, journey: true, readout: true, split: true },
    songs: { transport: false, journey: true, readout: true, split: true },
    examples: { transport: false, journey: true, readout: true, split: true },
    picking: { transport: false, journey: true, readout: true, split: true }
  };

  function motionOK() {
    return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function setView(v) {
    // Same-document view transition (Baseline 2025): the stage and the
    // transport carry view-transition-names, so the two persistent objects
    // morph between views instead of teleporting. Fallback: instant swap.
    if (document.startViewTransition && motionOK() && !document.hidden && state.view && state.view !== v) {
      // A rapid second switch aborts the running transition - expected, and
      // the DOM swap still happens; swallow the abort so it never logs.
      const transition = document.startViewTransition(() => applyView(v));
      transition.finished.catch(() => {});
      return;
    }
    applyView(v);
  }

  function applyView(v) {
    if (v === "lab") v = "solo";   // compatibility with bookmarks from the first version
    if (state.view === "video" && v !== "video" && V) V.destroy();
    stopPitchListening({ record: false, quiet: true });
    stopPlay();
    cancelTaximiBridge();
    cancelSoloDrone();
    state.view = v;
    persistPreferences();
    recordTodayVisit(v);
    document.body.setAttribute("data-view", v);
    // One table, four chrome channels. Hand-kept per-view CSS lists rotted
    // (Songs and Examples showed live-looking dead transports; Triads told
    // players to press a Play the CSS had hidden).
    const chrome = VIEW_CHROME[v] || { transport: false, journey: false, readout: false, split: false };
    document.body.classList.toggle("chrome-no-transport", !chrome.transport);
    document.body.classList.toggle("chrome-no-journey", !chrome.journey);
    document.body.classList.toggle("chrome-no-readout", !chrome.readout);
    document.body.classList.toggle("chrome-single", !chrome.split);
    document.body.setAttribute("data-solo-section", state.solo.section);
    $("btnPrev").disabled = v === "examples"; $("btnNext").disabled = v === "examples";
    $("btnPlay").disabled = v === "examples";
    $("btnPlay").title = v === "examples" ? "Use Hear the note path inside the selected example" : "Play / Pause (Space)";
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === v));
    const nav = VIEW_NAV[v] || "harmony";
    document.body.setAttribute("data-nav", nav);
    document.querySelectorAll("[data-nav]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-nav") === nav));
    if ($("harmonyTabs")) $("harmonyTabs").classList.toggle("hidden", nav !== "harmony");
    if ($("repertoireTabs")) $("repertoireTabs").classList.toggle("hidden", nav !== "repertoire");
    if ($("learnTabs")) $("learnTabs").classList.toggle("hidden", nav !== "learn");
    syncHarmonyTabs();
    ["panelToday", "panelCycle", "panelProg", "panelChordMap", "panelEar", "panelMelody", "panelLab", "panelPicking", "panelTriads", "panelSolo", "panelVideo", "panelStyles", "panelExamples", "panelSongs", "panelAnalyze", "panelConcepts", "panelCoach", "panelProgress"].forEach((id) => $(id).classList.add("hidden"));
    $("stage").classList.toggle("hidden", v === "ear" || v === "melody" || v === "video" || v === "styles" || v === "examples" || v === "analyze" || v === "concepts" || v === "coach" || v === "today" || v === "progress");
    $("scaleStrip").classList.toggle("hidden", v !== "prog");
    $("progStrip").classList.toggle("hidden", v !== "prog");
    $("triadStrip").classList.toggle("hidden", v !== "triads");
    $("changeGuide").classList.toggle("hidden", v !== "cycle" && v !== "prog");
    $("cycleRoadmap").classList.toggle("hidden", v !== "cycle");
    $("pickingSetup").classList.toggle("hidden", v !== "picking");
    if (v === "cycle") { $("panelCycle").classList.remove("hidden"); renderCycle(); }
    else if (v === "prog") { $("panelProg").classList.remove("hidden"); syncProgControls(); renderProg(); }
    else if (v === "chordmap") { $("panelChordMap").classList.remove("hidden"); renderChordMap(); }
    else if (v === "triads") { $("panelTriads").classList.remove("hidden"); syncTriadControls(); renderTriads(); }
    else if (v === "solo") { $("panelSolo").classList.remove("hidden"); setSoloSection(state.solo.section); }
    else if (v === "picking") { $("panelPicking").classList.remove("hidden"); renderPickingLab(); }
    else if (v === "melody") { $("panelMelody").classList.remove("hidden"); renderMelodyLab(); }
    else if (v === "video") { $("panelVideo").classList.remove("hidden"); if (V) V.render(); }
    else if (v === "styles") { $("panelStyles").classList.remove("hidden"); renderStyles(); }
    else if (v === "examples") { $("panelExamples").classList.remove("hidden"); renderTacticalExamples(); }
    else if (v === "songs") { $("panelSongs").classList.remove("hidden"); renderSongs(); }
    else if (v === "analyze") { $("panelAnalyze").classList.remove("hidden"); syncAnalysisControls(); renderAnalyzer(); }
    else if (v === "concepts") { $("panelConcepts").classList.remove("hidden"); renderConcepts(); }
    else if (v === "coach") { $("panelCoach").classList.remove("hidden"); C.render(); }
    else if (v === "today") { $("panelToday").classList.remove("hidden"); renderToday(); }
    else if (v === "progress") { $("panelProgress").classList.remove("hidden"); renderProgress(); }
    else { $("panelEar").classList.remove("hidden"); setEarDrill(state.ear.drill); }
    // renderCycle rightfully decides whether the pivot explanation is visible;
    // no other practice area should inherit that explanation from a prior view.
    if (v !== "cycle") $("pivotBanner").classList.remove("show");
    renderSoloLayerChips();
    renderPageGuide();
    $("keyboardHint").textContent = v === "melody"
      ? "Space replays the note · choose one degree · Check builds the harmony map"
      : v === "ear"
        ? "Space starts or replays the question · answers stay editable until Check + reveal"
        : v === "examples"
          ? "Choose an example · Hear previews pitch only · Stop clears every sound"
          : v === "picking"
            ? "Space plays or stops · ← → changes exercise · tap any event to inspect it"
        : "Space plays · ← → steps · number keys follow the navigation";
    // Each primary destination is a new lesson, not another state of the old
    // page. Opening at the previous page's scroll depth hides the premise and
    // setup—especially on iPad—so always begin at the top.
    window.scrollTo(0, 0);
    if (C) C.trackView(v, coachContext());
  }

  // ============================= wiring ==================================
  function wire() {
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.onclick = () => setView(b.getAttribute("data-view")));

    document.querySelectorAll("[data-nav]").forEach((b) =>
      b.onclick = () => setView(NAV_DEFAULT_VIEW[b.getAttribute("data-nav")] || "cycle"));

    document.querySelectorAll("[data-harmony-mode]").forEach((el) => el.onclick = () => {
      const wasPlaying = AU.isPlaying();
      stopPlay();
      state.cycleMode = el.getAttribute("data-harmony-mode");
      persistPreferences();
      if (state.view !== "cycle") setView("cycle");
      else renderCycle();
      syncHarmonyTabs();
      if (wasPlaying) startPlay();
    });

    document.querySelectorAll("[data-chord-map-depth]").forEach((button) => button.onclick = () => {
      stopPlay();
      state.chordMap.depth = button.getAttribute("data-chord-map-depth") === "seventh" ? "seventh" : "triad";
      state.chordMap.targetIndex = 1;
      state.chordMap.shapeIndex = 0;
      renderChordMap();
      auditionChordMap("strum");
    });
    $("btnMatrixStop").onclick = stopPlay;

    $("melodyTonicSel").onchange = (event) => {
      stopPitchListening({ record: false, quiet: true }); stopPlay(); state.tonic = event.target.value;
      state.melody.prompt = null; state.melody.guess = null; state.melody.revealed = false;
      state.melody.message = `Known home changed to ${state.tonic}. Hear it, then start a new note.`;
      persistPreferences(); renderMelodyLab(); renderPageGuide();
    };
    document.querySelectorAll("[data-melody-mode]").forEach((button) => button.onclick = () => {
      stopPitchListening({ record: false, quiet: true }); stopPlay(); state.modeId = button.getAttribute("data-melody-mode");
      state.progId = M.PROGRESSIONS[state.modeId][0].id;
      state.melody.prompt = null; state.melody.guess = null; state.melody.revealed = false;
      state.melody.message = `${M.MODES[state.modeId].name} selected. Re-hear the home before the next note.`;
      persistPreferences(); renderMelodyLab(); renderPageGuide();
    });
    document.querySelectorAll("[data-melody-depth]").forEach((button) => button.onclick = () => {
      stopPitchListening({ record: false, quiet: true }); stopPlay(); state.melody.depth = button.getAttribute("data-melody-depth") === "seventh" ? "seventh" : "triad";
      if (state.melody.prompt) {
        const degreeIndex = state.melody.prompt.degreeIndex;
        state.melody.prompt = melodyPromptFor(degreeIndex);
        state.melody.selectedDegree = state.melody.revealed ? state.melody.prompt.candidates[0].chord.degreeIndex : null;
        state.melody.selectedSuccessor = 0;
      }
      state.melody.message = state.melody.depth === "seventh"
        ? "7ths add one more lawful chord colour; the heard note itself has not changed."
        : "Triads restore the three-note foundation; the heard note itself has not changed.";
      renderMelodyLab();
    });
    $("btnMelodyHome").onclick = () => playMelodyPrompt(true);
    $("btnMelodyNew").onclick = newMelodyQuestion;
    $("btnMelodyReplay").onclick = () => playMelodyPrompt(false);
    $("btnMelodyHint").onclick = hintMelodyQuestion;
    $("btnMelodyCheck").onclick = checkMelodyQuestion;
    $("btnMelodyStop").onclick = () => {
      stopPitchListening({ record: false, quiet: true }); stopPlay(); $("melodyAudioStatus").textContent = "Stopped · your answer and harmony map stay in place";
    };
    // The sing trainer lives inside the "More" fold. A microphone must never
    // keep running behind a closed disclosure.
    $("melodyMore").ontoggle = () => {
      const sing = state.melody.sing;
      if (!$("melodyMore").open && (sing.listening || sing.requesting)) stopPitchListening({ record: true });
    };
    $("btnSingTarget").onclick = playSingTarget;
    $("btnSingStart").onclick = startPitchListening;
    $("btnSingStop").onclick = () => stopPitchListening({ record: true });
    $("singInputSel").onchange = async (event) => {
      const wasListening = state.melody.sing.listening;
      stopPitchListening({ record: false, quiet: true });
      state.melody.sing.deviceId = event.target.value;
      if (wasListening) await startPitchListening();
      else renderSingInputs();
    };

    if ($("voiceSel")) $("voiceSel").onchange = (event) => {
      state.chordVoice = event.target.value;
      saveUiPreferences();
      if (state.chordVoice === "studio") AU.prepareStudioPiano();
      updateAudioReadyStatus(AU.audioStatus());
    };
    if ($("btnSoundCheck")) $("btnSoundCheck").onclick = playSoundCheck;
    $("pickingVoiceSel").onchange = (event) => {
      state.picking.voice = ["bouzouki", "studio", "piano"].includes(event.target.value) ? event.target.value : "bouzouki";
      saveUiPreferences();
      if (state.picking.voice === "studio") AU.prepareStudioPiano();
      updateAudioReadyStatus(AU.audioStatus());
    };
    $("btnPickingSoundCheck").onclick = playPickingSoundCheck;
    if ($("tglPickup")) $("tglPickup").onchange = (event) => {
      state.pickupV2 = event.target.checked;
      saveUiPreferences();
      rerender();
    };

    $("btnPrev").onclick = () => {
      stopPlay();
      if (state.view === "cycle") state.cycleComping.focus === "chords" ? stepCycleComping(-1) : stepCycle(-1);
      else if (state.view === "chordmap") { selectChordMapDegree((state.chordMap.degree + 6) % 7, false); }
      else if (state.view === "picking") { stepPickingExercise(-1); return; }
      else if (state.view === "prog" || state.view === "solo") stepProg(-1);
      else if (state.view === "triads") stepTriad(-1);
      else return;
      auditionCurrent("block");
    };
    $("btnNext").onclick = () => {
      stopPlay();
      if (state.view === "cycle") state.cycleComping.focus === "chords" ? stepCycleComping(1) : stepCycle(1);
      else if (state.view === "chordmap") { selectChordMapDegree((state.chordMap.degree + 1) % 7, false); }
      else if (state.view === "picking") { stepPickingExercise(1); return; }
      else if (state.view === "prog" || state.view === "solo") stepProg(1);
      else if (state.view === "triads") stepTriad(1);
      else return;
      auditionCurrent();
    };
    $("btnPlay").onclick = togglePlay;
    document.querySelectorAll("[data-gym-keys]").forEach((button) => button.onclick = () => {
      const wasPlaying = AU.isPlaying();
      stopPlay(); cancelTaximiBridge();
      state.gym.keys = +button.getAttribute("data-gym-keys");
      state.gym.anchor = Math.floor(state.index / 3) * 3;
      if (state.cycleComping.focus === "chords") { state.cycleComping.step = 0; state.cycleComping.voicingIndex = 0; }
      saveUiPreferences();
      renderCycle();
      renderPageGuide();
      if (wasPlaying) startPlay();
    });
    if ($("tglGymSkeleton")) $("tglGymSkeleton").onchange = (event) => {
      state.gym.skeleton = event.target.checked;
      saveUiPreferences();
    };
    if ($("btnTaximiBridge")) $("btnTaximiBridge").onclick = taximiBridge;

    document.querySelectorAll("[data-taximi-stage]").forEach((button) => button.onclick = () => {
      document.querySelectorAll("[data-taximi-stage]").forEach((item) => item.classList.toggle("active", item === button));
    });
    if ($("btnTaximiDrone")) $("btnTaximiDrone").onclick = () => {
      if (soloDroneTimer) { cancelSoloDrone(); AU.stopAll(); return; }
      stopPlay();
      AU.ensure();
      soloDroneTimer = startDrone(M.scaleOf(state.tonic, state.modeId)[0].pc);
      $("btnTaximiDrone").textContent = "⏸ Stop the drone";
    };
    $("btnStrum").onclick = () => auditionCurrent("strum");
    $("btnArp").onclick = () => auditionCurrent("arp");
    $("btnShift").onclick = () => {
      const anchors = [null, 0, 3, 5, 7, 9];
      state.position = anchors[(anchors.indexOf(state.position) + 1) % anchors.length];
      $("btnShift").textContent = "Position: " + (state.position == null ? "auto" : state.position);
      rerender();
    };


    document.querySelectorAll("[data-cycle-focus]").forEach((button) => button.onclick = () => {
      stopPlay();
      state.cycleComping.focus = button.getAttribute("data-cycle-focus");
      document.querySelectorAll("[data-cycle-focus]").forEach((item) =>
        item.classList.toggle("active", item.getAttribute("data-cycle-focus") === state.cycleComping.focus));
      renderCycle(); renderPageGuide();
    });

    document.querySelectorAll("[data-modeid]").forEach((el) =>
      el.onclick = () => selectMode(el.getAttribute("data-modeid")));
    document.querySelectorAll("[data-chord-map-mode]").forEach((button) => button.onclick = () => {
      stopPlay();
      state.modeId = button.getAttribute("data-chord-map-mode");
      if (!M.PROGRESSIONS[state.modeId].some((progression) => progression.id === state.progId)) state.progId = M.PROGRESSIONS[state.modeId][0].id;
      state.chordMap.degree = 0; state.chordMap.targetIndex = 1; state.chordMap.shapeIndex = 0;
      persistPreferences(); renderChordMap(); auditionChordMap("strum");
    });

    document.querySelectorAll("[data-solo-section]").forEach((button) =>
      button.onclick = () => setSoloSection(button.getAttribute("data-solo-section")));
    document.querySelectorAll("[data-solo-focus]").forEach((button) =>
      button.onclick = () => {
        stopPlay();
        state.solo.focus = button.getAttribute("data-solo-focus");
        document.querySelectorAll("[data-solo-focus]").forEach((item) =>
          item.classList.toggle("active", item.getAttribute("data-solo-focus") === state.solo.focus));
        renderSolo();
      });

    document.querySelectorAll("[data-style-section]").forEach((button) =>
      button.onclick = () => setStyleSection(button.getAttribute("data-style-section")));

    $("analysisTonic").innerHTML = M.TONICS.map((tonic) => `<option value="${tonic}">${tonic}</option>`).join("");
    $("analysisTonic").onchange = (event) => {
      state.analysis.tonic = event.target.value; state.analysis.studyId = null; state.analysis.selected = 0; renderAnalyzer(); renderPageGuide();
    };
    document.querySelectorAll("[data-analysis-mode]").forEach((button) => {
      button.onclick = () => {
        state.analysis.modeId = button.getAttribute("data-analysis-mode"); state.analysis.studyId = null; state.analysis.selected = 0;
        syncAnalysisControls(); renderAnalyzer(); renderPageGuide();
      };
    });
    $("btnAnalyze").onclick = () => { state.analysis.studyId = null; state.analysis.selected = 0; renderAnalyzer(); };
    $("btnUseSongMap").onclick = () => {
      const { chords } = currentProgression();
      state.analysis.tonic = state.tonic;
      state.analysis.modeId = state.modeId;
      state.analysis.studyId = null;
      state.analysis.selected = 0;
      $("analysisChords").value = chords.map((chord) => chord.symbol).join(" ");
      syncAnalysisControls(); renderAnalyzer();
    };
    $("scoreFile").onchange = async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      if (!Q) { setScoreImportStatus("Score import is unavailable because its local parser did not load.", "error"); return; }
      try {
        const imported = Q.parseMusicXml(await file.text());
        if (!imported.ok) { setScoreImportStatus(imported.message, "error"); return; }
        $("analysisChords").value = imported.chordMap;
        $("analysisLine").value = imported.lineText;
        state.analysis.studyId = null;
        state.analysis.selected = 0;
        setScoreImportStatus((imported.title ? imported.title + " — " : "") + imported.message + (imported.lineText ? " Note groups were attached to their written chord symbols." : " No notes could be attached to a harmony symbol."), "ok");
        renderAnalyzer();
      } catch (error) {
        setScoreImportStatus("Could not read that file as uncompressed MusicXML. Export it again from your notation app and include chord symbols.", "error");
      } finally {
        event.target.value = "";
      }
    };

    const tonicSel = $("tonicSel");
    tonicSel.innerHTML = M.TONICS.map((t) =>
      `<option value="${t}"${t === state.tonic ? " selected" : ""}>${t}</option>`).join("");
    tonicSel.onchange = (e) => {
      state.tonic = e.target.value;
      persistPreferences();
      // Every chord name on this page is spelled from the key: the mode
      // signature tones and the map cards must be rebuilt, not left in the
      // old key while the strip moves.
      if (state.view === "prog") { syncProgControls(); renderProg(); }
      else if (state.view === "solo") { renderSoloMapControls(); renderSoloSection(); }
      else if (state.view === "triads") renderTriads();
      renderPageGuide();
    };
    const chordMapTonic = $("chordMapTonicSel");
    chordMapTonic.innerHTML = M.TONICS.map((tonic) => `<option value="${tonic}">${tonic}</option>`).join("");
    chordMapTonic.onchange = (event) => {
      stopPlay(); state.tonic = event.target.value; state.chordMap.degree = 0; state.chordMap.targetIndex = 1; state.chordMap.shapeIndex = 0;
      persistPreferences(); renderChordMap(); renderPageGuide(); auditionChordMap("strum");
    };

    const tuneSel = $("tuningSel");
    tuneSel.innerHTML = window.Tuning.TUNINGS.map((t) =>
      `<option value="${t.id}"${t.id === window.Tuning.currentId() ? " selected" : ""}>${t.name}</option>`).join("");
    const showTuningSub = () => { $("tuningSub").textContent = window.Tuning.current().sub; };
    tuneSel.onchange = (e) => {
      stopPlay();
      window.Tuning.set(e.target.value);
      showTuningSub();
      persistPreferences(); renderPlayerProfiles(false);
      state.position = null;
      state.chordMap.shapeIndex = 0;
      $("btnShift").textContent = "Position: auto";
      rerender();
      if (state.view === "ear") renderEarScore();
    };
    showTuningSub();
    renderGrooveControls();
    $("grooveStyle").onchange = (event) => selectGrooveStyle(event.target.value);
    $("tglBass").onchange = (event) => {
      state.groove.bass = event.target.checked;
      renderGrooveControls();
    };
    $("tglDrums").onchange = (event) => {
      state.groove.drums = event.target.checked;
      renderGrooveControls();
    };

    $("tglLabel").onchange = (e) => { state.labelMode = e.target.checked ? "note" : "interval"; persistPreferences(); rerender(); };
    $("tglGhost").onchange = (e) => { state.ghosts = e.target.checked; rerender(); };
    $("tglLefty").onchange = (e) => { state.lefty = e.target.checked; persistPreferences(); rerender(); };
    $("tglScale").onchange = (e) => { state.scaleOverlay = e.target.checked; rerender(); };
    $("tglMetro").onchange = (e) => { state.metronome = e.target.checked; AU.setMetronome(state.metronome); };
    $("tglLoop").onchange = (e) => { state.loop = e.target.checked; persistPreferences(); rerender(); };
    $("tglHoldI").onchange = (e) => { state.holdI = e.target.checked; };

    $("bpm").oninput = (e) => {
      state.bpm = +e.target.value; $("bpmVal").textContent = state.bpm; AU.setBpm(state.bpm); persistPreferences();
    };

    // --- triads ---
    $("setSel").onchange = (e) => {
      state.triads.stringSet = e.target.value === "" ? null : +e.target.value;
      renderTriads();
    };
    $("triadZoneSel").onchange = (event) => {
      state.triads.zone = event.target.value; persistPreferences();
      renderTriads();
    };
    $("tglAllShapes").onchange = (e) => { state.triads.showAll = e.target.checked; renderTriads(); };
    $("btnTriadPrev").onclick = () => { stopPlay(); stepTriad(-1); };
    $("btnTriadNext").onclick = () => { stopPlay(); stepTriad(1); };
    $("btnCompPlay").onclick = togglePlay;

    // --- scale lab ---
    document.querySelectorAll("[data-drill]").forEach((b) => b.onclick = () => {
      state.lab.drill = b.getAttribute("data-drill"); state.lab.revealed = false; renderLab();
    });
    document.querySelectorAll("[data-layout]").forEach((b) => b.onclick = () => {
      document.querySelectorAll("[data-layout]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.lab.layout = b.getAttribute("data-layout");
      state.lab.pathIndex = null; renderLab();
    });
    $("btnPosUp").onclick = () => shiftPosition(1);
    $("btnPosDown").onclick = () => shiftPosition(-1);
    $("startDeg").onchange = (e) => {
      state.lab.startDegree = +e.target.value; state.lab.cellIdx = 0;
      state.lab.revealed = false; renderLab();
    };
    $("btnStroke").onclick = () => {
      state.lab.firstStroke = state.lab.firstStroke === "down" ? "up" : "down";
      $("btnStroke").textContent = "Start: " + (state.lab.firstStroke === "down" ? "↓ downstroke" : "↑ upstroke");
      renderLab();
    };
    $("tglUpDown").onchange = (e) => { state.lab.updown = e.target.checked; renderLab(); };
    $("btnLabPlay").onclick = () => {
      if (state.lab.drill === "path") playLabPath();
      else if (state.lab.drill === "phrase") playLabPhrase();
      else playLabCell();
    };
    $("btnCellPrev").onclick = () => stepCell(-1);
    $("btnCellNext").onclick = () => stepCell(1);
    $("btnReveal").onclick = () => {
      state.lab.revealed = !state.lab.revealed;
      renderLabCell();
      if (state.lab.revealed) AU.playPath([P.buildCells(state.tonic, state.modeId,
        { startDegree: state.lab.startDegree })[state.lab.cellIdx].target], 0.3, {});
    };
    $("tglAudiate").onchange = (e) => { state.lab.audiate = e.target.checked; state.lab.revealed = false; renderLabCell(); };

    // --- dedicated picking curriculum ---
    document.querySelectorAll("[data-picking-run]").forEach((button) => button.onclick = () => {
      stopPlay(); state.picking.runMode = button.getAttribute("data-picking-run") === "evolve" ? "evolve" : "loop";
      state.picking.cleanPasses = 0; renderPickingLab(); renderPageGuide();
    });
    const setPickingBpm = (raw) => {
      stopPlay(); state.bpm = Math.max(30, Math.min(220, Math.round(+raw) || 84));
      state.picking.cleanPasses = 0; AU.setBpm(state.bpm); persistPreferences(); syncPersistentControls(); renderPickingLab();
    };
    $("pickingBpm").oninput = (event) => setPickingBpm(event.target.value);
    $("pickingBpmNum").value = String(state.bpm);
    $("pickingBpmNum").onchange = (event) => setPickingBpm(event.target.value);
    $("pickingRepeatsSel").onchange = (event) => {
      stopPlay(); state.picking.repeats = [1, 2, 4, 6].includes(+event.target.value) ? +event.target.value : 4;
      state.picking.cleanPasses = 0; renderPickingLab();
    };
    $("pickingMoveSel").onchange = (event) => {
      stopPlay(); state.picking.movement = ["position", "key", "band", "both"].includes(event.target.value) ? event.target.value : "position";
      state.picking.cleanPasses = 0; renderPickingLab(); renderPageGuide();
    };
    $("tglPickingMetronome").onchange = (event) => {
      stopPlay(); state.picking.metronome = !!event.target.checked; renderPickingLab();
    };
    $("tglPickingCountIn").onchange = (event) => {
      stopPlay(); state.picking.countIn = !!event.target.checked; renderPickingLab();
    };
    document.querySelectorAll("[data-picking-subdivision]").forEach((button) => button.onclick = () => {
      stopPlay(); state.picking.subdivision = +button.getAttribute("data-picking-subdivision"); state.picking.cleanPasses = 0; renderPickingLab();
    });
    document.querySelectorAll("[data-picking-route]").forEach((button) => button.onclick = () => {
      stopPlay(); state.picking.route = button.getAttribute("data-picking-route") === "tiered" ? "tiered" : "horizontal";
      state.picking.cleanPasses = 0; renderPickingLab();
    });
    $("btnPickingStroke").onclick = () => {
      stopPlay(); state.picking.firstStroke = state.picking.firstStroke === "down" ? "up" : "down";
      state.picking.cleanPasses = 0; renderPickingLab();
    };
    $("btnPickingPlay").onclick = () => {
      if (state.picking.playing) { stopPlay(); renderPickingLab(); return; }
      playPickingExercise();
    };
    $("btnPickingClean").onclick = logPickingPass;
    $("btnPickingTempoUp").onclick = raisePickingTempo;
    $("btnPickingMiss").onclick = missPickingPass;

    $("earHomeSel").onchange = (event) => {
      const value = event.target.value;
      if (state.ear.drill === "map") { state.ear.map.homePreset = value; prepareEarMap(false); }
      else { state.ear.tonic = value; resetEarQuestion(); }
      renderEarHome();
      renderPageGuide();
    };
    $("btnEarHome").onclick = () => (state.ear.drill === "map" ? playEarMapHome() : playEarTonic());
    $("btnEarNew").onclick = newEarQuestion;
    $("btnEarReplay").onclick = () => { if (state.ear.answer) playEarPrompt(); else newEarQuestion(); };
    $("btnEarStop").onclick = () => { stopPlay(); earAudioStatus("Stopped · your answer choices are unchanged", "stopped"); };
    $("btnEarHint").onclick = hintColour;
    $("btnEarCheck").onclick = checkColourGuess;
    $("btnEarMapNew").onclick = newEarMap;
    $("btnEarMapReplay").onclick = () => { if (state.ear.map.answer) playEarMapPrompt(); else newEarMap(); };
    $("btnEarMapStop").onclick = () => { stopPlay(); earAudioStatus("Stopped · your map choices are unchanged", "stopped"); };
    $("btnEarMapHint").onclick = hintEarMap;
    $("btnEarMapCheck").onclick = checkEarMap;
    document.querySelectorAll("[data-ear-drill]").forEach((button) =>
      button.onclick = () => setEarDrill(button.getAttribute("data-ear-drill")));
    document.querySelectorAll("[data-guess]").forEach((b) =>
      b.onclick = () => selectColourGuess(b.getAttribute("data-guess")));

    const drawer = $("settingsDrawer");
    if (drawer && $("drawerClose")) {
      $("drawerClose").onclick = () => { drawer.open = false; };
      document.addEventListener("keydown", (e) => { if (e.key === "Escape" && drawer.open) drawer.open = false; });
      document.addEventListener("click", (e) => { if (drawer.open && !drawer.contains(e.target)) drawer.open = false; });
    }
    if ($("navMore")) {
      $("navMore").onclick = () => {
        const open = document.querySelector(".app-nav").classList.toggle("nav-open");
        $("navMore").setAttribute("aria-expanded", String(open));
      };
      document.querySelectorAll("#navSecondary [data-nav]").forEach((button) =>
        button.addEventListener("click", () => {
          document.querySelector(".app-nav").classList.remove("nav-open");
          $("navMore").setAttribute("aria-expanded", "false");
        }));
    }
    document.addEventListener("keydown", async (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        const voice = state.view === "picking" ? pickingReferenceVoice() : chordReferenceVoice();
        if (!await readyPracticeAudio(voice)) return;
        if (state.view === "ear") state.ear.drill === "map" ? playEarMapPrompt() : (state.ear.answer ? playEarPrompt() : newEarQuestion());
        else if (state.view === "melody") state.melody.prompt ? playMelodyPrompt(false) : newMelodyQuestion();
        else if (state.view === "chordmap") auditionChordMap("strum");
        else if (state.view === "picking") togglePlay();
        else if (state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section)) $("btnLabPlay").click();
        else if (state.view !== "styles" && state.view !== "video" && state.view !== "examples" && state.view !== "analyze" && state.view !== "concepts" && state.view !== "coach" && state.view !== "today" && state.view !== "progress") togglePlay();
      }
      else if (e.code === "ArrowRight" && state.view === "triads") { e.preventDefault(); stepTriad(1); }
      else if (e.code === "ArrowLeft" && state.view === "triads") { e.preventDefault(); stepTriad(-1); }
      else if (e.code === "ArrowRight") { e.preventDefault(); state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section) ? (state.lab.drill === "cell" ? stepCell(1) : shiftPosition(1)) : $("btnNext").click(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section) ? (state.lab.drill === "cell" ? stepCell(-1) : shiftPosition(-1)) : $("btnPrev").click(); }
      else if (e.key === "1") setView("today");
      else if (e.key === "2") setView("ear");
      else if (e.key === "3") setView("melody");
      else if (e.key === "4") setView("cycle");
      else if (e.key === "5") setView("solo");
      else if (e.key === "6") setView("chordmap");
      else if (e.key === "7") setView("analyze");
      else if (e.key === "8") setView("styles");
      else if (e.key === "9") setView("coach");
      else if (e.key === "0") setView("progress");
      else if (e.key.toLowerCase() === "r" && state.view === "solo" && state.solo.section === "cell") $("btnReveal").click();
    });
  }

  function rerender() {
    if (state.view === "cycle") renderCycle();
    else if (state.view === "prog") renderProg();
    else if (state.view === "chordmap") renderChordMap();
    else if (state.view === "solo") { renderSoloMapControls(); renderSoloSection(); }
    else if (state.view === "picking") renderPickingLab();
    else if (state.view === "triads") { syncTriadControls(); renderTriads(); }
    else if (state.view === "ear") setEarDrill(state.ear.drill);
    else if (state.view === "styles") renderStyles();
    else if (state.view === "examples") renderTacticalExamples();
    else if (state.view === "analyze") renderAnalyzer();
    else if (state.view === "concepts") renderConcepts();
    else if (state.view === "coach") C.render();
    else if (state.view === "today") renderToday();
    else if (state.view === "progress") renderProgress();
    renderPageGuide();
  }

  function showTestBadge() {
    const suites = [T.selfTest(), HJ.selfTest(), PP.selfTest(), M.selfTest(), CM.selfTest(), CP.selfTest(), PG.selfTest(), MH.selfTest(), PL.selfTest(), E.selfTest(), S.selfTest(), A.selfTest(), U.selfTest(), Q.selfTest(), R.selfTest(), V.selfTest(), C.selfTest(), P.selfTest(), BK.selfTest(), PK.selfTest(), TK.selfTest(), TE.selfTest(), TR.selfTest(), GV.selfTest(), AU.selfTest()];
    const all = suites.reduce((a, s) => a.concat(s.results), []);
    const ok = suites.every((s) => s.ok);
    const nPass = all.filter((x) => x.pass).length;
    const el = $("testBadge");
    el.textContent = ok ? `✓ ${nPass}/${all.length} theory tests passing` : `✗ theory tests FAILED (${nPass}/${all.length})`;
    el.className = "test-badge " + (ok ? "ok" : "fail");
    if (!ok) console.error("Failures:", all.filter((x) => !x.pass));
  }

  async function showReleaseIdentity() {
    try {
      const response = await fetch("/api/release", { cache: "no-store" });
      if (!response.ok) return;
      const release = await response.json();
      const identity = [release.environment, release.branch, release.commit ? release.commit.slice(0, 8) : null].filter(Boolean).join(" · ");
      $("testBadge").title = `App v${release.appVersion}${identity ? ` · ${identity}` : ""}`;
      $("testBadge").setAttribute("data-release", release.appVersion);
    } catch { /* static/offline use has no release endpoint */ }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const player = PP.bootstrap();
    applyPlayerProfile(player);
    loadUiPreferences();
    document.addEventListener("dromos:audio-state", (event) => updateAudioReadyStatus(event.detail));
    wire();
    syncPersistentControls();
    renderPlayerProfiles(false);
    showTestBadge();
    showReleaseIdentity();
    updateAudioReadyStatus(AU.audioStatus());
    $("bpm").value = state.bpm; $("bpmVal").textContent = state.bpm;
    C.mount({ context: coachContext, onAction: useCoachAction, profileId: player.id });
    setView(player.preferences.view);
  });
})();
