"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const wrapper = fs.readFileSync(
  path.join(root, "marufia-server", "scripts", "test-realtime.ps1"),
  "utf8",
);
const helper = fs.readFileSync(
  path.join(root, "tools", "test_marufia_server_realtime.cjs"),
  "utf8",
);

test("keeps the Realtime exercise local, empty, disposable, and secret-free", () => {
  assert.match(wrapper, /só pode ser executado no servidor local/);
  assert.match(wrapper, /exige o banco experimental vazio/);
  assert.match(wrapper, /ENABLE_EMAIL_AUTOCONFIRM/);
  assert.match(wrapper, /delete from auth\.users where email in/);
  assert.match(wrapper, /não voltou ao estado vazio/);
  assert.match(wrapper, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(`${wrapper}\n${helper}`, /SERVICE_ROLE_KEY/);
  assert.doesNotMatch(`${wrapper}\n${helper}`, /console\.log\([^\n]*(?:access_token|refresh_token|password)/i);
});

test("exercises all six tables published by Marufia through scoped subscriptions", () => {
  for (const table of [
    "characters",
    "rolls",
    "campaign_events",
    "campaign_presence",
    "campaign_sessions",
    "campaigns",
  ]) {
    assert.match(helper, new RegExp(`table: "${table}"`));
  }
  assert.match(helper, /filter: `campaign_id=eq\.\$\{campaignA\.id\}`/);
  assert.match(helper, /filter: `id=eq\.\$\{playerCharacter\.id\}`/);
  assert.match(helper, /received\.outsider\.length, 0/);
});

test("uses a WAL barrier and rejects duplicated or leaked events", () => {
  assert.match(helper, /Barreira inicial de Realtime/);
  assert.match(helper, /event\.new\?\.revision === 3/);
  assert.match(helper, /for \(const events of Object\.values\(received\)\) events\.length = 0/);
  assert.match(helper, /personagem duplicado/i);
  assert.match(helper, /rolagem duplicada/i);
  assert.match(helper, /histórico duplicado ou incompleto/i);
  assert.match(helper, /presença duplicada/i);
  assert.match(helper, /new Set\(received\.gmEvents/);
});

test("closes every channel and disconnects all three clients", () => {
  assert.match(helper, /assert\.deepEqual\(clients\.map\(\(target\) => target\.getChannels\(\)\.length\), \[1, 1, 1\]\)/);
  assert.match(helper, /await Promise\.all\(clients\.map\(\(target\) => target\.removeAllChannels\(\)\)\)/);
  assert.match(helper, /\[0, 0, 0\]/);
  assert.match(helper, /target\.realtime\.disconnect\(\)/);
});
