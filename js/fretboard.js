/* fretboard.js — grip finding + SVG rendering. Exposes window.Fretboard. */
(function () {
  "use strict";

  // Neck geometry comes from window.Tuning (MI-12) — never hardcode 6 strings.
  const open = () => window.Tuning.open();
  const openNames = () => window.Tuning.names();
  const nStrings = () => window.Tuning.count();
  const nFrets = () => window.Tuning.frets();
  // Every ascending choice of n strings out of 6. Contiguous sets are preferred by
  // the scorer, but string-skipping is genuinely idiomatic for drop voicings — and
  // some voicings (e.g. a close-position dom7 with the 5th in the bass) are simply
  // unplayable without it.
  function stringSets(n, total) {
    const N = total == null ? nStrings() : total;
    const out = [];
    if (n > N) return out;
    (function pick(start, acc) {
      if (acc.length === n) { out.push(acc.slice()); return; }
      for (let s = start; s < N; s++) { acc.push(s); pick(s + 1, acc); acc.pop(); }
    })(0, []);
    return out;
  }

  function skipPenalty(set) {
    let gaps = 0;
    for (let i = 1; i < set.length; i++) gaps += set[i] - set[i - 1] - 1;
    return gaps;
  }
  const MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
  const DOUBLE_MARKERS = [12, 24];

  // Find a compact, playable grip for a voicing.
  // voicing: array of note objects (low->high) each with {pc, role, ...}.
  // Returns { placements: [{stringIndex, fret, note}], span } or null.
  function search(voicing, preferredPos, maxSpan) {
    const OPEN = open();
    const pcs = voicing.map((n) => n.pc);
    const n = voicing.length;
    let best = null;

    stringSets(n).forEach((set) => {
      const skips = skipPenalty(set);
      for (let basePos = 0; basePos <= nFrets() - maxSpan; basePos++) {
        const frets = [];
        let prevPitch = -Infinity;
        let ok = true;
        for (let k = 0; k < n; k++) {
          const s = set[k];
          let chosen = null;
          for (let f = basePos; f <= basePos + maxSpan; f++) {
            if (((OPEN[s] + f) % 12 + 12) % 12 === pcs[k]) {
              const pitch = OPEN[s] + f;
              if (pitch > prevPitch) { chosen = f; break; }
            }
          }
          if (chosen === null) { ok = false; break; }
          frets.push(chosen);
          prevPitch = OPEN[s] + frets[k];
        }
        if (!ok) continue;
        const span = Math.max(...frets) - Math.min(...frets);
        const lowFret = Math.min(...frets);
        const posDist = preferredPos == null ? 0 : Math.abs(lowFret - preferredPos);
        // compact first, then contiguous, then near the preferred position
        const score = span * 3 + skips * 2 + posDist + lowFret * 0.05;
        if (!best || score < best.score) {
          best = {
            score, span, lowFret, skips,
            placements: set.map((s, k) => ({
              stringIndex: s, fret: frets[k], note: voicing[k]
            }))
          };
        }
      }
    });
    return best;
  }

  // Widen the stretch until something is playable. A close-position dom7 with the
  // 5th in the bass needs 5 frets; nothing should ever render an empty neck.
  // Drop the least essential voice: the 5th first, then the root. The guide
  // tones (3rd and 7th) are what carry the harmony, so they go last.
  function dropOne(v) {
    const order = ["5", "b5", "#5", "R"];
    let idx = -1;
    for (const role of order) {
      idx = v.findIndex((n) => n.role === role);
      if (idx >= 0) break;
    }
    if (idx < 0) idx = 0;
    return v.slice(0, idx).concat(v.slice(idx + 1));
  }

  // Widen the stretch, then thin the voicing, until something is playable.
  // A close-position dom7 with the 5th in the bass needs 5 frets on a guitar and
  // does not fit a 4-course bouzouki at all — but nothing may render an empty
  // neck (MI-10), so we always degrade rather than fail.
  function findGrip(voicing, preferredPos) {
    let v = voicing.slice();
    for (;;) {
      if (v.length <= nStrings()) {
        for (const span of [4, 5, 7, 10]) {
          const g = search(v, preferredPos, span);
          if (g) return g;
        }
      }
      if (v.length <= 2) return null;
      v = dropOne(v);
    }
  }

  // All fret positions (0..N_FRETS) whose pitch-class is in the chord — for ghosts.
  function allTonePositions(voicing) {
    const OPEN = open();
    const byPc = {};
    voicing.forEach((n) => { byPc[n.pc] = n; });
    const out = [];
    for (let s = 0; s < OPEN.length; s++) {
      for (let f = 0; f <= nFrets(); f++) {
        const pc = ((OPEN[s] + f) % 12 + 12) % 12;
        if (byPc[pc]) out.push({ stringIndex: s, fret: f, note: byPc[pc] });
      }
    }
    return out;
  }

  // ---- SVG rendering ------------------------------------------------------
  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  const GEO = {
    padL: 54, padR: 24, padT: 30, padB: 26,
    fretW: 66, stringGap: 34, nutW: 8
  };

  function xForFret(f) { return GEO.padL + GEO.nutW + (f - 0.5) * GEO.fretW; }   // center of fret slot
  function xForLine(f) { return GEO.padL + GEO.nutW + f * GEO.fretW; }            // the wire
  function yForString(sIdxFromTop) { return GEO.padT + sIdxFromTop * GEO.stringGap; }

  // render into svg element. opts: { grip, ghosts, labelMode, keyAcc, lefty }
  function render(svg, opts) {
    const OPEN = open();
    const OPEN_NAMES = openNames();
    const NSTR = OPEN.length;    // MI-12: string count is dynamic
    const LAST = NSTR - 1;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const N_FRETS = nFrets();
    const width = GEO.padL + GEO.nutW + N_FRETS * GEO.fretW + GEO.padR;
    const height = GEO.padT + LAST * GEO.stringGap + GEO.padB;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = el("g", {});
    if (opts.lefty) g.setAttribute("transform", `translate(${width},0) scale(-1,1)`);
    svg.appendChild(g);

    // fretboard face
    g.appendChild(el("rect", {
      x: GEO.padL + GEO.nutW, y: GEO.padT - 6,
      width: N_FRETS * GEO.fretW, height: LAST * GEO.stringGap + 12,
      rx: 4, class: "fb-face"
    }));

    // inlays
    MARKERS.filter((f) => f <= N_FRETS).forEach((f) => {
      g.appendChild(el("circle", { cx: xForFret(f), cy: yForString((NSTR - 1) / 2), r: 6, class: "fb-inlay" }));
    });
    DOUBLE_MARKERS.filter((f) => f <= N_FRETS).forEach((f) => {
      g.appendChild(el("circle", { cx: xForFret(f), cy: yForString(Math.max(0,(NSTR-1)/2 - 1)), r: 6, class: "fb-inlay" }));
      g.appendChild(el("circle", { cx: xForFret(f), cy: yForString(Math.min(LAST,(NSTR-1)/2 + 1)), r: 6, class: "fb-inlay" }));
    });

    // nut
    g.appendChild(el("rect", {
      x: GEO.padL, y: GEO.padT - 6, width: GEO.nutW,
      height: LAST * GEO.stringGap + 12, class: "fb-nut"
    }));

    // frets
    for (let f = 1; f <= N_FRETS; f++) {
      g.appendChild(el("line", {
        x1: xForLine(f), y1: GEO.padT - 6, x2: xForLine(f), y2: GEO.padT + LAST * GEO.stringGap + 6, class: "fb-fret"
      }));
    }

    // strings (draw high E at top for a player's-eye view)
    for (let i = 0; i < NSTR; i++) {
      const sIdx = LAST - i; // top row = high E (index5)
      g.appendChild(el("line", {
        x1: GEO.padL, y1: yForString(i), x2: xForLine(N_FRETS), y2: yForString(i),
        class: "fb-string", "stroke-width": 1 + (LAST - sIdx) * 0.25
      }));
    }

    // fret numbers + string labels (kept upright even when lefty)
    const overlay = el("g", {});
    svg.appendChild(overlay);
    MARKERS.concat(DOUBLE_MARKERS).filter((f) => f <= N_FRETS).forEach((f) => {
      const cx = opts.lefty ? width - xForFret(f) : xForFret(f);
      overlay.appendChild(el("text", { x: cx, y: height - 8, class: "fb-fretnum", "text-anchor": "middle" }, String(f)));
    });
    for (let i = 0; i < NSTR; i++) {
      const sIdx = LAST - i;
      const lx = opts.lefty ? width - (GEO.padL - 14) : GEO.padL - 14;
      overlay.appendChild(el("text", { x: lx, y: yForString(i) + 4, class: "fb-openname", "text-anchor": "middle" }, OPEN_NAMES[sIdx]));
    }

    // helper to place a dot
    const flavourSet = opts.flavourPcs ? new Set(opts.flavourPcs) : null;
    const targetSet = opts.targetPcs ? new Set(opts.targetPcs) : null;
    // Now/next landing targets are separate layers: the CURRENT chord's
    // targets read solid (terracotta ring), the NEXT chord's read as a
    // preview (dashed turquoise ring). A pc in both reads as "now".
    const nowSet = opts.targetNowPcs ? new Set(opts.targetNowPcs) : null;
    const nextSet = opts.targetNextPcs ? new Set(opts.targetNextPcs) : null;
    function dot(p, kind) {
      const sIdx = p.stringIndex;
      const rowFromTop = LAST - sIdx;
      const cx = p.fret === 0 ? GEO.padL - 0 : xForFret(p.fret);
      const cy = yForString(rowFromTop);
      const isFlavour = flavourSet ? flavourSet.has(p.note.pc) : !!p.note.isFlavour;
      const isTarget = targetSet ? targetSet.has(p.note.pc) : false;
      const isNow = nowSet ? nowSet.has(p.note.pc) : false;
      const isNext = !isNow && (nextSet ? nextSet.has(p.note.pc) : false);
      const cls = "fb-dot " + kind + (isFlavour ? " flavour" : "") + (isTarget ? " target" : "") +
        (isNow ? " target-now" : "") + (isNext ? " target-next" : "") +
        (p.note.isTonic ? " tonic" : "");
      const gg = el("g", { class: cls, "data-group": p.note.colorGroup, "data-pc": p.note.pc });
      if (opts.lefty) {
        // counter-flip text so labels read normally
        gg.setAttribute("transform", `translate(${2 * cx},0) scale(-1,1)`);
      }
      const r = kind === "ghost" ? 9 : (kind === "scale" || kind === "shape") ? 11 : kind === "road" ? 12 : kind === "next-shape" ? 16 : 14;
      if (isFlavour && kind !== "ghost") {
        gg.appendChild(el("circle", { cx, cy, r: r + 4, class: "dot-flavour-ring" }));
      }
      if (isTarget && kind !== "ghost") {
        gg.appendChild(el("circle", { cx, cy, r: r + 7, class: "dot-target-ring" }));
      }
      if (isNow && kind !== "ghost") {
        gg.appendChild(el("circle", { cx, cy, r: r + 7, class: "dot-now-ring" }));
      } else if (isNext && kind !== "ghost") {
        gg.appendChild(el("circle", { cx, cy, r: r + 7, class: "dot-next-ring" }));
      }
      gg.appendChild(el("circle", { cx, cy, r, class: "dot-bg" }));
      let label = p.note.roleLabel || p.note.degree;
      if (opts.labelMode === "note") label = p.note.name;
      else if (kind === "scale" || kind === "pentatonic") label = p.note.degree || p.note.name;
      const t = el("text", { x: cx, y: cy + 4, "text-anchor": "middle", class: "dot-label" }, label);
      gg.appendChild(t);
      // downward arrow badge on moved notes
      if (kind === "moved") {
        gg.appendChild(el("text", { x: cx + 17, y: cy - 9, "text-anchor": "middle", class: "moved-arrow" }, "↓"));
      }
      return gg;
    }

    // ---- other triad shapes drawn faintly behind the highlighted one -----
    if (opts.otherShapes && opts.otherShapes.length) {
      const active = new Set((opts.grip ? opts.grip.placements : [])
        .map((p) => p.stringIndex + ":" + p.fret));
      const drawn = new Set();
      opts.otherShapes.forEach((s) => s.placements.forEach((p) => {
        const k = p.stringIndex + ":" + p.fret;
        if (active.has(k) || drawn.has(k)) return;
        drawn.add(k);
        g.appendChild(dot(p, "shape"));
      }));
    }

    // ---- practice path: connectors, stroke marks, order numbers ----------
    if (opts.path && opts.path.length) {
      const cx = (n) => (n.fret === 0 ? GEO.padL : xForFret(n.fret));
      const cy = (n) => yForString(LAST - n.stringIndex);
      const upto = opts.pathIndex == null ? opts.path.length - 1 : opts.pathIndex;

      // connectors first so dots sit on top
      for (let i = 1; i < opts.path.length; i++) {
        const a = opts.path[i - 1], b = opts.path[i];
        const cls = "path-link" + (b.crossing ? " x-" + b.crossing : "") +
                    (i <= upto ? " done" : "");
        g.appendChild(el("line", { x1: cx(a), y1: cy(a), x2: cx(b), y2: cy(b), class: cls }));
      }

      opts.path.forEach((n, i) => {
        const isCur = i === upto;
        const isTarget = targetSet ? targetSet.has(n.note.pc) : false;
        const isNow = nowSet ? nowSet.has(n.note.pc) : false;
        const isNext = !isNow && (nextSet ? nextSet.has(n.note.pc) : false);
        const gg = el("g", {
          class: "fb-dot path" + (isCur ? " current" : "") + (i < upto ? " played" : "") +
                 (n.note.isFlavour ? " flavour" : "") + (isTarget ? " target" : "") +
                 (isNow ? " target-now" : "") + (isNext ? " target-next" : ""),
          "data-group": n.note.colorGroup,
          "data-pc": n.note.pc
        });
        if (opts.lefty) gg.setAttribute("transform", `translate(${2 * cx(n)},0) scale(-1,1)`);
        if (n.note.isFlavour) gg.appendChild(el("circle", { cx: cx(n), cy: cy(n), r: 16, class: "dot-flavour-ring" }));
        if (isTarget) gg.appendChild(el("circle", { cx: cx(n), cy: cy(n), r: isCur ? 23 : 20, class: "dot-target-ring" }));
        if (isNow) gg.appendChild(el("circle", { cx: cx(n), cy: cy(n), r: isCur ? 23 : 20, class: "dot-now-ring" }));
        else if (isNext) gg.appendChild(el("circle", { cx: cx(n), cy: cy(n), r: isCur ? 23 : 20, class: "dot-next-ring" }));
        gg.appendChild(el("circle", { cx: cx(n), cy: cy(n), r: isCur ? 15 : 12, class: "dot-bg" }));
        const label = opts.labelMode === "note" ? n.note.name : n.note.degree;
        gg.appendChild(el("text", { x: cx(n), y: cy(n) + 4, "text-anchor": "middle", class: "dot-label" }, label));
        if (opts.showStrokes !== false) {
          gg.appendChild(el("text", {
            x: cx(n), y: cy(n) - 18, "text-anchor": "middle",
            class: "stroke-mark s-" + n.stroke
          }, n.stroke === "down" ? "⊓" : "V"));
        }
        g.appendChild(gg);
      });
    }

    // Degree overlays: every occurrence of a selected note set on the neck.
    // The pentatonic frame is intentionally quieter than the current triad so
    // the player sees "safe notes" and "landing notes" at the same time.
    function renderOverlay(notes, kind) {
      const byPc = {};
      notes.forEach((n) => { byPc[n.pc] = n; });
      const range = opts.overlayRange || { from: 0, to: N_FRETS };
      const fromFret = Math.max(0, range.from == null ? 0 : range.from);
      const toFret = Math.min(N_FRETS, range.to == null ? N_FRETS : range.to);
      const active = new Set(
        (opts.grip ? opts.grip.placements : []).map((p) => p.stringIndex + ":" + p.fret)
      );
      for (let s = 0; s < NSTR; s++) {
        for (let f = fromFret; f <= toFret; f++) {
          const pc = (((OPEN[s] + f) % 12) + 12) % 12;
          const sn = byPc[pc];
          if (!sn) continue;
          if (active.has(s + ":" + f)) continue;
          const group = kind === "pentatonic" ? "pentatonic" : kind === "target" ? "target" :
            kind === "road" ? (sn.road === "upper" ? "upper-tetra" : "lower-tetra") :
              (sn.isTonic ? "tonic" : sn.isFlavour ? "flavourdeg" : "scaledeg");
          g.appendChild(dot(
            { stringIndex: s, fret: f, note: {
              pc, degree: sn.degree, roleLabel: sn.roleLabel, name: sn.name,
              colorGroup: group, isFlavour: sn.isFlavour, isTonic: sn.isTonic
            } },
            kind
          ));
        }
      }
    }

    if (opts.pentatonicNotes && opts.pentatonicNotes.length) renderOverlay(opts.pentatonicNotes, "pentatonic");
    if (opts.targetNotes && opts.targetNotes.length) renderOverlay(opts.targetNotes, "target");
    if (opts.scaleNotes && opts.scaleNotes.length) renderOverlay(opts.scaleNotes, "scale");
    if (opts.roadNotes && opts.roadNotes.length) renderOverlay(opts.roadNotes, "road");

    if (opts.ghosts && opts.allPositions) {
      const active = new Set(opts.grip.placements.map((p) => p.stringIndex + ":" + p.fret));
      opts.allPositions.forEach((p) => {
        if (active.has(p.stringIndex + ":" + p.fret)) return;
        g.appendChild(dot(p, "ghost"));
      });
    }

    // The destination grip is a static outline behind the current notes. It
    // previews a real playable shape without animating dots across strings,
    // which would imply a fingering or glissando that the player never makes.
    if (opts.nextGrip && opts.nextGrip.placements) {
      const currentPlacements = opts.grip && opts.grip.placements ? opts.grip.placements : [];
      const currentPcs = new Set(currentPlacements.map((placement) => placement.note.pc));
      const currentPositions = new Set(currentPlacements.map((placement) => `${placement.stringIndex}:${placement.fret}`));
      opts.nextGrip.placements.forEach((placement) => {
        const node = dot(placement, "next-shape");
        if (currentPcs.has(placement.note.pc)) node.classList.add("held-next");
        if (currentPositions.has(`${placement.stringIndex}:${placement.fret}`)) node.classList.add("overlap");
        g.appendChild(node);
      });
    }

    if (opts.grip) {
      opts.grip.placements.forEach((p, k) => {
        const kind = opts.moveClass ? (opts.moveClass[k] || "held") : "held";
        g.appendChild(dot(p, kind));
      });
    }
  }

  window.Fretboard = { get N_FRETS() { return nFrets(); }, stringSets, findGrip, allTonePositions, render };
})();
