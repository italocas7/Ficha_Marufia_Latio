"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const packageJson = require("../../package.json");
const readiness = require("../../tools/test_tauri_readiness.cjs");
const liveSite = require("../../tools/test_live_site.cjs");
const realtime = require("../../tools/test_realtime_connection.cjs");

test("keeps Tauri absent until the web readiness gate passes", () => {
  assert.equal(fs.existsSync(path.join(root, "src-tauri")), false);
  assert.doesNotThrow(() => readiness.assertTauriNotStarted());
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  assert.equal(Object.keys(dependencies).some((name) => name.startsWith("@tauri-apps/")), false);
});

test("orders the Phase 42 gate from sheet through backend and Realtime", () => {
  assert.deepEqual(readiness.STEPS.map(([name]) => name), [
    "Ficha web",
    "Navegador desktop/celular",
    "Site publicado",
    "Backend público",
    "Realtime",
  ]);
  assert.equal(packageJson.scripts["test:tauri-readiness"], "node tools/test_tauri_readiness.cjs");
  assert.equal(packageJson.scripts["test:live-site"], "node tools/test_live_site.cjs");
  assert.equal(packageJson.scripts["test:realtime:remote"], "node tools/test_realtime_connection.cjs");
});

test("targets only the published Marufia site and a read-only Realtime subscription", () => {
  assert.equal(liveSite.LIVE_URL, "https://ficha-marufia-latio.italocas7.chatgpt.site");
  assert.deepEqual([...realtime.FAILURE_STATES].sort(), ["CHANNEL_ERROR", "TIMED_OUT"]);
  const source = fs.readFileSync(path.join(root, "tools", "test_realtime_connection.cjs"), "utf8");
  assert.match(source, /event: "INSERT", schema: "public", table: "rolls"/);
  assert.doesNotMatch(source, /\.from\(|\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
});

test("cleans only the two exact generated web directories", () => {
  const source = fs.readFileSync(path.join(root, "tools", "test_tauri_readiness.cjs"), "utf8");
  assert.match(source, /\["dist", "dist\.next"\]\.includes/);
  assert.match(source, /path\.dirname\(target\) !== root/);
  assert.match(source, /finally \{/);
});
