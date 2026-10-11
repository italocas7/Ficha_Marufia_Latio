"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const sql = fs.readFileSync(path.join(root, "supabase/migrations/20261011010000_campaign_age_mechanic.sql"), "utf8");

test("existing and new campaigns default to Auge disabled", () => {
  assert.match(sql, /add column age_mechanic_enabled boolean not null default false/i);
  assert.match(sql, /grant insert \(age_mechanic_enabled\).*to authenticated/i);
});

test("only the owner can atomically change age and skill rules", () => {
  assert.match(sql, /p_age_mechanic_enabled boolean/i);
  assert.match(sql, /age_mechanic_enabled = p_age_mechanic_enabled/i);
  assert.match(sql, /when skill_limit <> p_skill_limit or age_mechanic_enabled <> p_age_mechanic_enabled then 1/i);
  assert.match(sql, /where id = p_campaign_id and owner_id = v_user_id/i);
  assert.match(sql, /revoke all privileges on function public\.update_campaign_details\(uuid, text, text, integer, boolean\)/i);
});
