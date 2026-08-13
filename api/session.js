import { failure, json, methodNotAllowed, requestBody, requestTooLarge } from "./_lib/http.js";
import { createSession, newProfileId } from "./_lib/session.js";
import { upsertProfile } from "./_lib/db.js";
import { coachContext } from "./_lib/validation.js";

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

export default async function handler(request, response) {
  if (request.method !== "POST") return methodNotAllowed(response, ["POST"]);
  if (requestTooLarge(request)) return failure(response, "request_too_large", 413);
  try {
    const context = coachContext(requestBody(request).context);
    const profileId = newProfileId();
    const profile = await upsertProfile(profileId, context);
    return json(response, 201, { token: createSession(profileId), profile: { id: profile.id, createdAt: profile.created_at } });
  } catch (error) {
    if (/not_configured/.test(error.message)) return failure(response, "coach_not_configured", 503);
    console.error("session error", error);
    return failure(response, "session_unavailable", 503);
  }
}
