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
  "20260820110000_enable_character_remote_saves.sql",
), "utf8");

test("grants authenticated owners only the state column needed for remote saves", () => {
  assert.match(sql, /grant update \(state\) on table public\.characters to authenticated/i);
  assert.doesNotMatch(sql, /grant (all|delete|insert|select)\b/i);
  assert.doesNotMatch(sql, /grant update \([^)]*(owner_id|name|schema_version|created_at|updated_at)/i);
  assert.doesNotMatch(sql, /\bto (anon|public)\b/i);
});

test("does not replace ownership policies or the protected write trigger", () => {
  assert.doesNotMatch(sql, /drop (policy|trigger|function)/i);
  assert.doesNotMatch(sql, /create policy/i);
  assert.doesNotMatch(sql, /security definer/i);
});
