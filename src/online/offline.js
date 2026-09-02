(function initMarufiaOffline(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_OFFLINE = api;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaOfflineApi(root) {
  "use strict";

  const DEFAULT_RETRY_DELAYS_MS = Object.freeze([2000, 5000, 15000, 30000, 60000]);

  function backendScope(config = {}) {
    const mode = String(config?.backendMode ?? "backend").trim().toLowerCase() || "backend";
    try {
      const origin = new URL(String(config?.supabaseUrl ?? "")).origin.toLowerCase();
      return `${mode}@${origin}`;
    } catch {
      return "unconfigured";
    }
  }

  function scopedIdentity(scope, ...parts) {
    const identity = parts.map((part) => String(part ?? "").trim()).join("|");
    const backend = String(scope ?? "").trim();
    return backend ? `${backend}|${identity}` : identity;
  }

  function allowsLegacyCloudRecords(scope) {
    return String(scope ?? "").trim().toLowerCase().startsWith("cloud@https://");
  }

  function retryDelays(value) {
    if (!Array.isArray(value) || !value.length) return DEFAULT_RETRY_DELAYS_MS;
    const delays = value.map(Number);
    return delays.every((delay) => Number.isFinite(delay) && delay >= 0)
      ? Object.freeze(delays)
      : DEFAULT_RETRY_DELAYS_MS;
  }

  function createRetryScheduler(task, options = {}) {
    if (typeof task !== "function") throw new Error("A tarefa de reconexão não está disponível.");
    const delays = retryDelays(options.delays);
    const isReady = typeof options.isReady === "function" ? options.isReady : () => true;
    const setTimer = options.setTimer ?? root?.setTimeout ?? globalThis.setTimeout;
    const clearTimer = options.clearTimer ?? root?.clearTimeout ?? globalThis.clearTimeout;
    let timer = null;
    let running = null;
    let attempt = 0;
    let destroyed = false;

    function clearScheduled() {
      if (timer !== null) clearTimer(timer);
      timer = null;
    }

    function schedule(options = {}) {
      if (destroyed || timer !== null || running || !isReady()) return false;
      const delay = options.immediate === true ? 0 : delays[Math.min(attempt, delays.length - 1)];
      timer = setTimer(() => {
        timer = null;
        void run();
      }, delay);
      return true;
    }

    async function run() {
      if (destroyed || !isReady()) return false;
      if (running) return running;
      clearScheduled();
      running = Promise.resolve().then(task).then((result) => result === true, () => false);
      const settled = await running;
      running = null;
      if (destroyed) return false;
      if (settled) {
        attempt = 0;
        clearScheduled();
        return true;
      }
      attempt = Math.min(attempt + 1, delays.length - 1);
      schedule();
      return false;
    }

    return Object.freeze({
      schedule,
      run,
      wake() {
        clearScheduled();
        return run();
      },
      success() {
        attempt = 0;
        clearScheduled();
        return true;
      },
      pause() {
        clearScheduled();
        return true;
      },
      pending: () => timer !== null,
      attempt: () => attempt,
      destroy() {
        destroyed = true;
        clearScheduled();
      },
    });
  }

  return {
    DEFAULT_RETRY_DELAYS_MS,
    backendScope,
    scopedIdentity,
    allowsLegacyCloudRecords,
    retryDelays,
    createRetryScheduler,
  };
});
