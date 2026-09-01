"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const compose = read("marufia-server", "cloudflare", "docker-compose.tunnel.yml");
const publicGateway = read("marufia-server", "cloudflare", "public-gateway-envoy.yaml");
const smokeGateway = read("marufia-server", "cloudflare", "smoke-gateway-envoy.yaml");
const common = read("marufia-server", "scripts", "common.ps1");
const start = read("marufia-server", "scripts", "start-tunnel.ps1");
const stop = read("marufia-server", "scripts", "stop-tunnel.ps1");
const stopServer = read("marufia-server", "scripts", "stop-server.ps1");
const testWrapper = read("marufia-server", "scripts", "test-tunnel.ps1");
const helper = read("tools", "test_marufia_tunnel.cjs");
const override = read("marufia-server", "docker-compose.marufia.yml");
const ignore = read("marufia-server", ".gitignore");

function serviceSection(name) {
  const marker = `\n  ${name}:`;
  const startIndex = `\n${compose}`.indexOf(marker);
  assert.notEqual(startIndex, -1, `Serviço ausente: ${name}`);
  const remainder = `\n${compose}`.slice(startIndex + marker.length);
  const next = remainder.search(/\n  [a-zA-Z0-9_-]+:/);
  return next === -1 ? remainder : remainder.slice(0, next);
}

test("pins cloudflared and keeps both tunnel agents without host ports", () => {
  assert.equal((compose.match(/cloudflare\/cloudflared:2026\.7\.2/g) || []).length, 2);
  assert.doesNotMatch(compose, /cloudflare\/cloudflared:latest/);
  for (const service of ["cloudflared", "cloudflared-quick"]) {
    const section = serviceSection(service);
    assert.doesNotMatch(section, /\n\s+ports:/);
    assert.match(section, /cap_drop:\s*\n\s+- ALL/);
    assert.match(section, /no-new-privileges:true/);
    assert.match(section, /read_only: true/);
    assert.match(section, /marufia-tunnel/);
  }
});

test("uses a private token file and never an environment token", () => {
  const named = serviceSection("cloudflared");
  assert.match(named, /--token-file/);
  assert.match(named, /\/run\/secrets\/cloudflare_tunnel_token/);
  assert.match(compose, /cloudflare_tunnel_token:\s*\n\s+file: \.\.\/\.\.\/cloudflare\/tunnel-token\.token/);
  assert.doesNotMatch(named, /TUNNEL_TOKEN|environment:/);
  assert.match(common, /Length -lt 80/);
  assert.match(common, /token -match "\\s"/);
});

test("publishes only Auth, REST, and Realtime through the permanent gateway", () => {
  assert.match(serviceSection("marufia-public-gateway"), /user: "101:101"/);
  for (const prefix of ["/auth/v1/", "/rest/v1/", "/realtime/v1/"]) {
    assert.match(publicGateway, new RegExp(`prefix: "${prefix.replaceAll("/", "\\/")}"`));
  }
  assert.doesNotMatch(publicGateway, /storage\/v1|studio|pg\/|meta\/|5432/);
  assert.match(publicGateway, /prefix: "\/"[\s\S]*status: 404/);
  assert.match(publicGateway, /upgrade_type: websocket/);
});

test("limits the real Internet smoke test to Auth health and Realtime", () => {
  assert.match(serviceSection("marufia-tunnel-smoke-gateway"), /user: "101:101"/);
  assert.match(smokeGateway, /path: "\/auth\/v1\/health"/);
  assert.match(smokeGateway, /name: ":method"[\s\S]*exact: "GET"/);
  assert.match(smokeGateway, /prefix: "\/realtime\/v1\/"/);
  assert.doesNotMatch(smokeGateway, /\/auth\/v1\/signup|\/rest\/v1\/|\/storage\/v1\//);
  assert.match(helper, /signup\.status, 404/);
  assert.match(helper, /rest\.status, 404/);
});

test("keeps PostgreSQL private and gives cloudflared no direct database network", () => {
  assert.match(override, /127\.0\.0\.1:\$\{POSTGRES_PORT:-5432\}:5432/);
  assert.match(override, /127\.0\.0\.1:\$\{POOLER_PROXY_PORT_TRANSACTION:-6543\}:6543/);
  assert.doesNotMatch(serviceSection("cloudflared"), /default:/);
  assert.match(testWrapper, /Assert-MarufiaDatabaseIsPrivate/);
  assert.match(testWrapper, /HostIp -notin @\("127\.0\.0\.1", "::1"\)/);
});

test("refuses unsafe named publication and cleans up only exact tunnel containers", () => {
  assert.match(start, /CLOUDFLARE_TUNNEL_HOSTNAME/);
  assert.match(start, /SUPABASE_PUBLIC_URL/);
  assert.match(start, /MARUFIA_PUBLIC_URL/);
  assert.match(common, /trycloudflare\.com/);
  assert.match(common, /ValidateSet\("marufia-cloudflared", "marufia-cloudflared-quick", "marufia-public-gateway", "marufia-tunnel-smoke-gateway"\)/);
  assert.match(stopServer, /Remove-MarufiaTunnelContainers/);
  assert.match(ignore, /cloudflare\/\*\.token/);
  assert.doesNotMatch(`${common}\n${stop}\n${testWrapper}`, /down\s+--volumes|down\s+-v|docker\s+system\s+prune/i);
});

test("validates HTTPS and WebSocket cleanup without logging credentials", () => {
  assert.match(helper, /url\.protocol, "https:"/);
  assert.match(helper, /status === "SUBSCRIBED"/);
  assert.match(helper, /removeAllChannels/);
  assert.match(helper, /realtime\.disconnect\(\)/);
  assert.doesNotMatch(`${helper}\n${testWrapper}`, /SERVICE_ROLE_KEY|JWT_SECRET|console\.log\([^\n]*(?:publicKey|apikey)/i);
});
