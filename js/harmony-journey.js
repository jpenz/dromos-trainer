/* harmony-journey.js — one source of truth for current/next harmony.
 * Full Cycle, one ii–V–I, pivot pairs, Song Map, manual stepping, and
 * playback all consume this model so the guide cannot drift from the audio.
 */
(function () {
  "use strict";

  const mod = (value, length) => ((value % length) + length) % length;

  function sequenceForCycle(mode, index, cycle) {
    const length = cycle.length;
    if (mode === "iiVI") {
      const group = Math.floor(mod(index, length) / 3) * 3;
      return [group, group + 1, group + 2];
    }
    if (mode === "pivot") {
      const cursor = mod(index, length);
      const chord = cycle[cursor];
      let oldI;
      if (chord.fn === "I") oldI = cursor;
      else if (chord.fn === "ii") oldI = mod(cursor - 1, length);
      else oldI = mod(Math.floor(cursor / 3) * 3 + 2, length);
      return [oldI, mod(oldI + 1, length)];
    }
    return cycle.map((_, itemIndex) => itemIndex);
  }

  function item(chord, sourceIndex, holdI) {
    return {
      id: `${sourceIndex}:${chord.symbol}`,
      sourceIndex,
      chord,
      symbol: chord.symbol,
      functionLabel: chord.degreeLabel || chord.fn || "chord",
      keyLabel: chord.key || "",
      durationBars: holdI && chord.fn === "I" ? 2 : 1
    };
  }

  function pcSet(chord) { return new Set((chord && chord.notes || []).map((note) => note.pc)); }

  function transition(now, next, kind, wrapped) {
    if (!now || !next) return null;
    const from = pcSet(now.chord), to = pcSet(next.chord);
    const heldPcs = Array.from(to).filter((pc) => from.has(pc));
    const enteringPcs = Array.from(to).filter((pc) => !from.has(pc));
    const leavingPcs = Array.from(from).filter((pc) => !to.has(pc));
    const isPivot = now.chord.fn === "I" && next.chord.fn === "ii";
    const isResolution = now.chord.fn === "V" && next.chord.fn === "I";
    return {
      kind: wrapped ? "loop" : isPivot ? "pivot" : isResolution ? "resolution" : kind === "song" ? "song-change" : "within-key",
      heldPcs, enteringPcs, leavingPcs,
      cue: isPivot
        ? `${now.symbol} changes role: major I becomes minor ii of ${next.keyLabel}.`
        : isResolution ? `Hear the dominant tension settle into ${next.symbol}.`
          : heldPcs.length ? `Keep ${heldPcs.length} shared tone${heldPcs.length === 1 ? "" : "s"}; move the other voices toward ${next.symbol}.`
            : `Release ${now.symbol} and pre-hear ${next.symbol}.`
    };
  }

  function buildJourney(options) {
    const input = options || {};
    const kind = input.kind === "song" ? "song" : "cycle";
    let source;
    let cursorSource;
    if (kind === "cycle") {
      const cycle = input.cycle || [];
      const indices = sequenceForCycle(input.mode || "full", input.index || 0, cycle);
      source = indices.map((sourceIndex) => item(cycle[sourceIndex], sourceIndex, input.holdI));
      cursorSource = mod(input.index || 0, cycle.length);
    } else {
      const chords = input.chords || [];
      source = chords.map((chord, sourceIndex) => item(chord, sourceIndex, input.holdI));
      cursorSource = Math.max(0, Math.min(source.length - 1, input.step || 0));
    }
    if (!source.length) return { kind, items: [], cursor: 0, now: null, next: null, previous: null, transition: null, lookahead: [] };
    let cursor = source.findIndex((entry) => entry.sourceIndex === cursorSource);
    if (cursor < 0) cursor = 0;
    const now = source[cursor];
    const atEnd = cursor === source.length - 1;
    const next = atEnd ? (input.loop ? source[0] : null) : source[cursor + 1];
    const previous = cursor === 0 ? (input.loop ? source[source.length - 1] : null) : source[cursor - 1];
    return {
      kind, mode: input.mode || null, items: source, cursor, now, next, previous,
      transition: transition(now, next, kind, atEnd && !!next),
      lookahead: source.slice(cursor + 1, cursor + 4),
      label: kind === "song" ? "Song Map" : input.mode === "iiVI" ? "Single ii–V–I" : input.mode === "pivot" ? "I → next ii pivot" : "Full cycle"
    };
  }

  function selfTest() {
    const cycle = window.Theory ? window.Theory.buildCycle() : [];
    const results = [];
    const add = (name, pass) => results.push({ name, pass });
    const full = buildJourney({ kind: "cycle", cycle, mode: "full", index: 0, loop: true, holdI: true });
    add("full cycle contains 18 unique chord items", full.items.length === 18 && new Set(full.items.map((entry) => entry.sourceIndex)).size === 18);
    const single = buildJourney({ kind: "cycle", cycle, mode: "iiVI", index: 4, loop: true });
    add("single drill stays inside one ii-V-I group", single.items.map((entry) => entry.sourceIndex).join(",") === "3,4,5");
    [0, 1, 2, 3, 17].forEach((index) => {
      const pivot = buildJourney({ kind: "cycle", cycle, mode: "pivot", index, loop: true });
      add(`pivot at ${index} is adjacent I to ii`, pivot.items.length === 2 && pivot.items[0].chord.fn === "I" && pivot.items[1].chord.fn === "ii" && mod(pivot.items[0].sourceIndex + 1, cycle.length) === pivot.items[1].sourceIndex);
    });
    const noLoop = buildJourney({ kind: "cycle", cycle, mode: "iiVI", index: 2, loop: false });
    add("loop off exposes an honest end", noLoop.next === null);
    add("hold I changes duration, not sequence", full.items.find((entry) => entry.chord.fn === "I").durationBars === 2 && full.items.length === 18);
    return { ok: results.every((result) => result.pass), results };
  }

  window.HarmonyJourney = { sequenceForCycle, buildJourney, selfTest };
})();
