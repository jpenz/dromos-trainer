# Curriculum research notes

Research completed 2026-08-11. These sources guide product decisions; they are
not content licensed for copying into the app. Dromos Trainer must use original
explanations, original exercises, and user-provided song maps.

## What the research changes

The application should not become a larger scale diagram. Its central model needs
four layers, disclosed one at a time:

1. **Function:** hear and name what the harmony is doing.
2. **Landmarks:** see a small local triad plus the current/next landing tones—not
   merely a seven-note pattern.
3. **Route:** connect those targets through a pentatonic frame, a chromatic approach,
   a slide, or a short dromos-specific cell.
4. **Phrase and pulse:** place that route in a sung-length phrase and a real dance
   meter, leaving space for accompaniment and dancers.

This is an inference from the sources below, especially the overlap between
voice-leading/comping materials, audiation research, and Greek teaching that treats
rhythm, dromos, and improvisation as inseparable. It is deliberately *not* a claim
that one Western guitarist's vocabulary should be transplanted into Greek music.

## Player-thinking principles to encode

### 1. See small movable landmarks, then connect them

Great melodic improvisers do not need to recite a full scale to make a phrase; they
orient around a compact object with a strong sound: a triad, a dyad, a chord third,
or a memorised melodic turn. The guitarist’s equivalent of a mental “post-it note”
should be a three-string triad and one nearby target, not a CAGED diagram with no
harmonic job.

**Product consequence:** target map first shows a local triad, current target and
next target in a narrow decision window. Full-neck pentatonic and scale overlays
remain optional context—not the default lesson.

### 2. Let melody phrase the changes

Jerry Garcia described improvisation as making music in the moment rather than
executing a fixed reproduction; analyses of his playing consistently centre melody,
change-awareness, and returning to chord tones. That transfers well at the level of
method: begin from the song’s melodic rhythm, make a short answer, and resolve it
when the harmony moves. It does **not** mean importing Grateful Dead licks into
rebetiko or nisiotika.

**Product consequence:** add `hear → sing → play` call/response prompts and a
phrase recorder/metronome only after the target is heard. Score timing of resolution
and target choice, not note quantity or speed.

### 3. Greek dromos is melodic behaviour, not a Western scale label

Scholarly rebetiko material describes dromoi/makam as intervallic structure *and*
melodic development. Mainland laouto instruction explicitly puts rhythmology,
dromoi, accompaniment, right hand, and taksimi in the same intermediate curriculum.
The existing note formulas are a useful equal-tempered foundation, but no longer a
complete teaching model.

**Product consequence:** each dromos needs a `seira` library: lower/upper
tetrachord, characteristic arrivals, directional tendency, ornament, and short
call/answer phrases. It also needs meter-specific backing and comping tasks for
zeibekiko, hasapiko, syrtos, kalamatianos, and nisiotika—not just a generic 4/4
transport.

### 4. Train recall and diagnose errors, not just repetition

Audiation research defines the core skill as thinking music with understanding.
Practice-science guidance stresses targeted problem solving, correct repetitions,
strategic breaks, and interleaving rather than comfortable run-throughs.

**Product consequence:** alternate keys, positions, and recognition prompts after
initial blocking; use a local practice log to schedule review. Ask a player to tag
the failure (`didn't hear change`, `couldn't find triad`, `missed target`, `rhythm`,
`right hand`) before suggesting the next micro-drill.

## Books and methods worth using alongside the app

| Resource | Why it belongs beside Dromos Trainer |
|---|---|
| [Greek Bouzouki Method — Greg Herriges](https://www.halleonard.com/product/viewproduct.action?digitalbook=true&itemid=291974) | A broad entry point with single-note work, chords, alternate picking, ornaments, modes, position playing, tremolo, Greek time signatures, and video. Good technique/repertoire complement; the trainer supplies adaptive harmony mapping. |
| [How to Play Bouzouki — Charalampos Pagiatis](https://fagottobooks.gr/en/16-mpouzouki1.html) | Bilingual, tab/scheme-led method focused on systematic technique and instrument understanding. |
| [Greek Folk Scales and Their Practical Approach — Charalampos Pagiatis](https://fagottobooks.gr/en/60-oi-laikoi-dromoi-kai-i-praktiki-efarmogi-tous.html) | Directly validates the project’s direction: dromoi, instrument fingerings, chord roles/progressions, authentic folk-rhythm exercises, and characteristic tunes. |
| [Chords for Jazz Guitar — Charlton Johnson](https://www.halleonard.com/product/695706/chords-for-jazz-guitarchords-for-jazz-guitar) | Comping, chord melody/soloing, and voice-leading reference. Use its harmonic logic as an instrument-agnostic tool, then adapt the exercise vocabulary to Greek repertoire. |
| [Voice Leading — David Huron](https://www.penguinrandomhouse.com/books/657442/voice-leading-by-david-huron/) | The perceptual/cognitive foundation for why close motion and clear inner voices matter—useful for deciding which displayed voicing is most intelligible. |
| [Preparatory Audiation, Audiation, and Music Learning Theory — Edwin E. Gordon](https://giamusic.com/resource/preparatory-audiation-audiation-and-music-learning-theory-book-g5726) | Framework for the `hear → sing → play → label` loop, whole-part-whole sequencing, and progressing from sound to symbol. |
| [Learn Faster, Perform Better — Molly Gebrian](https://academic.oup.com/book/57630) | Practice-science source for targeted repetition, feedback, spaced sessions, breaks, and interleaving—the future practice log should embody these, not just count streaks. |

## Source-specific product evidence

- The [Greek Bouzouki Method](https://www.halleonard.com/product/viewproduct.action?digitalbook=true&itemid=291974)
  groups picking, ornaments, modes, position playing, tremolo, and Greek time
  signatures. That is evidence against treating pitch mapping as the whole course.
- Pagiatis’s [Greek folk-scales book](https://fagottobooks.gr/en/60-oi-laikoi-dromoi-kai-i-praktiki-efarmogi-tous.html)
  deliberately connects scale diagrams, chord choices/progressions, rhythms, and
  characteristic tunes—exactly the missing bridge from the current app’s map to
  repertoire.
- In the [mainland laouto curriculum](https://mousikaktismata.gr/en/seminar/laouto-nikos-sidiropoulos/),
  accompaniment, rhythmology, modes, right-hand development, and taksimi are taught
  together. Laouto cannot be a reduced-string guitar view.
- The [rebetiko/dromos research](https://www.atiner.gr/papers/MDT2016-1936.pdf)
  explains that melodic development and dance rhythm belong to the dromos context;
  a future Phrase Lab and rhythm engine are core curriculum, not nice-to-haves.
- [Gordon’s overview](https://giamusic.com/resource/preparatory-audiation-audiation-and-music-learning-theory-book-g5726)
  describes audiation as giving thought and meaning to music; this supports hiding
  the answer before the player sings or predicts it.
- [Gebrian’s practice guidance](https://academic.oup.com/book/57630/chapter-abstract/469303960)
  supports short, precisely targeted corrective work over mindless repetitions.
- The published [Garcia interview](https://deadstudies.org/wp-content/uploads/2022/04/Proceedings_v1_Bailey.pdf)
  is useful as a reminder that improvisation must remain responsive and alive. The
  app should teach decision-making, not reproduce a celebrity’s licks.

## Design commitments now

1. Keep the current **Target Map** as the harmonic bridge from pentatonic to triad.
2. Make **Phrase Lab** (small `seira`, resolution, call/response) the next soloing
   feature—not more static overlays.
3. Make **Rhythm & Comping** (meter, right-hand pattern, sparse chord response) the
   next instrument-specific feature, especially for mainland laouto.
4. Make **Song Map** user-entered and function-first: players transcribe a progression
   by ear, then reveal shapes/targets. Do not scrape or redistribute copyrighted songs.
5. Use local, private practice history only; no account is required to benefit.
