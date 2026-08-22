(function initMarufiaGmPanel(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_GM_PANEL = api;
  if (root?.document) Promise.resolve().then(() => api.init(
    root.document,
    root.MARUFIA_SUPABASE,
    root.MARUFIA_CAMPAIGNS,
    root.MARUFIA_CHARACTERS,
    root.LATIO_CHARACTER_SUMMARY,
    root.LATIO_RULES,
    root.MARUFIA_DB,
    root.MARUFIA_MAGIC_CORES,
  ));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaGmPanelApi(root) {
  "use strict";

  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const STATE_ITEM_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
  const PRESENCE_COLUMNS = "campaign_id,user_id,seen_at,active_at";
  const EVENT_COLUMNS = "id,campaign_id,character_id,actor_id,session_id,event_type,payload,created_at";
  const SESSION_COLUMNS = "id,campaign_id,name,started_at,ended_at,status";
  const EVENT_TYPES = new Set(["hp_changed", "pm_changed", "conditions_changed", "item_changed", "roll"]);
  const ONLINE_WINDOW_MS = 90_000;
  const AWAY_WINDOW_MS = 120_000;
  const HEARTBEAT_MS = 30_000;
  const GM_VIEW_MESSAGE_TYPE = "marufia:gm-view-state";
  const GM_ACTIONS = Object.freeze({
    hpSet: true,
    pmSet: true,
    conditionAdd: true,
    conditionRemove: true,
    itemAdd: true,
    itemRemove: true,
  });
  const CONNECTION_LABELS = Object.freeze({ loading: "Carregando", live: "Ao vivo", error: "Conexão interrompida" });

  function gmPanelError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.userMessage = message;
    return error;
  }

  function normalizeUuid(value, label) {
    const id = String(value ?? "").trim().toLowerCase();
    if (!UUID_PATTERN.test(id)) throw gmPanelError("LAT-GM-PANEL-ID-001", `${label} inválido.`);
    return id;
  }

  function friendlyGmPanelMessage(error) {
    if (error?.userMessage) return error.userMessage;
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (detail.includes("gm required") || detail.includes("42501")) {
      return "Somente o Mæstre desta campanha pode abrir este painel.";
    }
    if (detail.includes("session already active")) return "Esta campanha já possui uma sessão ativa.";
    if (detail.includes("invalid campaign session name")) {
      return "Informe um nome válido para a sessão.";
    }
    if (detail.includes("invalid character pm")) return "Informe um valor inteiro válido para o PM.";
    if (detail.includes("invalid character condition")) return "Revise o nome, a CA e o bloqueio da condição.";
    if (detail.includes("invalid character item")) return "Revise os campos do item antes de adicionar.";
    if (detail.includes("condition not found") || detail.includes("item not found")) return "A condição ou o item já não está disponível nesta ficha.";
    if (detail.includes("revision conflict") || detail.includes("40001")) {
      return "A ficha mudou enquanto você editava. O painel será atualizado antes de tentar novamente.";
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("offline")) {
      return "Não foi possível atualizar o painel agora. Tente novamente quando a conexão voltar.";
    }
    return "Não foi possível abrir o painel do Mæstre.";
  }

  function normalizedPresence(value, campaignId) {
    const campaign = normalizeUuid(value?.campaign_id, "Campanha");
    const userId = normalizeUuid(value?.user_id, "Participante");
    const seenAt = String(value?.seen_at ?? "");
    const activeAt = String(value?.active_at ?? seenAt);
    if (campaign !== normalizeUuid(campaignId, "Campanha") || !seenAt || Number.isNaN(Date.parse(seenAt))
      || !activeAt || Number.isNaN(Date.parse(activeAt))) {
      throw gmPanelError("LAT-GM-PANEL-PRESENCE-001", "O servidor devolveu uma presença inválida.");
    }
    return Object.freeze({ campaignId: campaign, userId, seenAt, activeAt });
  }

  function presenceStatus(presence, currentTime = Date.now()) {
    if (!presence || currentTime - Date.parse(presence.seenAt) > ONLINE_WINDOW_MS) return "offline";
    if (currentTime - Date.parse(presence.activeAt) > AWAY_WINDOW_MS) return "away";
    return "online";
  }

  function normalizedCampaignEvent(value, campaignId) {
    const id = normalizeUuid(value?.id, "Evento");
    const campaign = normalizeUuid(value?.campaign_id, "Campanha");
    const characterId = value?.character_id ? normalizeUuid(value.character_id, "Personagem") : null;
    const actorId = value?.actor_id ? normalizeUuid(value.actor_id, "Autor") : null;
    const sessionId = value?.session_id ? normalizeUuid(value.session_id, "Sessão") : null;
    const eventType = String(value?.event_type ?? "");
    const payload = value?.payload;
    const createdAt = String(value?.created_at ?? "");
    if (campaign !== normalizeUuid(campaignId, "Campanha") || !EVENT_TYPES.has(eventType)
      || !payload || typeof payload !== "object" || Array.isArray(payload)
      || !createdAt || Number.isNaN(Date.parse(createdAt))) {
      throw gmPanelError("LAT-GM-PANEL-EVENT-001", "O servidor devolveu um evento de campanha inválido.");
    }
    return Object.freeze({ id, campaignId: campaign, characterId, actorId, sessionId, eventType, payload: Object.freeze({ ...payload }), createdAt });
  }

  function normalizedCampaignSession(value, campaignId) {
    const id = normalizeUuid(value?.id, "Sessão");
    const campaign = normalizeUuid(value?.campaign_id, "Campanha");
    const name = String(value?.name ?? "").trim();
    const startedAt = String(value?.started_at ?? "");
    const endedAt = value?.ended_at == null ? null : String(value.ended_at);
    const status = String(value?.status ?? "");
    if (campaign !== normalizeUuid(campaignId, "Campanha") || !name || name.length > 120
      || !startedAt || Number.isNaN(Date.parse(startedAt))
      || !["active", "ended"].includes(status)
      || (status === "active" && endedAt !== null)
      || (status === "ended" && (!endedAt || Number.isNaN(Date.parse(endedAt)) || Date.parse(endedAt) < Date.parse(startedAt)))) {
      throw gmPanelError("LAT-GM-PANEL-SESSION-001", "O servidor devolveu uma sessão de campanha inválida.");
    }
    return Object.freeze({ id, campaignId: campaign, name, startedAt, endedAt, status });
  }

  function createGmPanelService(
    client,
    campaignTools,
    characterTools,
    summaryTools,
    rules,
    database,
    magicCores,
    now = () => Date.now(),
  ) {
    if (typeof client?.from !== "function" || typeof client?.rpc !== "function"
      || typeof client?.channel !== "function" || typeof client?.removeChannel !== "function"
      || typeof campaignTools?.createCampaignService !== "function"
      || typeof characterTools?.normalizedCharacter !== "function"
      || typeof summaryTools?.resourceSummary !== "function") {
      throw gmPanelError("LAT-GM-PANEL-CLIENT-001", "O serviço do painel do Mæstre não está disponível.");
    }
    const campaignService = campaignTools.createCampaignService(client);

    async function ownMemberships() {
      const userId = normalizeUuid(await campaignService.currentUserId(), "Usuário");
      const memberships = await campaignService.listOwnMemberships(userId);
      return { userId, memberships: Array.isArray(memberships) ? memberships : [] };
    }

    async function requireCampaignGm(campaignId) {
      const id = normalizeUuid(campaignId, "Campanha");
      const { userId, memberships } = await ownMemberships();
      if (!memberships.some((membership) => membership?.campaign_id === id && membership?.role === "gm")) {
        throw gmPanelError("LAT-GM-PANEL-GM-001", "Somente o Mæstre desta campanha pode abrir este painel.");
      }
      return Object.freeze({ campaignId: id, userId });
    }

    async function touchOwnCampaigns(active = true) {
      const { memberships } = await ownMemberships();
      const ids = [...new Set(memberships.map((membership) => String(membership?.campaign_id ?? "")).filter((id) => UUID_PATTERN.test(id)))];
      await Promise.all(ids.map(async (campaignId) => {
        const result = await client.rpc("touch_campaign_presence", { p_campaign_id: campaignId, p_active: Boolean(active) });
        if (result.error) throw gmPanelError("LAT-GM-PANEL-TOUCH-001", friendlyGmPanelMessage(result.error));
        if (Number.isNaN(Date.parse(String(result.data ?? "")))) {
          throw gmPanelError("LAT-GM-PANEL-TOUCH-002", "O servidor devolveu um horário de presença inválido.");
        }
      }));
      return ids.length;
    }

    async function loadCampaign(campaignId) {
      const { campaignId: id } = await requireCampaignGm(campaignId);
      const cutoff = new Date(now() - ONLINE_WINDOW_MS).toISOString();
      const orderedHistory = client.from("campaign_events")
        .select(EVENT_COLUMNS)
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });
      const historyRequest = typeof orderedHistory?.limit === "function" ? orderedHistory.limit(80) : orderedHistory;
      const orderedSessions = client.from("campaign_sessions")
        .select(SESSION_COLUMNS)
        .eq("campaign_id", id)
        .order("started_at", { ascending: false });
      const sessionsRequest = typeof orderedSessions?.limit === "function" ? orderedSessions.limit(30) : orderedSessions;
      const [charactersResult, memberships, presenceResult, historyResult, sessionsResult] = await Promise.all([
        client.from("characters")
          .select(characterTools.CHARACTER_COLUMNS)
          .eq("campaign_id", id)
          .order("name", { ascending: true }),
        campaignService.listVisibleMembers([id]),
        client.from("campaign_presence")
          .select(PRESENCE_COLUMNS)
          .eq("campaign_id", id)
          .gte("seen_at", cutoff)
          .order("seen_at", { ascending: false }),
        historyRequest,
        sessionsRequest,
      ]);
      if (charactersResult.error) throw gmPanelError("LAT-GM-PANEL-CHARACTERS-001", friendlyGmPanelMessage(charactersResult.error));
      if (presenceResult.error) throw gmPanelError("LAT-GM-PANEL-PRESENCE-002", friendlyGmPanelMessage(presenceResult.error));
      if (historyResult.error) throw gmPanelError("LAT-GM-PANEL-HISTORY-001", friendlyGmPanelMessage(historyResult.error));
      if (sessionsResult.error) throw gmPanelError("LAT-GM-PANEL-SESSIONS-001", friendlyGmPanelMessage(sessionsResult.error));

      const characterRows = (Array.isArray(charactersResult.data) ? charactersResult.data : []).map((value) => {
        const character = characterTools.normalizedCharacter(value);
        if (character.campaign_id !== id) throw gmPanelError("LAT-GM-PANEL-CHARACTER-001", "O personagem não pertence à campanha aberta.");
        return character;
      });
      const campaignMemberships = (Array.isArray(memberships) ? memberships : [])
        .filter((membership) => membership?.campaign_id === id);
      const presence = (Array.isArray(presenceResult.data) ? presenceResult.data : [])
        .map((value) => normalizedPresence(value, id));
      const playerIds = new Set(campaignMemberships
        .filter((membership) => membership.role === "player")
        .map((membership) => membership.user_id));
      const presenceByUser = new Map(presence.map((item) => [item.userId, item]));
      const players = [...playerIds].map((userId) => Object.freeze({
        userId,
        status: presenceStatus(presenceByUser.get(userId), now()),
      }));
      const statusByUser = new Map(players.map((player) => [player.userId, player.status]));
      const characters = characterRows.map((character) => Object.freeze({
        character,
        resources: summaryTools.resourceSummary(character.state, rules, database, magicCores),
        presence: statusByUser.get(character.owner_id) ?? presenceStatus(presenceByUser.get(character.owner_id), now()),
      }));
      const events = (Array.isArray(historyResult.data) ? historyResult.data : [])
        .map((value) => normalizedCampaignEvent(value, id));
      const sessions = (Array.isArray(sessionsResult.data) ? sessionsResult.data : [])
        .map((value) => normalizedCampaignSession(value, id));
      return Object.freeze({
        campaignId: id,
        characters: Object.freeze(characters),
        players: Object.freeze(players),
        playersOnline: players.filter((player) => player.status === "online").length,
        playersAway: players.filter((player) => player.status === "away").length,
        playersTotal: playerIds.size,
        events: Object.freeze(events),
        sessions: Object.freeze(sessions),
        activeSession: sessions.find((session) => session.status === "active") ?? null,
      });
    }

    async function startSession(campaignId, name) {
      const id = normalizeUuid(campaignId, "Campanha");
      const sessionName = String(name ?? "").trim();
      if (!sessionName || sessionName.length > 120) {
        throw gmPanelError("LAT-GM-PANEL-SESSION-NAME-001", "Informe um nome de sessão com até 120 caracteres.");
      }
      const result = await client.rpc("start_campaign_session", { p_campaign_id: id, p_name: sessionName });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-SESSION-START-001", friendlyGmPanelMessage(result.error));
      return normalizedCampaignSession(result.data, id);
    }

    async function endSession(sessionId, campaignId) {
      const id = normalizeUuid(sessionId, "Sessão");
      const expectedCampaign = normalizeUuid(campaignId, "Campanha");
      const result = await client.rpc("end_campaign_session", { p_session_id: id });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-SESSION-END-001", friendlyGmPanelMessage(result.error));
      return normalizedCampaignSession(result.data, expectedCampaign);
    }

    async function setCharacterHp(characterId, hpCurrent, expectedRevision) {
      const id = normalizeUuid(characterId, "Personagem");
      const hp = Number(hpCurrent);
      const revision = Number(expectedRevision);
      if (!Number.isSafeInteger(hp) || hp < 0 || hp > 1_000_000) {
        throw gmPanelError("LAT-GM-PANEL-HP-001", "Informe um valor inteiro válido para o PV.");
      }
      if (!Number.isSafeInteger(revision) || revision < 1) {
        throw gmPanelError("LAT-GM-PANEL-REVISION-001", "A revisão desta ficha é inválida.");
      }
      const result = await client.rpc("gm_set_character_hp", {
        p_character_id: id,
        p_hp_current: hp,
        p_expected_revision: revision,
      });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-HP-002", friendlyGmPanelMessage(result.error));
      return characterTools.normalizedCharacter(result.data);
    }

    async function setCharacterPm(characterId, pmCurrent, expectedRevision) {
      const id = normalizeUuid(characterId, "Personagem");
      const pm = Number(pmCurrent);
      const revision = Number(expectedRevision);
      if (!Number.isSafeInteger(pm) || pm < 0 || pm > 1_000_000) {
        throw gmPanelError("LAT-GM-PANEL-PM-001", "Informe um valor inteiro válido para o PM.");
      }
      if (!Number.isSafeInteger(revision) || revision < 1) {
        throw gmPanelError("LAT-GM-PANEL-REVISION-001", "A revisão desta ficha é inválida.");
      }
      const result = await client.rpc("gm_set_character_pm", {
        p_character_id: id,
        p_pm_current: pm,
        p_expected_revision: revision,
      });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-PM-002", friendlyGmPanelMessage(result.error));
      return characterTools.normalizedCharacter(result.data);
    }

    async function addCharacterCondition(characterId, condition, expectedRevision) {
      const id = normalizeUuid(characterId, "Personagem");
      const name = String(condition?.name ?? "").trim();
      const ca = Number(condition?.ca);
      const block = Number(condition?.block);
      const revision = Number(expectedRevision);
      if (!name || name.length > 120 || !Number.isSafeInteger(ca) || Math.abs(ca) > 1_000_000
        || !Number.isSafeInteger(block) || Math.abs(block) > 1_000_000) {
        throw gmPanelError("LAT-GM-PANEL-CONDITION-001", "Revise o nome, a CA e o bloqueio da condição.");
      }
      if (!Number.isSafeInteger(revision) || revision < 1) {
        throw gmPanelError("LAT-GM-PANEL-REVISION-001", "A revisão desta ficha é inválida.");
      }
      const result = await client.rpc("gm_add_character_condition", {
        p_character_id: id,
        p_condition_name: name,
        p_ca: ca,
        p_block: block,
        p_expected_revision: revision,
      });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-CONDITION-002", friendlyGmPanelMessage(result.error));
      return characterTools.normalizedCharacter(result.data);
    }

    async function removeCharacterCondition(characterId, conditionId, expectedRevision) {
      const id = normalizeUuid(characterId, "Personagem");
      const targetId = String(conditionId ?? "").trim();
      const revision = Number(expectedRevision);
      if (!STATE_ITEM_ID_PATTERN.test(targetId)) throw gmPanelError("LAT-GM-PANEL-CONDITION-ID-001", "A condição selecionada é inválida.");
      if (!Number.isSafeInteger(revision) || revision < 1) throw gmPanelError("LAT-GM-PANEL-REVISION-001", "A revisão desta ficha é inválida.");
      const result = await client.rpc("gm_remove_character_condition", {
        p_character_id: id,
        p_condition_id: targetId,
        p_expected_revision: revision,
      });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-CONDITION-003", friendlyGmPanelMessage(result.error));
      return characterTools.normalizedCharacter(result.data);
    }

    async function addCharacterItem(characterId, item, expectedRevision) {
      const id = normalizeUuid(characterId, "Personagem");
      const kind = String(item?.kind ?? "").trim();
      const name = String(item?.name ?? "").trim();
      const category = String(item?.category ?? "").trim();
      const quantity = Number(item?.quantity);
      const weight = String(item?.weight ?? "").trim();
      const damage = String(item?.damage ?? "").trim();
      const property = String(item?.property ?? "").trim();
      const description = String(item?.description ?? "").trim();
      const revision = Number(expectedRevision);
      if (!['weapon', 'equipment'].includes(kind) || !name || name.length > 120 || !category || category.length > 120
        || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1_000_000
        || weight.length > 120 || damage.length > 120 || property.length > 1000 || description.length > 5000
        || (kind === "weapon" && !damage)) {
        throw gmPanelError("LAT-GM-PANEL-ITEM-001", "Revise os campos do item antes de adicionar.");
      }
      if (!Number.isSafeInteger(revision) || revision < 1) throw gmPanelError("LAT-GM-PANEL-REVISION-001", "A revisão desta ficha é inválida.");
      const result = await client.rpc("gm_add_character_item", {
        p_character_id: id,
        p_item_kind: kind,
        p_name: name,
        p_category: category,
        p_quantity: quantity,
        p_weight: weight,
        p_damage: damage,
        p_property: property,
        p_description: description,
        p_expected_revision: revision,
      });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-ITEM-002", friendlyGmPanelMessage(result.error));
      return characterTools.normalizedCharacter(result.data);
    }

    async function removeCharacterItem(characterId, kind, itemId, expectedRevision) {
      const id = normalizeUuid(characterId, "Personagem");
      const itemKind = String(kind ?? "").trim();
      const targetId = String(itemId ?? "").trim();
      const revision = Number(expectedRevision);
      if (!['weapon', 'equipment'].includes(itemKind) || !STATE_ITEM_ID_PATTERN.test(targetId)) {
        throw gmPanelError("LAT-GM-PANEL-ITEM-ID-001", "O item selecionado é inválido.");
      }
      if (!Number.isSafeInteger(revision) || revision < 1) throw gmPanelError("LAT-GM-PANEL-REVISION-001", "A revisão desta ficha é inválida.");
      const result = await client.rpc("gm_remove_character_item", {
        p_character_id: id,
        p_item_kind: itemKind,
        p_item_id: targetId,
        p_expected_revision: revision,
      });
      if (result.error) throw gmPanelError("LAT-GM-PANEL-ITEM-003", friendlyGmPanelMessage(result.error));
      return characterTools.normalizedCharacter(result.data);
    }

    function subscribe(campaignId, onChange, onStatus = () => {}) {
      const id = normalizeUuid(campaignId, "Campanha");
      const accept = (payload) => {
        const row = payload?.new && Object.keys(payload.new).length ? payload.new : payload?.old;
        if (String(row?.campaign_id ?? "").toLowerCase() !== id) {
          onStatus("INVALID_PAYLOAD");
          return;
        }
        onChange?.(payload);
      };
      const channel = client.channel(`marufia-gm-panel:${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "characters", filter: `campaign_id=eq.${id}` }, accept)
        .on("postgres_changes", { event: "*", schema: "public", table: "campaign_presence", filter: `campaign_id=eq.${id}` }, accept)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "campaign_events", filter: `campaign_id=eq.${id}` }, accept)
        .on("postgres_changes", { event: "*", schema: "public", table: "campaign_sessions", filter: `campaign_id=eq.${id}` }, accept)
        .subscribe(onStatus);
      return Object.freeze({ channel, unsubscribe: () => client.removeChannel(channel) });
    }

    return Object.freeze({
      ownMemberships,
      requireCampaignGm,
      touchOwnCampaigns,
      loadCampaign,
      startSession,
      endSession,
      setCharacterHp,
      setCharacterPm,
      addCharacterCondition,
      removeCharacterCondition,
      addCharacterItem,
      removeCharacterItem,
      subscribe,
    });
  }

  function createPresenceHeartbeat({ service, available = () => true, active = () => true, intervalMs = HEARTBEAT_MS, timers = root } = {}) {
    if (typeof service?.touchOwnCampaigns !== "function" || typeof timers?.setInterval !== "function") {
      throw gmPanelError("LAT-GM-PANEL-HEARTBEAT-001", "O acompanhamento de presença não está disponível.");
    }
    let destroyed = false;
    let pending = null;
    async function pulse() {
      if (destroyed || !available()) return false;
      if (pending) return pending;
      pending = service.touchOwnCampaigns(active())
        .then(() => true)
        .catch(() => false)
        .finally(() => { pending = null; });
      return pending;
    }
    const interval = timers.setInterval(() => { void pulse(); }, intervalMs);
    return Object.freeze({
      pulse,
      destroy() {
        destroyed = true;
        timers.clearInterval?.(interval);
      },
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character]);
  }

  function formatUpdatedAt(value, locale = "pt-BR") {
    try {
      return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
    } catch {
      return "Horário indisponível";
    }
  }

  function gmCharacterManagementHtml(character) {
    const effects = Array.isArray(character.state?.effects) ? character.state.effects : [];
    const weapons = Array.isArray(character.state?.inventory?.weapons) ? character.state.inventory.weapons : [];
    const equipment = Array.isArray(character.state?.inventory?.equipment) ? character.state.inventory.equipment : [];
    const conditions = effects.length
      ? `<ul class="gm-action-list">${effects.map((effect) => `<li><span><strong>${escapeHtml(effect.name || "Condição")}</strong><small>CA ${escapeHtml(effect.ca ?? 0)} · Bloqueio ${escapeHtml(effect.block?.cortante ?? 0)}</small></span><button class="danger" type="button" data-online-gm-panel-action="remove-condition" data-character-id="${escapeHtml(character.id)}" data-condition-id="${escapeHtml(effect.id)}" aria-label="Remover condição ${escapeHtml(effect.name || "Condição")}">Remover</button></li>`).join("")}</ul>`
      : `<div class="empty">Nenhuma condição temporária.</div>`;
    const items = [
      ...weapons.map((item) => ({ ...item, kind: "weapon", detail: `${item.type || "Arma"}${item.damage ? ` · ${item.damage}` : ""}` })),
      ...equipment.map((item) => ({ ...item, kind: "equipment", detail: `${item.category || "Equipamento"} · quantidade ${item.qty ?? 1}` })),
    ];
    const inventory = items.length
      ? `<ul class="gm-action-list">${items.map((item) => `<li><span><strong>${escapeHtml(item.name || "Item")}</strong><small>${escapeHtml(item.detail)}</small></span><button class="danger" type="button" data-online-gm-panel-action="remove-item" data-character-id="${escapeHtml(character.id)}" data-item-kind="${escapeHtml(item.kind)}" data-item-id="${escapeHtml(item.id)}" aria-label="Remover item ${escapeHtml(item.name || "Item")}">Remover</button></li>`).join("")}</ul>`
      : `<div class="empty">Nenhuma arma ou equipamento.</div>`;
    return `<details class="gm-character-management"><summary>Gerenciar condições e itens</summary><div class="gm-character-management-body">
      <section><h4>Condições temporárias</h4>${conditions}<div class="gm-action-form gm-condition-form"><label class="field"><span>Nome</span><input type="text" maxlength="120" data-online-gm-condition-name></label><label class="field"><span>CA</span><input type="number" step="1" value="0" data-online-gm-condition-ca></label><label class="field"><span>Bloqueio</span><input type="number" step="1" value="0" data-online-gm-condition-block></label><button class="ghost" type="button" data-online-gm-panel-action="add-condition" data-character-id="${escapeHtml(character.id)}">Adicionar condição</button></div></section>
      <section><h4>Armas e equipamentos</h4>${inventory}<div class="gm-action-form gm-item-form"><label class="field"><span>Tipo de item</span><select data-online-gm-item-kind><option value="equipment">Equipamento</option><option value="weapon">Arma</option></select></label><label class="field"><span>Nome</span><input type="text" maxlength="120" data-online-gm-item-name></label><label class="field"><span>Categoria ou tipo</span><input type="text" maxlength="120" value="Equipamento" data-online-gm-item-category></label><label class="field"><span>Quantidade</span><input type="number" min="1" max="1000000" step="1" value="1" data-online-gm-item-quantity></label><label class="field"><span>Peso</span><input type="text" maxlength="120" data-online-gm-item-weight></label><label class="field"><span>Dano — somente arma</span><input type="text" maxlength="120" data-online-gm-item-damage></label><label class="field"><span>Propriedade — somente arma</span><input type="text" maxlength="1000" data-online-gm-item-property></label><label class="field gm-item-description"><span>Descrição</span><textarea maxlength="5000" data-online-gm-item-description></textarea></label><button class="ghost" type="button" data-online-gm-panel-action="add-item" data-character-id="${escapeHtml(character.id)}">Adicionar item</button></div></section>
    </div></details>`;
  }

  function gmCharacterCardHtml(item) {
    const character = item.character;
    const resources = item.resources;
    const status = ["online", "away", "offline"].includes(item.presence) ? item.presence : "offline";
    const statusLabel = ({ online: "Online", away: "Ausente", offline: "Offline" })[status];
    return `<article class="gm-character-card" data-gm-character-id="${escapeHtml(character.id)}">
      <div class="gm-character-heading"><div><strong>${escapeHtml(character.name)}</strong><span class="muted small">Atualizada em ${escapeHtml(formatUpdatedAt(character.updated_at))}</span></div><button class="ghost" type="button" data-online-gm-panel-action="open-character" data-character-id="${escapeHtml(character.id)}">Abrir ficha</button></div>
      <span class="gm-presence-badge" data-presence-status="${status}"><i aria-hidden="true"></i>${statusLabel}</span>
      <div class="gm-character-resources"><span><small>PV</small><span class="gm-hp-control"><input type="number" min="0" max="${escapeHtml(resources.hp.maximum)}" step="1" value="${escapeHtml(resources.hp.current)}" inputmode="numeric" aria-label="PV atual de ${escapeHtml(character.name)}" data-online-gm-hp-input><em>/ ${escapeHtml(resources.hp.maximum)}</em><button class="ghost" type="button" data-online-gm-panel-action="save-hp" data-character-id="${escapeHtml(character.id)}">Alterar PV</button></span></span><span><small>PM</small><span class="gm-hp-control"><input type="number" min="0" max="${escapeHtml(resources.pm.maximum)}" step="1" value="${escapeHtml(resources.pm.current)}" inputmode="numeric" aria-label="PM atual de ${escapeHtml(character.name)}" data-online-gm-pm-input><em>/ ${escapeHtml(resources.pm.maximum)}</em><button class="ghost" type="button" data-online-gm-panel-action="save-pm" data-character-id="${escapeHtml(character.id)}">Alterar PM</button></span></span></div>
      ${gmCharacterManagementHtml(character)}
    </article>`;
  }

  function historyEventText(event) {
    const payload = event.payload ?? {};
    const name = String(payload.character_name ?? "Personagem");
    const value = (input) => input === null || input === undefined ? "máximo" : String(input);
    if (event.eventType === "hp_changed") return `${name}: PV ${value(payload.old_value)} → ${value(payload.new_value)}`;
    if (event.eventType === "pm_changed") return `${name}: PM ${value(payload.old_value)} → ${value(payload.new_value)}`;
    if (event.eventType === "conditions_changed") return `${name}: condições atualizadas`;
    if (event.eventType === "item_changed") return `${name}: itens relevantes atualizados`;
    const detail = payload.skill_name || payload.roll_type || "rolagem";
    return `${name}: ${detail} = ${value(payload.total)}${payload.outcome ? ` · ${payload.outcome}` : ""}`;
  }

  function historyHtml(events = [], sessions = []) {
    const sessionNames = new Map(sessions.map((session) => [session.id, session.name]));
    const content = events.length
      ? `<ol class="gm-history-list">${events.map((event) => `<li data-campaign-event-type="${escapeHtml(event.eventType)}"${event.sessionId ? ` data-campaign-session-id="${escapeHtml(event.sessionId)}"` : ""}><span class="gm-history-icon" aria-hidden="true"></span><div><strong>${escapeHtml(historyEventText(event))}</strong><span class="gm-history-meta"><time datetime="${escapeHtml(event.createdAt)}">${escapeHtml(formatUpdatedAt(event.createdAt))}</time>${event.sessionId ? `<em>${escapeHtml(sessionNames.get(event.sessionId) ?? "Sessão vinculada")}</em>` : ""}</span></div></li>`).join("")}</ol>`
      : `<div class="empty">Nenhum evento relevante registrado ainda.</div>`;
    return `<section class="gm-history" aria-labelledby="gmHistoryTitle"><div class="section-title"><h3 id="gmHistoryTitle">Histórico da campanha</h3><span class="muted small">PV, PM, condições, itens e rolagens</span></div>${content}</section>`;
  }

  function sessionsHtml(state = {}) {
    const active = state.activeSession ?? null;
    const ended = (Array.isArray(state.sessions) ? state.sessions : []).filter((session) => session.status === "ended").slice(0, 5);
    const recent = ended.length
      ? `<details class="gm-session-recent"><summary>Sessões anteriores (${ended.length})</summary><ul>${ended.map((session) => `<li><strong>${escapeHtml(session.name)}</strong><span>${escapeHtml(formatUpdatedAt(session.startedAt))} — ${escapeHtml(formatUpdatedAt(session.endedAt))}</span></li>`).join("")}</ul></details>`
      : "";
    if (active) {
      return `<section class="gm-session-control" data-campaign-session-status="active"><div><span class="gm-session-status"><i aria-hidden="true"></i>Sessão ativa</span><strong>${escapeHtml(active.name)}</strong><small>Iniciada em ${escapeHtml(formatUpdatedAt(active.startedAt))}</small></div><button class="ghost" type="button" data-online-gm-panel-action="end-session" data-session-id="${escapeHtml(active.id)}">Encerrar sessão</button>${recent}</section>`;
    }
    const suggestion = `Sessão ${(Array.isArray(state.sessions) ? state.sessions.length : 0) + 1}`;
    return `<section class="gm-session-control" data-campaign-session-status="idle"><div><strong>Sessão de jogo</strong><small>Novos eventos serão vinculados enquanto a sessão estiver ativa.</small></div><label class="field"><span>Nome da sessão</span><input type="text" maxlength="120" value="${escapeHtml(suggestion)}" data-online-gm-session-name></label><button class="button" type="button" data-online-gm-panel-action="start-session">Iniciar sessão</button>${recent}</section>`;
  }

  function gmPanelHtml(state = {}) {
    const connection = Object.hasOwn(CONNECTION_LABELS, state.connection) ? state.connection : "loading";
    const characters = Array.isArray(state.characters) ? state.characters : [];
    const message = state.message
      ? `<p class="campaign-message ${state.messageKind === "success" ? "" : "campaign-message-error"}" role="status">${escapeHtml(state.message)}</p>`
      : "";
    const content = state.loading
      ? `<div class="empty" role="status">Carregando personagens…</div>`
      : characters.length
        ? characters.map(gmCharacterCardHtml).join("")
        : `<div class="empty">Nenhum personagem está vinculado a esta campanha.</div>`;
    return `<div class="gm-panel stack" data-online-gm-panel data-connection="${connection}">
      <div class="gm-panel-toolbar"><div><strong>${escapeHtml(state.campaignName ?? "Campanha")}</strong><p class="muted small">Abra qualquer ficha vinculada em modo completo e somente leitura.</p></div><span class="live-roll-connection" role="status" aria-live="polite"><span aria-hidden="true"></span>${escapeHtml(CONNECTION_LABELS[connection])}</span></div>
      <div class="gm-online-summary" role="status"><span aria-hidden="true"></span><strong>Online: ${escapeHtml(state.playersOnline ?? 0)}</strong><small>Ausentes: ${escapeHtml(state.playersAway ?? 0)} · Offline: ${escapeHtml(Math.max(0, (state.playersTotal ?? 0) - (state.playersOnline ?? 0) - (state.playersAway ?? 0)))}</small></div>
      ${sessionsHtml(state)}
      ${message}
      <div class="gm-panel-content"><div class="gm-character-list">${content}</div>${historyHtml(Array.isArray(state.events) ? state.events : [], Array.isArray(state.sessions) ? state.sessions : [])}</div>
    </div>`;
  }

  function init(document, supabaseTools, campaignTools, characterTools, summaryTools, rules, database, magicCores) {
    const modalRoot = document.querySelector("#modalRoot");
    const accountButton = document.querySelector("#onlineAccountButton");
    if (!modalRoot || !accountButton || document.documentElement?.dataset?.gmPanelInitialized === "true") return null;
    let client;
    try { client = supabaseTools?.getSupabaseClient?.(); } catch { client = null; }
    if (!client) return null;
    let service;
    try { service = createGmPanelService(client, campaignTools, characterTools, summaryTools, rules, database, magicCores); } catch { return null; }

    const view = document.defaultView ?? root ?? globalThis;
    let state = null;
    let subscription = null;
    let generation = 0;
    let reloadTimer = null;

    let lastActivityAt = Date.now();
    function onlineSessionAvailable() {
      return accountButton.dataset.authState === "online"
        && view.navigator?.onLine !== false;
    }
    function activeOnlineSession() {
      return document.visibilityState !== "hidden" && Date.now() - lastActivityAt <= AWAY_WINDOW_MS;
    }
    const heartbeat = createPresenceHeartbeat({ service, available: onlineSessionAvailable, active: activeOnlineSession, timers: view });

    function updatePanel() {
      const current = modalRoot.querySelector("[data-online-gm-panel]");
      if (current && state) current.outerHTML = gmPanelHtml(state);
    }

    async function stop() {
      generation += 1;
      state = null;
      view.clearTimeout?.(reloadTimer);
      reloadTimer = null;
      const current = subscription;
      subscription = null;
      if (current) {
        try { await current.unsubscribe(); } catch { /* O modal pode fechar antes do canal. */ }
      }
    }

    async function reload(token) {
      if (!state || token !== generation) return;
      try {
        const result = await service.loadCampaign(state.campaignId);
        if (!state || token !== generation) return;
        state = { ...state, loading: false, characters: result.characters, players: result.players, playersOnline: result.playersOnline, playersAway: result.playersAway, playersTotal: result.playersTotal, events: result.events, sessions: result.sessions, activeSession: result.activeSession, message: "" };
        updatePanel();
      } catch (error) {
        if (!state || token !== generation) return;
        state = { ...state, loading: false, connection: "error", message: friendlyGmPanelMessage(error) };
        updatePanel();
      }
    }

    function scheduleReload() {
      if (!state || reloadTimer) return;
      const token = generation;
      reloadTimer = view.setTimeout(() => {
        reloadTimer = null;
        void reload(token);
      }, 80);
    }

    function updateConnection(status) {
      if (!state) return;
      state = { ...state, connection: status === "SUBSCRIBED" ? "live" : ["CHANNEL_ERROR", "TIMED_OUT", "INVALID_PAYLOAD"].includes(status) ? "error" : "loading" };
      updatePanel();
    }

    async function open(campaignId, campaignName) {
      await stop();
      const token = ++generation;
      let id;
      try { id = normalizeUuid(campaignId, "Campanha"); } catch { return; }
      state = { campaignId: id, campaignName: String(campaignName ?? "Campanha"), loading: true, connection: "loading", characters: [], players: [], playersOnline: 0, playersAway: 0, playersTotal: 0, events: [], sessions: [], activeSession: null, message: "" };
      const footer = `<button class="ghost" type="button" data-action="close-modal" data-online-gm-panel-action="close">Fechar</button>`;
      if (typeof view.openModal === "function") view.openModal("Painel do Mæstre", gmPanelHtml(state), footer);
      else modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-body">${gmPanelHtml(state)}</div><footer>${footer}</footer></div></div>`;
      await heartbeat.pulse();
      await reload(token);
      if (!state || token !== generation || state.message) return;
      subscription = service.subscribe(id, scheduleReload, updateConnection);
    }

    function openCharacter(characterId) {
      if (!state) return false;
      const id = String(characterId ?? "").toLowerCase();
      const item = state.characters.find((entry) => entry.character.id === id);
      if (!item) return false;
      const token = view.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const source = `gm_view.html?token=${encodeURIComponent(token)}`;
      const body = `<div class="gm-character-view" data-online-gm-character-view data-character-id="${escapeHtml(id)}"><p class="gm-character-view-context"><strong>${escapeHtml(item.character.name)}</strong><span>Somente leitura · campanha ${escapeHtml(state.campaignName)}</span></p><iframe class="gm-character-view-frame" title="Ficha completa de ${escapeHtml(item.character.name)}" src="${escapeHtml(source)}"></iframe></div>`;
      const footer = `<button class="ghost" type="button" data-action="close-modal">Fechar visualização</button>`;
      if (typeof view.openModal === "function") view.openModal("VISUALIZAÇÃO DO MÆSTRE", body, footer);
      else modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-body">${body}</div><footer>${footer}</footer></div></div>`;
      modalRoot.querySelector(".modal")?.classList.add("gm-character-view-modal");
      const frame = modalRoot.querySelector(".gm-character-view-frame");
      frame?.addEventListener("load", () => {
        frame.contentWindow?.postMessage({ type: GM_VIEW_MESSAGE_TYPE, token, state: item.character.state }, "*");
      }, { once: true });
      void stop();
      return true;
    }

    async function saveHp(control) {
      if (!state || !GM_ACTIONS.hpSet) return false;
      const id = String(control?.dataset?.characterId ?? "").toLowerCase();
      const item = state.characters.find((entry) => entry.character.id === id);
      const input = control?.closest?.(".gm-character-card")?.querySelector?.("[data-online-gm-hp-input]");
      const rawValue = Number(input?.value);
      if (!item || !Number.isSafeInteger(rawValue)) {
        state = { ...state, message: "Informe um valor inteiro válido para o PV.", messageKind: "error" };
        updatePanel();
        return false;
      }
      const nextHp = Math.min(item.resources.hp.maximum, Math.max(0, rawValue));
      control.disabled = true;
      try {
        const character = await service.setCharacterHp(id, nextHp, item.character.revision);
        const updated = Object.freeze({ character, resources: summaryTools.resourceSummary(character.state, rules, database, magicCores), presence: item.presence });
        state = {
          ...state,
          characters: Object.freeze(state.characters.map((entry) => entry.character.id === id ? updated : entry)),
          message: `PV de ${character.name} atualizado para ${updated.resources.hp.current}/${updated.resources.hp.maximum}.`,
          messageKind: "success",
        };
        updatePanel();
        return true;
      } catch (error) {
        state = { ...state, message: friendlyGmPanelMessage(error), messageKind: "error" };
        updatePanel();
        return false;
      }
    }

    async function mutateCharacter(control, id, operation, successMessage) {
      const item = state?.characters.find((entry) => entry.character.id === id);
      if (!item) return false;
      control.disabled = true;
      try {
        const character = await operation(item);
        const updated = Object.freeze({
          character,
          resources: summaryTools.resourceSummary(character.state, rules, database, magicCores),
          presence: item.presence,
        });
        state = {
          ...state,
          characters: Object.freeze(state.characters.map((entry) => entry.character.id === id ? updated : entry)),
          message: successMessage(character, updated),
          messageKind: "success",
        };
        updatePanel();
        return true;
      } catch (error) {
        state = { ...state, message: friendlyGmPanelMessage(error), messageKind: "error" };
        updatePanel();
        return false;
      }
    }

    async function savePm(control) {
      if (!state || !GM_ACTIONS.pmSet) return false;
      const id = String(control?.dataset?.characterId ?? "").toLowerCase();
      const item = state.characters.find((entry) => entry.character.id === id);
      const input = control?.closest?.(".gm-character-card")?.querySelector?.("[data-online-gm-pm-input]");
      const rawValue = Number(input?.value);
      if (!item || !Number.isSafeInteger(rawValue)) {
        state = { ...state, message: "Informe um valor inteiro válido para o PM.", messageKind: "error" };
        updatePanel();
        return false;
      }
      const nextPm = Math.min(item.resources.pm.maximum, Math.max(0, rawValue));
      return mutateCharacter(
        control,
        id,
        (entry) => service.setCharacterPm(id, nextPm, entry.character.revision),
        (character, updated) => `PM de ${character.name} atualizado para ${updated.resources.pm.current}/${updated.resources.pm.maximum}.`,
      );
    }

    async function addCondition(control) {
      if (!state || !GM_ACTIONS.conditionAdd) return false;
      const id = String(control?.dataset?.characterId ?? "").toLowerCase();
      const card = control?.closest?.(".gm-character-card");
      const condition = {
        name: String(card?.querySelector?.("[data-online-gm-condition-name]")?.value ?? "").trim(),
        ca: Number(card?.querySelector?.("[data-online-gm-condition-ca]")?.value),
        block: Number(card?.querySelector?.("[data-online-gm-condition-block]")?.value),
      };
      return mutateCharacter(
        control,
        id,
        (entry) => service.addCharacterCondition(id, condition, entry.character.revision),
        (character) => `${condition.name} adicionada a ${character.name}.`,
      );
    }

    async function removeCondition(control) {
      if (!state || !GM_ACTIONS.conditionRemove) return false;
      const id = String(control?.dataset?.characterId ?? "").toLowerCase();
      const conditionId = String(control?.dataset?.conditionId ?? "");
      const current = state.characters.find((entry) => entry.character.id === id)?.character.state?.effects
        ?.find((effect) => effect.id === conditionId);
      return mutateCharacter(
        control,
        id,
        (entry) => service.removeCharacterCondition(id, conditionId, entry.character.revision),
        (character) => `${current?.name || "Condição"} removida de ${character.name}.`,
      );
    }

    async function addItem(control) {
      if (!state || !GM_ACTIONS.itemAdd) return false;
      const id = String(control?.dataset?.characterId ?? "").toLowerCase();
      const card = control?.closest?.(".gm-character-card");
      const value = (selector) => String(card?.querySelector?.(selector)?.value ?? "").trim();
      const item = {
        kind: value("[data-online-gm-item-kind]"),
        name: value("[data-online-gm-item-name]"),
        category: value("[data-online-gm-item-category]"),
        quantity: Number(card?.querySelector?.("[data-online-gm-item-quantity]")?.value),
        weight: value("[data-online-gm-item-weight]"),
        damage: value("[data-online-gm-item-damage]"),
        property: value("[data-online-gm-item-property]"),
        description: value("[data-online-gm-item-description]"),
      };
      return mutateCharacter(
        control,
        id,
        (entry) => service.addCharacterItem(id, item, entry.character.revision),
        (character) => `${item.name || "Item"} adicionado a ${character.name}.`,
      );
    }

    async function removeItem(control) {
      if (!state || !GM_ACTIONS.itemRemove) return false;
      const id = String(control?.dataset?.characterId ?? "").toLowerCase();
      const kind = String(control?.dataset?.itemKind ?? "");
      const itemId = String(control?.dataset?.itemId ?? "");
      const character = state.characters.find((entry) => entry.character.id === id)?.character;
      const collection = kind === "weapon" ? character?.state?.inventory?.weapons : character?.state?.inventory?.equipment;
      const current = collection?.find((item) => item.id === itemId);
      return mutateCharacter(
        control,
        id,
        (entry) => service.removeCharacterItem(id, kind, itemId, entry.character.revision),
        (updatedCharacter) => `${current?.name || "Item"} removido de ${updatedCharacter.name}.`,
      );
    }

    async function startSession(control) {
      if (!state) return false;
      const input = control?.closest?.("[data-online-gm-panel]")?.querySelector?.("[data-online-gm-session-name]");
      const name = String(input?.value ?? "").trim();
      control.disabled = true;
      try {
        const session = await service.startSession(state.campaignId, name);
        state = { ...state, sessions: Object.freeze([session, ...state.sessions]), activeSession: session, message: `${session.name} iniciada.`, messageKind: "success" };
        updatePanel();
        return true;
      } catch (error) {
        state = { ...state, message: friendlyGmPanelMessage(error), messageKind: "error" };
        updatePanel();
        return false;
      }
    }

    async function endSession(control) {
      if (!state?.activeSession) return false;
      control.disabled = true;
      try {
        const session = await service.endSession(control.dataset.sessionId, state.campaignId);
        state = {
          ...state,
          sessions: Object.freeze(state.sessions.map((item) => item.id === session.id ? session : item)),
          activeSession: null,
          message: `${session.name} encerrada.`,
          messageKind: "success",
        };
        updatePanel();
        return true;
      } catch (error) {
        state = { ...state, message: friendlyGmPanelMessage(error), messageKind: "error" };
        updatePanel();
        return false;
      }
    }

    const pulse = () => { void heartbeat.pulse(); };
    const markActivity = () => { lastActivityAt = Date.now(); };
    const click = (event) => {
      const control = event.target.closest?.("[data-online-gm-panel-action]");
      if (control?.dataset?.onlineGmPanelAction === "open") {
        void open(control.dataset.campaignId, control.dataset.campaignName);
      } else if (state && control?.dataset?.onlineGmPanelAction === "open-character") {
        openCharacter(control.dataset.characterId);
      } else if (state && control?.dataset?.onlineGmPanelAction === "save-hp") {
        void saveHp(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "save-pm") {
        void savePm(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "add-condition") {
        void addCondition(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "remove-condition") {
        void removeCondition(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "add-item") {
        void addItem(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "remove-item") {
        void removeItem(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "start-session") {
        void startSession(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "end-session") {
        void endSession(control);
      } else if (state && control?.dataset?.onlineGmPanelAction === "close") {
        void stop();
      } else if (state && event.target.matches?.('[data-action="close-modal"]')) {
        void stop();
      }
    };
    const keydown = (event) => {
      markActivity();
      if (state && event.key === "Escape") void stop();
    };
    document.addEventListener("click", click);
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", markActivity, { passive: true });
    view.addEventListener?.("online", pulse);
    view.addEventListener?.("marufia:campaign-memberships-changed", pulse);
    document.addEventListener("visibilitychange", pulse);
    const authObserver = typeof view.MutationObserver === "function" ? new view.MutationObserver(pulse) : null;
    authObserver?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    const modalObserver = typeof view.MutationObserver === "function" ? new view.MutationObserver(() => {
      if (state && !modalRoot.querySelector("[data-online-gm-panel]")) void stop();
    }) : null;
    modalObserver?.observe(modalRoot, { childList: true, subtree: true });
    if (document.documentElement?.dataset) document.documentElement.dataset.gmPanelInitialized = "true";
    pulse();

    return Object.freeze({
      service, heartbeat, open, openCharacter, saveHp, savePm, addCondition, removeCondition, addItem, removeItem, startSession, endSession, stop,
      destroy() {
        void stop();
        heartbeat.destroy();
        authObserver?.disconnect?.();
        modalObserver?.disconnect?.();
        document.removeEventListener?.("click", click);
        document.removeEventListener?.("keydown", keydown);
        document.removeEventListener?.("pointerdown", markActivity);
        document.removeEventListener?.("visibilitychange", pulse);
        view.removeEventListener?.("online", pulse);
        view.removeEventListener?.("marufia:campaign-memberships-changed", pulse);
        if (document.documentElement?.dataset) delete document.documentElement.dataset.gmPanelInitialized;
      },
    });
  }

  return {
    UUID_PATTERN,
    PRESENCE_COLUMNS,
    EVENT_COLUMNS,
    SESSION_COLUMNS,
    ONLINE_WINDOW_MS,
    AWAY_WINDOW_MS,
    HEARTBEAT_MS,
    GM_VIEW_MESSAGE_TYPE,
    GM_ACTIONS,
    CONNECTION_LABELS,
    normalizeUuid,
    normalizedPresence,
    presenceStatus,
    normalizedCampaignEvent,
    normalizedCampaignSession,
    friendlyGmPanelMessage,
    createGmPanelService,
    createPresenceHeartbeat,
    escapeHtml,
    formatUpdatedAt,
    gmCharacterCardHtml,
    historyEventText,
    historyHtml,
    sessionsHtml,
    gmPanelHtml,
    init,
  };
});
