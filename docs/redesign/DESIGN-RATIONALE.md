# Dromos Trainer — `design/kombai-v14` design rationale

## Direction: “Guided Focus”

A private lesson on a page, not an admin dashboard. One centred practice column,
one quiet left navigation, structure built from typography and hairlines instead
of nested cards. The instrument and the harmonic moment are the page; everything
else supports them.

## Design tokens (css/styles.css `:root`)

| Token | Value | Musical meaning |
| --- | --- | --- |
| `--bg` / `--raised` / `--panel` | `#14110F` / `#1B1815` / `#201B17` | warm near-black foundation |
| `--text` | `#F2EDE3` | warm ivory content |
| `--aegean` | `#5B87B5` | navigation + neutral musical info (key, mode, labels) |
| `--terracotta` | `#D4763B` | the CURRENT chord, active transport, now-markers |
| `--turquoise` | `#52A89D` | the NEXT chord, targets, arrivals |
| `--violet` / `--amber` | `#8B7BB5` / `#D9A441` | approach/7th family · flavour notes |

Type: **Fraunces** (display — exercise titles, Roman numerals, teacher’s voice in
italic), **Inter** (text), **IBM Plex Mono** (chord symbols, tempo, numerics).
Color is bound to musical meaning everywhere: terracotta always means *now*,
turquoise always means *next/target*.

## Information architecture

Eight destinations replace the ten-item curriculum rail:

`Today · Hear · Harmony · Solo · Repertoire · Learn · Coach · Progress`

- **Harmony** unifies Full Cycle / ii–V–I / **Pivot Cycle** / Song Map / Comp as
  tabs of one workspace (`data-harmony-mode` + `data-view`).
- **Learn** groups Greek Pulse, Video Study and Concepts.
- **Today** is a guided session landing; **Progress** presents “Profiles on this
  device” honestly (local, no cloud accounts implied).
- Desktop: persistent left nav. ≤900px: bottom navigation with safe-area padding.

## Practice shell (every training view)

1. **Session header** — purpose overline (Aegean), display-serif exercise title,
   coach cue in italic serif, mode tabs.
2. **Harmonic journey** — NOW → movement → NEXT band with large serif numerals,
   hear/think cue, optional V-of-ii pickup annotation, key wheel strip.
3. **Instrument stage** — the fretboard is the widest element on the page
   (own horizontal scroll region on phones), layer legend below.
4. **Workbench** — exercise options beside the chord inspector; single column on
   non-instrument views.
5. **Transport** — sticky bottom bar: prev / play / next, tempo, **chord voice
   selector (clean guitar · piano · match instrument)**, audition, position.
6. **Settings drawer** — Harmony / Fretboard / Ensemble / Audio groups; the old
   right-side configuration column is gone.

## Musical behaviour added with the redesign

- **ii · V · I · I phrase** everywhere (I holds two bars, then the phrase resets)
  including Song Map progressions and the Solo lab.
- **Pivot Cycle** is a true pivot-modulation drill: ii–V–I in C, the I re-enters
  as the ii of B♭, whole steps down through C→B♭→A♭→G♭→E→D→C, with the
  reinterpretation spelled out (“old I becomes the new ii”).
- **“Five of two” pickup** (optional): the dominant of the upcoming ii sounds on
  beat 3 of the phrase’s last bar (A7 → Dm7 in C).
- **Sweet 2→3 lens** (Solo default): the scale’s 2nd (♭2 in Ousak/Hijaz) leaning
  into each chord’s 3rd — the practical Greek melody-finding move.
- **One-note (common-tone) drill**: the app finds the single note that fits every
  chord, names what it becomes over each one, and shows the final chord resolving it.
- **Chord voice**: clean plucked guitar by default, additive piano available,
  or match the selected instrument. Ear drills keep their fixed warm-guitar
  reference so scores stay comparable.

## Preserved behaviour

All `window.*` logic modules (Theory, Modes, Triads, HarmonyJourney, AudioEngine,
EarDrills, Analysis, Profiles, Practice, GuitarVoicings, MusicXML, Coach, Video)
are untouched except: `audio.js` gained a piano voice, `practice.js` gained one
melodic route. The 152 in-app theory self-tests and the full `node --test` suite
pass (25/25).

## Accessibility

44px touch targets, visible focus rings, semantic controls, `aria-live`
journey announcements kept, `prefers-reduced-motion` disables all nonessential
animation, safe-area insets on iPhone/iPad, no page-level horizontal overflow
(verified 0px at 390×844).
