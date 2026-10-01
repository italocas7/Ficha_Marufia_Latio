(function initMarufiaSheetSlots(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_SHEET_SLOTS = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root.MARUFIA_APP_BRIDGE, root.LATIO_STORAGE));
})(typeof window !== "undefined" ? window : globalThis, function createSheetSlotsApi(root) {
  "use strict";

  const SLOTS_KEY = "marufia-sheet-slots-v1";
  const SLOT_LIMIT = 5;
  const GUEST_SCOPE = "guest";

  function accountScope(backendId, userId) {
    return `${String(backendId || "unconfigured")}|${String(userId || "")}`;
  }

  function sheetIdentity(snapshot) {
    return snapshot?.meta?.appId === "marufia-latio" && snapshot.meta.started
      ? String(snapshot.meta.createdAt || "") : "";
  }

  function sameSnapshot(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function readRegistry(storage) {
    try {
      const value = storage.loadLocal(SLOTS_KEY, null);
      if (value?.version === 1 && Array.isArray(value.slots)) return value;
    } catch {
      // A ficha ativa antiga continua acessível pelo espelho local.
    }
    return { version: 1, activeId: "", slots: [] };
  }

  function uniqueId(view = root) {
    return view?.crypto?.randomUUID?.() ?? `slot-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function createSlotStore(storage, bridge, view = root) {
    if (!storage?.loadLocal || !storage?.saveLocal || !bridge?.snapshot || !bridge?.applyRemoteSnapshot) {
      throw new Error("O armazenamento das fichas não está disponível.");
    }
    let registry = readRegistry(storage);

    function persist(next) {
      storage.saveLocal(SLOTS_KEY, next);
      registry = next;
      return true;
    }

    function announce(slot) {
      if (typeof view?.dispatchEvent === "function" && typeof view?.CustomEvent === "function") {
        view.dispatchEvent(new view.CustomEvent("marufia:sheet-switched", { detail: { slotId: slot?.id || "", characterId: slot?.remoteId || "" } }));
      }
    }

    function ensureMigrated() {
      const snapshot = bridge.snapshot();
      const identity = sheetIdentity(snapshot);
      if (!identity) return false;
      const existing = registry.slots.find((slot) => slot.id === registry.activeId);
      if (existing && sheetIdentity(existing.state) === identity) return true;
      const matching = registry.slots.find((slot) => sheetIdentity(slot.state) === identity);
      if (matching) return persist({ ...registry, activeId: matching.id });
      if (registry.slots.filter((slot) => slot.scope === GUEST_SCOPE).length >= SLOT_LIMIT) return false;
      const slot = { id: uniqueId(view), scope: GUEST_SCOPE, remoteId: "", state: snapshot, updatedAt: new Date().toISOString() };
      return persist({ ...registry, activeId: slot.id, slots: [...registry.slots, slot] });
    }

    function saveCurrent() {
      const snapshot = bridge.snapshot();
      if (!sheetIdentity(snapshot)) return true;
      if (!registry.activeId) ensureMigrated();
      const index = registry.slots.findIndex((slot) => slot.id === registry.activeId);
      if (index < 0) throw new Error("Não foi possível identificar a ficha aberta. Exporte um backup antes de trocar.");
      const slots = [...registry.slots];
      slots[index] = { ...slots[index], state: snapshot, updatedAt: new Date().toISOString() };
      return persist({ ...registry, slots });
    }

    function beforeSwitch() {
      if (bridge.flushCurrent && !bridge.flushCurrent()) throw new Error("A ficha atual não foi salva. A troca foi cancelada.");
      return saveCurrent();
    }

    function activate(slotId, options = {}) {
      const slot = registry.slots.find((item) => item.id === slotId);
      if (!slot) throw new Error("Ficha não encontrada neste aparelho.");
      if (!options.skipSave) beforeSwitch();
      const previous = registry;
      persist({ ...registry, activeId: slot.id });
      if (!bridge.applyRemoteSnapshot(slot.state)) {
        persist(previous);
        throw new Error("Não foi possível abrir a ficha neste aparelho. A ficha anterior foi preservada.");
      }
      announce(slot);
      return slot;
    }

    function add(snapshot, scope = GUEST_SCOPE, remoteId = "") {
      if (!sheetIdentity(snapshot)) throw new Error("A ficha nova é inválida.");
      if (registry.slots.filter((slot) => slot.scope === scope).length >= SLOT_LIMIT) throw new Error("Os cinco espaços de ficha estão ocupados.");
      beforeSwitch();
      const slot = { id: uniqueId(view), scope, remoteId, state: snapshot, updatedAt: new Date().toISOString() };
      persist({ ...registry, slots: [...registry.slots, slot] });
      try {
        return activate(slot.id, { skipSave: true });
      } catch (error) {
        persist({ ...registry, slots: registry.slots.filter((item) => item.id !== slot.id) });
        throw error;
      }
    }

    function upsertRemote(character, scope) {
      if (!character?.id || !sheetIdentity(character.state)) throw new Error("Ficha da conta inválida.");
      const existing = registry.slots.find((slot) => slot.remoteId === character.id && slot.scope === scope);
      if (existing) {
        beforeSwitch();
        const refreshed = registry.slots.find((slot) => slot.id === existing.id);
        if (refreshed && !sameSnapshot(refreshed.state, character.state)) {
          if (!bridge.backupSnapshot?.(refreshed.state, `Antes de atualizar ${refreshed.state.character?.name || "ficha"}`)) {
            throw new Error("Não foi possível guardar a versão local. A troca foi cancelada.");
          }
        }
        const slots = registry.slots.map((slot) => slot.id === existing.id
          ? { ...slot, state: character.state, updatedAt: new Date().toISOString() } : slot);
        persist({ ...registry, slots });
        return activate(existing.id, { skipSave: true });
      }
      return add(character.state, scope, character.id);
    }

    function linkSlot(slotId, scope, remoteId) {
      const slots = registry.slots.map((slot) => slot.id === slotId
        ? { ...slot, scope, remoteId: String(remoteId || "") } : slot);
      persist({ ...registry, slots });
      if (slotId === registry.activeId) announce(slots.find((slot) => slot.id === slotId));
      return true;
    }

    function linkActive(scope, remoteId) { return linkSlot(registry.activeId, scope, remoteId); }

    function backup(slotId) {
      const slot = registry.slots.find((item) => item.id === slotId);
      return Boolean(slot && bridge.backupSnapshot?.(slot.state, `Antes de excluir ${slot.state.character?.name || "ficha"}`));
    }

    function remove(slotId, options = {}) {
      const slot = registry.slots.find((item) => item.id === slotId);
      if (!slot) return false;
      if (registry.activeId === slotId && !options.skipSave) beforeSwitch();
      if (!options.backedUp && !backup(slotId)) {
        throw new Error("Não foi possível guardar o backup. A ficha não foi excluída.");
      }
      const remaining = registry.slots.filter((item) => item.id !== slotId);
      const nextId = registry.activeId === slotId ? "" : registry.activeId;
      const previous = registry;
      persist({ ...registry, activeId: nextId, slots: remaining });
      if (!nextId && bridge.resetBlank?.() === false) {
        persist(previous);
        throw new Error("Não foi possível fechar a ficha excluída neste aparelho.");
      }
      announce(remaining.find((item) => item.id === nextId));
      return true;
    }

    return Object.freeze({
      ensureMigrated, saveCurrent, beforeSwitch, activate, add, upsertRemote, linkSlot, linkActive, backup, remove,
      list: (scope) => registry.slots.filter((slot) => slot.scope === scope),
      all: () => [...registry.slots],
      active: () => registry.slots.find((slot) => slot.id === registry.activeId) ?? null,
      findRemote: (remoteId, scope) => registry.slots.find((slot) => slot.remoteId === remoteId && slot.scope === scope) ?? null,
    });
  }

  function init(document, bridge, storage) {
    if (!bridge || !storage || document.documentElement?.dataset?.sheetSlotsInitialized === "true") return null;
    document.documentElement.dataset.sheetSlotsInitialized = "true";
    const store = createSlotStore(storage, bridge, document.defaultView ?? root);
    store.ensureMigrated();
    const unsubscribe = bridge.onLocalSave?.(() => {
      try { store.saveCurrent(); } catch (error) { (document.defaultView ?? root)?.toast?.(error.message, "warn"); }
    });
    root.MARUFIA_SHEET_SLOTS_STORE = store;
    return Object.freeze({ store, destroy() { unsubscribe?.(); delete document.documentElement.dataset.sheetSlotsInitialized; } });
  }

  return { SLOTS_KEY, SLOT_LIMIT, GUEST_SCOPE, accountScope, sheetIdentity, readRegistry, createSlotStore, init };
});
