/* profiles.js — validated, named practice profiles stored on this device.
 *
 * These are intentionally not presented as authenticated cloud accounts.
 * Each player receives separate preferences, ear and sing-back progress, and an anonymous
 * server coach session without putting transient drills or imported music in
 * localStorage.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "dromos-trainer-player-profiles-v1";
  const TUNINGS = ["guitar", "bouzouki4", "laouto4", "bouzouki3", "guitarDropD"];
  const VIEWS = ["today", "cycle", "prog", "chordmap", "ear", "melody", "triads", "solo", "picking", "styles", "video", "analyze", "concepts", "coach", "progress"];
  const TONICS = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
  const MODES = ["major", "minor", "harmonicMinor", "ousak", "hijaz"];
  const CYCLE_MODES = ["full", "iiVI", "pivot"];
  const ZONES = ["low", "mid", "high", "full"];
  const LABELS = ["interval", "note"];
  const MAX_PROFILES = 8;

  const DEFAULT_PREFERENCES = Object.freeze({
    tuningId: "bouzouki4", view: "today", tonic: "D", modeId: "major",
    progressionId: "ii-V-I", bpm: 84, cycleMode: "pivot", cycleZone: "mid",
    triadZone: "mid", labelMode: "interval", lefty: false, loop: true
  });

  function safeName(value, fallback) {
    const cleaned = String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 32);
    return cleaned || fallback || "Player";
  }

  function score(value) {
    const raw = value && typeof value === "object" ? value : {};
    const attempts = Math.max(0, Math.floor(Number(raw.attempts) || 0));
    const correct = Math.min(attempts, Math.max(0, Math.floor(Number(raw.correct) || 0)));
    const streak = Math.max(0, Math.floor(Number(raw.streak) || 0));
    const best = Math.max(streak, Math.floor(Number(raw.best) || 0));
    return { correct, attempts, streak, best };
  }

  function cleanPreferences(value) {
    const raw = value && typeof value === "object" ? value : {};
    return {
      tuningId: TUNINGS.includes(raw.tuningId) ? raw.tuningId : DEFAULT_PREFERENCES.tuningId,
      view: VIEWS.includes(raw.view) ? raw.view : DEFAULT_PREFERENCES.view,
      tonic: TONICS.includes(raw.tonic) ? raw.tonic : DEFAULT_PREFERENCES.tonic,
      modeId: MODES.includes(raw.modeId) ? raw.modeId : DEFAULT_PREFERENCES.modeId,
      progressionId: typeof raw.progressionId === "string" && /^[\w♭#-]{1,50}$/.test(raw.progressionId) ? raw.progressionId : DEFAULT_PREFERENCES.progressionId,
      bpm: Number.isFinite(raw.bpm) ? Math.max(30, Math.min(220, Math.round(raw.bpm))) : DEFAULT_PREFERENCES.bpm,
      cycleMode: CYCLE_MODES.includes(raw.cycleMode) ? raw.cycleMode : DEFAULT_PREFERENCES.cycleMode,
      cycleZone: ZONES.includes(raw.cycleZone) ? raw.cycleZone : DEFAULT_PREFERENCES.cycleZone,
      triadZone: ZONES.includes(raw.triadZone) ? raw.triadZone : DEFAULT_PREFERENCES.triadZone,
      labelMode: LABELS.includes(raw.labelMode) ? raw.labelMode : DEFAULT_PREFERENCES.labelMode,
      lefty: typeof raw.lefty === "boolean" ? raw.lefty : DEFAULT_PREFERENCES.lefty,
      loop: typeof raw.loop === "boolean" ? raw.loop : DEFAULT_PREFERENCES.loop,
      ghosts: typeof raw.ghosts === "boolean" ? raw.ghosts : true,
      scaleOverlay: typeof raw.scaleOverlay === "boolean" ? raw.scaleOverlay : true,
      metronome: typeof raw.metronome === "boolean" ? raw.metronome : false,
      holdI: typeof raw.holdI === "boolean" ? raw.holdI : false
    };
  }

  function cleanProgress(value) {
    const raw = value && typeof value === "object" ? value : {};
    return {
      earColour: score(raw.earColour),
      earMap: score(raw.earMap),
      singPitch: score(raw.singPitch),
      completedExercises: raw.completedExercises && typeof raw.completedExercises === "object" && !Array.isArray(raw.completedExercises)
        ? Object.fromEntries(Object.entries(raw.completedExercises).slice(0, 80).map(([key, count]) => [String(key).slice(0, 50), Math.max(0, Math.floor(Number(count) || 0))])) : {},
      lastPracticedAt: typeof raw.lastPracticedAt === "string" ? raw.lastPracticedAt.slice(0, 32) : null
    };
  }

  function createStore(storage, options) {
    const settings = options || {};
    const now = settings.now || (() => new Date().toISOString());
    let sequence = 0;
    const id = settings.id || (() => {
      if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
      sequence += 1;
      return `player-${Date.now().toString(36)}-${sequence.toString(36)}`;
    });
    const listeners = new Set();
    let documentState = null;

    function freshProfile(displayName, preferences) {
      const stamp = now();
      return {
        id: id(), displayName: safeName(displayName, "Player"), createdAt: stamp, updatedAt: stamp,
        preferences: cleanPreferences(Object.assign({}, DEFAULT_PREFERENCES, preferences || {})),
        progress: cleanProgress(null)
      };
    }

    function cleanProfile(value, index) {
      const raw = value && typeof value === "object" ? value : {};
      const stamp = now();
      return {
        id: typeof raw.id === "string" && /^[\w-]{1,80}$/.test(raw.id) ? raw.id : id(),
        displayName: safeName(raw.displayName, `Player ${index + 1}`),
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt.slice(0, 32) : stamp,
        updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt.slice(0, 32) : stamp,
        preferences: cleanPreferences(raw.preferences), progress: cleanProgress(raw.progress)
      };
    }

    function load() {
      let raw = null;
      try { raw = JSON.parse(storage.getItem(STORAGE_KEY) || "null"); } catch { raw = null; }
      const profiles = raw && Array.isArray(raw.profiles)
        ? raw.profiles.slice(0, MAX_PROFILES).map(cleanProfile) : [];
      if (!profiles.length) profiles.push(freshProfile("Dre", DEFAULT_PREFERENCES));
      const unique = [];
      const seen = new Set();
      profiles.forEach((profile) => {
        if (seen.has(profile.id)) profile.id = id();
        seen.add(profile.id); unique.push(profile);
      });
      const activeProfileId = unique.some((profile) => profile.id === raw?.activeProfileId)
        ? raw.activeProfileId : unique[0].id;
      documentState = { version: 1, activeProfileId, profiles: unique };
      save(false);
      return active();
    }

    function save(emit = true) {
      try { storage.setItem(STORAGE_KEY, JSON.stringify(documentState)); } catch { /* private mode: keep this visit */ }
      if (emit) listeners.forEach((listener) => listener(active(), list()));
    }

    function ready() { if (!documentState) load(); }
    function list() { ready(); return documentState.profiles.map((profile) => JSON.parse(JSON.stringify(profile))); }
    function active() { ready(); return list().find((profile) => profile.id === documentState.activeProfileId) || list()[0]; }

    function mutateActive(callback) {
      ready();
      const profile = documentState.profiles.find((item) => item.id === documentState.activeProfileId);
      callback(profile); profile.updatedAt = now(); save(); return active();
    }

    function create(displayName, preferences) {
      ready();
      if (documentState.profiles.length >= MAX_PROFILES) return null;
      const profile = freshProfile(displayName, preferences || DEFAULT_PREFERENCES);
      documentState.profiles.push(profile); documentState.activeProfileId = profile.id; save(); return active();
    }

    function rename(profileId, displayName) {
      ready();
      const profile = documentState.profiles.find((item) => item.id === profileId);
      if (!profile) return null;
      profile.displayName = safeName(displayName, profile.displayName); profile.updatedAt = now(); save(); return active();
    }

    function switchTo(profileId) {
      ready();
      if (!documentState.profiles.some((profile) => profile.id === profileId)) return null;
      documentState.activeProfileId = profileId; save(); return active();
    }

    function remove(profileId) {
      ready();
      const index = documentState.profiles.findIndex((profile) => profile.id === profileId);
      if (index < 0) return null;
      documentState.profiles.splice(index, 1);
      if (!documentState.profiles.length) documentState.profiles.push(freshProfile("Dre", DEFAULT_PREFERENCES));
      if (!documentState.profiles.some((profile) => profile.id === documentState.activeProfileId)) {
        documentState.activeProfileId = documentState.profiles[Math.min(index, documentState.profiles.length - 1)].id;
      }
      save(); return active();
    }

    function updatePreferences(patch) {
      return mutateActive((profile) => { profile.preferences = cleanPreferences(Object.assign({}, profile.preferences, patch || {})); });
    }

    function recordProgress(event) {
      if (!event || typeof event !== "object") return active();
      return mutateActive((profile) => {
        if (event.kind === "ear" && (event.drill === "colour" || event.drill === "map")) {
          const key = event.drill === "map" ? "earMap" : "earColour";
          const item = profile.progress[key];
          item.attempts += 1;
          if (event.correct) { item.correct += 1; item.streak += 1; item.best = Math.max(item.best, item.streak); }
          else item.streak = 0;
        } else if (event.kind === "sing") {
          const item = profile.progress.singPitch;
          item.attempts += 1;
          if (event.correct) { item.correct += 1; item.streak += 1; item.best = Math.max(item.best, item.streak); }
          else item.streak = 0;
        } else if (event.kind === "complete") {
          const key = safeName(event.exercise, "practice");
          profile.progress.completedExercises[key] = (profile.progress.completedExercises[key] || 0) + 1;
        }
        profile.progress.lastPracticedAt = now();
      });
    }

    return {
      bootstrap: load, list, active, create, rename, switchTo, remove, updatePreferences, recordProgress,
      subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
      storageKey: STORAGE_KEY
    };
  }

  const fallbackStorage = { getItem() { return null; }, setItem() {} };
  const store = createStore(typeof localStorage !== "undefined" ? localStorage : fallbackStorage);

  function selfTest() {
    const memory = new Map();
    const storage = { getItem: (key) => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
    let nextId = 0;
    const testStore = createStore(storage, { id: () => `test-${++nextId}`, now: () => "2026-08-12T00:00:00.000Z" });
    const first = testStore.bootstrap();
    const results = [];
    const add = (name, pass) => results.push({ name, pass });
    add("first player is Dre on four-course bouzouki", first.displayName === "Dre" && first.preferences.tuningId === "bouzouki4");
    testStore.recordProgress({ kind: "ear", drill: "colour", correct: true });
    testStore.recordProgress({ kind: "sing", correct: true });
    const second = testStore.create("Alex", { tuningId: "guitar" });
    add("profiles keep independent instruments", second.preferences.tuningId === "guitar" && testStore.list()[0].preferences.tuningId === "bouzouki4");
    add("profiles keep independent ear progress", second.progress.earColour.attempts === 0 && testStore.list()[0].progress.earColour.correct === 1);
    add("profiles keep independent sing-back progress", second.progress.singPitch.attempts === 0 && testStore.list()[0].progress.singPitch.correct === 1);
    testStore.updatePreferences({ tuningId: "unknown", bpm: 999 });
    add("invalid preferences fall back safely", testStore.active().preferences.tuningId === "bouzouki4" && testStore.active().preferences.bpm === 220);
    testStore.remove(second.id);
    add("removing the active profile selects another", testStore.active().displayName === "Dre");
    add("transient score content is never persisted", !memory.get(STORAGE_KEY).includes("analysisLine"));
    return { ok: results.every((result) => result.pass), results };
  }

  window.PlayerProfiles = Object.assign(store, { createStore, selfTest, DEFAULT_PREFERENCES });
})();
