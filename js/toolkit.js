/* toolkit.js — the Soloist Toolkit registry (FR-58).
 * Three MECE pillars, each answering one question a soloist actually faces:
 *   LAND  — where do phrases resolve?
 *   MOVE  — how does the line travel between landings without stalling?
 *   SPEAK — what turns correct notes into a statement?
 * Pure data + selfTest, no DOM. Every tool carries its provenance: the
 * research finding it stands on, and an import label — "greek-core" comes
 * from documented Greek practice (the Papasolomontos thesis on Chiotis's
 * taximia, Karantinis's teaching, Pennanen), "labeled-import" transfers from
 * another tradition and says so, "universal" is genre-neutral craft.
 * Pass tests are SELF-SCORED: the app has no microphone and does not pretend
 * to hear you (same rule that keeps unlock-gating out of the Changes Gym).
 */
(function () {
  "use strict";

  const PILLARS = [
    { id: "land", name: "Land", question: "Where do I land?" },
    { id: "move", name: "Move", question: "How do I move between landings?" },
    { id: "speak", name: "Speak", question: "How do I make it speak?" }
  ];

  // choreo: how the Solo map behaves while the tool is active.
  //   focus     — which landing-target lens drives the rings (existing lenses)
  //   phases    — labelled phrase-arc segments shown above the timing matrix
  //   zoneSweep — highlight lower/upper tetrachord zones per phase
  //   groupGrid — emphasise the Greek pulse's group onsets as landing beats
  // modeGate: tool only offered in these dromoi (absent = all).
  const TOOLS = [
    // ================= LAND =================
    {
      id: "arrivals", pillar: "land", name: "Arrivals",
      importLabel: "greek-core",
      logic: "You know the target — the chord's 3rd. Mastery is HOW you get there. Chiotis's documented kit gives four idiomatic arrivals: a plain accented penia, a ghost-slide from an indeterminate pitch up into the note, a tremolo hold that fills the landing with 16ths or 32nds, and a sweep that rakes adjacent courses to finish on it. Blues pedagogy teaches the same idea as direct hit, bend, or vibrato — the concept is universal; these four executions are the Greek voice.",
      exercise: "One two-chord loop, four passes. Land every chord's 3rd with the same arrival all pass: 1 plain penia, 2 ghost-slide in, 3 tremolo hold, 4 sweep arrival. The map names the finish due and burns the landing note.",
      pass: "Self-score: all four passes land the right pitch, and a listener could name which arrival you used without being told.",
      origin: "Papasolomontos 2017 (TEI Epirus): Chiotis's transcribed technique kit — tremolo, slide, sweep, penia.",
      choreo: { focus: "third", arrivalBadges: true }
    },
    {
      id: "exit-map", pillar: "land", name: "Dromos Exit Map",
      importLabel: "greek-core",
      logic: "Mid-phrase you may land anywhere that sounds good. The LAST landing of a section is different: each dromos characteristically closes on a short list of chords — its legal exits — and the Greek reference books teach scale and exits as one unit. Free landings, disciplined endings.",
      exercise: "Loop the progression. Improvise freely, but every 8-bar section must close on a tone of the current dromos's cadence chords (the app shows them in the side rail). Mid-phrase landings stay free.",
      pass: "Self-score: three consecutive section endings on exit-chord tones, no accidental endings elsewhere.",
      origin: "Pagiatis-style per-dromos chord pairing (Field Guide §2); app progression bank cadence groups.",
      choreo: { focus: "triad", exitRail: true }
    },
    {
      id: "cadence-ramp", pillar: "land", name: "Cadence Ramp",
      importLabel: "greek-core",
      modeGate: ["major", "harmonicMinor"],
      logic: "Chiotis's major/minor taximia are a four-phrase arc over I–IV–V–I: phrases 1–3 land AWAY from home, in IV and V territory, and phrase 4 walks through the diminished VII colour into V before the perfect cadence onto the tonic. This is documented for his major/minor taximia specifically — his dromos-based taximia think horizontally instead, which is what the Seyir Arc trains.",
      exercise: "Four phrases over the loop, one per pass of the phrase meter. Do not land on the tonic in phrases 1–3 (the meter reminds you). In phrase 4, touch a VII-colour tone (the map shimmers them), then close on the tonic on a strong beat.",
      pass: "Self-score: no premature tonic landings, phrase 4 passed through the VII colour, final note is the tonic on the beat.",
      origin: "Papasolomontos 2017: all six major/minor taximia share the I–IV–V–I arc with inserted VII before the cadence.",
      choreo: { focus: "third", phases: ["State", "Away", "Build", "Cadence"], viiShimmer: true }
    },
    {
      id: "seyir-arc", pillar: "land", name: "Seyir Arc",
      importLabel: "greek-core",
      logic: "A dromos is a road, not a frozen scale: establish the tonic zone, climb into the upper tetrachord, sit on a resting tone and let it argue with home, then descend and close on the tonic (the karar). Which tone rests best varies by dromos and by song — let the recordings you love tell you; the arc itself is the documented shape of the taksim tradition.",
      exercise: "Three phases on the phrase meter, over the drone. Phase 1: phrases inside the lower tetrachord zone (the map brightens it). Phase 2: climb — upper zone brightens; choose your resting tone and lean on it. Phase 3: descend and close on the tonic.",
      pass: "Self-score: each phase stayed in its zone, the resting tone was audible as a destination, the final note is the tonic.",
      origin: "Taksim form literature (intro–development–close); Field Guide §11; zone split = the app's tetrachord road.",
      choreo: { focus: "third", phases: ["Tonic zone", "Climb & rest", "Descend home"], zoneSweep: true }
    },
    {
      id: "group-grid", pillar: "land", name: "Group Landing Grid",
      importLabel: "greek-core",
      logic: "Greek meters are groups of 2s and 3s, and each group's first beat is a doorway. Kalamatianos is 3+2+2, zeibekiko 2+2+2+3: landing your target on a group onset locks the line to the dance; landing inside a group floats it. Same targets, new floor — this re-applies every landing tool to the pulse you actually play over.",
      exercise: "Continuous eighths over the active Greek pulse. Chorus 1: land targets only on group onsets (the matrix lights them ahead of time). Chorus 2: land on the LAST group's onset only — the long group in zeibekiko. Feel the difference in weight.",
      pass: "Self-score: nine of ten landings on the prescribed group onsets across one chorus.",
      origin: "The app's own pulse definitions (styles.js beat groups); rhythm research in Field Guide §10.",
      choreo: { focus: "third", groupGrid: true }
    },

    // ================= MOVE =================
    {
      id: "formula-bank", pillar: "move", name: "Formula Bank",
      importLabel: "greek-core",
      logic: "The cafe players did not invent from nothing: the tradition recombined stock phrases everyone shared, and execution mattered more than novelty (Pennanen documents the practice, not the phrases). The starter deck here is app-derived — openers, movers and cadences built from this trainer's own routes and the documented Chiotis cadence shape — and says so. Swap in real phrases from recordings as you steal them; the bank is a rack, not a canon.",
      exercise: "The app deals one opener, two movers and one cadence for the active dromos. Chain them into one continuous line over the loop. Swap one card, run it again. Then replace a dealt card with a phrase you stole from a recording.",
      pass: "Self-score: the chain plays with no gap longer than a beat, and the cadence card ends on the tonic.",
      origin: "Pennanen (stock-formula recombination as the tradition's method); deck content: app-derived, disclosed.",
      choreo: { focus: "third", formulaCards: true }
    },
    {
      id: "motif-ladder", pillar: "move", name: "Motif Ladder",
      importLabel: "greek-core",
      logic: "Chiotis built entire taximia from one cell: state it over the I, restate it from the IV, vary it over the V, resolve — all ten analysed taximia work by this mimisis. One idea, moved, IS the solo. Level 2 borrows the Bulgarian kolyano discipline (a labeled import): chain cells with NO rest, each new cell opening with the previous cell's closing motif — the no-breath version that makes lines continuous.",
      exercise: "Level 1: make a 3–6 note cell over the I. Restate it verbatim from the IV's landing tone, vary it over the V, resolve home (the map ghosts the shape at each new degree before you play it). Level 2: chain six cells without a gap, each opening with the previous one's tail.",
      pass: "Self-score L1: the cell's rhythm survives every transposition. L2: an unbroken six-cell chain, each link audibly sharing its opening with the last link's close.",
      origin: "Papasolomontos 2017 (mimisis in 10/10 taximia); level 2: Bulgarian kolyano chaining, labeled import.",
      choreo: { focus: "third", phases: ["State on I", "Restate on IV", "Vary on V", "Resolve"] }
    },
    {
      id: "chromatic-recolor", pillar: "move", name: "Chromatic Recolor",
      importLabel: "labeled-import",
      logic: "Any whole step between two landings can take the chromatic note between them on a weak beat, and a minor tetrachord can widen into the Hijaz augmented 2nd — the historical Rom/makam colouring move. Passing tones are seasoning for the journey, never the destination: they must not land.",
      exercise: "Descend 5–4–3–2–1 to the tonic. Pass 1: diatonic. Pass 2: insert the chromatic between 4 and 3 on the weak half-beat. Pass 3: recolor the tetrachord to Hijaz — the side rail spells the insertion in your key — and land clean.",
      pass: "Self-score: no passing tone falls on a strong beat, and all three versions arrive on the tonic on time.",
      origin: "Makam/Rom chromatic-passing practice (research lens: Balkan continuity); labeled as an import.",
      choreo: { focus: "third", chromaticRail: true }
    },
    {
      id: "shadow-thirds", pillar: "move", name: "Thirds & Sixths Shadow",
      importLabel: "greek-core",
      logic: "Chiotis's documented escalation: play the phrase single-line, then repeat it doubled in parallel 3rds or 6ths inside the dromos. Single first, harmonised second — the doubling is an intensity step, not a default. On bouzouki the parallel 3rd is the classic two-course sound.",
      exercise: "Play a four-note phrase alone. Replay it doubled: the side rail pairs every dromos tone with its diatonic 3rd, so the second voice is under your eyes, not in your imagination.",
      pass: "Self-score: both voices stay inside the dromos and stay rhythm-locked for the whole phrase.",
      origin: "Papasolomontos 2017: 'Anoixe kai metaniosa' phrase analysis — second voice in 6ths, then parallel 3rds on the dominant.",
      choreo: { focus: "third", thirdPairsRail: true }
    },

    // ================= SPEAK =================
    {
      id: "anasa-gate", pillar: "speak", name: "Anasa Gate",
      importLabel: "greek-core",
      logic: "Karantinis taught it plainly: for a taximi to mean something the phrases must be separated by a breath — the anasa — so YOU control where the emphasis falls. The note after the breath carries the weight. Silence is not the absence of playing; it is a placed event.",
      exercise: "Free-time solo over the drone. A breath cue pulses every six seconds as a pacing reminder — a visual cue, not a microphone judgement. Aim the first note after each breath at a landing tone.",
      pass: "Self-score a 60-second take: at least four real breaths, and at least three of the post-breath notes on landing tones.",
      origin: "Karantinis, Nicosia seminar 6/10/2007 (cited in Papasolomontos); Tsertos 2011 on pauses in taksim form.",
      choreo: { focus: "third", breathCue: true }
    },
    {
      id: "melisma-bank", pillar: "speak", name: "Melisma & Taachta",
      importLabel: "greek-core",
      logic: "The tradition splits decoration in two: ornaments dress a single note (the quiet taachta ghost tone, mordents, entry glissandi), melismas connect notes with a moving figure. The taxonomy comes from Greek folk clarinet pedagogy (Mazaraki) adapted to a plucked, fretted course — ghost notes and glissandi behave differently here, and honest practice means adapting, not pretending it is native bouzouki doctrine.",
      exercise: "One landing phrase, three ways: plain; with a quiet ghost tone above the landing note; preceded by a short melisma descending into it. Same skeleton every time — the decoration must never move the bones.",
      pass: "Self-score: all three renditions share identical skeleton notes, ornament only at its prescribed spot.",
      origin: "Mazaraki's ornament/melisma taxonomy (Greek folk clarinet), disclosed as a cross-instrument adaptation.",
      choreo: { focus: "sweet" }
    },
    {
      id: "note-budget", pillar: "speak", name: "Note Budget",
      importLabel: "greek-core",
      logic: "The standing insider critique of virtuosos: he ripped out a thousand notes and said nothing. Meaning lives in a few placed notes. If your line cannot survive a hard budget, the extra notes were hiding the line, not serving it.",
      exercise: "Improvise the same eight bars twice: once free, once under a cap of twelve note onsets. The budgeted take must still hit every landing target the active lens shows.",
      pass: "Self-score: the budgeted take stayed at or under twelve onsets AND hit every landing target.",
      origin: "Documented performance-culture critique (research lens: phrasing); the budget mechanic is universal craft.",
      choreo: { focus: "third" }
    },
    {
      id: "sing-first", pillar: "speak", name: "Sing-Then-Play",
      importLabel: "universal",
      logic: "Lines that were sung first come out shaped like speech, with breaths and emphasis built in — and singing first is how the modal traditions actually taught. The measured evidence is honest but modest: singing-first training clearly improves sung melody accuracy and confidence; gains in instrumental improvisation trend positive without being conclusive. It costs nothing and stacks with every other tool.",
      exercise: "Hum a two-bar phrase over the drone. Reproduce it on the instrument. Four rounds; a round only counts if it was sung first.",
      pass: "Self-score: the played contour matches the sung contour in at least three of four rounds.",
      origin: "Makam pedagogy (voice-first imitation); Calhoun 2022 study, claims scoped to what it found.",
      choreo: { focus: "third" }
    },
    {
      id: "taximi-intro", pillar: "speak", name: "Taximi Intro",
      importLabel: "greek-core",
      logic: "The taximi's original job is announcement: a free-rhythm prelude that declares the dromos before the song begins. It is the idiom's native capstone — every pillar lands here: seyir shape, placed breaths, finished landings, and a motif the song can inherit.",
      exercise: "Forty-five seconds free over the drone: touch the dromos's identity tones, visit your resting tone, breathe between phrases, close on the tonic. Then bring the loop in and open your first metered phrase with a motif from the taximi.",
      pass: "Self-score: the take declares the dromos unmistakably, closes on the tonic, and the song's first phrase shares a motif with it.",
      origin: "Magrini (taximia set the dromos of the song); Papasolomontos arc analyses; Field Guide §11.",
      choreo: { focus: "third", phases: ["Declare", "Rest & argue", "Close & hand off"], zoneSweep: true, breathCue: true }
    }
  ];

  function byPillar(pillarId) { return TOOLS.filter((tool) => tool.pillar === pillarId); }
  function byId(id) { return TOOLS.find((tool) => tool.id === id) || null; }
  function availableTools(pillarId, modeId) {
    return byPillar(pillarId).filter((tool) => !tool.modeGate || tool.modeGate.includes(modeId));
  }

  // The recommended path — an order, not a lock (no detection, no gating).
  const PROGRESSION = ["arrivals", "exit-map", "group-grid", "formula-bank", "motif-ladder", "anasa-gate", "note-budget", "cadence-ramp", "seyir-arc", "chromatic-recolor", "shadow-thirds", "melisma-bank", "sing-first", "taximi-intro"];

  function selfTest() {
    const results = [];
    const add = (name, pass) => results.push({ name, pass });
    const ids = TOOLS.map((tool) => tool.id);
    add("tool ids are unique", new Set(ids).size === TOOLS.length);
    add("exactly three pillars", PILLARS.length === 3);
    add("every tool belongs to a real pillar", TOOLS.every((tool) => PILLARS.some((p) => p.id === tool.pillar)));
    add("every pillar has at least four tools", PILLARS.every((p) => byPillar(p.id).length >= 4));
    add("every tool carries logic, exercise, pass test and origin",
      TOOLS.every((tool) => [tool.logic, tool.exercise, tool.pass, tool.origin].every((s) => typeof s === "string" && s.length > 30)));
    add("every tool declares an honest import label",
      TOOLS.every((tool) => ["greek-core", "labeled-import", "universal"].includes(tool.importLabel)));
    add("greek-core forms the spine of every pillar",
      PILLARS.every((p) => byPillar(p.id).some((tool) => tool.importLabel === "greek-core")));
    add("no pass test pretends the app can hear you",
      TOOLS.every((tool) => /Self-score/.test(tool.pass)));
    add("the progression covers every tool exactly once",
      PROGRESSION.length === TOOLS.length && new Set(PROGRESSION).size === TOOLS.length && PROGRESSION.every((id) => byId(id)));
    add("mode-gated tools name real dromoi",
      TOOLS.every((tool) => !tool.modeGate || tool.modeGate.every((m) => ["major", "minor", "harmonicMinor", "ousak", "hijaz"].includes(m))));
    add("merged tools stayed merged: no separate finishes or kolyano entries",
      !byId("landing-finishes") && !byId("kolyano-chain") && !byId("three-ways-in"));
    return { ok: results.every((r) => r.pass), results };
  }

  window.SoloToolkit = { PILLARS, TOOLS, PROGRESSION, byPillar, byId, availableTools, selfTest };
})();
