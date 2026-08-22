const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const migrationPath = path.join(
  __dirname,
  "..",
  "..",
  "supabase",
  "migrations",
  "20260820030000_create_marufia_online_foundation.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");

const tables = [
  "profiles",
  "campaigns",
  "campaign_members",
  "characters",
  "rolls",
  "campaign_events",
];

test("creates only the six Phase 6 foundation tables", () => {
  const createdTables = [...sql.matchAll(/create table public\.([a-z_]+)\s*\(/g)].map((match) => match[1]);
  assert.deepEqual(createdTables, tables);
});

test("uses UUID identities and the required foreign keys", () => {
  assert.match(sql, /profiles \([\s\S]*?id uuid primary key references auth\.users \(id\)/);
  for (const table of ["campaigns", "characters", "rolls", "campaign_events"]) {
    assert.match(sql, new RegExp(`${table} \\([\\s\\S]*?id uuid primary key default gen_random_uuid\\(\\)`));
  }
  assert.match(sql, /campaign_members \([\s\S]*?primary key \(campaign_id, user_id\)/);
  assert.match(sql, /campaign_id uuid[^,]*references public\.campaigns \(id\)/);
  assert.match(sql, /owner_id uuid not null references auth\.users \(id\)/);
});

test("preserves the complete versioned character state as JSONB", () => {
  assert.match(sql, /state jsonb not null/);
  assert.match(sql, /schema_version smallint not null/);
  assert.match(sql, /state @> jsonb_build_object\('schemaVersion', schema_version\)/);
  assert.match(sql, /campaign_id uuid references public\.campaigns \(id\) on delete set null/);
});

test("adds timestamps, integrity constraints, and query indexes", () => {
  assert.match(sql, /create or replace function public\.set_updated_at\(\)/);
  assert.equal((sql.match(/execute function public\.set_updated_at\(\)/g) || []).length, 3);
  assert.match(sql, /role in \('gm', 'player', 'assistant_gm', 'spectator'\)/);
  assert.match(sql, /visibility in \('public', 'gm', 'secret'\)/);
  assert.ok((sql.match(/create index /g) || []).length >= 10);
});

test("locks every public table behind RLS without premature grants", () => {
  for (const table of tables) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security;`));
  }
  assert.match(sql, /revoke all privileges on table[\s\S]*from anon, authenticated;/);
  assert.doesNotMatch(sql, /grant\s+(select|insert|update|delete|all)[\s\S]*\s+to\s+(anon|authenticated|public)/i);
  assert.doesNotMatch(sql, /service_role/i);
});
