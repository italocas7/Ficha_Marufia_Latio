"use strict";

const fs = require("node:fs");
const path = require("node:path");

const scopeGate = require("./test_scope.cjs");

const root = path.resolve(__dirname, "..");
const REMAINING_PHASES = Object.freeze(Array.from({ length: 21 }, (_, index) => index + 53));
const FUTURE_SCOPE = Object.freeze({
  53: Object.freeze(["Android", "Windows", "não existe projeto"]),
  54: Object.freeze(["iniciativa compartilhada", "ordem de turno", "controle de NPCs", "dano remoto", "condições", "combate sincronizado"]),
  55: Object.freeze(["itens", "magias", "talentos", "criaturas", "regras", "bestiário", "biblioteca de Marufia"]),
  56: Object.freeze(["resumo da sessão", "estatísticas", "rolagens importantes", "alterações de personagens"]),
});
const GOVERNANCE_PHASES = Object.freeze([57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 73]);
const ABSOLUTE_ORDER = Object.freeze([
  "Auditar projeto",
  "Garantir funcionamento atual",
  "Organizar persistência",
  "Preparar Supabase",
  "Autenticação",
  "Campanhas",
  "Personagens",
  "Migração local",
  "Salvamento remoto",
  "Sincronização",
  "Realtime",
  "Rolagens",
  "Painel do Mæstre",
  "Permissões",
  "Offline",
  "Segurança",
  "Testes",
  "Tauri",
  "Executável",
  "Alpha",
]);
const PLAN_DOCUMENTS = Object.freeze([
  "docs/future-roadmap.md",
  "docs/project-governance.md",
  "docs/product-contract.md",
  "docs/master-plan-completion.md",
]);

function read(relative) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

function includesText(source, expected) {
  return source.toLocaleLowerCase("pt-BR").includes(String(expected).toLocaleLowerCase("pt-BR"));
}

function assertFutureRoadmap() {
  const roadmap = read("docs/future-roadmap.md");
  for (const [phase, entries] of Object.entries(FUTURE_SCOPE)) {
    if (!includesText(roadmap, `Fase ${phase}`)) throw new Error(`Reserva da Fase ${phase} ausente.`);
    for (const entry of entries) {
      if (!includesText(roadmap, entry)) throw new Error(`Fase ${phase}: item futuro ausente: ${entry}.`);
    }
  }
  const tauri = JSON.parse(read("src-tauri/tauri.conf.json"));
  if (tauri.build?.frontendDist !== "../dist/client") throw new Error("A ficha web deixou de ser compartilhada com o invólucro Tauri.");
  if (JSON.stringify(tauri.bundle?.targets) !== JSON.stringify(["nsis"])) {
    throw new Error("A Fase 53 não permite adicionar alvo móvel ao build atual.");
  }
  for (const mobileRoot of ["android", "ios"]) {
    if (fs.existsSync(path.join(root, mobileRoot))) throw new Error(`Projeto móvel criado antes da fase própria: ${mobileRoot}/.`);
  }
  scopeGate.assertNoDeferredFootprint();
  return true;
}

function assertGovernance() {
  const governance = read("docs/project-governance.md");
  for (const phase of GOVERNANCE_PHASES) {
    if (!includesText(governance, `Fase ${phase}`)) throw new Error(`Regra da Fase ${phase} ausente.`);
  }
  const agents = read("AGENTS.md");
  for (const contract of [
    "O usuário decide regras de Marufia",
    "Decisões normais de engenharia",
    "diagnostique, tente corrigir e teste novamente",
    "Nunca solicitar em conversa",
    "Antes de uma ação destrutiva",
    "Refatorar somente por motivo concreto",
    "Preservar compatibilidade com fichas antigas",
    "O usuário não é programador",
    "testar cada fase antes de continuar",
  ]) {
    if (!includesText(agents, contract)) throw new Error(`Contrato operacional ausente no AGENTS.md: ${contract}.`);
  }
  if (!governance.includes("FASE X CONCLUÍDA")) throw new Error("Formato breve de relatório da Fase 64 ausente.");
  return true;
}

function assertProductExperience() {
  const contract = read("docs/product-contract.md");
  for (const phase of [67, 68, 69, 70, 71]) {
    if (!includesText(contract, `Fase ${phase}`)) throw new Error(`Contrato de produto da Fase ${phase} ausente.`);
  }
  const packageManifest = JSON.parse(read("package.json"));
  const tauri = JSON.parse(read("src-tauri/tauri.conf.json"));
  const home = read("src/online/home.js");
  const gmPanel = read("src/online/gm_panel.js");
  const liveRolls = read("src/online/live_rolls.js");
  const multiuser = read("tests/js/multiuser_simulation.test.cjs");
  const mvp = read("tests/js/mvp_flow.test.cjs");
  if (!includesText(packageManifest.description, "ficha multiplayer")) throw new Error("Princípio específico do produto ausente.");
  if (tauri.productName !== "Marufia Online" || tauri.bundle?.active !== true) throw new Error("Executável Windows do produto não está configurado.");
  for (const destination of ["Minhas fichas", "Campanhas", "Entrar em campanha", "Continuar na ficha"]) {
    if (!home.includes(destination)) throw new Error(`Jornada do Jogador sem destino: ${destination}.`);
  }
  if (!home.includes("Painel do Mæstre") || !gmPanel.includes("PV") || !liveRolls.includes("Rolagens ao vivo")) {
    throw new Error("Jornada do Mæstre incompleta no produto atual.");
  }
  if (!multiuser.includes("Jogador A") || !multiuser.includes("Jogador B") || !multiuser.includes("Mæstre")) {
    throw new Error("Resultado multiusuário da Fase 67 não está coberto.");
  }
  for (const event of ["criam contas", "cria campanha", "entra", "altera ficha", "rola", "abrem novamente"]) {
    if (!includesText(mvp, event)) throw new Error(`Jornada MVP sem evidência: ${event}.`);
  }
  return true;
}

function assertAbsoluteOrder() {
  if (ABSOLUTE_ORDER.length !== 20 || new Set(ABSOLUTE_ORDER).size !== 20) {
    throw new Error("A ordem absoluta precisa manter vinte etapas únicas.");
  }
  const contract = read("docs/product-contract.md");
  let previous = -1;
  ABSOLUTE_ORDER.forEach((step, index) => {
    const position = contract.indexOf(`${index + 1}. ${step}`);
    if (position <= previous) throw new Error(`Ordem absoluta inválida na etapa ${index + 1}: ${step}.`);
    previous = position;
  });
  return true;
}

function assertInitialAudit() {
  const completion = read("docs/master-plan-completion.md");
  const state = read("src/core/state.js");
  const app = read("app.js");
  const server = read("server/index.js");
  const manifest = JSON.parse(read("package.json"));
  if (!completion.includes("1017ccd") || !completion.includes("marufia-offline-baseline-v2.0.0")) {
    throw new Error("Evidência do baseline da Fase 72 ausente.");
  }
  if (!/currentVersion:\s*5/.test(state)) throw new Error("A auditoria deixou de encontrar o schema v5.");
  if (!/setTimeout\(saveStateNow,\s*250\)/.test(app)) throw new Error("A auditoria deixou de encontrar o debounce local de 250 ms.");
  if (!server.includes("env.ASSETS.fetch")) throw new Error("O servidor estático auditado não foi preservado.");
  if (manifest.packageManager !== "pnpm@11.19.0") throw new Error("Ambiente de testes fixado deixou de ser reconhecido.");
  return true;
}

function assertAllRemainingPhases() {
  if (REMAINING_PHASES[0] !== 53 || REMAINING_PHASES.at(-1) !== 73 || REMAINING_PHASES.length !== 21) {
    throw new Error("O fechamento precisa cobrir todas as fases de 53 a 73.");
  }
  const documents = PLAN_DOCUMENTS.map(read).join("\n");
  for (const phase of REMAINING_PHASES) {
    if (!includesText(documents, `Fase ${phase}`)) throw new Error(`Fase restante sem registro: ${phase}.`);
  }
  return true;
}

function main() {
  assertFutureRoadmap();
  assertGovernance();
  assertProductExperience();
  assertAbsoluteOrder();
  assertInitialAudit();
  assertAllRemainingPhases();
  process.stdout.write("Fases 53–56: reservas futuras preservadas sem implementação.\n");
  process.stdout.write("Fases 57–66: governança incorporada ao projeto.\n");
  process.stdout.write("Fases 67–71: experiências e ordem do produto verificadas.\n");
  process.stdout.write("Fases 72–73: auditoria inicial e regra final registradas.\n");
  process.stdout.write("Plano mestre concluído da Fase 53 à Fase 73.\n");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error?.message ?? error);
    process.exitCode = 1;
  }
}

module.exports = Object.freeze({
  ABSOLUTE_ORDER,
  FUTURE_SCOPE,
  GOVERNANCE_PHASES,
  PLAN_DOCUMENTS,
  REMAINING_PHASES,
  assertAbsoluteOrder,
  assertAllRemainingPhases,
  assertFutureRoadmap,
  assertGovernance,
  assertInitialAudit,
  assertProductExperience,
  main,
});
