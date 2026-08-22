const test = require("node:test");
const assert = require("node:assert/strict");

const gmTools = require("../../src/online/gm_panel.js");
const campaignToolsModule = require("../../src/online/campaigns.js");
const characterTools = require("../../src/online/characters.js");
const summaryTools = require("../../src/core/character_summary.js");
const rules = require("../../src/core/rules.js");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PLAYER_ID = "22222222-2222-4222-8222-222222222222";
const OTHER_PLAYER_ID = "33333333-3333-4333-8333-333333333333";
const CAMPAIGN_ID = "44444444-4444-4444-8444-444444444444";
const CHARACTER_ID = "55555555-5555-4555-8555-555555555555";
const EVENT_ID = "77777777-7777-4777-8777-777777777777";
const SESSION_ID = "88888888-8888-4888-8888-888888888888";
const NOW = Date.parse("2026-08-21T15:00:00.000Z");

function characterRow(overrides = {}) {
  return {
    id: CHARACTER_ID,
    owner_id: PLAYER_ID,
    campaign_id: CAMPAIGN_ID,
    name: "Arthur",
    state: {
      meta: { appId: "marufia-latio", schemaVersion: 5 },
      character: { name: "Arthur", level: 3 },
      attributes: { CON: 50, POD: 50 },
      resources: { hpCurrent: 27, pmCurrent: 20, hpMaxBonus: 0, pmMaxBonus: 0 },
      magicCore: { selectedId: "" },
      talents: [],
    },
    schema_version: 5,
    revision: 2,
    last_change_origin: "player",
    created_at: "2026-08-21T13:00:00.000Z",
    updated_at: "2026-08-21T14:30:00.000Z",
    ...overrides,
  };
}

function eventRow(overrides = {}) {
  return {
    id: EVENT_ID,
    campaign_id: CAMPAIGN_ID,
    character_id: CHARACTER_ID,
    actor_id: USER_ID,
    session_id: SESSION_ID,
    event_type: "hp_changed",
    payload: { character_name: "Arthur", old_value: 27, new_value: 19, origin: "gm" },
    created_at: "2026-08-21T14:58:00.000Z",
    ...overrides,
  };
}

function sessionRow(overrides = {}) {
  return {
    id: SESSION_ID,
    campaign_id: CAMPAIGN_ID,
    name: "A Coroa — Sessão 1",
    started_at: "2026-08-21T14:55:00.000Z",
    ended_at: null,
    status: "active",
    ...overrides,
  };
}

function fakeEnvironment(options = {}) {
  const calls = { tables: [], filters: [], gte: [], rpc: [], channels: [], removed: [] };
  const channel = {
    bindings: [],
    on(type, config, listener) { this.bindings.push({ type, config, listener }); return this; },
    subscribe(listener) { this.status = listener; return this; },
  };
  const client = {
    auth: { async getSession() { return { data: { session: { user: { id: USER_ID } } }, error: null }; } },
    from(table) {
      calls.tables.push(table);
      return {
        select() { return this; },
        eq(column, value) { calls.filters.push({ table, column, value }); return this; },
        gte(column, value) { calls.gte.push({ table, column, value }); return this; },
        async order() {
          if (table === "characters") return { data: options.characters ?? [characterRow()], error: null };
          if (table === "campaign_presence") return { data: options.presence ?? [
            { campaign_id: CAMPAIGN_ID, user_id: PLAYER_ID, seen_at: "2026-08-21T14:59:30.000Z", active_at: "2026-08-21T14:59:20.000Z" },
            { campaign_id: CAMPAIGN_ID, user_id: OTHER_PLAYER_ID, seen_at: "2026-08-21T14:50:00.000Z", active_at: "2026-08-21T14:49:00.000Z" },
            { campaign_id: CAMPAIGN_ID, user_id: USER_ID, seen_at: "2026-08-21T14:59:45.000Z", active_at: "2026-08-21T14:59:45.000Z" },
          ], error: null };
          if (table === "campaign_events") return { data: options.events ?? [eventRow()], error: null };
          if (table === "campaign_sessions") return { data: options.sessions ?? [sessionRow()], error: null };
          throw new Error(`Tabela inesperada: ${table}`);
        },
      };
    },
    async rpc(name, args) {
      calls.rpc.push({ name, args });
      if (name === "gm_set_character_hp") {
        const source = (options.characters ?? [characterRow()]).find((item) => item.id === args.p_character_id);
        if (!source) return { data: null, error: { code: "P0002", message: "campaign character required" } };
        return { data: characterRow({
          ...source,
          state: { ...source.state, resources: { ...source.state.resources, hpCurrent: args.p_hp_current } },
          revision: source.revision + 1,
          last_change_origin: "gm",
        }), error: null };
      }
      if (name === "gm_set_character_pm") {
        const source = (options.characters ?? [characterRow()]).find((item) => item.id === args.p_character_id);
        return { data: characterRow({
          ...source,
          state: { ...source.state, resources: { ...source.state.resources, pmCurrent: args.p_pm_current } },
          revision: source.revision + 1,
          last_change_origin: "gm",
        }), error: null };
      }
      if (name === "gm_add_character_condition") {
        const source = (options.characters ?? [characterRow()]).find((item) => item.id === args.p_character_id);
        const state = JSON.parse(JSON.stringify(source.state));
        state.effects ??= [];
        state.effects.push({ id: "gm:condition-1", name: args.p_condition_name, ca: args.p_ca, block: { cortante: args.p_block, perfurante: args.p_block, contundente: args.p_block } });
        return { data: characterRow({ ...source, state, revision: source.revision + 1, last_change_origin: "gm" }), error: null };
      }
      if (name === "gm_remove_character_condition") {
        const source = (options.characters ?? [characterRow()]).find((item) => item.id === args.p_character_id);
        const state = JSON.parse(JSON.stringify(source.state));
        state.effects = (state.effects ?? []).filter((effect) => effect.id !== args.p_condition_id);
        return { data: characterRow({ ...source, state, revision: source.revision + 1, last_change_origin: "gm" }), error: null };
      }
      if (name === "gm_add_character_item") {
        const source = (options.characters ?? [characterRow()]).find((item) => item.id === args.p_character_id);
        const state = JSON.parse(JSON.stringify(source.state));
        state.inventory ??= { weapons: [], equipment: [], selectedWeaponId: "" };
        state.inventory.weapons ??= [];
        state.inventory.equipment ??= [];
        const item = args.p_item_kind === "weapon"
          ? { id: "gm:item-1", type: args.p_category, name: args.p_name, damage: args.p_damage, weight: args.p_weight, property: args.p_property, description: args.p_description }
          : { id: "gm:item-1", name: args.p_name, category: args.p_category, qty: args.p_quantity, weight: args.p_weight, description: args.p_description };
        state.inventory[args.p_item_kind === "weapon" ? "weapons" : "equipment"].push(item);
        return { data: characterRow({ ...source, state, revision: source.revision + 1, last_change_origin: "gm" }), error: null };
      }
      if (name === "gm_remove_character_item") {
        const source = (options.characters ?? [characterRow()]).find((item) => item.id === args.p_character_id);
        const state = JSON.parse(JSON.stringify(source.state));
        const collection = args.p_item_kind === "weapon" ? "weapons" : "equipment";
        state.inventory[collection] = (state.inventory[collection] ?? []).filter((item) => item.id !== args.p_item_id);
        return { data: characterRow({ ...source, state, revision: source.revision + 1, last_change_origin: "gm" }), error: null };
      }
      if (name === "start_campaign_session") {
        return { data: sessionRow({ name: args.p_name }), error: null };
      }
      if (name === "end_campaign_session") {
        return { data: sessionRow({ id: args.p_session_id, ended_at: "2026-08-21T15:00:00.000Z", status: "ended" }), error: null };
      }
      return { data: "2026-08-21T15:00:00.000Z", error: null };
    },
    channel(name) { calls.channels.push(name); return channel; },
    async removeChannel(value) { calls.removed.push(value); return "ok"; },
  };
  const ownRole = options.role === undefined ? "gm" : options.role;
  const memberships = options.memberships ?? [
    { campaign_id: CAMPAIGN_ID, user_id: USER_ID, role: ownRole },
    { campaign_id: CAMPAIGN_ID, user_id: PLAYER_ID, role: "player" },
    { campaign_id: CAMPAIGN_ID, user_id: OTHER_PLAYER_ID, role: "player" },
  ];
  const campaigns = {
    createCampaignService() {
      return {
        async currentUserId() { return USER_ID; },
        async listOwnMemberships() { return memberships.filter((item) => item.user_id === USER_ID); },
        async listVisibleMembers() { return memberships; },
      };
    },
  };
  return { client, campaigns, calls, channel };
}

function service(environment) {
  return gmTools.createGmPanelService(
    environment.client,
    environment.campaigns,
    characterTools,
    summaryTools,
    rules,
    { talents: [] },
    [],
    () => NOW,
  );
}

test("requires the exact gm role in the requested campaign", async () => {
  const gm = fakeEnvironment();
  assert.deepEqual(await service(gm).requireCampaignGm(CAMPAIGN_ID), { campaignId: CAMPAIGN_ID, userId: USER_ID });
  await assert.rejects(() => service(fakeEnvironment({ role: "player" })).requireCampaignGm(CAMPAIGN_ID), /Somente o Mæstre/i);
});

test("loads character resources and counts only recent player presence", async () => {
  const environment = fakeEnvironment();
  const result = await service(environment).loadCampaign(CAMPAIGN_ID);
  assert.equal(result.playersOnline, 1);
  assert.equal(result.playersAway, 0);
  assert.equal(result.playersTotal, 2);
  assert.deepEqual(result.players, [
    { userId: PLAYER_ID, status: "online" },
    { userId: OTHER_PLAYER_ID, status: "offline" },
  ]);
  assert.equal(result.characters[0].presence, "online");
  assert.equal(result.events[0].eventType, "hp_changed");
  assert.equal(result.events[0].payload.new_value, 19);
  assert.equal(result.events[0].sessionId, SESSION_ID);
  assert.equal(result.sessions[0].name, "A Coroa — Sessão 1");
  assert.equal(result.activeSession.id, SESSION_ID);
  assert.equal(result.characters[0].character.name, "Arthur");
  assert.deepEqual(result.characters[0].resources, { hp: { current: 27, maximum: 33 }, pm: { current: 20, maximum: 26 } });
  assert.deepEqual(environment.calls.filters, [
    { table: "campaign_events", column: "campaign_id", value: CAMPAIGN_ID },
    { table: "campaign_sessions", column: "campaign_id", value: CAMPAIGN_ID },
    { table: "characters", column: "campaign_id", value: CAMPAIGN_ID },
    { table: "campaign_presence", column: "campaign_id", value: CAMPAIGN_ID },
  ]);
  assert.equal(environment.calls.gte[0].column, "seen_at");
  assert.equal(environment.calls.gte[0].value, "2026-08-21T14:58:30.000Z");
});

test("touches only the authenticated user's actual memberships", async () => {
  const secondCampaign = "66666666-6666-4666-8666-666666666666";
  const environment = fakeEnvironment({ memberships: [
    { campaign_id: CAMPAIGN_ID, user_id: USER_ID, role: "gm" },
    { campaign_id: secondCampaign, user_id: USER_ID, role: "player" },
    { campaign_id: CAMPAIGN_ID, user_id: PLAYER_ID, role: "player" },
  ] });
  assert.equal(await service(environment).touchOwnCampaigns(false), 2);
  assert.deepEqual(environment.calls.rpc, [
    { name: "touch_campaign_presence", args: { p_campaign_id: CAMPAIGN_ID, p_active: false } },
    { name: "touch_campaign_presence", args: { p_campaign_id: secondCampaign, p_active: false } },
  ]);
});

test("updates only current hp through the granular gm rpc", async () => {
  const environment = fakeEnvironment();
  const updated = await service(environment).setCharacterHp(CHARACTER_ID, 19, 2);
  assert.equal(updated.state.resources.hpCurrent, 19);
  assert.equal(updated.state.resources.pmCurrent, 20);
  assert.equal(updated.revision, 3);
  assert.equal(updated.last_change_origin, "gm");
  assert.deepEqual(environment.calls.rpc, [{
    name: "gm_set_character_hp",
    args: { p_character_id: CHARACTER_ID, p_hp_current: 19, p_expected_revision: 2 },
  }]);
  await assert.rejects(() => service(environment).setCharacterHp(CHARACTER_ID, 19.5, 2), /inteiro válido/i);
});

test("executes every explicitly approved pm, condition, and item action", async () => {
  assert.deepEqual(gmTools.GM_ACTIONS, {
    hpSet: true,
    pmSet: true,
    conditionAdd: true,
    conditionRemove: true,
    itemAdd: true,
    itemRemove: true,
  });
  const source = characterRow();
  source.state.effects = [{ id: "effect-1", name: "Atordoado", ca: -2, block: { cortante: 0, perfurante: 0, contundente: 0 } }];
  source.state.inventory = {
    weapons: [{ id: "weapon-1", type: "Curta", name: "Adaga", damage: "1d4", weight: "1", property: "", description: "" }],
    equipment: [{ id: "item-1", name: "Corda", category: "Equipamento", qty: 1, weight: "1", description: "" }],
    selectedWeaponId: "weapon-1",
  };
  const environment = fakeEnvironment({ characters: [source] });
  const gmService = service(environment);
  assert.equal((await gmService.setCharacterPm(CHARACTER_ID, 13, 2)).state.resources.pmCurrent, 13);
  assert.equal((await gmService.addCharacterCondition(CHARACTER_ID, { name: "Caído", ca: -1, block: 0 }, 2)).state.effects.at(-1).name, "Caído");
  assert.equal((await gmService.removeCharacterCondition(CHARACTER_ID, "effect-1", 2)).state.effects.length, 0);
  assert.equal((await gmService.addCharacterItem(CHARACTER_ID, {
    kind: "equipment", name: "Tocha", category: "Equipamento", quantity: 2, weight: "1", damage: "", property: "", description: "Luz",
  }, 2)).state.inventory.equipment.at(-1).name, "Tocha");
  assert.equal((await gmService.removeCharacterItem(CHARACTER_ID, "weapon", "weapon-1", 2)).state.inventory.weapons.length, 0);
  assert.deepEqual(environment.calls.rpc.map((call) => call.name), [
    "gm_set_character_pm",
    "gm_add_character_condition",
    "gm_remove_character_condition",
    "gm_add_character_item",
    "gm_remove_character_item",
  ]);
  await assert.rejects(() => gmService.addCharacterItem(CHARACTER_ID, {
    kind: "weapon", name: "Sem dano", category: "Arma", quantity: 1,
  }, 2), /Revise os campos/i);
});

test("starts and ends a named campaign session through protected rpcs", async () => {
  const environment = fakeEnvironment();
  const gmService = service(environment);
  const started = await gmService.startSession(CAMPAIGN_ID, "  A Coroa — Sessão 2  ");
  assert.equal(started.name, "A Coroa — Sessão 2");
  assert.equal(started.status, "active");
  const ended = await gmService.endSession(SESSION_ID, CAMPAIGN_ID);
  assert.equal(ended.status, "ended");
  assert.equal(ended.endedAt, "2026-08-21T15:00:00.000Z");
  assert.deepEqual(environment.calls.rpc, [
    { name: "start_campaign_session", args: { p_campaign_id: CAMPAIGN_ID, p_name: "A Coroa — Sessão 2" } },
    { name: "end_campaign_session", args: { p_session_id: SESSION_ID } },
  ]);
  await assert.rejects(() => gmService.startSession(CAMPAIGN_ID, " "), /nome de sessão/i);
});

test("subscribes only to panel data from one campaign", async () => {
  const environment = fakeEnvironment();
  const changes = [];
  const statuses = [];
  const subscription = service(environment).subscribe(CAMPAIGN_ID, (payload) => changes.push(payload), (status) => statuses.push(status));
  assert.equal(environment.calls.channels[0], `marufia-gm-panel:${CAMPAIGN_ID}`);
  assert.deepEqual(environment.channel.bindings.map((binding) => binding.config), [
    { event: "*", schema: "public", table: "characters", filter: `campaign_id=eq.${CAMPAIGN_ID}` },
    { event: "*", schema: "public", table: "campaign_presence", filter: `campaign_id=eq.${CAMPAIGN_ID}` },
    { event: "INSERT", schema: "public", table: "campaign_events", filter: `campaign_id=eq.${CAMPAIGN_ID}` },
    { event: "*", schema: "public", table: "campaign_sessions", filter: `campaign_id=eq.${CAMPAIGN_ID}` },
  ]);
  environment.channel.bindings[0].listener({ new: characterRow() });
  environment.channel.bindings[1].listener({ new: { campaign_id: "77777777-7777-4777-8777-777777777777" } });
  assert.equal(changes.length, 1);
  assert.equal(statuses.at(-1), "INVALID_PAYLOAD");
  await subscription.unsubscribe();
  assert.equal(environment.calls.removed.length, 1);
});

test("renders a compact safe panel with the Phase 28 sheet viewer enabled", () => {
  const html = gmTools.gmPanelHtml({
    campaignName: "A <Coroa>",
    connection: "live",
    loading: false,
    playersOnline: 1,
    playersAway: 0,
    playersTotal: 2,
    characters: [{ character: characterRow({ name: "Arthur & Kael" }), resources: { hp: { current: 27, maximum: 33 }, pm: { current: 20, maximum: 26 } }, presence: "away" }],
    events: [gmTools.normalizedCampaignEvent(eventRow(), CAMPAIGN_ID)],
    sessions: [gmTools.normalizedCampaignSession(sessionRow(), CAMPAIGN_ID)],
    activeSession: gmTools.normalizedCampaignSession(sessionRow(), CAMPAIGN_ID),
  });
  assert.match(html, /A &lt;Coroa&gt;/);
  assert.match(html, /Online: 1/);
  assert.match(html, /Ausentes: 0 · Offline: 1/);
  assert.match(html, /Arthur &amp; Kael/);
  assert.match(html, /value="27"/);
  assert.match(html, /<em>\/ 33<\/em>/);
  assert.match(html, /value="20"/);
  assert.match(html, /<em>\/ 26<\/em>/);
  assert.match(html, /data-online-gm-panel-action="save-hp"/);
  assert.match(html, /Alterar PV/);
  assert.match(html, /data-online-gm-panel-action="save-pm"/);
  assert.match(html, /Alterar PM/);
  assert.match(html, /Gerenciar condições e itens/);
  assert.match(html, /data-online-gm-panel-action="add-condition"/);
  assert.match(html, /data-online-gm-panel-action="add-item"/);
  assert.match(html, /data-presence-status="away"/);
  assert.match(html, />Ausente<\/span>/);
  assert.match(html, /Histórico da campanha/);
  assert.match(html, /Arthur: PV 27 → 19/);
  assert.match(html, /data-campaign-event-type="hp_changed"/);
  assert.match(html, /data-campaign-session-id="88888888-8888-4888-8888-888888888888"/);
  assert.match(html, /A Coroa — Sessão 1/);
  assert.match(html, /Sessão ativa/);
  assert.match(html, /data-online-gm-panel-action="end-session"/);
  assert.match(html, /data-online-gm-panel-action="open-character"/);
  assert.match(html, />Abrir ficha<\/button>/);
  assert.doesNotMatch(html, /disabled aria-disabled="true"/);
  assert.doesNotMatch(html, /<Coroa>|Arthur & Kael/);
});

test("coalesces concurrent heartbeats and stops its timer", async () => {
  let touches = 0;
  let release;
  const timers = {
    setInterval(callback, interval) { this.callback = callback; this.interval = interval; return 9; },
    clearInterval(id) { this.cleared = id; },
  };
  const heartbeat = gmTools.createPresenceHeartbeat({
    service: { touchOwnCampaigns(active) { assert.equal(active, true); touches += 1; return new Promise((resolve) => { release = resolve; }); } },
    active: () => true,
    timers,
  });
  const first = heartbeat.pulse();
  const second = heartbeat.pulse();
  assert.equal(touches, 1);
  release();
  assert.equal(await first, true);
  assert.equal(await second, true);
  heartbeat.destroy();
  assert.equal(timers.interval, gmTools.HEARTBEAT_MS);
  assert.equal(timers.cleared, 9);
});
