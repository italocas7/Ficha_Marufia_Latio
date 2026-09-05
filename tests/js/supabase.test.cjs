const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const configTools = require("../../src/online/config.js");
const supabaseTools = require("../../src/online/supabase.js");
const projectConfig = require("../../src/online/project.js");
const publicConfigTools = require("../../tools/public_config.cjs");
const { loadPublicConfig } = publicConfigTools;
const trackedCloudProfile = publicConfigTools.parseEnv(fs.readFileSync(
  path.join(__dirname, "..", "..", "config", "public-backends", "cloud.env"),
  "utf8",
));

function fakeSdk() {
  const calls = [];
  return {
    calls,
    createClient(url, key, options) {
      const client = { url, key, options };
      calls.push(client);
      return client;
    },
  };
}

function serviceRoleJwt() {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256" })}.${encode({ role: "service_role" })}.signature`;
}

function sessionJwt(issuer) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256" })}.${encode({ iss: issuer, sub: "user-1" })}.signature`;
}

function fakeStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    value(key) { return values.get(key); },
  };
}

test("keeps source unconfigured and resolves only the selected public project identity", () => {
  assert.equal(configTools.readPublicConfig(projectConfig).configured, false);
  const resolved = loadPublicConfig({ env: trackedCloudProfile });
  const config = configTools.readPublicConfig(resolved);
  assert.equal(config.configured, true);
  assert.match(config.supabaseUrl, /^https:\/\/[a-z]+\.supabase\.co$/);
  assert.match(config.publishableKey, /^sb_publishable_/);
  assert.doesNotMatch(config.publishableKey, /^sb_secret_/);
  assert.equal(resolved.siteUrl, "https://ficha-marufia-latio.italocas7.chatgpt.site");
});

test("keeps online mode disabled when no public config exists", () => {
  assert.deepEqual(configTools.readPublicConfig(), {
    configured: false,
    supabaseUrl: "",
    publishableKey: "",
  });
  assert.equal(supabaseTools.createSupabaseClient({}, fakeSdk()), null);
});

test("creates the official client with a public key and persistent browser auth", () => {
  const sdk = fakeSdk();
  const client = supabaseTools.createSupabaseClient({
    SUPABASE_URL: "https://marufia.supabase.co/",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  }, sdk);
  assert.equal(client.url, "https://marufia.supabase.co");
  assert.equal(client.key, "sb_publishable_test");
  assert.deepEqual(client.options, {
    db: { schema: "public" },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: "marufia-online-auth-v2-https-marufia-supabase-co",
    },
  });
});

test("isolates authentication sessions by backend", () => {
  const cloud = supabaseTools.authStorageKey("https://project.supabase.co");
  const selfHosted = supabaseTools.authStorageKey("https://api.marufiarpg.org");
  assert.notEqual(cloud, selfHosted);
  assert.match(cloud, /^marufia-online-auth-v2-/);
  assert.doesNotMatch(cloud + selfHosted, /publishable|secret/i);
});

test("migrates only a legacy session issued by the selected backend", () => {
  const selfHostedUrl = "https://api.marufiarpg.org";
  const matching = JSON.stringify({ access_token: sessionJwt(`${selfHostedUrl}/auth/v1`) });
  const legacyKey = supabaseTools.LEGACY_AUTH_STORAGE_KEY;
  const storage = fakeStorage({ [legacyKey]: matching });
  assert.equal(supabaseTools.migrateLegacyAuthSession(storage, { supabaseUrl: selfHostedUrl }), true);
  assert.equal(storage.value(supabaseTools.authStorageKey(selfHostedUrl)), matching);

  const cloudSession = JSON.stringify({ access_token: sessionJwt("https://project.supabase.co/auth/v1") });
  const mismatched = fakeStorage({ [legacyKey]: cloudSession });
  assert.equal(supabaseTools.migrateLegacyAuthSession(mismatched, { supabaseUrl: selfHostedUrl }), false);
  assert.equal(mismatched.value(supabaseTools.authStorageKey(selfHostedUrl)), undefined);
});

test("reuses one configured client and replaces it when the project changes", () => {
  const sdk = fakeSdk();
  supabaseTools.resetSupabaseClient();
  const firstConfig = { supabaseUrl: "https://one.supabase.co", publishableKey: "sb_publishable_one" };
  const first = supabaseTools.getSupabaseClient(firstConfig, sdk);
  assert.equal(supabaseTools.getSupabaseClient(firstConfig, sdk), first);
  const second = supabaseTools.getSupabaseClient({ supabaseUrl: "https://two.supabase.co", publishableKey: "sb_publishable_two" }, sdk);
  assert.notEqual(second, first);
  assert.equal(sdk.calls.length, 2);
});

test("rejects incomplete, insecure, and secret configurations", () => {
  assert.throws(() => configTools.readPublicConfig({ SUPABASE_URL: "https://marufia.supabase.co" }), /incompleta/i);
  assert.throws(() => configTools.readPublicConfig({ SUPABASE_URL: "http://example.com", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test" }), /HTTPS/i);
  assert.throws(() => configTools.readPublicConfig({ SUPABASE_URL: "https://marufia.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_secret_forbidden" }), /chave secreta/i);
  assert.throws(() => configTools.readPublicConfig({ SUPABASE_URL: "https://marufia.supabase.co", SUPABASE_PUBLISHABLE_KEY: serviceRoleJwt() }), /chave secreta/i);
});

test("allows the local Supabase URL for offline development", () => {
  const config = configTools.readPublicConfig({
    SUPABASE_URL: "http://127.0.0.1:54321",
    SUPABASE_PUBLISHABLE_KEY: "local-public-key",
  });
  assert.equal(config.configured, true);
  assert.equal(config.supabaseUrl, "http://127.0.0.1:54321");
});
