const test = require("node:test");
const assert = require("node:assert/strict");

const liveTools = require("../../src/online/live_rolls.js");
const rollTools = require("../../src/online/rolls.js");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CAMPAIGN_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_CAMPAIGN_ID = "33333333-3333-4333-8333-333333333333";
const CHARACTER_ID = "44444444-4444-4444-8444-444444444444";
const ROLL_ID = "55555555-5555-4555-8555-555555555555";

function rollRow(overrides = {}) {
  return {
    id: ROLL_ID,
    campaign_id: CAMPAIGN_ID,
    character_id: CHARACTER_ID,
    user_id: USER_ID,
    character_name: "Arthur",
    roll_type: "skill",
    skill_name: "Atletismo",
    mode: "adv",
    formula: "2d100",
    raw_roll: [80, 20],
    modifier: 0,
    target: 55,
    total: 20,
    outcome: "Extremo",
    visibility: "public",
    created_at: "2026-08-21T12:34:56.000Z",
    ...overrides,
  };
}

function fakeServiceClient(options = {}) {
  const calls = { tables: [], filters: [], channels: [], removed: [], rpc: [] };
  const channel = {
    bindings: [],
    on(type, config, listener) {
      this.bindings.push({ type, config, listener });
      return this;
    },
    subscribe(listener) {
      this.status = listener;
      return this;
    },
  };
  const client = {
    from(table) {
      calls.tables.push(table);
      const query = {
        select() { return this; },
        eq(column, value) { calls.filters.push({ table, column, value }); return this; },
        order() { return this; },
        limit(value) {
          assert.equal(value, 50);
          return Promise.resolve({ data: options.rolls ?? [rollRow()], error: null });
        },
      };
      return query;
    },
    async rpc(name, args) {
      calls.rpc.push({ name, args });
      return {
        data: options.clearData ?? [{ deleted_rolls: 3, history_revision: 2 }],
        error: options.clearError ?? null,
      };
    },
    channel(name) { calls.channels.push(name); return channel; },
    async removeChannel(value) { calls.removed.push(value); return "ok"; },
  };
  return { client, calls, channel };
}

function campaignTools(role = "gm") {
  return {
    createCampaignService() {
      return {
        async currentUserId() { return USER_ID; },
        async listOwnMemberships() { return role ? [{ campaign_id: CAMPAIGN_ID, user_id: USER_ID, role }] : []; },
      };
    },
  };
}

test("normalizes every authorized visibility without trusting malformed Realtime payloads", () => {
  const roll = liveTools.normalizedLiveRoll(rollRow(), rollTools);
  assert.equal(roll.campaignId, CAMPAIGN_ID);
  assert.equal(roll.characterId, CHARACTER_ID);
  assert.equal(roll.formula, "2d100");
  assert.equal(roll.total, 20);
  assert.equal(liveTools.normalizedLiveRoll(rollRow({ visibility: "secret" }), rollTools).visibility, "secret");
  assert.equal(liveTools.normalizedLiveRoll(rollRow({ visibility: "gm" }), rollTools).visibility, "gm");
  assert.throws(() => liveTools.normalizedLiveRoll(rollRow({ visibility: "private" }), rollTools), /inválida/i);
  assert.throws(() => liveTools.normalizedLiveRoll(rollRow({ total: 80 }), rollTools), /não corresponde/i);
});

test("requires membership inside the exact campaign", async () => {
  const { client } = fakeServiceClient();
  const service = liveTools.createLiveRollService(client, campaignTools("gm"), rollTools);
  assert.deepEqual(await service.requireCampaignMember(CAMPAIGN_ID), { campaignId: CAMPAIGN_ID, userId: USER_ID, role: "gm" });
  assert.deepEqual(
    await liveTools.createLiveRollService(client, campaignTools("player"), rollTools).requireCampaignMember(CAMPAIGN_ID),
    { campaignId: CAMPAIGN_ID, userId: USER_ID, role: "player" },
  );
  await assert.rejects(
    () => liveTools.createLiveRollService(client, campaignTools(null), rollTools).requireCampaignMember(CAMPAIGN_ID),
    /participantes/i,
  );
});

test("loads only campaign rolls with their protected character snapshot", async () => {
  const { client, calls } = fakeServiceClient();
  const service = liveTools.createLiveRollService(client, campaignTools(), rollTools);
  const rolls = await service.listRecent(CAMPAIGN_ID);
  assert.equal(rolls[0].id, ROLL_ID);
  assert.equal(rolls[0].characterName, "Arthur");
  assert.deepEqual(calls.filters, [
    { table: "rolls", column: "campaign_id", value: CAMPAIGN_ID },
  ]);
});

test("subscribes only to new rolls from one campaign", async () => {
  const { client, calls, channel } = fakeServiceClient();
  const service = liveTools.createLiveRollService(client, campaignTools(), rollTools);
  const received = [];
  const statuses = [];
  const clears = [];
  const subscription = service.subscribe(
    CAMPAIGN_ID,
    (roll) => received.push(roll),
    (status) => statuses.push(status),
    (revision) => clears.push(revision),
  );
  assert.equal(calls.channels[0], `marufia-live-rolls:${CAMPAIGN_ID}`);
  assert.deepEqual(channel.bindings.map((binding) => binding.config), [
    {
      event: "INSERT",
      schema: "public",
      table: "rolls",
      filter: `campaign_id=eq.${CAMPAIGN_ID}`,
    },
    {
      event: "UPDATE",
      schema: "public",
      table: "campaigns",
      filter: `id=eq.${CAMPAIGN_ID}`,
    },
  ]);
  channel.bindings[0].listener({ new: rollRow() });
  channel.bindings[0].listener({ new: rollRow({ campaign_id: OTHER_CAMPAIGN_ID }) });
  channel.bindings[1].listener({
    old: { id: CAMPAIGN_ID, roll_history_revision: 1 },
    new: { id: CAMPAIGN_ID, roll_history_revision: 2 },
  });
  channel.bindings[1].listener({
    old: { id: CAMPAIGN_ID, roll_history_revision: 2 },
    new: { id: CAMPAIGN_ID, roll_history_revision: 2 },
  });
  assert.equal(received.length, 1);
  assert.deepEqual(clears, [2]);
  assert.equal(statuses.at(-1), "INVALID_PAYLOAD");
  await subscription.unsubscribe();
  assert.equal(calls.removed.length, 1);
});

test("clears an exact campaign only through the protected rpc", async () => {
  const { client, calls } = fakeServiceClient();
  const result = await liveTools.createLiveRollService(client, campaignTools("gm"), rollTools).clearHistory(CAMPAIGN_ID);
  assert.deepEqual(result, { deletedRolls: 3, historyRevision: 2 });
  assert.deepEqual(calls.rpc, [{
    name: "clear_campaign_roll_history",
    args: { p_campaign_id: CAMPAIGN_ID },
  }]);

  const denied = fakeServiceClient({ clearError: { code: "42501", message: "campaign gm required" } });
  await assert.rejects(
    () => liveTools.createLiveRollService(denied.client, campaignTools("player"), rollTools).clearHistory(CAMPAIGN_ID),
    /Somente o Mæstre/i,
  );
  assert.throws(() => liveTools.normalizedClearResult([{ deleted_rolls: -1, history_revision: 2 }]), /não confirmou/i);
});

test("renders character, type, die, result, outcome, and time safely", () => {
  const roll = liveTools.normalizedLiveRoll(rollRow({ character_name: "Arthur & Kael", skill_name: "<script>Atletismo</script>", visibility: "secret" }), rollTools);
  const html = liveTools.liveRollItemHtml(roll);
  assert.match(html, /Arthur &amp; Kael/);
  assert.match(html, /Perícia · &lt;script&gt;Atletismo&lt;\/script&gt;/);
  assert.match(html, /2d100/);
  assert.match(html, />20</);
  assert.match(html, /Extremo/);
  assert.match(html, /Secreta/);
  assert.match(html, /<time/);
  assert.doesNotMatch(html, /<script>/);
});

test("renders a concise live connection state and empty history", () => {
  const html = liveTools.liveRollsPanelHtml({ connection: "live", loading: false, rolls: [] });
  assert.match(html, /data-connection="live"/);
  assert.match(html, /Ao vivo/);
  assert.match(html, /Nenhuma rolagem visível/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /Limpar histórico/);
});

test("shows the irreversible clear confirmation only to the gm", () => {
  const gmHtml = liveTools.liveRollsPanelHtml({
    connection: "live",
    loading: false,
    role: "gm",
    confirmingClear: true,
    rolls: [liveTools.normalizedLiveRoll(rollRow(), rollTools)],
  });
  assert.match(gmHtml, /data-online-live-rolls-action="clear"/);
  assert.match(gmHtml, /Apagar permanentemente todas as rolagens/);
  assert.match(gmHtml, /Esta ação não pode ser desfeita/);
  assert.match(gmHtml, /PV, PM, condições, itens e sessões não serão alterados/);

  const playerHtml = liveTools.liveRollsPanelHtml({ connection: "live", loading: false, role: "player", rolls: [] });
  assert.doesNotMatch(playerHtml, /data-online-live-rolls-action="clear"/);
  assert.doesNotMatch(playerHtml, /confirm-clear/);
});
