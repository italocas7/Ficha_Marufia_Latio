const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.join(
  __dirname,
  "../../supabase/migrations/20260820190000_expand_campaign_presence_status.sql",
), "utf8").toLowerCase();

test("separates connection heartbeat from recent activity", () => {
  assert.match(sql, /add column active_at timestamptz not null default now\(\)/);
  assert.match(sql, /p_active boolean default true/);
  assert.match(sql, /seen_at = excluded\.seen_at/);
  assert.match(sql, /when coalesce\(p_active, false\) then excluded\.active_at[\s\S]*else campaign_presence\.active_at/);
});

test("keeps one moderate server-timed heartbeat endpoint", () => {
  assert.match(sql, /values \(p_campaign_id, v_user_id, now\(\), now\(\)\)/);
  assert.doesNotMatch(sql, /p_seen_at|p_active_at/);
  assert.match(sql, /grant execute on function public\.touch_campaign_presence\(uuid, boolean\)[\s\S]*to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+(table\s+)?public\.campaign_presence/);
});
