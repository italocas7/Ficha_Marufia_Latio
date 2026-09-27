(function initLatioRolls(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LATIO_ROLLS = api;
})(typeof window !== "undefined" ? window : globalThis, function createLatioRollsApi() {
  "use strict";

  const ROLL_REQUEST_VERSION = 1;
  const TRAY_DICE = Object.freeze(["d4", "d6", "d8", "d10", "d12", "d20", "d100"]);
  const TRAY_MAX_DICE = 50;

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

  function normalizeTrayPool(value) {
    if (!Array.isArray(value)) throw new TypeError("Selecione pelo menos um dado.");
    const counts = new Map();
    for (const entry of value) {
      const type = String(entry?.type ?? "");
      const count = Number(entry?.count);
      if (!TRAY_DICE.includes(type) || !Number.isSafeInteger(count) || count < 1) {
        throw new TypeError("A seleção contém um dado inválido.");
      }
      counts.set(type, (counts.get(type) ?? 0) + count);
    }
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    if (total < 1 || total > TRAY_MAX_DICE) throw new TypeError("Selecione entre 1 e 50 dados.");
    return TRAY_DICE.filter((type) => counts.has(type)).map((type) => Object.freeze({ type, count: counts.get(type) }));
  }

  function trayFormula(pool) {
    return normalizeTrayPool(pool).map(({ type, count }) => `${count}${type}`).join(" + ");
  }

  function trayD100(tensDigit, units) {
    if (![tensDigit, units].every((value) => Number.isInteger(value) && value >= 0 && value <= 9)) {
      throw new TypeError("As dezenas e unidades do d100 devem estar entre 0 e 9.");
    }
    return tensDigit === 0 && units === 0 ? 100 : tensDigit * 10 + units;
  }

  function normalizeTrayResults(pool, value) {
    const selection = normalizeTrayPool(pool);
    const types = selection.flatMap(({ type, count }) => Array(count).fill(type));
    if (!Array.isArray(value) || value.length !== types.length) throw new TypeError("Resultado incompleto da bandeja.");
    let total = 0;
    const dice = value.map((entry, index) => {
      const type = String(entry?.type ?? "");
      if (type !== types[index]) throw new TypeError("A ordem dos dados não corresponde à seleção.");
      const result = Number(entry?.result);
      if (!Number.isSafeInteger(result)) throw new TypeError("Resultado de dado inválido.");
      if (type === "d100") {
        const tens = Number(entry?.tens);
        const units = Number(entry?.units);
        if (!Number.isInteger(tens) || tens < 0 || tens > 90 || tens % 10 !== 0
          || !Number.isInteger(units) || units < 0 || units > 9 || trayD100(tens / 10, units) !== result) {
          throw new TypeError("O d100 não corresponde aos dois d10.");
        }
        total += result;
        return Object.freeze({ type, tens, units, result });
      }
      const sides = Number(type.slice(1));
      if (result < 1 || result > sides) throw new TypeError("Resultado fora das faces do dado.");
      total += result;
      return Object.freeze({ type, result });
    });
    return Object.freeze({ pool: selection, dice: Object.freeze(dice), total, formula: trayFormula(selection) });
  }

  function rollTray(pool, random = Math.random) {
    const selection = normalizeTrayPool(pool);
    const dice = selection.flatMap(({ type, count }) => Array.from({ length: count }, () => {
      if (type === "d100") {
        const tens = drawDie(10, random) - 1;
        const units = drawDie(10, random) - 1;
        return { type, tens: tens * 10, units, result: trayD100(tens, units) };
      }
      return { type, result: drawDie(Number(type.slice(1)), random) };
    }));
    return normalizeTrayResults(selection, dice);
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
    TRAY_DICE,
    TRAY_MAX_DICE,
    normalizeTrayPool,
    normalizeTrayResults,
    trayFormula,
    trayD100,
    rollTray,
  };
});
