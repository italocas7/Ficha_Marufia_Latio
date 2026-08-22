const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.join(
  __dirname,
  "../../supabase/migrations/20260820220000_expand_gm_character_actions.sql",
), "utf8").toLowerCase();

const operations = [
  "gm_set_character_pm",
  "gm_add_character_condition",
  "gm_remove_character_condition",
  "gm_add_character_item",
  "gm_remove_character_item",
];

test("adds only the five newly approved granular gm operations", () => {
  for (const operation of operations) {
    assert.match(sql, new RegExp(`create function public\\.${operation}\\s*\\(`));
    assert.match(sql, new RegExp(`grant execute on function public\\.${operation}[\\s\\S]*?to authenticated`));
    assert.match(sql, new RegExp(`revoke all privileges on function public\\.${operation}[\\s\\S]*?from public, anon`));
  }
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)\s+on\s+(table\s+)?public\.characters/);
});

test("checks exact campaign gm role and revision before every mutation", () => {
  assert.match(sql, /private\.campaign_role\(v_campaign_id\) is distinct from 'gm'/);
  assert.match(sql, /revoke all privileges on function private\.require_gm_character_campaign\(uuid, bigint\)[\s\S]*from public, anon, authenticated/);
  assert.equal((sql.match(/characters\.revision = p_expected_revision/g) || []).length, 5);
  assert.equal((sql.match(/set_config\('marufia\.character_change_origin', 'gm', true\)/g) || []).length, 5);
});

test("limits mutations to pm, effects, weapons, and equipment", () => {
  assert.match(sql, /'\{resources,pmcurrent\}'/);
  assert.match(sql, /v_state -> 'effects'/);
  assert.match(sql, /v_kind not in \('weapon', 'equipment'\)/);
  assert.match(sql, /array\['inventory', v_collection\]/);
  assert.doesNotMatch(sql, /hpmaxbonus|pmmaxbonus|attributes|skills|talents|magic|world/);
});

test("validates condition and item payloads before preserving schema v5 arrays", () => {
  assert.match(sql, /invalid character condition/);
  assert.match(sql, /jsonb_build_object\([\s\S]*'cortante'[\s\S]*'perfurante'[\s\S]*'contundente'/);
  assert.match(sql, /invalid character item/);
  assert.match(sql, /selectedweaponid/);
  assert.match(sql, /'\^\[a-za-z0-9\._:-\]\{1,128\}\$'/);
});
