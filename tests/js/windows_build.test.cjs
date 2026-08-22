"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
const packageJson = require("../../package.json");
const buildScript = fs.readFileSync(path.join(root, "tools", "build_windows.cjs"), "utf8");
const { assertInside, sha256 } = require("../../tools/build_windows.cjs");

test("configures a Portuguese current-user NSIS installer", () => {
  assert.deepEqual(config.bundle.targets, ["nsis"]);
  assert.equal(config.bundle.publisher, "Marufia Online");
  assert.equal(config.bundle.category, "RolePlayingGame");
  assert.equal(config.bundle.windows.nsis.installMode, "currentUser");
  assert.deepEqual(config.bundle.windows.nsis.languages, ["PortugueseBR"]);
  assert.equal(config.bundle.windows.nsis.displayLanguageSelector, false);
  assert.equal(config.bundle.windows.nsis.installerIcon, "icons/icon.ico");
  assert.equal(config.bundle.windows.nsis.uninstallerIcon, "icons/icon.ico");
});

test("keeps WebView2 bootstrap bounded and silent", () => {
  assert.deepEqual(config.bundle.windows.webviewInstallMode, {
    type: "downloadBootstrapper",
    silent: true,
  });
});

test("exposes one stable Windows build command and delivery names", () => {
  assert.equal(packageJson.scripts["build:windows"], "node tools/build_windows.cjs");
  assert.match(buildScript, /Marufia\.exe/);
  assert.match(buildScript, /Marufia-Setup\.exe/);
  assert.match(buildScript, /windows-artifacts\.json/);
  assert.match(buildScript, /sha256/);
});

test("rejects destinations outside the release folder", () => {
  const releaseRoot = path.join(root, "src-tauri", "target", "release");
  assert.doesNotThrow(() => assertInside(releaseRoot, path.join(releaseRoot, "Marufia.exe")));
  assert.throws(() => assertInside(releaseRoot, path.join(root, "Marufia.exe")), /fora da pasta autorizada/);
  assert.throws(() => assertInside(releaseRoot, releaseRoot), /fora da pasta autorizada/);
});

test("computes a stable SHA-256 digest", () => {
  const fixture = path.join(__dirname, "windows_build.test.cjs");
  assert.equal(sha256(fixture), sha256(fixture));
  assert.match(sha256(fixture), /^[a-f0-9]{64}$/);
});
