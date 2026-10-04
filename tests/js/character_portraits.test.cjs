"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const portraits = require("../../src/online/character_portraits.js");

function mediaUrl() {
  const bytes = Buffer.alloc(16);
  bytes.write("RIFF", 0);
  bytes.write("WEBP", 8);
  return `data:image/webp;base64,${bytes.toString("base64")}`;
}

test("portrait identity follows the sheet, not the account or active tab", () => {
  assert.equal(portraits.sheetIdentity({ meta: { appId: "marufia-latio", started: true, createdAt: "sheet-a" } }), "sheet-a");
  assert.equal(portraits.sheetIdentity({ meta: { appId: "marufia-latio", started: false, createdAt: "sheet-a" } }), "");
});

test("JSON portrait import rejects forged formats and oversized media", () => {
  assert.deepEqual(portraits.validateImportMedia({ portraitWebp: mediaUrl() }), { portraitWebp: mediaUrl() });
  assert.throws(() => portraits.validateImportMedia({ portraitWebp: "data:image/svg+xml;base64,PHN2Zz4=" }), /inválida/);
  assert.throws(() => portraits.validateImportMedia({ portraitWebp: "data:image/webp;base64,YWJj" }), /WebP válida/);
  assert.throws(() => portraits.validateImportMedia({ portraitWebp: "data:image/webp;base64,!!!!" }), /inválida/);
});

test("offline portrait records remain isolated through a sheet switch", async () => {
  const oldStorage = globalThis.localStorage;
  const data = new Map();
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  try {
    await portraits.writeMedia("sheet-a", { dataUrl: mediaUrl(), dirty: true });
    await portraits.writeMedia("sheet-b", { dataUrl: "", dirty: true });
    assert.equal((await portraits.readMedia("sheet-a")).dataUrl, mediaUrl());
    assert.equal((await portraits.readMedia("sheet-b")).dataUrl, "");
  } finally { globalThis.localStorage = oldStorage; }
});

test("online upload and removal affect only the linked character path", async () => {
  const oldStorage = globalThis.localStorage;
  const oldSupabase = globalThis.MARUFIA_SUPABASE;
  const oldFetch = globalThis.fetch;
  const data = new Map();
  const characterId = "93200000-0000-4000-8000-000000000001";
  let remotePath = "";
  const uploads = [];
  const removals = [];
  const calls = [];
  globalThis.localStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
  globalThis.fetch = async () => { throw new Error("Failed to fetch"); };
  globalThis.MARUFIA_SUPABASE = { getSupabaseClient: () => ({
    from: (table) => {
      assert.equal(table, "character_portraits");
      return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { object_path: remotePath } }) }) }) };
    },
    storage: { from: (bucket) => {
      assert.equal(bucket, "character-portraits");
      return {
        upload: async (path, blob) => { uploads.push({ path, type: blob.type }); return { error: null }; },
        remove: async (paths) => { removals.push(...paths); return { error: null }; },
      };
    } },
    rpc: async (name, args) => {
      assert.equal(name, "set_character_portrait");
      calls.push(args);
      remotePath = args.p_path || "";
      return { error: null };
    },
  }) };
  const slot = { state: { meta: { appId: "marufia-latio", started: true, createdAt: "portrait-sync" } }, remoteId: characterId };
  try {
    await portraits.writeMedia("portrait-sync", { dataUrl: mediaUrl(), dirty: true });
    assert.equal(await portraits.syncOne(slot), true);
    assert.equal(uploads.length, 1);
    assert.match(uploads[0].path, new RegExp(`^${characterId}/[0-9a-f-]{36}\\.webp$`));
    assert.equal(uploads[0].type, "image/webp");
    assert.equal(calls[0].p_character_id, characterId);
    assert.equal((await portraits.readMedia("portrait-sync")).dirty, false);

    await portraits.writeMedia("portrait-sync", { dataUrl: "", dirty: true });
    assert.equal(await portraits.syncOne(slot), true);
    assert.equal(calls[1].p_path, null);
    assert.deepEqual(removals, [uploads[0].path]);
    assert.equal((await portraits.readMedia("portrait-sync")).dirty, false);
  } finally {
    globalThis.localStorage = oldStorage;
    globalThis.MARUFIA_SUPABASE = oldSupabase;
    globalThis.fetch = oldFetch;
  }
});
