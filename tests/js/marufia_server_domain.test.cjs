"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const common = read("marufia-server", "scripts", "common.ps1");
const configure = read("marufia-server", "scripts", "configure-public-domain.ps1");
const smtp = read("marufia-server", "scripts", "set-smtp.ps1");
const selectBackend = read("marufia-server", "scripts", "select-client-backend.ps1");
const restore = read("marufia-server", "scripts", "restore-local-domain.ps1");
const render = read("marufia-server", "scripts", "render-public-gateway.ps1");
const startTunnel = read("marufia-server", "scripts", "start-tunnel.ps1");
const setup = read("marufia-server", "scripts", "setup-environment.ps1");
const gateway = read("marufia-server", "cloudflare", "public-gateway-envoy.yaml");
const compose = read("marufia-server", "cloudflare", "docker-compose.tunnel.yml");
const ignore = read("marufia-server", ".gitignore");

test("accepts only a stable user-controlled HTTPS hostname", () => {
  assert.match(common, /ConvertTo-MarufiaPublicHostname/);
  assert.match(common, /trycloudflare\.com/);
  assert.match(common, /localhost\|example\|invalid\|test/);
  assert.match(configure, /ConvertTo-MarufiaPublicHostname/);
  assert.match(configure, /SUPABASE_PUBLIC_URL = \$publicUrl/);
  assert.match(configure, /API_EXTERNAL_URL = "\$publicUrl\/auth\/v1"/);
  assert.match(configure, /AUTH_REDIRECT_URL = \$authRedirectUrl/);
  assert.match(configure, /SITE_URL = \$authRedirectUrl/);
  assert.match(configure, /AUTH_MAILER_EXTERNAL_HOSTS = \$publicHostname/);
  assert.match(configure, /ENABLE_EMAIL_AUTOCONFIRM = "false"/);
  assert.match(setup, /O preparo inicial aceita somente loopback/);
});

test("requires real SMTP before changing public URLs and hides its password", () => {
  assert.ok(configure.indexOf("Assert-MarufiaSmtpSafety") < configure.indexOf("Set-MarufiaEnvironmentValues"));
  assert.match(smtp, /Read-Host -AsSecureString/);
  assert.match(smtp, /ZeroFreeBSTR/);
  assert.match(smtp, /SMTP_PASS = \$password/);
  assert.doesNotMatch(smtp, /Write-(?:Host|Output|MarufiaMessage)[^\n]*(?:password|SMTP_PASS)/i);
  assert.doesNotMatch(`${smtp}\n${configure}`, /SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
});

test("rolls the private environment back if runtime application fails", () => {
  assert.match(configure, /ReadAllBytes\(\$script:MarufiaEnvPath\)/);
  assert.match(configure, /Restore-MarufiaEnvironmentFile/);
  assert.match(configure, /A configuração anterior foi restaurada automaticamente/);
  assert.match(configure, /Remove-MarufiaTunnelContainers/);
  assert.doesNotMatch(configure, /down\s+-v|down\s+--volumes|system\s+prune/i);
});

test("renders an exact CORS allowlist and removes the upstream wildcard", () => {
  assert.equal((gateway.match(/__MARUFIA_CORS_ORIGIN_MATCHERS__/g) || []).length, 1);
  assert.match(gateway, /envoy\.filters\.http\.cors/);
  assert.match(gateway, /allow_origin_string_match/);
  assert.match(gateway, /response_headers_to_remove:[\s\S]*access-control-allow-origin/);
  assert.doesNotMatch(gateway, /allow_origin_string_match:[\s\S]{0,120}(?:exact|regex):\s*["']?\*/);
  assert.match(render, /ConvertTo-Json -Compress/);
  assert.match(compose, /public-gateway-envoy\.generated\.yaml/);
  assert.match(ignore, /cloudflare\/\*\.generated\.yaml/);
  assert.match(startTunnel, /render-public-gateway\.ps1/);
});

test("allows only the public site, exact configured origins, and Tauri Windows", () => {
  assert.match(common, /http:\/\/tauri\.localhost/);
  assert.match(common, /A lista CORS aceita no máximo 12 origens exatas/);
  assert.match(common, /Origem CORS externa deve usar HTTPS/);
  assert.match(common, /AUTH_MAX_REQUEST_DURATION deve ficar entre 10s e 60s/);
  assert.match(common, /AUTH_MAILER_EXTERNAL_HOSTS deve conter o hostname público exato do Auth/);
  assert.match(configure, /MARUFIA_CORS_ALLOWED_ORIGINS/);
  assert.match(gateway, /X-Forwarded-Proto, value: https/);
  assert.match(gateway, /path: "\/auth-confirmed"/);
  assert.match(gateway, /Conta confirmada/);
  assert.match(gateway, /history\.replaceState/);
  assert.match(gateway, /cache-control, value: "no-store"/);
  assert.match(gateway, /referrer-policy, value: "no-referrer"/);
  assert.match(gateway, /x-content-type-options, value: "nosniff"/);
  assert.doesNotMatch(gateway, /allow_headers:\s*"\*"|allow_methods:\s*"[^\n]*TRACE/);
});

test("switches the generated client without weakening the tracked Cloud fallback", () => {
  assert.match(selectBackend, /MARUFIA_BACKEND_MODE=selfhosted/);
  assert.match(selectBackend, /SUPABASE_PUBLISHABLE_KEY=\$publishableKey/);
  assert.match(selectBackend, /MARUFIA_AUTH_REDIRECT_URL=\$authRedirectUrl/);
  assert.match(selectBackend, /\.env\.local pertence ao usuário e não será sobrescrito/);
  assert.match(selectBackend, /Cliente configurado para o Supabase Cloud pelo perfil versionado de fallback/);
  assert.doesNotMatch(selectBackend, /SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|JWT_SECRET/);
  assert.match(restore, /select-client-backend\.ps1"\) -Mode Cloud/);
});

test("keeps local rollback data-preserving and restores loopback Auth", () => {
  assert.match(restore, /http:\/\/127\.0\.0\.1:\$port/);
  assert.match(restore, /ENABLE_EMAIL_AUTOCONFIRM = "true"/);
  assert.match(restore, /dados foram preservados/);
  assert.doesNotMatch(restore, /down\s+-v|down\s+--volumes|Remove-Item[^\n]*(?:backups|storage|data)/i);
});
