(function initLatioRolls(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LATIO_ROLLS = api;
})(typeof window !== "undefined" ? window : globalThis, function createLatioRollsApi() {
  "use strict";

  const ROLL_REQUEST_VERSION = 1;

  function drawDie(sides, random) {
    const safeSides = Number(sides);
    if (!Number.isInteger(safeSides) || safeSides < 2) throw new TypeError("O dado precisa ter pelo menos 2 lados.");
    if (typeof random !== "function") throw new TypeError("A fonte aleatória precisa ser uma função.");
    const sample = Number(random());
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new TypeError("A fonte aleatória devolveu um valor fora do intervalo permitido.");
    }
    return Math.floor(sample * safeSides) + 1;
  }

  function createRollResult({ rolls, result, label, mode = "normal", formula = "", modifier = 0 }) {
    if (!Array.isArray(rolls) || rolls.length === 0) throw new TypeError("A rolagem precisa conter ao menos um dado.");
    return { rolls: [...rolls], result, label, mode, formula, modifier };
  }

  function dieFormula(sides, modifier = 0) {
    if (modifier > 0) return `1d${sides}+${modifier}`;
    if (modifier < 0) return `1d${sides}${modifier}`;
    return `1d${sides}`;
  }

  function normalizedD100Mode(mode) {
    return ["adv", "dis"].includes(mode) ? mode : "normal";
  }

  function createD100Request(mode = "normal") {
    return Object.freeze({
      version: ROLL_REQUEST_VERSION,
      kind: "d100",
      mode: normalizedD100Mode(mode),
    });
  }

  function createDieRequest({ sides, modifier = 0 } = {}) {
    const safeSides = Number(sides);
    const safeModifier = Number(modifier);
    if (!Number.isInteger(safeSides) || safeSides < 2) throw new TypeError("O dado precisa ter pelo menos 2 lados.");
    if (!Number.isFinite(safeModifier)) throw new TypeError("O modificador da rolagem precisa ser numérico.");
    return Object.freeze({
      version: ROLL_REQUEST_VERSION,
      kind: "die",
      sides: safeSides,
      modifier: safeModifier,
    });
  }

  function normalizeRollRequest(value) {
    if (value?.version !== ROLL_REQUEST_VERSION) {
      throw new TypeError("Versão do pedido de rolagem inválida.");
    }
    if (value.kind === "d100") return createD100Request(value.mode);
    if (value.kind === "die") return createDieRequest(value);
    throw new TypeError("Tipo de pedido de rolagem inválido.");
  }

  function expectedDice(request) {
    return request.kind === "d100" && request.mode !== "normal" ? 2 : 1;
  }

  function validateRawRolls(request, rawRolls) {
    if (!Array.isArray(rawRolls) || rawRolls.length !== expectedDice(request)) {
      throw new TypeError("A fonte devolveu uma quantidade inválida de dados.");
    }
    const maximum = request.kind === "d100" ? 100 : request.sides;
    const rolls = rawRolls.map(Number);
    if (rolls.some((value) => !Number.isInteger(value) || value < 1 || value > maximum)) {
      throw new TypeError("A fonte devolveu um dado fora do intervalo permitido.");
    }
    return rolls;
  }

  function resolveRollRequest(value, rawRolls) {
    const request = normalizeRollRequest(value);
    const rolls = validateRawRolls(request, rawRolls);
    if (request.kind === "d100") {
      if (request.mode === "adv") {
        return createRollResult({ rolls, result: Math.min(...rolls), label: "Vantagem", mode: "adv", formula: "2d100" });
      }
      if (request.mode === "dis") {
        return createRollResult({ rolls, result: Math.max(...rolls), label: "Desvantagem", mode: "dis", formula: "2d100" });
      }
      return createRollResult({ rolls, result: rolls[0], label: "Normal", formula: "1d100" });
    }
    const formula = dieFormula(request.sides, request.modifier);
    return createRollResult({
      rolls,
      result: rolls[0] + request.modifier,
      label: formula,
      formula,
      modifier: request.modifier,
    });
  }

  function createLocalRollProvider(random = () => Math.random()) {
    if (typeof random !== "function") throw new TypeError("A fonte aleatória precisa ser uma função.");
    return Object.freeze({
      kind: "local",
      generate(value) {
        const request = normalizeRollRequest(value);
        const sides = request.kind === "d100" ? 100 : request.sides;
        return Array.from({ length: expectedDice(request) }, () => drawDie(sides, random));
      },
    });
  }

  function createRollEngine(provider = createLocalRollProvider()) {
    if (typeof provider?.generate !== "function") {
      throw new TypeError("O provedor de rolagens precisa implementar generate.");
    }
    const providerKind = String(provider.kind || "custom");
    function generate(value) {
      const request = normalizeRollRequest(value);
      return { request, generated: provider.generate(request) };
    }
    function rollSync(value) {
      const { request, generated } = generate(value);
      if (generated && typeof generated.then === "function") {
        throw new TypeError("Um provedor assíncrono deve usar roll.");
      }
      return resolveRollRequest(request, generated);
    }
    async function roll(value) {
      const { request, generated } = generate(value);
      return resolveRollRequest(request, await generated);
    }
    return Object.freeze({ providerKind, roll, rollSync });
  }

  function rollDie({ sides, modifier = 0, random = Math.random } = {}) {
    const request = createDieRequest({ sides, modifier });
    return createRollEngine(createLocalRollProvider(random)).rollSync(request);
  }

  function rollD100(mode = "normal", random = Math.random) {
    const request = createD100Request(mode);
    return createRollEngine(createLocalRollProvider(random)).rollSync(request);
  }

  return {
    ROLL_REQUEST_VERSION,
    createRollResult,
    createD100Request,
    createDieRequest,
    normalizeRollRequest,
    resolveRollRequest,
    createLocalRollProvider,
    createRollEngine,
    rollDie,
    rollD100,
  };
});
