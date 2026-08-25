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
  "20260822130000_clear_campaign_roll_history.sql",
), "utf8").toLowerCase();

test("clears roll data only through an exact campaign gm rpc", () => {
  assert.match(sql, /create or replace function public\.clear_campaign_roll_history\(p_campaign_id uuid\)[\s\S]*security definer[\s\S]*set search_path = ''/);
  assert.match(sql, /private\.campaign_role\(p_campaign_id\) is distinct from 'gm'[\s\S]*campaign gm required/);
  assert.match(sql, /delete from public\.campaign_events[\s\S]*campaign_id = p_campaign_id[\s\S]*event_type = 'roll'/);
  assert.match(sql, /delete from public\.rolls[\s\S]*campaign_id = p_campaign_id/);
  assert.doesNotMatch(sql, /delete from public\.(characters|campaign_sessions|campaign_presence|campaign_members)/);
});

test("keeps direct destructive table access revoked", () => {
  assert.match(sql, /revoke all privileges on function public\.clear_campaign_roll_history\(uuid\)[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.clear_campaign_roll_history\(uuid\) to authenticated/);
  assert.match(sql, /revoke delete on table public\.rolls, public\.campaign_events from authenticated/);
  assert.match(sql, /revoke update \(roll_history_revision\) on table public\.campaigns from authenticated/);
  assert.doesNotMatch(sql, /grant\s+(delete|update|insert|all)\s+on\s+(table\s+)?public\.(rolls|campaign_events|campaigns)/);
});

test("signals a committed clear through a protected campaign update", () => {
  assert.match(sql, /add column if not exists roll_history_revision bigint not null default 0/);
  assert.match(sql, /alter table public\.campaigns replica identity full/);
  assert.match(sql, /set roll_history_revision = campaigns\.roll_history_revision \+ 1/);
  assert.match(sql, /pg_catalog\.pg_publication_tables[\s\S]*alter publication supabase_realtime add table public\.campaigns/);
});
