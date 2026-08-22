const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sql = fs.readFileSync(path.join(
  __dirname,
  "../../supabase/migrations/20260820201000_fix_gm_hp_null_role.sql",
), "utf8").toLowerCase();

test("rejects a missing campaign role as well as every non-gm role", () => {
  assert.match(sql, /private\.campaign_role\(v_campaign_id\) is distinct from 'gm'/);
  assert.match(sql, /raise exception 'campaign gm required' using errcode = '42501'/);
  assert.doesNotMatch(sql, /private\.campaign_role\(v_campaign_id\) <> 'gm'/);
});

test("preserves the same hp-only revision-controlled operation", () => {
  assert.match(sql, /'\{resources,hpcurrent\}'/);
  assert.match(sql, /characters\.revision = p_expected_revision/);
  assert.doesNotMatch(sql, /pmcurrent|inventory|condition/);
});
