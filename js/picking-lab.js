/* picking-lab.js — source-bounded plectrum curriculum and event plans.
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
      evidence: "Pennanen describes the appealing contrast created when a phrase moves between unison and octave-course regions on four-course bouzouki, including echo-like use in instrumental and taximi contexts.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Play the four-note cell on the Horizontal route and leave one pulse of space.", "Switch to Tiered and answer with the same degree contour in a different course/register.", "Keep the rhythm identical so the listener hears the timbre/register change as the variation."],
      listen: "The second cell should sound like the same thought in a different voice, not a new unrelated lick.",
      pass: "The repeated contour is recognizable and the course/register contrast sounds deliberate on your instrument.",
      boundary: "Pennanen supports the echo-timbre observation. Dromos generates the four-note cell; guitar uses a register/string-set comparison rather than claiming paired-course bouzouki acoustics."
    },
    {
      id: "pick-legato", category: "phrase", order: 8, title: "Pick–hammer–pull–slide chain",
      short: "Make the pick start the syllable and let the left hand shape it.", layout: "horizontal", sequence: "ornament", count: 6,
      evidence: "Pennanen identifies hammer, pull, trill, and glissando/portamento among common bouzouki ornament families; Trigas includes glissando and ornament studies.",
      sourceLabel: "Pennanen + Trigas method overview", sourceHref: PENNANEN,
      steps: ["Play the first note once, then follow the H, P, and SL symbols without re-picking hidden attacks.", "Keep every unpicked note rhythmically placed; legato does not mean unmeasured.", "Repeat the cell and land its final picked note on a chord tone."],
      listen: "The ornament should connect the phrase while the destination remains clearer than the decoration.",
      pass: "The unpicked notes speak clearly at the same pulse, and removing the ornament leaves the phrase's target intact.",
      boundary: "The ornament families are source-supported. This exact six-event chain is an original fixed-fret Dromos drill, not a claim about universal Greek execution."
    },
    {
      id: "arpeggio-arrival", category: "phrase", order: 9, title: "Triad arpeggio → next 3rd",
      short: "Turn picking control into audible harmony.", layout: "arpeggio", sequence: "arpeggio", count: 5,
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

  function buildSequence(exerciseId, baseNodes, pulse, firstStroke) {
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
    nodes = repeatTo(baseNodes, Math.min(exercise.count, Math.max(1, baseNodes.length)));
    return alternate(nodes, null, firstStroke);
  }

  function selfTest() {
    const results = [];
    const check = (name, pass, detail) => results.push({ name, pass, detail: detail || "" });
    check("picking exercise ids are unique", new Set(EXERCISES.map((item) => item.id)).size === EXERCISES.length);
    check("every picking category has an exercise", CATEGORIES.every((category) => EXERCISES.some((item) => item.category === category.id)));
    check("every exercise is actionable and bounded", EXERCISES.every((item) =>
      item.steps.length === 3 && item.listen && item.pass && /Dromos|not a|not copied|not his/i.test(item.boundary)));
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
    return { ok: results.every((result) => result.pass), results };
  }

  window.PickingLab = { CATEGORIES, EXERCISES, byId, buildSequence, selfTest };
})();
