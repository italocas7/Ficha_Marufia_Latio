const test = require("node:test");
const assert = require("node:assert/strict");

const rollTools = require("../../src/online/rolls.js");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const CHARACTER_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_CHARACTER_ID = "44444444-4444-4444-8444-444444444444";
const ROLL_ID = "55555555-5555-4555-8555-555555555555";

function skillRoll(overrides = {}) {
  return {
    rollType: "skill",
    skillName: "Atletismo",
    mode: "adv",
    formula: "2d100",
    rawRoll: [80, 20],
    modifier: 0,
    target: 55,
    total: 20,
    outcome: "Extremo",
    ...overrides,
  };
}

function memoryStorage() {
  const values = new Map();
  return {
    values,
    loadLocal(key, fallback = null) {
      return values.has(key) ? JSON.parse(values.get(key)) : fallback;
    },
    saveLocal(key, value) {
      values.set(key, JSON.stringify(value));
      return true;
    },
  };
}

test("normalizes only the current sheet roll formulas", () => {
  assert.deepEqual(JSON.parse(JSON.stringify(rollTools.normalizeRollDraft(skillRoll()))), skillRoll());
  assert.deepEqual(JSON.parse(JSON.stringify(rollTools.normalizeRollDraft({
    rollType: "world_duration",
    skillName: null,
    mode: "normal",
    formula: "1d4+2",
    rawRoll: [4],
    modifier: 2,
    target: null,
    total: 6,
    outcome: null,
  }))), {
    rollType: "world_duration",
    skillName: null,
    mode: "normal",
    formula: "1d4+2",
    rawRoll: [4],
    modifier: 2,
    target: null,
    total: 6,
    outcome: null,
  });
  assert.throws(() => rollTools.normalizeRollDraft(skillRoll({ total: 80 })), /não corresponde/i);
  assert.throws(() => rollTools.normalizeRollDraft(skillRoll({ modifier: 15 })), /d100 é inválido/i);
  assert.throws(() => rollTools.normalizeRollDraft(skillRoll({ formula: "1d20" })), /dados do teste d100/i);
});

test("records through the protected rpc without sending authority fields", async () => {
  const calls = [];
  const client = {
    auth: { async getSession() { return { data: { session: { user: { id: USER_ID } } }, error: null }; } },
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: { id: ROLL_ID, visibility: "public" }, error: null };
    },
  };
  const service = rollTools.createRollService(client, { randomUUID: () => ROLL_ID });
  const result = await service.record(CHARACTER_ID, skillRoll());
  assert.equal(result.id, ROLL_ID);
  assert.equal(result.userId, USER_ID);
  assert.equal(result.visibility, "public");
  assert.equal(calls[0].name, "record_roll");
  assert.deepEqual(calls[0].args, {
    p_roll_id: ROLL_ID,
    p_character_id: CHARACTER_ID,
    p_roll_type: "skill",
    p_skill_name: "Atletismo",
    p_mode: "adv",
    p_formula: "2d100",
    p_raw_roll: [80, 20],
    p_modifier: 0,
    p_target: 55,
    p_total: 20,
    p_outcome: "Extremo",
    p_visibility: "public",
  });
  assert.equal(Object.hasOwn(calls[0].args, "p_user_id"), false);
  assert.equal(Object.hasOwn(calls[0].args, "p_campaign_id"), false);
});

test("requests only public or secret while accepting server-derived gm visibility", async () => {
  const calls = [];
  const client = {
    auth: { async getSession() { return { data: { session: { user: { id: USER_ID } } }, error: null }; } },
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: { id: ROLL_ID, visibility: "gm" }, error: null };
    },
  };
  const service = rollTools.createRollService(client, { randomUUID: () => ROLL_ID });
  const result = await service.record(CHARACTER_ID, skillRoll(), ROLL_ID, "secret");
  assert.equal(calls[0].args.p_visibility, "secret");
  assert.equal(result.visibility, "gm");
  assert.throws(() => rollTools.normalizeRequestedVisibility("gm"), /inválida/i);
  assert.throws(() => rollTools.normalizeStoredVisibility("private"), /inválida/i);
});

test("keeps each offline roll and replays only the current account and character", async () => {
  const storage = memoryStorage();
  let online = false;
  let serial = 1;
  const recorded = [];
  const service = {
    async record(characterId, roll, rollId, visibility) {
      recorded.push({ characterId, rollId, total: roll.total, visibility });
      return { id: rollId };
    },
  };
  const queue = rollTools.createRollQueue({
    service,
    storage,
    resolveTarget: async () => ({ userId: USER_ID, characterId: CHARACTER_ID }),
    isOnline: () => online,
    cryptoApi: { randomUUID: () => `55555555-5555-4555-8555-${String(serial++).padStart(12, "0")}` },
  });
  await queue.enqueue(skillRoll({ rawRoll: [80, 20], total: 20 }));
  await queue.enqueue(skillRoll({ rawRoll: [60, 30], total: 30, outcome: "Bom/Sólido" }), "secret");
  rollTools.persistPendingRoll(storage, {
    userId: OTHER_USER_ID,
    characterId: OTHER_CHARACTER_ID,
  }, skillRoll(), "66666666-6666-4666-8666-666666666666");
  assert.equal(queue.pending().length, 3);
  assert.equal(recorded.length, 0);

  online = true;
  await queue.flush();
  assert.deepEqual(recorded.map((item) => item.total), [20, 30]);
  assert.deepEqual(recorded.map((item) => item.visibility), ["public", "secret"]);
  assert.equal(queue.pending().length, 1);
  assert.equal(queue.pending()[0].userId, OTHER_USER_ID);
});

test("drops a queued roll that never belonged to a campaign", async () => {
  const storage = memoryStorage();
  const service = {
    async record() {
      const error = new Error("Esta rolagem não pertence a uma campanha.");
      error.code = "LAT-ROLL-CAMPAIGN-001";
      throw error;
    },
  };
  const queue = rollTools.createRollQueue({
    service,
    storage,
    resolveTarget: async () => ({ userId: USER_ID, characterId: CHARACTER_ID }),
    cryptoApi: { randomUUID: () => ROLL_ID },
  });
  await queue.enqueue(skillRoll());
  assert.equal(queue.pending().length, 0);
});

test("classifies campaign and malformed-payload refusals as terminal", () => {
  assert.equal(rollTools.terminalRollError({ code: "LAT-ROLL-CAMPAIGN-001" }), true);
  assert.equal(rollTools.terminalRollError({ code: "LAT-ROLL-PAYLOAD-001" }), true);
  assert.equal(rollTools.terminalRollError({ code: "LAT-ROLL-SAVE-001" }), false);
});
