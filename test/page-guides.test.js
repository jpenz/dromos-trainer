import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");

function pageGuides() {
  const context = vm.createContext({ window: {} });
  vm.runInContext(read("js/page-guides.js"), context, { filename: "js/page-guides.js" });
  return context.window.PageGuides;
}

test("every workspace and sub-exercise resolves to a complete answer-first pyramid", () => {
  const guides = pageGuides();
  const result = guides.selfTest();
  assert.equal(result.ok, true, JSON.stringify(result.results, null, 2));

  const contexts = [
    { view: "cycle", cycleFocus: "hear" }, { view: "cycle", cycleFocus: "chords" },
    { view: "ear", earDrill: "colour" }, { view: "ear", earDrill: "map" },
    { view: "styles", styleSection: "foundation" }, { view: "styles", styleSection: "greek" },
    ...["targets", "road", "path", "phrase", "cell"].map((soloSection) => ({ view: "solo", soloSection }))
  ];
  assert.equal(new Set(contexts.map((context) => guides.resolve(context).key)).size, contexts.length);
});

test("every Show me where action points to a real control or section", () => {
  const guides = pageGuides();
  const productSource = ["index.html", "js/app.js", "js/coach.js", "js/video.js"].map(read).join("\n");
  Object.entries(guides.GUIDES).forEach(([key, guide]) => {
    assert.match(productSource, new RegExp(`id=["']${guide.targetId}["']`), `${key} needs a real first-action target`);
  });
});

test("the answer and first action stay visible while the full guide remains one tap away", () => {
  const app = read("js/app.js");
  const css = read("css/styles.css");
  assert.match(app, /<header class="guide-answer"/);
  assert.match(app, /<div class="guide-first"/);
  assert.match(app, /<details class="guide-workflow"/);
  assert.match(app, /<ol class="guide-steps"/);
  assert.match(app, /<details class="guide-explain"/);
  assert.doesNotMatch(app, /<details[^>]*><header class="guide-answer"/,
    "the main answer must never be hidden inside a disclosure");
  assert.match(css, /\.guide-success/);
  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.guide-steps \{ grid-template-columns: 1fr; \}/);
});
