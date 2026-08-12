import { action, labelForAction } from "./validation.js";

export function recommendation(context, events) {
  const recent = Array.isArray(events) ? events.slice(0, 18) : [];
  const missed = recent.find((event) => event.event_type === "target_missed");
  const earMiss = recent.find((event) => event.event_type === "ear_answered" && event.payload && event.payload.result === "incorrect");
  let actionValue;
  let title;
  let reason;
  if (missed) {
    actionValue = action({ kind: "solo_lab", section: "targets" });
    title = "Rebuild one landing tone";
    reason = "A missed target is a map-and-hearing issue before it is a speed issue. Play the current and next 3rd slowly, then add only two travelling notes.";
  } else if (earMiss) {
    actionValue = action({ kind: "navigate", view: "ear" });
    title = "Name the colour by ear";
    reason = "Use one short ear question, sing the 2nd and 3rd first, then check the answer on the neck.";
  } else if (context.view === "styles") {
    actionValue = action({ kind: "song_map", tonic: context.tonic, modeId: context.modeId, progressionId: context.progressionId });
    title = "Connect pulse to the actual map";
    reason = "The dance feel tells you where the phrase sits; the Song Map tells you which arrivals make the progression audible.";
  } else {
    actionValue = action({ kind: "song_map", tonic: context.tonic, modeId: context.modeId, progressionId: context.progressionId });
    title = "Make the next change audible";
    reason = "Name the chord functions, then land on one 3rd per chord before using a pentatonic route between them.";
  }
  return { title, reason, action: actionValue, actionLabel: labelForAction(actionValue) };
}

export function progressSummary(events) {
  const rows = Array.isArray(events) ? events : [];
  return rows.reduce((summary, event) => {
    if (event.event_type === "exercise_completed") summary.completed += 1;
    if (event.event_type === "target_missed") summary.targetMisses += 1;
    if (event.event_type === "ear_answered") {
      summary.earAttempts += 1;
      if (event.payload && event.payload.result === "correct") summary.earCorrect += 1;
    }
    return summary;
  }, { completed: 0, targetMisses: 0, earAttempts: 0, earCorrect: 0 });
}
