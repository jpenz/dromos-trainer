export function json(response, status, payload) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

export function methodNotAllowed(response, allowed) {
  response.setHeader("Allow", allowed.join(", "));
  return json(response, 405, { error: "method_not_allowed" });
}

export function requestBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body !== "string") return {};
  try { return JSON.parse(request.body); }
  catch { return {}; }
}

export function requestTooLarge(request, maximumBytes = 16_384) {
  const length = Number(request.headers["content-length"] || 0);
  if (Number.isFinite(length) && length > maximumBytes) return true;
  const body = request.body;
  if (typeof body === "string") return Buffer.byteLength(body, "utf8") > maximumBytes;
  if (body && typeof body === "object") return Buffer.byteLength(JSON.stringify(body), "utf8") > maximumBytes;
  return false;
}

export function failure(response, error, status = 400) {
  return json(response, status, { error });
}
