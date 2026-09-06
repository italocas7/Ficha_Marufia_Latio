(function initMarufiaCharacterSync(root, factory) {
  const retryTools = root?.MARUFIA_OFFLINE
    ?? (typeof module === "object" && module.exports ? require("./offline.js") : null);
  const api = factory(root, retryTools);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CHARACTER_SYNC = api;
  if (root?.document) Promise.resolve().then(() => api.init(
    root.document,
    root.MARUFIA_SUPABASE,
    root.MARUFIA_CHARACTERS,
    root.MARUFIA_CHARACTER_IMPORT,
    root.MARUFIA_CHARACTER_REALTIME,
    root.MARUFIA_APP_BRIDGE,
    root.LATIO_STORAGE,
    root.MARUFIA_ERRORS,
  ));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaCharacterSyncApi(root, retryTools) {
  "use strict";

  const REMOTE_SAVE_DEBOUNCE_MS = 1000;
  const SYNC_METADATA_KEY = "marufia-online-character-sync-v1";
  const OFFLINE_QUEUE_KEY = "marufia-online-pending-saves-v1";
  const CHARACTER_CONFLICT_EVENT = "marufia:character-conflict";
  const CHARACTER_CONFLICT_RESOLUTION_EVENT = "marufia:character-conflict-resolved";
  const SYNC_STATUS = Object.freeze({
    online: Object.freeze({ label: "Online", title: "Conta conectada; alterações da ficha vinculada podem ser salvas online." }),
    syncing: Object.freeze({ label: "Sincronizando", title: "Salvando as alterações da ficha online." }),
    offline: Object.freeze({ label: "Offline", title: "Sem conexão; alterações continuam salvas neste computador." }),
    unavailable: Object.freeze({ label: "Servidor indisponível", title: "Servidor de Marufia indisponível. As alterações estão salvas neste computador e serão sincronizadas automaticamente." }),
    error: Object.freeze({ label: "Erro de sincronização", title: "A ficha local está salva, mas a atualização online falhou." }),
  });

  function applySyncStatus(element, nextState) {
    const state = Object.hasOwn(SYNC_STATUS, nextState) ? nextState : "offline";
    const detail = SYNC_STATUS[state];
    if (!element) return state;
    element.dataset.syncState = state;
    element.title = detail.title;
    element.setAttribute?.("aria-label", `Sincronização: ${detail.label}`);
    const label = element.querySelector?.("[data-sync-status-label]");
    if (label) label.textContent = detail.label;
    return state;
  }

  function createSyncStatusController(element, accountButton, view = root ?? globalThis) {
    let authState = String(accountButton?.dataset?.authState ?? "loading");
    let syncActive = false;
    let syncFailed = false;
    let realtimeFailed = false;
    let serverUnavailable = false;

    function connected() {
      return String(accountButton?.dataset?.authState ?? "") === "online"
        && view?.navigator?.onLine !== false;
    }

    function refresh() {
      const nextAuthState = String(accountButton?.dataset?.authState ?? "loading");
      if (nextAuthState !== authState) {
        authState = nextAuthState;
        syncActive = false;
        syncFailed = false;
        realtimeFailed = false;
        serverUnavailable = false;
      }
      if (!connected()) return applySyncStatus(element, "offline");
      if (syncActive) return applySyncStatus(element, "syncing");
      if (serverUnavailable) return applySyncStatus(element, "unavailable");
      if (syncFailed || realtimeFailed) return applySyncStatus(element, "error");
      return applySyncStatus(element, "online");
    }

    const observer = typeof view?.MutationObserver === "function"
      ? new view.MutationObserver(refresh)
      : null;
    observer?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    view?.addEventListener?.("online", refresh);
    view?.addEventListener?.("offline", refresh);
    refresh();

    return Object.freeze({
      refresh,
      syncing() {
        syncActive = true;
        refresh();
      },
      success() {
        syncActive = false;
        syncFailed = false;
        serverUnavailable = false;
        refresh();
      },
      unavailable() {
        syncActive = false;
        syncFailed = false;
        serverUnavailable = true;
        refresh();
      },
      error() {
        syncActive = false;
        syncFailed = true;
        serverUnavailable = false;
        refresh();
      },
      realtimeSuccess() {
        realtimeFailed = false;
        refresh();
      },
      realtimeError() {
        realtimeFailed = true;
        refresh();
      },
      destroy() {
        observer?.disconnect?.();
        view?.removeEventListener?.("online", refresh);
        view?.removeEventListener?.("offline", refresh);
      },
    });
  }

  function stateSignature(state) {
    try {
      return JSON.stringify(state ?? null);
    } catch {
      return "";
    }
  }

  function stateContentSignature(state) {
    if (!state || typeof state !== "object") return stateSignature(state);
    const meta = state.meta && typeof state.meta === "object" ? { ...state.meta } : state.meta;
    if (meta && typeof meta === "object") delete meta.updatedAt;
    return stateSignature({ ...state, meta });
  }

  function syncMetadataId(userId, characterId, backendId = "") {
    return retryTools?.scopedIdentity?.(backendId, userId, characterId)
      ?? `${String(backendId ?? "").trim() ? `${String(backendId).trim()}|` : ""}${String(userId ?? "").trim()}|${String(characterId ?? "").trim()}`;
  }

  function readSyncMetadata(storage) {
    try {
      const value = storage?.loadLocal?.(SYNC_METADATA_KEY, {});
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function syncedCharacterMetadata(storage, userId, characterId, backendId = "") {
    const values = readSyncMetadata(storage);
    const value = values[syncMetadataId(userId, characterId, backendId)]
      ?? (retryTools?.allowsLegacyCloudRecords?.(backendId)
        ? values[syncMetadataId(userId, characterId)]
        : null);
    const revision = Number(value?.revision);
    if (!Number.isSafeInteger(revision) || revision < 1) return null;
    return Object.freeze({
      revision,
      updatedAt: String(value.updatedAt ?? ""),
      origin: String(value.origin ?? ""),
      stateSignature: String(value.stateSignature ?? ""),
    });
  }

  function rememberSyncedCharacter(storage, userId, character, backendId = "") {
    const revision = Number(character?.revision);
    if (!userId || !character?.id || !Number.isSafeInteger(revision) || revision < 1
      || typeof storage?.saveLocal !== "function") return false;
    try {
      const key = syncMetadataId(userId, character.id, backendId);
      storage.saveLocal(SYNC_METADATA_KEY, {
        ...readSyncMetadata(storage),
        [key]: {
          revision,
          updatedAt: String(character.updated_at ?? ""),
          origin: String(character.last_change_origin ?? ""),
          stateSignature: stateContentSignature(character.state),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  function readOfflineQueue(storage) {
    try {
      const value = storage?.loadLocal?.(OFFLINE_QUEUE_KEY, {});
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function pendingOfflineSave(storage, userId, characterId, backendId = "") {
    const values = readOfflineQueue(storage);
    const value = values[syncMetadataId(userId, characterId, backendId)]
      ?? (retryTools?.allowsLegacyCloudRecords?.(backendId)
        ? values[syncMetadataId(userId, characterId)]
        : null);
    if (!value || value.userId !== userId || value.characterId !== characterId
      || (String(value.backendId ?? "") !== String(backendId ?? "")
        && !(retryTools?.allowsLegacyCloudRecords?.(backendId) && !value.backendId))
      || value.state?.meta?.appId !== "marufia-latio"
      || Number(value.state?.meta?.schemaVersion) !== 5) return null;
    return Object.freeze({
      userId,
      characterId,
      backendId: String(backendId ?? ""),
      state: value.state,
      expectedRevision: Number.isSafeInteger(Number(value.expectedRevision)) && Number(value.expectedRevision) > 0
        ? Number(value.expectedRevision)
        : null,
      queuedAt: String(value.queuedAt ?? ""),
    });
  }

  function persistOfflineSave(storage, target, snapshot, now = () => new Date().toISOString()) {
    const userId = String(target?.userId ?? "");
    const characterId = String(target?.characterId ?? "");
    const backendId = String(target?.backendId ?? "");
    if (!userId || !characterId || snapshot?.meta?.appId !== "marufia-latio"
      || Number(snapshot?.meta?.schemaVersion) !== 5 || typeof storage?.saveLocal !== "function") return false;
    try {
      const key = syncMetadataId(userId, characterId, backendId);
      storage.saveLocal(OFFLINE_QUEUE_KEY, {
        ...readOfflineQueue(storage),
        [key]: {
          userId,
          characterId,
          backendId,
          state: snapshot,
          expectedRevision: Number.isSafeInteger(Number(target?.expectedRevision)) && Number(target.expectedRevision) > 0
            ? Number(target.expectedRevision)
            : null,
          queuedAt: now(),
        },
      });
      return true;
    } catch {
      return false;
    }
  }

  function removeOfflineSave(storage, userId, characterId, backendId = "") {
    if (!userId || !characterId || typeof storage?.saveLocal !== "function") return false;
    try {
      const key = syncMetadataId(userId, characterId, backendId);
      const queue = readOfflineQueue(storage);
      const legacyKey = syncMetadataId(userId, characterId);
      if (!Object.hasOwn(queue, key)
        && !(retryTools?.allowsLegacyCloudRecords?.(backendId) && Object.hasOwn(queue, legacyKey))) return true;
      delete queue[key];
      if (retryTools?.allowsLegacyCloudRecords?.(backendId)) delete queue[legacyKey];
      storage.saveLocal(OFFLINE_QUEUE_KEY, queue);
      return true;
    } catch {
      return false;
    }
  }

  function transientNetworkError(error) {
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    return detail.includes("fetch") || detail.includes("network") || detail.includes("offline")
      || detail.includes("timed out") || detail.includes("timeout")
      || detail.includes("não foi possível acessar");
  }

  function conflictError(error) {
    return error?.code === "LAT-CHARACTER-CONFLICT-001"
      || String(error?.code ?? "") === "40001"
      || /revision conflict/i.test(String(error?.message ?? ""));
  }

  function createRemoteSaveQueue({
    service,
    storage,
    resolveTarget,
    resolveCharacterId,
    onStart = () => {},
    onSuccess = () => {},
    onError = () => {},
    onConflict = () => {},
    onDeferred = () => {},
    isOnline = () => true,
    persistDeferred = () => false,
    clearDeferred = () => true,
  }) {
    const targetResolver = typeof resolveTarget === "function"
      ? resolveTarget
      : async (snapshot) => ({ characterId: await resolveCharacterId(snapshot), expectedRevision: null });
    if (typeof service?.saveState !== "function" || typeof storage?.saveRemote !== "function"
      || (typeof resolveTarget !== "function" && typeof resolveCharacterId !== "function")) {
      throw new Error("O salvamento remoto do personagem não está disponível.");
    }

    const adapter = Object.freeze({
      save: ({ characterId, state, expectedRevision }) => service.saveState(characterId, state, expectedRevision),
    });
    let pending = null;
    let active = null;
    let activeEntry = null;
    let activeTarget = null;
    let conflict = null;
    let destroyed = false;
    let lastError = null;
    let lastResult = null;

    function notify(listener, ...values) {
      try {
        listener(...values);
      } catch {
        // Indicadores opcionais nunca interferem na persistência.
      }
    }

    function registerConflict(snapshot, target, remote, error = null) {
      conflict = Object.freeze({
        characterId: String(target?.characterId ?? remote?.id ?? ""),
        userId: String(target?.userId ?? remote?.owner_id ?? ""),
        backendId: String(target?.backendId ?? ""),
        local: snapshot,
        remote: remote ?? null,
        error,
      });
      lastError = error ?? Object.assign(new Error("Conflito de revisão do personagem."), { code: "LAT-CHARACTER-CONFLICT-001" });
      persistDeferred(target, snapshot);
      notify(onConflict, conflict);
      return conflict;
    }

    async function loadConflict(snapshot, target, error) {
      let remote = target?.conflictRemote ?? null;
      if (!remote && target?.characterId && typeof service?.loadOwn === "function") {
        try {
          remote = await service.loadOwn(target.characterId);
        } catch {
          remote = null;
        }
      }
      return registerConflict(snapshot, target, remote, error);
    }

    async function drain() {
      while (pending && !destroyed) {
        const entry = pending;
        pending = null;
        const snapshot = entry.snapshot;
        try {
          const target = entry.target ?? await targetResolver(snapshot);
          if (!target?.characterId) continue;
          if (target.conflictRemote) {
            await loadConflict(snapshot, target, null);
            continue;
          }
          if (!isOnline()) {
            if (!persistDeferred(target, snapshot)) throw new Error("Não foi possível guardar a alteração offline.");
            lastError = null;
            notify(onDeferred, snapshot, target);
            continue;
          }
          activeEntry = entry;
          activeTarget = target;
          notify(onStart, snapshot, target.characterId);
          lastResult = await storage.saveRemote(adapter, {
            characterId: target.characterId,
            state: snapshot,
            expectedRevision: target.expectedRevision,
          });
          lastError = null;
          conflict = null;
          clearDeferred(target);
          notify(onSuccess, lastResult, target, snapshot);
        } catch (error) {
          if (conflictError(error)) await loadConflict(snapshot, activeTarget ?? entry.target ?? {}, error);
          else {
            lastError = error;
            const target = activeTarget ?? entry.target;
            if (target && transientNetworkError(error) && persistDeferred(target, snapshot)) {
              notify(onDeferred, snapshot, target);
            }
            notify(onError, error);
          }
        } finally {
          activeEntry = null;
          activeTarget = null;
        }
      }
    }

    function kick() {
      if (active || destroyed || !pending) return active ?? Promise.resolve(lastResult);
      active = drain().finally(() => {
        active = null;
        if (pending && !destroyed) void kick();
      });
      return active;
    }

    function enqueue(snapshot) {
      if (destroyed || !snapshot) return Promise.resolve(lastResult);
      if (conflict) {
        conflict = Object.freeze({ ...conflict, local: snapshot });
        persistDeferred({ characterId: conflict.characterId, userId: conflict.userId, backendId: conflict.backendId }, snapshot);
        notify(onConflict, conflict);
        return Promise.resolve(lastResult);
      }
      pending = { snapshot, target: null };
      return kick();
    }

    function registerRemoteConflict(snapshot, remote, userId = remote?.owner_id, backendId = "") {
      if (!snapshot || !remote?.id) return null;
      return registerConflict(snapshot, { characterId: remote.id, userId, backendId }, remote, null);
    }

    function matchesActiveRemote(remote) {
      if (!activeEntry?.snapshot || !activeTarget || !remote) return false;
      return remote.id === activeTarget.characterId
        && stateSignature(remote.state) === stateSignature(activeEntry.snapshot)
        && Number(remote.revision) === Number(activeTarget.expectedRevision) + 1;
    }

    function overwriteConflict() {
      if (destroyed || !conflict?.remote) return Promise.resolve(lastResult);
      const current = conflict;
      conflict = null;
      pending = {
        snapshot: current.local,
        target: {
          characterId: current.characterId,
          userId: current.userId,
          backendId: current.backendId,
          expectedRevision: current.remote.revision,
        },
      };
      return kick();
    }

    async function flush() {
      while (!destroyed && (active || pending)) await (active ?? kick());
      return lastResult;
    }

    return Object.freeze({
      enqueue,
      flush,
      registerRemoteConflict,
      matchesActiveRemote,
      overwriteConflict,
      currentConflict: () => conflict,
      lastError: () => lastError,
      destroy() {
        destroyed = true;
        pending = null;
        conflict = null;
      },
    });
  }

  function createRemoteSaveDebouncer(queue, options = {}) {
    if (typeof queue?.enqueue !== "function" || typeof queue?.flush !== "function") {
      throw new Error("A fila de salvamento remoto não está disponível.");
    }
    const delayMs = Number.isFinite(Number(options.delayMs)) && Number(options.delayMs) >= 0
      ? Number(options.delayMs)
      : REMOTE_SAVE_DEBOUNCE_MS;
    const setTimer = options.setTimer ?? root?.setTimeout ?? globalThis.setTimeout;
    const clearTimer = options.clearTimer ?? root?.clearTimeout ?? globalThis.clearTimeout;
    let timer = null;
    let latest = null;
    let active = Promise.resolve(null);
    let destroyed = false;

    function dispatch() {
      if (destroyed || !latest) return active;
      const snapshot = latest;
      latest = null;
      if (timer !== null) clearTimer(timer);
      timer = null;
      active = Promise.resolve(queue.enqueue(snapshot));
      return active;
    }

    function schedule(snapshot) {
      if (destroyed || !snapshot) return false;
      latest = snapshot;
      if (timer !== null) clearTimer(timer);
      timer = setTimer(() => {
        timer = null;
        void dispatch();
      }, delayMs);
      return true;
    }

    async function flush() {
      if (!destroyed && latest) await dispatch();
      else await active;
      return queue.flush();
    }

    return Object.freeze({
      schedule,
      flush,
      pending: () => Boolean(latest),
      discardPending() {
        const discarded = Boolean(latest);
        latest = null;
        if (timer !== null) clearTimer(timer);
        timer = null;
        return discarded;
      },
      destroy() {
        destroyed = true;
        latest = null;
        if (timer !== null) clearTimer(timer);
        timer = null;
        queue.destroy?.();
      },
    });
  }

  async function linkedCharacterId(accountButton, service, storage, importTools, snapshot, backendId = "") {
    if (accountButton?.dataset?.authState !== "online") return "";
    const identity = importTools?.localSheetIdentity?.(snapshot);
    if (!identity) return "";
    const userId = await service.currentUserId();
    return String(importTools.importedCharacterId?.(storage, userId, identity, backendId) ?? "");
  }

  async function linkedCharacterTarget(accountButton, service, storage, importTools, snapshot, options = {}) {
    if (accountButton?.dataset?.authState !== "online") return null;
    const identity = importTools?.localSheetIdentity?.(snapshot);
    if (!identity) return null;
    const userId = await service.currentUserId();
    const backendId = String(options.backendId ?? "");
    const characterId = String(importTools.importedCharacterId?.(storage, userId, identity, backendId) ?? "");
    if (!characterId) return null;
    let metadata = syncedCharacterMetadata(storage, userId, characterId, backendId);
    if (!metadata) {
      if (options.allowRemote === false) return { characterId, userId, backendId, expectedRevision: null };
      const remote = await service.loadOwn(characterId);
      if (stateContentSignature(remote.state) !== stateContentSignature(snapshot)) {
        return { characterId, userId, backendId, expectedRevision: remote.revision, conflictRemote: remote };
      }
      rememberSyncedCharacter(storage, userId, remote, backendId);
      metadata = syncedCharacterMetadata(storage, userId, characterId, backendId);
    }
    return { characterId, userId, backendId, expectedRevision: metadata?.revision ?? null };
  }

  function dispatchRemoteCharacterChange(view, change) {
    if (!change || typeof view?.dispatchEvent !== "function" || typeof view?.CustomEvent !== "function") return false;
    view.dispatchEvent(new view.CustomEvent("marufia:remote-character-updated", { detail: change }));
    return true;
  }

  function dispatchCharacterConflict(view, conflict) {
    if (!conflict || typeof view?.dispatchEvent !== "function" || typeof view?.CustomEvent !== "function") return false;
    view.dispatchEvent(new view.CustomEvent(CHARACTER_CONFLICT_EVENT, { detail: conflict }));
    return true;
  }

  function canApplyGmRemote(remote, local, metadata) {
    return Boolean(
      remote?.last_change_origin === "gm"
      && metadata
      && Number(remote.revision) > Number(metadata.revision)
      && stateContentSignature(local) === metadata.stateSignature
      && typeof remote.state === "object",
    );
  }

  function createRealtimeCoordinator({
    accountButton,
    service,
    appBridge,
    storage,
    importTools,
    realtimeService,
    queue,
    debouncer,
    statusController,
    errorTools,
    backendId = "",
    view,
  }) {
    let subscription = null;
    let characterId = "";
    let generation = 0;
    let destroyed = false;

    function setChannelState(status) {
      if (accountButton?.dataset) accountButton.dataset.realtimeState = String(status ?? "").toLowerCase();
    }

    function receiveRemoteChange(change) {
      dispatchRemoteCharacterChange(view, change);
      const remote = change?.character;
      const local = appBridge.snapshot?.();
      if (!remote || !local) return;
      const userId = remote.owner_id;
      const metadata = syncedCharacterMetadata(storage, userId, remote.id, backendId);
      if (metadata && metadata.revision >= remote.revision) return;
      if (queue?.matchesActiveRemote?.(remote) || stateContentSignature(remote.state) === stateContentSignature(local)) {
        rememberSyncedCharacter(storage, userId, remote, backendId);
        return;
      }
      if (canApplyGmRemote(remote, local, metadata) && appBridge.applyRemoteSnapshot?.(remote.state)) {
        debouncer?.discardPending?.();
        removeOfflineSave(storage, userId, remote.id, backendId);
        rememberSyncedCharacter(storage, userId, remote, backendId);
        statusController.realtimeSuccess?.();
        return;
      }
      queue?.registerRemoteConflict?.(local, remote, userId, backendId);
    }

    async function stopCurrent() {
      const current = subscription;
      subscription = null;
      characterId = "";
      if (current) {
        try {
          await current.unsubscribe();
        } catch {
          // A sessão local não depende do encerramento do canal remoto.
        }
      }
    }

    async function refresh() {
      const token = ++generation;
      if (destroyed || accountButton?.dataset?.authState !== "online") {
        await stopCurrent();
        setChannelState("closed");
        return;
      }
      try {
        const snapshot = appBridge.snapshot?.();
        const nextCharacterId = await linkedCharacterId(accountButton, service, storage, importTools, snapshot, backendId);
        if (destroyed || token !== generation) return;
        if (subscription && nextCharacterId === characterId) return;
        await stopCurrent();
        if (destroyed || token !== generation || !nextCharacterId) {
          setChannelState(nextCharacterId ? "closed" : "unlinked");
          return;
        }
        const local = appBridge.snapshot?.();
        if (local && typeof service.loadOwn === "function") {
          const userId = await service.currentUserId();
          if (!syncedCharacterMetadata(storage, userId, nextCharacterId, backendId)) {
            const remote = await service.loadOwn(nextCharacterId);
            if (stateContentSignature(remote.state) === stateContentSignature(local)) {
              rememberSyncedCharacter(storage, userId, remote, backendId);
            } else {
              queue?.registerRemoteConflict?.(local, remote, userId, backendId);
            }
          }
        }
        if (destroyed || token !== generation) return;
        characterId = nextCharacterId;
        subscription = realtimeService.subscribeToCharacter(
          nextCharacterId,
          receiveRemoteChange,
          (status) => {
            setChannelState(status);
            if (status === "SUBSCRIBED") statusController.realtimeSuccess?.();
            else if (["CHANNEL_ERROR", "TIMED_OUT", "INVALID_PAYLOAD"].includes(status)) {
              statusController.realtimeError?.();
              errorTools?.report?.(
                Object.assign(new Error("Falha do canal em tempo real."), { code: "LAT-REALTIME-CHANNEL-001" }),
                { scope: "realtime", operation: "subscribe", show: false },
                view,
              );
            }
          },
        );
      } catch (error) {
        if (!destroyed && accountButton?.dataset?.authState === "online") {
          setChannelState("channel_error");
          statusController.realtimeError?.();
          errorTools?.report?.(error, { scope: "realtime", operation: "subscribe", show: false }, view);
        }
      }
    }

    const observer = typeof view?.MutationObserver === "function"
      ? new view.MutationObserver(() => void refresh())
      : null;
    observer?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    const linkedEvent = importTools?.CHARACTER_LINKED_EVENT ?? "marufia:character-linked";
    const refreshLinked = () => void refresh();
    const refreshStorage = (event) => {
      if (event?.key === importTools?.IMPORT_MARKERS_KEY) void refresh();
    };
    view?.addEventListener?.(linkedEvent, refreshLinked);
    view?.addEventListener?.("storage", refreshStorage);
    void refresh();

    return Object.freeze({
      refresh,
      activeCharacterId: () => characterId,
      async destroy() {
        destroyed = true;
        generation += 1;
        observer?.disconnect?.();
        view?.removeEventListener?.(linkedEvent, refreshLinked);
        view?.removeEventListener?.("storage", refreshStorage);
        await stopCurrent();
        if (accountButton?.dataset) delete accountButton.dataset.realtimeState;
      },
    });
  }

  function init(document, supabaseTools, characterTools, importTools, realtimeTools, appBridge, storage, errorTools) {
    const accountButton = document.querySelector("#onlineAccountButton");
    const syncStatus = document.querySelector("#onlineSyncStatus");
    if (!accountButton || accountButton.dataset.characterSyncInitialized === "true"
      || typeof appBridge?.onLocalSave !== "function"
      || typeof characterTools?.createCharacterService !== "function"
      || typeof storage?.saveRemote !== "function") return null;

    let client;
    try {
      client = supabaseTools?.getSupabaseClient?.();
    } catch {
      client = null;
    }
    if (!client) return null;

    const view = document.defaultView ?? root ?? globalThis;
    const backendId = retryTools?.backendScope?.(view.MARUFIA_ONLINE_CONFIG) ?? "unconfigured";
    const onlineErrors = errorTools ?? view.MARUFIA_ERRORS;
    const statusController = createSyncStatusController(syncStatus, accountButton, view);
    const service = characterTools.createCharacterService(client, view.LATIO_STATE);
    let retryScheduler = null;
    const realtimeService = typeof realtimeTools?.createCharacterRealtimeService === "function"
      ? realtimeTools.createCharacterRealtimeService(client, characterTools)
      : null;
    const queue = createRemoteSaveQueue({
      service,
      storage,
      resolveTarget: (snapshot) => linkedCharacterTarget(
        accountButton,
        service,
        storage,
        importTools,
        snapshot,
        { allowRemote: view.navigator?.onLine !== false, backendId },
      ),
      onStart: () => statusController.syncing(),
      onSuccess: (character, target) => {
        rememberSyncedCharacter(storage, target.userId, character, target.backendId);
        retryScheduler?.success?.();
        statusController.success();
      },
      onError: (error) => {
        if (transientNetworkError(error)) {
          statusController.unavailable();
          onlineErrors?.report?.(error, { scope: "server", operation: "availability" }, view);
          retryScheduler?.schedule?.();
        } else {
          statusController.error();
          onlineErrors?.report?.(error, { scope: "sync", operation: "save" }, view);
        }
      },
      onConflict: (conflict) => {
        statusController.error();
        dispatchCharacterConflict(view, conflict);
      },
      onDeferred: () => statusController.refresh(),
      isOnline: () => view.navigator?.onLine !== false,
      persistDeferred: (target, snapshot) => persistOfflineSave(storage, target, snapshot),
      clearDeferred: (target) => removeOfflineSave(storage, target?.userId, target?.characterId, target?.backendId),
    });
    const debouncer = createRemoteSaveDebouncer(queue);
    const unsubscribe = appBridge.onLocalSave((snapshot) => {
      debouncer.schedule(snapshot);
    });
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") void debouncer.flush();
    };
    const flushWhenLeaving = () => {
      void debouncer.flush();
    };
    document.addEventListener("visibilitychange", flushWhenHidden);
    view.addEventListener?.("pagehide", flushWhenLeaving);
    const realtimeCoordinator = realtimeService
      ? createRealtimeCoordinator({
        accountButton,
        service,
        appBridge,
        storage,
        importTools,
        realtimeService,
        queue,
        debouncer,
        statusController,
        errorTools: onlineErrors,
        backendId,
        view,
      })
      : null;
    const resolveConflict = (event) => {
      if (event?.detail?.choice === "local") void queue.overwriteConflict();
    };
    view.addEventListener?.(CHARACTER_CONFLICT_RESOLUTION_EVENT, resolveConflict);
    let resumingOffline = false;
    const resumeOfflineSave = async () => {
      if (resumingOffline || view.navigator?.onLine === false || accountButton.dataset.authState !== "online") return false;
      resumingOffline = true;
      try {
        const snapshot = appBridge.snapshot?.();
        const identity = importTools?.localSheetIdentity?.(snapshot);
        if (!identity) return true;
        const userId = await service.currentUserId();
        const characterId = String(importTools.importedCharacterId?.(storage, userId, identity, backendId) ?? "");
        if (!characterId || !pendingOfflineSave(storage, userId, characterId, backendId)) return true;
        await queue.enqueue(snapshot);
        await queue.flush();
        if (queue.currentConflict?.()) return true;
        if (queue.lastError?.() && !transientNetworkError(queue.lastError())) return true;
        return !pendingOfflineSave(storage, userId, characterId, backendId);
      } catch (error) {
        if (transientNetworkError(error)) {
          statusController.unavailable();
          onlineErrors?.report?.(error, { scope: "server", operation: "availability" }, view);
          return false;
        }
        statusController.error();
        onlineErrors?.report?.(error, { scope: "sync", operation: "resume" }, view);
        return true;
      } finally {
        resumingOffline = false;
      }
    };
    retryScheduler = retryTools?.createRetryScheduler?.(resumeOfflineSave, {
      isReady: () => view.navigator?.onLine !== false && accountButton.dataset.authState === "online",
      setTimer: view.setTimeout?.bind?.(view),
      clearTimer: view.clearTimeout?.bind?.(view),
    }) ?? null;
    const resumeWhenOnline = () => void (retryScheduler?.wake?.() ?? resumeOfflineSave());
    const pauseWhenOffline = () => retryScheduler?.pause?.();
    view.addEventListener?.("online", resumeWhenOnline);
    view.addEventListener?.("offline", pauseWhenOffline);
    const resumeObserver = typeof view.MutationObserver === "function"
      ? new view.MutationObserver(resumeWhenOnline)
      : null;
    resumeObserver?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    void (retryScheduler?.wake?.() ?? resumeOfflineSave());
    accountButton.dataset.characterSyncInitialized = "true";

    return Object.freeze({
      queue,
      debouncer,
      service,
      statusController,
      realtimeCoordinator,
      retryScheduler,
      backendId,
      destroy() {
        unsubscribe?.();
        document.removeEventListener?.("visibilitychange", flushWhenHidden);
        view.removeEventListener?.("pagehide", flushWhenLeaving);
        view.removeEventListener?.(CHARACTER_CONFLICT_RESOLUTION_EVENT, resolveConflict);
        view.removeEventListener?.("online", resumeWhenOnline);
        view.removeEventListener?.("offline", pauseWhenOffline);
        resumeObserver?.disconnect?.();
        retryScheduler?.destroy?.();
        debouncer.destroy();
        void realtimeCoordinator?.destroy();
        statusController.destroy();
        delete accountButton.dataset.characterSyncInitialized;
      },
    });
  }

  return {
    REMOTE_SAVE_DEBOUNCE_MS,
    SYNC_METADATA_KEY,
    OFFLINE_QUEUE_KEY,
    CHARACTER_CONFLICT_EVENT,
    CHARACTER_CONFLICT_RESOLUTION_EVENT,
    SYNC_STATUS,
    applySyncStatus,
    createSyncStatusController,
    createRemoteSaveQueue,
    createRemoteSaveDebouncer,
    stateSignature,
    stateContentSignature,
    readSyncMetadata,
    syncedCharacterMetadata,
    rememberSyncedCharacter,
    readOfflineQueue,
    pendingOfflineSave,
    persistOfflineSave,
    removeOfflineSave,
    transientNetworkError,
    linkedCharacterId,
    linkedCharacterTarget,
    dispatchRemoteCharacterChange,
    dispatchCharacterConflict,
    canApplyGmRemote,
    createRealtimeCoordinator,
    init,
  };
});
