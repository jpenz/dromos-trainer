# AI Practice Coach — implementation decision record

Status: **implemented and verified locally; waiting for Vercel/Neon provisioning and
environment secrets before it becomes live**.

## Outcome

The coach should answer a player in plain language, using the active tuning, dromos,
song map, selected study, and current exercise. It should then offer one clear next
exercise and be able to open it. Examples:

- “I cannot hear the move from Gm to A7” → explain the dominant pull in D minor,
  then offer **Open Song Map: D minor, iv–V–i**.
- “Where are Dm triads on mainland laouto?” → explain the choice, then open
  **Triads: D minor, Laouto A–D–G–C**.
- “What should I practise for Hijaz Zeibekiko?” → distinguish pulse from dromos,
  then offer **Styles: Zeibekiko** and **Song Map: D Hijaz**.

## Recommended production design

1. Keep the static practice engine local. Add a serverless `POST /api/coach` endpoint
   on the selected host; the browser sends only the current, user-visible practice
   context and the question.
2. Store `GEMINI_API_KEY` only as a host environment secret. Never ship it in
   JavaScript, a PWA cache, Git, or an `.env` committed to the repository.
3. Call the Gemini API with `gemini-3.1-flash-lite`, the lowest-cost capable
   structured-output option researched for short coaching replies and exercise
   routing. It is capped at 800 output tokens and required to return JSON. A stronger
   model is an explicit future escalation for difficult score analysis—not the default.
4. Require structured output with two parts: `answer` and optional `action`.
   The action is a closed union: `navigate`, `set_song_map`, `open_study`, or
   `open_analyzer`. The browser validates it against known mode, tuning, study and
   view IDs, shows it as a button, and performs it only when the player taps.
5. Make the system prompt short and specific: Greek/Balkan-first intermediate
   teacher; answer conditionally where the score/audio context is incomplete;
   distinguish pulse, dromos, harmony, route, and touch; do not reproduce
   copyrighted notation or imitate a named living player.
6. Give each device an opaque, signed anonymous practice profile. Conversation,
   practice events, current context and recommendations are held in Neon for that
   profile; the token is stored locally in the browser. Cross-device accounts are a
   later, explicit authentication decision.
7. Add request-size limits, rate limiting, error UI, and an evaluation fixture set:
   ii–V–I pivot, Ousak-vs-minor, Hijaz ♭II, major IV in minor, Zeibekiko pulse,
   laouto triads, and a user MusicXML chord/line import.

## Current implementation

The app now includes the Coach practice area, signed anonymous-device sessions,
conversation and event logging, progress summaries, adaptive recommendations, a
12-question/minute database-backed limit, and guarded one-tap routing. The browser
still works from `file://`, but the coach visibly stays offline there. The live
endpoint is Vercel Functions plus Neon Postgres; API and database keys never enter
the browser bundle.

## Decision required

Provision Neon through Vercel Marketplace and add the four variables listed in
`.env.example` in Vercel Project Settings. The exact deployment checklist is in
[DEPLOYMENT.md](DEPLOYMENT.md). Do not send an API key in chat.

## Sources

- [Gemini 3.1 Flash-Lite pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
