const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("../../src/core/rules.js");

test("age profile follows growth, peak and aging boundaries", () => {
  for (const [age, growthPenalty, agingLoss, skillPoints] of [
    [10, 40, 0, 0], [16, 10, 0, 0], [17, 8, 0, 0], [20, 2, 0, 0],
    [21, 0, 0, 0], [41, 0, 0, 0], [42, 0, 5, 20], [49, 0, 5, 20],
    [50, 0, 10, 40], [60, 0, 20, 60], [70, 0, 30, 80],
    [80, 0, 40, 100], [90, 0, 50, 120],
  ]) {
    const result = rules.ageProfile(String(age));
    assert.deepEqual([result.growthPenalty, result.agingLoss, result.skillPoints], [growthPenalty, agingLoss, skillPoints]);
  }
  assert.equal(rules.ageProfile("65 anos").skillPoints, 60);
  for (const invalid of ["", "9", "banana", "12.5", "-10"]) assert.equal(rules.ageProfile(invalid).valid, false);
});

test("age reduces physical peaks without negative youth values", () => {
  assert.equal(rules.agedPhysicalValue(75, rules.ageProfile(10)), 35);
  assert.equal(rules.agedPhysicalValue(20, rules.ageProfile(10)), 0);
  assert.equal(rules.agedPhysicalValue(75, rules.ageProfile(65), 10), 65);
  assert.equal(rules.agedPhysicalValue(75, rules.ageProfile("")), 75);
});

test("aging loss is balanced, editable and limited by half and the quarter floor", () => {
  const peaks = { FOR: 75, DES: 65, CON: 60 };
  const example = rules.distributeAgingLoss(peaks, 20, { FOR: 10, DES: 5, CON: 5 });
  assert.deepEqual(example.loss, { FOR: 10, DES: 5, CON: 5 });
  assert.equal(example.applied, 20);
  const balanced = rules.distributeAgingLoss(peaks, 50);
  assert.equal(balanced.applied, 50);
  assert.equal(Math.max(...Object.values(balanced.loss)) <= 25, true);
  assert.equal(rules.ageMinimum(75), 20);
  const limited = rules.distributeAgingLoss({ FOR: 10, DES: 10, CON: 10 }, 50);
  assert.equal(limited.limited, true);
  assert.equal(limited.applied, 15);
  assert.deepEqual(limited.loss, { FOR: 5, DES: 5, CON: 5 });
});
