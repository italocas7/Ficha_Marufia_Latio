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
  assert.equal(vm.runInContext("state.meta.schemaVersion", sandbox), 4);
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
  vm.runInContext('importJsonText(JSON.stringify({ meta: { appId: APP_ID, schemaVersion: 4 }, character: { name: "Nao aplicar" } }), "cancelar.json")', sandbox);
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

test("shows friendly PDF conflict names without technical paths", () => {
  const { sandbox, elements } = createSandbox();
  vm.runInContext(`showPdfImportReview(
    ["Vida máxima"],
    [],
    {
      source: "form+text",
      importedValueCount: 4,
      fieldCount: 8,
      conflicts: [{ path: "character.name", label: "Nome do personagem", formValue: "A", textValue: "B" }],
      diagnostics: {}
    },
    "ficha.pdf"
  )`, sandbox);
  assert.match(elements.modalRoot.innerHTML, /Nome do personagem/);
  assert.match(elements.modalRoot.innerHTML, /formulário e texto visível/);
  assert.doesNotMatch(elements.modalRoot.innerHTML, /character\.name/);
});

test("charges World maintenance only through its button", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.magic.baseLevels.Mundo = 1; state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 100; openWorldAction()', sandbox);
  assert.equal(vm.runInContext("state.world.status", sandbox), "active");
  assert.equal(vm.runInContext('state.combat.activeSpells.some((spell) => spell.type === "Mundo")', sandbox), false);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 95);
  vm.runInContext("maintainWorldAction()", sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 93);
  assert.equal(vm.runInContext("state.world.maintenancePaidForTurn", sandbox), true);
  vm.runInContext("maintainWorldAction()", sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 93);
  vm.runInContext("passTurn()", sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 93);
  assert.equal(vm.runInContext("state.world.status", sandbox), "active");
  assert.equal(vm.runInContext("state.world.maintenancePaidForTurn", sandbox), false);
  vm.runInContext("passTurn()", sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 93);
  assert.equal(vm.runInContext("state.world.status", sandbox), "closed");
});

test("keeps automatic maintenance for non-World spells", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 20; state.combat.activeSpells = [{ id: "forte", spellId: "forte", type: "Forte", name: "Forte", level: 2, turns: 3, maintenanceCost: 2 }]; passTurn()', sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 18);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].turns", sandbox), 2);
});

test("applies passive talent bonuses independently from conditional switches", () => {
  const { sandbox } = createSandbox();
  vm.runInContext(`state.talents = [
    { id: "atleta", name: "Atleta", level: 1, enabled: false },
    { id: "adepto", name: "Adepto Marcial", level: 1, enabled: false },
    { id: "curandeiro", name: "Curandeiro", level: 1, enabled: false },
    { id: "sorrateiro", name: "Sorrateiro", level: 1, enabled: false }
  ]`, sandbox);
  assert.equal(vm.runInContext('attr("FOR")', sandbox), 55);
  assert.equal(vm.runInContext('skillModifiers("Atletismo").reduce((sum, item) => sum + item.value, 0)', sandbox), 15);
  assert.equal(vm.runInContext('skillModifiers("Lutar (Brigar)").reduce((sum, item) => sum + item.value, 0)', sandbox), 10);
  assert.equal(vm.runInContext('skillModifiers("Medicina").reduce((sum, item) => sum + item.value, 0)', sandbox), 10);
  assert.equal(vm.runInContext('skillModifiers("Furtividade").reduce((sum, item) => sum + item.value, 0)', sandbox), 15);
});

test("stacks Amado Pela Magia and removes one instance by id", () => {
  const { sandbox } = createSandbox();
  const base = vm.runInContext("maxPm()", sandbox);
  vm.runInContext('state.talents = [{ id: "amado-1", name: "Amado Pela Magia", level: 1, enabled: true }, { id: "amado-2", name: "Amado Pela Magia", level: 2, enabled: true }]', sandbox);
  assert.equal(vm.runInContext("maxPm()", sandbox), base + 10);
  vm.runInContext('removeTalent("amado-1")', sandbox);
  assert.equal(vm.runInContext("maxPm()", sandbox), base + 5);
  assert.equal(vm.runInContext("state.talents[0].id", sandbox), "amado-2");
});

test("applies Lobo Solitário attack and CA only while enabled", () => {
  const { sandbox } = createSandbox();
  const baseAttack = vm.runInContext('skillFinal("Lutar (Brigar)")', sandbox);
  const baseCa = vm.runInContext("caBreakdown().total", sandbox);
  vm.runInContext('state.talents = [{ id: "lobo", name: "Lobo Solitário", level: 1, enabled: false }]', sandbox);
  assert.equal(vm.runInContext('skillFinal("Lutar (Brigar)")', sandbox), baseAttack);
  assert.equal(vm.runInContext("caBreakdown().total", sandbox), baseCa);
  vm.runInContext('toggleTalent("lobo")', sandbox);
  assert.equal(vm.runInContext('skillFinal("Lutar (Brigar)")', sandbox), baseAttack + 10);
  assert.equal(vm.runInContext("caBreakdown().total", sandbox), baseCa + 5);
});
