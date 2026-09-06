"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const updates = require("../../src/online/app_update.js");

const root = path.resolve(__dirname, "..", "..");
const validSignature = "QUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQQ==";
const validTauriManifest = Object.freeze({
  version: "0.3.0",
  notes: "Correções e melhorias seguras.",
  pub_date: "2026-09-06T00:00:00.000Z",
  platforms: Object.freeze({
    "windows-x86_64": Object.freeze({
      url: "https://github.com/italocas7/Ficha_Marufia_Latio/releases/download/v0.3.0/Marufia-Setup.exe",
      signature: validSignature,
    }),
  }),
});

function fakeUpdate(options = {}) {
  const state = { closed: 0, downloads: 0 };
  const update = {
    version: options.version ?? "0.3.0",
    body: options.body ?? "Correções e melhorias seguras.",
    async close() { state.closed += 1; },
    async downloadAndInstall(listener) {
      state.downloads += 1;
      listener?.({ event: "Started", data: { contentLength: 100 } });
      listener?.({ event: "Progress", data: { chunkLength: 40 } });
      listener?.({ event: "Progress", data: { chunkLength: 60 } });
      if (options.downloadFailure) throw new Error("Falha simulada");
      listener?.({ event: "Finished" });
    },
  };
  return { state, update };
}

function fakeEnvironment(options = {}) {
  const documentListeners = new Map();
  const viewListeners = new Map();
  const storage = options.storage ?? new Map();
  const opened = [];
  const modal = { open: Boolean(options.modalOpen), own: false, body: "", footer: "", title: "", dismissible: true };
  const modalClassList = { add: (name) => { modal.className = name; } };
  const progress = { dataset: {}, value: 0, removeAttribute(name) { if (name === "value") delete this.value; } };
  const progressLabel = { textContent: "" };
  const modalRoot = {
    innerHTML: "",
    querySelector(selector) {
      if (selector === ".modal") return modal.open ? { classList: modalClassList } : null;
      return null;
    },
  };
  const sourceUpdates = options.updates ?? [fakeUpdate(options).update];
  let updateIndex = 0;
  const document = {
    documentElement: { dataset: {} },
    addEventListener(name, listener) { documentListeners.set(name, listener); },
    removeEventListener(name) { documentListeners.delete(name); },
    querySelector(selector) {
      if (selector === "#modalRoot") return modalRoot;
      if (selector === "[data-online-app-update-modal]") return modal.own ? {} : null;
      if (selector === "[data-online-app-update-progress]") return modal.own ? progress : null;
      if (selector === "[data-online-app-update-progress-label]") return modal.own ? progressLabel : null;
      return null;
    },
  };
  const view = {
    __TAURI_INTERNALS__: options.tauri === false ? undefined : {},
    __TAURI__: options.tauri === false ? undefined : {
      updater: {
        async check() {
          if (options.checkFailure) throw new Error("Falha simulada");
          return sourceUpdates[Math.min(updateIndex++, sourceUpdates.length - 1)] ?? null;
        },
      },
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
    dispatchEvent(event) { viewListeners.get(event.type)?.(event); return true; },
    CustomEvent: class CustomEvent {
      constructor(type, init) { this.type = type; this.detail = init?.detail; }
    },
    setTimeout,
    clearTimeout,
    flushPendingState() { view.flushes = (view.flushes ?? 0) + 1; },
    openModal(title, body, footer, modalOptions = {}) {
      modal.open = true;
      modal.own = body.includes("data-online-app-update-modal");
      modal.title = title;
      modal.body = body;
      modal.footer = footer;
      modal.dismissible = modalOptions.dismissible !== false;
    },
    closeModal() {
      modal.open = false;
      modal.own = false;
      return true;
    },
  };
  document.defaultView = view;
  return { document, documentListeners, modal, modalRoot, opened, progress, progressLabel, storage, view, viewListeners };
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

test("accepts only the signed Windows manifest and exact official installer URL", () => {
  assert.deepEqual(updates.validateTauriManifest(validTauriManifest), validTauriManifest);
  for (const mutation of [
    { version: "03.0.0" },
    { notes: "" },
    { pub_date: "ontem" },
    { extra: true },
    { platforms: { "windows-x86_64": { ...validTauriManifest.platforms["windows-x86_64"], url: "https://example.test/app.exe" } } },
    { platforms: { "windows-x86_64": { ...validTauriManifest.platforms["windows-x86_64"], signature: "curta" } } },
    { platforms: { "linux-x86_64": validTauriManifest.platforms["windows-x86_64"] } },
  ]) {
    assert.equal(updates.validateTauriManifest({ ...validTauriManifest, ...mutation }), null);
  }
});

test("keeps ordinary browsers silent without invoking the native updater", async () => {
  const environment = fakeEnvironment({ tauri: false });
  let checks = 0;
  const checker = updates.createUpdateChecker({
    document: environment.document,
    view: environment.view,
    versionInfo: { version: "0.2.4" },
    checkImpl: async () => { checks += 1; return fakeUpdate().update; },
  });
  assert.equal(await checker.check(), false);
  assert.equal(checks, 0);
  assert.equal(environment.modal.open, false);
  assert.equal(updates.init(environment.document, environment.view), null);
});

test("shows the confirmation only for a valid newer native update", async () => {
  for (const [version, expected] of [["0.3.0", true], ["0.2.4", false], ["0.1.9", false], ["inválida", false]]) {
    const resource = fakeUpdate({ version });
    const environment = fakeEnvironment({ updates: [resource.update] });
    const checker = updates.createUpdateChecker({ document: environment.document, view: environment.view, versionInfo: { version: "0.2.4" } });
    assert.equal(await checker.check(), expected);
    assert.equal(environment.modal.open, expected);
    if (expected) {
      assert.equal(environment.modal.title, "Atualização disponível");
      assert.match(environment.modal.body, /Instalada: v0\.2\.4/);
      assert.match(environment.modal.body, /Nova: v0\.3\.0/);
      assert.match(environment.modal.footer, /Baixar e instalar/);
      assert.match(environment.modal.footer, /Agora não/);
      assert.equal(environment.modal.className, "app-update-modal-shell");
    } else {
      assert.equal(resource.state.closed, 1);
    }
  }
});

test("fails silently offline and checks again when the connection returns", async () => {
  const environment = fakeEnvironment({ online: false });
  let checks = 0;
  const checker = updates.createUpdateChecker({
    document: environment.document,
    view: environment.view,
    versionInfo: { version: "0.2.4" },
    checkImpl: async () => { checks += 1; return fakeUpdate().update; },
  });
  assert.equal(await checker.check(), false);
  assert.equal(checks, 0);
  environment.view.navigator.onLine = true;
  environment.viewListeners.get("online")();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(checks, 1);
  assert.equal(environment.modal.open, true);
});

test("Agora não suppresses one version only for the current application session", async () => {
  const resource = fakeUpdate();
  const environment = fakeEnvironment({ updates: [resource.update] });
  const checker = updates.createUpdateChecker({ document: environment.document, view: environment.view, versionInfo: { version: "0.2.4" } });
  await checker.check();
  await checker.handleClick(click("later").event);
  assert.equal(environment.storage.get(updates.DISMISS_KEY), "0.3.0");
  assert.equal(environment.modal.open, false);
  assert.equal(resource.state.closed, 1);

  const sameSession = fakeEnvironment({ storage: environment.storage });
  const sameChecker = updates.createUpdateChecker({ document: sameSession.document, view: sameSession.view, versionInfo: { version: "0.2.4" } });
  assert.equal(await sameChecker.check(), false);
  assert.equal(sameSession.modal.open, false);

  const freshSession = fakeEnvironment();
  const freshChecker = updates.createUpdateChecker({ document: freshSession.document, view: freshSession.view, versionInfo: { version: "0.2.4" } });
  assert.equal(await freshChecker.check(), true);
});

test("saves pending state, waits for online work and reports signed download progress", async () => {
  const resource = fakeUpdate();
  const environment = fakeEnvironment({ updates: [resource.update] });
  let onlineFlushed = false;
  environment.view.addEventListener(updates.BEFORE_APP_UPDATE_EVENT, (event) => {
    event.detail.waitUntil(Promise.resolve().then(() => { onlineFlushed = true; }));
  });
  const checker = updates.createUpdateChecker({ document: environment.document, view: environment.view, versionInfo: { version: "0.2.4" } });
  await checker.check();
  await checker.handleClick(click("install").event);
  assert.equal(environment.view.flushes, 1);
  assert.equal(onlineFlushed, true);
  assert.equal(resource.state.downloads, 1);
  assert.equal(environment.modal.title, "Instalando atualização");
  assert.equal(environment.modal.dismissible, false);
  assert.equal(environment.progress.value, 100);
  assert.match(environment.progressLabel.textContent, /Instalação iniciada/);
  assert.equal(environment.storage.get(updates.DISMISS_KEY), "0.3.0");
});

test("does not wait longer than the bounded preparation timeout", async () => {
  const environment = fakeEnvironment();
  environment.view.addEventListener(updates.BEFORE_APP_UPDATE_EVENT, (event) => {
    event.detail.waitUntil(new Promise(() => {}));
  });
  const started = Date.now();
  await updates.prepareForInstall(environment.view, 5);
  assert.ok(Date.now() - started < 250);
});

test("offers retry and the scoped manual release after an installation failure", async () => {
  const resource = fakeUpdate({ downloadFailure: true });
  const environment = fakeEnvironment({ updates: [resource.update] });
  const checker = updates.createUpdateChecker({ document: environment.document, view: environment.view, versionInfo: { version: "0.2.4" } });
  await checker.check();
  await checker.handleClick(click("install").event);
  assert.equal(environment.modal.title, "Falha na atualização");
  assert.match(environment.modal.footer, /Tentar novamente/);
  assert.match(environment.modal.footer, /Baixar manualmente/);
  await checker.handleClick(click("manual").event);
  assert.deepEqual(environment.opened, ["https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v0.3.0"]);
  assert.equal(environment.modal.open, false);
});

test("keeps the failure modal interactive if Windows cannot open the browser", async () => {
  const resource = fakeUpdate({ downloadFailure: true });
  const environment = fakeEnvironment({ updates: [resource.update], openFailure: true });
  const checker = updates.createUpdateChecker({ document: environment.document, view: environment.view, versionInfo: { version: "0.2.4" } });
  await checker.check();
  await checker.handleClick(click("install").event);
  const manual = click("manual");
  await checker.handleClick(manual.event);
  assert.equal(manual.control.disabled, false);
  assert.equal(environment.modal.title, "Falha na atualização");
  assert.match(environment.modal.body, /Windows não conseguiu abrir o navegador/);
});

test("escapes notes and ships both prepared 0.2.4 manifests", () => {
  const html = updates.updateBodyHtml({ version: "0.3.0", notes: "<img src=x onerror=alert(1)>" }, "0.2.4");
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img/);
  const legacy = JSON.parse(fs.readFileSync(path.join(root, "app-update.json"), "utf8"));
  const signed = JSON.parse(fs.readFileSync(path.join(root, "tauri-update.json"), "utf8"));
  assert.equal(legacy.version, "0.2.4");
  assert.equal(signed.version, "0.2.4");
  assert.deepEqual(updates.validateTauriManifest(signed), signed);
});
