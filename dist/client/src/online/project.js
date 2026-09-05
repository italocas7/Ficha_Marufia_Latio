(function initMarufiaOnlineProject(root, factory) {
  const config = factory({"backendMode":"selfhosted","buildEnvironment":"production","supabaseUrl":"https://api.marufiarpg.org","publishableKey":"sb_publishable_rKja2tkBM2qNCslciGfLnl_Ug_up06u","siteUrl":"https://ficha-marufia-latio.italocas7.chatgpt.site","authRedirectUrl":"https://api.marufiarpg.org/auth-confirmed"});
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
      authRedirectUrl: "",
    });
  }

  return Object.freeze({
    backendMode: String(source.backendMode || ""),
    buildEnvironment: String(source.buildEnvironment || ""),
    supabaseUrl: String(source.supabaseUrl || ""),
    publishableKey: String(source.publishableKey || ""),
    siteUrl: String(source.siteUrl || ""),
    authRedirectUrl: String(source.authRedirectUrl || source.siteUrl || ""),
  });
});
