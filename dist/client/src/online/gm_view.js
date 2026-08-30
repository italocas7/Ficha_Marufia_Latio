(function initMarufiaGmView(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_GM_VIEW = api;
  if (root?.document) api.init(root);
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaGmViewApi() {
  "use strict";

  const MESSAGE_TYPE = "marufia:gm-view-state";

  function viewerToken(location) {
    try {
      return new URLSearchParams(location?.search ?? "").get("token") ?? "";
    } catch {
      return "";
    }
  }

  function validMessage(event, token, parent) {
    return Boolean(
      token
      && event?.source === parent
      && event?.data?.type === MESSAGE_TYPE
      && event.data.token === token
      && event.data.state?.meta?.appId === "marufia-latio"
      && Number(event.data.state?.meta?.schemaVersion) === 5,
    );
  }

  function init(view) {
    const token = viewerToken(view.location);
    if (!token || !view.parent || view.parent === view) return null;
    const receive = (event) => {
      if (!validMessage(event, token, view.parent)) return;
      try {
        const loaded = view.MARUFIA_APP_BRIDGE?.loadGmViewSnapshot?.(event.data.state);
        if (loaded) view.document.querySelector("#app")?.setAttribute("aria-busy", "false");
      } catch {
        const status = view.document.querySelector("#statusLine");
        if (status) status.textContent = "Não foi possível abrir esta ficha.";
      }
    };
    view.addEventListener("message", receive);
    return Object.freeze({ destroy: () => view.removeEventListener("message", receive) });
  }

  return { MESSAGE_TYPE, viewerToken, validMessage, init };
});
