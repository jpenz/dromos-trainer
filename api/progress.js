import { failure, json, methodNotAllowed, requestBody, requestTooLarge } from "./_lib/http.js";
import { bearerSession } from "./_lib/session.js";
import { profileWithProgress, recordEvent, upsertProfile } from "./_lib/db.js";
import { coachContext, progressEvent } from "./_lib/validation.js";
import { progressSummary, recommendation } from "./_lib/recommendations.js";

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

function snapshot(data, fallbackContext) {
  const context = data.profile && data.profile.context ? coachContext(data.profile.context) : fallbackContext;
  return {
    profile: data.profile ? { id: data.profile.id, createdAt: data.profile.created_at, lastActiveAt: data.profile.last_active_at } : null,
    summary: progressSummary(data.events),
    recommendation: recommendation(context, data.events),
    messages: data.messages.map((message) => ({ role: message.role, content: message.content, action: message.action, createdAt: message.created_at }))
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "POST") return methodNotAllowed(response, ["GET", "POST"]);
  if (request.method === "POST" && requestTooLarge(request)) return failure(response, "request_too_large", 413);
  try {
    const session = bearerSession(request);
    if (!session) return failure(response, "unauthorized", 401);
    if (request.method === "GET") {
      const data = await profileWithProgress(session.profileId);
      return json(response, 200, snapshot(data, coachContext({})));
    }
    const event = progressEvent(requestBody(request));
    if (!event) return failure(response, "invalid_progress_event");
    await recordEvent(session.profileId, event.eventType, event.payload, event.context);
    const data = await profileWithProgress(session.profileId);
    return json(response, 201, snapshot(data, event.context));
  } catch (error) {
    if (/not_configured/.test(error.message)) return failure(response, "coach_not_configured", 503);
    console.error("progress error", error);
    return failure(response, "progress_unavailable", 503);
  }
}
