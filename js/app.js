/* app.js — views, wiring, animation, playback sync, shortcuts.
 * Implements FR-04..07, FR-11, FR-12, FR-15. See docs/REQUIREMENTS.md.
 */
(function () {
  "use strict";
  const T = window.Theory, FB = window.Fretboard, AU = window.AudioEngine, M = window.Modes;

  const cycle = T.buildCycle();
  const N = cycle.length;

  const state = {
    view: "cycle",             // cycle | prog | ear
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
    } else {
      const { chords } = currentProgression();
      pb = { kind: "prog", len: chords.length, pos: state.progStep, started: false };
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
        setTimeout(() => { state.progStep = pb.pos; renderProg(); }, delay);
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
    else auditionProg();
  }

  // ============================== views ==================================
  function setView(v) {
    stopPlay();
    state.view = v;
    document.body.setAttribute("data-view", v);
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === v));
    ["panelCycle", "panelProg", "panelEar"].forEach((id) => $(id).classList.add("hidden"));
    $("stage").classList.toggle("hidden", v === "ear");
    $("keymapWrap").classList.toggle("hidden", v !== "cycle");
    $("scaleStrip").classList.toggle("hidden", v !== "prog");
    $("progStrip").classList.toggle("hidden", v !== "prog");
    if (v === "cycle") { $("panelCycle").classList.remove("hidden"); renderCycle(); }
    else if (v === "prog") { $("panelProg").classList.remove("hidden"); syncProgControls(); renderProg(); }
    else { $("panelEar").classList.remove("hidden"); renderEarScore(); }
  }

  // ============================= wiring ==================================
  function wire() {
    document.querySelectorAll("[data-view]").forEach((b) =>
      b.onclick = () => setView(b.getAttribute("data-view")));

    $("btnPrev").onclick = () => { stopPlay(); state.view === "cycle" ? stepCycle(-1) : stepProg(-1); auditionCurrent("block"); };
    $("btnNext").onclick = () => { stopPlay(); state.view === "cycle" ? stepCycle(1) : stepProg(1); auditionCurrent(); };
    $("btnPlay").onclick = togglePlay;
    $("btnStrum").onclick = () => auditionCurrent("strum");
    $("btnArp").onclick = () => auditionCurrent("arp");
    $("btnShift").onclick = () => {
      const anchors = [null, 0, 3, 5, 7, 9];
      state.position = anchors[(anchors.indexOf(state.position) + 1) % anchors.length];
      $("btnShift").textContent = "Position: " + (state.position == null ? "auto" : state.position);
      state.view === "cycle" ? renderCycle() : renderProg();
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

    const tonicSel = $("tonicSel");
    tonicSel.innerHTML = M.TONICS.map((t) =>
      `<option value="${t}"${t === state.tonic ? " selected" : ""}>${t}</option>`).join("");
    tonicSel.onchange = (e) => {
      state.tonic = e.target.value;
      state.view === "prog" ? renderProg() : null;
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

    $("btnEarNew").onclick = newEarQuestion;
    $("btnEarReplay").onclick = () => { if (state.ear.answer) playEarPrompt(); else newEarQuestion(); };
    document.querySelectorAll("[data-guess]").forEach((b) =>
      b.onclick = () => submitGuess(b.getAttribute("data-guess")));

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") { e.preventDefault(); state.view === "ear" ? playEarPrompt() : togglePlay(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); $("btnNext").click(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); $("btnPrev").click(); }
      else if (e.key === "1") setView("cycle");
      else if (e.key === "2") setView("prog");
      else if (e.key === "3") setView("ear");
    });
  }

  function rerender() { state.view === "cycle" ? renderCycle() : state.view === "prog" ? renderProg() : null; }

  function showTestBadge() {
    const a = T.selfTest(), b = M.selfTest();
    const ok = a.ok && b.ok;
    const el = $("testBadge");
    const nPass = a.results.filter(x => x.pass).length + b.results.filter(x => x.pass).length;
    const nAll = a.results.length + b.results.length;
    el.textContent = ok ? `✓ ${nPass}/${nAll} theory tests passing` : `✗ theory tests FAILED (${nPass}/${nAll})`;
    el.className = "test-badge " + (ok ? "ok" : "fail");
    if (!ok) console.error("Failures:", a.results.concat(b.results).filter((x) => !x.pass));
  }

  document.addEventListener("DOMContentLoaded", () => {
    wire();
    showTestBadge();
    $("bpm").value = state.bpm; $("bpmVal").textContent = state.bpm;
    setView("cycle");
  });
})();
