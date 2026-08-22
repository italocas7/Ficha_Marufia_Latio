(function initLatioCharacterSummary(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LATIO_CHARACTER_SUMMARY = api;
})(typeof window !== "undefined" ? window : globalThis, function createLatioCharacterSummaryApi(root) {
  "use strict";

  function number(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, number(value, minimum)));
  }

  function knownTalents(state, database) {
    return (Array.isArray(state?.talents) ? state.talents : []).map((known) => {
      const base = (Array.isArray(database?.talents) ? database.talents : [])
        .find((talent) => talent.name === known?.name) ?? {};
      return { ...base, ...known };
    });
  }

  function enabledConditionalTalents(state, database) {
    return knownTalents(state, database)
      .filter((talent) => ["conditional", "mixed"].includes(talent.mode) && talent.enabled);
  }

  function hasCore(state, id) {
    return state?.magicCore?.selectedId === id;
  }

  function currentCore(state, magicCores) {
    return (Array.isArray(magicCores) ? magicCores : [])
      .find((core) => core.id === state?.magicCore?.selectedId);
  }

  function attributeValue(state, name, database) {
    let value = number(state?.attributes?.[name], 0);
    if (name === "CON" && hasCore(state, "amago")) value += 10;
    for (const talent of knownTalents(state, database)) value += number(talent.attributeMods?.[name], 0);
    for (const talent of enabledConditionalTalents(state, database)) {
      value += number(talent.conditionalMods?.attributeMods?.[name], 0);
    }
    return value;
  }

  function currentResource(value, maximum) {
    if (value === null || value === undefined || value === "") return maximum;
    return clamp(value, 0, maximum);
  }

  function resourceSummary(
    state,
    rules = root?.LATIO_RULES,
    database = root?.MARUFIA_DB,
    magicCores = root?.MARUFIA_MAGIC_CORES,
  ) {
    if (typeof rules?.calculateMaxHp !== "function" || typeof rules?.calculateMaxPm !== "function") {
      throw new TypeError("As regras de recursos não estão disponíveis.");
    }
    const level = Math.max(1, number(state?.character?.level, 1));
    const talents = knownTalents(state, database);
    const robust = talents.find((talent) => talent.name === "Robusto");
    const calculatedHp = rules.calculateMaxHp({
      con: attributeValue(state, "CON", database),
      level,
      robustAcquiredLevel: robust?.level ?? null,
    });
    const hpMaximum = Math.max(1, calculatedHp + number(state?.resources?.hpMaxBonus, 0));

    const passivePm = talents.reduce((sum, talent) => sum + number(talent.resourceMods?.pm, 0), 0);
    const conditionalPm = enabledConditionalTalents(state, database)
      .reduce((sum, talent) => sum + number(talent.conditionalMods?.resourceMods?.pm, 0), 0);
    const calculatedPm = rules.calculateMaxPm({
      pod: attributeValue(state, "POD", database),
      level,
      umbilicusCore: hasCore(state, "umbigo"),
      talentBonus: passivePm + conditionalPm,
      permanentPenalty: number(currentCore(state, magicCores)?.permanentPmPenalty, 0),
    });
    const pmMaximum = Math.max(0, calculatedPm + number(state?.resources?.pmMaxBonus, 0));

    return Object.freeze({
      hp: Object.freeze({ current: currentResource(state?.resources?.hpCurrent, hpMaximum), maximum: hpMaximum }),
      pm: Object.freeze({ current: currentResource(state?.resources?.pmCurrent, pmMaximum), maximum: pmMaximum }),
    });
  }

  return {
    number,
    clamp,
    knownTalents,
    enabledConditionalTalents,
    hasCore,
    currentCore,
    attributeValue,
    currentResource,
    resourceSummary,
  };
});
