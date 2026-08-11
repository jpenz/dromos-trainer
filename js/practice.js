/* practice.js — scale paths (technique) + expanding cells (audiation).
 * Pure logic, no DOM. Exposes window.Practice.
 *
 * Implements: FR-20 (scale paths), FR-21 (picking strokes + crossings),
 *             FR-22 (expanding/contracting cells), FR-23 (audiation targets)
 * Invariants:  MI-11 (inside/outside picking rule)
 * See docs/REQUIREMENTS.md before changing anything in this file.
 */
(function () {
  "use strict";
  const M = window.Modes;
  // Neck comes from window.Tuning (MI-12) — a bouzouki has four courses.
  const open = () => window.Tuning.open();
  const nStrings = () => window.Tuning.count();
  const MAX_FRET = 15;
  const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  // ---- MI-11: inside vs outside picking -----------------------------------
  // Strict alternate picking, so the incoming stroke is always the opposite of
  // the outgoing one. After a DOWNstroke the pick sits on the high-E side of the
  // string it just played; after an UPstroke it sits on the low-E side.
  //
  //   ascending  (to a higher string):  up→down = OUTSIDE, down→up = INSIDE
  //   descending (to a lower string) :  down→up = OUTSIDE, up→down = INSIDE
  //
  // Sanity check this against known pedagogy before "fixing" it:
  //   2 notes/string ascending, starting down  -> every crossing OUTSIDE
  //   3 notes/string ascending, starting down  -> crossings ALTERNATE
  function crossingType(fromString, toString, prevStroke) {
    if (fromString === toString) return null;
    const ascending = toString > fromString;
    if (ascending) return prevStroke === "up" ? "outside" : "inside";
    return prevStroke === "down" ? "outside" : "inside";
  }

  // ---- scale pitch generation --------------------------------------------
  // Ascending scale pitches starting at `startDegree` (1-based) of the mode.
  function scalePitches(tonicName, modeId, startDegree, fromMidi, count) {
    const t = M.parseName(tonicName);
    const offs = M.MODES[modeId].scale;
    const n = offs.length;
    const out = [];
    let i = (startDegree - 1) % n;
    let oct = 0;
    // anchor the first pitch at or above fromMidi
    let first = t.pc + offs[i];
    while (first < fromMidi) first += 12;
    while (first - 12 >= fromMidi) first -= 12;
    let base = first - offs[i];
    for (let k = 0; k < count; k++) {
      const idx = (i + k) % n;
      const wrap = Math.floor((i + k) / n);
      out.push(base + offs[idx] + 12 * wrap);
    }
    return out;
  }

  function degreeInfo(tonicName, modeId, midi) {
    const t = M.parseName(tonicName);
    const off = (((midi - t.pc) % 12) + 12) % 12;
    const scale = M.scaleOf(tonicName, modeId);
    const hit = scale.find((s) => s.off === off);
    return hit || { name: M.simplify(M.nameFor(0, ((midi % 12) + 12) % 12)), degree: "?", isFlavour: false, isTonic: false };
  }

  // ---- layouts ------------------------------------------------------------
  // Returns ascending [{stringIndex, fret, midi}] or null if it will not fit.
  function layoutNPS(pitches, nps, startString, position) {
    const OPEN = open();
    const nodes = [];
    let s = startString;
    for (let k = 0; k < pitches.length; k++) {
      if (k > 0 && k % nps === 0) s++;
      if (s >= OPEN.length) return null;
      const fret = pitches[k] - OPEN[s];
      if (fret < 0 || fret > MAX_FRET) return null;
      nodes.push({ stringIndex: s, fret, midi: pitches[k] });
    }
    // reject silly stretches
    for (let i = 1; i < nodes.length; i++) {
      if (nodes[i].stringIndex === nodes[i - 1].stringIndex &&
          Math.abs(nodes[i].fret - nodes[i - 1].fret) > 5) return null;
    }
    return nodes;
  }

  // In-position "box": every scale tone inside a 5-fret window, all six strings.
  function layoutBox(tonicName, modeId, position) {
    const t = M.parseName(tonicName);
    const offs = M.MODES[modeId].scale;
    const pcs = offs.map((o) => (t.pc + o) % 12);
    const OPEN = open();
    const nodes = [];
    for (let s = 0; s < OPEN.length; s++) {
      for (let f = position; f <= position + 4; f++) {
        if (f < 0 || f > MAX_FRET) continue;
        const pc = (((OPEN[s] + f) % 12) + 12) % 12;
        if (pcs.indexOf(pc) >= 0) nodes.push({ stringIndex: s, fret: f, midi: OPEN[s] + f });
      }
    }
    // ascending by pitch, and never two identical pitches
    nodes.sort((a, b) => a.midi - b.midi || a.stringIndex - b.stringIndex);
    const seen = new Set();
    return nodes.filter((n) => { if (seen.has(n.midi)) return false; seen.add(n.midi); return true; });
  }

  // One string, along the neck.
  function layoutHorizontal(tonicName, modeId, stringIndex, fromFret, count) {
    const OPEN = open();
    const t = M.parseName(tonicName);
    const offs = M.MODES[modeId].scale;
    const pcs = offs.map((o) => (t.pc + o) % 12);
    const nodes = [];
    for (let f = fromFret; f <= MAX_FRET && nodes.length < count; f++) {
      const pc = (((OPEN[stringIndex] + f) % 12) + 12) % 12;
      if (pcs.indexOf(pc) >= 0) nodes.push({ stringIndex, fret: f, midi: OPEN[stringIndex] + f });
    }
    return nodes;
  }

  // ---- the path -----------------------------------------------------------
  // opts: { layout:'3nps'|'2nps'|'box'|'horizontal', position, startDegree,
  //         startString, firstStroke:'down'|'up', updown:true }
  function buildPath(tonicName, modeId, opts) {
    const o = Object.assign({
      layout: "3nps", position: 5, startDegree: 1, startString: 0,
      firstStroke: "down", updown: true
    }, opts || {});

    let asc = null;
    if (o.layout === "box") {
      asc = layoutBox(tonicName, modeId, o.position);
    } else if (o.layout === "horizontal") {
      // back off far enough down the neck that a full octave-plus is available
      let from = Math.max(0, o.position - 2);
      asc = layoutHorizontal(tonicName, modeId, o.startString, from, 8);
      if (asc.length < 8) asc = layoutHorizontal(tonicName, modeId, o.startString, 0, 8);
    } else {
      const nps = o.layout === "2nps" ? 2 : 3;
      // Every octave of the start degree that sits on the start string is a
      // candidate; try them nearest-to-position first. Then shrink the string
      // count — n-per-string does not always fit six strings inside 15 frets
      // (2/str especially: the frets have to descend as you climb).
      const OPEN = open();
      const t = M.parseName(tonicName);
      const offs = M.MODES[modeId].scale;
      const startOff = offs[(o.startDegree - 1) % offs.length];
      const startPc = (t.pc + startOff) % 12;

      // Prefer: the requested start string, then the most strings, then the
      // start fret nearest the requested position.
      // On a 3-course trichordo the run may have to begin above the lowest
      // string, so allow starting anywhere that still leaves two strings.
      const maxStart = Math.max(0, OPEN.length - 2);
      outer:
      for (let ss = o.startString; ss <= maxStart && !asc; ss++) {
        const starts = [];
        for (let f = 0; f <= MAX_FRET; f++) {
          if ((((OPEN[ss] + f) % 12) + 12) % 12 === startPc) starts.push(f);
        }
        starts.sort((a, b) => Math.abs(a - o.position) - Math.abs(b - o.position));
        for (let strings = OPEN.length - ss; strings >= Math.min(2, OPEN.length); strings--) {
          for (const f of starts) {
            const pitches = scalePitches(tonicName, modeId, o.startDegree,
              OPEN[ss] + f, nps * strings);
            const got = layoutNPS(pitches, nps, ss, o.position);
            if (got) { asc = got; break outer; }
          }
        }
      }
    }
    if (!asc || !asc.length) return null;

    // ascend then descend (do not repeat the top note)
    const seq = o.updown ? asc.concat(asc.slice(0, -1).reverse()) : asc.slice();

    const nodes = seq.map((n, i) => {
      const info = degreeInfo(tonicName, modeId, n.midi);
      const stroke = ((i % 2 === 0) === (o.firstStroke === "down")) ? "down" : "up";
      return {
        stringIndex: n.stringIndex, fret: n.fret, midi: n.midi,
        freq: midiToFreq(n.midi), order: i + 1, stroke,
        note: {
          pc: (((n.midi % 12) + 12) % 12),
          name: info.name, degree: info.degree,
          isFlavour: info.isFlavour, isTonic: info.isTonic,
          colorGroup: info.isTonic ? "tonic" : info.isFlavour ? "flavourdeg" : "scaledeg",
          roleLabel: info.degree
        }
      };
    });

    // crossings (attached to the note you arrive ON)
    let inside = 0, outside = 0;
    for (let i = 1; i < nodes.length; i++) {
      const c = crossingType(nodes[i - 1].stringIndex, nodes[i].stringIndex, nodes[i - 1].stroke);
      nodes[i].crossing = c;
      if (c === "inside") inside++;
      if (c === "outside") outside++;
    }

    const frets = nodes.map((n) => n.fret).filter((f) => f > 0);
    return {
      nodes,
      meta: {
        layout: o.layout, startDegree: o.startDegree, firstStroke: o.firstStroke,
        lowFret: frets.length ? Math.min.apply(null, frets) : 0,
        highFret: frets.length ? Math.max.apply(null, frets) : 0,
        inside, outside, length: nodes.length
      }
    };
  }

  // Core positions above and below: the same shape, shifted to the next place on
  // the neck where it lies under the hand.
  function positionsFor(tonicName, modeId, opts, current) {
    const out = [];
    for (let p = 0; p <= 12; p++) {
      const path = buildPath(tonicName, modeId, Object.assign({}, opts, { position: p }));
      if (path) out.push({ position: p, lowFret: path.meta.lowFret });
    }
    // dedupe by resulting low fret
    const seen = new Set();
    return out.filter((x) => { if (seen.has(x.lowFret)) return false; seen.add(x.lowFret); return true; });
  }

  // ---- expanding / contracting cells (audiation) --------------------------
  // 3 notes, add one at a time to the octave (8), then take one away back to 3.
  // The TARGET is always the last note of the cell — the one you pre-hear and
  // sing before it sounds.
  function buildCells(tonicName, modeId, opts) {
    const o = Object.assign({ startDegree: 1, min: 3, max: 8 }, opts || {});
    const t = M.parseName(tonicName);
    const base = 50 + (((t.pc - 50) % 12) + 12) % 12;   // ~D3 region
    const pitches = scalePitches(tonicName, modeId, o.startDegree, base, o.max);

    const sizes = [];
    for (let s = o.min; s <= o.max; s++) sizes.push({ size: s, phase: "expand" });
    for (let s = o.max - 1; s >= o.min; s--) sizes.push({ size: s, phase: "contract" });

    return sizes.map((s, i) => {
      const notes = pitches.slice(0, s.size).map((m) => {
        const info = degreeInfo(tonicName, modeId, m);
        return {
          midi: m, freq: midiToFreq(m), name: info.name, degree: info.degree,
          pc: (((m % 12) + 12) % 12), isFlavour: info.isFlavour, isTonic: info.isTonic
        };
      });
      return {
        index: i, size: s.size, phase: s.phase, notes,
        targetIdx: notes.length - 1,
        target: notes[notes.length - 1],
        isOctave: s.size === o.max
      };
    });
  }

  // Lay a cell out on the neck near a position, for display.
  function layCell(cell, position) {
    return cell.notes.map((n, i) => {
      const OPEN = open();
      let best = null;
      for (let s = 0; s < OPEN.length; s++) {
        const fret = n.midi - OPEN[s];
        if (fret < 0 || fret > MAX_FRET) continue;
        const d = Math.abs(fret - position);
        if (!best || d < best.d) best = { stringIndex: s, fret, d };
      }
      if (!best) return null;
      return {
        stringIndex: best.stringIndex, fret: best.fret, midi: n.midi, order: i + 1,
        note: {
          pc: n.pc, name: n.name, degree: n.degree, roleLabel: n.degree,
          isFlavour: n.isFlavour, isTonic: n.isTonic,
          colorGroup: i === cell.targetIdx ? "target" : n.isTonic ? "tonic" : n.isFlavour ? "flavourdeg" : "scaledeg"
        }
      };
    }).filter(Boolean);
  }

  // ---- self-test ----------------------------------------------------------
  function selfTest() {
    const results = [];
    let ok = true;
    const restoreTuning = window.Tuning.currentId();
    window.Tuning.set("guitar");   // the pinned expectations below assume 6 strings
    const add = (i, want, got) => {
      const pass = String(want) === String(got);
      if (!pass) ok = false;
      results.push({ i, want, got, pass });
    };

    // MI-11 against known pedagogy: 2nps ascending from a downstroke is all-outside
    const p2 = buildPath("D", "major", { layout: "2nps", updown: false, firstStroke: "down", position: 5 });
    const cross2 = p2.nodes.filter((n) => n.crossing).map((n) => n.crossing);
    add("MI-11 2nps ascending all outside", true, cross2.length > 0 && cross2.every((c) => c === "outside"));

    // 3nps ascending alternates inside/outside
    const p3 = buildPath("D", "major", { layout: "3nps", updown: false, firstStroke: "down", position: 5 });
    const cross3 = p3.nodes.filter((n) => n.crossing).map((n) => n.crossing);
    let alt = cross3.length > 1;
    for (let i = 1; i < cross3.length; i++) if (cross3[i] === cross3[i - 1]) alt = false;
    add("MI-11 3nps ascending alternates", true, alt);

    // strict alternate picking: strokes never repeat
    let strict = true;
    for (let i = 1; i < p3.nodes.length; i++) if (p3.nodes[i].stroke === p3.nodes[i - 1].stroke) strict = false;
    add("strokes strictly alternate", true, strict);

    // up-and-down path length = 2n-1
    const full = buildPath("D", "major", { layout: "3nps", updown: true, position: 5 });
    add("up/down path length", 2 * 18 - 1, full.nodes.length);

    // MI-12: every layout x mode x tonic must fit the neck on EVERY tuning,
    // including the 4-course bouzouki and the 3-course trichordo.
    const misses = [];
    window.Tuning.TUNINGS.forEach((tun) => {
      window.Tuning.set(tun.id);
      ["3nps", "2nps", "box", "horizontal"].forEach((L) => {
        M.MODE_ORDER.forEach((m) => M.TONICS.forEach((t) => {
          const p = buildPath(t, m, { layout: L, position: 5 });
          if (!p) { misses.push(tun.id + "/" + L + "/" + m + "/" + t); return; }
          p.nodes.forEach((n) => {
            if (n.fret < 0 || n.fret > MAX_FRET || n.stringIndex < 0 || n.stringIndex >= nStrings()) {
              misses.push(tun.id + "/" + L + "/" + m + "/" + t + " offneck");
            }
          });
        }));
      });
    });
    window.Tuning.set("guitar");
    add("MI-12 all layouts fit every tuning", "0 misses",
        misses.length ? misses.length + " misses: " + misses.slice(0, 3).join(", ") : "0 misses");

    // cells: 3..8 then 7..3, target is always the last note, top cell is an octave
    const cells = buildCells("D", "major", {});
    add("cell count (3-8 then 7-3)", 11, cells.length);
    add("cell sizes", "3,4,5,6,7,8,7,6,5,4,3", cells.map((c) => c.size).join(","));
    add("target is last note", true, cells.every((c) => c.target === c.notes[c.notes.length - 1]));
    const oct = cells.find((c) => c.isOctave);
    add("octave cell spans 12 semitones", 12, oct.notes[7].midi - oct.notes[0].midi);

    window.Tuning.set(restoreTuning);
    return { ok, results };
  }

  window.Practice = {
    crossingType, buildPath, buildCells, layCell, positionsFor, scalePitches, selfTest
  };
})();
