const test = require("node:test");
const assert = require("node:assert/strict");
const storageTools = require("../../src/core/storage.js");

function memoryStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    raw(key) { return values.get(key) ?? null; },
  };
}

test("keeps the existing JSON representation for local state", () => {
  const storage = memoryStorage();
  const payload = { meta: { schemaVersion: 5 }, character: { name: "Latio" } };
  assert.equal(storageTools.saveLocal("sheet", payload, storage), true);
  assert.equal(storage.raw("sheet"), JSON.stringify(payload));
  assert.deepEqual(storageTools.loadLocal("sheet", null, storage), payload);
});

test("returns a fallback for missing local data and removes saved data", () => {
  const storage = memoryStorage();
  assert.deepEqual(storageTools.loadLocal("backups", [], storage), []);
  storageTools.saveLocal("backups", [{ id: "one" }], storage);
  assert.equal(storageTools.removeLocal("backups", storage), true);
  assert.equal(storageTools.loadLocal("backups", null, storage), null);
});

test("surfaces invalid local JSON without silently replacing it", () => {
  const storage = memoryStorage();
  storage.setItem("sheet", "{invalid");
  assert.throws(() => storageTools.loadLocal("sheet", null, storage), SyntaxError);
});

test("delegates remote operations only to an explicit adapter", async () => {
  const calls = [];
  const adapter = {
    async load(request) { calls.push(["load", request]); return { state: "remote" }; },
    async save(request) { calls.push(["save", request]); return { revision: 2 }; },
  };
  assert.deepEqual(await storageTools.loadRemote(adapter, { characterId: "one" }), { state: "remote" });
  assert.deepEqual(await storageTools.saveRemote(adapter, { characterId: "one", state: {} }), { revision: 2 });
  assert.deepEqual(calls, [
    ["load", { characterId: "one" }],
    ["save", { characterId: "one", state: {} }],
  ]);
});

test("fails closed while remote storage is not configured", async () => {
  await assert.rejects(storageTools.loadRemote(null, {}), (error) => error.code === "LAT-STORAGE-REMOTE-001");
  await assert.rejects(storageTools.saveRemote(null, {}), (error) => error.code === "LAT-STORAGE-REMOTE-001");
});
