const test = require("node:test");
const assert = require("node:assert/strict");
const policyTools = require("../../src/online/campaign_skill_policy.js");
const offlineTools = require("../../src/online/offline.js");

const campaign = { id: "campaign-one", name: "Mesa", skill_limit: 71, rules_revision: 2, age_mechanic_enabled: false };
const knownPolicy = { campaignId: campaign.id, name: campaign.name, limit: 71, revision: 2, ageEnabled: false };
const settle = () => new Promise((resolve) => setImmediate(resolve));

function harness(options = {}) {
  let slot = { id: "slot-one", scope: "server|isa", remoteId: "eloise" };
  let sequence = 0;
  const timers = new Map();
  const events = new Map();
  const cache = {};
  const applied = [];
  const warnings = [];
  let onCampaignUpdate = null;
  if (options.cached) cache[`${slot.scope}|${slot.remoteId}`] = options.cached;
  const account = { dataset: { authState: options.authState ?? "online" } };
  const view = {
    MARUFIA_APP_BRIDGE: { setCampaignSkillPolicy(value) { applied.push(value); } },
    LATIO_STORAGE: {
      loadLocal: () => structuredClone(cache),
      saveLocal: (_key, value) => Object.assign(cache, structuredClone(value)),
    },
    MARUFIA_SHEET_SLOTS_STORE: { active: () => slot },
    MARUFIA_SUPABASE: { getSupabaseClient: () => options.realtime ? {
      channel() { return { on(_type, _filter, callback) { onCampaignUpdate = callback; return this; }, subscribe() { return this; } }; },
      removeChannel() { onCampaignUpdate = null; },
    } : ({}) },
    MARUFIA_CHARACTERS: { createCharacterService: () => ({
      currentUserId: async () => "isa",
      loadOwn: options.loadCharacter ?? (async () => ({ campaign_id: campaign.id })),
    }) },
    MARUFIA_CAMPAIGNS: { createCampaignService: () => ({
      listVisible: options.loadCampaigns ?? (async () => [campaign]),
    }) },
    MARUFIA_OFFLINE: { ...offlineTools, backendScope: () => "server" },
    navigator: { onLine: true },
    setTimeout(callback, delay) { timers.set(++sequence, { callback, delay }); return sequence; },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(name, callback) { events.set(name, callback); },
    removeEventListener(name) { events.delete(name); },
    toast(message) { warnings.push(message); },
  };
  const document = { defaultView: view, querySelector: () => account };
  const controller = policyTools.init(document);
  return {
    controller, view, account, applied, timers, warnings, cache,
    current: () => applied.at(-1),
    switchSlot(next) { slot = next; events.get("marufia:sheet-switched")?.(); },
    emit(name) { events.get(name)?.(); },
    emitCampaign() { onCampaignUpdate?.(); },
    async retry() {
      const [id, timer] = timers.entries().next().value ?? [];
      assert.ok(timer, "A consulta que falhou precisa ter uma nova tentativa agendada.");
      timers.delete(id);
      timer.callback();
      await settle();
    },
  };
}

test("keeps the known campaign ceiling while an online refresh fails", async (t) => {
  const env = harness({ cached: knownPolicy, loadCharacter: async () => { throw new Error("Conexão temporariamente indisponível"); } });
  t.after(() => env.controller.destroy());
  await settle();
  assert.equal(env.current().limit, 71);
  assert.equal(env.current().campaignId, campaign.id);
  assert.equal(env.timers.size, 1);
});

test("uses the confirmed Auge switch, updates on Realtime, and keeps it offline", async (t) => {
  let enabled = false;
  const env = harness({ realtime: true, loadCampaigns: async () => [{ ...campaign, age_mechanic_enabled: enabled }] });
  t.after(() => env.controller.destroy());
  await settle();
  assert.equal(env.current().ageEnabled, false);
  enabled = true;
  env.emitCampaign();
  await settle();
  assert.equal(env.current().ageEnabled, true);
  env.account.dataset.authState = "offline";
  env.emit("offline");
  await settle();
  assert.equal(env.current().ageEnabled, true);
});

test("old cached policy without Auge flag suspends age until confirmed", async (t) => {
  const env = harness({ cached: { campaignId: campaign.id, name: campaign.name, limit: 70, revision: 1 }, authState: "offline" });
  t.after(() => env.controller.destroy());
  await settle();
  assert.equal(env.current().ageEnabled, null);
});

test("recovers the real campaign ceiling after a failed first load without a cache", async (t) => {
  let available = false;
  const env = harness({ loadCharacter: async () => {
    if (!available) throw new Error("Conexão temporariamente indisponível");
    return { campaign_id: campaign.id };
  } });
  t.after(() => env.controller.destroy());
  await settle();
  assert.equal(env.current().limit, 1, "A ficha continua protegida até conhecer a regra da campanha.");
  available = true;
  await env.retry();
  assert.equal(env.current().limit, 71);
  assert.equal(env.timers.size, 0);
  assert.equal(env.cache["server|isa|eloise"].limit, 71);
});

test("does not fall back to local settings when the campaign reply is invalid", async (t) => {
  let valid = false;
  const env = harness({ loadCampaigns: async () => [{ ...campaign, skill_limit: valid ? 71 : 0 }] });
  t.after(() => env.controller.destroy());
  await settle();
  assert.equal(env.current().limit, 1);
  valid = true;
  await env.retry();
  assert.equal(env.current().limit, 71);
});

test("preserves a confirmed independent sheet during an online failure", async (t) => {
  const env = harness({ cached: { none: true }, loadCharacter: async () => { throw new Error("Falha temporária"); } });
  t.after(() => env.controller.destroy());
  await settle();
  assert.equal(env.current(), null);
  assert.equal(env.timers.size, 1);
});

test("keeps the cached ceiling offline and resumes on reconnection", async (t) => {
  const env = harness({ cached: knownPolicy, authState: "offline" });
  t.after(() => env.controller.destroy());
  await settle();
  assert.equal(env.current().limit, 71);
  assert.equal(env.timers.size, 0);
  env.account.dataset.authState = "online";
  env.emit("online");
  await settle();
  assert.equal(env.current().limit, 71);
});

test("does not apply an old response or retry after switching to another sheet", async (t) => {
  let rejectOld;
  const env = harness({ loadCharacter: () => new Promise((_resolve, reject) => { rejectOld = reject; }) });
  t.after(() => env.controller.destroy());
  await settle();
  env.switchSlot({ id: "slot-two", scope: "guest", remoteId: null });
  await settle();
  rejectOld(new Error("Falha da ficha anterior"));
  await settle();
  assert.equal(env.current(), null);
  assert.equal(env.timers.size, 0);
  assert.deepEqual(env.warnings, []);
});

test("an old retry cannot cancel recovery for the newly selected sheet", async (t) => {
  let oldAttempts = 0;
  let resolveOld;
  let newAvailable = false;
  const env = harness({ loadCharacter: async (id) => {
    if (id === "eloise") {
      if (++oldAttempts === 1) throw new Error("Primeira falha");
      return new Promise((resolve) => { resolveOld = resolve; });
    }
    if (!newAvailable) throw new Error("Falha da segunda ficha");
    return { campaign_id: campaign.id };
  } });
  t.after(() => env.controller.destroy());
  await settle();
  await env.retry();
  env.switchSlot({ id: "slot-two", scope: "server|isa", remoteId: "other" });
  await settle();
  resolveOld({ campaign_id: campaign.id });
  await settle();
  assert.equal(env.current().campaignId, "pending:other");
  newAvailable = true;
  await env.retry();
  assert.equal(env.current().limit, 71);
  assert.equal(env.timers.size, 0);
});

test("destroy cancels scheduled retries and ignores pending replies", async () => {
  const failing = harness({ loadCharacter: async () => { throw new Error("Falha temporária"); } });
  await settle();
  assert.equal(failing.timers.size, 1);
  failing.controller.destroy();
  assert.equal(failing.timers.size, 0);

  let resolveOld;
  const pending = harness({ loadCharacter: () => new Promise((resolve) => { resolveOld = resolve; }) });
  await settle();
  pending.controller.destroy();
  const count = pending.applied.length;
  resolveOld({ campaign_id: campaign.id });
  await settle();
  assert.equal(pending.applied.length, count);
});
