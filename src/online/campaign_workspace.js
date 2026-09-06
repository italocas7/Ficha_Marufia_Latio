(function initMarufiaCampaignWorkspace(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CAMPAIGN_WORKSPACE = api;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaCampaignWorkspaceApi() {
  "use strict";

  const VIEWS = Object.freeze({ campaign: "campaign", gm: "gm", rolls: "rolls" });
  const VIEW_LABELS = Object.freeze({
    [VIEWS.campaign]: "Campanha",
    [VIEWS.gm]: "Painel do Mæstre",
    [VIEWS.rolls]: "Rolagens",
  });
  const workspaceControllers = new WeakMap();

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character]);
  }

  function viewActionAttributes(view, campaignId, campaignName) {
    const id = escapeHtml(campaignId);
    const name = escapeHtml(campaignName);
    if (view === VIEWS.campaign) {
      return `data-online-campaign-action="detail" data-campaign-id="${id}" data-campaign-name="${name}"`;
    }
    if (view === VIEWS.gm) {
      return `data-online-gm-panel-action="open" data-campaign-id="${id}" data-campaign-name="${name}"`;
    }
    return `data-online-live-rolls-action="open" data-campaign-id="${id}" data-campaign-name="${name}"`;
  }

  function campaignWorkspaceNavigationHtml(options = {}) {
    const activeView = Object.values(VIEWS).includes(options.activeView) ? options.activeView : VIEWS.campaign;
    const campaignId = String(options.campaignId ?? "");
    const campaignName = String(options.campaignName ?? "Campanha");
    const views = options.role === "gm"
      ? [VIEWS.campaign, VIEWS.gm, VIEWS.rolls]
      : [VIEWS.campaign, VIEWS.rolls];
    const buttons = views.map((view) => {
      const active = view === activeView;
      const action = active ? "" : ` ${viewActionAttributes(view, campaignId, campaignName)}`;
      return `<button class="campaign-workspace-tab${active ? " is-active" : ""}" type="button" data-campaign-workspace-view="${view}"${active ? ' aria-current="page"' : ""}${action}>${escapeHtml(VIEW_LABELS[view])}</button>`;
    }).join("");
    return `<nav class="campaign-workspace-nav" data-campaign-workspace-nav aria-label="Áreas da campanha ${escapeHtml(campaignName)}">${buttons}</nav>`;
  }

  function focusActiveNavigation(modalRoot, view = globalThis) {
    const active = modalRoot?.querySelector?.("[data-campaign-workspace-nav] [aria-current=\"page\"]");
    if (!active || typeof active.focus !== "function") return false;
    const focus = () => active.isConnected !== false && active.focus({ preventScroll: true });
    if (typeof view?.requestAnimationFrame === "function") view.requestAnimationFrame(focus);
    else focus();
    return true;
  }

  function registerWorkspaceView(view, name, stop) {
    if ((!view || (typeof view !== "object" && typeof view !== "function")) || !Object.values(VIEWS).includes(name) || typeof stop !== "function") {
      return () => {};
    }
    const controllers = workspaceControllers.get(view) ?? new Map();
    controllers.set(name, stop);
    workspaceControllers.set(view, controllers);
    return () => {
      if (controllers.get(name) === stop) controllers.delete(name);
      if (!controllers.size) workspaceControllers.delete(view);
    };
  }

  async function deactivateWorkspaceViews(view, activeView) {
    const controllers = workspaceControllers.get(view);
    if (!controllers) return true;
    await Promise.all(Array.from(controllers.entries())
      .filter(([name]) => name !== activeView)
      .map(([, stop]) => Promise.resolve().then(stop).catch(() => undefined)));
    return true;
  }

  function isCampaignAccessUnavailable(error) {
    const detail = `${error?.code ?? ""} ${error?.message ?? ""} ${error?.userMessage ?? ""}`.toLowerCase();
    return detail.includes("42501")
      || detail.includes("pgrst116")
      || detail.includes("not found")
      || detail.includes("não encontrada")
      || detail.includes("campaign member")
      || detail.includes("membership required")
      || detail.includes("gm required")
      || detail.includes("membro da campanha")
      || detail.includes("somente o mæstre")
      || detail.includes("somente o mestre")
      || detail.includes("somente participantes");
  }

  function returnToCampaignList(view, message = "A campanha não está mais disponível para sua conta.") {
    if (typeof view?.dispatchEvent !== "function" || typeof view?.CustomEvent !== "function") return false;
    view.dispatchEvent(new view.CustomEvent("marufia:open-campaigns", {
      detail: { message: String(message), messageKind: "error" },
    }));
    return true;
  }

  return {
    VIEWS,
    VIEW_LABELS,
    escapeHtml,
    campaignWorkspaceNavigationHtml,
    focusActiveNavigation,
    registerWorkspaceView,
    deactivateWorkspaceViews,
    isCampaignAccessUnavailable,
    returnToCampaignList,
  };
});
