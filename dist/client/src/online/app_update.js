(function initMarufiaAppUpdate(root, factory) {
  const versionInfo = root?.MARUFIA_VERSION
    ?? (typeof module === "object" && module.exports ? require("./version.js") : null);
  const api = factory(versionInfo);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_APP_UPDATE = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaAppUpdateApi(versionInfo) {
  "use strict";

  const BEFORE_APP_UPDATE_EVENT = "marufia:before-app-update";
  const DISMISS_KEY = "marufia-app-update-dismissed-v2";
  const PREPARE_TIMEOUT_MS = 5000;
  const UPDATER_MANIFEST_URL = "https://marufiarpg.org/tauri-update.json";
  const OFFICIAL_RELEASE_PREFIX = "https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v";
  const OFFICIAL_DOWNLOAD_PREFIX = "https://github.com/italocas7/Ficha_Marufia_Latio/releases/download/v";
  const WINDOWS_PLATFORM = "windows-x86_64";
  const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

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

  function validIsoDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return false;
    const canonical = date.toISOString();
    return value === canonical || value === canonical.replace(".000Z", "Z");
  }

  function releaseUrlForVersion(version) {
    return parseSemver(version) ? `${OFFICIAL_RELEASE_PREFIX}${version}` : "";
  }

  function installerUrlForVersion(version) {
    return parseSemver(version) ? `${OFFICIAL_DOWNLOAD_PREFIX}${version}/Marufia-Setup.exe` : "";
  }

  function validateTauriManifest(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const keys = Object.keys(value).sort();
    const expected = ["notes", "platforms", "pub_date", "version"];
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) return null;
    if (!parseSemver(value.version) || typeof value.notes !== "string" || !value.notes.trim()
      || value.notes.length > 1000 || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value.notes)
      || !validIsoDate(value.pub_date)) return null;
    if (!value.platforms || typeof value.platforms !== "object" || Array.isArray(value.platforms)
      || Object.keys(value.platforms).length !== 1 || !Object.hasOwn(value.platforms, WINDOWS_PLATFORM)) return null;
    const target = value.platforms[WINDOWS_PLATFORM];
    if (!target || typeof target !== "object" || Array.isArray(target)
      || Object.keys(target).sort().join(",") !== "signature,url"
      || target.url !== installerUrlForVersion(value.version)
      || typeof target.signature !== "string" || target.signature.length < 64
      || target.signature.length > 4096 || !/^[A-Za-z0-9+/=]+$/.test(target.signature)) return null;
    return Object.freeze({
      version: value.version,
      notes: value.notes.trim(),
      pub_date: value.pub_date,
      platforms: Object.freeze({
        [WINDOWS_PLATFORM]: Object.freeze({ url: target.url, signature: target.signature }),
      }),
    });
  }

  function isTauri(view = globalThis) {
    return Boolean(view?.__TAURI_INTERNALS__ && typeof view?.__TAURI__?.updater?.check === "function");
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

  function normalizeUpdate(update, installedVersion) {
    if (!update || typeof update !== "object" || typeof update.downloadAndInstall !== "function") return null;
    const version = String(update.version ?? "");
    if (!parseSemver(installedVersion) || !parseSemver(version) || compareSemver(version, installedVersion) <= 0) return null;
    const rawNotes = typeof update.body === "string" ? update.body.trim() : "";
    const notes = rawNotes && rawNotes.length <= 1000 && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(rawNotes)
      ? rawNotes
      : "Correções e melhorias estão disponíveis para o Marufia Online.";
    return Object.freeze({
      version,
      notes,
      releaseUrl: releaseUrlForVersion(version),
      resource: update,
    });
  }

  function updateBodyHtml(update, installedVersion) {
    return `<section class="app-update-dialog" data-online-app-update-modal data-update-version="${escapeHtml(update.version)}">
      <div class="app-update-version-row"><span>Instalada: v${escapeHtml(installedVersion)}</span><span aria-hidden="true">→</span><strong>Nova: v${escapeHtml(update.version)}</strong></div>
      <p>Há uma versão assinada mais nova do aplicativo Windows. Sua ficha local continuará preservada.</p>
      <p class="app-update-notes">${escapeHtml(update.notes)}</p>
    </section>`;
  }

  function updateFooterHtml() {
    return `<button class="button" type="button" data-online-app-update-action="install">Baixar e instalar</button><button class="ghost" type="button" data-online-app-update-action="later">Agora não</button>`;
  }

  function progressBodyHtml(update) {
    return `<section class="app-update-dialog" data-online-app-update-modal data-update-version="${escapeHtml(update.version)}" aria-busy="true">
      <p>Salvando alterações pendentes antes de atualizar para a versão <strong>v${escapeHtml(update.version)}</strong>.</p>
      <progress class="app-update-progress" data-online-app-update-progress max="100"></progress>
      <p class="app-update-progress-label" data-online-app-update-progress-label role="status" aria-live="polite">Preparando atualização…</p>
      <p class="muted small">O aplicativo será fechado quando o instalador estiver pronto. Não desligue o computador.</p>
    </section>`;
  }

  function failureBodyHtml(update, message) {
    return `<section class="app-update-dialog" data-online-app-update-modal data-update-version="${escapeHtml(update.version)}">
      <p class="app-update-error" data-online-app-update-error role="alert">${escapeHtml(message)}</p>
      <p>Sua ficha continua salva. Você pode tentar novamente ou abrir a versão oficial no navegador.</p>
    </section>`;
  }

  function failureFooterHtml() {
    return `<button class="button" type="button" data-online-app-update-action="retry">Tentar novamente</button><button class="ghost" type="button" data-online-app-update-action="manual">Baixar manualmente</button><button class="ghost" type="button" data-online-app-update-action="later">Agora não</button>`;
  }

  async function prepareForInstall(view, timeoutMs = PREPARE_TIMEOUT_MS) {
    try {
      view?.flushPendingState?.();
    } catch {
      // O snapshot local já permanece preservado pelo ciclo normal da ficha.
    }
    const pending = [];
    if (typeof view?.dispatchEvent === "function" && typeof view?.CustomEvent === "function") {
      const detail = {
        waitUntil(task) {
          if (task && typeof task.then === "function") pending.push(Promise.resolve(task));
        },
      };
      try {
        view.dispatchEvent(new view.CustomEvent(BEFORE_APP_UPDATE_EVENT, { detail }));
      } catch {
        // Uma integração opcional não pode impedir a atualização da ficha local.
      }
    }
    if (!pending.length) return true;
    const schedule = view?.setTimeout?.bind?.(view) ?? setTimeout;
    const cancel = view?.clearTimeout?.bind?.(view) ?? clearTimeout;
    let timeoutId;
    try {
      await Promise.race([
        Promise.allSettled(pending),
        new Promise((resolve) => {
          timeoutId = schedule(resolve, Math.max(0, Number(timeoutMs) || 0));
        }),
      ]);
    } finally {
      if (timeoutId !== undefined) cancel(timeoutId);
    }
    return true;
  }

  function createUpdateChecker(options = {}) {
    const document = options.document;
    const view = options.view ?? document?.defaultView ?? globalThis;
    const installedVersion = String(options.versionInfo?.version ?? versionInfo?.version ?? "0.0.0");
    const checkImpl = options.checkImpl ?? view?.__TAURI__?.updater?.check?.bind?.(view.__TAURI__.updater);
    const prepareTimeoutMs = Number.isFinite(options.prepareTimeoutMs) ? options.prepareTimeoutMs : PREPARE_TIMEOUT_MS;
    const promptedVersions = new Set();
    let checking = null;
    let currentUpdate = null;
    let retryPending = false;
    let destroyed = false;
    let installing = false;

    function ownModalOpen() {
      return Boolean(document?.querySelector?.("[data-online-app-update-modal]"));
    }

    function markModalShell() {
      document?.querySelector?.("#modalRoot")?.querySelector?.(".modal")?.classList?.add?.("app-update-modal-shell");
    }

    function openModal(title, body, footer, dismissible = true) {
      if (typeof view?.openModal !== "function") return false;
      view.openModal(title, body, footer, { dismissible });
      markModalShell();
      return true;
    }

    function closeOwnModal(force = false) {
      if (!ownModalOpen()) return false;
      if (typeof view?.closeModal === "function") return view.closeModal(force);
      const modalRoot = document?.querySelector?.("#modalRoot");
      if (modalRoot) modalRoot.innerHTML = "";
      return true;
    }

    async function disposeResource(resource = currentUpdate?.resource) {
      if (!resource) return;
      try {
        await resource.close?.();
      } catch {
        // O recurso nativo será liberado pelo Tauri ao encerrar o aplicativo.
      }
    }

    async function show(update, force = false) {
      if (!force && (promptedVersions.has(update.version) || safeSessionGet(view, DISMISS_KEY) === update.version)) {
        await disposeResource(update.resource);
        return false;
      }
      const modalRoot = await waitForFreeModal(document, view);
      if (destroyed || !modalRoot || safeSessionGet(view, DISMISS_KEY) === update.version) {
        await disposeResource(update.resource);
        return false;
      }
      currentUpdate = update;
      promptedVersions.add(update.version);
      return openModal("Atualização disponível", updateBodyHtml(update, installedVersion), updateFooterHtml());
    }

    function renderProgress(event) {
      const progress = document?.querySelector?.("[data-online-app-update-progress]");
      const label = document?.querySelector?.("[data-online-app-update-progress-label]");
      if (!progress || !label) return;
      const kind = String(event?.event ?? "");
      if (kind === "Started") {
        progress.dataset.downloaded = "0";
        progress.dataset.total = String(Math.max(0, Number(event?.data?.contentLength) || 0));
        label.textContent = "Download iniciado…";
        return;
      }
      if (kind === "Progress") {
        const downloaded = Number(progress.dataset.downloaded || 0) + Math.max(0, Number(event?.data?.chunkLength) || 0);
        const total = Number(progress.dataset.total || 0);
        progress.dataset.downloaded = String(downloaded);
        if (total > 0) {
          const percent = Math.min(100, Math.round((downloaded / total) * 100));
          progress.value = percent;
          label.textContent = `Baixando atualização… ${percent}%`;
        } else {
          progress.removeAttribute?.("value");
          label.textContent = "Baixando atualização…";
        }
        return;
      }
      if (kind === "Finished") {
        progress.value = 100;
        label.textContent = "Download concluído. Iniciando instalação…";
      }
    }

    function showFailure(update, message = "Não foi possível baixar ou instalar a atualização. Verifique sua conexão e tente novamente.") {
      openModal("Falha na atualização", failureBodyHtml(update, message), failureFooterHtml());
    }

    async function install(update = currentUpdate) {
      if (!update || installing || destroyed) return false;
      installing = true;
      openModal("Instalando atualização", progressBodyHtml(update), "", false);
      try {
        await prepareForInstall(view, prepareTimeoutMs);
        await update.resource.downloadAndInstall(renderProgress);
        safeSessionSet(view, DISMISS_KEY, update.version);
        const label = document?.querySelector?.("[data-online-app-update-progress-label]");
        const progress = document?.querySelector?.("[data-online-app-update-progress]");
        if (progress) progress.value = 100;
        if (label) label.textContent = "Instalação iniciada. O aplicativo será fechado automaticamente…";
        return true;
      } catch {
        installing = false;
        showFailure(update);
        return false;
      }
    }

    async function retryInstall() {
      if (installing || destroyed || typeof checkImpl !== "function") return false;
      const previous = currentUpdate;
      installing = true;
      openModal("Instalando atualização", progressBodyHtml(previous), "", false);
      const label = document?.querySelector?.("[data-online-app-update-progress-label]");
      if (label) label.textContent = "Verificando novamente…";
      await disposeResource(previous?.resource);
      try {
        const resource = await checkImpl();
        const update = normalizeUpdate(resource, installedVersion);
        if (!update) {
          await disposeResource(resource);
          throw new Error("Atualização não encontrada.");
        }
        currentUpdate = update;
        installing = false;
        return install(update);
      } catch {
        currentUpdate = previous;
        installing = false;
        showFailure(previous, "Não foi possível localizar novamente a atualização. Verifique sua conexão ou use o download manual.");
        return false;
      }
    }

    async function openManualDownload(control) {
      if (!currentUpdate || typeof view?.__TAURI__?.opener?.openUrl !== "function") {
        showFailure(currentUpdate, "O Windows não conseguiu abrir o navegador. Acesse o repositório oficial do Marufia quando sua conexão retornar.");
        return false;
      }
      try {
        await view.__TAURI__.opener.openUrl(currentUpdate.releaseUrl);
        safeSessionSet(view, DISMISS_KEY, currentUpdate.version);
        closeOwnModal(true);
        await disposeResource();
        currentUpdate = null;
        return true;
      } catch {
        if (control) control.disabled = false;
        showFailure(currentUpdate, "O Windows não conseguiu abrir o navegador. Tente novamente ou acesse a página oficial do Marufia manualmente.");
        return false;
      }
    }

    async function check(optionsForCheck = {}) {
      if (destroyed || installing || !isTauri(view) || !parseSemver(installedVersion) || typeof checkImpl !== "function") return false;
      if (checking) return checking;
      if (view?.navigator?.onLine === false) {
        retryPending = true;
        return false;
      }
      checking = (async () => {
        try {
          const resource = await checkImpl();
          retryPending = false;
          const update = normalizeUpdate(resource, installedVersion);
          if (!update) {
            await disposeResource(resource);
            return false;
          }
          return show(update, optionsForCheck.force === true);
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
      if (!control || !ownModalOpen() || !currentUpdate) return;
      const action = control.dataset?.onlineAppUpdateAction;
      if (action === "later") {
        safeSessionSet(view, DISMISS_KEY, currentUpdate.version);
        closeOwnModal(true);
        await disposeResource();
        currentUpdate = null;
        return;
      }
      control.disabled = true;
      if (action === "install") await install();
      else if (action === "retry") await retryInstall();
      else if (action === "manual") await openManualDownload(control);
      if (!installing && ownModalOpen()) control.disabled = false;
    }

    function handleOffline() {
      retryPending = true;
    }

    function handleOnline() {
      if (retryPending) void check();
    }

    document?.addEventListener?.("click", handleClick);
    view?.addEventListener?.("offline", handleOffline);
    view?.addEventListener?.("online", handleOnline);

    return Object.freeze({
      check,
      handleClick,
      install,
      retryInstall,
      getUpdate: () => currentUpdate,
      isInstalling: () => installing,
      destroy() {
        destroyed = true;
        document?.removeEventListener?.("click", handleClick);
        view?.removeEventListener?.("offline", handleOffline);
        view?.removeEventListener?.("online", handleOnline);
        if (!installing) void disposeResource();
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
    BEFORE_APP_UPDATE_EVENT,
    DISMISS_KEY,
    OFFICIAL_DOWNLOAD_PREFIX,
    OFFICIAL_RELEASE_PREFIX,
    PREPARE_TIMEOUT_MS,
    SEMVER_PATTERN,
    UPDATER_MANIFEST_URL,
    WINDOWS_PLATFORM,
    compareSemver,
    createUpdateChecker,
    escapeHtml,
    failureBodyHtml,
    failureFooterHtml,
    init,
    installerUrlForVersion,
    isTauri,
    normalizeUpdate,
    parseSemver,
    prepareForInstall,
    progressBodyHtml,
    releaseUrlForVersion,
    updateBodyHtml,
    updateFooterHtml,
    validateTauriManifest,
    waitForFreeModal,
  });
});
