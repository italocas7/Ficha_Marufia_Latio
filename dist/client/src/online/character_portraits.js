(function initMarufiaCharacterPortraits(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CHARACTER_PORTRAITS = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document));
})(typeof window !== "undefined" ? window : globalThis, function createCharacterPortraitApi(root) {
  "use strict";

  const BUCKET = "character-portraits";
  const DATABASE = "marufia-character-media-v1";
  const STORE = "portraits";
  const MAX_INPUT_BYTES = 8 * 1024 * 1024;
  const MAX_PORTRAIT_BYTES = 350 * 1024;
  const PATH_PATTERN = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.webp$/;
  const DATA_PATTERN = /^data:image\/webp;base64,[A-Za-z0-9+/=]+$/;
  let databasePromise;
  let syncPromise;
  const objectUrls = new Map();

  function sheetIdentity(snapshot) {
    return snapshot?.meta?.appId === "marufia-latio" && snapshot.meta.started
      ? String(snapshot.meta.createdAt || "") : "";
  }

  function openDatabase() {
    if (!root?.indexedDB) return Promise.reject(new Error("Armazenamento de imagens indisponível."));
    if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
      const request = root.indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "identity" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return databasePromise;
  }

  async function mediaTransaction(identity, record) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, record === undefined ? "readonly" : "readwrite");
      const request = record === undefined
        ? transaction.objectStore(STORE).get(identity)
        : transaction.objectStore(STORE).put({ identity, ...record });
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  async function readMedia(identity) {
    if (!identity) return null;
    try { return await mediaTransaction(identity); }
    catch {
      try { return JSON.parse(root.localStorage.getItem(`marufia-portrait:${identity}`) || "null"); }
      catch { return null; }
    }
  }

  async function writeMedia(identity, record) {
    if (!identity) throw new Error("Abra uma ficha antes de escolher a imagem.");
    try { await mediaTransaction(identity, record); }
    catch {
      try { root.localStorage.setItem(`marufia-portrait:${identity}`, JSON.stringify({ identity, ...record })); }
      catch { throw new Error("Não há espaço para salvar a imagem neste aparelho."); }
    }
    return record;
  }

  function validateImportMedia(media) {
    if (media == null) return null;
    const dataUrl = media?.portraitWebp;
    if (typeof dataUrl !== "string" || dataUrl.length > 490000 || !DATA_PATTERN.test(dataUrl)) {
      throw new Error("A imagem incluída no JSON é inválida ou muito grande.");
    }
    let bytes;
    try { bytes = root.atob(dataUrl.slice("data:image/webp;base64,".length)); }
    catch { throw new Error("A imagem incluída no JSON não pôde ser lida."); }
    if (bytes.length > MAX_PORTRAIT_BYTES || bytes.slice(0, 4) !== "RIFF" || bytes.slice(8, 12) !== "WEBP") {
      throw new Error("A imagem incluída no JSON não é uma WebP válida de até 350 KB.");
    }
    return { portraitWebp: dataUrl };
  }

  async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new root.FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function encodeFile(file) {
    if (!file || file.size > MAX_INPUT_BYTES || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Escolha uma imagem JPG, PNG ou WebP de até 8 MB.");
    }
    const bitmap = await root.createImageBitmap(file);
    try {
      const canvas = root.document.createElement("canvas");
      const sourceSize = Math.min(bitmap.width, bitmap.height);
      if (!sourceSize) throw new Error("A imagem está vazia.");
      const sourceX = (bitmap.width - sourceSize) / 2;
      const sourceY = (bitmap.height - sourceSize) / 2;
      for (const size of [512, 448, 384, 320, 256]) {
        canvas.width = size;
        canvas.height = size;
        canvas.getContext("2d").drawImage(bitmap, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        for (const quality of [0.82, 0.72, 0.6, 0.48]) {
          const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
          if (blob?.type === "image/webp" && blob.size <= MAX_PORTRAIT_BYTES) return blobToDataUrl(blob);
        }
      }
      throw new Error("A imagem não pôde ser reduzida para o tamanho permitido.");
    } finally { bitmap.close?.(); }
  }

  async function dataUrlToBlob(dataUrl) {
    const response = await root.fetch(dataUrl);
    const blob = await response.blob();
    if (blob.type !== "image/webp" || blob.size > MAX_PORTRAIT_BYTES) throw new Error("Imagem inválida para envio.");
    return blob;
  }

  function client() {
    try { return root.MARUFIA_SUPABASE?.getSupabaseClient?.() ?? null; }
    catch { return null; }
  }

  async function ownRemotePath(remoteId) {
    const result = await client().from("character_portraits").select("object_path")
      .eq("character_id", remoteId).maybeSingle();
    if (result.error) throw result.error;
    return String(result.data?.object_path || "");
  }

  async function downloadPath(path) {
    if (!PATH_PATTERN.test(path)) throw new Error("Caminho de imagem inválido.");
    if (!objectUrls.has(path)) {
      const pending = client().storage.from(BUCKET).download(path).then(({ data, error }) => {
        if (error || !data) throw error ?? new Error("A imagem não está disponível.");
        return root.URL.createObjectURL(data);
      }).catch((error) => { objectUrls.delete(path); throw error; });
      objectUrls.set(path, pending);
    }
    return objectUrls.get(path);
  }

  async function syncOne(slot) {
    const identity = sheetIdentity(slot?.state);
    const remoteId = String(slot?.remoteId || "");
    if (!identity || !remoteId || !client() || root.navigator?.onLine === false) return false;
    const local = await readMedia(identity);
    if (!local?.dirty) return false;
    const previousPath = await ownRemotePath(remoteId);
    let nextPath = null;
    if (local.dataUrl) {
      const blob = await dataUrlToBlob(local.dataUrl);
      nextPath = `${remoteId}/${root.crypto.randomUUID()}.webp`;
      const upload = await client().storage.from(BUCKET).upload(nextPath, blob, { contentType: "image/webp", upsert: false });
      if (upload.error) throw upload.error;
    }
    const applied = await client().rpc("set_character_portrait", { p_character_id: remoteId, p_path: nextPath });
    if (applied.error) {
      if (nextPath) await client().storage.from(BUCKET).remove([nextPath]).catch(() => {});
      throw applied.error;
    }
    const latest = await readMedia(identity);
    if (latest?.dirty && latest.dataUrl === local.dataUrl) {
      await writeMedia(identity, { dataUrl: local.dataUrl || "", dirty: false, remotePath: nextPath || "" });
    } else if (latest?.dirty) {
      root.setTimeout?.(() => void syncPending(), 0);
    }
    if (previousPath && previousPath !== nextPath) {
      await client().storage.from(BUCKET).remove([previousPath]).catch(() => {});
      const old = objectUrls.get(previousPath);
      if (old) old.then((url) => root.URL.revokeObjectURL(url)).catch(() => {});
      objectUrls.delete(previousPath);
    }
    if (typeof root.CustomEvent === "function") root.dispatchEvent?.(new root.CustomEvent("marufia:portrait-updated", { detail: { characterId: remoteId } }));
    return true;
  }

  async function syncPending() {
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      const slots = root.MARUFIA_SHEET_SLOTS_STORE?.all?.() ?? [];
      for (const slot of slots) {
        try { await syncOne(slot); }
        catch (error) { root.toast?.(`Imagem guardada neste aparelho; envio pendente. ${error.message || ""}`, "warn"); }
      }
    })();
    try { await syncPromise; } finally { syncPromise = null; }
  }

  async function exportActiveMedia() {
    const identity = sheetIdentity(root.MARUFIA_APP_BRIDGE?.snapshot?.());
    const local = await readMedia(identity);
    if (local?.dataUrl) return { portraitWebp: local.dataUrl };
    const remoteId = root.MARUFIA_SHEET_SLOTS_STORE?.active?.()?.remoteId;
    if (!remoteId || !client()) return null;
    try {
      const path = await ownRemotePath(remoteId);
      if (!path) return null;
      const result = await client().storage.from(BUCKET).download(path);
      return result.data ? { portraitWebp: await blobToDataUrl(result.data) } : null;
    } catch { return null; }
  }

  async function importMedia(identity, media) {
    const valid = validateImportMedia(media);
    if (!valid) return false;
    await dataUrlToBlob(valid.portraitWebp);
    await writeMedia(identity, { dataUrl: valid.portraitWebp, dirty: true, remotePath: "" });
    if (typeof root.CustomEvent === "function") root.dispatchEvent?.(new root.CustomEvent("marufia:portrait-updated"));
    void syncPending();
    return true;
  }

  function init(document) {
    const view = document.defaultView ?? root;
    const app = document.querySelector("#app");
    const modalRoot = document.querySelector("#modalRoot");
    if (!app || !modalRoot) return null;
    let generation = 0;
    let scheduled = false;

    function show(node, url) {
      if (!node || node.dataset.portraitShown === url) return;
      node.dataset.portraitShown = url;
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      node.replaceChildren(img);
    }

    async function refresh() {
      const token = ++generation;
      const snapshot = view.MARUFIA_APP_BRIDGE?.snapshot?.();
      const identity = sheetIdentity(snapshot);
      for (const mount of document.querySelectorAll("[data-sheet-portrait]")) {
        if (mount.dataset.sheetPortraitReady === identity) continue;
        mount.dataset.sheetPortraitReady = identity;
        mount.replaceChildren();
        const row = document.createElement("div");
        row.className = "sheet-portrait-control";
        const image = document.createElement("span");
        image.className = "character-portrait";
        image.dataset.activePortrait = "";
        image.textContent = (snapshot?.character?.name || "P").slice(0, 1).toUpperCase();
        row.append(image);
        if (document.body.dataset.gmView !== "true") {
          const actions = document.createElement("div");
          actions.className = "sheet-portrait-actions";
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/jpeg,image/png,image/webp";
          input.dataset.portraitFile = "";
          input.setAttribute("aria-label", "Escolher imagem do personagem");
          const choose = document.createElement("button");
          choose.type = "button";
          choose.className = "ghost";
          choose.dataset.portraitAction = "choose";
          choose.textContent = "Escolher imagem";
          choose.disabled = !identity;
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "ghost";
          remove.dataset.portraitAction = "remove";
          remove.textContent = "Remover";
          remove.disabled = !identity;
          actions.append(input, choose, remove);
          row.append(actions);
        }
        mount.append(row);
      }
      const active = await readMedia(identity);
      if (token !== generation) return;
      if (active?.dataUrl) document.querySelectorAll("[data-active-portrait]").forEach((node) => show(node, active.dataUrl));
      else if (identity && !active?.dirty) {
        const remoteId = view.MARUFIA_SHEET_SLOTS_STORE?.active?.()?.remoteId;
        if (remoteId && client()) {
          try {
            const path = await ownRemotePath(remoteId);
            if (path) {
              const url = await downloadPath(path);
              if (token === generation) document.querySelectorAll("[data-active-portrait]").forEach((node) => show(node, url));
            }
          } catch { /* Sem conexao, o marcador continua visivel. */ }
        }
      }
      for (const node of document.querySelectorAll("[data-marufia-portrait][data-portrait-path]")) {
        const path = node.dataset.portraitPath || "";
        if (!PATH_PATTERN.test(path) || path.split("/")[0] !== node.dataset.marufiaPortrait) continue;
        if (node.dataset.portraitLoading === path) continue;
        node.dataset.portraitLoading = path;
        downloadPath(path).then((url) => {
          if (node.isConnected && node.dataset.portraitPath === path) show(node, url);
        }).catch(() => { node.dataset.portraitLoading = ""; });
      }
    }

    function scheduleRefresh() {
      if (scheduled) return;
      scheduled = true;
      Promise.resolve().then(() => { scheduled = false; void refresh(); });
    }

    const onClick = (event) => {
      const control = event.target.closest?.("[data-portrait-action]");
      if (!control) return;
      const mount = control.closest("[data-sheet-portrait]");
      if (control.dataset.portraitAction === "choose") mount?.querySelector("[data-portrait-file]")?.click();
      if (control.dataset.portraitAction === "remove") {
        const identity = sheetIdentity(view.MARUFIA_APP_BRIDGE?.snapshot?.());
        void writeMedia(identity, { dataUrl: "", dirty: true, remotePath: "" })
          .then(() => { mount.dataset.sheetPortraitReady = ""; scheduleRefresh(); void syncPending(); view.toast?.("Imagem removida da ficha."); })
          .catch((error) => view.toast?.(error.message, "warn"));
      }
    };

    const onChange = (event) => {
      if (!event.target.matches?.("[data-portrait-file]")) return;
      const file = event.target.files?.[0];
      const identity = sheetIdentity(view.MARUFIA_APP_BRIDGE?.snapshot?.());
      if (!file || !identity) return;
      void encodeFile(file).then((dataUrl) => writeMedia(identity, { dataUrl, dirty: true, remotePath: "" }))
        .then(() => { scheduleRefresh(); void syncPending(); view.toast?.("Imagem salva nesta ficha."); })
        .catch((error) => view.toast?.(error.message || "Imagem inválida.", "warn"));
    };

    const observer = new view.MutationObserver(scheduleRefresh);
    observer.observe(app, { childList: true, subtree: true });
    observer.observe(modalRoot, { childList: true, subtree: true });
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    view.addEventListener("marufia:sheet-rendered", scheduleRefresh);
    view.addEventListener("marufia:sheet-switched", scheduleRefresh);
    view.addEventListener("marufia:character-linked", () => { scheduleRefresh(); void syncPending(); });
    view.addEventListener("marufia:portrait-updated", scheduleRefresh);
    view.addEventListener("online", () => void syncPending());
    scheduleRefresh();
    void syncPending();
    return { refresh, syncPending, destroy() { observer.disconnect(); document.removeEventListener("click", onClick); document.removeEventListener("change", onChange); } };
  }

  return { BUCKET, sheetIdentity, validateImportMedia, encodeFile, readMedia, writeMedia, exportActiveMedia, importMedia, syncOne, syncPending, init };
});
