const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const sql = fs.readFileSync(path.join(
  __dirname,
  "..",
  "..",
  "supabase",
  "migrations",
  "20260820230000_harden_row_level_security.sql",
), "utf8").toLowerCase();

const protectedTables = [
  "profiles",
  "campaigns",
  "campaign_members",
  "characters",
  "rolls",
  "campaign_events",
  "campaign_presence",
  "campaign_sessions",
];

const requiredPolicies = [
  "profiles_select_own",
  "profiles_update_own",
  "campaigns_select_member",
  "campaigns_insert_owned",
  "campaign_members_select_by_campaign_role",
  "characters_select_owned",
  "characters_select_campaign_gm",
  "characters_insert_owned",
  "characters_update_owned",
  "rolls_select_by_campaign_visibility",
  "campaign_events_select_campaign_gm",
  "campaign_presence_select_campaign_gm",
  "campaign_sessions_select_campaign_gm",
];

const authorizedFunctions = [
  "join_campaign",
  "save_character_state",
  "record_roll",
  "touch_campaign_presence",
  "gm_set_character_hp",
  "gm_set_character_pm",
  "gm_add_character_condition",
  "gm_remove_character_condition",
  "gm_add_character_item",
  "gm_remove_character_item",
  "start_campaign_session",
  "end_campaign_session",
];

test("fails closed unless every public table already has RLS", () => {
  for (const table of protectedTables) {
    assert.match(sql, new RegExp(`\\('${table}'\\)`));
  }
  assert.match(sql, /classes\.relrowsecurity/);
  assert.match(sql, /raise exception 'row level security required:/);
});

test("audits every definitive policy without rewriting working policies", () => {
  for (const policy of requiredPolicies) assert.match(sql, new RegExp(`'${policy}'`));
  assert.match(sql, /from pg_catalog\.pg_policies/);
  assert.match(sql, /raise exception 'required row level policies missing:/);
  assert.doesNotMatch(sql, /create policy|drop policy/);
});

test("removes all anonymous table access and only dangerous authenticated writes", () => {
  assert.match(sql, /revoke all privileges on table[\s\S]*public\.profiles[\s\S]*public\.campaign_sessions[\s\S]*from public, anon;/);
  assert.match(sql, /revoke insert, update, delete, truncate, references, trigger[\s\S]*public\.campaign_members from authenticated;/);
  for (const table of ["rolls", "campaign_events", "campaign_presence", "campaign_sessions"]) {
    assert.match(sql, new RegExp(`revoke insert, update, delete, truncate, references, trigger[\\s\\S]*?public\\.${table} from authenticated;`));
  }
  assert.match(sql, /revoke update \([\s\S]*owner_id[\s\S]*state[\s\S]*revision[\s\S]*last_change_origin[\s\S]*public\.characters from authenticated;/);
});

test("preserves legitimate column grants instead of recreating the access matrix", () => {
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all)/);
  assert.doesNotMatch(sql, /revoke\s+select[\s\S]*authenticated/);
  assert.doesNotMatch(sql, /revoke\s+insert\s*\(state\)[\s\S]*public\.characters/);
  assert.doesNotMatch(sql, /revoke\s+update\s*\(campaign_id\)[\s\S]*public\.characters/);
  assert.doesNotMatch(sql, /revoke\s+insert\s*\(name, description\)[\s\S]*public\.campaigns/);
});

test("keeps privileged functions unavailable to anonymous callers without changing authenticated execution", () => {
  for (const operation of authorizedFunctions) {
    assert.match(sql, new RegExp(`revoke all privileges on function public\\.${operation}\\([\\s\\S]*?from public, anon;`));
  }
  assert.doesNotMatch(sql, /from public, anon, authenticated/);
  assert.doesNotMatch(sql, /grant execute|service_role|user\.role/);
});
