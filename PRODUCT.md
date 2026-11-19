# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- James Penz, a Greek laiko and rebetiko guitarist and bouzouki player, practising for his own playing and for his band, which sings mostly in G and plays in the band keys D, G, A, E and C.
- His band mates, learning the same songs, keys and rhythms.
- Students he teaches Greek guitar or bouzouki.
- The public: anyone who finds it, the way people find free guitar tools.

All four practise with both hands on the instrument and the app open beside them, often for an hour or more at a time.

## Product Purpose

A practice trainer for Greek popular music on guitar, tetrachordo and trichordo bouzouki, and laouto. It turns a dromos (major, natural minor, harmonic minor, ousak, hijaz), a key, a Greek rhythm and a progression into ear drills, a fretboard map, comping, soloing paths and picking exercises, and it schedules what to practise next. Success is a player whose picking is accurate and fast inside the Greek rhythms and who can play through the changes in any band key.

## Positioning

Built from the dromoi and the Greek rhythms (zeibekiko, kalamatianos, syrtos, hasapiko, hasaposerviko, tsifteteli, roumba) rather than from Western scales and pop meters, with bouzouki courses treated as first-class, and every drill labelled with the teacher, book or video it comes from.

## Operating Context

- Used on a laptop or desktop beside the player, an iPad on a music stand at reading distance, and a phone for short sessions.
- Long sessions: the screen is read while playing, often with only glances away from the instrument.
- Playback, a click, a microphone listener that scores each loop, spaced review and a daily session are part of the practice loop.
- The person may be playing along to the app's sound, to headphones, or to a band.

## Capabilities and Constraints

- Zero-build vanilla JavaScript (IIFE modules), one stylesheet, offline-capable PWA with a service worker; deployed on Vercel from `main`; `npm test` gates every change.
- Pages today: Today (20-minute session), Ear, Melody, Harmony (Changes Gym, Song Map, Comp), Solo, Picking (81 drills in ten categories, Phrase workbench, Rhythm comp, Chord picking), Matrix, Repertoire (Songs, Analyze), Learn (Greek Pulse, Video Study, Tactical Examples, Concepts), Coach, Progress.
- Instruments: guitar, guitar drop D, bouzouki tetrachordo, bouzouki trichordo, laouto.
- Every feature stays: the redesign reorganises and restyles, it removes nothing.
- Asset versions are bumped in index.html, sw.js and api/release.js on every asset change.

## Brand Commitments

- The name Dromos, the Greek greeting on Today, and Greek lettering where the music is Greek.
- Source labels on every drill (for example Marbin, Billy Strings, Trigas, Pagiatis), with the source type visible.
- No em dashes in player-facing copy.

## Evidence on Hand

- Research notes behind the drills in `~/agentforge/work/dromos-research/` (Marbin channel, spread triads, Billy Strings videos and exercises).
- No testimonials, user counts or ratings exist; none may be invented.

## Product Principles

1. The neck and the thing to play come first; explanation is one tap away, never in the way.
2. Every tool is findable by what the player wants to do: learn the neck, practise, play and write, ears and rhythm.
3. Greek first: dromoi, Greek rhythms and bouzouki courses are the native vocabulary, Western theory the import.
4. Built for hours: legible at a music-stand distance, calm under long use, no clutter.
5. Honest sources: every exercise says where it comes from.

## Accessibility & Inclusion

Readable at arm's length on an iPad; full keyboard control on desktop (space, arrows, C and X scoring); reduced-motion respected.
