/* app.js — views, wiring, animation, playback sync, shortcuts.
 * Implements FR-04..07, FR-11, FR-12, FR-15. See docs/REQUIREMENTS.md.
 */
(function () {
  "use strict";
  const T = window.Theory, FB = window.Fretboard, AU = window.AudioEngine, M = window.Modes, S = window.StyleLibrary;

  const cycle = T.buildCycle();
  const N = cycle.length;

  const state = {
    view: "cycle",             // cycle | prog | triads | solo | ear | styles
    // --- cycle view ---
    index: 0,
    cycleMode: "full",         // full | iiVI | pivot
    // --- progression view ---
    tonic: "D",
    modeId: "major",
    progId: "ii-V-I",
    progStep: 0,
    scaleOverlay: false,
    // --- ear trainer ---
    ear: { answer: null, score: 0, total: 0, streak: 0, best: 0, locked: false },
    // --- triads ---
    triads: { step: 0, stringSet: null, showAll: true },
    // --- solo lab ---
    solo: { section: "targets", focus: "third" },
    // --- foundation and Greek styles ---
    styles: { section: "foundation", styleId: "zeibekiko" },
    // --- scale lab ---
    lab: {
      drill: "path",           // path | cell
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
    strumStyle: "strum"
  };

  const $ = (id) => document.getElementById(id);
  const svg = () => $("fretboard");

  const PRACTICE_STEPS = [
    { view: "cycle", label: "1 · Hear", detail: "Follow the ii–V–I pivot until the next key feels inevitable." },
    { view: "prog", label: "2 · Map", detail: "Name the dromos, progression, and chord function before you play." },
    { view: "triads", label: "3 · Comp", detail: "Keep the changes close with three-note shapes and clear inversions." },
    { view: "solo", label: "4 · Solo", detail: "Use a pentatonic frame, then land on chord tones at each change." },
    { view: "ear", label: "5 · Recall", detail: "Hear the cadence and name the dromos without the neck as a crutch." }
  ];

  function renderPracticePath() {
    $("practicePath").innerHTML = PRACTICE_STEPS.map((step) =>
      `<button class="practice-step${step.view === state.view ? " active" : ""}" data-practice-view="${step.view}">${step.label}</button>`
    ).join("");
    $("practicePath").querySelectorAll("[data-practice-view]").forEach((button) => {
      button.onclick = () => setView(button.getAttribute("data-practice-view"));
    });
  }

  function renderCoachCue() {
    const step = PRACTICE_STEPS.find((item) => item.view === state.view);
    const styleStep = state.view === "styles";
    if (!step && !styleStep) return;
    let detail = step ? step.detail : "Build the general language first, then place it inside a real Greek pulse without confusing style and dromos.";
    if (state.view === "solo" && state.solo.section === "path") {
      detail = "Build clean alternate picking first; change the string break before you raise the tempo.";
    } else if (state.view === "solo" && state.solo.section === "cell") {
      detail = "Pre-hear the final note, leave space for it, then reveal and check your ear.";
    }
    $("coachCue").innerHTML = `<span>${step ? step.label : "Style lab"}</span><b>${detail}</b>`;
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

  function renderCycle() {
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
    state.modeId = id;
    state.progId = M.PROGRESSIONS[id][0].id;
    state.progStep = 0;
    syncProgControls();
    renderProg();
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
        state.progId = b.getAttribute("data-prog"); state.progStep = 0;
        syncProgControls(); renderProg(); auditionProg();
      };
    });
  }

  function stepProg(delta) {
    const { chords } = currentProgression();
    state.progStep = (state.progStep + delta + chords.length) % chords.length;
    renderProg();
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
        <button id="btnOpenSongMap" class="mini primary-mini">Open Song Map — choose the dromos</button>
      </article>`;
    $("styleExplorer").querySelectorAll("[data-style-id]").forEach((button) => {
      button.onclick = () => { state.styles.styleId = button.getAttribute("data-style-id"); renderStyles(); };
    });
    $("btnOpenSongMap").onclick = () => setView("prog");
  }

  function setStyleSection(section) {
    state.styles.section = section;
    renderStyles();
  }

  // =========================== EAR TRAINER ===============================
  function newEarQuestion() {
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

  function renderEarScore() {
    const e = state.ear;
    const pct = e.total ? Math.round((e.score / e.total) * 100) : 0;
    $("earScore").innerHTML =
      `<span><b>${e.score}</b>/${e.total} <i>(${pct}%)</i></span>
       <span>streak <b>${e.streak}</b></span><span>best <b>${e.best}</b></span>`;
  }

  // ============================ SCALE LAB ================================
  const P = window.Practice;

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
    $("labCell").classList.toggle("hidden", L.drill !== "cell");
    document.querySelectorAll("[data-drill]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-drill") === L.drill));
    L.drill === "path" ? renderLabPath() : renderLabCell();
  }

  function renderLabPath() {
    const L = state.lab;
    const path = P.buildPath(state.tonic, state.modeId, labPathOpts());
    if (!path) {
      $("readout").innerHTML = `<div class="ro-foot">No playable path here — try another position or layout.</div>`;
      return;
    }
    FB.render(svg(), {
      path: path.nodes, pathIndex: L.pathIndex,
      labelMode: state.labelMode, lefty: state.lefty,
      flavourPcs: M.flavourPcs(state.tonic, state.modeId),
      showStrokes: true
    });
    svg().setAttribute("aria-label", window.Tuning.current().name + " picking path");

    const m = path.meta;
    const mode = M.MODES[state.modeId];
    $("readout").innerHTML = `
      <div class="ro-head">
        <span class="fn-badge fn-deg">${m.layout}</span>
        <span class="ro-symbol" style="font-size:22px">${mode.name} on ${state.tonic}</span>
      </div>
      <div class="lab-stats">
        <span><b>${m.length}</b> notes</span>
        <span>frets <b>${m.lowFret}–${m.highFret}</b></span>
        <span class="x-out"><b>${m.outside}</b> outside</span>
        <span class="x-in"><b>${m.inside}</b> inside</span>
      </div>
      <div class="ro-foot">
        Strict alternate picking from a <b>${m.firstStroke}</b>stroke.
        <b class="x-out">Outside</b> crossings sweep around the pair;
        <b class="x-in">inside</b> ones trap the pick between the strings — those are
        the ones that break down first. Loose wrist, pick barely clearing the string,
        and drop the tempo until every crossing is clean.
      </div>`;
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
    AU.ensure();
    AU.playPath(path.nodes, 60 / state.bpm / 2, {
      onStep: (i) => { L.pathIndex = i; renderLabPath(); },
      onDone: () => { L.pathIndex = null; renderLabPath(); }
    });
  }

  function playLabCell() {
    const L = state.lab;
    const cells = P.buildCells(state.tonic, state.modeId, { startDegree: L.startDegree });
    const cell = cells[L.cellIdx];
    AU.ensure();
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
  function chordTone(chord, role) {
    return chord.notes.find((note) => note.role === role) || null;
  }

  function soloTargets(chord, focus) {
    const third = chordTone(chord, "3") || chordTone(chord, "b3");
    if (focus === "guide") {
      const seventh = chordTone(chord, "7") || chordTone(chord, "b7");
      // Many Greek progression-bank chords are intentionally triads. A 7th is
      // the classic jazz guide tone, but inventing one would teach the wrong
      // harmony; on a triad, pair its colour-defining 3rd with the root anchor.
      return [third, seventh || chordTone(chord, "R")].filter(Boolean);
    }
    return third ? [third] : chord.notes.slice(0, 1);
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
      roleLabel: focus === "guide" ? note.roleLabel : "now"
    })).concat(nextTargets.map((note) => Object.assign({}, note, {
      roleLabel: focus === "guide" ? note.roleLabel : "next"
    })));
    const triadPath = TR.pathThrough(chords, { startFret: 5, nameFor: spellPc });
    const shape = triadPath[idx];
    const fallbackGrip = shape ? null : FB.findGrip(cur.notes, state.position);
    const activeGrip = shape ? { placements: shape.placements } : fallbackGrip;
    const gripFrets = activeGrip ? activeGrip.placements.map((p) => p.fret) : [5];
    // A player needs a small decision window while a chord is passing, not an
    // encyclopaedia of legal dots. The Triads view remains the whole-neck map.
    const overlayRange = {
      from: Math.max(0, Math.min.apply(null, gripFrets) - 2),
      to: Math.min(FB.N_FRETS, Math.max.apply(null, gripFrets) + 2)
    };
    const pentatonic = M.pentatonicOf(state.tonic, state.modeId);

    FB.render(svg(), {
      grip: activeGrip,
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
    const targetLabel = (notes) => notes.map((note) => note.name + " (" + note.roleLabel + ")").join(" · ");
    const hasSeventhGuide = curTargets.concat(nextTargets).some((note) => note.role === "7" || note.role === "b7");
    const guideInstruction = hasSeventhGuide
      ? "Connect the 3rd and 7th with the smallest move you can hear; the line should explain the harmony even without a chord."
      : "This change uses triads: hear the 3rd as the colour, then land on the root when you want the resolution to feel final.";
    $("soloRecipe").innerHTML = `
      <div class="solo-frame"><b>${frame.name}</b><span>${pentatonic.map((note) => note.name).join(" · ")}</span></div>
      <div class="solo-targets"><span>Now · <b>${cur.symbol}</b></span><strong>${targetLabel(curTargets)}</strong>
      <span>Next · <b>${next.symbol}</b></span><strong>${targetLabel(nextTargets)}</strong></div>
      <p>${focus === "third"
        ? "Treat the pentatonic as the sentence and the 3rd as the punctuation: arrive on it when the chord changes."
        : guideInstruction}</p>`;

    $("readout").innerHTML = `
      <div class="ro-head"><span class="fn-badge fn-deg">solo</span>
      <span class="ro-symbol">${cur.symbol}</span><span class="ro-key">into ${next.symbol}</span></div>
      <div class="tri-tags"><span class="tri-inv i-${shape ? shape.inversion : 0}">${shape ? shape.inversionName : "triad"}</span>
      <span class="tri-set">${frame.name}</span></div>
      <div class="tri-move"><b>Land now:</b> ${targetLabel(curTargets)}<br />
      <b>Hear next:</b> ${targetLabel(nextTargets)}</div>
      <div class="ro-foot">Play inside the quiet five-note frame, then make the change audible by aiming for the highlighted target.</div>`;
  }

  function setSoloSection(section) {
    state.solo.section = section;
    document.body.setAttribute("data-solo-section", section);
    $("soloTargets").classList.toggle("hidden", section !== "targets");
    $("panelLab").classList.toggle("hidden", section === "targets");
    document.querySelectorAll("[data-solo-section]").forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-solo-section") === section));
    if (section === "path" || section === "cell") {
      state.lab.drill = section;
      renderLab();
    } else {
      renderSolo();
    }
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
    if (state.view === "cycle") {
      const seq = sequenceFor(state.cycleMode, state.index);
      pb = { kind: "cycle", seq, pos: Math.max(0, seq.indexOf(state.index)), barsLeft: 0, started: false };
    } else if (state.view === "prog" || state.view === "solo") {
      const { chords } = currentProgression();
      pb = { kind: "prog", len: chords.length, pos: state.progStep, started: false };
    } else {
      return;
    }

    AU.startTransport({
      bpm: state.bpm, metronome: state.metronome, strumStyle: state.strumStyle,
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
          return { notes: chord.notes };
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
        setTimeout(() => {
          state.progStep = pb.pos;
          state.view === "solo" ? renderSolo() : renderProg();
        }, delay);
        return { notes: c.notes };
      }
    });
    setPlayingUI(true);
  }

  function stopPlay() { AU.stopTransport(); setPlayingUI(false); }
  function setPlayingUI(p) {
    const b = $("btnPlay");
    b.textContent = p ? "⏸ Pause" : "▶ Play";
    b.classList.toggle("playing", p);
  }
  function togglePlay() { AU.isPlaying() ? stopPlay() : startPlay(); }

  function auditionCurrent(style) {
    AU.ensure();
    if (state.view === "cycle") AU.playChord(cycle[state.index].notes, style || state.strumStyle);
    else if (state.view === "prog" || state.view === "solo") auditionProg();
    else if (state.view === "triads") auditionTriad();
  }

  // ============================== views ==================================
  function setView(v) {
    if (v === "lab") v = "solo";   // compatibility with bookmarks from the first version
    stopPlay();
    state.view = v;
    document.body.setAttribute("data-view", v);
    document.body.setAttribute("data-solo-section", state.solo.section);
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === v));
    ["panelCycle", "panelProg", "panelEar", "panelLab", "panelTriads", "panelSolo", "panelStyles"].forEach((id) => $(id).classList.add("hidden"));
    $("stage").classList.toggle("hidden", v === "ear" || v === "styles");
    $("keymapWrap").classList.toggle("hidden", v !== "cycle");
    $("scaleStrip").classList.toggle("hidden", v !== "prog");
    $("progStrip").classList.toggle("hidden", v !== "prog");
    $("triadStrip").classList.toggle("hidden", v !== "triads");
    if (v === "cycle") { $("panelCycle").classList.remove("hidden"); renderCycle(); }
    else if (v === "prog") { $("panelProg").classList.remove("hidden"); syncProgControls(); renderProg(); }
    else if (v === "triads") { $("panelTriads").classList.remove("hidden"); syncTriadControls(); renderTriads(); }
    else if (v === "solo") { $("panelSolo").classList.remove("hidden"); setSoloSection(state.solo.section); }
    else if (v === "styles") { $("panelStyles").classList.remove("hidden"); renderStyles(); }
    else { $("panelEar").classList.remove("hidden"); renderEarScore(); }
    // renderCycle rightfully decides whether the pivot explanation is visible;
    // no other practice area should inherit that explanation from a prior view.
    if (v !== "cycle") $("pivotBanner").classList.remove("show");
    renderPracticePath();
    renderCoachCue();
  }

  // ============================= wiring ==================================
  function wire() {
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.onclick = () => setView(b.getAttribute("data-view")));

    $("btnPrev").onclick = () => {
      stopPlay();
      if (state.view === "cycle") stepCycle(-1);
      else if (state.view === "prog" || state.view === "solo") stepProg(-1);
      else if (state.view === "triads") stepTriad(-1);
      else return;
      auditionCurrent("block");
    };
    $("btnNext").onclick = () => {
      stopPlay();
      if (state.view === "cycle") stepCycle(1);
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

    document.querySelectorAll("[data-modeid]").forEach((el) =>
      el.onclick = () => selectMode(el.getAttribute("data-modeid")));

    document.querySelectorAll("[data-solo-section]").forEach((button) =>
      button.onclick = () => setSoloSection(button.getAttribute("data-solo-section")));
    document.querySelectorAll("[data-solo-focus]").forEach((button) =>
      button.onclick = () => {
        state.solo.focus = button.getAttribute("data-solo-focus");
        document.querySelectorAll("[data-solo-focus]").forEach((item) =>
          item.classList.toggle("active", item.getAttribute("data-solo-focus") === state.solo.focus));
        renderSolo();
      });

    document.querySelectorAll("[data-style-section]").forEach((button) =>
      button.onclick = () => setStyleSection(button.getAttribute("data-style-section")));

    const tonicSel = $("tonicSel");
    tonicSel.innerHTML = M.TONICS.map((t) =>
      `<option value="${t}"${t === state.tonic ? " selected" : ""}>${t}</option>`).join("");
    tonicSel.onchange = (e) => {
      state.tonic = e.target.value;
      state.view === "prog" ? renderProg() : null;
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
    $("btnTriadPrev").onclick = () => stepTriad(-1);
    $("btnTriadNext").onclick = () => stepTriad(1);

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
    $("btnLabPlay").onclick = () => state.lab.drill === "path" ? playLabPath() : playLabCell();
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
    document.querySelectorAll("[data-guess]").forEach((b) =>
      b.onclick = () => submitGuess(b.getAttribute("data-guess")));

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (state.view === "ear") playEarPrompt();
        else if (state.view === "solo" && state.solo.section !== "targets") $("btnLabPlay").click();
        else if (state.view !== "styles") togglePlay();
      }
      else if (e.code === "ArrowRight" && state.view === "triads") { e.preventDefault(); stepTriad(1); }
      else if (e.code === "ArrowLeft" && state.view === "triads") { e.preventDefault(); stepTriad(-1); }
      else if (e.code === "ArrowRight") { e.preventDefault(); state.view === "solo" && state.solo.section !== "targets" ? (state.lab.drill === "cell" ? stepCell(1) : shiftPosition(1)) : $("btnNext").click(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); state.view === "solo" && state.solo.section !== "targets" ? (state.lab.drill === "cell" ? stepCell(-1) : shiftPosition(-1)) : $("btnPrev").click(); }
      else if (e.key === "1") setView("cycle");
      else if (e.key === "2") setView("prog");
      else if (e.key === "3") setView("triads");
      else if (e.key === "4") setView("solo");
      else if (e.key === "5") setView("ear");
      else if (e.key === "6") setView("styles");
      else if (e.key.toLowerCase() === "r" && state.view === "solo" && state.solo.section === "cell") $("btnReveal").click();
    });
  }

  function rerender() {
    if (state.view === "cycle") renderCycle();
    else if (state.view === "prog") renderProg();
    else if (state.view === "solo") state.solo.section === "targets" ? renderSolo() : renderLab();
    else if (state.view === "triads") { syncTriadControls(); renderTriads(); }
    else if (state.view === "styles") renderStyles();
  }

  function showTestBadge() {
    const suites = [T.selfTest(), M.selfTest(), S.selfTest(), P.selfTest(), TR.selfTest()];
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
    setView("cycle");
  });
})();
