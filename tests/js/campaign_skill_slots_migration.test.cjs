const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sql = fs.readFileSync(path.join(root, "supabase/migrations/20260930010000_campaign_skill_slots.sql"), "utf8");

test("existing campaigns receive the default cap and only the owner can edit it", () => {
  assert.match(sql, /skill_limit integer not null default 70/i);
  assert.match(sql, /skill_limit between 1 and 999/i);
  assert.match(sql, /where id = p_campaign_id and owner_id = v_user_id/i);
  assert.match(sql, /grant execute on function public\.update_campaign_details.*to authenticated/is);
});

test("the server serializes concurrent slot creation and preserves five account slots", () => {
  assert.match(sql, /pg_advisory_xact_lock/i);
  assert.match(sql, /count\(\*\).*from public\.characters where owner_id = v_user_id/is);
  assert.match(sql, /if v_count >= 5/i);
  assert.match(sql, /before insert on public\.characters/i);
});

test("deletion requires ownership, name, and exact revision", () => {
  assert.match(sql, /id = p_character_id and owner_id = v_user_id for update/i);
  assert.match(sql, /p_confirmation_name.*v_character\.name/is);
  assert.match(sql, /p_expected_revision <> v_character\.revision/i);
});
