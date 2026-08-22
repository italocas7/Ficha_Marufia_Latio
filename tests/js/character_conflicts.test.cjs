const assert = require("node:assert/strict");
const test = require("node:test");

const conflictTools = require("../../src/online/character_conflicts.js");
const stateTools = require("../../src/core/state.js");

const CHARACTER_ID = "22222222-2222-4222-8222-222222222222";

function conflict() {
  return {
    characterId: CHARACTER_ID,
    local: {
      meta: { updatedAt: "2026-08-20T10:00:00Z" },
      character: { name: "<Local>" },
    },
    remote: {
      id: CHARACTER_ID,
      name: "<Online>",
      revision: 4,
      last_change_origin: "gm",
      updated_at: "2026-08-20T10:01:00Z",
      state: { meta: { appId: "marufia-latio", schemaVersion: 5 }, character: { name: "Online" } },
    },
  };
}

test("renders both preserved versions with revision, timestamp, and origin", () => {
  const html = conflictTools.conflictDialogHtml(conflict());
  assert.match(html, /Nenhuma das duas versões foi sobrescrita/i);
  assert.match(html, /&lt;Local&gt;/);
  assert.match(html, /&lt;Online&gt;/);
  assert.match(html, /Revisão 4/);
  assert.match(html, /Mæstre/);
  assert.doesNotMatch(html, /<Local>|<Online>/);
});

test("downloads the remote version in the importable online backup format", async () => {
  let storedBlob = null;
  const anchor = { click() { this.clicked = true; }, remove() {} };
  const view = {
    Blob,
    URL: {
      createObjectURL(blob) { storedBlob = blob; return "blob:test"; },
      revokeObjectURL() {},
    },
  };
  const document = { body: { appendChild() {} }, createElement() { return anchor; } };
  assert.equal(conflictTools.downloadRemoteVersion(view, document, conflict(), stateTools), true);
  const payload = JSON.parse(await storedBlob.text());
  assert.equal(payload.format, stateTools.ONLINE_BACKUP_SCHEMA.format);
  assert.equal(payload.online.characterId, CHARACTER_ID);
  assert.equal(payload.online.revision, 4);
  assert.equal(payload.character.state.character.name, "Online");
  assert.equal(anchor.download, "Online-versao-online.json");
});

test("requires an explicit choice before requesting a local overwrite", () => {
  const viewListeners = new Map();
  const documentListeners = new Map();
  const dispatched = [];
  const modalRoot = { dataset: {}, innerHTML: "" };
  class FakeCustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  const view = {
    CustomEvent: FakeCustomEvent,
    openModal(title, body, footer) { this.modal = { title, body, footer }; },
    closeModal() { this.closed = true; },
    addEventListener(name, listener) { viewListeners.set(name, listener); },
    removeEventListener(name) { viewListeners.delete(name); },
    dispatchEvent(event) { dispatched.push(event); return true; },
  };
  const document = {
    defaultView: view,
    body: { appendChild() {} },
    querySelector(selector) { return selector === "#modalRoot" ? modalRoot : null; },
    addEventListener(name, listener) { documentListeners.set(name, listener); },
    removeEventListener(name) { documentListeners.delete(name); },
  };
  const syncTools = {
    CHARACTER_CONFLICT_EVENT: "conflict",
    CHARACTER_CONFLICT_RESOLUTION_EVENT: "resolved",
  };
  const instance = conflictTools.init(document, syncTools);
  viewListeners.get("conflict")({ detail: conflict() });
  assert.match(view.modal.title, /Conflito/);
  assert.match(view.modal.footer, /Manter minha versão/);
  assert.equal(dispatched.length, 0);

  documentListeners.get("click")({
    target: {
      closest() { return { dataset: { onlineCharacterConflictAction: "keep-local" } }; },
    },
  });
  assert.equal(dispatched[0].type, "resolved");
  assert.deepEqual(dispatched[0].detail, { choice: "local", characterId: CHARACTER_ID });
  assert.equal(view.closed, true);
  assert.equal(instance.pending(), null);
  instance.destroy();
  assert.equal(viewListeners.size, 0);
  assert.equal(documentListeners.size, 0);
});
