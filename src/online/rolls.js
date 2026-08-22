(function initMarufiaOnlineRolls(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_ONLINE_ROLLS = api;
  if (root?.document) Promise.resolve().then(() => api.init(
    root.document,
    root.MARUFIA_SUPABASE,
    root.MARUFIA_CHARACTER_IMPORT,
    root.MARUFIA_APP_BRIDGE,
    root.LATIO_STORAGE,
  ));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaOnlineRollsApi(root) {
  "use strict";

  const PENDING_ROLLS_KEY = "marufia-online-pending-rolls-v1";
  const ROLL_RECORDED_EVENT = "marufia:roll-recorded";
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const D100_TYPES = new Set(["skill", "attribute", "combat"]);
  const D100_OUTCOMES = new Set(["Crítico natural", "Extremo", "Bom/Sólido", "Normal", "Falha"]);
  const REQUESTED_VISIBILITIES = new Set(["public", "secret"]);
  const STORED_VISIBILITIES = new Set(["public", "gm", "secret"]);

  function rollError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.userMessage = message;
    return error;
  }

  function normalizeUuid(value, label) {
    const id = String(value ?? "").trim().toLowerCase();
    if (!UUID_PATTERN.test(id)) throw rollError("LAT-ROLL-ID-001", `${label} inválido.`);
    return id;
  }

  function integer(value, label, allowNull = false) {
    if (allowNull && (value === null || value === undefined)) return null;
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < -2147483648 || result > 2147483647) {
      throw rollError("LAT-ROLL-PAYLOAD-001", `${label} inválido.`);
    }
    return result;
  }

  function normalizeRollDraft(value) {
    const rollType = String(value?.rollType ?? "");
    const mode = String(value?.mode ?? "");
    const formula = String(value?.formula ?? "");
    const rawRoll = Array.isArray(value?.rawRoll)
      ? value.rawRoll.map((item) => integer(item, "Dado"))
      : [];
    const modifier = integer(value?.modifier, "Modificador");
    const target = integer(value?.target, "Valor-alvo", true);
    const total = integer(value?.total, "Total");
    const skillName = value?.skillName === null || value?.skillName === undefined
      ? null
      : String(value.skillName).trim();
    const outcome = value?.outcome === null || value?.outcome === undefined
      ? null
      : String(value.outcome);

    if (!rawRoll.length) throw rollError("LAT-ROLL-PAYLOAD-001", "A rolagem não contém dados.");
    if (D100_TYPES.has(rollType)) {
      if (!skillName || skillName.length > 120 || !D100_OUTCOMES.has(outcome) || target === null || modifier !== 0) {
        throw rollError("LAT-ROLL-PAYLOAD-001", "O teste d100 é inválido.");
      }
      const expectedCount = mode === "normal" ? 1 : ["adv", "dis"].includes(mode) ? 2 : 0;
      const expectedFormula = mode === "normal" ? "1d100" : "2d100";
      if (!expectedCount || formula !== expectedFormula || rawRoll.length !== expectedCount
        || rawRoll.some((item) => item < 1 || item > 100)) {
        throw rollError("LAT-ROLL-PAYLOAD-001", "Os dados do teste d100 são inválidos.");
      }
      const expectedTotal = mode === "dis" ? Math.max(...rawRoll) : Math.min(...rawRoll);
      if (total !== expectedTotal) throw rollError("LAT-ROLL-PAYLOAD-001", "O resultado do teste d100 não corresponde aos dados.");
    } else if (rollType === "world_duration") {
      const expectedModifier = formula === "1d4+2" ? 2 : formula === "1d4" ? 0 : null;
      if (skillName !== null || mode !== "normal" || expectedModifier === null || modifier !== expectedModifier
        || target !== null || outcome !== null || rawRoll.length !== 1 || rawRoll[0] < 1 || rawRoll[0] > 4
        || total !== rawRoll[0] + modifier) {
        throw rollError("LAT-ROLL-PAYLOAD-001", "A duração rolada para o Mundo é inválida.");
      }
    } else if (rollType === "core_damage_reduction") {
      if (skillName !== null || mode !== "normal" || formula !== "1d6" || modifier !== 0
        || target !== null || outcome !== null || rawRoll.length !== 1 || rawRoll[0] < 1 || rawRoll[0] > 6
        || total !== rawRoll[0]) {
        throw rollError("LAT-ROLL-PAYLOAD-001", "A redução rolada pelo Núcleo é inválida.");
      }
    } else {
      throw rollError("LAT-ROLL-PAYLOAD-001", "Tipo de rolagem inválido.");
    }

    return Object.freeze({
      rollType,
      skillName,
      mode,
      formula,
      rawRoll: Object.freeze(rawRoll),
      modifier,
      target,
      total,
      outcome,
    });
  }

  function normalizeRequestedVisibility(value = "public") {
    const visibility = String(value ?? "").trim().toLowerCase();
    if (!REQUESTED_VISIBILITIES.has(visibility)) {
      throw rollError("LAT-ROLL-VISIBILITY-001", "Visibilidade de rolagem inválida.");
    }
    return visibility;
  }

  function normalizeStoredVisibility(value) {
    const visibility = String(value ?? "").trim().toLowerCase();
    if (!STORED_VISIBILITIES.has(visibility)) {
      throw rollError("LAT-ROLL-DATA-001", "O servidor devolveu uma visibilidade de rolagem inválida.");
    }
    return visibility;
  }

  function friendlyRollMessage(error) {
    if (error?.userMessage) return error.userMessage;
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (detail.includes("character campaign required") || detail.includes("p0002")) {
      return "Esta rolagem não pertence a uma campanha e continuará somente na ficha local.";
    }
    if (detail.includes("22023") || detail.includes("23505") || detail.includes("invalid roll")) {
      return "O servidor recusou um registro de rolagem inválido.";
    }
    if (detail.includes("jwt") || detail.includes("authentication") || detail.includes("42501")) {
      return "Sua sessão não permite registrar esta rolagem agora.";
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("offline")) {
      return "A rolagem continuará na fila até a conexão voltar.";
    }
    return "Não foi possível registrar a rolagem agora.";
  }

  function randomUuid(cryptoApi = root?.crypto ?? globalThis.crypto) {
    const id = cryptoApi?.randomUUID?.();
    return normalizeUuid(id, "Rolagem");
  }

  function createRollService(client, cryptoApi = root?.crypto ?? globalThis.crypto) {
    if (typeof client?.rpc !== "function" || typeof client?.auth?.getSession !== "function") {
      throw rollError("LAT-ROLL-CLIENT-001", "O serviço de rolagens não está disponível.");
    }

    async function currentUserId() {
      const result = await client.auth.getSession();
      if (result.error) throw rollError("LAT-ROLL-SESSION-001", friendlyRollMessage(result.error));
      const userId = result.data?.session?.user?.id;
      if (!userId) throw rollError("LAT-ROLL-SESSION-002", "Sua sessão expirou.");
      return normalizeUuid(userId, "Usuário");
    }

    async function record(characterId, draft, rollId = randomUuid(cryptoApi), requestedVisibility = "public") {
      const id = normalizeUuid(rollId, "Rolagem");
      const targetCharacterId = normalizeUuid(characterId, "Personagem");
      const userId = await currentUserId();
      const roll = normalizeRollDraft(draft);
      const visibility = normalizeRequestedVisibility(requestedVisibility);
      const result = await client.rpc("record_roll", {
        p_roll_id: id,
        p_character_id: targetCharacterId,
        p_roll_type: roll.rollType,
        p_skill_name: roll.skillName,
        p_mode: roll.mode,
        p_formula: roll.formula,
        p_raw_roll: [...roll.rawRoll],
        p_modifier: roll.modifier,
        p_target: roll.target,
        p_total: roll.total,
        p_outcome: roll.outcome,
        p_visibility: visibility,
      });
      if (result.error) {
        const detail = `${result.error.code ?? ""} ${result.error.message ?? ""}`.toLowerCase();
        const code = detail.includes("p0002") || detail.includes("character campaign required")
          ? "LAT-ROLL-CAMPAIGN-001"
          : detail.includes("22023") || detail.includes("23505")
            ? "LAT-ROLL-PAYLOAD-001"
            : "LAT-ROLL-SAVE-001";
        throw rollError(code, friendlyRollMessage(result.error));
      }
      const recordedId = normalizeUuid(result.data?.id, "Registro");
      const storedVisibility = normalizeStoredVisibility(result.data?.visibility);
      if (recordedId !== id) {
        throw rollError("LAT-ROLL-DATA-001", "O servidor devolveu um registro de rolagem inválido.");
      }
      return Object.freeze({ id, characterId: targetCharacterId, userId, ...roll, visibility: storedVisibility });
    }

    return Object.freeze({ currentUserId, record });
  }

  function readPendingRolls(storage) {
    try {
      const value = storage?.loadLocal?.(PENDING_ROLLS_KEY, []);
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function persistPendingRoll(storage, target, draft, rollId, now = () => new Date().toISOString(), visibility = "public") {
    if (!target?.userId || !target?.characterId || typeof storage?.saveLocal !== "function") return null;
    const entry = {
      id: normalizeUuid(rollId, "Rolagem"),
      userId: normalizeUuid(target.userId, "Usuário"),
      characterId: normalizeUuid(target.characterId, "Personagem"),
      roll: normalizeRollDraft(draft),
      visibility: normalizeRequestedVisibility(visibility),
      queuedAt: now(),
    };
    try {
      const current = readPendingRolls(storage).filter((item) => item?.id !== entry.id);
      storage.saveLocal(PENDING_ROLLS_KEY, [...current, entry]);
      return Object.freeze(entry);
    } catch {
      return null;
    }
  }

  function removePendingRoll(storage, rollId) {
    if (typeof storage?.saveLocal !== "function") return false;
    try {
      const current = readPendingRolls(storage);
      const next = current.filter((item) => item?.id !== rollId);
      if (next.length === current.length) return false;
      storage.saveLocal(PENDING_ROLLS_KEY, next);
      return true;
    } catch {
      return false;
    }
  }

  function terminalRollError(error) {
    return ["LAT-ROLL-CAMPAIGN-001", "LAT-ROLL-PAYLOAD-001", "LAT-ROLL-ID-001"].includes(error?.code);
  }

  function createRollQueue({ service, storage, resolveTarget, isOnline = () => true, cryptoApi, onSuccess, onError } = {}) {
    if (typeof service?.record !== "function" || typeof resolveTarget !== "function") {
      throw rollError("LAT-ROLL-QUEUE-001", "A fila de rolagens não está disponível.");
    }
    let active = null;
    let destroyed = false;

    async function flush() {
      if (active) return active;
      if (destroyed || !isOnline()) return false;
      active = (async () => {
        const target = await resolveTarget();
        if (!target) return false;
        let completed = false;
        let halted = false;
        while (!halted) {
          const entries = readPendingRolls(storage).filter((entry) => (
            entry?.userId === target.userId && entry?.characterId === target.characterId
          ));
          if (!entries.length) break;
          for (const entry of entries) {
            try {
              const result = await service.record(
                entry.characterId,
                entry.roll,
                entry.id,
                normalizeRequestedVisibility(entry.visibility ?? "public"),
              );
              removePendingRoll(storage, entry.id);
              onSuccess?.(result);
              completed = true;
            } catch (error) {
              onError?.(error, entry);
              if (terminalRollError(error)) {
                removePendingRoll(storage, entry.id);
                continue;
              }
              halted = true;
              break;
            }
          }
        }
        return completed;
      })().finally(() => {
        active = null;
      });
      return active;
    }

    async function enqueue(draft, visibility = "public") {
      if (destroyed) return null;
      const target = await resolveTarget();
      if (!target) return null;
      const entry = persistPendingRoll(storage, target, draft, randomUuid(cryptoApi), undefined, visibility);
      if (!entry) return null;
      if (isOnline()) await flush();
      return entry;
    }

    return Object.freeze({
      enqueue,
      flush,
      pending: () => readPendingRolls(storage),
      destroy() {
        destroyed = true;
      },
    });
  }

  function dispatchRollRecorded(view, result) {
    if (!result || typeof view?.dispatchEvent !== "function" || typeof view?.CustomEvent !== "function") return false;
    view.dispatchEvent(new view.CustomEvent(ROLL_RECORDED_EVENT, { detail: result }));
    return true;
  }

  function init(document, supabaseTools, importTools, appBridge, storage) {
    const accountButton = document.querySelector("#onlineAccountButton");
    if (!accountButton || accountButton.dataset.rollRegistrationInitialized === "true"
      || typeof appBridge?.onRoll !== "function"
      || typeof importTools?.localSheetIdentity !== "function"
      || typeof storage?.saveLocal !== "function") return null;
    let client;
    try {
      client = supabaseTools?.getSupabaseClient?.();
    } catch {
      client = null;
    }
    if (!client) return null;

    const view = document.defaultView ?? root ?? globalThis;
    const service = createRollService(client, view.crypto);
    const resolveTarget = async () => {
      if (accountButton.dataset.authState !== "online") return null;
      const snapshot = appBridge.snapshot?.();
      const identity = importTools.localSheetIdentity(snapshot);
      if (!identity) return null;
      const userId = await service.currentUserId();
      const characterId = String(importTools.importedCharacterId?.(storage, userId, identity) ?? "");
      return characterId ? { userId, characterId } : null;
    };
    const queue = createRollQueue({
      service,
      storage,
      resolveTarget,
      isOnline: () => view.navigator?.onLine !== false,
      cryptoApi: view.crypto,
      onSuccess: (result) => dispatchRollRecorded(view, result),
    });
    const unsubscribe = appBridge.onRoll((draft) => {
      void queue.enqueue(draft).catch(() => {});
    });
    const flush = () => void queue.flush().catch(() => {});
    view.addEventListener?.("online", flush);
    const observer = typeof view.MutationObserver === "function" ? new view.MutationObserver(flush) : null;
    observer?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    accountButton.dataset.rollRegistrationInitialized = "true";
    flush();

    return Object.freeze({
      service,
      queue,
      destroy() {
        unsubscribe?.();
        observer?.disconnect?.();
        view.removeEventListener?.("online", flush);
        queue.destroy();
        delete accountButton.dataset.rollRegistrationInitialized;
      },
    });
  }

  return {
    PENDING_ROLLS_KEY,
    ROLL_RECORDED_EVENT,
    UUID_PATTERN,
    normalizeRollDraft,
    normalizeRequestedVisibility,
    normalizeStoredVisibility,
    friendlyRollMessage,
    randomUuid,
    createRollService,
    readPendingRolls,
    persistPendingRoll,
    removePendingRoll,
    terminalRollError,
    createRollQueue,
    dispatchRollRecorded,
    init,
  };
});
