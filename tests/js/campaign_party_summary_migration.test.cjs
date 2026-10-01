const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sql = fs.readFileSync(path.resolve(__dirname, "../../supabase/migrations/20261001010000_campaign_party_summary.sql"), "utf8");
const verifier = fs.readFileSync(path.resolve(__dirname, "../../marufia-server/scripts/verify-schema.ps1"), "utf8");

test("party summary requires campaign membership and never returns full sheet state", () => {
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /member\.campaign_id = p_campaign_id[\s\S]*member\.user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /grant execute on function public\.list_campaign_party_summary\(uuid\) to authenticated/i);
  assert.match(sql, /revoke all privileges on function public\.list_campaign_party_summary\(uuid\) from public, anon/i);
  assert.match(sql, /returns table \(\s*character_id uuid,\s*character_name text,\s*hp_current integer,\s*pm_current integer/i);
  assert.doesNotMatch(sql, /select\s+character\.\*/i);
  assert.match(verifier, /public\.list_campaign_party_summary\(uuid\)/);
});
