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
  "20260820100000_create_character_lifecycle.sql",
), "utf8");

test("creates independent characters with server-controlled ownership and metadata", () => {
  assert.match(sql, /create or replace function private\.prepare_character_write\(\)/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /if tg_op = 'INSERT' then[\s\S]*new\.owner_id := v_user_id[\s\S]*new\.campaign_id := null/i);
  assert.match(sql, /new\.schema_version := v_schema_version_text::smallint/i);
  assert.match(sql, /new\.name := left\(/i);
});

test("associates only characters whose owner belongs to the campaign", () => {
  assert.match(sql, /from public\.campaign_members as members/i);
  assert.match(sql, /members\.campaign_id = new\.campaign_id[\s\S]*members\.user_id = new\.owner_id/i);
  assert.match(sql, /raise exception 'campaign membership required' using errcode = '42501'/i);
});

test("grants only the lifecycle columns needed before remote autosave", () => {
  assert.match(sql, /grant select on table public\.characters to authenticated/i);
  assert.match(sql, /grant insert \(state\) on table public\.characters to authenticated/i);
  assert.match(sql, /grant update \(campaign_id\) on table public\.characters to authenticated/i);
  assert.doesNotMatch(sql, /grant update \([^)]*state/i);
  assert.doesNotMatch(sql, /grant (delete|all) on table public\.characters/i);
  assert.doesNotMatch(sql, /grant insert \([^)]*(owner_id|name|schema_version|campaign_id)/i);
});

test("limits listing, creation, and association to the row owner", () => {
  assert.match(sql, /create policy characters_select_owned[\s\S]*for select[\s\S]*auth\.uid\(\)[\s\S]*= owner_id/i);
  assert.match(sql, /create policy characters_insert_owned[\s\S]*for insert[\s\S]*with check[\s\S]*auth\.uid\(\)[\s\S]*= owner_id/i);
  assert.match(sql, /create policy characters_update_owned[\s\S]*for update[\s\S]*using[\s\S]*auth\.uid\(\)[\s\S]*= owner_id[\s\S]*with check/i);
  assert.doesNotMatch(sql, /campaign_role\(campaign_id\)/i);
});

test("keeps the privileged trigger unavailable through the API", () => {
  assert.match(sql, /revoke all privileges on function private\.prepare_character_write\(\)[\s\S]*from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /grant execute on function private\.prepare_character_write/i);
});
