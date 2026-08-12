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
| `1` `2` `3` `4` `5` `6` | Switch practice area |

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

## Licence

MIT
