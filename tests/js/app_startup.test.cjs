const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..", "..");

function createElement() {
  return {
    innerHTML: "",
    textContent: "",
    value: "",
    files: [],
    dataset: {},
    className: "",
    classList: { toggle() {}, add() {}, remove() {} },
    style: { setProperty() {} },
    setAttribute(name, value) { this[name] = String(value); },
    getAttribute(name) { return this[name] ?? null; },
    addEventListener() {},
    appendChild() {},
    remove() {},
    focus() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

function createSandbox(initialState = null) {
  const elements = Object.fromEntries(["tabs", "statusLine", "app", "modalRoot", "toastRoot"].map((id) => [id, createElement()]));
  const body = createElement();
  const document = {
    body,
    activeElement: body,
    currentScript: { src: "file:///latio/app.js" },
    querySelector(selector) { return selector.startsWith("#") ? elements[selector.slice(1)] ?? null : null; },
    querySelectorAll() { return []; },
    createElement,
    addEventListener() {},
  };
  const storage = new Map();
  if (initialState) storage.set("marufia-latio-state-v1", JSON.stringify(initialState));
  const localStorage = {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); },
  };
  const window = {
    document,
    location: { protocol: "file:", href: "file:///latio/index.html" },
    print() {},
  };
  const sandbox = {
    window,
    document,
    localStorage,
    navigator: { clipboard: { writeText: async () => {} } },
    crypto: { randomUUID: () => `test-${Math.random().toString(16).slice(2)}` },
    URL,
    Blob,
    console,
    setTimeout: (callback) => { callback(); return 1; },
    clearTimeout() {},
    requestAnimationFrame: (callback) => callback(),
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const file of ["data.js", "item_descriptions.js", "magic_cores.js", "src/core/state.js", "src/core/rules.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  }
  return { sandbox, elements, localStorage };
}

test("migrates the representative v1 fixture without losing sheet data", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests", "fixtures", "state-v1.json"), "utf8"));
  const { sandbox } = createSandbox(fixture);
  assert.equal(vm.runInContext("state.meta.schemaVersion", sandbox), 2);
  assert.equal(vm.runInContext("state.character.name", sandbox), "Fixture Latio");
  assert.equal(vm.runInContext("state.attributes.CON", sandbox), 60);
  assert.equal(vm.runInContext("state.resources.hpCurrent", sandbox), 10);
  assert.equal(vm.runInContext('Object.hasOwn(JSON.parse(exportPayload()), "ui")', sandbox), false);
});

test("starts and renders every tab without a runtime error", () => {
  const { sandbox, elements } = createSandbox();
  assert.match(elements.tabs.innerHTML, /role="tab"/);
  assert.match(elements.app.innerHTML, /Resumo/);
  vm.runInContext('state.magic.baseLevels.Mundo = 1; for (const tab of TABS) { sessionUi.activeTab = tab[0]; render(); if (!document.querySelector("#app").innerHTML) throw new Error(`Aba vazia: ${tab[0]}`); }', sandbox);
  assert.match(elements.app.getAttribute("aria-labelledby"), /^tab-/);
});

test("keeps JSON import transactional when cancelled", () => {
  const { sandbox } = createSandbox();
  const before = vm.runInContext("persistentSignature()", sandbox);
  vm.runInContext('importJsonText(JSON.stringify({ meta: { appId: APP_ID, schemaVersion: 2 }, character: { name: "Nao aplicar" } }), "cancelar.json")', sandbox);
  assert.equal(vm.runInContext("state.character.name", sandbox), "");
  vm.runInContext("cancelImport()", sandbox);
  assert.equal(vm.runInContext("persistentSignature()", sandbox), before);
});

test("does not recurse when localStorage fails", () => {
  const { sandbox, localStorage } = createSandbox();
  localStorage.setItem = () => { throw new Error("quota"); };
  assert.equal(vm.runInContext("saveStateNow()", sandbox), false);
  assert.equal(vm.runInContext('state.errors.filter((item) => item.code === "LAT-UI-003").length', sandbox), 1);
});

test("enforces explicit World transitions and infinite duration", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.magic.baseLevels.Mundo = 1; state.resources.pmCurrent = 100; openWorldAction()', sandbox);
  assert.equal(vm.runInContext("state.world.status", sandbox), "active");
  assert.equal(vm.runInContext('state.combat.activeSpells.find((spell) => spell.type === "Mundo").turns', sandbox), null);
  vm.runInContext("closeWorldAction()", sandbox);
  assert.equal(vm.runInContext("state.world.status", sandbox), "closed");
  const pmBefore = vm.runInContext("pmCurrent()", sandbox);
  vm.runInContext("maintainWorldAction()", sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), pmBefore);
});
