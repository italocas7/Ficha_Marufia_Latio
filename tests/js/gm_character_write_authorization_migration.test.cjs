const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sql = fs.readFileSync(path.join(
  __dirname,
  "..",
  "..",
  "supabase",
  "migrations",
  "20260820231000_allow_authorized_gm_character_writes.sql",
), "utf8").toLowerCase();

test("allows the previously approved gm RPC path through the owner trigger", () => {
  assert.match(sql, /old\.owner_id <> v_user_id/);
  assert.match(sql, /current_setting\('marufia\.character_change_origin', true\) = 'gm'/);
  assert.match(sql, /private\.campaign_role\(old\.campaign_id\) = 'gm'/);
  assert.match(sql, /new\.campaign_id is not distinct from old\.campaign_id/);
  assert.match(sql, /if not v_authorized_gm_write[\s\S]*character owner required/);
});

test("never transfers ownership or campaign during a gm write", () => {
  assert.match(sql, /new\.owner_id := old\.owner_id/);
  assert.match(sql, /old\.campaign_id is not null/);
  assert.equal((sql.match(/new\.campaign_id\s*:=/g) || []).length, 1);
  assert.match(sql, /if tg_op = 'insert'[\s\S]*new\.campaign_id := null/);
});

test("preserves schema, name, and owner-membership validation", () => {
  assert.match(sql, /new\.state #>> '\{meta,schemaversion\}'/);
  assert.match(sql, /new\.schema_version := v_schema_version_text::smallint/);
  assert.match(sql, /new\.state #>> '\{character,name\}'/);
  assert.match(sql, /members\.campaign_id = new\.campaign_id[\s\S]*members\.user_id = new\.owner_id/);
});

test("adds no table privilege or policy while keeping the trigger private", () => {
  assert.match(sql, /revoke all privileges on function private\.prepare_character_write\(\)[\s\S]*from public, anon, authenticated/);
  assert.doesNotMatch(sql, /grant\s|create policy|drop policy|alter table/);
});
