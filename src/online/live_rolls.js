(function initMarufiaLiveRolls(root, factory) {
  const workspaceTools = typeof module === "object" && module.exports
    ? require("./campaign_workspace.js")
    : root?.MARUFIA_CAMPAIGN_WORKSPACE;
  const api = factory(root, workspaceTools);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_LIVE_ROLLS = api;
  if (root?.document) Promise.resolve().then(() => api.init(
    root.document,
    root.MARUFIA_SUPABASE,
    root.MARUFIA_CAMPAIGNS,
    root.MARUFIA_ONLINE_ROLLS,
  ));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaLiveRollsApi(root, workspaceToolsInput) {
  "use strict";

  const workspaceTools = workspaceToolsInput ?? {};

  const ROLL_COLUMNS = "id,campaign_id,character_id,user_id,character_name,roll_type,skill_name,mode,formula,raw_roll,modifier,target,total,outcome,visibility,created_at";
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const MAX_LIVE_ROLLS = 50;
  const CONNECTION_LABELS = Object.freeze({
    loading: "Carregando",
    connecting: "Conectando",
    live: "Ao vivo",
    reconnecting: "Reconectando",
    error: "Conexão interrompida",
  });

  function liveRollError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.userMessage = message;
    return error;
  }

  function normalizeUuid(value, label, allowNull = false) {
    if (allowNull && (value === null || value === undefined || value === "")) return null;
    const id = String(value ?? "").trim().toLowerCase();
    if (!UUID_PATTERN.test(id)) throw liveRollError("LAT-LIVE-ROLL-ID-001", `${label} inválido.`);
    return id;
  }

  function normalizedLiveRoll(value, rollTools = root?.MARUFIA_ONLINE_ROLLS) {
    if (typeof rollTools?.normalizeRollDraft !== "function") {
      throw liveRollError("LAT-LIVE-ROLL-TOOLS-001", "O validador de rolagens não está disponível.");
    }
    const roll = rollTools.normalizeRollDraft({
      rollType: value?.roll_type,
      skillName: value?.skill_name,
      mode: value?.mode,
      formula: value?.formula,
      rawRoll: value?.raw_roll,
      modifier: value?.modifier,
      target: value?.target,
      total: value?.total,
      outcome: value?.outcome,
    });
    const createdAt = String(value?.created_at ?? "");
    const visibility = String(value?.visibility ?? "");
    const characterName = String(value?.character_name ?? "").trim();
    if (!["public", "gm", "secret"].includes(visibility)
      || !characterName || characterName.length > 120
      || !createdAt || Number.isNaN(Date.parse(createdAt))) {
      throw liveRollError("LAT-LIVE-ROLL-DATA-001", "O servidor devolveu uma rolagem ao vivo inválida.");
    }
    return Object.freeze({
      id: normalizeUuid(value.id, "Rolagem"),
      campaignId: normalizeUuid(value.campaign_id, "Campanha"),
      characterId: normalizeUuid(value.character_id, "Personagem", true),
      userId: normalizeUuid(value.user_id, "Usuário", true),
      characterName,
      ...roll,
      visibility,
      createdAt,
    });
  }

  function friendlyLiveRollMessage(error) {
    if (error?.userMessage) return error.userMessage;
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (detail.includes("campaign gm required")) {
      return "Somente o Mæstre desta campanha pode limpar o histórico de rolagens.";
    }
    if (detail.includes("membership required") || detail.includes("42501")) {
      return "Somente participantes desta campanha podem acompanhar suas rolagens.";
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("offline")) {
      return "Não foi possível acompanhar as rolagens agora. Tente novamente quando a conexão voltar.";
    }
    return "Não foi possível abrir as rolagens ao vivo desta campanha.";
  }

  function normalizedClearResult(value) {
    const row = Array.isArray(value) ? value[0] : value;
    const deletedRolls = Number(row?.deleted_rolls);
    const historyRevision = Number(row?.history_revision);
    if (!Number.isSafeInteger(deletedRolls) || deletedRolls < 0
      || !Number.isSafeInteger(historyRevision) || historyRevision < 1) {
      throw liveRollError("LAT-LIVE-ROLL-CLEAR-DATA-001", "O servidor não confirmou a limpeza das rolagens.");
    }
    return Object.freeze({ deletedRolls, historyRevision });
  }

  function createLiveRollService(client, campaignTools, rollTools = root?.MARUFIA_ONLINE_ROLLS) {
    if (typeof client?.from !== "function" || typeof client?.channel !== "function"
      || typeof client?.removeChannel !== "function" || typeof client?.rpc !== "function"
      || typeof campaignTools?.createCampaignService !== "function") {
      throw liveRollError("LAT-LIVE-ROLL-CLIENT-001", "O serviço de rolagens ao vivo não está disponível.");
    }
    const campaignService = campaignTools.createCampaignService(client);

    async function requireCampaignMember(campaignId) {
      const id = normalizeUuid(campaignId, "Campanha");
      const userId = await campaignService.currentUserId();
      const memberships = await campaignService.listOwnMemberships(userId);
      const membership = memberships.find((item) => item?.campaign_id === id);
      if (!membership) {
        throw liveRollError("LAT-LIVE-ROLL-MEMBER-001", "Somente participantes desta campanha podem acompanhar suas rolagens.");
      }
      return Object.freeze({ campaignId: id, userId, role: membership.role });
    }

    async function listRecent(campaignId) {
      const id = normalizeUuid(campaignId, "Campanha");
      const result = await client
        .from("rolls")
        .select(ROLL_COLUMNS)
        .eq("campaign_id", id)
        .order("created_at", { ascending: false })
        .limit(MAX_LIVE_ROLLS);
      if (result.error) throw liveRollError("LAT-LIVE-ROLL-LIST-001", friendlyLiveRollMessage(result.error));
      return (Array.isArray(result.data) ? result.data : []).map((roll) => normalizedLiveRoll(roll, rollTools));
    }

    async function clearHistory(campaignId) {
      const id = normalizeUuid(campaignId, "Campanha");
      const result = await client.rpc("clear_campaign_roll_history", { p_campaign_id: id });
      if (result.error) throw liveRollError("LAT-LIVE-ROLL-CLEAR-001", friendlyLiveRollMessage(result.error));
      return normalizedClearResult(result.data);
    }

    function subscribe(campaignId, onInsert, onStatus = () => {}, onClear = () => {}, onUnavailable = () => {}) {
      const id = normalizeUuid(campaignId, "Campanha");
      const channel = client
        .channel(`marufia-live-rolls:${id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "rolls",
          filter: `campaign_id=eq.${id}`,
        }, (payload) => {
          try {
            const roll = normalizedLiveRoll(payload?.new, rollTools);
            if (roll.campaignId !== id) throw new Error("campaign mismatch");
            onInsert?.(roll);
          } catch {
            onStatus("INVALID_PAYLOAD");
          }
        })
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${id}`,
        }, (payload) => {
          try {
            if (payload?.eventType === "DELETE") {
              if (normalizeUuid(payload?.old?.id, "Campanha") !== id) throw new Error("campaign mismatch");
              onUnavailable?.();
              return;
            }
            const next = payload?.new;
            const previous = payload?.old;
            if (normalizeUuid(next?.id, "Campanha") !== id
              || normalizeUuid(previous?.id, "Campanha") !== id) throw new Error("campaign mismatch");
            const nextRevision = Number(next?.roll_history_revision);
            const previousRevision = Number(previous?.roll_history_revision);
            if (!Number.isSafeInteger(nextRevision) || nextRevision < 0
              || !Number.isSafeInteger(previousRevision) || previousRevision < 0) throw new Error("invalid history revision");
            if (nextRevision > previousRevision) onClear?.(nextRevision);
          } catch {
            onStatus("INVALID_PAYLOAD");
          }
        })
        .subscribe(onStatus);
      return Object.freeze({
        channel,
        unsubscribe: () => client.removeChannel(channel),
      });
    }

    return Object.freeze({ requireCampaignMember, listRecent, clearHistory, subscribe });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function rollTypeLabel(roll) {
    const labels = {
      skill: "Perícia",
      attribute: "Atributo",
      combat: "Combate",
      world_duration: "Duração do Mundo",
      core_damage_reduction: "Núcleo Antebraço",
    };
    const label = labels[roll?.rollType] ?? "Rolagem";
    return roll?.skillName ? `${label} · ${roll.skillName}` : label;
  }

  function formatRollTime(value, locale = "pt-BR") {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
    } catch {
      return "Horário indisponível";
    }
  }

  function visibilityLabel(visibility) {
    return ({ public: "Pública", secret: "Secreta", gm: "Privada do Mæstre" })[visibility] ?? "Privada";
  }

  function liveRollItemHtml(roll) {
    const outcome = roll.outcome
      ? `<span class="live-roll-outcome ${roll.outcome === "Falha" ? "is-failure" : "is-success"}">${escapeHtml(roll.outcome)}</span>`
      : `<span class="muted small">Sem teste de sucesso</span>`;
    return `<article class="live-roll-card" data-live-roll-id="${escapeHtml(roll.id)}">
      <div class="live-roll-heading"><div><strong>${escapeHtml(roll.characterName)}</strong><span>${escapeHtml(rollTypeLabel(roll))}</span></div><div class="live-roll-meta"><span class="live-roll-visibility" data-visibility="${escapeHtml(roll.visibility)}">${escapeHtml(visibilityLabel(roll.visibility))}</span><time datetime="${escapeHtml(roll.createdAt)}">${escapeHtml(formatRollTime(roll.createdAt))}</time></div></div>
      <div class="live-roll-values">
        <div><span>Dado</span><strong>${escapeHtml(roll.formula)}</strong><small>${escapeHtml(roll.rawRoll.join(", "))}</small></div>
        <div><span>Resultado</span><strong>${escapeHtml(roll.total)}</strong>${roll.target !== null ? `<small>Alvo ${escapeHtml(roll.target)}</small>` : ""}</div>
        <div><span>Desfecho</span>${outcome}</div>
      </div>
    </article>`;
  }

  function liveRollsPanelHtml(state = {}) {
    const connection = Object.hasOwn(CONNECTION_LABELS, state.connection) ? state.connection : "connecting";
    const rolls = Array.isArray(state.rolls) ? state.rolls : [];
    const message = state.message
      ? `<p class="campaign-message ${state.messageKind === "success" ? "" : "campaign-message-error"}" role="${state.messageKind === "success" ? "status" : "alert"}">${escapeHtml(state.message)}</p>`
      : "";
    const clearButton = state.role === "gm"
      ? `<button class="danger live-roll-clear-button" type="button" data-online-live-rolls-action="clear" ${state.loading || state.clearing ? "disabled" : ""}>${state.clearing ? "Limpando…" : "Limpar histórico"}</button>`
      : "";
    const clearConfirmation = state.confirmingClear
      ? `<section class="live-roll-clear-confirmation" role="alert" aria-labelledby="liveRollClearTitle">
          <strong id="liveRollClearTitle">Apagar permanentemente todas as rolagens desta campanha?</strong>
          <p>Os dados rolados e seus registros no histórico serão removidos para todos. PV, PM, condições, itens e sessões não serão alterados. Esta ação não pode ser desfeita.</p>
          <div class="inline"><button class="danger" type="button" data-online-live-rolls-action="confirm-clear" ${state.clearing ? "disabled" : ""}>${state.clearing ? "Apagando…" : "Apagar rolagens"}</button><button class="ghost" type="button" data-online-live-rolls-action="cancel-clear" ${state.clearing ? "disabled" : ""}>Cancelar</button></div>
        </section>`
      : "";
    const content = rolls.length
      ? rolls.map((roll) => liveRollItemHtml(roll)).join("")
      : `<div class="empty">${state.loading ? "Carregando rolagens…" : "Nenhuma rolagem visível registrada nesta campanha."}</div>`;
    const navigation = workspaceTools.campaignWorkspaceNavigationHtml?.({
      campaignId: state.campaignId,
      campaignName: state.campaignName,
      activeView: "rolls",
      role: state.role,
    }) ?? "";
    return `<div class="live-rolls-panel stack" data-online-live-rolls-panel data-connection="${connection}">
      ${navigation}
      <div class="live-roll-toolbar"><div><strong>Rolagens da campanha</strong><p class="muted small">Cada participante recebe somente as rolagens permitidas para seu vínculo.</p></div><div class="live-roll-toolbar-actions"><span class="live-roll-connection" role="status" aria-live="polite"><span aria-hidden="true"></span>${escapeHtml(CONNECTION_LABELS[connection])}</span>${clearButton}</div></div>
      ${message}
      ${clearConfirmation}
      <div class="live-roll-list stack" aria-live="polite" aria-relevant="additions removals">${content}</div>
    </div>`;
  }

  function captureLiveRollsView(panel) {
    if (!panel) return null;
    const position = (element) => element
      ? Object.freeze({ top: Number(element.scrollTop) || 0, left: Number(element.scrollLeft) || 0 })
      : null;
    return Object.freeze({
      modal: position(panel.closest?.(".modal")),
      modalBody: position(panel.closest?.(".modal-body")),
      list: position(panel.querySelector?.(".live-roll-list")),
    });
  }

  function restoreLiveRollsView(panel, snapshot, view = globalThis) {
    if (!panel || !snapshot) return false;
    const restore = () => {
      const targets = [
        [panel.closest?.(".modal"), snapshot.modal],
        [panel.closest?.(".modal-body"), snapshot.modalBody],
        [panel.querySelector?.(".live-roll-list"), snapshot.list],
      ];
      for (const [target, position] of targets) {
        if (!target || !position) continue;
        target.scrollTop = position.top;
        target.scrollLeft = position.left;
      }
    };
    restore();
    view?.requestAnimationFrame?.(restore);
    return true;
  }

  function init(document, supabaseTools, campaignTools, rollTools) {
    const modalRoot = document.querySelector("#modalRoot");
    if (!modalRoot || document.documentElement?.dataset?.liveRollsInitialized === "true") return null;
    let client;
    try {
      client = supabaseTools?.getSupabaseClient?.();
    } catch {
      client = null;
    }
    if (!client) return null;
    let service;
    try {
      service = createLiveRollService(client, campaignTools, rollTools);
    } catch {
      return null;
    }

    const view = document.defaultView ?? root ?? globalThis;
    let state = null;
    let subscription = null;
    let generation = 0;
    let renderedPanelHtml = "";

    function updatePanel() {
      const current = modalRoot.querySelector("[data-online-live-rolls-panel]");
      if (!current || !state) return false;
      const nextHtml = liveRollsPanelHtml(state);
      if (nextHtml === renderedPanelHtml) return false;
      const snapshot = captureLiveRollsView(current);
      current.outerHTML = nextHtml;
      renderedPanelHtml = nextHtml;
      restoreLiveRollsView(modalRoot.querySelector("[data-online-live-rolls-panel]"), snapshot, view);
      return true;
    }

    async function stop() {
      generation += 1;
      state = null;
      renderedPanelHtml = "";
      const current = subscription;
      subscription = null;
      if (current) {
        try {
          await current.unsubscribe();
        } catch {
          // Fechar o painel não depende da confirmação do canal remoto.
        }
      }
    }

    function addRoll(roll) {
      if (!state || roll.campaignId !== state.campaignId) return;
      state = {
        ...state,
        rolls: [roll, ...state.rolls.filter((item) => item.id !== roll.id)].slice(0, MAX_LIVE_ROLLS),
      };
      updatePanel();
    }

    function applyHistoryClear(historyRevision, remote = true) {
      if (!state) return;
      state = {
        ...state,
        rolls: [],
        historyRevision,
        confirmingClear: false,
        clearing: false,
        message: remote ? "O Mæstre limpou o histórico de rolagens desta campanha." : state.message,
        messageKind: "success",
      };
      updatePanel();
    }

    function updateConnection(status) {
      if (!state) return;
      const connection = status === "SUBSCRIBED"
        ? "live"
        : ["CHANNEL_ERROR", "TIMED_OUT", "INVALID_PAYLOAD"].includes(status)
          ? "error"
          : status === "CLOSED" ? "reconnecting" : "connecting";
      state = { ...state, connection };
      updatePanel();
    }

    async function campaignUnavailable() {
      if (!state) return;
      const message = "A campanha foi excluída ou seu acesso foi removido. A lista de campanhas foi atualizada.";
      await stop();
      workspaceTools.returnToCampaignList?.(view, message);
    }

    async function open(campaignId, campaignName) {
      await workspaceTools.deactivateWorkspaceViews?.(view, "rolls");
      await stop();
      const token = ++generation;
      let id;
      try {
        id = normalizeUuid(campaignId, "Campanha");
      } catch {
        return;
      }
      state = {
        campaignId: id,
        campaignName: String(campaignName ?? "Campanha"),
        loading: true,
        connection: "loading",
        rolls: [],
        message: "",
        messageKind: "",
        role: "",
        historyRevision: 0,
        confirmingClear: false,
        clearing: false,
      };
      const title = `Rolagens ao vivo · ${state.campaignName}`;
      renderedPanelHtml = liveRollsPanelHtml(state);
      if (typeof view.openModal === "function") {
        view.openModal(title, renderedPanelHtml, `<button class="ghost" type="button" data-action="close-modal" data-online-live-rolls-action="close">Fechar</button>`);
      } else {
        modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><div class="modal-body">${renderedPanelHtml}</div><footer><button class="ghost" type="button" data-online-live-rolls-action="close">Fechar</button></footer></div></div>`;
      }
      workspaceTools.focusActiveNavigation?.(modalRoot, view);
      try {
        const membership = await service.requireCampaignMember(id);
        const rolls = await service.listRecent(id);
        if (!state || token !== generation) return;
        state = {
          ...state,
          loading: false,
          connection: "connecting",
          rolls,
          role: membership.role,
        };
        updatePanel();
        subscription = service.subscribe(id, addRoll, updateConnection, (revision) => applyHistoryClear(revision), campaignUnavailable);
      } catch (error) {
        if (!state || token !== generation) return;
        if (workspaceTools.isCampaignAccessUnavailable?.(error)) {
          const message = "A campanha foi excluída ou seu acesso foi removido. A lista de campanhas foi atualizada.";
          await stop();
          workspaceTools.returnToCampaignList?.(view, message);
          return;
        }
        state = { ...state, loading: false, connection: "error", message: friendlyLiveRollMessage(error) };
        updatePanel();
      }
    }

    async function clearHistory(control) {
      if (!state || state.role !== "gm" || !state.confirmingClear || state.clearing) return false;
      state = { ...state, clearing: true, message: "", messageKind: "" };
      updatePanel();
      if (control) control.disabled = true;
      try {
        const result = await service.clearHistory(state.campaignId);
        if (!state) return false;
        state = {
          ...state,
          rolls: [],
          historyRevision: result.historyRevision,
          confirmingClear: false,
          clearing: false,
          message: result.deletedRolls === 1
            ? "1 rolagem foi apagada permanentemente."
            : `${result.deletedRolls} rolagens foram apagadas permanentemente.`,
          messageKind: "success",
        };
        updatePanel();
        if (typeof view.CustomEvent === "function") {
          view.dispatchEvent?.(new view.CustomEvent("marufia:roll-history-cleared", {
            detail: { campaignId: state.campaignId, historyRevision: result.historyRevision },
          }));
        }
        return true;
      } catch (error) {
        if (!state) return false;
        state = {
          ...state,
          confirmingClear: false,
          clearing: false,
          message: friendlyLiveRollMessage(error),
          messageKind: "error",
        };
        updatePanel();
        return false;
      }
    }

    const click = (event) => {
      const control = event.target.closest?.("[data-online-live-rolls-action]");
      if (control?.dataset?.onlineLiveRollsAction === "open") {
        void open(control.dataset.campaignId, control.dataset.campaignName);
        return;
      }
      if (control?.dataset?.onlineLiveRollsAction === "close") {
        void stop();
        if (!control.dataset.action) modalRoot.innerHTML = "";
        return;
      }
      if (control?.dataset?.onlineLiveRollsAction === "clear" && state?.role === "gm") {
        state = { ...state, confirmingClear: true, message: "", messageKind: "" };
        updatePanel();
        return;
      }
      if (control?.dataset?.onlineLiveRollsAction === "cancel-clear" && state?.role === "gm" && !state.clearing) {
        state = { ...state, confirmingClear: false };
        updatePanel();
        return;
      }
      if (control?.dataset?.onlineLiveRollsAction === "confirm-clear") {
        void clearHistory(control);
        return;
      }
      if (state && event.target.closest?.('[data-action="close-modal"]')) void stop();
    };
    const keydown = (event) => {
      if (state && event.key === "Escape") void stop();
    };
    document.addEventListener("click", click);
    document.addEventListener("keydown", keydown);
    const observer = typeof view.MutationObserver === "function"
      ? new view.MutationObserver(() => {
        if (state && !modalRoot.querySelector("[data-online-live-rolls-panel]")) void stop();
      })
      : null;
    observer?.observe(modalRoot, { childList: true, subtree: true });
    const unregisterWorkspace = workspaceTools.registerWorkspaceView?.(view, "rolls", stop) ?? (() => {});
    if (document.documentElement?.dataset) document.documentElement.dataset.liveRollsInitialized = "true";

    return Object.freeze({
      service,
      open,
      clearHistory,
      stop,
      destroy() {
        void stop();
        unregisterWorkspace();
        observer?.disconnect?.();
        document.removeEventListener?.("click", click);
        document.removeEventListener?.("keydown", keydown);
        if (document.documentElement?.dataset) delete document.documentElement.dataset.liveRollsInitialized;
      },
    });
  }

  return {
    ROLL_COLUMNS,
    UUID_PATTERN,
    MAX_LIVE_ROLLS,
    CONNECTION_LABELS,
    normalizedLiveRoll,
    normalizedClearResult,
    friendlyLiveRollMessage,
    createLiveRollService,
    escapeHtml,
    rollTypeLabel,
    formatRollTime,
    visibilityLabel,
    liveRollItemHtml,
    liveRollsPanelHtml,
    captureLiveRollsView,
    restoreLiveRollsView,
    init,
  };
});
