(function initMarufiaOnlineProject(root, factory) {
  const config = factory({"backendMode":"cloud","buildEnvironment":"production","supabaseUrl":"https://nuczqjyahusjyvepqthx.supabase.co","publishableKey":"sb_publishable_TVAaL-DVqiamHTHtfaD9mQ_KLrkQRBD","siteUrl":"https://ficha-marufia-latio.italocas7.chatgpt.site"});
  if (typeof module === "object" && module.exports) module.exports = config;
  if (root) root.MARUFIA_ONLINE_CONFIG = config;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaOnlineProjectConfig(source) {
  "use strict";

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return Object.freeze({
      backendMode: "unconfigured",
      buildEnvironment: "source",
      supabaseUrl: "",
      publishableKey: "",
      siteUrl: "",
    });
  }

  return Object.freeze({
    backendMode: String(source.backendMode || ""),
    buildEnvironment: String(source.buildEnvironment || ""),
    supabaseUrl: String(source.supabaseUrl || ""),
    publishableKey: String(source.publishableKey || ""),
    siteUrl: String(source.siteUrl || ""),
  });
});
