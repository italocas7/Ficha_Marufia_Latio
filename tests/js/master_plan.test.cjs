"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const plan = require("../../tools/test_master_plan.cjs");

test("Fases 53 a 56 preservam os quatro sistemas como reservas futuras", () => {
  assert.equal(plan.assertFutureRoadmap(), true);
  assert.deepEqual(Object.keys(plan.FUTURE_SCOPE), ["53", "54", "55", "56"]);
});

test("Fases 57 a 66 e 73 incorporam as regras de governança ao projeto", () => {
  assert.equal(plan.assertGovernance(), true);
  assert.deepEqual(plan.GOVERNANCE_PHASES, [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 73]);
});

test("Fases 67 a 70 mantêm as experiências de Jogador e Mæstre no produto específico", () => {
  assert.equal(plan.assertProductExperience(), true);
});

test("Fase 71 preserva as vinte etapas da ordem absoluta", () => {
  assert.equal(plan.assertAbsoluteOrder(), true);
  assert.equal(plan.ABSOLUTE_ORDER.length, 20);
});

test("Fase 72 mantém evidência verificável da auditoria inicial", () => {
  assert.equal(plan.assertInitialAudit(), true);
});

test("todas as fases restantes, de 53 a 73, possuem registro explícito", () => {
  assert.equal(plan.assertAllRemainingPhases(), true);
  assert.equal(plan.REMAINING_PHASES.length, 21);
});
