"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const wrapper = read("marufia-server", "scripts", "test-public-clients.ps1");
const helper = read("tools", "test_marufia_server_public.cjs");
const selector = read("marufia-server", "scripts", "select-client-backend.ps1");

test("runs a bounded disposable public acceptance flow over named HTTPS", () => {
  assert.match(wrapper, /ValidateRange\(2, 8\)/);
  assert.match(wrapper, /MARUFIA_PUBLIC_URL/);
  assert.match(wrapper, /CLOUDFLARE_TUNNEL_HOSTNAME/);
  assert.match(wrapper, /\$publicUri\.Scheme -ne "https"/);
  assert.match(wrapper, /phase13-[^"\n]+example\.invalid/);
  assert.match(wrapper, /Contas e dados descartáveis da Fase 13 removidos/);
});

test("keeps administrative setup local and sends only public credentials to clients", () => {
  assert.match(wrapper, /http:\/\/127\.0\.0\.1:\$\(\$environment\['API_GW_HTTP_PORT'\]\)/);
  assert.match(wrapper, /\/auth\/v1\/admin\/users/);
  assert.match(wrapper, /SERVICE_ROLE_KEY/);
  assert.doesNotMatch(helper, /SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|JWT_SECRET|POSTGRES_PASSWORD/);
  assert.doesNotMatch(wrapper.match(/\$values = @\{[\s\S]*?\n    \}/)?.[0] || "", /SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
});

test("exercises a typical table with realtime and campaign isolation", () => {
  assert.match(helper, /clients=\$\{all\.length\}/);
  assert.match(helper, /config\.playerEmails\.length >= 2/);
  for (const table of ["characters", "rolls", "campaign_presence", "campaign_sessions", "campaigns"]) {
    assert.match(helper, new RegExp(`table: "${table}"`));
  }
  assert.match(helper, /Conta externa recebeu evento privado/);
  assert.match(helper, /visibleCharacters\.length, players\.length/);
});

test("detects conflicts without blind overwrite and rejects duplicate events", () => {
  assert.match(helper, /Promise\.all\(\[\s*players\[0\]\.rpc\("save_character_state"/);
  assert.match(helper, /filter\(\(result\) => !result\.error\)\.length, 1/);
  assert.match(helper, /filter\(\(result\) => result\.error\)\.length, 1/);
  assert.match(helper, /Evento de ficha duplicado após retorno/);
  assert.match(helper, /Rolagem duplicada após retorno/);
});

test("performs a recoverable outage and waits for actual realtime events", () => {
  assert.match(wrapper, /TESTAR-QUEDA-MARUFIA/);
  assert.ok(wrapper.indexOf("stop-server.ps1") < wrapper.indexOf("start-server.ps1"));
  assert.match(wrapper, /character_sync\.test\.cjs/);
  assert.match(wrapper, /online_rolls\.test\.cjs/);
  assert.match(wrapper, /foreach \(\$attempt in 1\.\.6\)/);
  assert.match(helper, /PUBLIC_REALTIME_RECOVERY=PASS/);
  assert.doesNotMatch(wrapper, /down\s+-v|volume\s+rm|system\s+prune/i);
});

test("documents the remaining physical gate and closes the profile file handle", () => {
  const documentation = read("docs", "SERVER_ACCEPTANCE_TEST.md");
  const phase = read("docs", "MARUFIA_SERVER_PHASE_13.md");
  assert.match(documentation, /segundo computador físico/);
  assert.match(documentation, /Marufia-Setup\.exe/);
  assert.match(phase, /STATUS: Parcial/);
  assert.match(phase, /Supabase Cloud continua como padrão/);
  assert.match(selector, /ReadAllLines/);
  assert.doesNotMatch(selector, /ReadLines\(/);
});
