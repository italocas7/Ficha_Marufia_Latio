"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const read = (...parts) => fs.readFileSync(path.join(root, ...parts), "utf8");
const scripts = (...parts) => read("marufia-server", "scripts", ...parts);

const backup = scripts("backup.ps1");
const common = scripts("backup-common.ps1");
const restore = scripts("restore.ps1");
const scheduled = scripts("run-scheduled-backup.ps1");
const configure = scripts("configure-backup-schedule.ps1");
const remove = scripts("remove-backup-schedule.ps1");

test("creates a complete versioned backup set without hardcoded credentials", () => {
  for (const relative of [
    "marufia-server/scripts/backup-common.ps1",
    "marufia-server/scripts/backup.ps1",
    "marufia-server/scripts/restore.ps1",
    "marufia-server/scripts/test-backup-restore.ps1",
    "docs/SERVER_BACKUP_AND_RESTORE.md",
  ]) assert.equal(fs.existsSync(path.join(root, relative)), true, `${relative} está ausente`);
  assert.match(common, /MarufiaBackupFormatVersion = 2/);
  assert.match(backup, /pg_dump --format=custom --compress=gzip:9/);
  assert.match(backup, /--username=supabase_admin/);
  assert.doesNotMatch(`${backup}\n${common}\n${restore}`, /POSTGRES_PASSWORD\s*=|SERVICE_ROLE_KEY\s*=|JWT_SECRET\s*=/);
});

test("does not declare success before dump, archive, copy, checksum, and key verification", () => {
  const success = backup.indexOf("Backup criado, copiado e verificado");
  for (const marker of [
    "O pg_dump falhou",
    "Test-MarufiaArchiveInContainer",
    "dockerCommand cp",
    "Write-MarufiaChecksumManifest",
    "FixedTimeEquals",
    "Assert-MarufiaBackupSet",
  ]) assert.ok(backup.indexOf(marker) >= 0 && backup.indexOf(marker) < success, `${marker} deve ocorrer antes do sucesso`);
  assert.match(common, /AES-256-GCM/);
  assert.match(common, /PBKDF2-SHA256/);
  assert.match(common, /600000/);
});

test("keeps daily and weekly restore points and refuses unsafe deletion", () => {
  assert.match(common, /Select-MarufiaRetentionPoints/);
  assert.match(common, /ISOWeek/);
  assert.match(common, /A retenção se recusou a remover o último backup válido/);
  assert.match(common, /Uma remoção fora da pasta privada de backups foi recusada/);
  assert.match(common, /Backup incompleto ou inválido preservado para revisão manual/);
  assert.match(backup, /Purpose -eq "PreRestore"/);
  assert.doesNotMatch(`${backup}\n${common}`, /Remove-Item[^\n]*(?:\.env|storage|volumes\\db\\data)/i);
});

test("restores into an isolated database by default and validates Marufia security", () => {
  assert.match(restore, /\[string\]\$Mode = "Test"/);
  assert.match(common, /marufia_restore_test_/);
  assert.match(common, /--single-transaction --username=supabase_admin/);
  assert.match(common, /missingTables/);
  assert.match(common, /rlsDisabled/);
  assert.match(common, /realtimeTableCount/);
  assert.match(common, /requiredRpcs/);
  assert.match(restore, /Remove-MarufiaRestoreTestDatabase/);
});

test("protects production restore with test, confirmation, pre-backup, and rollback", () => {
  assert.match(restore, /RESTAURAR-MARUFIA/);
  assert.ok(restore.indexOf("Invoke-MarufiaTestRestore") < restore.indexOf("Reset-MarufiaProductionDatabase"));
  assert.match(restore, /Purpose PreRestore/);
  assert.match(restore, /A restauração não passou nos checks e foi revertida automaticamente/);
  assert.match(restore, /Os serviços permaneceram parados/);
  assert.match(restore, /postgresImage -ne \$currentImage/);
  assert.match(restore, /Assert-MarufiaBackupEncryptionKeyMatchesServer/);
  assert.doesNotMatch(restore, /down\s+-v|volume\s+rm|system\s+prune/i);
});

test("schedules a noninteractive daily backup and can remove only the task", () => {
  assert.match(configure, /New-ScheduledTaskTrigger -Daily/);
  assert.match(configure, /StartWhenAvailable/);
  assert.match(configure, /RunLevel Limited/);
  assert.match(configure, /run-scheduled-backup\.ps1/);
  assert.match(scheduled, /backup\.ps1"\) -ThrowOnError/);
  assert.match(scheduled, /backup-\$\(\(Get-Date\)\.ToString\('yyyy-MM'\)\)\.log/);
  assert.match(remove, /Unregister-ScheduledTask/);
  assert.doesNotMatch(remove, /Remove-Item/);
});

test("documents database scope and excludes Storage objects from false promises", () => {
  const documentation = read("docs", "SERVER_BACKUP_AND_RESTORE.md");
  assert.match(documentation, /arquivos físicos enviados ao Storage/);
  assert.match(documentation, /mesma versão fixada/);
  assert.match(documentation, /RESTAURAR-MARUFIA/);
  assert.match(documentation, /banco em uso não é substituído/);
  assert.match(documentation, /outro disco/);
});
