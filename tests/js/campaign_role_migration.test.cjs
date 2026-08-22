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
  "20260820070000_create_campaign_role_authorization.sql",
), "utf8");

test("resolves authorization from the campaign membership row", () => {
  assert.match(sql, /create or replace function private\.campaign_role\(target_campaign_id uuid\)/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /from public\.campaign_members as members/i);
  assert.match(sql, /members\.campaign_id = target_campaign_id/i);
  assert.match(sql, /members\.user_id = \(select auth\.uid\(\)\)/i);
});

test("keeps the role helper private and narrowly executable", () => {
  assert.match(sql, /revoke all privileges on function private\.campaign_role\(uuid\)[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function private\.campaign_role\(uuid\) to authenticated/i);
  assert.doesNotMatch(sql, /create or replace function public\.campaign_role/i);
});

test("shows campaigns by membership instead of a global or owner role", () => {
  assert.match(sql, /drop policy campaigns_select_owned on public\.campaigns/i);
  assert.match(sql, /create policy campaigns_select_member[\s\S]*private\.campaign_role\(id\) is not null/i);
  assert.doesNotMatch(sql, /profiles[\s\S]*role/i);
  assert.doesNotMatch(sql, /auth\.users[\s\S]*role/i);
  assert.doesNotMatch(sql, /user\.role/i);
});

test("lets gm see campaign participants while every member sees itself", () => {
  assert.match(sql, /drop policy campaign_members_select_visible on public\.campaign_members/i);
  assert.match(sql, /create policy campaign_members_select_by_campaign_role[\s\S]*auth\.uid\(\)[\s\S]*= user_id[\s\S]*campaign_role\(campaign_id\) = 'gm'/i);
  assert.doesNotMatch(sql, /campaign_role\(campaign_id\) in \('assistant_gm', 'spectator'\)/i);
});

test("does not grant clients any new membership mutation", () => {
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)[\s\S]*(campaign_members|campaigns)[\s\S]*to authenticated/i);
});
