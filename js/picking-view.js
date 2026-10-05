/* picking-view.js — the Picking Lab practice surface (FR-79).
 *
 * Two pictures of the same line:
 *   - a zoomed neck: where the hand sits (a four-fret box with the fingers
 *     numbered), the note sounding now, and the next three notes;
 *   - a tab strip: this bar and the next, with pick stroke, fret, finger
 *     and count for every note, and a flag wherever the hand moves.
 *
 * Pure rendering. The app supplies the events, PickingLab.assignFingers
 * supplies the fingering and PickingLab.timeline supplies the bars.
 */
(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
  const DOUBLE_MARKERS = [12, 24];
  const AHEAD = 3;

  function el(tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach((key) => node.setAttribute(key, attrs[key]));
    if (text != null) node.textContent = text;
    return node;
  }

  const tonesOf = (node) => (node && node.chord && node.chord.length ? node.chord : [node]);

  // The neck shows the frets the whole line uses (at least eight), so the
  // picture never jumps while the hand travels inside it.
  function fretRange(nodes, maxFret) {
    let lo = Infinity, hi = -Infinity;
    nodes.forEach((node) => tonesOf(node).forEach((tone) => {
      if (tone.fret > 0) { lo = Math.min(lo, tone.fret); hi = Math.max(hi, tone.fret); }
    }));
    if (lo === Infinity) { lo = 1; hi = 1; }
    let first = Math.max(1, lo - 1);
    let last = Math.min(maxFret || 24, Math.max(hi + 1, first + 7));
    if (last - first < 7) first = Math.max(1, last - 7);
    return { first, last };
  }

  function renderNeck(svg, view) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const names = view.names;
    const N = names.length;
    const W = 1000, padL = 64, padR = 18, top = 50;
    const gap = N > 4 ? 27 : 33;
    const { first, last } = fretRange(view.nodes, view.maxFret);
    const colW = (W - padL - padR) / (last - first + 1);
    const bottom = top + (N - 1) * gap;
    const H = bottom + 46;
    const flip = (x) => (view.lefty ? W - x : x);
    const edge = (fret) => flip(padL + (fret - first) * colW);
    const fx = (fret) => flip(fret <= 0 ? padL - 24 : padL + (fret - first + 0.5) * colW);
    const sy = (stringIndex) => top + (N - 1 - stringIndex) * gap;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("data-neck-layout", "focus");
    svg.setAttribute("data-neck-emphasis", "large");
    const g = el("g", { class: "pv" });
    g.appendChild(el("rect", {
      x: Math.min(edge(first), edge(last + 1)), y: top - 13, width: (last - first + 1) * colW,
      height: (N - 1) * gap + 26, rx: 4, class: "fb-face"
    }));
    MARKERS.filter((fret) => fret >= first && fret <= last).forEach((fret) =>
      g.appendChild(el("circle", { cx: fx(fret), cy: (top + bottom) / 2, r: 6, class: "fb-inlay" })));
    DOUBLE_MARKERS.filter((fret) => fret >= first && fret <= last).forEach((fret) => {
      g.appendChild(el("circle", { cx: fx(fret), cy: top + gap / 2, r: 6, class: "fb-inlay" }));
      g.appendChild(el("circle", { cx: fx(fret), cy: bottom - gap / 2, r: 6, class: "fb-inlay" }));
    });
    for (let fret = first; fret <= last + 1; fret++) {
      g.appendChild(el("line", {
        x1: edge(fret), y1: top - 13, x2: edge(fret), y2: bottom + 13,
        class: fret === 1 && first === 1 ? "fb-fret pv-nut" : "fb-fret"
      }));
    }
    for (let fret = first; fret <= last; fret++) {
      const marked = MARKERS.indexOf(fret) >= 0 || DOUBLE_MARKERS.indexOf(fret) >= 0;
      g.appendChild(el("text", { x: fx(fret), y: H - 12, "text-anchor": "middle", class: "pv-fretnum" + (marked ? " marked" : "") }, String(fret)));
    }
    let hasOpen = false;
    const seen = new Set();
    names.forEach((name, stringIndex) => {
      g.appendChild(el("line", {
        x1: flip(padL - 44), y1: sy(stringIndex), x2: flip(W - padR), y2: sy(stringIndex),
        class: "fb-string", "stroke-width": (1.1 + (N - 1 - stringIndex) * 0.45).toFixed(2)
      }));
      g.appendChild(el("text", { x: flip(18), y: sy(stringIndex) + 5, "text-anchor": "middle", class: "pv-course" }, name));
    });
    // The ghost map: every note of the line, or of the current road only.
    const mapped = view.roadIndex == null ? view.nodes : view.nodes.filter((node) => node.roadIndex === view.roadIndex);
    view.nodes.forEach((node) => tonesOf(node).forEach((tone) => { if (tone.fret <= 0) hasOpen = true; }));
    mapped.forEach((node) => tonesOf(node).forEach((tone) => {
      if (tone.fret == null || tone.stringIndex == null) return;
      const key = tone.stringIndex + ":" + tone.fret;
      if (seen.has(key)) return;
      seen.add(key);
      const tint = view.colour ? view.colour(tone) : "";
      const ghost = el("g", { class: "pv-ghost " + tint });
      if (/flavour/.test(tint)) ghost.appendChild(el("circle", { cx: fx(tone.fret), cy: sy(tone.stringIndex), r: 11, class: "pv-ghost-ring" }));
      ghost.appendChild(el("circle", { cx: fx(tone.fret), cy: sy(tone.stringIndex), r: 7 }));
      g.appendChild(ghost);
    }));
    if (hasOpen) g.appendChild(el("text", { x: fx(0), y: H - 12, "text-anchor": "middle", class: "pv-fretnum" }, "open"));
    const live = el("g", { class: "pv-live" });
    g.appendChild(live);
    svg.appendChild(g);
    svg.__pv = { view, live, edge, fx, sy, first, last, top, bottom, gap, colW, N };
    setNeckIndex(svg, view.index == null ? null : view.index);
  }

  function drawHand(pv, base, next, current) {
    const lo = Math.max(pv.first, base), hi = Math.min(pv.last, base + 3);
    if (hi < lo) return;
    const x0 = Math.min(pv.edge(lo), pv.edge(hi + 1));
    const width = Math.abs(pv.edge(hi + 1) - pv.edge(lo));
    pv.live.appendChild(el("rect", {
      x: x0 + 2, y: pv.top - 21, width: width - 4, height: (pv.N - 1) * pv.gap + 42, rx: 12,
      class: "pv-hand" + (next ? " next" : "")
    }));
    if (next) {
      // Label the part of the next box that the current box does not cover.
      const free = [];
      for (let fret = lo; fret <= hi; fret++) if (current == null || fret < current || fret > current + 3) free.push(fret);
      const span = free.length ? free : [lo, hi];
      const x = (pv.fx(span[0]) + pv.fx(span[span.length - 1])) / 2;
      pv.live.appendChild(el("text", { x, y: pv.top - 28, "text-anchor": "middle", class: "pv-hand-label next" }, `next: fret ${base}`));
      return;
    }
    for (let finger = 1; finger <= 4; finger++) {
      const fret = base + finger - 1;
      if (fret < pv.first || fret > pv.last) continue;
      pv.live.appendChild(el("text", { x: pv.fx(fret), y: pv.top - 28, "text-anchor": "middle", class: "pv-hand-label" }, String(finger)));
    }
  }

  function dotLabel(view, index, toneIndex) {
    const slot = view.fingers[index] || {};
    if (slot.fingers && slot.fingers[toneIndex] != null) return String(slot.fingers[toneIndex]);
    if (slot.finger != null) return String(slot.finger);
    const node = view.nodes[index];
    const tone = tonesOf(node)[toneIndex] || node;
    return tone.fret === 0 ? "0" : String((tone.note && (tone.note.roleLabel || tone.note.degree)) || "");
  }

  // Move the playhead: redraw only the live layer (hand box, now, next three).
  function setNeckIndex(svg, index) {
    const pv = svg && svg.__pv;
    if (!pv) return;
    const { view, live } = pv;
    while (live.firstChild) live.removeChild(live.firstChild);
    const count = view.nodes.length;
    if (!count) return;
    const wrap = (value) => ((value % count) + count) % count;
    const anchor = index == null ? 0 : wrap(index);
    const hand = (view.fingers[anchor] || {}).base;
    if (hand) drawHand(pv, hand, false);
    for (let step = 1; step <= 8 && step < count; step++) {
      const slot = view.fingers[wrap(anchor + step)] || {};
      if (slot.base && hand && slot.base !== hand) { drawHand(pv, slot.base, true, hand); break; }
    }
    const ahead = [];
    for (let step = index == null ? 0 : 1; ahead.length < Math.min(AHEAD + (index == null ? 1 : 0), count - (index == null ? 0 : 1)); step++) ahead.push(wrap(anchor + step));
    const centre = (i) => { const node = view.nodes[i]; return { x: pv.fx(node.fret), y: pv.sy(node.stringIndex) }; };
    const thread = (index == null ? [] : [anchor]).concat(ahead).map((i) => { const point = centre(i); return `${point.x.toFixed(1)},${point.y.toFixed(1)}`; });
    if (thread.length > 1) live.appendChild(el("polyline", { points: thread.join(" "), class: "pv-thread" }));
    const drawn = new Set();
    const drawDot = (i, cls, radius) => {
      const node = view.nodes[i];
      tonesOf(node).forEach((tone, toneIndex) => {
        if (tone.fret == null || tone.stringIndex == null) return;
        const key = cls + ":" + tone.stringIndex + ":" + tone.fret;
        if (drawn.has(key)) return;
        drawn.add(key);
        const tint = view.colour ? view.colour(tone) : "";
        const group = el("g", { class: "pv-dot " + cls + (node.silent ? " silent" : "") + (tint ? " " + tint : "") });
        if (/flavour/.test(tint)) group.appendChild(el("circle", { cx: pv.fx(tone.fret), cy: pv.sy(tone.stringIndex), r: radius + 6, class: "pv-flavour-ring" }));
        group.appendChild(el("circle", { cx: pv.fx(tone.fret), cy: pv.sy(tone.stringIndex), r: radius }));
        group.appendChild(el("text", { x: pv.fx(tone.fret), y: pv.sy(tone.stringIndex) + radius * 0.36, "text-anchor": "middle" }, dotLabel(view, i, toneIndex)));
        live.appendChild(group);
      });
    };
    ahead.slice().reverse().forEach((i, reversed) => {
      const rank = ahead.length - reversed;                // 1 = the very next note
      drawDot(i, "up up-" + Math.min(3, rank) + (index == null && rank === 1 ? " start" : ""), rank === 1 ? 14 : 11);
    });
    if (index != null) {
      drawDot(anchor, "now", 17);
      const node = view.nodes[anchor];
      const point = centre(anchor);
      if (node.stroke) {
        live.appendChild(el("text", {
          x: point.x + (view.lefty ? -27 : 27), y: point.y + 7, "text-anchor": "middle", class: "pv-stroke s-" + node.stroke
        }, node.stroke === "down" ? "↓" : "↑"));
      }
    }
    // On a narrow screen the neck scrolls sideways: keep the action in view.
    const holder = svg.parentElement;
    if (holder && holder.scrollWidth > holder.clientWidth + 4) {
      const point = centre(index == null ? ahead[0] != null ? ahead[0] : 0 : anchor);
      const target = point.x / 1000 * holder.scrollWidth - holder.clientWidth / 2;
      if (Math.abs(holder.scrollLeft - target) > holder.clientWidth * 0.3) holder.scrollLeft = Math.max(0, target);
    }
  }

  // ---- Tab strip -----------------------------------------------------------
  function barsWanted(time) {
    return time.barSlots <= 4 ? 4 : time.barSlots <= 6 ? 3 : 2;
  }

  function tabBars(time, index) {
    const bar = index == null ? 0 : time.starts[index].bar;
    const count = Math.min(time.barCount, barsWanted(time));
    return Array.from({ length: count }, (_, offset) => (bar + offset) % time.barCount);
  }

  function eventCell(view, i, index, nowBar) {
    const esc = view.escape;
    const node = view.nodes[i];
    const start = view.time.starts[i];
    const slot = view.fingers[i] || {};
    const N = view.names.length;
    const strum = node.chord && node.chord.length > 2;
    const rest = node.silent && !node.stroke;
    const byCourse = {};
    tonesOf(node).forEach((tone) => { if (tone.stringIndex != null) byCourse[tone.stringIndex] = tone; });
    let rows = "";
    for (let row = 0; row < N; row++) {
      const tone = byCourse[N - 1 - row];
      const tint = tone && view.colour && !strum ? view.colour(tone) : "";
      rows += `<span class="pt-str">${tone && !rest ? `<b class="${tint}">${node.mute ? "x" : tone.fret}</b>` : ""}</span>`;
    }
    const tint = !strum && !rest && view.colour ? view.colour(node) : "";
    const finger = slot.fingers ? slot.fingers.slice().reverse().join("·") : slot.finger != null && !rest ? String(slot.finger) : "";
    const flags = [];
    if (node.roadStart && node.roadShort) flags.push(esc(node.roadShort));
    if ((node.chordStart || node.barStart) && node.chordSymbol && node.chordSymbol !== node.roadShort) flags.push(esc(node.chordSymbol));
    if (slot.shift) flags.push(`⇢${slot.base}`);
    if (node.cueShort) flags.push(esc(node.cueShort));
    const note = node.note || {};
    const role = strum || rest ? "" : esc(note.roleLabel || note.degree || "");
    const grow = Math.max(0.25, Math.min(start.dur, view.time.barSlots - start.slot));
    const cls = "ptab-ev" + (node.accent ? " accent" : "") + (node.rhythmFirst ? " on-one" : node.rhythmBeat ? " on-beat" : "")
      + (i === index ? " current" : "") + (index != null && start.bar === nowBar && i < index ? " played" : "")
      + (node.silent ? " silent" : "") + (slot.shift ? " shift" : "") + (slot.stretch ? " stretch" : "") + (node.roadStart ? " road-start" : "") + (node.cue ? " cued" : "");
    return `<button type="button" data-picking-step="${i}" class="${cls}" style="flex:${grow} 1 0" aria-label="${esc(view.label(node, i, slot))}">`
      + `<span class="pt-flag">${flags.join(" ")}</span>`
      + `<span class="pt-stroke${node.stroke ? " s-" + node.stroke : ""}">${rest ? "rest" : esc(view.glyph(node))}</span>`
      + rows
      + `<span class="pt-finger">${esc(finger)}</span>`
      + `<span class="pt-deg ${tint}">${role}</span>`
      + `<span class="pt-count${node.rhythmFirst ? " one" : ""}">${node.rhythmBeat ? node.rhythmBeat : "·"}</span>`
      + `</button>`;
  }

  function tabMarkup(view, index) {
    const esc = view.escape;
    const time = view.time;
    const bars = tabBars(time, index);
    const gutter = `<div class="ptab-gutter" aria-hidden="true"><span class="pt-head"></span><span class="pt-flag"></span><span class="pt-stroke">pick</span>`
      + view.names.slice().reverse().map((name) => `<span class="pt-str">${esc(name)}</span>`).join("")
      + `<span class="pt-finger">finger</span><span class="pt-deg">note</span><span class="pt-count">count</span></div>`;
    const body = bars.map((bar, offset) => {
      const ids = time.bars[bar];
      const lead = ids.length ? time.starts[ids[0]].slot : time.barSlots;
      let cells = lead > 1e-6 ? `<span class="ptab-ring" style="flex:${lead} 1 0">let it ring</span>` : "";
      ids.forEach((i) => { cells += eventCell(view, i, index, bars[0]); });
      const tag = offset === 0 ? (index == null ? "Start" : "Now") : offset === 1 ? "Next" : "Then";
      return `<section class="ptab-bar${offset === 0 ? " now" : ""}" data-bar="${bar}" style="--slots:${time.barSlots}">`
        + `<header class="pt-head"><b>${tag}</b> bar ${bar + 1} of ${time.barCount}</header><div class="ptab-cells">${cells}</div></section>`;
    }).join("");
    return { bar: bars[0], html: `<div class="ptab" style="--courses:${view.names.length}">${gutter}<div class="ptab-bars">${body}</div></div>` };
  }

  // Per-note update: toggle classes inside the current bar; rebuild only
  // when the playhead enters a new bar.
  function updateTab(host, view, index) {
    if (!host) return false;
    const bar = index == null ? 0 : view.time.starts[index].bar;
    if (host.getAttribute("data-bar") !== String(bar) || !host.firstChild || index == null) {
      const markup = tabMarkup(view, index);
      host.innerHTML = markup.html;
      host.setAttribute("data-bar", String(markup.bar));
      return true;
    }
    host.querySelectorAll(".ptab-bar.now .ptab-ev").forEach((cell) => {
      const i = +cell.getAttribute("data-picking-step");
      cell.classList.toggle("current", i === index);
      cell.classList.toggle("played", i < index);
    });
    return false;
  }

  function selfTest() {
    const results = [];
    const check = (name, pass) => results.push({ name, pass: !!pass, detail: "" });
    const line = [3, 5, 7, 8, 10, 12].map((fret) => ({ stringIndex: 0, fret }));
    const range = fretRange(line, 24);
    check("the neck shows every fret the line uses", range.first <= 3 && range.last >= 12);
    check("a one-note drill still shows eight frets", (() => { const one = fretRange([{ stringIndex: 0, fret: 6 }], 24); return one.last - one.first >= 7; })());
    const time = { barSlots: 4, barCount: 6, starts: [{ bar: 5, slot: 0, dur: 1 }], bars: [[], [], [], [], [], [0]] };
    check("the tab window wraps to the first bar at the loop seam", tabBars(time, 0).join(",") === "5,0,1,2");
    check("a long bar shows now and next", barsWanted({ barSlots: 18 }) === 2);
    return { ok: results.every((result) => result.pass), results };
  }

  window.PickingView = { renderNeck, setNeckIndex, tabMarkup, updateTab, fretRange, tabBars, selfTest };
})();
