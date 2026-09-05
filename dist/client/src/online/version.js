(function initMarufiaVersion(root, factory) {
  const versionInfo = factory();
  if (typeof module === "object" && module.exports) module.exports = versionInfo;
  if (root) root.MARUFIA_VERSION = versionInfo;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaVersionInfo() {
  "use strict";

  return Object.freeze({
    productName: "Marufia Online",
    version: "0.2.3",
    channel: "alpha",
    channelLabel: "Alpha",
    displayName: "Marufia Online Alpha",
  });
});
