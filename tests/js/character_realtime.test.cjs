const assert = require("node:assert/strict");
const test = require("node:test");

const realtimeTools = require("../../src/online/character_realtime.js");
const characterTools = require("../../src/online/characters.js");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CHARACTER_ID = "22222222-2222-4222-8222-222222222222";
const CAMPAIGN_ID = "33333333-3333-4333-8333-333333333333";

function record(overrides = {}) {
  const state = {
    meta: { appId: "marufia-latio", schemaVersion: 5 },
    character: { name: overrides.name ?? "Arthur" },
  };
  return {
    id: CHARACTER_ID,
    owner_id: USER_ID,
    campaign_id: null,
    name: state.character.name,
    state,
    schema_version: 5,
    revision: 1,
    last_change_origin: "player",
    created_at: "2026-08-20T10:00:00Z",
    updated_at: "2026-08-20T10:01:00Z",
    ...overrides,
  };
}

function fakeClient() {
  const channels = [];
  const removed = [];
  return {
    channels,
    removed,
    client: {
      channel(name) {
        const current = {
          name,
          binding: null,
          changeListener: null,
          statusListener: null,
          on(type, binding, listener) {
            assert.equal(type, "postgres_changes");
            this.binding = binding;
            this.changeListener = listener;
            return this;
          },
          subscribe(listener) {
            this.statusListener = listener;
            return this;
          },
        };
        channels.push(current);
        return current;
      },
      async removeChannel(channel) {
        removed.push(channel);
        return "ok";
      },
    },
  };
}

function updatePayload(character) {
  return {
    eventType: "UPDATE",
    schema: "public",
    table: "characters",
    commit_timestamp: "2026-08-20T10:01:00Z",
    new: character,
    old: { id: character.id },
  };
}

test("subscribes a player only to updates for one character UUID", async () => {
  const fake = fakeClient();
  const changes = [];
  const statuses = [];
  const subscription = realtimeTools.createCharacterRealtimeService(fake.client, characterTools)
    .subscribeToCharacter(CHARACTER_ID, (change) => changes.push(change), (status) => statuses.push(status));
  const channel = fake.channels[0];

  assert.match(channel.name, new RegExp(`^marufia-character-character-${CHARACTER_ID}-`));
  assert.deepEqual(channel.binding, {
    event: "UPDATE",
    schema: "public",
    table: "characters",
    filter: `id=eq.${CHARACTER_ID}`,
  });
  channel.statusListener("SUBSCRIBED");
  channel.changeListener(updatePayload(record({ name: "Arthur remoto" })));
  assert.deepEqual(statuses, ["SUBSCRIBED"]);
  assert.equal(changes[0].character.name, "Arthur remoto");
  assert.equal(changes[0].commitTimestamp, "2026-08-20T10:01:00Z");

  await subscription.unsubscribe();
  await subscription.unsubscribe();
  assert.deepEqual(fake.removed, [channel]);
});

test("prepares a campaign-filtered channel for the gm without adding write operations", () => {
  const fake = fakeClient();
  const changes = [];
  realtimeTools.createCharacterRealtimeService(fake.client, characterTools)
    .subscribeToCampaign(CAMPAIGN_ID, (change) => changes.push(change));
  const channel = fake.channels[0];
  assert.deepEqual(channel.binding, {
    event: "UPDATE",
    schema: "public",
    table: "characters",
    filter: `campaign_id=eq.${CAMPAIGN_ID}`,
  });
  channel.changeListener(updatePayload(record({ campaign_id: CAMPAIGN_ID })));
  assert.equal(changes[0].character.campaign_id, CAMPAIGN_ID);
});

test("rejects malformed or out-of-scope realtime payloads", () => {
  const fake = fakeClient();
  const changes = [];
  const statuses = [];
  realtimeTools.createCharacterRealtimeService(fake.client, characterTools)
    .subscribeToCharacter(CHARACTER_ID, (change) => changes.push(change), (status, error) => statuses.push([status, error?.code]));
  const channel = fake.channels[0];
  channel.changeListener(updatePayload(record({ id: "44444444-4444-4444-8444-444444444444" })));
  assert.deepEqual(changes, []);
  assert.deepEqual(statuses, [["INVALID_PAYLOAD", "LAT-REALTIME-SCOPE-001"]]);
  assert.throws(
    () => realtimeTools.createCharacterRealtimeService(fake.client, characterTools).subscribeToCharacter("inválido", () => {}),
    /Personagem inválido/i,
  );
});
