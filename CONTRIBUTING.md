# Contributing

## Run it

No install, no build.

```bash
open index.html
```

Or, if you want a local server (needed only if your browser blocks `file://` audio):

```bash
python3 -m http.server 8777
```

Then visit <http://localhost:8777>.

## Before you commit

1. Load the page. The header badge must read **`✓ n/n theory tests passing`**.
2. If it is red, open the console — failures print a `want` / `got` diff.
3. Reference the requirement ID in your commit message (`FR-12: ...`).

## Where things live

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) first — especially the "two engines"
section, which explains why cycle chords and progression chords are built by
different code.

[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) is the feature tracker **and** the
domain-knowledge record. The `MI-*` music invariants are not style preferences; each
one is a real musical fact that a well-meaning refactor can silently destroy.

---

## Recipe: add a progression

Everything lives in one array in `js/modes.js`.

```js
PROGRESSIONS.hijaz.push({
  id: "I-bVI-bII-I",              // stable, used in state + URLs later
  label: "I – ♭VI – ♭II – I",
  tag: "cadence",                  // core | modal | folk | gateway | cadence
  chords: [[0,"maj"], [8,"maj"], [1,"maj"], [0,"maj"]],   // [semitonesAboveTonic, quality]
  why: "One line on why this earns a slot. Shown in the UI."
});
```

Then **add it to the ground truth** so it can never silently drift:

```js
// in modes.js EXPECTED
"D|hijaz|I-bVI-bII-I": "D B♭ E♭ D",
```

…and to the MI-07b table in `docs/REQUIREMENTS.md`. Reload; the badge count goes up.

Available qualities: `maj min dim aug maj7 m7 dom7 m7b5`. Add new ones to `QUALITY`
with `offsets` (semitones from root) **and** `steps` (letter-names above the root) —
`steps` is what keeps the spelling legal (MI-04).

## Recipe: add a mode (dromos)

```js
MODES.niavent = {
  id: "niavent", name: "Niavent", greek: "Νιαβέντ",
  scale: [0,2,3,6,7,8,11],        // semitones above the tonic
  flavour: [2,3],                  // MUST be the 2nd and 3rd degrees — see MI-05
  blurb: "One sentence a player can act on."
};
MODE_ORDER.push("niavent");
PROGRESSIONS.niavent = [ /* at least one */ ];
```

Then add a guess button in `index.html` (`data-guess="niavent"`) and a mode button
(`data-modeid="niavent"`).

⚠️ **MI-05 check:** the new mode's `flavour` pair must differ from every existing
mode's pair, or the ear trainer becomes unanswerable. `Modes.selfTest()` asserts this
and will go red.

⚠️ **MI-06 check:** if the new mode shares chords with an existing one (as Ousak does
with Minor), that is fine — but the ear trainer must keep playing the melodic run.
Do not "optimise" `playPrompt` down to chords only.

## Recipe: add a colour

Colours are CSS variables consumed via `data-group`. Add the variable in
`css/styles.css` `:root`, map the role to a group in `modes.js` `ROLE_GROUP`, and add
the `.fb-dot[data-group="..."]` rule. **Never put a hex value in JS** (FR-03).

---

## Style

- Vanilla JS, no framework, no bundler, no dependencies (NFR-01/02).
- Music logic is pure and DOM-free. If you need the DOM, you are in the wrong file.
- Comment the *why*, especially for musical decisions — a future reader will not know
  that Hijaz's ♭VII is minor unless you tell them (MI-08).
- Keep `selfTest()` next to the logic it tests.

## Good first issues

See [docs/BACKLOG.md](docs/BACKLOG.md) — FR-18 (persist state) and FR-19 (printable
chart) are both self-contained.
