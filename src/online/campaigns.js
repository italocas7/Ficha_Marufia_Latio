(function initMarufiaCampaigns(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CAMPAIGNS = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root.MARUFIA_SUPABASE));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaCampaignsApi() {
  "use strict";

  const CAMPAIGN_COLUMNS = "id,name,description,owner_id,join_code,created_at,updated_at";
  const MEMBERSHIP_COLUMNS = "campaign_id,user_id,role,joined_at";
  const JOIN_CODE_PATTERN = /^MRF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/;
  const MEMBER_ROLE_LABELS = Object.freeze({
    gm: "Mæstre",
    player: "Jogador",
    assistant_gm: "Mæstre assistente",
    spectator: "Espectador",
  });

  function campaignError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.userMessage = message;
    return error;
  }

  function cleanText(value, maxLength) {
    return String(value ?? "").trim().slice(0, maxLength);
  }

  function validateCampaignInput(input = {}) {
    const name = String(input.name ?? "").trim();
    const description = String(input.description ?? "").trim();
    if (!name) throw campaignError("LAT-CAMPAIGN-INPUT-001", "Informe o nome da campanha.");
    if (name.length > 100) throw campaignError("LAT-CAMPAIGN-INPUT-002", "O nome pode ter no máximo 100 caracteres.");
    if (description.length > 5000) throw campaignError("LAT-CAMPAIGN-INPUT-003", "A descrição pode ter no máximo 5.000 caracteres.");
    return Object.freeze({ name, description });
  }

  function normalizeJoinCode(value) {
    const code = String(value ?? "").trim().toUpperCase();
    if (!JOIN_CODE_PATTERN.test(code)) {
      throw campaignError("LAT-CAMPAIGN-JOIN-INPUT-001", "Informe um código no formato MRF-XXXX-XX.");
    }
    return code;
  }

  function friendlyCampaignMessage(error) {
    if (error?.userMessage) return error.userMessage;
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (detail.includes("p0002") || detail.includes("campaign not found")) {
      return "Código de campanha não encontrado.";
    }
    if (detail.includes("confirmation mismatch")) {
      return "O nome digitado não corresponde ao nome atual da campanha.";
    }
    if (detail.includes("22023") || detail.includes("invalid campaign join code")) {
      return "Informe um código no formato MRF-XXXX-XX.";
    }
    if (detail.includes("campaign owner required")) {
      return "Somente quem criou a campanha pode alterá-la ou excluí-la.";
    }
    if (detail.includes("23505") || detail.includes("duplicate") || detail.includes("unique")) {
      return "O código de convite coincidiu com outro existente. Tente criar novamente.";
    }
    if (detail.includes("jwt") || detail.includes("authentication") || detail.includes("not authenticated") || detail.includes("42501")) {
      return "Sua sessão expirou. Entre novamente para continuar.";
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("offline")) {
      return "Não foi possível acessar as campanhas agora. Sua ficha local continua disponível.";
    }
    return "Não foi possível concluir a operação da campanha. Tente novamente.";
  }

  function normalizedCampaign(value) {
    const campaign = Array.isArray(value) ? value[0] : value;
    if (!campaign || !JOIN_CODE_PATTERN.test(String(campaign.join_code ?? ""))) {
      throw campaignError("LAT-CAMPAIGN-DATA-001", "O servidor devolveu uma campanha inválida.");
    }
    return campaign;
  }

  function normalizedJoinResult(value) {
    const result = Array.isArray(value) ? value[0] : value;
    const role = String(result?.member_role ?? "");
    if (!result?.campaign_id || !String(result.campaign_name ?? "").trim() || !MEMBER_ROLE_LABELS[role]) {
      throw campaignError("LAT-CAMPAIGN-JOIN-DATA-001", "O servidor devolveu uma entrada de campanha inválida.");
    }
    return Object.freeze({
      campaign_id: String(result.campaign_id),
      campaign_name: String(result.campaign_name),
      member_role: role,
      already_member: result.already_member === true,
    });
  }

  function normalizedDeleteResult(value) {
    const result = Array.isArray(value) ? value[0] : value;
    if (!result?.campaign_id || !String(result.campaign_name ?? "").trim()) {
      throw campaignError("LAT-CAMPAIGN-DELETE-DATA-001", "O servidor não confirmou a exclusão da campanha.");
    }
    return Object.freeze({
      campaign_id: String(result.campaign_id),
      campaign_name: String(result.campaign_name),
    });
  }

  function createCampaignService(client) {
    if (!client?.from || !client?.auth?.getSession) throw campaignError("LAT-CAMPAIGN-CLIENT-001", "O serviço de campanhas não está disponível.");

    async function currentUserId() {
      const result = await client.auth.getSession();
      if (result.error) throw campaignError("LAT-CAMPAIGN-SESSION-001", friendlyCampaignMessage(result.error));
      const userId = String(result.data?.session?.user?.id ?? "");
      if (!userId) throw campaignError("LAT-CAMPAIGN-SESSION-002", "Sua sessão expirou. Entre novamente para continuar.");
      return userId;
    }

    async function listVisible(campaignIds) {
      const ids = [...new Set((Array.isArray(campaignIds) ? campaignIds : []).map(String).filter(Boolean))];
      if (!ids.length) return [];
      const result = await client
        .from("campaigns")
        .select(CAMPAIGN_COLUMNS)
        .in("id", ids)
        .order("created_at", { ascending: false });
      if (result.error) throw campaignError("LAT-CAMPAIGN-LIST-001", friendlyCampaignMessage(result.error));
      return Array.isArray(result.data) ? result.data : [];
    }

    async function listOwnMemberships(userId) {
      const id = String(userId ?? "");
      if (!id) return [];
      const result = await client
        .from("campaign_members")
        .select(MEMBERSHIP_COLUMNS)
        .eq("user_id", id)
        .order("joined_at", { ascending: true });
      if (result.error) throw campaignError("LAT-CAMPAIGN-ROLE-001", friendlyCampaignMessage(result.error));
      return Array.isArray(result.data) ? result.data : [];
    }

    async function listVisibleMembers(campaignIds) {
      const ids = [...new Set((Array.isArray(campaignIds) ? campaignIds : []).map(String).filter(Boolean))];
      if (!ids.length) return [];
      const result = await client
        .from("campaign_members")
        .select(MEMBERSHIP_COLUMNS)
        .in("campaign_id", ids)
        .order("joined_at", { ascending: true });
      if (result.error) throw campaignError("LAT-CAMPAIGN-MEMBERS-001", friendlyCampaignMessage(result.error));
      return Array.isArray(result.data) ? result.data : [];
    }

    async function create(input) {
      const payload = validateCampaignInput(input);
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const result = await client
          .from("campaigns")
          .insert(payload)
          .select(CAMPAIGN_COLUMNS)
          .single();
        if (!result.error) return normalizedCampaign(result.data);
        const collision = String(result.error.code ?? "") === "23505";
        if (!collision || attempt === 2) {
          throw campaignError("LAT-CAMPAIGN-CREATE-001", friendlyCampaignMessage(result.error));
        }
      }
      throw campaignError("LAT-CAMPAIGN-CREATE-002", "Não foi possível gerar um código de convite. Tente novamente.");
    }

    async function join(input = {}) {
      if (typeof client.rpc !== "function") {
        throw campaignError("LAT-CAMPAIGN-JOIN-CLIENT-001", "A entrada por código não está disponível.");
      }
      const code = normalizeJoinCode(input.code);
      const result = await client.rpc("join_campaign", { p_join_code: code });
      if (result.error) throw campaignError("LAT-CAMPAIGN-JOIN-001", friendlyCampaignMessage(result.error));
      return normalizedJoinResult(result.data);
    }

    async function update(campaignId, input = {}) {
      if (typeof client.rpc !== "function") {
        throw campaignError("LAT-CAMPAIGN-UPDATE-CLIENT-001", "A edição de campanha não está disponível.");
      }
      const id = String(campaignId ?? "").trim();
      if (!id) throw campaignError("LAT-CAMPAIGN-UPDATE-INPUT-001", "A campanha para edição é inválida.");
      const payload = validateCampaignInput(input);
      const result = await client.rpc("update_campaign", {
        p_campaign_id: id,
        p_name: payload.name,
        p_description: payload.description,
      });
      if (result.error) throw campaignError("LAT-CAMPAIGN-UPDATE-001", friendlyCampaignMessage(result.error));
      return normalizedCampaign(result.data);
    }

    async function remove(campaignId, confirmationName) {
      if (typeof client.rpc !== "function") {
        throw campaignError("LAT-CAMPAIGN-DELETE-CLIENT-001", "A exclusão de campanha não está disponível.");
      }
      const id = String(campaignId ?? "").trim();
      const confirmation = String(confirmationName ?? "").trim();
      if (!id) throw campaignError("LAT-CAMPAIGN-DELETE-INPUT-001", "A campanha para exclusão é inválida.");
      if (!confirmation) throw campaignError("LAT-CAMPAIGN-DELETE-INPUT-002", "Digite o nome da campanha para confirmar a exclusão.");
      const result = await client.rpc("delete_campaign", {
        p_campaign_id: id,
        p_confirmation_name: confirmation,
      });
      if (result.error) throw campaignError("LAT-CAMPAIGN-DELETE-001", friendlyCampaignMessage(result.error));
      return normalizedDeleteResult(result.data);
    }

    return Object.freeze({ currentUserId, listVisible, listOwnMemberships, listVisibleMembers, create, join, update, remove });
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

  function membershipSummary(campaign, memberships = [], currentUserId = "") {
    const members = memberships.filter((membership) => membership?.campaign_id === campaign?.id);
    const ownMembership = members.find((membership) => membership.user_id === currentUserId);
    return Object.freeze({
      count: members.length,
      role: ownMembership?.role ?? "",
      roleLabel: MEMBER_ROLE_LABELS[ownMembership?.role] ?? "Vínculo pendente",
    });
  }

  function campaignDialogHtml(state = {}) {
    const message = state.message
      ? `<p class="campaign-message ${state.messageKind === "error" ? "campaign-message-error" : ""}" role="${state.messageKind === "error" ? "alert" : "status"}">${escapeHtml(state.message)}</p>`
      : "";

    if (state.mode === "create") {
      return `<div class="campaign-dialog stack" data-online-campaign-modal>
        <p class="muted">Crie uma campanha para receber um código de convite. O código permite solicitar entrada, mas nunca concede poderes de Mæstre.</p>
        ${message}
        <form id="onlineCampaignForm" class="stack" data-online-campaign-form>
          <div class="field"><label for="campaignName">Nome da campanha</label><input id="campaignName" name="name" type="text" maxlength="100" required></div>
          <div class="field"><label for="campaignDescription">Descrição</label><textarea id="campaignDescription" name="description" maxlength="5000" rows="5"></textarea></div>
          <div class="inline campaign-form-actions">
            <button class="button" type="submit" ${state.busy ? "disabled" : ""}>${state.busy ? "Criando…" : "Criar campanha"}</button>
            <button class="ghost" type="button" data-online-campaign-action="list" ${state.busy ? "disabled" : ""}>Cancelar</button>
          </div>
        </form>
      </div>`;
    }

    if (state.mode === "join") {
      return `<div class="campaign-dialog stack" data-online-campaign-modal>
        <p class="muted">Use o código recebido para entrar como Jogador. O convite nunca concede poderes de Mæstre e não altera um papel que você já possua.</p>
        ${message}
        <form id="onlineCampaignJoinForm" class="stack" data-online-campaign-join-form>
          <div class="field"><label for="campaignJoinCode">Código da campanha</label><input id="campaignJoinCode" class="campaign-join-code" name="code" type="text" maxlength="11" placeholder="MRF-XXXX-XX" autocomplete="off" autocapitalize="characters" spellcheck="false" required></div>
          <div class="inline campaign-form-actions">
            <button class="button" type="submit" ${state.busy ? "disabled" : ""}>${state.busy ? "Entrando…" : "Entrar na campanha"}</button>
            <button class="ghost" type="button" data-online-campaign-action="list" ${state.busy ? "disabled" : ""}>Cancelar</button>
          </div>
        </form>
      </div>`;
    }

    const selectedCampaign = (Array.isArray(state.campaigns) ? state.campaigns : [])
      .find((campaign) => campaign.id === state.selectedCampaignId);

    if (state.mode === "edit" && selectedCampaign) {
      return `<div class="campaign-dialog stack" data-online-campaign-modal>
        <p class="muted">Altere somente o nome e a descrição. O código de convite, participantes e fichas vinculadas permanecem iguais.</p>
        ${message}
        <form id="onlineCampaignEditForm" class="stack" data-online-campaign-edit-form>
          <div class="field"><label for="campaignEditName">Nome da campanha</label><input id="campaignEditName" name="name" type="text" maxlength="100" value="${escapeHtml(selectedCampaign.name)}" required></div>
          <div class="field"><label for="campaignEditDescription">Descrição</label><textarea id="campaignEditDescription" name="description" maxlength="5000" rows="5">${escapeHtml(selectedCampaign.description)}</textarea></div>
          <div class="inline campaign-form-actions">
            <button class="button" type="submit" ${state.busy ? "disabled" : ""}>${state.busy ? "Salvando…" : "Salvar alterações"}</button>
            <button class="ghost" type="button" data-online-campaign-action="list" ${state.busy ? "disabled" : ""}>Cancelar</button>
          </div>
        </form>
      </div>`;
    }

    if (state.mode === "delete" && selectedCampaign) {
      return `<div class="campaign-dialog stack" data-online-campaign-modal>
        <div class="campaign-delete-warning" role="alert"><strong>Excluir “${escapeHtml(selectedCampaign.name)}”?</strong><p>As fichas dos personagens serão preservadas e ficarão sem campanha. Participantes, rolagens, histórico e sessões desta campanha serão excluídos permanentemente.</p></div>
        ${message}
        <form id="onlineCampaignDeleteForm" class="stack" data-online-campaign-delete-form>
          <div class="field"><label for="campaignDeleteConfirmation">Digite <strong>${escapeHtml(selectedCampaign.name)}</strong> para confirmar</label><input id="campaignDeleteConfirmation" name="confirmationName" type="text" maxlength="100" autocomplete="off" required></div>
          <div class="inline campaign-form-actions">
            <button class="danger" type="submit" ${state.busy ? "disabled" : ""}>${state.busy ? "Excluindo…" : "Excluir permanentemente"}</button>
            <button class="ghost" type="button" data-online-campaign-action="list" ${state.busy ? "disabled" : ""}>Cancelar</button>
          </div>
        </form>
      </div>`;
    }

    const campaigns = Array.isArray(state.campaigns) ? state.campaigns : [];
    const content = state.loading
      ? `<div class="empty" role="status">Carregando campanhas…</div>`
      : campaigns.length
        ? campaigns.map((campaign) => {
          const membership = membershipSummary(campaign, state.memberships, state.currentUserId);
          const participantCount = membership.role === "gm"
            ? `<span>${membership.count} ${membership.count === 1 ? "participante" : "participantes"}</span>`
            : "";
          const ownsCampaign = campaign.owner_id === state.currentUserId;
          return `<article class="campaign-card ${campaign.id === state.createdId ? "campaign-card-new" : ""}">
            <div><h3>${escapeHtml(campaign.name)}</h3>${campaign.description ? `<p>${escapeHtml(campaign.description)}</p>` : `<p class="muted">Sem descrição.</p>`}<div class="campaign-members-summary">${participantCount}<span>Você: ${escapeHtml(membership.roleLabel)}</span></div></div>
            <div class="campaign-code-block">
              <span class="muted small">Código de convite</span>
              <code>${escapeHtml(campaign.join_code)}</code>
              <button class="ghost" type="button" data-online-campaign-action="copy" data-code="${escapeHtml(campaign.join_code)}">Copiar código</button>
              <button class="button" type="button" data-online-live-rolls-action="open" data-campaign-id="${escapeHtml(campaign.id)}" data-campaign-name="${escapeHtml(campaign.name)}">Rolagens da campanha</button>
              ${membership.role === "gm" ? `<button class="button" type="button" data-online-gm-panel-action="open" data-campaign-id="${escapeHtml(campaign.id)}" data-campaign-name="${escapeHtml(campaign.name)}">Painel do Mæstre</button>` : ""}
              ${ownsCampaign ? `<div class="campaign-management-actions"><button class="ghost" type="button" data-online-campaign-action="edit" data-campaign-id="${escapeHtml(campaign.id)}">Editar campanha</button><button class="danger" type="button" data-online-campaign-action="delete" data-campaign-id="${escapeHtml(campaign.id)}">Excluir campanha</button></div>` : ""}
            </div>
          </article>`;
        }).join("")
        : `<div class="empty">Você ainda não participa de campanhas.</div>`;

    return `<div class="campaign-dialog stack" data-online-campaign-modal>
      <div class="campaign-heading"><div><strong>Campanhas em que você participa</strong><p class="muted small">Seu papel é definido separadamente em cada campanha.</p></div><div class="campaign-heading-actions"><button class="ghost" type="button" data-online-campaign-action="join">Entrar com código</button><button class="button" type="button" data-online-campaign-action="create">Nova campanha</button></div></div>
      ${message}
      <div class="campaign-list stack">${content}</div>
    </div>`;
  }

  function init(document, supabaseTools) {
    const campaignsButton = document.querySelector("#onlineCampaignsButton");
    const accountButton = document.querySelector("#onlineAccountButton");
    const modalRoot = document.querySelector("#modalRoot");
    if (!campaignsButton || !accountButton || !modalRoot || campaignsButton.dataset.campaignsInitialized === "true") return null;
    campaignsButton.dataset.campaignsInitialized = "true";

    const view = document.defaultView ?? globalThis;
    let service = null;
    let dialogOpen = false;
    let state = { mode: "list", loading: false, busy: false, campaigns: [], memberships: [], currentUserId: "", createdId: "", selectedCampaignId: "", message: "", messageKind: "" };

    function signedIn() {
      return accountButton.dataset.authState === "online";
    }

    function syncAvailability() {
      const available = signedIn() && Boolean(service);
      campaignsButton.hidden = !available;
      if (!available && dialogOpen) {
        dialogOpen = false;
        modalRoot.innerHTML = "";
      }
    }

    function fallbackOpenModal(body, footer) {
      modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="onlineCampaignTitle" data-stop-close data-blocking="false"><header><h2 id="onlineCampaignTitle">Campanhas</h2><button class="icon-button" type="button" data-online-campaign-action="close" aria-label="Fechar">×</button></header><div class="modal-body">${body}</div><footer>${footer}</footer></div></div>`;
    }

    function renderDialog() {
      if (!dialogOpen) return;
      const body = campaignDialogHtml(state);
      const footer = `<button class="ghost" type="button" data-action="close-modal">Fechar</button>`;
      if (typeof view.openModal === "function") view.openModal("Campanhas", body, footer);
      else fallbackOpenModal(body, footer);
    }

    function applyState(next) {
      state = { ...state, ...next };
      renderDialog();
    }

    async function loadCampaigns(message = "", createdId = "") {
      applyState({ mode: "list", loading: true, busy: false, message, messageKind: "success", createdId, selectedCampaignId: "" });
      try {
        const currentUserId = await service.currentUserId();
        const ownMemberships = await service.listOwnMemberships(currentUserId);
        const campaigns = await service.listVisible(ownMemberships.map((membership) => membership.campaign_id));
        const memberships = await service.listVisibleMembers(campaigns.map((campaign) => campaign.id));
        applyState({ campaigns, memberships, currentUserId, loading: false });
        if (typeof view.dispatchEvent === "function" && typeof view.CustomEvent === "function") {
          view.dispatchEvent(new view.CustomEvent("marufia:campaign-memberships-changed"));
        }
      } catch (error) {
        applyState({ campaigns: [], memberships: [], currentUserId: "", loading: false, message: friendlyCampaignMessage(error), messageKind: "error" });
      }
    }

    function openCampaigns(mode = "list") {
      if (!signedIn() || !service) return;
      dialogOpen = true;
      if (mode === "join") {
        applyState({ mode: "join", loading: false, busy: false, message: "", messageKind: "" });
        return;
      }
      void loadCampaigns();
    }

    async function createCampaign(form) {
      const values = Object.fromEntries(new view.FormData(form).entries());
      applyState({ busy: true, message: "", messageKind: "" });
      try {
        const campaign = await service.create(values);
        await loadCampaigns(`Campanha criada. Compartilhe o código ${campaign.join_code} com os jogadores.`, campaign.id);
      } catch (error) {
        applyState({ busy: false, message: friendlyCampaignMessage(error), messageKind: "error" });
      }
    }

    async function joinCampaign(form) {
      const values = Object.fromEntries(new view.FormData(form).entries());
      applyState({ busy: true, message: "", messageKind: "" });
      try {
        const result = await service.join(values);
        const roleLabel = MEMBER_ROLE_LABELS[result.member_role];
        const message = result.already_member
          ? `Você já participa de ${result.campaign_name} como ${roleLabel}.`
          : `Entrada concluída em ${result.campaign_name} como ${roleLabel}.`;
        await loadCampaigns(message, result.campaign_id);
      } catch (error) {
        applyState({ busy: false, message: friendlyCampaignMessage(error), messageKind: "error" });
      }
    }

    async function updateCampaign(form) {
      const campaignId = state.selectedCampaignId;
      const values = Object.fromEntries(new view.FormData(form).entries());
      applyState({ busy: true, message: "", messageKind: "" });
      try {
        const campaign = await service.update(campaignId, values);
        await loadCampaigns(`Campanha ${campaign.name} atualizada.`);
      } catch (error) {
        applyState({ busy: false, message: friendlyCampaignMessage(error), messageKind: "error" });
      }
    }

    async function deleteCampaign(form) {
      const campaignId = state.selectedCampaignId;
      const values = Object.fromEntries(new view.FormData(form).entries());
      applyState({ busy: true, message: "", messageKind: "" });
      try {
        const campaign = await service.remove(campaignId, values.confirmationName);
        await loadCampaigns(`Campanha ${campaign.campaign_name} excluída. As fichas dos personagens foram preservadas.`);
      } catch (error) {
        applyState({ busy: false, message: friendlyCampaignMessage(error), messageKind: "error" });
      }
    }

    async function copyCode(code) {
      if (!JOIN_CODE_PATTERN.test(code)) return;
      try {
        await view.navigator?.clipboard?.writeText?.(code);
        applyState({ message: `Código ${code} copiado.`, messageKind: "success" });
      } catch {
        applyState({ message: `Copie este código: ${code}`, messageKind: "success" });
      }
    }

    document.addEventListener("click", (event) => {
      const closeButton = event.target.closest?.('button[data-action="close-modal"]');
      if (closeButton && (event.target.closest?.("[data-online-campaign-modal]") || event.target.querySelector?.("[data-online-campaign-modal]"))) {
        dialogOpen = false;
        return;
      }
      const control = event.target.closest?.("[data-online-campaign-action]");
      if (!control) return;
      const action = control.dataset.onlineCampaignAction;
      if (action === "open") {
        openCampaigns();
      } else if (action === "create") {
        applyState({ mode: "create", busy: false, message: "", messageKind: "" });
      } else if (action === "join") {
        applyState({ mode: "join", busy: false, message: "", messageKind: "" });
      } else if (action === "edit" || action === "delete") {
        const campaignId = String(control.dataset.campaignId ?? "");
        const campaign = state.campaigns.find((item) => item.id === campaignId && item.owner_id === state.currentUserId);
        if (campaign) applyState({ mode: action, selectedCampaignId: campaignId, busy: false, message: "", messageKind: "" });
      } else if (action === "list") {
        void loadCampaigns();
      } else if (action === "copy") {
        void copyCode(control.dataset.code ?? "");
      } else if (action === "close") {
        dialogOpen = false;
        modalRoot.innerHTML = "";
        campaignsButton.focus();
      }
    });

    document.addEventListener("submit", (event) => {
      const createForm = event.target.matches?.("[data-online-campaign-form]");
      const joinForm = event.target.matches?.("[data-online-campaign-join-form]");
      const editForm = event.target.matches?.("[data-online-campaign-edit-form]");
      const deleteForm = event.target.matches?.("[data-online-campaign-delete-form]");
      if (!createForm && !joinForm && !editForm && !deleteForm) return;
      event.preventDefault();
      if (state.busy || !service) return;
      if (createForm) void createCampaign(event.target);
      else if (joinForm) void joinCampaign(event.target);
      else if (editForm) void updateCampaign(event.target);
      else void deleteCampaign(event.target);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modalRoot.querySelector("[data-online-campaign-modal]")) dialogOpen = false;
    }, true);

    function handleOpenRequest(event) {
      openCampaigns(event?.detail?.mode === "join" ? "join" : "list");
    }

    view.addEventListener?.("marufia:open-campaigns", handleOpenRequest);

    try {
      const client = supabaseTools?.getSupabaseClient?.();
      service = client ? createCampaignService(client) : null;
    } catch {
      service = null;
    }

    const observer = typeof view.MutationObserver === "function"
      ? new view.MutationObserver(syncAvailability)
      : null;
    observer?.observe(accountButton, { attributes: true, attributeFilter: ["data-auth-state"] });
    syncAvailability();

    return Object.freeze({
      destroy() {
        observer?.disconnect?.();
        view.removeEventListener?.("marufia:open-campaigns", handleOpenRequest);
      },
      service,
    });
  }

  return {
    CAMPAIGN_COLUMNS,
    MEMBERSHIP_COLUMNS,
    JOIN_CODE_PATTERN,
    MEMBER_ROLE_LABELS,
    validateCampaignInput,
    normalizeJoinCode,
    friendlyCampaignMessage,
    normalizedCampaign,
    normalizedJoinResult,
    normalizedDeleteResult,
    createCampaignService,
    membershipSummary,
    campaignDialogHtml,
    init,
  };
});
