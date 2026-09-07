(function initMarufiaVersion(root, factory) {
  const versionInfo = factory();
  if (typeof module === "object" && module.exports) module.exports = versionInfo;
  if (root) {
    root.MARUFIA_VERSION = versionInfo;
    const labels = root.document?.querySelectorAll?.("[data-marufia-version]") ?? [];
    for (const label of labels) {
      label.textContent = `v${versionInfo.version}`;
      label.setAttribute("aria-label", `Versão ${versionInfo.version} do Marufia Online`);
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaVersionInfo() {
  "use strict";

  return Object.freeze({
    productName: "Marufia Online",
    version: "0.3.0",
    channel: "alpha",
    channelLabel: "Alpha",
    displayName: "Marufia Online Alpha",
  });
});
