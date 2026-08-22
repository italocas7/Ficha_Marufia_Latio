"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const scope = require("../../tools/test_scope.cjs");

test("Fase 52 mantém os 17 recursos não prioritários explicitamente adiados", () => {
  assert.equal(scope.assertDeferredScope(), true);
  assert.equal(scope.DEFERRED_CAPABILITIES.length, 17);
  assert.equal(scope.SCOPE_DOCUMENT, "docs/deferred-scope.md");
});

test("Fase 52 não adiciona dependências nem estruturas dos sistemas adiados", () => {
  assert.ok(scope.assertNoDeferredFootprint() > 0);
  assert.ok(scope.FORBIDDEN_DEPENDENCIES.includes("leaflet"));
  assert.ok(scope.FORBIDDEN_DEPENDENCIES.includes("discord.js"));
  assert.ok(scope.FORBIDDEN_ROOTS.includes("android"));
  assert.ok(scope.FORBIDDEN_ROOTS.includes("ios"));
});
