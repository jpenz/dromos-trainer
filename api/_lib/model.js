import { coachReply } from "./validation.js";

// Keep this deliberately portable: Gemini structured output supports this small
// JSON-schema subset, and validation below remains the final authority.
const RESPONSE_SCHEMA = {
  type: "object",
  required: ["answer", "action"],
  properties: {
    answer: { type: "string" },
    action: {
      type: "object",
      required: ["kind", "view", "tonic", "modeId", "progressionId", "studyId", "styleId", "section", "chords", "line"],
      properties: {
        kind: { type: "string", enum: ["none", "navigate", "song_map", "study", "style", "solo_lab", "analyzer"] },
        view: { type: "string" }, tonic: { type: "string" }, modeId: { type: "string" },
        progressionId: { type: "string" }, studyId: { type: "string" }, styleId: { type: "string" },
        section: { type: "string" }, chords: { type: "string" }, line: { type: "string" }
      }
    }
  }
};

const SYSTEM_PROMPT = `You are Dromos Coach, a serious but encouraging self-teaching coach for intermediate guitar, Greek bouzouki (three- and four-course), and mainland laouto players. Teach Greek/Balkan music first while using transferable harmony, triad, voice-leading, pentatonic, and ear-training ideas. Answer directly in plain language, then give one precise next practice decision. Keep Time/Form, Modal-Harmonic Map, Melodic Route, and Touch/Instrument Role distinct. A dance pulse is not a dromos. Chord symbols alone do not prove an exact key, dromos, or transcription: say what is possible or likely when evidence is incomplete. Do not reproduce commercial notation, lyrics, recordings, or named-player licks. Do not claim to have heard audio that was not provided. Return exactly one action object. Use kind "none" and empty strings for every other action field when no route is clearly useful.`;

function outputText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  return Array.isArray(parts) ? parts.filter((part) => typeof part.text === "string").map((part) => part.text).join("\n") : "";
}

export async function answerCoach({ question, context, history, progress, fetchImpl = fetch }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("coach_model_not_configured");
  const input = {
    question,
    currentPracticeContext: context,
    recentConversation: history.map((message) => ({ role: message.role, content: message.content })),
    recentProgress: progress
  };
  const model = process.env.GEMINI_COACH_MODEL || "gemini-3.1-flash-lite";
  const response = await fetchImpl("https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA
      }
    })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error("coach_model_error:" + response.status + ":" + detail.slice(0, 240));
  }
  const parsed = coachReply(JSON.parse(outputText(await response.json())));
  if (!parsed) throw new Error("coach_model_invalid_reply");
  return parsed;
}

export { RESPONSE_SCHEMA, SYSTEM_PROMPT };
