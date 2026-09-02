(function initMarufiaSettings(root, factory) {
  const versionInfo = root?.MARUFIA_VERSION
    ?? (typeof module === "object" && module.exports ? require("./version.js") : null);
  const api = factory(versionInfo);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_SETTINGS = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root.MARUFIA_APP_BRIDGE));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaSettingsApi(versionInfo) {
  "use strict";

  versionInfo = versionInfo || {};

  const SETTINGS_OPEN_EVENT = "marufia:settings-opened";
  const PRODUCT_NAME = String(versionInfo.productName || "Marufia Online");
  const PRODUCT_VERSION = String(versionInfo.version || "0.0.0");
  const PRODUCT_CHANNEL = String(versionInfo.channel || "alpha");
  const PRODUCT_CHANNEL_LABEL = String(versionInfo.channelLabel || "Alpha");
  const PRODUCT_DISPLAY_NAME = String(versionInfo.displayName || `${PRODUCT_NAME} ${PRODUCT_CHANNEL_LABEL}`);

  const ACCOUNT_DETAILS = Object.freeze({
    loading: "Verificando a sessão neste dispositivo.",
    online: "A conta está conectada; o salvamento local continua sendo feito primeiro.",
    offline: "Nenhuma conta está conectada. A ficha local continua disponível.",
    unavailable: "O serviço online está indisponível. A ficha local continua disponível.",
  });

  const SYNC_DETAILS = Object.freeze({
    online: "A ficha vinculada pode enviar alterações ao serviço online.",
    syncing: "As alterações locais estão sendo enviadas agora.",
    offline: "As alterações continuam salvas somente neste computador enquanto estiver offline.",
    unavailable: "O servidor de Marufia está indisponível. Os dados locais continuam acessíveis e a sincronização será tentada automaticamente.",
    error: "A ficha local está salva, mas a atualização online precisa ser tentada novamente.",
  });

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function safeBridgeValue(read, fallback) {
    try {
      return read();
    } catch {
      return fallback;
    }
  }

  function settingsSnapshot(document, view = globalThis, appBridge = view?.MARUFIA_APP_BRIDGE) {
    const accountButton = document?.querySelector?.("#onlineAccountButton");
    const accountLabel = document?.querySelector?.("#onlineAccountLabel");
    const syncStatus = document?.querySelector?.("#onlineSyncStatus");
    const syncLabel = syncStatus?.querySelector?.("[data-sync-status-label]");
    const rawAuthState = String(accountButton?.dataset?.authState || "unavailable");
    const authState = Object.hasOwn(ACCOUNT_DETAILS, rawAuthState) ? rawAuthState : "unavailable";
    const rawSyncState = String(syncStatus?.dataset?.syncState || "offline");
    const syncState = Object.hasOwn(SYNC_DETAILS, rawSyncState) ? rawSyncState : "offline";
    const signedIn = authState === "online";
    const snapshot = safeBridgeValue(() => appBridge?.snapshot?.(), null);
    const schemaVersion = Number(snapshot?.meta?.schemaVersion);
    const hasSheet = Boolean(safeBridgeValue(() => appBridge?.hasExistingSheet?.(), false));
    const realtimeState = String(accountButton?.dataset?.realtimeState || "").toLowerCase();
    let syncDetail = String(syncStatus?.title || SYNC_DETAILS[syncState]);
    if (signedIn && syncState === "online" && realtimeState === "unlinked") {
      syncDetail = "A conta está conectada, mas esta ficha ainda não foi vinculada a um personagem online.";
    } else if (signedIn && syncState === "online" && realtimeState === "subscribed") {
      syncDetail = "A ficha está vinculada e recebendo atualizações autorizadas em tempo real.";
    }

    return Object.freeze({
      account: Object.freeze({
        state: authState,
        label: signedIn ? String(accountLabel?.textContent || "Conta conectada").trim() : "Modo local",
        detail: ACCOUNT_DETAILS[authState],
        action: signedIn ? "Gerenciar conta" : "Entrar ou criar conta",
      }),
      sync: Object.freeze({
        state: syncState,
        label: String(syncLabel?.textContent || (syncState === "error" ? "Erro de sincronização" : syncState)).trim(),
        detail: syncDetail,
      }),
      local: Object.freeze({
        state: hasSheet ? "saved" : "new",
        label: hasSheet ? "Ficha salva neste computador" : "Nova ficha local",
        detail: Number.isInteger(schemaVersion)
          ? `Formato local schema v${schemaVersion}; backups e exportação permanecem disponíveis abaixo.`
          : "Backups e exportação permanecem disponíveis abaixo.",
      }),
      about: Object.freeze({
        productName: PRODUCT_NAME,
        productVersion: PRODUCT_VERSION,
        productChannel: PRODUCT_CHANNEL,
        productDisplayName: PRODUCT_DISPLAY_NAME,
        schemaVersion: Number.isInteger(schemaVersion) ? schemaVersion : 5,
      }),
    });
  }

  function settingsPanelHtml(snapshot) {
    return `<section class="online-settings-overview stack" data-online-settings>
      <div class="online-settings-heading"><div><span class="online-home-eyebrow">MARUFIA ONLINE</span><h3>Conta e dados</h3></div><p>Somente estados e ações que afetam esta instalação aparecem aqui.</p></div>
      <div class="online-settings-grid">
        <article class="online-settings-card" data-settings-state="${escapeHtml(snapshot.account.state)}"><div><span class="online-settings-dot" aria-hidden="true"></span><h4>Conta</h4></div><strong>${escapeHtml(snapshot.account.label)}</strong><p>${escapeHtml(snapshot.account.detail)}</p><button class="ghost" type="button" data-online-settings-action="account">${escapeHtml(snapshot.account.action)}</button></article>
        <article class="online-settings-card" data-settings-state="${escapeHtml(snapshot.sync.state)}"><div><span class="online-settings-dot" aria-hidden="true"></span><h4>Sincronização</h4></div><strong>${escapeHtml(snapshot.sync.label)}</strong><p>${escapeHtml(snapshot.sync.detail)}</p></article>
        <article class="online-settings-card" data-settings-state="${escapeHtml(snapshot.local.state)}"><div><span class="online-settings-dot" aria-hidden="true"></span><h4>Dados locais</h4></div><strong>${escapeHtml(snapshot.local.label)}</strong><p>${escapeHtml(snapshot.local.detail)}</p></article>
        <article class="online-settings-card" data-settings-state="about"><div><span class="online-settings-dot" aria-hidden="true"></span><h4>Sobre</h4></div><strong>${escapeHtml(snapshot.about.productDisplayName)} · v${escapeHtml(snapshot.about.productVersion)}</strong><p>Ficha schema v${escapeHtml(snapshot.about.schemaVersion)}. No Windows, somente páginas oficiais de atualização podem ser abertas fora do aplicativo.</p></article>
      </div>
    </section>`;
  }

  function renderSettings(document, view = globalThis, appBridge = view?.MARUFIA_APP_BRIDGE) {
    const slot = document?.querySelector?.("[data-online-settings-slot]");
    if (!slot) return false;
    slot.innerHTML = settingsPanelHtml(settingsSnapshot(document, view, appBridge));
    slot.hidden = false;
    return true;
  }

  function init(document, appBridge, view = document?.defaultView ?? globalThis) {
    const rootElement = document?.documentElement;
    if (!rootElement || rootElement.dataset.onlineSettingsInitialized === "true") return null;
    rootElement.dataset.onlineSettingsInitialized = "true";
    const accountButton = document.querySelector?.("#onlineAccountButton");
    const syncStatus = document.querySelector?.("#onlineSyncStatus");
    let open = false;

    const refresh = () => {
      if (!open) return false;
      const rendered = renderSettings(document, view, appBridge);
      if (!rendered) open = false;
      return rendered;
    };
    const handleOpen = () => {
      open = true;
      refresh();
    };
    const handleConnection = () => refresh();
    const handleClick = (event) => {
      const control = event.target.closest?.("[data-online-settings-action]");
      if (control?.dataset?.onlineSettingsAction !== "account") return;
      open = false;
      accountButton?.click?.();
    };
    const observer = typeof view?.MutationObserver === "function" ? new view.MutationObserver(refresh) : null;
    if (accountButton) observer?.observe(accountButton, { attributes: true, childList: true, subtree: true });
    if (syncStatus) observer?.observe(syncStatus, { attributes: true, childList: true, subtree: true });
    view?.addEventListener?.(SETTINGS_OPEN_EVENT, handleOpen);
    view?.addEventListener?.("marufia:auth-state-changed", handleConnection);
    view?.addEventListener?.("online", handleConnection);
    view?.addEventListener?.("offline", handleConnection);
    document.addEventListener?.("click", handleClick);

    return Object.freeze({
      refresh,
      destroy() {
        observer?.disconnect?.();
        view?.removeEventListener?.(SETTINGS_OPEN_EVENT, handleOpen);
        view?.removeEventListener?.("marufia:auth-state-changed", handleConnection);
        view?.removeEventListener?.("online", handleConnection);
        view?.removeEventListener?.("offline", handleConnection);
        document.removeEventListener?.("click", handleClick);
        delete rootElement.dataset.onlineSettingsInitialized;
      },
    });
  }

  return {
    SETTINGS_OPEN_EVENT,
    PRODUCT_NAME,
    PRODUCT_VERSION,
    PRODUCT_CHANNEL,
    PRODUCT_CHANNEL_LABEL,
    PRODUCT_DISPLAY_NAME,
    escapeHtml,
    settingsSnapshot,
    settingsPanelHtml,
    renderSettings,
    init,
  };
});
