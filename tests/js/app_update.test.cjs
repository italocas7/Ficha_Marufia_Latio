"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const updates = require("../../src/online/app_update.js");

const root = path.resolve(__dirname, "..", "..");
const validManifest = Object.freeze({
  schemaVersion: 1,
  appId: "com.marufia.online",
  channel: "alpha",
  version: "0.3.0",
  notes: "Correções e melhorias seguras.",
  publishedAt: "2026-08-22T00:00:00.000Z",
  releaseUrl: "https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v0.3.0",
});

function manifestResponse(manifest = validManifest) {
  return {
    ok: true,
    headers: { get: () => null },
    text: async () => JSON.stringify(manifest),
  };
}

function fakeEnvironment(options = {}) {
  const documentListeners = new Map();
  const viewListeners = new Map();
  const storage = options.storage ?? new Map();
  const opened = [];
  const modal = { open: Boolean(options.modalOpen), own: false, body: "", footer: "", title: "" };
  const modalClassList = { add: (name) => { modal.className = name; } };
  const error = { hidden: true, textContent: "" };
  const modalRoot = {
    innerHTML: "",
    querySelector(selector) {
      if (selector === ".modal") return modal.open ? { classList: modalClassList } : null;
      return null;
    },
  };
  const document = {
    documentElement: { dataset: {} },
    addEventListener(name, listener) { documentListeners.set(name, listener); },
    removeEventListener(name) { documentListeners.delete(name); },
    querySelector(selector) {
      if (selector === "#modalRoot") return modalRoot;
      if (selector === "[data-online-app-update-modal]") return modal.own ? {} : null;
      if (selector === "[data-online-app-update-error]") return modal.own ? error : null;
      return null;
    },
  };
  const view = {
    __TAURI_INTERNALS__: options.tauri === false ? undefined : {},
    __TAURI__: options.tauri === false ? undefined : {
      opener: {
        async openUrl(url) {
          if (options.openFailure) throw new Error("Falha simulada");
          opened.push(url);
        },
      },
    },
    navigator: { onLine: options.online !== false },
    sessionStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
    },
    addEventListener(name, listener) { viewListeners.set(name, listener); },
    removeEventListener(name) { viewListeners.delete(name); },
    setTimeout,
    clearTimeout,
    AbortController,
    openModal(title, body, footer) {
      modal.open = true;
      modal.own = true;
      modal.title = title;
      modal.body = body;
      modal.footer = footer;
    },
    closeModal() {
      modal.open = false;
      modal.own = false;
      return true;
    },
  };
  document.defaultView = view;
  return { document, documentListeners, error, modal, modalRoot, opened, storage, view, viewListeners };
}

function click(action) {
  const control = {
    dataset: { onlineAppUpdateAction: action },
    disabled: false,
    closest: () => control,
  };
  return { control, event: { target: control } };
}

test("compares stable and prerelease Semantic Versions correctly", () => {
  assert.equal(updates.compareSemver("0.3.0", "0.2.9"), 1);
  assert.equal(updates.compareSemver("1.0.0-alpha.2", "1.0.0-alpha.10"), -1);
  assert.equal(updates.compareSemver("1.0.0", "1.0.0-rc.1"), 1);
  assert.equal(updates.compareSemver("1.0.0+build.2", "1.0.0+build.1"), 0);
  assert.equal(updates.parseSemver("01.0.0"), null);
  assert.throws(() => updates.compareSemver("inválida", "0.2.0"), /Versão inválida/);
});

test("accepts only the exact Alpha manifest and official matching release page", () => {
  assert.deepEqual(updates.validateManifest(validManifest), validManifest);
  for (const mutation of [
    { appId: "outro.app" },
    { channel: "stable" },
    { version: "03.0.0" },
    { releaseUrl: "https://github.com/outro/projeto/releases/tag/v0.3.0" },
    { releaseUrl: "https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v9.9.9" },
    { releaseUrl: "https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v0.3.0?download=1" },
    { notes: "" },
    { publishedAt: "ontem" },
    { extra: true },
  ]) {
    assert.equal(updates.validateManifest({ ...validManifest, ...mutation }), null);
  }
});

test("keeps ordinary browsers silent without even requesting the manifest", async () => {
  const environment = fakeEnvironment({ tauri: false });
  let fetches = 0;
  const checker = updates.createUpdateChecker({
    document: environment.document,
    view: environment.view,
    versionInfo: { version: "0.2.0" },
    fetchImpl: async () => { fetches += 1; return manifestResponse(); },
  });
  assert.equal(await checker.check(), false);
  assert.equal(fetches, 0);
  assert.equal(environment.modal.open, false);
  assert.equal(updates.init(environment.document, environment.view), null);
});

test("shows the accessible update notice only for a newer version", async () => {
  for (const [version, expected] of [["0.3.0", true], ["0.2.0", false], ["0.1.9", false]]) {
    const environment = fakeEnvironment();
    const manifest = {
      ...validManifest,
      version,
      releaseUrl: `https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v${version}`,
    };
    const checker = updates.createUpdateChecker({
      document: environment.document,
      view: environment.view,
      versionInfo: { version: "0.2.0" },
      fetchImpl: async () => manifestResponse(manifest),
    });
    assert.equal(await checker.check(), expected);
    assert.equal(environment.modal.open, expected);
    if (expected) {
      assert.equal(environment.modal.title, "Atualização disponível");
      assert.match(environment.modal.body, /Instalada: v0\.2\.0/);
      assert.match(environment.modal.body, /Nova: v0\.3\.0/);
      assert.match(environment.modal.footer, /Atualizar aplicativo/);
      assert.match(environment.modal.footer, /Agora não/);
      assert.equal(environment.modal.className, "app-update-modal-shell");
    }
  }
});

test("fails silently offline and retries when the connection returns", async () => {
  const environment = fakeEnvironment({ online: false });
  let fetches = 0;
  const checker = updates.createUpdateChecker({
    document: environment.document,
    view: environment.view,
    versionInfo: { version: "0.2.0" },
    fetchImpl: async () => { fetches += 1; return manifestResponse(); },
  });
  assert.equal(await checker.check(), false);
  assert.equal(fetches, 0);
  environment.view.navigator.onLine = true;
  environment.viewListeners.get("online")();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(fetches, 1);
  assert.equal(environment.modal.open, true);
});

test("Agora não dismisses the target for this session and a fresh session reminds again", async () => {
  const environment = fakeEnvironment();
  const checker = updates.createUpdateChecker({
    document: environment.document,
    view: environment.view,
    versionInfo: { version: "0.2.0" },
    fetchImpl: async () => manifestResponse(),
  });
  await checker.check();
  const later = click("later");
  await checker.handleClick(later.event);
  assert.equal(environment.storage.get(updates.DISMISS_KEY), "0.3.0");
  assert.equal(environment.modal.open, false);

  const sameSession = fakeEnvironment({ storage: environment.storage });
  const sameSessionChecker = updates.createUpdateChecker({
    document: sameSession.document,
    view: sameSession.view,
    versionInfo: { version: "0.2.0" },
    fetchImpl: async () => manifestResponse(),
  });
  assert.equal(await sameSessionChecker.check(), false);
  assert.equal(sameSession.modal.open, false);

  const freshSession = fakeEnvironment();
  const freshChecker = updates.createUpdateChecker({
    document: freshSession.document,
    view: freshSession.view,
    versionInfo: { version: "0.2.0" },
    fetchImpl: async () => manifestResponse(),
  });
  assert.equal(await freshChecker.check(), true);
});

test("opens only the validated release and reports a friendly Windows failure", async () => {
  const environment = fakeEnvironment();
  const checker = updates.createUpdateChecker({
    document: environment.document,
    view: environment.view,
    versionInfo: { version: "0.2.0" },
    fetchImpl: async () => manifestResponse(),
  });
  await checker.check();
  await checker.handleClick(click("open").event);
  assert.deepEqual(environment.opened, [validManifest.releaseUrl]);
  assert.equal(environment.modal.open, false);

  const failure = fakeEnvironment({ openFailure: true });
  const failureChecker = updates.createUpdateChecker({
    document: failure.document,
    view: failure.view,
    versionInfo: { version: "0.2.0" },
    fetchImpl: async () => manifestResponse(),
  });
  await failureChecker.check();
  const open = click("open");
  await failureChecker.handleClick(open.event);
  assert.equal(open.control.disabled, false);
  assert.equal(failure.error.hidden, false);
  assert.match(failure.error.textContent, /Windows não conseguiu abrir o navegador/);
  assert.equal(failure.modal.open, true);
});

test("escapes notes and ships the prepared 0.2.2 public contract", () => {
  const html = updates.updateBodyHtml({ ...validManifest, notes: "<img src=x onerror=alert(1)>" }, "0.2.0");
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "app-update.json"), "utf8"));
  assert.equal(manifest.version, "0.2.2");
  assert.deepEqual(updates.validateManifest(manifest), manifest);
});
