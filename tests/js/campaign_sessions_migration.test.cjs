const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.join(
  __dirname,
  "../../supabase/migrations/20260820210000_create_campaign_sessions.sql",
), "utf8").toLowerCase();

test("creates campaign sessions with one active row per campaign", () => {
  assert.match(sql, /create table public\.campaign_sessions/);
  for (const column of ["id", "campaign_id", "name", "started_at", "ended_at", "status"]) {
    assert.match(sql, new RegExp(`\\b${column}\\b`));
  }
  assert.match(sql, /create unique index campaign_sessions_one_active_idx[\s\S]*where status = 'active'/);
  assert.match(sql, /status in \('active', 'ended'\)/);
  assert.match(sql, /status = 'active' and ended_at is null[\s\S]*status = 'ended' and ended_at is not null/);
});

test("lets only the exact campaign gm read and control sessions", () => {
  assert.match(sql, /create policy campaign_sessions_select_campaign_gm[\s\S]*private\.campaign_role\(campaign_id\) = 'gm'/);
  assert.match(sql, /private\.campaign_role\(p_campaign_id\) is distinct from 'gm'/);
  assert.match(sql, /private\.campaign_role\(v_campaign_id\) is distinct from 'gm'/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)[\s\S]*campaign_sessions/);
  assert.match(sql, /grant execute on function public\.start_campaign_session\(uuid, text\)[\s\S]*to authenticated/);
  assert.match(sql, /grant execute on function public\.end_campaign_session\(uuid\)[\s\S]*to authenticated/);
});

test("derives session times on the server and keeps end idempotent", () => {
  assert.match(sql, /started_at timestamptz not null default now\(\)/);
  assert.match(sql, /set status = 'ended', ended_at = now\(\)/);
  assert.match(sql, /if not found then[\s\S]*select sessions\.\*[\s\S]*where sessions\.id = p_session_id/);
  assert.doesNotMatch(sql, /p_started_at|p_ended_at|p_status/);
});

test("associates every new campaign event with the active session internally", () => {
  assert.match(sql, /add column session_id uuid references public\.campaign_sessions \(id\) on delete set null/);
  assert.match(sql, /before insert on public\.campaign_events/);
  assert.match(sql, /new\.session_id := private\.active_campaign_session\(new\.campaign_id\)/);
  assert.match(sql, /revoke all privileges on function private\.active_campaign_session\(uuid\)[\s\S]*from public, anon, authenticated/);
});

test("publishes session lifecycle changes without opening direct writes", () => {
  assert.match(sql, /alter publication supabase_realtime add table public\.campaign_sessions/);
  assert.match(sql, /revoke all privileges on table public\.campaign_sessions from public, anon, authenticated/);
});
