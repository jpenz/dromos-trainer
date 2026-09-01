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
    { id: "phrase", label: "Phrase mechanics", detail: "ornaments and chord targets" },
    { id: "arpeggio", label: "Arpeggio circuits", detail: "triads through the progression" },
    { id: "keychange", label: "Key moves", detail: "chunks and pivots through the band keys" }
  ];

  // The band key cycle, ordered so that EVERY hop's pivot note IS the
  // destination tonic reachable inside the home key: G→D (its 5th), D→Dm
  // (parallel, shared tonic), Dm→Am (its 5th), Am→E (its 5th), E→Em
  // (parallel), Em→G (its ♭3). G as home is the band's singing preference,
  // labelled exactly that in the UI; D as the reference tonic and instant
  // key-changing are the documented parts (Pagiatis dromoi tables from D;
  // Chiotis-circle testimony of instant transposition, Papasolomontos 2017).
  const BAND_KEY_CYCLE = [
    { tonic: "G", quality: "major" },
    { tonic: "D", quality: "major" },
    { tonic: "D", quality: "minor" },
    { tonic: "A", quality: "minor" },
    { tonic: "E", quality: "major" },
    { tonic: "E", quality: "minor" }
  ];
  const NOTE_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function bandPivotPc(fromIndex) {
    // the pivot for hop i -> i+1 is by construction the destination tonic
    const to = BAND_KEY_CYCLE[(fromIndex + 1) % BAND_KEY_CYCLE.length];
    return NOTE_PC[to.tonic.charAt(0)];
  }

  const TRIGAS = "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-three-string-bouzouki/";
  const PENNANEN = "https://taju.uniarts.fi/bitstreams/782c4f90-3fb7-4058-bf6b-9631b2c55bb7/download";
  const PAFRANIDIS = "https://fagottobooks.gr/blog/wp-content/uploads/2020/04/trixordo-sample.pdf";
  const AVLONITIS = "https://fagottobooks.gr/en/1037-4_979-0-801151-59-9.html";
  const KARANTINIS = "https://karantinis.com/video-lessons/";

  const ARTICULATIONS = {
    "picked-line": {
      label: "Every note picked", mnemonic: "TA · KA",
      detail: "One clear pick attack per displayed note: down is ta, up is ka. Do not blur the line into tremolo."
    },
    "tremolo-sustain": {
      label: "Tremolo sustain", mnemonic: "TA-KA repeated",
      detail: "Many even alternate attacks sustain one selected pitch. This is a separate expressive choice, not the default line articulation."
    },
    "picked-legato": {
      label: "Picked + left hand", mnemonic: "attack · connect",
      detail: "Pick only the marked D/U events; hammer, pull, and slide events keep their own measured placement without another pick."
    },
    "picked-or-glide": {
      label: "Compare stroke grammar", mnemonic: "TA-KA ↔ glide",
      detail: "Keep the pitches fixed while comparing strict one-note attacks with a deliberate same-direction course glide."
    }
  };

  const EXERCISES = [
    {
      id: "down-up-clock", category: "time", order: 1, title: "Ta–ka one-note clock",
      short: "Make ↓ ta and ↑ ka feel and sound equal before the left hand moves.", layout: "horizontal", sequence: "single", count: 8,
      articulation: "picked-line", sourceIds: ["trigas-method", "pafranidis-sample"],
      theory: "Down and up are rhythmic locations as well as hand directions. Say ta on every downstroke and ka on every upstroke while one pitch stays fixed.",
      evidence: "Trigas places picking and right-hand handling inside a progressive bouzouki curriculum; Pafranidis explicitly joins plectrum down/up direction to counted downbeat/upbeat work.",
      sourceLabel: "Trigas method overview + Pafranidis sample contents", sourceHref: TRIGAS,
      steps: ["Mute one course and say ta–ka while following every displayed ↓/↑ with the smallest comfortable motion.", "Unmute one shown note and keep all eight attacks the same length, depth, and volume.", "Accent only note 1; the other seven attacks stay even and the wrist stays loose."],
      listen: "One continuous pulse: upstrokes should not sound thinner, later, or louder than downstrokes.",
      pass: "Three passes stay even and relaxed, with no scrape or extra wrist or forearm motion.",
      boundary: "The source supports the plectrum/down-up foundation; ta–ka wording and this eight-attack clock are an original Dromos mnemonic and drill, not a Trigas or Pafranidis transcription."
    },
    {
      id: "picked-dromos-line", category: "time", order: 2, title: "Picked dromos line",
      short: "Carry ta–ka through the scale: one separate attack for every note.", layout: "horizontal", sequence: "alternate", count: 8,
      articulation: "picked-line", sourceIds: ["trigas-method", "pafranidis-sample", "pagiatis-dromoi"],
      theory: "The right hand keeps one D–U clock while the ear follows degrees 1 through the selected dromos. Articulation and pitch map are separate layers that must stay synchronized.",
      evidence: "Trigas and Pafranidis integrate picking with scales and fretboard knowledge; Pagiatis connects dromos fingerings with their musical use.",
      sourceLabel: "Trigas + Pafranidis + Pagiatis public material", sourceHref: PAFRANIDIS,
      steps: ["Pre-sing the displayed degrees, then play each note once with its own ↓ or ↑ attack.", "Loop only the first four notes until ta–ka stays even as the fretting hand changes.", "Play the full line and finish cleanly; do not turn a longer note into unmarked tremolo."],
      listen: "Eight distinct syllables inside one phrase: pitch changes without the pick pulse becoming uneven.",
      pass: "Every displayed note has one audible attack, the degree order is clear, and no note is accidentally repeated or smeared.",
      boundary: "The methods support integrating plectrum and scale study. The displayed degree line is generated from the selected Dromos map and is not copied notation or repertoire."
    },
    {
      id: "grouped-accents", category: "time", order: 3, title: "Greek grouped accents",
      short: "Keep alternate strokes while the selected Greek pulse changes the accents.", layout: "horizontal", sequence: "pulse", count: 9,
      articulation: "picked-line", sourceIds: ["trigas-method", "pafranidis-sample"],
      theory: "Meter and dromos are different layers: the Greek pulse decides where weight falls; the selected dromos decides which pitches are available.",
      evidence: "Bouzouki methods join picking work to rhythm study. Dromos uses the app's separately documented Greek pulse maps so meter and dromos remain independent choices.",
      sourceLabel: "Trigas method overview", sourceHref: TRIGAS,
      steps: ["Clap the selected grouping and say the group starts aloud.", "Play one note per pulse unit; keep strict down/up motion through every group boundary.", "Move the same accent map onto the displayed scale path without adding fills."],
      listen: "The first note of each group is clear, but the unaccented notes do not rush toward it.",
      pass: "A listener can identify the grouping from one repeated note before you use the scale path.",
      boundary: "The meter grouping comes from Dromos's documented pulse map; the exact pick-accent drill is an original trainer exercise, not a style transcription."
    },
    {
      id: "tremolo-ladder", category: "time", order: 10, title: "Tremolo burst ladder",
      short: "Join short, countable bursts into a sustained bouzouki tone.", layout: "horizontal", sequence: "tremolo", count: 20,
      articulation: "tremolo-sustain", sourceIds: ["trigas-method", "pafranidis-sample"],
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
      articulation: "picked-line", sourceIds: ["pennanen"],
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
      articulation: "picked-line", sourceIds: ["pennanen"],
      theory: "Hear one octave as connected scale degrees, then notice where the physical three-per-course pattern cuts across the musical phrase.",
      evidence: "Pennanen documents the practical difference between linear and tiered motor structures. This exercise makes the changing pick geometry visible on a tiered route.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Start with the displayed stroke and say inside or outside at every course change.", "Loop one difficult boundary twice before playing the full path.", "Reverse the route without resetting the pick direction at the top."],
      listen: "Inside and outside crossings should be rhythmically indistinguishable even if one initially feels less comfortable.",
      pass: "You can begin on either stroke and keep every displayed crossing clean at the same tempo.",
      boundary: "The motor-structure comparison is source-supported. The three-per-course path and crossing labels are original Dromos practice logic."
    },
    {
      id: "degree-window", category: "cross", order: 6, title: "Four-note degree windows",
      short: "Sequence the dromos in overlapping groups without dropping the ta–ka clock.", layout: "horizontal", sequence: "degreeWindow", count: 16,
      articulation: "picked-line", sourceIds: ["avlonitis-101", "trigas-method"],
      theory: "Hear four-note windows as 1–2–3–4, 2–3–4–5, 3–4–5–6, and 4–5–6–7. The left hand and key change; the alternating right-hand engine does not.",
      evidence: "Avlonitis describes graded plectrum and finger-strength work; Trigas includes progressive fingering, independence, and scale study. Neither source makes this exact degree sequence available as Dromos content.",
      sourceLabel: "Avlonitis 101 catalogue + Trigas method scope", sourceHref: AVLONITIS,
      steps: ["Say each four-degree window before playing it and accent only the first note of the window.", "Keep strict ta–ka through the boundary between windows; do not reset to a downstroke.", "Use Evolve only after one position is clean, then move the same degree logic through keys or practical positions."],
      listen: "Four connected musical cells, not a sixteen-note blur; every new window has a clear first degree without a timing bump.",
      pass: "All four windows stay even, the window starts are audible, and the picking direction continues correctly across every boundary.",
      boundary: "The sources support graded dexterity domains. This 1–2–3–4 sliding-window exercise is original, generated by Dromos, and does not copy any Avlonitis or Trigas exercise."
    },
    {
      id: "tactile-ab", category: "route", order: 7, title: "Horizontal ↔ tiered A/B",
      short: "Play the same dromos two ways and choose the route for sound, not convenience alone.", layout: "horizontal", sequence: "alternate", count: 8, compare: true,
      articulation: "picked-line", sourceIds: ["pennanen"],
      theory: "A dromos is a melodic organization, not one fingering. Preserve the same degree contour while comparing continuous one-course colour with a compact tiered route.",
      evidence: "Pennanen defines horizontal playing as a linear array with position shifts and tiered playing as an across-course array with fewer shifts; he also warns that course changes can alter bouzouki timbre.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Choose Horizontal and play the one-course line while listening to its consistent timbre.", "Choose Tiered and play the same dromos degrees with fewer hand shifts.", "Use Horizontal for a sung continuous color; use Tiered when the phrase needs compact speed and the course timbres support it."],
      listen: "Hear both the physical difference and the tonal change. The easiest fingering is not automatically the best-sounding phrase.",
      pass: "You can play both routes and state one musical reason—not only speed—for choosing either one.",
      boundary: "Pennanen documents the two tactile organizations and their timbral tradeoff. The displayed A/B route is generated for the selected instrument and is not a recorded-player transcription."
    },
    {
      id: "timbre-echo", category: "route", order: 8, title: "Course-timbre echo",
      short: "Repeat one small cell in a new course/register as an intentional answer.", layout: "horizontal", sequence: "echo", count: 8, compare: true,
      articulation: "picked-line", sourceIds: ["pennanen"],
      theory: "Repetition makes the degree contour recognizable; a register or course change supplies the contrast. This is call-and-answer by timbre, not a new scale.",
      evidence: "Pennanen describes the appealing contrast created when a phrase moves between unison and octave-course regions on four-course bouzouki, including echo-like use in instrumental and taximi contexts.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Play the four-note cell on the Horizontal route and leave one pulse of space.", "Switch to Tiered and answer with the same degree contour in a different course/register.", "Keep the rhythm identical so the listener hears the timbre/register change as the variation."],
      listen: "The second cell should sound like the same thought in a different voice, not a new unrelated lick.",
      pass: "The repeated contour is recognizable and the course/register contrast sounds deliberate on your instrument.",
      boundary: "Pennanen supports the echo-timbre observation. Dromos generates the four-note cell; guitar uses a register/string-set comparison rather than claiming paired-course bouzouki acoustics."
    },
    {
      id: "triplet-grammar", category: "route", order: 9, title: "Alternate ↔ glide triplets",
      short: "Compare a strict down/up grid with a deliberate same-direction glide.", layout: "2nps", sequence: "tripletGrammar", count: 12,
      variants: [{ id: "alternate", label: "Strict alternate" }, { id: "glide", label: "Glide / sweep" }],
      articulation: "picked-or-glide", sourceIds: ["pennanen"],
      theory: "A three-note group can cross the strings without changing its pitches. Compare how the stroke grammar changes the accent: D–U–D / U–D–U versus Pennanen's documented D–D–U / U–D–D glide families.",
      evidence: "Pennanen reports that strict alternate picking is not axiomatic in bouzouki practice. He documents traditional-player deviations, including glide or sweep patterns such as D–D–U and U–D–D in triplet or sextuplet motion.",
      sourceLabel: "Pennanen, The Poetics of the Little Finger", sourceHref: PENNANEN,
      steps: ["Choose Strict alternate and keep one pick attack for every arrow.", "Choose Glide / sweep: DG means the second downstroke continues through the adjacent course as one directed gesture.", "Keep the same notes and tempo; choose the version whose accent serves the phrase rather than treating either grammar as universal."],
      listen: "The pitch order must remain identical. Hear whether the glide binds the triplet and moves its weight without producing an accidental extra accent.",
      pass: "You can perform both grammars slowly, describe the accent difference, and choose one for a musical reason.",
      boundary: "The observed stroke families and warning against one universal rule are source-supported. This exact A/B note route is an original Dromos comparison, not a Pennanen or Hiotis transcription."
    },
    {
      id: "pick-legato", category: "phrase", order: 11, title: "Pick–hammer–pull–slide chain",
      short: "Make the pick start the syllable and let the left hand shape it.", layout: "horizontal", sequence: "ornament", count: 6,
      articulation: "picked-legato", sourceIds: ["pennanen", "trigas-method"],
      theory: "Decoration has a harmonic destination. Name the final note's scale degree and land it as a chord tone; the ornament connects to that target rather than replacing it.",
      evidence: "Pennanen identifies hammer, pull, trill, and glissando/portamento among common bouzouki ornament families; Trigas includes glissando and ornament studies.",
      sourceLabel: "Pennanen + Trigas method overview", sourceHref: PENNANEN,
      steps: ["Play the first note once, then follow the H, P, and SL symbols without re-picking hidden attacks.", "Keep every unpicked note rhythmically placed; legato does not mean unmeasured.", "Repeat the cell and land its final picked note on a chord tone."],
      listen: "The ornament should connect the phrase while the destination remains clearer than the decoration.",
      pass: "The unpicked notes speak clearly at the same pulse, and removing the ornament leaves the phrase's target intact.",
      boundary: "The ornament families are source-supported. This exact six-event chain is an original fixed-fret Dromos drill, not a claim about universal Greek execution."
    },
    {
      id: "mode-phrase-cell", category: "phrase", order: 12, title: "Dromos contour → home",
      short: "Turn scale knowledge into a short picked sentence with a named destination.", layout: "horizontal", sequence: "phraseCell", count: 7,
      articulation: "picked-line", sourceIds: ["karantinis-lessons", "pagiatis-dromoi"],
      theory: "Knowing a collection is not the same as speaking with it. Hear the app-authored rise–turn–return contour, then identify the selected dromos degrees and final home.",
      evidence: "Karantinis's official course separates mode positions from mode-specific phraseology and says phrases are central to using modes; Pagiatis joins dromos maps with characteristic musical material.",
      sourceLabel: "Karantinis official lessons + Pagiatis public foreword", sourceHref: KARANTINIS,
      steps: ["Sing the seven-degree contour before touching the instrument, then pick every displayed note ta–ka.", "Make the turning note audible with timing and touch, not an extra unscripted note.", "Transpose the same contour with Evolve, then compare it with an owned recording or lesson for truly idiomatic phrase behavior."],
      listen: "A rise, a turn, and a return to home. The final tonic should answer the phrase instead of sounding like the end of a scale test.",
      pass: "You can sing the contour, name its degrees, play every attack evenly, and state that the generic cell is not itself an artist or historic phrase.",
      boundary: "The sources support teaching phraseology beyond scale positions. This generic seven-note contour is an original Dromos scaffold, not a Karantinis phrase, Pagiatis melody, or repertoire transcription."
    },
    {
      id: "arpeggio-arrival", category: "phrase", order: 13, title: "Triad arpeggio → next 3rd",
      short: "Turn picking control into audible harmony.", layout: "arpeggio", sequence: "arpeggio", count: 5,
      articulation: "picked-line", sourceIds: ["trigas-method", "pafranidis-sample"],
      theory: "Root, 3rd, and 5th state the current chord. The next chord's 3rd is the high-information arrival because it reveals that chord's major or minor quality.",
      evidence: "Trigas combines picking, arpeggios, modes, rhythm, and improvisation in one bouzouki study sequence; Pafranidis likewise places chord arpeggios and tremolo after scale foundations.",
      sourceLabel: "Trigas method overview", sourceHref: TRIGAS,
      steps: ["Play root–3rd–5th–3rd of the sounding chord with strict alternate strokes.", "Pause long enough to hear the coming chord, then pick its 3rd on the arrival.", "Move through the selected progression without changing the rhythmic shape."],
      listen: "The final note should make the chord change audible even if the backing chord is removed.",
      pass: "You can name and pre-sing both 3rds, then land the next one in time for every chord in the map.",
      boundary: "The integrated study categories are source-supported. Dromos derives these notes from the selected chord map; it is not a published Trigas exercise or artist lick."
    },
    {
      id: "open-course-penies", category: "time", order: 14, title: "Open-course penies primer",
      short: "The ta-ka clock on every open course before any left hand exists.", layout: "horizontal", sequence: "openCourses", count: 8,
      articulation: "picked-line", sourceIds: ["trigas-method", "pafranidis-sample"],
      theory: "Every course of the instrument gets the same eight-stroke clock at the same volume: unequal course gauges are the first place evenness dies, so meet them with no left hand in the way.",
      evidence: "Trigas opens the curriculum with pick exercises before repertoire; Pafranidis's public sample starts plectrum direction work on open courses.",
      sourceLabel: "Trigas method overview + Pafranidis sample", sourceHref: "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-three-string-bouzouki/",
      steps: ["Eight alternate strokes on the lowest course; say ta-ka and keep both directions equal.", "Move up one course and repeat; listen for the thicker course pulling louder.", "Cycle all courses twice; with eyes closed the courses should be indistinguishable in evenness."],
      listen: "One clock, several timbres: the pulse never changes as the course does.",
      pass: "Self-scored on a recording: no course is audibly louder or less even than its neighbours.",
      boundary: "Course-by-course priming follows the methods' teaching order; the drill itself is a Dromos generation, not a copied exercise.",
      allStrings: true
    },
    {
      id: "rhythm-formation-ladder", category: "time", order: 15, title: "Rhythm-formation ladder",
      short: "Same twelve notes: straight, dotted, triplet, then 3+3+2 - only the accent map changes.", layout: "horizontal", sequence: "formationLadder", count: 12,
      articulation: "picked-line", sourceIds: ["trigas-method", "allingham-tempo", "pagiatis-dromoi"],
      theory: "Rhythm formations are Trigas's own exercise category: metric flexibility lives in the right hand. The click stays fixed; the grouping of the same notes is the entire variable.",
      evidence: "Trigas Vol. 2 names rhythm formations and irregular subdivisions among its 207 exercises; Pagiatis grades rests, 8ths, 16ths, dotted, triplets, syncopation as discrete lessons; peer-reviewed practice research recognises subdivision strategies at fixed tempo.",
      sourceLabel: "Trigas Vol. 2 contents + Pagiatis lesson order", sourceHref: "https://www.trigas.gr/en/book/methodos-gia-trichordo-bouzouki-no-2/",
      steps: ["Play the twelve-note line straight with beat accents until it is boring.", "Re-group the SAME notes as dotted pairs, then as triplets - the click must not move.", "Finish with two passes of 3+3+2 drive; accents at 1, 4, 7 should feel like doorways, not stumbles."],
      listen: "The click is the referee: four different musics from one set of notes.",
      pass: "Self-scored: a listener or your recording can name each formation from the accents alone, and no pass drifts against the click.",
      boundary: "Formation cycling is method-supported; this generated ladder is not a printed Trigas exercise."
    },
    {
      id: "pulse-accent-map", category: "time", order: 16, title: "16ths on the Greek pulse",
      short: "Continuous 16ths on one pitch; the accents are the dance's own group map.", layout: "horizontal", sequence: "pulseAccentMap", count: 16,
      articulation: "picked-line", sourceIds: ["measured-tempi", "trigas-method", "pagiatis-dromoi"],
      theory: "Rhythm practice with the metronome against the pulse you actually play: the accent map comes from the active Greek pulse's own groups (tsifteteli, zeibekiko, hasapiko - whatever is selected), so the right hand learns the dance, not an abstract grid.",
      evidence: "Tsifteteli tempo is documented at 50-75 BPM in 4/4 counting (measured per-recording, TEI thesis) - the honest staging band for this drill; Pagiatis grades 16th-note work as its own lesson; the pulse group data is the app's sourced rhythm model.",
      sourceLabel: "Measured tempi thesis + Pagiatis lesson order", sourceHref: "https://olympias.lib.uoi.gr/jspui/bitstream/teiep/5871/1/369",
      steps: ["Select the pulse you are training (tsifteteli for the classic 16ths feel) and start at the LOW end of its shown tempo band.", "Play continuous 16ths on the tonic: strong accent on each group start, light accent on other beat starts, nothing inside.", "When three passes are clean, climb the ladder; when the accents smear, drop back - the map must stay audible."],
      listen: "A dancer could find the groups from your right hand alone.",
      pass: "Self-scored: nine of ten group starts carry the accent, and the inside 16ths stay even and unaccented at the chosen tempo.",
      boundary: "Accents derive from the app's sourced pulse definitions; this is a Dromos generation, not a transcribed rhythm part."
    },
    {
      id: "skeleton-then-fill", category: "route", order: 17, title: "Skeleton, then fill",
      short: "Tonic, chunk joint, 3rd, octave - held; then the full line with those notes still weighted.", layout: "horizontal", sequence: "skeletonFill", count: 12,
      articulation: "picked-line", sourceIds: ["pagiatis-dromoi", "ordoulidis-modes"],
      theory: "Strong degrees first: the tonic, the tetrachord joint (4 or 5), the 3rd, and the octave are the load-bearing notes of the dromos. Hold them alone, then let the rest of the scale hang off them.",
      evidence: "Pagiatis pairs each dromos with its structural chord degrees; Ordoulidis documents dromoi as interval structures whose identity lives in characteristic degrees, not every passing tone.",
      sourceLabel: "Pagiatis dromoi treatise + Ordoulidis", sourceHref: "https://fagottobooks.gr/blog/wp-content/uploads/2024/02/%CE%BB%CE%B1%CE%B9%CE%BA%CE%BF%CE%B9%CE%B4%CF%81%CE%BF%CE%BC%CE%BF%CE%B9%CE%BA%CE%B1%CE%B9%CF%80%CF%81%CE%B1%CE%BA%CE%B1%CF%80%CE%BF%CF%83%CF%80.pdf",
      steps: ["Play only the four skeleton notes, each held two counts, singing the degree numbers.", "Play the filled line once; give the skeleton notes their accent and let the others be connective.", "Alternate skeleton-only and filled passes until the filled line still SHOWS its skeleton."],
      listen: "The filled pass should sound like the skeleton pass wearing clothes.",
      pass: "Self-scored: in the filled pass a listener can still hear which four notes are structural.",
      boundary: "Skeleton degrees are fixed by the app's own tetrachord model; the line is a Dromos generation, not a published etude."
    },
    {
      id: "triplet-drive", category: "time", order: 18, title: "Triplet drive: glide families",
      short: "One pitch, continuous triplets, the two documented glide grammars.", layout: "horizontal", sequence: "tripletDrive", count: 12,
      articulation: "picked-line", sourceIds: ["pennanen", "papasolomontos-2017"],
      variants: [{ id: "ddu", label: "D-D-U" }, { id: "udd", label: "U-D-D" }],
      theory: "Hiotis, like other traditional players, executed triplets with glide strokes - down-down-up or up-down-down - not strict alternation. One repeated pitch exposes the grammar: the second same-direction stroke is a relaxed continuation, not a new arm impulse.",
      evidence: "Pennanen 2024 (pp. 186-187, citing Papasolomontos 2017): glide/sweep execution of triplets and sextolets is the documented traditional grammar, and no method book teaches it - it lived in recordings and apprenticeship.",
      sourceLabel: "Pennanen 2024, Poetics of the Little Finger", sourceHref: "https://taju.uniarts.fi/items/5897add1-8de2-482f-be1d-6bfe70ca6831",
      steps: ["Cycle D-D-U on one pitch: the second down rides the follow-through of the first.", "Switch the variant to U-D-D and repeat; neither family should sound lumpier than the other.", "Alternate one bar of each family; the triplet stays even while the grammar changes."],
      listen: "Even triplets whose only accent is the group start - the glide must not bulge.",
      pass: "Self-scored: three passes per family with even triplets and the accent only on beat one of each group.",
      boundary: "The stroke families are documented; the repeated-note drive built on them is a Dromos extrapolation and says so - no surveyed Greek method prescribes a repeated-note triplet exercise."
    },
    {
      id: "sextolet-glide", category: "cross", order: 19, title: "Sextolet glide over the crossing",
      short: "Six-note groups where the glide binds the course change.", layout: "2nps", sequence: "sextoletGlide", count: 12,
      articulation: "picked-line", sourceIds: ["pennanen", "papasolomontos-2017", "pennanen-1999"],
      theory: "Pennanen names sextolets alongside triplets in the documented glide grammar. Two notes per course puts one crossing inside each group: the same-direction glide carries the pick to the new course so the crossing costs nothing.",
      evidence: "Pennanen 2024 documents glide execution especially in triplets and sextolets; Pennanen 1999 documents that bouzouki aesthetics favour lines along the course - so this drill uses ONE adjacent crossing per group, never a sweep across the neck.",
      sourceLabel: "Pennanen 2024 + Pennanen 1999", sourceHref: "https://taju.uniarts.fi/items/5897add1-8de2-482f-be1d-6bfe70ca6831",
      steps: ["Walk the six notes slowly, placing the glide exactly on the course change.", "Play two full sextolets; the crossing should be inaudible as an event.", "Move the pattern up one position and repeat - same grammar, new frets."],
      listen: "Six even notes twice; if you can hear where the course changed, the glide is not yet doing its job.",
      pass: "Self-scored: both sextolets even, no double attack and no volume dip at the crossing, in three consecutive passes.",
      boundary: "The grammar is documented; the six-note route is a Dromos generation from the selected dromos, not a transcription."
    },
    {
      id: "counted-tremolo-groupings", category: "phrase", order: 20, title: "Counted tremolo groupings",
      short: "4+1, 6+1, 8+1 - then 4+2 and 6+4: bursts with a controlled landing stroke.", layout: "horizontal", sequence: "countedTremolo", count: 30,
      articulation: "tremolo-sustain", sourceIds: ["mandoisland-counted", "bickford-mandolin", "trigas-method"],
      theory: "IMPORT (mandolin pedagogy): counted bursts are the measured bridge toward free tremolo - and they train WHICH stroke you land on, so a tremolo can exit onto a downbeat by design rather than luck.",
      evidence: "MandoIsland documents the counted groupings with finishing down- and up-strokes; Bickford supplies the destination rule that real tremolo is unmeasured; Trigas's curriculum contains graded tremolo study.",
      sourceLabel: "MandoIsland groupings + Bickford doctrine", sourceHref: "https://www.mandoisland.de/eng_tipps_und_tricks.html",
      steps: ["Play 4+1, 6+1, 8+1 on one pitch: burst, then land the single stroke as a real note.", "Play 4+2 and 6+4: the landing is now more than one stroke - feel which direction you arrive on.", "Repeat the whole set on the next course; every course gets the same landings."],
      listen: "Bursts that end on purpose: the landing note belongs to the music, not to the tremolo.",
      pass: "Self-scored: each grouping lands its final stroke cleanly with the click, on every course, in one sitting.",
      boundary: "A labelled mandolin import used as scaffolding; Dromos does not present counted tremolo as Greek practice.",
      allStrings: true
    },
    {
      id: "tremolo-entry-exit", category: "phrase", order: 21, title: "Tremolo entry & exit",
      short: "A picked line opens into free tremolo mid-phrase, then lands back on the click.", layout: "horizontal", sequence: "entryExit", count: 8,
      articulation: "tremolo-sustain", sourceIds: ["bickford-mandolin", "pennanen", "karantinis-lessons"],
      theory: "The tremolo itself is unmeasured - Bickford's doctrine, a labelled import - but its edges are timed. Entering without a hiccup and exiting onto a note that lands with the click is the actual performing skill.",
      evidence: "Bickford: a measured stroke does not make a tremolo; Pennanen documents tremolo as a core bouzouki articulation; Karantinis's lesson catalogue includes tremolo technique study.",
      sourceLabel: "Bickford tremolo doctrine", sourceHref: "https://archive.org/download/bickfordmandolin01bick/bickfordmandolin01bick.pdf",
      steps: ["Pick the first four notes in strict ta-ka.", "Open the fifth note into free, uncounted tremolo for its full held value - the entry must not stutter.", "Close the tremolo and land the exit note exactly with the click, then finish the line."],
      listen: "Three textures in one line: picked, sung-by-tremolo, picked - with seamless seams.",
      pass: "Self-scored on a recording: no audible hiccup at the entry, and the exit note lands with the click in three consecutive takes.",
      boundary: "The doctrine is a labelled import; the line is a Dromos generation from the selected dromos, not a transcription."
    },
    {
      id: "irish-treble", category: "phrase", order: 22, title: "Treble cell (Irish import)",
      short: "Anchor note plus a D-U-D treble - a triplet cell from Irish plectrum pedagogy.", layout: "horizontal", sequence: "trebleCell", count: 8,
      articulation: "picked-line", sourceIds: ["irish-treble", "mandoisland-counted"],
      theory: "IMPORT (Irish tenor banjo/mandolin): the treble is a compact triplet ornament - a plain anchor stroke, then D-U-D squeezed into its shadow. It builds exactly the wrist snap fast laiko fills need, and it wears its Irish badge honestly.",
      evidence: "Irish banjo and mandolin pedagogy documents the anchor-plus-treble cell and its D-U-D execution; MandoIsland corroborates burst-within-line training.",
      sourceLabel: "Irish treble pedagogy (labelled import)", sourceHref: "https://www.pegheadnation.com/string-school/irish-mandolin/",
      steps: ["Play the anchor as a full-value downstroke.", "Squeeze the D-U-D treble into the following slot without stealing the next anchor's time.", "Alternate anchor and treble until the treble sounds like ornament, not like rushing."],
      listen: "The anchors keep the time; the trebles decorate it - never the other way round.",
      pass: "Self-scored: three passes where every treble speaks all three notes and the following anchor still lands on the click.",
      boundary: "An Irish plectrum import wearing its badge; it is not a claim about Greek practice, and the cell is a Dromos generation, not a tune quote."
    },
    {
      id: "era-register-contrast", category: "phrase", order: 23, title: "Two registers: sparse & dense",
      short: "The same phrase as sparse accented strokes, then as dense stroke-plus-slide playing.", layout: "horizontal", sequence: "registerContrast", count: 12,
      articulation: "picked-legato", sourceIds: ["pennanen-1999", "pennanen", "filippatos-bouzoukiland"],
      theory: "Era-documented poles of penia style: simple sharp strokes on one side, quick strokes with slides on the other. Train both registers on one phrase so density becomes a choice, not a habit.",
      evidence: "The sparse-versus-dense contrast between the early Piraeus school and the later virtuoso style is documented in the performance-practice literature (Pennanen 1999 ch. IV; Pennanen 2024 on stroke registers).",
      sourceLabel: "Pennanen performance-practice scholarship", sourceHref: "https://www.academia.edu/6666348/IV_The_organological_development_and_performance_practice_of_the_Greek_bouzouki",
      steps: ["Play the sparse register: four held, accented strokes carrying the whole contour.", "Play the dense register: all eight slots, slides binding the off-slots.", "Alternate registers each pass; keep the underlying contour identical."],
      listen: "One melody, two eras: the notes barely change, the attitude completely does.",
      pass: "Self-scored: a listener can tell which register you intended within two bars, and the contour survives both.",
      boundary: "The registers are documented historical poles; the phrase itself is a Dromos generation and not anyone's recorded lick."
    },
    {
      id: "chunk-builder", category: "keychange", order: 24, title: "Chunk builder",
      short: "Lower tetrachord twice, upper twice, joined octave - rebuilt in each band key.", layout: "horizontal", sequence: "chunkBuilder", count: 20,
      articulation: "picked-line", sourceIds: ["pagiatis-dromoi", "ordoulidis-modes", "trigas-method"],
      theory: "A dromos is two named chunks joined at a seam. Build it as chunks - lower, upper, then the whole road - and the same construction transposes to any tonic, because the chunks are interval structures, not fret memories. Minor band keys rebuild the minor-family version; major keys the major-family: the CHUNKS are the invariant.",
      evidence: "The tetrachord construction of dromoi is the native Greek teaching form (Pagiatis treatise; Ordoulidis on dromoi as transposable interval structures); Trigas sequences scale study progressively.",
      sourceLabel: "Pagiatis + Ordoulidis chunk construction", sourceHref: "https://fagottobooks.gr/blog/wp-content/uploads/2024/02/%CE%BB%CE%B1%CE%B9%CE%BA%CE%BF%CE%B9%CE%B4%CF%81%CE%BF%CE%BC%CE%BF%CE%B9%CE%BA%CE%B1%CE%B9%CF%80%CF%81%CE%B1%CE%BA%CE%B1%CF%80%CE%BF%CF%83%CF%80.pdf",
      steps: ["Play the lower chunk twice, naming it out loud; then the upper chunk twice.", "Join them through the seam note into the full octave road.", "In Evolve with Band keys, rebuild the same chunks in the next key - the fingers move, the construction does not."],
      listen: "The seam note is the hinge: it should sound like a doorway between the two chunks.",
      pass: "Self-scored: in each band key the chunk boundaries stay audible and the seam note lands without hesitation.",
      boundary: "Chunk construction is the sourced pedagogy; each realisation is a Dromos generation from the app's own scale model, not a copied diagram."
    },
    {
      id: "ghammaz-pivot", category: "keychange", order: 25, title: "Pivot-note key change",
      short: "End the home phrase ON the note that is the next key's tonic, then launch its lower chunk.", layout: "horizontal", sequence: "ghammazPivot", count: 12,
      articulation: "picked-line", sourceIds: ["papasolomontos-2017", "ordoulidis-modes", "pagiatis-dromoi"],
      theory: "The band cycle is ordered so every hop's pivot note IS the destination tonic: G to D on the 5th, D to Dm on the shared tonic, Dm to Am on its 5th, Am to E on its 5th, E to Em on the tonic, Em to G on the flat 3. Land the pivot, hold it, and the new key starts under your finger.",
      evidence: "Instant key-changing is period-documented in the Chiotis circle (E major immediately, D major immediately - Papasolomontos 2017 testimony); dromoi as transposable structures is Ordoulidis; the cycle ordering itself is Dromos design and is labelled as such.",
      sourceLabel: "Papasolomontos testimony + Ordoulidis", sourceHref: "https://olympias.lib.uoi.gr/jspui/bitstream/teiep/8069/1/%CE%A0%CE%A4%CE%A5%CE%A7%CE%99%CE%91%CE%9A%CE%97%20%CE%A0%CE%91%CE%A0%CE%91%CE%A3%CE%9F%CE%9B%CE%9F%CE%9C%CE%A9%CE%9D%CE%A4%CE%9F%CE%A3.pdf",
      steps: ["Play the home-key phrase; its last note is marked - that pitch is the next key's tonic.", "Hold the pivot two counts and rename it out loud: this is the new 1.", "Launch the destination's lower chunk from that same pitch without repositioning first."],
      listen: "No gap at the border: the pivot note belongs to both keys and the ear should never fall between them.",
      pass: "Self-scored: three hops in a row where the pivot lands, holds, and relaunches without a stumble or a search.",
      boundary: "The pivot mechanic extrapolates documented instant-transposition practice; the phrases are Dromos generations and the cycle order is app design, stated as such."
    },
    {
      id: "band-key-arpeggio-circuit", category: "arpeggio", order: 26, title: "Band-key arpeggio circuit",
      short: "Triads of the active progression, arpeggiated, through all six band keys.", layout: "2nps", sequence: "arpCircuit", count: 24,
      articulation: "picked-line", sourceIds: ["trigas-method", "avlonitis-101", "pagiatis-dromoi"],
      theory: "Arpeggio study through real harmony: each chord of the active progression becomes root-accented triad tones under strict alternation, and the whole circuit runs the band cycle so the SAME harmonic hand lives in every singing key. One string set per session; rotate sets across sessions.",
      evidence: "Trigas lists arpeggios as a named exercise family; Avlonitis documents graded plectrum dexterity study; Pagiatis joins each dromos to its practical chords.",
      sourceLabel: "Trigas arpeggio family + Pagiatis harmony pairing", sourceHref: "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-three-string-bouzouki/",
      steps: ["Arpeggiate each chord of the progression: root accented, tones alternate-picked, no smear.", "Loop the progression until the chord labels feel like places, not spellings.", "In Evolve with Band keys, run the circuit one key per stage at one steady tempo - one string set today."],
      listen: "The roots are a bass line hiding inside your right hand.",
      pass: "Self-scored: the full six-key circuit at one tempo with every root accent where you intended - one recorded key checked closely.",
      boundary: "Arpeggio study is method-supported; these voicing routes come from the app's own grip engine, and Dromos claims no published fingerings.",
      allStrings: true
    },
    {
      id: "sequence-ladder", category: "phrase", order: 27, title: "Imitation chain (mimisis)",
      short: "State a cell, restate it from the second chord's tone, vary it, resolve.", layout: "horizontal", sequence: "sequenceLadder", count: 18,
      articulation: "picked-line", sourceIds: ["papasolomontos-2017", "pennanen", "karantinis-lessons"],
      theory: "All ten analysed Chiotis taximia are built by mimisis: one cell restated at new levels. The ladder anchors the restatement on the progression's second chord - whatever it is - so the drill works in every dromos, including ones with no IV.",
      evidence: "Papasolomontos 2017 documents mimisis in 10 of 10 analysed taximia, with model-on-I and repetition-on-IV as the typical frame; Karantinis's phraseology series confirms phrase-vocabulary teaching as the native format.",
      sourceLabel: "Papasolomontos mimisis analysis", sourceHref: "https://olympias.lib.uoi.gr/jspui/bitstream/teiep/8069/1/%CE%A0%CE%A4%CE%A5%CE%A7%CE%99%CE%91%CE%9A%CE%97%20%CE%A0%CE%91%CE%A0%CE%91%CE%A3%CE%9F%CE%9B%CE%9F%CE%9C%CE%A9%CE%9D%CE%A4%CE%9F%CE%A3.pdf",
      steps: ["Play the cell over the first chord until you could sing it backwards.", "Restate it starting on the second chord's anchor tone - same rhythm, new floor.", "Vary it once (one note or one rhythm), then resolve to the tonic and stop."],
      listen: "The rhythm is the fingerprint: it must survive every restatement intact.",
      pass: "Self-scored: the cell's rhythm is identical in all three statements and the resolution lands on the tonic on the beat.",
      boundary: "Mimisis is the documented device; every cell here is a Dromos generation from the dromos model, never a transcription of anyone's taximi."
    },
    {
      id: "skeleton-descent", category: "phrase", order: 28, title: "Skeleton descent (minore line)",
      short: "The descending run as skeleton first, then filled - the minore lineage's shape.", layout: "horizontal", sequence: "skeletonDescent", count: 12,
      articulation: "picked-line", sourceIds: ["monemvasitis-minore", "papasolomontos-2017", "pagiatis-dromoi"],
      theory: "The descending line from the octave to the tonic is the spine of the minore taximi lineage. Practise it as a skeleton - every other tone, held - then filled, so speed never outruns the shape.",
      evidence: "The Minore tou Teke thesis documents descending formulas as a shared inheritance whose phrases echo through the minore taximia that followed; the app's descendingRun generator supplies the scale-true material.",
      sourceLabel: "UoA minore-lineage thesis", sourceHref: "https://pergamos.lib.uoa.gr/uoa/dl/object/3421083/file.pdf",
      steps: ["Play the skeleton descent - every other tone, two counts each - singing degree numbers.", "Play the full descent at the same tempo; the skeleton notes keep their weight.", "Default this drill to Dm or Am (the minore home keys); then let Evolve carry it elsewhere."],
      listen: "Falling with intention: the line should sound inevitable, not like a scale going home.",
      pass: "Self-scored: the filled descent keeps the skeleton audible and arrives on the tonic exactly with the click.",
      boundary: "The descent SHAPE is documented lineage; this realisation is a Dromos generation from the scale model and not a copied taximi."
    },
    {
      id: "instant-transpose", category: "keychange", order: 29, title: "Instant transpose",
      short: "One phrase, a cue chord, the same phrase in the cue's key - first attempt counts.", layout: "horizontal", sequence: "instantTranspose", count: 20,
      articulation: "picked-line", sourceIds: ["papasolomontos-2017", "ordoulidis-modes"],
      theory: "Period testimony from the Chiotis circle: keys changed instantly on demand - E major immediately, D major immediately. The drill recreates the demand: a phrase you own, a cue chord, and the same phrase rebuilt in the cue key on the first attempt. Closed movable shapes make this easiest (a labelled fretted-instrument import, not a Greek rule).",
      evidence: "The instant-transposition testimony is documented in Papasolomontos 2017; dromoi as transposable interval structures is Ordoulidis. E's place in the band cycle is set-list preference, labelled as such - the testimony warrants the MECHANIC.",
      sourceLabel: "Papasolomontos testimony + Ordoulidis", sourceHref: "https://olympias.lib.uoi.gr/jspui/bitstream/teiep/8069/1/%CE%A0%CE%A4%CE%A5%CE%A7%CE%99%CE%91%CE%9A%CE%97%20%CE%A0%CE%91%CE%A0%CE%91%CE%A3%CE%9F%CE%9B%CE%9F%CE%9C%CE%A9%CE%9D%CE%A4%CE%9F%CE%A3.pdf",
      steps: ["Own the phrase in D until it plays itself.", "When the cue chord sounds, say the new tonic out loud during its two counts.", "Play the phrase in the cue key immediately - no rehearsal pass; the first attempt is the exercise."],
      listen: "The gap between cue and phrase is the score: it should shrink week by week.",
      pass: "Self-scored: the transposed phrase is correct on the first attempt in at least three of four cues.",
      boundary: "Testimony documents the skill, not this drill: the phrase and cue mechanics are Dromos generations, and the closed-shape tip is a labelled import."
    },
    {
      id: "gap-click-pulse", category: "time", order: 30, title: "Gap click on the Greek pulse",
      short: "The click thins out - every subdivision, then group starts, then bar one only.", layout: "horizontal", sequence: "pulseAccentMap", count: 16,
      articulation: "picked-line", sourceIds: ["allingham-tempo", "measured-tempi", "trigas-method"],
      variants: [{ id: "every", label: "Click: all" }, { id: "groups", label: "Click: groups" }, { id: "barone", label: "Click: bar 1" }],
      theory: "Time that survives silence: the same pulse-accent stream, but the metronome withdraws in stages until only bar one clicks. Your right hand becomes the click the band actually follows.",
      evidence: "Sparse-click training at fixed tempo sits inside the documented tempo-management strategies (peer-reviewed: gradual increase and alternation validated as strategies, no step size validated); the pulse maps and tempo bands are the app's sourced rhythm model.",
      sourceLabel: "Tempo-strategy research + measured tempi", sourceHref: "https://journals.sagepub.com/doi/pdf/10.1177/03057356221129653",
      steps: ["Run the 16ths map with the click on every subdivision until it is easy.", "Thin the click to group starts only; your accents must replace the missing ticks.", "Thin to bar one only: re-enter after each near-silent bar exactly on the click."],
      listen: "When the click disappears, nothing about your playing should notice.",
      pass: "Self-scored: at click-bar-one, three consecutive bars re-enter with the click with no audible correction.",
      boundary: "Gap-click is universal pedagogy applied to the app's sourced Greek pulses; the stream is a Dromos generation."
    },
    {
      id: "full-neck-ladder", category: "route", order: 31, title: "Scale over the whole neck",
      short: "The same octave road rebuilt in every practical position, low frets to high and back.", layout: "2nps", sequence: "neckLadder", count: 32,
      articulation: "picked-line", sourceIds: ["karantinis-lessons", "trigas-method", "pennanen"],
      theory: "One dromos is not one shape: every practical position holds the same interval road under a different finger map. Climb the ladder and the neck stops being fret geography and becomes one scale seen through different windows - the skill that lets a phrase continue wherever the hand already is.",
      evidence: "Mode positions are a documented lesson topic (Karantinis catalogue); progressive multi-position study is the declared structure of the Trigas curriculum; the horizontal-versus-tiered route trade-off within each window is documented by Pennanen.",
      sourceLabel: "Karantinis mode positions + Trigas progression", sourceHref: "https://karantinis.com/video-lessons/",
      steps: ["Play the octave road in the lowest practical position and say its fret window out loud.", "Shift up to the next position and rebuild the same road - same intervals, new finger map.", "Climb to the highest position, then descend the ladder without letting any shift bend the pulse."],
      listen: "The shifts: the pulse must not bend where the hand travels.",
      pass: "Self-scored: every position sounds like the same scale, and no shift costs time on a recorded take.",
      boundary: "Position study is the sourced pedagogy; no surveyed source prescribes this ladder order - the position sequence is a Dromos generation from the app's own position model."
    },
    {
      id: "arp-chunks", category: "arpeggio", order: 32, title: "Four-note chord chunks",
      short: "Root-3rd-5th-octave as one chunk per chord; the octave top launches the next change.", layout: "horizontal", sequence: "arpChunks", count: 16,
      articulation: "picked-line", sourceIds: ["trigas-method", "pagiatis-dromoi"],
      theory: "A chord spelled as one four-note chunk - root, 3rd, 5th, octave - is the smallest unit that both outlines the harmony and hands you a launch note: the octave top sits close to the next chord's nearest tone. Practising the progression as linked chunks is what turns arpeggios into fills you can place inside a song.",
      evidence: "Arpeggio study is a named category of the Trigas methods; main and secondary chords and their common motion are the Pagiatis treatise's practical frame. The chunk-linking route itself is generated.",
      sourceLabel: "Trigas arpeggios + Pagiatis chord motion", sourceHref: "https://www.trigas.gr/en/book_categories/novel-teaching-methods-for-the-three-string-bouzouki/",
      steps: ["Play one chord's chunk - root, 3rd, 5th, octave - and name the chord out loud.", "Hold the octave top and find the next chord's root beside it before the hand moves.", "Link every chord of the progression into one circuit, accenting each root on the click."],
      listen: "The octave tops: each one should sound like a question the next root answers.",
      pass: "Self-scored: the circuit runs through the whole progression with every root landing on the click.",
      boundary: "The sources support arpeggio and chord-motion study; this four-note chunk circuit is a Dromos generation from the app's own progression model, not a copied exercise."
    }
  ];

  EXERCISES.sort((left, right) => left.order - right.order);

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
    if (exercise.sequence === "single") {
      nodes = repeatTo(baseNodes.slice(0, 1), exercise.count);
      return alternate(nodes, (index) => index === 0, firstStroke).map((node) => Object.assign(node, { phrase: "ta–ka clock" }));
    }
    if (exercise.sequence === "degreeWindow") {
      const source = baseNodes.slice(0, 7);
      if (!source.length) return [];
      nodes = [];
      for (let start = 0; start < 4; start++) {
        [0, 1, 2, 3].forEach((offset) => nodes.push(cloneNode(source[(start + offset) % source.length])));
      }
      return alternate(nodes, (index) => index % 4 === 0, firstStroke).map((node, index) =>
        Object.assign(node, { phrase: `window ${Math.floor(index / 4) + 1}` }));
    }
    if (exercise.sequence === "phraseCell") {
      const source = baseNodes.slice(0, 4);
      if (!source.length) return [];
      nodes = [0, 1, 2, 3, 2, 1, 0].map((index) => cloneNode(source[index % source.length]));
      return alternate(nodes, (index) => index === 0 || index === 3 || index === 6, firstStroke).map((node, index) =>
        Object.assign(node, { phrase: index < 3 ? "rise" : index === 3 ? "turn" : index < 6 ? "return" : "home" }));
    }
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
    if (exercise.sequence === "openCourses") {
      // baseNodes: one open-course node per course, low to high (app-built).
      nodes = [];
      baseNodes.forEach((course, courseIndex) => {
        repeatTo([course], 8).forEach((node, index) => nodes.push(Object.assign(node, {
          phrase: `course ${courseIndex + 1}`, courseStart: index === 0
        })));
      });
      return alternate(nodes, (index) => !!nodes[index].courseStart, firstStroke);
    }
    if (exercise.sequence === "formationLadder") {
      // Same 12 notes, four rhythm formations: the notes never change, only
      // the grouping and accent map (Trigas's rhythm-formation category).
      const source = repeatTo(baseNodes, 12);
      nodes = [];
      const passes = [
        { name: "straight 8ths", copies: 1, accent: (i) => i % 4 === 0, durMult: () => 1 },
        { name: "dotted pairs", copies: 1, accent: (i) => i % 2 === 0, durMult: (i) => (i % 2 === 0 ? 1.5 : 0.5) },
        { name: "triplet regroup", copies: 1, accent: (i) => i % 3 === 0, durMult: () => 1 },
        { name: "3+3+2 drive", copies: 2, accent: (i) => i % 8 === 0 || i % 8 === 3 || i % 8 === 6, durMult: () => 1 }
      ];
      passes.forEach((pass, passIndex) => {
        repeatTo(source, 12 * pass.copies).forEach((node, index) => nodes.push(Object.assign(node, {
          phrase: pass.name, formationAccent: pass.accent(index), durMult: pass.durMult(index), passIndex
        })));
      });
      return alternate(nodes, (index) => !!nodes[index].formationAccent, firstStroke);
    }
    if (exercise.sequence === "pulseAccentMap") {
      // 16ths against the active Greek pulse: accents come from the pulse's
      // own group map (styles.js), never invented. One pitch: this is rhythm
      // practice, and the pitch staying still is what exposes the accents.
      const target = baseNodes[0];
      if (!target) return [];
      const sub = 4;
      nodes = [];
      beats.forEach((beat) => {
        for (let unit = 0; unit < sub; unit++) {
          nodes.push(Object.assign(cloneNode(target), {
            phrase: `beat ${beat.beat}`,
            strong: !!beat.first && unit === 0,
            beatStart: unit === 0,
            clickEvery: true, clickGroups: !!beat.first && unit === 0, clickBarOne: beat.beat === 1 && unit === 0
          }));
        }
      });
      return alternate(nodes, (index) => !!nodes[index].strong, firstStroke).map((node) =>
        Object.assign(node, { softAccent: node.beatStart && !node.strong }));
    }
    if (exercise.sequence === "skeletonFill") {
      // Skeleton first: tonic, the tetrachord joint, the 3rd, the octave —
      // then the same line with every note, skeleton notes still weighted.
      const skeleton = baseNodes.filter((node) => node.skeleton);
      nodes = [];
      skeleton.forEach((node) => nodes.push(Object.assign(cloneNode(node), { phrase: "skeleton", durMult: 2 })));
      baseNodes.forEach((node) => nodes.push(Object.assign(cloneNode(node), { phrase: "filled", fillAccent: !!node.skeleton })));
      return alternate(nodes, (index) => nodes[index].phrase === "skeleton" || !!nodes[index].fillAccent, firstStroke);
    }
    if (exercise.sequence === "tripletDrive") {
      // One pitch, continuous triplets, the two documented glide families.
      const target = baseNodes[0];
      if (!target) return [];
      const family = variant === "udd" ? ["U", "D", "DG"] : ["D", "DG", "U"];
      nodes = repeatTo([target], 12);
      return nodes.map((node, index) => {
        const technique = family[index % 3];
        return Object.assign(node, {
          order: index + 1, technique,
          stroke: technique.charAt(0) === "D" ? "down" : "up",
          gesture: technique.length > 1 ? "glide" : "pick",
          accent: index % 3 === 0, phrase: variant === "udd" ? "U–D–D family" : "D–D–U family"
        });
      });
    }
    if (exercise.sequence === "sextoletGlide") {
      // Two sextolets over a two-notes-per-course segment; the glide binds
      // the course crossing (Pennanen 2024: Hiotis used glides "especially
      // in triplets and sextolets").
      let source = baseNodes.slice(0, 6);
      if (source.length < 6) source = repeatTo(baseNodes, 6);
      nodes = repeatTo(source, 12);
      const downFirst = firstStroke !== "up";
      return nodes.map((node, index) => {
        const posInGroup = index % 6;
        const crosses = index > 0 && node.stringIndex !== nodes[index - 1].stringIndex;
        const technique = crosses ? (downFirst ? "DG" : "UG") : (posInGroup % 2 === 0) === downFirst ? "D" : "U";
        return Object.assign(node, {
          order: index + 1, technique,
          stroke: technique.charAt(0) === "D" ? "down" : "up",
          gesture: technique.length > 1 ? "glide" : "pick",
          accent: posInGroup === 0, phrase: `sextolet ${Math.floor(index / 6) + 1}`
        });
      });
    }
    if (exercise.sequence === "countedTremolo") {
      // The measured bridge toward free tremolo: counted bursts with a
      // controlled landing stroke (MandoIsland groupings), one course at a
      // time so it doubles as course coverage.
      const target = baseNodes[0];
      if (!target) return [];
      nodes = [];
      [[4, 1], [6, 1], [8, 1], [4, 2], [6, 4]].forEach(([burst, tail], groupIndex) => {
        repeatTo([target], burst + tail).forEach((node, index) => nodes.push(Object.assign(node, {
          phrase: `${burst}+${tail}`, burstStart: index === 0, landing: index >= burst, group: groupIndex + 1
        })));
      });
      return alternate(nodes, (index) => nodes[index].burstStart || nodes[index].landing, firstStroke);
    }
    if (exercise.sequence === "entryExit") {
      // Picked line -> free tremolo on the marked note -> picked exit that
      // lands with the click. Bickford's rule: the tremolo itself is
      // unmeasured; only its edges are timed.
      const line = baseNodes.slice(0, 8);
      if (line.length < 8) return [];
      nodes = line.map((node, index) => cloneNode(node));
      const marked = 4;
      return alternate(nodes, (index) => index === 0 || index === marked + 1, firstStroke).map((node, index) =>
        Object.assign(node, index === marked
          ? { technique: "TR", stroke: null, gesture: "free-tremolo", durMult: 4, phrase: "free tremolo — uncounted" }
          : { phrase: index < marked ? "picked entry" : "picked exit — land with the click" }));
    }
    if (exercise.sequence === "trebleCell") {
      // Anchor + D-U-D treble, twice. An Irish plectrum import wearing its
      // badge; a triplet-cell workout, not a Greek prescription.
      const target = baseNodes[0];
      if (!target) return [];
      const cell = ["D", "D", "U", "D"];
      nodes = repeatTo([target], 8);
      return nodes.map((node, index) => {
        const technique = cell[index % 4];
        return Object.assign(node, {
          order: index + 1, technique, stroke: technique === "D" ? "down" : "up",
          accent: index % 4 === 0, durMult: index % 4 === 0 ? 2 : 0.66,
          phrase: index % 4 === 0 ? "anchor" : "treble"
        });
      });
    }
    if (exercise.sequence === "registerContrast") {
      // The era-documented poles: sparse accented strokes versus dense
      // stroke-plus-slide playing, on one generated contour.
      const contour = repeatTo(baseNodes, 8);
      nodes = [];
      [0, 2, 4, 7].forEach((slot) => nodes.push(Object.assign(cloneNode(contour[slot]), {
        phrase: "sparse register", durMult: 2, sparse: true
      })));
      contour.forEach((node, index) => nodes.push(Object.assign(cloneNode(node), {
        phrase: "dense register", gesture: index % 2 === 1 ? "slide" : "pick"
      })));
      return alternate(nodes, (index) => !!nodes[index].sparse || (nodes[index].phrase === "dense register" && index % 4 === 0), firstStroke);
    }
    if (exercise.sequence === "chunkBuilder") {
      // The dromos as named chunks: lower tetrachord twice, upper twice,
      // then the joined octave line. Chunk names ride on the nodes (app).
      const lower = baseNodes.filter((node) => node.chunk === "lower");
      const upper = baseNodes.filter((node) => node.chunk === "upper");
      nodes = [];
      repeatTo(lower, lower.length * 2).forEach((node, index) => nodes.push(Object.assign(node, {
        phrase: "lower chunk", chunkStart: index % Math.max(1, lower.length) === 0
      })));
      repeatTo(upper, upper.length * 2).forEach((node, index) => nodes.push(Object.assign(node, {
        phrase: "upper chunk", chunkStart: index % Math.max(1, upper.length) === 0
      })));
      baseNodes.forEach((node) => nodes.push(Object.assign(cloneNode(node), { phrase: "joined road" })));
      return alternate(nodes, (index) => !!nodes[index].chunkStart, firstStroke);
    }
    if (exercise.sequence === "ghammazPivot") {
      // Home phrase ends ON the pivot note — which IS the next key's tonic —
      // then the destination's lower chunk launches from that same pitch.
      nodes = baseNodes.map((node) => cloneNode(node));
      return alternate(nodes, (index) => !!baseNodes[index].pivot || !!baseNodes[index].launch, firstStroke).map((node, index) =>
        Object.assign(node, baseNodes[index].pivot
          ? { durMult: 2, phrase: "pivot — this note IS the new tonic" }
          : { phrase: baseNodes[index].launch ? "new key, lower chunk" : "home key" }));
    }
    if (exercise.sequence === "arpCircuit") {
      // Triads through the active progression: root accented, chord tones
      // alternate-picked, chord label riding each group.
      nodes = baseNodes.map((node) => cloneNode(node));
      return alternate(nodes, (index) => !!baseNodes[index].chordStart, firstStroke).map((node, index) =>
        Object.assign(node, { phrase: baseNodes[index].chordSymbol || "chord" }));
    }
    if (exercise.sequence === "sequenceLadder") {
      // Mimisis: state the cell, restate it from the second chord's tone,
      // vary it, resolve (Papasolomontos: imitation in 10/10 taximia).
      nodes = baseNodes.map((node) => cloneNode(node));
      return alternate(nodes, (index) => !!baseNodes[index].cellStart, firstStroke).map((node, index) =>
        Object.assign(node, { phrase: baseNodes[index].cellPhase || "cell" }));
    }
    if (exercise.sequence === "skeletonDescent") {
      // The minore descent: skeleton pass (every other tone, held), then the
      // full run — generated from descendingRun, never a transcription.
      nodes = [];
      baseNodes.forEach((node, index) => {
        if (index % 2 === 0) nodes.push(Object.assign(cloneNode(node), { phrase: "skeleton", durMult: 2 }));
      });
      baseNodes.forEach((node) => nodes.push(Object.assign(cloneNode(node), { phrase: "full descent" })));
      return alternate(nodes, (index) => nodes[index].phrase === "skeleton", firstStroke);
    }
    if (exercise.sequence === "neckLadder") {
      // The ladder: same road, each practical position in turn; accents mark
      // the shifts so the ear checks the hand's travel against the pulse.
      nodes = baseNodes.map((node) => cloneNode(node));
      return alternate(nodes, (index) => !!baseNodes[index].positionShift, firstStroke).map((node, index) =>
        Object.assign(node, { phrase: baseNodes[index].positionLabel || "ladder" }));
    }
    if (exercise.sequence === "arpChunks") {
      // Four-note chord chunks: root accented, chord label riding each group,
      // the octave top flagged as the launch toward the next change.
      nodes = baseNodes.map((node) => cloneNode(node));
      return alternate(nodes, (index) => !!baseNodes[index].chordStart, firstStroke).map((node, index) =>
        Object.assign(node, { phrase: baseNodes[index].octaveTop ? `${baseNodes[index].chordSymbol || "chunk"} · launch` : baseNodes[index].chordSymbol || "chunk" }));
    }
    if (exercise.sequence === "instantTranspose") {
      // Phrase in the home key, a cue chord, the same phrase in the cue key.
      nodes = baseNodes.map((node) => cloneNode(node));
      return alternate(nodes, (index) => !!baseNodes[index].cue || !!baseNodes[index].phraseStart, firstStroke).map((node, index) =>
        Object.assign(node, baseNodes[index].cue
          ? { technique: "CHORD", stroke: null, gesture: "cue", durMult: 2, phrase: "cue chord — go" }
          : { phrase: baseNodes[index].keyLabel || "phrase" }));
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
    const knowledge = window.BouzoukiKnowledge;
    check("picking exercise ids are unique", new Set(EXERCISES.map((item) => item.id)).size === EXERCISES.length);
    check("picking curriculum order is continuous", EXERCISES.every((item, index) => item.order === index + 1));
    check("every picking category has an exercise", CATEGORIES.every((category) => EXERCISES.some((item) => item.category === category.id)));
    check("every exercise is actionable and bounded", EXERCISES.every((item) =>
      item.steps.length === 3 && item.listen && item.pass && item.theory && /Dromos|not a|not copied|not his/i.test(item.boundary)));
    check("every named claim links to a source", EXERCISES.every((item) => /^https:\/\//.test(item.sourceHref) && item.evidence && item.sourceLabel));
    check("every exercise declares a valid articulation", EXERCISES.every((item) => !!ARTICULATIONS[item.articulation]));
    check("every exercise belongs to one mastery phase", !!knowledge && EXERCISES.every((item) => !!knowledge.phaseForExercise(item.id)));
    check("every exercise provenance resolves", !!knowledge && EXERCISES.every((item) =>
      item.sourceIds.length && item.sourceIds.every((id) => !!knowledge.sourceById(id))));
    check("community evidence cannot be an exercise's only authority", !!knowledge && EXERCISES.every((item) =>
      item.sourceIds.some((id) => knowledge.sourceById(id).rank < 3)));
    const sample = Array.from({ length: 12 }, (_, index) => ({ midi: 60 + index, stringIndex: Math.floor(index / 3), fret: index, note: { degree: String(index + 1) } }));
    const clock = buildSequence("down-up-clock", sample, []);
    check("ta-ka clock repeats one pitch with eight distinct attacks", clock.length === 8 && new Set(clock.map((event) => event.midi)).size === 1 && clock.every((event) => /^(D|U)$/.test(event.technique)));
    const line = buildSequence("picked-dromos-line", sample, []);
    check("articulated dromos line picks every displayed note", line.length === 8 && line.every((event) => /^(D|U)$/.test(event.technique)));
    const strict = buildSequence("mixed-crossings", sample, []);
    check("strict alternate plan never repeats a stroke", strict.every((event, index) => index === 0 || event.stroke !== strict[index - 1].stroke));
    const pulse = buildSequence("grouped-accents", sample, [
      { beat: 1, group: 1, first: true }, { beat: 2, group: 1, first: false },
      { beat: 3, group: 2, first: true }, { beat: 4, group: 2, first: false }
    ]);
    check("grouped accents follow group starts", "1,3", pulse.map((event, index) => event.accent ? index + 1 : null).filter(Boolean).join(","));
    check("tremolo ladder is 2+4+6+8", 20, buildSequence("tremolo-ladder", sample, []).length);
    const windows = buildSequence("degree-window", sample, []);
    check("dexterity windows are four overlapping four-note cells", windows.length === 16 && windows.filter((event) => event.accent).length === 4);
    check("ornament plan separates picked and legato events", "D,H,H,P,U,SL", buildSequence("pick-legato", sample, []).map((event) => event.technique).join(","));
    check("phrase cell rises, turns, and returns home", "rise,rise,rise,turn,return,return,home", buildSequence("mode-phrase-cell", sample, []).map((event) => event.phrase).join(","));
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

  window.PickingLab = {
    BAND_KEY_CYCLE, bandPivotPc, CATEGORIES, ARTICULATIONS, EXERCISES, byId, buildSequence, buildPracticePlan, selfTest };
})();
