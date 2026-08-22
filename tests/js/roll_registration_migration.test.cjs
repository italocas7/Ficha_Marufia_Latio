const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.resolve(
  __dirname,
  "../../supabase/migrations/20260820140000_enable_roll_registration.sql",
), "utf8").toLowerCase();

test("derives roll ownership and campaign from an owned associated character", () => {
  assert.match(sql, /v_user_id := \(select auth\.uid\(\)\)/);
  assert.match(sql, /from public\.characters[\s\S]*characters\.id = p_character_id[\s\S]*characters\.owner_id = v_user_id/);
  assert.match(sql, /v_campaign_id is null[\s\S]*character campaign required/);
  assert.match(sql, /from public\.campaign_members[\s\S]*members\.campaign_id = v_campaign_id[\s\S]*members\.user_id = v_user_id/);
});

test("accepts only the dice formulas and selections already used by the sheet", () => {
  assert.match(sql, /'skill', 'attribute', 'combat', 'world_duration', 'core_damage_reduction'/);
  assert.match(sql, /p_formula <> '1d100' or v_count <> 1/);
  assert.match(sql, /p_formula <> '2d100' or v_count <> 2/);
  assert.match(sql, /v_expected_total := v_min/);
  assert.match(sql, /v_expected_total := v_max/);
  assert.match(sql, /p_formula not in \('1d4', '1d4\+2'\)/);
  assert.match(sql, /p_formula = '1d4'[\s\S]*p_modifier is distinct from 0/);
  assert.match(sql, /p_formula = '1d4\+2'[\s\S]*p_modifier is distinct from 2/);
  assert.match(sql, /p_formula <> '1d6'/);
  assert.match(sql, /p_total <> v_expected_total/);
});

test("keeps current d100 targets and outcomes without inventing modifiers", () => {
  assert.match(sql, /p_modifier is distinct from 0[\s\S]*p_target is null/);
  assert.match(sql, /p_outcome is null[\s\S]*p_outcome not in/);
  assert.match(sql, /'crítico natural', 'extremo', 'bom\/sólido', 'normal', 'falha'/);
  assert.match(sql, /p_target,/);
  assert.doesNotMatch(sql, /p_total\s*[+-]\s*p_modifier/);
});

test("fixes identity, campaign, and public visibility on the server", () => {
  assert.match(sql, /insert into public\.rolls[\s\S]*v_campaign_id,[\s\S]*p_character_id,[\s\S]*v_user_id/);
  assert.match(sql, /p_outcome,[\s\S]*'public'/);
  assert.doesNotMatch(sql, /p_user_id|p_campaign_id|p_visibility/);
});

test("is idempotent without opening the rolls table to browser roles", () => {
  assert.match(sql, /where rolls\.id = p_roll_id/);
  assert.match(sql, /return v_existing\.id/);
  assert.match(sql, /security definer/);
  assert.match(sql, /revoke all privileges on function public\.record_roll/);
  assert.match(sql, /grant execute on function public\.record_roll[\s\S]*to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all)[\s\S]*on\s+(table\s+)?public\.rolls/i);
});
