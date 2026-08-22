const test = require("node:test");
const assert = require("node:assert/strict");

const summary = require("../../src/core/character_summary.js");
const rules = require("../../src/core/rules.js");

function state(overrides = {}) {
  return {
    character: { level: 3 },
    attributes: { CON: 50, POD: 50 },
    resources: { hpCurrent: null, pmCurrent: null, hpMaxBonus: 0, pmMaxBonus: 0 },
    magicCore: { selectedId: "" },
    talents: [],
    ...overrides,
  };
}

test("reuses the existing HP and PM rules for a compact character summary", () => {
  assert.deepEqual(summary.resourceSummary(state(), rules, { talents: [] }, []), {
    hp: { current: 33, maximum: 33 },
    pm: { current: 26, maximum: 26 },
  });
});

test("keeps manual resources and maxima clamped exactly like the sheet", () => {
  const result = summary.resourceSummary(state({
    character: { level: 3 },
    attributes: { CON: 50, POD: 50 },
    resources: { hpCurrent: 100, pmCurrent: -5, hpMaxBonus: 2, pmMaxBonus: 4 },
    magicCore: { selectedId: "" },
    talents: [],
  }), rules, { talents: [] }, []);
  assert.deepEqual(result, { hp: { current: 35, maximum: 35 }, pm: { current: 0, maximum: 30 } });
});

test("preserves core, robust, passive, and conditional resource effects", () => {
  const database = { talents: [
    { name: "Robusto", attributeMods: { CON: 5 } },
    { name: "Reservas", resourceMods: { pm: 3 } },
    { name: "Foco", mode: "conditional", conditionalMods: { attributeMods: { POD: 5 }, resourceMods: { pm: 2 } } },
  ] };
  const cores = [{ id: "umbigo", permanentPmPenalty: 2 }];
  const result = summary.resourceSummary(state({
    character: { level: 3 },
    attributes: { CON: 50, POD: 50 },
    resources: { hpCurrent: null, pmCurrent: null, hpMaxBonus: 0, pmMaxBonus: 0 },
    magicCore: { selectedId: "umbigo" },
    talents: [{ name: "Robusto", level: 2 }, { name: "Reservas" }, { name: "Foco", enabled: true }],
  }), rules, database, cores);
  assert.deepEqual(result, { hp: { current: 45, maximum: 45 }, pm: { current: 49, maximum: 49 } });
});
