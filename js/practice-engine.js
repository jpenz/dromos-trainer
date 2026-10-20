/* practice-engine.js - what to practise next, and how fast (FR-85).
 *
 * Three jobs, all pure and testable; storage is a thin wrapper:
 *   1. Spaced review. Every drill in every key and dromos is a card. A clean
 *      set (three clean loops) moves it out along 1, 3, 7, 16, 35, 80 days;
 *      a miss before any clean set that day brings it back tomorrow.
 *   2. Autopilot. The tempo ladder (+step after N clean loops, -step after a
 *      miss) and the fading map (full, then next note only, then memory).
 *   3. Today. A twenty-minute session in five parts built from the cards:
 *      warm-up, review what is due, one new drill, a from-memory check, and
 *      a song to play it in.
 * The spacing ladder and the five-part session are app design based on the
 * spacing, interleaving and retrieval findings in motor-skill research; the
 * app labels them as its method, not as a prescription from a teacher.
 */
(function () {
  "use strict";

  const INTERVALS = [1, 3, 7, 16, 35, 80];
  const STORE_KEY = "dromos-practice-v1";
  const SET_SIZE = 3;

  // ---- dates (local calendar days, never UTC) ------------------------------
  function dayStamp(date) {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function addDays(stamp, days) {
    const [y, m, d] = stamp.split("-").map(Number);
    return dayStamp(new Date(y, m - 1, d + days));
  }
  function daysBetween(from, to) {
    const [y1, m1, d1] = from.split("-").map(Number);
    const [y2, m2, d2] = to.split("-").map(Number);
    return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
  }

  // ---- store -----------------------------------------------------------------
  function emptyStore() { return { cards: {}, minutes: {}, version: 1 }; }
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      return raw && raw.cards ? Object.assign(emptyStore(), raw) : emptyStore();
    } catch (error) { return emptyStore(); }
  }
  function save(store) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (error) { /* storage unavailable */ }
    return store;
  }

  function cardId(drill, tonic, mode) { return `${drill}|${tonic}|${mode}`; }

  // One tap of Clean or Missed. Returns { card, setDone, advanced, lapsed }.
  function record(store, entry) {
    const date = entry.date || dayStamp();
    const id = cardId(entry.drill, entry.tonic, entry.mode);
    const card = store.cards[id] || (store.cards[id] = {
      drill: entry.drill, tonic: entry.tonic, mode: entry.mode,
      step: -1, due: null, reps: 0, lapses: 0, ceiling: 0, last: null, run: 0, setDay: null
    });
    if (card.last !== date) card.run = 0;
    card.last = date;
    const result = { card, setDone: false, advanced: false, lapsed: false };
    if (entry.clean) {
      card.run += 1;
      card.reps += 1;
      if (card.run % SET_SIZE === 0) {
        result.setDone = true;
        card.ceiling = Math.max(card.ceiling || 0, entry.tempo || 0);
        // Best clean-set tempo per day, last 30 days kept, for the trend lines.
        card.hist = card.hist || {};
        card.hist[date] = Math.max(card.hist[date] || 0, entry.tempo || 0);
        Object.keys(card.hist).sort().slice(0, -30).forEach((day) => { delete card.hist[day]; });
        // One step out per day: a second clean set the same day is extra
        // practice, not extra spacing.
        if (card.setDay !== date) {
          card.step = Math.min(INTERVALS.length - 1, card.step + 1);
          card.due = addDays(date, INTERVALS[card.step]);
          card.setDay = date;
          result.advanced = true;
        }
      }
    } else {
      card.run = 0;
      // Misses while pushing tempo after a clean set are normal; only a day
      // with no clean set counts as a lapse.
      if (card.setDay !== date) {
        card.lapses += 1;
        card.step = Math.max(-1, card.step - 1);
        card.due = addDays(date, 1);
        result.lapsed = true;
      }
    }
    return result;
  }

  // 0 (forgotten or never played) to 1 (deep, recent).
  function strength(card, date) {
    if (!card || card.step < 0) return card && card.reps ? 0.12 : 0;
    const base = (card.step + 1) / INTERVALS.length;
    if (!card.due) return base;
    const overdue = daysBetween(card.due, date);
    if (overdue <= 0) return base;
    return Math.max(0.05, base * Math.pow(0.5, overdue / INTERVALS[Math.max(0, card.step)]));
  }

  function dueCards(store, date) {
    return Object.values(store.cards)
      .filter((card) => card.due && card.due <= date)
      .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : strength(a, date) - strength(b, date)));
  }

  function addMinutes(store, date, minutes) {
    store.minutes[date] = Math.round(((store.minutes[date] || 0) + minutes) * 10) / 10;
    return store;
  }

  // Consecutive days with at least five minutes, ending today (or yesterday,
  // so the streak does not read zero before today's practice).
  function streak(store, date) {
    let day = (store.minutes[date] || 0) >= 5 ? date : addDays(date, -1);
    let count = 0;
    while ((store.minutes[day] || 0) >= 5) { count += 1; day = addDays(day, -1); }
    return count;
  }

  function minutesSince(store, date, days) {
    let total = 0;
    for (let i = 0; i < days; i++) total += store.minutes[addDays(date, -i)] || 0;
    return total;
  }

  // ---- autopilot -------------------------------------------------------------
  // ladder: { tempo, cleans, need, step, start, goal }. Returns the next state
  // and what happened, so the page can say it.
  function ladderStep(ladder, clean) {
    const next = Object.assign({}, ladder);
    const out = { ladder: next, raised: false, dropped: false, reachedGoal: false };
    if (clean) {
      next.cleans += 1;
      if (next.cleans >= next.need) {
        next.cleans = 0;
        if (next.tempo >= next.goal) out.reachedGoal = true;
        else { next.tempo = Math.min(next.goal, next.tempo + next.step); out.raised = true; }
      }
    } else {
      next.cleans = 0;
      const floor = Math.min(next.start, next.tempo);
      if (next.tempo > floor) { next.tempo = Math.max(floor, next.tempo - next.step); out.dropped = true; }
    }
    return out;
  }

  // Clean loops since the map last came back: 0 full, 1 next note only, 2+ memory.
  function fadeLevel(passes) { return passes <= 0 ? "full" : passes === 1 ? "hints" : "memory"; }

  // ---- Today ----------------------------------------------------------------
  // ctx: { curriculum: [drill ids in order], tonic, mode, modes: [...], warmup,
  //        memoryDrill, titleOf(id) }
  function agoText(days) { return days <= 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`; }

  function buildSession(store, date, ctx) {
    const plan = [];
    const cards = Object.values(store.cards);
    const playedToday = new Set(cards.filter((card) => card.last === date).map((card) => card.mode));
    plan.push({ kind: "warm", minutes: 3, drill: ctx.warmup, tonic: ctx.tonic, mode: ctx.mode, tempo: 72, fade: "full", why: "Loose wrist, even down and up before anything moves." });
    const due = dueCards(store, date).slice(0, 2);
    const reviews = due.length ? due : cards.filter((card) => card.reps && card.last !== date)
      .sort((a, b) => strength(a, date) - strength(b, date)).slice(0, 2);
    reviews.forEach((card) => plan.push({
      kind: "due", minutes: 6 / reviews.length, drill: card.drill, tonic: card.tonic, mode: card.mode,
      tempo: card.ceiling ? Math.max(60, card.ceiling - 8) : 72, fade: "full",
      why: card.due && card.due <= date ? `Due today · last played ${card.last ? agoText(daysBetween(card.last, date)) : "before"}` : "Your weakest drill right now"
    }));
    const started = new Set(cards.filter((card) => card.mode === ctx.mode).map((card) => card.drill));
    const fresh = ctx.curriculum.find((id) => !started.has(id) && id !== ctx.warmup) || ctx.curriculum[0];
    plan.push({ kind: "new", minutes: reviews.length ? 6 : 12, drill: fresh, tonic: ctx.tonic, mode: ctx.mode, tempo: 60, fade: "full", why: "Next in the plan for this dromos" });
    const otherMode = ctx.modes.find((mode) => mode !== ctx.mode && !playedToday.has(mode)) || ctx.modes.find((mode) => mode !== ctx.mode) || ctx.mode;
    const otherKey = (ctx.tonics || []).find((tonic) => tonic !== ctx.tonic) || ctx.tonic;
    plan.push({ kind: "memory", minutes: 3, drill: ctx.memoryDrill, tonic: otherKey, mode: otherMode, tempo: 72, fade: "memory", why: "A key and dromos you have not played today, map hidden" });
    plan.push({ kind: "play", minutes: 2, drill: null, tonic: ctx.tonic, mode: ctx.mode, tempo: null, fade: null, why: "Use it in a song" });
    return plan;
  }

  // Best clean tempo per day for one drill across its keys, oldest first.
  function tempoTrend(store, drill, date, days) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = addDays(date, -i);
      let best = 0;
      Object.values(store.cards).forEach((card) => { if (card.drill === drill && card.hist && card.hist[day] > best) best = card.hist[day]; });
      out.push(best);
    }
    return out;
  }

  // Mean strength of the cards in one key and dromos (0 when never played).
  function cellStrength(store, tonic, mode, date) {
    const cards = Object.values(store.cards).filter((card) => card.tonic === tonic && card.mode === mode);
    if (!cards.length) return 0;
    return cards.reduce((sum, card) => sum + strength(card, date), 0) / cards.length;
  }

  function selfTest() {
    const results = [];
    const check = (name, want, got) => results.push({ name, pass: want === got, detail: want === got ? "" : `want ${want}, got ${got}` });
    check("dates step across a month end", "2026-11-02", addDays("2026-10-30", 3));
    check("days between two stamps", 7, daysBetween("2026-10-12", "2026-10-19"));
    const store = emptyStore();
    const entry = { drill: "scale-roads", tonic: "D", mode: "hijaz", clean: true, tempo: 88, date: "2026-10-19" };
    record(store, entry); record(store, entry);
    const third = record(store, entry);
    check("three clean loops make a set and move the card out one day", "2026-10-20", third.card.due);
    check("the set banks the tempo as the ceiling", 88, third.card.ceiling);
    record(store, entry); record(store, entry);
    check("a second set the same day does not add spacing", "2026-10-20", record(store, entry).card.due);
    const pushMiss = record(store, Object.assign({}, entry, { clean: false }));
    check("a miss after a clean set that day is not a lapse", false, pushMiss.lapsed);
    const next = { drill: "scale-roads", tonic: "D", mode: "hijaz", clean: true, tempo: 92, date: "2026-10-20" };
    record(store, next); record(store, next);
    check("next day's set moves it to three days", "2026-10-23", record(store, next).card.due);
    check("each day's best clean-set tempo feeds the trend", "88,92", tempoTrend(store, "scale-roads", "2026-10-20", 2).join(","));
    check("a played key and dromos has strength", true, cellStrength(store, "D", "hijaz", "2026-10-20") > 0);
    const cold = record(store, { drill: "pair-triads-ddu", tonic: "G", mode: "major", clean: false, date: "2026-10-20" });
    check("a miss with no clean set that day is a lapse due tomorrow", "2026-10-21", cold.lapsed && cold.card.due);
    check("due cards are found on their day", 1, dueCards(store, "2026-10-21").length);
    const up = ladderStep({ tempo: 84, cleans: 2, need: 3, step: 4, start: 72, goal: 120 }, true);
    check("the third clean loop raises the tempo", 88, up.ladder.tempo);
    const down = ladderStep({ tempo: 88, cleans: 1, need: 3, step: 4, start: 72, goal: 120 }, false);
    check("a miss drops one step and clears the count", "84/0", `${down.ladder.tempo}/${down.ladder.cleans}`);
    check("the ladder never drops below its start", 72, ladderStep({ tempo: 72, cleans: 0, need: 3, step: 4, start: 72, goal: 120 }, false).ladder.tempo);
    check("the map fades full, hints, memory", "full,hints,memory,memory", [0, 1, 2, 5].map(fadeLevel).join(","));
    const mins = emptyStore();
    ["2026-10-17", "2026-10-18", "2026-10-19"].forEach((day) => addMinutes(mins, day, 12));
    check("the streak counts consecutive days of five minutes or more", 3, streak(mins, "2026-10-19"));
    check("the streak survives the morning before practice", 3, streak(mins, "2026-10-20"));
    const plan = buildSession(store, "2026-10-21", { curriculum: ["down-up-clock", "scale-roads", "pair-triads-ddu", "tension-home"], tonic: "D", mode: "hijaz", modes: ["major", "minor", "harmonicMinor", "ousak", "hijaz"], tonics: ["D", "G", "A"], warmup: "down-up-clock", memoryDrill: "scale-roads" });
    check("today has warm-up, review, new, memory and play", "warm,due,new,memory,play", plan.map((item) => item.kind).join(","));
    check("today adds up to twenty minutes", 20, plan.reduce((sum, item) => sum + item.minutes, 0));
    return { ok: results.every((result) => result.pass), results };
  }

  window.PracticeEngine = {
    tempoTrend, cellStrength,
    INTERVALS, SET_SIZE, dayStamp, addDays, daysBetween, emptyStore, load, save, cardId, record, strength,
    dueCards, addMinutes, streak, minutesSince, ladderStep, fadeLevel, buildSession, selfTest
  };
})();
