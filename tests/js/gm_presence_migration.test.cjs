const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.resolve(
  __dirname,
  "../../supabase/migrations/20260820170000_create_campaign_presence.sql",
), "utf8").toLowerCase();

test("ties every presence row to an actual campaign membership", () => {
  assert.match(sql, /create table public\.campaign_presence/);
  assert.match(sql, /primary key \(campaign_id, user_id\)/);
  assert.match(sql, /foreign key \(campaign_id, user_id\)[\s\S]*references public\.campaign_members \(campaign_id, user_id\) on delete cascade/);
  assert.match(sql, /alter table public\.campaign_presence enable row level security/);
});

test("lets only the exact campaign gm read presence", () => {
  assert.match(sql, /create policy campaign_presence_select_campaign_gm/);
  assert.match(sql, /private\.campaign_role\(campaign_id\) = 'gm'/);
  assert.doesNotMatch(sql, /role\s*=\s*'gm'/);
});

test("updates only the authenticated member using server time", () => {
  assert.match(sql, /v_user_id := \(select auth\.uid\(\)\)/);
  assert.match(sql, /members\.campaign_id = p_campaign_id[\s\S]*members\.user_id = v_user_id/);
  assert.match(sql, /values \(p_campaign_id, v_user_id, now\(\)\)/);
  assert.match(sql, /on conflict \(campaign_id, user_id\)[\s\S]*seen_at = excluded\.seen_at/);
  assert.doesNotMatch(sql, /p_user_id|p_seen_at/);
});

test("opens no direct presence mutation to browser roles", () => {
  assert.match(sql, /revoke all privileges on table public\.campaign_presence from public, anon, authenticated/);
  assert.match(sql, /grant select \(campaign_id, user_id, seen_at\)[\s\S]*to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)[\s\S]*campaign_presence/i);
  assert.match(sql, /grant execute on function public\.touch_campaign_presence\(uuid\) to authenticated/);
  assert.doesNotMatch(sql, /grant execute[\s\S]*to (anon|public)/);
});

test("publishes only the presence table added in this phase", () => {
  assert.match(sql, /pg_catalog\.pg_publication_tables/);
  assert.match(sql, /alter publication supabase_realtime add table public\.campaign_presence/);
  assert.doesNotMatch(sql, /add table public\.(characters|rolls|campaigns|profiles)/);
});
