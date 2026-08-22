const test = require("node:test");
const assert = require("node:assert/strict");
const configTools = require("../../src/online/config.js");
const supabaseTools = require("../../src/online/supabase.js");
const projectConfig = require("../../src/online/project.js");

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

test("ships only the configured public project identity", () => {
  const config = configTools.readPublicConfig(projectConfig);
  assert.equal(config.configured, true);
  assert.match(config.supabaseUrl, /^https:\/\/[a-z]+\.supabase\.co$/);
  assert.match(config.publishableKey, /^sb_publishable_/);
  assert.doesNotMatch(config.publishableKey, /^sb_secret_/);
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
      storageKey: "marufia-online-auth-v1",
    },
  });
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
