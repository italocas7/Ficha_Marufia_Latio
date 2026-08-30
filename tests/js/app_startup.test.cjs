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
  const elements = Object.fromEntries([
    "tabs", "statusLine", "app", "modalRoot", "toastRoot", "worldDurationTurns", "worldDurationFeedback",
    "combatRollSkill", "combatTargetCa", "combatSkillValue", "combatCaValue", "combatTargetValue",
    "parrySkill", "fissureSpend", "fissureChosenNumber", "fissureAttemptPreview",
  ].map((id) => [id, createElement()]));
  const body = createElement();
  const document = {
    body,
    activeElement: body,
    currentScript: { src: "file:///latio/app.js" },
    querySelector(selector) {
      if (selector === "#modalRoot .modal") {
        const match = elements.modalRoot.innerHTML.match(/data-blocking="(true|false)"/);
        return match ? { ...createElement(), dataset: { blocking: match[1] } } : null;
      }
      return selector.startsWith("#") ? elements[selector.slice(1)] ?? null : null;
    },
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
    addEventListener() {},
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
  for (const file of ["data.js", "item_descriptions.js", "magic_cores.js", "src/core/storage.js", "src/core/state.js", "src/core/rules.js", "src/core/rolls.js", "app.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
  }
  return { sandbox, elements, localStorage };
}

test("migrates the representative v1 fixture without losing sheet data", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests", "fixtures", "state-v1.json"), "utf8"));
  const { sandbox } = createSandbox(fixture);
  assert.equal(vm.runInContext("state.meta.schemaVersion", sandbox), 5);
  assert.equal(vm.runInContext("state.character.name", sandbox), "Fixture Latio");
  assert.equal(vm.runInContext("state.attributes.CON", sandbox), 60);
  assert.equal(vm.runInContext("state.resources.hpCurrent", sandbox), 10);
  assert.equal(vm.runInContext('Object.hasOwn(JSON.parse(exportPayload()), "ui")', sandbox), false);
});

test("backs up the untouched local payload before an online import", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(root, "tests", "fixtures", "state-v1.json"), "utf8"));
  const { sandbox, localStorage } = createSandbox(fixture);
  assert.equal(vm.runInContext("state.meta.schemaVersion", sandbox), 5);
  vm.runInContext("window.MARUFIA_APP_BRIDGE.createOnlineImportBackup()", sandbox);
  const backups = JSON.parse(localStorage.getItem("marufia-latio-backups-v1"));
  const original = JSON.parse(backups[0].payload);
  assert.equal(original.meta.schemaVersion, 1);
  assert.equal(original.character.name, "Fixture Latio");
  assert.equal(JSON.parse(localStorage.getItem("marufia-latio-state-v1")).meta.schemaVersion, 1);
});

test("keeps the classic JSON export and adds an importable online backup", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.character.name = "Compatível"', sandbox);
  assert.equal(vm.runInContext("JSON.parse(exportPayload()).meta.appId", sandbox), "marufia-latio");
  assert.equal(vm.runInContext("JSON.parse(exportPayload()).format", sandbox), undefined);
  assert.equal(vm.runInContext("JSON.parse(exportOnlinePayload()).format", sandbox), "marufia-online-character-backup");
  vm.runInContext("window.__onlinePrepared = prepareStateImport(JSON.parse(exportOnlinePayload()))", sandbox);
  assert.equal(vm.runInContext("window.__onlinePrepared.sourceFormat", sandbox), "online-backup");
  assert.equal(vm.runInContext("window.__onlinePrepared.state.character.name", sandbox), "Compatível");
});

test("applies an authorized remote snapshot locally without emitting another online save", () => {
  const { sandbox, localStorage } = createSandbox();
  vm.runInContext("state.meta.started = true; saveStateNow()", sandbox);
  vm.runInContext(`
    window.__remoteSaveNotifications = 0;
    window.MARUFIA_APP_BRIDGE.onLocalSave(() => { window.__remoteSaveNotifications += 1; });
    const remote = window.MARUFIA_APP_BRIDGE.snapshot();
    remote.resources.hpCurrent = 29;
    window.__remoteApplied = window.MARUFIA_APP_BRIDGE.applyRemoteSnapshot(remote);
  `, sandbox);
  assert.equal(vm.runInContext("window.__remoteApplied", sandbox), true);
  assert.equal(vm.runInContext("state.resources.hpCurrent", sandbox), 29);
  assert.equal(JSON.parse(localStorage.getItem("marufia-latio-state-v1")).resources.hpCurrent, 29);
  assert.equal(vm.runInContext("window.__remoteSaveNotifications", sandbox), 0);
});

test("refuses a remote snapshot when local persistence is unavailable", () => {
  const { sandbox, localStorage } = createSandbox();
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = () => { throw new Error("storage unavailable"); };
  vm.runInContext(`
    const remote = window.MARUFIA_APP_BRIDGE.snapshot();
    remote.resources.hpCurrent = 29;
    window.__remoteApplied = window.MARUFIA_APP_BRIDGE.applyRemoteSnapshot(remote);
  `, sandbox);
  assert.equal(vm.runInContext("window.__remoteApplied", sandbox), false);
  assert.equal(vm.runInContext("state.resources.hpCurrent", sandbox), null);
  localStorage.setItem = originalSetItem;
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

test("persists live text fields while they remain focused", () => {
  const { sandbox, localStorage } = createSandbox();
  vm.runInContext(`handleInput({ target: {
    id: "",
    type: "text",
    value: "Teste de persistência",
    dataset: { path: "character.name", live: "true" }
  } })`, sandbox);
  assert.equal(vm.runInContext("state.character.name", sandbox), "Teste de persistência");
  assert.equal(JSON.parse(localStorage.getItem("marufia-latio-state-v1")).character.name, "Teste de persistência");
});

test("notifies optional online integrations only after the local save succeeds", () => {
  const { sandbox } = createSandbox();
  vm.runInContext(`
    window.MARUFIA_APP_BRIDGE.onLocalSave((snapshot) => {
      window.__localSaveObservation = {
        snapshotName: snapshot.character.name,
        storedName: JSON.parse(localStorage.getItem(STORAGE_KEY)).character.name
      };
    });
    handleInput({ target: {
      id: "",
      type: "text",
      value: "Local antes do online",
      dataset: { path: "character.name", live: "true" }
    } });
  `, sandbox);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(window.__localSaveObservation)", sandbox)), {
    snapshotName: "Local antes do online",
    storedName: "Local antes do online",
  });
});

test("flushes the active numeric field before the page closes", () => {
  const { sandbox, localStorage } = createSandbox();
  const active = createElement();
  active.type = "number";
  active.value = "3";
  active.dataset = { path: "character.level" };
  sandbox.document.activeElement = active;
  assert.equal(vm.runInContext("flushPendingState()", sandbox), true);
  assert.equal(vm.runInContext("state.character.level", sandbox), 3);
  assert.equal(JSON.parse(localStorage.getItem("marufia-latio-state-v1")).character.level, 3);
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

test("gives the opening World turn for free and blocks the next pending turn transactionally", () => {
  const { sandbox, elements } = createSandbox();
  vm.runInContext('state.magic.baseLevels.Mundo = 1; state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 100; openWorldAction()', sandbox);
  assert.equal(vm.runInContext("state.world.status", sandbox), "closed");
  elements.worldDurationTurns.value = "3";
  vm.runInContext("confirmWorldOpen()", sandbox);
  assert.equal(vm.runInContext("state.world.status", sandbox), "active");
  assert.equal(vm.runInContext('state.combat.activeSpells.some((spell) => spell.type === "Mundo")', sandbox), false);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 95);
  assert.equal(vm.runInContext("state.world.maintenancePaidForTurn", sandbox), true);
  vm.runInContext("passTurn()", sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 95);
  assert.equal(vm.runInContext("state.world.status", sandbox), "active");
  assert.equal(vm.runInContext("state.world.durationTurns", sandbox), 2);
  assert.equal(vm.runInContext("state.world.maintenancePaidForTurn", sandbox), false);

  vm.runInContext('state.combat.actions.bonus = false; state.combat.activeSpells = [{ id: "forte", type: "Forte", name: "Forte", turns: 3, maintenanceCost: 2 }]', sandbox);
  assert.equal(vm.runInContext("passTurn()", sandbox), false);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 95);
  assert.equal(vm.runInContext("state.world.durationTurns", sandbox), 2);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].turns", sandbox), 3);
  assert.equal(vm.runInContext("state.combat.actions.bonus", sandbox), false);
  assert.match(elements.modalRoot.innerHTML, /data-blocking="true"/);
  assert.match(elements.modalRoot.innerHTML, /Manutenção do Mundo pendente/);
  assert.doesNotMatch(elements.modalRoot.innerHTML, /data-action="close-modal"|Cancelar/);
  assert.match(elements.modalRoot.innerHTML, /data-resolution="break" disabled/);

  assert.equal(vm.runInContext("closeModal()", sandbox), false);
  assert.match(elements.modalRoot.innerHTML, /Manutenção do Mundo pendente/);
  vm.runInContext("handleKeydown({ key: 'Escape', preventDefault() {}, target: {} })", sandbox);
  assert.match(elements.modalRoot.innerHTML, /Manutenção do Mundo pendente/);

  assert.equal(vm.runInContext("resolveWorldTurn('maintain')", sandbox), true);
  assert.equal(elements.modalRoot.innerHTML, "");
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 91);
  assert.equal(vm.runInContext("state.world.durationTurns", sandbox), 1);
  assert.equal(vm.runInContext("state.world.maintenancePaidForTurn", sandbox), false);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].turns", sandbox), 2);
  assert.equal(vm.runInContext("state.combat.actions.bonus", sandbox), true);
});

test("rolls the correct World duration and closes at zero", () => {
  const { sandbox, elements } = createSandbox();
  vm.runInContext("Math.random = () => 0; state.magic.baseLevels.Mundo = 1", sandbox);
  assert.equal(vm.runInContext("worldDurationFormula()", sandbox), "1d4");
  assert.equal(vm.runInContext("rollWorldDurationValue()", sandbox), 1);
  vm.runInContext("state.magic.baseLevels.Mundo = 5", sandbox);
  assert.equal(vm.runInContext("worldDurationFormula()", sandbox), "1d4+2");
  assert.equal(vm.runInContext("rollWorldDurationValue()", sandbox), 3);

  vm.runInContext("state.magic.baseLevels.Mundo = 1; state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 100; openWorldAction()", sandbox);
  elements.worldDurationTurns.value = "1";
  vm.runInContext("confirmWorldOpen(); passTurn()", sandbox);
  assert.equal(vm.runInContext("state.world.status", sandbox), "closed");
  assert.equal(vm.runInContext("state.world.durationTurns", sandbox), null);
  assert.match(vm.runInContext("state.combat.log.join(' ')", sandbox), /duração chegou a 0/i);
});

test("charges manual World maintenance only once in the same turn", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.magic.baseLevels.Mundo = 1; state.world.status = "active"; state.world.durationTurns = 3; state.world.maintenancePaidForTurn = false; state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 20', sandbox);
  assert.equal(vm.runInContext("maintainWorldAction()", sandbox), true);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 18);
  assert.equal(vm.runInContext("maintainWorldAction()", sandbox), false);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 18);
  assert.equal(vm.runInContext("passTurn()", sandbox), true);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 18);
  assert.equal(vm.runInContext("state.world.durationTurns", sandbox), 2);
});

test("breaks a pending World with Bonus Action and automatically completes the turn", () => {
  const { sandbox, elements } = createSandbox();
  vm.runInContext('state.world.status = "active"; state.world.durationTurns = 4; state.world.maintenancePaidForTurn = false; state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 100; state.combat.activeSpells = [{ id: "forte", type: "Forte", name: "Forte", turns: 3, maintenanceCost: 2 }]', sandbox);
  assert.equal(vm.runInContext("passTurn()", sandbox), false);
  assert.match(elements.modalRoot.innerHTML, /Quebrar Mundo \(Ação Bônus\)/);
  assert.equal(vm.runInContext("resolveWorldTurn('break')", sandbox), true);
  assert.equal(vm.runInContext("state.world.status", sandbox), "closed");
  assert.equal(vm.runInContext("state.world.durationTurns", sandbox), null);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 98);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].turns", sandbox), 2);
  assert.match(vm.runInContext("state.combat.log.join(' ')", sandbox), /Quebrar Mundo: Ação Bônus usada/);
  assert.match(vm.runInContext("state.combat.log.join(' ')", sandbox), /Turno passado/);
});

test("requires Bonus Action for normal World closure and keeps collapse free", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.world.status = "active"; state.world.durationTurns = 3; state.world.maintenancePaidForTurn = true', sandbox);
  assert.equal(vm.runInContext("closeWorldAction()", sandbox), true);
  assert.equal(vm.runInContext("state.world.status", sandbox), "closed");
  assert.equal(vm.runInContext("state.combat.actions.bonus", sandbox), false);

  vm.runInContext('state.world.status = "active"; state.world.durationTurns = 3; state.world.maintenancePaidForTurn = true', sandbox);
  assert.equal(vm.runInContext("closeWorldAction()", sandbox), false);
  assert.equal(vm.runInContext("state.world.status", sandbox), "active");
  assert.equal(vm.runInContext("collapseWorldAction()", sandbox), true);
  assert.equal(vm.runInContext("state.world.status", sandbox), "collapsed");
});

test("offers forced World break when neither PM nor Bonus Action is available", () => {
  const { sandbox, elements } = createSandbox();
  vm.runInContext('state.world.status = "active"; state.world.durationTurns = 3; state.world.maintenancePaidForTurn = false; state.resources.pmCurrent = 0; state.combat.actions.bonus = false', sandbox);
  assert.equal(vm.runInContext("passTurn()", sandbox), false);
  assert.match(elements.modalRoot.innerHTML, /Quebra forçada/);
  assert.match(elements.modalRoot.innerHTML, /data-resolution="maintain" disabled/);
  assert.equal(vm.runInContext("resolveWorldTurn('break')", sandbox), true);
  assert.equal(vm.runInContext("state.world.status", sandbox), "closed");
  assert.match(vm.runInContext("state.combat.log.join(' ')", sandbox), /Quebra forçada/);
});

test("shows the compact Combat World card only while active", () => {
  const { sandbox } = createSandbox();
  assert.equal(vm.runInContext("combatWorldCard()", sandbox), "");
  vm.runInContext('state.magic.baseLevels.Mundo = 2; state.world.status = "active"; state.world.durationTurns = 3; state.world.maintenancePaidForTurn = false', sandbox);
  const pending = vm.runInContext("combatWorldCard()", sandbox);
  assert.match(pending, /combat-world-panel pending/);
  assert.match(pending, /Manter Mundo/);
  vm.runInContext("state.world.maintenancePaidForTurn = true", sandbox);
  const guaranteed = vm.runInContext("combatWorldCard()", sandbox);
  assert.match(guaranteed, /Manutenção garantida/);
  assert.match(guaranteed, /disabled/);
});

test("filters the definitive World laws by explicit resistance mode", () => {
  const { sandbox } = createSandbox();
  const counts = JSON.parse(vm.runInContext(`JSON.stringify({
    offensiveSem: lawsForCategory("Ofensivo", "sem").length,
    offensiveCom: lawsForCategory("Ofensivo", "com").length,
    defensiveSem: lawsForCategory("Defensivo", "sem").length,
    defensiveCom: lawsForCategory("Defensivo", "com").length,
    utilitySem: lawsForCategory("Utilitário", "sem").length,
    utilityCom: lawsForCategory("Utilitário", "com").length
  })`, sandbox));
  assert.deepEqual(counts, {
    offensiveSem: 22,
    offensiveCom: 11,
    defensiveSem: 22,
    defensiveCom: 0,
    utilitySem: 13,
    utilityCom: 15,
  });

  assert.equal(vm.runInContext('lawNameForResistance(DB.worldLaws.find((law) => law.ID === "OFE-01"), "sem")', sandbox), "Dano em Alvo (SEM Resistência)");
  assert.equal(vm.runInContext('lawNameForResistance(DB.worldLaws.find((law) => law.ID === "OFE-01"), "com")', sandbox), "Dano em Alvo (COM Resistência)");
  assert.match(vm.runInContext('lawDetailsForResistance(DB.worldLaws.find((law) => law.ID === "OFE-01"), "N2 (Mundo 5-9)", "sem").effect', sandbox), /60 de dano/);
  assert.match(vm.runInContext('lawDetailsForResistance(DB.worldLaws.find((law) => law.ID === "OFE-01"), "N2 (Mundo 5-9)", "com").effect', sandbox), /80 de dano.*50/);
  assert.equal(vm.runInContext('DB.worldLaws.some((law) => law["Lei do Mundo"] === "Sifão de Mana")', sandbox), false);
  assert.equal(vm.runInContext('lawsForCategory("Híbrido", "sem")[0].ID', sandbox), "CUSTOM-HYB");
});

test("blocks an imported active World until its duration is defined", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.world.status = "active"; state.world.durationTurns = null; state.world.maintenancePaidForTurn = true', sandbox);
  assert.equal(vm.runInContext("passTurn()", sandbox), false);
  assert.equal(vm.runInContext("state.world.status", sandbox), "active");
  assert.equal(vm.runInContext("state.world.maintenancePaidForTurn", sandbox), true);
});

test("keeps automatic maintenance for non-World spells", () => {
  const { sandbox } = createSandbox();
  vm.runInContext('state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 20; state.combat.activeSpells = [{ id: "forte", spellId: "forte", type: "Forte", name: "Forte", level: 2, turns: 3, maintenanceCost: 2 }]; passTurn()', sandbox);
  assert.equal(vm.runInContext("pmCurrent()", sandbox), 18);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].turns", sandbox), 2);
});

test("limits combat CA tests to requested skills and accepts negative CA", () => {
  const { sandbox, elements } = createSandbox();
  const names = JSON.parse(vm.runInContext("JSON.stringify(combatTestSkills().map((skill) => skill.name))", sandbox));
  assert.deepEqual(names.slice(0, 4), ["Arremessar", "Arte/Ofício", "Atletismo", "Tática"]);
  assert.ok(names.slice(4).length > 0);
  assert.ok(names.slice(4).every((name) => /^Lutar\s*\(/.test(name)));
  assert.equal(vm.runInContext('combatAdjustedTarget("Atletismo", -10)', sandbox), vm.runInContext('skillFinal("Atletismo") + 10', sandbox));

  elements.combatRollSkill.value = "Atletismo";
  elements.combatTargetCa.value = "999";
  vm.runInContext("Math.random = () => 0; rollCombatTest('normal')", sandbox);
  assert.match(vm.runInContext("state.combat.log[0]", sandbox), /Acerto · Crítico natural/);
});

test("treats natural 01 as critical for attributes and skills", () => {
  const { sandbox } = createSandbox();
  assert.equal(vm.runInContext("d100Outcome(1, -500)", sandbox), "Crítico natural");
  assert.equal(vm.runInContext("d100Outcome(2, -500)", sandbox), "Falha");
  assert.match(vm.runInContext("openAttributeModal('FOR'); document.querySelector('#modalRoot').innerHTML", sandbox), /roll-attribute/);
});

test("publishes every current dice result with its real sheet context", () => {
  const { sandbox, elements } = createSandbox();
  elements.combatRollSkill.value = "Atletismo";
  elements.combatTargetCa.value = "0";
  vm.runInContext(`
    window.__rollRecords = [];
    window.MARUFIA_APP_BRIDGE.onRoll((record) => window.__rollRecords.push(record));
    Math.random = () => 0;
    rollSkill("Atletismo", "normal");
    rollAttribute("FOR", "normal");
    rollCombatTest("normal");
    rollWorldDurationValue(5);
    state.magicCore.selectedId = "antebraco";
    state.combat.activeSpells = [{ type: "Forte" }];
    state.resources.pmMaxBonus = 100;
    state.resources.pmCurrent = 100;
    coreReduceDamage();
  `, sandbox);
  const records = JSON.parse(vm.runInContext("JSON.stringify(window.__rollRecords)", sandbox));
  assert.deepEqual(records.map((record) => record.rollType), [
    "skill",
    "attribute",
    "combat",
    "world_duration",
    "core_damage_reduction",
  ]);
  assert.deepEqual(records.map((record) => record.formula), ["1d100", "1d100", "1d100", "1d4+2", "1d6"]);
  assert.deepEqual(records.map((record) => record.total), [1, 1, 1, 3, 1]);
  assert.equal(records[0].skillName, "Atletismo");
  assert.equal(records[1].skillName, "FOR");
  assert.equal(records[3].modifier, 2);
  assert.equal(records[4].target, null);
});

test("extracts and stacks Forte CA and effective Vigor", () => {
  const { sandbox } = createSandbox();
  const base = JSON.parse(vm.runInContext(`JSON.stringify(forteBonusesForItem({
    type: "Forte", level: 5, spell: DB.baseSpells.find((spell) => spell.baseType === "Forte")
  }))`, sandbox));
  assert.deepEqual(base, { ca: 15, vigor: 0 });

  const regional = JSON.parse(vm.runInContext(`JSON.stringify(DB.regions.flatMap((region) => region.magics || [])
    .filter((spell) => ["Juramento De Ferro", "Raiz Da Terra"].includes(spell.name))
    .map((spell) => forteBonusesForItem({ type: "Forte", level: spell.name === "Raiz Da Terra" ? 10 : 5, spell })))`, sandbox));
  assert.deepEqual(regional, [{ ca: 15, vigor: 10 }, { ca: 30, vigor: 25 }]);

  const baseCa = vm.runInContext("caBreakdown().total", sandbox);
  vm.runInContext(`state.combat.activeSpells = [
    { id: "f1", spellId: "one", type: "Forte", name: "Forte 1", level: 5, turns: 10, maintenanceCost: 0, caBonus: 15, effectiveVigor: 10 },
    { id: "f2", spellId: "two", type: "Forte", name: "Forte 2", level: 7, turns: 10, maintenanceCost: 0, caBonus: 20, effectiveVigor: 15 }
  ]`, sandbox);
  assert.equal(vm.runInContext("caBreakdown().forte", sandbox), 35);
  assert.equal(vm.runInContext("caBreakdown().total", sandbox), baseCa + 35);
  assert.equal(vm.runInContext("bodyInfo().total", sandbox), 125);
  vm.runInContext('state.magicCore.selectedId = "olhos"', sandbox);
  assert.equal(vm.runInContext("caBreakdown().total", sandbox), vm.runInContext('skillFinal("Percepção") + 35', sandbox));
});

test("snapshots Forte bonuses for reaction and standard activation", () => {
  const { sandbox } = createSandbox();
  vm.runInContext("state.magic.baseLevels.Forte = 5; state.resources.pmMaxBonus = 100; state.resources.pmCurrent = 100; activateForte('base-Forte', 'reaction')", sandbox);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].turns", sandbox), 1);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].caBonus", sandbox), 15);
  vm.runInContext("activateForte('base-Forte', 'standard')", sandbox);
  assert.equal(vm.runInContext("state.combat.activeSpells.length", sandbox), 1);
  assert.equal(vm.runInContext("state.combat.activeSpells[0].turns", sandbox), 10);
});

test("applies passive talent bonuses independently from conditional switches", () => {
  const { sandbox } = createSandbox();
  vm.runInContext(`state.talents = [
    { id: "atleta", name: "Atleta", level: 1, enabled: false },
    { id: "adepto", name: "Adepto Marcial", level: 1, enabled: false },
    { id: "sorrateiro", name: "Sorrateiro", level: 1, enabled: false }
  ]`, sandbox);
  assert.equal(vm.runInContext('attr("FOR")', sandbox), 55);
  assert.equal(vm.runInContext('skillModifiers("Atletismo").reduce((sum, item) => sum + item.value, 0)', sandbox), 10);
  assert.equal(vm.runInContext('skillModifiers("Lutar (Brigar)").reduce((sum, item) => sum + item.value, 0)', sandbox), 5);
  assert.equal(vm.runInContext('skillModifiers("Furtividade").reduce((sum, item) => sum + item.value, 0)', sandbox), 10);
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
  assert.equal(vm.runInContext('skillFinal("Lutar (Brigar)")', sandbox), baseAttack + 5);
  assert.equal(vm.runInContext("caBreakdown().total", sandbox), baseCa + 5);
});

test("migrates the legacy shield and applies specialized shield rules", () => {
  const { sandbox } = createSandbox();
  const baseCa = vm.runInContext("caBreakdown().total", sandbox);
  const baseBlock = vm.runInContext("caBreakdown().block.cortante", sandbox);
  vm.runInContext('state.inventory.shield = true; state.inventory.shieldId = ""; normalizeState(state)', sandbox);
  assert.equal(vm.runInContext("selectedShield().id", sandbox), "escudo-redondo");
  assert.equal(vm.runInContext("caBreakdown().total", sandbox), baseCa + 5);
  assert.equal(vm.runInContext("caBreakdown().block.cortante", sandbox), baseBlock + 2);

  vm.runInContext('state.inventory.shieldId = "escudo-grande"; state.inventory.shieldMode = "formation"', sandbox);
  assert.equal(vm.runInContext("caBreakdown().total", sandbox), baseCa + 17);
  assert.equal(vm.runInContext("caBreakdown().block.cortante", sandbox), baseBlock + 2);

  vm.runInContext('state.inventory.shieldId = "escudo-torre"; state.inventory.shieldMode = ""', sandbox);
  assert.equal(vm.runInContext('skillModifiers("Esquivar").reduce((sum, mod) => sum + mod.value, 0)', sandbox), -10);
});

test("combines automatic and personalized effective Vigor", () => {
  const { sandbox } = createSandbox();
  vm.runInContext(`state.combat.activeSpells = [
    { id: "forte", spellId: "forte", type: "Forte", name: "Forte", level: 5, turns: 10, maintenanceCost: 0, caBonus: 0, effectiveVigor: 10 }
  ]; state.combat.defenseAdjustments.vigor = 5`, sandbox);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(effectiveVigorInfo())", sandbox)), { automatic: 10, manual: 5, total: 15 });
  assert.equal(vm.runInContext("bodyInfo().total", sandbox), 115);
  vm.runInContext('resetDefenseAdjustment("vigor")', sandbox);
  assert.equal(vm.runInContext("bodyInfo().total", sandbox), 110);
});

test("uses the N6 Fina imbuement as a free action for five PM", () => {
  const { sandbox } = createSandbox();
  vm.runInContext(`
    state.magic.baseLevels.Fina = 6;
    state.resources.pmMaxBonus = 100;
    state.resources.pmCurrent = 20;
    state.combat.actions = { standard: false, bonus: false, movement: false, reaction: false };
    activateFina("base-Fina", "free");
  `, sandbox);
  assert.equal(vm.runInContext("state.resources.pmCurrent", sandbox), 15);
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(state.combat.actions)", sandbox)), { standard: false, bonus: false, movement: false, reaction: false });
  assert.equal(vm.runInContext("state.combat.fissure.magicUsedThisRound", sandbox), true);
});

test("automates Fissura Celeste recovery, damage and scene attunement", () => {
  const { sandbox, elements } = createSandbox();
  elements.combatRollSkill.value = "Atletismo";
  elements.combatTargetCa.value = "0";
  vm.runInContext(`
    state.inventory.weapons = [{ id: "weapon", name: "Espada", damage: "2d6 cortante" }];
    state.inventory.selectedWeaponId = "weapon";
    state.resources.pmMaxBonus = 100;
    state.resources.pmCurrent = 0;
    state.combat.fissure.magicUsedThisRound = true;
    Math.random = () => 0;
    rollCombatTest("normal");
  `, sandbox);
  assert.equal(vm.runInContext("state.resources.pmCurrent", sandbox), 10);
  assert.equal(vm.runInContext("state.combat.fissure.attuned", sandbox), true);
  assert.match(vm.runInContext("state.combat.log.join(' ')", sandbox), /6d6 cortante/);

  vm.runInContext("Math.random = () => 0.01; rollCombatTest('normal')", sandbox);
  assert.equal(vm.runInContext("state.resources.pmCurrent", sandbox), 20);
  assert.equal(vm.runInContext("state.combat.fissure.points", sandbox), 1);
});

test("spends Fissure Points and applies cumulative parry penalties", () => {
  const { sandbox, elements } = createSandbox();
  elements.fissureSpend.value = "8";
  elements.fissureChosenNumber.value = "1";
  elements.parrySkill.value = "Lutar (Brigar)";
  vm.runInContext("state.combat.fissure.points = 8; rollFissureAttempt()", sandbox);
  assert.equal(vm.runInContext("state.combat.fissure.points", sandbox), 0);
  assert.equal(vm.runInContext("state.combat.fissure.prepared", sandbox), true);

  vm.runInContext("prepareParry(); Math.random = () => 0.3; rollParry('normal'); rollParry('normal')", sandbox);
  assert.equal(vm.runInContext("state.combat.actions.bonus", sandbox), false);
  assert.equal(vm.runInContext("state.combat.parry.count", sandbox), 2);
  assert.match(vm.runInContext("state.combat.log.join(' ')", sandbox), /penalidade -5/);
  vm.runInContext("completePassTurn()", sandbox);
  assert.equal(vm.runInContext("state.combat.parry.count", sandbox), 0);
  assert.equal(vm.runInContext("state.combat.fissure.magicUsedThisRound", sandbox), false);
});
