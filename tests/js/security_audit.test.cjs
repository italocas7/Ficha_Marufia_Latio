const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sql = fs.readFileSync(path.join(
  __dirname,
  "..",
  "..",
  "supabase",
  "tests",
  "rls_security.test.sql",
), "utf8").toLowerCase();

test("runs the remote attack suite transactionally with three isolated identities", () => {
  assert.match(sql, /^begin;/);
  assert.match(sql, /select plan\(35\)/);
  assert.match(sql, /gm-f36@marufia\.invalid/);
  assert.match(sql, /jogador a f36/);
  assert.match(sql, /jogador b f36/);
  assert.match(sql, /select \* from finish\(\);[\s\S]*security_results[\s\S]*rollback;\s*$/);
  assert.doesNotMatch(sql, /commit;/);
});

test("attacks character ownership, campaign isolation, role escalation, IDs, and direct RPCs", () => {
  assert.match(sql, /não lê personagem alheio/);
  assert.match(sql, /não salva personagem alheio mesmo conhecendo o uuid/);
  assert.match(sql, /não promove o próprio papel/);
  assert.match(sql, /não cria um vínculo gm diretamente/);
  assert.match(sql, /não associa a própria ficha a campanha externa/);
  assert.match(sql, /não chama a operação de pv do mæstre/);
  assert.match(sql, /não altera personagem de campanha externa por uuid/);
});

test("checks legitimate player and gm paths so denial cannot hide a broken application", () => {
  assert.match(sql, /salva a própria ficha pela função autorizada/);
  assert.match(sql, /gm altera pv somente na campanha administrada/);
  assert.match(sql, /código de convite não transforma jogador a em mæstre/);
  assert.match(sql, /gm vê pública, secreta e a própria rolagem gm/);
  assert.match(sql, /jogador a não lê histórico do mæstre/);
});

test("collects every TAP result so the remote runner cannot accept a hidden failure", () => {
  assert.match(sql, /create temporary table tap_results/);
  assert.equal((sql.match(/create function public\.is\(/g) || []).length, 2);
  assert.match(sql, /create function public\.cmp_ok\(/);
  assert.match(sql, /string_agg\(result, e'\\n'\) as security_results/);
});
