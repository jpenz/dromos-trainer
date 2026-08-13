import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(path.join(root, "js/profiles.js"), "utf8");

function moduleWith(storage) {
  const window = {};
  vm.runInContext(source, vm.createContext({ window, console, localStorage: storage }), { filename: "js/profiles.js" });
  return window.PlayerProfiles;
}

function memoryStorage(initial) {
  const values = new Map(Object.entries(initial || {}));
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values
  };
}

test("first run is Dre on four-course bouzouki and survives reload", () => {
  const storage = memoryStorage();
  let profiles = moduleWith(storage);
  const first = profiles.bootstrap();
  assert.equal(first.displayName, "Dre");
  assert.equal(first.preferences.tuningId, "bouzouki4");
  profiles.updatePreferences({ tuningId: "guitar", bpm: 96 });
  profiles = moduleWith(storage);
  const reloaded = profiles.bootstrap();
  assert.equal(reloaded.preferences.tuningId, "guitar");
  assert.equal(reloaded.preferences.bpm, 96);
});

test("players keep independent settings and ear progress", () => {
  const profiles = moduleWith(memoryStorage());
  const dre = profiles.bootstrap();
  profiles.recordProgress({ kind: "ear", drill: "map", correct: true });
  const alex = profiles.create("Alex", { tuningId: "laouto4" });
  profiles.recordProgress({ kind: "ear", drill: "map", correct: false });
  assert.equal(profiles.active().progress.earMap.correct, 0);
  assert.equal(profiles.active().progress.earMap.attempts, 1);
  profiles.switchTo(dre.id);
  assert.equal(profiles.active().preferences.tuningId, "bouzouki4");
  assert.equal(profiles.active().progress.earMap.correct, 1);
  assert.equal(profiles.active().progress.earMap.attempts, 1);
  profiles.switchTo(alex.id);
  assert.equal(profiles.active().preferences.tuningId, "laouto4");
});

test("corrupt and unknown stored values are bounded without storing transient music", () => {
  const key = "dromos-trainer-player-profiles-v1";
  const storage = memoryStorage({ [key]: JSON.stringify({
    version: 99,
    activeProfileId: "bad",
    profiles: [{ id: "safe-id", displayName: "\u0000  ", preferences: { tuningId: "sitar", bpm: 9999 }, progress: { earColour: { correct: 9, attempts: 2 } }, analysisLine: "private score" }]
  }) });
  const profile = moduleWith(storage).bootstrap();
  assert.equal(profile.preferences.tuningId, "bouzouki4");
  assert.equal(profile.preferences.bpm, 200);
  assert.equal(profile.progress.earColour.correct, 2);
  assert.doesNotMatch(storage.values.get(key), /private score|analysisLine/);
});
