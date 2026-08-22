"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const campaignTools = require("../../src/online/campaigns.js");
const characterTools = require("../../src/online/characters.js");
const realtimeTools = require("../../src/online/character_realtime.js");
const gmPanelTools = require("../../src/online/gm_panel.js");
const rollTools = require("../../src/online/rolls.js");
const liveRollTools = require("../../src/online/live_rolls.js");
const { JOIN_CODE, createSharedSupabase } = require("../helpers/shared_supabase.cjs");

const USERS = Object.freeze({
  gm: "11111111-1111-4111-8111-111111111111",
  playerA: "22222222-2222-4222-8222-222222222222",
  playerB: "33333333-3333-4333-8333-333333333333",
});

const ROLL_IDS = Object.freeze({
  playerA: "77777777-7777-4777-8777-777777777777",
  playerB: "88888888-8888-4888-8888-888888888888",
});

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

function characterState(name, hpCurrent) {
  return {
    meta: { appId: "marufia-latio", schemaVersion: 5 },
    character: { name },
    resources: { hpCurrent, hpMaximum: 30, pmCurrent: 20, pmMaximum: 20 },
    effects: [],
    inventory: { weapons: [], equipment: [], selectedWeaponId: "" },
  };
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function flushRealtime() {
  return new Promise((resolve) => setImmediate(resolve));
}

test("Fase 40 simula Mæstre, Jogador A e Jogador B no mesmo fluxo online", async (t) => {
  const server = createSharedSupabase();
  const clients = Object.fromEntries(Object.entries(USERS).map(([role, userId]) => [role, server.clientFor(userId)]));
  const campaigns = Object.fromEntries(Object.entries(clients).map(([role, client]) => [role, campaignTools.createCampaignService(client)]));
  const characters = Object.fromEntries(Object.entries(clients).map(([role, client]) => [role, characterTools.createCharacterService(client, stateTools)]));
  const rolls = Object.fromEntries(Object.entries(clients).map(([role, client]) => [role, rollTools.createRollService(client)]));

  const gmPanel = gmPanelTools.createGmPanelService(
    clients.gm,
    campaignTools,
    characterTools,
    summaryTools,
    {},
    {},
    {},
  );
  const gmRealtime = realtimeTools.createCharacterRealtimeService(clients.gm, characterTools);
  const playerBRealtime = realtimeTools.createCharacterRealtimeService(clients.playerB, characterTools);
  const gmLiveRolls = liveRollTools.createLiveRollService(clients.gm, campaignTools, rollTools);
  const playerALiveRolls = liveRollTools.createLiveRollService(clients.playerA, campaignTools, rollTools);
  const playerBLiveRolls = liveRollTools.createLiveRollService(clients.playerB, campaignTools, rollTools);
  const trace = [];

  const campaign = await campaigns.gm.create({ name: "Crônicas da Fase 40", description: "Teste multiusuário isolado" });
  trace.push("1. GM cria campanha");
  assert.equal(campaign.join_code, JOIN_CODE);

  const joinedA = await campaigns.playerA.join({ code: campaign.join_code });
  trace.push("2. A entra");
  assert.equal(joinedA.member_role, "player");
  assert.equal(joinedA.campaign_id, campaign.id);

  const joinedB = await campaigns.playerB.join({ code: campaign.join_code });
  trace.push("3. B entra");
  assert.equal(joinedB.member_role, "player");
  assert.equal(joinedB.campaign_id, campaign.id);

  const independentA = await characters.playerA.createIndependent(characterState("Ayla", 30));
  trace.push("4. A cria personagem");
  assert.equal(independentA.owner_id, USERS.playerA);
  assert.equal(independentA.campaign_id, null);

  const independentB = await characters.playerB.createIndependent(characterState("Breno", 28));
  trace.push("5. B cria personagem");
  assert.equal(independentB.owner_id, USERS.playerB);
  assert.equal(independentB.campaign_id, null);

  const characterA = await characters.playerA.associate(independentA.id, campaign.id);
  const characterB = await characters.playerB.associate(independentB.id, campaign.id);
  assert.equal(characterA.campaign_id, campaign.id);
  assert.equal(characterB.campaign_id, campaign.id);

  const gmCharacterEvents = [];
  const playerBCharacterEvents = [];
  const gmRollEvents = [];
  const playerARollEvents = [];
  const playerBRollEvents = [];
  const realtimeStatuses = [];
  const subscriptions = [
    gmRealtime.subscribeToCampaign(campaign.id, (change) => gmCharacterEvents.push(change), (status) => realtimeStatuses.push(`gm:${status}`)),
    playerBRealtime.subscribeToCharacter(characterB.id, (change) => playerBCharacterEvents.push(change), (status) => realtimeStatuses.push(`b:${status}`)),
  ];
  const gmMembership = await gmLiveRolls.requireCampaignMember(campaign.id);
  assert.equal(gmMembership.role, "gm");
  subscriptions.push(gmLiveRolls.subscribe(campaign.id, (roll) => gmRollEvents.push(roll), (status) => realtimeStatuses.push(`rolls:${status}`)));
  subscriptions.push(playerALiveRolls.subscribe(campaign.id, (roll) => playerARollEvents.push(roll), (status) => realtimeStatuses.push(`rolls-a:${status}`)));
  subscriptions.push(playerBLiveRolls.subscribe(campaign.id, (roll) => playerBRollEvents.push(roll), (status) => realtimeStatuses.push(`rolls-b:${status}`)));
  t.after(async () => Promise.all(subscriptions.map((subscription) => subscription.unsubscribe())));
  await flushRealtime();
  assert.deepEqual(realtimeStatuses.slice(0, 5).sort(), [
    "b:SUBSCRIBED",
    "gm:SUBSCRIBED",
    "rolls-a:SUBSCRIBED",
    "rolls-b:SUBSCRIBED",
    "rolls:SUBSCRIBED",
  ]);

  const changedStateA = copy(characterA.state);
  changedStateA.resources.hpCurrent = 23;
  const savedA = await characters.playerA.saveState(characterA.id, changedStateA, characterA.revision);
  trace.push("6. A altera PV");
  assert.equal(savedA.state.resources.hpCurrent, 23);
  assert.equal(savedA.last_change_origin, "player");
  await flushRealtime();

  const gmReceivedA = gmCharacterEvents.find((change) => change.character.id === characterA.id);
  trace.push("7. GM recebe alteração de A");
  assert.equal(gmReceivedA.character.state.resources.hpCurrent, 23);
  assert.equal(gmReceivedA.character.revision, savedA.revision);

  const changedB = await gmPanel.setCharacterHp(characterB.id, 17, characterB.revision);
  trace.push("8. GM altera B");
  assert.equal(changedB.state.resources.hpCurrent, 17);
  assert.equal(changedB.last_change_origin, "gm");
  await flushRealtime();

  const bReceivedGm = playerBCharacterEvents.find((change) => change.character.revision === changedB.revision);
  trace.push("9. B recebe alteração do GM");
  assert.equal(bReceivedGm.character.state.resources.hpCurrent, 17);
  assert.equal(bReceivedGm.character.last_change_origin, "gm");

  const rollA = await rolls.playerA.record(characterA.id, {
    rollType: "skill",
    skillName: "Vontade",
    mode: "normal",
    formula: "1d100",
    rawRoll: [42],
    modifier: 0,
    target: 60,
    total: 42,
    outcome: "Normal",
  }, ROLL_IDS.playerA, "public");
  trace.push("10. A rola");
  assert.equal(rollA.visibility, "public");
  await flushRealtime();

  const gmReceivedRollA = gmRollEvents.find((roll) => roll.id === ROLL_IDS.playerA);
  trace.push("11. GM recebe rolagem de A");
  assert.equal(gmReceivedRollA.characterName, "Ayla");
  assert.equal(gmReceivedRollA.total, 42);
  assert.equal(playerBRollEvents.find((roll) => roll.id === ROLL_IDS.playerA)?.visibility, "public");

  const rollB = await rolls.playerB.record(characterB.id, {
    rollType: "skill",
    skillName: "Fortitude",
    mode: "normal",
    formula: "1d100",
    rawRoll: [81],
    modifier: 0,
    target: 55,
    total: 81,
    outcome: "Falha",
  }, ROLL_IDS.playerB, "public");
  trace.push("12. B rola");
  assert.equal(rollB.visibility, "public");
  await flushRealtime();

  const gmReceivedRollB = gmRollEvents.find((roll) => roll.id === ROLL_IDS.playerB);
  trace.push("13. GM recebe rolagem de B");
  assert.equal(gmReceivedRollB.characterName, "Breno");
  assert.equal(gmReceivedRollB.outcome, "Falha");
  assert.equal(playerARollEvents.find((roll) => roll.id === ROLL_IDS.playerB)?.visibility, "public");

  const snapshot = server.snapshot();
  assert.equal(snapshot.campaigns.length, 1);
  assert.deepEqual(snapshot.memberships.map((membership) => membership.role).sort(), ["gm", "player", "player"]);
  assert.equal(snapshot.characters.length, 2);
  assert.equal(snapshot.rolls.length, 2);
  assert.deepEqual(trace, [
    "1. GM cria campanha",
    "2. A entra",
    "3. B entra",
    "4. A cria personagem",
    "5. B cria personagem",
    "6. A altera PV",
    "7. GM recebe alteração de A",
    "8. GM altera B",
    "9. B recebe alteração do GM",
    "10. A rola",
    "11. GM recebe rolagem de A",
    "12. B rola",
    "13. GM recebe rolagem de B",
  ]);
});
