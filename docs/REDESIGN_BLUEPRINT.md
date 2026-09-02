REDESIGN BLUEPRINT — DROMOS TRAINER (presentation layer only; music model untouched; zero deps, one CSS file, offline, dark)

=================================================================
PART 1 — DESIGN SYSTEM DELTA
=================================================================

## 1.1 Tokens (replace the 27 hand-rolled px sizes / ~85 sub-10px rules found in styles.css with these; delete the 7–9.5px tier outright)

Type scale (6 tokens, M3 body/label steps + Apple 11pt floor — https://m3.material.io/styles/typography/type-scale-tokens, https://developer.apple.com/design/human-interface-guidelines/typography):

```css
:root{
  --fs-display: clamp(22px, 3.5vw, 28px); /* one per page: the guide-answer h1 */
  --fs-title:   18px;   /* card/section heads */
  --fs-body:    16px;   /* default prose + chord names */
  --fs-sec:     14px;   /* secondary prose, buttons */
  --fs-label:   12px;   /* chips, badges, uppercase labels (tracking ≤ .06em) */
  --fs-micro:   11px;   /* absolute floor (Apple HIG 11pt); nothing smaller ships */
}
```

Spacing (8px grid, 4px only inside components — https://m3.material.io/foundations/layout/grids-spacing):

```css
--sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-6:24px; --sp-8:32px; --sp-12:48px;
```

Control heights (M3 specs — https://m3.material.io/components/buttons/specs, https://m3.material.io/components/chips/specs):
- `--h-primary: 48px` — Play / Start / Analyze / Check (the one primary action per page)
- `--h-control: 40px` — buttons, selects, segmented controls
- `--h-chip: 32px` — chips, keymap nodes, progression-strip steps
- Desktop-dense rows may drop to 32px, but under `@media (pointer: coarse)` everything interactive floors at 44px (WCAG 2.5.5 AAA + Apple HIG 44pt — https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html). Hard floor anywhere: 24×24px with the 24px-circle spacing rule (WCAG 2.2 SC 2.5.8 — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Gaps between adjacent targets ≥ 8px (https://support.google.com/accessibility/android/answer/7101858). Fretboard note dots and the mobile nav are the two current violators.

Radii: `--r-sm:6px` (chips) · `--r-md:10px` (cards) · `--r-lg:16px` (panels/drawer) · `--r-pill:999px`.

Color-token cleanup (one name per meaning): delete unused `--accent`; delete alias `--font-sans` (3 uses → `--font-text`); collapse `--amber`/`--c-root`/`--flavour` (three names, one hex) into `--c-root`; introduce `--c-now` (terracotta) and `--c-next` (turquoise) so the Now/Next system has named tokens, and re-point the green/yellow signal tokens that currently overlap "current chord" semantics. Dark surfaces: keep the near-black base, express elevation as white overlays (0/5/7/8/11% per dp — https://m2.material.io/design/color/dark-theme.html); desaturate accents; verify 4.5:1 body text and 3:1 on every chip/border (SC 1.4.3 + 1.4.11 — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Prose: `max-width: 65ch` on every paragraph block (WCAG 1.4.8 ≤80 chars — https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html).

## 1.2 Progressive-disclosure doctrine (the law every page PR enforces)

Always visible on every page — nothing else is entitled to first paint (NN/g progressive disclosure + inverted pyramid — https://www.nngroup.com/articles/progressive-disclosure/, https://www.nngroup.com/articles/inverted-pyramid/):
1. **The answer object** — the musical thing itself (fretboard, guess grid, chart, motion panel), top of the content column (F-pattern: top-left gets read — https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/).
2. **One primary action** at `--h-primary`, visually adjacent to the answer (never only in a far footer).
3. **One status line**: Now → Next.
4. **Nav**: 5 destinations + "More" (M3 nav bar caps at 3–5 — https://m3.material.io/components/navigation-bar/guidelines).

Fold rules:
- **One purpose sentence per page.** `pageGuide`'s `.guide-answer` is the sole sanctioned teaching block. `#coachCue` and `#modePurpose` are deleted app-wide (the shell audit shows three parallel purpose systems rendering simultaneously).
- **Explain a concept once, at the moment it fires** (staged disclosure — same NN/g article): the pivotBanner pattern is the model; standing explainer paragraphs are banned.
- **Honesty/disclaimer copy**: max one line per page, inside the guide's collapsed `<details>`. (Cycle has 2 standing caveats; Analyze has 5 disclaimers.)
- **Layer 2 = one `<summary>Setup</summary>`** per page holding key/mode/voice/count config. Accordions only for independent sections the user won't need simultaneously (https://www.nngroup.com/articles/accordions-complex-content/); never bury the answer or the primary action.
- **Control selection**: segmented ≤5 options (https://developer.apple.com/design/human-interface-guidelines/segmented-controls); `<select>` only for 5–15 options (https://www.nngroup.com/articles/listbox-dropdown/ — the 49-option picking select needs optgroup + a stage pre-filter, not a raw dropdown; dropdowns are the UI of last resort — https://www.lukew.com/ff/entry.asp?1950); checkboxes→toggles only for immediate-effect binaries (https://www.nngroup.com/articles/toggle-switch-guidelines/).
- **One control per state variable.** Solo currently has three writers of `state.solo.focus` and two neck-scoping controls; Progressions has two mode switchers. Doctrine: one visible control per piece of state, everything else reads it.

## 1.3 Motion kit (View Transitions / WAAPI / CSS only)

Duration tokens (inside the Awwwards 200–500ms craft band; <200ms reads as instant — https://www.awwwards.com/brainfood-mobile-performance-vol3.pdf):

```css
--dur-1: 120ms;  /* micro: chip toggles, active states */
--dur-2: 220ms;  /* standard: panel/details enter-exit, Now→Next handoff */
--dur-3: 320ms;  /* large: view-to-view transitions */
--ease-out:   cubic-bezier(0.2, 0, 0, 1);   /* entrances, position */
--ease-in:    cubic-bezier(0.3, 0, 1, 1);   /* exits */
--ease-spring: linear(0, 0.013 1%, 0.44 8%, 0.85 15%, 1.06 22%, 1.03 30%, 0.99 39%, 1.005 52%, 1); /* precomputed damped spring, authoring-time generated — https://developer.chrome.com/docs/css-ui/css-linear-easing-function, https://www.carmenansio.com/articles/spring-physics-css/ */
```

Gate the spring with `@supports (animation-timing-function: linear(0 0, 1 1))`; fallback `cubic-bezier(0.34, 1.56, 0.64, 1)`.

1. **View switching**: `document.startViewTransition(swap)` with `if (!document.startViewTransition) swap()` fallback (Baseline Oct 2025, older Firefox degrades to instant swap — https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available). `view-transition-name: stage` on the fretboard wrapper, `view-transition-name: transport` on the footer, so the two persistent objects morph instead of teleporting. `::view-transition-old(root)/::view-transition-new(root)` at `--dur-3 var(--ease-out)`.
2. **Panels, `<details>`, banners, toasts**: pure CSS `@starting-style` + `transition-behavior: allow-discrete` for display:none↔visible (both Baseline — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style, https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior). pivotBanner enters with `--ease-spring`.
3. **Accordion height**: `interpolate-size: allow-keywords` inside `@supports` (Chromium-only — https://developer.chrome.com/docs/css-ui/animate-to-height-auto); fallback `grid-template-rows: 0fr→1fr` at `--dur-2`.
4. **Tempo-linked motion** (pulse dot, playhead, strip cursor): WAAPI `element.animate()` with `playbackRate` = bpm/60 — pausable, reversible, interruptible (https://developer.mozilla.org/en-US/docs/Web/API/Element/animate).
5. **Scroll effects**: none. (Firefox still blocks scroll-driven animations from Baseline — https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations/ — and this app doesn't need them.)
6. **Reduced motion (non-negotiable, award-scored — https://www.hontran.dev/blog/awwwards-judging-criteria)**: `@media (prefers-reduced-motion: reduce){ :root{ --dur-1:0ms; --dur-2:0ms; --dur-3:0ms } }`; a JS `motionOK()` helper skips `startViewTransition` and swaps the WAAPI pulse for a discrete opacity blink per beat (WCAG C39 pattern).

=================================================================
PART 2 — PER-PAGE PLANS (pyramid: LEAD / KEEP / FOLD / DELETE / FIX)
=================================================================

### 2.0 APP SHELL (prerequisite for every page)
- **LEAD**: active view's answer; shell contributes only nav + one transport.
- **KEEP**: 5-destination nav + More sheet (mobile bar currently needs 704px on a 390px phone); instrument select; settings gear; transport = Play/Prev/Next + tempo.
- **FOLD**: Strum/Arp/Position/Test-sound into a "Hear it ▾" popover on the transport (style set in drawer); `#tuningSub` into the select's option text; `#testBadge` into the settings drawer, shown in nav only when failing.
- **DELETE/MERGE**: `#coachCue`, `#modePurpose` (incl. unreachable `MODE_PURPOSE.melody`), `#pageTitle` (guide h1 is the title); dead `[data-mode]` handler (app.js:5756-5764); fake "assistive tech" hidden nav comment; single-checkbox "Audio" drawer group merges into Practice ensemble.
- **FIX (bugs)**: (1) drawer has no close path — add close button + Escape + outside-click, raise gear z-index; (2) keydown guard misses TEXTAREA — Space/digits hijack typing in Analyze (app.js:6019); (3) keyboardHint "number keys follow the navigation" is false — regenerate hint from the actual keymap and realign keys to nav order; (4) Songs/Examples show live-looking dead transports and stale readouts — derive per-view hide/disable from one view-capability table, not hand-kept CSS lists (styles.css:1721-1765, app.js:5555); (5) persist `tglHoldI`/`tglGhost`/`tglScale`/`tglMetro` like their neighbors; (6) fix static "♪ Hear D" flash; (7) token cleanup per 1.1.

### 2.1 CYCLE / CHANGES GYM (current default landing)
- **LEAD**: `#changeGuide` Now→Next pair + fretboard, with Play (48px) directly beneath — the guide itself points at btnPlay.
- **KEEP**: Play; focus seg (hear/workout); merged keymap (see below); tempo.
- **FOLD**: entire `#gymSettings` (key count, skeleton toggle with trimmed "Skeleton first (3rd only)" label, Taximi bridge, string-set/zone selects, cyclePathStats) into one Setup `<details>`; `gymHonesty` + workbench-note into the guide's collapsed body; readout `ro-foot` to one line.
- **DELETE/MERGE**: merge `cycleRoadmap` + `keymap` into ONE strip (12 chips → 6) with pivotPairNav's arrows attached to it; pivot explained once — keep `pivotBanner` only, delete the keymapTitle sentence, `gymRouteNote`, and the guide's duplicate result line (four simultaneous explanations today).
- **FIX**: pivotBanner fires on EVERY chord because it's guarded on `cycleMode==="pivot"` (hardwired) instead of "current chord is the pivot" (app.js:771-787); pivotPairNav shown during workout focus where it mutates ignored state — gate on `focus==="hear"`; purge stale `cycleMode:"full"` default in profiles.js; roadmap "next ${count}" off-by-one; `renderKeymap` active=-1 labels chip 0 "Next" with no "Now"; remove no-op btnPrev/btnNext re-enable.

### 2.2 TODAY
- **LEAD**: the first *undone* practice card, visually distinguished (done cards get a check state; today nothing marks progress though the guide says "choose the first card you have not done").
- **KEEP**: the 10 cards (single numbering that matches the keyboard keys and nav order — currently three conflicting systems); a compact stat row.
- **FOLD**: stats detail behind tap; guide steps collapsed.
- **DELETE**: `#practicePath` (verbatim duplicate of the grid, with a dead `.active` state and dead CSS at styles.css:1552); the guide's "Show me where" button (targets the container the user is already in).
- **FIX**: stale hero copy "Every phrase runs ii·V·I·I" — derive from current mode; "Streak" stat silently switches drills — label it ("Colour streak"/"Map streak"). **Decision for James**: make Today the actual default view (nav lists it first, its guide says "use when unsure where to begin", yet `DEFAULT_PREFERENCES.view="cycle"`), or demote Today below Cycle in the nav. Pick one; the blueprint recommends Today-as-default with Cycle one tap away.

### 2.3 PROGRESSIONS
- **LEAD**: `progStrip` promoted to the top at chip height 32→40px — it IS the song map — above the fretboard, Play adjacent.
- **KEEP**: Play; the 4 progression cards; key select; 5-mode seg.
- **FOLD**: tier/job headers collapse when a tier has ≤2 items (currently 8 heading elements chroming 4 choices); transport audition cluster per shell.
- **DELETE/MERGE**: the scaleStrip's second 5-mode comparator merges into the one mode seg; `workbench-note` and two of the three stacked purpose sentences go.
- **FIX**: hold chip carries the same `data-step` as its main chip so BOTH light `.active` (app.js:1049, 5354-5356) — give holds a distinct data attribute; `prev` wraps to the last chord at step 0 so first paint shows false "moved voices" coloring (app.js:1024) — suppress moved/held styling until a step has played; restyle the main+hold pair as one wide chip with a tail so it can't read as two chords.

### 2.4 TRIADS / COMP
- **LEAD**: the pulse skeleton with a visible Play control.
- **KEEP**: Play (restored — see fix), pulse/skeleton stepper, tempo.
- **FOLD**: settings into Setup `<details>` per doctrine.
- **FIX**: copy says "Press Play" while styles.css:1742 hides the entire transport for `data-view="triads"` and playback only works via undocumented Space — either unhide a per-panel Play or rewrite the copy; update the stale "Practice setup" drawer-group name in the same string (now "Practice ensemble").

### 2.5 EAR TRAINING
- **LEAD**: "▶ Start question" + the 5-button guess grid; nothing above them but the guide h1.
- **KEEP**: Start; guess grid; drill seg (2); Check.
- **FOLD**: home/tonic reference row into Setup; `earScore` shows only the active drill's line (streak labeled), full totals behind tap.
- **DELETE/MERGE**: `ear-start-steps` (verbatim duplicate of guide steps 200px above); `ear-voice-note` (restates earAudioStatus); ear-hint merges into `earFeedback`'s idle text; unify the colour-drill `.ear-reference` row and the map drill's `earMapHomeSel` into one component with two states.
- **FIX**: guide tests `home === "blind"` but values are `"random"`/tonic — blind training shows wrong header copy (app.js:341-342 vs 2123); feedback says "Check answer" but button is "Check + reveal", and colour-drill copy says "Choose a map" (the other drill's noun); tab "2 · Home + changes" auto-plays audio and relabels the start button before the user ever pressed Start (app.js:2210, 2090) — never autoplay; keep the ▶ glyph when buttons relabel to "Next question"/"Next map".

### 2.6 MELODY → HARMONY
- **LEAD**: "▶ Start next note" + the 7 degree choices.
- **KEEP**: Start; the 7 choices (merged with the 7-chip `melodyScaleRail` — one row, not two sevens); Check.
- **FOLD**: setup (tonic, 5 mode buttons, 2 depth buttons) into Setup `<details>`; post-Check reveal becomes **staged disclosure** (https://www.nngroup.com/articles/progressive-disclosure/): show identity + next-move first, the other numbered sections (candidates/moves/sing — the sing block alone has ~12 sub-elements) behind "More ▾"; the two `melody-boundary` fine-print paragraphs into the guide details.
- **FIX**: none flagged beyond structure; verify the 21-controls-before-reveal count drops below 12 as the PR's acceptance test.

### 2.7 PICKING LAB
- **LEAD**: the Now/Next motion panel first block after the header (it is the instruction), with Start as its visual peer — not only in the far footer.
- **KEEP**: exercise select (grouped); Start; BPM (slider + live readout); pass-loop block (clean/+4/−4 merged with the `pickingPasses` tally into ONE block).
- **FOLD**: detail grid collapses to one "This pass" section, Theory joins the evidence `<details>`; stroke key renders only glyphs present in the session, its two layout paragraphs move to evidence; science + ceiling copy to one line each; mastery spine becomes 6 number-dots.
- **DELETE**: `deck-hint` meta-instruction; duplicate `exercise.short` in setup; duplicate articulation label; `.picking-rhythm-ruler` (pulse already stated twice elsewhere); `mark.short` text on every event tile (glyph suffices); readout `lab-stats`; single-tile `pickingRunMap` in loop mode; the dead `pickingSetup` header (permanently hidden and its copy is wrong).
- **FIX**: "Band keys" option silently coerced to "position" — add `"band"` to the onchange whitelist (app.js:5962; whole band branch is dead via UI); `pickingBpmNum` never updated after slider//+4/−4/band-start changes (set once at 5955); mastery grid `repeat(5,…)` for 6 phases orphans stage 6; `classList.toggle("hidden", false)` hardcoded no-op on route seg — gate on exercises that actually route; slider allows 30–220 but ladder caps 180/floors 40 — align bounds.

### 2.8 SOLO LAB (biggest rework: 65–70 controls, current/next chord restated in SEVEN places)
- **LEAD**: fretboard + ONE Now→Next strip + the "smallest useful move" motion line (the best element on the page, promoted).
- **KEEP**: Play; the merged Now/Next strip; section nav (5); one lens control.
- **FOLD**: toolkit (3 pillars × 14 tools — a whole second app) collapsed by default as its own sub-tab/`<details>`; everything in soloRecipe below the targets block; "Hear·think·play" folds into the timing-matrix header; soloMapControls' mode grid (duplicates global context) into Setup.
- **DELETE/MERGE**: merge the three progression displays (current-change strip, roadmap cards, HUD cards) into the one strip; delete `.solo-neck-zones` (the fretboard already shows it; zone filter becomes one chip in the existing neckMode row — two overlapping scoping controls today); collapse the 8 "Landing target" buttons into the single lens control (three writers of `state.solo.focus` today); merge the four conflicting legends into one vocabulary; shape-cards intro to one sentence.
- **FIX**: triple render — `renderSoloSection` re-calls `renderSoloLayerChips()` after `renderSolo()` already did, and `setView` calls it a third time (app.js 5031/5153-5158/5584); one-way lens/tool sync — focus buttons must deselect/update the tool card; static markup ships `soloRoad` visible under a nav claiming section 1 — fix the shipped state, don't rely on `setSoloSection` repair; isolate buttons never get `on`/`aria-pressed`; remove render-time state mutation in `activeTool()`; make `frame.name` guards consistent.

### 2.9 SONGS / REPERTOIRE
- **LEAD**: the chart body. Reorder to song-head → tabs → chart; analysis-about-the-chart moves below it.
- **KEEP**: tabs; "Analyze these changes"; "Solo in D".
- **FOLD**: `song-note` + fit breakdown into a `<details>` under the chart; show only the best-fit chip inline (five near-zero chips are noise).
- **DELETE**: songs-head tagline; hide `songList` until `SL.SONGS.length > 1` (there is exactly one song); the fit strip's 2-sentence methodology `<em>` → one clause; the song-note sentence duplicating the Analyze button.
- **FIX**: "Solo in D" sets `state.tonic = song.home` but ignores the song's dromos/mode — carry the mode too; remove the dead-transport shell state (fixed by shell view-capability table).

### 2.10 ANALYZE
- **LEAD**: the `analysisChords` textarea + "Analyze chord map" button at the top; the `analysis-answer` + fretboard directly under the result (currently the entry point and answer are the LAST things on the page).
- **KEEP**: textarea + Analyze; key select; mode seg (5).
- **FOLD**: study starters to a one-row "try:" chip strip; MusicXML import to a single small button whose explanation lives in the status/error path; `analysis-help` only on focus/content.
- **DELETE/MERGE**: five disclaimers → one sentence in the guide details; one of the two identical chord strips (`analysis-map` vs `analysis-position-strip` render the same records with the same behavior); duplicate "Authorised study starters" label.
- **FIX**: **harmonic minor silently analyzed as natural minor** — `MODE_OFFSETS` lacks `harmonicMinor` so AN:168 falls back while the button shows active and the raised 7th gets labeled "outside"; also add the missing `homeLabel` entry; stale "Auto-selected {location}" copy when position is pinned; keyboardHint claims Space plays where Space is dead (add an analyze case); TEXTAREA keydown fix lands in shell PR but re-test here.

### 2.11 STYLES
- **LEAD**: the `pulse-strip`, promoted out of mid-card; Greek section becomes the default (the tab is named "Greek Pulse" but opens on Foundation — label/content mismatch).
- **KEEP**: section seg (2); style cards; `btnOpenSongMap`.
- **FOLD**: `style-source` into the last foundation card.
- **DELETE**: both `style-intro` paragraphs (guide covers them); "Map next" job block (`btnOpenSongMap` is its actionable form) — four restatements of "then open Song Map" become one.
- **FIX**: stale keyboardHint (Space dead, arrows dead) — per-view hint from the shell table.

### 2.12 VIDEO
- **LEAD**: lesson library first (step 1 of its own guide is currently the last element), then player with Set A / Set B / Play-loop as the prominent cluster.
- **KEEP**: lesson cards; Set A / Set B / Play loop; speed select.
- **FOLD**: intro + disclaimer merge into one short footer line.
- **DELETE**: `video-study-tip` (duplicates the pageGuide step-for-step).
- **FIX**: `loadYoutubeApi()` has no `onerror`/timeout so the "Open on YouTube" fallback can never render — offline users get an empty div (add rejection path; this is the offline-capable app's worst failure); default 0–8s loop with `loopOn=true` traps all playback in the first 8 seconds — default loop OFF until A/B is set; A/B sliders hardcoded `max=300` — set max from duration `onReady` and clamp writes; give feedback (disabled state) on Play before ready; stop the 120ms loop-guard interval on PAUSE, not just ENDED; re-sync the speed select on lesson switch; per-view keyboardHint.

### 2.13 EXAMPLES
- **LEAD**: the `example-detail` article (numbered steps + "Hear the note path").
- **KEEP**: example picker; the hear button.
- **FOLD**: everything else per doctrine.
- **FIX**: half-disabled transport bar + stale readout (shell view-capability table hides both); disable-states audit after shell PR.

=================================================================
PART 3 — BUILD ORDER (one page = one PR)
=================================================================

| # | PR | Why this order |
|---|----|----|
| 1 | **Shell + tokens** (2.0 + Part 1.1/1.2 CSS) | Everything inherits the tokens; kills the 4 worst global bugs (unclosable drawer, textarea hijack, false hint, dead transports via the view-capability table). No page PR is reviewable against old chrome. |
| 2 | **Motion kit** (Part 1.3) | Small, isolated utilities file-section + `startViewTransition` wrapper; page PRs then get motion for free. Reduced-motion path proven here once. |
| 3 | **Cycle** | The actual default landing — highest-traffic screen, and it carries the four-way pivot duplication; proves the LEAD/KEEP/FOLD template on the hardest harmony page. |
| 4 | **Today + default-view decision** | Cheap PR (mostly deletion) that resolves the landing contradiction; do it right after Cycle so the two landings are coherent together. |
| 5 | **Ear** | Simplest practice page; validates the drill-page pattern (Start + choices + staged feedback) with real bug fixes. |
| 6 | **Melody** | Reuses the drill pattern from PR 5 nearly verbatim (staged reveal). |
| 7 | **Progressions** | Harmony family, reuses Cycle's strip/Setup patterns; two real rendering bugs (double-active, false first-paint coloring). |
| 8 | **Triads/Comp** | Small; depends on shell's view-capability table (Play restoration). |
| 9 | **Picking** | Self-contained lab; 6 concrete bugs incl. the unreachable band feature; benefits from pass-loop pattern maturity. |
| 10 | **Solo** | Deliberately late: the 65-control rework is the riskiest diff; by now every pattern it needs (merged Now/Next strip, one-lens rule, collapsed toolkit, Setup details) exists and is proven. |
| 11 | **Analyze** | The harmonicMinor correctness fix touches analysis.js data tables — isolate it; page reorder is mechanical. |
| 12 | **Songs** | Tiny after the shell table fix; includes the "Solo in D" mode-carry fix. |
| 13 | **Styles** | Near-pure deletion + default-section flip. |
| 14 | **Video** | Isolated in video.js; the offline fallback fix is self-contained. |
| 15 | **Examples** | Smallest; mostly inherits shell fixes. |

Acceptance gate for every page PR (from the doctrine): first paint shows answer + primary action + Now/Next + ≤4 page controls; exactly one purpose sentence; every interactive target ≥44px on coarse pointers; no font below 11px; `prefers-reduced-motion` verified; the audit's bug list for that page checked off in the PR description.