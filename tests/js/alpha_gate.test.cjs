"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const alpha = require("../../tools/test_alpha.cjs");
const packageJson = require("../../package.json");

const root = path.resolve(__dirname, "..", "..");
const REQUIRED_ALPHA_CAPABILITIES = Object.freeze([
  "Conta",
  "Login",
  "Campanhas",
  "Código de entrada",
  "Personagens",
  "Ficha",
  "Salvamento remoto",
  "Sincronização",
  "Rolagens online",
  "Painel do Mæstre",
  "Permissões",
  "Executável Windows",
  "Atualização do aplicativo",
]);

test("keeps all current Alpha capabilities explicit and executable", () => {
  assert.deepEqual(alpha.ALPHA_CAPABILITIES.map((capability) => capability.name), REQUIRED_ALPHA_CAPABILITIES);
  assert.equal(alpha.assertAlphaMatrix(), true);
  for (const capability of alpha.ALPHA_CAPABILITIES) {
    assert.ok(capability.files.length > 0, `${capability.name} sem contratos.`);
    for (const file of capability.files) assert.equal(fs.existsSync(path.join(root, file)), true, file);
  }
});

test("runs the Alpha gate through one stable command without adding a new system", () => {
  assert.equal(packageJson.scripts["test:alpha"], "node tools/test_alpha.cjs");
  assert.ok(alpha.uniqueAlphaTests().length >= 20);
  assert.equal(packageJson.version, "0.2.3");
  assert.equal(require("../../src/online/version.js").channel, "alpha");
});

test("keeps remote verification explicit and Windows delivery mandatory", () => {
  const source = fs.readFileSync(path.join(root, "tools", "test_alpha.cjs"), "utf8");
  assert.match(source, /MARUFIA_ALPHA_REMOTE === "1"/);
  assert.match(source, /test_supabase_database\.cjs/);
  assert.match(source, /test_supabase_security\.cjs/);
  assert.match(source, /test_realtime_connection\.cjs/);
  assert.match(source, /check_windows_security\.cjs/);
});
