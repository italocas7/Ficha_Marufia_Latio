const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.join(
  __dirname,
  "..",
  "..",
  "supabase",
  "migrations",
  "20260820120000_enable_character_realtime.sql",
), "utf8");

test("publishes only character changes through the Supabase Realtime publication", () => {
  assert.match(sql, /from pg_catalog\.pg_publication_tables[\s\S]*pubname = 'supabase_realtime'[\s\S]*tablename = 'characters'/i);
  assert.match(sql, /alter publication supabase_realtime add table public\.characters/i);
  assert.doesNotMatch(sql, /add table public\.(profiles|campaigns|campaign_members|rolls|campaign_events)/i);
  assert.doesNotMatch(sql, /replica identity full/i);
});

test("lets only campaign gms select linked characters without gaining write access", () => {
  assert.match(sql, /create policy characters_select_campaign_gm[\s\S]*for select[\s\S]*to authenticated/i);
  assert.match(sql, /campaign_id is not null[\s\S]*private\.campaign_role\(campaign_id\) = 'gm'/i);
  assert.doesNotMatch(sql, /for (insert|update|delete)/i);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all)/i);
  assert.doesNotMatch(sql, /\bto (anon|public)\b/i);
});
