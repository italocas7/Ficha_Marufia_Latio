(function initMarufiaSupabase(root, factory) {
  const configTools = root?.MARUFIA_ONLINE_CONFIG_TOOLS ??
    (typeof module === "object" && module.exports ? require("./config.js") : null);
  const api = factory(configTools, () => root?.supabase, () => root?.localStorage);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_SUPABASE = api;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaSupabaseApi(configTools, defaultSdk, defaultStorage) {
  "use strict";

  const LEGACY_AUTH_STORAGE_KEY = "marufia-online-auth-v1";
  const AUTH_STORAGE_PREFIX = "marufia-online-auth-v2";
  let cachedSignature = "";
  let cachedClient = null;

  function clientError(message) {
    const error = new Error(message);
    error.code = "LAT-ONLINE-CLIENT-001";
    return error;
  }

  function authStorageKey(supabaseUrl) {
    const origin = new URL(String(supabaseUrl)).origin.toLowerCase();
    return `${AUTH_STORAGE_PREFIX}-${origin.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  }

  function jwtPayload(token) {
    const encoded = String(token ?? "").split(".")[1];
    if (!encoded) return null;
    try {
      const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      const decoded = typeof atob === "function"
        ? atob(normalized)
        : typeof Buffer === "function"
          ? Buffer.from(normalized, "base64").toString("utf8")
          : "";
      return decoded ? JSON.parse(decoded) : null;
    } catch {
      return null;
    }
  }

  function sessionMatchesBackend(rawSession, supabaseUrl) {
    try {
      const session = JSON.parse(String(rawSession));
      const issuer = new URL(String(jwtPayload(session?.access_token)?.iss ?? ""));
      return issuer.origin === new URL(String(supabaseUrl)).origin;
    } catch {
      return false;
    }
  }

  function migrateLegacyAuthSession(storage, config) {
    if (!storage?.getItem || !storage?.setItem || !config?.supabaseUrl) return false;
    const targetKey = authStorageKey(config.supabaseUrl);
    try {
      if (storage.getItem(targetKey) != null) return false;
      const legacySession = storage.getItem(LEGACY_AUTH_STORAGE_KEY);
      if (!legacySession || !sessionMatchesBackend(legacySession, config.supabaseUrl)) return false;
      storage.setItem(targetKey, legacySession);
      return true;
    } catch {
      return false;
    }
  }

  function clientOptions(config) {
    return {
      db: { schema: "public" },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: authStorageKey(config.supabaseUrl),
      },
    };
  }

  function normalizedConfig(source) {
    if (!configTools?.readPublicConfig) throw clientError("O módulo de configuração online não foi carregado.");
    return configTools.readPublicConfig(source);
  }

  function createSupabaseClient(source = {}, sdk = defaultSdk()) {
    const config = normalizedConfig(source);
    if (!config.configured) return null;
    if (!sdk?.createClient) throw clientError("A biblioteca oficial do Supabase não foi carregada.");
    migrateLegacyAuthSession(defaultStorage?.(), config);
    return sdk.createClient(config.supabaseUrl, config.publishableKey, clientOptions(config));
  }

  function getSupabaseClient(source = globalThis.MARUFIA_ONLINE_CONFIG ?? {}, sdk = defaultSdk()) {
    const config = normalizedConfig(source);
    if (!config.configured) {
      cachedSignature = "";
      cachedClient = null;
      return null;
    }
    const signature = `${config.supabaseUrl}\n${config.publishableKey}`;
    if (cachedClient && cachedSignature === signature) return cachedClient;
    if (!sdk?.createClient) throw clientError("A biblioteca oficial do Supabase não foi carregada.");
    migrateLegacyAuthSession(defaultStorage?.(), config);
    cachedClient = sdk.createClient(config.supabaseUrl, config.publishableKey, clientOptions(config));
    cachedSignature = signature;
    return cachedClient;
  }

  function resetSupabaseClient() {
    cachedSignature = "";
    cachedClient = null;
  }

  return {
    AUTH_STORAGE_PREFIX,
    LEGACY_AUTH_STORAGE_KEY,
    authStorageKey,
    clientOptions,
    createSupabaseClient,
    getSupabaseClient,
    migrateLegacyAuthSession,
    resetSupabaseClient,
    sessionMatchesBackend,
  };
});
