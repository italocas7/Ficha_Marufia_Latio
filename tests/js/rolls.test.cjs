const test = require("node:test");
const assert = require("node:assert/strict");

const rolls = require("../../src/core/rolls.js");

function sequence(values) {
  let index = 0;
  return () => values[index++];
}

test("keeps the existing normal d100 result and boundary probabilities", () => {
  assert.deepEqual(rolls.rollD100("normal", () => 0), {
    rolls: [1],
    result: 1,
    label: "Normal",
    mode: "normal",
    formula: "1d100",
    modifier: 0,
  });
  assert.deepEqual(rolls.rollD100("normal", () => 0.999999), {
    rolls: [100],
    result: 100,
    label: "Normal",
    mode: "normal",
    formula: "1d100",
    modifier: 0,
  });
});

test("keeps advantage as the lower of exactly two d100 rolls", () => {
  let calls = 0;
  const random = sequence([0.79, 0.19]);
  const result = rolls.rollD100("adv", () => {
    calls += 1;
    return random();
  });
  assert.deepEqual(result, { rolls: [80, 20], result: 20, label: "Vantagem", mode: "adv", formula: "2d100", modifier: 0 });
  assert.equal(calls, 2);
});

test("keeps disadvantage as the higher of exactly two d100 rolls", () => {
  let calls = 0;
  const random = sequence([0.19, 0.79]);
  const result = rolls.rollD100("dis", () => {
    calls += 1;
    return random();
  });
  assert.deepEqual(result, { rolls: [20, 80], result: 80, label: "Desvantagem", mode: "dis", formula: "2d100", modifier: 0 });
  assert.equal(calls, 2);
});

test("keeps unknown d100 modes equivalent to the previous normal mode", () => {
  let calls = 0;
  const result = rolls.rollD100("unknown", () => {
    calls += 1;
    return 0.49;
  });
  assert.deepEqual(result, { rolls: [50], result: 50, label: "Normal", mode: "normal", formula: "1d100", modifier: 0 });
  assert.equal(calls, 1);
});

test("creates the existing World d4 and d4+2 results", () => {
  assert.deepEqual(rolls.rollDie({ sides: 4, random: () => 0 }), {
    rolls: [1],
    result: 1,
    label: "1d4",
    mode: "normal",
    formula: "1d4",
    modifier: 0,
  });
  assert.deepEqual(rolls.rollDie({ sides: 4, modifier: 2, random: () => 0.999999 }), {
    rolls: [4],
    result: 6,
    label: "1d4+2",
    mode: "normal",
    formula: "1d4+2",
    modifier: 2,
  });
});

test("creates the existing Antebraço d6 result without changing its range", () => {
  assert.equal(rolls.rollDie({ sides: 6, random: () => 0 }).result, 1);
  assert.equal(rolls.rollDie({ sides: 6, random: () => 0.999999 }).result, 6);
});

test("creates an independent reusable result object", () => {
  const source = [12, 34];
  const result = rolls.createRollResult({ rolls: source, result: 12, label: "Vantagem" });
  source[0] = 99;
  assert.deepEqual(result, {
    rolls: [12, 34],
    result: 12,
    label: "Vantagem",
    mode: "normal",
    formula: "",
    modifier: 0,
  });
});

test("creates versioned requests without embedding a random source", () => {
  const d100 = rolls.createD100Request("adv");
  const die = rolls.createDieRequest({ sides: 6, modifier: 2 });
  assert.deepEqual(d100, { version: 1, kind: "d100", mode: "adv" });
  assert.deepEqual(die, { version: 1, kind: "die", sides: 6, modifier: 2 });
  assert.equal(Object.isFrozen(d100), true);
  assert.equal(Object.hasOwn(d100, "random"), false);
  assert.throws(() => rolls.normalizeRollRequest({ version: 2, kind: "d100", mode: "normal" }), /Versão/i);
});

test("keeps generation and result resolution on separate sides of the provider boundary", () => {
  const requests = [];
  const engine = rolls.createRollEngine({
    kind: "test-provider",
    generate(request) {
      requests.push(request);
      return [80, 20];
    },
  });
  const result = engine.rollSync(rolls.createD100Request("adv"));
  assert.equal(engine.providerKind, "test-provider");
  assert.deepEqual(requests, [{ version: 1, kind: "d100", mode: "adv" }]);
  assert.deepEqual(result, { rolls: [80, 20], result: 20, label: "Vantagem", mode: "adv", formula: "2d100", modifier: 0 });
});

test("accepts a future asynchronous provider without changing the result contract", async () => {
  const provider = {
    kind: "remote",
    async generate(request) {
      assert.deepEqual(request, { version: 1, kind: "die", sides: 4, modifier: 2 });
      return [4];
    },
  };
  const engine = rolls.createRollEngine(provider);
  const request = rolls.createDieRequest({ sides: 4, modifier: 2 });
  assert.deepEqual(await engine.roll(request), {
    rolls: [4],
    result: 6,
    label: "1d4+2",
    mode: "normal",
    formula: "1d4+2",
    modifier: 2,
  });
  assert.throws(() => engine.rollSync(request), /assíncrono/i);
});

test("rejects malformed provider output before it reaches the sheet", () => {
  const normal = rolls.createD100Request("normal");
  const advantage = rolls.createD100Request("adv");
  assert.throws(() => rolls.resolveRollRequest(normal, [0]), /intervalo/i);
  assert.throws(() => rolls.resolveRollRequest(normal, [101]), /intervalo/i);
  assert.throws(() => rolls.resolveRollRequest(advantage, [20]), /quantidade/i);
  assert.throws(() => rolls.rollDie({ sides: 6, random: () => 1 }), /intervalo/i);
  assert.throws(() => rolls.rollDie({ sides: 6, random: () => Number.NaN }), /intervalo/i);
});
