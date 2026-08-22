"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");

const ALPHA_CAPABILITIES = Object.freeze([
  Object.freeze({ name: "Conta", files: Object.freeze(["tests/js/profile_migration.test.cjs", "tests/js/auth.test.cjs"]) }),
  Object.freeze({ name: "Login", files: Object.freeze(["tests/js/auth.test.cjs"]) }),
  Object.freeze({ name: "Campanhas", files: Object.freeze(["tests/js/campaigns.test.cjs", "tests/js/campaign_migration.test.cjs"]) }),
  Object.freeze({ name: "Código de entrada", files: Object.freeze(["tests/js/campaign_join_migration.test.cjs", "tests/js/campaigns.test.cjs"]) }),
  Object.freeze({ name: "Personagens", files: Object.freeze(["tests/js/characters.test.cjs", "tests/js/character_import.test.cjs"]) }),
  Object.freeze({ name: "Ficha", files: Object.freeze(["tests/js/state.test.cjs", "tests/js/app_startup.test.cjs"]) }),
  Object.freeze({ name: "Salvamento remoto", files: Object.freeze(["tests/js/character_remote_save_migration.test.cjs", "tests/js/characters.test.cjs"]) }),
  Object.freeze({ name: "Sincronização", files: Object.freeze(["tests/js/character_sync.test.cjs", "tests/js/character_realtime.test.cjs", "tests/js/online_errors.test.cjs"]) }),
  Object.freeze({ name: "Rolagens online", files: Object.freeze(["tests/js/online_rolls.test.cjs", "tests/js/live_rolls.test.cjs", "tests/js/roll_visibility_migration.test.cjs"]) }),
  Object.freeze({ name: "Painel do Mæstre", files: Object.freeze(["tests/js/gm_panel.test.cjs", "tests/js/multiuser_simulation.test.cjs"]) }),
  Object.freeze({ name: "Permissões", files: Object.freeze(["tests/js/row_level_security_migration.test.cjs", "tests/js/gm_character_write_authorization_migration.test.cjs", "tests/js/security_audit.test.cjs"]) }),
  Object.freeze({ name: "Executável Windows", files: Object.freeze(["tests/js/tauri_config.test.cjs", "tests/js/windows_build.test.cjs", "tests/js/windows_security.test.cjs"]) }),
]);

function uniqueAlphaTests() {
  return [...new Set(ALPHA_CAPABILITIES.flatMap((capability) => capability.files))].sort();
}

function assertAlphaMatrix() {
  for (const capability of ALPHA_CAPABILITIES) {
    if (!capability.files.length) throw new Error(`${capability.name}: nenhum teste associado.`);
    for (const file of capability.files) {
      if (!fs.statSync(path.join(root, file), { throwIfNoEntry: false })?.isFile()) {
        throw new Error(`${capability.name}: teste ausente ${file}.`);
      }
    }
  }
  return true;
}

function run(args, label) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(process.execPath, args, { cwd: root, env: process.env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} reprovado com código ${result.status}.`);
}

function main() {
  assertAlphaMatrix();
  process.stdout.write("Matriz do Marufia Online Alpha:\n");
  for (const capability of ALPHA_CAPABILITIES) {
    process.stdout.write(`- ${capability.name}: ${capability.files.length} contrato(s)\n`);
  }
  run(["tools/check_version.cjs"], "Versão Alpha");
  run(["--test", ...uniqueAlphaTests()], "Recursos obrigatórios");
  run(["tools/check_windows_security.cjs"], "Executável e instalador Windows");
  if (process.env.MARUFIA_ALPHA_REMOTE === "1") {
    run(["tools/test_supabase_database.cjs"], "Banco remoto");
    run(["tools/test_supabase_security.cjs"], "Permissões remotas");
    run(["tools/test_realtime_connection.cjs"], "Realtime remoto");
  }
  process.stdout.write("\nMarufia Online Alpha aprovado nos 12 recursos obrigatórios.\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  }
}

module.exports = Object.freeze({ ALPHA_CAPABILITIES, assertAlphaMatrix, uniqueAlphaTests, main });
