const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..", "..");

function loadDatabase(relativePath = "data.js") {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, relativePath), "utf8"), sandbox);
  return sandbox.window.MARUFIA_DB;
}

test("generated database exposes the offline global", () => {
  const database = loadDatabase();
  assert.equal(database.schema, "latio-db-1");
  assert.equal(database.worldLaws.length, 76);
  assert.equal(database.skills.find((skill) => skill.name === "Percepção").base, 15);
});

