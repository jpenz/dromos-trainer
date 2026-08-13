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
  ["js/tuning.js", "js/profiles.js", "js/theory.js", "js/harmony-journey.js", "js/modes.js", "js/ear-drills.js", "js/styles.js", "js/analysis.js", "js/studies.js", "js/musicxml.js", "js/resources.js", "js/video.js", "js/coach.js", "js/practice.js", "js/triads.js", "js/fretboard.js", "js/guitar-voicings.js", "js/audio.js"]
    .forEach((file) => vm.runInContext(source(file), context, { filename: file }));
  return context.window;
}

test("music invariants pass outside the browser", () => {
  const app = loadCore();
  const suites = [app.Theory.selfTest(), app.HarmonyJourney.selfTest(), app.PlayerProfiles.selfTest(), app.Modes.selfTest(), app.EarDrills.selfTest(), app.StyleLibrary.selfTest(), app.AnalysisEngine.selfTest(), app.StudyLibrary.selfTest(), app.MusicXmlImport.selfTest(), app.ResourceLibrary.selfTest(), app.VideoStudy.selfTest(), app.PracticeCoach.selfTest(), app.Practice.selfTest(), app.Triads.selfTest(), app.GuitarVoicings.selfTest(), app.AudioEngine.selfTest()];
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

test("Solo Road keeps the tetrachord split and number patterns playable", () => {
  const { Modes, Practice, Tuning, Triads } = loadCore();
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
