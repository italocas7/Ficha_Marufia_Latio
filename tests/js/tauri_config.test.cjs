"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const tauriRoot = path.join(root, "src-tauri");
const config = JSON.parse(fs.readFileSync(path.join(tauriRoot, "tauri.conf.json"), "utf8"));
const capability = JSON.parse(fs.readFileSync(path.join(tauriRoot, "capabilities", "default.json"), "utf8"));
const cargo = fs.readFileSync(path.join(tauriRoot, "Cargo.toml"), "utf8");
const packageJson = require("../../package.json");

test("configures the Marufia Windows identity and existing web build", () => {
  assert.equal(config.productName, "Marufia Online");
  assert.equal(config.identifier, "com.marufia.online");
  assert.equal(config.build.frontendDist, "../dist/client");
  assert.equal(config.build.beforeDevCommand, "pnpm build:site");
  assert.equal(config.build.beforeBuildCommand, "pnpm build:site");
  assert.deepEqual(config.bundle.targets, ["nsis"]);
});

test("uses one bounded, resizable main window", () => {
  assert.equal(config.app.windows.length, 1);
  const window = config.app.windows[0];
  assert.equal(window.label, "main");
  assert.equal(window.title, "Marufia Online Alpha");
  assert.equal(window.center, true);
  assert.equal(window.resizable, true);
  assert.equal(window.fullscreen, false);
  assert.ok(window.width >= window.minWidth);
  assert.ok(window.height >= window.minHeight);
});

test("restricts web connections to the public Marufia services", () => {
  const csp = config.app.security.csp;
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /https:\/\/nuczqjyahusjyvepqthx\.supabase\.co/);
  assert.match(csp, /wss:\/\/nuczqjyahusjyvepqthx\.supabase\.co/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-eval|connect-src[^;]*\*/);
});

test("grants no native IPC command to the sheet", () => {
  assert.deepEqual(capability.windows, ["main"]);
  assert.deepEqual(capability.platforms, ["windows"]);
  assert.deepEqual(capability.permissions, []);
  assert.doesNotMatch(cargo, /tauri-plugin|shell|filesystem|dialog|opener/);
});

test("ships the generated Marufia icon set and stable desktop commands", () => {
  for (const relative of [
    "assets/marufia-app-icon.png",
    "src-tauri/icons/32x32.png",
    "src-tauri/icons/128x128.png",
    "src-tauri/icons/128x128@2x.png",
    "src-tauri/icons/icon.ico",
  ]) {
    assert.ok(fs.statSync(path.join(root, relative)).size > 0, `${relative} está vazio`);
  }
  assert.equal(packageJson.scripts["dev:desktop"], "tauri dev");
  assert.equal(packageJson.scripts["build:desktop"], "tauri build --no-bundle");
  assert.equal(packageJson.scripts["build:windows"], "node tools/build_windows.cjs");
  assert.equal(packageJson.scripts["test:tauri-config"], "node --test tests/js/tauri_config.test.cjs");
});
