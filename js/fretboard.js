/* fretboard.js — grip finding + SVG rendering. Exposes window.Fretboard. */
(function () {
  "use strict";

  // standard tuning, low -> high string; open-string midi
  const OPEN = [40, 45, 50, 55, 59, 64];        // E2 A2 D3 G3 B3 E4
  const OPEN_NAMES = ["E", "A", "D", "G", "B", "E"];
  const N_FRETS = 15;
  const STRING_SETS = [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]];
  const MARKERS = [3, 5, 7, 9, 15];
  const DOUBLE_MARKERS = [12];

  // Find a compact, playable grip for a voicing.
  // voicing: array of note objects (low->high) each with {pc, role, ...}.
  // Returns { placements: [{stringIndex, fret, note}], span } or null.
  function findGrip(voicing, preferredPos) {
    const pcs = voicing.map((n) => n.pc);
    let best = null;

    STRING_SETS.forEach((set) => {
      for (let basePos = 0; basePos <= N_FRETS - 4; basePos++) {
        const frets = [];
        let prevPitch = -Infinity;
        let ok = true;
        for (let k = 0; k < 4; k++) {
          const s = set[k];
          let chosen = null;
          for (let f = basePos; f <= basePos + 4; f++) {
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
        const score = span * 3 + posDist + lowFret * 0.05;
        if (!best || score < best.score) {
          best = {
            score, span, lowFret,
            placements: set.map((s, k) => ({
              stringIndex: s, fret: frets[k], note: voicing[k]
            }))
          };
        }
      }
    });
    return best;
  }

  // All fret positions (0..N_FRETS) whose pitch-class is in the chord — for ghosts.
  function allTonePositions(voicing) {
    const byPc = {};
    voicing.forEach((n) => { byPc[n.pc] = n; });
    const out = [];
    for (let s = 0; s < 6; s++) {
      for (let f = 0; f <= N_FRETS; f++) {
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
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const width = GEO.padL + GEO.nutW + N_FRETS * GEO.fretW + GEO.padR;
    const height = GEO.padT + 5 * GEO.stringGap + GEO.padB;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    const g = el("g", {});
    if (opts.lefty) g.setAttribute("transform", `translate(${width},0) scale(-1,1)`);
    svg.appendChild(g);

    // fretboard face
    g.appendChild(el("rect", {
      x: GEO.padL + GEO.nutW, y: GEO.padT - 6,
      width: N_FRETS * GEO.fretW, height: 5 * GEO.stringGap + 12,
      rx: 4, class: "fb-face"
    }));

    // inlays
    MARKERS.forEach((f) => {
      g.appendChild(el("circle", { cx: xForFret(f), cy: yForString(2), r: 6, class: "fb-inlay" }));
    });
    DOUBLE_MARKERS.forEach((f) => {
      g.appendChild(el("circle", { cx: xForFret(f), cy: yForString(1), r: 6, class: "fb-inlay" }));
      g.appendChild(el("circle", { cx: xForFret(f), cy: yForString(3), r: 6, class: "fb-inlay" }));
    });

    // nut
    g.appendChild(el("rect", {
      x: GEO.padL, y: GEO.padT - 6, width: GEO.nutW,
      height: 5 * GEO.stringGap + 12, class: "fb-nut"
    }));

    // frets
    for (let f = 1; f <= N_FRETS; f++) {
      g.appendChild(el("line", {
        x1: xForLine(f), y1: GEO.padT - 6, x2: xForLine(f), y2: GEO.padT + 5 * GEO.stringGap + 6, class: "fb-fret"
      }));
    }

    // strings (draw high E at top for a player's-eye view)
    for (let i = 0; i < 6; i++) {
      const sIdx = 5 - i; // top row = high E (index5)
      g.appendChild(el("line", {
        x1: GEO.padL, y1: yForString(i), x2: xForLine(N_FRETS), y2: yForString(i),
        class: "fb-string", "stroke-width": 1 + (5 - sIdx) * 0.25
      }));
    }

    // fret numbers + string labels (kept upright even when lefty)
    const overlay = el("g", {});
    svg.appendChild(overlay);
    MARKERS.concat(DOUBLE_MARKERS).forEach((f) => {
      const cx = opts.lefty ? width - xForFret(f) : xForFret(f);
      overlay.appendChild(el("text", { x: cx, y: height - 8, class: "fb-fretnum", "text-anchor": "middle" }, String(f)));
    });
    for (let i = 0; i < 6; i++) {
      const sIdx = 5 - i;
      const lx = opts.lefty ? width - (GEO.padL - 14) : GEO.padL - 14;
      overlay.appendChild(el("text", { x: lx, y: yForString(i) + 4, class: "fb-openname", "text-anchor": "middle" }, OPEN_NAMES[sIdx]));
    }

    // helper to place a dot
    function dot(p, kind) {
      const sIdx = p.stringIndex;
      const rowFromTop = 5 - sIdx;
      const cx = p.fret === 0 ? GEO.padL - 0 : xForFret(p.fret);
      const cy = yForString(rowFromTop);
      const gg = el("g", { class: "fb-dot " + kind, "data-group": p.note.colorGroup });
      if (opts.lefty) {
        // counter-flip text so labels read normally
        gg.setAttribute("transform", `translate(${2 * cx},0) scale(-1,1)`);
      }
      gg.appendChild(el("circle", { cx, cy, r: kind === "ghost" ? 9 : 14, class: "dot-bg" }));
      let label = p.note.roleLabel;
      if (opts.labelMode === "note") label = p.note.name;
      else if (opts.labelMode === "degree") label = p.note.roleLabel;
      const t = el("text", { x: cx, y: cy + 4, "text-anchor": "middle", class: "dot-label" }, label);
      gg.appendChild(t);
      // downward arrow badge on moved notes
      if (kind === "moved") {
        gg.appendChild(el("text", { x: cx + 17, y: cy - 9, "text-anchor": "middle", class: "moved-arrow" }, "↓"));
      }
      return gg;
    }

    if (opts.ghosts && opts.allPositions) {
      const active = new Set(opts.grip.placements.map((p) => p.stringIndex + ":" + p.fret));
      opts.allPositions.forEach((p) => {
        if (active.has(p.stringIndex + ":" + p.fret)) return;
        g.appendChild(dot(p, "ghost"));
      });
    }

    if (opts.grip) {
      opts.grip.placements.forEach((p, k) => {
        const kind = opts.moveClass ? (opts.moveClass[k] || "held") : "held";
        g.appendChild(dot(p, kind));
      });
    }
  }

  window.Fretboard = { OPEN, OPEN_NAMES, N_FRETS, findGrip, allTonePositions, render };
})();
