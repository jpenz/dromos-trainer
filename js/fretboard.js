/* fretboard.js — grip finding + SVG rendering. Exposes window.Fretboard.
 * FR-57: the primary Solo journey gets a large, complete, non-scrolling neck.
 */
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

  function neckLayout(nFrets, folded) {
    const fretsPerRow = folded ? Math.min(12, nFrets) : nFrets;
    return { folded: !!folded, fretsPerRow, rows: Math.ceil(nFrets / fretsPerRow) };
  }

  // render into svg element. opts: { grip, ghosts, labelMode, keyAcc, lefty }
  function render(svg, opts) {
    const OPEN = open();
    const OPEN_NAMES = openNames();
    const NSTR = OPEN.length;    // MI-12: string count is dynamic
    const LAST = NSTR - 1;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const N_FRETS = nFrets();
    // A phone-sized neck folds after fret 12 instead of becoming a tiny 24-
    // fret thumbnail or requiring horizontal scrolling. The Solo Follow
    // Changes view also requests the large-neck contract: fold whenever the
    // available stage cannot give 24 frets at least 56 CSS pixels each. That
    // recovers the readable early Solo map without reintroducing a sideways
    // scroll on laptops and iPads.
    const phoneFold = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 620px)").matches;
    const availableWidth = svg.parentElement ? svg.parentElement.clientWidth : svg.clientWidth;
    const focusFold = !!opts.largeNeck && N_FRETS > 12 && availableWidth > 0 && availableWidth < N_FRETS * 56;
    const fold = phoneFold || focusFold;
    const layout = neckLayout(N_FRETS, fold);
    const FRETS_PER_ROW = layout.fretsPerRow;
    const ROWS = layout.rows;
    const PAD_T = opts.largeNeck ? 36 : GEO.padT;
    const PAD_B = opts.largeNeck ? 32 : GEO.padB;
    const STRING_GAP = opts.largeNeck ? 42 : GEO.stringGap;
    const rowHeight = PAD_T + LAST * STRING_GAP + PAD_B + (fold ? 20 : 0);
    const width = GEO.padL + GEO.nutW + Math.min(FRETS_PER_ROW, N_FRETS) * GEO.fretW + GEO.padR;
    const height = ROWS * rowHeight - (fold ? 18 : 0);
    const fretRow = (fret) => fret === 0 ? 0 : Math.floor((fret - 1) / FRETS_PER_ROW);
    const localFret = (fret) => fret === 0 ? 0 : (fret - 1) % FRETS_PER_ROW + 1;
    const rowTop = (row) => row * rowHeight;
    const xForFret = (fret) => GEO.padL + GEO.nutW + (localFret(fret) - 0.5) * GEO.fretW;
    const xForLine = (fret) => GEO.padL + GEO.nutW + localFret(fret) * GEO.fretW;
    const yForString = (sIdxFromTop, fret) => rowTop(fretRow(fret)) + PAD_T + sIdxFromTop * STRING_GAP;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("data-neck-layout", fold ? "folded" : "continuous");
    svg.setAttribute("data-neck-emphasis", opts.largeNeck ? "large" : "standard");

    const g = el("g", {});
    if (opts.lefty) g.setAttribute("transform", `translate(${width},0) scale(-1,1)`);
    svg.appendChild(g);

    for (let row = 0; row < ROWS; row++) {
      const first = row * FRETS_PER_ROW + 1;
      const last = Math.min(N_FRETS, first + FRETS_PER_ROW - 1);
      const count = last - first + 1;
      const top = rowTop(row);
      g.appendChild(el("rect", {
        x: GEO.padL + GEO.nutW, y: top + PAD_T - 7,
        width: count * GEO.fretW, height: LAST * STRING_GAP + 14,
        rx: 4, class: "fb-face"
      }));
      MARKERS.filter((f) => f >= first && f <= last).forEach((f) => {
        g.appendChild(el("circle", { cx: xForFret(f), cy: yForString((NSTR - 1) / 2, f), r: 6, class: "fb-inlay" }));
      });
      DOUBLE_MARKERS.filter((f) => f >= first && f <= last).forEach((f) => {
        g.appendChild(el("circle", { cx: xForFret(f), cy: yForString(Math.max(0,(NSTR-1)/2 - 1), f), r: 6, class: "fb-inlay" }));
        g.appendChild(el("circle", { cx: xForFret(f), cy: yForString(Math.min(LAST,(NSTR-1)/2 + 1), f), r: 6, class: "fb-inlay" }));
      });
      if (row === 0) {
        g.appendChild(el("rect", {
          x: GEO.padL, y: top + PAD_T - 7, width: GEO.nutW,
          height: LAST * STRING_GAP + 14, class: "fb-nut"
        }));
      }
      for (let f = first; f <= last; f++) {
        g.appendChild(el("line", {
          x1: xForLine(f), y1: top + PAD_T - 7, x2: xForLine(f), y2: top + PAD_T + LAST * STRING_GAP + 7, class: "fb-fret"
        }));
      }
      for (let i = 0; i < NSTR; i++) {
        const sIdx = LAST - i;
        g.appendChild(el("line", {
          x1: GEO.padL, y1: yForString(i, first), x2: GEO.padL + GEO.nutW + count * GEO.fretW, y2: yForString(i, first),
          class: "fb-string", "stroke-width": 1 + (LAST - sIdx) * 0.25
        }));
      }
    }

    // fret numbers + string labels (kept upright even when lefty)
    const overlay = el("g", {});
    svg.appendChild(overlay);
    const numberedFrets = Array.from(new Set(MARKERS.concat(DOUBLE_MARKERS, Array.from({ length: ROWS }, (_, row) => Math.min(N_FRETS, (row + 1) * FRETS_PER_ROW)))))
      .filter((f) => f > 0 && f <= N_FRETS);
    numberedFrets.forEach((f) => {
      const cx = opts.lefty ? width - xForFret(f) : xForFret(f);
      const y = rowTop(fretRow(f)) + PAD_T + LAST * STRING_GAP + PAD_B - 8;
      overlay.appendChild(el("text", { x: cx, y, class: "fb-fretnum", "text-anchor": "middle" }, String(f)));
    });
    for (let row = 0; row < ROWS; row++) {
      for (let i = 0; i < NSTR; i++) {
        const sIdx = LAST - i;
        const lx = opts.lefty ? width - (GEO.padL - 14) : GEO.padL - 14;
        const rowFret = row * FRETS_PER_ROW + 1;
        overlay.appendChild(el("text", { x: lx, y: yForString(i, rowFret) + 4, class: "fb-openname", "text-anchor": "middle" }, OPEN_NAMES[sIdx]));
      }
    }

    // helper to place a dot
    const flavourSet = opts.flavourPcs ? new Set(opts.flavourPcs) : null;
    const targetSet = opts.targetPcs ? new Set(opts.targetPcs) : null;
    // Now/next landing targets are separate layers: the CURRENT chord's
    // targets read solid (terracotta ring), the NEXT chord's read as a
    // preview (dashed turquoise ring). A pc in both reads as "now".
    const nowSet = opts.targetNowPcs ? new Set(opts.targetNowPcs) : null;
    const nextSet = opts.targetNextPcs ? new Set(opts.targetNextPcs) : null;
    const positionKey = (placement) => `${placement.stringIndex}:${placement.fret}`;
    const nowPositionSet = Array.isArray(opts.targetNowPlacements)
      ? new Set(opts.targetNowPlacements.map(positionKey)) : null;
    const nextPositionSet = Array.isArray(opts.targetNextPlacements)
      ? new Set(opts.targetNextPlacements.map(positionKey)) : null;
    function dot(p, kind) {
      const sIdx = p.stringIndex;
      const rowFromTop = LAST - sIdx;
      const cx = p.fret === 0 ? GEO.padL - 0 : xForFret(p.fret);
      const cy = yForString(rowFromTop, p.fret);
      const isFlavour = flavourSet ? flavourSet.has(p.note.pc) : !!p.note.isFlavour;
      const isTarget = targetSet ? targetSet.has(p.note.pc) : false;
      // When a dedicated target overlay exists, passive scale/frame dots stay
      // quiet underneath it. Otherwise they would duplicate the target rings
      // and could paint a scale degree (for example 4) over the next chord's
      // functional role (3). Grips and shapes still carry target rings.
      const passiveOverlay = kind === "scale" || kind === "pentatonic" || kind === "road";
      const ownsTargetTiming = !(passiveOverlay && (opts.targetScope === "positions" || (opts.targetNotes && opts.targetNotes.length)));
      const key = positionKey(p);
      const isNow = ownsTargetTiming && nowSet
        ? nowSet.has(p.note.pc) && (!nowPositionSet || nowPositionSet.has(key)) : false;
      const isNext = !isNow && ownsTargetTiming && nextSet
        ? nextSet.has(p.note.pc) && (!nextPositionSet || nextPositionSet.has(key)) : false;
      const cls = "fb-dot " + kind + (isFlavour ? " flavour" : "") + (isTarget ? " target" : "") +
        (isNow ? " target-now" : "") + (isNext ? " target-next" : "") +
        (p.note.mobile ? " mobile" : "") +
        (kind === "road" && opts.roadQuiet ? " quiet" : "") +
        (p.note.isTonic ? " tonic" : "");
      const gg = el("g", {
        class: cls, "data-group": p.note.colorGroup, "data-pc": p.note.pc,
        "data-string": p.stringIndex, "data-fret": p.fret, "data-role": p.note.roleLabel || p.note.degree || ""
      });
      if (opts.lefty) {
        // counter-flip text so labels read normally
        gg.setAttribute("transform", `translate(${2 * cx},0) scale(-1,1)`);
      }
      const sizeLift = opts.largeNeck ? 2 : 0;
      const r = (kind === "ghost" ? 9 : (kind === "scale" || kind === "shape") ? 11 : kind === "road" ? 12 : kind === "next-shape" ? 16 : 14) + sizeLift;
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
      const cy = (n) => yForString(LAST - n.stringIndex, n.fret);
      const upto = opts.pathIndex == null ? opts.path.length - 1 : opts.pathIndex;

      // connectors first so dots sit on top
      for (let i = 1; i < opts.path.length; i++) {
        const a = opts.path[i - 1], b = opts.path[i];
        const cls = "path-link" + (b.crossing ? " x-" + b.crossing : "") +
                    (i <= upto ? " done" : "");
        if (fretRow(a.fret) === fretRow(b.fret)) {
          g.appendChild(el("line", { x1: cx(a), y1: cy(a), x2: cx(b), y2: cy(b), class: cls }));
        }
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
          }, n.stroke === "down" ? "↓" : "↑"));
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
      // The one-course road (Goodrick's single-string discipline): restrict the
      // road overlay to the melody course so the dromos reads as one line.
      const onlyString = kind === "road" && opts.roadString === "top" ? NSTR - 1 : null;
      for (let s = 0; s < NSTR; s++) {
        if (onlyString != null && s !== onlyString) continue;
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
              colorGroup: group, isFlavour: sn.isFlavour, isTonic: sn.isTonic, mobile: sn.mobile
            } },
            kind
          ));
        }
      }
    }

    // Context first, decision last: target dots sit above the scale/frame so
    // their chord-role labels remain the visible source of truth.
    if (opts.scaleNotes && opts.scaleNotes.length) renderOverlay(opts.scaleNotes, "scale");
    if (opts.pentatonicNotes && opts.pentatonicNotes.length) renderOverlay(opts.pentatonicNotes, "pentatonic");
    if (opts.roadNotes && opts.roadNotes.length) renderOverlay(opts.roadNotes, "road");
    if (opts.targetNotes && opts.targetNotes.length) renderOverlay(opts.targetNotes, "target");
    if (opts.targetPlacements && opts.targetPlacements.length) {
      const drawnTargets = new Set();
      opts.targetPlacements.forEach((placement) => {
        const key = positionKey(placement);
        if (drawnTargets.has(key)) return;
        drawnTargets.add(key);
        g.appendChild(dot(placement, "target"));
      });
    }

    // The lean tracer: when the current landing tone resolves to the next
    // chord's landing tone by a step, draw that half/whole-step move on every
    // string where both tones sit under one hand — the 2→3 (or 7→3) thread
    // made literally visible, always to the NEAREST tone, never a jump.
    if (opts.tracer && opts.tracer.fromPlacement && opts.tracer.toPlacement) {
      const from = opts.tracer.fromPlacement;
      const to = opts.tracer.toPlacement;
      if (fretRow(from.fret) === fretRow(to.fret)) {
        const fromX = from.fret === 0 ? GEO.padL : xForFret(from.fret);
        const toX = to.fret === 0 ? GEO.padL : xForFret(to.fret);
        const x1 = opts.lefty ? width - fromX : fromX;
        const x2 = opts.lefty ? width - toX : toX;
        const y1 = yForString(LAST - from.stringIndex, from.fret);
        const y2 = yForString(LAST - to.stringIndex, to.fret);
        g.appendChild(el("line", { x1, y1, x2, y2, class: "tracer-line exact" }));
        g.appendChild(el("text", { x: x2, y: y2 - 19, "text-anchor": "middle", class: "tracer-head" }, x2 >= x1 ? "▸" : "◂"));
      }
    } else if (opts.tracer && opts.tracer.fromPc != null && opts.tracer.toPc != null) {
      const range = opts.overlayRange || { from: 0, to: N_FRETS };
      const fromFret = Math.max(0, range.from == null ? 0 : range.from);
      const toFret = Math.min(N_FRETS, range.to == null ? N_FRETS : range.to);
      for (let s = 0; s < NSTR; s++) {
        // The 24-fret neck is rendered in two rows. Teach the same nearest-note
        // motion in each row instead of drawing one example near fret 5 and
        // leaving the second octave visually unexplained.
        for (let row = 0; row < ROWS; row++) {
          const rowFrom = Math.max(fromFret, row === 0 ? 0 : row * FRETS_PER_ROW + 1);
          const rowTo = Math.min(toFret, (row + 1) * FRETS_PER_ROW);
          let best = null;
          for (let fa = rowFrom; fa <= rowTo; fa++) {
            if ((((OPEN[s] + fa) % 12) + 12) % 12 !== opts.tracer.fromPc) continue;
            for (let fb = rowFrom; fb <= rowTo; fb++) {
              if ((((OPEN[s] + fb) % 12) + 12) % 12 !== opts.tracer.toPc) continue;
              const span = Math.abs(fb - fa);
              if (span >= 1 && span <= 3 && (!best || span < best.span)) best = { fa, fb, span };
            }
          }
          if (!best) continue;
          const y = yForString(LAST - s, best.fa) - 20;
          const xa = best.fa === 0 ? GEO.padL : xForFret(best.fa);
          const xb = best.fb === 0 ? GEO.padL : xForFret(best.fb);
          const x1 = opts.lefty ? width - xa : xa;
          const x2 = opts.lefty ? width - xb : xb;
          g.appendChild(el("line", { x1, y1: y, x2, y2: y, class: "tracer-line" }));
          g.appendChild(el("text", { x: x2, y: y + 3, "text-anchor": "middle", class: "tracer-head" }, x2 >= x1 ? "▸" : "◂"));
        }
      }
    }

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

  window.Fretboard = { get N_FRETS() { return nFrets(); }, stringSets, findGrip, allTonePositions, neckLayout, render };
})();
