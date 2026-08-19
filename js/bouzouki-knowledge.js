/* bouzouki-knowledge.js — provenance-ranked curriculum spine.
 *
 * This module stores what a source is allowed to support. It does not contain
 * copied notation, commercial exercises, transcribed recordings, or a claim
 * that one artist's habits are universal bouzouki law. Dromos exercises are
 * generated independently and point back to the smallest defensible source.
 */
(function () {
  "use strict";

  const SOURCES = [
    {
      id: "trigas-method", rank: 1, authority: "Author's method",
      name: "Vangelis Trigas · five-volume bouzouki methods",
      href: "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-three-string-bouzouki/",
      supports: ["progressive study", "plectrum", "finger independence", "glissando", "arpeggios", "ornaments", "rhythms", "dromoi", "taximi"],
      boundary: "The official overview establishes the curriculum families and sequence; Dromos does not reproduce the method's 493 exercises or songs."
    },
    {
      id: "pafranidis-sample", rank: 1, authority: "Publisher sample",
      name: "Pavlos Pafranidis · Complete Method public sample",
      href: "https://fagottobooks.gr/blog/wp-content/uploads/2020/04/trixordo-sample.pdf",
      supports: ["plectrum direction", "downbeat and upbeat", "open-course work", "slow clear attack", "fretboard notes"],
      boundary: "The public sample supports terminology and teaching order; its printed exercises and notation are not copied into Dromos."
    },
    {
      id: "avlonitis-101", rank: 1, authority: "Publisher catalogue",
      name: "Giorgos Avlonitis · 101 Dexterity Exercises for Bouzouki",
      href: "https://fagottobooks.gr/en/1037-4_979-0-801151-59-9.html",
      supports: ["graded difficulty", "plectrum", "finger strength", "diminished-scale study", "technical diligence"],
      boundary: "The publisher description supports those study domains only. Dromos generates original sequencing drills and does not reproduce any of the 101 exercises or CD audio."
    },
    {
      id: "karantinis-lessons", rank: 1, authority: "Official artist lessons",
      name: "Manolis Karantinis · modes, technique and phraseology lessons",
      href: "https://karantinis.com/video-lessons/",
      supports: ["plectrum practice", "mode positions", "improvisation", "style comparison", "mode-specific phraseology"],
      boundary: "The official lesson catalogue establishes the teaching topics. Dromos links to paid lessons and never republishes their demonstrations or phrases."
    },
    {
      id: "filippatos-bouzoukiland", rank: 2, authority: "Official teacher channel",
      name: "Nikos Filippatos · BouzoukiLand",
      href: "https://www.youtube.com/@BouzoukiLand",
      supports: ["accessible video study", "Greek music context", "teacher-demonstrated technique", "repertoire-led learning"],
      boundary: "BouzoukiLand is a linked lesson and observation source. Dromos does not download, transcribe, restream, or imply endorsement by Nikos Filippatos."
    },
    {
      id: "pennanen", rank: 1, authority: "Open scholarship",
      name: "Risto Pekka Pennanen · The Poetics of the Little Finger",
      href: "https://taju.uniarts.fi/items/5897add1-8de2-482f-be1d-6bfe70ca6831",
      supports: ["horizontal and tiered routes", "course timbre", "alternate-picking limits", "glide and sweep grammars", "ornament families"],
      boundary: "The study supports documented motor and timbre observations. Every note route in Dromos is newly generated, not a performer transcription."
    },
    {
      id: "pagiatis-dromoi", rank: 1, authority: "Publisher sample",
      name: "Charalampos Pagiatis · Greek Folk Scales and Their Practical Approach",
      href: "https://fagottobooks.gr/blog/wp-content/uploads/2024/02/%CE%BB%CE%B1%CE%B9%CE%BA%CE%BF%CE%B9%CE%B4%CF%81%CE%BF%CE%BC%CE%BF%CE%B9%CE%BA%CE%B1%CE%B9%CF%80%CF%81%CE%B1%CE%BA%CE%B1%CF%80%CE%BF%CF%83%CF%80.pdf",
      supports: ["dromos fingering", "main and secondary chords", "common chord motion", "folk-rhythm practice", "characteristic melody"],
      boundary: "The public foreword supports an integrated map-to-music curriculum. Dromos does not copy the book's diagrams, melodies, or exercises."
    },
    {
      id: "reddit-bouzouki", rank: 3, authority: "Community signal",
      name: "r/bouzouki · recurring learner questions",
      href: "https://www.reddit.com/r/bouzouki/",
      supports: ["learner vocabulary", "recurring right-hand problems", "resource discovery", "instrument-confusion warnings"],
      boundary: "Community posts may reveal what learners struggle to understand. They never establish theory, historical fact, or a mandatory technique rule by themselves."
    }
  ];

  const MASTERY_PHASES = [
    {
      id: "attack", step: 1, label: "Ta–ka time", short: "↓ ta · ↑ ka",
      answer: "Build an even down–up clock first. For an articulated line, every written note receives its own pick attack.",
      gate: "Upstrokes match downstrokes in time, volume, and clarity before tempo rises.",
      exerciseIds: ["down-up-clock", "picked-dromos-line", "grouped-accents"]
    },
    {
      id: "coordination", step: 2, label: "Coordination", short: "course + finger order",
      answer: "Keep the ta–ka clock intact while courses, scale windows, and left-hand order change.",
      gate: "The course change is no louder, later, or more tense than the notes around it.",
      exerciseIds: ["outside-pairs", "mixed-crossings", "degree-window"]
    },
    {
      id: "route", step: 3, label: "Neck route", short: "sound chooses the shape",
      answer: "Compare practical neck routes by both motion and timbre; the shortest fingering is not automatically the best phrase.",
      gate: "You can play two routes and name the audible reason for choosing one.",
      exerciseIds: ["tactile-ab", "timbre-echo", "triplet-grammar"]
    },
    {
      id: "language", step: 4, label: "Phrase language", short: "tremolo is a choice",
      answer: "Keep note-by-note picking, tremolo sustain, glides, and left-hand ornaments as distinct musical behaviors.",
      gate: "A listener can hear the target and phrase contour—not only the technique used to reach it.",
      exerciseIds: ["tremolo-ladder", "pick-legato", "mode-phrase-cell"]
    },
    {
      id: "performance", step: 5, label: "Performance transfer", short: "hear → target → pulse",
      answer: "Use the trained attack to reveal the sounding chord, selected dromos, and coming arrival inside a Greek pulse.",
      gate: "The final target makes the change audible without a visual prompt.",
      exerciseIds: ["arpeggio-arrival"]
    }
  ];

  const KNOWLEDGE_DOMAINS = [
    { id: "right-hand", label: "Right-hand engine", sourceIds: ["trigas-method", "pafranidis-sample", "avlonitis-101"], decision: "Articulated ta–ka lines are the default foundation; tremolo, glide, and ornament are explicitly selected branches." },
    { id: "coordination", label: "Whole-hand coordination", sourceIds: ["trigas-method", "avlonitis-101", "pennanen"], decision: "Grade difficulty through one changing variable: attack, course crossing, scale window, route, then key/position." },
    { id: "map", label: "Dromos and harmony map", sourceIds: ["trigas-method", "pagiatis-dromoi", "karantinis-lessons"], decision: "A fingering becomes music only when the player can name its degree, chord role, dromos color, and destination." },
    { id: "phrase", label: "Phrase language", sourceIds: ["karantinis-lessons", "pennanen", "filippatos-bouzoukiland"], decision: "Teach short contour, breath, target, touch, and response—not a scale run presented as Greek phraseology." },
    { id: "learner-ux", label: "Learner questions", sourceIds: ["reddit-bouzouki", "filippatos-bouzoukiland"], decision: "Use community evidence to clarify labels, onboarding, and common failure choices; never to define the music model." }
  ];

  function sourceById(id) {
    return SOURCES.find((source) => source.id === id) || null;
  }

  function phaseForExercise(id) {
    return MASTERY_PHASES.find((phase) => phase.exerciseIds.includes(id)) || null;
  }

  function selfTest() {
    const results = [];
    const check = (name, pass, detail) => results.push({ name, pass, detail: detail || "" });
    check("bouzouki source ids are unique", new Set(SOURCES.map((source) => source.id)).size === SOURCES.length);
    check("every source has provenance and a rights boundary", SOURCES.every((source) =>
      /^https:\/\//.test(source.href) && source.authority && source.supports.length && /not|never|does not/i.test(source.boundary)));
    check("community evidence is visibly lowest authority", SOURCES.filter((source) => source.authority === "Community signal").every((source) => source.rank === 3));
    check("mastery phase numbers and ids are unique", new Set(MASTERY_PHASES.map((phase) => phase.id)).size === MASTERY_PHASES.length && MASTERY_PHASES.every((phase, index) => phase.step === index + 1));
    check("every mastery phase has an action and pass gate", MASTERY_PHASES.every((phase) => phase.answer && phase.gate && phase.exerciseIds.length));
    check("knowledge domains resolve only known sources", KNOWLEDGE_DOMAINS.every((domain) => domain.sourceIds.every(sourceById)));
    check("community evidence never stands alone", KNOWLEDGE_DOMAINS.every((domain) =>
      !domain.sourceIds.some((id) => sourceById(id).authority === "Community signal") || domain.sourceIds.some((id) => sourceById(id).rank < 3)));
    return { ok: results.every((result) => result.pass), results };
  }

  window.BouzoukiKnowledge = { SOURCES, MASTERY_PHASES, KNOWLEDGE_DOMAINS, sourceById, phaseForExercise, selfTest };
})();
