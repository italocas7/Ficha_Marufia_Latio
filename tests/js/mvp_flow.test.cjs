"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const storageTools = require("../../src/core/storage.js");
const authTools = require("../../src/online/auth.js");
const campaignTools = require("../../src/online/campaigns.js");
const characterTools = require("../../src/online/characters.js");
const realtimeTools = require("../../src/online/character_realtime.js");
const gmPanelTools = require("../../src/online/gm_panel.js");
const rollTools = require("../../src/online/rolls.js");
const liveRollTools = require("../../src/online/live_rolls.js");
const { createSharedSupabase } = require("../helpers/shared_supabase.cjs");
const { createAuthenticatedSupabase } = require("../helpers/authenticated_supabase.cjs");

const ACCOUNTS = Object.freeze({
  gm: Object.freeze({ email: "mestre@mvp.marufia", password: "segredo-mestre", displayName: "Mæstre Latio" }),
  player: Object.freeze({ email: "jogador@mvp.marufia", password: "segredo-jogador", displayName: "Jogador Ayla" }),
});
const ROLL_ID = "99999999-9999-4999-8999-999999999999";
const LOCAL_SHEET_KEY = "marufia_latio_state";

const stateTools = Object.freeze({
  STATE_SCHEMA: Object.freeze({ appId: "marufia-latio", currentVersion: 5 }),
  persistentPayload(state) {
    return JSON.parse(JSON.stringify(state));
  },
});

const summaryTools = Object.freeze({
  resourceSummary(state) {
    return {
      hp: { current: state.resources.hpCurrent, maximum: state.resources.hpMaximum },
      pm: { current: state.resources.pmCurrent, maximum: state.resources.pmMaximum },
    };
  },
});

function characterState(name, hpCurrent = 30) {
  return {
    meta: { appId: "marufia-latio", schemaVersion: 5 },
    character: { name },
    resources: { hpCurrent, hpMaximum: 30, pmCurrent: 20, pmMaximum: 20 },
    effects: [],
    inventory: { weapons: [], equipment: [], selectedWeaponId: "" },
  };
}

function memoryStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return Object.freeze({
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); },
  });
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function flushRealtime() {
  return new Promise((resolve) => setImmediate(resolve));
}

function services(client) {
  return Object.freeze({
    auth: authTools.createAuthService(client),
    campaigns: campaignTools.createCampaignService(client),
    characters: characterTools.createCharacterService(client, stateTools),
    realtime: realtimeTools.createCharacterRealtimeService(client, characterTools),
    rolls: rollTools.createRollService(client),
    liveRolls: liveRollTools.createLiveRollService(client, campaignTools, rollTools),
    gmPanel: gmPanelTools.createGmPanelService(client, campaignTools, characterTools, summaryTools, {}, {}, {}),
  });
}

test("Fase 51 comprova o MVP completo e persistente entre Mæstre e Jogador", async () => {
  let server = createSharedSupabase();
  let identity = createAuthenticatedSupabase(server);
  const localSheet = memoryStorage();
  let gm = services(identity.createClient());
  let player = services(identity.createClient());
  const trace = [];

  const gmAccount = await gm.auth.signUp(ACCOUNTS.gm);
  const playerAccount = await player.auth.signUp(ACCOUNTS.player);
  trace.push("1. Mæstre e Jogador criam contas");
  assert.equal(gmAccount.profile.display_name, "Mæstre Latio");
  assert.equal(playerAccount.profile.display_name, "Jogador Ayla");

  const campaign = await gm.campaigns.create({ name: "Crônicas do MVP", description: "Fluxo mínimo completo" });
  trace.push("2. Mæstre cria campanha e recebe código");
  assert.match(campaign.join_code, /^MRF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/);

  const joined = await player.campaigns.join({ code: campaign.join_code });
  trace.push("3. Jogador usa o código e entra");
  assert.equal(joined.campaign_id, campaign.id);
  assert.equal(joined.member_role, "player");

  const independent = await player.characters.createIndependent(characterState("Ayla"));
  const character = await player.characters.associate(independent.id, campaign.id);
  trace.push("4. Jogador cria ou importa e vincula personagem");
  assert.equal(character.campaign_id, campaign.id);

  const gmCharacterEvents = [];
  const playerCharacterEvents = [];
  const gmRollEvents = [];
  const subscriptions = [
    gm.realtime.subscribeToCampaign(campaign.id, (change) => gmCharacterEvents.push(change)),
    player.realtime.subscribeToCharacter(character.id, (change) => {
      playerCharacterEvents.push(change);
      storageTools.saveLocal(LOCAL_SHEET_KEY, change.character.state, localSheet);
    }),
    gm.liveRolls.subscribe(campaign.id, (roll) => gmRollEvents.push(roll)),
  ];
  await flushRealtime();

  const editedState = copy(character.state);
  editedState.character.name = "Ayla da Aurora";
  editedState.resources.hpCurrent = 26;
  const playerSaved = await player.characters.saveState(character.id, editedState, character.revision);
  await flushRealtime();
  trace.push("5. Jogador altera ficha e Mæstre recebe");
  const gmSawPlayerEdit = gmCharacterEvents.find((change) => change.character.revision === playerSaved.revision);
  assert.equal(gmSawPlayerEdit.character.name, "Ayla da Aurora");
  assert.equal(gmSawPlayerEdit.character.state.resources.hpCurrent, 26);

  await player.rolls.record(character.id, {
    rollType: "skill",
    skillName: "Vontade",
    mode: "normal",
    formula: "1d100",
    rawRoll: [37],
    modifier: 0,
    target: 60,
    total: 37,
    outcome: "Normal",
  }, ROLL_ID, "public");
  await flushRealtime();
  trace.push("6. Jogador rola e Mæstre recebe resultado");
  const gmSawRoll = gmRollEvents.find((roll) => roll.id === ROLL_ID);
  assert.equal(gmSawRoll.total, 37);
  assert.equal(gmSawRoll.characterName, "Ayla da Aurora");

  const gmSaved = await gm.gmPanel.setCharacterHp(character.id, 18, playerSaved.revision);
  await flushRealtime();
  trace.push("7. Mæstre altera PV e Jogador recebe");
  const playerSawGmEdit = playerCharacterEvents.find((change) => change.character.revision === gmSaved.revision);
  assert.equal(playerSawGmEdit.character.state.resources.hpCurrent, 18);
  assert.equal(playerSawGmEdit.character.last_change_origin, "gm");
  assert.equal(storageTools.loadLocal(LOCAL_SHEET_KEY, null, localSheet).resources.hpCurrent, 18);

  await Promise.all(subscriptions.map((subscription) => subscription.unsubscribe()));
  await Promise.all([gm.auth.signOut(), player.auth.signOut()]);
  const databaseDisk = JSON.parse(JSON.stringify(server.snapshot()));
  const identityDisk = JSON.parse(JSON.stringify(identity.snapshot()));
  const localDisk = JSON.parse(JSON.stringify(localSheet.snapshot()));
  trace.push("8. Todos fecham o programa");
  assert.doesNotMatch(JSON.stringify(identityDisk), /segredo-(mestre|jogador)/);

  server = createSharedSupabase(databaseDisk);
  identity = createAuthenticatedSupabase(server, identityDisk);
  gm = services(identity.createClient());
  player = services(identity.createClient());
  const reopenedLocalSheet = memoryStorage(localDisk);
  assert.equal((await gm.auth.restore()).session, null);
  assert.equal((await player.auth.restore()).session, null);
  await gm.auth.signIn(ACCOUNTS.gm);
  await player.auth.signIn(ACCOUNTS.player);
  trace.push("9. Mæstre e Jogador abrem novamente e entram");

  const reopenedMemberships = await gm.campaigns.listOwnMemberships(gmAccount.user.id);
  const reopenedCampaigns = await gm.campaigns.listVisible(reopenedMemberships.map((item) => item.campaign_id));
  const reopenedCharacter = await player.characters.loadOwn(character.id);
  const reopenedPanel = await gm.gmPanel.loadCampaign(campaign.id);
  const reopenedRolls = await gm.liveRolls.listRecent(campaign.id);
  const reopenedLocalState = storageTools.loadLocal(LOCAL_SHEET_KEY, null, reopenedLocalSheet);
  trace.push("10. Campanha, ficha, PV e rolagem continuam salvos");

  assert.equal(reopenedCampaigns[0].id, campaign.id);
  assert.equal(reopenedCharacter.revision, gmSaved.revision);
  assert.equal(reopenedCharacter.state.meta.schemaVersion, 5);
  assert.equal(reopenedCharacter.state.resources.hpCurrent, 18);
  assert.equal(reopenedPanel.characters[0].character.id, character.id);
  assert.equal(reopenedPanel.characters[0].resources.hp.current, 18);
  assert.equal(reopenedRolls[0].id, ROLL_ID);
  assert.equal(reopenedRolls[0].total, 37);
  assert.deepEqual(reopenedLocalState, reopenedCharacter.state);
  assert.deepEqual(trace, [
    "1. Mæstre e Jogador criam contas",
    "2. Mæstre cria campanha e recebe código",
    "3. Jogador usa o código e entra",
    "4. Jogador cria ou importa e vincula personagem",
    "5. Jogador altera ficha e Mæstre recebe",
    "6. Jogador rola e Mæstre recebe resultado",
    "7. Mæstre altera PV e Jogador recebe",
    "8. Todos fecham o programa",
    "9. Mæstre e Jogador abrem novamente e entram",
    "10. Campanha, ficha, PV e rolagem continuam salvos",
  ]);
});
