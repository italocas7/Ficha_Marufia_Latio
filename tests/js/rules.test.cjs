const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("../../src/core/rules.js");

test("adds the aptitude surcharge only after a spell has reached level six", () => {
  assert.equal(rules.aptitudeUpgradeCost("Fina", 0, 1), 1);
  assert.equal(rules.aptitudeUpgradeCost("Fina", 0, 1, true), 0);
  for (const [type, base] of Object.entries({ Fina: 1, Impacto: 1, Densa: 1, Etérea: 2, Forte: 2, Mundo: 3 })) {
    assert.equal(rules.aptitudeUpgradeCost(type, 5, 6), base, `${type} N5 → N6 deve manter o custo-base.`);
    assert.equal(rules.aptitudeUpgradeCost(type, 6, 7), base + 1, `${type} N6 → N7 deve receber +1.`);
    assert.equal(rules.aptitudeUpgradeCost(type, 8, 9), base + 1, `${type} N8 → N9 deve manter +1.`);
    assert.equal(rules.aptitudeUpgradeCost(type, 9, 10), base + 2, `${type} N9 → N10 deve receber +2.`);
  }
  assert.equal(rules.spellAptitudeCost("Fina", 6), 6);
  assert.equal(rules.spellAptitudeCost("Mundo", 10), 35);
});

test("applies Heart rounding with a minimum cost of one", () => {
  assert.equal(rules.magicCost(1, true), 1);
  assert.equal(rules.magicCost(3, true), 1);
  assert.equal(rules.magicCost(7, true), 3);
  assert.deepEqual(rules.worldCosts(5, true), { activation: 5, maintenance: 2 });
});

test("keeps Robust non-retroactive", () => {
  const without = rules.calculateMaxHp({ con: 50, level: 5 });
  const acquiredAtFive = rules.calculateMaxHp({ con: 50, level: 5, robustAcquiredLevel: 5 });
  const acquiredAtThree = rules.calculateMaxHp({ con: 50, level: 5, robustAcquiredLevel: 3 });
  assert.equal(acquiredAtFive - without, 6);
  assert.equal(acquiredAtThree - without, 18);
});

test("preserves PM bonuses, penalties, and Pulmao recovery", () => {
  assert.equal(rules.calculateMaxPm({ pod: 50, level: 3 }), 26);
  assert.equal(rules.calculateMaxPm({ pod: 50, level: 3, umbilicusCore: true }), 44);
  assert.equal(rules.calculateMaxPm({ pod: 50, level: 3, permanentPenalty: 2 }), 24);
  assert.equal(rules.coreRestBonus(3), 6);
});

test("blocks skill overages unless the Master exception is active", () => {
  assert.deepEqual(rules.validateSkillAllocation({ finalValue: 71, limit: 70, spent: 10, budget: 20 }), { valid: false, reason: "limit" });
  assert.deepEqual(rules.validateSkillAllocation({ finalValue: 50, limit: 70, spent: 21, budget: 20 }), { valid: false, reason: "budget" });
  assert.deepEqual(rules.validateSkillAllocation({ finalValue: 99, limit: 70, spent: 99, budget: 20, gmOverride: true }), { valid: true, reason: "gm-override" });
});

test("rejects invalid World state transitions", () => {
  assert.equal(rules.validateWorldAction({ status: "closed", action: "maintain" }).reason, "not-active");
  assert.equal(rules.validateWorldAction({ status: "active", action: "open" }).reason, "already-active");
  assert.equal(rules.validateWorldAction({ status: "active", action: "law", lawCount: 0, lawUses: 2 }).reason, "missing-law");
  assert.equal(rules.validateWorldAction({ status: "active", action: "law", lawCount: 1, lawUses: 0 }).reason, "no-law-uses");
  assert.equal(rules.validateWorldAction({ status: "active", action: "law", lawCount: 1, lawUses: 1 }).valid, true);
});
