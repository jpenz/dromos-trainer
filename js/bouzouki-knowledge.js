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
      id: "pennanen-1999", rank: 1, authority: "Open scholarship",
      name: "Risto Pekka Pennanen · Bouzouki organology and performance practice (1999, ch. IV)",
      href: "https://www.academia.edu/6666348/IV_The_organological_development_and_performance_practice_of_the_Greek_bouzouki",
      supports: ["traditional motor structures", "uniform tone colour aesthetics", "limits of cross-course playing", "era performance practice"],
      boundary: "Documents observed practice; Dromos drills are generated, and heavy cross-course sweeping is treated as counter-idiomatic per this source, never prescribed."
    },
    {
      id: "papasolomontos-2017", rank: 1, authority: "Academic thesis",
      name: "Papasolomontos 2017 (TEI Epirus) · analysis of Chiotis introductory taximia",
      href: "https://olympias.lib.uoi.gr/jspui/bitstream/teiep/8069/1/%CE%A0%CE%A4%CE%A5%CE%A7%CE%99%CE%91%CE%9A%CE%97%20%CE%A0%CE%91%CE%A0%CE%91%CE%A3%CE%9F%CE%9B%CE%9F%CE%9C%CE%A9%CE%9D%CE%A4%CE%9F%CE%A3.pdf",
      supports: ["mimisis imitation chains", "glide triplet and sextolet grammar", "I-IV-V-I taximi arc", "instant key-change testimony"],
      boundary: "Transcription analysis of ten taximia. Dromos extrapolates drill patterns from its documented devices and never reproduces the transcriptions."
    },
    {
      id: "monemvasitis-minore", rank: 1, authority: "Academic thesis",
      name: "UoA thesis · the Minore tou Teke taximi lineage",
      href: "https://pergamos.lib.uoa.gr/uoa/dl/object/3421083/file.pdf",
      supports: ["minore taximi formulas", "descending skeleton lines", "measured zeibekiko tempi"],
      boundary: "Supports the minore lineage and measured recording tempi; melodic skeletons in Dromos are generated from the scale model, not copied from the thesis transcriptions."
    },
    {
      id: "measured-tempi", rank: 1, authority: "Academic thesis",
      name: "TEI of Epirus thesis · measured Greek dance tempi",
      href: "https://olympias.lib.uoi.gr/jspui/bitstream/teiep/5871/1/369",
      supports: ["tsifteteli measured tempo band", "counting-convention differences"],
      boundary: "Per-recording measurements only. Where a numeric range is not documented (hasapiko), Dromos does not ship a number."
    },
    {
      id: "allingham-tempo", rank: 1, authority: "Peer-reviewed research",
      name: "Allingham & Wollner 2022 · tempo-management strategies in practice",
      href: "https://journals.sagepub.com/doi/pdf/10.1177/03057356221129653",
      supports: ["gradual tempo increase", "slow-fast alternation", "no validated step size"],
      boundary: "Validates strategies, not numbers: ladder step sizes in Dromos are labelled documented teaching practice, never experimentally optimal."
    },
    {
      id: "bickford-mandolin", rank: 1, authority: "Public-domain method (import)",
      name: "Bickford Mandolin Method · tremolo doctrine",
      href: "https://archive.org/download/bickfordmandolin01bick/bickfordmandolin01bick.pdf",
      supports: ["unmeasured free tremolo rule", "graded tremolo study"],
      boundary: "A classical mandolin import, labelled as such: it governs how tremolo must FEEL once entered, not Greek phrasing."
    },
    {
      id: "mandoisland-counted", rank: 2, authority: "Teacher resource (import)",
      name: "MandoIsland · counted tremolo groupings and speed doctrine",
      href: "https://www.mandoisland.de/eng_tipps_und_tricks.html",
      supports: ["counted groupings 4+1 6+1 8+1", "finishing-stroke control", "big-motions-first speed work"],
      boundary: "Mandolin pedagogy import: supplies the counted bridge toward free tremolo; stroke exits are practice scaffolding, not Greek prescription."
    },
    {
      id: "irish-treble", rank: 2, authority: "Teacher resource (import)",
      name: "Irish tenor banjo/mandolin treble pedagogy (Scahill; Landes)",
      href: "https://www.pegheadnation.com/string-school/irish-mandolin/",
      supports: ["anchor-plus-treble triplet cell", "D-U-D treble execution"],
      boundary: "An Irish plectrum import wearing its badge: a triplet-cell workout, not a claim about Greek practice."
    },
    {
      id: "ordoulidis-modes", rank: 1, authority: "Open scholarship",
      name: "Nikos Ordoulidis · the Greek popular modes",
      href: "https://www.scribd.com/document/490472548/ordoulidis-the-greek-popular-modes-pdf",
      supports: ["dromoi as transposable interval structures", "mode naming practice"],
      boundary: "Supports that a dromos is an interval structure realisable from any tonic; it does not endorse any specific key choice, which carries its own label in Dromos."
    },
    {
      id: "manolopoulos-thesis", rank: 1, authority: "Academic thesis",
      name: "Manolopoulos 2023 (Univ. of Macedonia) · bouzouki practice progression",
      href: "https://dspace.lib.uom.gr/bitstream/2159/29581/5/ManolopoulosIoannisMsc2023.pdf",
      supports: ["penia starts on quarters at 80", "eighths from 60, 80 at two weeks, 120 at one month, 140+ long-term", "16ths/32nds/tremolo introduced by counting aloud at slow tempo", "song-flow benchmarks 60/80/90-100/110/120"],
      boundary: "One Greek thesis's printed progression - the only bouzouki-specific tempo prescription found; it does not make its numbers a universal rule."
    },
    {
      id: "trinity-plectrum", rank: 1, authority: "Institutional syllabus (import)",
      name: "Trinity College London · Plectrum Guitar grade scale minima",
      href: "https://www.trinitycollege.com/resource?id=4694",
      supports: ["printed scale minima: Initial q=60, Grade 1 q=72, Grade 2 q=88"],
      boundary: "A guitar-syllabus import for anchor tempos only; it does not grade bouzouki playing."
    },
    {
      id: "leavitt-method", rank: 1, authority: "Method book (import)",
      name: "Leavitt · A Modern Method for Guitar (Berklee)",
      href: "https://archive.org/details/modernmethodforg01leav",
      supports: ["attack each new string with a downstroke", "string-skip etudes with notated picking"],
      boundary: "The Berklee guitar method, an import wearing its badge; its etudes are not copied and it prescribes nothing about Greek style."
    },
    {
      id: "berklee-online", rank: 1, authority: "Institutional curriculum (import)",
      name: "Berklee Online · ear training, time and rhythm, scale-practice articles",
      href: "https://online.berklee.edu/courses/time-and-rhythm-1",
      supports: ["metronome placements: on the beat, off the beat, every other beat", "8ths then triplets then 16ths as the rhythm progression", "rest strokes prescribed for pick control in scale practice", "vocalise rhythms before playing"],
      boundary: "Institutional import for practice mechanics only; it does not teach Greek repertoire and no course content is reproduced."
    },
    {
      id: "skamnelos-review", rank: 1, authority: "Academic thesis",
      name: "Skamnelos 2007 (TEI Epirus) · comparative review of Greek bouzouki methods",
      href: "https://olympias.lib.uoi.gr/jspui/bitstream/teiep/394/1/lpm_000031.pdf",
      supports: ["Greek methods codify pick direction (thesi/arsi)", "shallow pick contact prescribed", "deep digging (skapsimo) described as a fault"],
      boundary: "A survey of the printed methods; it does not itself prescribe exercises, and Dromos reproduces none of the reviewed material."
    },
    {
      id: "mair-pick-technique", rank: 2, authority: "Professional teacher (import)",
      name: "Marilynn Mair · Pick Technique for the Classical Mandolinist",
      href: "https://www.marilynnmair.com/articles/mandolin/2003/pick-technique/",
      supports: ["four-bar subdivision ladder at mm 50-60", "quarters and eighths downstroke then sixteenths and thirty-seconds alternate", "10-20 repetitions per cycle"],
      boundary: "A classical-mandolin import, labelled as such; it is the one printed tempo prescription found in plectrum pedagogy and does not describe Greek style."
    },
    {
      id: "rosenberg-rest-stroke", rank: 2, authority: "Professional teacher (import)",
      name: "Rosenberg Academy · gypsy-jazz rest-stroke lessons",
      href: "https://rosenbergacademy.com/collections/lessons",
      supports: ["rest-stroke definition", "down-through-and-land mechanics", "free-upstroke pairing"],
      boundary: "A gypsy-jazz import, labelled as such: it does not describe Greek penia style, and no Rosenberg lesson content ships in Dromos. Video-backed claims were noted at research time, not re-checked automatically."
    },
    {
      id: "stahl-mandolin", rank: 1, authority: "Public-domain method (import)",
      name: "Stahl · mandolin method (downstroke rules, D-U-D triplets)",
      href: "https://brittlebooks.library.illinois.edu/brittlebooks_open/Books2011-10/stahwi0001mani64/stahwi0001mani64v00001/stahwi0001mani64v00001.pdf",
      supports: ["downstroke on a new string", "unidirectional stroke drills", "D-U-D triplet picking"],
      boundary: "A public-domain mandolin import; it is not a Greek prescription and its printed exercises are not copied."
    },
    {
      id: "praktiki-methodos-scan", rank: 2, authority: "Method-book scan (unattributed)",
      name: "Praktiki Methodos · trichordo bouzouki method (scan)",
      href: "https://pdfcoffee.com/bouzouki-me-tho-dos-h-pdf-pdf-free.html",
      supports: ["down-only then up-only then alternating pass sequence", "open-course crossing drills"],
      boundary: "An unattributed scan on a file-sharing host: corroborating but weak evidence that cannot anchor a superlative, and its pages are not reproduced."
    },
    {
      id: "polykandriotis-method", rank: 1, authority: "Author's method",
      name: "Thanasis Polykandriotis · bouzouki method vol. 1 (three chord positions)",
      href: "https://polykandriotis.gr/wp-content/uploads/2020/05/vivlio1.pdf",
      supports: ["chords taught in three neck positions", "picked arpeggio exercises"],
      boundary: "Supports the three-position chord frame only; the inversion-ladder ordering is not in this source and its exercises are not copied."
    },
    {
      id: "weiss-triad-ladder", rank: 2, authority: "Professional teacher (import)",
      name: "Weiss · major-triad ladder up the fretboard (guitar)",
      href: "https://weissguitar.com/guitar_major_triads",
      supports: ["root-then-inversions climbing order", "triad-tone naming"],
      boundary: "A guitar import for the climbing order only; it does not describe bouzouki course pairs."
    },
    {
      id: "gilbert-polarity", rank: 2, authority: "Professional teacher (import)",
      name: "Paul Gilbert via Guitar World · inside vs outside picking",
      href: "https://www.guitarworld.com/lessons/paul-gilbert-lesson-truth-about-inside-and-outside-picking-video",
      supports: ["inside/outside crossing polarity", "one-note flip between polarities", "one-note-per-string hardest case"],
      boundary: "A guitar import naming the two crossing situations; it does not test the Dromos stop-and-flip drill."
    },
    {
      id: "verwey-repp-background", rank: 1, authority: "Peer-reviewed research",
      name: "Verwey (motor chunking) + Repp (synchronization-continuation)",
      href: "https://pubmed.ncbi.nlm.nih.gov/12879170/",
      supports: ["motor chunk boundaries", "continuation timing after the click stops"],
      boundary: "Background literature: it motivates the silence-re-entry design but does not test this specific drill."
    },
    {
      id: "greek-teacher-first-lessons", rank: 2, authority: "Professional teacher lessons",
      name: "Greek teacher lessons · course traversal and 1-2-3-4 crossing drills (video)",
      href: "https://www.youtube.com/watch?v=y_W53UIGzQM",
      supports: ["repetition-per-course traversal as a first lesson", "fretted 1-2-3-4 across courses", "up-only passes as a named drill"],
      boundary: "Each video shows one teacher's practice, not the canon; content was noted at research time and is not re-checked automatically."
    },
    {
      id: "challenge-point", rank: 1, authority: "Peer-reviewed research",
      name: "Guadagnoli & Lee 2004 · challenge point framework",
      href: "https://pubmed.ncbi.nlm.nih.gov/15130871/",
      supports: ["difficulty just past comfort aids learning", "task difficulty interacts with skill level"],
      boundary: "Supports the just-past-comfort principle behind the tempo ladder; it does not validate any specific BPM step size."
    },
    {
      id: "consolidation-rest", rank: 1, authority: "Peer-reviewed research",
      name: "Motor memory consolidation (Brashers-Krug/Shadmehr line)",
      href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC33809/",
      supports: ["skills consolidate between sessions", "gains appear after rest"],
      boundary: "Supports the retest-tomorrow message; it does not measure bouzouki tasks."
    },
    {
      id: "variable-tempo-blocks", rank: 1, authority: "Peer-reviewed research",
      name: "Slow-practice and variable-tempo practice studies",
      href: "https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00598/full",
      supports: ["slow practice transfers to speed", "variable-tempo pilot evidence"],
      boundary: "Pilot-scale and adjacent-instrument evidence; it does not prescribe a bouzouki protocol."
    },
    {
      id: "rembetiko-forum", rank: 3, authority: "Community signal",
      name: "rembetiko.gr · right-hand technique threads",
      href: "https://rembetiko.gr/t/%CE%B3%CE%B9%CE%B1-%CF%84%CE%BF-%CE%B4%CE%B5%CE%BE%CE%AF-%CF%87%CE%AD%CF%81%CE%B9-%CF%83%CF%84%CE%BF-%CE%BC%CF%80%CE%BF%CF%85%CE%B6%CE%BF%CF%8D%CE%BA%CE%B9/10103",
      supports: ["traversal drill corroboration", "learner right-hand questions"],
      boundary: "Community corroboration only; it never establishes a technique rule by itself."
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
      id: "attack", step: 1, label: "Ta–ka clock", short: "↓ ta · ↑ ka",
      answer: "Build an even down–up engine on open courses first, then carry it onto one-position dromos lines with beat-one weight as the first accent vocabulary.",
      gate: "Self-scored: upstrokes match downstrokes in time, volume, and clarity — confirm on a phone recording before tempo rises.",
      exerciseIds: ["open-course-penies", "down-up-clock", "through-stroke-landings", "monopenies-passes", "loose-hand-ladder", "picked-dromos-line", "grouped-accents"]
    },
    {
      id: "coordination", step: 2, label: "Courses & crossings", short: "clock survives the neck",
      answer: "Keep the ta–ka clock intact while courses, scale windows, and left-hand order change — every course of the instrument, both crossing directions.",
      gate: "Self-scored: a crossing drill started on either stroke shows no volume dip or hesitation at any course change on a recorded take.",
      exerciseIds: ["traversal-countdown", "course-target", "outside-pairs", "mixed-crossings", "crossing-flip-stops", "skip-thirds", "degree-window", "full-neck-ladder"]
    },
    {
      id: "drive", step: 3, label: "Accent & drive", short: "same notes, new excitement",
      answer: "Note excitement is a trainable layer: the same generated line cycles rhythm formations, pulse-mapped accents, glide triplet families, and skeleton-versus-fill density.",
      gate: "Self-scored: from a single repeated pitch, your recording makes the active grouping and the accent map identifiable without being told.",
      exerciseIds: ["rhythm-formation-ladder", "pulse-accent-map", "skeleton-then-fill", "triplet-drive", "triplet-grammar", "sextolet-glide", "tactile-ab", "timbre-echo"]
    },
    {
      id: "voice", step: 4, label: "Articulation voice", short: "tremolo is a choice",
      answer: "Tremolo, legato, ornament and register are deliberate expressive choices: counted tremolo graduates to free tremolo with clean mid-line entries and exits.",
      gate: "Self-scored: a recorded tremolo entry shows no hiccup, its exit lands with the click, and the sparse and dense registers are audibly different takes of the same phrase.",
      exerciseIds: ["mair-density-ladder", "tremolo-ladder", "counted-tremolo-groupings", "tremolo-entry-exit", "pick-legato", "mode-phrase-cell", "irish-treble", "era-register-contrast"]
    },
    {
      id: "harmony-keys", step: 5, label: "Harmony & key moves", short: "chunks travel",
      answer: "Triad arpeggios run through the active progression, and key change becomes physical: dromoi assembled from named tetrachord chunks, moved around the band cycle on pivot notes.",
      gate: "Self-scored: the arpeggio circuit completes the band key cycle at one steady tempo, and each key change lands on its pivot note without a stumble.",
      exerciseIds: ["arpeggio-arrival", "arp-chunks", "triad-ladder", "chunk-builder", "ghammaz-pivot", "band-key-arpeggio-circuit"]
    },
    {
      id: "lead", step: 6, label: "Lead & taximi", short: "vocabulary under pressure",
      answer: "The documented lead devices as generated families: imitation chains, descending minore skeletons, instant transposition on a cue chord, and time that survives a thinning click.",
      gate: "Self-scored exam in one sitting: a gap-click take with clean re-entry, a sequence ladder that keeps its rhythm through every restatement, and one instant transpose landed on the first attempt.",
      exerciseIds: ["sequence-ladder", "skeleton-descent", "instant-transpose", "gap-click-pulse"]
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
