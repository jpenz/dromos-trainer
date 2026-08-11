/* app.js — UI wiring, modes, animation, playback sync, shortcuts. */
(function () {
  "use strict";
  const T = window.Theory, FB = window.Fretboard, AU = window.AudioEngine;

  const cycle = T.buildCycle();
  const N = cycle.length;

  const state = {
    index: 0,
    mode: "full",          // full | iiVI | pivot
    labelMode: "interval", // interval | note
    ghosts: false,
    lefty: false,
    position: null,        // preferred neck position for grips (null = auto)
    bpm: 84,
    metronome: false,
    holdI: true,           // I chord lasts two bars
    loop: true,
    strumStyle: "strum"
  };

  // ---- element refs -------------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const svg = $("fretboard");
  const readout = $("readout");
  const keymap = $("keymap");
  const pivotBanner = $("pivotBanner");

  // ---- mode sequences -----------------------------------------------------
  function sequenceFor(mode, idx) {
    if (mode === "iiVI") {
      const g = Math.floor(idx / 3) * 3;
      return [g, g + 1, g + 2];
    }
    if (mode === "pivot") {
      // only I and ii chords, in order -> highlights each pivot
      return cycle.map((c, i) => i).filter((i) => cycle[i].fn !== "V");
    }
    return cycle.map((_, i) => i); // full
  }

  function step(delta) {
    const seq = sequenceFor(state.mode, state.index);
    let pos = seq.indexOf(state.index);
    if (pos < 0) pos = 0;
    pos = (pos + delta + seq.length) % seq.length;
    setIndex(seq[pos]);
  }

  // ---- render -------------------------------------------------------------
  function prevIndex(i) { return (i - 1 + N) % N; }

  function render() {
    const cur = cycle[state.index];
    const prev = cycle[prevIndex(state.index)];
    const moveClass = T.transition(prev, cur);   // per-voice held/moved (low->high)
    const grip = FB.findGrip(cur.notes, state.position);
    const allPositions = state.ghosts ? FB.allTonePositions(cur.notes) : null;

    FB.render(svg, {
      grip, ghosts: state.ghosts, allPositions,
      labelMode: state.labelMode, keyAcc: cur.keyAcc,
      lefty: state.lefty, moveClass
    });

    renderReadout(cur, prev, moveClass);
    renderKeymap(cur);

    const pivot = T.isPivot(prev, cur);
    pivotBanner.classList.toggle("show", pivot);
    if (pivot) pivotBanner.textContent = `PIVOT · ${prev.symbol} becomes ${cur.symbol} — the I of ${prev.key} is now the ii of ${cur.key}`;

    // pulse the moved dots
    requestAnimationFrame(() => {
      svg.querySelectorAll(".fb-dot.moved").forEach((n) => {
        n.classList.remove("flash"); void n.getBBox(); n.classList.add("flash");
      });
    });
  }

  function renderReadout(cur, prev, moveClass) {
    const fnClass = { ii: "fn-ii", V: "fn-v", I: "fn-i" }[cur.fn];
    let html = "";
    html += `<div class="ro-head">`;
    html += `<span class="fn-badge ${fnClass}">${cur.fn}</span>`;
    html += `<span class="ro-symbol">${cur.symbol}</span>`;
    html += `<span class="ro-key">key of ${cur.key}</span>`;
    html += `</div>`;

    html += `<div class="ro-notes">`;
    // display high -> low so it reads like the fretboard (top string first)
    cur.notes.slice().reverse().forEach((n, ri) => {
      const vi = cur.notes.length - 1 - ri;
      const cls = moveClass[vi];
      const guide = (n.role === "3" || n.role === "b3" || n.role === "7" || n.role === "b7") ? " guide" : "";
      html += `<div class="note-chip ${cls}${guide}" data-group="${n.colorGroup}">`;
      html += `<span class="chip-role">${n.roleLabel}</span>`;
      html += `<span class="chip-name">${n.name}</span>`;
      html += cls === "moved" ? `<span class="chip-tag">moved ↓</span>` : (cls === "held" ? `<span class="chip-tag held">held</span>` : "");
      html += `</div>`;
    });
    html += `</div>`;
    html += `<div class="ro-foot">Guide tones (3rd &amp; 7th) drive the motion · two voices hold, two step down</div>`;
    readout.innerHTML = html;
  }

  function renderKeymap(cur) {
    const keys = ["C", "B♭", "A♭", "G♭", "E", "D"];
    keymap.innerHTML = keys.map((k) =>
      `<span class="key-node${k === cur.key ? " active" : ""}">${k}</span>`
    ).join('<span class="key-arrow">→</span>');
  }

  function setIndex(i) {
    state.index = ((i % N) + N) % N;
    render();
  }

  // ---- playback -----------------------------------------------------------
  let pb = null;
  const btnPlay = () => $("btnPlay");

  function barsFor(c) { return state.holdI && c.fn === "I" ? 2 : 1; }

  function startPlay() {
    AU.ensure();
    const seq = sequenceFor(state.mode, state.index);
    let pos = Math.max(0, seq.indexOf(state.index));
    pb = { seq, pos, barsLeft: 0, started: false };

    AU.startTransport({
      bpm: state.bpm,
      metronome: state.metronome,
      strumStyle: state.strumStyle,
      onStop: () => setPlayingUI(false),
      onBar: (bar, when, now) => {
        if (pb.barsLeft > 0) { pb.barsLeft--; return { hold: true }; }
        // advance to next chord (except first bar)
        if (pb.started) {
          const nextPos = pb.pos + 1;
          if (nextPos >= pb.seq.length && !state.loop) return null; // stop at end
          pb.pos = nextPos % pb.seq.length;
        }
        pb.started = true;
        const idx = pb.seq[pb.pos];
        const chord = cycle[idx];
        pb.barsLeft = barsFor(chord) - 1;
        // sync the visuals to the audio time
        const delay = Math.max(0, (when - now) * 1000);
        setTimeout(() => setIndex(idx), delay);
        return { notes: chord.notes };
      }
    });
    setPlayingUI(true);
  }

  function stopPlay() { AU.stopTransport(); setPlayingUI(false); }

  function setPlayingUI(playing) {
    const b = btnPlay();
    b.textContent = playing ? "⏸ Pause" : "▶ Play";
    b.classList.toggle("playing", playing);
    document.body.classList.toggle("is-playing", playing);
  }

  function togglePlay() { AU.isPlaying() ? stopPlay() : startPlay(); }

  // audition current chord (no transport)
  function auditionCurrent(style) {
    AU.ensure();
    AU.playChord(cycle[state.index].notes, style || state.strumStyle);
  }

  // ---- controls wiring ----------------------------------------------------
  function wire() {
    $("btnPrev").onclick = () => { stopPlay(); step(-1); auditionCurrent("block"); };
    $("btnNext").onclick = () => { stopPlay(); step(1); auditionCurrent(); };
    btnPlay().onclick = () => togglePlay();
    $("btnStrum").onclick = () => auditionCurrent("strum");
    $("btnArp").onclick = () => auditionCurrent("arp");

    $("btnShift").onclick = () => {
      // cycle preferred neck position through a few useful anchors
      const anchors = [null, 0, 3, 5, 7, 9];
      const i = anchors.indexOf(state.position);
      state.position = anchors[(i + 1) % anchors.length];
      $("btnShift").textContent = "Position: " + (state.position == null ? "auto" : state.position);
      render();
    };

    document.querySelectorAll("[data-mode]").forEach((el) => {
      el.onclick = () => {
        document.querySelectorAll("[data-mode]").forEach((x) => x.classList.remove("active"));
        el.classList.add("active");
        state.mode = el.getAttribute("data-mode");
        if (AU.isPlaying()) { stopPlay(); startPlay(); }
        render();
      };
    });

    $("tglLabel").onchange = (e) => { state.labelMode = e.target.checked ? "note" : "interval"; render(); };
    $("tglGhost").onchange = (e) => { state.ghosts = e.target.checked; render(); };
    $("tglLefty").onchange = (e) => { state.lefty = e.target.checked; render(); };
    $("tglMetro").onchange = (e) => { state.metronome = e.target.checked; AU.setMetronome(state.metronome); };
    $("tglLoop").onchange = (e) => { state.loop = e.target.checked; };
    $("tglHoldI").onchange = (e) => { state.holdI = e.target.checked; };

    const bpm = $("bpm");
    bpm.oninput = (e) => {
      state.bpm = +e.target.value;
      $("bpmVal").textContent = state.bpm;
      AU.setBpm(state.bpm);
    };

    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" && e.target.type !== "range") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      else if (e.code === "ArrowRight") { e.preventDefault(); stopPlay(); step(1); auditionCurrent(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); stopPlay(); step(-1); auditionCurrent("block"); }
      else if (e.key.toLowerCase() === "l") { const t = $("tglLoop"); t.checked = !t.checked; state.loop = t.checked; }
    });
  }

  // ---- self test badge ----------------------------------------------------
  function showTestBadge() {
    const r = T.selfTest();
    const el = $("testBadge");
    if (!el) return;
    el.textContent = r.ok ? "✓ theory self-test passing" : "✗ theory self-test FAILED (see console)";
    el.className = "test-badge " + (r.ok ? "ok" : "fail");
    if (!r.ok) console.error("Theory self-test failures:", r.results.filter((x) => !x.pass));
  }

  document.addEventListener("DOMContentLoaded", () => {
    wire();
    showTestBadge();
    setIndex(0);
    $("bpmVal").textContent = state.bpm;
    $("bpm").value = state.bpm;
  });
})();
