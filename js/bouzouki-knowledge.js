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
      id: "mystakidis-laiki-kithara", rank: 1, authority: "Method book (forum-hosted copy)",
      name: "Mystakidis · Η Λαϊκή Κιθάρα (2010), pp. 18-20",
      href: "https://rembetiko.gr/uploads/default/original/2X/4/45a61d0b42b469532e2d02abbcf2b3bb29771838.pdf",
      supports: ["laiko guitar accompaniment grids per rhythm", "downstrokes generally preferred", "old and new zeibekiko, karsilamas, kalamatianos, syrtos, hasapiko, tsifteteli patterns"],
      boundary: "Read from a forum-hosted copy whose provenance is not confirmed; the grids are re-notated, not reproduced as pages."
    },
    {
      id: "krikonis-skarvelis", rank: 1, authority: "Academic thesis",
      name: "Krikonis 2009 (AUTh) · Skarvelis's rebetiko guitar, pp. 72, 147-154",
      href: "https://sophia.mus.auth.gr/xmlui/bitstream/handle/123456789/104/AEM_1188.pdf?sequence=3&isAllowed=n",
      supports: ["bass/chord onsets for hasapiko, karsilamas, zeibekiko, syrtos, kalamatianos", "accented bass against staccato chords", "harmonic rhythm and sparing use of the third"],
      boundary: "Documents one guitarist's practice; it does not make his grids the only correct accompaniment."
    },
    {
      id: "bolder-greek-drums", rank: 1, authority: "Method book (percussion)",
      name: "Fred Bolder · Greek Dance Rhythms for Drums (sample)",
      href: "https://www.dansblad.nl/grdrums/sample.pdf",
      supports: ["kick/snare onsets for zeibekiko and tsifteteli", "syrtos grouping 3-3-2"],
      boundary: "A drum method: its onsets corroborate the guitar grids but it does not prescribe guitar strokes."
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
      id: "tzinellis-metronome", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Thodoris Tzinellis · the most basic metronome exercise (mybouzouki.com)",
      href: "https://www.youtube.com/watch?v=x8gsNY0TEEo",
      supports: ["finger pairs on the click", "down on the click, up between", "slow tempo ladder"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "tzinellis-sync", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Thodoris Tzinellis · the secret to fast, clean playing (finger cells)",
      href: "https://www.youtube.com/watch?v=IaaR-V9yi9M",
      supports: ["finger cells 1-2-3-2, 1-2-4-2", "15 to 20 reps per position", "stop when notes start to smear"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "tzinellis-tenuto", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Thodoris Tzinellis · pick control exercise (tenuto)",
      href: "https://www.youtube.com/watch?v=0-jquOUj0yc",
      supports: ["pick control on held notes", "even strokes"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "krionas-speed", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Giorgos Krionas · bouzouki speed exercise (YouTube Short)",
      href: "https://www.youtube.com/shorts/F9UhvSRNRkE",
      supports: ["continuous finger cells", "speed with small pick motion"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "krionas-smart-pick", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Giorgos Krionas · a smart pick exercise for bouzouki",
      href: "https://www.youtube.com/watch?v=MYYd5-qPs4Q",
      supports: ["every group starts on a downstroke", "pick direction in odd meters"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "nistikakis-pick", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Mihail Nistikakis · exercises for a strong, flexible pick",
      href: "https://www.youtube.com/watch?v=PWPmCZ2wlQE",
      supports: ["double picking each note", "pick strength and agility"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "kosteli-spot", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Konstantina Kosteli · speed exercise: running on the spot",
      href: "https://www.youtube.com/watch?v=JJF6z27cjo0",
      supports: ["degree-to-5th cells", "scale sprint", "gradual daily tempo"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "kosteli-stefanakis", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Konstantina Kosteli · Andreas Stefanakis's speed exercise",
      href: "https://www.youtube.com/watch?v=zl9TCWhqFZE",
      supports: ["speed exercise over roumba at 100 BPM", "drop tempo when notes blur"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "bouzoukiland-tremolo2", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Nikos Filippatos (Bouzoukiland) · tremolo improvement exercise 2",
      href: "https://www.youtube.com/watch?v=HIKlFIjk6FU",
      supports: ["double-stop tremolo through the scale", "counted strokes per note"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "zerlentes-zeibekiko", rank: 2, authority: "YouTube lesson · professional teacher",
      name: "Thanasis Zerlentes · zeibekiko lesson on three-course bouzouki",
      href: "https://www.youtube.com/watch?v=Ruz30RY1QaA",
      supports: ["zeibekiko rhythmic part bar by bar (supporting only)"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "fujita-chromatic", rank: 2, authority: "YouTube lesson · professional (guitar import)",
      name: "Tomo Fujita · super simple exercise for clean technique",
      href: "https://www.youtube.com/watch?v=6RL629uHhmI",
      supports: ["slow chromatic finger walk", "clean, even notes"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "fujita-accent-muting", rank: 2, authority: "YouTube lesson · professional (guitar import)",
      name: "Tomo Fujita · accents with left-hand muting",
      href: "https://www.youtube.com/watch?v=aZUBZpzuCos",
      supports: ["right hand keeps moving through muted notes", "accent placement"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "fujita-mayer-teacher", rank: 2, authority: "YouTube interview · professional (guitar import)",
      name: "Andy Guitar channel · John Mayer's guitar teacher, Tomo Fujita",
      href: "https://www.youtube.com/watch?v=kbdO34LCJhI",
      supports: ["slow, perfect repetition", "fixing the weak spot"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "marcel-count", rank: 2, authority: "YouTube lesson · professional (guitar import)",
      name: "Lessons With Marcel · learn to count and fix your pick strokes",
      href: "https://www.youtube.com/watch?v=SxyYnoz9ayA",
      supports: ["numbers are downs, ands are ups", "air strokes on rests"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "banjo-ben-alternate", rank: 2, authority: "YouTube lesson · professional (bluegrass import)",
      name: "Banjo Ben Clark · intro to alternate picking for bluegrass guitar",
      href: "https://www.youtube.com/watch?v=c4nsSwYKaNY",
      supports: ["constant down-up arm motion", "missing the string on rests"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "mayer-ig-2018", rank: 2, authority: "YouTube · fan upload of a professional's Instagram lesson",
      name: "John Mayer · Instagram guitar lessons, January 2018 (John Mayer France channel)",
      href: "https://www.youtube.com/watch?v=0W135SJbP6M",
      supports: ["keep the right hand moving (about 18:15)", "go back and get the missed spot (about 22:16)"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "mayer-ig-2020", rank: 2, authority: "YouTube · fan upload of a professional's Instagram lesson",
      name: "John Mayer · Instagram Live guitar lesson, May 2020 (Guitar Music Pro channel)",
      href: "https://www.youtube.com/watch?v=MXxLR8s4xRQ",
      supports: ["playing below the root", "leaving the climb-up-from-the-root box"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "tuttle-crosspick-101", rank: 2, authority: "Magazine video lesson · professional (bluegrass import)",
      name: "Molly Tuttle · Crosspicking 101 (Acoustic Guitar)",
      href: "https://acousticguitar.com/crosspicking-101-a-private-bluegrass-lesson-with-molly-tuttle-video",
      supports: ["4-3-2, 4-3-2, 4-2 roll (3 + 3 + 2)", "alternate then down-down-up", "reverse roll", "gradually increase tempo"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "tuttle-crosspick-gg", rank: 2, authority: "YouTube lesson · professional (bluegrass import)",
      name: "Molly Tuttle · how to crosspick (Guitar Gathering)",
      href: "https://www.youtube.com/watch?v=6S66aINeabs",
      supports: ["crosspicking rolls"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "tuttle-right-hand", rank: 2, authority: "Magazine video lesson · professional (bluegrass import)",
      name: "Molly Tuttle · right-hand techniques (Acoustic Guitar)",
      href: "https://acousticguitar.com/video-lesson-molly-tuttle-breaks-down-her-deft-right-hand-techniques",
      supports: ["choose the picking you can play faster and more accurately"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "tuttle-guitarcom", rank: 2, authority: "Magazine interview · professional (bluegrass import)",
      name: "Molly Tuttle · the secret to playing fast (Guitar.com)",
      href: "https://guitar.com/news/music-news/molly-tuttle-secret-playing-fast-guitar",
      supports: ["play a little faster than you can", "slow down the 3 or 4 notes that fail"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "grier-gg", rank: 2, authority: "YouTube interview · professional (bluegrass import)",
      name: "David Grier · flatpicking guitar mastery (Guitar Gathering)",
      href: "https://www.youtube.com/watch?v=mXyPPL-Gmvo",
      supports: ["play lighter when playing fast", "every string the same volume"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "sutton-artistworks", rank: 2, authority: "YouTube lesson · professional (bluegrass import)",
      name: "Bryan Sutton · rhythm with crosspicking (ArtistWorks)",
      href: "https://www.youtube.com/watch?v=gaWEjUtloqw",
      supports: ["crosspicking inside rhythm playing", "long, resonant notes"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "nygaard-rice", rank: 2, authority: "Lesson article · professional (bluegrass import)",
      name: "Tony Rice lessons (Peghead Nation)",
      href: "https://www.pegheadnation.com/news-reviews/breaking-news/tony-rice-lessons",
      supports: ["after a downstroke, move toward the higher string"],
      boundary: "Linked lesson only: Dromos does not download, transcribe, restream or imply endorsement, and the generated drill is not a copy of the video."
    },
    {
      id: "reddit-bouzouki", rank: 3, authority: "Community signal",
      name: "r/bouzouki · recurring learner questions",
      href: "https://www.reddit.com/r/bouzouki/",
      supports: ["learner vocabulary", "recurring right-hand problems", "resource discovery", "instrument-confusion warnings"],
      boundary: "Community posts may reveal what learners struggle to understand. They never establish theory, historical fact, or a mandatory technique rule by themselves."
    }
  ];

  // Nine categories in practical order (FR-78): stroke, pulse, sync,
  // crossing, speed, tremolo, chords, fretboard, phrasing. Each drill sits
  // in exactly one; the Guided plan walks them top to bottom.
  const MASTERY_PHASES = [
    {
      id: "setup", step: 1, label: "Setup and stroke", short: "loose grip, even down-up",
      answer: "Every later drill depends on a loose grip and an even down-up from the wrist, with the fretting hand still. Open courses first, then lighter strokes as the tempo rises.",
      gate: "Self-scored: on a phone recording, upstrokes match downstrokes in time, volume and clarity before the tempo rises.",
      exerciseIds: ["open-course-penies", "down-up-clock", "through-stroke-landings", "monopenies-passes", "loose-hand-ladder", "shallow-pick-ladder"]
    },
    {
      id: "pulse", step: 2, label: "Time and Greek pulse", short: "the rhythm decides the stroke",
      answer: "Pulse and stroke direction on the click come before notes: one pitch, then the group rules, then air strokes through rests, then subdivision, then a click that thins out until your hand keeps the dance alone.",
      gate: "Self-scored: from one repeated pitch a listener can name the rhythm, and the first note after every rest has the right stroke direction.",
      exerciseIds: ["grouped-accents", "group-reset-downstroke", "ghost-stroke-rests", "pulse-accent-map", "rhythm-formation-ladder", "gap-click-pulse"]
    },
    {
      id: "sync", step: 3, label: "Hand sync and accuracy", short: "both hands land together",
      answer: "The fretting finger lands exactly when the pick strikes: finger pairs, then the dromos line, then finger cells. Go back and get it is the repair method for every later category.",
      gate: "Self-scored: finger cells clean at the same tempo as the open-course clock, and every flubbed spot looped clean before the tempo rises.",
      exerciseIds: ["finger-pair-chromatic", "picked-dromos-line", "sync-cells", "seam-loop"]
    },
    {
      id: "crossing", step: 4, label: "String crossing", short: "the clock survives the course change",
      answer: "Course changes are the hardest part of alternate picking. Keep the clock through inside, outside and mixed crossings in both directions, and choose each phrase's crossing solution by its clean tempo.",
      gate: "Self-scored: a crossing drill started on either stroke shows no volume dip or hesitation at any course change on a recording.",
      exerciseIds: ["course-target", "traversal-countdown", "outside-pairs", "crossing-flip-stops", "mixed-crossings", "crossing-bakeoff", "degree-window", "skip-thirds"]
    },
    {
      id: "speed", step: 5, label: "Speed and glide", short: "speed under the blur rule",
      answer: "Speed comes only after time, sync and crossing: a fixed-click density ladder, glide economy, bursts on known ground, then work at the edge, always stopping when notes start to smear.",
      gate: "Self-scored: a banked ceiling that holds three clean passes, and no tempo raised on a day the notes blur.",
      exerciseIds: ["mair-density-ladder", "triplet-drive", "triplet-grammar", "sextolet-glide", "spot-run-sprint", "double-pick-edge"]
    },
    {
      id: "tremolo", step: 6, label: "Tremolo and dynamics", short: "tremolo is a choice",
      answer: "Even, counted alternate strokes first; then tremolo bursts, counted groupings, clean entries and exits, and tremolo on two courses with volume control.",
      gate: "Self-scored: a recorded tremolo entry shows no hiccup, its exit lands with the click, and the 3rds tremolo stays even on both courses.",
      exerciseIds: ["tremolo-ladder", "counted-tremolo-groupings", "tremolo-entry-exit", "double-stop-tremolo-thirds"]
    },
    {
      id: "chords", step: 7, label: "Chords, comp and arpeggios", short: "the right hand keeps the dance",
      answer: "Rhythm comp can start in week 2; the rest needs secure crossing. Bass, strum and chop patterns, rolls on the meter, triad arpeggios through the progression, then the band key cycle.",
      gate: "Self-scored: three loops of the progression with every chord change on the downbeat, and the arpeggio circuit through the band key cycle at one steady tempo.",
      exerciseIds: ["rhythm-comp", "meter-roll", "arpeggio-arrival", "arp-chunks", "triad-ladder", "band-key-arpeggio-circuit"]
    },
    {
      id: "fretboard", step: 8, label: "Fretboard and register", short: "the same phrase, more places",
      answer: "Once the hands are reliable, put the same phrase in more places and more sounds: the whole neck, along versus across the strings, timbre echoes, below the tonic, and era register.",
      gate: "Self-scored: one phrase played in three places on the neck, and 8 bars in each zone around the tonic without a forbidden note.",
      exerciseIds: ["full-neck-ladder", "tactile-ab", "timbre-echo", "below-the-tonic", "era-register-contrast"]
    },
    {
      id: "phrasing", step: 9, label: "Phrasing, ornaments and key moves", short: "vocabulary under pressure",
      answer: "The payoff layer: left-hand legato, ornaments, phrase cells, skeleton and fill, the Hiotis close, sequences, chunks and pivots through the band keys, instant transposition, and the open workbench.",
      gate: "Self-scored exam in one sitting: a sequence ladder that keeps its rhythm, one instant transpose landed first time, and three clean pickup closes.",
      exerciseIds: ["pick-legato", "irish-treble", "mode-phrase-cell", "skeleton-then-fill", "pickup-close", "skeleton-descent", "sequence-ladder", "chunk-builder", "ghammaz-pivot", "instant-transpose", "phrase-workbench"]
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
