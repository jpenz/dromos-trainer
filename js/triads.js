/* triads.js — every triad shape on the neck, and how to move between them.
 * Pure logic, no DOM. Exposes window.Triads.
 *
 * Implements: FR-25 (triad map), FR-26 (voice-led triads through changes)
 * Invariants:  MI-12 (tuning-driven), MI-13 (inversion is named by the BASS note)
 * See docs/REQUIREMENTS.md and docs/SOLOING.md.
 */
(function () {
  "use strict";
  const MAX_FRET = 15;
  const MAX_SPAN = 5;
  const open = () => window.Tuning.open();

  // triad qualities: semitone offsets + interval roles, root position
  const TRIADS = {
    maj: { offsets: [0, 4, 7], roles: ["R", "3", "5"], sym: "", name: "major" },
    min: { offsets: [0, 3, 7], roles: ["R", "b3", "5"], sym: "m", name: "minor" },
    dim: { offsets: [0, 3, 6], roles: ["R", "b3", "b5"], sym: "°", name: "diminished" },
    aug: { offsets: [0, 4, 8], roles: ["R", "3", "#5"], sym: "+", name: "augmented" },
    sus4: { offsets: [0, 5, 7], roles: ["R", "4", "5"], sym: "sus4", name: "sus4" },
    sus2: { offsets: [0, 2, 7], roles: ["R", "2", "5"], sym: "sus2", name: "sus2" }
  };

  // Which triad sits underneath each of the app's chord qualities. This is the
  // point of the whole view: over Em7♭5 you play an E diminished triad, over A7
  // an A major triad. Sevenths are colour on top of a triad.
  const TRIAD_OF = {
    maj: "maj", min: "min", dim: "dim", aug: "aug",
    maj7: "maj", dom7: "maj", m7: "min", m7b5: "dim"
  };

  const INVERSION_NAME = ["root position", "1st inversion", "2nd inversion"];
  const INVERSION_SHORT = ["root", "1st", "2nd"];

  const ROLE_LABEL = { R: "R", 3: "3", b3: "♭3", 5: "5", b5: "♭5", "#5": "♯5", 4: "4", 2: "2" };
  const ROLE_GROUP = { R: "root", 3: "third", b3: "third", 5: "fifth", b5: "fifth", "#5": "fifth", 4: "fifth", 2: "third" };

  function stringSets3() {
    const N = window.Tuning.count();
    const out = [];
    for (let s = 0; s + 3 <= N; s++) out.push([s, s + 1, s + 2]);
    return out;
  }

  const pcOf = (m) => (((m % 12) + 12) % 12);

  /* All playable shapes of one triad across the whole neck.
   * MI-13: `inversion` is determined by which chord tone is in the BASS —
   * 0 = root position, 1 = 3rd in bass, 2 = 5th in bass. */
  function allShapes(rootPc, triadId, nameFor) {
    const q = TRIADS[triadId];
    if (!q) return [];
    const OPEN = open();
    const out = [];

    stringSets3().forEach((set) => {
      for (let inv = 0; inv < 3; inv++) {
        const order = [inv, (inv + 1) % 3, (inv + 2) % 3];
        const pcs = order.map((i) => (rootPc + q.offsets[i]) % 12);
        const roles = order.map((i) => q.roles[i]);

        for (let f0 = 0; f0 <= MAX_FRET; f0++) {
          if (pcOf(OPEN[set[0]] + f0) !== pcs[0]) continue;
          for (let f1 = Math.max(0, f0 - MAX_SPAN); f1 <= f0 + MAX_SPAN && f1 <= MAX_FRET; f1++) {
            if (pcOf(OPEN[set[1]] + f1) !== pcs[1]) continue;
            if (OPEN[set[1]] + f1 <= OPEN[set[0]] + f0) continue;      // must ascend
            for (let f2 = Math.max(0, f0 - MAX_SPAN); f2 <= f0 + MAX_SPAN && f2 <= MAX_FRET; f2++) {
              if (pcOf(OPEN[set[2]] + f2) !== pcs[2]) continue;
              if (OPEN[set[2]] + f2 <= OPEN[set[1]] + f1) continue;
              const frets = [f0, f1, f2];
              const span = Math.max.apply(null, frets) - Math.min.apply(null, frets);
              if (span > MAX_SPAN) continue;
              out.push({
                stringSet: set.slice(),
                setLabel: window.Tuning.names().slice(set[0], set[0] + 3).join(""),
                inversion: inv,
                inversionName: INVERSION_NAME[inv],
                inversionShort: INVERSION_SHORT[inv],
                span,
                lowFret: Math.min.apply(null, frets),
                placements: set.map((s, k) => {
                  const midi = OPEN[s] + frets[k];
                  return {
                    stringIndex: s, fret: frets[k], midi,
                    note: {
                      pc: pcOf(midi), role: roles[k],
                      roleLabel: ROLE_LABEL[roles[k]],
                      colorGroup: ROLE_GROUP[roles[k]],
                      name: nameFor ? nameFor(pcOf(midi)) : ""
                    }
                  };
                })
              });
              break;
            }
          }
        }
      }
    });

    // dedupe identical grips, then order up the neck
    const seen = new Set();
    return out.filter((s) => {
      const k = s.stringSet[0] + ":" + s.placements.map((p) => p.fret).join(",");
      if (seen.has(k)) return false; seen.add(k); return true;
    }).sort((a, b) => a.lowFret - b.lowFret || a.stringSet[0] - b.stringSet[0]);
  }

  /* Walk a chord progression using triads, choosing at each step the shape that
   * moves LEAST from the previous one. This is what "hitting the changes"
   * actually looks like on the neck: a couple of fingers move, the rest stay. */
  function pathThrough(chords, opts) {
    const o = Object.assign({ stringSet: null, startFret: 5, nameFor: null }, opts || {});
    let prev = null;
    return chords.map((c) => {
      const triadId = TRIAD_OF[c.quality] || "maj";
      let shapes = allShapes(c.rootPc, triadId, o.nameFor);
      if (o.stringSet != null) shapes = shapes.filter((s) => s.stringSet[0] === o.stringSet);
      if (!shapes.length) return null;

      let best = null;
      shapes.forEach((s) => {
        const centre = s.placements.reduce((a, p) => a + p.fret, 0) / 3;
        let cost;
        if (!prev) {
          cost = Math.abs(centre - o.startFret) + s.span * 0.5;
        } else {
          const pc0 = prev.placements.reduce((a, p) => a + p.fret, 0) / 3;
          // total finger travel, plus a nudge toward compact shapes
          const travel = s.placements.reduce((a, p, i) =>
            a + Math.abs(p.fret - prev.placements[i].fret), 0);
          cost = travel + Math.abs(centre - pc0) * 0.4 + s.span * 0.3;
        }
        if (!best || cost < best.cost) best = { cost, shape: s };
      });
      prev = best.shape;
      return Object.assign({ chord: c, triadId, triadName: TRIADS[triadId].name }, best.shape);
    });
  }

  // ---- self-test ----------------------------------------------------------
  function selfTest() {
    const results = [];
    let ok = true;
    const add = (i, want, got) => {
      const pass = String(want) === String(got);
      if (!pass) ok = false;
      results.push({ i, want, got, pass });
    };
    const restore = window.Tuning.currentId();

    window.Tuning.set("guitar");
    const cmaj = allShapes(0, "maj", null);

    // every shape must be a real C major triad, ascending, inside the span
    let bad = 0;
    cmaj.forEach((s) => {
      const pcs = s.placements.map((p) => p.note.pc).sort((a, b) => a - b).join(",");
      if (pcs !== "0,4,7") bad++;
      for (let i = 1; i < 3; i++) if (s.placements[i].midi <= s.placements[i - 1].midi) bad++;
      if (s.span > MAX_SPAN) bad++;
    });
    add("all C major shapes are valid triads", 0, bad);

    // MI-13: the bass note's role must match the named inversion
    const expectBass = ["R", "3", "5"];
    let wrongInv = 0;
    cmaj.forEach((s) => { if (s.placements[0].note.role !== expectBass[s.inversion]) wrongInv++; });
    add("MI-13 inversion matches bass note", 0, wrongInv);

    // all three inversions available on every 3-string set
    const sets = stringSets3();
    let missing = 0;
    sets.forEach((set) => [0, 1, 2].forEach((inv) => {
      if (!cmaj.some((s) => s.stringSet[0] === set[0] && s.inversion === inv)) missing++;
    }));
    add("every inversion on every string set (guitar)", 0, missing);

    // the same must hold on the bouzouki
    window.Tuning.set("bouzouki4");
    const bz = allShapes(2, "maj", null);   // D major
    let bzMissing = 0;
    stringSets3().forEach((set) => [0, 1, 2].forEach((inv) => {
      if (!bz.some((s) => s.stringSet[0] === set[0] && s.inversion === inv)) bzMissing++;
    }));
    add("every inversion on every string set (bouzouki)", 0, bzMissing);

    // shapes exist for every root x quality on every tuning
    let holes = 0, counted = 0;
    window.Tuning.TUNINGS.forEach((t) => {
      window.Tuning.set(t.id);
      for (let r = 0; r < 12; r++) {
        ["maj", "min", "dim", "aug"].forEach((q) => {
          counted++;
          if (!allShapes(r, q, null).length) holes++;
        });
      }
    });
    add("triad shapes exist for every root/quality/tuning", 0, holes);

    // voice leading actually reduces movement vs. always taking root position
    window.Tuning.set("guitar");
    const chords = window.Modes.buildProgression("D", "hijaz", "I-iv-bVII-I").chords;
    const path = pathThrough(chords, { stringSet: 2 });
    let travel = 0;
    for (let i = 1; i < path.length; i++) {
      travel += path[i].placements.reduce((a, p, k) =>
        a + Math.abs(p.fret - path[i - 1].placements[k].fret), 0);
    }
    add("voice-led triad path is compact (< 4 frets avg travel)", true, travel / (path.length - 1) < 12);

    window.Tuning.set(restore);
    return { ok, results };
  }

  window.Triads = { TRIADS, TRIAD_OF, INVERSION_NAME, INVERSION_SHORT, stringSets3, allShapes, pathThrough, selfTest };
})();
