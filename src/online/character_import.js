(function initMarufiaCharacterImport(root, factory) {
  const offlineTools = root?.MARUFIA_OFFLINE
    ?? (typeof module === "object" && module.exports ? require("./offline.js") : null);
  const api = factory(root, offlineTools);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CHARACTER_IMPORT = api;
  if (root?.document) Promise.resolve().then(() => api.init(
    root.document,
    root.MARUFIA_SUPABASE,
    root.MARUFIA_CHARACTERS,
    root.MARUFIA_APP_BRIDGE,
    root.LATIO_STORAGE,
  ));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaCharacterImportApi(root, offlineTools) {
  "use strict";

  const IMPORT_MARKERS_KEY = "marufia-online-character-imports-v1";
  const CHARACTER_LINKED_EVENT = "marufia:character-linked";

  function announceLinkedCharacter(view, character) {
    if (!character?.id || typeof view?.dispatchEvent !== "function" || typeof view?.CustomEvent !== "function") return false;
    view.dispatchEvent(new view.CustomEvent(CHARACTER_LINKED_EVENT, {
      detail: { characterId: String(character.id) },
    }));
    return true;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function localSheetIdentity(snapshot) {
    if (!snapshot?.meta?.started || snapshot.meta.appId !== "marufia-latio") return "";
    const createdAt = String(snapshot.meta.createdAt ?? "").trim();
    return createdAt ? `marufia-latio:${createdAt}` : "";
  }

  function markerId(userId, identity, backendId = "") {
    return offlineTools?.scopedIdentity?.(backendId, userId, identity)
      ?? `${String(backendId ?? "").trim() ? `${String(backendId).trim()}|` : ""}${String(userId ?? "").trim()}|${String(identity ?? "").trim()}`;
  }

  function readImportMarkers(storage) {
    try {
      const value = storage?.loadLocal?.(IMPORT_MARKERS_KEY, {});
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function importedCharacterId(storage, userId, identity, backendId = "") {
    return String(readImportMarkers(storage)[markerId(userId, identity, backendId)] ?? "");
  }

  function markImported(storage, userId, identity, characterId, backendId = "") {
    const key = markerId(userId, identity, backendId);
    if (!userId || !identity || !characterId || typeof storage?.saveLocal !== "function") return false;
    try {
      storage.saveLocal(IMPORT_MARKERS_KEY, { ...readImportMarkers(storage), [key]: String(characterId) });
      return true;
    } catch {
      return false;
    }
  }

  function migrationDialogHtml(state = {}) {
    const name = String(state.snapshot?.character?.name ?? "").trim() || "Personagem sem nome";
    const message = state.message
      ? `<p class="character-import-message ${state.messageKind === "error" ? "character-import-message-error" : ""}" role="${state.messageKind === "error" ? "alert" : "status"}">${escapeHtml(state.message)}</p>`
      : "";
    if (state.mode === "success") {
      return `<div class="character-import-dialog stack" data-online-character-import-modal>
        ${message}
        <p>A cópia inicial foi criada na sua conta. A ficha original permanece salva neste computador.</p>
        <p class="muted small">As próximas alterações serão salvas primeiro neste computador e, enquanto a conta estiver conectada, também serão atualizadas online.</p>
        <div class="inline character-import-actions"><button class="button" type="button" data-online-character-import-action="close">Continuar</button></div>
      </div>`;
    }
    return `<div class="character-import-dialog stack" data-online-character-import-modal>
      <p>Encontramos uma ficha existente neste computador.</p>
      <div class="character-import-summary"><span class="muted small">Ficha encontrada</span><strong>${escapeHtml(name)}</strong><span>Schema v${escapeHtml(state.snapshot?.meta?.schemaVersion ?? "?")}</span></div>
      <p>Antes da importação, criaremos automaticamente um backup local. O original não será apagado nem substituído.</p>
      ${message}
      <div class="inline character-import-actions">
        <button class="button" type="button" data-online-character-import-action="import" ${state.busy ? "disabled" : ""}>${state.busy ? "Importando…" : "Importar para minha conta"}</button>
        <button class="ghost" type="button" data-online-character-import-action="dismiss" ${state.busy ? "disabled" : ""}>Agora não</button>
      </div>
    </div>`;
  }

  function init(document, supabaseTools, characterTools, appBridge, storage) {
    const accountButton = document.querySelector("#onlineAccountButton");
    const modalRoot = document.querySelector("#modalRoot");
    if (!accountButton || !modalRoot || !characterTools?.createCharacterService || !appBridge || !storage) return null;
    if (accountButton.dataset.characterImportInitialized === "true") return null;
    accountButton.dataset.characterImportInitialized = "true";

    const view = document.defaultView ?? root ?? globalThis;
    const backendId = offlineTools?.backendScope?.(view.MARUFIA_ONLINE_CONFIG) ?? "unconfigured";
    let service = null;
    let checking = false;
    let pending = null;
    let state = { mode: "prompt", busy: false, snapshot: null, message: "", messageKind: "" };
    const checked = new Set();

    function ownModalOpen() {
      return Boolean(modalRoot.querySelector("[data-online-character-import-modal]"));
    }

    function renderDialog() {
      const body = migrationDialogHtml(state);
      if (typeof view.openModal === "function") {
        view.openModal(state.mode === "success" ? "Ficha importada" : "Ficha local encontrada", body, "");
      } else {
        modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="Ficha local encontrada" data-stop-close data-blocking="false"><div class="modal-body">${body}</div></div></div>`;
      }
    }

    function closeDialog() {
      if (ownModalOpen()) modalRoot.innerHTML = "";
      accountButton.focus();
    }

    async function checkLocalSheet() {
      if (checking) return false;
      if (!service || accountButton.dataset.authState !== "online" || !appBridge.hasExistingSheet?.()) return true;
      const snapshot = appBridge.snapshot?.();
      const identity = localSheetIdentity(snapshot);
      if (!identity) return true;
      checking = true;
      try {
        const userId = await service.currentUserId();
        const key = markerId(userId, identity, backendId);
        if (checked.has(key) || importedCharacterId(storage, userId, identity, backendId)) return true;
        const characters = await service.listOwn();
        const existing = characters.find((character) => (
          character.state?.meta?.appId === snapshot.meta.appId
          && character.state?.meta?.createdAt === snapshot.meta.createdAt
        ));
        if (existing) {
          if (markImported(storage, userId, identity, existing.id, backendId)) announceLinkedCharacter(view, existing);
          checked.add(key);
          return true;
        }
        checked.add(key);
        pending = { userId, identity, backendId };
        state = { mode: "prompt", busy: false, snapshot, message: "", messageKind: "" };
        renderDialog();
        return true;
      } catch {
        // A ficha local continua disponível; o coordenador tentará novamente com espera limitada.
        return false;
      } finally {
        checking = false;
      }
    }

    async function importLocalSheet() {
      if (!pending || state.busy) return;
      state = { ...state, busy: true, message: "", messageKind: "" };
      renderDialog();
      try {
        const backup = appBridge.createOnlineImportBackup?.();
        if (!backup?.payload) throw new Error("backup unavailable");
        const snapshot = appBridge.snapshot?.();
        const character = await service.createIndependent(snapshot);
        if (markImported(storage, pending.userId, pending.identity, character.id, pending.backendId)) announceLinkedCharacter(view, character);
        state = {
          mode: "success",
          busy: false,
          snapshot,
          message: `${character.name} foi importado com segurança.`,
          messageKind: "success",
        };
        renderDialog();
      } catch (error) {
        state = {
          ...state,
          busy: false,
          message: characterTools.friendlyCharacterMessage?.(error) ?? "Não foi possível importar a ficha. O original continua salvo neste computador.",
          messageKind: "error",
        };
        renderDialog();
      }
    }

    document.addEventListener("click", (event) => {
      const control = event.target.closest?.("[data-online-character-import-action]");
      if (!control) return;
      const action = control.dataset.onlineCharacterImportAction;
      if (action === "import") void importLocalSheet();
      else if (action === "dismiss" || action === "close") closeDialog();
    });

    try {
      const client = supabaseTools?.getSupabaseClient?.();
      service = client ? characterTools.createCharacterService(client, view.LATIO_STATE) : null;
    } catch {
      service = null;
    }

    const retryScheduler = offlineTools?.createRetryScheduler?.(checkLocalSheet, {
      isReady: () => view.navigator?.onLine !== false && accountButton.dataset.authState === "online",
      setTimer: view.setTimeout?.bind?.(view),
      clearTimer: view.clearTimeout?.bind?.(view),
    }) ?? null;
    const retryCheck = () => void (retryScheduler?.wake?.() ?? checkLocalSheet());
    const pauseCheck = () => retryScheduler?.pause?.();
    const observer = typeof view.MutationObserver === "function"
      ? new view.MutationObserver(retryCheck)
      : null;
    observer?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    view.addEventListener?.("online", retryCheck);
    view.addEventListener?.("offline", pauseCheck);
    retryCheck();

    return Object.freeze({
      destroy() {
        observer?.disconnect?.();
        view.removeEventListener?.("online", retryCheck);
        view.removeEventListener?.("offline", pauseCheck);
        retryScheduler?.destroy?.();
      },
      service,
      checkLocalSheet,
      retryScheduler,
    });
  }

  return {
    IMPORT_MARKERS_KEY,
    CHARACTER_LINKED_EVENT,
    announceLinkedCharacter,
    localSheetIdentity,
    markerId,
    readImportMarkers,
    importedCharacterId,
    markImported,
    migrationDialogHtml,
    init,
  };
});
