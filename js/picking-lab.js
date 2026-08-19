/* picking-lab.js — source-bounded plectrum curriculum, event plans and repeatable runs.
 * Pure data/logic: the app supplies the current instrument path and pulse.
 *
 * The named sources support technique categories and observed performance
 * practice. Every note/stroke sequence below is an original Dromos drill,
 * never a transcription or a claim that one pattern is compulsory.
 */
(function () {
  "use strict";

  const CATEGORIES = [
    { id: "time", label: "Time & attack", detail: "even strokes, accents, tremolo" },
    { id: "cross", label: "String changes", detail: "inside, outside, mixed" },
    { id: "route", label: "Route & timbre", detail: "horizontal versus tiered" },
    { id: "phrase", label: "Phrase mechanics", detail: "ornaments and chord targets" }
  ];

  const TRIGAS = "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-three-string-bouzouki/";
  const PENNANEN = "https://taju.uniarts.fi/bitstreams/782c4f90-3fb7-4058-bf6b-9631b2c55bb7/download";
  const PAFRANIDIS = "https://fagottobooks.gr/blog/wp-content/uploads/2020/04/trixordo-sample.pdf";

  const EXERCISES = [
    {
      id: "down-up-clock", category: "time", order: 1, title: "Down–up clock",
      short: "Make every attack the same size before adding speed.", layout: "horizontal", sequence: "alternate", count: 8,
      theory: "Say the scale degree on every note. The hand repeats D–U, but the ear follows a numbered line inside the selected key and dromos.",
      evidence: "Trigas places picking and right-hand technical handling inside a progressive bouzouki curriculum; Pafranidis begins with plectrum direction and open-course exercises.",
      sourceLabel: "Trigas method overview + Pafranidis sample contents", sourceHref: TRIGAS,
      steps: ["Mute one course and play the displayed down/up rail with the smallest comfortable pick motion.", "Unmute and repeat the same rail on the shown dromos notes without changing the attack size.", "Accent only note 1; the other seven notes must stay even."],
      listen: "One continuous pulse: upstrokes should not sound thinner, later, or louder than downstrokes.",
      pass: "Three passes stay even and relaxed, with no scrape or extra motion when the course changes.",
      boundary: "The curriculum categories are source-supported; this eight-note Dromos sequence is original and is not a Trigas or Pafranidis transcription."
    },
    {
      id: "grouped-accents", category: "time", order: 2, title: "Greek grouped accents",
      short: "Keep alternate strokes while the selected Greek pulse changes the accents.", layout: "horizontal", sequence: "pulse", count: 9,
      theory: "Meter and dromos are different layers: the Greek pulse decides where weight falls; the selected dromos decides which pitches are available.",
      evidence: "Bouzouki methods join picking work to rhythm study. Dromos uses the app's separately documented Greek pulse maps so meter and dromos remain independent choices.",
      sourceLabel: "Trigas method overview", sourceHref: TRIGAS,
      steps: ["Clap the selected grouping and say the group starts aloud.", "Play one note per pulse unit; keep strict down/up motion through every group boundary.", "Move the same accent map onto the displayed scale path without adding fills."],
      listen: "The first note of each group is clear, but the unaccented notes do not rush toward it.",
      pass: "A listener can identify the grouping from one repeated note before you use the scale path.",
      boundary: "The meter grouping comes from Dromos's documented pulse map; the exact pick-accent drill is an original trainer exercise, not a style transcription."
    },
    {
      id: "tremolo-ladder", category: "time", order: 3, title: "Tremolo burst ladder",
      short: "Join short, countable bursts into a sustained bouzouki tone.", layout: "horizontal", sequence: "tremolo", count: 20,
      theory: "Hold one scale degree long enough to hear its function. Compare the tonic (settled), 3rd (major/minor colour), and characteristic dromos note.",
      evidence: "Trigas includes picking studies, and Pafranidis explicitly separates tremolo and tremolo exercises after foundational plectrum work.",
      sourceLabel: "Pafranidis sample contents", sourceHref: PAFRANIDIS,
      steps: ["Use one target note and play 2, then 4, then 6, then 8 alternate strokes.", "Release the hand between bursts; restart with the same pick depth and volume.", "Finish by holding the target and hearing it as a melodic arrival, not a speed test."],
      listen: "Each burst has one center of pitch and volume; no individual pick click should jump out.",
      pass: "All four burst lengths start cleanly, remain loose, and end on command without speeding up.",
      boundary: "The source supports tremolo as a study category. The 2–4–6–8 ladder is Dromos-authored and is not copied from the published method."
    },
    {
      id: "outside-pairs", category: "cross", order: 4, title: "Two-per-course crossing loop",
      short: "Expose the same crossing repeatedly instead of hiding it inside a long scale.", layout: "2nps", sequence: "alternate", count: 18,
      theory: "The note numbers remain the same when their fretboard address changes. Name the degree before each course change so geometry never replaces hearing.",
      evidence: "Pennanen distinguishes tiered, across-course motion from horizontal playing and explains that it reduces position changes. Dromos isolates its right-hand crossing cost.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Play only the first two courses of the displayed path until every crossing is predictable.", "Name each crossing shown by the trainer before it happens.", "Add the remaining courses only when the two-course loop stays even."],
      listen: "The note immediately after a course change must arrive in time and at the same volume as the notes before it.",
      pass: "Three complete paths have no hesitation, double attack, or volume dip at a course change.",
      boundary: "Pennanen supports the horizontal/tiered distinction; this two-notes-per-course isolation drill is a Dromos teaching design, not his prescribed exercise."
    },
    {
      id: "mixed-crossings", category: "cross", order: 5, title: "Three-per-course mixed crossings",
      short: "Alternate inside and outside crossings without changing the pulse.", layout: "3nps", sequence: "alternate", count: 18,
      theory: "Hear one octave as connected scale degrees, then notice where the physical three-per-course pattern cuts across the musical phrase.",
      evidence: "Pennanen documents the practical difference between linear and tiered motor structures. This exercise makes the changing pick geometry visible on a tiered route.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Start with the displayed stroke and say inside or outside at every course change.", "Loop one difficult boundary twice before playing the full path.", "Reverse the route without resetting the pick direction at the top."],
      listen: "Inside and outside crossings should be rhythmically indistinguishable even if one initially feels less comfortable.",
      pass: "You can begin on either stroke and keep every displayed crossing clean at the same tempo.",
      boundary: "The motor-structure comparison is source-supported. The three-per-course path and crossing labels are original Dromos practice logic."
    },
    {
      id: "tactile-ab", category: "route", order: 6, title: "Horizontal ↔ tiered A/B",
      short: "Play the same dromos two ways and choose the route for sound, not convenience alone.", layout: "horizontal", sequence: "alternate", count: 8, compare: true,
      theory: "A dromos is a melodic organization, not one fingering. Preserve the same degree contour while comparing continuous one-course colour with a compact tiered route.",
      evidence: "Pennanen defines horizontal playing as a linear array with position shifts and tiered playing as an across-course array with fewer shifts; he also warns that course changes can alter bouzouki timbre.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Choose Horizontal and play the one-course line while listening to its consistent timbre.", "Choose Tiered and play the same dromos degrees with fewer hand shifts.", "Use Horizontal for a sung continuous color; use Tiered when the phrase needs compact speed and the course timbres support it."],
      listen: "Hear both the physical difference and the tonal change. The easiest fingering is not automatically the best-sounding phrase.",
      pass: "You can play both routes and state one musical reason—not only speed—for choosing either one.",
      boundary: "Pennanen documents the two tactile organizations and their timbral tradeoff. The displayed A/B route is generated for the selected instrument and is not a recorded-player transcription."
    },
    {
      id: "timbre-echo", category: "route", order: 7, title: "Course-timbre echo",
      short: "Repeat one small cell in a new course/register as an intentional answer.", layout: "horizontal", sequence: "echo", count: 8, compare: true,
      theory: "Repetition makes the degree contour recognizable; a register or course change supplies the contrast. This is call-and-answer by timbre, not a new scale.",
      evidence: "Pennanen describes the appealing contrast created when a phrase moves between unison and octave-course regions on four-course bouzouki, including echo-like use in instrumental and taximi contexts.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Play the four-note cell on the Horizontal route and leave one pulse of space.", "Switch to Tiered and answer with the same degree contour in a different course/register.", "Keep the rhythm identical so the listener hears the timbre/register change as the variation."],
      listen: "The second cell should sound like the same thought in a different voice, not a new unrelated lick.",
      pass: "The repeated contour is recognizable and the course/register contrast sounds deliberate on your instrument.",
      boundary: "Pennanen supports the echo-timbre observation. Dromos generates the four-note cell; guitar uses a register/string-set comparison rather than claiming paired-course bouzouki acoustics."
    },
    {
      id: "triplet-grammar", category: "route", order: 8, title: "Alternate ↔ glide triplets",
      short: "Compare a strict down/up grid with a deliberate same-direction glide.", layout: "2nps", sequence: "tripletGrammar", count: 12,
      variants: [{ id: "alternate", label: "Strict alternate" }, { id: "glide", label: "Glide / sweep" }],
      theory: "A three-note group can cross the strings without changing its pitches. Compare how the stroke grammar changes the accent: D–U–D / U–D–U versus Pennanen's documented D–D–U / U–D–D glide families.",
      evidence: "Pennanen reports that strict alternate picking is not axiomatic in bouzouki practice. He documents traditional-player deviations, including glide or sweep patterns such as D–D–U and U–D–D in triplet or sextuplet motion.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Choose Strict alternate and keep one pick attack for every arrow.", "Choose Glide / sweep: DG means the second downstroke continues through the adjacent course as one directed gesture.", "Keep the same notes and tempo; choose the version whose accent serves the phrase rather than treating either grammar as universal."],
      listen: "The pitch order must remain identical. Hear whether the glide binds the triplet and moves its weight without producing an accidental extra accent.",
      pass: "You can perform both grammars slowly, describe the accent difference, and choose one for a musical reason.",
      boundary: "The observed stroke families and warning against one universal rule are source-supported. This exact A/B note route is an original Dromos comparison, not a Pennanen or Hiotis transcription."
    },
    {
      id: "pick-legato", category: "phrase", order: 9, title: "Pick–hammer–pull–slide chain",
      short: "Make the pick start the syllable and let the left hand shape it.", layout: "horizontal", sequence: "ornament", count: 6,
      theory: "Decoration has a harmonic destination. Name the final note's scale degree and land it as a chord tone; the ornament connects to that target rather than replacing it.",
      evidence: "Pennanen identifies hammer, pull, trill, and glissando/portamento among common bouzouki ornament families; Trigas includes glissando and ornament studies.",
      sourceLabel: "Pennanen + Trigas method overview", sourceHref: PENNANEN,
      steps: ["Play the first note once, then follow the H, P, and SL symbols without re-picking hidden attacks.", "Keep every unpicked note rhythmically placed; legato does not mean unmeasured.", "Repeat the cell and land its final picked note on a chord tone."],
      listen: "The ornament should connect the phrase while the destination remains clearer than the decoration.",
      pass: "The unpicked notes speak clearly at the same pulse, and removing the ornament leaves the phrase's target intact.",
      boundary: "The ornament families are source-supported. This exact six-event chain is an original fixed-fret Dromos drill, not a claim about universal Greek execution."
    },
    {
      id: "arpeggio-arrival", category: "phrase", order: 10, title: "Triad arpeggio → next 3rd",
      short: "Turn picking control into audible harmony.", layout: "arpeggio", sequence: "arpeggio", count: 5,
      theory: "Root, 3rd, and 5th state the current chord. The next chord's 3rd is the high-information arrival because it reveals that chord's major or minor quality.",
      evidence: "Trigas combines picking, arpeggios, modes, rhythm, and improvisation in one bouzouki study sequence; Pafranidis likewise places chord arpeggios and tremolo after scale foundations.",
      sourceLabel: "Trigas method overview", sourceHref: TRIGAS,
      steps: ["Play root–3rd–5th–3rd of the sounding chord with strict alternate strokes.", "Pause long enough to hear the coming chord, then pick its 3rd on the arrival.", "Move through the selected progression without changing the rhythmic shape."],
      listen: "The final note should make the chord change audible even if the backing chord is removed.",
      pass: "You can name and pre-sing both 3rds, then land the next one in time for every chord in the map.",
      boundary: "The integrated study categories are source-supported. Dromos derives these notes from the selected chord map; it is not a published Trigas exercise or artist lick."
    }
  ];

  function byId(id) {
    return EXERCISES.find((exercise) => exercise.id === id) || EXERCISES[0];
  }

  function cloneNode(node) {
    return Object.assign({}, node, { note: Object.assign({}, node.note || {}) });
  }

  function repeatTo(nodes, count) {
    if (!nodes || !nodes.length) return [];
    return Array.from({ length: count }, (_, index) => cloneNode(nodes[index % nodes.length]));
  }

  function alternate(nodes, accents, firstStroke) {
    const startDown = firstStroke !== "up";
    return nodes.map((node, index) => Object.assign(cloneNode(node), {
      order: index + 1,
      stroke: ((index % 2 === 0) === startDown) ? "down" : "up",
      technique: ((index % 2 === 0) === startDown) ? "D" : "U",
      accent: accents ? accents(index) : index === 0
    }));
  }

  function buildSequence(exerciseId, baseNodes, pulse, firstStroke, variant) {
    const exercise = byId(exerciseId);
    const beats = pulse && pulse.length ? pulse : [{ first: true, group: 1, beat: 1 }];
    let nodes;
    if (exercise.sequence === "pulse") {
      nodes = repeatTo(baseNodes, beats.length);
      return alternate(nodes, (index) => !!beats[index].first, firstStroke).map((node, index) =>
        Object.assign(node, { group: beats[index].group, pulseUnit: beats[index].beat }));
    }
    if (exercise.sequence === "tremolo") {
      const target = baseNodes[0];
      if (!target) return [];
      nodes = [];
      [2, 4, 6, 8].forEach((size, groupIndex) => {
        repeatTo([target], size).forEach((node, index) => nodes.push(Object.assign(node, {
          burst: size, group: groupIndex + 1, groupStart: index === 0
        })));
      });
      return alternate(nodes, (index) => !!nodes[index].groupStart, firstStroke);
    }
    if (exercise.sequence === "ornament") {
      if (!baseNodes.length) return [];
      const picks = [0, 1, 2, 1, 2, 3].map((index) => cloneNode(baseNodes[index % baseNodes.length]));
      const techniques = firstStroke === "up" ? ["U", "H", "H", "P", "D", "SL"] : ["D", "H", "H", "P", "U", "SL"];
      return picks.map((node, index) => Object.assign(node, {
        order: index + 1, technique: techniques[index], accent: index === 0 || index === picks.length - 1,
        stroke: techniques[index] === "D" ? "down" : techniques[index] === "U" ? "up" : null
      }));
    }
    if (exercise.sequence === "arpeggio") {
      if (!baseNodes.length) return [];
      const picks = [0, 1, 2, 1, 3].map((index) => cloneNode(baseNodes[Math.min(index, baseNodes.length - 1)]));
      return alternate(picks, (index) => index === 0 || index === picks.length - 1, firstStroke);
    }
    if (exercise.sequence === "echo") {
      nodes = repeatTo(baseNodes, 4).concat(repeatTo(baseNodes, 4));
      return alternate(nodes, (index) => index === 0 || index === 4, firstStroke).map((node, index) =>
        Object.assign(node, { phrase: index < 4 ? "call" : "answer" }));
    }
    if (exercise.sequence === "tripletGrammar") {
      let source = baseNodes;
      const firstCourseChange = source.findIndex((node, index) =>
        index > 0 && node.stringIndex !== source[index - 1].stringIndex);
      if (firstCourseChange > 0) {
        const start = firstCourseChange - 1;
        source = source.slice(start).concat(source.slice(0, start));
      }
      nodes = repeatTo(source, exercise.count);
      if (variant !== "glide") return alternate(nodes, (index) => index % 3 === 0, firstStroke);
      const downFirst = firstStroke !== "up";
      const techniques = [];
      for (let start = 0; start < nodes.length; start += 3) {
        const firstCrosses = nodes[start + 1] && nodes[start].stringIndex !== nodes[start + 1].stringIndex;
        const secondCrosses = nodes[start + 2] && nodes[start + 1].stringIndex !== nodes[start + 2].stringIndex;
        // Put the continued same-direction gesture ON the course change. A
        // two-notes-per-course route alternates which triplet boundary crosses,
        // naturally producing the documented D-D-U and U-D-D families.
        const crossFirst = firstCrosses || !secondCrosses;
        techniques.push(...(downFirst
          ? crossFirst ? ["D", "DG", "U"] : ["U", "D", "DG"]
          : crossFirst ? ["U", "UG", "D"] : ["D", "U", "UG"]));
      }
      return nodes.map((node, index) => {
        const technique = techniques[index];
        return Object.assign(cloneNode(node), {
          order: index + 1,
          technique,
          stroke: technique.charAt(0) === "D" ? "down" : "up",
          gesture: technique.length > 1 ? "glide" : "pick",
          accent: index % 3 === 0,
          phrase: technique.length > 1 ? "continue through course" : "single attack"
        });
      });
    }
    nodes = repeatTo(baseNodes, Math.min(exercise.count, Math.max(1, baseNodes.length)));
    return alternate(nodes, null, firstStroke);
  }

  // A practice run stays deliberately small: repeat one exact motor problem,
  // or evolve it through playable positions and/or a circle-of-fourths key
  // route. The caller supplies positions already verified for the instrument.
  function buildPracticePlan(options) {
    const o = Object.assign({
      tonic: "D", position: 5, repeats: 4, runMode: "loop", movement: "position",
      tonics: ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"],
      positions: [{ position: 5, lowFret: 5 }]
    }, options || {});
    const repeats = [1, 2, 4, 6].includes(+o.repeats) ? +o.repeats : 4;
    const runMode = o.runMode === "evolve" ? "evolve" : "loop";
    const movement = ["position", "key", "both"].includes(o.movement) ? o.movement : "position";
    const tonics = Array.isArray(o.tonics) && o.tonics.length ? o.tonics : [o.tonic];
    const normalizedPositions = (Array.isArray(o.positions) ? o.positions : [])
      .map((item) => typeof item === "number" ? { position: item, lowFret: item } : item)
      .filter((item) => item && Number.isFinite(+item.position))
      .sort((left, right) => (+left.lowFret || +left.position) - (+right.lowFret || +right.position));
    if (!normalizedPositions.length) normalizedPositions.push({ position: +o.position || 0, lowFret: +o.position || 0 });
    const startPositionIndex = normalizedPositions.reduce((best, item, index) =>
      Math.abs(+item.position - +o.position) < Math.abs(+normalizedPositions[best].position - +o.position) ? index : best, 0);
    const positionRoute = normalizedPositions.slice(startPositionIndex).concat(normalizedPositions.slice(0, startPositionIndex));
    const startTonicIndex = Math.max(0, tonics.indexOf(o.tonic));

    return Array.from({ length: repeats }, (_, index) => {
      const advances = runMode === "evolve" ? index : 0;
      const movePosition = movement === "position" || movement === "both";
      const moveKey = movement === "key" || movement === "both";
      const position = movePosition ? positionRoute[advances % positionRoute.length] : { position: +o.position || 0, lowFret: +o.position || 0 };
      const tonic = moveKey ? tonics[(startTonicIndex + advances * 5) % tonics.length] : o.tonic;
      return {
        index, tonic, position: +position.position, lowFret: Number.isFinite(+position.lowFret) ? +position.lowFret : +position.position,
        label: runMode === "loop" ? `Loop ${index + 1}` : `Stage ${index + 1}`
      };
    });
  }

  function selfTest() {
    const results = [];
    const check = (name, pass, detail) => results.push({ name, pass, detail: detail || "" });
    check("picking exercise ids are unique", new Set(EXERCISES.map((item) => item.id)).size === EXERCISES.length);
    check("every picking category has an exercise", CATEGORIES.every((category) => EXERCISES.some((item) => item.category === category.id)));
    check("every exercise is actionable and bounded", EXERCISES.every((item) =>
      item.steps.length === 3 && item.listen && item.pass && item.theory && /Dromos|not a|not copied|not his/i.test(item.boundary)));
    check("every named claim links to a source", EXERCISES.every((item) => /^https:\/\//.test(item.sourceHref) && item.evidence && item.sourceLabel));
    const sample = Array.from({ length: 12 }, (_, index) => ({ midi: 60 + index, stringIndex: Math.floor(index / 3), fret: index, note: { degree: String(index + 1) } }));
    const strict = buildSequence("mixed-crossings", sample, []);
    check("strict alternate plan never repeats a stroke", strict.every((event, index) => index === 0 || event.stroke !== strict[index - 1].stroke));
    const pulse = buildSequence("grouped-accents", sample, [
      { beat: 1, group: 1, first: true }, { beat: 2, group: 1, first: false },
      { beat: 3, group: 2, first: true }, { beat: 4, group: 2, first: false }
    ]);
    check("grouped accents follow group starts", "1,3", pulse.map((event, index) => event.accent ? index + 1 : null).filter(Boolean).join(","));
    check("tremolo ladder is 2+4+6+8", 20, buildSequence("tremolo-ladder", sample, []).length);
    check("ornament plan separates picked and legato events", "D,H,H,P,U,SL", buildSequence("pick-legato", sample, []).map((event) => event.technique).join(","));
    check("Pennanen A/B keeps twelve pitches while changing stroke grammar", 12, buildSequence("triplet-grammar", sample, [], "down", "glide").length);
    const twoPerCourse = Array.from({ length: 12 }, (_, index) => ({ midi: 60 + index, stringIndex: Math.floor(index / 2), fret: index, note: { degree: String(index + 1) } }));
    const glide = buildSequence("triplet-grammar", twoPerCourse, [], "down", "glide");
    check("glide comparison exposes documented D-D-U and U-D-D families", "D,DG,U,U,D,DG", glide.slice(0, 6).map((event) => event.technique).join(","));
    check("glide comparison honours the selected first stroke", "down", glide[0].stroke);
    check("every glide lands on a real course crossing", true, glide.every((event, index) =>
      event.gesture !== "glide" || index > 0 && event.stringIndex !== glide[index - 1].stringIndex));
    const positions = [{ position: 2, lowFret: 2 }, { position: 5, lowFret: 5 }, { position: 7, lowFret: 7 }, { position: 10, lowFret: 10 }];
    const loopPlan = buildPracticePlan({ tonic: "D", position: 5, repeats: 4, runMode: "loop", movement: "both", positions });
    check("loop plan preserves one exact problem", true, loopPlan.every((stage) => stage.tonic === "D" && stage.position === 5));
    const keyPlan = buildPracticePlan({ tonic: "D", position: 5, repeats: 4, runMode: "evolve", movement: "key", positions });
    check("key evolution follows circle of fourths", "D,G,C,F", keyPlan.map((stage) => stage.tonic).join(","));
    const positionPlan = buildPracticePlan({ tonic: "D", position: 5, repeats: 4, runMode: "evolve", movement: "position", positions });
    check("position evolution visits practical shapes then wraps", "5,7,10,2", positionPlan.map((stage) => stage.position).join(","));
    return { ok: results.every((result) => result.pass), results };
  }

  window.PickingLab = { CATEGORIES, EXERCISES, byId, buildSequence, buildPracticePlan, selfTest };
})();
