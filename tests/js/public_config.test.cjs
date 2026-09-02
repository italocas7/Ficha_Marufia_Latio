"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const tools = require("../../tools/public_config.cjs");
const trackedCloudProfile = tools.parseEnv(fs.readFileSync(
  path.join(__dirname, "..", "..", "config", "public-backends", "cloud.env"),
  "utf8",
));

function temporaryRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "marufia-public-config-"));
}

function writeEnv(root, relative, values) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join("\n")}\n`);
}

test("loads the tracked Cloud fallback without an administrative secret", () => {
  const config = tools.loadPublicConfig({ env: trackedCloudProfile });
  assert.equal(config.backendMode, "cloud");
  assert.equal(config.buildEnvironment, "production");
  assert.match(config.supabaseUrl, /^https:\/\/[a-z]+\.supabase\.co$/);
  assert.match(config.publishableKey, /^sb_publishable_/);
  assert.equal(config.siteUrl, "https://ficha-marufia-latio.italocas7.chatgpt.site");
  assert.equal(config.authRedirectUrl, config.siteUrl);
});

test("applies public environment precedence without reading unrelated process values", () => {
  const root = temporaryRoot();
  writeEnv(root, "config/public-backends/cloud.env", {
    MARUFIA_BACKEND_MODE: "cloud",
    MARUFIA_BUILD_ENV: "production",
    SUPABASE_URL: "https://profile.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_profile",
    MARUFIA_SITE_URL: "https://profile.example.com",
  });
  writeEnv(root, ".env", { SUPABASE_URL: "https://base.supabase.co" });
  writeEnv(root, ".env.production", { SUPABASE_PUBLISHABLE_KEY: "sb_publishable_environment" });
  writeEnv(root, ".env.local", { MARUFIA_SITE_URL: "https://local-override.example.com" });
  const config = tools.loadPublicConfig({
    root,
    env: { SUPABASE_URL: "https://process.supabase.co", UNRELATED_SECRET: "must-not-be-read" },
  });
  assert.deepEqual(config, {
    backendMode: "cloud",
    buildEnvironment: "production",
    supabaseUrl: "https://process.supabase.co",
    publishableKey: "sb_publishable_environment",
    siteUrl: "https://local-override.example.com",
    authRedirectUrl: "https://local-override.example.com",
  });
});

test("accepts local loopback and an external HTTPS self-hosted gateway", () => {
  const root = temporaryRoot();
  const local = tools.loadPublicConfig({
    root,
    env: {
      MARUFIA_BACKEND_MODE: "local",
      MARUFIA_BUILD_ENV: "local",
      SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_PUBLISHABLE_KEY: "local-public-key",
      MARUFIA_SITE_URL: "http://localhost:4173",
      MARUFIA_AUTH_REDIRECT_URL: "http://localhost:4173/auth-confirmed",
    },
  });
  assert.equal(local.supabaseUrl, "http://127.0.0.1:54321");
  assert.equal(local.siteUrl, "http://localhost:4173");
  assert.equal(local.authRedirectUrl, "http://localhost:4173/auth-confirmed");

  const selfhosted = tools.loadPublicConfig({
    root,
    env: {
      MARUFIA_BACKEND_MODE: "selfhosted",
      MARUFIA_BUILD_ENV: "production",
      SUPABASE_URL: "https://api.marufia.example",
      SUPABASE_PUBLISHABLE_KEY: "selfhosted-public-key",
      MARUFIA_SITE_URL: "https://marufia.example",
      MARUFIA_AUTH_REDIRECT_URL: "https://api.marufia.example/auth-confirmed",
    },
  });
  assert.equal(selfhosted.supabaseUrl, "https://api.marufia.example");
  assert.equal(selfhosted.authRedirectUrl, "https://api.marufia.example/auth-confirmed");
});

test("rejects unsafe modes, origins, and administrative keys", () => {
  const root = temporaryRoot();
  const base = {
    MARUFIA_BUILD_ENV: "production",
    SUPABASE_PUBLISHABLE_KEY: "public-key",
    MARUFIA_SITE_URL: "https://marufia.example",
  };
  assert.throws(() => tools.loadPublicConfig({ root, env: {
    ...base,
    MARUFIA_BACKEND_MODE: "local",
    SUPABASE_URL: "https://external.example",
  } }), /backend local/i);
  assert.throws(() => tools.loadPublicConfig({ root, env: {
    ...base,
    MARUFIA_BACKEND_MODE: "selfhosted",
    SUPABASE_URL: "https://project.supabase.co",
  } }), /selfhosted.*Cloud/i);
  assert.throws(() => tools.loadPublicConfig({ root, env: {
    ...base,
    MARUFIA_BACKEND_MODE: "cloud",
    SUPABASE_URL: "http://project.example",
  } }), /HTTPS/i);
  assert.throws(() => tools.loadPublicConfig({ root, env: {
    ...base,
    MARUFIA_BACKEND_MODE: "cloud",
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_secret_forbidden",
  } }), /administrativa/i);
  assert.throws(() => tools.loadPublicConfig({ root, env: {
    ...base,
    MARUFIA_BACKEND_MODE: "cloud",
    SUPABASE_URL: "https://project.supabase.co",
    MARUFIA_AUTH_REDIRECT_URL: "http://external.example/auth-confirmed",
  } }), /AUTH_REDIRECT_URL.*HTTPS/i);
});

test("renders one immutable browser configuration while the source stays unconfigured", () => {
  const sourceProject = require("../../src/online/project.js");
  assert.deepEqual(sourceProject, {
    backendMode: "unconfigured",
    buildEnvironment: "source",
    supabaseUrl: "",
    publishableKey: "",
    siteUrl: "",
    authRedirectUrl: "",
  });
  const expected = tools.loadPublicConfig();
  const rendered = tools.renderProjectSource(expected);
  assert.doesNotMatch(rendered, new RegExp(tools.CONFIG_TOKEN));
  const sandbox = {};
  vm.runInNewContext(rendered, sandbox, { timeout: 1000 });
  assert.deepEqual({ ...sandbox.MARUFIA_ONLINE_CONFIG }, { ...expected });
  assert.equal(Object.isFrozen(sandbox.MARUFIA_ONLINE_CONFIG), true);
});

test("generates a Tauri CSP limited to the selected HTTP and WebSocket origins", () => {
  const config = {
    supabaseUrl: "https://api.marufia.example",
    publishableKey: "public-key",
    siteUrl: "https://marufia.example",
  };
  const csp = tools.buildTauriCsp(config);
  assert.match(csp, /connect-src 'self' https:\/\/api\.marufia\.example wss:\/\/api\.marufia\.example https:\/\/marufia\.example/);
  assert.match(csp, /img-src 'self' data: blob: https:\/\/marufia\.example/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-eval|connect-src[^;]*\*/);
  assert.equal(tools.websocketOrigin("http://127.0.0.1:54321"), "ws://127.0.0.1:54321");
});
