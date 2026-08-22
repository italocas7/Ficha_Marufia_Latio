(function initMarufiaAppUpdate(root, factory) {
  const versionInfo = root?.MARUFIA_VERSION
    ?? (typeof module === "object" && module.exports ? require("./version.js") : null);
  const projectConfig = root?.MARUFIA_ONLINE_CONFIG
    ?? (typeof module === "object" && module.exports ? require("./project.js") : null);
  const api = factory(versionInfo, projectConfig);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_APP_UPDATE = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaAppUpdateApi(versionInfo, projectConfig) {
  "use strict";

  const APP_ID = "com.marufia.online";
  const CHANNEL = "alpha";
  const MANIFEST_SCHEMA_VERSION = 1;
  const MANIFEST_PATH = "/app-update.json";
  const MAX_MANIFEST_BYTES = 32 * 1024;
  const DISMISS_KEY = "marufia-app-update-dismissed-v1";
  const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  const OFFICIAL_RELEASE_PREFIX = "https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function parseSemver(value) {
    const match = String(value ?? "").match(SEMVER_PATTERN);
    if (!match) return null;
    const core = match.slice(1, 4).map(Number);
    if (core.some((part) => !Number.isSafeInteger(part))) return null;
    const prerelease = match[4]
      ? match[4].split(".").map((part) => (/^\d+$/.test(part) ? Number(part) : part))
      : [];
    if (prerelease.some((part) => typeof part === "number" && !Number.isSafeInteger(part))) return null;
    return Object.freeze({ core: Object.freeze(core), prerelease: Object.freeze(prerelease) });
  }

  function compareSemver(left, right) {
    const a = parseSemver(left);
    const b = parseSemver(right);
    if (!a || !b) throw new TypeError("Versão inválida para comparação.");
    for (let index = 0; index < 3; index += 1) {
      if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
    }
    if (!a.prerelease.length && !b.prerelease.length) return 0;
    if (!a.prerelease.length) return 1;
    if (!b.prerelease.length) return -1;
    const length = Math.max(a.prerelease.length, b.prerelease.length);
    for (let index = 0; index < length; index += 1) {
      const aPart = a.prerelease[index];
      const bPart = b.prerelease[index];
      if (aPart === undefined) return -1;
      if (bPart === undefined) return 1;
      if (aPart === bPart) continue;
      if (typeof aPart === "number" && typeof bPart !== "number") return -1;
      if (typeof aPart !== "number" && typeof bPart === "number") return 1;
      return aPart > bPart ? 1 : -1;
    }
    return 0;
  }

  function validateManifest(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const expectedKeys = ["appId", "channel", "notes", "publishedAt", "releaseUrl", "schemaVersion", "version"];
    const keys = Object.keys(value).sort();
    if (keys.length !== expectedKeys.length || keys.some((key, index) => key !== expectedKeys[index])) return null;
    if (value.schemaVersion !== MANIFEST_SCHEMA_VERSION || value.appId !== APP_ID || value.channel !== CHANNEL) return null;
    if (!parseSemver(value.version)) return null;
    if (typeof value.notes !== "string" || !value.notes.trim() || value.notes.length > 1000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value.notes)) return null;
    if (typeof value.publishedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value.publishedAt)) return null;
    const publishedAt = new Date(value.publishedAt);
    if (!Number.isFinite(publishedAt.getTime())) return null;
    const canonicalDate = publishedAt.toISOString();
    if (value.publishedAt !== canonicalDate && value.publishedAt !== canonicalDate.replace(".000Z", "Z")) return null;
    const expectedReleaseUrl = `${OFFICIAL_RELEASE_PREFIX}${value.version}`;
    if (value.releaseUrl !== expectedReleaseUrl) return null;
    try {
      const parsed = new URL(value.releaseUrl);
      if (parsed.protocol !== "https:" || parsed.hostname !== "github.com" || parsed.port || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    } catch {
      return null;
    }
    return Object.freeze({
      schemaVersion: value.schemaVersion,
      appId: value.appId,
      channel: value.channel,
      version: value.version,
      notes: value.notes.trim(),
      publishedAt: value.publishedAt,
      releaseUrl: value.releaseUrl,
    });
  }

  function isTauri(view = globalThis) {
    return Boolean(view?.__TAURI_INTERNALS__ && typeof view?.__TAURI__?.opener?.openUrl === "function");
  }

  function safeSessionGet(view, key) {
    try {
      return view?.sessionStorage?.getItem?.(key) ?? null;
    } catch {
      return null;
    }
  }

  function safeSessionSet(view, key, value) {
    try {
      view?.sessionStorage?.setItem?.(key, value);
    } catch {
      // A ficha continua funcionando mesmo se o armazenamento da sessão estiver indisponível.
    }
  }

  function waitForFreeModal(document, view) {
    const modalRoot = document?.querySelector?.("#modalRoot");
    if (!modalRoot) return Promise.resolve(null);
    if (!modalRoot.querySelector?.(".modal")) return Promise.resolve(modalRoot);
    if (typeof view?.MutationObserver !== "function") return Promise.resolve(null);
    return new Promise((resolve) => {
      const observer = new view.MutationObserver(() => {
        if (modalRoot.querySelector?.(".modal")) return;
        observer.disconnect();
        resolve(modalRoot);
      });
      observer.observe(modalRoot, { childList: true, subtree: true });
    });
  }

  function updateBodyHtml(manifest, installedVersion) {
    return `<section class="app-update-dialog" data-online-app-update-modal data-update-version="${escapeHtml(manifest.version)}">
      <div class="app-update-version-row"><span>Instalada: v${escapeHtml(installedVersion)}</span><span aria-hidden="true">→</span><strong>Nova: v${escapeHtml(manifest.version)}</strong></div>
      <p>Há uma versão mais nova do aplicativo Windows. Sua ficha local continuará preservada.</p>
      <p class="app-update-notes">${escapeHtml(manifest.notes)}</p>
      <p class="app-update-error" data-online-app-update-error role="alert" hidden></p>
    </section>`;
  }

  function updateFooterHtml() {
    return `<button class="button" type="button" data-online-app-update-action="open">Atualizar aplicativo</button><button class="ghost" type="button" data-online-app-update-action="later">Agora não</button>`;
  }

  async function readManifest(fetchImpl, manifestUrl, view, timeoutMs) {
    if (typeof fetchImpl !== "function") throw new Error("Rede indisponível.");
    const controller = typeof view?.AbortController === "function" ? new view.AbortController() : null;
    const timer = controller && typeof view?.setTimeout === "function"
      ? view.setTimeout(() => controller.abort(), timeoutMs)
      : null;
    try {
      const separator = manifestUrl.includes("?") ? "&" : "?";
      const response = await fetchImpl(`${manifestUrl}${separator}check=${Date.now()}`, {
        cache: "no-store",
        credentials: "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: controller?.signal,
      });
      if (!response?.ok) throw new Error("Manifesto indisponível.");
      const declaredSize = Number(response.headers?.get?.("content-length") || 0);
      if (declaredSize > MAX_MANIFEST_BYTES) throw new Error("Manifesto excessivo.");
      const text = await response.text();
      if (!text || text.length > MAX_MANIFEST_BYTES) throw new Error("Manifesto inválido.");
      const manifest = validateManifest(JSON.parse(text));
      if (!manifest) throw new Error("Manifesto inválido.");
      return manifest;
    } finally {
      if (timer !== null && typeof view?.clearTimeout === "function") view.clearTimeout(timer);
    }
  }

  function createUpdateChecker(options = {}) {
    const document = options.document;
    const view = options.view ?? document?.defaultView ?? globalThis;
    const installedVersion = String(options.versionInfo?.version ?? versionInfo?.version ?? "0.0.0");
    const siteUrl = String(options.projectConfig?.siteUrl ?? projectConfig?.siteUrl ?? "").replace(/\/+$/, "");
    const manifestUrl = options.manifestUrl ?? `${siteUrl}${MANIFEST_PATH}`;
    const fetchImpl = options.fetchImpl ?? view?.fetch?.bind?.(view);
    const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 5000;
    let currentManifest = null;
    let checking = null;
    let retryPending = false;
    let destroyed = false;
    const promptedVersions = new Set();

    function closeOwnModal() {
      if (!document?.querySelector?.("[data-online-app-update-modal]")) return false;
      if (typeof view?.closeModal === "function") return view.closeModal();
      const modalRoot = document.querySelector?.("#modalRoot");
      if (modalRoot) modalRoot.innerHTML = "";
      return true;
    }

    async function show(manifest) {
      if (promptedVersions.has(manifest.version) || safeSessionGet(view, DISMISS_KEY) === manifest.version) return false;
      promptedVersions.add(manifest.version);
      const modalRoot = await waitForFreeModal(document, view);
      if (destroyed || !modalRoot || safeSessionGet(view, DISMISS_KEY) === manifest.version) return false;
      if (typeof view?.openModal !== "function") return false;
      currentManifest = manifest;
      view.openModal("Atualização disponível", updateBodyHtml(manifest, installedVersion), updateFooterHtml());
      modalRoot.querySelector?.(".modal")?.classList?.add?.("app-update-modal-shell");
      return true;
    }

    async function check() {
      if (destroyed || !isTauri(view) || !parseSemver(installedVersion)) return false;
      if (checking) return checking;
      if (view?.navigator?.onLine === false) {
        retryPending = true;
        return false;
      }
      checking = (async () => {
        try {
          const manifest = await readManifest(fetchImpl, manifestUrl, view, timeoutMs);
          retryPending = false;
          if (compareSemver(manifest.version, installedVersion) <= 0) return false;
          return show(manifest);
        } catch {
          retryPending = true;
          return false;
        } finally {
          checking = null;
        }
      })();
      return checking;
    }

    async function handleClick(event) {
      const control = event.target?.closest?.("[data-online-app-update-action]");
      if (!control || !document?.querySelector?.("[data-online-app-update-modal]") || !currentManifest) return;
      const action = control.dataset?.onlineAppUpdateAction;
      if (action === "later") {
        safeSessionSet(view, DISMISS_KEY, currentManifest.version);
        closeOwnModal();
        return;
      }
      if (action !== "open") return;
      const error = document.querySelector?.("[data-online-app-update-error]");
      control.disabled = true;
      if (error) {
        error.hidden = true;
        error.textContent = "";
      }
      try {
        await view.__TAURI__.opener.openUrl(currentManifest.releaseUrl);
        safeSessionSet(view, DISMISS_KEY, currentManifest.version);
        closeOwnModal();
      } catch {
        control.disabled = false;
        if (error) {
          error.textContent = "O Windows não conseguiu abrir o navegador. Tente novamente ou baixe a versão pelo repositório oficial do Marufia.";
          error.hidden = false;
        }
      }
    }

    function handleOnline() {
      if (retryPending) void check();
    }

    document?.addEventListener?.("click", handleClick);
    view?.addEventListener?.("online", handleOnline);

    return Object.freeze({
      check,
      handleClick,
      getManifest: () => currentManifest,
      destroy() {
        destroyed = true;
        document?.removeEventListener?.("click", handleClick);
        view?.removeEventListener?.("online", handleOnline);
      },
    });
  }

  function init(document, view = document?.defaultView ?? globalThis) {
    const rootElement = document?.documentElement;
    if (!rootElement || !isTauri(view) || rootElement.dataset.appUpdateInitialized === "true") return null;
    rootElement.dataset.appUpdateInitialized = "true";
    const checker = createUpdateChecker({ document, view });
    void checker.check();
    return checker;
  }

  return Object.freeze({
    APP_ID,
    CHANNEL,
    DISMISS_KEY,
    MANIFEST_PATH,
    MANIFEST_SCHEMA_VERSION,
    OFFICIAL_RELEASE_PREFIX,
    SEMVER_PATTERN,
    compareSemver,
    createUpdateChecker,
    escapeHtml,
    init,
    isTauri,
    parseSemver,
    readManifest,
    updateBodyHtml,
    updateFooterHtml,
    validateManifest,
    waitForFreeModal,
  });
});
