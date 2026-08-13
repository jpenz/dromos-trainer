import { neon } from "@neondatabase/serverless";

let sqlClient;
let schemaPromise;

function sql() {
  if (!process.env.DATABASE_URL) throw new Error("database_not_configured");
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = sql();
      await db`CREATE TABLE IF NOT EXISTS practice_profiles (
        id UUID PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        context JSONB NOT NULL DEFAULT '{}'::jsonb
      )`;
      await db`CREATE TABLE IF NOT EXISTS coach_messages (
        id BIGSERIAL PRIMARY KEY,
        profile_id UUID NOT NULL REFERENCES practice_profiles(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        action JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await db`CREATE TABLE IF NOT EXISTS practice_events (
        id BIGSERIAL PRIMARY KEY,
        profile_id UUID NOT NULL REFERENCES practice_profiles(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await db`CREATE INDEX IF NOT EXISTS coach_messages_profile_created_idx ON coach_messages(profile_id, created_at DESC)`;
      await db`CREATE INDEX IF NOT EXISTS practice_events_profile_created_idx ON practice_events(profile_id, created_at DESC)`;
    })().catch((error) => { schemaPromise = null; throw error; });
  }
  await schemaPromise;
}

export async function upsertProfile(profileId, context) {
  await ensureSchema();
  const rows = await sql()`INSERT INTO practice_profiles (id, context)
    VALUES (${profileId}, ${JSON.stringify(context)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET last_active_at = NOW(), context = EXCLUDED.context
    RETURNING id, created_at, last_active_at, context`;
  return rows[0];
}

export async function saveMessage(profileId, role, content, action = null) {
  await ensureSchema();
  await sql()`INSERT INTO coach_messages (profile_id, role, content, action)
    VALUES (${profileId}, ${role}, ${content}, ${action ? JSON.stringify(action) : null}::jsonb)`;
}

export async function recentMessages(profileId, limit = 12) {
  await ensureSchema();
  const rows = await sql()`SELECT role, content, action, created_at FROM coach_messages
    WHERE profile_id = ${profileId} ORDER BY created_at DESC, id DESC LIMIT ${Math.min(limit, 30)}`;
  return rows.reverse();
}

export async function messageCountSince(profileId, seconds) {
  await ensureSchema();
  const rows = await sql()`SELECT COUNT(*)::int AS count FROM coach_messages
    WHERE profile_id = ${profileId} AND role = 'user' AND created_at > NOW() - (${seconds} * INTERVAL '1 second')`;
  return rows[0].count;
}

export async function recordEvent(profileId, eventType, payload, context) {
  await ensureSchema();
  await upsertProfile(profileId, context);
  await sql()`INSERT INTO practice_events (profile_id, event_type, payload)
    VALUES (${profileId}, ${eventType}, ${JSON.stringify(payload)}::jsonb)`;
}

export async function recentEvents(profileId, limit = 100) {
  await ensureSchema();
  return sql()`SELECT event_type, payload, created_at FROM practice_events
    WHERE profile_id = ${profileId} ORDER BY created_at DESC, id DESC LIMIT ${Math.min(limit, 200)}`;
}

export async function profileWithProgress(profileId) {
  await ensureSchema();
  const [profile, events, messages] = await Promise.all([
    sql()`SELECT id, created_at, last_active_at, context FROM practice_profiles WHERE id = ${profileId}`,
    recentEvents(profileId, 100),
    recentMessages(profileId, 16)
  ]);
  return { profile: profile[0] || null, events, messages };
}
