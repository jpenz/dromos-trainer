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
  ["js/tuning.js", "js/profiles.js", "js/theory.js", "js/harmony-journey.js", "js/modes.js", "js/chord-map.js", "js/ear-drills.js", "js/styles.js", "js/analysis.js", "js/studies.js", "js/musicxml.js", "js/resources.js", "js/video.js", "js/coach.js", "js/practice.js", "js/toolkit.js", "js/triads.js", "js/fretboard.js", "js/guitar-voicings.js", "js/audio.js"]
    .forEach((file) => vm.runInContext(source(file), context, { filename: file }));
  return context.window;
}

test("music invariants pass outside the browser", () => {
  const app = loadCore();
  const suites = [app.Theory.selfTest(), app.HarmonyJourney.selfTest(), app.PlayerProfiles.selfTest(), app.Modes.selfTest(), app.ChordMap.selfTest(), app.EarDrills.selfTest(), app.StyleLibrary.selfTest(), app.AnalysisEngine.selfTest(), app.StudyLibrary.selfTest(), app.MusicXmlImport.selfTest(), app.ResourceLibrary.selfTest(), app.VideoStudy.selfTest(), app.PracticeCoach.selfTest(), app.Practice.selfTest(), app.Triads.selfTest(), app.GuitarVoicings.selfTest(), app.AudioEngine.selfTest()];
  const failures = suites.flatMap((suite) => suite.results.filter((result) => !result.pass));
  assert.equal(failures.length, 0, JSON.stringify(failures, null, 2));
});

test("authorised study starters and referenced methods remain clearly bounded", () => {
  const { StudyLibrary, ResourceLibrary } = loadCore();
  assert.equal(StudyLibrary.STUDIES.length, 3);
  assert.ok(StudyLibrary.STUDIES.every((study) => /User-authorised/.test(study.source)));
  assert.equal(ResourceLibrary.TRIGAS.length, 5);
  assert.ok(ResourceLibrary.TRIGAS.every((item) => /trigas\.gr/.test(item.href)));
  assert.equal(ResourceLibrary.COMMUNITY.length, 3);
  assert.ok(ResourceLibrary.COMMUNITY.every((item) => /mpouzouki\.weebly\.com/.test(item.href)));
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
  // Cadence Ramp is scoped to major/minor-family taximia, per its source.
  assert.ok(!SoloToolkit.availableTools("land", "ousak").some((t) => t.id === "cadence-ramp"),
    "Cadence Ramp is documented for major/minor taximia, not dromos-based ones");
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
