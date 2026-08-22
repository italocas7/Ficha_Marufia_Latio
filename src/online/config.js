(function initMarufiaOnlineConfig(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_ONLINE_CONFIG_TOOLS = api;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaOnlineConfigApi() {
  "use strict";

  function configError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function jwtRole(key) {
    const encoded = String(key || "").split(".")[1];
    if (!encoded || typeof atob !== "function") return "";
    try {
      const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      return String(JSON.parse(atob(normalized))?.role || "");
    } catch {
      return "";
    }
  }

  function validateUrl(rawUrl) {
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      throw configError("LAT-ONLINE-CONFIG-002", "A URL pública do Supabase é inválida.");
    }
    const loopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) {
      throw configError("LAT-ONLINE-CONFIG-002", "A URL do Supabase deve usar HTTPS, exceto no ambiente local.");
    }
    return url.href.replace(/\/$/, "");
  }

  function validatePublishableKey(rawKey) {
    const key = String(rawKey || "").trim();
    if (!key) throw configError("LAT-ONLINE-CONFIG-001", "A chave pública do Supabase não foi informada.");
    if (key.startsWith("sb_secret_") || jwtRole(key) === "service_role") {
      throw configError("LAT-ONLINE-CONFIG-003", "Uma chave secreta do Supabase não pode ser usada no aplicativo.");
    }
    return key;
  }

  function readPublicConfig(source = {}) {
    const rawUrl = String(source.supabaseUrl ?? source.SUPABASE_URL ?? "").trim();
    const rawKey = String(source.publishableKey ?? source.SUPABASE_PUBLISHABLE_KEY ?? source.anonKey ?? source.SUPABASE_ANON_KEY ?? "").trim();
    if (!rawUrl && !rawKey) {
      return Object.freeze({ configured: false, supabaseUrl: "", publishableKey: "" });
    }
    if (!rawUrl || !rawKey) {
      throw configError("LAT-ONLINE-CONFIG-001", "A configuração pública do Supabase está incompleta.");
    }
    return Object.freeze({
      configured: true,
      supabaseUrl: validateUrl(rawUrl),
      publishableKey: validatePublishableKey(rawKey),
    });
  }

  return { readPublicConfig };
});
