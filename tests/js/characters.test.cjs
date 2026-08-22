const assert = require("node:assert/strict");
const test = require("node:test");

const characterTools = require("../../src/online/characters.js");
const stateTools = require("../../src/core/state.js");

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CHARACTER_ID = "22222222-2222-4222-8222-222222222222";
const CAMPAIGN_ID = "33333333-3333-4333-8333-333333333333";

function state(name = "Arthur") {
  return {
    meta: { appId: "marufia-latio", schemaVersion: 5 },
    character: { name },
  };
}

function record(overrides = {}) {
  const value = state(overrides.name ?? "Arthur");
  return {
    id: CHARACTER_ID,
    owner_id: USER_ID,
    campaign_id: null,
    name: "Arthur",
    state: value,
    schema_version: 5,
    revision: 1,
    last_change_origin: "player",
    created_at: "2026-08-20T10:00:00Z",
    updated_at: "2026-08-20T10:00:00Z",
    ...overrides,
  };
}

function fakeClient(options = {}) {
  const calls = { select: [], filters: [], inserts: [], updates: [], rpc: [] };
  return {
    calls,
    client: {
      auth: {
        async getSession() {
          return {
            data: { session: options.signedOut ? null : { user: { id: options.userId ?? USER_ID } } },
            error: options.sessionError ?? null,
          };
        },
      },
      async rpc(name, args) {
        calls.rpc.push({ name, args });
        if (options.saveError) return { data: null, error: options.saveError };
        return {
          data: options.saved ?? record({
            name: args.p_state.character.name || "Personagem sem nome",
            state: args.p_state,
            revision: args.p_expected_revision + 1,
          }),
          error: null,
        };
      },
      from(table) {
        assert.equal(table, "characters");
        let operation = "list";
        let payload = null;
        return {
          select(columns) {
            calls.select.push(columns);
            return this;
          },
          eq(column, value) {
            calls.filters.push({ column, value });
            return this;
          },
          insert(value) {
            operation = "insert";
            payload = value;
            calls.inserts.push(value);
            return this;
          },
          update(value) {
            operation = "update";
            payload = value;
            calls.updates.push(value);
            return this;
          },
          async order(column, ordering) {
            assert.equal(column, "updated_at");
            assert.deepEqual(ordering, { ascending: false });
            return { data: options.listData ?? [], error: options.listError ?? null };
          },
          async single() {
            if (operation === "insert") {
              return {
                data: options.created ?? record({
                  name: payload.state.character.name || "Personagem sem nome",
                  state: payload.state,
                }),
                error: options.createError ?? null,
              };
            }
            if (operation === "list") {
              return {
                data: options.loaded ?? record(),
                error: options.loadError ?? null,
              };
            }
            return {
              data: options.associated ?? record({ campaign_id: payload.campaign_id }),
              error: options.associateError ?? null,
            };
          },
        };
      },
    },
  };
}

test("prepares only a current Marufia state for remote creation", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(characterTools.currentStatePayload(state("Arthur"), stateTools))),
    state("Arthur"),
  );
  assert.throws(() => characterTools.currentStatePayload({ meta: { appId: "outro", schemaVersion: 5 }, character: {} }, stateTools), /compatível/i);
  assert.throws(() => characterTools.currentStatePayload({ meta: { appId: "marufia-latio", schemaVersion: 4 }, character: {} }, stateTools), /compatível/i);
});

test("lists only rows filtered by the authenticated owner", async () => {
  const { client, calls } = fakeClient({ listData: [record()] });
  const characters = await characterTools.createCharacterService(client, stateTools).listOwn();
  assert.equal(characters.length, 1);
  assert.equal(characters[0].name, "Arthur");
  assert.deepEqual(calls.filters, [{ column: "owner_id", value: USER_ID }]);
  assert.equal(calls.select[0], characterTools.CHARACTER_COLUMNS);
});

test("creates an independent character without client-controlled metadata", async () => {
  const { client, calls } = fakeClient();
  const created = await characterTools.createCharacterService(client, stateTools).createIndependent(state("Arthur"));
  assert.deepEqual(JSON.parse(JSON.stringify(calls.inserts)), [{ state: state("Arthur") }]);
  assert.equal(Object.hasOwn(calls.inserts[0], "owner_id"), false);
  assert.equal(Object.hasOwn(calls.inserts[0], "campaign_id"), false);
  assert.equal(created.campaign_id, null);
});

test("loads one owned character with its conflict metadata", async () => {
  const { client, calls } = fakeClient({ loaded: record({ revision: 7, last_change_origin: "gm" }) });
  const loaded = await characterTools.createCharacterService(client, stateTools).loadOwn(CHARACTER_ID);
  assert.equal(loaded.revision, 7);
  assert.equal(loaded.last_change_origin, "gm");
  assert.deepEqual(calls.filters, [{ column: "id", value: CHARACTER_ID }]);
});

test("updates through the atomic rpc with the expected revision", async () => {
  const { client, calls } = fakeClient();
  const saved = await characterTools.createCharacterService(client, stateTools).saveState(CHARACTER_ID, state("Arthur atualizado"), 3);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.rpc)), [{ name: "save_character_state", args: {
    p_character_id: CHARACTER_ID,
    p_state: state("Arthur atualizado"),
    p_expected_revision: 3,
  } }]);
  assert.deepEqual(calls.updates, []);
  assert.equal(saved.name, "Arthur atualizado");
  assert.equal(saved.revision, 4);
});

test("reports a revision conflict without retrying or changing metadata", async () => {
  const conflict = fakeClient({ saveError: { code: "40001", message: "character revision conflict" } });
  const service = characterTools.createCharacterService(conflict.client, stateTools);
  await assert.rejects(
    () => service.saveState(CHARACTER_ID, state("Local"), 2),
    (error) => error.code === "LAT-CHARACTER-CONFLICT-001" && /duas versões/i.test(error.message),
  );
  assert.equal(conflict.calls.rpc.length, 1);
  assert.deepEqual(conflict.calls.updates, []);
});

test("associates and detaches using only the campaign column", async () => {
  const associated = fakeClient({ associated: record({ campaign_id: CAMPAIGN_ID }) });
  const service = characterTools.createCharacterService(associated.client, stateTools);
  assert.equal((await service.associate(CHARACTER_ID, CAMPAIGN_ID)).campaign_id, CAMPAIGN_ID);
  assert.deepEqual(associated.calls.updates, [{ campaign_id: CAMPAIGN_ID }]);
  assert.deepEqual(associated.calls.filters, [{ column: "id", value: CHARACTER_ID }]);

  const detached = fakeClient({ associated: record({ campaign_id: null }) });
  assert.equal((await characterTools.createCharacterService(detached.client, stateTools).associate(CHARACTER_ID, null)).campaign_id, null);
  assert.deepEqual(detached.calls.updates, [{ campaign_id: null }]);
});

test("rejects invalid identifiers and expired sessions before writing", async () => {
  const invalid = fakeClient();
  await assert.rejects(() => characterTools.createCharacterService(invalid.client, stateTools).associate("não-é-uuid", CAMPAIGN_ID), /Personagem inválido/i);
  await assert.rejects(() => characterTools.createCharacterService(invalid.client, stateTools).saveState("não-é-uuid", state(), 1), /Personagem inválido/i);
  await assert.rejects(() => characterTools.createCharacterService(invalid.client, stateTools).saveState(CHARACTER_ID, state(), 0), /revisão online/i);
  assert.equal(invalid.calls.updates.length, 0);

  const signedOut = fakeClient({ signedOut: true });
  await assert.rejects(() => characterTools.createCharacterService(signedOut.client, stateTools).createIndependent(state()), /sessão expirou/i);
  assert.equal(signedOut.calls.inserts.length, 0);
});
