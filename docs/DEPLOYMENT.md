# Vercel deployment

The static app remains usable without a server. The **Coach** becomes live only when
the Vercel Functions and Neon database below are configured.

## 1. Import the GitHub repository into Vercel

1. In Vercel, choose **Add New → Project** and import `jpenz/dromos-trainer`.
2. Use the repository root as the project root. It has no build command; Vercel
   serves the static files and discovers the `api/` functions automatically.
3. Deploy once so Vercel creates the project environment.

## 2. Add Neon Postgres through Vercel Marketplace

1. Open the project’s **Storage** area or Vercel Marketplace and install **Neon**.
2. Create a database in a region close to the Vercel Function region.
3. Connect it to this project. Vercel should inject `DATABASE_URL` automatically.

The application creates its three small tables on its first authenticated request:
`practice_profiles`, `coach_messages`, and `practice_events`. Neon is the right fit
because conversation and progress need relational ownership, history, and
recommendation queries—not a transient browser-only cache.

## 3. Add Vercel environment secrets

In **Project Settings → Environment Variables**, add these for **Preview** and
**Production**. Mark secrets as sensitive.

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | A Google AI Studio **Free Tier** API key; never commit or paste it into chat |
| `GEMINI_COACH_MODEL` | `gemini-3.1-flash-lite` |
| `DATABASE_URL` | Normally injected by the Neon Marketplace integration |
| `COACH_SESSION_SECRET` | A randomly generated value of at least 32 characters |

Generate the session secret locally, then paste it directly into Vercel:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Do not use `GEMINI_API_KEY` with a `NEXT_PUBLIC_` prefix; that would expose it to
the browser. The code reads it only inside Vercel Functions.

## 4. Verify a preview before production

1. Deploy this branch as a Preview.
2. Confirm the top bar shows the local player and instrument. Open **Coach**; it
   should connect to that player's anonymous history rather than show setup warning.
3. Ask: “Why does A7 pull to D minor?” You should receive an explanation plus an
   action that opens the D-minor Song Map.
4. Mark a drill complete, reload, and confirm the conversation/progress remains.
5. Promote only after this works in Preview.

## Operating boundaries

- Named player profiles and settings are local to one browser/device. Each maps to a
  separate signed anonymous Coach session, but is not a login and cannot be recovered
  on another device. Add server-validated account sign-in only as a separately
  provisioned migration with explicit anonymous-history claiming.
- The model sees the submitted question, current practice context, the recent coach
  conversation and compact progress counters. MusicXML/PDF data is not uploaded by
  default.
- The coach can offer only validated in-app routes. It cannot edit data externally,
  visit arbitrary URLs, or expose a secret.
- Gemini 3.1 Flash-Lite is the selected **free** model. New Gemini accounts begin
  on the Free Tier and this model's standard input/output is free of charge within
  its published rate limits. This means capacity is not guaranteed for a public app;
  the endpoint can temporarily rate-limit requests. Google says Free Tier content may
  be used to improve its products, so the Coach requires a visible acknowledgement
  and must not be used for sensitive/private material. Move to Paid Tier only when
  reliable capacity and the no-product-improvement data setting outweigh free use.

## Sources

- [Vercel Marketplace storage](https://vercel.com/docs/marketplace-storage)
- [Neon for Vercel](https://vercel.com/marketplace/neon)
- [Vercel environment variables](https://vercel.com/docs/environment-variables/manage-across-environments)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
