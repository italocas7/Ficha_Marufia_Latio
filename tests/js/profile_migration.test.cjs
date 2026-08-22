const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const migrationPath = path.join(
  __dirname,
  "..",
  "..",
  "supabase",
  "migrations",
  "20260820040000_create_profile_lifecycle.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");

test("creates profiles automatically after an Auth signup", () => {
  assert.match(sql, /create or replace function public\.create_profile_for_new_user\(\)/);
  assert.match(sql, /security definer\s+set search_path = ''/);
  assert.match(sql, /after insert on auth\.users/);
  assert.match(sql, /execute function public\.create_profile_for_new_user\(\)/);
  assert.match(sql, /insert into public\.profiles \(id, display_name, avatar_url\)/);
});

test("sanitizes optional metadata without treating it as authorization", () => {
  assert.match(sql, /raw_user_meta_data ->> 'display_name'/);
  assert.match(sql, /raw_user_meta_data ->> 'full_name'/);
  assert.match(sql, /raw_user_meta_data ->> 'avatar_url'/);
  assert.match(sql, /left\([\s\S]*?,\s*80\s*\)/);
  assert.match(sql, /left\([\s\S]*?,\s*2048\s*\)/);
  assert.doesNotMatch(sql, /raw_(user_)?meta_data[\s\S]*role/i);
});

test("backfills profiles for any preexisting Auth users", () => {
  assert.match(sql, /from auth\.users as users/);
  assert.match(sql, /on conflict \(id\) do nothing/);
});

test("keeps the trigger function unavailable through the public API", () => {
  assert.match(
    sql,
    /revoke all privileges on function public\.create_profile_for_new_user\(\)[\s\S]*from public, anon, authenticated;/,
  );
});

test("grants authenticated users only the profile columns they may edit", () => {
  assert.match(sql, /grant select on table public\.profiles to authenticated;/);
  assert.match(sql, /grant update \(display_name, avatar_url\) on table public\.profiles to authenticated;/);
  assert.doesNotMatch(sql, /grant\s+(insert|delete|all)[\s\S]*public\.profiles/i);
  assert.doesNotMatch(sql, /grant[\s\S]*public\.profiles[\s\S]*to anon/i);
});

test("limits profile selection and updates to the authenticated owner", () => {
  assert.match(sql, /create policy profiles_select_own[\s\S]*for select[\s\S]*to authenticated/);
  assert.match(sql, /create policy profiles_update_own[\s\S]*for update[\s\S]*to authenticated/);
  assert.ok((sql.match(/\(select auth\.uid\(\)\) = id/g) || []).length >= 3);
  assert.match(sql, /with check \(/);
  assert.doesNotMatch(sql, /for (insert|delete)/i);
});
