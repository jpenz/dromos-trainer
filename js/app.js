/* app.js — views, wiring, animation, playback sync, shortcuts.
 * Implements FR-04..07, FR-11, FR-12, FR-15. See docs/REQUIREMENTS.md.
 */
(function () {
  "use strict";
  const T = window.Theory, FB = window.Fretboard, AU = window.AudioEngine, M = window.Modes, S = window.StyleLibrary, A = window.AnalysisEngine,
    U = window.StudyLibrary, Q = window.MusicXmlImport, R = window.ResourceLibrary, V = window.VideoStudy, C = window.PracticeCoach, GV = window.GuitarVoicings;

  const cycle = T.buildCycle();
  const N = cycle.length;

  const state = {
    view: "cycle",             // cycle | prog | ear | triads | solo | styles | video | analyze | concepts | coach
    // --- cycle view ---
    index: 0,
    cycleMode: "full",         // full | iiVI | pivot
    cycleComping: { focus: "hear", step: 0, kind: "full", voicingIndex: 0 },
    // --- progression view ---
    tonic: "D",
    modeId: "major",
    progId: "ii-V-I",
    progStep: 0,
    scaleOverlay: false,
    // --- ear trainer ---
    ear: {
      drill: "colour", answer: null, score: 0, total: 0, streak: 0, best: 0, locked: false,
      map: { answer: null, keyGuess: null, progressionGuess: null, locked: false, score: 0, total: 0, streak: 0, best: 0 }
    },
    // --- triads ---
    triads: { step: 0, stringSet: null, showAll: true },
    // --- solo lab ---
    solo: { section: "road", focus: "third", lens: "full", phraseId: "outline", routeId: "three-plus-target", matrixBeat: 0, matrixPlan: [] },
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
    // The pulse is deliberately a practice ensemble: grouped timing and
    // functional roots, not a substitute for a real rhythm section or a
    // claim that one generic pattern represents a whole Greek style.
    groove: { styleId: "hasapiko", bass: true, drums: true }
  };

  const $ = (id) => document.getElementById(id);
  const svg = () => $("fretboard");
  const escapeHtml = (value) => String(value == null ? "" : value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));

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
    coach: { purpose: "Ask for a precise next step", title: "The coach knows your selected map and can open one specific exercise.", steps: ["Ask a concrete question about a chord, phrase, or practice obstacle.", "Use the returned action only if it fits what you hear.", "The coach advises; your ear and score remain the source of truth."] }
  };

  function renderPageGuide() {
    const guide = state.view === "cycle" && state.cycleComping.focus === "chords"
      ? { purpose: "Comp with usable shapes", title: "Choose the smallest chord shape that makes the function clear.", steps: ["Set dromos and progression before choosing a grip.", "Try Full 6 for open/barre vocabulary, then Triad 3 or Compact 4 for moving changes.", "Keep a common tone when possible; listen for the 3rd and 7th when the harmony changes."] }
      : PAGE_GUIDES[state.view] || PAGE_GUIDES.cycle;
    const current = state.view === "solo" ? `Current road: ${M.MODES[state.modeId].name} on ${state.tonic} · ${currentProgression().prog.label}.` : "";
    $("pageGuide").innerHTML = `<details open><summary><span>${guide.purpose}</span><b>How this page works</b></summary>
      <h2>${guide.title}</h2><ol>${guide.steps.map((step) => `<li>${step}</li>`).join("")}</ol>${current ? `<p>${current}</p>` : ""}</details>`;
  }

  function renderCoachCue() {
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

  // ============================ CYCLE VIEW ===============================
  function sequenceFor(mode, idx) {
    if (mode === "iiVI") { const g = Math.floor(idx / 3) * 3; return [g, g + 1, g + 2]; }
    if (mode === "pivot") return cycle.map((c, i) => i).filter((i) => cycle[i].fn !== "V");
    return cycle.map((_, i) => i);
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

  function renderCycleComping() {
    const { chords } = currentProgression();
    const c = state.cycleComping;
    const chord = chords[Math.min(c.step, chords.length - 1)];
    const voicings = cycleChordVoicings(chord);
    const voicing = voicings[c.voicingIndex];
    if (!voicing) {
      FB.render(svg(), { labelMode: state.labelMode, lefty: state.lefty });
      $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${chord.degreeLabel}</span><span class="ro-symbol">${chord.symbol}</span></div><div class="ro-foot">Full/open forms are a guitar-specific vocabulary. Switch to guitar for six-string forms, or choose Compact 4 for a playable chord-tone set on this tuning.</div>`;
      return;
    }
    FB.render(svg(), { grip: { placements: voicing.placements }, labelMode: state.labelMode, lefty: state.lefty, flavourPcs: M.flavourPcs(state.tonic, state.modeId) });
    svg().setAttribute("aria-label", `guitar ${voicing.label} for ${chord.symbol}`);
    const tones = voicing.placements.slice().reverse().map((placement) => `<div class="note-chip held" data-group="${placement.note.colorGroup}"><span class="chip-role">${placement.note.roleLabel}</span><span class="chip-name">${placement.note.name}</span><span class="chip-tag">fret ${placement.fret}</span></div>`).join("");
    $("readout").innerHTML = `<div class="ro-head"><span class="fn-badge fn-deg">${chord.degreeLabel}</span><span class="ro-symbol">${chord.symbol}</span><span class="ro-key">${voicing.label}</span></div><div class="tri-tags"><span class="tri-set">${voicing.family}</span><span class="tri-fret">frets ${voicing.lowFret}–${voicing.highFret || Math.max(...voicing.placements.map((placement) => placement.fret))}</span></div><div class="ro-notes">${tones}</div><div class="ro-foot">Play the lowest note as a bass cue, then listen for the 3rd${chord.notes.some((note) => note.role === "7" || note.role === "b7") ? " and 7th" : ""}. On the next chord, keep common tones and move the remaining voice by the shortest musical distance.</div>`;
  }

  function renderCycle() {
    $("keymapWrap").classList.toggle("hidden", state.cycleComping.focus === "chords");
    document.querySelectorAll("[data-cycle-focus]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-cycle-focus") === state.cycleComping.focus));
    renderCycleCompingControls();
    if (state.cycleComping.focus === "chords") { $("pivotBanner").classList.remove("show"); renderCycleComping(); return; }
    const cur = cycle[state.index];
    const prev = cycle[prevIndex(state.index)];
    const moveClass = T.transition(prev, cur);
    drawChord(cur.notes, moveClass);
    renderChordReadout(cur.symbol, cur.fn, "key of " + cur.key, cur.notes, moveClass,
      "Guide tones (3rd &amp; 7th) drive the motion · two voices hold, two step down");
    renderKeymap(cur);
    const pivot = T.isPivot(prev, cur);
    const banner = $("pivotBanner");
    banner.classList.toggle("show", pivot);
    if (pivot) banner.textContent =
      `PIVOT · ${prev.symbol} becomes ${cur.symbol} — the I of ${prev.key} is now the ii of ${cur.key}`;
    pulseMoved();
  }

  function renderKeymap(cur) {
    const keys = ["C", "B♭", "A♭", "G♭", "E", "D"];
    $("keymap").innerHTML = keys.map((k) =>
      `<span class="key-node${k === cur.key ? " active" : ""}">${k}</span>`
    ).join('<span class="key-arrow">→</span>');
  }

  function stepCycle(delta) {
    const seq = sequenceFor(state.cycleMode, state.index);
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

  // ========================= PROGRESSION VIEW ============================
  function currentProgression() {
    return M.buildProgression(state.tonic, state.modeId, state.progId);
  }

  function renderProg() {
    const { prog, chords } = currentProgression();
    const idx = Math.min(state.progStep, chords.length - 1);
    const cur = chords[idx];
    const prev = chords[(idx - 1 + chords.length) % chords.length];
    const moveClass = cur.notes.map((n) =>
      prev.notes.some((p) => p.pc === n.pc) ? "held" : "moved");

    const scale = M.scaleOf(state.tonic, state.modeId);
    drawChord(cur.notes, moveClass, {
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      scaleNotes: state.scaleOverlay ? scale : null
    });

    const mode = M.MODES[state.modeId];
    renderChordReadout(cur.symbol, cur.degreeLabel, mode.name + " on " + state.tonic,
      cur.notes, moveClass, prog.why);

    // progression strip
    $("progStrip").innerHTML = chords.map((c, i) =>
      `<button class="pchip${i === idx ? " active" : ""}" data-step="${i}">
         <span class="pchip-deg">${c.degreeLabel}</span>
         <span class="pchip-sym">${c.symbol}</span></button>`
    ).join('<span class="pchip-arrow">→</span>');
    $("progStrip").querySelectorAll("[data-step]").forEach((b) => {
      b.onclick = () => { state.progStep = +b.getAttribute("data-step"); renderProg(); auditionProg(); };
    });

    renderScaleStrip(scale, mode);
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
    // the two-note comparison drill
    html += `<div class="compare"><span class="cmp-label">2nd &amp; 3rd tell you the mode:</span>`;
    M.MODE_ORDER.forEach((id) => {
      const m = M.MODES[id];
      const s = M.scaleOf(state.tonic, id);
      const f = m.flavour.map((off) => s.find((x) => x.off === off));
      html += `<span class="cmp ${id === state.modeId ? "on" : ""}" data-jump="${id}">
        <b>${m.name}</b> ${f.map((x) => x ? x.name : "?").join(" ")}</span>`;
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
    syncProgControls();
    if (state.view === "solo") { renderSoloMapControls(); renderSoloSection(); }
    else renderProg();
  }

  function syncProgControls() {
    document.querySelectorAll("[data-modeid]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-modeid") === state.modeId));
    const list = M.PROGRESSIONS[state.modeId];
    $("progList").innerHTML = list.map((p) =>
      `<button class="prog-item${p.id === state.progId ? " active" : ""}" data-prog="${p.id}">
        <span class="prog-label">${p.label}</span>
        <span class="prog-tag t-${p.tag}">${p.tag}</span>
        <span class="prog-why">${p.why}</span></button>`
    ).join("");
    $("progList").querySelectorAll("[data-prog]").forEach((b) => {
      b.onclick = () => {
        stopPlay();
        state.progId = b.getAttribute("data-prog"); state.progStep = 0;
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
    AU.playChord(chords[Math.min(state.progStep, chords.length - 1)].notes, state.strumStyle);
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
  function newEarQuestion() {
    stopPlay();
    const ids = M.MODE_ORDER;
    // avoid repeating the same answer twice running
    let pick;
    do { pick = ids[Math.floor(Math.random() * ids.length)]; }
    while (ids.length > 1 && pick === state.ear.answer);
    state.ear.answer = pick;
    state.ear.locked = false;
    $("earFeedback").className = "ear-feedback";
    $("earFeedback").textContent = "Listen — chords, then a descending run. Name the mode.";
    document.querySelectorAll("[data-guess]").forEach((b) => {
      b.className = "guess-btn"; b.disabled = false;
    });
    playEarPrompt();
    renderEarScore();
  }

  function playEarPrompt() {
    stopPlay();
    const id = state.ear.answer;
    const prog = M.PROGRESSIONS[id][0];
    const { chords } = M.buildProgression(state.tonic, id, prog.id);
    const run = M.descendingRun(state.tonic, id);
    AU.playPrompt(chords, run, state.bpm);
  }

  function submitGuess(guess) {
    if (state.ear.locked) return;
    state.ear.locked = true;
    const correct = guess === state.ear.answer;
    state.ear.total++;
    if (correct) {
      state.ear.score++; state.ear.streak++;
      state.ear.best = Math.max(state.ear.best, state.ear.streak);
    } else { state.ear.streak = 0; }

    document.querySelectorAll("[data-guess]").forEach((b) => {
      const g = b.getAttribute("data-guess");
      if (g === state.ear.answer) b.classList.add("right");
      else if (g === guess) b.classList.add("wrong");
      b.disabled = true;
    });

    const ansScale = M.scaleOf(state.tonic, state.ear.answer);
    const f = M.MODES[state.ear.answer].flavour.map((o) => ansScale.find((x) => x.off === o).name);
    const fb = $("earFeedback");
    fb.className = "ear-feedback " + (correct ? "ok" : "no");
    fb.innerHTML = (correct ? "✓ Correct — " : "✗ It was ") +
      `<b>${M.MODES[state.ear.answer].name}</b>. Its 2nd &amp; 3rd: <b>${f.join(" ")}</b>.`;
    renderEarScore();
  }

  function earMapLabel(answer) {
    return answer.tonic + " " + M.MODES[answer.modeId].name;
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
    const modeId = M.MODE_ORDER[Math.floor(Math.random() * M.MODE_ORDER.length)];
    const tonic = ["C", "D", "E♭", "F", "G", "A", "B♭"][Math.floor(Math.random() * 7)];
    const bank = M.PROGRESSIONS[modeId];
    const progression = bank[Math.floor(Math.random() * bank.length)];
    map.answer = { tonic, modeId, progressionId: progression.id };
    map.keyOptions = selectEarMapChoices(map.answer);
    map.keyGuess = null; map.progressionGuess = null; map.locked = false;
    $("earMapFeedback").className = "ear-feedback";
    $("earMapFeedback").textContent = "Listen twice. Choose the home key, then the function boxes you hear.";
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

  function renderEarMap() {
    const map = state.ear.map;
    if (!map.answer) return;
    const progressions = M.PROGRESSIONS[map.answer.modeId];
    $("earKeyChoices").innerHTML = map.keyOptions.map((tonic) =>
      `<button data-ear-key="${tonic}"${map.keyGuess === tonic ? " class=\"selected\"" : ""}>${tonic}</button>`
    ).join("");
    $("earProgressionChoices").innerHTML = progressions.map((progression) =>
      `<button data-ear-prog="${progression.id}"${map.progressionGuess === progression.id ? " class=\"selected\"" : ""}><b>${progression.label}</b><span>${progression.chords.map((chord) => M.DEGREE_LABEL[chord[0]]).join(" → ")}</span></button>`
    ).join("");
    $("earKeyChoices").querySelectorAll("[data-ear-key]").forEach((button) => button.onclick = () => {
      if (map.locked) return;
      map.keyGuess = button.getAttribute("data-ear-key"); renderEarMap(); checkEarMap();
    });
    $("earProgressionChoices").querySelectorAll("[data-ear-prog]").forEach((button) => button.onclick = () => {
      if (map.locked) return;
      map.progressionGuess = button.getAttribute("data-ear-prog"); renderEarMap(); checkEarMap();
    });
  }

  function checkEarMap() {
    const map = state.ear.map;
    if (!map.keyGuess || !map.progressionGuess || map.locked) return;
    map.locked = true; map.total++;
    const rightKey = map.keyGuess === map.answer.tonic;
    const rightProgression = map.progressionGuess === map.answer.progressionId;
    const correct = rightKey && rightProgression;
    if (correct) { map.score++; map.streak++; map.best = Math.max(map.best, map.streak); }
    else map.streak = 0;
    const progression = M.PROGRESSIONS[map.answer.modeId].find((item) => item.id === map.answer.progressionId);
    const { chords } = M.buildProgression(map.answer.tonic, map.answer.modeId, map.answer.progressionId);
    const feedback = $("earMapFeedback");
    feedback.className = "ear-feedback " + (correct ? "ok" : "no");
    feedback.innerHTML = (correct ? "✓ You heard the whole map. " : "✗ Check the map. ") +
      `Home: <b>${earMapLabel(map.answer)}</b>. Boxes: <b>${progression.label}</b> · ${chords.map((chord) => `<b>${chord.symbol}</b>`).join(" → ")}.`;
    renderEarMap(); renderEarScore();
  }

  function setEarDrill(drill) {
    state.ear.drill = drill;
    $("earColour").classList.toggle("hidden", drill !== "colour");
    $("earMap").classList.toggle("hidden", drill !== "map");
    document.querySelectorAll("[data-ear-drill]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-ear-drill") === drill));
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
    return "colour 3rds";
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
    const targetPcs = curTargets.concat(nextTargets).map((note) => note.pc);
    FB.render(svg(), {
      path: path.nodes, pathIndex: L.pathIndex,
      labelMode: state.labelMode, lefty: state.lefty,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      targetPcs,
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
      stringSet: t.stringSet, startFret: 5, nameFor: spellPc
    });
    const cur = path[t.step];
    if (!cur) return;

    let others = TR.allShapes(chords[t.step].rootPc, cur.triadId, spellPc);
    if (t.stringSet != null) others = others.filter((s) => s.stringSet[0] === t.stringSet);

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
      <div class="ro-foot">${others.length} shapes of this triad on the neck.
      Sevenths are colour on top of a triad — over <b>${cur.chord.symbol}</b> the
      target notes are these three.</div>`;

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
    const path = TR.pathThrough(chords, { stringSet: state.triads.stringSet, nameFor: spellPc });
    const cur = path[Math.min(state.triads.step, path.length - 1)];
    if (!cur) return;
    AU.ensure();
    AU.playChord(cur.placements.map((p) => ({ freq: 440 * Math.pow(2, (p.midi - 69) / 12) })), "strum");
  }

  function stepTriad(d) {
    const { chords } = currentProgression();
    state.triads.step = (state.triads.step + d + chords.length) % chords.length;
    renderTriads(); auditionTriad();
  }

  function syncTriadControls() {
    const sets = TR.stringSets3();
    const names = window.Tuning.names();
    $("setSel").innerHTML = `<option value="">All string sets</option>` +
      sets.map((s) => `<option value="${s[0]}"${state.triads.stringSet === s[0] ? " selected" : ""}>${
        names.slice(s[0], s[0] + 3).join("-")} strings</option>`).join("");
    if (state.triads.stringSet != null && !sets.some((s) => s[0] === state.triads.stringSet)) {
      state.triads.stringSet = null;   // tuning changed under us
    }
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
      <div class="solo-current-change"><span>Now playing</span>${chords.map((chord, index) =>
        `<button data-solo-step="${index}" class="${index === state.progStep ? "active" : ""}"><i>${chord.degreeLabel}</i><b>${chord.symbol}</b></button>`
      ).join('<em>→</em>')}</div>`;

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
    const roadNotes = lens === "lower" ? lower : lens === "upper" ? upper : lower.concat(upper.slice(0, -1));
    const focusTargets = soloTargets(current, state.solo.focus);

    FB.render(svg(), {
      roadNotes,
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
      </div>
      <div class="tetra-matrix">
        <section class="tetra-card lower"><div><b>First part</b><span>lower tetrachord · 1–4</span></div><div>${noteMatrix(lower, "lower")}</div></section>
        <section class="tetra-card upper"><div><b>Second part</b><span>upper tetrachord · 5–8</span></div><div>${noteMatrix(upper, "upper")}</div></section>
      </div>
      <div class="road-practice"><b>One musical cycle</b><ol><li>Sing 1–2–3–4, then 5–6–7–8.</li><li>Choose one position and find the same two colour lanes.</li><li>Use a four-note number pattern, then finish on a target in <strong>${current.symbol}</strong>.</li></ol></div>`;
    $("soloRoad").querySelectorAll("[data-road-lens]").forEach((button) => {
      button.onclick = () => { state.solo.lens = button.getAttribute("data-road-lens"); renderSoloRoad(); };
    });

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

    FB.render(svg(), {
      grip: activeGrip,
      otherShapes: state.solo.section === "targets" ? allTriads : [],
      pentatonicNotes: state.solo.section === "targets" ? pentatonic : null,
      targetNotes: state.solo.section === "targets" ? targetNotes : null,
      targetPcs: targetNotes.map((note) => note.pc),
      overlayRange,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      labelMode: state.labelMode,
      lefty: state.lefty
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " soloing map");

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
        : "The solid shape is the closest voice-led triad; use its 3rd as the chord's colour, while the pentatonic dots supply a restrained way to travel there.";
    $("soloRecipe").innerHTML = `
      <div class="solo-frame"><b>${frame.name}</b><span>${pentatonic.map((note) => note.name).join(" · ")}</span></div>
      <div class="triad-landscape-key"><span class="landscape-solid">solid</span> nearest ${cur.symbol} triad · <span class="landscape-faint">faint</span> other ${cur.symbol} inversions · <span class="landscape-ring">ring</span> ${landingLensName(focus)}</div>
      <div class="solo-targets"><span>Now · <b>${cur.symbol}</b></span><strong>${targetLabel(curTargets)}</strong>
      <span>Next · <b>${next.symbol}</b></span><strong>${targetLabel(nextTargets)}</strong></div>
      <p>${focus === "third"
        ? "Treat the pentatonic as the sentence and the 3rd as the punctuation: arrive on it when the chord changes."
        : focus === "triad"
          ? "Treat the triad as the map of meaning: root feels settled, 3rd names the colour, and 5th keeps the line open. Connect only as much scale material as you need to reach the next triad."
          : guideInstruction}</p>
      <section class="solo-thinking"><span>Hear · think · play</span><ol>
        <li><b>Hear:</b> sing ${targetLabel(nextTargets)} before the chord moves. If you cannot sing it, stay on the current triad.</li>
        <li><b>Think:</b> ${route.path}</li>
        <li><b>Play:</b> ${route.budget}. ${route.think}</li>
      </ol><p>${focusSentence}</p><button class="solo-open-route" data-open-solo-path>Practise this route in Shape →</button></section>
      <section id="soloTimingMatrix" class="solo-timing-matrix"></section>`;
    $("soloRecipe").querySelector("[data-open-solo-path]").onclick = () => setSoloSection("path");
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
      <div class="ro-foot">Speak the numbers before playing. Keep one simple rhythm for two passes, then use the final note as the landing point for the chord you hear.</div>`;
    $("posLabel").textContent = "Pos " + L.position;
  }

  function renderSoloSection() {
    if (state.solo.section === "road") renderSoloRoad();
    else if (state.solo.section === "targets") renderSolo();
    else renderLab();
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
  function barsFor(c) { return state.holdI && c.fn === "I" ? 2 : 1; }

  function startPlay() {
    AU.ensure();
    const pulse = currentPulse();
    if (state.view === "cycle" && state.cycleComping.focus === "chords") {
      const { chords } = currentProgression();
      pb = { kind: "comping", len: chords.length, pos: state.cycleComping.step, started: false };
    } else if (state.view === "cycle") {
      const seq = sequenceFor(state.cycleMode, state.index);
      pb = { kind: "cycle", seq, pos: Math.max(0, seq.indexOf(state.index)), barsLeft: 0, started: false };
    } else if (state.view === "prog" || state.view === "solo") {
      const { chords } = currentProgression();
      pb = { kind: "prog", len: chords.length, pos: state.progStep, started: false };
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
          if (pb.barsLeft > 0) { pb.barsLeft--; return { hold: true }; }
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
          return { notes: chord.notes, bass: { rootPc: rootPcOf(chord), nextRootPc: rootPcOf(nextChord) } };
        }
        // progression playback
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
          }
        }, delay);
        return { notes: c.notes, bass: { rootPc: rootPcOf(c), nextRootPc: rootPcOf(nextChord) } };
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
      const chord = state.cycleComping.focus === "chords"
        ? currentProgression().chords[state.cycleComping.step]
        : cycle[state.index];
      AU.playChord(chord.notes, style || state.strumStyle);
    }
    else if (state.view === "prog" || state.view === "solo") auditionProg();
    else if (state.view === "triads") auditionTriad();
  }

  // ============================== views ==================================
  function setView(v) {
    if (v === "lab") v = "solo";   // compatibility with bookmarks from the first version
    if (state.view === "video" && v !== "video" && V) V.destroy();
    stopPlay();
    state.view = v;
    document.body.setAttribute("data-view", v);
    document.body.setAttribute("data-solo-section", state.solo.section);
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === v));
    ["panelCycle", "panelProg", "panelEar", "panelLab", "panelTriads", "panelSolo", "panelVideo", "panelStyles", "panelAnalyze", "panelConcepts", "panelCoach"].forEach((id) => $(id).classList.add("hidden"));
    $("stage").classList.toggle("hidden", v === "ear" || v === "video" || v === "styles" || v === "analyze" || v === "concepts" || v === "coach");
    $("keymapWrap").classList.toggle("hidden", v !== "cycle");
    $("scaleStrip").classList.toggle("hidden", v !== "prog");
    $("progStrip").classList.toggle("hidden", v !== "prog");
    $("triadStrip").classList.toggle("hidden", v !== "triads");
    if (v === "cycle") { $("panelCycle").classList.remove("hidden"); renderCycle(); }
    else if (v === "prog") { $("panelProg").classList.remove("hidden"); syncProgControls(); renderProg(); }
    else if (v === "triads") { $("panelTriads").classList.remove("hidden"); syncTriadControls(); renderTriads(); }
    else if (v === "solo") { $("panelSolo").classList.remove("hidden"); setSoloSection(state.solo.section); }
    else if (v === "video") { $("panelVideo").classList.remove("hidden"); if (V) V.render(); }
    else if (v === "styles") { $("panelStyles").classList.remove("hidden"); renderStyles(); }
    else if (v === "analyze") { $("panelAnalyze").classList.remove("hidden"); syncAnalysisControls(); renderAnalyzer(); }
    else if (v === "concepts") { $("panelConcepts").classList.remove("hidden"); renderConcepts(); }
    else if (v === "coach") { $("panelCoach").classList.remove("hidden"); C.render(); }
    else { $("panelEar").classList.remove("hidden"); setEarDrill(state.ear.drill); }
    // renderCycle rightfully decides whether the pivot explanation is visible;
    // no other practice area should inherit that explanation from a prior view.
    if (v !== "cycle") $("pivotBanner").classList.remove("show");
    renderPracticePath();
    renderPageGuide();
    renderCoachCue();
    if (C) C.trackView(v, coachContext());
  }

  // ============================= wiring ==================================
  function wire() {
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.onclick = () => setView(b.getAttribute("data-view")));

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

    $("tglLabel").onchange = (e) => { state.labelMode = e.target.checked ? "note" : "interval"; rerender(); };
    $("tglGhost").onchange = (e) => { state.ghosts = e.target.checked; rerender(); };
    $("tglLefty").onchange = (e) => { state.lefty = e.target.checked; rerender(); };
    $("tglScale").onchange = (e) => { state.scaleOverlay = e.target.checked; rerender(); };
    $("tglMetro").onchange = (e) => { state.metronome = e.target.checked; AU.setMetronome(state.metronome); };
    $("tglLoop").onchange = (e) => { state.loop = e.target.checked; };
    $("tglHoldI").onchange = (e) => { state.holdI = e.target.checked; };

    $("bpm").oninput = (e) => {
      state.bpm = +e.target.value; $("bpmVal").textContent = state.bpm; AU.setBpm(state.bpm);
    };

    // --- triads ---
    $("setSel").onchange = (e) => {
      state.triads.stringSet = e.target.value === "" ? null : +e.target.value;
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

    $("btnEarNew").onclick = newEarQuestion;
    $("btnEarReplay").onclick = () => { if (state.ear.answer) playEarPrompt(); else newEarQuestion(); };
    $("btnEarMapNew").onclick = newEarMap;
    $("btnEarMapReplay").onclick = () => { if (state.ear.map.answer) playEarMapPrompt(); else newEarMap(); };
    document.querySelectorAll("[data-ear-drill]").forEach((button) =>
      button.onclick = () => setEarDrill(button.getAttribute("data-ear-drill")));
    document.querySelectorAll("[data-guess]").forEach((b) =>
      b.onclick = () => submitGuess(b.getAttribute("data-guess")));

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (state.view === "ear") state.ear.drill === "map" ? playEarMapPrompt() : playEarPrompt();
        else if (state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section)) $("btnLabPlay").click();
        else if (state.view !== "styles" && state.view !== "video" && state.view !== "analyze" && state.view !== "concepts" && state.view !== "coach") togglePlay();
      }
      else if (e.code === "ArrowRight" && state.view === "triads") { e.preventDefault(); stepTriad(1); }
      else if (e.code === "ArrowLeft" && state.view === "triads") { e.preventDefault(); stepTriad(-1); }
      else if (e.code === "ArrowRight") { e.preventDefault(); state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section) ? (state.lab.drill === "cell" ? stepCell(1) : shiftPosition(1)) : $("btnNext").click(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); state.view === "solo" && ["path", "phrase", "cell"].includes(state.solo.section) ? (state.lab.drill === "cell" ? stepCell(-1) : shiftPosition(-1)) : $("btnPrev").click(); }
      else if (e.key === "1") setView("cycle");
      else if (e.key === "2") setView("prog");
      else if (e.key === "3") setView("ear");
      else if (e.key === "4") setView("triads");
      else if (e.key === "5") setView("solo");
      else if (e.key === "6") setView("styles");
      else if (e.key === "7") setView("video");
      else if (e.key === "8") setView("analyze");
      else if (e.key === "9") setView("concepts");
      else if (e.key === "0") setView("coach");
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
  }

  function showTestBadge() {
    const suites = [T.selfTest(), M.selfTest(), S.selfTest(), A.selfTest(), U.selfTest(), Q.selfTest(), R.selfTest(), V.selfTest(), C.selfTest(), P.selfTest(), TR.selfTest(), GV.selfTest()];
    const all = suites.reduce((a, s) => a.concat(s.results), []);
    const ok = suites.every((s) => s.ok);
    const nPass = all.filter((x) => x.pass).length;
    const el = $("testBadge");
    el.textContent = ok ? `✓ ${nPass}/${all.length} theory tests passing` : `✗ theory tests FAILED (${nPass}/${all.length})`;
    el.className = "test-badge " + (ok ? "ok" : "fail");
    if (!ok) console.error("Failures:", all.filter((x) => !x.pass));
  }

  document.addEventListener("DOMContentLoaded", () => {
    wire();
    showTestBadge();
    $("bpm").value = state.bpm; $("bpmVal").textContent = state.bpm;
    C.mount({ context: coachContext, onAction: useCoachAction });
    setView("cycle");
  });
})();
