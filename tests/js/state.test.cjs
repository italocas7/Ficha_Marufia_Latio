const test = require("node:test");
const assert = require("node:assert/strict");
const stateTools = require("../../src/core/state.js");

function defaults() {
  return {
    meta: { appId: "marufia-latio", schemaVersion: 4, started: false, importedFromPdf: null },
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
    world: { status: "closed", maintenancePaidForTurn: false, laws: [] },
  };
}

const options = { appId: "marufia-latio", schemaVersion: 4 };

test("migrates v1 and removes session UI", () => {
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 1 },
    character: { name: "Antiga" },
    world: { active: true },
    ui: { printMode: true, activeTab: "mundo" },
  }, defaults(), options);
  assert.equal(prepared.state.meta.schemaVersion, 4);
  assert.equal(prepared.state.world.status, "active");
  assert.equal(Object.hasOwn(prepared.state, "ui"), false);
});

test("migrates v2 and removes legacy World combat state", () => {
  const prepared = stateTools.prepareImport({
    meta: { appId: "marufia-latio", schemaVersion: 2 },
    world: { status: "active", turns: "1d4" },
    combat: { activeSpells: [{ id: "world", spellId: "base-Mundo", type: "Mundo", name: "Mundo", level: 1, turns: null, maintenanceCost: 2 }] },
  }, defaults(), options);
  assert.equal(prepared.state.meta.schemaVersion, 4);
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

for (const invalidVersion of [undefined, "banana", 0, -1, 1.5, 5]) {
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
