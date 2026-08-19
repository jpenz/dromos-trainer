import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(path.join(root, file), "utf8");
const app = read("js/app.js");
const html = read("index.html");
const css = read("css/styles.css");
const sw = read("sw.js");
const coreTest = read("test/core.test.js");
const jsFiles = readdirSync(path.join(root, "js"))
  .filter((file) => file.endsWith(".js"))
  .map((file) => ({ file, source: read(path.join("js", file)) }));

function dynamicControlContract(source) {
  const dead = [];
  for (const match of source.matchAll(/<(?:button|input|select|a)\b[^>]*>/g)) {
    const tag = match[0];
    const attributes = Array.from(tag.matchAll(/\b(data-[\w-]+)=/g), (item) => item[1]);
    if (!attributes.length) continue;
    const wired = attributes.some((attribute) =>
      source.includes(`querySelectorAll("[${attribute}]")`) ||
      source.includes(`querySelector("[${attribute}]")`) ||
      source.includes(`closest("[${attribute}]")`) ||
      source.includes(`getAttribute("${attribute}")`)
    );
    if (!wired) dead.push(tag.replace(/\s+/g, " ").slice(0, 180));
  }
  assert.deepEqual(dead, [], "every app-rendered control needs at least one handled data-* contract");
}

function appliedClassContract(sources, stylesheet) {
  const applied = new Set();
  sources.forEach(({ source }) => {
    for (const match of source.matchAll(/classList\.(?:add|toggle)\(\s*["']([\w-]+)["']/g)) {
      applied.add(match[1]);
    }
  });
  const missing = Array.from(applied).filter((className) => {
    const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return !new RegExp(`\\.${escaped}(?![\\w-])`).test(stylesheet);
  });
  assert.deepEqual(missing, [], "every class applied by JavaScript needs a CSS selector");
}

function idReferenceContract(documentSource, appSource) {
  const renderedIds = new Set(Array.from(
    `${documentSource}\n${appSource}`.matchAll(/\bid=["']([^"']+)["']/g),
    (match) => match[1]
  ));
  const referencedIds = new Set(Array.from(
    appSource.matchAll(/\$\(["']([^"']+)["']\)/g),
    (match) => match[1]
  ));
  const missing = Array.from(referencedIds).filter((id) => !renderedIds.has(id));
  assert.deepEqual(missing, [], "every $(id) reference needs a static or app-rendered element");
}

function serviceWorkerShellContract(documentSource, workerSource) {
  const scripts = Array.from(
    documentSource.matchAll(/<script src="(js\/[\w.-]+)\?v=\d+"><\/script>/g),
    (match) => match[1]
  );
  assert.ok(scripts.length > 15, "expected the complete application script set");
  const missing = scripts.filter((script) => !workerSource.includes(`./${script}?v=`));
  assert.deepEqual(missing, [], "every index script needs the same service-worker shell contract");
}

function exportedSelfTestContract(files, testSource) {
  const modules = [];
  files.forEach(({ file, source }) => {
    if (!/function selfTest\s*\(/.test(source)) return;
    const exported = Array.from(source.matchAll(/window\.([A-Za-z][\w]*)\s*=/g)).at(-1);
    assert.ok(exported, `${file} declares selfTest but does not export a module`);
    modules.push(exported[1]);
  });
  assert.ok(modules.length >= 15, "expected the application's full set of pure module self-tests");
  const missing = modules.filter((moduleName) => !testSource.includes(`${moduleName}.selfTest(`));
  assert.deepEqual(missing, [], "every exported selfTest must run in the core Node suite");
}

test("app-rendered controls cannot ship without a handler", () => {
  dynamicControlContract(app);
  assert.throws(
    () => dynamicControlContract(`${app}\nconst broken = \`<button data-dead-switch="1">Dead</button>\`;`),
    /app-rendered control/,
    "the gate must fail when a rendered control has no event contract"
  );
});

test("JavaScript-applied classes cannot ship without CSS", () => {
  appliedClassContract(jsFiles, css);
  const sabotaged = jsFiles.concat({ file: "sabotage.js", source: 'document.body.classList.add("missing-contract-class");' });
  assert.throws(
    () => appliedClassContract(sabotaged, css),
    /applied by JavaScript/,
    "the gate must fail when behavior applies an invisible class"
  );
});

test("literal DOM id references cannot point at missing markup", () => {
  idReferenceContract(html, app);
  assert.throws(
    () => idReferenceContract(html, `${app}\n$("missingContractId");`),
    /\$\(id\) reference/,
    "the gate must fail on a mistyped or removed id"
  );
});

test("every index script remains available in the offline shell", () => {
  serviceWorkerShellContract(html, sw);
  const firstScript = html.match(/<script src="(js\/[\w.-]+)\?v=\d+"><\/script>/)[1];
  const sabotaged = sw.replace(new RegExp(`\\./${firstScript.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\?v=\\d+,?\\s*`), "");
  assert.throws(
    () => serviceWorkerShellContract(html, sabotaged),
    /service-worker shell/,
    "the gate must fail when a loaded module is missing offline"
  );
});

test("every exported module self-test remains in the core suite", () => {
  exportedSelfTestContract(jsFiles, coreTest);
  const firstModule = jsFiles
    .filter(({ source }) => /function selfTest\s*\(/.test(source))
    .map(({ source }) => Array.from(source.matchAll(/window\.([A-Za-z][\w]*)\s*=/g)).at(-1)[1])
    .find((moduleName) => coreTest.includes(`${moduleName}.selfTest(`));
  const sabotaged = coreTest.replace(`${firstModule}.selfTest(`, `${firstModule}.disabledSelfTest(`);
  assert.throws(
    () => exportedSelfTestContract(jsFiles, sabotaged),
    /exported selfTest/,
    "the gate must fail when a module's invariant suite stops running"
  );
});
