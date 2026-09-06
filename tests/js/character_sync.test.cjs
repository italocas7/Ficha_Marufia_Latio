const assert = require("node:assert/strict");
const test = require("node:test");

const syncTools = require("../../src/online/character_sync.js");
const importTools = require("../../src/online/character_import.js");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CHARACTER_ID = "22222222-2222-4222-8222-222222222222";

function snapshot(name) {
  return {
    meta: {
      appId: "marufia-latio",
      schemaVersion: 5,
      started: true,
      createdAt: "2026-08-20T12:00:00.000Z",
    },
    character: { name },
  };
}

function remoteRecord(name = "Arthur", revision = 1, overrides = {}) {
  return {
    id: CHARACTER_ID,
    owner_id: USER_ID,
    campaign_id: null,
    name,
    state: snapshot(name),
    schema_version: 5,
    revision,
    last_change_origin: "player",
    created_at: "2026-08-20T10:00:00Z",
    updated_at: `2026-08-20T10:0${revision}:00Z`,
    ...overrides,
  };
}

function markerStorage() {
  const values = new Map();
  return {
    loadLocal(key, fallback) { return values.has(key) ? values.get(key) : fallback; },
    saveLocal(key, value) { values.set(key, value); return true; },
  };
}

function fakeTimers() {
  let sequence = 0;
  const pending = new Map();
  const delays = [];
  return {
    pending,
    delays,
    set(callback, delay) {
      sequence += 1;
      pending.set(sequence, callback);
      delays.push(delay);
      return sequence;
    },
    clear(id) { pending.delete(id); },
    runLatest() {
      const entry = Array.from(pending.entries()).at(-1);
      if (!entry) return false;
      pending.delete(entry[0]);
      entry[1]();
      return true;
    },
  };
}

function fakeStatusElement() {
  const label = { textContent: "" };
  const attributes = new Map();
  return {
    label,
    attributes,
    dataset: {},
    title: "",
    setAttribute(name, value) { attributes.set(name, String(value)); },
    querySelector(selector) { return selector === "[data-sync-status-label]" ? label : null; },
  };
}

test("renders all synchronization states with accessible labels", () => {
  const element = fakeStatusElement();
  for (const [state, label] of [
    ["online", "Online"],
    ["syncing", "Sincronizando"],
    ["offline", "Offline"],
    ["unavailable", "Servidor indisponível"],
    ["error", "Erro de sincronização"],
  ]) {
    assert.equal(syncTools.applySyncStatus(element, state), state);
    assert.equal(element.dataset.syncState, state);
    assert.equal(element.label.textContent, label);
    assert.equal(element.attributes.get("aria-label"), `Sincronização: ${label}`);
    assert.ok(element.title);
  }
});

test("keeps connection, activity, and failure states distinct", () => {
  const element = fakeStatusElement();
  const accountButton = { dataset: { authState: "loading" } };
  const events = new Map();
  const observers = [];
  class FakeMutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() {}
  }
  const view = {
    navigator: { onLine: true },
    MutationObserver: FakeMutationObserver,
    addEventListener(name, listener) { events.set(name, listener); },
    removeEventListener(name) { events.delete(name); },
  };
  const controller = syncTools.createSyncStatusController(element, accountButton, view);
  assert.equal(element.dataset.syncState, "offline");

  accountButton.dataset.authState = "online";
  observers[0].callback();
  assert.equal(element.dataset.syncState, "online");
  controller.syncing();
  assert.equal(element.dataset.syncState, "syncing");
  controller.error();
  assert.equal(element.dataset.syncState, "error");
  controller.realtimeSuccess();
  assert.equal(element.dataset.syncState, "error", "O canal não pode ocultar uma falha de gravação.");

  view.navigator.onLine = false;
  events.get("offline")();
  assert.equal(element.dataset.syncState, "offline");
  view.navigator.onLine = true;
  events.get("online")();
  assert.equal(element.dataset.syncState, "error");
  controller.success();
  assert.equal(element.dataset.syncState, "online");
  controller.unavailable();
  assert.equal(element.dataset.syncState, "unavailable");
  assert.match(element.title, /sincronizadas automaticamente/i);
  controller.success();
  assert.equal(element.dataset.syncState, "online");
  controller.realtimeError();
  assert.equal(element.dataset.syncState, "error");
  controller.success();
  assert.equal(element.dataset.syncState, "error", "Uma gravação não pode ocultar uma falha do canal.");
  controller.realtimeSuccess();
  assert.equal(element.dataset.syncState, "online");

  accountButton.dataset.authState = "offline";
  observers[0].callback();
  assert.equal(element.dataset.syncState, "offline");
  controller.destroy();
  assert.equal(events.size, 0);
});

test("resolves a remote character only for the connected account and linked local sheet", async () => {
  const storage = markerStorage();
  const identity = importTools.localSheetIdentity(snapshot("Arthur"));
  importTools.markImported(storage, USER_ID, identity, CHARACTER_ID);
  let sessionChecks = 0;
  const service = { async currentUserId() { sessionChecks += 1; return USER_ID; } };
  const accountButton = { dataset: { authState: "online" } };

  assert.equal(await syncTools.linkedCharacterId(accountButton, service, storage, importTools, snapshot("Arthur")), CHARACTER_ID);
  accountButton.dataset.authState = "offline";
  assert.equal(await syncTools.linkedCharacterId(accountButton, service, storage, importTools, snapshot("Arthur")), "");
  assert.equal(sessionChecks, 1);
});

test("stores conflict metadata outside the schema v5 character document", () => {
  const storage = markerStorage();
  assert.equal(syncTools.rememberSyncedCharacter(storage, USER_ID, remoteRecord("Arthur", 3)), true);
  assert.deepEqual(
    JSON.parse(JSON.stringify(syncTools.syncedCharacterMetadata(storage, USER_ID, CHARACTER_ID))),
    {
      revision: 3,
      updatedAt: "2026-08-20T10:03:00Z",
      origin: "player",
      stateSignature: JSON.stringify(snapshot("Arthur")),
    },
  );
  assert.equal(Object.hasOwn(snapshot("Arthur").meta, "revision"), false);
});

test("applies a gm revision automatically only while the player copy is unchanged", () => {
  const local = { ...snapshot("Arthur"), meta: { ...snapshot("Arthur").meta, updatedAt: "2026-08-20T12:01:00Z" } };
  const metadata = {
    revision: 3,
    stateSignature: syncTools.stateContentSignature({ ...local, meta: { ...local.meta, updatedAt: "2026-08-20T12:00:00Z" } }),
  };
  const gmRemote = remoteRecord("Arthur", 4, {
    last_change_origin: "gm",
    state: { ...local, resources: { hpCurrent: 29 } },
  });
  assert.equal(syncTools.canApplyGmRemote(gmRemote, local, metadata), true);
  assert.equal(syncTools.canApplyGmRemote(gmRemote, snapshot("Edição local"), metadata), false);
  assert.equal(syncTools.canApplyGmRemote({ ...gmRemote, last_change_origin: "player" }, local, metadata), false);
  assert.equal(syncTools.canApplyGmRemote(gmRemote, local, null), false);
});

test("discards a delayed player save after applying a newer gm revision", async () => {
  const storage = markerStorage();
  const local = { ...snapshot("Arthur"), resources: { pmCurrent: 20 } };
  const remote = remoteRecord("Arthur", 4, {
    last_change_origin: "gm",
    state: { ...local, resources: { pmCurrent: 7 } },
  });
  syncTools.rememberSyncedCharacter(storage, USER_ID, remoteRecord("Arthur", 3, { state: local }));

  const timers = fakeTimers();
  const saved = [];
  const queue = syncTools.createRemoteSaveQueue({
    service: {
      async saveState(_characterId, state) {
        saved.push(state.resources.pmCurrent);
        return remoteRecord("Arthur", 5, { state });
      },
    },
    storage: { async saveRemote(adapter, request) { return adapter.save(request); } },
    resolveTarget: async () => ({ characterId: CHARACTER_ID, userId: USER_ID, expectedRevision: 4 }),
  });
  const debouncer = syncTools.createRemoteSaveDebouncer(queue, {
    delayMs: 1000,
    setTimer: timers.set,
    clearTimer: timers.clear,
  });
  debouncer.schedule(local);

  let realtimeChange;
  let applied = local;
  const coordinator = syncTools.createRealtimeCoordinator({
    accountButton: { dataset: { authState: "online" } },
    service: { async currentUserId() { return USER_ID; } },
    appBridge: {
      snapshot: () => applied,
      applyRemoteSnapshot(next) { applied = next; return true; },
    },
    storage,
    importTools: {
      IMPORT_MARKERS_KEY: "markers",
      localSheetIdentity: () => "sheet",
      importedCharacterId: () => CHARACTER_ID,
    },
    realtimeService: {
      subscribeToCharacter(_characterId, onChange) {
        realtimeChange = onChange;
        return { async unsubscribe() { return "ok"; } };
      },
    },
    queue,
    debouncer,
    statusController: {},
    view: { addEventListener() {}, removeEventListener() {} },
  });
  await coordinator.refresh();
  realtimeChange({ event: "UPDATE", character: remote });

  assert.equal(applied.resources.pmCurrent, 7);
  assert.equal(debouncer.pending(), false);
  assert.equal(timers.runLatest(), false);
  await debouncer.flush();
  assert.deepEqual(saved, []);
  assert.equal(syncTools.syncedCharacterMetadata(storage, USER_ID, CHARACTER_ID).revision, 4);
  await coordinator.destroy();
  debouncer.destroy();
});

test("persists only the newest offline save per account and character", () => {
  const storage = markerStorage();
  const target = { userId: USER_ID, characterId: CHARACTER_ID, expectedRevision: 3 };
  assert.equal(syncTools.persistOfflineSave(storage, target, snapshot("Offline A"), () => "2026-08-20T11:00:00Z"), true);
  assert.equal(syncTools.persistOfflineSave(storage, target, snapshot("Offline B"), () => "2026-08-20T11:01:00Z"), true);
  const queued = syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID);
  assert.equal(queued.state.character.name, "Offline B");
  assert.equal(queued.expectedRevision, 3);
  assert.equal(queued.queuedAt, "2026-08-20T11:01:00Z");
  assert.equal(Object.keys(syncTools.readOfflineQueue(storage)).length, 1);
  assert.equal(syncTools.removeOfflineSave(storage, USER_ID, CHARACTER_ID), true);
  assert.equal(syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID), null);
});

test("loads the initial remote revision and flags a divergent linked sheet", async () => {
  const storage = markerStorage();
  const identity = importTools.localSheetIdentity(snapshot("Local"));
  importTools.markImported(storage, USER_ID, identity, CHARACTER_ID);
  const service = {
    async currentUserId() { return USER_ID; },
    async loadOwn() { return remoteRecord("Online", 4, { last_change_origin: "gm" }); },
  };
  const target = await syncTools.linkedCharacterTarget(
    { dataset: { authState: "online" } }, service, storage, importTools, snapshot("Local"),
  );
  assert.equal(target.expectedRevision, 4);
  assert.equal(target.conflictRemote.name, "Online");
  assert.equal(syncTools.syncedCharacterMetadata(storage, USER_ID, CHARACTER_ID), null);
});

test("saves through the storage facade using only the linked character and current state", async () => {
  const calls = [];
  const service = {
    async saveState(characterId, state) {
      calls.push({ characterId, state });
      return { id: characterId, state };
    },
  };
  const storage = {
    async saveRemote(adapter, request) { return adapter.save(request); },
  };
  const queue = syncTools.createRemoteSaveQueue({ service, storage, resolveCharacterId: async () => CHARACTER_ID });
  await queue.enqueue(snapshot("Arthur"));
  await queue.flush();
  assert.deepEqual(calls, [{ characterId: CHARACTER_ID, state: snapshot("Arthur") }]);
  assert.equal(queue.lastError(), null);
});

test("keeps only the newest pending snapshot while a remote save is active", async () => {
  const names = [];
  let releaseFirst;
  const firstPending = new Promise((resolve) => { releaseFirst = resolve; });
  const service = {
    async saveState(_characterId, state) {
      names.push(state.character.name);
      if (names.length === 1) await firstPending;
      return state;
    },
  };
  const storage = { async saveRemote(adapter, request) { return adapter.save(request); } };
  const queue = syncTools.createRemoteSaveQueue({ service, storage, resolveCharacterId: async () => CHARACTER_ID });

  void queue.enqueue(snapshot("Primeiro"));
  await new Promise((resolve) => setImmediate(resolve));
  void queue.enqueue(snapshot("Intermediário"));
  void queue.enqueue(snapshot("Mais recente"));
  releaseFirst();
  await queue.flush();
  assert.deepEqual(names, ["Primeiro", "Mais recente"]);
});

test("keeps remote failures isolated and accepts a later local save", async () => {
  let fail = true;
  const failure = new Error("offline");
  const saved = [];
  const service = {
    async saveState(_characterId, state) {
      if (fail) throw failure;
      saved.push(state.character.name);
      return state;
    },
  };
  const storage = { async saveRemote(adapter, request) { return adapter.save(request); } };
  const queue = syncTools.createRemoteSaveQueue({ service, storage, resolveCharacterId: async () => CHARACTER_ID });

  await queue.enqueue(snapshot("Sem rede"));
  assert.equal(queue.lastError(), failure);
  fail = false;
  await queue.enqueue(snapshot("Nova tentativa"));
  await queue.flush();
  assert.deepEqual(saved, ["Nova tentativa"]);
  assert.equal(queue.lastError(), null);
});

test("reports remote activity, success, and failure without changing queue behavior", async () => {
  const events = [];
  let fail = false;
  const service = {
    async saveState(_characterId, state) {
      if (fail) throw new Error("falhou");
      return state;
    },
  };
  const storage = { async saveRemote(adapter, request) { return adapter.save(request); } };
  const queue = syncTools.createRemoteSaveQueue({
    service,
    storage,
    resolveCharacterId: async () => CHARACTER_ID,
    onStart: () => events.push("syncing"),
    onSuccess: () => events.push("online"),
    onError: () => events.push("error"),
  });

  await queue.enqueue(snapshot("Sucesso"));
  fail = true;
  await queue.enqueue(snapshot("Falha"));
  assert.deepEqual(events, ["syncing", "online", "syncing", "error"]);
});

test("blocks a stale revision and overwrites only after an explicit local choice", async () => {
  const calls = [];
  let stale = true;
  const service = {
    async saveState(characterId, state, expectedRevision) {
      calls.push({ characterId, name: state.character.name, expectedRevision });
      if (stale) {
        stale = false;
        throw Object.assign(new Error("preservado"), { code: "LAT-CHARACTER-CONFLICT-001" });
      }
      return remoteRecord(state.character.name, expectedRevision + 1);
    },
    async loadOwn() { return remoteRecord("Online concorrente", 2, { last_change_origin: "gm" }); },
  };
  const conflicts = [];
  const storage = { async saveRemote(adapter, request) { return adapter.save(request); } };
  const queue = syncTools.createRemoteSaveQueue({
    service,
    storage,
    resolveTarget: async () => ({ characterId: CHARACTER_ID, userId: USER_ID, expectedRevision: 1 }),
    onConflict: (conflict) => conflicts.push(conflict),
  });

  await queue.enqueue(snapshot("Local preservado"));
  await queue.flush();
  assert.equal(calls.length, 1);
  assert.equal(queue.currentConflict().remote.name, "Online concorrente");
  assert.equal(conflicts.length, 1);

  await queue.overwriteConflict();
  await queue.flush();
  assert.deepEqual(calls.map((call) => call.expectedRevision), [1, 2]);
  assert.equal(queue.currentConflict(), null);
  assert.equal(queue.lastError(), null);
});

test("defers while offline and sends only the latest state after reconnection", async () => {
  const localStorage = markerStorage();
  const calls = [];
  let online = false;
  const storage = {
    ...localStorage,
    async saveRemote(adapter, request) { return adapter.save(request); },
  };
  const target = { characterId: CHARACTER_ID, userId: USER_ID, expectedRevision: 5 };
  const queue = syncTools.createRemoteSaveQueue({
    service: {
      async saveState(characterId, state, expectedRevision) {
        calls.push({ characterId, name: state.character.name, expectedRevision });
        return remoteRecord(state.character.name, expectedRevision + 1);
      },
    },
    storage,
    resolveTarget: async () => target,
    isOnline: () => online,
    persistDeferred: (nextTarget, state) => syncTools.persistOfflineSave(storage, nextTarget, state),
    clearDeferred: (nextTarget) => syncTools.removeOfflineSave(storage, nextTarget.userId, nextTarget.characterId),
  });

  await queue.enqueue(snapshot("Primeira offline"));
  await queue.enqueue(snapshot("Mais recente offline"));
  await queue.flush();
  assert.deepEqual(calls, []);
  assert.equal(syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID).state.character.name, "Mais recente offline");

  queue.destroy();
  online = true;
  const resumedQueue = syncTools.createRemoteSaveQueue({
    service: {
      async saveState(characterId, state, expectedRevision) {
        calls.push({ characterId, name: state.character.name, expectedRevision });
        return remoteRecord(state.character.name, expectedRevision + 1);
      },
    },
    storage,
    resolveTarget: async () => target,
    isOnline: () => online,
    persistDeferred: (nextTarget, state) => syncTools.persistOfflineSave(storage, nextTarget, state),
    clearDeferred: (nextTarget) => syncTools.removeOfflineSave(storage, nextTarget.userId, nextTarget.characterId),
  });
  await resumedQueue.enqueue(syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID).state);
  await resumedQueue.flush();
  assert.deepEqual(calls, [{ characterId: CHARACTER_ID, name: "Mais recente offline", expectedRevision: 5 }]);
  assert.equal(syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID), null);
});

test("isolates revision metadata and pending saves between Cloud and self-hosted", () => {
  const storage = markerStorage();
  const cloud = "cloud@https://project.supabase.co";
  const selfHosted = "selfhosted@https://api.marufiarpg.org";
  syncTools.rememberSyncedCharacter(storage, USER_ID, remoteRecord("Cloud", 4), cloud);
  syncTools.rememberSyncedCharacter(storage, USER_ID, remoteRecord("Local", 2), selfHosted);
  assert.equal(syncTools.syncedCharacterMetadata(storage, USER_ID, CHARACTER_ID, cloud).revision, 4);
  assert.equal(syncTools.syncedCharacterMetadata(storage, USER_ID, CHARACTER_ID, selfHosted).revision, 2);

  syncTools.persistOfflineSave(storage, {
    userId: USER_ID,
    characterId: CHARACTER_ID,
    backendId: selfHosted,
    expectedRevision: 2,
  }, snapshot("Somente servidor próprio"));
  assert.equal(syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID, cloud), null);
  assert.equal(
    syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID, selfHosted).state.character.name,
    "Somente servidor próprio",
  );

  const legacyStorage = markerStorage();
  syncTools.persistOfflineSave(legacyStorage, {
    userId: USER_ID,
    characterId: CHARACTER_ID,
    expectedRevision: 7,
  }, snapshot("Fila Cloud anterior"));
  assert.equal(
    syncTools.pendingOfflineSave(legacyStorage, USER_ID, CHARACTER_ID, cloud).state.character.name,
    "Fila Cloud anterior",
  );
  assert.equal(syncTools.pendingOfflineSave(legacyStorage, USER_ID, CHARACTER_ID, selfHosted), null);
  assert.equal(syncTools.removeOfflineSave(legacyStorage, USER_ID, CHARACTER_ID, cloud), true);
  assert.equal(syncTools.pendingOfflineSave(legacyStorage, USER_ID, CHARACTER_ID, cloud), null);
});

test("keeps a transient network failure in the persistent queue", async () => {
  const localStorage = markerStorage();
  const storage = {
    ...localStorage,
    async saveRemote(adapter, request) { return adapter.save(request); },
  };
  const target = { characterId: CHARACTER_ID, userId: USER_ID, expectedRevision: 2 };
  const queue = syncTools.createRemoteSaveQueue({
    service: { async saveState() { throw Object.assign(new Error("fetch failed"), { code: "NETWORK" }); } },
    storage,
    resolveTarget: async () => target,
    persistDeferred: (nextTarget, state) => syncTools.persistOfflineSave(storage, nextTarget, state),
  });
  await queue.enqueue(snapshot("Rede instável"));
  await queue.flush();
  assert.equal(syncTools.pendingOfflineSave(storage, USER_ID, CHARACTER_ID).state.character.name, "Rede instável");
  assert.equal(syncTools.transientNetworkError(queue.lastError()), true);
  assert.equal(syncTools.transientNetworkError(Object.assign(
    new Error("Não foi possível acessar seus personagens agora. A ficha local continua disponível."),
    { code: "LAT-CHARACTER-SAVE-001" },
  )), true);
});

test("waits one second and collapses a burst into the newest remote snapshot", async () => {
  const timers = fakeTimers();
  const saved = [];
  const queue = {
    async enqueue(state) { saved.push(state.character.name); return state; },
    async flush() { return saved.at(-1) ?? null; },
  };
  const debouncer = syncTools.createRemoteSaveDebouncer(queue, {
    setTimer: timers.set,
    clearTimer: timers.clear,
  });

  assert.equal(debouncer.schedule(snapshot("A")), true);
  assert.equal(debouncer.schedule(snapshot("Ar")), true);
  assert.equal(debouncer.schedule(snapshot("Arthur")), true);
  assert.equal(saved.length, 0);
  assert.equal(timers.pending.size, 1);
  assert.deepEqual(timers.delays, [syncTools.REMOTE_SAVE_DEBOUNCE_MS, syncTools.REMOTE_SAVE_DEBOUNCE_MS, syncTools.REMOTE_SAVE_DEBOUNCE_MS]);
  assert.equal(timers.runLatest(), true);
  await debouncer.flush();
  assert.deepEqual(saved, ["Arthur"]);
  assert.equal(debouncer.pending(), false);
});

test("flushes a pending debounce immediately when requested", async () => {
  const timers = fakeTimers();
  const saved = [];
  const queue = {
    async enqueue(state) { saved.push(state.character.name); return state; },
    async flush() { return saved.at(-1) ?? null; },
  };
  const debouncer = syncTools.createRemoteSaveDebouncer(queue, {
    setTimer: timers.set,
    clearTimer: timers.clear,
  });

  debouncer.schedule(snapshot("Saída segura"));
  await debouncer.flush();
  assert.deepEqual(saved, ["Saída segura"]);
  assert.equal(timers.pending.size, 0);
});

test("wires hidden-page and page-exit flushes without blocking local saves", async () => {
  const accountButton = { dataset: { authState: "online" } };
  const documentListeners = new Map();
  const viewListeners = new Map();
  const view = {
    LATIO_STATE: {},
    addEventListener(name, listener) { viewListeners.set(name, listener); },
    removeEventListener(name) { viewListeners.delete(name); },
  };
  const document = {
    defaultView: view,
    visibilityState: "visible",
    querySelector(selector) { return selector === "#onlineAccountButton" ? accountButton : null; },
    addEventListener(name, listener) { documentListeners.set(name, listener); },
    removeEventListener(name) { documentListeners.delete(name); },
  };
  let localSaveListener = null;
  let unsubscribed = false;
  const appBridge = {
    onLocalSave(listener) {
      localSaveListener = listener;
      return () => { unsubscribed = true; };
    },
  };
  const saved = [];
  const service = {
    async currentUserId() { return USER_ID; },
    async loadOwn() { return remoteRecord("Oculta", 1); },
    async saveState(_characterId, state, expectedRevision) {
      saved.push(state.character.name);
      return remoteRecord(state.character.name, Number(expectedRevision ?? 1) + 1);
    },
  };
  const storage = {
    ...markerStorage(),
    async saveRemote(adapter, request) { return adapter.save(request); },
  };
  const importApi = {
    localSheetIdentity: () => "sheet",
    importedCharacterId: () => CHARACTER_ID,
  };
  const instance = syncTools.init(
    document,
    { getSupabaseClient: () => ({}) },
    { createCharacterService: () => service },
    importApi,
    null,
    appBridge,
    storage,
  );

  localSaveListener(snapshot("Oculta"));
  assert.deepEqual(saved, []);
  document.visibilityState = "hidden";
  documentListeners.get("visibilitychange")();
  await instance.debouncer.flush();
  assert.deepEqual(saved, ["Oculta"]);

  localSaveListener(snapshot("Saindo"));
  viewListeners.get("pagehide")();
  await instance.debouncer.flush();
  assert.deepEqual(saved, ["Oculta", "Saindo"]);
  instance.destroy();
  assert.equal(unsubscribed, true);
  assert.equal(documentListeners.has("visibilitychange"), false);
  assert.equal(viewListeners.has("pagehide"), false);
});

test("opens one realtime channel for the linked character and emits validated remote changes", async () => {
  const accountButton = { dataset: { authState: "offline" } };
  const listeners = new Map();
  const emitted = [];
  const observers = [];
  class FakeMutationObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() {}
  }
  class FakeCustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  const view = {
    MutationObserver: FakeMutationObserver,
    CustomEvent: FakeCustomEvent,
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name) { listeners.delete(name); },
    dispatchEvent(event) { emitted.push(event); return true; },
  };
  let changeListener = null;
  let statusListener = null;
  let unsubscribeCount = 0;
  const remoteConflicts = [];
  const realtimeService = {
    subscribeToCharacter(characterId, onChange, onStatus) {
      assert.equal(characterId, CHARACTER_ID);
      changeListener = onChange;
      statusListener = onStatus;
      onStatus("SUBSCRIBED");
      return {
        async unsubscribe() { unsubscribeCount += 1; return "ok"; },
      };
    },
  };
  const statusEvents = [];
  const coordinator = syncTools.createRealtimeCoordinator({
    accountButton,
    service: { async currentUserId() { return USER_ID; } },
    appBridge: { snapshot: () => snapshot("Arthur") },
    storage: {},
    importTools: {
      IMPORT_MARKERS_KEY: "markers",
      CHARACTER_LINKED_EVENT: "marufia:character-linked",
      localSheetIdentity: () => "sheet",
      importedCharacterId: () => CHARACTER_ID,
    },
    realtimeService,
    queue: {
      matchesActiveRemote() { return false; },
      registerRemoteConflict(local, remote) { remoteConflicts.push({ local, remote }); },
    },
    statusController: {
      realtimeSuccess() { statusEvents.push("online"); },
      realtimeError() { statusEvents.push("error"); },
    },
    view,
  });

  accountButton.dataset.authState = "online";
  await coordinator.refresh();
  assert.equal(coordinator.activeCharacterId(), CHARACTER_ID);
  assert.equal(accountButton.dataset.realtimeState, "subscribed");
  assert.deepEqual(statusEvents, ["online"]);

  const change = { event: "UPDATE", character: remoteRecord("Remoto", 2, { last_change_origin: "gm" }) };
  changeListener(change);
  assert.equal(emitted[0].type, "marufia:remote-character-updated");
  assert.equal(emitted[0].detail, change);
  assert.equal(remoteConflicts.length, 1);
  assert.equal(remoteConflicts[0].remote.last_change_origin, "gm");
  statusListener("CHANNEL_ERROR");
  assert.equal(accountButton.dataset.realtimeState, "channel_error");
  assert.deepEqual(statusEvents, ["online", "error"]);

  accountButton.dataset.authState = "offline";
  await coordinator.refresh();
  assert.equal(unsubscribeCount, 1);
  assert.equal(accountButton.dataset.realtimeState, "closed");
  await coordinator.destroy();
  assert.equal(listeners.size, 0);
  assert.equal(Object.hasOwn(accountButton.dataset, "realtimeState"), false);
  assert.equal(observers.length, 1);
});
