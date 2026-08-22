const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.resolve(
  __dirname,
  "../../supabase/migrations/20260820150000_enable_roll_realtime.sql",
), "utf8").toLowerCase();

test("publishes only roll inserts through the existing Realtime table", () => {
  assert.match(sql, /pg_catalog\.pg_publication_tables/);
  assert.match(sql, /alter publication supabase_realtime add table public\.rolls/);
  assert.doesNotMatch(sql, /add table public\.(profiles|campaigns|campaign_members|campaign_events)/);
  assert.doesNotMatch(sql, /replica identity full/);
});

test("allows authenticated reads without opening any roll mutation", () => {
  assert.match(sql, /grant select[\s\S]*on table public\.rolls to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)/);
  assert.doesNotMatch(sql, /\bto anon\b/);
});

test("shows only public rolls to the campaign-scoped gm", () => {
  assert.match(sql, /create policy rolls_select_public_campaign_gm/);
  assert.match(sql, /for select[\s\S]*to authenticated/);
  assert.match(sql, /visibility = 'public'[\s\S]*private\.campaign_role\(campaign_id\) = 'gm'/);
  assert.doesNotMatch(sql, /role\s*=\s*'gm'/);
});

test("does not decide gm or secret visibility before Phase 25", () => {
  assert.doesNotMatch(sql, /visibility\s+in\s*\(/);
  assert.doesNotMatch(sql, /visibility\s*=\s*'(gm|secret)'/);
});
