"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const gate = require("../../tools/test_mvp.cjs");

test("Fase 51 mantém os seis critérios obrigatórios do MVP", () => {
  assert.equal(gate.assertMvpDefinition(), true);
  assert.equal(gate.MVP_CRITERIA.length, 6);
  assert.equal(gate.MVP_FLOW_TEST, "tests/js/mvp_flow.test.cjs");
});
