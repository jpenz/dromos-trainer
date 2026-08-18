export const TONICS = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
export const MODES = ["major", "minor", "harmonicMinor", "ousak", "hijaz"];
export const TUNINGS = ["guitar", "bouzouki4", "laouto4", "bouzouki3", "guitarDropD"];
export const VIEWS = ["cycle", "prog", "chordmap", "triads", "solo", "picking", "ear", "styles", "video", "analyze", "concepts", "coach"];
export const STUDIES = ["paliatzis", "apopse", "tsigaro"];
export const STYLES = ["zeibekiko", "kalamatianos", "hasapiko", "tsifteteli", "roumba"];
export const PROGRESSIONS = {
  major: ["ii-V-I", "I-vi-ii-V", "IV-V-I", "bVII-I"],
  minor: ["i-bVII-i", "iv-bVII-i", "bVI-bVII-i"],
  harmonicMinor: ["iio-V-i", "iv-V-i", "bVI-ii-V-i"],
  ousak: ["i-bVII-i", "bII-i", "bII-bVII-i"],
  hijaz: ["I-bII-I", "I-iv-I", "I-iv-bVII-I", "bII-I"]
};

const EVENT_TYPES = ["view_opened", "exercise_completed", "target_missed", "ear_answered", "coach_action_opened", "song_imported"];
const SOLO_SECTIONS = ["road", "path", "phrase", "targets", "cell"];

function member(value, values, fallback) { return values.includes(value) ? value : fallback; }
function text(value, limit) { return typeof value === "string" ? value.trim().slice(0, limit) : ""; }
function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }

export function coachContext(value) {
  const raw = object(value);
  const modeId = member(raw.modeId, MODES, "minor");
  const progressionId = member(raw.progressionId, PROGRESSIONS[modeId], PROGRESSIONS[modeId][0]);
  return {
    view: member(raw.view, VIEWS, "cycle"),
    tonic: member(raw.tonic, TONICS, "D"),
    modeId,
    progressionId,
    progressionStep: Number.isInteger(raw.progressionStep) ? Math.max(0, Math.min(8, raw.progressionStep)) : 0,
    tuningId: member(raw.tuningId, TUNINGS, "guitar"),
    soloSection: member(raw.soloSection, SOLO_SECTIONS, "targets"),
    styleId: member(raw.styleId, STYLES, "zeibekiko"),
    studyId: raw.studyId == null ? null : member(raw.studyId, STUDIES, null),
    bpm: Number.isFinite(raw.bpm) ? Math.max(40, Math.min(200, Math.round(raw.bpm))) : 84,
    analysisChords: text(raw.analysisChords, 640),
    analysisLine: text(raw.analysisLine, 960)
  };
}

export function action(value) {
  const raw = object(value);
  const kind = raw.kind;
  if (kind === "navigate" && VIEWS.includes(raw.view) && raw.view !== "coach") return { kind, view: raw.view };
  if (kind === "song_map") {
    const modeId = member(raw.modeId, MODES, null);
    const tonic = member(raw.tonic, TONICS, null);
    const progressionId = modeId && member(raw.progressionId, PROGRESSIONS[modeId], null);
    return modeId && tonic && progressionId ? { kind, tonic, modeId, progressionId } : null;
  }
  if (kind === "study" && STUDIES.includes(raw.studyId)) return { kind, studyId: raw.studyId };
  if (kind === "style") {
    const section = raw.section === "foundation" ? "foundation" : raw.section === "greek" ? "greek" : null;
    const styleId = section === "greek" ? member(raw.styleId, STYLES, null) : null;
    return section && (section === "foundation" || styleId) ? { kind, section, styleId } : null;
  }
  if (kind === "solo_lab" && SOLO_SECTIONS.includes(raw.section)) return { kind, section: raw.section };
  if (kind === "analyzer") {
    const chords = text(raw.chords, 640);
    const line = text(raw.line, 960);
    return chords ? {
      kind, tonic: member(raw.tonic, TONICS, "D"), modeId: member(raw.modeId, MODES, "minor"), chords, line
    } : null;
  }
  return null;
}

export function labelForAction(value) {
  if (!value) return "";
  if (value.kind === "navigate") return "Open " + ({ prog: "Song Map", chordmap: "Chord Map", triads: "Triads", solo: "Solo Lab", ear: "Ear Trainer", styles: "Styles", video: "Video Study", analyze: "Analyzer", concepts: "Concept Pyramid", cycle: "Cycle" }[value.view] || "practice area");
  if (value.kind === "song_map") return "Open " + value.tonic + " " + value.modeId + " · " + value.progressionId;
  if (value.kind === "study") return "Open authorised study";
  if (value.kind === "style") return value.section === "foundation" ? "Open Foundation" : "Open Greek style";
  if (value.kind === "solo_lab") return "Open Solo Lab · " + value.section;
  if (value.kind === "analyzer") return "Open this in Analyzer";
  return "Open recommended exercise";
}

export function coachReply(value) {
  const raw = object(value);
  const answer = text(raw.answer, 1800);
  return answer ? { answer, action: action(raw.action), actionLabel: labelForAction(action(raw.action)) } : null;
}

export function progressEvent(value) {
  const raw = object(value);
  const eventType = member(raw.eventType, EVENT_TYPES, null);
  if (!eventType) return null;
  const payload = object(raw.payload);
  const clean = {};
  ["view", "exercise", "result", "reason", "action"].forEach((key) => {
    const value = text(payload[key], 80);
    if (value) clean[key] = value;
  });
  return { eventType, payload: clean, context: coachContext(raw.context) };
}

export function selfTest() {
  const tests = [];
  const check = (name, pass) => tests.push({ name, pass });
  check("validated Song Map action accepts known harmonic-minor progression", action({ kind: "song_map", tonic: "D", modeId: "harmonicMinor", progressionId: "iv-V-i" })?.progressionId === "iv-V-i");
  check("unknown navigation is rejected", action({ kind: "navigate", view: "https://bad.example" }) === null);
  check("unknown study is rejected", action({ kind: "study", studyId: "whole-book-copy" }) === null);
  check("coach context cannot use unsupported tuning", coachContext({ tuningId: "anything" }).tuningId === "guitar");
  return { ok: tests.every((test) => test.pass), results: tests };
}
