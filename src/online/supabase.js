(function initMarufiaSupabase(root, factory) {
  const configTools = root?.MARUFIA_ONLINE_CONFIG_TOOLS ??
    (typeof module === "object" && module.exports ? require("./config.js") : null);
  const api = factory(configTools, () => root?.supabase);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_SUPABASE = api;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaSupabaseApi(configTools, defaultSdk) {
  "use strict";

  const AUTH_STORAGE_KEY = "marufia-online-auth-v1";
  let cachedSignature = "";
  let cachedClient = null;

  function clientError(message) {
    const error = new Error(message);
    error.code = "LAT-ONLINE-CLIENT-001";
    return error;
  }

  function clientOptions() {
    return {
      db: { schema: "public" },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: AUTH_STORAGE_KEY,
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
    return sdk.createClient(config.supabaseUrl, config.publishableKey, clientOptions());
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
    cachedClient = sdk.createClient(config.supabaseUrl, config.publishableKey, clientOptions());
    cachedSignature = signature;
    return cachedClient;
  }

  function resetSupabaseClient() {
    cachedSignature = "";
    cachedClient = null;
  }

  return {
    AUTH_STORAGE_KEY,
    clientOptions,
    createSupabaseClient,
    getSupabaseClient,
    resetSupabaseClient,
  };
});
