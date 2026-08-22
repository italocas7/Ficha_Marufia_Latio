(function initMarufiaOnlineErrors(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_ERRORS = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaOnlineErrorsApi(root) {
  "use strict";

  const ONLINE_ERROR_EVENT = "marufia:online-error";
  const DEFAULT_LIMIT = 50;
  const SENSITIVE_LABEL = /password|passwd|senha|token|secret|service.?role|authorization|api.?key|access.?key|refresh.?key/i;
  const SAFE_CODE = /^(?:LAT-[A-Z0-9-]{1,64}|PGRST[0-9A-Z]{1,16}|[0-9A-Z]{5})$/;
  const SAFE_LABEL = /^[a-z][a-z0-9-]{0,39}$/;
  const USER_MESSAGES = Object.freeze({
    sync: Object.freeze({
      title: "Não foi possível sincronizar sua ficha.",
      detail: "Os dados continuam salvos neste computador.",
    }),
    realtime: Object.freeze({
      title: "A conexão ao vivo foi interrompida.",
      detail: "A ficha local continua disponível e tentará reconectar.",
    }),
    account: Object.freeze({
      title: "Não foi possível acessar sua conta agora.",
      detail: "A ficha local continua disponível neste computador.",
    }),
    online: Object.freeze({
      title: "Não foi possível concluir a operação online.",
      detail: "Seus dados locais não foram removidos.",
    }),
  });

  function safeLabel(value, fallback) {
    const candidate = String(value ?? "").trim().toLowerCase();
    return SAFE_LABEL.test(candidate) && !SENSITIVE_LABEL.test(candidate) ? candidate : fallback;
  }

  function safeErrorCode(error) {
    const candidate = String(error?.code ?? "").trim().toUpperCase();
    return SAFE_CODE.test(candidate) && !SENSITIVE_LABEL.test(candidate)
      ? candidate
      : "LAT-ONLINE-UNKNOWN";
  }

  function classifyOnlineError(error) {
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (detail.includes("conflict") || detail.includes("40001")) return "conflict";
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("offline")
      || detail.includes("timeout") || detail.includes("timed out")
      || detail.includes("não foi possível acessar")) return "network";
    if (detail.includes("auth") || detail.includes("login") || detail.includes("session")) return "account";
    if (detail.includes("permission") || detail.includes("forbidden") || detail.includes("42501")) return "permission";
    if (detail.includes("invalid") || detail.includes("validation") || detail.includes("22023")) return "validation";
    return "unknown";
  }

  function friendlyOnlineError(scope = "online") {
    const safeScope = safeLabel(scope, "online");
    const message = USER_MESSAGES[safeScope] ?? USER_MESSAGES.online;
    return Object.freeze({ ...message, message: `${message.title} ${message.detail}` });
  }

  function createSafeErrorLog(options = {}) {
    const requestedLimit = Number(options.limit);
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 200)
      : DEFAULT_LIMIT;
    const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();
    let records = [];

    function record(error, context = {}) {
      const scope = safeLabel(context.scope, "online");
      const operation = safeLabel(context.operation, "unknown");
      const friendly = friendlyOnlineError(scope);
      const entry = Object.freeze({
        at: String(now()),
        code: safeErrorCode(error),
        scope,
        operation,
        kind: classifyOnlineError(error),
        title: friendly.title,
        detail: friendly.detail,
        userMessage: friendly.message,
      });
      records = [entry, ...records].slice(0, limit);
      return entry;
    }

    return Object.freeze({
      record,
      entries: () => Object.freeze([...records]),
      clear() { records = []; },
    });
  }

  const safeLog = createSafeErrorLog();

  function report(error, context = {}, view = root ?? globalThis) {
    const entry = safeLog.record(error, context);
    if (context.show !== false && typeof view?.dispatchEvent === "function" && typeof view?.CustomEvent === "function") {
      view.dispatchEvent(new view.CustomEvent(ONLINE_ERROR_EVENT, { detail: entry }));
    }
    return entry;
  }

  function showOnlineError(document, entry, view = document?.defaultView ?? root ?? globalThis) {
    const toastRoot = document?.querySelector?.("#toastRoot");
    if (!toastRoot || !entry?.title || !entry?.detail) return null;
    const key = `${safeLabel(entry.scope, "online")}:${safeLabel(entry.operation, "unknown")}`;
    toastRoot.querySelector?.(`[data-online-error-key="${key}"]`)?.remove?.();
    const toast = document.createElement("div");
    toast.className = "toast danger online-error-toast";
    toast.dataset.onlineErrorKey = key;
    toast.setAttribute("role", "alert");
    const title = document.createElement("strong");
    title.textContent = entry.title;
    const detail = document.createElement("span");
    detail.textContent = entry.detail;
    toast.append(title, detail);
    toastRoot.append(toast);
    view?.setTimeout?.(() => toast.remove?.(), 9000);
    return toast;
  }

  function init(document, view = document?.defaultView ?? root ?? globalThis) {
    const toastRoot = document?.querySelector?.("#toastRoot");
    if (!toastRoot || toastRoot.dataset.onlineErrorsInitialized === "true" || typeof view?.addEventListener !== "function") return null;
    const handler = (event) => showOnlineError(document, event?.detail, view);
    view.addEventListener(ONLINE_ERROR_EVENT, handler);
    toastRoot.dataset.onlineErrorsInitialized = "true";
    return Object.freeze({
      destroy() {
        view.removeEventListener?.(ONLINE_ERROR_EVENT, handler);
        delete toastRoot.dataset.onlineErrorsInitialized;
      },
    });
  }

  return Object.freeze({
    ONLINE_ERROR_EVENT,
    DEFAULT_LIMIT,
    USER_MESSAGES,
    safeErrorCode,
    classifyOnlineError,
    friendlyOnlineError,
    createSafeErrorLog,
    report,
    entries: safeLog.entries,
    clear: safeLog.clear,
    showOnlineError,
    init,
  });
});
