"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const script = (name) => read("marufia-server", "scripts", name);

const healthCommon = script("health-common.ps1");
const health = script("health-check.ps1");
const manager = script("server-manager.ps1");
const common = script("common.ps1");
const configureStartup = script("configure-startup.ps1");
const removeStartup = script("remove-startup.ps1");
const runStartup = script("run-startup.ps1");

test("health check covers every published server component", () => {
  for (const name of ["Database", "Auth", "REST API", "Realtime", "Storage", "Tunnel"]) {
    assert.match(`${healthCommon}\n${health}`, new RegExp(name.replace(" ", "\\s")));
  }
  assert.match(healthCommon, /select 1;/);
  assert.match(healthCommon, /\/auth\/v1\/health/);
  assert.match(healthCommon, /campaign_presence[\s\S]*90 seconds/);
  assert.match(healthCommon, /Get-MarufiaLatestValidBackup/);
  assert.match(health, /Marufia Server Health Check/);
});

test("health probes use the public key and never request administrative secrets", () => {
  assert.match(healthCommon, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(healthCommon, /\$headers = @\{ apikey = \$publicKey \}/);
  assert.doesNotMatch(`${healthCommon}\n${health}`, /SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|JWT_SECRET/);
  assert.match(healthCommon, /https:\/\/\$hostname\/auth\/v1\/health/);
});

test("manager exposes safe daily operations and keeps Studio local", () => {
  for (const action of ["Status", "Start", "Stop", "Restart", "Backup", "Studio", "Logs"]) {
    assert.match(manager, new RegExp(`"${action}"`));
  }
  assert.match(manager, /http:\/\/127\.0\.0\.1:\$port/);
  assert.match(manager, /Inicialização Windows/);
  assert.doesNotMatch(manager, /down\s+-v|volume\s+rm|system\s+prune/i);
});

test("operational logging redacts secrets and rotates only bounded log files", () => {
  assert.match(common, /Protect-MarufiaLogMessage/);
  assert.match(common, /bearer\\s\+/i);
  assert.match(common, /service_role/);
  assert.match(common, /re_\[A-Za-z0-9\]/);
  assert.match(common, /operations-\*\.log/);
  assert.match(common, /AddDays\(-90\)/);
  assert.match(common, /GetFullPath/);
  assert.match(common, /StartsWith\(\$logRoot/);
  assert.doesNotMatch(common, /Get-ChildItem[^\n]*-Recurse[^\n]*Remove-Item/);
});

test("Windows startup remains optional, limited, and removable", () => {
  assert.match(configureStartup, /New-ScheduledTaskTrigger -AtLogOn/);
  assert.match(configureStartup, /RunLevel Limited/);
  assert.match(configureStartup, /run-startup\.ps1/);
  assert.match(runStartup, /Docker Desktop\.exe/);
  assert.match(runStartup, /WindowStyle Hidden/);
  assert.match(runStartup, /AddMinutes\(5\)/);
  assert.match(removeStartup, /Unregister-ScheduledTask/);
  assert.doesNotMatch(removeStartup, /Remove-Item|docker|down\s+-v/i);
});

test("manager and main guide document manual operation and recovery", () => {
  const managerDoc = read("docs", "SERVER_MANAGER.md");
  const mainDoc = read("docs", "MARUFIA_SERVER.md");
  const phaseDoc = read("docs", "MARUFIA_SERVER_PHASE_12.md");
  assert.match(managerDoc, /server-manager\.ps1/);
  assert.match(managerDoc, /Inicialização com o Windows/);
  assert.match(mainDoc, /Backup e restauração/);
  assert.match(mainDoc, /Transferir para outro computador/);
  assert.match(mainDoc, /Supabase Cloud continua disponível/);
  assert.match(phaseDoc, /estado final permaneceu[\s\S]*Inicialização manual/);
});
