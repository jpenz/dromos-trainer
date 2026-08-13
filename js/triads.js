/* triads.js — every triad shape on the neck, and how to move between them.
 * Pure logic, no DOM. Exposes window.Triads.
 *
 * Implements: FR-25 (triad map), FR-26 (voice-led triads through changes)
 * Invariants:  MI-12 (tuning-driven), MI-13 (inversion is named by the BASS note),
 *              MI-24 (one fixed string set; looping paths price their closure)
 * See docs/REQUIREMENTS.md and docs/SOLOING.md.
 */
(function () {
  "use strict";
  const MAX_SPAN = 5;
  const open = () => window.Tuning.open();
  const maxFret = () => window.Tuning.frets();

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

  // Position zones are intentionally overlapping. A player should be able to
  // keep one visual neighbourhood while the harmony changes, without treating
  // an arbitrary fret boundary as a musical rule.
  const POSITION_ZONES = {
    open:  { id: "open",  label: "Open · frets 0–5",  min: 0, max: 5,  centre: 2.5 },
    mid:   { id: "mid",   label: "Middle · frets 3–10", min: 3, max: 10, centre: 6.5 },
    upper: { id: "upper", label: "Upper · frets 8–15", min: 8, max: 15, centre: 11.5 },
    whole: { id: "whole", label: "Whole neck · ≤ 15", min: 0, max: 15, centre: 7 }
  };

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

        for (let f0 = 0; f0 <= maxFret(); f0++) {
          if (pcOf(OPEN[set[0]] + f0) !== pcs[0]) continue;
          for (let f1 = Math.max(0, f0 - MAX_SPAN); f1 <= f0 + MAX_SPAN && f1 <= maxFret(); f1++) {
            if (pcOf(OPEN[set[1]] + f1) !== pcs[1]) continue;
            if (OPEN[set[1]] + f1 <= OPEN[set[0]] + f0) continue;      // must ascend
            for (let f2 = Math.max(0, f0 - MAX_SPAN); f2 <= f0 + MAX_SPAN && f2 <= maxFret(); f2++) {
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

  function shapeCentre(shape) {
    return shape.placements.reduce((total, placement) => total + placement.fret, 0) / shape.placements.length;
  }

  function defaultStringSet() {
    // Highest adjacent set: guitar G-B-E; bouzouki/laouto the top three
    // courses. This is the clearest register for hearing a triad as a melodic
    // object and prevents an "auto" route from jumping between string sets.
    return Math.max(0, window.Tuning.count() - 3);
  }

  function transitionCost(from, to) {
    let total = 0;
    for (let i = 0; i < to.placements.length; i++) {
      const distance = Math.abs(to.placements[i].midi - from.placements[i].midi);
      total += distance;
      if (distance > 4) total += (distance - 4) * 1.8;
    }
    // A common pitch class is heard as a held voice even when the hand has to
    // respell it. Rewarding it lightly makes the generated route more musical.
    const shared = to.placements.filter((placement) =>
      from.placements.some((previous) => previous.note.pc === placement.note.pc)).length;
    return total - shared * 0.7;
  }

  function shapeCost(shape, targetFret) {
    return shape.span * 0.42 + Math.abs(shapeCentre(shape) - targetFret) * 0.22;
  }

  function candidatesFor(chord, options) {
    const triadId = TRIAD_OF[chord.quality] || "maj";
    const zone = POSITION_ZONES[options.zone] || POSITION_ZONES.mid;
    const all = allShapes(chord.rootPc, triadId, options.nameFor)
      .filter((shape) => shape.stringSet[0] === options.stringSet)
      .filter((shape) => shape.placements.every((placement) => placement.fret <= 15));
    const inside = all.filter((shape) => shape.lowFret >= zone.min &&
      Math.max.apply(null, shape.placements.map((placement) => placement.fret)) <= zone.max);
    // Some tunings do not contain every inversion inside every narrow zone.
    // Fall back to the practical 0–15 neck, never to another string set.
    return (inside.length ? inside : all).map((shape) => Object.assign({ triadId }, shape));
  }

  function solvePath(candidateSets, targetFret, closeLoop) {
    if (!candidateSets.length || candidateSets.some((set) => !set.length)) return [];
    let winner = null;
    const starts = closeLoop ? candidateSets[0] : [null];

    starts.forEach((forcedStart) => {
      let costs = candidateSets[0].map((shape) => forcedStart && shape !== forcedStart
        ? Infinity
        : shapeCost(shape, targetFret));
      const back = [];

      for (let step = 1; step < candidateSets.length; step++) {
        const previous = candidateSets[step - 1];
        const current = candidateSets[step];
        const nextCosts = current.map(() => Infinity);
        const nextBack = current.map(() => -1);
        current.forEach((shape, currentIndex) => {
          previous.forEach((prior, priorIndex) => {
            const cost = costs[priorIndex] + transitionCost(prior, shape) + shapeCost(shape, targetFret);
            if (cost < nextCosts[currentIndex]) {
              nextCosts[currentIndex] = cost;
              nextBack[currentIndex] = priorIndex;
            }
          });
        });
        costs = nextCosts;
        back.push(nextBack);
      }

      let end = 0;
      let bestCost = Infinity;
      candidateSets[candidateSets.length - 1].forEach((shape, index) => {
        const loopCost = forcedStart ? transitionCost(shape, forcedStart) : 0;
        if (costs[index] + loopCost < bestCost) {
          bestCost = costs[index] + loopCost;
          end = index;
        }
      });
      const path = new Array(candidateSets.length);
      path[path.length - 1] = candidateSets[path.length - 1][end];
      for (let step = path.length - 1; step > 0; step--) {
        end = back[step - 1][end];
        path[step - 1] = candidateSets[step - 1][end];
      }
      if (!winner || bestCost < winner.cost) winner = { cost: bestCost, path };
    });
    return winner ? winner.path : [];
  }

  /* Walk a complete progression using one fixed string set. A dynamic program
   * evaluates the whole route instead of greedily choosing the next attractive
   * grip. `closeLoop` also prices the final-to-first move for cycle practice. */
  function pathThrough(chords, opts) {
    const requested = Object.assign({ stringSet: null, startFret: null, zone: "mid", closeLoop: false, nameFor: null }, opts || {});
    const stringSet = requested.stringSet == null ? defaultStringSet() : requested.stringSet;
    const zone = POSITION_ZONES[requested.zone] || POSITION_ZONES.mid;
    const targetFret = requested.startFret == null ? zone.centre : requested.startFret;
    const options = Object.assign({}, requested, { stringSet });
    const solved = solvePath(chords.map((chord) => candidatesFor(chord, options)), targetFret, requested.closeLoop);
    return solved.map((shape, index) => Object.assign({
      chord: chords[index],
      triadId: shape.triadId,
      triadName: TRIADS[shape.triadId].name
    }, shape));
  }

  function pathMetrics(path, closeLoop) {
    const moves = [];
    const limit = path.length - (closeLoop ? 0 : 1);
    for (let i = 0; i < limit; i++) {
      const from = path[i];
      const to = path[(i + 1) % path.length];
      if (!from || !to) continue;
      const voices = to.placements.map((placement, index) => Math.abs(placement.midi - from.placements[index].midi));
      moves.push({ voices, total: voices.reduce((sum, distance) => sum + distance, 0), max: Math.max.apply(null, voices) });
    }
    const total = moves.reduce((sum, move) => sum + move.total, 0);
    return {
      moves,
      total,
      averagePerChange: moves.length ? total / moves.length : 0,
      averagePerVoice: moves.length ? total / moves.length / 3 : 0,
      maxVoice: moves.length ? Math.max.apply(null, moves.map((move) => move.max)) : 0
    };
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
    const path = pathThrough(chords, { stringSet: 2, zone: "mid", closeLoop: true });
    const metrics = pathMetrics(path, true);
    add("voice-led triad path stays on one string set", true,
      path.every((shape) => shape.stringSet[0] === 2));
    add("voice-led triad path is compact (< 4 semitones per voice)", true,
      metrics.averagePerVoice < 4);

    const fullCycle = pathThrough(window.Theory.buildCycle(), { zone: "mid", closeLoop: true });
    add("full cycle has one practical triad per chord", 18, fullCycle.length);
    add("full cycle closes on the same fixed string set", 1,
      new Set(fullCycle.map((shape) => shape.stringSet[0])).size);

    window.Tuning.set(restore);
    return { ok, results };
  }

  window.Triads = {
    TRIADS, TRIAD_OF, INVERSION_NAME, INVERSION_SHORT, POSITION_ZONES,
    stringSets3, allShapes, pathThrough, pathMetrics, selfTest
  };
})();
