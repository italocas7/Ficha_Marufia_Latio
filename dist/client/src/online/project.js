(function initMarufiaOnlineProject(root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  if (root) root.MARUFIA_ONLINE_CONFIG = config;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaOnlineProjectConfig() {
  "use strict";

  return Object.freeze({
    supabaseUrl: "https://nuczqjyahusjyvepqthx.supabase.co",
    publishableKey: "sb_publishable_TVAaL-DVqiamHTHtfaD9mQ_KLrkQRBD",
    siteUrl: "https://ficha-marufia-latio.italocas7.chatgpt.site",
  });
});
