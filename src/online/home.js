(function initMarufiaHome(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_HOME = api;
  if (root?.document) Promise.resolve().then(() => api.init(
    root.document,
    root.MARUFIA_SUPABASE,
    root.MARUFIA_CAMPAIGNS,
    root.MARUFIA_CHARACTERS,
  ));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaHomeApi() {
  "use strict";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function friendlyHomeMessage(error, campaignTools, characterTools) {
    const campaignMessage = campaignTools?.friendlyCampaignMessage?.(error);
    if (campaignMessage && !/^Não foi possível concluir a operação da campanha/i.test(campaignMessage)) return campaignMessage;
    const characterMessage = characterTools?.friendlyCharacterMessage?.(error);
    if (characterMessage) return characterMessage;
    return "Não foi possível carregar o início online agora. Sua ficha local continua disponível.";
  }

  function createHomeService(client, campaignTools, characterTools) {
    if (!campaignTools?.createCampaignService || !characterTools?.createCharacterService) {
      throw new Error("Os serviços do Marufia Online não estão disponíveis.");
    }
    const campaignService = campaignTools.createCampaignService(client);
    const characterService = characterTools.createCharacterService(client);

    async function load() {
      const currentUserId = await campaignService.currentUserId();
      const [characters, memberships] = await Promise.all([
        characterService.listOwn(),
        campaignService.listOwnMemberships(currentUserId),
      ]);
      const campaigns = await campaignService.listVisible(memberships.map((membership) => membership.campaign_id));
      return Object.freeze({
        currentUserId,
        characters: Object.freeze([...characters]),
        memberships: Object.freeze([...memberships]),
        campaigns: Object.freeze([...campaigns]),
      });
    }

    return Object.freeze({ load });
  }

  function campaignName(campaigns, campaignId) {
    return campaigns.find((campaign) => campaign.id === campaignId)?.name ?? "Sem campanha";
  }

  function formatUpdatedAt(value) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Data indisponível";
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  }

  function gmCampaigns(state) {
    const gmIds = new Set((state.memberships ?? [])
      .filter((membership) => membership.role === "gm")
      .map((membership) => membership.campaign_id));
    return (state.campaigns ?? []).filter((campaign) => gmIds.has(campaign.id));
  }

  function characterListHtml(state) {
    const characters = Array.isArray(state.characters) ? state.characters : [];
    const content = state.loading
      ? `<div class="empty" role="status">Carregando suas fichas…</div>`
      : characters.length
        ? characters.map((character) => `<article class="online-home-character-card">
          <div><strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(campaignName(state.campaigns ?? [], character.campaign_id))}</span></div>
          <div><span>Schema v${escapeHtml(character.schema_version)}</span><time datetime="${escapeHtml(character.updated_at)}">${escapeHtml(formatUpdatedAt(character.updated_at))}</time></div>
        </article>`).join("")
        : `<div class="empty">Você ainda não possui fichas online. A ficha deste computador pode ser importada para sua conta.</div>`;
    return `<div class="online-home stack" data-online-home-modal data-online-home-view="characters">
      <div class="online-home-heading"><div><span class="online-home-eyebrow">MARUFIA</span><h3>Minhas fichas</h3><p>Suas fichas continuam salvas localmente e sincronizadas com segurança quando vinculadas.</p></div><span class="online-home-count">${escapeHtml(characters.length)} ${characters.length === 1 ? "ficha" : "fichas"}</span></div>
      ${state.message ? `<p class="auth-message auth-message-error" role="alert">${escapeHtml(state.message)}</p>` : ""}
      <div class="online-home-character-list stack">${content}</div>
      <div class="online-home-inline-actions"><button class="ghost" type="button" data-online-home-action="home">Voltar ao início</button><button class="button" type="button" data-online-home-action="sheet">Continuar na ficha</button></div>
    </div>`;
  }

  function homeDialogHtml(state = {}) {
    if (state.mode === "characters") return characterListHtml(state);
    const characters = Array.isArray(state.characters) ? state.characters : [];
    const campaigns = Array.isArray(state.campaigns) ? state.campaigns : [];
    const administered = gmCampaigns(state);
    const userName = String(state.userName || "Aventureiro");
    const stats = state.loading
      ? "Atualizando seus dados online…"
      : `${characters.length} ${characters.length === 1 ? "ficha" : "fichas"} · ${campaigns.length} ${campaigns.length === 1 ? "campanha" : "campanhas"}`;
    const gmAccess = state.loading
      ? ""
      : administered.length
        ? `<section class="online-home-gm"><div><span class="online-home-eyebrow">ÁREA DO MÆSTRE</span><h3>Painéis que você administra</h3><p>O papel de Mæstre permanece separado em cada campanha.</p></div><div class="online-home-gm-actions">${administered.map((campaign) => `<button class="button" type="button" data-online-home-action="gm" data-online-gm-panel-action="open" data-campaign-id="${escapeHtml(campaign.id)}" data-campaign-name="${escapeHtml(campaign.name)}">Painel do Mæstre · ${escapeHtml(campaign.name)}</button>`).join("")}</div></section>`
        : "";

    return `<div class="online-home stack" data-online-home-modal data-online-home-view="home">
      <section class="online-home-hero"><div><span class="online-home-eyebrow">MARUFIA ONLINE</span><h3>Bem-vindo, ${escapeHtml(userName)}</h3><p>Escolha para onde deseja ir. A ficha atual permanece aberta e salva neste computador.</p></div><span class="online-home-summary" role="status">${escapeHtml(stats)}</span></section>
      ${state.message ? `<p class="auth-message auth-message-error" role="alert">${escapeHtml(state.message)}</p>` : ""}
      <nav class="online-home-grid" aria-label="Áreas do Marufia Online">
        <button class="online-home-card" type="button" data-online-home-action="characters"><span aria-hidden="true">◇</span><strong>Minhas fichas</strong><small>Consulte seus personagens online</small></button>
        <button class="online-home-card" type="button" data-online-home-action="campaigns"><span aria-hidden="true">♜</span><strong>Campanhas</strong><small>Veja campanhas e rolagens</small></button>
        <button class="online-home-card" type="button" data-online-home-action="join"><span aria-hidden="true">＋</span><strong>Entrar em campanha</strong><small>Use um código de convite</small></button>
        <button class="online-home-card" type="button" data-online-home-action="settings"><span aria-hidden="true">⚙</span><strong>Configurações</strong><small>Aparência, backup e importação</small></button>
      </nav>
      ${gmAccess}
      <div class="online-home-inline-actions"><button class="ghost" type="button" data-online-home-action="refresh" ${state.loading ? "disabled" : ""}>${state.loading ? "Atualizando…" : "Atualizar"}</button><button class="button" type="button" data-online-home-action="sheet">Continuar na ficha</button></div>
    </div>`;
  }

  function init(document, supabaseTools, campaignTools, characterTools) {
    const homeButton = document.querySelector("#onlineHomeButton");
    const accountButton = document.querySelector("#onlineAccountButton");
    const campaignsButton = document.querySelector("#onlineCampaignsButton");
    const modalRoot = document.querySelector("#modalRoot");
    if (!homeButton || !accountButton || !campaignsButton || !modalRoot || homeButton.dataset.homeInitialized === "true") return null;
    homeButton.dataset.homeInitialized = "true";

    const view = document.defaultView ?? globalThis;
    let service = null;
    let dialogOpen = false;
    let lastAutoUserId = "";
    let state = { mode: "home", loading: false, characters: [], campaigns: [], memberships: [], userName: "", message: "" };

    function signedIn() {
      return accountButton.dataset.authState === "online";
    }

    function renderDialog() {
      if (!dialogOpen) return;
      const body = homeDialogHtml(state);
      const footer = `<button class="ghost" type="button" data-online-home-action="sheet">Fechar</button>`;
      if (typeof view.openModal === "function") view.openModal("Marufia", body, footer);
      else modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-body">${body}</div><footer>${footer}</footer></div></div>`;
      modalRoot.querySelector(".modal")?.classList.add("online-home-modal-shell");
    }

    function applyState(next) {
      state = { ...state, ...next };
      renderDialog();
    }

    async function loadSummary() {
      if (!service) return;
      applyState({ loading: true, message: "" });
      try {
        const summary = await service.load();
        applyState({ ...summary, loading: false, message: "" });
      } catch (error) {
        applyState({ loading: false, message: friendlyHomeMessage(error, campaignTools, characterTools) });
      }
    }

    function open() {
      if (!signedIn() || !service) return;
      dialogOpen = true;
      state = { ...state, mode: "home", userName: accountButton.textContent?.trim() || "Aventureiro", message: "" };
      renderDialog();
      void loadSummary();
    }

    function close() {
      dialogOpen = false;
      if (typeof view.closeModal === "function") view.closeModal();
      else modalRoot.innerHTML = "";
    }

    function syncAvailability() {
      const available = signedIn() && Boolean(service);
      homeButton.hidden = !available;
      if (!available) {
        lastAutoUserId = "";
        if (dialogOpen) close();
      }
    }

    function requestCampaigns(mode) {
      dialogOpen = false;
      if (typeof view.dispatchEvent === "function" && typeof view.CustomEvent === "function") {
        view.dispatchEvent(new view.CustomEvent("marufia:open-campaigns", { detail: { mode } }));
      } else if (mode !== "join") campaignsButton.click();
    }

    function handleClick(event) {
      const control = event.target.closest?.("[data-online-home-action]");
      if (!control) return;
      const action = control.dataset.onlineHomeAction;
      if (action === "open") open();
      else if (action === "characters") applyState({ mode: "characters" });
      else if (action === "home") applyState({ mode: "home" });
      else if (action === "refresh") void loadSummary();
      else if (action === "sheet") close();
      else if (action === "campaigns" || action === "join") requestCampaigns(action === "join" ? "join" : "list");
      else if (action === "settings") {
        dialogOpen = false;
        document.querySelector('[data-action="open-settings"]')?.click();
      } else if (action === "gm") {
        dialogOpen = false;
      }
    }

    function handleAuthState(event) {
      const detail = event?.detail ?? {};
      if (!detail.signedIn) {
        lastAutoUserId = "";
        return;
      }
      const userId = String(detail.userId ?? "");
      if (detail.event === "SIGNED_IN" && userId && userId !== lastAutoUserId) {
        lastAutoUserId = userId;
        open();
      }
    }

    document.addEventListener("click", handleClick);
    view.addEventListener?.("marufia:auth-state-changed", handleAuthState);

    try {
      const client = supabaseTools?.getSupabaseClient?.();
      service = client ? createHomeService(client, campaignTools, characterTools) : null;
    } catch {
      service = null;
    }

    const authObserver = typeof view.MutationObserver === "function" ? new view.MutationObserver(syncAvailability) : null;
    authObserver?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    const modalObserver = typeof view.MutationObserver === "function" ? new view.MutationObserver(() => {
      if (dialogOpen && !modalRoot.querySelector("[data-online-home-modal]")) dialogOpen = false;
    }) : null;
    modalObserver?.observe(modalRoot, { childList: true, subtree: true });
    syncAvailability();

    return Object.freeze({
      service,
      open,
      destroy() {
        authObserver?.disconnect?.();
        modalObserver?.disconnect?.();
        document.removeEventListener("click", handleClick);
        view.removeEventListener?.("marufia:auth-state-changed", handleAuthState);
        if (document.documentElement?.dataset) delete homeButton.dataset.homeInitialized;
      },
    });
  }

  return {
    createHomeService,
    friendlyHomeMessage,
    gmCampaigns,
    homeDialogHtml,
    init,
  };
});
