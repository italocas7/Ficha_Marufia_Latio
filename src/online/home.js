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
    if (error?.userMessage) return error.userMessage;
    if (!error?.code && /^(Não foi possível|Ficha não encontrada|Os cinco espaços)/i.test(String(error?.message ?? ""))) {
      return error.message;
    }
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

    async function createCharacter(snapshot) {
      return characterService.createIndependent(snapshot);
    }

    async function removeCharacter(characterId, name, revision) {
      return characterService.remove(characterId, name, revision);
    }

    return Object.freeze({ load, loadCharacter, createCharacter, removeCharacter });
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
    const outcome = await Promise.race([
      Promise.allSettled(pending).then((results) => ({ results })),
      new Promise((resolve) => { timer = schedule(() => resolve({ timedOut: true }), timeoutMs); }),
    ]);
    if (timer !== null) cancel(timer);
    if (outcome.timedOut) throw Object.assign(new Error("A ficha ainda está sendo salva. Aguarde e tente trocar novamente."), { code: "LAT-SWITCH-TIMEOUT" });
    const failed = outcome.results.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
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
    slotStore = null,
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
    slotStore?.beforeSwitch?.();
    await beforeSwitch();
    const character = await service.loadCharacter(characterId);
    const scope = slotStore ? `${backendId}|${currentUserId}` : "";
    const existing = slotStore?.findRemote?.(character.id, scope);
    const pending = syncTools?.pendingOfflineSave?.(storage, currentUserId, character.id, backendId);
    if (createBackup && appBridge.hasExistingSheet?.()) appBridge.createOnlineImportBackup?.();
    const loaded = existing && pending ? slotStore.activate(existing.id) : slotStore
      ? slotStore.upsertRemote(character, scope)
      : appBridge.applyRemoteSnapshot(character.state);
    if (!loaded) {
      const error = new Error("Não foi possível guardar a ficha online neste aparelho.");
      error.userMessage = `${error.message} A ficha que já estava aberta foi preservada.`;
      throw error;
    }
    const identity = importTools.localSheetIdentity(existing && pending ? existing.state : character.state);
    const linked = identity && importTools.markImported(storage, currentUserId, identity, character.id, backendId);
    if (!linked) {
      const error = new Error("A ficha foi carregada, mas não foi possível vinculá-la à conta neste aparelho.");
      error.userMessage = `${error.message} Recarregue a página e tente novamente antes de editar.`;
      throw error;
    }
    if (!(existing && pending)) syncTools?.rememberSyncedCharacter?.(storage, currentUserId, character, backendId);
    if (slotStore && !(existing && pending)) slotStore.linkActive(scope, character.id);
    importTools.announceLinkedCharacter?.(view, character);
    return character;
  }

  function characterListHtml(state) {
    const characters = Array.isArray(state.characters) ? state.characters : [];
    const localSlots = Array.isArray(state.localSlots) ? state.localSlots : [];
    const selectedCharacterId = String(state.selectedCharacterId ?? "");
    const content = state.loading && state.signedIn
      ? `<div class="empty" role="status">Carregando suas fichas…</div>`
      : state.signedIn && characters.length
        ? characters.map((character) => `<button class="online-home-character-card${character.id === selectedCharacterId ? " is-selected" : ""}" type="button" data-online-home-action="select-character" data-character-id="${escapeHtml(character.id)}" aria-pressed="${character.id === selectedCharacterId ? "true" : "false"}">
          <div><strong>${escapeHtml(character.name)}</strong><span>${escapeHtml(campaignName(state.campaigns ?? [], character.campaign_id))}</span></div>
          <div><span>Schema v${escapeHtml(character.schema_version)}</span><time datetime="${escapeHtml(character.updated_at)}">${escapeHtml(formatUpdatedAt(character.updated_at))}</time></div>
        </button>`).join("")
        : state.signedIn ? `<div class="empty">Você ainda não possui fichas na conta.</div>` : "";
    const opening = Boolean(state.openingCharacterId);
    const used = state.signedIn ? characters.length + localSlots.filter((slot) => slot.scope !== "guest").length : localSlots.length;
    const localContent = localSlots.map((slot) => `<div class="online-home-local-row"><button class="online-home-character-card" type="button" data-online-home-action="open-local" data-slot-id="${escapeHtml(slot.id)}"><strong>${escapeHtml(slot.state?.character?.name || "Personagem sem nome")}</strong><span>${slot.remoteId ? "Cópia da conta" : "Salva neste aparelho"}</span></button><button class="ghost" type="button" data-online-home-action="delete-local" data-slot-id="${escapeHtml(slot.id)}" aria-label="Excluir ${escapeHtml(slot.state?.character?.name || "ficha")}">Excluir</button></div>`).join("");
    return `<div class="online-home stack" data-online-home-modal data-online-home-view="characters">
      <div class="online-home-heading"><div><span class="online-home-eyebrow">MARUFIA</span><h3>Minhas fichas</h3><p>${state.signedIn ? "Fichas da conta e cópias deste aparelho." : "Fichas salvas neste aparelho."}</p></div><span class="online-home-count">${escapeHtml(used)}/5 espaços</span></div>
      ${state.message ? `<p class="auth-message auth-message-error" role="alert">${escapeHtml(state.message)}</p>` : ""}
      ${state.signedIn ? `<div class="online-home-character-list stack">${content}</div>` : ""}
      ${localSlots.length ? `<div class="online-home-local-list stack"><strong>${state.signedIn ? "Fichas locais não vinculadas" : "Fichas neste aparelho"}</strong>${localContent}</div>` : !state.signedIn ? `<div class="empty">Nenhuma ficha local criada.</div>` : ""}
      <div class="online-home-inline-actions"><button class="ghost" type="button" data-online-home-action="home" ${opening ? "disabled" : ""}>Voltar ao início</button><button class="ghost" type="button" data-online-home-action="sheet" ${opening ? "disabled" : ""}>Continuar na ficha atual</button>${state.signedIn ? `<button class="ghost" type="button" data-online-home-action="open-character" ${selectedCharacterId && !opening ? "" : "disabled"}>${opening ? "Abrindo…" : "Abrir ficha selecionada"}</button>` : ""}<button class="button" type="button" data-online-home-action="new-character" ${used >= 5 || opening ? "disabled" : ""}>Nova ficha</button>${state.signedIn && selectedCharacterId ? `<button class="danger" type="button" data-online-home-action="delete-character" ${opening ? "disabled" : ""}>Excluir selecionada</button>` : ""}</div>
    </div>`;
  }

  function deleteConfirmationHtml(state) {
    const name = String(state.deleteTarget?.name ?? "");
    return `<div class="online-home stack" data-online-home-modal data-online-home-view="delete-confirm"><h3>Excluir ${escapeHtml(name)}?</h3><p>Um backup local será criado antes da exclusão. As rolagens da campanha permanecerão registradas.</p>${state.message ? `<p class="auth-message auth-message-error" role="alert">${escapeHtml(state.message)}</p>` : ""}<form data-online-home-delete-form class="stack"><label for="homeDeleteName">Digite o nome da ficha para confirmar</label><input id="homeDeleteName" name="confirmationName" autocomplete="off" required><div class="online-home-inline-actions"><button class="ghost" type="button" data-online-home-action="characters">Cancelar</button><button class="danger" type="submit" ${state.openingCharacterId ? "disabled" : ""}>Excluir ficha</button></div></form></div>`;
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
    if (state.mode === "delete-confirm") return deleteConfirmationHtml(state);
    const characters = Array.isArray(state.characters) ? state.characters : [];
    const campaigns = Array.isArray(state.campaigns) ? state.campaigns : [];
    const administered = gmCampaigns(state);
    const userName = String(state.userName || "Aventureiro");
    const stats = state.loading
      ? "Atualizando seus dados online…"
      : `${state.signedIn ? characters.length + (state.localSlots ?? []).filter((slot) => slot.scope !== "guest").length : (state.localSlots ?? []).length}/5 fichas · ${campaigns.length} ${campaigns.length === 1 ? "campanha" : "campanhas"}`;
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
    const slotStore = view.MARUFIA_SHEET_SLOTS_STORE;
    let service = null;
    let dialogOpen = false;
    let lastAutoUserId = "";
    const backendId = offlineTools?.backendScope?.(view.MARUFIA_ONLINE_CONFIG) ?? "unconfigured";
    let state = { mode: "home", loading: false, openingCharacterId: "", selectedCharacterId: "", characters: [], campaigns: [], memberships: [], currentUserId: "", userName: "", message: "", localSlots: [], signedIn: false, deleteTarget: null };

    function signedIn() {
      return accountButton.dataset.authState === "online";
    }

    function currentScope() {
      return `${backendId}|${state.currentUserId}`;
    }

    function localSlots() {
      return slotStore?.all?.().filter((slot) => slot.scope === "guest" || (signedIn() && slot.scope === currentScope() && !slot.remoteId)) ?? [];
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
      if (!signedIn() || !service) {
        applyState({ characters: [], campaigns: [], localSlots: slotStore?.list?.("guest") ?? [], signedIn: false, loading: false });
        return;
      }
      applyState({ loading: true, message: "" });
      try {
        const summary = await service.load();
        const selectedCharacterId = summary.characters.some((character) => character.id === state.selectedCharacterId)
          ? state.selectedCharacterId
          : String(summary.characters[0]?.id ?? "");
        applyState({ ...summary, selectedCharacterId, signedIn: true, localSlots: slotStore?.all?.().filter((slot) => slot.scope === "guest" || (slot.scope === `${backendId}|${summary.currentUserId}` && !slot.remoteId)) ?? [], loading: false, message: "" });
      } catch (error) {
        applyState({ loading: false, signedIn: true, localSlots: localSlots(), message: friendlyHomeMessage(error, campaignTools, characterTools) });
      }
    }

    function open() {
      dialogOpen = true;
      state = { ...state, mode: "home", openingCharacterId: "", signedIn: signedIn(), localSlots: signedIn() ? localSlots() : slotStore?.list?.("guest") ?? [], userName: accountButton.textContent?.trim() || "Aventureiro", message: "" };
      renderDialog();
      void loadSummary();
    }

    function close() {
      dialogOpen = false;
      if (typeof view.closeModal === "function") view.closeModal();
      else modalRoot.innerHTML = "";
    }

    function syncAvailability() {
      homeButton.hidden = document.body?.dataset?.gmView === "true";
      if (!signedIn()) {
        lastAutoUserId = "";
        if (dialogOpen) void loadSummary();
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

    async function finishOnlineBeforeSwitch() {
      try {
        return await waitForCharacterSwitch(view);
      } catch (error) {
        const sync = availableSyncTools();
        const active = slotStore?.active?.();
        if ((error?.code !== "LAT-SWITCH-TIMEOUT" && !sync?.transientNetworkError?.(error))
          || !signedIn() || !state.currentUserId || !active?.remoteId) throw error;
        const metadata = sync?.syncedCharacterMetadata?.(storage, state.currentUserId, active.remoteId, backendId);
        const saved = sync?.persistOfflineSave?.(storage, {
          userId: state.currentUserId,
          characterId: active.remoteId,
          backendId,
          expectedRevision: metadata?.revision ?? null,
        }, appBridge.snapshot());
        if (!saved) throw error;
        view.toast?.("Alterações guardadas neste aparelho para sincronizar depois.", "warn");
        return true;
      }
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
          slotStore,
          backendId,
          beforeSwitch: finishOnlineBeforeSwitch,
          view,
        });
        state = { ...state, openingCharacterId: "" };
        close();
        view.toast?.(`${character.name} foi carregada da sua conta.`);
      } catch (error) {
        applyState({ openingCharacterId: "", message: friendlyHomeMessage(error, campaignTools, characterTools) });
      }
    }

    async function createCharacter() {
      if (state.openingCharacterId || !slotStore || !appBridge?.createBlankSnapshot) return;
      applyState({ openingCharacterId: "new", message: "" });
      try {
        const scope = signedIn() ? currentScope() : "guest";
        const used = signedIn()
          ? state.characters.length + slotStore.list(scope).filter((slot) => !slot.remoteId).length
          : slotStore.list("guest").length;
        if (used >= 5) throw new Error("Os cinco espaços de ficha estão ocupados.");
        slotStore.beforeSwitch();
        await finishOnlineBeforeSwitch();
        const blank = appBridge.createBlankSnapshot();
        if (signedIn() && view.navigator?.onLine !== false && service) {
          let character = null;
          try {
            character = await service.createCharacter(blank);
          } catch (error) {
            if (!availableSyncTools()?.transientNetworkError?.(error)) throw error;
          }
          if (character) {
            const slot = slotStore.add(character.state, scope, character.id);
            const identity = availableImportTools()?.localSheetIdentity?.(character.state);
            if (identity) availableImportTools()?.markImported?.(storage, state.currentUserId, identity, character.id, backendId);
            availableSyncTools()?.rememberSyncedCharacter?.(storage, state.currentUserId, character, backendId);
            availableImportTools()?.announceLinkedCharacter?.(view, character);
            if (!slot) throw new Error("A ficha foi criada na conta, mas não pôde ser aberta. Reabra-a em Minhas fichas.");
          } else {
            slotStore.add(blank, scope);
            view.toast?.("Ficha salva neste aparelho. Ela será enviada à conta quando a conexão voltar.", "warn");
          }
        } else {
          slotStore.add(blank, scope);
        }
        state = { ...state, openingCharacterId: "" };
        close();
        view.toast?.("Nova ficha criada.");
      } catch (error) {
        applyState({ openingCharacterId: "", message: error?.userMessage || error?.message || "Não foi possível criar a ficha." });
      }
    }

    async function openLocal(slotId) {
      if (!slotId || state.openingCharacterId || !slotStore) return;
      applyState({ openingCharacterId: slotId, message: "" });
      try {
        slotStore.beforeSwitch();
        await finishOnlineBeforeSwitch();
        const slot = slotStore.activate(slotId);
        state = { ...state, openingCharacterId: "" };
        close();
        view.toast?.(`${slot.state.character?.name || "Ficha"} aberta.`);
      } catch (error) {
        applyState({ openingCharacterId: "", message: error?.message || "Não foi possível abrir esta ficha." });
      }
    }

    function requestDeleteLocal(slotId) {
      const slot = slotStore?.all?.().find((item) => item.id === slotId);
      if (!slot) return;
      applyState({ mode: "delete-confirm", deleteTarget: { kind: "local", id: slot.id, name: slot.state.character?.name || "Personagem sem nome" }, message: "" });
    }

    function requestDeleteCharacter() {
      const character = state.characters.find((item) => item.id === state.selectedCharacterId);
      if (!character) return;
      applyState({ mode: "delete-confirm", deleteTarget: { kind: "remote", id: character.id, name: character.name }, message: "" });
    }

    async function confirmDelete(form) {
      const target = state.deleteTarget;
      if (!target || state.openingCharacterId) return;
      const confirmation = String(new FormData(form).get("confirmationName") || "").trim();
      if (confirmation !== target.name) {
        applyState({ message: "Digite exatamente o nome da ficha para confirmar." });
        return;
      }
      applyState({ openingCharacterId: target.id, message: "" });
      try {
        slotStore?.beforeSwitch?.();
        await finishOnlineBeforeSwitch();
        if (target.kind === "local") {
          slotStore.remove(target.id);
        } else {
          const character = await service.loadCharacter(target.id);
          const slot = slotStore?.findRemote?.(target.id, currentScope());
          if (slot && !slotStore.backup(slot.id)) throw new Error("O backup não pôde ser criado. A ficha foi preservada.");
          if (!slot && !appBridge?.backupSnapshot?.(character.state, `Antes de excluir ${character.name}`)) {
            throw new Error("O backup não pôde ser criado. A ficha foi preservada.");
          }
          await service.removeCharacter(target.id, confirmation, character.revision);
          const identity = availableImportTools()?.localSheetIdentity?.(character.state);
          if (identity) availableImportTools()?.forgetImported?.(storage, state.currentUserId, identity, backendId);
          if (slot) slotStore.remove(slot.id, { backedUp: true, skipSave: true });
          availableSyncTools()?.removeOfflineSave?.(storage, state.currentUserId, target.id, backendId);
        }
        applyState({ mode: "characters", deleteTarget: null, openingCharacterId: "", message: "" });
        await loadSummary();
      } catch (error) {
        applyState({ openingCharacterId: "", message: error?.userMessage || error?.message || "Não foi possível excluir a ficha." });
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

    let syncingDrafts = false;
    async function syncAccountDrafts() {
      if (syncingDrafts || !service || !slotStore || !signedIn() || view.navigator?.onLine === false) return false;
      syncingDrafts = true;
      try {
        const summary = await service.load();
        const userId = summary.currentUserId;
        const remoteCharacters = [...summary.characters];
        const scope = `${backendId}|${userId}`;
        for (const draft of slotStore.list(scope).filter((slot) => !slot.remoteId)) {
          if (slotStore.active()?.id === draft.id) slotStore.saveCurrent();
          const current = slotStore.all().find((slot) => slot.id === draft.id);
          const identity = availableImportTools()?.localSheetIdentity?.(current.state);
          const character = (identity && remoteCharacters.find((item) => availableImportTools()?.localSheetIdentity?.(item.state) === identity))
            ?? await service.createCharacter(current.state);
          if (!remoteCharacters.some((item) => item.id === character.id)) remoteCharacters.push(character);
          slotStore.linkSlot(draft.id, scope, character.id);
          if (identity) availableImportTools()?.markImported?.(storage, userId, identity, character.id, backendId);
          availableSyncTools()?.rememberSyncedCharacter?.(storage, userId, character, backendId);
          availableImportTools()?.announceLinkedCharacter?.(view, character);
        }
        if (dialogOpen) await loadSummary();
        return true;
      } catch (error) {
        if (dialogOpen) applyState({ message: error?.userMessage || error?.message || "Uma ficha local ainda não foi enviada à conta. Ela permanece salva neste aparelho." });
        return false;
      } finally {
        syncingDrafts = false;
      }
    }

    function handleClick(event) {
      const control = event.target.closest?.("[data-online-home-action]");
      if (!control) return;
      const action = control.dataset.onlineHomeAction;
      if (action === "open") open();
      else if (action === "characters") applyState({ mode: "characters" });
      else if (action === "select-character") applyState({ selectedCharacterId: String(control.dataset.characterId ?? ""), message: "" });
      else if (action === "home") applyState({ mode: "home" });
      else if (action === "refresh") void loadSummary().then(() => syncAccountDrafts());
      else if (action === "sheet") close();
      else if (action === "open-character") requestOpenCharacter();
      else if (action === "new-character") void createCharacter();
      else if (action === "open-local") void openLocal(String(control.dataset.slotId ?? ""));
      else if (action === "delete-local") requestDeleteLocal(String(control.dataset.slotId ?? ""));
      else if (action === "delete-character") requestDeleteCharacter();
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
      void syncAccountDrafts();
    }

    document.addEventListener("click", handleClick);
    const handleSubmit = (event) => {
      if (!event.target.matches?.("[data-online-home-delete-form]")) return;
      event.preventDefault();
      void confirmDelete(event.target);
    };
    document.addEventListener("submit", handleSubmit);
    view.addEventListener?.("marufia:auth-state-changed", handleAuthState);
    const requestedNewSheet = () => void createCharacter();
    view.addEventListener?.("marufia:new-sheet-requested", requestedNewSheet);
    const resumeDrafts = () => void syncAccountDrafts();
    view.addEventListener?.("online", resumeDrafts);

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
    resumeDrafts();

    return Object.freeze({
      service,
      open,
      destroy() {
        authObserver?.disconnect?.();
        modalObserver?.disconnect?.();
        document.removeEventListener("click", handleClick);
        document.removeEventListener("submit", handleSubmit);
        view.removeEventListener?.("marufia:auth-state-changed", handleAuthState);
        view.removeEventListener?.("marufia:new-sheet-requested", requestedNewSheet);
        view.removeEventListener?.("online", resumeDrafts);
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
