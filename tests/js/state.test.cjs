const test = require("node:test");
const assert = require("node:assert/strict");
const stateTools = require("../../src/core/state.js");

function defaults() {
  return {
    meta: { appId: "marufia-latio", schemaVersion: 5, started: false, importedFromPdf: null },
    character: { name: "", level: 1 },
    attributes: { FOR: 50 },
    resources: {},
    settings: { skillLimit: 70 },
    skills: { Atletismo: { added: 0, checked: false, evolutions: [] } },
    inventory: { weapons: [], equipment: [], customArmors: [], selectedWeaponId: "" },
    talents: [],
    abilities: [],
    effects: [],
    magic: { baseLevels: { Fina: 0 }, knownExtras: [] },
    combat: { activeSpells: [] },
    world: { status: "closed", durationTurns: null, maintenancePaidForTurn: false, laws: [] },
  };
}

const options = { appId: "marufia-latio", schemaVersion: 5 };

test("declares the stable v5 state contract", () => {
  assert.deepEqual(stateTools.STATE_SCHEMA, {
    appId: "marufia-latio",
    currentVersion: 5,
    minimumSupportedVersion: 1,
    mediaType: "application/json",
  });
});

test("validates and migrates through explicit state boundaries", () => {
  const raw = {
    meta: { appId: "marufia-latio", schemaVersion: 1 },
    world: { active: true },
    ui: { activeTab: "combate" },
  };
  const safe = stateTools.cloneSafe(raw);
  const sourceVersion = stateTools.validateStateEnvelope(safe, options);
  const migrated = stateTools.migrateState(safe, sourceVersion);
  assert.equal(sourceVersion, 1);
  assert.equal(migrated.world.status, "active");
  assert.equal(Object.hasOwn(migrated.world, "active"), false);
  assert.equal(Object.hasOwn(migrated, "ui"), false);
});

test("round-trips the current serialized payload without changing its JSON shape", () => {
  const current = defaults();
  current.character.name = "Formato estável";
  const serialized = JSON.stringify(stateTools.persistentPayload(current));
  const prepared = stateTools.prepareImport(JSON.parse(serialized), defaults(), options);
  assert.equal(prepared.migrated, false);
  assert.equal(prepared.state.meta.schemaVersion, 5);
  assert.equal(prepared.state.character.name, "Formato estável");
  assert.equal(Object.hasOwn(JSON.parse(serialized), "ui"), false);
});

test("round-trips the versioned online backup without mixing authority into schema v5", () => {
  const current = defaults();
  current.character.name = "Backup online";
  const backup = stateTools.createOnlineBackup(current, {
    id: "11111111-1111-4111-8111-111111111111",
    campaign_id: "22222222-2222-4222-8222-222222222222",
    revision: 7,
    last_change_origin: "gm",
    updated_at: "2026-08-21T18:00:00.000Z",
  }, "2026-08-21T18:01:00.000Z");
  assert.equal(backup.format, stateTools.ONLINE_BACKUP_SCHEMA.format);
  assert.equal(backup.character.state.character.name, "Backup online");
  assert.equal(backup.online.revision, 7);
  assert.equal(Object.hasOwn(backup.character.state, "owner_id"), false);
  const prepared = stateTools.prepareImport(backup, defaults(), options);
  assert.equal(prepared.sourceFormat, "online-backup");
  assert.equal(prepared.onlineMetadata.revision, 7);
  assert.equal(prepared.state.character.name, "Backup online");
  assert.equal(Object.hasOwn(prepared.state, "online"), false);
});

test("imports a protected online character row as state only", () => {
  const current = defaults();
  current.character.name = "Linha online";
  const prepared = stateTools.prepareImport({
    id: "11111111-1111-4111-8111-111111111111",
    owner_id: "33333333-3333-4333-8333-333333333333",
    campaign_id: "22222222-2222-4222-8222-222222222222",
    schema_version: 5,
    revision: 4,
    last_change_origin: "player",
    updated_at: "2026-08-21T18:00:00.000Z",
    state: current,
  }, defaults(), options);
  assert.equal(prepared.sourceFormat, "online-row");
  assert.equal(prepared.onlineMetadata.characterId, "11111111-1111-4111-8111-111111111111");
  assert.equal(prepared.state.character.name, "Linha online");
  assert.equal(Object.hasOwn(prepared.state, "owner_id"), false);
});

test("rejects a future online backup before changing the sheet", () => {
  assert.throws(() => stateTools.prepareImport({
    format: stateTools.ONLINE_BACKUP_SCHEMA.format,
    formatVersion: 2,
    character: { state: defaults() },
  }, defaults(), options), /futura de backup online/i);
});

test("migrates v1 and removes session UI", () => {
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 1 },
    character: { name: "Antiga" },
    world: { active: true },
    ui: { printMode: true, activeTab: "mundo" },
  }, defaults(), options);
  assert.equal(prepared.state.meta.schemaVersion, 5);
  assert.equal(prepared.state.world.status, "active");
  assert.equal(Object.hasOwn(prepared.state, "ui"), false);
});

test("migrates v2 and removes legacy World combat state", () => {
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 2 },
    world: { status: "active", turns: "1d4" },
    combat: { activeSpells: [{ id: "world", spellId: "base-Mundo", type: "Mundo", name: "Mundo", level: 1, turns: null, maintenanceCost: 2 }] },
  }, defaults(), options);
  assert.equal(prepared.state.meta.schemaVersion, 5);
  assert.equal(prepared.state.world.maintenancePaidForTurn, false);
  assert.equal(Object.hasOwn(prepared.state.world, "turns"), false);
  assert.equal(prepared.state.combat.activeSpells.length, 0);
});

test("migrates Escalar points, evolutions, and checks to Atletismo", () => {
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 3 },
    skills: {
      Atletismo: { added: 4, checked: false, evolutions: [{ value: 2 }] },
      Escalar: { added: 7, checked: true, evolutions: [{ value: 3 }] },
    },
  }, defaults(), options);
  assert.equal(prepared.state.skills.Atletismo.added, 11);
  assert.equal(prepared.state.skills.Atletismo.checked, true);
  assert.deepEqual(prepared.state.skills.Atletismo.evolutions.map((item) => item.value), [2, 3]);
  assert.equal(Object.hasOwn(prepared.state.skills, "Escalar"), false);
});

test("migrates v4 World duration and preserves v5 active spell bonuses", () => {
  const old = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 4 },
    world: { status: "active", maintenancePaidForTurn: true },
  }, defaults(), options);
  assert.equal(old.state.world.durationTurns, null);

  const current = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 5 },
    combat: { activeSpells: [{ id: "forte", spellId: "base-Forte", type: "Forte", name: "Forte", level: 5, turns: 10, maintenanceCost: 1, caBonus: 15, effectiveVigor: 10 }] },
  }, defaults(), options);
  assert.equal(current.state.combat.activeSpells[0].caBonus, 15);
  assert.equal(current.state.combat.activeSpells[0].effectiveVigor, 10);
});

for (const invalidVersion of [undefined, "banana", 0, -1, 1.5, 6]) {
  test(`rejects invalid schema version ${String(invalidVersion)}`, () => {
    const payload = { meta: { appId: "marufia-latio" } };
    if (invalidVersion !== undefined) payload.meta.schemaVersion = invalidVersion;
    assert.throws(() => stateTools.prepareImport(payload, defaults(), options), /schema inválida|futura não suportada/i);
  });
}

test("rejects prototype pollution keys", () => {
  const malicious = JSON.parse('{"meta":{"appId":"marufia-latio","schemaVersion":1},"__proto__":{"polluted":true}}');
  assert.throws(() => stateTools.prepareImport(malicious, defaults(), options), /Chave não permitida/);
  assert.equal({}.polluted, undefined);
});

test("normalizes unsafe and duplicated imported ids", () => {
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 2 },
    inventory: {
      weapons: [
        { id: '"><img src=x>', name: "A", damage: "1d4" },
        { id: '"><img src=x>', name: "B", damage: "1d6" },
      ],
      selectedWeaponId: '"><img src=x>',
    },
  }, defaults(), options);
  assert.deepEqual(prepared.state.inventory.weapons.map((weapon) => weapon.id), ["imported-weapons-1", "imported-weapons-2"]);
  assert.equal(prepared.state.inventory.selectedWeaponId, "imported-weapons-2");
});

test("updates references after custom armor id normalization", () => {
  const base = defaults();
  base.inventory.armorId = "";
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 2 },
    inventory: {
      customArmors: [{ id: "invalid id", name: "Armadura", category: "Custom", ca: 2 }],
      armorId: "custom:invalid id",
    },
  }, base, options);
  assert.equal(prepared.state.inventory.customArmors[0].id, "imported-customArmors-1");
  assert.equal(prepared.state.inventory.armorId, "custom:imported-customArmors-1");
});

test("clamps imported values and keeps infinite spell durations", () => {
  const base = defaults();
  base.resources = { hpCurrent: null, pmCurrent: null, hpMaxBonus: 0, pmMaxBonus: 0 };
  base.settings.theme = "light";
  base.skills = { Teste: { added: 0, checked: false, evolutions: [] } };
  base.skillExtraPoints = 0;
  base.inventory.money = { X: 0, D: 0, L: 0 };
  base.notes = { traits: "", ideal: "", flaws: "", bonds: "", appearance: "", history: "", allies: "", patron: "", other: "", eyes: "", age: "", height: "", hair: "", skin: "", weight: "" };
  base.magic.extraAptitudes = 0;
  base.errors = [];
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 2 },
    character: { level: 99 },
    settings: { theme: "unknown", skillLimit: -5 },
    skills: { Teste: { added: 5000, checked: 1, evolutions: [{ value: 99 }] } },
    notes: { traits: "x".repeat(1200) },
    combat: { activeSpells: [{ id: "infinita", spellId: "base-Forte", type: "Forte", name: "Forte", level: 2, turns: null, maintenanceCost: 1 }] },
  }, base, options);
  assert.equal(prepared.state.character.level, 20);
  assert.equal(prepared.state.settings.theme, "light");
  assert.equal(prepared.state.settings.skillLimit, 1);
  assert.equal(prepared.state.skills.Teste.added, 999);
  assert.equal(prepared.state.skills.Teste.evolutions[0].value, 10);
  assert.equal(prepared.state.notes.traits.length, 1000);
  assert.equal(prepared.state.combat.activeSpells[0].turns, null);
});

test("merge ignores unknown top-level fields", () => {
  const current = defaults();
  const merged = stateTools.mergeImported(current, { character: { name: "Mesclada" }, injected: { enabled: true } }, defaults(), options);
  assert.equal(merged.character.name, "Mesclada");
  assert.equal(Object.hasOwn(merged, "injected"), false);
});
