const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const phase39 = require("../../tools/test_phase39.cjs");
const packageJson = require("../../package.json");

const REQUIRED_CATEGORIES = [
  "Estado",
  "Salvamento",
  "Migrações",
  "Autenticação",
  "Campanhas e entrada por código",
  "Personagens",
  "Sincronização",
  "Rolagens",
  "Permissões",
  "Offline",
  "Conflitos",
  "Interface e responsividade",
];

test("keeps every Phase 39 acceptance category explicit and executable", () => {
  assert.deepEqual(phase39.GROUPS.map((group) => group.name), REQUIRED_CATEGORIES);
  for (const group of phase39.GROUPS) {
    assert.ok(group.files.length > 0, `${group.name} não possui testes associados.`);
    for (const file of group.files) {
      assert.equal(fs.existsSync(path.join(root, file)), true, `${group.name}: arquivo ausente ${file}`);
    }
  }
});

test("runs the Phase 39 matrix through one stable package command", () => {
  assert.equal(packageJson.scripts["test:phase39"], "node tools/test_phase39.cjs");
  assert.ok(phase39.uniqueUnitTests().length >= 40, "A matriz perdeu parte relevante da suíte JavaScript.");
  assert.ok(phase39.GROUPS.find((group) => group.name === "Migrações").files.length >= 15);
  assert.equal(typeof phase39.pythonExecutable(), "string");
  assert.ok(phase39.pythonExecutable().length > 0);
});

test("keeps remote database and attack checks opt-in without weakening local permissions", () => {
  const source = fs.readFileSync(path.join(root, "tools", "test_phase39.cjs"), "utf8");
  assert.match(source, /MARUFIA_PHASE39_REMOTE === "1"/);
  assert.match(source, /test_supabase_database\.cjs/);
  assert.match(source, /test_supabase_security\.cjs/);
  const permissions = phase39.GROUPS.find((group) => group.name === "Permissões").files;
  assert.ok(permissions.includes("tests/js/security_audit.test.cjs"));
  assert.ok(permissions.includes("tests/js/row_level_security_migration.test.cjs"));
});
