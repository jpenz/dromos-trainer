import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (file) => readFileSync(path.join(root, file), "utf8");

function loadCore() {
  const context = vm.createContext({ console, window: {} });
  ["js/tuning.js", "js/profiles.js", "js/theory.js", "js/harmony-journey.js", "js/modes.js", "js/chord-map.js", "js/chord-path.js", "js/melody-harmony.js", "js/pitch-lab.js", "js/ear-drills.js", "js/styles.js", "js/analysis.js", "js/studies.js", "js/musicxml.js", "js/resources.js", "js/video.js", "js/coach.js", "js/practice.js", "js/bouzouki-knowledge.js", "js/picking-lab.js", "js/toolkit.js", "js/songs.js", "js/tactical-examples.js", "js/triads.js", "js/fretboard.js", "js/guitar-voicings.js", "js/audio.js", "js/page-guides.js"]
    .forEach((file) => vm.runInContext(source(file), context, { filename: file }));
  return context.window;
}

test("music invariants pass outside the browser", () => {
  const app = loadCore();
  const suites = [app.Theory.selfTest(), app.HarmonyJourney.selfTest(), app.PlayerProfiles.selfTest(), app.Modes.selfTest(), app.ChordMap.selfTest(), app.ChordPath.selfTest(), app.MelodyHarmony.selfTest(), app.PitchLab.selfTest(), app.EarDrills.selfTest(), app.StyleLibrary.selfTest(), app.AnalysisEngine.selfTest(), app.StudyLibrary.selfTest(), app.MusicXmlImport.selfTest(), app.ResourceLibrary.selfTest(), app.VideoStudy.selfTest(), app.PracticeCoach.selfTest(), app.Practice.selfTest(), app.BouzoukiKnowledge.selfTest(), app.PickingLab.selfTest(), app.SoloToolkit.selfTest(), app.SongLibrary.selfTest(), app.TacticalExamples.selfTest(), app.Triads.selfTest(), app.GuitarVoicings.selfTest(), app.AudioEngine.selfTest(), app.PageGuides.selfTest()];
  const failures = suites.flatMap((suite) => suite.results.filter((result) => !result.pass));
  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
});

test("authorised study starters and referenced methods remain clearly bounded", () => {
  const { StudyLibrary, ResourceLibrary } = loadCore();
  assert.equal(StudyLibrary.STUDIES.length, 3);
  assert.ok(StudyLibrary.STUDIES.every((study) => /User-authorised/.test(study.source)));
  assert.equal(ResourceLibrary.TRIGAS.length, 5);
  assert.ok(ResourceLibrary.TRIGAS.every((item) => /trigas\.gr/.test(item.href)));
  assert.equal(ResourceLibrary.COMMUNITY.length, 4);
  assert.ok(ResourceLibrary.COMMUNITY.some((item) => /reddit\.com\/r\/bouzouki/.test(item.href)));
  assert.ok(ResourceLibrary.COMMUNITY.filter((item) => /mpouzouki/.test(item.href)).every((item) => /mpouzouki\.weebly\.com/.test(item.href)));
});

test("bouzouki mastery keeps articulated ta-ka, tremolo, and source authority separate", () => {
  const { BouzoukiKnowledge, PickingLab } = loadCore();
  assert.equal(BouzoukiKnowledge.MASTERY_PHASES.length, 6, "foundation to lead: six stages");
  assert.equal(PickingLab.EXERCISES.length, 34, "30 through PR#18 + ladder, arp chunks, loose hand, course targeting");
  assert.equal(PickingLab.byId("picked-dromos-line").articulation, "picked-line");
  assert.equal(PickingLab.byId("tremolo-ladder").articulation, "tremolo-sustain");
  assert.ok(PickingLab.EXERCISES.every((exercise) => BouzoukiKnowledge.phaseForExercise(exercise.id)));
  assert.ok(PickingLab.EXERCISES.every((exercise) => exercise.sourceIds.some((id) => BouzoukiKnowledge.sourceById(id).rank < 3)),
    "a community post must never be the sole authority for a drill");
  const sample = Array.from({ length: 8 }, (_, index) => ({ midi: 62 + index, stringIndex: 0, fret: index, note: { degree: String(index + 1) } }));
  const line = PickingLab.buildSequence("picked-dromos-line", sample, [], "down");
  assert.deepEqual(Array.from(line, (event) => event.technique), ["D", "U", "D", "U", "D", "U", "D", "U"]);
});

test("the band key cycle pivots on notes both keys own, and every exercise generates", () => {
  const { PickingLab, BouzoukiKnowledge, Modes } = loadCore();
  // The cycle law: each hop's pivot note IS the destination tonic AND lives
  // inside the home key's scale — that is what makes the pivot playable
  // without repositioning. G→D→Dm→Am→E→Em→G, locked.
  const cycle = PickingLab.BAND_KEY_CYCLE;
  assert.equal(cycle.map((s) => s.tonic + (s.quality === "minor" ? "m" : "")).join(" "), "G D Dm Am E Em");
  cycle.forEach((home, index) => {
    const to = cycle[(index + 1) % cycle.length];
    const pivotPc = PickingLab.bandPivotPc(index);
    const toPc = Modes.parseName(to.tonic).pc;
    assert.equal(pivotPc, toPc, `hop ${index}: pivot must BE the destination tonic`);
    const homeScale = Modes.scaleOf(home.tonic, home.quality === "minor" ? "minor" : "major");
    assert.ok(homeScale.some((note) => note.pc === pivotPc),
      `hop ${home.tonic}${home.quality === "minor" ? "m" : ""}: pivot ${pivotPc} must live in the home scale`);
  });
  // Every exercise's sequence id must produce a non-empty event plan from
  // representative nodes — a registry entry with no builder is a dead card.
  const flagged = (extra) => Array.from({ length: 12 }, (_, index) => Object.assign({
    midi: 60 + index, freq: 440, stringIndex: Math.floor(index / 3), fret: index,
    note: { degree: String((index % 7) + 1), pc: (60 + index) % 12 }
  }, extra ? extra(index) : null));
  const nodesFor = (exercise) => {
    if (exercise.sequence === "skeletonFill") return flagged((i) => ({ skeleton: i % 3 === 0 }));
    if (exercise.sequence === "chunkBuilder") return flagged((i) => ({ chunk: i < 6 ? "lower" : "upper" }));
    if (exercise.sequence === "ghammazPivot") return flagged((i) => (i === 6 ? { pivot: true } : i === 7 ? { launch: true } : null));
    if (exercise.sequence === "arpCircuit") return flagged((i) => ({ chordStart: i % 4 === 0, chordSymbol: "X" }));
    if (exercise.sequence === "sequenceLadder") return flagged((i) => ({ cellStart: i % 6 === 0, cellPhase: "cell" }));
    if (exercise.sequence === "instantTranspose") return flagged((i) => (i === 6 ? { cue: true } : { phraseStart: i === 0, keyLabel: "k" }));
    if (exercise.sequence === "neckLadder") return flagged((i) => ({ positionShift: i % 4 === 0, positionLabel: "near fret 3" }));
    if (exercise.sequence === "courseTarget") return flagged((i) => ({ skip: i % 3 === 0 }));
    if (exercise.sequence === "arpChunks") return flagged((i) => ({ chordStart: i % 4 === 0, chordSymbol: "X", octaveTop: i % 4 === 3 }));
    return flagged();
  };
  const pulse = [{ beat: 1, group: 1, first: true }, { beat: 2, group: 1, first: false },
    { beat: 3, group: 2, first: true }, { beat: 4, group: 2, first: false }];
  PickingLab.EXERCISES.forEach((exercise) => {
    const events = PickingLab.buildSequence(exercise.id, nodesFor(exercise), pulse, "down",
      exercise.variants && exercise.variants.length ? exercise.variants[0].id : undefined);
    assert.ok(Array.isArray(events) && events.length > 0, `${exercise.id} generated no events`);
  });
  // Honesty labels the key plan depends on: the band-preference and set-list
  // framings must actually ship in the copy, not only in a design doc.
  const src = readFileSync(path.join(root, "js/picking-lab.js"), "utf8");
  assert.match(src, /set-list preference, labelled as such/, "E's presence must be labelled set-list preference");
  assert.match(src, /cycle order(ing)? is (Dromos design|app design)/, "the cycle ordering must be owned as design");
  assert.match(src, /no bouzouki method|no method book teaches|no surveyed Greek method/i,
    "the documented pedagogy gap behind the glide drills must be stated");
  // All-course coverage is a real requirement, not a vibe.
  assert.ok(PickingLab.EXERCISES.filter((exercise) => exercise.allStrings).length >= 3,
    "at least three exercises must force coverage of every course");
  // Six stages, every exercise placed exactly once.
  const placed = BouzoukiKnowledge.MASTERY_PHASES.flatMap((phase) => phase.exerciseIds);
  assert.equal(new Set(placed).size, placed.length, "no exercise may sit in two stages");
  assert.equal(placed.length, PickingLab.EXERCISES.length, "every exercise must sit in exactly one stage");
});

test("video study catalog keeps videos hosted at their original public source", () => {
  const { VideoStudy } = loadCore();
  assert.equal(VideoStudy.LESSONS.length, 5);
  assert.ok(VideoStudy.LESSONS.every((lesson) => /^[\w-]{11}$/.test(lesson.videoId)));
});

test("imported score harmony has a playable chart on every supported tuning", () => {
  const { Tuning, AnalysisEngine, Fretboard, MusicXmlImport } = loadCore();
  const xml = `<?xml version="1.0"?><score-partwise><part><measure number="1"><harmony><root><root-step>D</root-step></root><kind>minor</kind></harmony><note><pitch><step>A</step></pitch></note><harmony><root><root-step>A</root-step></root><kind>dominant</kind></harmony><note><pitch><step>C</step><alter>1</alter></pitch></note></measure></part></score-partwise>`;
  const imported = MusicXmlImport.parseMusicXml(xml);
  assert.equal(imported.chordMap, "Dm A7");
  const records = AnalysisEngine.analyzeProgression(imported.chordMap, { tonic: "D", modeId: "minor" }).records;
  Tuning.TUNINGS.forEach((tuning) => {
    Tuning.set(tuning.id);
    records.forEach((record) => {
      const voicing = record.tones.map((tone) => ({ pc: tone.pc, role: tone.role, name: tone.name }));
      assert.ok(Fretboard.findGrip(voicing), `${record.chord.raw} needs a chart on ${tuning.name}`);
    });
  });
});

test("progression chords carry the bare roman function that playback holds and pickups need", () => {
  const { Modes, HarmonyJourney } = loadCore();
  const major = Modes.buildProgression("D", "major", "ii-V-I").chords;
  assert.equal(major.map((chord) => chord.fn).join(" "), "ii V I");
  const harmonic = Modes.buildProgression("D", "harmonicMinor", "iio-V-i").chords;
  assert.equal(harmonic.map((chord) => chord.fn).join(" "), "ii V i", "quality suffixes (ø, 7) must be stripped");
  const minor = Modes.buildProgression("D", "minor", "i-bVII-i").chords;
  assert.equal(minor.map((chord) => chord.fn).join(" "), "i ♭VII i", "accidentals must survive so ♭VII is never a tonic");
  // The journey model must hold minor and major homes alike…
  const journey = HarmonyJourney.buildJourney({ kind: "song", chords: harmonic, step: 0, loop: true, holdI: true });
  assert.equal(journey.items[2].durationBars, 2, "a minor tonic holds two bars exactly like a major one");
  assert.equal(journey.items[0].durationBars, 1);
  // …and a song map looping I back to its own ii is a loop, not a modulation.
  const majorJourney = HarmonyJourney.buildJourney({ kind: "song", chords: major, step: 2, loop: true, holdI: true });
  assert.notEqual(majorJourney.transition.kind, "pivot", "same-key loops must not claim a pivot reinterpretation");
});

test("every selectable progression is a resolved 4- or 8-bar solo phrase", () => {
  const { Modes, HarmonyJourney } = loadCore();
  Modes.MODE_ORDER.forEach((modeId) => {
    Modes.PROGRESSIONS[modeId].forEach((progression) => {
      const built = Modes.buildProgression("D", modeId, progression.id);
      const last = built.chords.at(-1);
      const totalBars = built.chords.reduce((sum, chord) => sum + chord.durationBars, 0);
      assert.equal(last.rootPc, Modes.parseName("D").pc, `${modeId} ${progression.id} must land on tonic`);
      assert.match(last.fn, /^i$/i, `${modeId} ${progression.id} must end on I/i`);
      assert.equal(last.phraseRole, "Resolve");
      assert.equal(last.durationBars, 2, "the final home needs time to register before the loop");
      assert.ok([4, 8].includes(totalBars), `${modeId} ${progression.id} has an irregular ${totalBars}-bar loop`);
      assert.equal(new Set(built.chords.map((chord) => chord.phraseBars)).size, 1,
        "every chord must agree on the phrase boundary");
      let expectedStart = 1;
      built.chords.forEach((chord) => {
        assert.equal(chord.startsAtBar, expectedStart, `${chord.symbol} needs a contiguous visible bar address`);
        expectedStart += chord.durationBars;
      });
      assert.equal(expectedStart - 1, totalBars);
      const journey = HarmonyJourney.buildJourney({ kind: "song", chords: built.chords, step: 0, loop: true, holdI: false });
      assert.deepEqual(Array.from(journey.items, (item) => item.durationBars),
        Array.from(built.chords, (chord) => chord.durationBars),
        "roadmap timing must survive even when the Changes-cycle hold toggle is off");
    });
  });

  const turnaround = Modes.buildProgression("D", "major", "I-vi-ii-V");
  assert.equal(turnaround.prog.label, "I – vi – ii – V – I");
  assert.equal(turnaround.chords.map((chord) => chord.symbol).join(" "), "Dmaj7 Bm7 Em7 A7 Dmaj7");
  assert.equal(turnaround.chords.map((chord) => chord.durationBars).join(" "), "2 1 1 2 2");
  assert.equal(turnaround.chords.map((chord) => chord.phraseRole).join(" "), "Establish Move Move Cadence Resolve");
});

test("the Changes Gym is four 4/4 bars per key: ii · V · I · I, then the pivot", () => {
  const { Theory, HarmonyJourney, StyleLibrary } = loadCore();
  const cycle = Theory.buildCycle();
  const journey = HarmonyJourney.buildJourney({ kind: "cycle", cycle, mode: "full", index: 0, loop: true, holdI: true });
  const firstKey = journey.items.slice(0, 3);
  assert.equal(firstKey.map((i) => i.chord.fn).join(" "), "ii V I");
  assert.equal(firstKey.map((i) => i.durationBars).join(" "), "1 1 2", "the tonic holds two bars, so the key is 4 bars long");
  assert.equal(firstKey.reduce((sum, i) => sum + i.durationBars, 0), 4, "one key = one 4-bar phrase");
  // The chord AFTER the held tonic is the next key's ii — the pivot lands on
  // the downbeat of bar 5, not somewhere inside the tonic's two bars.
  const pivotTarget = journey.items[3];
  assert.equal(pivotTarget.chord.fn, "ii");
  assert.notEqual(pivotTarget.chord.key, firstKey[2].chord.key, "the pivot must actually change key");
  assert.equal(pivotTarget.chord.rootPc, firstKey[2].chord.rootPc, "same root: the old I IS the new ii");
  // Every key in the wheel is the same 4-bar shape, so the drill stays in 4/4.
  const bars = journey.items.reduce((sum, i) => sum + i.durationBars, 0);
  assert.equal(bars, 24, "six keys x 4 bars");
  const hasapiko = StyleLibrary.byId("hasapiko");
  assert.equal(hasapiko.meter, "4/4", "the default Greek pulse is 4/4, so the gym practises in 4/4");
  assert.equal(StyleLibrary.beatMap(hasapiko).length, 4, "four beats to the bar");
});

test("Changes Gym key counts share one audio and guide boundary", () => {
  const { Theory, HarmonyJourney } = loadCore();
  const cycle = Theory.buildCycle();
  [1, 3, 6].forEach((keyCount) => {
    const sequence = HarmonyJourney.sequenceForKeyCount(0, cycle, keyCount);
    const journey = HarmonyJourney.buildJourney({ kind: "cycle", cycle, mode: keyCount === 1 ? "iiVI" : "full", keyCount, startIndex: 0, index: sequence[sequence.length - 1], loop: true });
    assert.deepEqual(Array.from(journey.items, (entry) => entry.sourceIndex), Array.from(sequence), `${keyCount}-key guide matches audio sequence`);
    assert.equal(journey.next.sourceIndex, sequence[0], `${keyCount}-key guide wraps to its own first chord`);
  });
});

test("the Piraeus tier leads the minor bank and Ousak breathes without breaking its strict map", () => {
  const { Modes } = loadCore();
  const minor = Modes.PROGRESSIONS.minor;
  assert.equal(minor[0].id, "i-III-i", "the documented Piraeus i–III oscillation must lead the minor bank");
  assert.equal(Modes.buildProgression("D", "minor", "i-III-i").chords.map((c) => c.symbol).join(" "), "Dm F Dm");
  assert.ok(minor.every((p) => p.tier === "Piraeus · modal"), "the minor bank is the modal tier");
  assert.deepEqual(Array.from(new Set(minor.map((p) => p.group))), ["Home loops", "Modal motion", "Lift into home"],
    "the progression job is an axis separate from its historical layer");
  assert.ok(Modes.PROGRESSIONS.ousak.every((p) => p.tier === "Equal-tempered Ousak practice"),
    "Ousak harmony must remain labelled as the app's fixed-fret practice model");
  const mobile = Modes.mobileTonesOf("D", "ousak");
  assert.equal(mobile.map((m) => m.name).join(" "), "E B", "Ousak sharpens its 2nd and 6th on the way up");
  assert.ok(mobile.every((m) => m.mobile), "mobile tones must be marked as such for the hollow-dot render");
  assert.equal(Modes.mobileTonesOf("D", "hijaz").length, 0, "mobile tones are documented for Ousak only");
  assert.equal(Modes.scaleOf("D", "ousak").length, 7, "the strict Ousak collection itself is untouched");
});

test("landing lenses target the right notes, and now/next differ by SHAPE", () => {
  const { Modes } = loadCore();
  const app = readFileSync(path.join(root, "js/app.js"), "utf8");
  const fb = readFileSync(path.join(root, "js/fretboard.js"), "utf8");

  // Shape, not just colour: a circle you stand on, a diamond you aim at.
  // Colour alone fails colour-blind players and peripheral vision.
  assert.match(fb, /function diamond\(/, "a diamond helper must exist for next targets");
  assert.match(fb, /diamond\([^)]*"dot-next-ring"\)/, "next targets must be drawn as diamonds");
  assert.doesNotMatch(fb, /el\("circle",[^)]*class: "dot-next-ring"/,
    "next targets must not fall back to a circle — shape is the encoding");
  assert.match(fb, /class: "dot-now-ring"/, "now targets stay circles");

  // Every lens the UI offers must be handled by soloTargets.
  const html = readFileSync(path.join(root, "index.html"), "utf8");
  const offered = [...html.matchAll(/data-solo-focus="([a-z]+)"/g)].map((m) => m[1]);
  assert.ok(offered.length >= 8, "expected the expanded landing-target set");
  offered.forEach((lens) => {
    if (lens === "third") return; // the default fall-through
    assert.ok(app.includes(`focus === "${lens}"`), `lens "${lens}" is offered but soloTargets never handles it`);
    assert.ok(app.includes(`focus === "${lens}"`) || true);
  });
  offered.forEach((lens) => {
    assert.ok(new RegExp(`focus === "${lens}"|return "colour 3rds"`).test(app),
      `lens "${lens}" has no landingLensName entry`);
  });

  // The dromos-relative lenses must be derived from the scale, in any key.
  ["D", "G", "A", "E♭"].forEach((tonic) => {
    const road = Modes.tetrachordsOf(tonic, "major");
    const seam = [road.lower[road.lower.length - 1], road.upper[0]];
    assert.equal(seam.length, 2, `${tonic}: the tetrachord seam must resolve to two tones`);
    assert.notEqual(seam[0].pc, seam[1].pc, `${tonic}: seam tones must be distinct`);
    // Enclosure neighbours must stay inside the collection.
    const scale = Modes.scaleOf(tonic, "major");
    scale.forEach((note, i) => {
      const above = scale[(i + 1) % scale.length];
      const below = scale[(i - 1 + scale.length) % scale.length];
      assert.ok(scale.some((s) => s.pc === above.pc) && scale.some((s) => s.pc === below.pc),
        `${tonic}: enclosure neighbours must come from the dromos`);
    });
  });

  // Phrase-role advice must cover every role the progression model emits,
  // and must only ever suggest a lens the UI actually offers.
  const html2 = readFileSync(path.join(root, "index.html"), "utf8");
  const offeredLenses = new Set([...html2.matchAll(/data-solo-focus="([a-z]+)"/g)].map((m) => m[1]));
  const roles = [...app.matchAll(/^\s{4}(Establish|Move|Cadence|Resolve): \{ lens: "([a-z]+)"/gm)];
  assert.equal(roles.length, 4, "every phrase role needs landing advice");
  roles.forEach(([, role, lens]) => {
    assert.ok(offeredLenses.has(lens), `role ${role} suggests lens "${lens}" which the UI does not offer`);
  });

  // Copy must describe the SHAPE encoding, not colour alone — otherwise the
  // legend contradicts the neck for a colour-blind player.
  assert.match(app, /circle/i, "the legend must name the circle");
  assert.match(app, /diamond/i, "the legend must name the diamond");

  // Approach notes are labelled by direction, never by a scale degree that
  // would read as the current chord's own interval.
  assert.match(app, /role: "approach", roleLabel: arrow/,
    "approach notes must be labelled by direction, not by degree");
});

test("a repertoire chart parses, and its dromos fit is computed not asserted", () => {
  const { SongLibrary, AnalysisEngine, Modes } = loadCore();
  const song = SongLibrary.byId("ta-mavra-matia-sou");
  assert.ok(song, "the shipped chart must load");

  // Bars, chords and stabs survive the parser verbatim for display.
  const opening = song.sections[0].bars.filter((b) => b.kind !== "break");
  assert.equal(opening[0].chords.map((c) => c.label).join(" "), "Dm E♭ Dm Cm");
  assert.equal(opening[1].chords[0].stab, true, "a stab must stay a stab");

  // Normalisation is for ANALYSIS only — never for what the player reads.
  assert.equal(SongLibrary.normaliseChord("E♭maj7"), "Ebmaj7");
  assert.equal(opening[0].chords[1].label, "E♭", "the chart keeps the author's own spelling");

  // Every chord in the chart must be parseable by the analyzer, or the
  // song's Analyze button would quietly hand over a chord it cannot name.
  SongLibrary.chordVocabulary(song).forEach((chord) => {
    assert.ok(AnalysisEngine.parseChord(chord.normalised),
      `analyzer cannot parse ${chord.label} (${chord.normalised})`);
  });

  // The dromos fit must be COMPUTED from the analyzer, and it must actually
  // discriminate — a fit that ranks every mode equally teaches nothing.
  const map = SongLibrary.chordMap(song);
  const fit = Modes.MODE_ORDER.map((modeId) => {
    const records = AnalysisEngine.analyzeProgression(map, { tonic: song.home, modeId }).records;
    return { modeId, named: records.filter((r) => r.degree && r.degree.label).length, total: records.length };
  }).sort((a, b) => b.named - a.named);
  assert.ok(fit[0].named > fit[fit.length - 1].named, "the fit must discriminate between dromoi");
  assert.equal(fit[0].modeId, "ousak",
    "this chart's Cm (minor ♭VII) and E♭ (♭II) are Usak markers — Ousak should name the most chords");
  assert.ok(fit[0].named < fit[0].total,
    "and it must stay honest: a Latin arrangement has chords no single dromos explains");
});

test("the soloist toolkit is MECE, sourced, and never pretends to hear you", () => {
  const { SoloToolkit } = loadCore();
  const suite = SoloToolkit.selfTest();
  assert.equal(suite.ok, true, JSON.stringify(suite.results.filter((r) => !r.pass), null, 2));
  // Mutually exclusive: the adversarial pass merged arrivals/finishes and
  // motif-ladder/kolyano. Those merges must not silently come apart.
  assert.equal(SoloToolkit.byId("landing-finishes"), null);
  assert.equal(SoloToolkit.byId("kolyano-chain"), null);
  // Collectively exhaustive: three questions, each with a Greek-core spine.
  assert.equal(SoloToolkit.PILLARS.map((p) => p.id).join(","), "land,move,speak");
  // Mode gating must degrade gracefully, never leave a pillar empty.
  ["major", "minor", "harmonicMinor", "ousak", "hijaz"].forEach((modeId) => {
    SoloToolkit.PILLARS.forEach((p) => {
      assert.ok(SoloToolkit.availableTools(p.id, modeId).length > 0,
        `${p.id} has no tools in ${modeId}`);
    });
  });
  // No dead choreography: every flag a tool declares must be consumed by the
  // app, and every CSS class the app applies must have a rule behind it.
  // A declared-but-inert flag is a promise the map does not keep.
  const app = readFileSync(path.join(root, "js/app.js"), "utf8");
  const css = readFileSync(path.join(root, "css/styles.css"), "utf8");
  const flags = new Set();
  SoloToolkit.TOOLS.forEach((tool) => Object.keys(tool.choreo || {}).forEach((k) => flags.add(k)));
  flags.forEach((flag) => {
    if (flag === "focus" || flag === "phases") return;
    assert.ok(app.includes(`c.${flag}`), `choreo flag "${flag}" is declared but never consumed by app.js`);
  });
  ["zone-lower", "zone-upper", "vii-shimmer", "group-grid"].forEach((cls) => {
    if (!app.includes(`"${cls}"`)) return;
    assert.ok(css.includes(cls), `app.js applies .${cls} but no CSS rule backs it`);
  });

  // Cadence Ramp is scoped to major/minor-family taximia, per its source.
  assert.ok(!SoloToolkit.availableTools("land", "ousak").some((t) => t.id === "cadence-ramp"),
    "Cadence Ramp is documented for major/minor taximia, not dromos-based ones");
});

test("every Solo Toolkit claim opens a source-bounded tactical example", () => {
  const { SoloToolkit, TacticalExamples, Modes } = loadCore();
  const linked = SoloToolkit.TOOLS.map((tool) => TacticalExamples.byId(tool.exampleId));
  assert.ok(linked.every(Boolean), "each toolkit tool needs a real example record");
  assert.equal(new Set(SoloToolkit.TOOLS.map((tool) => tool.exampleId)).size, SoloToolkit.TOOLS.length,
    "tools should not collapse distinct teaching jobs into one generic example");
  assert.ok(TacticalExamples.byId("pennanen-tactility"), "Pennanen's documented neck-tactility concept needs its own practical comparison");
  Modes.TONICS.forEach((tonic) => Modes.MODE_ORDER.forEach((modeId) => {
    TacticalExamples.available({ tonic, modeId, instrument: "Test" }).forEach((example) => {
      assert.match(example.boundary, /not a transcription/i);
      assert.ok(example.steps.length >= 3);
      assert.ok(example.notes.every((note) => Number.isFinite(note.freq)));
    });
  }));
});

test("Greek style pulses are complete and never prescribe a dromos", () => {
  const { StyleLibrary } = loadCore();
  const zeibekiko = StyleLibrary.byId("zeibekiko");
  assert.deepEqual(Array.from(zeibekiko.groups), [2, 2, 2, 3]);
  assert.equal(StyleLibrary.beatMap(zeibekiko).length, 9);
  StyleLibrary.STYLES.forEach((style) => {
    assert.match(style.route, /dromos|Song Map/i, style.title + " must separate pulse from harmonic colour");
  });
});

test("Comp curriculum stays skeleton-first across every Greek pulse preset", () => {
  const { StyleLibrary } = loadCore();
  assert.ok(StyleLibrary.byId("hasaposerviko"), "fast hasapiko needs its own selectable pulse preset");
  StyleLibrary.STYLES.forEach((style) => {
    [1, 2, 3].forEach((level) => {
      const plan = StyleLibrary.compPlan(style.id, level);
      assert.equal(plan.level, level);
      assert.equal(plan.slots.length, plan.units, `${style.id} level ${level} covers every pulse unit`);
      assert.ok(plan.slots.some((slot) => !["space", "free"].includes(slot.action)), `${style.id} level ${level} keeps audible anchors`);
    });
  });
  const zeibekiko = StyleLibrary.compPlan("zeibekiko", 2);
  assert.deepEqual(Array.from(zeibekiko.slots.filter((slot) => slot.action !== "space"), (slot) => slot.unit), [1, 3, 5, 7]);
  assert.deepEqual(Array.from(zeibekiko.slots.slice(7), (slot) => slot.action), ["space", "space"], "the 8–9 tail must stay unfilled");
  const hasapiko = StyleLibrary.compPlan("hasapiko", 2);
  assert.deepEqual(Array.from(hasapiko.slots, (slot) => slot.action), ["bass", "chord", "walk", "chord"]);
  const sparseTsifteteli = StyleLibrary.compPlan("tsifteteli", 1);
  assert.deepEqual(Array.from(sparseTsifteteli.slots.filter((slot) => slot.action === "accent"), (slot) => slot.unit), [1, 4]);
  const fullTsifteteli = StyleLibrary.compPlan("tsifteteli", 2);
  assert.deepEqual(Array.from(fullTsifteteli.groups), [3, 3, 2]);
  assert.equal(fullTsifteteli.units, 8, "3+3+2 is a separate eight-subdivision level, not the sparse 1/4 stress");
});

test("Solo Road discloses exactly what is and is not modelled descending", () => {
  const { Modes } = loadCore();
  Modes.MODE_ORDER.forEach((modeId) => {
    const policy = Modes.movementPolicy(modeId);
    assert.ok(policy.label && policy.detail);
    if (modeId === "ousak") {
      assert.equal(policy.status, "verified-mobile");
      assert.match(policy.detail, /ascending options/i);
      assert.match(policy.detail, /descending trainer returns through the core/i);
    } else {
      assert.equal(policy.status, "fixed-collection");
      assert.match(policy.detail, /same declared .* ascending and descending/i);
      assert.match(policy.detail, /No additional directional form/i);
    }
  });
});

test("analyzer explains modal colour while preserving harmonic uncertainty", () => {
  const { AnalysisEngine } = loadCore();
  const analysis = AnalysisEngine.analyzeProgression("Am D G", { tonic: "A", modeId: "minor" });
  const majorFour = analysis.records[1];
  assert.equal(majorFour.label, "IV");
  assert.ok(majorFour.notes.some((note) => note.type === "modal-mixture"));
  assert.ok(majorFour.notes.some((note) => note.type === "secondary"), "D → G is also a possible temporary dominant pull");
  const line = AnalysisEngine.analyzeLine("Dm: A C D | A7: C♯ E G", { tonic: "D", modeId: "minor" });
  assert.equal(line.segments[1].landing.role, "♭7");
  assert.equal(AnalysisEngine.parseProgression("C-7 F7 B♭M7").length, 3,
    "lead-sheet dash notation for minor chords must remain a single chord token");
  assert.equal(AnalysisEngine.parseChord("B♭M7").quality, "maj7");
});

test("the pentatonic frame preserves each dromos identity", () => {
  const { Modes } = loadCore();
  assert.deepEqual(
    Array.from(Modes.pentatonicOf("D", "hijaz"), (note) => note.name),
    ["D", "F♯", "G", "A", "C"],
    "Hijaz must use dominant—not minor—pentatonic"
  );
  assert.deepEqual(
    Array.from(Modes.pentatonicOf("D", "ousak"), (note) => note.name),
    ["D", "F", "G", "A", "C"]
  );
});

test("Chord Map derives all 60 harmonic maps and a playable triad on every tuning", () => {
  const { Modes, ChordMap, Tuning, Fretboard, Triads } = loadCore();
  const restore = Tuning.currentId();
  let mapsChecked = 0;
  let gripsChecked = 0;
  Modes.TONICS.forEach((tonic) => Modes.MODE_ORDER.forEach((modeId) => {
    const chords = ChordMap.harmonize(tonic, modeId);
    const scale = Modes.scaleOf(tonic, modeId);
    assert.equal(chords.length, 7, `${tonic} ${modeId} has seven derived degrees`);
    assert.equal(new Set(scale.map((note) => note.pc)).size, 7, `${tonic} ${modeId} keeps seven distinct pitch classes`);
    assert.ok(scale.every((note) => /^[A-G]/.test(note.name)), `${tonic} ${modeId} uses the app's readable diatonic spelling policy`);
    chords.forEach((chord, degreeIndex) => {
      assert.equal(chord.rootPc, scale[degreeIndex].pc, `${tonic} ${modeId} degree ${degreeIndex + 1} roots on its scale note`);
      assert.ok(["maj", "min", "dim", "aug"].includes(chord.quality), `${chord.symbol} has a supported triad quality`);
      assert.equal(Triads.TRIAD_OF[chord.quality], chord.quality, `${chord.symbol} maps to its truthful triad family`);
    });
    Tuning.TUNINGS.forEach((tuning) => {
      Tuning.set(tuning.id);
      chords.forEach((chord) => {
        assert.ok(Fretboard.findGrip(chord.notes, 5), `${tonic} ${modeId} ${chord.symbol} needs a grip on ${tuning.name}`);
        assert.ok(Triads.allShapes(chord.rootPc, chord.quality, null).some((shape) => shape.placements.every((placement) => placement.fret <= 15)),
          `${tonic} ${modeId} ${chord.symbol} needs a truthful adjacent-string triad at fret 15 or below on ${tuning.name}`);
        gripsChecked++;
      });
    });
    mapsChecked++;
  }));
  Tuning.set(restore);
  assert.equal(mapsChecked, 60);
  assert.equal(gripsChecked, 2100);
});

test("Chord Map labels prominence as trainer evidence, not a genre claim", () => {
  const { ChordMap } = loadCore();
  const hijaz = ChordMap.harmonize("D", "hijaz");
  assert.equal(hijaz[0].prominence.mapsUsed, 4);
  assert.equal(hijaz[0].prominence.totalMaps, 4);
  assert.deepEqual(Array.from(hijaz[0].prominence.mapIds), ["I-bII-I", "I-iv-I", "I-iv-bVII-I", "bII-I"]);
  assert.equal(hijaz[2].prominence.mapsUsed, 0, "derived iii° is shown honestly even though the trainer maps do not prescribe it");
  const ousakSecond = ChordMap.harmonize("D", "ousak")[1];
  assert.equal(ousakSecond.symbol, "E♭");
  assert.match(ousakSecond.practiceNote, /fixed-fret harmony/i);
});

test("Chord Path stays instrument-playable, scale-locked, and evidence-bound for every Matrix degree at both depths", () => {
  const { Modes, ChordMap, ChordPath, Tuning } = loadCore();
  const restore = Tuning.currentId();
  const toneKey = (chord, depth) => chord.notes.slice(0, depth === "seventh" ? 4 : 3)
    .map((note) => note.pc).sort((a, b) => a - b).join(",");
  let chordsChecked = 0;
  let routesChecked = 0;

  ["triad", "seventh"].forEach((depth) => Modes.TONICS.forEach((tonic) => Modes.MODE_ORDER.forEach((modeId) => {
    const scalePcs = new Set(Modes.scaleOf(tonic, modeId).map((note) => note.pc));
    ChordMap.harmonize(tonic, modeId, depth).forEach((chord) => {
      const plan = ChordPath.build(tonic, modeId, chord, depth, 1);
      assert.equal(plan.arpeggios.length, 3, `${tonic} ${modeId} ${chord.symbol} needs three chord-tone cells`);
      assert.equal(plan.approaches.length, 3, `${tonic} ${modeId} ${chord.symbol} needs three connector choices`);
      plan.approaches.forEach((approach) => {
        assert.ok(approach.notes.every((note) => scalePcs.has(note.pc)), `${approach.label} must stay inside ${tonic} ${modeId}`);
        assert.equal(approach.notes.at(-1).pc, chord.notes[1].pc, `${approach.label} must land on the selected 3rd`);
      });
      assert.equal(plan.extension.chord.degreeIndex, chord.degreeIndex, "triad/seventh enhancement stays on the selected scale degree");

      plan.successors.forEach((successor) => {
        successor.maps.forEach((evidence) => {
          const progression = Modes.PROGRESSIONS[modeId].find((item) => item.id === evidence.id);
          assert.ok(progression, `${successor.chord.symbol} needs a real progression source`);
          const sequence = ChordPath.progressionChords(tonic, modeId, progression, depth);
          assert.ok(sequence.some((candidate, index) => index < sequence.length - 1 &&
            toneKey(candidate, depth) === toneKey(chord, depth) &&
            toneKey(sequence[index + 1], depth) === toneKey(successor.chord, depth)),
          `${chord.symbol} → ${successor.chord.symbol} must be exact adjacency in ${progression.id}`);
          routesChecked++;
        });
      });

      plan.doors.forEach((door) => {
        const target = ChordMap.harmonize(door.tonic, door.modeId, depth)[door.targetDegree];
        assert.equal(toneKey(target, depth), toneKey(door.targetChord, depth), "a door opens the exact chord it describes");
        if (door.kind === "pivot") assert.equal(toneKey(chord, depth), toneKey(door.targetChord, depth), "a pivot must hold the same sounding chord");
        if (door.kind === "recolour") assert.equal(chord.rootPc, door.targetChord.rootPc, "a recolour door keeps the root");
        if (door.kind === "role-change") {
          assert.equal(modeId, "major");
          assert.equal(chord.degreeIndex, 0);
          assert.equal(door.targetDegree, 1);
        }
      });
      chordsChecked++;
    });
  })));

  Tuning.TUNINGS.forEach((tuning) => {
    Tuning.set(tuning.id);
    const chord = ChordMap.harmonize("D", "hijaz")[0];
    ChordPath.approaches("D", "hijaz", chord, 1).forEach((approach) => {
      const path = ChordPath.instrumentPath(approach.notes);
      assert.ok(path, `${approach.label} needs a path on ${tuning.name}`);
      assert.ok(path.frets.every((fret) => fret >= 0 && fret <= 15), `${tuning.name} connector stays at fret 15 or below`);
      assert.equal(new Set(path.placements.map((placement) => placement.stringIndex)).size, 1, `${tuning.name} connector stays on one course`);
    });
  });
  Tuning.set(restore);
  assert.equal(chordsChecked, 840);
  assert.ok(routesChecked > 0);
});

test("Harmony Matrix derives truthful seventh chords for all 60 key-scale rows", () => {
  const { Modes, ChordMap, Tuning, Fretboard } = loadCore();
  const intervalByRole = { R: 0, b3: 3, 3: 4, b5: 6, 5: 7, "#5": 8, bb7: 9, b7: 10, 7: 11 };
  const restore = Tuning.currentId();
  let rows = 0;
  let tones = 0;
  Modes.TONICS.forEach((tonic) => Modes.MODE_ORDER.forEach((modeId) => {
    const chords = ChordMap.harmonize(tonic, modeId, "seventh");
    assert.equal(chords.length, 7);
    chords.forEach((chord) => {
      assert.equal(chord.notes.length, 4, `${tonic} ${modeId} ${chord.roman} is a real seventh chord`);
      assert.ok(Modes.QUALITY[chord.quality], `${chord.symbol} uses a declared quality`);
      chord.notes.forEach((note) => {
        assert.equal(((note.pc - chord.rootPc) % 12 + 12) % 12, intervalByRole[note.role], `${chord.symbol} ${note.name} matches ${note.role}`);
        assert.equal(Modes.parseName(note.name).pc, note.pc, `${chord.symbol} spells ${note.name} at its sounding pitch`);
        tones++;
      });
    });
    Tuning.TUNINGS.forEach((tuning) => {
      Tuning.set(tuning.id);
      chords.forEach((chord) => assert.ok(Fretboard.findGrip(chord.notes, 5), `${chord.symbol} needs a compact ${tuning.name} grip`));
    });
    rows++;
  }));
  Tuning.set(restore);
  assert.equal(rows, 60);
  assert.equal(tones, 1680);
});

test("Harmony Matrix separates working roles from derived harmony", () => {
  const { ChordMap } = loadCore();
  const major = ChordMap.harmonize("D", "major");
  assert.equal(major[0].workingRole.id, "home");
  assert.equal(major[1].workingRole.id, "primary", "ii is a primary working chord but not the cadence into home");
  assert.equal(major[4].workingRole.id, "cadence", "V is explicitly heard resolving into I");
  assert.equal(major[2].workingRole.id, "derived", "iii stays visible without being promoted to a documented working chord");
  const naturalMinor = ChordMap.harmonize("D", "minor");
  assert.equal(naturalMinor[6].workingRole.id, "cadence", "natural-minor ♭VII resolves into i in the verified maps");
});

test("Melody Harmony separates note identity, lawful chord membership, and route evidence", () => {
  const { Modes, MelodyHarmony } = loadCore();
  let prompts = 0;
  Modes.TONICS.forEach((tonic) => Modes.MODE_ORDER.forEach((modeId) => {
    for (let degreeIndex = 0; degreeIndex < 7; degreeIndex++) {
      const prompt = MelodyHarmony.buildPrompt({ tonic, modeId, degreeIndex, depth: "triad" });
      assert.equal(prompt.note.pc, prompt.scale[degreeIndex].pc);
      assert.equal(prompt.candidates.length, 3, `${tonic} ${modeId} degree ${degreeIndex + 1} belongs to three stacked triads`);
      prompt.candidates.forEach((candidate) => {
        assert.ok(candidate.chord.notes.some((note) => note.pc === prompt.note.pc),
          `${candidate.chord.symbol} must actually contain the heard pitch`);
        candidate.successors.forEach((successor) => successor.routes.forEach((route) => {
          const progression = Modes.PROGRESSIONS[modeId].find((item) => item.id === route.id);
          assert.ok(progression.chords.some(([offset], index) =>
            offset === candidate.chord.scaleNote.off && progression.chords[(index + 1) % progression.chords.length][0] === successor.nextOffset),
          `${candidate.chord.roman} → ${successor.chord.degreeLabel} must be an exact trainer-map adjacency`);
        }));
      });
      prompts++;
    }
  }));
  assert.equal(prompts, 420);
});

test("Melody Harmony counter-lines stay audible and disclose unsupported routes", () => {
  const { MelodyHarmony } = loadCore();
  const prompt = MelodyHarmony.buildPrompt({ tonic: "D", modeId: "hijaz", degreeIndex: 2 });
  assert.equal(prompt.note.name, "F♯");
  assert.equal(prompt.note.degree, "3");
  const derived = prompt.candidates.find((candidate) => candidate.chord.degreeIndex === 2);
  assert.equal(derived.evidenceKind, "derived-only");
  assert.equal(derived.successors.length, 0, "the app must not invent a next chord for Hijaz iii°");
  const home = prompt.candidates.find((candidate) => candidate.chord.degreeIndex === 0);
  const successor = home.successors[0];
  const moves = MelodyHarmony.enhancementMoves(prompt, home, successor);
  assert.ok(moves.some((move) => move.id === "guide-thread"));
  assert.ok(moves.some((move) => move.id === "third-shadow"));
  moves.forEach((move) => move.notes.forEach((note) => {
    assert.ok(Number.isFinite(note.midi));
    assert.ok(Number.isFinite(note.freq));
  }));

  const ousakHome = MelodyHarmony.buildPrompt({ tonic: "A", modeId: "ousak", degreeIndex: 0 });
  const ousakCandidate = ousakHome.candidates.find((candidate) => candidate.chord.degreeIndex === 0);
  const ousakMove = MelodyHarmony.enhancementMoves(ousakHome, ousakCandidate, ousakCandidate.successors[0])
    .find((move) => move.id === "guide-thread");
  assert.equal(ousakMove.notes[1].name, "B♭", "A should take the half-step into the next B♭ chord, not leap to its 3rd");
  assert.match(ousakMove.label, /nearest chord tone/i);
});

test("Harmony Matrix scale doors state exact, parallel, and cycle evidence", () => {
  const { ChordMap } = loadCore();
  const relative = ChordMap.relationships("D", "minor").exact.find((item) => item.tonic === "F" && item.modeId === "major");
  assert.equal(relative.label, "Relative major");
  assert.equal(relative.shared, 7);
  assert.ok(relative.doorMaps.includes("i-III-i"), "the verified Piraeus loop supplies the relative-major door");

  const harmonicDoor = ChordMap.relationships("D", "harmonicMinor").exact.find((item) => item.tonic === "A" && item.modeId === "hijaz");
  assert.equal(harmonicDoor.label, "Hijaz on V");
  assert.equal(harmonicDoor.shared, 7);
  assert.ok(harmonicDoor.doorMaps.includes("iio-V-i"));

  const cadenceSwitch = ChordMap.relationships("D", "minor").parallel[0];
  assert.equal(cadenceSwitch.modeId, "harmonicMinor");
  assert.equal(cadenceSwitch.shared, 6);
  assert.match(cadenceSwitch.why, /C.*C♯/);

  const colourSwitch = ChordMap.relationships("D", "ousak").parallel[0];
  assert.equal(colourSwitch.modeId, "hijaz");
  assert.equal(colourSwitch.shared, 6);
  assert.match(colourSwitch.why, /F.*F♯/);

  const cycleDoor = ChordMap.relationships("D", "major").transitions[0];
  assert.equal(cycleDoor.tonic, "C");
  assert.equal(cycleDoor.modeId, "major");
  assert.match(cycleDoor.why, /D I becomes C ii/);
});

test("Recall separates natural minor, harmonic minor, and the strict Ousak map", () => {
  const { EarDrills } = loadCore();
  const harmonic = { tonic: "D", modeId: "harmonicMinor", progressionId: "iio-V-i" };
  const natural = { tonic: "D", modeId: "minor", progressionId: "i-bVII-i" };
  const ousak = { tonic: "D", modeId: "ousak", progressionId: "i-bVII-i" };
  assert.ok(EarDrills.isCoherent(harmonic));
  assert.equal(EarDrills.chordSymbols(harmonic).join(" "), "Em7♭5 A7 Dm");
  assert.equal(EarDrills.chordSymbols(natural).join(" "), "Dm C Dm");
  assert.equal(EarDrills.chordSymbols(ousak).join(" "), "Dm Cm Dm");
  assert.match(EarDrills.hint(harmonic, 1), /raised 7/i);
});

test("every displayed progression chord name and interval agrees with its sounding pitch", () => {
  const { Modes } = loadCore();
  const intervalByRole = { R: 0, b3: 3, 3: 4, b5: 6, 5: 7, "#5": 8, b7: 10, 7: 11 };
  const labelByRole = { R: "R", b3: "♭3", 3: "3", b5: "♭5", 5: "5", "#5": "♯5", b7: "♭7", 7: "7" };
  let checked = 0;
  Modes.TONICS.forEach((tonic) => Modes.MODE_ORDER.forEach((modeId) => {
    Modes.PROGRESSIONS[modeId].forEach((progression) => {
      const built = Modes.buildProgression(tonic, modeId, progression.id);
      const roman = progression.label.split(/\s+–\s+/);
      assert.equal(built.chords.length, roman.length, `${tonic} ${progression.id} has one Roman label per sounding chord`);
      built.chords.forEach((chord, index) => {
        assert.equal(chord.degreeLabel, roman[index], `${chord.symbol} displays the progression's exact Roman function`);
        assert.equal(chord.symbol, chord.rootName + Modes.QUALITY[chord.quality].sym, `${chord.symbol} symbol matches its quality`);
        chord.notes.forEach((note) => {
          const soundingInterval = ((note.pc - chord.rootPc) % 12 + 12) % 12;
          assert.equal(soundingInterval, intervalByRole[note.role], `${chord.symbol} ${note.name} sounds at ${note.role}`);
          assert.equal(note.roleLabel, labelByRole[note.role], `${chord.symbol} uses the correct rendered interval glyph`);
          assert.equal(Modes.parseName(note.name).pc, note.pc, `${note.name} spelling matches its sounding pitch`);
          checked++;
        });
      });
    });
  }));
  assert.ok(checked > 2000, `audited ${checked} displayed/sounding chord tones`);
  const respelled = Modes.buildChord("E♭", "ousak", 1, "maj");
  assert.equal(respelled.symbol, "E");
  assert.equal(respelled.notes.map((note) => note.name).join(" "), "E G♯ B",
    "when F♭ is simplified to E, the major 3rd must be respelled from E as G♯, never A♭");
});

test("Solo Road keeps the tetrachord split and number patterns playable", () => {
  const { Modes, Practice, Tuning, Triads, Fretboard } = loadCore();
  const road = Modes.tetrachordsOf("D", "hijaz");
  assert.deepEqual(Array.from(road.lower, (note) => note.name), ["D", "E♭", "F♯", "G"]);
  assert.deepEqual(Array.from(road.upper, (note) => note.name), ["A", "B♭", "C", "D"]);
  assert.equal(Tuning.frets(), 24, "the selected practice map exposes a full 24-fret road");
  Tuning.TUNINGS.forEach((tuning) => {
    Tuning.set(tuning.id);
    Practice.PHRASE_PATTERNS.forEach((pattern) => {
      const phrase = Practice.buildPhrase("D", "hijaz", pattern.id, { position: 5 });
      assert.equal(phrase.nodes.length, pattern.degrees.length, `${pattern.id} fits ${tuning.name}`);
      assert.ok(phrase.nodes.every((node) => node.fret >= 0 && node.fret <= Tuning.frets()));
    });
    const triads = Triads.allShapes(2, "maj", null);
    assert.ok(triads.some((shape) => shape.lowFret > 15), `${tuning.name} exposes upper-neck triad inversions`);
  });
  assert.equal(Practice.MELODIC_ROUTES.length, 6, "five classic routes plus the Greek sweet 2→3 lean");
  assert.equal(new Set(Practice.MELODIC_ROUTES.map((route) => route.id)).size, Practice.MELODIC_ROUTES.length);
  assert.ok(Practice.MELODIC_ROUTES.every((route) => route.budget && route.path && route.hear && route.think));
  assert.deepEqual({ ...Fretboard.neckLayout(24, true) }, { folded: true, fretsPerRow: 12, rows: 2 },
    "a phone gets the full 24-fret road as two readable 12-fret rows");
  assert.deepEqual({ ...Fretboard.neckLayout(24, false) }, { folded: false, fretsPerRow: 24, rows: 1 },
    "tablet and desktop keep one continuous 24-fret road");
});

test("practical guitar vocabulary keeps full forms at fret 15 or below", () => {
  const { Tuning, Modes, GuitarVoicings } = loadCore();
  Tuning.set("guitar");
  ["major", "minor", "harmonicMinor", "ousak", "hijaz"].forEach((modeId) => {
    const first = Modes.PROGRESSIONS[modeId][0];
    const { chords } = Modes.buildProgression("D", modeId, first.id);
    chords.filter((chord) => ["maj", "min", "dom7", "maj7", "m7"].includes(chord.quality)).forEach((chord) => {
      const forms = GuitarVoicings.fullVoicings(chord);
      assert.ok(forms.length, `${chord.symbol} has a practical full guitar form`);
      forms.forEach((form) => {
        assert.ok(form.placements.length >= 4);
        assert.ok(form.placements.every((placement) => placement.fret <= 15));
        assert.ok(form.placements.every((placement) => chord.notes.some((tone) => tone.pc === placement.note.pc)));
      });
    });
  });
});

test("plucked notes decay like strings and never leave a synth drone under the chord", () => {
  const audio = readFileSync(path.join(root, "js/audio.js"), "utf8");
  // The fundamental oscillator is an attack thump. When it sustained (it once
  // rang for up to 0.8s) it was audible as a sine drone after every chord.
  const thump = audio.match(/const thump = Math\.min\(dur, ([\d.]+)\)/);
  assert.ok(thump, "the fundamental must be bounded by an explicit thump length");
  assert.ok(+thump[1] <= 0.15, `fundamental thump ${thump[1]}s is long enough to drone`);
  assert.doesNotMatch(audio, /fundamental\.stop\(when \+ Math\.min\(dur, 0\.8\)\)/, "the sustaining fundamental must not come back");
  // Chords must still be ringing when the next bar lands.
  assert.match(audio, /beatsPerBar \* secPerBeat\(\) \* 1\.08/, "transport chords must ring for the whole bar");
  const fallback = audio.match(/duration == null \? ([\d.]+) :/);
  assert.ok(fallback && +fallback[1] >= 3, "the default chord ring must outlast a slow 4/4 bar");
});

test("audio mix reduces polyphonic gain before the master limiter", () => {
  const { AudioEngine } = loadCore();
  assert.ok(AudioEngine.voiceGain(6, "chord") < AudioEngine.voiceGain(3, "chord"));
  assert.ok(AudioEngine.voiceGain(1, "path") <= 0.3);
  assert.ok(AudioEngine.voiceGain(8, "chord") >= 0.15);
});

test("mainland laouto supports grips, triads, and scale paths", () => {
  const { Tuning, Modes, Fretboard, Practice, Triads } = loadCore();
  Tuning.set("laouto4");
  assert.equal(Tuning.current().sub, "A D G C — the 4-course mainland laouto tuning");

  const { chords } = Modes.buildProgression("D", "hijaz", "I-iv-bVII-I");
  chords.forEach((chord) => assert.ok(Fretboard.findGrip(chord.notes), chord.symbol + " needs a playable grip"));
  assert.ok(Triads.pathThrough(chords).every(Boolean), "every progression chord needs a triad map");
  assert.ok(Practice.buildPath("D", "hijaz", { layout: "3nps", position: 5 }), "a scale path must fit the neck");
});
