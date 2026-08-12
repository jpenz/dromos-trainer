# AI Practice Coach — implementation decision record

Status: **approved product requirement; waiting on hosting and server-secret setup**.

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
2. Store `OPENAI_API_KEY` only as a host environment secret. Never ship it in
   JavaScript, a PWA cache, Git, or an `.env` committed to the repository.
3. Call the **Responses API** with the current flagship `gpt-5.6-sol` for
   high-value/deep questions. Start at `reasoning.effort: medium`; compare `high`
   against representative coach questions before paying for it by default.
4. Require structured output with two parts: `answer` and optional `action`.
   The action is a closed union: `navigate`, `set_song_map`, `open_study`, or
   `open_analyzer`. The browser validates it against known mode, tuning, study and
   view IDs, shows it as a button, and performs it only when the player taps.
5. Make the system prompt short and specific: Greek/Balkan-first intermediate
   teacher; answer conditionally where the score/audio context is incomplete;
   distinguish pulse, dromos, harmony, route, and touch; do not reproduce
   copyrighted notation or imitate a named living player.
6. Keep conversation history on-device by default, with an explicit privacy notice.
   Send only the conversation and score excerpt the player chooses to submit.
7. Add request-size limits, rate limiting, error UI, and an evaluation fixture set:
   ii–V–I pivot, Ousak-vs-minor, Hijaz ♭II, major IV in minor, Zeibekiko pulse,
   laouto triads, and a user MusicXML chord/line import.

## Why it is not yet coded into the static app

The current application is intentionally dependency-free and can open from `file://`.
An AI API call changes the trust boundary and creates usage cost. A browser-only
implementation would expose the API key, so the server endpoint and deployment must
be selected before the chat UI is allowed to imply that it is live.

## Decision required

Choose the serverless host for `/api/coach` and set the API secret there. The
recommended first deployment is the host already used for the project, if any;
otherwise Vercel is a straightforward fit for a static site plus one serverless API
route. Do not send an API key in chat.

## Sources

- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [GPT-5.6 Sol model page](https://developers.openai.com/api/docs/models/gpt-5.6-sol)
