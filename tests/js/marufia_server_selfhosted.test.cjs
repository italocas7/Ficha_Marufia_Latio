"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const server = path.join(root, "marufia-server");

function read(relative) {
  return fs.readFileSync(path.join(server, relative), "utf8");
}

test("pins the complete official Supabase v0.8.0 service set", () => {
  const compose = read("supabase/docker/docker-compose.yml");
  const images = [...compose.matchAll(/^\s*image:\s*(\S+)\s*$/gm)].map((match) => match[1]);

  assert.deepEqual(images, [
    "supabase/studio:2026.08.03-sha-022b374",
    "envoyproxy/envoy:v1.39.0",
    "supabase/gotrue:v2.189.0",
    "postgrest/postgrest:v14.12",
    "supabase/realtime:v2.102.3",
    "supabase/storage-api:v1.60.4",
    "darthsim/imgproxy:v3.30.1",
    "supabase/postgres-meta:v0.96.6",
    "supabase/edge-runtime:v1.74.0",
    "supabase/postgres:17.6.1.136",
    "supabase/supavisor:2.9.5",
  ]);
  assert.equal(images.some((image) => /:latest$/i.test(image)), false);

  const upstream = read("supabase/UPSTREAM.md");
  assert.match(upstream, /self-hosted\/v0\.8\.0/);
  assert.match(upstream, /241bb11c0627f2981746d37033f57dbfa81d29b0/);
});

test("matches every vendored runtime file against its recorded SHA-256", () => {
  const manifest = read("supabase/SHA256SUMS").trim().split(/\r?\n/);
  assert.equal(manifest.length, 22);

  for (const line of manifest) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    assert.ok(match, `linha inválida no manifesto: ${line}`);
    const file = path.join(server, "supabase", ...match[2].split("/"));
    assert.equal(fs.existsSync(file), true, `${match[2]} está ausente`);
    const actual = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    assert.equal(actual, match[1], `${match[2]} divergiu da release oficial`);
  }
});

test("binds gateway and database access to loopback only", () => {
  const override = read("docker-compose.marufia.yml");
  assert.match(override, /api-gw:[\s\S]*?ports:\s*!override[\s\S]*?127\.0\.0\.1:\$\{API_GW_HTTP_PORT:-8000\}:8000\/tcp/);
  assert.match(override, /supavisor:[\s\S]*?ports:\s*!override[\s\S]*?127\.0\.0\.1:\$\{POSTGRES_PORT:-5432\}:5432\/tcp/);
  assert.match(override, /127\.0\.0\.1:\$\{POOLER_PROXY_PORT_TRANSACTION:-6543\}:6543\/tcp/);
  assert.doesNotMatch(override, /^\s+-\s+"?0\.0\.0\.0:/m);
  assert.doesNotMatch(override, /^\s+-\s+"?\$\{(?:POSTGRES_PORT|API_GW_HTTP_PORT)/m);
});

test("enables current JWT verification while leaving unused Functions off", () => {
  const override = read("docker-compose.marufia.yml");
  for (const key of ["GOTRUE_JWT_KEYS", "API_JWT_JWKS", "JWT_JWKS", "SUPABASE_JWKS"]) {
    assert.match(override, new RegExp(`${key}:`));
  }
  assert.match(override, /functions:[\s\S]*?profiles:[\s\S]*?- edge-functions/);
});

test("contains no official demo credentials in the public environment template", () => {
  const environment = read(".env.example");
  const generated = [
    "POSTGRES_PASSWORD",
    "JWT_SECRET",
    "ANON_KEY",
    "SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
    "DASHBOARD_PASSWORD",
    "SECRET_KEY_BASE",
    "REALTIME_DB_ENC_KEY",
    "VAULT_ENC_KEY",
  ];
  for (const key of generated) {
    assert.match(environment, new RegExp(`^${key}=__GENERATE_ON_SETUP__$`, "m"));
  }
  assert.doesNotMatch(environment, /your-super-secret|this_password_is_insecure|secret1234|eyJhbGciOiJIUzI1NiI/);
  assert.match(environment, /^ENABLE_ANONYMOUS_USERS=false$/m);
  assert.match(environment, /^ENABLE_PHONE_SIGNUP=false$/m);
  assert.match(environment, /^FUNCTIONS_VERIFY_JWT=true$/m);
});

test("operational scripts fail safely and never remove persistent volumes", () => {
  const common = read("scripts/common.ps1");
  const setup = read("scripts/setup-environment.ps1");
  const start = read("scripts/start-server.ps1");
  const stop = read("scripts/stop-server.ps1");
  const restart = read("scripts/restart-server.ps1");

  assert.match(common, /MinimumComposeVersion = \[version\]"2\.24\.4"/);
  assert.match(common, /Docker Desktop não foi encontrado/);
  assert.match(setup, /^#Requires -Version 7\.4/m);
  assert.match(setup, /já existe[\s\S]*não foi sobrescrito/);
  assert.match(start, /"up", "--detach", "--wait"/);
  assert.match(restart, /"--force-recreate"/);
  assert.match(stop, /ComposeArguments @\("down"\)/);
  assert.doesNotMatch(`${start}\n${stop}\n${restart}`, /\bdown\s+(?:--volumes|-v)\b/);
  assert.doesNotMatch(`${common}\n${setup}`, /Write-Host[^\n]*(?:JWT_SECRET|SERVICE_ROLE_KEY|POSTGRES_PASSWORD)/);
});
