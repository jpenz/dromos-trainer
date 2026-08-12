import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

test("the installable app shell links its offline assets", () => {
  const html = read("index.html");
  assert.match(html, /manifest\.webmanifest/);
  assert.match(html, /serviceWorker\.register\("sw\.js"\)/);
  assert.match(html, /data-view="solo"/);
  assert.match(html, /data-view="styles"/);
  assert.match(html, /data-view="analyze"/);
  assert.match(html, /data-view="concepts"/);
  assert.match(html, /data-solo-section="targets"/);
  assert.match(html, /data-style-section="foundation"/);
  assert.match(html, /js\/styles\.js/);
  assert.match(html, /js\/analysis\.js/);
  assert.match(read("js/tuning.js"), /Laouto \(mainland\)/);
  assert.match(read("js/app.js"), /seventh \|\| chordTone\(chord, "R"\)/,
    "triad lessons must use the root anchor instead of inventing a seventh");
});

test("phone layout contains wide fretboards instead of widening the page", () => {
  const css = read("css/styles.css");
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.stage \{ position: relative; min-width: 0; \}/);
  assert.match(css, /\.fretboard-wrap \{[\s\S]*max-width: 100%;/);
});
