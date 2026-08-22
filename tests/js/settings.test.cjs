"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const settingsTools = require("../../src/online/settings.js");

function fakeDocument(options = {}) {
  const syncState = options.syncState ?? "online";
  const accountButton = {
    dataset: { authState: options.authState ?? "online", realtimeState: options.realtimeState ?? "subscribed" },
  };
  const syncLabel = { textContent: options.syncLabel ?? "Online" };
  const syncStatus = {
    dataset: { syncState },
    title: options.syncTitle ?? (syncState === "offline"
      ? "Sem conexão; alterações continuam salvas neste computador."
      : "Conta conectada; alterações podem ser salvas online."),
    querySelector(selector) { return selector === "[data-sync-status-label]" ? syncLabel : null; },
  };
  const accountLabel = { textContent: options.accountLabel ?? "<Artemis>" };
  return {
    querySelector(selector) {
      if (selector === "#onlineAccountButton") return accountButton;
      if (selector === "#onlineAccountLabel") return accountLabel;
      if (selector === "#onlineSyncStatus") return syncStatus;
      return null;
    },
  };
}

test("summarizes only real account, sync, local-data, and about states", () => {
  const bridge = {
    hasExistingSheet: () => true,
    snapshot: () => ({ meta: { schemaVersion: 5 } }),
  };
  const snapshot = settingsTools.settingsSnapshot(fakeDocument(), {}, bridge);
  assert.equal(snapshot.account.state, "online");
  assert.equal(snapshot.account.label, "<Artemis>");
  assert.match(snapshot.account.detail, /salvamento local/);
  assert.equal(snapshot.sync.state, "online");
  assert.match(snapshot.sync.detail, /tempo real/);
  assert.equal(snapshot.local.state, "saved");
  assert.match(snapshot.local.detail, /schema v5/);
  assert.equal(snapshot.about.productName, "Marufia Online");
  assert.equal(snapshot.about.productChannel, "alpha");
  assert.equal(snapshot.about.productDisplayName, "Marufia Online Alpha");
  assert.equal(snapshot.about.schemaVersion, 5);
});

test("explains local-only and unlinked states without inventing controls", () => {
  const local = settingsTools.settingsSnapshot(fakeDocument({ authState: "offline", syncState: "offline" }), {}, {
    hasExistingSheet: () => false,
    snapshot: () => ({ meta: { schemaVersion: 5 } }),
  });
  assert.equal(local.account.label, "Modo local");
  assert.match(local.account.action, /Entrar/);
  assert.match(local.sync.detail, /neste computador/);

  const unlinked = settingsTools.settingsSnapshot(fakeDocument({ realtimeState: "unlinked" }), {}, {
    hasExistingSheet: () => true,
    snapshot: () => ({ meta: { schemaVersion: 5 } }),
  });
  assert.match(unlinked.sync.detail, /ainda não foi vinculada/);
});

test("renders safe actionable settings without cache deletion", () => {
  const html = settingsTools.settingsPanelHtml(settingsTools.settingsSnapshot(fakeDocument(), {}, {
    hasExistingSheet: () => true,
    snapshot: () => ({ meta: { schemaVersion: 5 } }),
  }));
  assert.match(html, /Conta e dados/);
  assert.match(html, /Gerenciar conta/);
  assert.match(html, /Sincronização/);
  assert.match(html, /Dados locais/);
  assert.match(html, /Sobre/);
  assert.match(html, /Marufia Online Alpha · v0\.2\.1/);
  assert.match(html, /somente páginas oficiais de atualização/i);
  assert.match(html, /&lt;Artemis&gt;/);
  assert.doesNotMatch(html, /<Artemis>|limpar cache|apagar cache|clear-cache/i);
});

test("loads the settings module in the validated web build", () => {
  const root = path.resolve(__dirname, "..", "..");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const build = fs.readFileSync(path.join(root, "tools", "build.py"), "utf8");
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const tauriConfig = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
  const syncPosition = index.indexOf('src="src/online/character_sync.js"');
  const settingsPosition = index.indexOf('src="src/online/settings.js"');
  assert.ok(syncPosition >= 0 && settingsPosition > syncPosition);
  assert.match(build, /"src\/online\/settings\.js"/);
  assert.match(app, /data-online-settings-slot/);
  assert.match(app, /marufia:settings-opened/);
  assert.equal(settingsTools.PRODUCT_VERSION, tauriConfig.version);
});
