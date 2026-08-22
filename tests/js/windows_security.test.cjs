"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const packageJson = require("../../package.json");
const config = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
const documentation = fs.readFileSync(path.join(root, "docs", "windows-security.md"), "utf8");
const checker = fs.readFileSync(path.join(root, "tools", "check_windows_security.cjs"), "utf8");

test("keeps Phase 45 free of certificate material and signing automation", () => {
  const serializedConfig = JSON.stringify(config);
  assert.doesNotMatch(serializedConfig, /certificateThumbprint|digestAlgorithm|signCommand/i);
  assert.doesNotMatch(packageJson.scripts["build:windows"], /sign|certificate|signtool/i);
});

test("documents the expected unsigned-Alpha warning without disabling protection", () => {
  assert.match(documentation, /Editor desconhecido/);
  assert.match(documentation, /NotSigned/);
  assert.match(documentation, /Alpha sem assinatura/);
  assert.match(documentation, /Mais informações/);
  assert.match(documentation, /Executar assim mesmo/);
  assert.match(documentation, /Não desative o SmartScreen/);
  assert.doesNotMatch(documentation, /Set-MpPreference|DisableAntiSpyware|SmartScreenEnabled\s*[=:]\s*Off/i);
});

test("verifies hashes and accepts only unsigned or valid Authenticode states", () => {
  assert.equal(
    packageJson.scripts["test:windows-security"],
    "node tools/check_windows_security.cjs",
  );
  assert.match(checker, /windows-artifacts\.json/);
  assert.match(checker, /createHash\("sha256"\)/);
  assert.match(checker, /Get-AuthenticodeSignature/);
  assert.match(checker, /signature\.status === "NotSigned"/);
  assert.match(checker, /signature\.status === "Valid"/);
  assert.match(checker, /Assinatura Authenticode inválida/);
});
