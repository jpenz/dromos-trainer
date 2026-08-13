import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(path.join(root, "index.html"), "utf8");
const app = readFileSync(path.join(root, "js/app.js"), "utf8");

test("every static control has a unique id or one delegated data contract", () => {
  const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), (match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate ids make labels and keyboard focus ambiguous");

  const controls = Array.from(html.matchAll(/<(button|input|select)\b([^>]*)>/g), (match) => ({
    tag: match[1],
    id: (match[2].match(/\bid="([^"]+)"/) || [])[1],
    data: Array.from(match[2].matchAll(/\b(data-[\w-]+)="/g), (dataMatch) => dataMatch[1])
  }));
  const withoutContract = controls.filter((control) => !control.id && control.data.length === 0);
  assert.deepEqual(withoutContract, [], "every button/input/select needs a stable test and event contract");
});
test("every id-based control is wired and every delegated control family is handled", () => {
  const idControls = Array.from(html.matchAll(/<(?:button|input|select)\b[^>]*\bid="([^"]+)"/g), (match) => match[1]);
  const aliasedControls = {
    tuningSel: /const tuneSel = \$\("tuningSel"\);[\s\S]*tuneSel\.onchange/,
    tonicSel: /const tonicSel = \$\("tonicSel"\);[\s\S]*tonicSel\.onchange/,
    chordMapTonicSel: /const chordMapTonic = \$\("chordMapTonicSel"\);[\s\S]*chordMapTonic\.onchange/
  };
  idControls.forEach((id) => {
    const direct = new RegExp(`\\$\\("${id}"\\)\\.(?:onclick|onchange|oninput)`);
    assert.ok(direct.test(app) || aliasedControls[id]?.test(app), `${id} needs an explicit event handler`);
  });

  const dataFamilies = new Set(Array.from(
    html.matchAll(/<(?:button|input|select)\b[^>]*\b(data-[\w-]+)="/g),
    (match) => match[1]
  ));
  dataFamilies.forEach((attribute) => {
    assert.ok(app.includes(`querySelectorAll("[${attribute}]")`), `${attribute} needs delegated wiring`);
  });
});
