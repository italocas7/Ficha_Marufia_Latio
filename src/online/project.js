(function initMarufiaOnlineProject(root, factory) {
  const config = factory("__MARUFIA_PUBLIC_CONFIG__");
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
