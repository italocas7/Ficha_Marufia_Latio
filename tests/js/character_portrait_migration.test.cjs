"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sql = fs.readFileSync(path.join(root, "supabase/migrations/20261001020000_character_portraits.sql"), "utf8");

test("portraits use a private size-limited bucket and owner-only writes", () => {
  assert.match(sql, /'character-portraits', 'character-portraits', false, 358400/);
  assert.match(sql, /allowed_mime_types\s*=\s*array\['image\/webp'\]/);
  assert.match(sql, /character_portraits_storage_insert[\s\S]*can_upload_character_portrait\(name\)/);
  assert.match(sql, /character_portraits_storage_delete[\s\S]*owner_id = \(select auth\.uid\(\)::text\)/);
  assert.match(sql, /split_part\(p_path, '\/', 1\) <> p_character_id::text/);
});

test("campaign members may read only the currently linked portrait, never sheet JSON", () => {
  assert.match(sql, /portrait\.object_path = p_path/);
  assert.match(sql, /member\.campaign_id = character\.campaign_id[\s\S]*member\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(sql, /list_campaign_party_summary[\s\S]*owner_id uuid, player_name text,[\s\S]*presence_status text, portrait_path text/);
  assert.doesNotMatch(sql, /returns table\s*\([^)]*\bstate\b/i);
});
