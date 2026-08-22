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
  "20260820050000_create_campaign_lifecycle.sql",
), "utf8");

test("generates the campaign owner and invitation code on the server", () => {
  assert.match(sql, /create or replace function public\.prepare_new_campaign\(\)/i);
  assert.match(sql, /security invoker/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /new\.owner_id\s*:=\s*\(select auth\.uid\(\)\)/i);
  assert.match(sql, /pg_catalog\.gen_random_uuid\(\)/i);
  assert.match(sql, /ABCDEFGHJKLMNPQRSTUVWXYZ23456789/);
  assert.match(sql, /new\.join_code\s*:=\s*'MRF-'/i);
  assert.match(sql, /before insert on public\.campaigns/i);
});

test("allows authenticated creation without exposing protected columns", () => {
  assert.match(sql, /grant insert \(name, description\) on table public\.campaigns to authenticated/i);
  assert.doesNotMatch(sql, /grant insert on table public\.campaigns to authenticated/i);
  assert.match(sql, /revoke all privileges on function public\.prepare_new_campaign\(\)[\s\S]*from public, anon, authenticated/i);
  assert.doesNotMatch(sql, /grant (update|delete)/i);
});

test("shows owners only their own campaigns", () => {
  assert.match(sql, /create policy campaigns_select_owned[\s\S]*for select[\s\S]*to authenticated[\s\S]*auth\.uid\(\)[\s\S]*owner_id/i);
  assert.match(sql, /create policy campaigns_insert_owned[\s\S]*for insert[\s\S]*with check[\s\S]*auth\.uid\(\)[\s\S]*owner_id/i);
  assert.doesNotMatch(sql, /campaign_members/i);
});
