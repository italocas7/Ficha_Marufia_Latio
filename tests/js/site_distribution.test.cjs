"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const packageJson = require("../../package.json");

test("keeps the offline build and the hosted test package as separate commands", () => {
  assert.equal(packageJson.scripts.build, "python tools/build.py");
  assert.equal(packageJson.scripts["build:site"], "python tools/build_site.py");
  assert.equal(packageJson.scripts["test:site"], "node tools/test_site_package.cjs");
});

test("builds the hosted package only from the validated runtime files", () => {
  const source = fs.readFileSync(path.join(root, "tools", "build_site.py"), "utf8");
  assert.match(source, /offline_build\.REQUIRED_FILES/);
  assert.match(source, /subprocess\.run\(\[sys\.executable, "tools\/build\.py"\]/);
  assert.match(source, /resolved\.parent != ROOT\.resolve\(\)/);
  assert.match(source, /"server\/index\.js"/);
});

test("serves static assets first and falls back to the sheet entry page", () => {
  const worker = fs.readFileSync(path.join(root, "server", "index.js"), "utf8");
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
  assert.match(worker, /response\.status !== 404/);
  assert.match(worker, /INDEX_PATH = "\/index\.html"/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, ".openai", "hosting.json"), "utf8")), {
    project_id: "appgprj_6a550a6f1e1c81918743f6c740049806",
  });
});

test("publishes a site-specific social preview from the trusted production origin", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(index, /property="og:title" content="Ficha de Marufia \(Latio\)"/);
  assert.match(index, /property="og:image" content="https:\/\/ficha-marufia-latio\.italocas7\.chatgpt\.site\/og\.png"/);
  assert.match(index, /name="twitter:card" content="summary_large_image"/);
  assert.equal(fs.existsSync(path.join(root, "og.png")), true);
});
