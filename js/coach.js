/* coach.js — browser client for the secure, server-hosted Practice Coach.
 * The browser holds an opaque signed session token, never an AI or database key.
 */
(function () {
  "use strict";

  const TOKEN_KEY = "dromos-trainer-coach-session-v1";
  const FREE_TIER_ACK_KEY = "dromos-trainer-coach-free-tier-ack-v1";
  const VIEWS = ["cycle", "prog", "triads", "solo", "ear", "styles", "video", "analyze", "concepts"];
  const MODES = ["major", "minor", "ousak", "hijaz"];
  const TONICS = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const STUDIES = ["paliatzis", "apopse", "tsigaro"];
  const STYLES = ["zeibekiko", "kalamatianos", "hasapiko", "tsifteteli", "roumba"];
  const SECTIONS = ["road", "path", "phrase", "targets", "cell"];
  const state = { token: "", status: "idle", messages: [], summary: null, recommendation: null, lastViewKey: "", lastViewAt: 0, freeTierAcknowledged: false };
  let config = { context: () => ({}), onAction: () => {} };
  let sessionPromise = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[character]));
  }
  function text(value, limit) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
  function member(value, values) { return values.includes(value) ? value : null; }

  function normaliseAction(value) {
    if (!value || typeof value !== "object") return null;
    if (value.kind === "navigate" && member(value.view, VIEWS)) return { kind: "navigate", view: value.view };
    if (value.kind === "song_map" && member(value.tonic, TONICS) && member(value.modeId, MODES) && text(value.progressionId, 50)) {
      return { kind: "song_map", tonic: value.tonic, modeId: value.modeId, progressionId: text(value.progressionId, 50) };
    }
    if (value.kind === "study" && member(value.studyId, STUDIES)) return { kind: "study", studyId: value.studyId };
    if (value.kind === "style" && (value.section === "foundation" || (value.section === "greek" && member(value.styleId, STYLES)))) {
      return { kind: "style", section: value.section, styleId: value.section === "greek" ? value.styleId : null };
    }
    if (value.kind === "solo_lab" && member(value.section, SECTIONS)) return { kind: "solo_lab", section: value.section };
    if (value.kind === "analyzer" && text(value.chords, 640)) {
      return { kind: "analyzer", tonic: member(value.tonic, TONICS) || "D", modeId: member(value.modeId, MODES) || "minor", chords: text(value.chords, 640), line: text(value.line, 960) };
    }
    return null;
  }

  function defaultActionLabel(action) {
    if (!action) return "";
    if (action.kind === "navigate") return "Open practice area";
    if (action.kind === "song_map") return "Open Song Map";
    if (action.kind === "study") return "Open study";
    if (action.kind === "style") return "Open style";
    if (action.kind === "solo_lab") return "Open Solo Lab";
    return "Open in Analyzer";
  }

  async function callApi(path, method, body) {
    const headers = { "Content-Type": "application/json" };
    if (state.token) headers.Authorization = "Bearer " + state.token;
    const response = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "coach_request_failed");
      error.code = data.error;
      throw error;
    }
    return data;
  }

  function isLocalFile() { return typeof location !== "undefined" && location.protocol === "file:"; }

  function forgetSession() {
    state.token = "";
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* session-only storage may be unavailable */ }
  }

  async function ensureSession() {
    if (isLocalFile()) {
      state.status = "offline";
      render();
      return false;
    }
    if (state.token) return true;
    if (sessionPromise) return sessionPromise;
    sessionPromise = (async () => {
      try { state.token = localStorage.getItem(TOKEN_KEY) || ""; } catch { state.token = ""; }
      if (!state.token) {
        const created = await callApi("/api/session", "POST", { context: config.context() });
        state.token = created.token;
        try { localStorage.setItem(TOKEN_KEY, state.token); } catch { /* private mode still works for this visit */ }
      }
      return true;
    })();
    try { return await sessionPromise; }
    finally { sessionPromise = null; }
  }

  function hydrate(data) {
    if (Array.isArray(data.messages)) {
      state.messages = data.messages.map((message) => ({
        role: message.role === "user" ? "user" : "assistant",
        content: text(message.content, 1800), action: normaliseAction(message.action)
      })).filter((message) => message.content);
    }
    if (data.summary) state.summary = data.summary;
    if (data.recommendation) state.recommendation = Object.assign({}, data.recommendation, { action: normaliseAction(data.recommendation.action) });
  }

  async function start() {
    if (state.status === "ready" || state.status === "loading" || isLocalFile()) return;
    state.status = "loading";
    render();
    try {
      if (await ensureSession()) {
        hydrate(await callApi("/api/progress", "GET"));
        state.status = "ready";
      }
    } catch (error) {
      if (error.code === "unauthorized") {
        forgetSession();
        try {
          await ensureSession();
          hydrate(await callApi("/api/progress", "GET"));
          state.status = "ready";
        } catch (retryError) {
          state.status = retryError.code === "coach_not_configured" ? "setup" : "unavailable";
        }
      } else state.status = error.code === "coach_not_configured" ? "setup" : "unavailable";
    }
    render();
  }

  function messageHtml(message, index) {
    const action = normaliseAction(message.action);
    const body = escapeHtml(message.content).replace(/\n/g, "<br>");
    return `<article class="coach-message ${message.role}"><span>${message.role === "user" ? "You" : "Dromos Coach"}</span><p>${body}</p>${action ? `<button class="coach-action" data-coach-action="${index}">${escapeHtml(message.actionLabel || defaultActionLabel(action))}</button>` : ""}</article>`;
  }

  function render() {
    const root = document.getElementById("coachApp");
    if (!root) return;
    const context = config.context();
    const status = state.status === "offline" ? "The coach activates after this app is deployed to Vercel. Your offline practice tools remain available." :
      state.status === "setup" ? "The coach endpoint is deployed but still needs its Vercel secrets and Neon connection." :
        state.status === "unavailable" ? "The coach is temporarily unavailable. Your local practice map remains intact." :
          state.status === "loading" ? "Connecting your private practice profile…" : state.status === "sending" ? "Listening, checking your current map, and choosing one next drill…" : "Your active instrument, dromos, pulse, and practice history guide this conversation.";
    const messages = state.messages.length ? state.messages : [{ role: "assistant", content: "Ask a theory, ear-training, comping, soloing, dromos, or instrument-position question. I will explain the musical reason and give one next exercise." }];
    const recommendation = state.recommendation ? `<section class="coach-recommendation"><span>Next recommendation</span><h3>${escapeHtml(state.recommendation.title)}</h3><p>${escapeHtml(state.recommendation.reason)}</p>${state.recommendation.action ? `<button class="coach-action" data-recommendation-action="true">${escapeHtml(state.recommendation.actionLabel || defaultActionLabel(state.recommendation.action))}</button>` : ""}</section>` : "";
    const progress = state.summary ? `<span class="coach-progress">${state.summary.completed} completed · ${state.summary.targetMisses} target misses · ${state.summary.earAttempts ? state.summary.earCorrect + "/" + state.summary.earAttempts + " ear" : "ear not started"}</span>` : "";
    const canAsk = state.status === "ready" && state.freeTierAcknowledged;
    root.innerHTML = `<section class="coach-shell"><div class="coach-head"><div><span>Adaptive practice coach</span><h2>Ask what matters. Then go straight to the drill.</h2><p>${escapeHtml(status)}</p></div>${progress}</div>${recommendation}<div class="coach-quick" aria-label="Suggested questions"><button data-coach-prompt="I cannot hear the next chord change. Give me one ear exercise for my current map.">I can’t hear the change</button><button data-coach-prompt="Explain the strongest notes for my current chord and show me the next drill.">What should I land on?</button><button data-coach-prompt="How should I phrase this in the current Greek style without overplaying?">How should I phrase it?</button></div><div id="coachMessages" class="coach-messages" aria-live="polite">${messages.map(messageHtml).join("")}</div><form id="coachForm" class="coach-form"><label for="coachQuestion">Ask the coach</label><textarea id="coachQuestion" rows="3" maxlength="1800" placeholder="For example: Why does A7 pull so strongly back to D minor?"></textarea><label class="coach-free-tier"><input id="coachFreeTierConsent" type="checkbox" ${state.freeTierAcknowledged ? "checked" : ""} /> I understand this free Gemini tier may use submitted questions and practice context to improve Google products. I will not include sensitive or private material.</label><div><button type="button" id="coachComplete" class="mini">Mark current drill complete</button><button type="submit" class="mini primary-mini" ${canAsk ? "" : "disabled"}>Ask coach</button></div></form><p class="coach-privacy">The coach saves this device’s conversation and practice events to personalize future drills. It never receives your API key; score content is sent only when you choose to include it in a question.</p></section>`;
    root.querySelectorAll("[data-coach-prompt]").forEach((button) => { button.onclick = () => { root.querySelector("#coachQuestion").value = button.getAttribute("data-coach-prompt"); root.querySelector("#coachQuestion").focus(); }; });
    root.querySelector("#coachForm").onsubmit = (event) => { event.preventDefault(); send(root.querySelector("#coachQuestion").value); };
    root.querySelector("#coachFreeTierConsent").onchange = (event) => {
      state.freeTierAcknowledged = event.target.checked;
      try { localStorage.setItem(FREE_TIER_ACK_KEY, state.freeTierAcknowledged ? "yes" : "no"); } catch { /* acknowledgement lasts for this visit */ }
      render();
    };
    root.querySelector("#coachComplete").onclick = () => track("exercise_completed", { exercise: context.view }, context, true);
    root.querySelectorAll("[data-coach-action]").forEach((button) => { button.onclick = () => runAction(messages[+button.getAttribute("data-coach-action")].action); });
    const recommendationButton = root.querySelector("[data-recommendation-action]");
    if (recommendationButton) recommendationButton.onclick = () => runAction(state.recommendation.action);
  }

  async function send(value) {
    const question = text(value, 1800);
    if (!question || state.status !== "ready" || !state.freeTierAcknowledged) return;
    state.messages.push({ role: "user", content: question });
    state.status = "sending";
    render();
    try {
      const result = await callApi("/api/coach", "POST", { question, context: config.context() });
      state.messages.push({ role: "assistant", content: result.answer, action: normaliseAction(result.action), actionLabel: result.actionLabel });
      if (result.summary) state.summary = result.summary;
      if (result.recommendation) state.recommendation = Object.assign({}, result.recommendation, { action: normaliseAction(result.recommendation.action) });
      state.status = "ready";
    } catch (error) {
      state.messages.push({ role: "assistant", content: error.code === "rate_limited" ? "You have sent several questions quickly. Take a short playing break, then ask again." : "I could not reach the coach just now. Your current practice map is still available locally." });
      state.status = error.code === "coach_not_configured" || error.code === "coach_model_not_configured" ? "setup" : "ready";
    }
    render();
  }

  async function track(eventType, payload, context, showResult) {
    try {
      if (!(await ensureSession())) return;
      const result = await callApi("/api/progress", "POST", { eventType, payload, context: context || config.context() });
      hydrate(result);
      state.status = "ready";
      if (showResult) render();
    } catch (error) {
      if (error.code === "coach_not_configured") { state.status = "setup"; render(); }
    }
  }

  function runAction(value) {
    const next = normaliseAction(value);
    if (!next) return;
    config.onAction(next);
    track("coach_action_opened", { action: next.kind }, config.context(), false);
  }

  function trackView(view, context) {
    const key = view + ":" + context.tonic + ":" + context.modeId + ":" + context.progressionId;
    const now = Date.now();
    if (key === state.lastViewKey && now - state.lastViewAt < 15000) return;
    state.lastViewKey = key; state.lastViewAt = now;
    track("view_opened", { view }, context, false);
  }

  function selfTest() {
    const results = [
      { name: "coach accepts a bounded Song Map action", pass: normaliseAction({ kind: "song_map", tonic: "D", modeId: "minor", progressionId: "iv-V-i" })?.kind === "song_map" },
      { name: "coach rejects unknown views", pass: normaliseAction({ kind: "navigate", view: "admin" }) === null },
      { name: "coach rejects unsupported study ids", pass: normaliseAction({ kind: "study", studyId: "copyrighted-book" }) === null }
    ];
    return { ok: results.every((result) => result.pass), results };
  }

  window.PracticeCoach = {
    mount(options) {
      config = Object.assign(config, options || {});
      try { state.freeTierAcknowledged = localStorage.getItem(FREE_TIER_ACK_KEY) === "yes"; } catch { state.freeTierAcknowledged = false; }
      render(); start();
    },
    render, trackView, track, selfTest
  };
})();
