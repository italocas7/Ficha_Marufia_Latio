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
