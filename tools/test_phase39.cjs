"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const JS_TESTS = path.join(ROOT, "tests", "js");

function relative(...parts) {
  return path.join(...parts);
}

function migrationTests() {
  return fs.readdirSync(JS_TESTS)
    .filter((name) => name.endsWith("_migration.test.cjs"))
    .sort()
    .map((name) => relative("tests", "js", name));
}

const GROUPS = Object.freeze([
  Object.freeze({
    name: "Estado",
    files: Object.freeze(["tests/js/state.test.cjs", "tests/js/rules.test.cjs"]),
  }),
  Object.freeze({
    name: "Salvamento",
    files: Object.freeze(["tests/js/storage.test.cjs", "tests/js/app_startup.test.cjs"]),
  }),
  Object.freeze({
    name: "Migrações",
    files: Object.freeze(migrationTests()),
  }),
  Object.freeze({
    name: "Autenticação",
    files: Object.freeze(["tests/js/auth.test.cjs", "tests/js/supabase.test.cjs"]),
  }),
  Object.freeze({
    name: "Campanhas e entrada por código",
    files: Object.freeze(["tests/js/campaigns.test.cjs", "tests/js/home.test.cjs"]),
  }),
  Object.freeze({
    name: "Personagens",
    files: Object.freeze(["tests/js/characters.test.cjs", "tests/js/character_import.test.cjs", "tests/js/character_summary.test.cjs"]),
  }),
  Object.freeze({
    name: "Sincronização",
    files: Object.freeze(["tests/js/character_realtime.test.cjs", "tests/js/character_sync.test.cjs"]),
  }),
  Object.freeze({
    name: "Rolagens",
    files: Object.freeze(["tests/js/rolls.test.cjs", "tests/js/online_rolls.test.cjs", "tests/js/live_rolls.test.cjs"]),
  }),
  Object.freeze({
    name: "Permissões",
    files: Object.freeze(["tests/js/row_level_security_migration.test.cjs", "tests/js/gm_character_write_authorization_migration.test.cjs", "tests/js/security_audit.test.cjs"]),
  }),
  Object.freeze({
    name: "Offline",
    files: Object.freeze(["tests/js/character_sync.test.cjs", "tests/js/online_rolls.test.cjs"]),
  }),
  Object.freeze({
    name: "Conflitos",
    files: Object.freeze(["tests/js/character_conflicts.test.cjs", "tests/js/character_sync.test.cjs"]),
  }),
  Object.freeze({
    name: "Interface e responsividade",
    files: Object.freeze(["tests/js/visual_identity.test.cjs", "tests/e2e/smoke.cjs"]),
  }),
]);

function uniqueUnitTests() {
  return fs.readdirSync(JS_TESTS)
    .filter((name) => name.endsWith(".test.cjs"))
    .sort()
    .map((name) => relative("tests", "js", name));
}

function run(command, args, label) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(command, args, { cwd: ROOT, env: process.env, stdio: "inherit", shell: false });
  if (result.error) {
    const message = result.error.code === "ENOENT"
      ? `Comando não encontrado: ${command}`
      : result.error.message;
    throw new Error(`${label}: ${message}`);
  }
  if (result.status !== 0) throw new Error(`${label} falhou com código ${result.status}.`);
}

function pythonExecutable() {
  if (process.env.LATIO_PYTHON) return process.env.LATIO_PYTHON;
  const bundled = process.platform === "win32"
    ? path.resolve(path.dirname(process.execPath), "..", "..", "python", "python.exe")
    : path.resolve(path.dirname(process.execPath), "..", "..", "python", "bin", "python3");
  if (fs.existsSync(bundled)) return bundled;
  return process.platform === "win32" ? "python" : "python3";
}

function printMatrix() {
  process.stdout.write("Matriz automatizada da Fase 39:\n");
  for (const group of GROUPS) process.stdout.write(`- ${group.name}: ${group.files.length} arquivo(s)\n`);
}

function main() {
  printMatrix();
  run(pythonExecutable(), ["-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py"], "Dados e regras Python");
  run(process.execPath, ["--test", ...uniqueUnitTests()], "Contratos JavaScript da Fase 39");
  run(process.execPath, ["tests/e2e/smoke.cjs"], "Fluxo real em desktop e celular");
  if (process.env.MARUFIA_PHASE39_REMOTE === "1") {
    run(process.execPath, ["tools/test_supabase_database.cjs"], "Banco remoto vinculado");
    run(process.execPath, ["tools/test_supabase_security.cjs"], "Segurança remota vinculada");
  }
  process.stdout.write("\nFase 39 aprovada em todas as categorias locais.\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  }
}

module.exports = Object.freeze({ GROUPS, uniqueUnitTests, pythonExecutable, main });
