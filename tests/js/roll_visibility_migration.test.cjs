const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.resolve(
  __dirname,
  "../../supabase/migrations/20260820160000_enable_roll_visibility.sql",
), "utf8").toLowerCase();

test("shows public rolls to campaign members without trusting a global role", () => {
  assert.match(sql, /create policy rolls_select_by_campaign_visibility/);
  assert.match(sql, /private\.campaign_role\(campaign_id\) is not null[\s\S]*visibility = 'public'/);
  assert.doesNotMatch(sql, /profiles[\s\S]*role/);
});

test("shows secret rolls only to their author and the campaign gm", () => {
  assert.match(
    sql,
    /visibility = 'secret'[\s\S]*user_id = \(select auth\.uid\(\)\)[\s\S]*private\.campaign_role\(campaign_id\) = 'gm'/,
  );
});

test("shows gm rolls only to the gm who authored them", () => {
  assert.match(
    sql,
    /visibility = 'gm'[\s\S]*user_id = \(select auth\.uid\(\)\)[\s\S]*private\.campaign_role\(campaign_id\) = 'gm'/,
  );
  assert.match(sql, /set visibility = 'gm'[\s\S]*members\.role = 'gm'[\s\S]*rolls\.visibility = 'public'/);
});

test("derives gm privacy on the server and refuses a client-requested gm value", () => {
  assert.match(sql, /p_visibility not in \('public', 'secret'\)/);
  assert.match(sql, /v_visibility := case when v_role = 'gm' then 'gm' else p_visibility end/);
  assert.match(sql, /v_existing\.visibility = v_visibility/);
  assert.match(sql, /p_outcome,[\s\S]*v_visibility/);
});

test("returns the effective visibility and closes the legacy public-only rpc", () => {
  assert.match(sql, /drop function public\.record_roll\(uuid, uuid, text, text, text, text, jsonb, integer, integer, integer, text\)/);
  assert.match(sql, /returns jsonb/);
  assert.match(sql, /jsonb_build_object\('id', p_roll_id, 'visibility', v_visibility\)/);
  assert.match(sql, /grant execute on function public\.record_roll[\s\S]*to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)[\s\S]*on\s+(table\s+)?public\.rolls/i);
});

test("stores a character-name snapshot without exposing the character document", () => {
  assert.match(sql, /add column if not exists character_name text/);
  assert.match(sql, /select characters\.campaign_id, characters\.name/);
  assert.match(sql, /character_name[\s\S]*v_character_name/);
  assert.doesNotMatch(sql, /grant select\s*(?:\([^)]*\))?\s*on table public\.characters/);
});
