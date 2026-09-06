"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const config = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
const packageJson = require("../../package.json");
const buildScript = fs.readFileSync(path.join(root, "tools", "build_windows.cjs"), "utf8");
const { assertInside, assertSigningEnvironment, currentReleaseVersion, pythonExecutable, sha256 } = require("../../tools/build_windows.cjs");
const { assertReleaseBackend } = require("../../tools/check_release.cjs");
const { PRODUCTION_BACKEND } = require("../../tools/public_config.cjs");

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
  assert.match(buildScript, /Marufia-Setup\.exe\.sig/);
  assert.match(buildScript, /TAURI_SIGNING_PRIVATE_KEY_PASSWORD/);
  assert.match(buildScript, /tauri-update\.json/);
  assert.match(buildScript, /windows-artifacts\.json/);
  assert.match(buildScript, /sha256/);
  assert.match(buildScript, /assertProductionBackend\(loadPublicConfig\(\)\)/);
  assert.match(buildScript, /backendMode:\s*publicConfig\.backendMode/);
  assert.match(buildScript, /backendUrl:\s*publicConfig\.supabaseUrl/);
  assert.match(buildScript, /"--config", overlay/);
  assert.ok(fs.statSync(path.join(root, "tools", "run_site_build.cjs")).isFile());
  assert.equal(currentReleaseVersion(), packageJson.version);
  assert.match(buildScript, /expectedSuffix/);
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

test("resolves an existing Python executable instead of the Windows Store alias", () => {
  const resolved = pythonExecutable();
  assert.equal(fs.statSync(resolved).isFile(), true);
});

test("refuses a publishable build without a password-protected key outside the project", () => {
  assert.throws(() => assertSigningEnvironment({}), /chave privada/);
  assert.throws(() => assertSigningEnvironment({
    TAURI_SIGNING_PRIVATE_KEY: path.join(root, "private.key"),
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: "uma-senha-comprida",
  }), /fora do projeto/);

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "marufia-updater-test-"));
  const keyPath = path.join(temporary, "private.key");
  fs.writeFileSync(keyPath, "encrypted-test-key");
  try {
    assert.equal(assertSigningEnvironment({
      TAURI_SIGNING_PRIVATE_KEY: keyPath,
      TAURI_SIGNING_PRIVATE_KEY_PASSWORD: "uma-senha-comprida",
    }), path.resolve(keyPath));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test("rejects Windows artifacts built for another campaign database", () => {
  assert.doesNotThrow(() => assertReleaseBackend({
    backendMode: PRODUCTION_BACKEND.backendMode,
    backendUrl: PRODUCTION_BACKEND.supabaseUrl,
  }));
  assert.throws(() => assertReleaseBackend({
    backendMode: "cloud",
    backendUrl: "https://project.supabase.co",
  }), /servidor oficial do Marufia/);
});
