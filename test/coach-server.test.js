import assert from "node:assert/strict";
import test from "node:test";
import { action, coachContext, coachReply, selfTest } from "../api/_lib/validation.js";
import { progressSummary, recommendation } from "../api/_lib/recommendations.js";
import { answerCoach } from "../api/_lib/model.js";
import { createSession, readSession } from "../api/_lib/session.js";
import { requestTooLarge } from "../api/_lib/http.js";

test("server rejects unsafe coach actions and preserves only known routes", () => {
  assert.equal(selfTest().ok, true);
  assert.deepEqual(
    action({ kind: "song_map", tonic: "D", modeId: "minor", progressionId: "iv-V-i" }),
    { kind: "song_map", tonic: "D", modeId: "minor", progressionId: "iv-V-i" }
  );
  assert.equal(action({ kind: "navigate", view: "https://not-a-practice-view.example" }), null);
  assert.equal(coachReply({ answer: "A useful answer", action: { kind: "study", studyId: "not-known" } }).action, null);
  assert.equal(coachReply({ answer: "A useful answer", action: { kind: "none" } }).action, null);
});

test("request limits apply even when a host has already parsed the JSON body", () => {
  assert.equal(requestTooLarge({ headers: {}, body: { question: "x".repeat(17_000) } }), true);
  assert.equal(requestTooLarge({ headers: { "content-length": "20" }, body: "{}" }), false);
});

test("progress recommendations use learning events before generic navigation", () => {
  const context = coachContext({ tonic: "D", modeId: "minor", progressionId: "iv-V-i", view: "prog" });
  const events = [{ event_type: "target_missed", payload: { reason: "missed-third" } }];
  const next = recommendation(context, events);
  assert.equal(next.action.kind, "solo_lab");
  assert.equal(next.action.section, "targets");
  assert.deepEqual(progressSummary([{ event_type: "exercise_completed" }, { event_type: "ear_answered", payload: { result: "correct" } }]), {
    completed: 1, targetMisses: 0, earAttempts: 1, earCorrect: 1
  });
});

test("coach session is signed, expiring, and cannot be altered", () => {
  const prior = process.env.COACH_SESSION_SECRET;
  process.env.COACH_SESSION_SECRET = "this-is-a-test-secret-with-more-than-thirty-two-characters";
  const profileId = "ec3e9c93-ca45-44e8-91e1-62f483840f6a";
  const now = 1_700_000_000_000;
  const token = createSession(profileId, now);
  assert.equal(readSession(token, now).profileId, profileId);
  assert.equal(readSession(token.replace(/.$/, "x"), now), null);
  if (prior == null) delete process.env.COACH_SESSION_SECRET;
  else process.env.COACH_SESSION_SECRET = prior;
});

test("coach model request is structured, bounded, and uses the economical default", async () => {
  const priorKey = process.env.GEMINI_API_KEY;
  const priorModel = process.env.GEMINI_COACH_MODEL;
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_COACH_MODEL;
  let sent;
  let sentUrl;
  const reply = await answerCoach({
    question: "Why does A7 pull to D minor?",
    context: coachContext({ tonic: "D", modeId: "minor", progressionId: "iv-V-i" }),
    history: [], progress: {},
    fetchImpl: async (_url, init) => {
      sentUrl = _url;
      sent = JSON.parse(init.body);
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ answer: "A7 contains C♯, the raised 7th that resolves toward D.", action: { kind: "song_map", tonic: "D", modeId: "minor", progressionId: "iv-V-i", view: "", studyId: "", styleId: "", section: "", chords: "", line: "" } }) }] } }] }) };
    }
  });
  assert.equal(sent.generationConfig.responseMimeType, "application/json");
  assert.equal(sent.generationConfig.maxOutputTokens, 800);
  assert.equal(sent.generationConfig.responseJsonSchema.properties.action.properties.kind.enum[0], "none");
  assert.match(sentUrl, /gemini-3\.1-flash-lite:generateContent$/);
  assert.equal(reply.action.kind, "song_map");
  if (priorKey == null) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = priorKey;
  if (priorModel == null) delete process.env.GEMINI_COACH_MODEL;
  else process.env.GEMINI_COACH_MODEL = priorModel;
});
