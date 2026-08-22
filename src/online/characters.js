(function initMarufiaCharacters(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CHARACTERS = api;
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaCharactersApi(root) {
  "use strict";

  const CHARACTER_COLUMNS = "id,owner_id,campaign_id,name,state,schema_version,revision,last_change_origin,created_at,updated_at";
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function characterError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.userMessage = message;
    return error;
  }

  function friendlyCharacterMessage(error) {
    if (error?.userMessage) return error.userMessage;
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (detail.includes("40001") || detail.includes("revision conflict")) {
      return "A ficha online mudou desde a última sincronização. As duas versões foram preservadas para sua decisão.";
    }
    if (detail.includes("campaign membership required") || detail.includes("42501")) {
      return "Você só pode associar o personagem a uma campanha da qual participa.";
    }
    if (detail.includes("23503")) return "A campanha escolhida não está mais disponível.";
    if (detail.includes("22023") || detail.includes("23514")) return "O estado do personagem não é compatível com o Marufia Online.";
    if (detail.includes("jwt") || detail.includes("authentication") || detail.includes("not authenticated")) {
      return "Sua sessão expirou. Entre novamente para continuar.";
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("offline")) {
      return "Não foi possível acessar seus personagens agora. A ficha local continua disponível.";
    }
    return "Não foi possível concluir a operação do personagem. Tente novamente.";
  }

  function normalizeUuid(value, label, allowEmpty = false) {
    if (allowEmpty && (value === null || value === undefined || String(value).trim() === "")) return null;
    const id = String(value ?? "").trim().toLowerCase();
    if (!UUID_PATTERN.test(id)) throw characterError("LAT-CHARACTER-ID-001", `${label} inválido.`);
    return id;
  }

  function currentStatePayload(state, stateTools = root?.LATIO_STATE) {
    const schema = stateTools?.STATE_SCHEMA;
    if (!schema || typeof stateTools?.persistentPayload !== "function") {
      throw characterError("LAT-CHARACTER-STATE-001", "O validador da ficha não está disponível.");
    }
    let payload;
    try {
      payload = stateTools.persistentPayload(state);
    } catch {
      throw characterError("LAT-CHARACTER-STATE-002", "O estado atual da ficha é inválido.");
    }
    if (payload?.meta?.appId !== schema.appId
      || Number(payload?.meta?.schemaVersion) !== schema.currentVersion
      || !payload?.character
      || typeof payload.character !== "object"
      || Array.isArray(payload.character)) {
      throw characterError("LAT-CHARACTER-STATE-003", "O estado do personagem não é compatível com o Marufia Online.");
    }
    return payload;
  }

  function normalizedRevision(value) {
    const revision = Number(value);
    if (!Number.isSafeInteger(revision) || revision < 1) {
      throw characterError("LAT-CHARACTER-REVISION-001", "A revisão online do personagem é inválida.");
    }
    return revision;
  }

  function normalizedCharacter(value) {
    const character = Array.isArray(value) ? value[0] : value;
    const id = normalizeUuid(character?.id, "Personagem");
    const ownerId = normalizeUuid(character?.owner_id, "Proprietário");
    const campaignId = normalizeUuid(character?.campaign_id, "Campanha", true);
    const name = String(character?.name ?? "").trim();
    const schemaVersion = Number(character?.schema_version);
    const revision = normalizedRevision(character?.revision);
    const lastChangeOrigin = String(character?.last_change_origin ?? "");
    if (!name || name.length > 120 || !character?.state || typeof character.state !== "object" || Array.isArray(character.state)
      || character.state?.meta?.appId !== "marufia-latio"
      || Number(character.state?.meta?.schemaVersion) !== schemaVersion
      || !["player", "gm", "system"].includes(lastChangeOrigin)) {
      throw characterError("LAT-CHARACTER-DATA-001", "O servidor devolveu um personagem inválido.");
    }
    return Object.freeze({
      ...character,
      id,
      owner_id: ownerId,
      campaign_id: campaignId,
      name,
      schema_version: schemaVersion,
      revision,
      last_change_origin: lastChangeOrigin,
    });
  }

  function createCharacterService(client, stateTools = root?.LATIO_STATE) {
    if (!client?.from || !client?.auth?.getSession) {
      throw characterError("LAT-CHARACTER-CLIENT-001", "O serviço de personagens não está disponível.");
    }

    async function currentUserId() {
      const result = await client.auth.getSession();
      if (result.error) throw characterError("LAT-CHARACTER-SESSION-001", friendlyCharacterMessage(result.error));
      const userId = result.data?.session?.user?.id;
      if (!userId) throw characterError("LAT-CHARACTER-SESSION-002", "Sua sessão expirou. Entre novamente para continuar.");
      return normalizeUuid(userId, "Usuário");
    }

    async function listOwn() {
      const userId = await currentUserId();
      const result = await client
        .from("characters")
        .select(CHARACTER_COLUMNS)
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false });
      if (result.error) throw characterError("LAT-CHARACTER-LIST-001", friendlyCharacterMessage(result.error));
      return (Array.isArray(result.data) ? result.data : []).map(normalizedCharacter);
    }

    async function loadOwn(characterId) {
      const id = normalizeUuid(characterId, "Personagem");
      await currentUserId();
      const result = await client
        .from("characters")
        .select(CHARACTER_COLUMNS)
        .eq("id", id)
        .single();
      if (result.error) throw characterError("LAT-CHARACTER-LOAD-001", friendlyCharacterMessage(result.error));
      return normalizedCharacter(result.data);
    }

    async function createIndependent(state) {
      await currentUserId();
      const payload = currentStatePayload(state, stateTools);
      const result = await client
        .from("characters")
        .insert({ state: payload })
        .select(CHARACTER_COLUMNS)
        .single();
      if (result.error) throw characterError("LAT-CHARACTER-CREATE-001", friendlyCharacterMessage(result.error));
      return normalizedCharacter(result.data);
    }

    async function saveState(characterId, state, expectedRevision) {
      const id = normalizeUuid(characterId, "Personagem");
      const revision = normalizedRevision(expectedRevision);
      await currentUserId();
      const payload = currentStatePayload(state, stateTools);
      if (typeof client.rpc !== "function") {
        throw characterError("LAT-CHARACTER-CLIENT-002", "A gravação protegida do personagem não está disponível.");
      }
      const result = await client.rpc("save_character_state", {
        p_character_id: id,
        p_state: payload,
        p_expected_revision: revision,
      });
      if (result.error) {
        const code = String(result.error.code ?? "") === "40001"
          ? "LAT-CHARACTER-CONFLICT-001"
          : "LAT-CHARACTER-SAVE-001";
        throw characterError(code, friendlyCharacterMessage(result.error));
      }
      return normalizedCharacter(result.data);
    }

    async function associate(characterId, campaignId = null) {
      const id = normalizeUuid(characterId, "Personagem");
      const nextCampaignId = normalizeUuid(campaignId, "Campanha", true);
      await currentUserId();
      const result = await client
        .from("characters")
        .update({ campaign_id: nextCampaignId })
        .eq("id", id)
        .select(CHARACTER_COLUMNS)
        .single();
      if (result.error) throw characterError("LAT-CHARACTER-ASSOCIATE-001", friendlyCharacterMessage(result.error));
      return normalizedCharacter(result.data);
    }

    return Object.freeze({ currentUserId, listOwn, loadOwn, createIndependent, saveState, associate });
  }

  return {
    CHARACTER_COLUMNS,
    UUID_PATTERN,
    friendlyCharacterMessage,
    currentStatePayload,
    normalizedRevision,
    normalizedCharacter,
    createCharacterService,
  };
});
