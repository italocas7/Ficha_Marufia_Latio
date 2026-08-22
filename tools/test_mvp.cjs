"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const MVP_FLOW_TEST = "tests/js/mvp_flow.test.cjs";
const MVP_CRITERIA = Object.freeze([
  "Mæstre cria conta, campanha e recebe o código",
  "Jogador cria conta, usa o código e entra",
  "Jogador cria ou importa um personagem",
  "Alteração e rolagem do Jogador chegam ao Mæstre",
  "Alteração de PV do Mæstre chega ao Jogador",
  "Após fechar e abrir, todos os dados continuam salvos",
]);

function assertMvpDefinition() {
  if (MVP_CRITERIA.length !== 6 || new Set(MVP_CRITERIA).size !== 6) {
    throw new Error("A definição do MVP precisa manter os seis critérios da Fase 51.");
  }
  if (!fs.statSync(path.join(root, MVP_FLOW_TEST), { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Teste do fluxo MVP ausente: ${MVP_FLOW_TEST}.`);
  }
  return true;
}

function run(args, label) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(process.execPath, args, { cwd: root, env: process.env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} reprovado com código ${result.status}.`);
}

function main() {
  assertMvpDefinition();
  process.stdout.write("Definição do MVP do Marufia Online:\n");
  MVP_CRITERIA.forEach((criterion, index) => process.stdout.write(`${index + 1}. ${criterion}\n`));
  run(["tools/check_version.cjs"], "Versão Alpha");
  run(["--test", MVP_FLOW_TEST, "tests/js/multiuser_simulation.test.cjs"], "Fluxo MVP completo");
  process.stdout.write("\nMVP da Fase 51 aprovado nos seis critérios obrigatórios.\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  }
}

module.exports = Object.freeze({ MVP_CRITERIA, MVP_FLOW_TEST, assertMvpDefinition, main });
