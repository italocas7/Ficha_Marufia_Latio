const assert = require("node:assert/strict");
const test = require("node:test");

const homeTools = require("../../src/online/home.js");

function serviceTools(options = {}) {
  const calls = { campaignIds: [], characterIds: [] };
  return {
    calls,
    campaignTools: {
      createCampaignService() {
        return {
          async currentUserId() { return "user-1"; },
          async listOwnMemberships() { return options.memberships ?? []; },
          async listVisible(ids) {
            calls.campaignIds.push(...ids);
            return options.campaigns ?? [];
          },
        };
      },
      friendlyCampaignMessage(error) { return error?.campaignMessage ?? "Não foi possível concluir a operação da campanha. Tente novamente."; },
    },
    characterTools: {
      createCharacterService() {
        return {
          async listOwn() { return options.characters ?? []; },
          async loadOwn(characterId) {
            calls.characterIds.push(characterId);
            return options.loadedCharacter ?? (options.characters ?? []).find((character) => character.id === characterId);
          },
        };
      },
      friendlyCharacterMessage(error) { return error?.characterMessage ?? "Não foi possível concluir a operação do personagem. Tente novamente."; },
    },
  };
}

test("loads only the authenticated user's characters and campaign memberships", async () => {
  const characters = [{ id: "character-1", name: "Artemis" }];
  const memberships = [
    { campaign_id: "campaign-1", user_id: "user-1", role: "gm" },
    { campaign_id: "campaign-2", user_id: "user-1", role: "player" },
  ];
  const campaigns = [{ id: "campaign-1", name: "A Coroa Partida" }, { id: "campaign-2", name: "Convidada" }];
  const tools = serviceTools({ characters, memberships, campaigns });
  const result = await homeTools.createHomeService({}, tools.campaignTools, tools.characterTools).load();
  assert.deepEqual(result, { currentUserId: "user-1", characters, memberships, campaigns });
  assert.deepEqual(tools.calls.campaignIds, ["campaign-1", "campaign-2"]);
  assert.equal((await homeTools.createHomeService({}, tools.campaignTools, tools.characterTools).loadCharacter("character-1")).name, "Artemis");
  assert.deepEqual(tools.calls.characterIds, ["character-1"]);
});

test("keeps Mæstre access scoped to each campaign", () => {
  const campaigns = [{ id: "campaign-1", name: "Administrada" }, { id: "campaign-2", name: "Como jogador" }];
  const administered = homeTools.gmCampaigns({
    campaigns,
    memberships: [
      { campaign_id: "campaign-1", role: "gm" },
      { campaign_id: "campaign-2", role: "player" },
    ],
  });
  assert.deepEqual(administered, [campaigns[0]]);
});

test("renders the principal navigation and only authorized Mæstre panels", () => {
  const html = homeTools.homeDialogHtml({
    mode: "home",
    userName: "<Jogador>",
    loading: false,
    characters: [{ id: "character-1", name: "Artemis" }],
    campaigns: [{ id: "campaign-1", name: "A <Coroa>" }, { id: "campaign-2", name: "Convidada" }],
    memberships: [
      { campaign_id: "campaign-1", role: "gm" },
      { campaign_id: "campaign-2", role: "player" },
    ],
  });
  assert.match(html, /MARUFIA ONLINE/);
  assert.match(html, /Minhas fichas/);
  assert.match(html, /Campanhas/);
  assert.match(html, /Entrar em campanha/);
  assert.match(html, /Configurações/);
  assert.match(html, /Painel do Mæstre · A &lt;Coroa&gt;/);
  assert.doesNotMatch(html, /Painel do Mæstre · Convidada/);
  assert.doesNotMatch(html, /<Jogador>|<Coroa>/);
});

test("renders online character summaries without changing their state", () => {
  const character = {
    id: "character-1",
    name: "<Artemis>",
    campaign_id: "campaign-1",
    schema_version: 5,
    updated_at: "2026-08-20T12:00:00.000Z",
  };
  const html = homeTools.homeDialogHtml({
    mode: "characters",
    loading: false,
    selectedCharacterId: "character-1",
    characters: [character],
    campaigns: [{ id: "campaign-1", name: "A Coroa Partida" }],
  });
  assert.match(html, /Minhas fichas/);
  assert.match(html, /&lt;Artemis&gt;/);
  assert.match(html, /A Coroa Partida/);
  assert.match(html, /Schema v5/);
  assert.match(html, /data-online-home-action="select-character"/);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /Abrir ficha selecionada/);
  assert.match(html, /Continuar na ficha atual/);
  assert.doesNotMatch(html, /<Artemis>/);
  assert.deepEqual(character, {
    id: "character-1",
    name: "<Artemis>",
    campaign_id: "campaign-1",
    schema_version: 5,
    updated_at: "2026-08-20T12:00:00.000Z",
  });
});

test("loads a selected account character, preserving and linking the local copy", async () => {
  const state = {
    meta: { appId: "marufia-latio", schemaVersion: 5, started: true, createdAt: "2026-09-18T20:00:00.000Z" },
    character: { name: "Kosumo" },
  };
  const character = {
    id: "character-1",
    owner_id: "user-1",
    name: "Kosumo",
    revision: 7,
    updated_at: "2026-09-18T21:00:00.000Z",
    last_change_origin: "player",
    state,
  };
  const sequence = [];
  const marked = [];
  const remembered = [];
  const announced = [];
  const loaded = await homeTools.activateRemoteCharacter({
    service: {
      async loadCharacter(id) {
        sequence.push(`load:${id}`);
        return character;
      },
    },
    characterId: character.id,
    currentUserId: "user-1",
    appBridge: {
      hasExistingSheet: () => true,
      createOnlineImportBackup() { sequence.push("backup"); },
      applyRemoteSnapshot(next) { sequence.push("apply"); return next === state; },
    },
    storage: {},
    importTools: {
      localSheetIdentity: () => "marufia-latio:2026-09-18T20:00:00.000Z",
      markImported(...args) { marked.push(args); return true; },
      announceLinkedCharacter(_view, value) { announced.push(value); },
    },
    syncTools: {
      rememberSyncedCharacter(...args) { remembered.push(args); return true; },
    },
    backendId: "server",
    beforeSwitch: async () => { sequence.push("flush"); },
    view: {},
  });

  assert.equal(loaded, character);
  assert.deepEqual(sequence, ["flush", "load:character-1", "backup", "apply"]);
  assert.deepEqual(marked[0].slice(1), ["user-1", "marufia-latio:2026-09-18T20:00:00.000Z", "character-1", "server"]);
  assert.equal(remembered[0][2], character);
  assert.deepEqual(announced, [character]);
});

test("waits for pending online saves before switching characters", async () => {
  let flushed = false;
  class FakeCustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  const view = {
    CustomEvent: FakeCustomEvent,
    dispatchEvent(event) {
      assert.equal(event.type, homeTools.BEFORE_CHARACTER_SWITCH_EVENT);
      event.detail.waitUntil(Promise.resolve().then(() => { flushed = true; }));
    },
    setTimeout,
    clearTimeout,
  };
  await homeTools.waitForCharacterSwitch(view, 100);
  assert.equal(flushed, true);
});

test("prefers specific service errors while preserving the local fallback", () => {
  const tools = serviceTools();
  assert.equal(
    homeTools.friendlyHomeMessage({ characterMessage: "Personagens indisponíveis." }, tools.campaignTools, tools.characterTools),
    "Personagens indisponíveis.",
  );
  assert.match(homeTools.friendlyHomeMessage({}, null, null), /ficha local continua disponível/i);
});
