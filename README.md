# Dromos Trainer

A serious self-teaching trainer for **hearing harmonic movement, mapping it on the
neck, comping, and soloing** in the jazz ii–V–I pivot cycle and Greek *dromoi*
(Major, Minor, Ousak, Hijaz). It turns the same progression into an ear drill, a
fretboard map, a low-movement triad path, and a targeted soloing exercise.

**No install. No build. No runtime dependencies.** Open `index.html`, or host the
folder for an installable/offline-capable browser app on mobile and iPad.

```bash
open index.html
```

## Score study

The **Analyze** area accepts chord maps and chord-aligned note fragments. It can also
read an **uncompressed, partwise MusicXML** (`.musicxml` / `.xml`) score that you choose
locally when it contains written chord symbols. It explains the harmonic map, labels
note roles, gives target-tone routes, and generates a compact chord chart plus tab
for the selected tuning.

It intentionally does not OCR a PDF, transcribe an audio recording, read compressed
`.mxl`, or include a copied repertoire database. Export a score you own to MusicXML
(including harmony symbols) for the reliable, transparent route.

## Sources and rights

The Concepts area includes a linked Trigas reference shelf and complementary bouzouki
methods. These are research pointers and original curriculum connections—not scans,
copied exercises, recordings, or notation. Three short Analyzer starters are taken
only from the user-authorised local study material and identify their source.

---

## The practice path

Use the five-step loop, in order, on one progression and one position before moving
on: **Hear → Map → Comp → Solo → Recall**. Full curriculum intent and roadmap:
[docs/CURRICULUM.md](docs/CURRICULUM.md).

## The practice areas

### 1. Pivot Cycle
A ii–V–I where each `Imaj7` becomes the `iim7` of the next key — lower the 3rd and
7th a half step and you are in a key a whole step down. Six keys, then it closes back
on itself an octave lower.

```
C:   Dm7  →  G7  →  Cmaj7 ┐
                          ├─ Cmaj7 becomes Cm7 …
B♭:  Cm7  →  F7  →  B♭maj7┘
```

At every change **exactly two voices hold and two step down** — the app animates the
moving pair so you can see the guide-tone line that steers the whole spiral.

### 2. Progressions
Four modes, each with a ranked bank of the progressions that actually earn their
place, and a one-line reason for each.

| Mode | On D | Signature move |
|---|---|---|
| **Major** | `D E F♯ G A B C♯` | `Em7 – A7 – Dmaj7` |
| **Minor** | `D E F G A B♭ C` | `Gm – A7 – Dm` |
| **Ousak** (Ουσάκ) | `D E♭ F G A B♭ C` | `Gm – C – Dm` |
| **Hijaz** (Χιτζάζ) | `D E♭ F♯ G A B♭ C` | `D – E♭ – D` |

Two things the app is built to teach:

- **Ousak and Minor use the same chords.** The only difference is `E♭` vs `E♮`, and it
  lives in the melody. Ousak's ♭2 is a melodic inflection — in real makam practice it
  is a *neutral* second, which is precisely why nobody builds a chord on it.
- **Hijaz has a major tonic but a minor ♭VII.** `D – Gm – Cm – D`. That friction is
  the sound.

Turn on **Scale overlay** and the ♭2 and 3rd of the current mode get an orange ring
everywhere they appear on the neck. Switching Major → Minor → Ousak → Hijaz then shows
you, physically, that only two dots move.

### 3. Solo Lab — technique and ear
The core technique and ear routine that supports the target map.

**Picking path.** Runs the mode as a path across the neck with **strict alternate
picking** marked on every note (⊓ down, V up), and every string change classified:

- **Green solid** = *outside* picking — the pick sweeps around the string pair
- **Red dashed** = *inside* picking — the pick is trapped between the strings, and
  these are the crossings that break down first when you push the tempo

Switch between **3/str, 2/str, box and horizontal** to move where the strings break —
that is what changes the crossing pattern. `◀ below` / `above ▶` walk the same shape
to the core positions above and below. Loose wrist, pick barely clearing the string,
and drop the tempo until every crossing is clean.

**Audiation cells.** Start with 3 notes, add one each pass to the octave, then take
one away back down to 3. The **last note is the target**: playback leaves a *silent
beat* where it belongs so you sing it internally first, then reveal to check yourself.

### 3a. Solo Road — map before patterns

Solo Road turns the Solo Lab into a deliberate sequence: **Road → Shape → Numbers →
Changes → Ear**. Choose the dromos, home key and progression in one place; the active
chord appears with its Roman-numeral function (for example `iv · Gm → V · A7 → i · Dm`).

The 24-fret map is split into a colour-coded lower `1–4` and upper `5–8` road. This is
a practical fretboard-learning lens, not a claim that every dromos has one fixed
historical tetrachord analysis. Work one colour lane in one position, then connect
lanes. The Number step supplies original, singable contours such as `1–3–5–3` and
`1–2–3–5`; it does not imitate a living player’s phrase.

### 3b. Triad landscape and melodic routes

**Changes** shows four different jobs at once, deliberately separated by visual
weight: the solid three-note shape is the nearest voice-led triad; faint shapes are
the other inversions across the full neck; quiet dots are the pentatonic connector
frame; rings are the target notes for the current and next chord. Select **Colour
3rd**, **Triad tones**, or **Guide tones** to choose what the rings mean.

The Shape page then applies the same target lens to a technique road. Choose one
route before playing fast: **Triad first**, **3 + landing**, **Nearest link**,
**Approach → resolve**, or **Motif + space**. Each names a small note budget, its
target path, what to hear, and what to think about. An approach note is optional,
comes on a weak pulse, and resolves immediately; it is never silently treated as a
new dromos tone. This keeps “scale practice” subordinate to making the next chord
audible.

### 3c. Ear checks — colour and harmonic map

Ear checks has two distinct jobs. **Dromos colour** asks for the mode after a cadence
and melodic run. **Key & changes** plays a harmonic cadence twice and asks for both
the tonal home and the progression box labels. After the reveal, the app displays the
actual chord symbols so the player can transfer the answer directly into Song Map.

### 3d. Video Study

Video Study links a small, source-labelled set of publicly available lessons found via
the Bouzouki Learning Website’s lesson index. Videos remain at YouTube. Set an A–B
range, slow it down, watch one technical detail, then return to Song Map to explain the
home, targets and chord function. The app does not download, extract, or reproduce
third-party video.

### 3e. Pulse-aware timing and practice ensemble

Choose a Greek pulse in **Practice Ensemble**—Zeibekiko `2+2+2+3`,
Kalamatianos `3+2+2`, Hasapiko/Tsifteteli/Roumba `2+2`—then turn on a simple
moving root-and-fifth bass or light grouped percussion. The pulse changes the
transport's bar length and accents; the selected Song Map still supplies the
actual dromos and chords. It is a timing aid, not a claim to recreate a full
traditional rhythm-section arrangement.

In Solo Changes, the **Timing matrix** follows that same pulse. It animates
the chosen route from anchor through connector (and an optional approach) to
the next target, while the matching note class lights on the full-neck map.
The matrix describes note jobs and timing—players make the actual phrase.

### 3f. Practical guitar chord cycle

The Cycle page includes **Practical chords**, a dedicated guitar lens that uses
the selected Major, Minor, Ousak, or Hijaz progression. Choose **Full 6** for
validated common open forms and movable E/A-family shapes, **Triad 3** for
compact inversions, or **Compact 4** for clear root/colour/guide-tone comping.
All displayed full forms are chord-tone checked and stop at fret 15. When a
quality has no clean full six-string form (for example some half-diminished
contexts), the app directs you to a compact voicing rather than faking a barre.

### 4. Solo Lab

The missing bridge between scale practice and real playing. It gives you the correct
five-note frame for the mode, then highlights the **current and next chord-tone
targets**. Start with 3rds; then switch to guide targets (3rds + 7ths when the chord
has sevenths, otherwise 3rd + root for a triad). The rule is simple: move through the
pentatonic, but arrive on a target when the chord changes.

Hijaz uses **dominant pentatonic** (`1 3 4 5 ♭7`), never minor pentatonic—its major
3rd is essential.

### 5. Ear Trainer
Plays a mode's signature cadence followed by a descending run, and you name the
dromos. The run is not decoration — since Ousak and Minor are chord-identical, the
melody is the only thing that can distinguish them.

The whole skill in one table:

| You hear | Mode |
|---|---|
| `E♮ F♮` | Minor |
| `E♭ F♮` | Ousak |
| `E♭ F♯` | Hijaz |

### 6. Foundation & Styles

Start with the shared language—singing an answer, compact triad landmarks,
pentatonic/tetrachord routes, motifs, touch, and pulse—then choose a Greek style
map. The current maps are **Zeibekiko** `9/4` (`2+2+2+3`), **Kalamatianos** `7/8`
(`3+2+2`), Hasapiko, Tsifteteli, and Roumba. A style map teaches where a phrase and
an accompaniment belong in time; it never pretends to choose the song’s dromos for
you. Use **Open Song Map** from a style to choose the actual harmony.

### 7. Study Analyzer

Enter a progression such as `Dm Gm A7 Dm` with its home and dromos. The analyzer
shows function, strong landing notes, modal/harmonic events, and a one-target-per-
chord solo plan. It recognises that a major V in minor introduces a leading-tone
pull, and that a major IV in minor may be Dorian/modal mixture or a temporary
dominant—context decides. Add a line as `Chord: notes | Chord: notes` to label chord
tones, dromos tones, and outside/approach notes.

It is deliberately transparent: this version analyzes material you enter. It does
not claim to transcribe a recording, infer a dromos from one chord, or pronounce an
outside note wrong without hearing its resolution.

### 8. Concept Pyramid

Every analysis ends in four separate causes of a good phrase: **Time & Form**,
**Modal-Harmonic Map**, **Melodic Route**, and **Touch & Instrument Role**. This is an
answer-first, MECE teaching structure: each layer has a Greek/Balkan lens and one
concrete drill, so the player can fix the actual problem instead of learning another
unrelated lick.

### 9. Adaptive Practice Coach

The Coach answers questions using the instrument, tuning, current dromos, Song Map,
style, selected study, and recent practice history. It ends with at most one safe,
one-tap route into an exercise—such as the exact Song Map, Triads, Solo Lab, Style,
study starter, or Analyzer state that answers the question.

It uses anonymous device profiles: the browser stores only a signed opaque session
token, while conversation and practice events are stored in the configured Neon
database. This lets recommendations evolve from real events—missed targets route
back to target practice; ear misses route back to hearing—without an account or a
browser-held API key. Cross-device sign-in is deliberately a later choice.

The Coach is inactive when opening `index.html` directly. To activate it, deploy to
Vercel, connect Neon through Vercel Marketplace, and add the server secrets in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The current economical default is
`gemini-3.1-flash-lite` Free Tier, accessed only from Vercel Functions. Before
sending a question, the player must acknowledge the Free Tier data-use disclosure;
do not enter sensitive or private material.

---

## The bridge worth knowing

**A Hijaz = D harmonic minor starting on A** (`A B♭ C♯ D E F G`). So the Andalusian
cadence `Dm – C – B♭ – A` lands *on a Hijaz tonic* — the *Piraeotikos* relationship.
Vamp it, and when you hit the A, play A Hijaz over it. Every minor tune you know
already contains a Hijaz section.

---

## Controls

| Key | Action |
|---|---|
| `Space` | Play / pause (replay prompt in Ear Trainer) |
| `←` `→` | Step through chords / positions / cells |
| `R` | Reveal the audiation target |
| `1`–`9` | Switch practice area (`9` = Coach) |

## Instruments

Everything — grips, scale paths, overlays — redraws for the selected instrument:

| Tuning | Strings |
|---|---|
| Guitar | `E A D G B E` |
| Guitar (drop D) | `D A D G B E` |
| **Bouzouki tetrachordo** | `C F A D` — the guitar's top four strings, each down a whole step |
| Bouzouki trichordo | `D A D` |
| Mainland laouto | `A D G C` |

When a chord has more notes than the instrument has strings, it thins automatically —
the 5th goes first, then the root, so the guide tones survive.

Also: tempo 40–200 BPM, metronome, loop, note-names vs intervals, ghost tones,
neck-position cycling, and a left-handed neck.

---

## For developers

The header badge shows `✓ n/n theory tests passing` — the music theory self-tests run
on every page load, asserting generated chords against a hand-verified ground truth.

- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — feature tracker (`FR-*`) and the
  music invariants (`MI-*`) that must not be broken
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module map, data shapes, why there
  are two chord engines
- [CONTRIBUTING.md](CONTRIBUTING.md) — recipes for adding a progression or a mode
- [docs/BACKLOG.md](docs/BACKLOG.md) — what is next
- [docs/CURRICULUM.md](docs/CURRICULUM.md) — product intent, practice loop and curriculum roadmap
- [docs/AI_COACH.md](docs/AI_COACH.md) — coach product boundary and design
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Neon production setup

## Licence

MIT
