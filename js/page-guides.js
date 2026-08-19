/* page-guides.js — answer-first teaching copy for every Dromos workspace.
 * Pure data and selection logic; the app owns rendering and focus behavior.
 */
(function () {
  "use strict";

  const GUIDES = {
    today: {
      purpose: "Choose the right practice",
      answer: "Use Today when you are not sure where to begin.",
      result: "It gives you a short order: hear the change, name it, then find it on your instrument.",
      steps: ["Choose the first practice card you have not done today.", "Stay with that exercise until its success check is true.", "Return here and choose the next card; one clear pass is enough."],
      done: "You can describe what changed before you try to play it.",
      why: "A fixed order prevents random practice. Your ear learns the sound first, your mind gives it a name, and your hands receive a clear destination.",
      terms: [["Practice card", "A button that opens one exercise."], ["Pass", "One honest attempt where you can hear or explain the goal; it does not mean perfect performance."]],
      targetId: "todayApp"
    },
    cycle: {
      purpose: "Hear where the chords are going",
      answer: "Learn to hear the next chord before it arrives.",
      result: "The Changes Gym repeats ii–V–I, then turns the old home chord into the ii chord of a new key.",
      steps: ["Press ▶ Play in the bottom bar and watch the orange Now chord.", "Say ii, V, or I aloud while the chord sounds; the turquoise card is the next chord.", "When I becomes the next ii, keep hearing the same root but notice its new minor job."],
      done: "You expect the next chord before its card turns orange.",
      why: "Live players do not wait for a chord name and then search. They hear the pull in advance and move the nearest important notes into the new chord.",
      terms: [["ii–V–I", "Chord jobs numbered from the key; these are not fret numbers."], ["Pivot", "One chord or root is reinterpreted as a different job in the next key."], ["Home / I", "The chord that sounds settled or finished."]],
      targetId: "btnPlay"
    },
    cycleComp: {
      purpose: "Turn the movement into playable chords",
      answer: "Choose the smallest practical shape that still makes each chord clear.",
      result: "This view compares full chords, triads, and compact four-note grips without losing the progression.",
      steps: ["Choose the dromos and progression before choosing a chord shape.", "Start with Triad 3; try Full 6 or Compact 4 only after the small move is comfortable.", "Play the route slowly and listen for a held note or a 3rd moving by one or two frets."],
      done: "You can change chords on time without lifting every finger or losing the 3rd.",
      why: "Close voice leading sounds connected and is easier to execute. More notes are useful only when they preserve the musical job and the rhythm.",
      terms: [["Triad", "The root, 3rd, and 5th: the three-note identity of a chord."], ["Voice leading", "How each note in one chord moves into a note of the next chord."], ["Grip", "One playable fingering for a chord."]],
      targetId: "cycleCompingControls"
    },
    prog: {
      purpose: "Understand a song's chord map",
      answer: "Choose a home and dromos, then learn one common progression as numbered chord jobs.",
      result: "The chord names change with the key, but the Roman-numeral map keeps the same musical meaning.",
      steps: ["Choose Scale / dromos, then choose Key.", "Choose one card under Common song maps and read its Roman numerals from left to right.", "Press ▶ Play, point to each chord, and say its number before its name."],
      done: "You can sing or say where the progression returns home without looking at the fretboard.",
      why: "Remembering a map by function lets you recognize and transpose the same movement in another song or key.",
      terms: [["Dromos", "The selected note collection and its characteristic melodic/harmonic behavior."], ["Roman numeral", "A chord's numbered job in the current key; uppercase usually means major and lowercase means minor."], ["Progression", "An ordered path of chords."]],
      targetId: "tonicSel"
    },
    chordmap: {
      purpose: "See every chord inside a scale",
      answer: "Use the Matrix as a reference: choose a key, then click one chord to learn how to play, enter, and leave it.",
      result: "Each row is one scale; each numbered column is the chord built on that scale degree.",
      steps: ["Choose Key and leave Triads selected for the clearest foundation.", "Read across one scale row, then click the chord you want to understand.", "Use Play it, Outline it, Enter it, and Leave it in order before opening a sister scale."],
      done: "You can name the selected chord's number, find a usable shape, and hear one likely next chord.",
      why: "The table separates chords that mathematically belong to the scale from chords that the verified Song Maps actually use often.",
      terms: [["Scale degree", "A note's numbered position in the selected scale."], ["Derived only", "The chord belongs to the notes, but this curriculum does not claim it is a common working chord."], ["Sister scale", "A closely related scale reached through shared notes, one changed color, or a documented progression door."]],
      targetId: "chordMapCompare"
    },
    earColour: {
      purpose: "Recognize the sound of a scale family",
      answer: "Keep the home known, then identify whether the cadence sounds Major, minor, Harmonic minor, Ousak, or Hijaz.",
      result: "This trains relative hearing—the color and pull around a known home—not perfect pitch.",
      steps: ["Choose Training home and press ♪ Hear home once.", "Press ▶ Start question, listen twice, and choose one color family.", "Press Check + reveal; read the exact chords and replay the answer before starting another."],
      done: "You can explain which color note or chord quality separated your answer from the nearest alternative.",
      why: "Knowing the home removes a guessing variable. You can concentrate on the 2nd, 3rd, leading tone, and the way the cadence resolves.",
      terms: [["Cadence", "A short chord movement that creates arrival or resolution."], ["Relative hearing", "Hearing a note or chord by its relationship to a known home."], ["Color family", "The scale or dromos choice that gives the example its characteristic sound."]],
      targetId: "btnEarTonic"
    },
    earMap: {
      purpose: "Recognize the home and complete progression",
      answer: "Hear a short chord map, then identify its home, scale family, and Roman-numeral change boxes.",
      result: "You are identifying three separate facts; the page does not score anything until you press Check + reveal map.",
      steps: ["Choose a known Training home for easier practice, then press ♪ Hear the known home.", "Press ▶ Start map and listen for the chord that feels finished.", "Choose Home key, Harmonic / dromos family, and Change boxes; then press Check + reveal map."],
      done: "You can point to the home chord and describe at least one chord's pull toward it.",
      why: "Separating home, family, and progression prevents a partly correct label from hiding the exact thing your ear missed.",
      terms: [["Home key", "The note and chord that feel settled."], ["Change boxes", "The Roman-numeral order of the chords that played."], ["Blind", "The app does not tell you the home before the question."]],
      targetId: "btnEarMapHome"
    },
    melody: {
      purpose: "Connect one melody note to harmony",
      answer: "Hear one note against a known home, name its scale-degree job, then compare the chords that can support it.",
      result: "One melody note can belong to several chords; this page explains the valid choices instead of pretending there is one automatic answer.",
      steps: ["Choose Known home and Scale / dromos, then press ♪ Hear home.", "Press ▶ Start next note, choose its scale degree, and press Check + build harmony map.", "Audition the revealed chords, choose a next move, and sing the short answer line before playing it."],
      done: "You can sing the note, name its number, and explain why two different chords give it different meanings.",
      why: "Melodic hearing becomes useful in a band when you can place the note inside the current chord and anticipate where its nearest voice may move next.",
      terms: [["Scale degree", "The note's number measured from the home note."], ["Chord tone", "A note that is part of the chord sounding underneath."], ["Counter-melody", "A small answering line that supports the main melody instead of covering it."]],
      targetId: "btnMelodyHome"
    },
    triads: {
      purpose: "Accompany the song in time",
      answer: "Make the Greek pulse clear first, then place the closest triad on the chord beats.",
      result: "This teaches comping as rhythm plus voice leading—not as a list of disconnected chord diagrams.",
      steps: ["Clap or mute the Level 1 accents until the grouped pulse is easy to feel.", "Add only roots on bass slots and the highlighted triad on chord slots.", "Use Previous / next chord and keep the smallest movement that preserves the rhythm."],
      done: "A listener can identify the pulse and the chord changes even when you remove every fill.",
      why: "The dance feel carries the accompaniment. Extra chord tones and ornaments help only after the time and harmonic direction are stable.",
      terms: [["Comping", "Rhythmic chord accompaniment behind a singer or soloist."], ["Pulse", "The repeating beat grouping that makes the rhythm recognizable."], ["Close position", "Chord notes placed near one another so changes require less movement."]],
      targetId: "compSkeleton"
    },
    soloTargets: {
      purpose: "Make a solo follow the chord changes",
      answer: "Keep the full scale visible, but aim for the current chord's 3rd and prepare the next chord's 3rd before it arrives.",
      result: "The scale is your road; the solid triad is the current harmony; orange Now and dashed Next rings are your landing targets.",
      steps: ["Choose home, dromos, and progression in the setup above the fretboard.", "Leave 3rds · start here selected and sing the orange Now note.", "Press ▶ Play and move to the dashed Next note only when the chord changes and it becomes Now."],
      done: "The chord change is audible from your landing note even without a fast phrase.",
      why: "Scale notes provide motion, but chord tones reveal the song. Pre-hearing the next 3rd turns a shape into a melodic destination.",
      terms: [["Landing target", "The note you intend to reach on a strong beat."], ["3rd", "The chord tone that most clearly tells major from minor."], ["Now / Next", "Now belongs to the sounding chord; Next previews the coming chord."]],
      targetId: "btnPlay"
    },
    soloRoad: {
      purpose: "Understand the complete dromos on the neck",
      answer: "See the lower tetrachord, upper tetrachord, and octave as one connected road.",
      result: "This page explains the note layout before asking you to improvise through chord changes.",
      steps: ["Choose home and dromos, then locate the two root notes that frame one octave.", "Say each interval number while following the lower and upper color groups.", "Play slowly up and down; pause on the characteristic color notes and return to the root."],
      done: "You can find the root and characteristic notes in more than one neck area without restarting the pattern.",
      why: "A road is easier to remember as two meaningful note groups than as one long diagram of unrelated dots.",
      terms: [["Tetrachord", "A four-note segment used to understand part of a scale or dromos."], ["Octave", "The next higher or lower version of the same note name."], ["Characteristic note", "A note whose distance from home strongly identifies the selected sound."]],
      targetId: "soloRoad"
    },
    soloPath: {
      purpose: "Turn the road into a playable picking path",
      answer: "Choose one compact fretboard layout and make its string changes clean before adding speed.",
      result: "Different layouts show the same notes with different physical routes; none is the one universal shape.",
      steps: ["Leave 3/str selected, choose a comfortable position, and use the displayed first stroke.", "Choose one Landing lens and one Melodic route so every note has a job.", "Press ▶ Play, copy the path slowly, and change the string break before raising the tempo."],
      done: "The rhythm stays even across every string change and the final target sounds intentional.",
      why: "Technical repetition becomes musical practice when the path ends on a chord-aware destination instead of merely reaching the top of a scale.",
      terms: [["3/str", "Three notes per string."], ["Position", "The neck area where the first finger is centered."], ["Melodic route", "A rule for choosing and grouping notes, not a fixed lick."]],
      targetId: "btnLabPlay"
    },
    soloPhrase: {
      purpose: "Create melodic phrases from note numbers",
      answer: "Say and sing one short number pattern, then place it on the instrument with one clear rhythm.",
      result: "The contour can move to another key or chord because you remember relationships, not only fret addresses.",
      steps: ["Choose one four-note pattern and say its numbers aloud.", "Sing the contour without the instrument and decide which final note is the landing point.", "Press ▶ Play, copy it, then keep the notes while changing only the rhythm."],
      done: "You can sing the pattern first and move it to another home without guessing each fret.",
      why: "A small reusable cell is easier to hear, vary, and place over harmony than a long memorized scale run.",
      terms: [["Contour", "The up-and-down shape of a melody."], ["Cell", "A short group of notes that can be repeated or varied."], ["Transpose", "Move the same musical relationship to a different home note."]],
      targetId: "btnLabPlay"
    },
    soloCell: {
      purpose: "Shape an unmetered taximi arc",
      answer: "Set the dromos over a drone: begin low, expand high, then return home.",
      result: "The three-stage arc gives a free introduction direction without turning it into a fixed copied solo.",
      steps: ["Press ▶ Drone on the tonic and listen until the home feels stable.", "Choose 1 Low, make one short phrase, and leave silence before choosing 2 High.", "Choose 3 Home, sing the hidden target, then press Reveal target to check it."],
      done: "Your final phrase makes the tonic feel settled and the rests sound intentional.",
      why: "A taximi establishes modal character through register, characteristic notes, tension, silence, and return—not through constant speed.",
      terms: [["Taximi", "An unmetered modal improvisation that can introduce the dromos and emotional space."], ["Drone", "A sustained home note used as a hearing reference."], ["Register", "The low, middle, or high area of the instrument's range."]],
      targetId: "btnTaximiDrone"
    },
    picking: {
      purpose: "Make the pick serve the music",
      answer: "Loop one exact movement until it is easy; then evolve only the position, key, or both while the attack and pulse stay unchanged.",
      result: "The Picking Lab turns right-hand mechanics into ten instrument-specific exercises with plain-language stroke arrows, fretboard animation, theory, a count-in/metronome, and a run map through practical shapes or circle-of-fourths keys.",
      steps: ["Set Key, Scale / dromos, and Greek pulse; then match every ↓ downstroke and ↑ upstroke at a tempo where the hand stays loose.", "Compare Pennanen's horizontal, tiered, strict-alternate, and glide ideas while keeping the same notes and listening for the timbre or accent change.", "Finish with Triad arpeggio → next 3rd, log three clean passes, and raise only 4 BPM."],
      done: "The pulse and note destination remain clear through a course change, accent, tremolo burst, or ornament—and you can stop without tightening.",
      why: "Speed is useful only when attack, time, timbre, and harmonic destination survive. Small measurable drills reveal which part fails before it reaches a song.",
      terms: [["↓ / D", "Downstroke: the pick moves toward the floor."], ["↑ / U", "Upstroke: the pick returns toward you."], ["Glide", "One directed pick gesture continues through an adjacent course."], ["Clean pass", "One complete repetition with even time, relaxed motion, and the exercise's listening goal intact."]],
      targetId: "pickingTonicSel"
    },
    stylesFoundation: {
      purpose: "Build transferable musical habits",
      answer: "Learn the general skills first; then place them inside a specific Greek pulse and dromos.",
      result: "This keeps universal soloing ideas separate from claims about one Greek style.",
      steps: ["Read the foundation cards from top to bottom and choose the first weak skill.", "Practise only its small instruction for five slow repetitions.", "Open Greek styles and test the same skill inside one pulse family."],
      done: "You can explain the skill without naming a favorite lick or player.",
      why: "Targeting, motif development, space, voice leading, and rhythmic control transfer across instruments; style determines how they are voiced and timed.",
      terms: [["Foundation", "A general skill that supports many styles."], ["Motif", "A short recognizable musical idea that can be repeated or changed."], ["Style", "A shared language of rhythm, phrasing, articulation, and repertoire practice."]],
      targetId: "foundationGuide"
    },
    stylesGreek: {
      purpose: "Put the musical map inside a Greek pulse",
      answer: "Choose a rhythm family, feel its grouped beats, then return to Song Map for the actual harmony and dromos.",
      result: "Rhythm and dromos work together, but one does not automatically determine the other.",
      steps: ["Choose one style card and clap the displayed beat groups.", "Read Comp first and Phrase job; try each without adding extra notes.", "Press Use this pulse, then Open Song Map to choose the tune's harmony."],
      done: "The pulse remains recognizable when you play only muted accents or one repeated note.",
      why: "Separating time from pitch lets you diagnose whether a phrase feels wrong because of its rhythm, harmony, or melodic language.",
      terms: [["Meter", "How beats are counted in a repeating bar."], ["Grouped beats", "The smaller accent groups you feel inside the meter."], ["Phrase job", "What the melody should do rhythmically, such as lean, answer, or leave space."]],
      targetId: "styleExplorer"
    },
    video: {
      purpose: "Turn a video into one usable lesson",
      answer: "Loop only a few seconds, slow them down, and identify one physical or musical event.",
      result: "The goal is not to watch more video; it is to observe one move and reproduce it from memory.",
      steps: ["Choose one public lesson and move the playhead to the beginning of the useful moment.", "Press Set A, move to the end, press Set B, and choose a slower Speed.", "Play the loop three times, stop the video, then name and reproduce the idea yourself."],
      done: "You can perform and explain the small event without replaying the video.",
      why: "Short deliberate loops keep attention on timing, fingering, articulation, or harmonic destination instead of passive watching.",
      terms: [["A–B loop", "A selected start point A and end point B that repeat."], ["Playhead", "The current time position in the video."], ["Articulation", "How a note begins, connects, bends, slides, or ends."]],
      targetId: "videoStudy"
    },
    examples: {
      purpose: "Turn a named idea into something playable",
      answer: "Choose a source-backed concept, then practise the exact notes, timing, listening goal, and pass test shown for your current key and dromos.",
      result: "Every entry separates what the research actually supports from the new Dromos exercise built from it.",
      steps: ["Choose Key and Scale / dromos, then select one category and example.", "Read What the source supports before following the numbered Use it now steps.", "Press Hear the note path, perform the drill, and use its Pass when test before opening it in Solo."],
      done: "You can demonstrate the idea on your instrument and explain both its musical purpose and its evidence boundary.",
      why: "A famous name is not an instruction. Concrete notes, timing, listening criteria, and honest attribution turn inspiration into repeatable practice without inventing a player's lick.",
      terms: [["Tactical example", "A playable sequence of actions with specific notes or functions and a success test."], ["Source-bounded", "The app states exactly what the source supports and labels the generated drill as an adaptation, not a transcription."], ["Note path", "A pitch-only preview; articulation and groove still come from your hands and the selected exercise."]],
      targetId: "tacticalExamples"
    },
    analyze: {
      purpose: "Explain music you are studying",
      answer: "Enter a chord map or MusicXML score you own, then turn the analysis into one specific practice decision.",
      result: "The analyzer explains written harmony and notes; it does not claim to transcribe recordings or judge every outside note as wrong.",
      steps: ["Choose Home and dromos, then type chord symbols such as Dm Gm A7 Dm—or import MusicXML with chord symbols.", "Optionally type each chord followed by its melody notes after a colon.", "Press Analyze chord map, read the strong targets, and take one recommendation to Triads or Solo."],
      done: "You can state the home, each chord's function, and one strong target note for the next practice pass.",
      why: "Analysis is useful when it reduces a real passage to an audible question you can test, not when it produces labels without practice.",
      terms: [["MusicXML", "A notation-file format exported by many score-writing apps; it is not a PDF or audio file."], ["Chord symbol", "A short name such as Dm or A7."], ["Outside note", "A note outside the selected scale or chord; it may still work as intentional tension or approach."]],
      targetId: "analysisChords"
    },
    concepts: {
      purpose: "Diagnose the real musical problem",
      answer: "Decide whether the weak layer is time, harmony, fretboard route, hearing, or touch—then practise only that layer.",
      result: "The concept pyramid prevents every problem from becoming another scale exercise.",
      steps: ["Read the top answer of each concept card before opening its detail.", "Choose the one layer that most clearly breaks in your playing.", "Do its smallest drill, then return to the original phrase and listen for one improvement."],
      done: "You can name the cause of the problem and test it with a smaller exercise.",
      why: "Separating causes makes practice faster: timing is not repaired by more note choices, and unclear harmony is not repaired by playing faster.",
      terms: [["Pyramid", "The main answer comes first; supporting reasons and details follow underneath."], ["Layer", "One part of playing, such as time, harmony, route, or articulation."], ["Smallest drill", "The least complicated version that still tests the problem."]],
      targetId: "conceptPyramid"
    },
    coach: {
      purpose: "Get one precise next exercise",
      answer: "Ask the coach one concrete question about the music you selected, then open only the recommended drill that matches your ear.",
      result: "The coach can use your current map and practice history, but it is advice—not the source of truth for a score or recording.",
      steps: ["Choose a suggested question or type one problem in the Ask the coach box.", "Read the privacy choice, then press Ask coach.", "Read the answer first; open its exercise only if the explanation matches what you hear."],
      done: "You leave with one exercise, one reason for it, and one condition for stopping.",
      why: "Specific questions produce useful coaching. Your ear, the written score, and documented musical evidence remain the final check.",
      terms: [["Practice context", "Your selected key, dromos, progression, instrument, and recent local results."], ["Recommendation", "A suggested next action, not an automatic musical fact."], ["Local history", "Practice information stored separately for this player in this browser."]],
      targetId: "coachQuestion"
    },
    progress: {
      purpose: "Use results to choose the next difficulty",
      answer: "Look for reliable understanding, not just a streak: compare correct answers with total attempts for each player.",
      result: "These profiles and scores are stored on this device and are not password-protected online accounts.",
      steps: ["Find the active player's Colour, Map, and Sing-back totals.", "Choose the lowest reliable area for the next short practice block.", "If accuracy falls, slow down or return to a known home before adding more theory."],
      done: "Your next exercise is based on a specific weak result rather than habit or guesswork.",
      why: "A streak can be motivating, but correct / attempts reveals whether the skill is becoming dependable across multiple questions.",
      terms: [["Profile", "A local player name with separate settings and scores on this browser."], ["Accuracy", "Correct answers divided by total checked attempts."], ["Streak", "Correct answers in a row; it does not replace the accuracy total."]],
      targetId: "progressApp"
    }
  };

  const SOLO_KEYS = { targets: "soloTargets", road: "soloRoad", path: "soloPath", phrase: "soloPhrase", cell: "soloCell" };

  function guideKey(context) {
    const current = context || {};
    if (current.view === "cycle" && current.cycleFocus === "chords") return "cycleComp";
    if (current.view === "ear") return current.earDrill === "map" ? "earMap" : "earColour";
    if (current.view === "solo") return SOLO_KEYS[current.soloSection] || "soloTargets";
    if (current.view === "styles") return current.styleSection === "greek" ? "stylesGreek" : "stylesFoundation";
    return GUIDES[current.view] ? current.view : "cycle";
  }

  function resolve(context) {
    const key = guideKey(context);
    return Object.assign({ key }, GUIDES[key]);
  }

  function selfTest() {
    const results = [];
    const requiredViews = ["today", "cycle", "prog", "chordmap", "ear", "melody", "triads", "solo", "styles", "video", "examples", "analyze", "concepts", "coach", "progress"];
    const missingViews = requiredViews.filter((view) => !resolve({ view }));
    results.push({ name: "every workspace resolves to a guide", pass: missingViews.length === 0, got: missingViews.join(", "), want: "" });
    const incomplete = Object.entries(GUIDES).filter(([, guide]) => !guide.answer || !guide.result || guide.steps.length !== 3 || !guide.done || !guide.why || !guide.targetId || guide.terms.length < 2).map(([key]) => key);
    results.push({ name: "every guide has the full answer-first pyramid", pass: incomplete.length === 0, got: incomplete.join(", "), want: "" });
    const subviews = ["targets", "road", "path", "phrase", "cell"].map((soloSection) => resolve({ view: "solo", soloSection }).key);
    results.push({ name: "every Solo activity has its own guide", pass: new Set(subviews).size === 5, got: subviews.join(", "), want: "five distinct guides" });
    return { ok: results.every((result) => result.pass), results };
  }

  window.PageGuides = { GUIDES, guideKey, resolve, selfTest };
})();
