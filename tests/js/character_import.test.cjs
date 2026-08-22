const assert = require("node:assert/strict");
const test = require("node:test");

const importTools = require("../../src/online/character_import.js");

function snapshot(name = "Arthur") {
  return {
    meta: {
      appId: "marufia-latio",
      schemaVersion: 5,
      started: true,
      createdAt: "2026-08-20T12:00:00.000Z",
    },
    character: { name },
  };
}

function fakeStorage() {
  const values = new Map();
  return {
    values,
    loadLocal(key, fallback) { return values.has(key) ? values.get(key) : fallback; },
    saveLocal(key, value) { values.set(key, value); return true; },
  };
}

test("identifies only an existing local Marufia sheet", () => {
  assert.equal(importTools.localSheetIdentity(snapshot()), "marufia-latio:2026-08-20T12:00:00.000Z");
  assert.equal(importTools.localSheetIdentity({ ...snapshot(), meta: { ...snapshot().meta, started: false } }), "");
  assert.equal(importTools.localSheetIdentity({ ...snapshot(), meta: { ...snapshot().meta, appId: "outro" } }), "");
});

test("records successful imports separately for each account and local sheet", () => {
  const storage = fakeStorage();
  const identity = importTools.localSheetIdentity(snapshot());
  assert.equal(importTools.importedCharacterId(storage, "user-1", identity), "");
  assert.equal(importTools.markImported(storage, "user-1", identity, "character-1"), true);
  assert.equal(importTools.importedCharacterId(storage, "user-1", identity), "character-1");
  assert.equal(importTools.importedCharacterId(storage, "user-2", identity), "");
});

test("fails closed when the local marker storage is unavailable", () => {
  const storage = {
    loadLocal() { throw new Error("indisponível"); },
    saveLocal() { throw new Error("indisponível"); },
  };
  assert.deepEqual(importTools.readImportMarkers(storage), {});
  assert.equal(importTools.markImported(storage, "user-1", "sheet-1", "character-1"), false);
});

test("renders a safe, accessible, and non-destructive import decision", () => {
  const html = importTools.migrationDialogHtml({ mode: "prompt", snapshot: snapshot("<Arthur>") });
  assert.match(html, /data-online-character-import-modal/);
  assert.match(html, /Importar para minha conta/);
  assert.match(html, /Agora não/);
  assert.match(html, /backup local/i);
  assert.match(html, /não será apagado/i);
  assert.doesNotMatch(html, /<Arthur>/);

  const success = importTools.migrationDialogHtml({ mode: "success", snapshot: snapshot(), message: "Importado" });
  assert.match(success, /role="status"/);
  assert.match(success, /ficha original permanece salva/i);
  assert.match(success, /salvas primeiro neste computador/i);
  assert.match(success, /atualizadas online/i);
});

test("announces a newly linked character without exposing more account data", () => {
  const events = [];
  class FakeCustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  const view = {
    CustomEvent: FakeCustomEvent,
    dispatchEvent(event) { events.push(event); return true; },
  };
  assert.equal(importTools.announceLinkedCharacter(view, { id: "character-1", owner_id: "private" }), true);
  assert.equal(events[0].type, importTools.CHARACTER_LINKED_EVENT);
  assert.deepEqual(events[0].detail, { characterId: "character-1" });
});
