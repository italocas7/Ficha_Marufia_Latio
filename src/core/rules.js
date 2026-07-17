(function initLatioRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LATIO_RULES = api;
})(typeof window !== "undefined" ? window : globalThis, function createLatioRulesApi() {
  "use strict";

  const APTITUDE_BASE_COSTS = Object.freeze({ Fina: 1, Impacto: 1, Densa: 1, Etérea: 2, Forte: 2, Mundo: 3 });

  function number(value, fallback = 0) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, number(value, min)));
  }

  function magicCost(amount, heartCore = false) {
    const value = Math.max(0, Math.floor(number(amount, 0)));
    if (!value) return 0;
    return heartCore ? Math.max(1, Math.floor(value / 2)) : value;
  }

  function aptitudeBaseCost(type) {
    return APTITUDE_BASE_COSTS[type] ?? 1;
  }

  function aptitudeCost(type, level) {
    const base = aptitudeBaseCost(type);
    if (level <= 5) return base;
    if (level <= 9) return base + 1;
    return base + 2;
  }

  function aptitudeUpgradeCost(type, fromLevel, toLevel = number(fromLevel, 0) + 1, freeFirstLevel = false) {
    let total = 0;
    const start = clamp(fromLevel, 0, 10);
    const end = clamp(toLevel, 0, 10);
    for (let level = start + 1; level <= end; level += 1) {
      if (freeFirstLevel && level === 1) continue;
      total += aptitudeCost(type, level);
    }
    return total;
  }

  function spellAptitudeCost(type, level, freeFirstLevel = false) {
    return aptitudeUpgradeCost(type, 0, level, freeFirstLevel);
  }

  function calculateMaxHp({ con, level, robustAcquiredLevel = null, manualBonus = 0 }) {
    const safeCon = number(con, 0);
    const safeLevel = Math.max(1, number(level, 1));
    let hp = Math.floor(safeCon / 10) + 12;
    hp += (safeLevel - 1) * (Math.floor(safeCon / 10) + 3);
    if (robustAcquiredLevel !== null && robustAcquiredLevel !== undefined) {
      const countedLevels = Math.max(0, safeLevel - number(robustAcquiredLevel, safeLevel) + 1);
      hp += countedLevels * Math.floor(safeCon / 8);
    }
    return Math.max(1, hp + number(manualBonus, 0));
  }

  function calculateMaxPm({ pod, level, umbilicusCore = false, talentBonus = 0, permanentPenalty = 0, manualBonus = 0 }) {
    const safePod = number(pod, 0);
    const safeLevel = Math.max(1, number(level, 1));
    let pm = Math.floor(safePod / 3) + (safeLevel - 1) * Math.floor(safePod / 10);
    if (umbilicusCore) pm += 10 + (4 * Math.max(0, safeLevel - 1));
    pm += number(talentBonus, 0) - number(permanentPenalty, 0) + number(manualBonus, 0);
    return Math.max(0, pm);
  }

  function worldCosts(level, heartCore = false) {
    const safeLevel = clamp(level, 0, 10);
    const activation = safeLevel >= 10 ? 20 : safeLevel >= 5 ? 10 + Math.max(0, safeLevel - 5) * 2 : 5 + Math.max(0, safeLevel - 1);
    const maintenance = safeLevel >= 10 ? 6 : safeLevel >= 5 ? 4 + Math.floor(Math.max(0, safeLevel - 5) / 2) : 2 + Math.floor(Math.max(0, safeLevel - 1) / 2);
    return { activation: magicCost(activation, heartCore), maintenance: magicCost(maintenance, heartCore) };
  }

  function coreRestBonus(hours) {
    return 2 * Math.max(1, Math.floor(number(hours, 1)));
  }

  function validateSkillAllocation({ finalValue, limit, spent, budget, gmOverride = false }) {
    if (gmOverride) return { valid: true, reason: "gm-override" };
    if (number(finalValue, 0) > number(limit, 70)) return { valid: false, reason: "limit" };
    if (number(spent, 0) > number(budget, 0)) return { valid: false, reason: "budget" };
    return { valid: true, reason: "ok" };
  }

  function validateWorldAction({ status, action, lawCount = 0, lawUses = 0 }) {
    const active = status === "active";
    if (action === "open") return active ? { valid: false, reason: "already-active" } : { valid: true, reason: "ok" };
    if (!active) return { valid: false, reason: "not-active" };
    if (action === "law" && number(lawCount, 0) <= 0) return { valid: false, reason: "missing-law" };
    if (action === "law" && number(lawUses, 0) <= 0) return { valid: false, reason: "no-law-uses" };
    return { valid: true, reason: "ok" };
  }

  return {
    magicCost,
    aptitudeBaseCost,
    aptitudeCost,
    aptitudeUpgradeCost,
    spellAptitudeCost,
    calculateMaxHp,
    calculateMaxPm,
    worldCosts,
    coreRestBonus,
    validateSkillAllocation,
    validateWorldAction,
  };
});
