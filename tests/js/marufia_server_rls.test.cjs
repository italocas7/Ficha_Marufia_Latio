"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const scriptPath = path.join(root, "marufia-server", "scripts", "test-rls.ps1");
const script = fs.readFileSync(scriptPath, "utf8");

test("keeps the destructive RLS exercise local, disposable, and secret-free", () => {
  assert.match(script, /só pode ser executado no servidor local/);
  assert.match(script, /exige o banco experimental vazio/);
  assert.match(script, /delete from auth\.users where email in/);
  assert.match(script, /não voltou ao estado vazio/);
  assert.match(script, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(script, /SERVICE_ROLE_KEY/);
  assert.doesNotMatch(script, /Write-(Host|Output).*access_token/i);
});

test("attacks every private table through the anonymous API role", () => {
  for (const table of [
    "profiles",
    "campaigns",
    "campaign_members",
    "characters",
    "rolls",
    "campaign_events",
    "campaign_presence",
    "campaign_sessions",
  ]) {
    assert.match(script, new RegExp(`"${table}"`));
  }
  assert.match(script, /Acesso anônimo a \$table/);
  assert.match(script, /RPC anônima join_campaign/);
  assert.match(script, /401, 403/);
});

test("checks campaign isolation, role escalation, and scoped gm operations", () => {
  assert.match(script, /Mestre RLS/);
  assert.match(script, /Jogador A RLS/);
  assert.match(script, /Usuário Externo RLS/);
  assert.match(script, /Autoelevação de papel do Jogador A/);
  assert.match(script, /Criação direta de vínculo gm/);
  assert.match(script, /Salvamento do personagem B pelo Jogador A/);
  assert.match(script, /Operação do Mestre A em campanha externa/);
  assert.match(script, /Alteração autorizada de PV pelo Mestre/);
  assert.match(script, /Salvamento autorizado pelo proprietário/);
  assert.match(script, /Rolagens visíveis ao usuário externo/);
  assert.match(script, /Histórico visível ao usuário externo/);
});
