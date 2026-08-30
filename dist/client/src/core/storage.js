(function initLatioStorage(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.LATIO_STORAGE = api;
})(typeof window !== "undefined" ? window : globalThis, function createLatioStorageApi(root) {
  "use strict";

  function storageError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function validKey(key) {
    if (typeof key !== "string" || !key.trim()) throw storageError("LAT-STORAGE-LOCAL-001", "Chave de armazenamento local inválida.");
    return key;
  }

  function localBackend(storage) {
    const backend = storage ?? root?.localStorage ?? globalThis.localStorage;
    if (!backend || typeof backend.getItem !== "function" || typeof backend.setItem !== "function" || typeof backend.removeItem !== "function") {
      throw storageError("LAT-STORAGE-LOCAL-001", "Armazenamento local indisponível.");
    }
    return backend;
  }

  function loadLocal(key, fallback = null, storage) {
    const raw = localBackend(storage).getItem(validKey(key));
    return raw === null ? fallback : JSON.parse(raw);
  }

  function saveLocal(key, value, storage) {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw storageError("LAT-STORAGE-LOCAL-002", "Valor inválido para armazenamento local.");
    localBackend(storage).setItem(validKey(key), serialized);
    return true;
  }

  function removeLocal(key, storage) {
    localBackend(storage).removeItem(validKey(key));
    return true;
  }

  function remoteMethod(adapter, method) {
    if (!adapter || typeof adapter[method] !== "function") {
      throw storageError("LAT-STORAGE-REMOTE-001", "Armazenamento remoto ainda não configurado.");
    }
    return adapter[method].bind(adapter);
  }

  async function loadRemote(adapter, request) {
    return remoteMethod(adapter, "load")(request);
  }

  async function saveRemote(adapter, request) {
    return remoteMethod(adapter, "save")(request);
  }

  return {
    loadLocal,
    saveLocal,
    removeLocal,
    loadRemote,
    saveRemote,
  };
});
