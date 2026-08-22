const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.join(
  __dirname,
  "../../supabase/migrations/20260820200000_enable_campaign_history.sql",
), "utf8").toLowerCase();

test("records only the five relevant event families", () => {
  for (const eventType of ["hp_changed", "pm_changed", "conditions_changed", "item_changed", "roll"]) {
    assert.match(sql, new RegExp(`'${eventType}'`));
  }
  assert.doesNotMatch(sql, /\{notes,|\{character,name\}|appearance/);
  assert.match(sql, /after update of state on public\.characters/);
  assert.match(sql, /after insert on public\.rolls/);
});

test("keeps event creation server-side and direct writes closed", () => {
  assert.match(sql, /security definer/g);
  assert.match(sql, /revoke all privileges on function private\.record_character_history\(\)/);
  assert.match(sql, /revoke all privileges on function private\.record_roll_history\(\)/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)[\s\S]*campaign_events/);
});

test("lets only campaign gm read history without leaking another gm private roll", () => {
  assert.match(sql, /private\.campaign_role\(campaign_id\) = 'gm'/);
  assert.match(sql, /event_type <> 'roll'[\s\S]*payload ->> 'visibility'[\s\S]*<> 'gm'[\s\S]*actor_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /grant select[\s\S]*on table public\.campaign_events to authenticated/);
});

test("publishes campaign history for realtime updates", () => {
  assert.match(sql, /pg_catalog\.pg_publication_tables/);
  assert.match(sql, /alter publication supabase_realtime add table public\.campaign_events/);
});
