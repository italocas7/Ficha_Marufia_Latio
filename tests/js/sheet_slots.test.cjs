const test = require("node:test");
const assert = require("node:assert/strict");
const slots = require("../../src/online/sheet_slots.js");
const policy = require("../../src/online/campaign_skill_policy.js");

function sheet(id) {
  return { meta: { appId: "marufia-latio", schemaVersion: 6, started: true, createdAt: `2026-09-30T00:00:0${id}.000Z` }, character: { name: `Ficha ${id}` }, inspiration: 0 };
}

function harness(initial = sheet(1)) {
  const values = new Map();
  let current = initial;
  let canSave = true;
  let canBackup = true;
  const storage = {
    loadLocal: (key, fallback) => values.has(key) ? structuredClone(values.get(key)) : fallback,
    saveLocal: (key, value) => { if (!canSave) throw new Error("sem espaço"); values.set(key, structuredClone(value)); return true; },
  };
  const bridge = {
    snapshot: () => structuredClone(current),
    flushCurrent: () => canSave,
    applyRemoteSnapshot: (value) => { current = structuredClone(value); return true; },
    backupSnapshot: () => canBackup,
    resetBlank: () => { current = { meta: { started: false } }; return true; },
  };
  const store = slots.createSlotStore(storage, bridge, { crypto: { randomUUID: () => `${Math.random()}` } });
  return { store, storage, bridge, current: () => current, setCurrent: (value) => { current = value; }, setCanSave: (value) => { canSave = value; }, setCanBackup: (value) => { canBackup = value; } };
}

test("migrates the active local sheet and keeps five separate guest slots", () => {
  const { store, current } = harness();
  assert.equal(store.ensureMigrated(), true);
  assert.equal(store.list("guest").length, 1);
  const first = store.active().id;
  for (let number = 2; number <= 5; number += 1) store.add(sheet(number));
  assert.equal(store.list("guest").length, 5);
  assert.throws(() => store.add(sheet(6)), /cinco espaços/i);
  store.activate(first);
  assert.equal(current().character.name, "Ficha 1");
});

test("failed persistence blocks a switch and deletion requires a backup", () => {
  const { store, setCanSave, setCanBackup } = harness();
  store.ensureMigrated();
  store.add(sheet(2));
  const first = store.list("guest")[0].id;
  setCanSave(false);
  assert.throws(() => store.activate(first), /salva/i);
  assert.equal(store.active().state.character.name, "Ficha 2");
  setCanSave(true);
  setCanBackup(false);
  assert.throws(() => store.remove(first), /backup/i);
  assert.equal(store.list("guest").length, 2);
});

test("account scopes remain isolated and existing excess slots are preserved", () => {
  const { store, storage } = harness();
  store.ensureMigrated();
  const account = slots.accountScope("server", "person-1");
  store.add(sheet(2), account, "remote-1");
  assert.equal(store.list("guest").length, 1);
  assert.equal(store.list(account).length, 1);
  assert.equal(store.findRemote("remote-1", account)?.state.character.name, "Ficha 2");
  assert.equal(slots.readRegistry(storage).slots.length, 2);
});

test("campaign cap cache distinguishes independent sheets and campaign limits", () => {
  const { storage } = harness();
  assert.equal(policy.cachedPolicy(storage, "account|sheet"), null);
  policy.rememberPolicy(storage, "account|sheet", { campaignId: "one", limit: 55 });
  assert.equal(policy.cachedPolicy(storage, "account|sheet").limit, 55);
  policy.rememberPolicy(storage, "account|sheet", { none: true });
  assert.equal(policy.cachedPolicy(storage, "account|sheet").none, true);
});
