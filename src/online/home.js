(function initMarufiaHome(root, factory) {
  const offlineTools = root?.MARUFIA_OFFLINE
    ?? (typeof module === "object" && module.exports ? require("./offline.js") : null);
  const api = factory(root, offlineTools);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_HOME = api;
  if (root?.document) Promise.resolve().then(() => api.init(
    root.document,
    root.MARUFIA_SUPABASE,
    root.MARUFIA_CAMPAIGNS,
    root.MARUFIA_CHARACTERS,
    root.MARUFIA_APP_BRIDGE,
    root.LATIO_STORAGE,
    root.MARUFIA_CHARACTER_IMPORT,
    root.MARUFIA_CHARACTER_SYNC,
  ));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaHomeApi(root, offlineTools) {
  "use strict";

  const BEFORE_CHARACTER_SWITCH_EVENT = "marufia:before-character-switch";
  const CHARACTER_SWITCH_TIMEOUT_MS = 5000;

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

    async function loadCharacter(characterId) {
      return characterService.loadOwn(characterId);
    }

    return Object.freeze({ load, loadCharacter });
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

  async function waitForCharacterSwitch(view = root ?? globalThis, timeoutMs = CHARACTER_SWITCH_TIMEOUT_MS) {
    const pending = [];
    if (typeof view?.dispatchEvent !== "function" || typeof view?.CustomEvent !== "function") return true;
    const detail = {
      waitUntil(task) {
        if (task && typeof task.then === "function") pending.push(Promise.resolve(task));
      },
    };
    view.dispatchEvent(new view.CustomEvent(BEFORE_CHARACTER_SWITCH_EVENT, { detail }));
    if (!pending.length) return true;
    const schedule = view?.setTimeout?.bind?.(view) ?? setTimeout;
    const cancel = view?.clearTimeout?.bind?.(view) ?? clearTimeout;
    let timer = null;
    await Promise.race([
      Promise.allSettled(pending),
      new Promise((resolve) => { timer = schedule(resolve, timeoutMs); }),
    ]);
    if (timer !== null) cancel(timer);
    return true;
  }

  function currentLinkedCharacterId(state, appBridge, storage, importTools, backendId = "") {
    const snapshot = appBridge?.snapshot?.();
    const identity = importTools?.localSheetIdentity?.(snapshot);
    if (!identity || !state?.currentUserId) return "";
    return String(importTools?.importedCharacterId?.(storage, state.currentUserId, identity, backendId) ?? "");
  }

  async function activateRemoteCharacter({
    service,
    characterId,
    currentUserId,
    appBridge,
    storage,
    importTools,
    syncTools,
    backendId = "",
    beforeSwitch = () => Promise.resolve(),
    createBackup = true,
    view = root ?? globalThis,
  }) {
    if (!service?.loadCharacter || !characterId || !currentUserId
      || typeof appBridge?.applyRemoteSnapshot !== "function"
      || !storage || !importTools?.localSheetIdentity || !importTools?.markImported) {
      const error = new Error("O carregamento da ficha online não está disponível.");
      error.userMessage = error.message;
      throw error;
    }
    await beforeSwitch();
    const character = await service.loadCharacter(characterId);
    if (createBackup && appBridge.hasExistingSheet?.()) appBridge.createOnlineImportBackup?.();
    if (!appBridge.applyRemoteSnapshot(character.state)) {
      const error = new Error("Não foi possível guardar a ficha online neste aparelho.");
      error.userMessage = `${error.message} A ficha que já estava aberta foi preservada.`;
      throw error;
    }
    const identity = importTools.localSheetIdentity(character.state);
    const linked = identity && importTools.markImported(storage, currentUserId, identity, character.id, backendId);
    if (!linked) {
      const error = new Error("A ficha foi carregada, mas não foi possível vinculá-la à conta neste aparelho.");
      error.userMessage = `${error.message} Recarregue a página e tente novamente antes de editar.`;
      throw error;
    }
    syncTools?.rememberSyncedCharacter?.(storage, currentUserId, character, backendId);
    importTools.announceLinkedCharacter?.(view, character);
    return character;
  }

  function characterListHtml(state) {
    const characters = Array.isArray(state.characters) ? state.characters : [];
    const selectedCharacterId = String(state.selectedCharacterId ?? "");
    const content = state.loading
      ? `<div class="empty" role="status">Carregando suas fichas…</div>`
      : characters.length
        ? characters.map((character) => `<button class="online-home-character-card${character.id === selectedCharacterId ? " is-selected" : ""}" type="button" data-online-home-action="select-character" data-character-id="${escapeHtml(character.id)}" aria-pressed="${character.id === selectedCharacterId ? "true" : "false"}">
          <div><strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(campaignName(state.campaigns ?? [], character.campaign_id))}</span></div>
          <div><span>Schema v${escapeHtml(character.schema_version)}</span><time datetime="${escapeHtml(character.updated_at)}">${escapeHtml(formatUpdatedAt(character.updated_at))}</time></div>
        </button>`).join("")
        : `<div class="empty">Você ainda não possui fichas online. A ficha deste computador pode ser importada para sua conta.</div>`;
    const opening = Boolean(state.openingCharacterId);
    return `<div class="online-home stack" data-online-home-modal data-online-home-view="characters">
      <div class="online-home-heading"><div><span class="online-home-eyebrow">MARUFIA</span><h3>Minhas fichas</h3><p>Suas fichas continuam salvas localmente e sincronizadas com segurança quando vinculadas.</p></div><span class="online-home-count">${escapeHtml(characters.length)} ${characters.length === 1 ? "ficha" : "fichas"}</span></div>
      ${state.message ? `<p class="auth-message auth-message-error" role="alert">${escapeHtml(state.message)}</p>` : ""}
      <div class="online-home-character-list stack">${content}</div>
      <div class="online-home-inline-actions"><button class="ghost" type="button" data-online-home-action="home" ${opening ? "disabled" : ""}>Voltar ao início</button><button class="ghost" type="button" data-online-home-action="sheet" ${opening ? "disabled" : ""}>Continuar na ficha atual</button><button class="button" type="button" data-online-home-action="open-character" ${selectedCharacterId && !opening ? "" : "disabled"}>${opening ? "Abrindo…" : "Abrir ficha selecionada"}</button></div>
    </div>`;
  }

  function characterConfirmationHtml(state) {
    const character = (state.characters ?? []).find((item) => item.id === state.selectedCharacterId);
    const opening = Boolean(state.openingCharacterId);
    return `<div class="online-home stack" data-online-home-modal data-online-home-view="character-confirm">
      <div class="online-home-heading"><div><span class="online-home-eyebrow">TROCAR DE FICHA</span><h3>Abrir ${escapeHtml(character?.name ?? "ficha online")}</h3><p>A ficha que está aberta neste aparelho será substituída pela versão salva na sua conta.</p></div></div>
      <div class="character-import-summary"><span class="muted small">Ficha da conta</span><strong>${escapeHtml(character?.name ?? "Personagem sem nome")}</strong><span>${escapeHtml(campaignName(state.campaigns ?? [], character?.campaign_id))}</span></div>
      <p class="muted small">Antes da troca, será criado automaticamente um backup da ficha atual neste aparelho.</p>
      ${state.message ? `<p class="auth-message auth-message-error" role="alert">${escapeHtml(state.message)}</p>` : ""}
      <div class="online-home-inline-actions"><button class="ghost" type="button" data-online-home-action="cancel-character" ${opening ? "disabled" : ""}>Cancelar</button><button class="button" type="button" data-online-home-action="confirm-character" ${opening ? "disabled" : ""}>${opening ? "Abrindo…" : "Abrir ficha da conta"}</button></div>
    </div>`;
  }

  function homeDialogHtml(state = {}) {
    if (state.mode === "characters") return characterListHtml(state);
    if (state.mode === "character-confirm") return characterConfirmationHtml(state);
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

  function init(document, supabaseTools, campaignTools, characterTools, appBridge, storage, importTools, syncTools) {
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
    const backendId = offlineTools?.backendScope?.(view.MARUFIA_ONLINE_CONFIG) ?? "unconfigured";
    let state = { mode: "home", loading: false, openingCharacterId: "", selectedCharacterId: "", characters: [], campaigns: [], memberships: [], currentUserId: "", userName: "", message: "" };

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
        const selectedCharacterId = summary.characters.some((character) => character.id === state.selectedCharacterId)
          ? state.selectedCharacterId
          : String(summary.characters[0]?.id ?? "");
        applyState({ ...summary, selectedCharacterId, loading: false, message: "" });
      } catch (error) {
        applyState({ loading: false, message: friendlyHomeMessage(error, campaignTools, characterTools) });
      }
    }

    function open() {
      if (!signedIn() || !service) return;
      dialogOpen = true;
      state = { ...state, mode: "home", openingCharacterId: "", userName: accountButton.textContent?.trim() || "Aventureiro", message: "" };
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

    function availableImportTools() {
      return importTools ?? view.MARUFIA_CHARACTER_IMPORT;
    }

    function availableSyncTools() {
      return syncTools ?? view.MARUFIA_CHARACTER_SYNC;
    }

    async function openSelectedCharacter() {
      const characterId = String(state.selectedCharacterId ?? "");
      if (!characterId || state.openingCharacterId) return;
      applyState({ openingCharacterId: characterId, message: "" });
      try {
        const character = await activateRemoteCharacter({
          service,
          characterId,
          currentUserId: state.currentUserId,
          appBridge,
          storage,
          importTools: availableImportTools(),
          syncTools: availableSyncTools(),
          backendId,
          beforeSwitch: () => waitForCharacterSwitch(view),
          view,
        });
        state = { ...state, openingCharacterId: "" };
        close();
        view.toast?.(`${character.name} foi carregada da sua conta.`);
      } catch (error) {
        applyState({ openingCharacterId: "", message: friendlyHomeMessage(error, campaignTools, characterTools) });
      }
    }

    function requestOpenCharacter() {
      const characterId = String(state.selectedCharacterId ?? "");
      if (!characterId || state.openingCharacterId) return;
      const currentCharacterId = currentLinkedCharacterId(state, appBridge, storage, availableImportTools(), backendId);
      if (appBridge?.hasExistingSheet?.() && currentCharacterId !== characterId) {
        applyState({ mode: "character-confirm", message: "" });
        return;
      }
      void openSelectedCharacter();
    }

    function handleClick(event) {
      const control = event.target.closest?.("[data-online-home-action]");
      if (!control) return;
      const action = control.dataset.onlineHomeAction;
      if (action === "open") open();
      else if (action === "characters") applyState({ mode: "characters" });
      else if (action === "select-character") applyState({ selectedCharacterId: String(control.dataset.characterId ?? ""), message: "" });
      else if (action === "home") applyState({ mode: "home" });
      else if (action === "refresh") void loadSummary();
      else if (action === "sheet") close();
      else if (action === "open-character") requestOpenCharacter();
      else if (action === "confirm-character") void openSelectedCharacter();
      else if (action === "cancel-character") applyState({ mode: "characters", message: "" });
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
    BEFORE_CHARACTER_SWITCH_EVENT,
    CHARACTER_SWITCH_TIMEOUT_MS,
    createHomeService,
    friendlyHomeMessage,
    gmCampaigns,
    waitForCharacterSwitch,
    currentLinkedCharacterId,
    activateRemoteCharacter,
    characterConfirmationHtml,
    homeDialogHtml,
    init,
  };
});
