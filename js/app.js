/* app.js — views, wiring, animation, playback sync, shortcuts.
 * Implements FR-04..07, FR-11, FR-12, FR-15. See docs/REQUIREMENTS.md.
 */
(function () {
  "use strict";
  const T = window.Theory, FB = window.Fretboard, AU = window.AudioEngine, M = window.Modes, S = window.StyleLibrary, A = window.AnalysisEngine,
    U = window.StudyLibrary, Q = window.MusicXmlImport, R = window.ResourceLibrary, V = window.VideoStudy, C = window.PracticeCoach, GV = window.GuitarVoicings, E = window.EarDrills,
    PP = window.PlayerProfiles, HJ = window.HarmonyJourney;

  const cycle = T.buildCycle();
  const N = cycle.length;

  const state = {
    view: "cycle",             // cycle | prog | ear | triads | solo | styles | video | analyze | concepts | coach
    // --- cycle view ---
    index: 0,
    cycleMode: "pivot",        // the Changes Gym; "full"/"iiVI" survive only as legacy preference values
    // Changes Gym settings: how many keys the wheel chains, the whole-note
    // skeleton drill, and the unmetered taximi bridge between keys.
    gym: { keys: 6, skeleton: false, bridging: false, bridgeTimer: null },
    cycleComping: { focus: "hear", step: 0, kind: "full", voicingIndex: 0, stringSet: null, zone: "mid" },
    // --- progression view ---
    tonic: "D",
    modeId: "major",
    progId: "ii-V-I",
    progStep: 0,
    scaleOverlay: false,
    // --- ear trainer ---
    ear: {
      drill: "colour", tonic: "D", answer: null, guess: null, hintLevel: 0, score: 0, total: 0, streak: 0, best: 0, locked: false,
      map: { answer: null, homePreset: "D", keyOptions: [], keyGuess: null, familyGuess: null, progressionGuess: null, hintLevel: 0, locked: false, score: 0, total: 0, streak: 0, best: 0 }
    },
    // --- triads ---
    triads: { step: 0, stringSet: null, zone: "mid", showAll: true },
    // --- solo lab ---
    solo: { section: "road", focus: "sweet", lens: "full", oneCourse: false, phraseId: "ladder", routeId: "sweet-lean", matrixBeat: 0, matrixPlan: [],
      // visual layers on the Changes map: the scale road and the targets are
      // meant to be seen TOGETHER, so both default on.
      layers: { scale: true, pentatonic: false, triads: true, next: true } },
    // --- foundation and Greek styles ---
    styles: { section: "foundation", styleId: "zeibekiko" },
    // --- transparent analysis ---
    analysis: { tonic: "D", modeId: "minor", selected: 0, studyId: null, importStatus: "" },
    // --- scale lab ---
    lab: {
      drill: "path",           // path | phrase | cell
      layout: "3nps", position: 5, startDegree: 1, startString: 0,
      firstStroke: "down", updown: true, pathIndex: null,
      cellIdx: 0, audiate: true, revealed: false
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
    // chord reference voice: "clean" (guitar) | "piano" | "auto" (match instrument)
    chordVoice: "clean",
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
      if (["clean", "piano", "auto"].includes(raw.chordVoice)) state.chordVoice = raw.chordVoice;
      if (typeof raw.pickupV2 === "boolean") state.pickupV2 = raw.pickupV2;
      if ([1, 3, 6].includes(raw.gymKeys)) state.gym.keys = raw.gymKeys;
      if (typeof raw.gymSkeleton === "boolean") state.gym.skeleton = raw.gymSkeleton;
    } catch { /* first run or blocked storage */ }
  }
  function saveUiPreferences() {
    try { localStorage.setItem(UI_PREFS_KEY, JSON.stringify({ chordVoice: state.chordVoice, pickupV2: state.pickupV2, gymKeys: state.gym.keys, gymSkeleton: state.gym.skeleton })); } catch { /* private mode */ }
  }
  // "clean" is a warm plucked guitar reference; "piano" is a clean additive
  // piano; "auto" matches the selected instrument (bouzouki/laouto/guitar).
  function chordReferenceVoice() {
    return state.chordVoice === "piano" ? "piano" : state.chordVoice === "auto" ? undefined : "guitar";
  }
  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));

  const PERSISTED_VIEWS = ["cycle", "prog", "ear", "triads", "solo", "styles", "video", "analyze", "concepts", "coach"];

  function stablePreferences() {
    return {
      tuningId: window.Tuning.currentId(), view: PERSISTED_VIEWS.includes(state.view) ? state.view : "cycle", tonic: state.tonic,
      modeId: state.modeId, progressionId: state.progId, bpm: state.bpm,
      cycleMode: state.cycleMode, cycleZone: state.cycleComping.zone,
      triadZone: state.triads.zone, labelMode: state.labelMode,
      lefty: state.lefty, loop: state.loop
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
      <div class="player-panel"><div class="player-panel-head"><b>Player profiles · this device</b><span>Separate instrument settings, ear scores, and coach history. These are local profiles, not password-protected accounts.</span></div>
      <div class="player-list">${profiles.map((profile) => `<button class="player-choice${profile.id === active.id ? " active" : ""}" data-player-id="${profile.id}"><b>${escapeHtml(profile.displayName)}</b><span>${escapeHtml(instrumentShortName(profile.preferences.tuningId))} · ${profile.progress.earColour.correct + profile.progress.earMap.correct}/${profile.progress.earColour.attempts + profile.progress.earMap.attempts} ear checks</span><i>${profile.id === active.id ? "Active" : "Switch"}</i></button>`).join("")}</div>
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
    document.querySelectorAll("[data-mode]").forEach((button) => button.classList.toggle("active", button.getAttribute("data-mode") === state.cycleMode));
    syncHarmonyTabs();
  }

  function switchPlayer(profileId) {
    stopPlay();
    const profile = PP.switchTo(profileId);
    if (!profile) return;
    applyPlayerProfile(profile);
    state.position = null; state.progStep = 0; state.cycleComping.step = 0;
    syncPersistentControls(); renderPlayerProfiles(false);
    if (C && C.switchProfile) C.switchProfile(profile.id);
    setView(profile.preferences.view);
  }

  // ====================== primary navigation model ======================
  // Eight destinations; implementation-level views hang underneath them.
  const NAV_DEFAULT_VIEW = { today: "today", hear: "ear", harmony: "cycle", solo: "solo", repertoire: "analyze", learn: "styles", coach: "coach", progress: "progress" };
  const VIEW_NAV = { today: "today", ear: "hear", cycle: "harmony", prog: "harmony", triads: "harmony", solo: "solo", analyze: "repertoire", styles: "learn", video: "learn", concepts: "learn", coach: "coach", progress: "progress" };
  const NAV_TITLES = { today: "Today", hear: "Hear", harmony: "Harmony", solo: "Solo", repertoire: "Repertoire", learn: "Learn", coach: "Coach", progress: "Progress" };

  // One sentence per workspace answering "what is this FOR" — the purposes the
  // pedagogy research settled on, in the player's language.
  const MODE_PURPOSE = {
    cycle: "Land the 3rd of every chord as the keys fall. This is the muscle that keeps your solo inside the song on stage.",
    prog: "Real Greek progressions for each dromos — Piraeus modal loops first, the Westernized laiko layer second. Drills end here.",
    triads: "The accompanist's seat: keep the changes close with the nearest shape when the harmony moves.",
    solo: "One neck, three layers: the road, the frame inside it, and the little cells that hit every chord's 3rd."
  };

  function renderModePurpose() {
    const el = $("modePurpose");
    if (!el) return;
    const copy = MODE_PURPOSE[state.view];
    el.textContent = copy || "";
    el.classList.toggle("hidden", !copy || VIEW_NAV[state.view] !== "harmony" && state.view !== "solo");
  }

  function syncHarmonyTabs() {
    document.querySelectorAll("[data-harmony-mode]").forEach((button) =>
      button.classList.toggle("active", state.view === "cycle" && button.getAttribute("data-harmony-mode") === state.cycleMode));
    renderModePurpose();
  }

  const PRACTICE_STEPS = [
    { view: "cycle", label: "1 · Hear", detail: "Follow the ii–V–I pivot until the next key feels inevitable." },
    { view: "prog", label: "2 · Map", detail: "Name the dromos, progression, and chord function before you play." },
    { view: "ear", label: "3 · Recall", detail: "Hear a colour or a full cadence, then name its home and change boxes." },
    { view: "triads", label: "4 · Comp", detail: "Keep the changes close with three-note shapes and clear inversions." },
    { view: "solo", label: "5 · Solo", detail: "Use a pentatonic frame, then land on chord tones at each change." },
    { view: "styles", label: "6 · Pulse", detail: "Fit the phrase to a real Greek pulse without confusing rhythm and dromos." },
    { view: "video", label: "7 · Study", detail: "Watch one legal public lesson in a short A–B loop, then explain its map." }
  ];

  function renderPracticePath() {
    $("practicePath").innerHTML = PRACTICE_STEPS.map((step) =>
      `<button class="practice-step${step.view === state.view ? " active" : ""}" data-practice-view="${step.view}">${step.label}</button>`
    ).join("");
    $("practicePath").querySelectorAll("[data-practice-view]").forEach((button) => {
      button.onclick = () => setView(button.getAttribute("data-practice-view"));
    });
  }

  const PAGE_GUIDES = {
    cycle: { purpose: "Hear harmonic gravity", title: "Train the ii–V–I pivot before you touch a shape.", steps: ["Press Play and follow the highlighted chord.", "Say its function: ii, V, or I.", "Notice when the old I becomes the next ii."] },
    prog: { purpose: "Name the map", title: "Choose a dromos, home, and progression—then hear each box clearly.", steps: ["Pick the dromos and tonic.", "Choose one progression; its Roman numerals are the map.", "Step each chord and say its function before you play it."] },
    ear: { purpose: "Recall without the neck", title: "First identify colour; then identify the home and the change boxes by ear.", steps: ["Use Dromos colour to isolate the 2nd and 3rd.", "Use Key & changes to choose both the home and progression.", "After checking, open Song Map and find the same boxes."] },
    triads: { purpose: "Comp with voice leading", title: "See the nearest useful triad instead of hunting for a large chord.", steps: ["Choose a Song Map progression.", "Follow the highlighted low-travel triad.", "Change inversion only when it serves the next chord."] },
    solo: { purpose: "Make a line explain the song", title: "Road → shape → numbers → change → ear is the soloing order.", steps: ["Start with the full Solo Road, not a random box.", "Choose a shape/position, then speak a number contour.", "Land the final note on the current chord target."] },
    styles: { purpose: "Put the map in time", title: "A rhythm is a place for the phrase—not a substitute for the dromos.", steps: ["Choose the pulse family.", "Feel its grouped beats before playing notes.", "Return to Song Map to choose the harmonic/melodic material."] },
    video: { purpose: "Study a real motion deliberately", title: "Loop a public lesson briefly, then turn observation into understanding.", steps: ["Set A–B around one small physical/musical event.", "Slow it down and watch only one hand at a time.", "Name the home, target, and function in Song Map before borrowing the idea."] },
    analyze: { purpose: "Explain a part you own", title: "Turn written chord symbols and notes into a transparent practice decision.", steps: ["Enter your own chord map or MusicXML score.", "Read the strong targets and possible harmonic readings.", "Take one recommendation to Triads or Solo Road."] },
    concepts: { purpose: "Keep causes separate", title: "Solve the right musical problem: time, map, route, or touch.", steps: ["Read the answer-first pyramid.", "Choose the one layer that is actually weak.", "Use its small drill; do not solve every problem with another scale."] },
    coach: { purpose: "Ask for a precise next step", title: "The coach knows your selected map and can open one specific exercise.", steps: ["Ask a concrete question about a chord, phrase, or practice obstacle.", "Use the returned action only if it fits what you hear.", "The coach advises; your ear and score remain the source of truth."] },
    today: { purpose: "Start where it matters", title: "One session, in order: hear it, name it, then find it on the neck.", steps: ["Pick the first step you have not done today.", "Play each phrase as ii · V · I · I, then let it reset.", "Stop while your ear is still ahead of your hands."] },
    progress: { purpose: "Honest local progress", title: "Scores, streaks, and players live only on this device.", steps: ["Check the colour and map percentages, not just the streak.", "Switch players from the top bar; each keeps separate settings.", "A falling percentage means slow the tempo, not add more theory."] }
  };

  function renderPageGuide() {
    const guide = state.view === "cycle" && state.cycleComping.focus === "chords"
      ? { purpose: "Comp with usable shapes", title: "Choose the smallest chord shape that makes the function clear.", steps: ["Set dromos and progression before choosing a grip.", "Try Full 6 for open/barre vocabulary, then Triad 3 or Compact 4 for moving changes.", "Keep a common tone when possible; listen for the 3rd and 7th when the harmony changes."] }
      : PAGE_GUIDES[state.view] || PAGE_GUIDES.cycle;
    const current = state.view === "solo" ? `Current road: ${M.MODES[state.modeId].name} on ${state.tonic} · ${currentProgression().prog.label}.` : "";
    $("pageGuide").innerHTML = `<details><summary><span>${guide.purpose}</span><b>${guide.title}</b></summary>
      <ol>${guide.steps.map((step) => `<li>${step}</li>`).join("")}</ol>${current ? `<p>${current}</p>` : ""}</details>`;
  }

  function renderCoachCue() {
    if (state.view === "today" || state.view === "progress") { $("coachCue").innerHTML = ""; return; }
    const step = PRACTICE_STEPS.find((item) => item.view === state.view);
    const specialStep = state.view === "styles" || state.view === "video";
    if (!step && !specialStep) return;
    let detail = step ? step.detail : state.view === "video" ? "Loop only enough material to identify the destination; then put the video down and make the idea yours." : "Build the general language first, then place it inside a real Greek pulse without confusing style and dromos.";
    if (state.view === "solo" && state.solo.section === "road") {
      detail = "See the whole road first: lower tetrachord, upper tetrachord, then the tonic that joins them.";
    } else if (state.view === "solo" && state.solo.section === "path") {
      detail = "Build clean alternate picking first; change the string break before you raise the tempo.";
    } else if (state.view === "solo" && state.solo.section === "phrase") {
      detail = "Say the numbers, sing the contour, then repeat it with one rhythm before you add decoration.";
    } else if (state.view === "solo" && state.solo.section === "cell") {
      detail = "Pre-hear the final note, leave space for it, then reveal and check your ear.";
    }
    $("coachCue").innerHTML = `<span>${step ? step.label : state.view === "video" ? "Video study" : "Style lab"}</span><b>${detail}</b>`;
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
    if (state.view === "styles") renderStyles();
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
    // on-ramp); keys=3/6 chain groups. The journey uses the full-cycle order —
    // at a 3-key wrap the guide previews the 4th key while the audio loops,
    // an accepted edge over duplicating the journey model.
    const journey = HJ.buildJourney({ kind: "cycle", cycle, mode: state.gym.keys === 1 ? "iiVI" : "full", index: state.index, loop: state.loop, holdI: state.holdI });
    journey.label = "Changes Gym";
    return journey;
  }

  // The gym's playable sequence: keys*3 chords starting at the current key
  // group, wrapping around the six-key wheel.
  function gymSequence(idx) {
    const start = Math.floor((((idx % N) + N) % N) / 3) * 3;
    return Array.from({ length: Math.min(state.gym.keys, 6) * 3 }, (_, n) => (start + n) % N);
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
    if (kind === "full") return GV ? GV.fullVoicings(chord) : [];
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
    const { chords, prog } = currentProgression();
    c.step = Math.min(c.step, chords.length - 1);
    const chord = chords[c.step];
    const voicings = cycleChordVoicings(chord);
    c.voicingIndex = Math.min(c.voicingIndex, Math.max(0, voicings.length - 1));
    const kindCopy = {
      full: ["Full 6", "open + E/A-family"],
      triad: ["Triad 3", "nearest 3-string forms"],
      four: ["Compact 4", "root + colour + guide"]
    };
    root.innerHTML = `
      <p class="cycle-voicing-help"><b>Practical guitar chords:</b> choose the actual dromos progression, then select a full/open form, a triad, or a compact four-note voicing. The selected form stays at fret 15 or below.</p>
      <span class="panel-label">Dromos · ${mode.name} ${mode.greek}</span>
      <div class="cycle-mode-grid">${M.MODE_ORDER.map((modeId) => `<button data-cycle-chord-mode="${modeId}" class="${modeId === state.modeId ? "active" : ""}">${M.MODES[modeId].name}</button>`).join("")}</div>
      <div class="cycle-progression-list">${progressions.map((item) => `<button data-cycle-prog="${item.id}" class="${item.id === prog.id ? "active" : ""}"><b>${item.label}</b><span>${item.tag}</span></button>`).join("")}</div>
      <span class="panel-label">Voicing weight</span>
      <div class="cycle-voice-kinds">${Object.entries(kindCopy).map(([id, [label, detail]]) => `<button data-cycle-voice-kind="${id}" class="${id === c.kind ? "active" : ""}"><b>${label}</b><span>${detail}</span></button>`).join("")}</div>
      <div class="cycle-chord-steps">${chords.map((item, index) => `<button data-cycle-chord-step="${index}" class="${index === c.step ? "active" : ""}"><i>${item.degreeLabel}</i><b>${item.symbol}</b></button>`).join("<span class=\"pchip-arrow\">→</span>")}</div>
      ${voicings.length ? `<div class="cycle-voicing-options">${voicings.map((item, index) => `<button data-cycle-voicing="${index}" class="${index === c.voicingIndex ? "active" : ""}"><b>${item.label}</b><span>${item.family} · frets ${item.lowFret}–${item.highFret || Math.max(...item.placements.map((placement) => placement.fret))}</span></button>`).join("")}</div>` : `<p class="cycle-voicing-help"><b>No six-string full form is defined for ${chord.symbol}.</b> Use Compact 4: it keeps the chord's defining tones without inventing an awkward barre.</p>`}
      <p class="cycle-voicing-help">Hear/think: roots locate the chord, 3rds name major or minor colour, and 7ths carry dominant pull. Prefer the smallest useful move; a full shape is an option, not a requirement.</p>`;
    root.querySelectorAll("[data-cycle-chord-mode]").forEach((button) => button.onclick = () => {
      stopPlay(); state.modeId = button.getAttribute("data-cycle-chord-mode"); state.progId = M.PROGRESSIONS[state.modeId][0].id;
      state.progStep = 0; c.step = 0; c.voicingIndex = 0; renderCycle();
    });
    root.querySelectorAll("[data-cycle-prog]").forEach((button) => button.onclick = () => {
      stopPlay(); state.progId = button.getAttribute("data-cycle-prog"); state.progStep = 0; c.step = 0; c.voicingIndex = 0; renderCycle();
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
    return shape.placements.map((placement) => ({
      midi: placement.midi,
      freq: 440 * Math.pow(2, (placement.midi - 69) / 12)
    }));
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
    <div class="ro-foot"><b>Think the full chord ${cur.chord.symbol}; play its triad skeleton.</b>${chordColour ? ` Hear ${chordColour.name} (${chordColour.roleLabel}) as the omitted colour tone.` : ""} Keep the top line singable; the next shape was chosen for the whole cycle, not just this one change.</div>`;

    renderKeymap(cur.chord);
    renderChangeGuide(journey, cur, nextShape);
    if (state.cycleMode === "pivot") {
      // In the pivot drill the modulation IS the lesson, so the reinterpretation
      // is spelled out: play ii-V-I-I, then the old I becomes the new ii.
      const pair = sequenceFor("pivot", state.index);
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
    const { chords } = currentProgression();
    const c = state.cycleComping;
    const chord = chords[Math.min(c.step, chords.length - 1)];
    const journey = songJourney(chords, c.step);
    const voicings = cycleChordVoicings(chord);
    const voicing = voicings[c.voicingIndex];
    const nextVoicings = journey.next ? cycleChordVoicings(journey.next.chord) : [];
    const nextVoicing = nextVoicings.length ? nextVoicings[Math.min(c.voicingIndex, nextVoicings.length - 1)] : null;
    if (!voicing) {
      FB.render(svg(), { labelMode: state.labelMode, lefty: state.lefty });
      $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${chord.degreeLabel}</span><span class="ro-symbol">${chord.symbol}</span></div><div class="ro-foot">Full/open forms are a guitar-specific vocabulary. Switch to guitar for six-string forms, or choose Compact 4 for a playable chord-tone set on this tuning.</div>`;
      renderChangeGuide(journey, null, nextVoicing);
      return;
    }
    FB.render(svg(), { grip: { placements: voicing.placements }, nextGrip: nextVoicing ? { placements: nextVoicing.placements } : null, labelMode: state.labelMode, lefty: state.lefty, flavourPcs: M.flavourPcs(state.tonic, state.modeId) });
    svg().setAttribute("aria-label", `guitar ${voicing.label} for ${chord.symbol}`);
    const tones = voicing.placements.slice().reverse().map((placement) => `<div class="note-chip held" data-group="${placement.note.colorGroup}"><span class="chip-role">${placement.note.roleLabel}</span><span class="chip-name">${placement.note.name}</span><span class="chip-tag">fret ${placement.fret}</span></div>`).join("");
    $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${chord.degreeLabel}</span><span class="ro-symbol">${chord.symbol}</span><span class="ro-key">${voicing.label}</span></div><div class="tri-tags"><span class="tri-set">${voicing.family}</span><span class="tri-fret">frets ${voicing.lowFret}–${voicing.highFret || Math.max(...voicing.placements.map((placement) => placement.fret))}</span></div><div class="ro-notes">${tones}</div><div class="ro-foot">Play the lowest note as a bass cue, then listen for the 3rd${chord.notes.some((note) => note.role === "7" || note.role === "b7") ? " and 7th" : ""}. On the next chord, keep common tones and move the remaining voice by the shortest musical distance.</div>`;
    renderChangeGuide(journey, voicing, nextVoicing);
  }

  function renderCycle() {
    const pivotPair = sequenceFor("pivot", state.index);
    $("pivotPairNav").classList.toggle("hidden", state.cycleMode !== "pivot");
    if (state.cycleMode === "pivot") {
      const oldI = cycle[pivotPair[0]], newIi = cycle[pivotPair[1]];
      $("pivotPairLabel").innerHTML = `<b>${oldI.symbol}</b> I of ${oldI.key} <span>→</span> <b>${newIi.symbol}</b> ii of ${newIi.key}`;
    }
    $("btnPrev").disabled = false;
    $("btnNext").disabled = false;
    $("keymapWrap").classList.toggle("hidden", state.cycleComping.focus === "chords");
    document.querySelectorAll("[data-cycle-focus]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-cycle-focus") === state.cycleComping.focus));
    syncGymControls();
    syncCyclePathControls();
    renderCycleCompingControls();
    if (state.cycleComping.focus === "chords") { $("pivotBanner").classList.remove("show"); renderCycleComping(); return; }
    renderCycleTriadRoute();
  }

  function renderKeymap(cur) {
    const keys = ["C", "B♭", "A♭", "G♭", "E", "D"];
    $("keymap").innerHTML = keys.map((k) =>
      `<span class="key-node${k === cur.key ? " active" : ""}">${k}</span>`
    ).join('<span class="key-arrow">→</span>');
  }

  function stepCycle(delta) {
    const seq = gymSequence(state.index);
    let pos = seq.indexOf(state.index); if (pos < 0) pos = 0;
    setCycleIndex(seq[(pos + delta + seq.length) % seq.length]);
  }
  function stepCycleComping(delta) {
    const { chords } = currentProgression();
    const c = state.cycleComping;
    c.step = (c.step + delta + chords.length) % chords.length;
    c.voicingIndex = 0;
    renderCycle();
  }
  function setCycleIndex(i) { state.index = ((i % N) + N) % N; renderCycle(); }

  function stepPivotPair(delta) {
    const pair = sequenceFor("pivot", state.index);
    state.index = (pair[0] + delta * 3 + N) % N;
    renderCycle();
  }

  // ========================= PROGRESSION VIEW ============================
  function currentProgression() {
    return M.buildProgression(state.tonic, state.modeId, state.progId);
  }

  function renderProg() {
    const { prog, chords } = currentProgression();
    const idx = Math.min(state.progStep, chords.length - 1);
    const cur = chords[idx];
    const prev = chords[(idx - 1 + chords.length) % chords.length];
    const journey = songJourney(chords, idx);
    const nextChord = journey.next ? journey.next.chord : null;
    const nextGrip = nextChord ? FB.findGrip(nextChord.notes, state.position) : null;
    const moveClass = cur.notes.map((n) =>
      prev.notes.some((p) => p.pc === n.pc) ? "held" : "moved");

    const scale = M.scaleOf(state.tonic, state.modeId);
    drawChord(cur.notes, moveClass, {
      nextGrip,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      scaleNotes: state.scaleOverlay ? scale : null
    });

    const mode = M.MODES[state.modeId];
    renderChordReadout(cur.symbol, cur.degreeLabel, mode.name + " on " + state.tonic,
      cur.notes, moveClass, prog.why);

    // progression strip — one chip per bar, so a held tonic shows its second
    // bar explicitly (ii · V · I · I) instead of hiding it in the audio.
    const nextIndex = journey.next ? journey.next.sourceIndex : -1;
    $("progStrip").innerHTML = chords.map((c, i) => {
      const main = `<button class="pchip${i < idx ? " played" : ""}${i === idx ? " active" : ""}${i === nextIndex ? " is-next" : ""}" data-step="${i}">
         <span class="pchip-deg">${c.degreeLabel}</span>
         <span class="pchip-sym">${c.symbol}</span></button>`;
      const held = barsFor(c) > 1 ? `<button class="pchip pchip-held${i === idx ? " active" : ""}" data-step="${i}" data-held-for="${i}" aria-label="${c.symbol} holds for a second bar">
         <span class="pchip-deg">${c.degreeLabel}</span>
         <span class="pchip-sym">${c.symbol}</span>
         <span class="pchip-hold">hold</span></button>` : "";
      return main + held;
    }).join('<span class="pchip-arrow">→</span>');
    $("progStrip").querySelectorAll("[data-step]").forEach((b) => {
      b.onclick = () => { state.progStep = +b.getAttribute("data-step"); renderProg(); auditionProg(); };
    });

    renderScaleStrip(scale, mode);
    renderChangeGuide(journey, FB.findGrip(cur.notes, state.position), nextGrip);
    pulseMoved();
    $("pivotBanner").classList.remove("show");
  }

  function renderScaleStrip(scale, mode) {
    let html = `<div class="scale-head"><b>${mode.name}</b> <span class="greek">${mode.greek}</span>
      <span class="scale-blurb">${mode.blurb}</span></div><div class="scale-notes">`;
    scale.forEach((n) => {
      const cls = n.isTonic ? "tonic" : n.isFlavour ? "flavour" : "";
      html += `<span class="snote ${cls}"><b>${n.name}</b><i>${n.degree}</i></span>`;
    });
    html += `</div>`;
    // Small signature sets are a comparison aid, not a claim that every
    // modal/harmonic map is defined by its 2nd and 3rd alone. Harmonic minor
    // must expose its leading tone (7) to stay distinct from natural minor.
    html += `<div class="compare"><span class="cmp-label">signature tones separate these maps:</span>`;
    M.MODE_ORDER.forEach((id) => {
      const m = M.MODES[id];
      const s = M.scaleOf(state.tonic, id);
      const f = m.flavour.map((off) => s.find((x) => x.off === off));
      html += `<span class="cmp ${id === state.modeId ? "on" : ""}" data-jump="${id}">
        <b>${m.name}</b> ${f.map((x) => x ? x.name : "?").join(" ")} <i>(${m.signature})</i></span>`;
    });
    html += `</div>`;
    $("scaleStrip").innerHTML = html;
    $("scaleStrip").querySelectorAll("[data-jump]").forEach((el) => {
      el.onclick = () => selectMode(el.getAttribute("data-jump"));
    });
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
  }

  function syncProgControls() {
    document.querySelectorAll("[data-modeid]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-modeid") === state.modeId));
    const list = M.PROGRESSIONS[state.modeId];
    const groups = [];
    list.forEach((progression) => {
      const name = progression.group || "Core maps";
      let group = groups.find((item) => item.name === name);
      if (!group) { group = { name, items: [] }; groups.push(group); }
      group.items.push(progression);
    });
    $("progList").innerHTML = groups.map((group) => `<section class="progression-group">
      <h3>${group.name}</h3>
      ${group.items.map((progression) => {
        const symbols = M.buildProgression(state.tonic, state.modeId, progression.id).chords.map((chord) => chord.symbol).join(" → ");
        return `<button class="prog-item${progression.id === state.progId ? " active" : ""}" data-prog="${progression.id}">
          <span class="prog-function"><b>${progression.label}</b><i>${progression.tag}</i></span>
          <span class="prog-symbols">${symbols}</span>
          <span class="prog-why">${progression.why}</span></button>`;
      }).join("")}
    </section>`).join("");
    $("progList").querySelectorAll("[data-prog]").forEach((b) => {
      b.onclick = () => {
        stopPlay();
        state.progId = b.getAttribute("data-prog"); state.progStep = 0;
        persistPreferences();
        syncProgControls(); renderProg(); auditionProg();
      };
    });
  }

  function stepProg(delta) {
    const { chords } = currentProgression();
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

  function playEarTonic() {
    stopPlay();
    AU.playChord([earTonicNote()], "block", undefined, "guitar");
  }

  function renderEarReference() {
    const select = $("earTonicSel");
    if (!select) return;
    select.innerHTML = M.TONICS.map((tonic) => `<option value="${tonic}"${tonic === state.ear.tonic ? " selected" : ""}>${tonic}</option>`).join("");
    $("btnEarTonic").textContent = `♪ Hear ${state.ear.tonic}`;
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
    $("earFeedback").className = "ear-feedback";
    $("earFeedback").textContent = `Reference tonic: ${state.ear.tonic}. Listen to the chord cadence twice. Choose a map, ask for a hint if needed, then check.`;
    renderColourChoices();
    renderEarReference();
    playEarPrompt();
    renderEarScore();
  }

  function playEarPrompt() {
    stopPlay();
    const id = state.ear.answer;
    const prog = M.PROGRESSIONS[id][0];
    const { chords } = M.buildProgression(state.ear.tonic, id, prog.id);
    AU.playProgressionPrompt(chords, state.bpm);
  }

  function selectColourGuess(guess) {
    if (state.ear.locked) return;
    state.ear.guess = guess;
    const label = E ? E.choicePrompt(guess) : `Test ${M.MODES[guess].name} against the home.`;
    $("earFeedback").className = "ear-feedback";
    $("earFeedback").textContent = label + " When you are ready, use Check answer.";
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
      if (!state.ear.locked) $("earFeedback").textContent = "Choose the map you hear first. Selection is reversible until you press Check answer.";
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
    const fb = $("earFeedback");
    fb.className = "ear-feedback " + (correct ? "ok" : "no");
    fb.innerHTML = (correct ? "✓ Correct — " : "✗ It was ") +
      `<b>${detail.label}</b> (${detail.category || "map"}). Signature: <b>${detail.signature}</b>. Scale: <b>${detail.scale}</b>.`;
    renderEarScore();
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

  function newEarMap() {
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
    $("earMapFeedback").className = "ear-feedback";
    $("earMapFeedback").textContent = map.homePreset === "random"
      ? "Listen twice. Choose the home, then the harmonic/dromos family and its change boxes."
      : `Training home: ${tonic}. Listen twice, then identify the harmonic/dromos family and its change boxes.`;
    renderEarMap();
    playEarMapPrompt();
  }

  function playEarMapPrompt() {
    stopPlay();
    const answer = state.ear.map.answer;
    if (!answer) return;
    const { chords } = M.buildProgression(answer.tonic, answer.modeId, answer.progressionId);
    AU.playProgressionPrompt(chords, state.bpm);
  }

  function playEarMapHome() {
    stopPlay();
    const answer = state.ear.map.answer;
    if (!answer || state.ear.map.homePreset === "random") return;
    const chord = E ? E.homeChord(answer) : M.buildProgression(answer.tonic, answer.modeId, answer.progressionId).chords.slice(-1)[0];
    AU.playChord(chord.notes, "block", undefined, "guitar");
  }

  function renderEarMap() {
    const map = state.ear.map;
    if (!map.answer) return;
    const homeSelect = $("earMapHomeSel");
    homeSelect.innerHTML = `<option value="random">Random — test the home</option>` + M.TONICS.map((tonic) => `<option value="${tonic}">${tonic} — known home</option>`).join("");
    homeSelect.value = map.homePreset;
    $("btnEarMapHome").disabled = map.homePreset === "random";
    $("btnEarMapHome").textContent = map.homePreset === "random" ? "Home hidden · train blind" : `♪ Hear ${map.answer.tonic} home chord`;
    $("earKeyChoices").innerHTML = map.homePreset === "random"
      ? map.keyOptions.map((tonic) => `<button data-ear-key="${tonic}"${map.keyGuess === tonic ? " class=\"selected\"" : ""}>${tonic}</button>`).join("")
      : `<div class="ear-home-anchor"><b>${map.answer.tonic}</b><span>Known training home. Use ♪ Hear ${map.answer.tonic} if you need to reset your ear.</span></div>`;
    $("earFamilyChoices").innerHTML = (E ? E.families() : M.MODE_ORDER.map((id) => ({ id, label: M.MODES[id].name, signature: "signature tones" }))).map((item) =>
      `<button data-ear-family="${item.id}"${map.familyGuess === item.id ? " class=\"selected\"" : ""}${map.locked ? " disabled" : ""}><b>${item.label}</b><span>${item.signature}</span></button>`
    ).join("");
    const progressions = map.familyGuess ? (E ? E.progressions(map.familyGuess) : M.PROGRESSIONS[map.familyGuess]) : [];
    $("earProgressionChoices").innerHTML = progressions.length
      ? progressions.map((progression) => `<button data-ear-prog="${progression.id}"${map.progressionGuess === progression.id ? " class=\"selected\"" : ""}${map.locked ? " disabled" : ""}><b>${progression.label}</b><span>${progression.chords.map((chord) => M.DEGREE_LABEL[chord[0]]).join(" → ")}</span></button>`).join("")
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
    const chords = E ? detail.chords.map((symbol) => ({ symbol })) : M.buildProgression(map.answer.tonic, map.answer.modeId, map.answer.progressionId).chords;
    const feedback = $("earMapFeedback");
    feedback.className = "ear-feedback " + (correct ? "ok" : "no");
    feedback.innerHTML = (correct ? "✓ You heard the whole map. " : "✗ Check the map. ") +
      `Home/map: <b>${earMapLabel(map.answer)}</b> (${detail ? detail.category : "map"}). Scale: <b>${detail ? detail.scale : ""}</b>. Boxes: <b>${progression.label}</b> · ${chords.map((chord) => `<b>${chord.symbol}</b>`).join(" → ")}. ${detail ? detail.why : ""}`;
    renderEarMap(); renderEarScore();
  }

  function setEarDrill(drill) {
    state.ear.drill = drill;
    $("earColour").classList.toggle("hidden", drill !== "colour");
    $("earMap").classList.toggle("hidden", drill !== "map");
    document.querySelectorAll("[data-ear-drill]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-ear-drill") === drill));
    document.querySelector(".ear-reference").classList.toggle("hidden", drill !== "colour");
    renderEarReference();
    if (drill === "map" && !state.ear.map.answer) newEarMap();
    renderEarScore();
  }

  function renderEarScore() {
    const e = state.ear;
    const pct = e.total ? Math.round((e.score / e.total) * 100) : 0;
    const mpct = e.map.total ? Math.round((e.map.score / e.map.total) * 100) : 0;
    $("earScore").innerHTML =
      `<span>colour <b>${e.score}</b>/${e.total} <i>(${pct}%)</i></span>
       <span>map <b>${e.map.score}</b>/${e.map.total} <i>(${mpct}%)</i></span>
       <span>streak <b>${state.ear.drill === "map" ? e.map.streak : e.streak}</b></span>`;
  }

  // ============================ SCALE LAB ================================
  const P = window.Practice;

  function soloTargetLabel(notes) {
    return notes.map((note) => `${note.name} (${note.roleLabel})`).join(" · ");
  }

  function landingLensName(focus) {
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
    return focus === "third" ? phase : note.roleLabel;
  }

  function renderPathTargetRoute(cur, next, curTargets, nextTargets) {
    const focus = state.solo.focus;
    const route = P.melodicRoute(state.solo.routeId);
    const focusRoot = $("pathTargetFocus");
    const routeRoot = $("targetRouteGrid");
    const hintRoot = $("targetRouteHint");
    if (!focusRoot || !routeRoot || !hintRoot) return;

    focusRoot.innerHTML = [
      ["sweet", "Sweet 2→3", "the 2 leans into the chord's 3rd"],
      ["pedal", "One note", "a single note that fits every chord"],
      ["third", "Colour 3rd", "the chord's defining colour"],
      ["triad", "Triad", "R, 3/♭3, 5"],
      ["guide", "Guides", "3rd + 7th, or 3rd + root"]
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

  // ============================= TRIADS ==================================
  const TR = window.Triads;

  function spellPc(pc) {
    const scale = M.scaleOf(state.tonic, state.modeId);
    const hit = scale.find((n) => n.pc === pc);
    return hit ? hit.name : M.simplify(M.nameFor(0, pc));
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
      <div class="solo-map-head"><div><b>${mode.name} on ${state.tonic}</b><span>${mode.greek} · ${window.Tuning.current().name}</span></div>
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
      ${state.modeId === "ousak" ? '<p class="road-mobile-hint">Hollow dots sharpen on the way up. Ousak breathes.</p>' : ""}
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

  function soloTargets(chord, focus) {
    const third = chordTone(chord, "3") || chordTone(chord, "b3");
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
        const distance = Math.min(raw, 12 - raw);
        if (!distance || distance > 3) return;
        if (!best || distance < best.distance) best = { from, to, distance };
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
  }

  function renderSoloTimingMatrix(cur, next, curTargets, nextTargets) {
    const root = $("soloTimingMatrix");
    if (!root) return;
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

  // Layer chips live directly above the fretboard so the player can stack
  // the scale road, the pentatonic frame, triad shapes, and the now/next
  // landing targets without ever covering the neck.
  function renderSoloLayerChips() {
    const root = $("stageLayers");
    if (!root) return;
    if (state.view !== "solo" || state.solo.section !== "targets") { root.innerHTML = ""; return; }
    const layers = state.solo.layers;
    const chip = (id, on, swatch, label) => `<button data-solo-layer="${id}" class="layer-chip${on ? " on" : ""}" aria-pressed="${on}"><span class="layer-swatch ${swatch}"></span>${label}</button>`;
    root.innerHTML = `
      ${chip("scale", layers.scale, "lc-scale", "Scale road")}
      ${chip("pentatonic", layers.pentatonic, "lc-penta", "Pentatonic")}
      ${chip("triads", layers.triads, "lc-triad", "Triad shapes")}
      <span class="layer-chip on is-static"><span class="layer-swatch lc-now"></span>Now targets</span>
      ${chip("next", layers.next, "lc-next", "Next targets")}
      <span class="layer-note">now = terracotta ring · next = dashed turquoise</span>`;
    root.querySelectorAll("[data-solo-layer]").forEach((button) => {
      button.onclick = () => {
        const key = button.getAttribute("data-solo-layer");
        state.solo.layers[key] = !state.solo.layers[key];
        renderSolo();
      };
    });
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

  function renderSolo() {
    const { chords } = currentProgression();
    const idx = Math.min(state.progStep, chords.length - 1);
    const cur = chords[idx];
    const next = chords[(idx + 1) % chords.length];
    const focus = state.solo.focus;
    const curTargets = soloTargets(cur, focus);
    const nextTargets = soloTargets(next, focus);
    const targetNotes = curTargets.map((note) => Object.assign({}, note, {
      roleLabel: targetRoleLabel(note, "now", focus)
    })).concat(nextTargets.map((note) => Object.assign({}, note, {
      roleLabel: targetRoleLabel(note, "next", focus)
    })));
    const triadPath = TR.pathThrough(chords, { startFret: 5, nameFor: spellPc });
    const shape = triadPath[idx];
    const fallbackGrip = shape ? null : FB.findGrip(cur.notes, state.position);
    const activeGrip = shape ? { placements: shape.placements } : fallbackGrip;
    const triadId = TR.TRIAD_OF[cur.quality] || "maj";
    const allTriads = TR.allShapes(cur.rootPc, triadId, spellPc);
    // The view is deliberately whole-neck: the road should reveal the same
    // target in several registers instead of trapping an intermediate player
    // inside a single box.
    const overlayRange = { from: 0, to: FB.N_FRETS };
    const pentatonic = M.pentatonicOf(state.tonic, state.modeId);

    const layers = state.solo.layers;
    // The landing thread. Not every change has a stepwise lean (in D major the
    // sweet 2→3 is E→C♯, a minor 3rd), so the tracer connects the NEAREST pair
    // of now/next targets rather than a fixed pair, and stays silent when the
    // closest move is a leap. Nearest-tone connection is the whole lesson.
    const thread = soloLandingThread(curTargets, nextTargets);
    FB.render(svg(), {
      grip: activeGrip,
      otherShapes: state.solo.section === "targets" ? allTriads.filter(() => layers.triads) : [],
      pentatonicNotes: state.solo.section === "targets" && layers.pentatonic ? pentatonic : null,
      scaleNotes: state.solo.section === "targets" && layers.scale ? M.scaleOf(state.tonic, state.modeId) : null,
      targetNotes: state.solo.section === "targets" ? targetNotes : null,
      targetNowPcs: curTargets.map((note) => note.pc),
      targetNextPcs: layers.next ? nextTargets.map((note) => note.pc) : [],
      tracer: layers.next && thread ? { fromPc: thread.from.pc, toPc: thread.to.pc } : null,
      overlayRange,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      labelMode: state.labelMode,
      lefty: state.lefty
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " soloing map");
    renderSoloLayerChips();

    const frame = M.PENTATONIC[state.modeId];
    const targetLabel = soloTargetLabel;
    const hasSeventhGuide = curTargets.concat(nextTargets).some((note) => note.role === "7" || note.role === "b7");
    const guideInstruction = hasSeventhGuide
      ? "Connect the 3rd and 7th with the smallest move you can hear; the line should explain the harmony even without a chord."
      : "This change uses triads: hear the 3rd as the colour, then land on the root when you want the resolution to feel final.";
    const route = P.melodicRoute(state.solo.routeId);
    const focusSentence = focus === "triad"
      ? "The solid shape is the closest voice-led triad; its faint neighbours are every other practical inversion. The quieter dots are the pentatonic frame, and the rings are the current/next triad tones."
      : focus === "guide"
        ? "The solid shape is the closest voice-led triad; the rings narrow the next landing decision to the clearest guide relationship."
        : focus === "sweet"
          ? "The rings mark the 2nd and each chord's 3rd everywhere on the neck: sit on the 2, then let it fall or rise into the 3rd exactly when the harmony moves. That lean is where Greek melodies live."
          : focus === "pedal"
            ? "Every ring is the SAME note. Hold it through the whole progression and listen to the harmony re-name it under your finger; the last chord finally lets it rest."
            : "The solid shape is the closest voice-led triad; use its 3rd as the chord's colour, while the pentatonic dots supply a restrained way to travel there.";
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
      <div class="triad-landscape-key"><span class="landscape-solid">solid</span> nearest ${cur.symbol} triad · <span class="landscape-faint">faint</span> other ${cur.symbol} inversions · <span class="landscape-ring">ring</span> ${landingLensName(focus)}</div>
      <div class="solo-targets"><span>Now · <b>${cur.symbol}</b></span><strong>${targetLabel(curTargets)}</strong>
      <span>Next · <b>${next.symbol}</b></span><strong>${targetLabel(nextTargets)}</strong></div>
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
    renderCoachCue();
  }

  // ======================= shared chord readout ==========================
  // ============================ TODAY VIEW ===============================
  function renderToday() {
    const root = $("todayApp");
    if (!root) return;
    const active = PP ? PP.active() : null;
    const name = active ? active.displayName : "Player";
    const e = state.ear;
    const pct = e.total ? Math.round((e.score / e.total) * 100) : null;
    root.innerHTML = `
      <div class="today-hero"><span>Today's session</span>
        <h2>Καλή πρόβα, ${escapeHtml(name)}.</h2>
        <p>Work the loop in order: hear the change, name it, then find it on the ${escapeHtml(window.Tuning.current().name)}. Every phrase runs ii · V · I · I, then resets.</p></div>
      <div class="today-grid">${PRACTICE_STEPS.map((step) => {
        const guide = PAGE_GUIDES[step.view];
        return `<button class="today-card" data-today-view="${step.view}"><i>${escapeHtml(step.label)}</i><b>${escapeHtml(guide ? guide.purpose : step.label)}</b><p>${escapeHtml(step.detail)}</p></button>`;
      }).join("")}</div>
      <div class="today-stats">
        <span>Ear colour <b>${e.score}/${e.total}</b>${pct == null ? "" : ` (${pct}%)`}</span>
        <span>Home + changes <b>${e.map.score}/${e.map.total}</b></span>
        <span>Streak <b>${state.ear.drill === "map" ? e.map.streak : e.streak}</b></span>
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
        const colour = profile.progress.earColour, map = profile.progress.earMap;
        return `<div class="progress-card${profile.id === active.id ? " active" : ""}">
          <span class="player-avatar">${escapeHtml(profile.displayName.slice(0, 1).toUpperCase())}</span>
          <b>${escapeHtml(profile.displayName)}${profile.id === active.id ? " · active" : ""}</b>
          <small>${escapeHtml(instrumentShortName(profile.preferences.tuningId))} · last practice ${profile.progress.lastPracticedAt ? escapeHtml(String(profile.progress.lastPracticedAt).slice(0, 10)) : "—"}</small>
          <span class="progress-scores"><span><b>${colour.correct}/${colour.attempts}</b>colour</span><span><b>${map.correct}/${map.attempts}</b>map</span><span><b>${Math.max(colour.best, map.best)}</b>best streak</span></span>
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
  // Prefer the bare roman function; degreeLabel is the display fallback and
  // scaleDegree last (it is numeric, "1"/"2", and must never win over romans).
  function functionTag(c) { return String((c && (c.fn || c.degreeLabel || c.scaleDegree)) || ""); }
  // Every phrase is ii · V · I · I by default: the tonic holds for two bars,
  // then the phrase resets (loop) or pivots to the next key (pivot wheel).
  function barsFor(c) { return state.holdI && /^i$/i.test(functionTag(c)) ? 2 : 1; }
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
      el.classList.toggle("active", +el.getAttribute("data-step") === state.progStep);
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

  function startPlay() {
    cancelTaximiBridge();
    cancelSoloDrone();
    AU.ensure();
    const pulse = currentPulse();
    if (state.view === "cycle" && state.cycleComping.focus === "chords") {
      const { chords } = currentProgression();
      pb = { kind: "comping", len: chords.length, pos: state.cycleComping.step, barsLeft: 0, started: false };
    } else if (state.view === "cycle") {
      const seq = gymSequence(state.index);
      pb = { kind: "cycle", seq, route: cycleTriadPath(), pos: Math.max(0, seq.indexOf(state.index)), barsLeft: 0, started: false };
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
          const routeShape = pb.route[idx];
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
          const heldChords = currentProgression().chords;
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
        const chords = currentProgression().chords;
        const c = chords[pb.pos];
        const nextChord = chords[(pb.pos + 1) % chords.length] || c;
        setTimeout(() => {
          if (pb.kind === "comping") {
            state.cycleComping.step = pb.pos;
            state.cycleComping.voicingIndex = 0;
            renderCycle();
          } else {
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
        if (state.view !== "solo" || state.solo.section !== "targets") return;
        const delay = Math.max(0, (when - now) * 1000);
        setTimeout(() => {
          if (state.view === "solo" && state.solo.section === "targets") updateSoloMatrixJourney(beatInBar);
        }, delay);
      }
    });
    setPlayingUI(true);
  }

  function stopPlay() { AU.stopAll(); setPlayingUI(false); }
  function setPlayingUI(p) {
    const b = $("btnPlay");
    b.textContent = p ? "⏸ Pause" : "▶ Play";
    b.classList.toggle("playing", p);
  }
  function togglePlay() { AU.isPlaying() ? stopPlay() : startPlay(); }

  function auditionCurrent(style) {
    AU.ensure();
    if (state.view === "cycle") {
      if (state.cycleComping.focus === "chords") {
        const chord = currentProgression().chords[state.cycleComping.step];
        AU.playChord(chord.notes, style || state.strumStyle, undefined, chordReferenceVoice());
      } else {
        const shape = cycleTriadPath()[state.index];
        if (shape) AU.playChord(shapeAudioNotes(shape), style || state.strumStyle, undefined, chordReferenceVoice());
      }
    }
    else if (state.view === "prog" || state.view === "solo") auditionProg();
    else if (state.view === "triads") auditionTriad();
  }

  // ============================== views ==================================
  function setView(v) {
    if (v === "lab") v = "solo";   // compatibility with bookmarks from the first version
    if (state.view === "video" && v !== "video" && V) V.destroy();
    stopPlay();
    cancelTaximiBridge();
    cancelSoloDrone();
    state.view = v;
    persistPreferences();
    document.body.setAttribute("data-view", v);
    document.body.setAttribute("data-solo-section", state.solo.section);
    $("btnPrev").disabled = false; $("btnNext").disabled = false;
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === v));
    const nav = VIEW_NAV[v] || "harmony";
    document.body.setAttribute("data-nav", nav);
    document.querySelectorAll("[data-nav]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-nav") === nav));
    if ($("pageTitle")) $("pageTitle").textContent = NAV_TITLES[nav] || "";
    if ($("harmonyTabs")) $("harmonyTabs").classList.toggle("hidden", nav !== "harmony");
    if ($("learnTabs")) $("learnTabs").classList.toggle("hidden", nav !== "learn");
    syncHarmonyTabs();
    ["panelToday", "panelCycle", "panelProg", "panelEar", "panelLab", "panelTriads", "panelSolo", "panelVideo", "panelStyles", "panelAnalyze", "panelConcepts", "panelCoach", "panelProgress"].forEach((id) => $(id).classList.add("hidden"));
    $("stage").classList.toggle("hidden", v === "ear" || v === "video" || v === "styles" || v === "analyze" || v === "concepts" || v === "coach" || v === "today" || v === "progress");
    $("keymapWrap").classList.toggle("hidden", v !== "cycle");
    $("scaleStrip").classList.toggle("hidden", v !== "prog");
    $("progStrip").classList.toggle("hidden", v !== "prog");
    $("triadStrip").classList.toggle("hidden", v !== "triads");
    $("changeGuide").classList.toggle("hidden", v !== "cycle" && v !== "prog");
    if (v === "cycle") { $("panelCycle").classList.remove("hidden"); renderCycle(); }
    else if (v === "prog") { $("panelProg").classList.remove("hidden"); syncProgControls(); renderProg(); }
    else if (v === "triads") { $("panelTriads").classList.remove("hidden"); syncTriadControls(); renderTriads(); }
    else if (v === "solo") { $("panelSolo").classList.remove("hidden"); setSoloSection(state.solo.section); }
    else if (v === "video") { $("panelVideo").classList.remove("hidden"); if (V) V.render(); }
    else if (v === "styles") { $("panelStyles").classList.remove("hidden"); renderStyles(); }
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
    renderPracticePath();
    renderPageGuide();
    renderCoachCue();
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

    if ($("voiceSel")) $("voiceSel").onchange = (event) => {
      state.chordVoice = event.target.value;
      saveUiPreferences();
    };
    if ($("tglPickup")) $("tglPickup").onchange = (event) => {
      state.pickupV2 = event.target.checked;
      saveUiPreferences();
      rerender();
    };

    $("btnPrev").onclick = () => {
      stopPlay();
      if (state.view === "cycle") state.cycleComping.focus === "chords" ? stepCycleComping(-1) : stepCycle(-1);
      else if (state.view === "prog" || state.view === "solo") stepProg(-1);
      else if (state.view === "triads") stepTriad(-1);
      else return;
      auditionCurrent("block");
    };
    $("btnNext").onclick = () => {
      stopPlay();
      if (state.view === "cycle") state.cycleComping.focus === "chords" ? stepCycleComping(1) : stepCycle(1);
      else if (state.view === "prog" || state.view === "solo") stepProg(1);
      else if (state.view === "triads") stepTriad(1);
      else return;
      auditionCurrent();
    };
    $("btnPlay").onclick = togglePlay;
    $("btnPivotPairPrev").onclick = () => { stopPlay(); cancelTaximiBridge(); stepPivotPair(-1); };
    $("btnPivotPairNext").onclick = () => { stopPlay(); cancelTaximiBridge(); stepPivotPair(1); };
    document.querySelectorAll("[data-gym-keys]").forEach((button) => button.onclick = () => {
      const wasPlaying = AU.isPlaying();
      stopPlay(); cancelTaximiBridge();
      state.gym.keys = +button.getAttribute("data-gym-keys");
      saveUiPreferences();
      renderCycle();
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

    document.querySelectorAll("[data-mode]").forEach((el) => el.onclick = () => {
      document.querySelectorAll("[data-mode]").forEach((x) => x.classList.remove("active"));
      el.classList.add("active");
      state.cycleMode = el.getAttribute("data-mode");
      if (state.cycleMode === "pivot") state.index = sequenceFor("pivot", state.index)[0];
      persistPreferences();
      if (AU.isPlaying()) { stopPlay(); startPlay(); }
      renderCycle();
    });

    document.querySelectorAll("[data-cycle-focus]").forEach((button) => button.onclick = () => {
      stopPlay();
      state.cycleComping.focus = button.getAttribute("data-cycle-focus");
      document.querySelectorAll("[data-cycle-focus]").forEach((item) =>
        item.classList.toggle("active", item.getAttribute("data-cycle-focus") === state.cycleComping.focus));
      renderCycle(); renderPageGuide(); renderCoachCue();
    });

    document.querySelectorAll("[data-modeid]").forEach((el) =>
      el.onclick = () => selectMode(el.getAttribute("data-modeid")));

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
      state.analysis.tonic = event.target.value; state.analysis.studyId = null; state.analysis.selected = 0; renderAnalyzer();
    };
    document.querySelectorAll("[data-analysis-mode]").forEach((button) => {
      button.onclick = () => {
        state.analysis.modeId = button.getAttribute("data-analysis-mode"); state.analysis.studyId = null; state.analysis.selected = 0;
        syncAnalysisControls(); renderAnalyzer();
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
      if (state.view === "prog") renderProg();
      else if (state.view === "solo") { renderSoloMapControls(); renderSoloSection(); }
      else if (state.view === "triads") renderTriads();
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
      $("btnStroke").textContent = "Start: " + (state.lab.firstStroke === "down" ? "⊓ down" : "V up");
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

    $("earTonicSel").onchange = (event) => {
      state.ear.tonic = event.target.value;
      renderEarReference();
      if (state.view === "ear" && state.ear.drill === "colour") newEarQuestion();
    };
    $("btnEarTonic").onclick = playEarTonic;
    $("btnEarNew").onclick = newEarQuestion;
    $("btnEarReplay").onclick = () => { if (state.ear.answer) playEarPrompt(); else newEarQuestion(); };
    $("btnEarHint").onclick = hintColour;
    $("btnEarCheck").onclick = checkColourGuess;
    $("earMapHomeSel").onchange = (event) => {
      state.ear.map.homePreset = event.target.value;
      if (state.view === "ear" && state.ear.drill === "map") newEarMap();
    };
    $("btnEarMapNew").onclick = newEarMap;
    $("btnEarMapHome").onclick = playEarMapHome;
    $("btnEarMapReplay").onclick = () => { if (state.ear.map.answer) playEarMapPrompt(); else newEarMap(); };
    $("btnEarMapHint").onclick = hintEarMap;
    $("btnEarMapCheck").onclick = checkEarMap;
    document.querySelectorAll("[data-ear-drill]").forEach((button) =>
      button.onclick = () => setEarDrill(button.getAttribute("data-ear-drill")));
    document.querySelectorAll("[data-guess]").forEach((b) =>
      b.onclick = () => selectColourGuess(b.getAttribute("data-guess")));

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (state.view === "ear") state.ear.drill === "map" ? playEarMapPrompt() : playEarPrompt();
        else if (state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section)) $("btnLabPlay").click();
        else if (state.view !== "styles" && state.view !== "video" && state.view !== "analyze" && state.view !== "concepts" && state.view !== "coach" && state.view !== "today" && state.view !== "progress") togglePlay();
      }
      else if (e.code === "ArrowRight" && state.view === "triads") { e.preventDefault(); stepTriad(1); }
      else if (e.code === "ArrowLeft" && state.view === "triads") { e.preventDefault(); stepTriad(-1); }
      else if (e.code === "ArrowRight") { e.preventDefault(); state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section) ? (state.lab.drill === "cell" ? stepCell(1) : shiftPosition(1)) : $("btnNext").click(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section) ? (state.lab.drill === "cell" ? stepCell(-1) : shiftPosition(-1)) : $("btnPrev").click(); }
      else if (e.key === "1") setView("today");
      else if (e.key === "2") setView("ear");
      else if (e.key === "3") setView("cycle");
      else if (e.key === "4") setView("solo");
      else if (e.key === "5") setView("analyze");
      else if (e.key === "6") setView("styles");
      else if (e.key === "7") setView("coach");
      else if (e.key === "8") setView("progress");
      else if (e.key === "9") setView("prog");
      else if (e.key === "0") setView("triads");
      else if (e.key.toLowerCase() === "r" && state.view === "solo" && state.solo.section === "cell") $("btnReveal").click();
    });
  }

  function rerender() {
    if (state.view === "cycle") renderCycle();
    else if (state.view === "prog") renderProg();
    else if (state.view === "solo") { renderSoloMapControls(); renderSoloSection(); }
    else if (state.view === "triads") { syncTriadControls(); renderTriads(); }
    else if (state.view === "ear") setEarDrill(state.ear.drill);
    else if (state.view === "styles") renderStyles();
    else if (state.view === "analyze") renderAnalyzer();
    else if (state.view === "concepts") renderConcepts();
    else if (state.view === "coach") C.render();
    else if (state.view === "today") renderToday();
    else if (state.view === "progress") renderProgress();
  }

  function showTestBadge() {
    const suites = [T.selfTest(), HJ.selfTest(), PP.selfTest(), M.selfTest(), E.selfTest(), S.selfTest(), A.selfTest(), U.selfTest(), Q.selfTest(), R.selfTest(), V.selfTest(), C.selfTest(), P.selfTest(), TR.selfTest(), GV.selfTest(), AU.selfTest()];
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
    wire();
    syncPersistentControls();
    renderPlayerProfiles(false);
    showTestBadge();
    showReleaseIdentity();
    $("bpm").value = state.bpm; $("bpmVal").textContent = state.bpm;
    C.mount({ context: coachContext, onAction: useCoachAction, profileId: player.id });
    setView(player.preferences.view);
  });
})();
