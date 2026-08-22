const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..", "..");
const sql = fs.readFileSync(path.join(
  root,
  "supabase",
  "migrations",
  "20260820060000_create_campaign_membership_lifecycle.sql",
), "utf8");
const foundation = fs.readFileSync(path.join(
  root,
  "supabase",
  "migrations",
  "20260820030000_create_marufia_online_foundation.sql",
), "utf8");

test("registers every campaign owner as its gm", () => {
  assert.match(sql, /create or replace function private\.add_campaign_owner_membership\(\)/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /insert into public\.campaign_members \(campaign_id, user_id, role, joined_at\)[\s\S]*new\.id, new\.owner_id, 'gm', new\.created_at/i);
  assert.match(sql, /after insert on public\.campaigns/i);
});

test("backfills campaigns created before the membership trigger", () => {
  assert.match(sql, /select campaigns\.id, campaigns\.owner_id, 'gm', campaigns\.created_at[\s\S]*from public\.campaigns/i);
  assert.match(sql, /on conflict \(campaign_id, user_id\) do update[\s\S]*set role = 'gm'/i);
});

test("keeps membership mutations unavailable to browser roles", () => {
  assert.match(sql, /grant select on table public\.campaign_members to authenticated/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)[\s\S]*campaign_members[\s\S]*to authenticated/i);
  assert.match(sql, /revoke all privileges on function private\.add_campaign_owner_membership\(\)[\s\S]*from public, anon, authenticated/i);
});

test("lets users see their own membership and owners see their campaign participants", () => {
  assert.match(sql, /create policy campaign_members_select_visible[\s\S]*for select[\s\S]*to authenticated/i);
  assert.match(sql, /auth\.uid\(\)[\s\S]*= user_id/i);
  assert.match(sql, /private\.is_campaign_owner\(campaign_id\)/i);
  assert.match(sql, /create schema if not exists private/i);
  assert.match(sql, /revoke all privileges on schema private from public, anon, authenticated/i);
});

test("keeps initial roles campaign-scoped and preserves future compatibility", () => {
  assert.match(foundation, /primary key \(campaign_id, user_id\)/i);
  assert.match(foundation, /role in \('gm', 'player', 'assistant_gm', 'spectator'\)/i);
  assert.doesNotMatch(sql, /profiles[\s\S]*role/i);
});
