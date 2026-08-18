/* tactical-examples.js — source-bounded, playable examples for named ideas.
 *
 * The source establishes the musical observation. Dromos Trainer authors the
 * exercise that follows from it. These are deliberately not transcriptions or
 * claims that a named musician played the generated notes in the selected key.
 * Pure data/builders, no DOM. Exposes window.TacticalExamples.
 */
(function () {
  "use strict";

  const M = window.Modes;

  const SOURCES = {
    chiotis: {
      name: "G. Papasolomontos · Chiotis taximi analysis (2017)",
      href: "https://olympias.lib.uoi.gr/jspui/handle/teiep/8069"
    },
    pennanen: {
      name: "R. P. Pennanen · The Poetics of the Little Finger (2024)",
      href: "https://taju.uniarts.fi/items/5897add1-8de2-482f-be1d-6bfe70ca6831"
    },
    pagiatis: {
      name: "C. Pagiatis · Greek Folk Scales and Their Practical Approach",
      href: "https://fagottobooks.gr/en/60-oi-laikoi-dromoi-kai-i-praktiki-efarmogi-tous.html"
    },
    ordoulidis: {
      name: "N. Ordoulidis · The Recording Career of Vasilis Tsitsanis (2012)",
      href: "https://etheses.whiterose.ac.uk/id/eprint/3230/1/Ordoulidis_Final.Thesis.pdf"
    },
    mazaraki: {
      name: "D. Mazaraki · The Folk Clarinet in Greece (1959)",
      href: "https://anemi.lib.uoc.gr/metadata/f/b/4/metadata-01-0000494.tkl"
    },
    calhoun: {
      name: "I. Calhoun · Systematic vocalization study (2022)",
      href: "https://eric.ed.gov/?id=EJ1367821"
    },
    dromos: { name: "Dromos Trainer exercise design", href: "" }
  };

  const CATEGORIES = [
    { id: "targets", name: "Targets & cadences", question: "Where should the line arrive?" },
    { id: "phrases", name: "Build a phrase", question: "How does one idea become a solo?" },
    { id: "time", name: "Touch, time & breath", question: "How should the phrase speak?" },
    { id: "neck", name: "Neck organization", question: "Where should the hand travel?" },
    { id: "form", name: "Dromos & form", question: "How does the whole statement unfold?" }
  ];

  const BOUNDARY = "Original Dromos Trainer drill based on the documented idea—not a transcription, quotation, or claim that the named musician played these generated notes.";
  const mod = (value, by) => ((value % by) + by) % by;

  function audible(note, midi) {
    let placed = Number.isFinite(midi) ? midi : 60 + mod(note.pc - 60, 12);
    while (mod(placed, 12) !== note.pc) placed++;
    return Object.assign({}, note, {
      midi: placed,
      freq: 440 * Math.pow(2, (placed - 69) / 12)
    });
  }

  function contextFor(options) {
    const tonic = options && M.TONICS.includes(options.tonic) ? options.tonic : "D";
    const modeId = options && M.MODES[options.modeId] ? options.modeId : "minor";
    const bank = M.PROGRESSIONS[modeId];
    const progId = options && bank.some((item) => item.id === options.progId) ? options.progId : bank[0].id;
    const progression = M.buildProgression(tonic, modeId, progId);
    const scale = M.scaleOf(tonic, modeId);
    const tonicMidi = 60 + mod(scale[0].pc - 60, 12);
    const degree = (index, octave) => audible(scale[mod(index, 7)], tonicMidi + scale[mod(index, 7)].off + (octave || 0) * 12);
    const line = (indices) => indices.map((index) => degree(index));
    const third = (chord) => chord.notes.find((note) => note.role === "3" || note.role === "b3") || chord.notes[0];
    return {
      tonic, modeId, mode: M.MODES[modeId], progId, progression, scale, degree, line, third,
      instrument: options && options.instrument || "selected instrument",
      pulse: options && options.pulse || "the selected Greek pulse"
    };
  }

  const TEMPLATES = [
    {
      id: "chiotis-arrivals", toolId: "arrivals", category: "targets", title: "Four ways into the chord 3rd", figure: "Manolis Chiotis", source: SOURCES.chiotis,
      evidence: "The analysis identifies penia, slide, tremolo and sweep among Chiotis's recurring playing techniques.",
      build(ctx) {
        const chord = ctx.progression.chords[0];
        const target = ctx.third(chord);
        const lower = audible({ pc: mod(target.pc - 1, 12), name: `lower neighbor of ${target.name}` }, target.midi - 1);
        return {
          setup: `${ctx.instrument} · ${ctx.tonic} ${ctx.mode.name} · first chord ${chord.degreeLabel} ${chord.symbol}`,
          noteLine: `Target: ${target.name} · ${target.roleLabel} of ${chord.symbol}`,
          steps: [
            `Play ${target.name} once with a plain, accented penia. Stop cleanly.`,
            `Approach from one fret below: ${lower.name} → ${target.name}; the first pitch is quiet and the arrival is clear.`,
            `Hold ${target.name} with controlled tremolo for one beat without changing its pitch.`,
            `Rake adjacent courses with one sweep and make ${target.name} the final, loudest note.`
          ],
          listen: "The destination must remain identical while the emotional arrival changes.",
          pass: "A listener can identify all four arrival types, and every version resolves to the same chord 3rd.",
          notes: [lower, audible(target, target.midi), audible(target, target.midi), audible(target, target.midi)]
        };
      }
    },
    {
      id: "pagiatis-exits", toolId: "exit-map", category: "targets", title: "Close the section on a working chord", figure: "Charalampos Pagiatis", source: SOURCES.pagiatis,
      evidence: "Pagiatis's method joins each folk scale to practical instrument fingerings, chords, rhythms and characteristic material.",
      build(ctx) {
        const finalChord = ctx.progression.chords[ctx.progression.chords.length - 1];
        const target = ctx.third(finalChord);
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · ${ctx.progression.prog.label}`,
          noteLine: `Section exit: ${finalChord.degreeLabel} ${finalChord.symbol} · aim for ${target.name} (${target.roleLabel})`,
          steps: [
            `Play freely for seven bars inside ${ctx.tonic} ${ctx.mode.name}.`,
            `In bar 8, reduce the line to two notes and approach ${target.name}.`,
            `Land ${target.name} on the first strong pulse of ${finalChord.symbol}; leave the rest of the beat empty.`
          ],
          listen: "The final chord should become recognizable from the melody before the accompaniment confirms it.",
          pass: "Three consecutive eight-bar endings reach a tone of the displayed final chord without a last-second search.",
          notes: ctx.line([4, 3, 2]).concat([audible(target, target.midi + (target.midi < 60 ? 12 : 0))])
        };
      }
    },
    {
      id: "chiotis-cadence", toolId: "cadence-ramp", category: "targets", title: "Four-phrase I–IV–V–I cadence ramp", figure: "Manolis Chiotis", source: SOURCES.chiotis,
      modeGate: ["major", "harmonicMinor"],
      evidence: "Across the six analyzed major/minor examples, the study reports an I–IV–V–I harmonic cycle and VII-region tension before the final cadence.",
      build(ctx) {
        const isMajor = ctx.modeId === "major";
        const chords = [
          M.buildChord(ctx.tonic, ctx.modeId, 0, isMajor ? "maj" : "min"),
          M.buildChord(ctx.tonic, ctx.modeId, 5, isMajor ? "maj" : "min"),
          M.buildChord(ctx.tonic, ctx.modeId, 7, "dom7"),
          M.buildChord(ctx.tonic, ctx.modeId, 0, isMajor ? "maj" : "min")
        ];
        const targets = chords.map((chord) => ctx.third(chord));
        return {
          setup: `${ctx.tonic} ${isMajor ? "Major" : "Harmonic minor"} · I → IV → V → I`,
          noteLine: `3rds: ${targets.map((note) => note.name).join(" → ")} · leading tone before home: ${ctx.scale[6].name}`,
          steps: [
            `Phrase 1 states the tonic area but ends on ${targets[0].name}, not the tonic root.`,
            `Phrase 2 restates the rhythm and ends on ${targets[1].name}, the 3rd of IV.`,
            `Phrase 3 increases density and ends on ${targets[2].name}, the 3rd of V.`,
            `Phrase 4 touches ${ctx.scale[6].name} (degree 7), then resolves to ${ctx.tonic} on the downbeat.`
          ],
          listen: "Each phrase raises the need for resolution; only the fourth is allowed to sound finished.",
          pass: "The tonic does not arrive early, degree 7 is audible before the end, and the last tonic is exactly on the beat.",
          notes: targets.map((note) => audible(note, note.midi + (note.midi < 60 ? 12 : 0))).concat([ctx.degree(6), ctx.degree(0, 1)])
        };
      }
    },
    {
      id: "grouped-pulse", toolId: "group-grid", category: "time", title: "Land on the group doorway", figure: "Greek pulse practice", source: SOURCES.dromos,
      evidence: "The app's verified style records encode meters as audible groups of twos and threes; this exercise applies chord targeting to those onsets.",
      build(ctx) {
        const target = ctx.third(ctx.progression.chords[0]);
        return {
          setup: `${ctx.pulse} · target ${target.name}`,
          noteLine: `Speak the grouping first; play ${target.name} only at the beginning of each group.`,
          steps: ["Clap and say the displayed group counts twice.", `Mute the strings inside each group and play ${target.name} only on its first beat.`, "Move the same landing to the final group's onset and compare its weight."],
          listen: "A correct pitch placed inside a group floats; the same pitch on the onset locks to the dance.",
          pass: "Nine of ten targets occur on the selected group onsets without losing the spoken count.",
          notes: [audible(target, target.midi + 12), audible(target, target.midi + 12), audible(target, target.midi + 12)]
        };
      }
    },
    {
      id: "phrase-deck", toolId: "formula-bank", category: "phrases", title: "Four-card phrase sentence", figure: "Dromos Trainer synthesis", source: SOURCES.pennanen,
      evidence: "Pennanen supports learning from recordings, performance and memory; the four cards and their exact degree patterns are app-authored scaffolding.",
      build(ctx) {
        const notes = ctx.line([0, 1, 2, 4, 3, 2, 1, 0]);
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · one bar per card`,
          noteLine: `Opener 1–2–3 · mover 5–4 · answer 3–2 · cadence 2–1 = ${notes.map((note) => note.name).join("–")}`,
          steps: ["Play the four cards with a full beat of silence between them.", "Repeat without the gaps but keep each card's first note accented.", "Replace exactly one card with a short phrase learned by ear from a recording you are authorized to study."],
          listen: "Four small units should sound like one sentence with a beginning, travel, answer and full stop.",
          pass: "You can change one card without losing the bar line or the final tonic.",
          notes
        };
      }
    },
    {
      id: "chiotis-mimisis", toolId: "motif-ladder", category: "phrases", title: "State, restate, vary, resolve", figure: "Manolis Chiotis", source: SOURCES.chiotis,
      evidence: "The Chiotis analysis finds imitation in every one of its ten close studies: exact rhythmic/melodic restatement at another pitch, same-pitch repetition, and melodic or rhythmic variation.",
      build(ctx) {
        const first = ctx.line([0, 1, 2, 4]);
        const second = ctx.line([3, 4, 5, 0]).map((note, index) => index === 3 ? ctx.degree(0, 1) : note);
        const varied = ctx.line([4, 3, 4, 2]);
        const close = ctx.line([1, 0]);
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · keep one rhythm across four phrase jobs`,
          noteLine: `Cell: 1–2–3–5 (${first.map((n) => n.name).join("–")})`,
          steps: [
            `State 1–2–3–5: ${first.map((n) => n.name).join("–")}.`,
            `Restate from degree 4 with the same rhythm: ${second.map((n) => n.name).join("–")}.`,
            `Vary the contour over the dominant area: ${varied.map((n) => n.name).join("–")}; keep the rhythm recognizable.`,
            `Resolve 2–1: ${close.map((n) => n.name).join("–")}, then breathe.`
          ],
          listen: "The listener should recognize one idea even when its pitch level or contour changes.",
          pass: "Record four phrases; the rhythm is identifiable in all four and only the last phrase fully closes.",
          notes: first.concat(second, varied, close)
        };
      }
    },
    {
      id: "chromatic-recolor", toolId: "chromatic-recolor", category: "phrases", title: "Diatonic, chromatic, then Hijaz-colored", figure: "Labeled Balkan/makam bridge", source: SOURCES.dromos,
      evidence: "This is a disclosed cross-tradition comparison, not a claim that every Greek style uses one universal chromatic formula.",
      build(ctx) {
        const plain = ctx.line([4, 3, 2, 1, 0]);
        const between = audible({ pc: mod(plain[2].pc + 1, 12), name: `chromatic approach to ${plain[2].name}` }, plain[2].midi + 1);
        const hijaz = M.scaleOf(ctx.tonic, "hijaz");
        const hijazRoot = 60 + mod(hijaz[0].pc - 60, 12);
        const colored = [4, 3, 2, 1, 0].map((index) => audible(hijaz[index], hijazRoot + hijaz[index].off));
        return {
          setup: `${ctx.tonic} · compare the selected road with equal-tempered Hijaz`,
          noteLine: `Plain: ${plain.map((n) => n.name).join("–")} · Hijaz: ${colored.map((n) => n.name).join("–")}`,
          steps: ["Descend 5–4–3–2–1 with only the selected scale.", `Insert ${between.name} on a weak half-beat; do not stop on it.`, `Play the equal-tempered Hijaz version ${colored.map((n) => n.name).join("–")} and name the ♭2–3 gap.`],
          listen: "Passing color should increase motion, never replace the destination.",
          pass: "All altered notes stay off the strong beats and each version reaches the tonic on time.",
          notes: plain.concat([between], plain.slice(2), colored)
        };
      }
    },
    {
      id: "chiotis-double-voice", toolId: "shadow-thirds", category: "phrases", title: "Single line, then parallel voice", figure: "Manolis Chiotis", source: SOURCES.chiotis,
      evidence: "The analysis of Anoixe kai metaniosa documents a second voice in parallel 6ths and later parallel 3rds in the dominant area.",
      build(ctx) {
        const top = ctx.line([2, 3, 4, 2]);
        const lower = [0, 1, 2, 0].map((index) => ctx.degree(index));
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · four-note line`,
          noteLine: `Top: ${top.map((n) => n.name).join("–")} · lower diatonic 3rds: ${lower.map((n) => n.name).join("–")}`,
          steps: [
            `Play the top line alone: ${top.map((n) => n.name).join("–")}.`,
            `Play the lower line alone: ${lower.map((n) => n.name).join("–")}.`,
            "Combine the voices slowly; keep the top voice louder and the rhythm identical.",
            "Return to the single line, then use the doubled version only as the intensity peak."
          ],
          listen: "Hear two synchronized melodies, not a blurred four-note grip sliding around.",
          pass: "Both voices stay in the displayed collection and every pair begins and ends together.",
          notes: top.concat(lower)
        };
      }
    },
    {
      id: "karantinis-anasa", toolId: "anasa-gate", category: "time", title: "Place the breath before the important note", figure: "Manolis Karantinis", source: SOURCES.chiotis,
      evidence: "Papasolomontos cites Karantinis teaching that taximi phrases need anasa—breath—to separate ideas and place expressive emphasis; Tsertos is cited for pauses as a structural taksim feature.",
      build(ctx) {
        const target = ctx.third(ctx.progression.chords[0]);
        const phrase = ctx.line([0, 1, 2]);
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · free time over the home drone`,
          noteLine: `${phrase.map((n) => n.name).join("–")} · two silent counts · ${target.name}`,
          steps: [`Play ${phrase.map((n) => n.name).join("–")} as one short statement.`, "Stop moving both hands and silently count ‘one, two.’", `Enter on ${target.name}, the chord 3rd; let that one note carry more weight than the whole opening.`],
          listen: "The note after silence should sound inevitable and more important, not merely late.",
          pass: "Four phrases contain an intentional breath, and at least three post-breath notes hit a displayed landing tone.",
          notes: phrase.concat([audible(target, target.midi + (target.midi < 60 ? 12 : 0))])
        };
      }
    },
    {
      id: "ornament-melisma", toolId: "melisma-bank", category: "time", title: "Keep the skeleton; change the decoration", figure: "Despoina Mazaraki · cross-instrument adaptation", source: SOURCES.mazaraki,
      evidence: "Mazaraki separates ornaments that emphasize a note from melismatic additions inside the tune; her material concerns Greek folk clarinet, not bouzouki technique.",
      build(ctx) {
        const skeleton = ctx.line([2, 1, 0]);
        const upper = ctx.degree(3);
        return {
          setup: `${ctx.instrument} · ${ctx.tonic} ${ctx.mode.name} · adapt, do not imitate clarinet mechanics`,
          noteLine: `Skeleton: ${skeleton.map((n) => n.name).join("–")} · decorated: ${upper.name}–${skeleton.map((n) => n.name).join("–")}`,
          steps: [`Play the skeleton ${skeleton.map((n) => n.name).join("–")} plainly.`, `Add one quiet, short ${upper.name} before ${skeleton[0].name}; the skeleton notes keep their original beats.`, `Connect into the same landing with a three-note run, then remove it and verify that the phrase still works.`],
          listen: "Decoration changes the surface; the timing and destination of the underlying melody remain audible.",
          pass: "A listener can sing the same three skeleton notes after all three versions.",
          notes: skeleton.concat([upper], skeleton)
        };
      }
    },
    {
      id: "note-budget", toolId: "note-budget", category: "time", title: "Twelve-onset meaning test", figure: "Universal phrasing constraint", source: SOURCES.dromos,
      evidence: "The twelve-note cap is a Dromos practice constraint, not an attributed quotation or a tradition-specific rule.",
      build(ctx) {
        const targets = ctx.progression.chords.map((chord) => ctx.third(chord));
        return {
          setup: `${ctx.progression.prog.label} · eight bars · maximum 12 note starts`,
          noteLine: `Required targets: ${targets.map((note, index) => `${ctx.progression.chords[index].degreeLabel}=${note.name}`).join(" · ")}`,
          steps: ["Play eight bars once with no note limit.", "Repeat with no more than 12 note onsets; rests do not spend the budget.", "Reserve one onset for each displayed chord target and spend the remaining notes only on approaches."],
          listen: "The sparse take should reveal the harmony more clearly than the busy take.",
          pass: "At most 12 onsets, every chord receives its target, and no extra note obscures the next change.",
          notes: targets.map((note) => audible(note, note.midi + (note.midi < 60 ? 12 : 0)))
        };
      }
    },
    {
      id: "sing-play", toolId: "sing-first", category: "time", title: "Sing, match, then relocate", figure: "Systematic vocalization", source: SOURCES.calhoun,
      evidence: "Calhoun found significant gains in sung jazz-melody accuracy and self-efficacy; improvisation gains trended positive but were not conclusive.",
      build(ctx) {
        const notes = ctx.line([0, 2, 1, 4, 2]);
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · any comfortable vocal octave`,
          noteLine: `Contour: 1–3–2–5–3 · ${notes.map((note) => note.name).join("–")}`,
          steps: ["Hear the tonic, look away from the instrument, and sing 1–3–2–5–3 on ‘da.’", "Play the contour and correct only the first note that differs.", "Sing again, then find the same notes in a second playable position."],
          listen: "The instrument should reproduce an already-heard phrase rather than decide what the phrase is.",
          pass: "Three of four played contours match the sung direction and ending note.",
          notes
        };
      }
    },
    {
      id: "pennanen-tactility", category: "neck", title: "Compare horizontal and tiered routes", figure: "Risto Pekka Pennanen", source: SOURCES.pennanen,
      evidence: "Pennanen distinguishes horizontal movement along a course from tiered movement across courses, and stresses that position economy must be balanced against timbre changes on doubled courses.",
      build(ctx) {
        const notes = ctx.line([0, 1, 2, 3, 4]);
        return {
          setup: `${ctx.instrument} · ${ctx.tonic} ${ctx.mode.name} · degrees 1–2–3–4–5`,
          noteLine: `${notes.map((note) => `${note.degree} ${note.name}`).join(" · ")}`,
          steps: ["Route A: play all five degrees mostly along one upper course, accepting one hand shift.", "Route B: play the same pitches across adjacent courses while keeping the hand in one compact position.", "Record both. Choose the route whose tone stays most even; do not automatically choose the route with less motion."],
          listen: "Compare tone color at each string crossing, not just speed or fret distance.",
          pass: "You can play both routes from memory and explain which route preserves timbre better on the selected instrument.",
          notes
        };
      }
    },
    {
      id: "taximi-arc", toolId: "seyir-arc", category: "form", title: "Lower zone, upper argument, return home", figure: "Taximi / taksim form synthesis", source: SOURCES.ordoulidis,
      evidence: "Ordoulidis describes taximi as non-rhythmic improvisation based on the song's dromos; Chiotis analyses show distinct phrase and harmonic arcs rather than a scale run.",
      build(ctx) {
        const low = ctx.line([0, 1, 2, 3]);
        const high = ctx.line([4, 5, 6]).concat([ctx.degree(0, 1)]);
        const home = [ctx.degree(4), ctx.degree(3), ctx.degree(2), ctx.degree(1), ctx.degree(0)];
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · free time over tonic drone`,
          noteLine: `Lower: ${low.map((n) => n.name).join("–")} · upper: ${high.map((n) => n.name).join("–")} · close: ${home.map((n) => n.name).join("–")}`,
          steps: ["Phrase only in degrees 1–4 until the tonic feels established.", "Climb into degrees 5–8, repeat one resting tone, and leave a breath.", "Descend through the two tetrachord zones and finish on the tonic without metered accompaniment."],
          listen: "The dromos should be clear before the highest register; height is development, not identity by itself.",
          pass: "A listener can point to establishment, development and close, and the last pitch is the tonic.",
          notes: low.concat(high, home)
        };
      }
    },
    {
      id: "taximi-intro", toolId: "taximi-intro", category: "form", title: "Hand a taximi motif into the song", figure: "Greek recording practice", source: SOURCES.ordoulidis,
      evidence: "Taximia often appear as non-metered introductions that establish the song's dromos; the source also documents examples in other positions within a recorded form.",
      build(ctx) {
        const identity = ctx.scale.filter((note) => note.isFlavour).map((note) => audible(note));
        const motif = [ctx.degree(0), identity[0] || ctx.degree(1), ctx.degree(2), ctx.degree(0)];
        return {
          setup: `${ctx.tonic} ${ctx.mode.name} · 30–45 seconds free, then ${ctx.progression.prog.label}`,
          noteLine: `Seed motif: ${motif.map((note) => note.name).join("–")}`,
          steps: ["Declare the tonic and at least one displayed identity tone without a beat.", "Develop one four-note motif, add one real breath, and close on the tonic.", "Start the accompaniment and use that same motif in the first metered bar, adjusted only to hit the chord target."],
          listen: "The first song phrase should feel inherited from the introduction, not like a reset to unrelated material.",
          pass: "The free introduction names the dromos, closes home, and its motif is recognizable after the pulse enters.",
          notes: motif.concat(motif)
        };
      }
    }
  ];

  function byId(id) { return TEMPLATES.find((example) => example.id === id) || null; }
  function available(options) {
    const ctx = contextFor(options);
    return TEMPLATES.filter((example) => !example.modeGate || example.modeGate.includes(ctx.modeId))
      .map((example) => Object.assign({}, example, example.build(ctx), { boundary: BOUNDARY }));
  }
  function build(id, options) {
    const example = byId(id);
    if (!example) return null;
    const ctx = contextFor(options);
    if (example.modeGate && !example.modeGate.includes(ctx.modeId)) return null;
    return Object.assign({}, example, example.build(ctx), { boundary: BOUNDARY });
  }

  function selfTest() {
    const results = [];
    const add = (name, pass) => results.push({ name, pass });
    const ids = TEMPLATES.map((example) => example.id);
    add("tactical example ids are unique", new Set(ids).size === ids.length);
    add("every category is used", CATEGORIES.every((category) => TEMPLATES.some((example) => example.category === category.id)));
    add("every named source has a direct link", TEMPLATES.every((example) => example.source.name === SOURCES.dromos.name || /^https:\/\//.test(example.source.href)));
    add("every example separates evidence from the authored drill", TEMPLATES.every((example) => example.evidence.length > 50));
    const built = M.TONICS.flatMap((tonic) => M.MODE_ORDER.flatMap((modeId) => available({ tonic, modeId, instrument: "Test instrument" })));
    add("every available example builds complete tactical instructions", built.every((example) =>
      example.setup && example.noteLine && example.steps.length >= 3 && example.listen && example.pass && example.boundary));
    add("every generated audio note is finite", built.every((example) => example.notes.every((note) => Number.isFinite(note.midi) && Number.isFinite(note.freq))));
    add("named player claims are source-bounded", TEMPLATES.filter((example) => /Chiotis|Karantinis|Pennanen|Pagiatis|Mazaraki|Calhoun|Ordoulidis/.test(`${example.figure} ${example.evidence} ${example.source.name}`))
      .every((example) => example.source.href && example.evidence && BOUNDARY.includes("not a transcription")));
    return { ok: results.every((result) => result.pass), results };
  }

  window.TacticalExamples = { SOURCES, CATEGORIES, TEMPLATES, BOUNDARY, contextFor, byId, available, build, selfTest };
})();
