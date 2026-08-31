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

test("validates local Auth without exposing credentials or retaining test accounts", () => {
  const authTest = read("scripts/test-auth.ps1");
  assert.match(authTest, /\/auth\/v1\/signup/);
  assert.match(authTest, /grant_type=refresh_token/);
  assert.match(authTest, /grant_type=password/);
  assert.match(authTest, /\/auth\/v1\/logout/);
  assert.match(authTest, /header\.alg -ne "ES256"/);
  assert.match(authTest, /rest\/v1\/rpc\/join_campaign/);
  assert.match(authTest, /delete from auth\.users where email in/);
  assert.match(authTest, /só pode ser executado no servidor local/);
  assert.doesNotMatch(authTest, /SERVICE_ROLE_KEY/);
  assert.doesNotMatch(authTest, /Write-(Host|Output).*access_token/i);
});

test("rejects unsafe internet-facing Auth configuration", () => {
  const common = read("scripts/common.ps1");
  const environment = read(".env.example");
  assert.match(common, /Assert-MarufiaAuthSafety/);
  assert.match(common, /Confirmação automática de email é permitida somente no servidor experimental local/);
  assert.match(common, /O servidor externo exige configuração SMTP completa/);
  assert.match(common, /O servidor externo exige um SMTP real e um remetente válido/);
  assert.match(common, /SMTP_ADMIN_EMAIL deve conter um remetente válido/);
  assert.match(common, /\.invalid", "\.test", "\.example", "\.localhost/);
  assert.match(common, /API_EXTERNAL_URL deve corresponder a SUPABASE_PUBLIC_URL seguida de \/auth\/v1/);
  assert.match(common, /SMTP_PORT deve ser uma porta válida entre 1 e 65535/);
  assert.match(common, /externo deve usar HTTPS/);
  assert.match(environment, /ENABLE_EMAIL_AUTOCONFIRM=true nunca pode ser usado/);
  assert.match(environment, /Para acesso pela internet, use false e configure um SMTP real/);
});
