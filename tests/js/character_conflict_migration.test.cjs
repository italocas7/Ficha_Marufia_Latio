const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sql = fs.readFileSync(path.resolve(
  __dirname,
  "../../supabase/migrations/20260820130000_enable_character_conflict_control.sql",
), "utf8");

test("adds server-controlled revision and origin without changing the character JSON", () => {
  assert.match(sql, /add column revision bigint not null default 1/i);
  assert.match(sql, /add column last_change_origin text not null default 'system'/i);
  assert.match(sql, /last_change_origin in \('player', 'gm', 'system'\)/i);
  assert.match(sql, /new\.revision := old\.revision \+ 1/i);
  assert.match(sql, /new\.last_change_origin := 'player'/i);
  assert.doesNotMatch(sql, /(add|alter|drop) column (state|schema_version)\b/i);
});

test("saves atomically only at the expected owned revision", () => {
  assert.match(sql, /create or replace function public\.save_character_state\([\s\S]*p_expected_revision bigint/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /where characters\.id = p_character_id[\s\S]*characters\.owner_id = v_user_id[\s\S]*characters\.revision = p_expected_revision/i);
  assert.match(sql, /character revision conflict[^]*errcode = '40001'/i);
  assert.match(sql, /grant execute on function public\.save_character_state\(uuid, jsonb, bigint\)[\s\S]*to authenticated/i);
});

test("closes the direct state update path and grants no conflict metadata writes", () => {
  assert.match(sql, /revoke update \(state\) on table public\.characters from authenticated/i);
  assert.doesNotMatch(sql, /grant update \([^)]*(revision|last_change_origin)/i);
  assert.doesNotMatch(sql, /grant execute[^;]*to anon/i);
  assert.doesNotMatch(sql, /campaign_role|last_change_origin := 'gm'/i);
});
