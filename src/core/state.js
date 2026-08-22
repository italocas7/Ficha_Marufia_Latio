(function initLatioState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LATIO_STATE = api;
})(typeof window !== "undefined" ? window : globalThis, function createLatioStateApi() {
  "use strict";

  const STATE_SCHEMA = Object.freeze({
    appId: "marufia-latio",
    currentVersion: 5,
    minimumSupportedVersion: 1,
    mediaType: "application/json",
  });
  const ONLINE_BACKUP_SCHEMA = Object.freeze({
    format: "marufia-online-character-backup",
    currentVersion: 1,
  });
  const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const VALID_ID = /^[A-Za-z0-9._:-]{1,128}$/;
  const COLLECTION_FIELDS = {
    weapons: new Set(["id", "type", "name", "damage", "weight", "property", "description", "ability"]),
    equipment: new Set(["id", "name", "category", "qty", "weight", "description"]),
    customArmors: new Set(["id", "name", "category", "description", "ca", "weight", "property", "block", "iconPreset", "iconColor", "custom"]),
    talents: new Set(["id", "name", "level", "enabled", "tag"]),
    abilities: new Set(["id", "name", "type", "uses", "target", "range", "resistance", "description", "notes"]),
    effects: new Set(["id", "name", "ca", "block"]),
    laws: new Set(["id", "sourceId", "category", "resistanceMode", "name", "target", "resistance", "effect", "fail", "pass", "edited"]),
    knownExtras: new Set(["id", "name", "type", "regionCode", "level"]),
    activeSpells: new Set(["id", "spellId", "type", "name", "level", "turns", "maintenanceCost", "caBonus", "effectiveVigor"]),
  };

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function cloneSafe(value, depth = 0) {
    if (depth > 30) throw new Error("Estrutura importada excede a profundidade permitida.");
    if (Array.isArray(value)) {
      if (value.length > 5000) throw new Error("Lista importada excede o limite permitido.");
      return value.map((item) => cloneSafe(item, depth + 1));
    }
    if (isPlainObject(value)) {
      const result = Object.create(null);
      for (const [key, item] of Object.entries(value)) {
        if (DANGEROUS_KEYS.has(key)) throw new Error(`Chave não permitida no JSON: ${key}.`);
        result[key] = cloneSafe(item, depth + 1);
      }
      return result;
    }
    if (typeof value === "string") return value.slice(0, 50000);
    if (["number", "boolean"].includes(typeof value) || value === null) return value;
    return undefined;
  }

  function mergeKnown(base, incoming, nonEmptyOnly = false) {
    if (Array.isArray(base)) {
      if (!Array.isArray(incoming)) return cloneSafe(base);
      if (nonEmptyOnly && !incoming.length) return cloneSafe(base);
      return cloneSafe(incoming);
    }
    if (isPlainObject(base)) {
      if (!isPlainObject(incoming)) return cloneSafe(base);
      const result = cloneSafe(base);
      for (const key of Object.keys(base)) {
        if (!Object.hasOwn(incoming, key)) continue;
        result[key] = mergeKnown(base[key], incoming[key], nonEmptyOnly);
      }
      return result;
    }
    if (incoming === undefined) return base;
    if (nonEmptyOnly && (incoming === null || incoming === "")) return base;
    if (typeof base === "number") return Number.isFinite(Number(incoming)) ? Number(incoming) : base;
    if (typeof base === "boolean") return typeof incoming === "boolean" ? incoming : base;
    if (typeof base === "string") return typeof incoming === "string" ? incoming : base;
    return cloneSafe(incoming);
  }

  function pickFields(item, fields) {
    if (!isPlainObject(item)) return null;
    const result = Object.create(null);
    for (const key of fields) {
      if (Object.hasOwn(item, key)) result[key] = cloneSafe(item[key]);
    }
    return result;
  }

  function normalizeCollection(items, name, mappings) {
    const fields = COLLECTION_FIELDS[name];
    const seen = new Set();
    let counter = 0;
    return (Array.isArray(items) ? items : []).map((raw) => {
      const item = pickFields(raw, fields);
      if (!item) return null;
      const oldId = String(item.id || "");
      let id = oldId;
      if (!VALID_ID.test(id) || seen.has(id)) {
        do {
          counter += 1;
          id = `imported-${name}-${counter}`;
        } while (seen.has(id));
      }
      if (oldId) mappings[name].set(oldId, id);
      item.id = id;
      seen.add(id);
      return item;
    }).filter(Boolean);
  }

  function normalizeStateCollections(state) {
    const mappings = Object.fromEntries(Object.keys(COLLECTION_FIELDS).map((name) => [name, new Map()]));
    state.inventory.weapons = normalizeCollection(state.inventory.weapons, "weapons", mappings);
    state.inventory.equipment = normalizeCollection(state.inventory.equipment, "equipment", mappings);
    state.inventory.customArmors = normalizeCollection(state.inventory.customArmors, "customArmors", mappings);
    state.talents = normalizeCollection(state.talents, "talents", mappings);
    state.abilities = normalizeCollection(state.abilities, "abilities", mappings);
    state.effects = normalizeCollection(state.effects, "effects", mappings);
    state.world.laws = normalizeCollection(state.world.laws, "laws", mappings);
    state.magic.knownExtras = normalizeCollection(state.magic.knownExtras, "knownExtras", mappings);
    state.combat.activeSpells = normalizeCollection(state.combat.activeSpells, "activeSpells", mappings);
    state.inventory.selectedWeaponId = mappings.weapons.get(state.inventory.selectedWeaponId) ||
      (state.inventory.weapons.some((item) => item.id === state.inventory.selectedWeaponId) ? state.inventory.selectedWeaponId : "");
    if (String(state.inventory.armorId ?? "").startsWith("custom:")) {
      const oldArmorId = String(state.inventory.armorId).slice("custom:".length);
      const nextArmorId = mappings.customArmors.get(oldArmorId) || oldArmorId;
      state.inventory.armorId = state.inventory.customArmors.some((armor) => armor.id === nextArmorId) ? `custom:${nextArmorId}` : "";
    }
    for (const spell of state.combat.activeSpells) {
      spell.spellId = mappings.knownExtras.get(spell.spellId) || spell.spellId;
    }
    return state;
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  }

  function migrateEscalarToAtletismo(state) {
    const skills = state?.skills;
    if (!isPlainObject(skills) || !isPlainObject(skills.Escalar)) return state;
    const source = skills.Escalar;
    const target = isPlainObject(skills.Atletismo)
      ? skills.Atletismo
      : { added: 0, checked: false, evolutions: [] };
    const sourceAdded = Number(source.added);
    const targetAdded = Number(target.added);
    target.added = (Number.isFinite(targetAdded) ? targetAdded : 0) + (Number.isFinite(sourceAdded) ? sourceAdded : 0);
    target.checked = Boolean(target.checked || source.checked);
    target.evolutions = [
      ...(Array.isArray(target.evolutions) ? target.evolutions : []),
      ...(Array.isArray(source.evolutions) ? source.evolutions : []),
    ];
    skills.Atletismo = target;
    delete skills.Escalar;
    return state;
  }

  function validateStateEnvelope(state, options) {
    if (!isPlainObject(state) || state.meta?.appId !== options.appId) {
      const error = new Error("O JSON não pertence à Ficha de Marufia (Latio).");
      error.code = "LAT-JSON-002";
      throw error;
    }
    const sourceVersion = Number(state.meta?.schemaVersion);
    if (!Number.isInteger(sourceVersion) || sourceVersion < STATE_SCHEMA.minimumSupportedVersion) {
      const error = new Error(`Versão de schema inválida: ${String(state.meta?.schemaVersion)}.`);
      error.code = "LAT-JSON-002";
      throw error;
    }
    if (sourceVersion > options.schemaVersion) {
      const error = new Error(`Versão futura não suportada: ${sourceVersion}.`);
      error.code = "LAT-JSON-003";
      throw error;
    }
    return sourceVersion;
  }

  function migrateState(state, sourceVersion) {
    if (sourceVersion === 1) {
      state.world ||= Object.create(null);
      state.world.status = state.world.active ? "active" : "closed";
      delete state.world.active;
    }
    if (sourceVersion <= 2) {
      state.world ||= Object.create(null);
      state.world.maintenancePaidForTurn = false;
      delete state.world.turns;
      if (Array.isArray(state.combat?.activeSpells)) {
        state.combat.activeSpells = state.combat.activeSpells.filter((spell) => spell?.type !== "Mundo");
      }
    }
    if (sourceVersion <= 4) {
      state.world ||= Object.create(null);
      state.world.durationTurns = null;
    }
    migrateEscalarToAtletismo(state);
    delete state.ui;
    return state;
  }

  function importSource(raw) {
    if (!isPlainObject(raw)) return { state: raw, sourceFormat: "local", onlineMetadata: null };
    if (raw.meta?.appId === STATE_SCHEMA.appId) {
      return { state: raw, sourceFormat: "local", onlineMetadata: null };
    }
    if (raw.format === ONLINE_BACKUP_SCHEMA.format) {
      const version = Number(raw.formatVersion);
      if (!Number.isInteger(version) || version < 1) {
        const error = new Error(`Versão de backup online inválida: ${String(raw.formatVersion)}.`);
        error.code = "LAT-JSON-002";
        throw error;
      }
      if (version > ONLINE_BACKUP_SCHEMA.currentVersion) {
        const error = new Error(`Versão futura de backup online não suportada: ${version}.`);
        error.code = "LAT-JSON-003";
        throw error;
      }
      if (!isPlainObject(raw.character) || !isPlainObject(raw.character.state)) {
        const error = new Error("O backup online não contém um estado de personagem válido.");
        error.code = "LAT-JSON-002";
        throw error;
      }
      return {
        state: raw.character.state,
        sourceFormat: "online-backup",
        onlineMetadata: isPlainObject(raw.online) ? raw.online : null,
      };
    }
    if (isPlainObject(raw.state) && raw.state.meta?.appId === STATE_SCHEMA.appId) {
      const declaredVersion = raw.schema_version == null ? Number(raw.state.meta?.schemaVersion) : Number(raw.schema_version);
      if (declaredVersion !== Number(raw.state.meta?.schemaVersion)) {
        const error = new Error("A versão declarada do personagem online não corresponde ao estado da ficha.");
        error.code = "LAT-JSON-002";
        throw error;
      }
      return {
        state: raw.state,
        sourceFormat: "online-row",
        onlineMetadata: {
          characterId: String(raw.id ?? ""),
          campaignId: raw.campaign_id == null ? null : String(raw.campaign_id),
          revision: Number.isSafeInteger(Number(raw.revision)) ? Number(raw.revision) : null,
          lastChangeOrigin: String(raw.last_change_origin ?? ""),
          updatedAt: String(raw.updated_at ?? ""),
        },
      };
    }
    return { state: raw, sourceFormat: "local", onlineMetadata: null };
  }

  function createOnlineBackup(state, metadata = {}, exportedAt = new Date().toISOString()) {
    const safe = cloneSafe(state);
    if (!isPlainObject(safe) || safe.meta?.appId !== STATE_SCHEMA.appId
      || !Number.isInteger(Number(safe.meta?.schemaVersion))) {
      const error = new Error("O estado atual não pode ser incluído em um backup online.");
      error.code = "LAT-JSON-002";
      throw error;
    }
    const revision = Number(metadata?.revision);
    const origin = String(metadata?.lastChangeOrigin ?? metadata?.last_change_origin ?? "");
    return {
      format: ONLINE_BACKUP_SCHEMA.format,
      formatVersion: ONLINE_BACKUP_SCHEMA.currentVersion,
      exportedAt: String(exportedAt ?? ""),
      character: {
        name: String(safe.character?.name ?? ""),
        schemaVersion: Number(safe.meta.schemaVersion),
        state: safe,
      },
      online: {
        characterId: String(metadata?.characterId ?? metadata?.id ?? "") || null,
        campaignId: metadata?.campaignId == null && metadata?.campaign_id == null
          ? null
          : String(metadata?.campaignId ?? metadata?.campaign_id),
        revision: Number.isSafeInteger(revision) && revision > 0 ? revision : null,
        lastChangeOrigin: ["player", "gm", "system"].includes(origin) ? origin : null,
        updatedAt: String(metadata?.updatedAt ?? metadata?.updated_at ?? "") || null,
      },
    };
  }

  function normalizeDomain(state, appId, schemaVersion) {
    state.meta.appId = appId;
    state.meta.schemaVersion = schemaVersion;
    state.character.level = clampNumber(state.character.level, 1, 20, 1);
    state.character.useIntForSkillPoints = Boolean(state.character.useIntForSkillPoints);
    state.settings.skillLimit = clampNumber(state.settings.skillLimit, 1, 999, 70);
    state.settings.theme = ["light", "dark"].includes(state.settings.theme) ? state.settings.theme : "light";
    state.settings.gmOverride = Boolean(state.settings.gmOverride);
    for (const key of Object.keys(state.attributes)) {
      state.attributes[key] = clampNumber(state.attributes[key], 0, 999, 0);
    }
    for (const key of ["hpCurrent", "pmCurrent"]) {
      const value = state.resources[key];
      state.resources[key] = value === null || value === "" ? null : clampNumber(value, 0, 1_000_000, 0);
    }
    for (const key of ["hpMaxBonus", "pmMaxBonus"]) {
      state.resources[key] = clampNumber(state.resources[key], -1_000_000, 1_000_000, 0);
    }
    for (const skill of Object.values(state.skills ?? {})) {
      if (!isPlainObject(skill)) continue;
      skill.added = clampNumber(skill.added, 0, 999, 0);
      skill.checked = Boolean(skill.checked);
      skill.evolutions = (Array.isArray(skill.evolutions) ? skill.evolutions : []).slice(0, 100).map((evolution) => ({
        value: clampNumber(evolution?.value, 0, 10, 0),
      }));
    }
    for (const key of Object.keys(state.magic.baseLevels)) {
      state.magic.baseLevels[key] = clampNumber(state.magic.baseLevels[key], 0, 10, 0);
    }
    state.magic.extraAptitudes = clampNumber(state.magic.extraAptitudes, 0, 100_000, 0);
    state.skillExtraPoints = clampNumber(state.skillExtraPoints, 0, 1_000_000, 0);
    for (const coin of Object.keys(state.inventory.money ?? {})) {
      state.inventory.money[coin] = clampNumber(state.inventory.money[coin], 0, 1_000_000_000, 0);
    }
    const noteLimits = { traits: 1000, ideal: 1000, flaws: 1000, bonds: 1000, appearance: 1000, history: 5000, allies: 1000, patron: 1000, other: 5000 };
    for (const [key, limit] of Object.entries(noteLimits)) if (state.notes) state.notes[key] = String(state.notes[key] ?? "").slice(0, limit);
    for (const key of ["eyes", "age", "height", "hair", "skin", "weight"]) if (state.notes) state.notes[key] = String(state.notes[key] ?? "").slice(0, 250);
    const status = state.world.status;
    state.world.status = ["closed", "active", "collapsed"].includes(status) ? status : "closed";
    const durationTurns = state.world.durationTurns;
    state.world.durationTurns = state.world.status === "active" && durationTurns !== null && durationTurns !== ""
      ? clampNumber(durationTurns, 1, 999, 1)
      : null;
    state.world.lawUses = state.world.lawUses === null ? null : clampNumber(state.world.lawUses, 0, 999, 0);
    state.world.maintenancePaidForTurn = state.world.status === "active" && Boolean(state.world.maintenancePaidForTurn);
    state.errors = (Array.isArray(state.errors) ? state.errors : []).slice(0, 120).map((error) => ({
      code: String(error?.code ?? "LAT-INI-001").slice(0, 32),
      module: String(error?.module ?? "Sistema").slice(0, 100),
      severity: ["INFO", "AVISO", "ERRO", "CRÍTICO"].includes(error?.severity) ? error.severity : "ERRO",
      userMessage: String(error?.userMessage ?? "Erro importado.").slice(0, 1000),
      technicalDetail: String(error?.technicalDetail ?? "").slice(0, 5000),
      suggestedSolution: String(error?.suggestedSolution ?? "").slice(0, 1000),
      at: String(error?.at ?? "").slice(0, 64),
    }));
    normalizeStateCollections(state);
    for (const spell of state.combat.activeSpells) {
      if (Object.hasOwn(spell, "caBonus")) spell.caBonus = clampNumber(spell.caBonus, 0, 999, 0);
      if (Object.hasOwn(spell, "effectiveVigor")) spell.effectiveVigor = clampNumber(spell.effectiveVigor, 0, 999, 0);
    }
    return state;
  }

  function prepareImport(raw, defaults, options) {
    const source = importSource(cloneSafe(raw));
    const safe = source.state;
    const sourceVersion = validateStateEnvelope(safe, options);
    migrateState(safe, sourceVersion);
    const state = normalizeDomain(mergeKnown(defaults, safe), options.appId, options.schemaVersion);
    return {
      state,
      incoming: safe,
      sourceVersion,
      migrated: sourceVersion !== options.schemaVersion,
      sourceFormat: source.sourceFormat,
      onlineMetadata: source.onlineMetadata,
    };
  }

  function mergeImported(current, incoming, defaults, options) {
    const merged = mergeKnown(current, incoming, true);
    return normalizeDomain(mergeKnown(defaults, merged), options.appId, options.schemaVersion);
  }

  function persistentPayload(state) {
    return cloneSafe(state);
  }

  return {
    STATE_SCHEMA,
    ONLINE_BACKUP_SCHEMA,
    cloneSafe,
    mergeKnown,
    validateStateEnvelope,
    migrateState,
    importSource,
    createOnlineBackup,
    prepareImport,
    mergeImported,
    persistentPayload,
    normalizeDomain,
  };
});
