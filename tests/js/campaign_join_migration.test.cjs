const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..", "..");
const sql = fs.readFileSync(path.join(
  root,
  "supabase",
  "migrations",
  "20260820080000_create_campaign_join_by_code.sql",
), "utf8");
const conflictFix = fs.readFileSync(path.join(
  root,
  "supabase",
  "migrations",
  "20260820081000_fix_campaign_join_conflict_target.sql",
), "utf8");

test("looks up invitation codes only inside a private security-definer function", () => {
  assert.match(sql, /create or replace function private\.join_campaign_by_code\(normalized_join_code text\)/i);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /from public\.campaigns as campaigns[\s\S]*campaigns\.join_code = normalized_join_code/i);
  assert.match(sql, /raise exception 'campaign not found' using errcode = 'P0002'/i);
});

test("exposes a validated authenticated wrapper without exposing the privileged function", () => {
  assert.match(sql, /create or replace function public\.join_campaign\(p_join_code text\)/i);
  assert.match(sql, /security invoker[\s\S]*upper\(btrim\(coalesce\(p_join_code, ''\)\)\)/i);
  assert.match(sql, /\^MRF-\[A-HJ-NP-Z2-9\]\{4\}-\[A-HJ-NP-Z2-9\]\{2\}\$/i);
  assert.match(sql, /revoke all privileges on function public\.join_campaign\(text\)[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.join_campaign\(text\) to authenticated/i);
  assert.doesNotMatch(sql, /grant execute on function public\.join_campaign\(text\) to (public|anon)/i);
});

test("creates only player memberships and preserves every existing role", () => {
  assert.match(sql, /insert into public\.campaign_members \(campaign_id, user_id, role\)[\s\S]*values \(v_campaign_id, v_user_id, 'player'\)/i);
  assert.match(sql, /if found then[\s\S]*v_member_role[\s\S]*true[\s\S]*return;/i);
  assert.match(sql, /on conflict \(campaign_id, user_id\) do nothing/i);
  assert.doesNotMatch(sql, /set role\s*=/i);
  assert.doesNotMatch(sql, /values \([^)]*'(gm|assistant_gm)'/i);
});

test("uses the named primary key to keep concurrent joins unambiguous", () => {
  assert.match(conflictFix, /on conflict on constraint campaign_members_pkey do nothing/i);
  assert.match(conflictFix, /returning campaign_members\.role into v_member_role/i);
  assert.doesNotMatch(conflictFix, /on conflict \(campaign_id, user_id\)/i);
});

test("does not grant direct campaign or membership mutation privileges", () => {
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)[\s\S]*(campaign_members|campaigns)[\s\S]*to authenticated/i);
});
