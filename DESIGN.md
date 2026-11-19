---
name: Dromos Trainer
description: A practice book for Greek popular music that states the dromos in red before every line, then lets you play.
colors:
  cinnabar: "#c43d24"
  cinnabar-bright: "#e8644a"
  cinnabar-hover: "#a8321c"
  cinnabar-wash: "rgba(214, 69, 43, 0.16)"
  flavour: "#e0553a"
  tonic-gold: "#c9a24a"
  tetra-lower: "#7b9fc9"
  tetra-upper: "#8fb07a"
  seventh-ochre: "#c79a5a"
  ink-ground: "#16110d"
  ink-rail: "#1a140f"
  ink-raised: "#1c1510"
  ink-panel: "#1e1712"
  ink-panel-high: "#281f18"
  parchment: "#efe6d2"
  parchment-muted: "rgba(239, 230, 210, 0.8)"
  parchment-faint: "rgba(239, 230, 210, 0.64)"
  on-cinnabar: "#fff7ea"
  ink-grey: "#b9ad97"
  ink-grey-bright: "#d6ccb6"
  hairline: "rgba(239, 230, 210, 0.12)"
  hairline-strong: "rgba(239, 230, 210, 0.24)"
typography:
  display:
    fontFamily: "GFS Didot, Didot, Georgia, Times New Roman, serif"
    fontSize: "clamp(24px, 2.6vw, 36px)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0em"
  headline:
    fontFamily: "GFS Didot, Didot, Georgia, Times New Roman, serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0em"
  title:
    fontFamily: "GFS Didot, Didot, Georgia, Times New Roman, serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
  martyria-name:
    fontFamily: "GFS Didot, Didot, Georgia, Times New Roman, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.1
  martyria-echos:
    fontFamily: "GFS Didot, Didot, Georgia, Times New Roman, serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1
  body:
    fontFamily: "Commissioner, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  body-large:
    fontFamily: "Commissioner, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  nav-item:
    fontFamily: "Commissioner, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "Commissioner, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    fontFeature: "tnum"
  group-label:
    fontFamily: "Commissioner, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.1em"
  button:
    fontFamily: "Commissioner, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  witness: "3px"
  seg-inner: "7px"
  sm: "8px"
  seg: "10px"
  md: "12px"
  lg: "18px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
components:
  button-primary:
    backgroundColor: "{colors.cinnabar}"
    textColor: "{colors.on-cinnabar}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.cinnabar-hover}"
    textColor: "{colors.on-cinnabar}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.parchment}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 15px"
    height: "38px"
  button-secondary-hover:
    backgroundColor: "{colors.ink-panel-high}"
    textColor: "{colors.parchment}"
  context-chip:
    backgroundColor: "{colors.ink-panel-high}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.pill}"
    padding: "0 13px"
    height: "38px"
  option-pill:
    backgroundColor: "transparent"
    textColor: "{colors.parchment-faint}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
    height: "34px"
  option-pill-on:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink-ground}"
  segmented:
    backgroundColor: "{colors.ink-panel}"
    rounded: "{rounded.seg}"
    padding: "3px"
  segmented-active:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.ink-ground}"
    rounded: "{rounded.seg-inner}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.parchment-muted}"
    typography: "{typography.nav-item}"
    rounded: "{rounded.sm}"
    padding: "7px 10px"
  nav-item-active:
    backgroundColor: "{colors.ink-panel-high}"
    textColor: "{colors.parchment}"
  card-now:
    backgroundColor: "{colors.cinnabar-wash}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  card-next:
    backgroundColor: "transparent"
    textColor: "{colors.parchment-muted}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  martyria:
    backgroundColor: "{colors.ink-panel}"
    textColor: "{colors.cinnabar-bright}"
    typography: "{typography.martyria-name}"
    rounded: "{rounded.witness}"
    padding: "9px 10px 11px"
  panel:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.parchment}"
    rounded: "{rounded.lg}"
    padding: "18px"
  select-field:
    backgroundColor: "{colors.ink-panel}"
    textColor: "{colors.parchment}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 9px"
    height: "40px"
---

# Design System: Dromos Trainer

## Overview

**Creative North Star: "The Psaltic Manuscript"**

Dromos reads like a Byzantine chant book laid open beside the instrument. The ground is iron-gall ink, the text is parchment, and before every line of music the mode is stated in red: the martyria, a small cinnabar cartouche reading Ήχος, the dromos in Greek, and its tonic, sits at the head of every neck. Then the line is played. The whole interface exists to get the player from "which tool" to "the neck and the next note" with nothing in between.

The chrome is deliberately quiet so the neck can be loud. Panels sit one tonal step above the ground and are separated by hairlines, not shadows. The rail and the top bar use parchment and an ink grey only. Colour is spent on the instrument: cinnabar for the note being played, gold for the tonic, and two muted pigments (lapis and verdigris) that show the lower and upper tetrachord of the dromos on the neck and the tab. Didot carries the voice of the book (tool titles, the drill name, the martyria); Commissioner carries every control and every number, in tabular figures.

The density is that of a practice book read at music-stand distance for an hour or more: one row of option pills, the neck at full width, the now and next cards and the tab strip under it, and a dock with one cinnabar Start. Explanation waits behind the Coach drawer; no paragraph sits above the neck. The contract named cinnabar as #d6452b; the build settled on a deeper #c43d24 fill with #e8644a for text and rings, and #d6452b survives only as the base of the cinnabar wash.

**Key Characteristics:**
- Iron-gall ink ground with tonal panels and hairline rules; no decorative depth.
- One cinnabar, reserved: the playing note, the one primary action per tool, the dromos's flavour notes, and "now" labels.
- Gold only for the tonic; lapis and verdigris only on the neck and the tab.
- Didot for titles and the martyria, Commissioner for everything you operate.
- "Next" is a dashed ink outline, never a second hue.
- The martyria heads every neck and settles like wet ink when the key or dromos changes.

## Colors

A manuscript palette: dark ink, warm parchment, one red, one gold, and two pigments that live only on the instrument.

### Primary
- **Cinnabar** (#c43d24): the fill of the one primary action per tool (the dock's Start, Solo's Play) and the playing note on the neck.
- **Bright Cinnabar** (#e8644a): cinnabar as line and text: the martyria's lettering and border tick, the heavy "now" ring on the neck, "Start with" and "Play now" labels, the active phone tab's caret.
- **Pressed Cinnabar** (#a8321c): hover and press on the cinnabar primary.
- **Cinnabar Wash** (rgba(214, 69, 43, 0.16)): the ground of the "now" card and of text selection; the only tinted surface in the chrome.
- **Flavour Red** (#e0553a): the thin ring around the dromos's characteristic notes on the neck (for example the F# and E flat of D Hijaz).

### Secondary
- **Tonic Gold** (#c9a24a): the tonic, and nothing else. Gold fills the tonic disc on the picking neck and the tonic cell and degree on the tab.

### Tertiary
- **Lapis** (#7b9fc9): the lower tetrachord of the dromos on the neck and in the tab, and the chord third where degree colours are shown on the neck.
- **Verdigris** (#8fb07a): the upper tetrachord on the neck and in the tab, and the chord fifth on the neck.
- **Ochre** (#c79a5a): the chord seventh as a degree colour on the neck.

### Neutral
- **Iron-Gall Ink** (#16110d): the page ground.
- **Rail Ink** (#1a140f): the left rail, one breath lighter than the page.
- **Raised Ink** (#1c1510): panels and the phone sheet.
- **Panel Ink** (#1e1712): controls, segmented tracks, select fields, the martyria's ground.
- **High Panel Ink** (#281f18): the neck's face, context chips, hover and active rows in the rail.
- **Parchment** (#efe6d2): all primary text, and the fill of a selected pill or segment (parchment on ink is how selection reads).
- **Muted Parchment** (rgba(239, 230, 210, 0.8)) and **Faint Parchment** (rgba(239, 230, 210, 0.64)): secondary text, source lines, group labels.
- **Ink Grey** (#b9ad97) and **Bright Ink Grey** (#d6ccb6): the muted chrome tone that replaced every old blue and green outside the neck.
- **Hairline** (rgba(239, 230, 210, 0.12)) and **Strong Hairline** (rgba(239, 230, 210, 0.24)): borders, frets, the dashed "next" outline.
- **On Cinnabar** (#fff7ea): text on a cinnabar fill.

### Named Rules
**The One Red Rule.** Cinnabar marks only what is happening now: the playing note, the single primary action of the tool, the flavour notes, and "now" labels. A tool shows exactly one cinnabar fill; every other action is an outline.

**The Gold Tonic Rule.** Gold is the tonic. It never decorates, highlights or signals state.

**The Pigments Stay On The Instrument Rule.** Lapis and verdigris appear only on the neck and the tab, where they show the two tetrachords. The rail, top bar, cards and pills stay parchment, ink grey, one cinnabar and one gold.

## Typography

**Display Font:** GFS Didot (with Didot, Georgia, Times New Roman)
**Body Font:** Commissioner (with the system sans stack), variable 400 to 700, Greek and Latin subsets self-hosted

**Character:** A Greek book face for the voice of the manuscript against a clear humanist sans for the work. Didot names things; Commissioner operates them.

### Hierarchy
- **Display** (Didot 400, clamp(24px, 2.6vw, 36px), 1.15): the drill name on Picking, which doubles as the drill picker; it wraps rather than truncates.
- **Headline** (Didot 400, 30px, 1.05): the tool title at the left of the top bar.
- **Title** (Didot 400, 22px): step heads inside a tool, such as Melody's step heading.
- **Martyria** (Didot 400, 19px name over 14px Ήχος): the witness sign; its tonic line drops to Commissioner 12px muted.
- **Body** (Commissioner 400, 15px, 1.5, tabular figures): all running UI text; 16px where text is read on a sheet or phone list.
- **Nav item** (Commissioner 500, 14px): rail entries; 600 for Today and for the active entry.
- **Label** (Commissioner 600, 12px): pill text, card heads ("Start with", "Next"), source lines.
- **Group label** (Commissioner 700, 12px, 0.1em, uppercase): the rail's job groups only.
- **Button** (Commissioner 700, 15px): the cinnabar Start and Play.

### Named Rules
**The Book Voice Rule.** Didot is for titles and the martyria only. Buttons, pills, chips, tabs and numbers speak Commissioner.

**The Tabular Rule.** Every number (frets, tempo, bars, scores, degrees) uses tabular figures so columns hold still while the player glances away.

## Layout

Desktop is a fixed 200px rail on Rail Ink beside a single working column. A sticky top bar (60px) holds the Didot tool title, then the context chips (On instrument, Key, Dromos, Rhythm), then Focus, Coach, the player and settings, all on one line above 900px. Under it, in order: the tool's one row of option pills, the neck at full width headed at its left by the martyria (from 1100px the martyria takes its own grid column beside the neck; below that it sits above the neck as a single baseline row), the now and next cards, the tab strip, and the transport dock pinned to the bottom with Start, tempo and Autopilot.

The rail groups tools by job: Today; Learn the neck; Practise; Play and write; Ears and rhythm; You. On phones (900px and below) the rail becomes a bottom bar of those six groups, each a drawn stroke icon over a short label (Today, Neck, Practise, Play, Ears, You); tapping a group opens a sheet of its tools above the bar. The phone dock wraps to two rows, and option rows that overflow scroll inside their own box with a fade at the right edge. Tablet (521px to 900px) keeps the tempo slider at full width for an iPad on a stand. Below 700px the tab strip moves directly under the neck.

Spacing runs on a 4px base (4, 8, 12, 16, 24, 32, 48). Control heights are 48px for the primary, 40px for fields, 32 to 38px for chips and pills, and at least 44px for touch targets on phone.

## Elevation & Depth

The system is flat and tonal. Depth comes from five ink steps (ground, rail, raised, panel, high panel) and hairline borders at 12% and 24% parchment. The neck itself is drawn flat: no wood grain, no board or string shadows, no halos except the single cinnabar ring on the note being played. The top bar is translucent ink with a 12px backdrop blur so the page reads under it while scrolling.

### Shadow Vocabulary
- **Sheet lift** (`box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5)`): the phone tool sheet that opens from the bottom bar.
- **Transport lift** (`box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45)`): the round-ended Play in the transport bar.

### Named Rules
**The Flat Ink Rule.** Panels, cards and the neck carry no shadow. A shadow appears only on something that floats over the page: the phone sheet, the transport.

## Shapes

Corners are gently rounded and consistent: 8px for rows, fields and rail entries, 12px for cards and the primary button, 18px for panels and the phone sheet, and full pills for chips, option pills and secondary buttons. Segmented controls use a 10px track with 7px segments. The martyria alone has a near-square 3px corner and a 1px cinnabar border with a short centred cinnabar tick beneath it, the one ornament the world allows. Borders are 1px everywhere; coloured side borders are collapsed to the same 1px hairline. "Next" is always a 1px dashed outline at 24% parchment.

## Components

### Buttons
Tactile and few: one red per tool, the rest are drawn in ink.
- **Shape:** gently rounded rectangle (12px) for the dock's Start; Solo's transport Play is a full pill.
- **Primary:** Cinnabar fill, On Cinnabar text, Commissioner 700, 46px tall in the dock (44px on phone), with a drawn play icon leading the label.
- **Hover / Focus:** hover deepens to Pressed Cinnabar; focus is a 2px parchment outline offset 2px.
- **Secondary:** transparent with a 1px hairline, parchment text, pill; hover fills with High Panel Ink. Check buttons in Ear and Melody are secondary so the tool keeps one cinnabar fill.

### Chips
- **Context chips:** High Panel Ink pill, 38px, a small uppercase field label (On, Key, Dromos, Rhythm) in faint parchment beside the value in parchment 600.
- **Option pills:** transparent pill with hairline and faint text; on, they become a parchment pill with ink text. Autopilot toggles follow the same parchment-on-ink selection.

### Segmented Controls
- **Style:** Panel Ink track (10px, 3px inset), segments 7px; the active segment is a parchment fill with ink text (Guided plan, Phrase workbench, Rhythm comp; quarters, 8ths, triplets).

### Cards / Containers
- **Panels:** Raised Ink, 1px hairline, 18px corners, 18px padding, no shadow.
- **Now card:** Cinnabar Wash ground, 1px cinnabar border, 12px corners; its label ("Start with", "Play now") in Bright Cinnabar leads the heading on the same line.
- **Next card:** transparent with a 1px dashed hairline; label in muted parchment.

### Inputs / Fields
- **Style:** Panel Ink, 1px hairline, 8px corners, 40px tall, Commissioner 12px 600. The drill picker on Picking is a Didot heading with a drawn chevron and the native select laid invisibly over it.
- **Focus:** 2px parchment outline; the drill heading takes the outline at 4px offset.

### Navigation
- **Rail (desktop):** Rail Ink column; brand mark Δρόμος in Didot over a faint uppercase wordmark; group labels in the group-label style; entries in muted parchment, hover and active on High Panel Ink with a strong hairline inset. The active entry is never cinnabar.
- **Bottom bar (phone):** six groups with 21px stroke icons (1.7 stroke, round caps) over 12px labels; the group holding the current tool goes parchment 700; an open group's sheet rises above the bar on Raised Ink with the sheet lift, its rows 46px tall, the active row on High Panel Ink.

### Icons
Drawn, one stroke weight, round caps and joins, sized to the text (1em). A shared set replaces text glyphs in labels at runtime: play and stop filled, back, replay, sound, check and cross stroked. Pick-stroke arrows in the tab are notation and stay as typed arrows.

### The Martyria (signature)
The witness sign that names the dromos before the neck: Ήχος over the dromos in Greek (Χιτζάζ, Ουσάκ, Ματζόρε, Μινόρε, Αρμονικό μινόρε) in Didot, the tonic line in Commissioner (Ρε · Hijaz on D), Bright Cinnabar lettering inside a 1px cinnabar border with a centred tick below. It appears on every neck view (Picking, Solo, Changes gym, Comp, Melody, Song map, Harmony matrix), stays pinned while a phone neck scrolls under it, hides in Focus mode, and on a key or dromos change re-inks with a 520ms settle (opacity, 3px blur and 3px drop resolving on cubic-bezier(0.16, 1, 0.3, 1)); reduced motion removes the settle.

### The Ink Neck (signature)
The neck face is High Panel Ink with parchment strings (72%), frets (22%), nut (70%) and inlays (16%), drawn flat. Scale notes are parchment discs at 14%; the dromos's halves fill in Lapis and Verdigris; the tonic is Tonic Gold; the playing note carries the one heavy Bright Cinnabar ring (2px), with a parchment outline on its disc. In Solo exactly one landing wears the heavy red ring; every other landing target is an ink ring at 55% parchment, the next landing is a dashed diamond, and flavour notes take a thin Flavour Red ring.

## Do's and Don'ts

### Do:
- **Do** head every neck with the martyria, in Greek first, and let it re-ink when the key or dromos changes.
- **Do** keep exactly one cinnabar fill per tool, on its primary action; make every other action a hairline outline.
- **Do** show selection as parchment on ink (#efe6d2 on #16110d), never as a colour.
- **Do** draw "next" as a 1px dashed outline at 24% parchment.
- **Do** keep gold (#c9a24a) for the tonic and lapis (#7b9fc9) and verdigris (#8fb07a) for the tetrachords, on the neck and tab only.
- **Do** set titles in GFS Didot and every control and number in Commissioner with tabular figures.
- **Do** keep the neck and its option row above any explanation; put explanation in the Coach drawer.

### Don't:
- **Don't** put cinnabar on rail entries, chips, card heads, section heads or decoration.
- **Don't** let lapis, verdigris or any other hue into the rail, top bar, pills or cards.
- **Don't** set buttons, pills or tabs in Didot.
- **Don't** add shadows, glows or wood texture to panels, cards or the neck.
- **Don't** use coloured side borders; borders are 1px hairlines.
- **Don't** put an uppercase kicker or eyebrow label above a heading; the group labels in the rail are the only uppercase heads.
- **Don't** use typed glyphs as icons in labels; use the drawn stroke set.
- **Don't** use em dashes in player-facing copy.
