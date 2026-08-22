const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.join(
  __dirname,
  "../../supabase/migrations/20260820180000_enable_gm_hp_updates.sql",
), "utf8");

test("exposes one granular gm mutation for current hp only", () => {
  assert.match(sql, /create function public\.gm_set_character_hp\s*\(/i);
  assert.match(sql, /'\{resources,hpCurrent\}'/i);
  assert.doesNotMatch(sql, /pmCurrent|condition|inventory/i);
  assert.match(sql, /grant execute on function public\.gm_set_character_hp[\s\S]*to authenticated/i);
});

test("requires exact campaign gm role and an expected revision", () => {
  assert.match(sql, /private\.campaign_role\(v_campaign_id\) is distinct from 'gm'/i);
  assert.match(sql, /characters\.revision = p_expected_revision/i);
  assert.match(sql, /character revision conflict[\s\S]*40001/i);
});

test("server alone marks a verified gm change origin", () => {
  assert.match(sql, /current_setting\('marufia\.character_change_origin', true\)/i);
  assert.match(sql, /private\.campaign_role\(new\.campaign_id\) = 'gm'/i);
  assert.match(sql, /set_config\('marufia\.character_change_origin', 'gm', true\)/i);
});

test("keeps direct browser table mutation closed", () => {
  assert.doesNotMatch(sql, /grant\s+update\s+on\s+table\s+public\.characters/i);
  assert.match(sql, /revoke all privileges on function public\.gm_set_character_hp[\s\S]*from public, anon/i);
});
