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
const publicConfig = require("../../tools/public_config.cjs");
const tauriRunner = require("../../tools/run_tauri.cjs");

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
  assert.equal(window.zoomHotkeysEnabled, true);
  assert.equal(window.fullscreen, false);
  assert.ok(window.width >= window.minWidth);
  assert.ok(window.height >= window.minHeight);
});

test("keeps the base CSP offline and adds only the selected public services at runtime", () => {
  const baseCsp = config.app.security.csp;
  assert.match(baseCsp, /default-src 'self'/);
  assert.match(baseCsp, /connect-src 'self'/);
  assert.match(baseCsp, /object-src 'none'/);
  assert.doesNotMatch(baseCsp, /https?:|wss?:|unsafe-eval|connect-src[^;]*\*/);

  const selected = publicConfig.loadPublicConfig();
  const csp = publicConfig.tauriConfigOverlay(selected).app.security.csp;
  assert.match(csp, new RegExp(selected.supabaseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(csp, new RegExp(publicConfig.websocketOrigin(selected.supabaseUrl).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(csp, new RegExp(selected.siteUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(csp, /frame-src 'self'/);
  assert.doesNotMatch(csp, /frame-src[^;]*(?:https?:|\*)|unsafe-eval|connect-src[^;]*\*/);
});

test("passes the generated CSP overlay to the official Tauri command", () => {
  const selected = publicConfig.loadPublicConfig();
  const args = tauriRunner.tauriArguments(["build", "--no-bundle"], selected);
  assert.equal(args[1], "build");
  assert.equal(args[2], "--no-bundle");
  assert.equal(args[3], "--config");
  assert.deepEqual(JSON.parse(args[4]), publicConfig.tauriConfigOverlay(selected));
});

test("grants only the scoped release opener and native zoom to the Windows app", () => {
  assert.deepEqual(capability.windows, ["main"]);
  assert.deepEqual(capability.platforms, ["windows"]);
  assert.equal(config.app.withGlobalTauri, true);
  assert.deepEqual(capability.permissions, [
    {
      identifier: "opener:allow-open-url",
      allow: [{ url: "https://github.com/italocas7/Ficha_Marufia_Latio/releases/*" }],
    },
    "core:webview:allow-set-webview-zoom",
  ]);
  assert.match(cargo, /^tauri-plugin-opener\s*=\s*"2"$/m);
  assert.doesNotMatch(JSON.stringify(capability.permissions), /shell|filesystem|dialog|open-path|http:\/\/|github\.com\/[^i]/i);
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
  assert.equal(packageJson.scripts["dev:desktop"], "node tools/run_tauri.cjs dev");
  assert.equal(packageJson.scripts["build:desktop"], "node tools/run_tauri.cjs build --no-bundle");
  assert.equal(packageJson.scripts["build:windows"], "node tools/build_windows.cjs");
  assert.equal(packageJson.scripts["test:tauri-config"], "node --test tests/js/tauri_config.test.cjs");
});
