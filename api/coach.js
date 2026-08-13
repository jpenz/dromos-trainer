import { failure, json, methodNotAllowed, requestBody, requestTooLarge } from "./_lib/http.js";
import { bearerSession } from "./_lib/session.js";
import { messageCountSince, profileWithProgress, recentEvents, recentMessages, saveMessage, upsertProfile } from "./_lib/db.js";
import { coachContext } from "./_lib/validation.js";
import { answerCoach } from "./_lib/model.js";
import { progressSummary, recommendation } from "./_lib/recommendations.js";

export const config = { api: { bodyParser: { sizeLimit: "16kb" } } };

function question(value) { return typeof value === "string" ? value.trim().slice(0, 1800) : ""; }

export default async function handler(request, response) {
  if (request.method !== "POST") return methodNotAllowed(response, ["POST"]);
  if (requestTooLarge(request)) return failure(response, "request_too_large", 413);
  const body = requestBody(request);
  const text = question(body.question);
  if (!text) return failure(response, "question_required");
  try {
    const session = bearerSession(request);
    if (!session) return failure(response, "unauthorized", 401);
    const context = coachContext(body.context);
    const sentInLastMinute = await messageCountSince(session.profileId, 60);
    if (sentInLastMinute >= 12) return failure(response, "rate_limited", 429);
    await upsertProfile(session.profileId, context);
    await saveMessage(session.profileId, "user", text);
    const [history, events] = await Promise.all([recentMessages(session.profileId, 10), recentEvents(session.profileId, 30)]);
    const reply = await answerCoach({
      question: text,
      context,
      history: history.slice(0, -1),
      progress: progressSummary(events)
    });
    await saveMessage(session.profileId, "assistant", reply.answer, reply.action);
    const data = await profileWithProgress(session.profileId);
    return json(response, 200, {
      answer: reply.answer,
      action: reply.action,
      actionLabel: reply.actionLabel,
      recommendation: recommendation(context, data.events),
      summary: progressSummary(data.events)
    });
  } catch (error) {
    if (/not_configured/.test(error.message)) return failure(response, "coach_not_configured", 503);
    if (/coach_model_error:(401|403)/.test(error.message)) return failure(response, "coach_model_not_configured", 503);
    console.error("coach error", error);
    return failure(response, "coach_unavailable", 503);
  }
}
