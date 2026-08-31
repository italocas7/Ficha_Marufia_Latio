"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const workspace = path.join(root, "marufia-server");

function read(relative) {
  return fs.readFileSync(path.join(workspace, relative), "utf8");
}

test("creates the isolated Marufia Server workspace", () => {
  for (const relative of [
    "README.md",
    ".env.example",
    ".gitignore",
    "supabase/README.md",
    "cloudflare/README.md",
    "scripts/README.md",
    "backups/.gitkeep",
    "logs/.gitkeep",
    "storage/.gitkeep",
  ]) {
    assert.equal(fs.existsSync(path.join(workspace, relative)), true, `${relative} está ausente`);
  }
});

test("keeps the published site Worker separate from the future local server", () => {
  const worker = fs.readFileSync(path.join(root, "server", "index.js"), "utf8");
  const build = fs.readFileSync(path.join(root, "tools", "build_site.py"), "utf8");
  assert.match(worker, /env\.ASSETS\.fetch/);
  assert.match(build, /SERVER_ENTRY = "server\/index\.js"/);
  assert.match(read("README.md"), /independente de `server\/`/);
  assert.doesNotMatch(build, /marufia-server/);
});

test("tracks public defaults and safe secret placeholders", () => {
  const environment = read(".env.example");
  assert.match(environment, /^MARUFIA_SERVER_ENV=development$/m);
  assert.match(environment, /^MARUFIA_PUBLIC_URL=http:\/\/127\.0\.0\.1:8000$/m);
  assert.match(environment, /^MARUFIA_STUDIO_URL=http:\/\/127\.0\.0\.1:8000$/m);
  assert.match(environment, /^MARUFIA_BACKUP_RETENTION_DAYS=7$/m);
  assert.match(environment, /^MARUFIA_BACKUP_RETENTION_WEEKS=4$/m);
  for (const secret of ["POSTGRES_PASSWORD", "JWT_SECRET", "SERVICE_ROLE_KEY"]) {
    assert.match(environment, new RegExp(`^${secret}=__GENERATE_ON_SETUP__$`, "m"));
  }
  assert.doesNotMatch(environment, /^TUNNEL_TOKEN\s*=\s*\S+/mi);
});

test("ignores secrets, credentials, backups, logs, storage, and volumes", () => {
  const ignore = read(".gitignore");
  for (const pattern of [
    ".env",
    "backups/**",
    "logs/**",
    "storage/**",
    "data/**",
    "supabase/docker/volumes/db/data/**",
    "supabase/docker/volumes/storage/**",
    "cloudflare/*-credentials.json",
    "cloudflare/*.key",
    "cloudflare/*.token",
  ]) {
    assert.ok(ignore.includes(pattern), `${pattern} não está protegido`);
  }
});

test("contains the Phase 3 runtime without changing the existing site Worker", () => {
  for (const relative of [
    "docker-compose.marufia.yml",
    "supabase/docker/docker-compose.yml",
    "scripts/start-server.ps1",
    "scripts/stop-server.ps1",
    "scripts/restart-server.ps1",
    "scripts/status-server.ps1",
    "scripts/setup-environment.ps1",
  ]) {
    assert.equal(fs.existsSync(path.join(workspace, relative)), true, `${relative} está ausente na Fase 3`);
  }
  assert.match(read("supabase/README.md"), /self-hosted\/v0\.8\.0/);
});

test("finds Docker Desktop both on PATH and in standard Windows installations", () => {
  const common = read("scripts/common.ps1");
  assert.match(common, /Get-Command docker\.exe -CommandType Application/);
  assert.match(common, /\$env:LOCALAPPDATA/);
  assert.match(common, /Programs\\DockerDesktop\\resources\\bin\\docker\.exe/);
  assert.match(common, /\$env:ProgramFiles/);
  assert.match(common, /Docker\\Docker\\resources\\bin\\docker\.exe/);
  assert.doesNotMatch(common, /C:\\Users\\italo/i);
});

test("keeps schema migration separate, checksummed, backed up, and transactional", () => {
  for (const relative of [
    "schema/MIGRATIONS.sha256",
    "schema/README.md",
    "scripts/migrate-schema.ps1",
    "scripts/verify-schema.ps1",
    "scripts/test-schema-security.ps1",
  ]) {
    assert.equal(fs.existsSync(path.join(workspace, relative)), true, `${relative} está ausente na Fase 4`);
  }

  const manifest = read("schema/MIGRATIONS.sha256").trim().split(/\r?\n/);
  const migrations = fs.readdirSync(path.join(root, "supabase", "migrations"))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  assert.equal(manifest.length, 26);
  assert.deepEqual(manifest.map((line) => line.split(/ {2}/)[1]), migrations);
  for (const line of manifest) assert.match(line, /^[0-9a-f]{64}  [0-9]{14}_[A-Za-z0-9_]+\.sql$/);

  const migrate = read("scripts/migrate-schema.ps1");
  assert.match(migrate, /Get-FileHash[\s\S]+SHA256/);
  assert.match(migrate, /pg_dump --format=custom/);
  assert.match(migrate, /pg_restore --list/);
  assert.match(migrate, /supabase_migrations\.schema_migrations/);
  assert.doesNotMatch(migrate, /seed\.sql/);
  assert.doesNotMatch(migrate, /down\s+-v|volume\s+rm/i);

  const security = read("scripts/test-schema-security.ps1");
  assert.match(security, /rls_security\.test\.sql/);
  assert.match(security, /1\\\.\\\.35/);
  assert.match(security, /RequireEmptyData/);
});
