const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..", "..");

function importer() {
  const sandbox = { window: {}, console, Uint8Array };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, "pdf_import.js"), "utf8"), sandbox, { filename: "pdf_import.js" });
  return sandbox.window.MARUFIA_PDF_IMPORTER;
}

test("merges PDF form and visible text with form precedence", () => {
  const api = importer();
  const form = { character: { name: "Nome do formulário", age: "" }, attributes: { FOR: 60 }, skills: {}, notes: {}, inventory: { weapons: [], equipment: [] } };
  const text = { character: { name: "Nome visível", age: "22" }, attributes: { FOR: 55 }, skills: {}, notes: {}, inventory: { weapons: [], equipment: [] } };
  const merged = api.mergePdfData(form, text);
  assert.equal(merged.data.character.name, "Nome do formulário");
  assert.equal(merged.data.character.age, "22");
  assert.equal(JSON.stringify(merged.conflicts.map((item) => item.path)), JSON.stringify(["character.name", "attributes.FOR"]));
  assert.equal(JSON.stringify(merged.conflicts.map((item) => item.label)), JSON.stringify(["Nome do personagem", "Força (FOR)"]));
  assert.equal(api.countImportedValues(merged.data), 3);
});

test("uses friendly import labels and converts Escalar to Atletismo", () => {
  const api = importer();
  assert.equal(api.importFieldLabel("resources.pmCurrent"), "Pontos de Magia atuais");
  assert.equal(api.importFieldLabel("skills.Atletismo"), "Perícia: Atletismo");
  assert.equal(api.importedSkillName("Escalar", { skills: [{ name: "Atletismo" }] }), "Atletismo");
});

test("falls back to visible text when recognized form fields are empty", async () => {
  const api = importer();
  const page = {
    async getAnnotations() { return []; },
    async getTextContent() {
      return { items: [{ str: "PERSONAGEM Teste ATRIBUTOS FOR: 50 PERICIAS ANTECEDENTES" }] };
    },
  };
  const pdf = {
    numPages: 1,
    async getFieldObjects() {
      return { Nome: [{ value: "" }], "For.Atr": [{ value: "" }], "HP MAX": [{ value: "" }] };
    },
    async getPage() { return page; },
  };
  const result = await api.importFromPdf({ async arrayBuffer() { return new ArrayBuffer(8); } }, {
    pdfjsLib: { getDocument() { return { promise: Promise.resolve(pdf) }; } },
    db: { skills: [] },
  });
  assert.equal(result.recognized, true);
  assert.equal(result.source, "text");
  assert.ok(result.importedValueCount > 0);
});
