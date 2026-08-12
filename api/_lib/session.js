import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 180;

function secret() {
  const value = process.env.COACH_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("coach_session_not_configured");
  return value;
}

function signature(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function newProfileId() { return randomUUID(); }

export function createSession(profileId, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ v: 1, sub: profileId, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS })).toString("base64url");
  return payload + "." + signature(payload);
}

export function readSession(token, now = Date.now()) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [payload, received] = token.split(".");
  const expected = signature(payload);
  const left = Buffer.from(received || "");
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (decoded.v !== 1 || typeof decoded.sub !== "string" || !/^[0-9a-f-]{36}$/i.test(decoded.sub)) return null;
    if (!Number.isFinite(decoded.exp) || decoded.exp <= Math.floor(now / 1000)) return null;
    return { profileId: decoded.sub, expiresAt: decoded.exp };
  } catch { return null; }
}

export function bearerSession(request) {
  const value = request.headers.authorization || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? readSession(match[1]) : null;
}
