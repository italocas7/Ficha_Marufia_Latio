const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..", "..");
const foundation = fs.readFileSync(path.join(
  root,
  "supabase",
  "migrations",
  "20260820030000_create_marufia_online_foundation.sql",
), "utf8");
const migration = fs.readFileSync(path.join(
  root,
  "supabase",
  "migrations",
  "20260820090000_align_character_state_contract.sql",
), "utf8");
const characterDefinition = foundation.match(/create table public\.characters \(([\s\S]*?)\n\);/i)?.[1] ?? "";

test("keeps one JSONB document instead of flattening the character sheet", () => {
  assert.match(foundation, /create table public\.characters \([\s\S]*state jsonb not null[\s\S]*schema_version smallint not null/i);
  assert.match(foundation, /id uuid primary key default gen_random_uuid\(\)/i);
  assert.match(foundation, /owner_id uuid not null references auth\.users \(id\) on delete cascade/i);
  assert.match(foundation, /name text not null/i);
  assert.doesNotMatch(migration, /add column/i);
});

test("preserves the optional campaign relationship for the next phase", () => {
  assert.match(characterDefinition, /campaign_id uuid references public\.campaigns \(id\) on delete set null/i);
  assert.doesNotMatch(characterDefinition, /campaign_id uuid not null/i);
});

test("aligns database validation with meta.appId and meta.schemaVersion", () => {
  assert.match(migration, /drop constraint characters_state_version_matches/i);
  assert.match(migration, /add constraint characters_state_version_matches check/i);
  assert.match(migration, /'meta'[\s\S]*'appId', 'marufia-latio'[\s\S]*'schemaVersion', schema_version/i);
  assert.doesNotMatch(migration, /jsonb_build_object\('schemaVersion', schema_version\)/i);
});

test("does not enable character access before its lifecycle phases", () => {
  assert.doesNotMatch(migration, /create policy/i);
  assert.doesNotMatch(migration, /grant\s+(select|insert|update|delete|all)/i);
});
