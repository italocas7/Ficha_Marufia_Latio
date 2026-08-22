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
  "20260822120000_fix_campaign_creation_and_management.sql",
), "utf8").toLowerCase();

test("lets a campaign owner read the row during insert returning", () => {
  assert.match(sql, /drop policy campaigns_select_member/);
  assert.match(sql, /create policy campaigns_select_member[\s\S]*auth\.uid\(\)[\s\S]*= owner_id[\s\S]*private\.campaign_role\(id\) is not null/);
});

test("edits only campaign name and description through an owner-only function", () => {
  assert.match(sql, /create or replace function public\.update_campaign\([\s\S]*security definer[\s\S]*set search_path = ''/);
  assert.match(sql, /update public\.campaigns[\s\S]*set name = v_name,[\s\S]*description = v_description[\s\S]*owner_id = v_user_id/);
  assert.match(sql, /raise exception 'campaign owner required' using errcode = '42501'/);
  assert.match(sql, /grant execute on function public\.update_campaign\(uuid, text, text\) to authenticated/);
});

test("deletes only after exact name confirmation and keeps direct writes revoked", () => {
  assert.match(sql, /create or replace function public\.delete_campaign\([\s\S]*security definer[\s\S]*for update/);
  assert.match(sql, /p_confirmation_name[\s\S]*<> v_campaign\.name[\s\S]*campaign name confirmation mismatch/);
  assert.match(sql, /delete from public\.campaigns[\s\S]*owner_id = v_user_id/);
  assert.match(sql, /grant execute on function public\.delete_campaign\(uuid, text\) to authenticated/);
  assert.match(sql, /revoke update, delete on table public\.campaigns from authenticated/);
  assert.doesNotMatch(sql, /grant (update|delete) on table public\.campaigns/);
});

