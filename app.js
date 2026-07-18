const DB = window.MARUFIA_DB;
const ITEM_DESCRIPTIONS = window.MARUFIA_ITEM_DESCRIPTIONS ?? {};
const MAGIC_CORES = window.MARUFIA_MAGIC_CORES ?? [];
const STATE_TOOLS = window.LATIO_STATE;
const RULES = window.LATIO_RULES;
const STORAGE_KEY = "marufia-latio-state-v1";
const BACKUP_STORAGE_KEY = "marufia-latio-backups-v1";
const APP_ID = "marufia-latio";
const STATE_SCHEMA_VERSION = 5;
const APP_BASE_URL = new URL(".", document.currentScript?.src || window.location.href).href;
const MAGIC_TYPES = ["Fina", "Impacto", "Densa", "Mundo", "Forte", "Etérea"];
const TABS = [
  ["resumo", "Resumo"],
  ["combate", "Combate"],
  ["magia", "Magia"],
  ["inventario", "Inventário"],
  ["pt", "P&T"],
  ["mundo", "Mundo"],
  ["antecedentes", "Antecedentes"],
];

const ERROR_CATALOG = Object.fromEntries([
  ["LAT-INI-001", ["Inicialização", "CRÍTICO", "Não foi possível carregar a ficha.", "Falha ao iniciar componentes principais da interface.", "Recarregar a página ou restaurar backup JSON."]],
  ["LAT-INI-002", ["Inicialização", "ERRO", "Algumas abas não foram carregadas corretamente.", "Falha ao montar um ou mais componentes de aba.", "Verificar console e Log de Erros."]],
  ["LAT-INI-003", ["Inicialização", "AVISO", "Algumas informações oficiais ainda não foram cadastradas na base de dados.", "Banco interno possui campos pendentes.", "Inserir dados oficiais do Manual, TALENTOS.DOCX ou Book."]],
  ["LAT-PDF-001", ["Importação PDF", "ERRO", "Não foi possível ler o PDF importado.", "Biblioteca PDF.js não carregou, foi bloqueada pelo navegador ou o arquivo selecionado não pôde ser aberto.", "Reabrir a ficha e tentar novamente. Se estiver usando index.html direto, manter a pasta vendor junto da ficha."]],
  ["LAT-PDF-002", ["Importação PDF", "AVISO", "Algumas informações da ficha antiga não foram encontradas.", "Campos obrigatórios não identificados no texto do PDF.", "Mostrar lista de campos faltantes e permitir correção manual."]],
  ["LAT-PDF-003", ["Importação PDF", "AVISO", "Alguns valores importados parecem ambíguos.", "O mesmo campo foi detectado com mais de um valor possível.", "Abrir tela de revisão para o usuário escolher o valor correto."]],
  ["LAT-PDF-004", ["Importação PDF", "ERRO", "O PDF não parece ser uma Ficha Marufia Automática.", "Palavras-chave principais não foram encontradas.", "Solicitar outro arquivo ou permitir criação do zero."]],
  ["LAT-JSON-001", ["Importação JSON", "ERRO", "O JSON importado é inválido.", "Erro de sintaxe no JSON.", "Validar o JSON antes de importar."]],
  ["LAT-JSON-002", ["Importação JSON", "ERRO", "O JSON não pertence à Ficha de Marufia (Latio).", "Campo de identificação ou versão ausente.", "Usar apenas arquivos exportados pela ficha."]],
  ["LAT-JSON-003", ["Importação JSON", "AVISO", "O JSON é de uma versão antiga da ficha.", "Versão do schema diferente da versão atual.", "Tentar migração automática e avisar o usuário."]],
  ["LAT-JSON-004", ["Exportação JSON", "ERRO", "Não foi possível exportar a ficha.", "Falha ao serializar dados.", "Verificar campos inválidos ou dados circulares."]],
  ["LAT-DB-001", ["Banco de Dados", "CRÍTICO", "A base de dados principal não foi encontrada.", "Arquivo ou objeto de dados ausente.", "Carregar base JSON oficial."]],
  ["LAT-DB-002", ["Banco de Dados", "ERRO", "Dados de região não encontrados.", "Região selecionada não existe na base.", "Conferir cadastro das regiões."]],
  ["LAT-DB-003", ["Banco de Dados", "ERRO", "Dados de cultura não encontrados.", "Cultura selecionada não existe na base.", "Conferir cadastro das culturas."]],
  ["LAT-DB-004", ["Banco de Dados", "AVISO", "Este talento ainda não possui regra automática cadastrada.", "Talento existe, mas não possui modificador automatizado.", "Marcar como Ativável/Condicionável ou cadastrar efeito."]],
  ["LAT-DB-005", ["Banco de Dados", "AVISO", "Esta magia ainda está pendente de dados oficiais.", "Card de magia usa marcador provisório.", "Inserir dados oficiais da magia."]],
  ["LAT-CALC-001", ["Cálculos", "ERRO", "Não foi possível calcular a CA.", "Valor base, armadura ou modificador inválido.", "Revisar atributos, equipamentos e efeitos temporários."]],
  ["LAT-CALC-002", ["Cálculos", "ERRO", "Não foi possível calcular a Vida Máxima.", "Atributos necessários ausentes ou inválidos.", "Preencher atributos obrigatórios."]],
  ["LAT-CALC-003", ["Cálculos", "ERRO", "Não foi possível calcular os Pontos de Magia.", "Dados de magia ou atributo base ausentes.", "Revisar atributos e aptidões."]],
  ["LAT-CALC-004", ["Cálculos", "AVISO", "Uma perícia ultrapassou o limite configurado.", "Valor final maior que o limite de perícia.", "Alertar usuário e destacar perícia."]],
  ["LAT-CALC-005", ["Cálculos", "ERRO", "Modificador inválido detectado.", "Um bônus ou penalidade não possui valor numérico válido.", "Ignorar modificador inválido e registrar no log."]],
  ["LAT-MAG-001", ["Magia", "ERRO", "Aptidões insuficientes para evoluir esta magia.", "Custo maior que pontos disponíveis.", "Bloquear evolução."]],
  ["LAT-MAG-002", ["Magia", "ERRO", "Tipo de magia inválido.", "Tipo não corresponde a Fina, Impacto, Densa, Mundo, Forte ou Etérea.", "Corrigir seleção."]],
  ["LAT-MAG-003", ["Magia", "AVISO", "A região escolhida não possui magia regional para este tipo.", "Busca regional retornou vazia.", "Usar magia base."]],
  ["LAT-MAG-004", ["Magia", "ERRO", "Não foi possível adicionar Magia Extra.", "Tipo ou região ausente.", "Exigir seleção completa."]],
  ["LAT-MAG-005", ["Magia", "INFO", "A aba Mundo foi desbloqueada.", "Aptidão em Mundo maior que zero.", "Nenhuma."]],
  ["LAT-MUN-002", ["Mundo", "ERRO", "Não foi possível abrir o Mundo.", "Falta ação completa ou custo necessário.", "Verificar ações e recursos."]],
  ["LAT-MUN-003", ["Mundo", "ERRO", "Lei do Mundo inválida.", "Categoria, tipo, alvo, resistência ou efeito ausente.", "Revisar dados da Lei."]],
  ["LAT-MUN-004", ["Mundo", "AVISO", "Esta Lei foi editada manualmente.", "Valor original do Book foi sobrescrito pelo usuário.", "Registrar alteração no histórico interno."]],
  ["LAT-MUN-005", ["Mundo", "ERRO", "Dados do arquivo Book não encontrados.", "Base de Leis não carregada.", "Importar ou cadastrar dados do Book."]],
  ["LAT-INV-001", ["Inventário", "ERRO", "Não foi possível adicionar a arma.", "Arma sem nome, dano ou tipo.", "Validar campos obrigatórios."]],
  ["LAT-INV-002", ["Inventário", "ERRO", "Não foi possível adicionar equipamento.", "Equipamento sem nome ou categoria.", "Validar campos obrigatórios."]],
  ["LAT-INV-003", ["Inventário", "AVISO", "A cultura atual não possui arma cultural cadastrada.", "Lista de armas culturais vazia.", "Conferir dados culturais."]],
  ["LAT-INV-004", ["Inventário", "AVISO", "Habilidade da arma foi adicionada às Habilidades Extras.", "Sincronização realizada entre Inventário e P&T.", "Nenhuma."]],
  ["LAT-PT-001", ["P&T", "ERRO", "Perícia inválida.", "Perícia não existe na base.", "Conferir lista de perícias."]],
  ["LAT-PT-002", ["P&T", "ERRO", "Pontos de Perícia insuficientes.", "Pontos adicionados excedem pontos disponíveis.", "Bloquear alteração ou pedir confirmação."]],
  ["LAT-PT-003", ["P&T", "AVISO", "Nenhuma perícia marcada para evolução.", "Botão Evoluir acionado sem check ativo.", "Pedir seleção de perícia."]],
  ["LAT-PT-004", ["P&T", "ERRO", "Valor de evolução inválido.", "Valor fora do intervalo 0 a 10.", "Limitar entrada ao intervalo permitido."]],
  ["LAT-PT-005", ["P&T", "AVISO", "Talento ativável está desligado.", "Bônus condicional não aplicado.", "Permitir ativação manual."]],
  ["LAT-PT-006", ["P&T", "AVISO", "Talento sem automação completa.", "Descrição existe, mas regra não foi traduzida em cálculo.", "Marcar como Ativável/Condicionável."]],
  ["LAT-UI-001", ["Interface", "ERRO", "Não foi possível abrir a janela solicitada.", "Componente modal não encontrado.", "Recriar componente ou recarregar página."]],
  ["LAT-UI-002", ["Interface", "AVISO", "Campo obrigatório vazio.", "Validação de formulário falhou.", "Destacar campo obrigatório."]],
  ["LAT-UI-003", ["Interface", "AVISO", "Alteração não salva.", "Falha ao persistir dados no armazenamento local.", "Tentar salvar novamente ou exportar JSON."]],
  ["LAT-PRINT-001", ["Impressão/PDF", "ERRO", "Não foi possível gerar a versão para impressão.", "Falha ao montar layout impresso.", "Gerar versão simplificada ou exportar JSON."]],
  ["LAT-PRINT-002", ["Impressão/PDF", "AVISO", "Algumas áreas longas podem ser cortadas na impressão.", "Texto maior que o espaço reservado.", "Usar quebra de página ou layout expandido."]],
].map(([code, [module, severity, userMessage, technicalDetail, suggestedSolution]]) => [code, { code, module, severity, userMessage, technicalDetail, suggestedSolution }]));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, num(value, min)));
const compact = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const fold = (value) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const databaseStartupError = !RULES ? "O módulo de regras não foi carregado." : validateRuntimeDatabase(DB);
let sessionUi = createDefaultSessionUi();
let state = databaseStartupError ? null : loadState();
let previousWorldUnlocked = databaseStartupError ? false : worldUnlocked();
let pdfLibraryPromise = null;
let pendingImport = null;
let saveTimer = null;
let saveInProgress = false;
let storageFailureRecorded = false;
let modalReturnFocus = null;
let controlSerial = 0;

async function getPdfLibrary() {
  if (!pdfLibraryPromise) {
    pdfLibraryPromise = loadPdfLibrary().catch((error) => {
      pdfLibraryPromise = null;
      throw error;
    });
  }
  return pdfLibraryPromise;
}

async function loadPdfLibrary() {
  if (window.location.protocol === "file:") return loadLocalPdfLibrary();
  try {
    return await loadModulePdfLibrary();
  } catch (moduleError) {
    try {
      return await loadLocalPdfLibrary();
    } catch (localError) {
      throw new Error(`Falha ao carregar PDF.js. Módulo: ${errorMessage(moduleError)}. Fallback local: ${errorMessage(localError)}.`);
    }
  }
}

async function loadModulePdfLibrary() {
  const pdfUrl = new URL("vendor/pdf.min.mjs", APP_BASE_URL).href;
  const module = await import(pdfUrl);
  module.GlobalWorkerOptions.workerSrc = new URL("vendor/pdf.worker.min.mjs", APP_BASE_URL).href;
  return module;
}

async function loadLocalPdfLibrary() {
  if (!window.MARUFIA_PDF_JS?.load) throw new Error("Carregador local PDF.js nao encontrado.");
  const module = await window.MARUFIA_PDF_JS.load();
  if (!module?.getDocument) throw new Error("Carregador local PDF.js retornou uma biblioteca invalida.");
  return module;
}

function errorMessage(error) {
  return error?.message || String(error || "erro desconhecido");
}

function validateRuntimeDatabase(database) {
  if (!database || !Array.isArray(database.skills) || !Array.isArray(database.regions) || !Array.isArray(database.baseSpells)) {
    return "A base principal está ausente ou incompleta.";
  }
  if (!database.skills.some((skill) => skill.name === "Percepção" && num(skill.base, 0) === 15)) {
    return "A perícia Percepção não foi encontrada na base oficial.";
  }
  return "";
}

function createDefaultSessionUi() {
  return { activeTab: "resumo", printMode: false, extraMagicType: "Fina", extraMagicRegion: "Sem Região", showExtraMagic: false, lawCategory: "Ofensivo", lawResistanceMode: "sem", lawId: "", coreRestHours: 1, evolveSkill: "" };
}

function createDefaultState() {
  const skillState = {};
  for (const skill of DB.skills) skillState[skill.name] = { added: 0, checked: false, evolutions: [] };
  return {
    meta: {
      appId: APP_ID,
      appName: "Ficha de Marufia (Latio)",
      schemaVersion: STATE_SCHEMA_VERSION,
      started: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importedFromPdf: null,
    },
    character: {
      name: "",
      age: "",
      gender: "",
      birth: "",
      level: 1,
      regionCode: "",
      cultureId: "",
      backgroundFamilyId: "",
      backgroundPersonalId: "",
      useIntForSkillPoints: false,
    },
    attributes: { FOR: 50, DES: 50, CON: 50, APA: 50, POD: 50, INT: 50, CAR: 50, SAB: 50 },
    resources: { hpCurrent: null, pmCurrent: null, hpMaxBonus: 0, pmMaxBonus: 0, injury: false, unconscious: false, dying: false, deathSuccess: 0, deathFail: 0 },
    settings: { theme: "light", skillLimit: 70, gmOverride: false },
    skills: skillState,
    skillExtraPoints: 0,
    effects: [],
    inventory: { money: { X: 0, D: 0, L: 0 }, patrimonio: "", weapons: [], equipment: [], armorId: "", customArmors: [], shield: false, selectedWeaponId: "" },
    magic: { extraAptitudes: 0, baseLevels: Object.fromEntries(MAGIC_TYPES.map((type) => [type, 0])), knownExtras: [] },
    magicCore: { selectedId: "", preparedBoost: "", caBoostTurns: 0 },
    combat: { actions: { standard: true, bonus: true, movement: true, reaction: true }, log: [], activeSpells: [], defenseAdjustments: { ca: 0, block: 0 } },
    talents: [],
    abilities: [],
    world: { name: "", phrase: "", description: "", status: "closed", durationTurns: null, maintenancePaidForTurn: false, lawUses: null, laws: [], narrative: "" },
    notes: {
      traits: "", ideal: "", flaws: "", bonds: "", eyes: "", age: "", height: "", hair: "", skin: "", weight: "",
      appearance: "", history: "", allies: "", patron: "", other: "",
    },
    errors: [],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw);
    if (parsed?.meta?.appId !== APP_ID) return createDefaultState();
    return prepareStateImport(parsed).state;
  } catch (error) {
    const fallback = createDefaultState();
    fallback.errors.push(makeError("LAT-INI-001", error.message));
    return fallback;
  }
}

function stateToolOptions() {
  return { appId: APP_ID, schemaVersion: STATE_SCHEMA_VERSION };
}

function prepareStateImport(raw) {
  if (!STATE_TOOLS?.prepareImport) throw new Error("Módulo de validação do estado não foi carregado.");
  return STATE_TOOLS.prepareImport(raw, createDefaultState(), stateToolOptions());
}

function normalizeState(nextState) {
  if (nextState.magicCore) delete nextState.magicCore.dailyActive;
  return STATE_TOOLS.normalizeDomain(nextState, APP_ID, STATE_SCHEMA_VERSION);
}

function persistentPayload() {
  return STATE_TOOLS.persistentPayload(state);
}

function persistentSignature() {
  return JSON.stringify(persistentPayload());
}

function recordStorageFailure(error) {
  if (storageFailureRecorded || !state) return;
  storageFailureRecorded = true;
  const item = makeError("LAT-UI-003", errorMessage(error));
  state.errors.unshift(item);
  state.errors = state.errors.slice(0, 120);
  toast(`${item.code}: ${item.userMessage}`, "warn");
}

function saveStateNow() {
  if (!state || saveInProgress) return false;
  saveInProgress = true;
  try {
    state.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentPayload()));
    storageFailureRecorded = false;
    return true;
  } catch (error) {
    recordStorageFailure(error);
    return false;
  } finally {
    saveInProgress = false;
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveStateNow, 250);
}

function makeError(code, detail = "") {
  const base = ERROR_CATALOG[code] ?? {
    code,
    module: "Sistema",
    severity: "ERRO",
    userMessage: "Erro não catalogado.",
    technicalDetail: "Código não encontrado no catálogo.",
    suggestedSolution: "Registrar o erro no protocolo interno.",
  };
  return { ...base, technicalDetail: detail ? `${base.technicalDetail} ${detail}` : base.technicalDetail, at: new Date().toISOString() };
}

function addError(code, detail = "", show = true, persist = true) {
  const error = makeError(code, detail);
  state.errors.unshift(error);
  state.errors = state.errors.slice(0, 120);
  if (show) toast(`${error.code}: ${error.userMessage}`, error.severity === "ERRO" || error.severity === "CRÍTICO" ? "danger" : "warn");
  if (persist) scheduleSave();
  return error;
}

function toast(message, kind = "") {
  const root = $("#toastRoot");
  const node = document.createElement("div");
  node.className = `toast ${kind}`;
  node.textContent = message;
  root.appendChild(node);
  setTimeout(() => node.remove(), 4200);
}

function getPath(path) {
  const root = path.startsWith("ui.") ? sessionUi : state;
  const normalized = path.startsWith("ui.") ? path.slice(3) : path;
  return normalized.split(".").reduce((acc, key) => acc?.[key], root);
}

function setPath(path, value) {
  const sessionPath = path.startsWith("ui.");
  const parts = (sessionPath ? path.slice(3) : path).split(".");
  let target = sessionPath ? sessionUi : state;
  while (parts.length > 1) target = target[parts.shift()];
  target[parts[0]] = value;
}

function allCultures() {
  return DB.regions.flatMap((region) => region.cultures);
}

function getRegion(code = state.character.regionCode) {
  return DB.regions.find((region) => region.code === code);
}

function getCulture(id = state.character.cultureId) {
  return allCultures().find((culture) => culture.id === id);
}

function getFamilyBackground(id = state.character.backgroundFamilyId) {
  return DB.backgrounds.family.find((item) => item.id === id);
}

function getPersonalBackground(id = state.character.backgroundPersonalId) {
  return DB.backgrounds.personal.find((item) => item.id === id);
}

function getSpell(type, regionCode = state.character.regionCode) {
  if (regionCode && regionCode !== "Sem Região") {
    const region = getRegion(regionCode);
    const regional = region?.magics.find((magic) => magic.baseType === type);
    if (regional) return regional;
  }
  return DB.baseSpells.find((spell) => spell.baseType === type);
}

function normalizeSkillName(name = "") {
  const clean = name.trim().replace(/\s+/g, " ");
  const map = {
    "Brigar": "Lutar (Brigar)",
    "Lutar (Cult.)": "Lutar (Culturais)",
    "Lutar (Cultural)": "Lutar (Culturais)",
    "Lutar (Arma Curta)": "Lutar (Armas Curtas)",
    "Lutar (Armas Longa)": "Lutar (Armas Longas)",
    "Conta.": "Contabilidade",
    "Sobrev.": "Sobrevivência",
    "Presti.": "Prestidigitação",
    "L. Animais": "Lidar com Animais",
    "Perícias sociais": "Charme",
  };
  return map[clean] ?? clean;
}

function isAttackSkill(skillName) {
  return ["Arremessar", "Lutar (Armas Curtas)", "Lutar (Armas de Arremesso)", "Lutar (Armas de Haste)", "Lutar (Armas Longas)", "Lutar (Brigar)", "Lutar (Culturais)"].includes(normalizeSkillName(skillName));
}

function conditionalAttackMod(talent, skillName) {
  if (!isAttackSkill(skillName)) return 0;
  return num(talent.conditionalMods?.attackMod, 0);
}

function conditionalCaMod(talent) {
  return num(talent.conditionalMods?.acMod, 0);
}

function currentCore(source = state) {
  return MAGIC_CORES.find((core) => core.id === source.magicCore?.selectedId);
}

function hasCore(id, source = state) {
  return source.magicCore?.selectedId === id;
}

function coreOptions() {
  return MAGIC_CORES.map((core) => [core.id, core.name]);
}

function isCoreEffectActive(id = state.magicCore?.selectedId, source = state) {
  return Boolean(id && source.magicCore?.selectedId === id);
}

function corePermanentPmPenalty(source = state) {
  return num(currentCore(source)?.permanentPmPenalty, 0);
}

function coreCaBonus(source = state) {
  if (hasCore("antebraco", source)) return num(source.magicCore.caBoostTurns, 0) > 0 ? 10 : 5;
  return 0;
}

function magicCostAfterCore(amount) {
  return RULES.magicCost(amount, hasCore("coracao"));
}

function attr(name, source = state) {
  let value = num(source.attributes[name], 0);
  if (name === "CON" && hasCore("amago", source)) value += 10;
  for (const talent of activeTalents(source)) value += num(talent.attributeMods?.[name], 0);
  for (const talent of enabledConditionalTalents(source)) value += num(talent.conditionalMods?.attributeMods?.[name], 0);
  return value;
}

function normalizedRuleText(value) {
  return compact(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
}

function explicitForteCa(text) {
  const match = normalizedRuleText(text).match(/\bAUMENTA(?:\s+(?:SUA|A))?\s+CA\s+EM\s+\+?(\d+)/);
  return match ? num(match[1], 0) : null;
}

function explicitEffectiveVigor(text) {
  const normalized = normalizedRuleText(text);
  const vigor = "VIGOR\\s+(?:EFETIVO|FISICO)";
  const patterns = [
    new RegExp(`(?:RECEBE|GANHA)\\s+\\+?(\\d+)\\s+(?:DE\\s+)?${vigor}`),
    new RegExp(`${vigor}\\s*\\+?(\\d+)`),
    new RegExp(`${vigor}[^.]{0,40}?(?:AUMENTA\\s+PARA|PERMANECE(?:\\s+EM)?|PASSA\\s+A\\s+SER)\\s*\\+?(\\d+)`),
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return num(match[1], 0);
  }
  return null;
}

function forteBonusesForItem(item) {
  if (!item || item.type !== "Forte" || !item.spell) return { ca: 0, vigor: 0 };
  let ca = 0;
  let vigor = 0;
  for (const entry of normalizedSpellLevels(item.spell).filter((level) => level.level <= num(item.level, 0))) {
    const nextCa = explicitForteCa(entry.text);
    const nextVigor = explicitEffectiveVigor(entry.text);
    if (nextCa !== null) ca = nextCa;
    if (nextVigor !== null) vigor = nextVigor;
  }
  return { ca, vigor };
}

function spellItemForActive(active, source = state) {
  if (!active || active.type !== "Forte") return null;
  if (String(active.spellId).startsWith("base-")) {
    return { id: active.spellId, type: "Forte", level: active.level, spell: getSpell("Forte", source.character?.regionCode) };
  }
  const known = source.magic?.knownExtras?.find((spell) => spell.id === active.spellId);
  return known ? { ...known, spell: getSpell(known.type, known.regionCode) } : null;
}

function activeForteBonuses(source = state) {
  return (source.combat?.activeSpells ?? []).filter((spell) => spell.type === "Forte").reduce((total, spell) => {
    const fallback = forteBonusesForItem(spellItemForActive(spell, source));
    total.ca += Object.hasOwn(spell, "caBonus") ? num(spell.caBonus, 0) : fallback.ca;
    total.vigor += Object.hasOwn(spell, "effectiveVigor") ? num(spell.effectiveVigor, 0) : fallback.vigor;
    return total;
  }, { ca: 0, vigor: 0 });
}

function bodyInfo(source = state) {
  const vigor = activeForteBonuses(source).vigor;
  const total = attr("FOR", source) + attr("CON", source) + vigor;
  const row = DB.bodyTable.find((entry) => total >= entry.min && total <= entry.max) ?? DB.bodyTable.at(-1);
  return { ...row, total, vigor };
}

function baseSkillValue(skill, source = state) {
  if (String(skill.base).includes("DES")) return Math.floor(attr("DES", source) / 2);
  return num(skill.base, 0);
}

function knownTalents(source = state) {
  return source.talents.map((known) => {
    const base = DB.talents.find((talent) => talent.name === known.name) ?? {};
    return { ...base, ...known };
  });
}

function activeTalents(source = state) {
  return knownTalents(source);
}

function enabledConditionalTalents(source = state) {
  return knownTalents(source).filter((talent) => ["conditional", "mixed"].includes(talent.mode) && talent.enabled);
}

function allKnownTalents() {
  return knownTalents(state);
}

function skillModifiers(skillName, source = state) {
  const normalized = normalizeSkillName(skillName);
  const mods = [];
  const pushMods = (list, source) => {
    for (const mod of list ?? []) {
      const target = normalizeSkillName(mod.skill);
      if (target === normalized) mods.push({ source, value: num(mod.value), detail: `${source}: ${mod.value > 0 ? "+" : ""}${mod.value}` });
    }
  };
  const culture = getCulture(source.character.cultureId);
  pushMods(culture?.skillBonuses, `Cultura: ${culture?.name}`);
  pushMods(culture?.weaknessBonuses, `Fraqueza: ${culture?.name}`);
  const family = getFamilyBackground(source.character.backgroundFamilyId);
  const personal = getPersonalBackground(source.character.backgroundPersonalId);
  pushMods(family?.bonuses, `A. Familiar: ${family?.name}`);
  pushMods(personal?.bonuses, `A. Pessoal: ${personal?.name}`);
  for (const talent of activeTalents(source)) pushMods(talent.skillMods, `Talento: ${talent.name}`);
  for (const talent of enabledConditionalTalents(source)) {
    pushMods(talent.conditionalMods?.skillMods, `Talento ativo: ${talent.name}`);
    const attackValue = conditionalAttackMod(talent, normalized);
    if (attackValue) mods.push({ source: `Talento: ${talent.name}`, value: attackValue, detail: `${talent.name}: ${attackValue > 0 ? "+" : ""}${attackValue} em todos os ataques` });
  }
  if (normalized === "Percepção" && isCoreEffectActive("olhos", source)) {
    mods.push({ source: "Núcleo: Olhos", value: 50, detail: "Olhos: +50 em Percepção" });
  }
  if (normalized === "Percepção" && isCoreEffectActive("garganta", source)) {
    mods.push({ source: "Núcleo: Garganta", value: 25, detail: "Garganta: +25 em Percepção" });
  }
  const skillState = source.skills[skillName];
  for (const evo of skillState?.evolutions ?? []) mods.push({ source: "Evolução", value: num(evo.value), detail: `Evolução: +${evo.value}` });
  return mods.filter((mod) => Number.isFinite(mod.value));
}

function skillFinal(skillName, source = state) {
  const skill = DB.skills.find((item) => item.name === skillName);
  if (!skill) return 0;
  const added = num(source.skills[skillName]?.added, 0);
  return baseSkillValue(skill, source) + added + skillModifiers(skillName, source).reduce((sum, mod) => sum + mod.value, 0);
}

function skillPointsTotal() {
  const mental = state.character.useIntForSkillPoints ? attr("INT") : attr("SAB");
  return (mental + attr("CON")) * 2 + num(state.skillExtraPoints, 0);
}

function skillPointsSpent() {
  return DB.skills.reduce((sum, skill) => sum + num(state.skills[skill.name]?.added, 0), 0);
}

function skillAllocationValidation(skillName) {
  return RULES.validateSkillAllocation({
    finalValue: skillFinal(skillName),
    limit: state.settings.skillLimit,
    spent: skillPointsSpent(),
    budget: skillPointsTotal(),
    gmOverride: state.settings.gmOverride,
  });
}

function rejectInvalidSkillAllocation(skillName, previousValue, target) {
  const result = skillAllocationValidation(skillName);
  if (result.valid) return false;
  state.skills[skillName].added = previousValue;
  if (target) target.value = previousValue;
  if (result.reason === "limit") addError("LAT-CALC-004", `${skillName}: limite ${state.settings.skillLimit}.`);
  else addError("LAT-PT-002", `${skillName}: ${skillPointsSpent()}/${skillPointsTotal()} pontos.`);
  return true;
}

function sheetSkillValidationIssue() {
  if (state.settings.gmOverride) return null;
  if (skillPointsSpent() > skillPointsTotal()) return { reason: "budget", detail: `${skillPointsSpent()}/${skillPointsTotal()} pontos.` };
  const skill = DB.skills.find((item) => skillFinal(item.name) > num(state.settings.skillLimit, 70));
  return skill ? { reason: "limit", detail: `${skill.name}: limite ${state.settings.skillLimit}.` } : null;
}

function aptitudeBaseCost(type) {
  return RULES.aptitudeBaseCost(type);
}

function aptitudeCost(type, level) {
  return RULES.aptitudeCost(type, level);
}

function aptitudeUpgradeCost(type, fromLevel, toLevel = fromLevel + 1, options = {}) {
  return RULES.aptitudeUpgradeCost(type, fromLevel, toLevel, Boolean(options.freeFirstLevel));
}

function spellCostTotal(type, level, options = {}) {
  return RULES.spellAptitudeCost(type, level, Boolean(options.freeFirstLevel));
}

function extraSpellUpgradeCost(type, fromLevel, toLevel = fromLevel + 1) {
  return aptitudeUpgradeCost(type, fromLevel, toLevel, { freeFirstLevel: true });
}

function extraSpellCostTotal(type, level) {
  let total = 0;
  for (let current = 1; current <= level; current += 1) total += extraSpellUpgradeCost(type, current - 1, current);
  return total;
}

function aptitudeTotal() {
  const level = Math.max(1, num(state.character.level, 1));
  return Math.floor(attr("POD") / 7) + (level * 3) + num(state.magic.extraAptitudes, 0) + (hasCore("amago") ? level : 0);
}

function aptitudeSpent() {
  let total = 0;
  for (const type of MAGIC_TYPES) total += spellCostTotal(type, num(state.magic.baseLevels[type], 0));
  for (const spell of state.magic.knownExtras) total += extraSpellCostTotal(spell.type, num(spell.level, 0));
  return total;
}

function worldUnlocked() {
  return num(state.magic.baseLevels.Mundo, 0) > 0 || state.magic.knownExtras.some((spell) => spell.type === "Mundo" && num(spell.level, 0) > 0);
}

function worldLevel() {
  return Math.max(num(state.magic.baseLevels.Mundo, 0), ...state.magic.knownExtras.filter((spell) => spell.type === "Mundo").map((spell) => num(spell.level, 0)), 0);
}

function worldTier() {
  const level = worldLevel();
  if (level >= 10) return 3;
  if (level >= 5) return 2;
  return 1;
}

function calculatedMaxHp(source = state) {
  const con = attr("CON", source);
  const level = Math.max(1, num(source.character.level, 1));
  const robusto = source.talents.find((talent) => talent.name === "Robusto");
  return RULES.calculateMaxHp({ con, level, robustAcquiredLevel: robusto?.level ?? null });
}

function maxHp(source = state) {
  return Math.max(1, calculatedMaxHp(source) + num(source.resources.hpMaxBonus, 0));
}

function calculatedMaxPm(source = state) {
  const pod = attr("POD", source);
  const level = Math.max(1, num(source.character.level, 1));
  const passiveBonus = activeTalents(source).reduce((sum, talent) => sum + num(talent.resourceMods?.pm, 0), 0);
  const conditionalBonus = enabledConditionalTalents(source).reduce((sum, talent) => sum + num(talent.conditionalMods?.resourceMods?.pm, 0), 0);
  const talentBonus = passiveBonus + conditionalBonus;
  return RULES.calculateMaxPm({ pod, level, umbilicusCore: hasCore("umbigo", source), talentBonus, permanentPenalty: corePermanentPmPenalty(source) });
}

function maxPm(source = state) {
  return Math.max(0, calculatedMaxPm(source) + num(source.resources.pmMaxBonus, 0));
}

function resourceCurrent(key, maxValue) {
  const raw = state.resources[key];
  if (raw === null || raw === undefined || raw === "") return maxValue;
  return clamp(raw, 0, maxValue);
}

function hpCurrent() {
  return resourceCurrent("hpCurrent", maxHp());
}

function pmCurrent() {
  return resourceCurrent("pmCurrent", maxPm());
}

function adjustResource(key, delta) {
  const label = key === "hpCurrent" ? "Vida" : "PM";
  const maxValue = key === "hpCurrent" ? maxHp() : maxPm();
  const current = resourceCurrent(key, maxValue);
  const next = clamp(current + delta, 0, maxValue);
  state.resources[key] = next;
  state.combat.log.unshift(`${label} ${delta > 0 ? "+" : ""}${delta}: ${next}/${maxValue}.`);
  render();
}

function resourceMaxBonusKey(key) {
  return key === "hpCurrent" ? "hpMaxBonus" : "pmMaxBonus";
}

function resourceCalculatedMax(key) {
  return key === "hpCurrent" ? calculatedMaxHp() : calculatedMaxPm();
}

function resourceMaxLabel(key) {
  return key === "hpCurrent" ? "Vida" : "PM";
}

function openResourceMaxModal(key) {
  if (!["hpCurrent", "pmCurrent"].includes(key)) return;
  const bonusKey = resourceMaxBonusKey(key);
  const label = resourceMaxLabel(key);
  const calculated = resourceCalculatedMax(key);
  const bonus = num(state.resources[bonusKey], 0);
  const total = key === "hpCurrent" ? maxHp() : maxPm();
  openModal(`Ajustar ${label} máximo`, `
    <div class="grid three">
      ${miniStat("Calculado", calculated)}
      ${miniStat("Bônus manual", bonus)}
      ${miniStat("Total", total)}
    </div>
    <div class="field">
      <label>Bônus no máximo</label>
      <input id="resourceMaxBonus" type="number" value="${esc(bonus)}">
    </div>
    <p class="muted small">Este valor soma ao máximo calculado. O valor atual continua sendo alterado pelos botões rápidos.</p>
  `, `<button class="button" type="button" data-action="save-resource-max" data-resource="${esc(key)}">Salvar</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function saveResourceMaxBonus(key) {
  if (!["hpCurrent", "pmCurrent"].includes(key)) return;
  const bonusKey = resourceMaxBonusKey(key);
  state.resources[bonusKey] = num($("#resourceMaxBonus")?.value, 0);
  const maxValue = key === "hpCurrent" ? maxHp() : maxPm();
  state.resources[key] = resourceCurrent(key, maxValue);
  closeModal();
  render();
}

function spendPm(amount, label) {
  const current = pmCurrent();
  if (current < amount) {
    addError("LAT-MUN-002", `${label}: PM insuficiente (${current}/${amount}).`);
    return false;
  }
  state.resources.pmCurrent = clamp(current - amount, 0, maxPm());
  state.combat.log.unshift(`${label}: -${amount} PM (${state.resources.pmCurrent}/${maxPm()}).`);
  return true;
}

function worldCosts(level = worldLevel()) {
  return RULES.worldCosts(level, hasCore("coracao"));
}

function ensureCustomArmors() {
  state.inventory.customArmors ??= [];
  return state.inventory.customArmors;
}

function customArmorKey(id) {
  return `custom:${id}`;
}

function isCustomArmorKey(id = "") {
  return String(id).startsWith("custom:");
}

function armorSelectId(armor) {
  return armor?.custom ? customArmorKey(armor.id) : armor?.name ?? "";
}

function selectedArmor(source = state) {
  const armorId = source.inventory.armorId;
  if (!armorId) return null;
  if (isCustomArmorKey(armorId)) {
    const id = armorId.slice("custom:".length);
    return (source.inventory.customArmors ?? []).find((item) => item.id === id) ?? null;
  }
  return DB.armors.find((item) => item.name === armorId && item.category !== "Escudo") ?? null;
}

function armorIconPreset(armor) {
  if (armor?.custom && armor.iconPreset) return armor.iconPreset;
  const text = fold(`${armor?.name ?? ""} ${armor?.category ?? ""}`);
  if (text.includes("ESCAMA")) return "scale";
  if (text.includes("PLACA")) return "plate";
  if (text.includes("MALHA")) return "chain";
  if (text.includes("COURO")) return "leather";
  if (text.includes("PEITORAL")) return "breastplate";
  return armor?.iconPreset ?? "plate";
}

function armorIconColor(armor) {
  const fallbackByPreset = {
    plate: "#b8c0cc",
    scale: "#8f6b3d",
    chain: "#9aa4b2",
    leather: "#8b5a35",
    breastplate: "#c39a52",
  };
  const preset = armorIconPreset(armor);
  const color = armor?.iconColor || fallbackByPreset[preset] || "#b8c0cc";
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#b8c0cc";
}

function armorIcon(armor, extraClass = "") {
  const preset = armorIconPreset(armor);
  const color = armorIconColor(armor);
  return `<span class="armor-icon armor-${esc(preset)} ${extraClass}" style="--armor-color:${esc(color)}" aria-hidden="true"><i></i></span>`;
}

function armorPieces(source = state) {
  const armor = selectedArmor(source);
  const shield = source.inventory.shield ? DB.armors.find((item) => item.category === "Escudo") : null;
  return [armor, shield].filter(Boolean);
}

function caBreakdown(source = state) {
  try {
    const base = 20 + Math.floor(attr("DES", source) / 5) - 30;
    const armor = armorPieces(source).reduce((sum, item) => sum + num(item.ca, 0), 0);
    const effects = source.effects.reduce((sum, effect) => sum + num(effect.ca, 0), 0);
    const passiveTalents = activeTalents(source).reduce((sum, talent) => sum + num(talent.acMod, 0), 0);
    const conditionalTalents = enabledConditionalTalents(source).reduce((sum, talent) => sum + conditionalCaMod(talent), 0);
    const talents = passiveTalents + conditionalTalents;
    const core = coreCaBonus(source);
    const forte = activeForteBonuses(source).ca;
    const perceptionOverride = isCoreEffectActive("olhos", source);
    const calculatedTotal = (perceptionOverride ? skillFinal("Percepção", source) : base + armor + effects + talents + core) + forte;
    const adjustments = source.combat?.defenseAdjustments ?? {};
    const caAdjustment = num(adjustments.ca, 0);
    const blockAdjustment = num(adjustments.block, 0);
    const total = calculatedTotal + caAdjustment;
    const block = { cortante: bodyInfo(source).block, perfurante: bodyInfo(source).block, contundente: bodyInfo(source).block };
    for (const piece of armorPieces(source)) {
      for (const type of Object.keys(block)) block[type] += num(piece.block?.[type], 0);
    }
    for (const effect of source.effects) {
      for (const type of Object.keys(block)) block[type] += num(effect.block?.[type], 0);
    }
    const calculatedBlock = { ...block };
    for (const type of Object.keys(block)) block[type] += blockAdjustment;
    return { total, calculatedTotal, base, armor, effects, talents, core, forte, perceptionOverride, block, calculatedBlock, adjustments: { ca: caAdjustment, block: blockAdjustment } };
  } catch (error) {
    if (source === state) addError("LAT-CALC-001", error.message);
    return { total: 0, calculatedTotal: 0, base: 0, armor: 0, effects: 0, talents: 0, core: 0, forte: 0, perceptionOverride: false, block: { cortante: 0, perfurante: 0, contundente: 0 }, calculatedBlock: { cortante: 0, perfurante: 0, contundente: 0 }, adjustments: { ca: 0, block: 0 } };
  }
}

function successText(value) {
  const normal = Math.floor(value);
  const good = Math.floor(value / 2);
  const extreme = Math.floor(value / 5);
  return `Normal: ${normal} ou menos. Bom/Sólido: ${good} ou menos. Extremo: ${extreme} ou menos. Crítico natural: 01.`;
}

function rollD100(mode = "normal") {
  const one = () => Math.floor(Math.random() * 100) + 1;
  if (mode === "adv") {
    const a = one(), b = one();
    return { rolls: [a, b], result: Math.min(a, b), label: "Vantagem" };
  }
  if (mode === "dis") {
    const a = one(), b = one();
    return { rolls: [a, b], result: Math.max(a, b), label: "Desvantagem" };
  }
  const result = one();
  return { rolls: [result], result, label: "Normal" };
}

function d100Outcome(result, target) {
  if (num(result, 0) === 1) return "Crítico natural";
  if (result <= Math.floor(target / 5)) return "Extremo";
  if (result <= Math.floor(target / 2)) return "Bom/Sólido";
  if (result <= target) return "Normal";
  return "Falha";
}

function render() {
  const renderPosition = captureRenderPosition();
  applyTheme();
  $("#tabs").innerHTML = TABS.map(([id, label]) => {
    const locked = id === "mundo" && !worldUnlocked();
    const selected = sessionUi.activeTab === id;
    return `<button id="tab-${id}" class="tab ${selected ? "active" : ""} ${locked ? "locked" : ""}" type="button" role="tab" aria-selected="${selected}" aria-controls="app" tabindex="${selected ? "0" : "-1"}" data-action="tab" data-tab="${id}" ${locked ? 'disabled aria-disabled="true"' : ""}>${esc(label)}${locked ? " · bloqueada" : ""}</button>`;
  }).join("");
  const status = `${state.character.name || "Personagem sem nome"} · CA ${caBreakdown().total} · Vida ${hpCurrent()}/${maxHp()} · PM ${pmCurrent()}/${maxPm()}`;
  $("#statusLine").textContent = status;
  const app = $("#app");
  app.setAttribute("aria-labelledby", `tab-${sessionUi.activeTab}`);
  if (sessionUi.printMode) {
    app.innerHTML = TABS.map(([id, label]) => `<section class="panel"><div class="section-title"><h2>${esc(label)}</h2></div>${renderTab(id)}</section>`).join("<br>");
  } else {
    app.innerHTML = renderTab(sessionUi.activeTab);
  }
  associateLabels(app);
  const unlocked = worldUnlocked();
  if (unlocked && !previousWorldUnlocked) addError("LAT-MAG-005", "", false);
  previousWorldUnlocked = unlocked;
  restoreRenderPosition(renderPosition);
}

function captureRenderPosition() {
  const active = document.activeElement;
  if (!active?.closest?.("#app")) return { scrollX: window.scrollX ?? 0, scrollY: window.scrollY ?? 0 };
  const keys = ["path", "action", "tab", "skill", "type", "id", "resource", "actionKey"];
  const dataset = Object.fromEntries(keys.filter((key) => active.dataset?.[key] !== undefined).map((key) => [key, active.dataset[key]]));
  return {
    dataset,
    tagName: active.tagName,
    selectionStart: active.selectionStart,
    selectionEnd: active.selectionEnd,
    scrollX: window.scrollX ?? 0,
    scrollY: window.scrollY ?? 0,
  };
}

function restoreRenderPosition(position) {
  requestAnimationFrame(() => {
    if (position?.dataset && Object.keys(position.dataset).length) {
      const candidate = $$("input, select, textarea, button", $("#app")).find((element) => (
        element.tagName === position.tagName && Object.entries(position.dataset).every(([key, value]) => element.dataset?.[key] === value)
      ));
      if (candidate) {
        candidate.focus();
        if (Number.isInteger(position.selectionStart) && typeof candidate.setSelectionRange === "function") {
          candidate.setSelectionRange(position.selectionStart, position.selectionEnd);
        }
      }
    }
    if (typeof window.scrollTo === "function") window.scrollTo(position?.scrollX ?? 0, position?.scrollY ?? 0);
  });
}

function renderTab(tab) {
  try {
    return ({
      resumo: renderResumo,
      combate: renderCombate,
      magia: renderMagia,
      inventario: renderInventario,
      pt: renderPT,
      mundo: renderMundo,
      antecedentes: renderAntecedentes,
    }[tab] ?? renderResumo)();
  } catch (error) {
    addError("LAT-INI-002", error.message);
    return `<div class="panel empty">Não foi possível montar esta aba. Veja o Log de Erros.</div>`;
  }
}

function renderResumo() {
  const culture = getCulture();
  const region = getRegion();
  const body = bodyInfo();
  const ca = caBreakdown();
  return `
    <div class="grid two">
      <section class="panel">
        <div class="section-title"><h2>Resumo</h2><button class="ghost" type="button" data-action="open-start">Importar ou criar</button></div>
        <div class="grid two">
          ${field("Nome", "character.name")}
          ${field("Idade", "character.age")}
          ${field("Gênero", "character.gender")}
          ${field("Nascimento", "character.birth")}
          ${field("Nível", "character.level", "number", 'min="1" max="20"')}
          ${selectField("A. Familiar", "character.backgroundFamilyId", DB.backgrounds.family.map((item) => [item.id, item.name]), "Escolha")}
          ${selectField("A. Pessoal", "character.backgroundPersonalId", DB.backgrounds.personal.map((item) => [item.id, item.name]), "Escolha")}
          ${selectField("Região", "character.regionCode", DB.regions.map((item) => [item.code, item.label]), "Sem região")}
          ${selectField("Cultura", "character.cultureId", culturesForSelect().map((item) => [item.id, item.name]), "Sem cultura")}
        </div>
      </section>
      <section class="panel">
        <div class="section-title"><h2>Cultura e região</h2></div>
        ${culture ? `
          <div class="stack">
            <div><strong>${esc(culture.name)}</strong> <span class="muted">· ${esc(region?.label ?? culture.region)}</span></div>
            <div class="chip">Arma cultural: ${esc(culture.weapon || "não cadastrada")}</div>
            <p>${esc(culture.description)}</p>
            <p><strong>Habilidade:</strong> ${esc(culture.ability || "Sem habilidade cadastrada.")}</p>
            <p><strong>Fraqueza:</strong> ${esc(culture.weakness || "Sem fraqueza cadastrada.")}</p>
          </div>
        ` : `<div class="empty">Escolha uma região e uma cultura para carregar arma cultural, bônus, fraqueza e magias regionais.</div>`}
      </section>
    </div>

    ${renderCorePanel("compact")}

    <div class="summary-focus-layout">
      <section class="panel summary-attributes-panel">
        <div class="section-title"><h2>Atributos</h2><span class="muted small">Clique no nome para ver sucessos.</span></div>
        <div class="compact-attribute-grid">
          ${DB.attributes.map((name) => `
            <div class="attribute-card card compact-attribute-card">
              <button class="ghost" type="button" data-action="open-attribute" data-attribute="${name}"><strong>${name}</strong></button>
              <input class="number-input" type="number" min="0" max="200" data-path="attributes.${name}" value="${esc(state.attributes[name])}">
              <span class="muted small">${esc(successText(attr(name)))}</span>
            </div>`).join("")}
        </div>
      </section>

      <aside class="panel quick-skills-side summary-skills-panel">
        <div class="section-title"><h2>Perícias rápidas</h2><span class="muted small">N · V · D</span></div>
        <div class="skill-list compact-skill-list">
          ${DB.skills.map((skill) => `
            <div class="skill-pill compact">
              <button class="ghost" type="button" data-action="open-skill" data-skill="${esc(skill.name)}"><strong>${esc(skill.name)}</strong><span>${skillFinal(skill.name)}</span></button>
              <div class="roll-buttons">
                <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(skill.name)}" data-mode="normal" title="Rolar d100">N</button>
                <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(skill.name)}" data-mode="adv" title="Rolar com vantagem">V</button>
                <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(skill.name)}" data-mode="dis" title="Rolar com desvantagem">D</button>
              </div>
            </div>`).join("")}
        </div>
      </aside>
    </div>

    <div class="summary-layout summary-secondary-layout">
      <section class="panel summary-extras-panel">
        <div class="grid two">
        <div>${summaryChips("Habilidades Extra", state.abilities, "open-ability")}</div>
        <div>${summaryChips("Talentos", allKnownTalents(), "open-talent")}</div>
        </div>
      </section>
      <section class="panel summary-auto-panel">
        <div class="section-title"><h2>Automático</h2></div>
        <div class="stat-grid">
          ${stat("CA", ca.total, "Clique para ver cálculo e efeitos.", "open-ca")}
          ${stat("Vida", `${hpCurrent()}/${maxHp()}`, "(CON ÷ 10) + 12 e níveis.", "")}
          ${stat("PM", `${pmCurrent()}/${maxPm()}`, "POD ÷ 3 e níveis.", "")}
          ${stat("Corpo", `${body.body} (${body.mod})`, `${body.label}; Bloqueio base ${body.block}${body.vigor ? `; Vigor +${body.vigor}` : ""}.`, "")}
          ${stat("Esquiva", skillFinal("Esquivar"), "Meia DES + modificadores.", "open-skill", "Esquivar")}
          ${stat("Aptidões", `${aptitudeTotal() - aptitudeSpent()}/${aptitudeTotal()}`, "Disponíveis / total.", "")}
          ${stat("Perícias", `${skillPointsTotal() - skillPointsSpent()}/${skillPointsTotal()}`, "Pontos restantes / total.", "")}
        </div>
      </section>
    </div>
  `;
}

function renderCombate() {
  const selectedWeapon = state.inventory.weapons.find((weapon) => weapon.id === state.inventory.selectedWeaponId) ?? state.inventory.weapons[0];
  const ca = caBreakdown();
  const fight = bestAttackSkill();
  return `
    <section class="panel">
      <div class="section-title combat-title">
        <h2>Combate</h2>
        <div class="turn-controls">
          <button class="button pass-turn-button" type="button" data-action="pass-turn">Passar Turno</button>
          <button class="danger finish-combat-button" type="button" data-action="finish-combat">Finalizar Combate</button>
        </div>
      </div>
      <div class="grid two">
        <div class="stack">
          <div class="resource-row">
            ${resourceControl("Vida atual", "hpCurrent", maxHp())}
            ${resourceControl("PM atual", "pmCurrent", maxPm())}
          </div>
          <div class="actions-grid">
            ${actionSwitch("standard", "Ação Padrão")}
            ${actionSwitch("movement", "Ação de Movimento")}
            ${actionSwitch("bonus", "Ação Bônus")}
            ${actionSwitch("reaction", "Reação")}
          </div>
        </div>
        <div class="card stack">
          <h3>Resumo de combate</h3>
          <div class="stat-grid">
            ${miniStat("Arma", selectedWeapon?.name ?? "Nenhuma")}
            ${miniStat("Dano", selectedWeapon?.damage ?? "-")}
            ${defenseMiniStat("CA", ca.total, "ca", ca.adjustments.ca)}
            ${defenseMiniStat("Bloqueio", `C ${ca.block.cortante} · P ${ca.block.perfurante} · Cn ${ca.block.contundente}`, "block", ca.adjustments.block)}
            ${miniStat(fight.name, fight.value)}
            ${miniStat("Corpo", `${bodyInfo().mod}${bodyInfo().vigor ? ` · Vigor +${bodyInfo().vigor}` : ""}`)}
          </div>
        </div>
      </div>
    </section>
    ${renderCorePanel("combat")}
    ${combatQuickSkillsPanel()}
    ${combatExtrasPanel()}
    <section class="panel">
      <div class="section-title"><h2>Magias em combate</h2></div>
      <div class="grid three">
        ${knownSpells().map((spell) => spellCombatCard(spell)).join("") || `<div class="empty">Evolua ou adicione magias na aba Magia.</div>`}
      </div>
    </section>
    ${activeSpellsPanel()}
    <section class="panel">
      <div class="section-title"><h2>Registro</h2>${state.combat.log.length ? `<button class="ghost" type="button" data-action="clear-combat-log">Limpar registro</button>` : ""}</div>
      <div class="stack">${state.combat.log.slice(0, 12).map((line) => `<div class="chip">${esc(line)}</div>`).join("") || `<div class="empty">As ações usadas aparecerão aqui.</div>`}</div>
    </section>
  `;
}

function renderMagia() {
  const available = aptitudeTotal() - aptitudeSpent();
  const preview = getSpell(sessionUi.extraMagicType, sessionUi.extraMagicRegion === "Sem Região" ? "" : sessionUi.extraMagicRegion);
  const extraEditor = sessionUi.showExtraMagic ? `
    <div class="grid three">
      ${selectRaw("Tipo", "ui.extraMagicType", MAGIC_TYPES.map((type) => [type, type]))}
      ${selectRaw("Região", "ui.extraMagicRegion", [["Sem Região", "Sem Região"], ...DB.regions.map((region) => [region.code, region.label])])}
      <div class="field"><label>&nbsp;</label><button class="button" type="button" data-action="add-extra-magic">Adicionar</button></div>
    </div>
    <div class="spell-card spell-preview">
      <header><div><strong>${esc(preview?.name ?? "Magia não encontrada")}</strong><br><span class="muted">${esc(preview?.regional ? preview.region : "Tabela base de Marufia")}</span></div><span class="tag">${esc(preview?.baseType ?? "-")}</span></header>
      <p>${esc(preview?.description ?? "Escolha tipo e região para ver a magia.")}</p>
      <button class="ghost" type="button" data-action="open-spell-preview">Ver trilha da escolha</button>
    </div>
  ` : `<button class="button" type="button" data-action="toggle-extra-magic">Adicionar Magia Extra</button>`;
  return `
    <section class="panel">
      <div class="section-title"><h2>Magia e Aptidões</h2><span class="tag ${available < 0 ? "warn" : "ok"}">Aptidões livres: ${available}</span></div>
      <div class="grid three">
        ${miniStat("Total", aptitudeTotal())}
        ${miniStat("Gasto", aptitudeSpent())}
        ${field("Aptidões extras", "magic.extraAptitudes", "number", 'min="0"')}
      </div>
    </section>
    ${renderCorePanel("magic")}
    <section class="panel">
      <div class="grid three">
        ${MAGIC_TYPES.map((type) => spellLevelCard(type)).join("")}
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Magia Extra</h2>${sessionUi.showExtraMagic ? `<button class="ghost" type="button" data-action="toggle-extra-magic">Fechar</button>` : ""}</div>
      ${extraEditor}
    </section>
    <section class="panel">
      <div class="section-title"><h2>Magias conhecidas extras</h2></div>
      <div class="grid three">${state.magic.knownExtras.map((spell) => extraSpellCard(spell)).join("") || `<div class="empty">Nenhuma magia extra adicionada.</div>`}</div>
    </section>
  `;
}

function renderInventario() {
  const shieldOn = Boolean(state.inventory.shield);
  return `
    <section class="panel">
      <div class="section-title"><h2>Inventário</h2></div>
      <div class="inventory-top-grid">
        <div class="card money-card">
          <h3>Dinheiro</h3>
          <div class="money-grid">
            ${field("X", "inventory.money.X", "number")}
            ${field("D", "inventory.money.D", "number")}
            ${field("L", "inventory.money.L", "number")}
          </div>
        </div>
        <div class="card defense-card">
          <h3>Proteção</h3>
          <div class="defense-grid">
            ${armorEquipCard()}
            <button class="shield-toggle ${shieldOn ? "on" : ""}" type="button" role="switch" aria-checked="${shieldOn}" data-action="toggle-shield">
              <span class="shield-glyph" aria-hidden="true"></span>
              <span><strong>Escudo</strong><small>${shieldOn ? "Equipado" : "Guardado"}</small></span>
            </button>
          </div>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Armas</h2><div class="inline"><button class="ghost" type="button" data-action="open-weapon-picker" data-kind="normal">Arma</button><button class="ghost" type="button" data-action="open-custom-weapon">Arma customizável</button><button class="ghost" type="button" data-action="open-weapon-picker" data-kind="cultural">Arma cultural</button></div></div>
      <div class="stack">${state.inventory.weapons.map((weapon) => inventoryWeaponRow(weapon)).join("") || `<div class="empty">Nenhuma arma adicionada.</div>`}</div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Equipamentos</h2><div class="inline"><button class="ghost" type="button" data-action="open-equipment-picker" data-group="equipment">Equipamentos</button><button class="ghost" type="button" data-action="open-custom-equipment">Equipamento customizável</button></div></div>
      <div class="stack">${state.inventory.equipment.map((item) => equipmentRow(item)).join("") || `<div class="empty">Nenhum equipamento adicionado.</div>`}</div>
    </section>
    <section class="panel">
      ${textareaField("Patrimônio", "inventory.patrimonio", 2000)}
    </section>
  `;
}

function renderPT() {
  const remaining = skillPointsTotal() - skillPointsSpent();
  return `
    <section class="panel">
      <div class="section-title"><h2>P&T</h2><span class="tag ${remaining < 0 ? "warn" : "ok"}">Pontos de perícia: ${remaining}/${skillPointsTotal()}</span></div>
      <div class="grid three">
        ${field("Pontos extras", "skillExtraPoints", "number")}
        <label class="field">Base de pontos<select data-path="character.useIntForSkillPoints"><option value="false" ${!state.character.useIntForSkillPoints ? "selected" : ""}>SAB + CON</option><option value="true" ${state.character.useIntForSkillPoints ? "selected" : ""}>INT + CON</option></select></label>
        ${field("Limite de perícia", "settings.skillLimit", "number")}
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Perícias</h2><button class="button" type="button" data-action="open-evolve-skills">Evoluir</button></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Perícia</th><th>Base</th><th>Pontos adicionados</th><th>Modificadores</th><th>Final</th><th>Check</th></tr></thead>
          <tbody>
            ${DB.skills.map((skill) => {
              const final = skillFinal(skill.name);
              const over = final > num(state.settings.skillLimit, 70);
              return `<tr>
                <td><button class="ghost" type="button" data-action="open-skill" data-skill="${esc(skill.name)}">${esc(skill.name)}</button></td>
                <td>${baseSkillValue(skill)}</td>
                <td><input class="number-input" type="number" min="0" data-path="skills.${skill.name}.added" value="${num(state.skills[skill.name]?.added, 0)}"></td>
                <td><button class="ghost" type="button" data-action="open-modifiers" data-skill="${esc(skill.name)}">${skillModifiers(skill.name).reduce((sum, mod) => sum + mod.value, 0)}</button></td>
                <td><span class="tag ${over ? "warn" : ""}">${final}</span></td>
                <td><input type="checkbox" data-path="skills.${skill.name}.checked" ${state.skills[skill.name]?.checked ? "checked" : ""}></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="grid two">
        <div>
          <div class="section-title"><h2>Habilidades Extra</h2><button class="button" type="button" data-action="open-ability-modal">Add Habilidade</button></div>
          <div class="stack">${state.abilities.map((ability) => abilityCard(ability)).join("") || `<div class="empty">Nenhuma habilidade extra.</div>`}</div>
        </div>
        <div>
          <div class="section-title"><h2>Talentos</h2></div>
          <div class="grid two">
            ${selectRaw("Talento", "ui.talentDraft", DB.talents.map((talent) => [talent.name, talent.name]), "Escolha")}
            <div class="field"><label>Nível</label><input type="number" min="1" id="talentLevelDraft" value="1"></div>
          </div>
          <button class="button" type="button" data-action="add-talent" style="margin: 10px 0;">Adicionar talento</button>
          <div class="stack">${allKnownTalents().map((talent) => talentCard(talent)).join("") || `<div class="empty">Nenhum talento conhecido.</div>`}</div>
        </div>
      </div>
    </section>
  `;
}

function renderMundo() {
  if (!worldUnlocked()) {
    return `<section class="panel locked-view"><div><h2>Mundo bloqueado</h2><p>Adicione pelo menos 1 Aptidão em Mundo para desbloquear esta aba.</p><button class="button" type="button" data-action="go-magic">Ir para Magia</button></div></section>`;
  }
  const level = worldLevel();
  const tier = worldTier();
  const area = level ? `${1.5 + level * 1.5}m de raio` : "3m de raio";
  const difficulty = Math.floor((attr("POD") + Math.max(attr("SAB"), attr("INT"))) / 10) + (level >= 9 ? 20 : level >= 7 ? 15 : level >= 5 ? 10 : level >= 3 ? 5 : 0);
  const categories = ["Ofensivo", "Defensivo", "Utilitário", "Híbrido"];
  const resistanceMode = normalizeLawResistanceMode(sessionUi.lawResistanceMode);
  const hybridCategory = isHybridCategory(sessionUi.lawCategory);
  const filtered = lawsForCategory(sessionUi.lawCategory, resistanceMode);
  const selectedLaw = filtered.find((law) => law.ID === sessionUi.lawId) ?? filtered[0];
  const customLaw = selectedLaw?.ID === "CUSTOM-HYB";
  const effectKey = tier === 3 ? "N3 (Mundo 10)" : tier === 2 ? "N2 (Mundo 5-9)" : "N1 (Mundo 1-4)";
  const selectedName = selectedLaw ? lawNameForResistance(selectedLaw, resistanceMode) : "";
  const selectedDetails = selectedLaw && !customLaw ? lawDetailsForResistance(selectedLaw, effectKey, resistanceMode) : null;
  const costs = worldCosts(level);
  const worldActive = state.world.status === "active";
  const durationFormula = worldDurationFormula(level);
  const worldStatusLabel = { closed: "Fechado", active: "Ativo", collapsed: "Colapsado" }[state.world.status] ?? "Fechado";
  return `
    <section class="panel">
      <div class="spell-card">
        <header>
          <div><h2>${esc(state.world.name || "Mundo sem nome")}</h2><p class="muted">${esc(state.world.phrase || "Frase de ativação não definida")}</p></div>
          <button class="icon-button" type="button" data-action="open-world-details" title="Detalhes do Mundo">🔍</button>
        </header>
        <div class="stat-grid">
          ${miniStat("Nível", level)}
          ${miniStat("Estado", worldStatusLabel)}
          ${miniStat(worldActive ? "Turnos restantes" : "Duração", worldActive ? (state.world.durationTurns ?? "Não informada") : `${durationFormula} rodadas`)}
          ${miniStat("Manutenção", !worldActive ? "Inativa" : state.world.maintenancePaidForTurn ? "Paga neste turno" : "Pendente")}
          ${miniStat("Usos da Lei", state.world.lawUses ?? (tier + 1))}
          ${miniStat("Área", area)}
          ${miniStat("Dificuldade", difficulty)}
          ${miniStat("Custo", `${costs.activation} PM / ${costs.maintenance} PM`)}
        </div>
        <div class="inline">
          <button class="button" type="button" data-action="world-open" ${worldActive ? "disabled" : ""}>Abrir Mundo (-${costs.activation} PM)</button>
          ${worldActive && state.world.durationTurns === null ? `<button class="button" type="button" data-action="world-duration">Definir duração</button>` : ""}
          <button class="${state.world.maintenancePaidForTurn ? "ghost" : "button"}" type="button" data-action="world-maintain" ${worldActive && !state.world.maintenancePaidForTurn ? "" : "disabled"}>${state.world.maintenancePaidForTurn ? "Manutenção paga" : `Manter Mundo (-${costs.maintenance} PM)`}</button>
          <button class="ghost" type="button" data-action="world-law" ${worldActive && state.world.laws.length && num(state.world.lawUses, 0) > 0 ? "" : "disabled"}>Usar Lei (livre)</button>
          <button class="danger" type="button" data-action="world-close" ${worldActive ? "" : "disabled"}>Encerrar Mundo</button>
          <button class="ghost" type="button" data-action="world-collapse" ${worldActive ? "" : "disabled"}>Colapsar Mundo</button>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Criação do Mundo</h2></div>
      <div class="grid two">
        ${field("Nome do Mundo", "world.name")}
        ${field("Frase de Ativação", "world.phrase")}
      </div>
      ${textareaField("Descrição", "world.description", 1000)}
    </section>
    <section class="panel">
      <div class="section-title"><h2>Lei do Mundo</h2></div>
      <div class="grid three">
        ${selectRaw("Categoria", "ui.lawCategory", categories.map((cat) => [cat, cat]))}
        ${hybridCategory
          ? `<div class="field"><label>Resistência da Lei</label><input value="Personalizada" disabled></div>`
          : selectRaw("Resistência da Lei", "ui.lawResistanceMode", [["sem", "SEM"], ["com", "COM"]])}
        ${selectRaw("Tipo da Lei", "ui.lawId", filtered.map((law) => [law.ID, lawNameForResistance(law, resistanceMode)]), filtered.length ? "" : "Nenhuma lei disponível")}
      </div>
      <div class="grid two" style="margin-top: 12px;">
        <div class="field"><label>Nome da Lei</label><input id="lawNameDraft" value="${esc(selectedName)}" ${selectedLaw ? "" : "disabled"}></div>
        <div class="field"><label>&nbsp;</label><button class="button" type="button" data-action="add-world-law" ${selectedLaw ? "" : "disabled"}>Add Nova Lei</button></div>
      </div>
      <div class="card law-preview" style="margin-top: 12px;">
        ${!selectedLaw ? `<div class="empty">Nenhuma Lei ${esc(sessionUi.lawCategory)} com o filtro ${resistanceMode.toUpperCase()}.</div>` : `
          <div class="inline"><strong>${esc(selectedName)}</strong>${customLaw ? "" : `<span class="tag law-resistance-${resistanceMode}">${resistanceMode.toUpperCase()} Resistência</span>`}</div>
          ${customLaw ? `
            <div class="grid three" style="margin-top: 10px;">
              <div class="field"><label>Alvo</label><input id="customLawTarget" placeholder="Ex.: criatura, área, objeto"></div>
              <div class="field"><label>Resistência</label><input id="customLawResistance" placeholder="Ex.: SAB, CON, DES"></div>
              <div class="field"><label>Efeito</label><textarea id="customLawEffect" placeholder="Descreva o efeito mecânico da Lei"></textarea></div>
            </div>
          ` : `
            <p>${esc(selectedDetails?.effect ?? "")}</p>
            <p class="muted">Alvo: ${esc(selectedLaw.Alvo ?? "-")} · Resistência: ${esc(selectedDetails?.resistance ?? "-")}</p>
          `}
        `}
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Leis adicionadas</h2></div>
      <div class="grid two">${state.world.laws.map((law) => worldLawCard(law)).join("") || `<div class="empty">Nenhuma Lei adicionada.</div>`}</div>
      ${textareaField("Efeito Narrativo", "world.narrative", 1000)}
    </section>
  `;
}

function renderAntecedentes() {
  const personal = getPersonalBackground();
  return `
    <section class="panel">
      <div class="section-title"><h2>Antecedentes</h2></div>
      <div class="grid two">
        ${selectField("Antecedente Familiar", "character.backgroundFamilyId", DB.backgrounds.family.map((item) => [item.id, item.name]), "Escolha")}
        ${selectField("Antecedente Pessoal", "character.backgroundPersonalId", DB.backgrounds.personal.map((item) => [item.id, item.name]), "Escolha")}
      </div>
      <div class="grid two" style="margin-top: 12px;">
        <div class="card"><strong>${esc(getFamilyBackground()?.name ?? "A. Familiar")}</strong><p>${esc(getFamilyBackground()?.description ?? "Escolha um antecedente familiar.")}</p><span class="chip">${esc(getFamilyBackground()?.bonusText ?? "")}</span></div>
        <div class="card"><strong>${esc(personal?.name ?? "A. Pessoal")}</strong><p>${esc(personal?.description ?? "Escolha um antecedente pessoal.")}</p><span class="chip">${esc(personal?.bonusText ?? "")}</span></div>
      </div>
    </section>
    ${renderCorePanel("antecedentes")}
    <section class="panel">
      <div class="section-title"><h2>Personalidade</h2><div class="inline"><button class="ghost" type="button" data-action="random-personality" data-kind="traits">Traço aleatório</button><button class="ghost" type="button" data-action="random-personality" data-kind="ideals">Ideal</button><button class="ghost" type="button" data-action="random-personality" data-kind="flaws">Defeito</button><button class="ghost" type="button" data-action="random-personality" data-kind="bonds">Vínculo</button></div></div>
      <div class="grid two">
        ${textareaField("Traços de Personalidade", "notes.traits", 1000)}
        ${textareaField("Ideal", "notes.ideal", 1000)}
        ${textareaField("Defeitos", "notes.flaws", 1000)}
        ${textareaField("Ligações/Vínculos", "notes.bonds", 1000)}
      </div>
    </section>
    <section class="panel">
      <div class="section-title"><h2>Aparência</h2></div>
      <div class="grid three">
        ${field("Olhos", "notes.eyes")}
        ${field("Idade aparente", "notes.age")}
        ${field("Altura", "notes.height")}
        ${field("Cabelos", "notes.hair")}
        ${field("Pele", "notes.skin")}
        ${field("Peso", "notes.weight")}
      </div>
      ${textareaField("Aparência geral", "notes.appearance", 1000)}
    </section>
    <section class="panel">
      <div class="grid two">
        ${textareaField("História", "notes.history", 5000)}
        ${textareaField("Aliados e Organizações", "notes.allies", 1000)}
        ${textareaField("Patrono Pessoal", "notes.patron", 1000)}
        ${textareaField("Outras Características", "notes.other", 5000)}
      </div>
    </section>
  `;
}

function field(label, path, type = "text", extra = "") {
  const id = nextControlId("field");
  return `<div class="field"><label for="${id}">${esc(label)}</label><input id="${id}" type="${type}" data-path="${esc(path)}" value="${esc(getPath(path))}" ${extra}></div>`;
}

function textareaField(label, path, max = 1000) {
  const id = nextControlId("textarea");
  return `<div class="field"><label for="${id}">${esc(label)} <span class="muted">(${String(getPath(path) ?? "").length}/${max})</span></label><textarea id="${id}" data-path="${esc(path)}" maxlength="${max}" data-live="true">${esc(getPath(path))}</textarea></div>`;
}

function selectField(label, path, options, empty = "") {
  const id = nextControlId("select");
  return `<div class="field"><label for="${id}">${esc(label)}</label><select id="${id}" data-path="${esc(path)}">${empty ? `<option value="">${esc(empty)}</option>` : ""}${options.map(([value, text]) => `<option value="${esc(value)}" ${String(getPath(path)) === String(value) ? "selected" : ""}>${esc(text)}</option>`).join("")}</select></div>`;
}

function selectRaw(label, path, options, empty = "") {
  const id = nextControlId("select");
  return `<div class="field"><label for="${id}">${esc(label)}</label><select id="${id}" data-path="${esc(path)}">${empty ? `<option value="">${esc(empty)}</option>` : ""}${options.map(([value, text]) => `<option value="${esc(value)}" ${String(getPath(path) ?? "") === String(value) ? "selected" : ""}>${esc(text)}</option>`).join("")}</select></div>`;
}

function nextControlId(prefix = "control") {
  controlSerial += 1;
  return `${prefix}-${controlSerial}`;
}

function associateLabels(root) {
  $$(".field", root).forEach((wrapper) => {
    const label = $("label", wrapper);
    const control = $("input, select, textarea", wrapper);
    if (!label || !control || label.htmlFor) return;
    control.id ||= nextControlId("control");
    label.htmlFor = control.id;
  });
}

function culturesForSelect() {
  const region = getRegion();
  return region ? region.cultures : allCultures();
}

function stat(label, value, note, action = "", detail = "") {
  return `<button class="stat" type="button" ${action ? `data-action="${action}"` : ""} ${detail ? `data-skill="${esc(detail)}"` : ""}><span class="muted">${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></button>`;
}

function miniStat(label, value) {
  return `<div class="stat"><span class="muted">${esc(label)}</span><strong>${esc(value)}</strong></div>`;
}

function armorBlockLabel(armor) {
  const block = armor?.block ?? {};
  return `C ${num(block.cortante, 0)} · P ${num(block.perfurante, 0)} · Cn ${num(block.contundente, 0)}`;
}

function armorEquipCard() {
  const armor = selectedArmor();
  return `<button class="armor-equip-card" type="button" data-action="open-armor-picker">
    ${armor ? armorIcon(armor, "large") : `<span class="armor-icon armor-empty large" aria-hidden="true"><i></i></span>`}
    <span class="armor-equip-copy">
      <span class="muted small">Armadura</span>
      <strong>${esc(armor?.name ?? "Sem armadura")}</strong>
      <small>${armor ? `CA +${esc(armor.ca)} · ${esc(armorBlockLabel(armor))}` : "Clique para escolher ou criar"}</small>
    </span>
  </button>`;
}

function armorInfoGrid(armor) {
  return `<div class="grid three">
    ${miniStat("Nome do Item", armor?.name ?? "Sem armadura")}
    ${miniStat("Bônus CA", armor?.ca ?? 0)}
    ${miniStat("Peso", armor?.weight || "-")}
    ${miniStat("Bloqueio C", armor?.block?.cortante ?? 0)}
    ${miniStat("Bloqueio P", armor?.block?.perfurante ?? 0)}
    ${miniStat("Bloqueio Cn", armor?.block?.contundente ?? 0)}
  </div>`;
}

function defenseMiniStat(label, value, kind, adjustment) {
  const note = adjustment ? `Ajuste ${adjustment > 0 ? "+" : ""}${adjustment}` : "Clique para ajustar";
  return `<button class="stat" type="button" data-action="open-defense-adjust" data-defense="${esc(kind)}" aria-label="Ajustar ${esc(label)}"><span class="muted">${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></button>`;
}

function resourceControl(label, key, maxValue) {
  const path = `resources.${key}`;
  const value = resourceCurrent(key, maxValue);
  const pct = maxValue ? clamp((value / maxValue) * 100, 0, 100) : 0;
  const deltas = [1, -1, 5, -5, 10, -10];
  return `<div class="resource-card">
    <button class="resource-head resource-max-button" type="button" data-action="open-resource-max" data-resource="${esc(key)}" title="Ajustar ${esc(label.replace(" atual", ""))} máximo">
      <strong>${esc(label)}</strong><span class="big-val">${esc(value)}/${esc(maxValue)}</span>
    </button>
    <div class="meter ${key === "pmCurrent" ? "mana" : ""}" aria-hidden="true"><i style="width:${pct}%"></i></div>
    <div class="field"><label>Alterar valor</label><input type="number" min="0" max="${maxValue}" data-path="${path}" value="${esc(value)}"></div>
    <div class="resource-adjust" aria-label="Ajustar ${esc(label)}">
      ${deltas.map((delta) => `<button class="${delta > 0 ? "good" : "ghost"}" type="button" data-action="adjust-resource" data-resource="${key}" data-delta="${delta}">${delta > 0 ? "+" : ""}${delta}</button>`).join("")}
    </div>
  </div>`;
}

function actionSwitch(key, label) {
  const ready = Boolean(state.combat.actions[key]);
  return `<button class="switch ${ready ? "on" : ""}" type="button" role="switch" aria-checked="${ready}" data-action="toggle-action" data-action-key="${key}">
    <span class="switch-track"><span class="switch-knob"></span></span>
    <span><strong>${esc(label)}</strong><small>${ready ? "Disponível" : "Usada"}</small></span>
  </button>`;
}

function bestAttackSkill() {
  const names = ["Lutar (Brigar)", "Lutar (Armas Curtas)", "Lutar (Armas de Arremesso)", "Lutar (Armas de Haste)", "Lutar (Armas Longas)", "Lutar (Culturais)", "Arremessar"];
  return names.reduce((best, name) => {
    const value = skillFinal(name);
    return value > best.value ? { name, value } : best;
  }, { name: "Lutar (Brigar)", value: skillFinal("Lutar (Brigar)") });
}

function topFightSkills(limit = 2) {
  return DB.skills
    .filter((skill) => /^Lutar\s*\(/i.test(skill.name))
    .map((skill) => ({ name: skill.name, value: skillFinal(skill.name) }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function combatQuickSkillNames() {
  const fixed = [
    { label: "Arremesso", name: "Arremessar" },
    { label: "Arte/Ofício", name: "Arte/Ofício" },
    { label: "Atletismo", name: "Atletismo" },
    { label: "Esquivar", name: "Esquivar" },
    { label: "Percepção", name: "Percepção" },
    { label: "Tática", name: "Tática" },
  ];
  return [...fixed.map((skill) => ({ ...skill, value: skillFinal(skill.name) })), ...topFightSkills().map((skill) => ({ ...skill, label: skill.name }))];
}

function skillRollButtons(name) {
  return `<div class="roll-buttons">
    <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(name)}" data-mode="normal" title="Rolar d100">N</button>
    <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(name)}" data-mode="adv" title="Rolar com vantagem">V</button>
    <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(name)}" data-mode="dis" title="Rolar com desvantagem">D</button>
  </div>`;
}

function combatQuickSkillsPanel() {
  return `<section class="panel combat-quick-panel">
    <div class="section-title"><h2>Perícias de combate</h2><div class="inline"><span class="muted small">N · V · D</span><button class="icon-button combat-dice-button" type="button" data-action="open-combat-roll" title="Teste de combate contra CA" aria-label="Abrir teste de combate contra CA">⚄</button></div></div>
    <div class="combat-skill-grid">
      ${combatQuickSkillNames().map((skill) => `<div class="combat-skill-card">
        <button class="ghost" type="button" data-action="open-skill" data-skill="${esc(skill.name)}"><strong>${esc(skill.label)}</strong><span>${esc(skill.value)}</span></button>
        ${skillRollButtons(skill.name)}
      </div>`).join("")}
    </div>
  </section>`;
}

function combatExtrasPanel() {
  return `<section class="panel combat-extras-panel">
    <div class="grid two">
      <div>${summaryChips("Habilidades Extra", state.abilities, "open-ability")}</div>
      <div>${summaryChips("Talentos", allKnownTalents(), "open-talent")}</div>
    </div>
  </section>`;
}

function normalizedSpellLevels(spell) {
  return (spell?.levels ?? []).map((entry) => ({ ...entry, level: num(entry.level, 0), text: compact(entry.text ?? "") }));
}

function currentLevelText(spell, level) {
  if (!level) return "Nenhum nível ativo ainda.";
  return normalizedSpellLevels(spell).find((entry) => entry.level === level)?.text ?? "Nível ainda não cadastrado.";
}

function currentLevelEntry(item) {
  if (!item?.level) return null;
  return normalizedSpellLevels(item.spell).find((entry) => entry.level === item.level) ?? null;
}

function magicPmCost(item) {
  if (!item?.level) return 0;
  if (item.type === "Mundo") return worldCosts(item.level).activation;
  const entry = currentLevelEntry(item);
  if (Number.isFinite(Number(entry?.activationCost))) {
    return magicCostAfterCore(Math.max(0, Number(entry.activationCost)));
  }
  return Number.NaN;
}

function magicMaintenanceCost(item) {
  if (!item?.level) return 0;
  if (item.type === "Mundo") return worldCosts(item.level).maintenance;
  const entry = currentLevelEntry(item);
  if (Number.isFinite(Number(entry?.maintenanceCost))) {
    return magicCostAfterCore(Math.max(0, Number(entry.maintenanceCost)));
  }
  return 0;
}

function magicDurationTurns(item) {
  const entry = currentLevelEntry(item);
  if (entry && Object.hasOwn(entry, "durationTurns")) {
    return entry.durationTurns === null ? null : Math.max(1, num(entry.durationTurns, 1));
  }
  return null;
}

function preparedBoostForItem(item) {
  const core = currentCore();
  if (!core || state.magicCore.preparedBoost !== core.id) return null;
  if (core.id === "punho" && !core.validMagicTypes?.includes(item?.type)) return null;
  if (!["ventre", "punho"].includes(core.id)) return null;
  return core;
}

function magicPreparedExtraCost(item) {
  return num(preparedBoostForItem(item)?.preparedCost, 0);
}

function magicTotalPmCost(item) {
  const base = magicPmCost(item);
  return Number.isFinite(base) ? base + magicPreparedExtraCost(item) : Number.NaN;
}

function automationLabel(level) {
  return { complete: "Automação confirmada", partial: "Automação parcial", manual: "Controle manual" }[level?.automationLevel ?? level?.automation] ?? "Controle manual";
}

function renderCurrentLevel(spell, level) {
  return `<div class="spell-current"><span class="tag ${level ? "ok" : "warn"}">N${level}</span><p>${esc(currentLevelText(spell, level))}</p></div>`;
}

function summaryChips(title, items, action) {
  return `<h3>${esc(title)}</h3><div class="inline">${items.slice(0, 8).map((item) => `<button class="chip" type="button" data-action="${action}" data-id="${esc(item.id ?? item.name)}">${esc(item.name)}</button>`).join("") || `<span class="muted small">Nada registrado.</span>`}</div>`;
}

function coreSelectControl() {
  return selectField("Núcleo mágico", "magicCore.selectedId", coreOptions(), "Sem núcleo");
}

function coreStatusTags(core = currentCore()) {
  if (!core) return `<span class="muted small">Nenhum núcleo selecionado.</span>`;
  const tags = [`<span class="tag ok">efeito ativo</span>`];
  if (core.permanentPmPenalty) tags.push(`<span class="tag warn">-${core.permanentPmPenalty} PM máximo</span>`);
  if (state.magicCore.preparedBoost === core.id) tags.push(`<span class="tag ok">${esc(core.preparedLabel)} preparado</span>`);
  if (hasCore("antebraco") && num(state.magicCore.caBoostTurns, 0) > 0) tags.push(`<span class="tag ok">+10 CA por ${state.magicCore.caBoostTurns} rodada</span>`);
  return tags.join("");
}

function coreActionButtons(context = "sheet") {
  const core = currentCore();
  if (!core) return "";
  const buttons = [`<button class="icon-button" type="button" data-action="open-core-details" title="Detalhes do Núcleo" aria-label="Detalhes do Núcleo">🔍</button>`];
  if (["ventre", "punho"].includes(core.id)) {
    buttons.push(state.magicCore.preparedBoost === core.id
      ? `<button class="ghost" type="button" data-action="clear-core-boost">Cancelar preparo</button>`
      : `<button class="button" type="button" data-action="prepare-core-boost">Preparar próxima magia</button>`);
  }
  if (core.id === "antebraco") {
    buttons.push(`<button class="button" type="button" data-action="activate-core-ca">+10 CA por rodada (-1 PM)</button>`);
    buttons.push(`<button class="ghost" type="button" data-action="core-reduce-damage">Reduzir dano 1d6 (-1 PM)</button>`);
  }
  if (core.id === "pulmao" && context !== "compact") {
    buttons.push(`<button class="ghost" type="button" data-action="recover-core-flat">Recuperar +3 PM</button>`);
  }
  return `<div class="inline core-actions">${buttons.join("")}</div>`;
}

function renderCorePanel(context = "sheet") {
  const core = currentCore();
  const compactPanel = context === "compact";
  return `<section class="panel magic-core-panel ${compactPanel ? "compact-core-panel" : ""}">
    <div class="section-title"><h2>Núcleo Mágico</h2>${core && context !== "combat" ? coreActionButtons(compactPanel ? "compact" : context) : ""}</div>
    ${context === "combat" ? "" : coreSelectControl()}
    ${core ? `
      <div class="magic-core-card active">
        <header><div><strong>${esc(core.name)}</strong><br><span class="muted">${esc(core.affects)}</span></div>${coreStatusTags(core)}</header>
        <p>${esc(compactPanel ? core.passive : core.description)}</p>
        ${context === "combat" ? coreActionButtons("combat") : ""}
        ${core.id === "pulmao" && context !== "compact" ? `
          <div class="core-rest-box">
            <div class="field"><label>Horas descansadas</label><input type="number" min="1" data-path="ui.coreRestHours" value="${esc(sessionUi.coreRestHours ?? 1)}"></div>
            <button class="button" type="button" data-action="recover-core-rest">Recuperar bônus</button>
          </div>
        ` : ""}
        ${core.id === "pes" ? `<p class="muted">Movimento: 12m. Penalidade de Mundo inimigo reduzida em 10.</p>` : ""}
      </div>
    ` : `<div class="empty">Selecione um Núcleo Mágico para carregar seus efeitos.</div>`}
  </section>`;
}

function activeSpellsPanel() {
  const active = state.combat.activeSpells ?? [];
  return `<section class="panel">
    <div class="section-title"><h2>Magias ativas</h2></div>
    <div class="stack">${active.map((spell) => {
      const fallback = forteBonusesForItem(spellItemForActive(spell));
      const caBonus = Object.hasOwn(spell, "caBonus") ? num(spell.caBonus, 0) : fallback.ca;
      const vigor = Object.hasOwn(spell, "effectiveVigor") ? num(spell.effectiveVigor, 0) : fallback.vigor;
      return `<div class="chip active-spell-chip">
        <strong>${esc(spell.name)}</strong>
        <span>${spell.maintenanceCost ? `${spell.maintenanceCost} PM/turno` : "sem manutenção"}</span>
        <span>${spell.turns ?? "manual"} turno(s)</span>
        ${spell.type === "Forte" ? `<span class="tag ok">CA +${esc(caBonus)}</span><span class="tag">Vigor +${esc(vigor)}</span>` : ""}
        <button class="ghost" type="button" data-action="remove-active-spell" data-id="${esc(spell.id)}">Encerrar</button>
      </div>`;
    }).join("") || `<div class="empty">Nenhuma magia mantida no momento.</div>`}</div>
  </section>`;
}

function combatTestSkills() {
  const fixed = [
    { label: "Arremesso", name: "Arremessar" },
    { label: "Arte/Ofício", name: "Arte/Ofício" },
    { label: "Atletismo", name: "Atletismo" },
    { label: "Tática", name: "Tática" },
  ];
  const fighting = DB.skills
    .filter((skill) => /^Lutar\s*\(/i.test(skill.name))
    .map((skill) => ({ label: skill.name, name: skill.name }));
  return [...fixed, ...fighting].filter((entry) => DB.skills.some((skill) => skill.name === entry.name));
}

function knownSpells() {
  const base = MAGIC_TYPES.filter((type) => num(state.magic.baseLevels[type], 0) > 0).map((type) => ({ id: `base-${type}`, type, level: num(state.magic.baseLevels[type]), spell: getSpell(type), source: "base" }));
  const extras = state.magic.knownExtras.map((known) => ({ ...known, spell: getSpell(known.type, known.regionCode) }));
  return [...base, ...extras];
}

function spellLevelCard(type) {
  const level = num(state.magic.baseLevels[type], 0);
  const spell = getSpell(type);
  const next = level < 10 ? aptitudeUpgradeCost(type, level, level + 1) : 0;
  return `<div class="spell-card">
    <header><div><strong>${esc(spell?.name ?? type)}</strong><br><span class="muted">${spell?.regional ? esc(spell.region) : "Base Marufia"}</span></div><span class="tag">N${level}</span></header>
    <p>${esc(spell?.description ?? "")}</p>
    ${renderCurrentLevel(spell, level)}
    <div class="inline">
      <button class="ghost" type="button" data-action="magic-dec" data-type="${type}">-</button>
      <strong>Nível ${level}</strong>
      <button class="button" type="button" data-action="magic-inc" data-type="${type}" ${level >= 10 ? "disabled" : ""}>+${next} Apt.</button>
      <button class="ghost" type="button" data-action="open-spell" data-type="${type}">Ver trilha</button>
    </div>
  </div>`;
}

function renderLevels(spell, activeLevel = 0) {
  const levels = normalizedSpellLevels(spell);
  if (!levels.length) return `<div class="empty">Trilha ainda não cadastrada.</div>`;
  return `<ol class="level-list">${levels.map((level) => {
    const isActive = level.level <= activeLevel;
    const isCurrent = level.level === activeLevel;
    return `<li class="${isActive ? "active" : ""} ${isCurrent ? "current" : ""}">
      <div class="level-head"><strong>N${level.level}</strong>${isCurrent ? `<span class="tag ok">nível atual</span>` : isActive ? `<span class="tag ok">ativo</span>` : ""}<span class="tag ${level.automationLevel === "complete" ? "ok" : "warn"}">${esc(automationLabel(level))}</span></div>
      <p class="muted small">Ativação: ${esc(actionCostLabel(level.activationAction ?? level.action))}${level.secondaryActions?.length ? ` · Secundárias: ${level.secondaryActions.map(actionCostLabel).join(", ")}` : ""}</p>
      <p>${esc(level.text)}</p>
    </li>`;
  }).join("")}</ol>`;
}

function extraSpellCard(known) {
  const spell = getSpell(known.type, known.regionCode);
  const next = known.level < 10 ? extraSpellUpgradeCost(known.type, known.level, known.level + 1) : 0;
  return `<div class="spell-card">
    <header><div><strong>${esc(known.name)}</strong><br><span class="muted">${esc(spell?.name ?? known.type)}</span></div><span class="tag">N${known.level}</span></header>
    <p>${esc(spell?.description ?? "")}</p>
    ${renderCurrentLevel(spell, known.level)}
    <div class="inline">
      <button class="button" type="button" data-action="evolve-extra-magic" data-id="${esc(known.id)}" ${known.level >= 10 ? "disabled" : ""}>Evoluir (${next})</button>
      <button class="ghost" type="button" data-action="open-extra-spell" data-id="${esc(known.id)}">Ver</button>
      <button class="danger" type="button" data-action="remove-extra-magic" data-id="${esc(known.id)}">Remover</button>
    </div>
  </div>`;
}

function activeSpellFor(item) {
  return state.combat.activeSpells?.find((spell) => spell.spellId === item.id);
}

function spellCombatCard(item) {
  const pmCost = magicTotalPmCost(item);
  const prepared = preparedBoostForItem(item);
  const active = activeSpellFor(item);
  return `<div class="spell-card">
    <header><div><strong>${esc(item.spell?.name ?? item.type)}</strong><br><span class="muted">Nível ${item.level}</span></div><span class="tag">${esc(item.type)}</span></header>
    <p>${esc(currentLevelText(item.spell, item.level) || item.spell?.description || "")}</p>
    <div class="inline">
      <span class="tag warn">${Number.isFinite(pmCost) ? `${pmCost} PM` : "Custo manual"}</span>
      ${prepared ? `<span class="tag ok">${esc(prepared.preparedLabel)}</span>` : ""}
      ${active ? `<span class="tag ok">ativa · ${active.turns ?? "manual"} turno(s)</span>` : ""}
      <button class="icon-button" type="button" data-action="open-combat-spell" data-spell-id="${esc(item.id)}" title="Ver trilha" aria-label="Ver trilha da magia">🔍</button>
      <button class="button" type="button" data-action="activate-magic" data-type="${esc(item.type)}" data-spell-id="${esc(item.id)}">${item.type === "Mundo" ? "Abrir/usar Mundo" : "Ativar magia"}</button>
    </div>
  </div>`;
}

function inventoryWeaponRow(weapon) {
  return `<div class="inventory-row">
    <header><div><strong>${esc(weapon.name)}</strong> ${state.inventory.selectedWeaponId === weapon.id ? `<span class="tag ok">selecionada</span>` : ""}<br><span class="muted">${esc(weapon.type)}</span></div><div class="inline"><button class="ghost" type="button" data-action="select-weapon" data-id="${esc(weapon.id)}">Selecionar</button><button class="danger" type="button" data-action="remove-weapon" data-id="${esc(weapon.id)}">Remover</button></div></header>
    <div class="grid three">
      <div class="field"><label>Dano</label><input data-array="weapon" data-id="${esc(weapon.id)}" data-field="damage" value="${esc(weapon.damage)}"></div>
      <div class="field"><label>Peso</label><input data-array="weapon" data-id="${esc(weapon.id)}" data-field="weight" value="${esc(weapon.weight)}"></div>
      <div class="field"><label>Propriedade</label><input data-array="weapon" data-id="${esc(weapon.id)}" data-field="property" value="${esc(weapon.property)}"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea data-array="weapon" data-id="${esc(weapon.id)}" data-field="description" data-live="true">${esc(weapon.description ?? "")}</textarea></div>
    ${weapon.ability ? `<div class="chip">Habilidade: ${esc(weapon.ability.name)} · usos ${esc(weapon.ability.uses)}</div>` : ""}
  </div>`;
}

function equipmentRow(item) {
  return `<div class="inventory-row">
    <header><div><strong>${esc(item.name)}</strong><br><span class="muted">${esc(item.category)}</span></div><button class="danger" type="button" data-action="remove-equipment" data-id="${esc(item.id)}">Remover</button></header>
    <div class="grid three">
      <div class="field"><label>Peso</label><input data-array="equipment" data-id="${esc(item.id)}" data-field="weight" value="${esc(item.weight ?? "")}"></div>
      <div class="field"><label>Quantidade</label><input type="number" data-array="equipment" data-id="${esc(item.id)}" data-field="qty" value="${esc(item.qty ?? 1)}"></div>
      <div class="field"><label>Categoria</label><input data-array="equipment" data-id="${esc(item.id)}" data-field="category" value="${esc(item.category ?? "")}"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea data-array="equipment" data-id="${esc(item.id)}" data-field="description" data-live="true">${esc(item.description ?? "")}</textarea></div>
  </div>`;
}

function abilityCard(ability) {
  return `<div class="talent-card">
    <header><div><strong>${esc(ability.name)}</strong><br><span class="tag">${esc(ability.type)}</span>${ability.uses ? ` <span class="chip">Usos ${esc(ability.uses)}</span>` : ""}</div><div class="inline"><button class="ghost" type="button" data-action="open-ability" data-id="${esc(ability.id)}">Ver</button><button class="danger" type="button" data-action="remove-ability" data-id="${esc(ability.id)}">Remover</button></div></header>
    <p>${esc(ability.description)}</p>
  </div>`;
}

function talentCard(talent) {
  const hasConditional = ["conditional", "mixed"].includes(talent.mode);
  return `<div class="talent-card">
    <header><div><strong>${esc(talent.name)}</strong><br><span class="tag ${hasConditional ? "pink" : "ok"}">${esc(talent.tag)}</span> <span class="chip">Nível ${esc(talent.level)}</span>${talent.stackable ? ` <span class="tag">acumulável</span>` : ""}</div><div class="inline">${hasConditional ? `<button class="switch small-switch ${talent.enabled ? "on" : ""}" type="button" role="switch" aria-checked="${Boolean(talent.enabled)}" data-action="toggle-talent" data-id="${esc(talent.id)}"><span class="switch-track"><span class="switch-knob"></span></span><span>${talent.enabled ? "Ligado" : "Desligado"}</span></button>` : ""}<button class="ghost" type="button" data-action="open-talent" data-id="${esc(talent.id)}">Ver</button><button class="danger" type="button" data-action="remove-talent" data-id="${esc(talent.id)}">Remover</button></div></header>
    <p>${esc(talent.description)}</p>
  </div>`;
}

function worldLawCard(law) {
  const resistanceMode = ["sem", "com"].includes(law.resistanceMode) ? law.resistanceMode : "";
  const resistanceTag = resistanceMode ? `<span class="tag law-resistance-${resistanceMode}">${resistanceMode.toUpperCase()} Resistência</span>` : "";
  return `<div class="law-card">
    <header><div><strong>${esc(law.name)}</strong><br><span class="tag">${esc(law.category)}</span> ${resistanceTag}</div><button class="danger" type="button" data-action="remove-world-law" data-id="${esc(law.id)}">Remover</button></header>
    ${["target", "resistance", "effect"].map((fieldName) => `<p><strong>${fieldLabel(fieldName)}:</strong> ${esc(law[fieldName])} <button class="icon-button" type="button" data-action="edit-law-field" data-id="${esc(law.id)}" data-field="${fieldName}" title="Editar">🖋</button></p>`).join("")}
  </div>`;
}

function fieldLabel(fieldName) {
  return { target: "Alvo", resistance: "Resistência", effect: "Efeito" }[fieldName] ?? fieldName;
}

function customWorldLawOption() {
  return {
    ID: "CUSTOM-HYB",
    Categoria: "Híbrido",
    "Lei do Mundo": "Customizada",
    Alvo: "",
    "Resistência sugerida": "",
    "N1 (Mundo 1-4)": "",
    "N2 (Mundo 5-9)": "",
    "N3 (Mundo 10)": "",
    "Se falhar": "",
    "Se passar": "",
  };
}

function categoryKey(value) {
  return fold(value).replace(/[^A-Z]/g, "");
}

function isHybridCategory(value) {
  const key = categoryKey(value);
  return key.includes("HIBRIDO") || key.includes("HBRIDO") || key.endsWith("BRIDO");
}

function normalizeLawResistanceMode(value) {
  return value === "com" ? "com" : "sem";
}

function lawResistanceModes(law) {
  const title = fold(law?.["Lei do Mundo"] ?? "");
  if (title.includes("SEM/COM RESISTENCIA") || title.includes("COM/SEM RESISTENCIA")) return ["sem", "com"];
  if (law?.ID === "UTI-29" || title.includes("COM RESISTENCIA")) return ["com"];
  return ["sem"];
}

function isDualResistanceLaw(law) {
  return lawResistanceModes(law).length === 2;
}

function lawNameForResistance(law, resistanceMode) {
  const name = law?.["Lei do Mundo"] ?? "";
  const mode = normalizeLawResistanceMode(resistanceMode);
  if (isDualResistanceLaw(law)) {
    const label = mode === "com" ? "COM" : "SEM";
    return name.replace(/\((?:sem\/com|com\/sem)\s+Resistência([^)]*)\)/i, `(${label} Resistência$1)`);
  }
  if (law?.ID === "UTI-29") return `${name} (COM Resistência)`;
  if (lawResistanceModes(law)[0] === "com") return name.replace(/\(com Resistência([^)]*)\)/i, "(COM Resistência$1)");
  return name;
}

function splitDualLawEffect(effect) {
  const text = String(effect ?? "").trim();
  const semMatch = /\bSem:\s*/i.exec(text);
  if (!semMatch) return null;
  const afterSem = text.slice(semMatch.index + semMatch[0].length);
  const comMatch = /\bCom(?:\s+([A-Z]{2,}))?:\s*/i.exec(afterSem);
  if (!comMatch) return null;
  return {
    prefix: text.slice(0, semMatch.index).trim(),
    sem: afterSem.slice(0, comMatch.index).trim(),
    com: afterSem.slice(comMatch.index + comMatch[0].length).trim(),
    comResistance: comMatch[1]?.toUpperCase() ?? "",
  };
}

function lawDetailsForResistance(law, effectKey, resistanceMode) {
  const mode = normalizeLawResistanceMode(resistanceMode);
  const rawEffect = law?.[effectKey] ?? "";
  if (!isDualResistanceLaw(law)) {
    return {
      effect: rawEffect,
      resistance: law?.["Resistência sugerida"] ?? "Não se aplica",
      fail: law?.["Se falhar"] ?? "Sem teste direto.",
      pass: law?.["Se passar"] ?? "Sem teste direto.",
    };
  }
  const split = splitDualLawEffect(rawEffect);
  const selectedEffect = split ? [split.prefix, split[mode]].filter(Boolean).join(" ") : rawEffect;
  if (mode === "sem") {
    return { effect: selectedEffect, resistance: "Não se aplica", fail: "Sem teste direto.", pass: "Sem teste direto." };
  }
  return {
    effect: selectedEffect,
    resistance: split?.comResistance || law?.["Resistência sugerida"] || "Conforme regra comum",
    fail: law?.["Se falhar"] ?? "Aplica o efeito integral descrito na Lei.",
    pass: law?.["Se passar"] ?? "Reduz ou evita o efeito conforme a regra comum.",
  };
}

function lawsForCategory(category, resistanceMode = sessionUi.lawResistanceMode) {
  const normalized = categoryKey(category);
  if (isHybridCategory(category)) return [customWorldLawOption(), ...DB.worldLaws.filter((law) => isHybridCategory(law.Categoria))];
  const categoryLaws = normalized.startsWith("UTILIT")
    ? DB.worldLaws.filter((law) => categoryKey(law.Categoria).startsWith("UTILIT") || categoryKey(law.Categoria) === "UTILIDADE")
    : DB.worldLaws.filter((law) => categoryKey(law.Categoria) === normalized);
  const mode = normalizeLawResistanceMode(resistanceMode);
  return categoryLaws.filter((law) => lawResistanceModes(law).includes(mode));
}

function actionCostLabel(cost) {
  return { standard: "Ação Padrão", bonus: "Ação Bônus", movement: "Ação de Movimento", reaction: "Reação", full: "Ação completa", free: "Ação livre" }[cost] ?? cost;
}

function openModal(title, body, footer = `<button class="ghost" type="button" data-action="close-modal">Fechar</button>`) {
  if (!$("#modalRoot .modal")) modalReturnFocus = document.activeElement;
  const titleId = nextControlId("modal-title");
  $("#modalRoot").innerHTML = `<div class="modal-backdrop" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="${titleId}" data-stop-close><header><h2 id="${titleId}">${esc(title)}</h2><button class="icon-button" type="button" data-action="close-modal" aria-label="Fechar">×</button></header><div class="modal-body">${body}</div><footer>${footer}</footer></div></div>`;
  associateLabels($("#modalRoot"));
  requestAnimationFrame(() => modalFocusable()[0]?.focus());
}

function closeModal() {
  $("#modalRoot").innerHTML = "";
  const returnTarget = modalReturnFocus;
  modalReturnFocus = null;
  if (returnTarget?.isConnected && typeof returnTarget.focus === "function") requestAnimationFrame(() => returnTarget.focus());
}

function modalFocusable() {
  return $$('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])', $("#modalRoot"));
}

function handleKeydown(event) {
  const modal = $("#modalRoot .modal");
  if (event.key === "Escape" && modal) {
    closeModal();
    event.preventDefault();
    return;
  }
  if (event.key === "Tab" && modal) {
    const focusable = modalFocusable();
    if (focusable.length) {
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    }
    return;
  }
  const focusedTab = event.target.closest?.('[role="tab"]');
  if (focusedTab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    const tabs = $$('[role="tab"]:not([disabled])', $("#tabs"));
    const current = tabs.indexOf(focusedTab);
    let nextIndex = current;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else nextIndex = (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    if (nextTab) {
      sessionUi.activeTab = nextTab.dataset.tab;
      render();
      requestAnimationFrame(() => $(`#tab-${sessionUi.activeTab}`)?.focus());
      event.preventDefault();
    }
    return;
  }
  const typing = /INPUT|SELECT|TEXTAREA/.test(event.target?.tagName ?? "");
  if (typing) return;
  if (event.ctrlKey && /^[1-7]$/.test(event.key)) {
    const next = TABS[Number(event.key) - 1]?.[0];
    if (next && (next !== "mundo" || worldUnlocked())) {
      sessionUi.activeTab = next;
      render();
      event.preventDefault();
    }
  }
  if (event.altKey && event.key.toLowerCase() === "r") {
    passTurn();
    scheduleSave();
    event.preventDefault();
  }
}

function openStartModal() {
  openModal("Começar ficha", `
    <div class="grid two">
      <div class="card stack"><h3>Já tenho uma ficha antiga</h3><p>Importe um PDF baseado na Ficha Marufia Automática. A ficha tentará ler os campos principais e avisará o que faltar.</p><input type="file" accept="application/pdf" data-file="pdf"></div>
      <div class="card stack"><h3>Criar do zero</h3><p>Começa com uma ficha em branco, já com regiões, culturas, magias, perícias, talentos e leis carregadas.</p><button class="button" type="button" data-action="start-new">Criar ficha nova</button></div>
    </div>
  `);
}

function openAttributeModal(name) {
  const value = attr(name);
  openModal(name, `<div class="stack">
    <div class="stat"><span class="muted">Valor atual</span><strong>${value}</strong></div>
    <p>${esc(successText(value))}</p>
    <div class="inline">
      <button class="button" type="button" data-action="roll-attribute" data-attribute="${esc(name)}" data-mode="normal">Rolar d100</button>
      <button class="ghost" type="button" data-action="roll-attribute" data-attribute="${esc(name)}" data-mode="adv">Com vantagem</button>
      <button class="ghost" type="button" data-action="roll-attribute" data-attribute="${esc(name)}" data-mode="dis">Com desvantagem</button>
    </div>
  </div>`);
}

function openCombatRollModal() {
  const skills = combatTestSkills();
  const selected = skills[0];
  if (!selected) return addError("LAT-PT-001", "Nenhuma perícia de combate disponível.");
  const skillValue = skillFinal(selected.name);
  openModal("Teste de combate contra CA", `
    <div class="combat-roll-form stack">
      <div class="dice-mark" aria-hidden="true">⚄</div>
      <div class="grid two">
        <div class="field"><label>Perícia</label><select id="combatRollSkill">${skills.map((skill) => `<option value="${esc(skill.name)}">${esc(skill.label)}</option>`).join("")}</select></div>
        <div class="field"><label>CA da criatura</label><input id="combatTargetCa" type="number" step="1" value="0" inputmode="numeric"></div>
      </div>
      <div class="combat-roll-equation" aria-live="polite">
        <div class="stat"><span class="muted">Perícia final</span><strong id="combatSkillValue">${esc(skillValue)}</strong></div>
        <span aria-hidden="true">−</span>
        <div class="stat"><span class="muted">CA</span><strong id="combatCaValue">0</strong></div>
        <span aria-hidden="true">=</span>
        <div class="stat"><span class="muted">Valor-alvo</span><strong id="combatTargetValue">${esc(skillValue)}</strong></div>
      </div>
      <p class="muted small">CA negativa aumenta o valor-alvo. Um resultado natural 01 sempre acerta.</p>
    </div>
  `, `<button class="button" type="button" data-action="roll-combat-test" data-mode="normal">Normal</button><button class="ghost" type="button" data-action="roll-combat-test" data-mode="adv">Vantagem</button><button class="ghost" type="button" data-action="roll-combat-test" data-mode="dis">Desvantagem</button><button class="ghost" type="button" data-action="close-modal">Fechar</button>`);
}

function combatAdjustedTarget(skillName, targetCa) {
  return skillFinal(skillName) - num(targetCa, 0);
}

function updateCombatRollPreview() {
  const skillName = $("#combatRollSkill")?.value;
  if (!combatTestSkills().some((skill) => skill.name === skillName)) return;
  const ca = num($("#combatTargetCa")?.value, 0);
  const skillValue = skillFinal(skillName);
  const target = combatAdjustedTarget(skillName, ca);
  if ($("#combatSkillValue")) $("#combatSkillValue").textContent = String(skillValue);
  if ($("#combatCaValue")) $("#combatCaValue").textContent = String(ca);
  if ($("#combatTargetValue")) $("#combatTargetValue").textContent = String(target);
}

function openSkillModal(name) {
  const skill = DB.skills.find((item) => item.name === name);
  if (!skill) return addError("LAT-PT-001", name);
  const value = skillFinal(name);
  openModal(name, `
    <div class="stack">
      <div class="stat"><span class="muted">Valor final</span><strong>${value}</strong></div>
      <p>${esc(successText(value))}</p>
      <p><strong>Uso:</strong> ${esc(skill.description)}</p>
      <div class="inline">
        <button class="button" type="button" data-action="roll-skill" data-skill="${esc(name)}" data-mode="normal">Rolar d100</button>
        <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(name)}" data-mode="adv">Com vantagem</button>
        <button class="ghost" type="button" data-action="roll-skill" data-skill="${esc(name)}" data-mode="dis">Com desvantagem</button>
      </div>
    </div>`);
}

function openModifiersModal(name) {
  const mods = skillModifiers(name);
  openModal(`Modificadores: ${name}`, `<div class="stack">${mods.map((mod) => `<div class="card"><strong>${esc(mod.detail)}</strong><p class="muted">${esc(mod.source)}</p></div>`).join("") || `<div class="empty">Nenhum modificador automático.</div>`}</div>`);
}

function armorIconOptions() {
  return [
    ["plate", "Armadura de Placas"],
    ["scale", "Armadura de Escamas"],
    ["chain", "Cota de Malha"],
    ["leather", "Couro"],
    ["breastplate", "Peitoral"],
  ];
}

function armorPickerCard(armor) {
  const id = armorSelectId(armor);
  const selected = state.inventory.armorId === id;
  return `<div class="armor-picker-card ${selected ? "selected" : ""}">
    <button class="armor-picker-main" type="button" data-action="select-armor" data-armor-id="${esc(id)}">
      ${armorIcon(armor)}
      <span>
        <strong>${esc(armor.name)}</strong>
        <small>${esc(armor.category || (armor.custom ? "Personalizada" : "Armadura"))}</small>
      </span>
    </button>
    ${armorInfoGrid(armor)}
    <p class="muted">${esc(armor.property || armor.description || "Sem propriedade cadastrada.")}</p>
    <div class="inline">
      <button class="${selected ? "button" : "ghost"}" type="button" data-action="select-armor" data-armor-id="${esc(id)}">${selected ? "Selecionada" : "Selecionar"}</button>
      ${armor.custom ? `<button class="ghost" type="button" data-action="open-custom-armor" data-id="${esc(armor.id)}">Editar</button><button class="danger" type="button" data-action="remove-custom-armor" data-id="${esc(armor.id)}">Remover</button>` : ""}
    </div>
  </div>`;
}

function openArmorPicker() {
  const official = DB.armors.filter((item) => item.category !== "Escudo");
  const custom = ensureCustomArmors();
  openModal("Armaduras", `
    <div class="armor-picker-actions">
      <button class="ghost" type="button" data-action="select-armor" data-armor-id="">Sem armadura</button>
      <button class="button" type="button" data-action="open-custom-armor">Armadura personalizada</button>
    </div>
    <h3>Armaduras oficiais</h3>
    <div class="armor-picker-grid">${official.map((armor) => armorPickerCard(armor)).join("")}</div>
    <h3>Armaduras personalizadas</h3>
    <div class="armor-picker-grid">${custom.map((armor) => armorPickerCard(armor)).join("") || `<div class="empty">Nenhuma armadura personalizada criada.</div>`}</div>
  `, `<button class="ghost" type="button" data-action="close-modal">Fechar</button>`);
}

function openCustomArmorModal(id = "") {
  const existing = ensureCustomArmors().find((armor) => armor.id === id);
  const iconPreset = existing?.iconPreset ?? "plate";
  const iconColor = armorIconColor(existing ?? { custom: true, iconPreset });
  const iconOptions = armorIconOptions().map(([value, label]) => `<option value="${esc(value)}" ${iconPreset === value ? "selected" : ""}>${esc(label)}</option>`).join("");
  openModal(existing ? "Editar armadura personalizada" : "Armadura personalizada", `
    <div class="armor-custom-preview">
      ${armorIcon({ custom: true, iconPreset, iconColor }, "large")}
      <div><strong>${esc(existing?.name ?? "Nova armadura")}</strong><p class="muted">A cor abaixo altera o ícone visual da armadura.</p></div>
    </div>
    <div class="grid two">
      <div class="field"><label>Nome</label><input id="customArmorName" value="${esc(existing?.name ?? "")}"></div>
      <div class="field"><label>Ícone</label><select id="customArmorIconPreset">${iconOptions}</select></div>
      <div class="field"><label>CA</label><input id="customArmorCa" type="number" value="${esc(existing?.ca ?? 0)}"></div>
      <div class="field"><label>Cor do ícone</label><input id="customArmorIconColor" type="color" value="${esc(iconColor)}"></div>
      <div class="field"><label>Bloqueio Cortante</label><input id="customArmorBlockCortante" type="number" value="${esc(existing?.block?.cortante ?? 0)}"></div>
      <div class="field"><label>Bloqueio Perfurante</label><input id="customArmorBlockPerfurante" type="number" value="${esc(existing?.block?.perfurante ?? 0)}"></div>
      <div class="field"><label>Bloqueio Contundente</label><input id="customArmorBlockContundente" type="number" value="${esc(existing?.block?.contundente ?? 0)}"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea id="customArmorDescription">${esc(existing?.description ?? "")}</textarea></div>
  `, `<button class="button" type="button" data-action="save-custom-armor" data-id="${esc(existing?.id ?? "")}">Salvar</button><button class="ghost" type="button" data-action="open-armor-picker">Voltar</button>`);
}

function selectArmor(id = "") {
  state.inventory.armorId = id;
  closeModal();
  render();
}

function saveCustomArmor(id = "") {
  const name = $("#customArmorName")?.value.trim();
  if (!name) return addError("LAT-UI-002", "Nome da armadura vazio.");
  const armor = {
    id: id || uid(),
    custom: true,
    name,
    description: $("#customArmorDescription")?.value.trim() ?? "",
    property: $("#customArmorDescription")?.value.trim() ?? "",
    ca: num($("#customArmorCa")?.value, 0),
    weight: "Personalizada",
    category: "Personalizada",
    block: {
      cortante: num($("#customArmorBlockCortante")?.value, 0),
      perfurante: num($("#customArmorBlockPerfurante")?.value, 0),
      contundente: num($("#customArmorBlockContundente")?.value, 0),
    },
    iconPreset: $("#customArmorIconPreset")?.value || "plate",
    iconColor: $("#customArmorIconColor")?.value || "#b8c0cc",
  };
  const custom = ensureCustomArmors();
  const index = custom.findIndex((item) => item.id === armor.id);
  if (index >= 0) custom[index] = armor;
  else custom.push(armor);
  state.inventory.armorId = customArmorKey(armor.id);
  closeModal();
  render();
}

function removeCustomArmor(id = "") {
  state.inventory.customArmors = ensureCustomArmors().filter((armor) => armor.id !== id);
  if (state.inventory.armorId === customArmorKey(id)) state.inventory.armorId = "";
  scheduleSave();
  openArmorPicker();
}

function ensureDefenseAdjustments() {
  if (!state.combat.defenseAdjustments) state.combat.defenseAdjustments = { ca: 0, block: 0 };
  return state.combat.defenseAdjustments;
}

function signedValue(value) {
  const next = num(value, 0);
  return `${next > 0 ? "+" : ""}${next}`;
}

function blockText(block) {
  return `C ${block.cortante} · P ${block.perfurante} · Cn ${block.contundente}`;
}

function openDefenseAdjustmentModal(kind = "ca") {
  const safeKind = kind === "block" ? "block" : "ca";
  const ca = caBreakdown();
  const isBlock = safeKind === "block";
  const title = isBlock ? "Ajustar Bloqueio" : "Ajustar CA";
  const calculated = isBlock ? blockText(ca.calculatedBlock) : ca.calculatedTotal;
  const finalValue = isBlock ? blockText(ca.block) : ca.total;
  const adjustment = isBlock ? ca.adjustments.block : ca.adjustments.ca;
  openModal(title, `
    <div class="stack">
      <div class="grid three">
        <div class="stat"><span class="muted">Calculado</span><strong>${esc(calculated)}</strong></div>
        <div class="stat"><span class="muted">Ajuste manual</span><strong>${esc(signedValue(adjustment))}</strong></div>
        <div class="stat"><span class="muted">Final</span><strong>${esc(finalValue)}</strong></div>
      </div>
      <p class="muted">Este ajuste soma uma camada manual de combate e não altera atributos, armaduras, talentos, magias ou efeitos temporários.</p>
    </div>
  `, `
    <button class="ghost" type="button" data-action="adjust-defense" data-defense="${safeKind}" data-delta="-1">-1</button>
    <button class="button" type="button" data-action="adjust-defense" data-defense="${safeKind}" data-delta="1">+1</button>
    <button class="ghost" type="button" data-action="reset-defense-adjustment" data-defense="${safeKind}">Zerar ajuste</button>
    <button class="ghost" type="button" data-action="close-modal">Fechar</button>
  `);
}

function adjustDefense(kind, delta) {
  const safeKind = kind === "block" ? "block" : "ca";
  const adjustments = ensureDefenseAdjustments();
  adjustments[safeKind] = num(adjustments[safeKind], 0) + num(delta, 0);
  state.combat.log.unshift(`${safeKind === "block" ? "Bloqueio" : "CA"} manual ${signedValue(delta)}: ajuste ${signedValue(adjustments[safeKind])}.`);
  render();
  openDefenseAdjustmentModal(safeKind);
}

function resetDefenseAdjustment(kind) {
  const safeKind = kind === "block" ? "block" : "ca";
  const adjustments = ensureDefenseAdjustments();
  if (num(adjustments[safeKind], 0)) state.combat.log.unshift(`${safeKind === "block" ? "Bloqueio" : "CA"} manual zerado.`);
  adjustments[safeKind] = 0;
  render();
  openDefenseAdjustmentModal(safeKind);
}

function openCaModal() {
  const ca = caBreakdown();
  openModal("Classe de Armadura", `
    <div class="grid two">
      <div class="card">
        <h3>Cálculo</h3>
        <p>${ca.perceptionOverride ? "Núcleo dos Olhos ativo: CA = Percepção final + Magia Forte." : "20 + (DES ÷ 5) - 30 + armadura + escudo + efeitos + talentos + núcleo + Magia Forte"}</p>
        <ul>
          <li>Base DES: ${ca.base}</li>
          <li>Armadura/Escudo: ${ca.armor}</li>
          <li>Efeitos temporários: ${ca.effects}</li>
          <li>Talentos ativos: ${ca.talents}</li>
          <li>Núcleo: ${ca.perceptionOverride ? `Percepção ${skillFinal("Percepção")}` : ca.core}</li>
          <li>Magias Fortes ativas: ${ca.forte}</li>
        </ul>
        <p class="muted">Ajuste manual de CA: ${signedValue(ca.adjustments.ca)}</p>
        <div class="stat"><span class="muted">CA final</span><strong>${ca.total}</strong></div>
      </div>
      <div class="card">
        <h3>Bloqueio</h3>
        <p>Calculado: ${blockText(ca.calculatedBlock)}</p>
        <p>Ajuste manual: ${signedValue(ca.adjustments.block)}</p>
        <p>Cortante: ${ca.block.cortante}</p>
        <p>Perfurante: ${ca.block.perfurante}</p>
        <p>Contundente: ${ca.block.contundente}</p>
      </div>
    </div>
    <h3>Efeitos temporários</h3>
    <div class="grid four">
      <div class="field"><label>Nome</label><input id="tempEffectName"></div>
      <div class="field"><label>CA</label><input id="tempEffectCa" type="number" value="0"></div>
      <div class="field"><label>Bloqueio</label><input id="tempEffectBlock" type="number" value="0"></div>
      <div class="field"><label>&nbsp;</label><button class="button" type="button" data-action="add-temp-effect">Adicionar</button></div>
    </div>
    <div class="stack" style="margin-top: 12px;">${state.effects.map((effect) => `<div class="chip">${esc(effect.name)} · CA ${effect.ca} · Bloqueio ${effect.block?.cortante ?? 0}<button class="ghost" type="button" data-action="remove-temp-effect" data-id="${esc(effect.id)}">Remover</button></div>`).join("") || `<div class="empty">Nenhum efeito temporário.</div>`}</div>
  `);
}

function openSpellModal(type, knownId = "") {
  const known = knownId ? state.magic.knownExtras.find((spell) => spell.id === knownId) : null;
  const spell = known ? getSpell(known.type, known.regionCode) : getSpell(type);
  const level = known ? known.level : num(state.magic.baseLevels[type], 0);
  openModal(spell?.name ?? type, `<p>${esc(spell?.description ?? "")}</p>${renderLevels(spell, level)}`);
}

function openSpellPreviewModal() {
  const regionCode = sessionUi.extraMagicRegion === "Sem Região" ? "" : sessionUi.extraMagicRegion;
  const spell = getSpell(sessionUi.extraMagicType, regionCode);
  openModal(spell?.name ?? "Magia Extra", `<p>${esc(spell?.description ?? "")}</p>${renderLevels(spell, 0)}`);
}

function openCombatSpellModal(spellId) {
  const item = knownSpells().find((spell) => spell.id === spellId);
  if (!item) return addError("LAT-MAG-002", spellId);
  openModal(item.spell?.name ?? item.type, `<p>${esc(item.spell?.description ?? "")}</p>${renderLevels(item.spell, item.level)}`);
}

function openCoreDetails() {
  const core = currentCore();
  if (!core) return addError("LAT-UI-002", "Nenhum Núcleo Mágico selecionado.");
  openModal(`Núcleo do ${core.name}`, `
    <div class="magic-core-detail stack">
      <p>${esc(core.description)}</p>
      <div class="grid two">
        <div class="card"><strong>Efeito passivo</strong><p>${esc(core.passive)}</p></div>
        <div class="card"><strong>Efeito ativável</strong><p>${esc(core.active)}</p></div>
        <div class="card"><strong>Custo</strong><p>${esc(core.cost)}</p></div>
        <div class="card"><strong>Duração</strong><p>${esc(core.duration)}</p></div>
        <div class="card"><strong>Ação necessária</strong><p>${esc(core.action)}</p></div>
        <div class="card"><strong>Afeta</strong><p>${esc(core.affects)}</p></div>
      </div>
      <div class="card"><strong>Cálculo automático</strong><p>${esc(core.calculation)}</p></div>
      <div class="card"><strong>Observações</strong><p>${esc(core.notes)}</p></div>
    </div>
  `);
}

function resetCoreRuntime() {
  state.magicCore.preparedBoost = "";
  state.magicCore.caBoostTurns = 0;
}

function prepareCoreBoost() {
  const core = currentCore();
  if (!core || !["ventre", "punho"].includes(core.id)) return;
  state.magicCore.preparedBoost = core.id;
  state.combat.log.unshift(`Núcleo ${core.name}: ${core.preparedLabel} preparado para a próxima magia.`);
  render();
}

function clearCoreBoost() {
  state.magicCore.preparedBoost = "";
  state.combat.log.unshift("Preparação do Núcleo cancelada.");
  render();
}

function activateCoreCa() {
  if (!hasCore("antebraco")) return;
  if (!spendPm(1, "Núcleo Antebraço (+10 CA)")) return render();
  state.magicCore.caBoostTurns = 1;
  state.combat.log.unshift("Núcleo Antebraço: bônus alterado para +10 CA por 1 rodada.");
  render();
}

function coreReduceDamage() {
  if (!hasCore("antebraco")) return;
  const forteActive = (state.combat.activeSpells ?? []).some((spell) => spell.type === "Forte");
  if (!forteActive) {
    toast("A redução do Antebraço exige Magia Forte ativa.", "warn");
    return;
  }
  if (!spendPm(1, "Núcleo Antebraço (reduzir dano)")) return render();
  const roll = Math.floor(Math.random() * 6) + 1;
  state.combat.log.unshift(`Núcleo Antebraço: reduza ${roll} de dano desta ocorrência.`);
  render();
}

function recoverCoreRest() {
  if (!hasCore("pulmao")) return;
  const hours = Math.max(1, num(sessionUi.coreRestHours, 1));
  const recovered = RULES.coreRestBonus(hours);
  state.resources.pmCurrent = clamp(pmCurrent() + recovered, 0, maxPm());
  state.combat.log.unshift(`Núcleo Pulmão: +${recovered} PM por ${hours}h de descanso (${pmCurrent()}/${maxPm()}).`);
  render();
}

function recoverCoreFlat() {
  if (!hasCore("pulmao")) return;
  state.resources.pmCurrent = clamp(pmCurrent() + 3, 0, maxPm());
  state.combat.log.unshift(`Núcleo Pulmão: +3 PM (${pmCurrent()}/${maxPm()}).`);
  render();
}

function registerActiveSpell(item, overrides = {}) {
  if (!item) return;
  const maintenanceCost = Object.hasOwn(overrides, "maintenanceCost") ? overrides.maintenanceCost : magicMaintenanceCost(item);
  const turns = Object.hasOwn(overrides, "turns") ? overrides.turns : magicDurationTurns(item);
  const forte = forteBonusesForItem(item);
  if (!maintenanceCost && !turns && item.type !== "Mundo") return;
  state.combat.activeSpells = (state.combat.activeSpells ?? []).filter((spell) => spell.spellId !== item.id);
  state.combat.activeSpells.unshift({
    id: uid(),
    spellId: item.id,
    type: item.type,
    name: item.spell?.name ?? item.type,
    level: item.level,
    turns,
    maintenanceCost,
    caBonus: item.type === "Forte" ? forte.ca : 0,
    effectiveVigor: item.type === "Forte" ? forte.vigor : 0,
  });
}

function activateSpellItem(item, actionCost, options = {}) {
  if (!item) return false;
  const pmCost = magicTotalPmCost(item);
  if (!Number.isFinite(pmCost)) {
    addError("LAT-DB-005", `${item.spell?.name ?? item.type} N${item.level}: custo de ativação não confirmado.`);
    return false;
  }
  if (pmCurrent() < pmCost) {
    toast(`PM insuficiente para ${item.spell?.name ?? item.type}: precisa de ${pmCost} PM.`, "warn");
    return false;
  }
  if (!useAction(actionCost, `Ativar ${item.spell?.name ?? item.type}`, false)) return false;
  state.resources.pmCurrent = clamp(pmCurrent() - pmCost, 0, maxPm());
  const prepared = preparedBoostForItem(item);
  state.combat.log.unshift(`${item.spell?.name ?? item.type}: -${pmCost} PM (${state.resources.pmCurrent}/${maxPm()}).`);
  if (prepared) {
    state.combat.log.unshift(`Núcleo ${prepared.name}: ${prepared.preparedLabel} aplicado nesta magia.`);
    state.magicCore.preparedBoost = "";
  }
  registerActiveSpell(item, options);
  render();
  return true;
}

function openForteActivationModal(spellId) {
  const item = knownSpells().find((spell) => spell.id === spellId) ?? knownSpells().find((spell) => spell.type === "Forte");
  if (!item) return addError("LAT-MAG-002", "Forte");
  openModal("Ativar Magia Forte", `
    <p>Escolha como a Magia Forte será sustentada.</p>
    <div class="grid two">
      <div class="card"><strong>Reação</strong><p>Dura 1 turno. Não registra custo de manutenção.</p></div>
      <div class="card"><strong>Ação Padrão</strong><p>Dura 10 turnos. Se o nível tiver manutenção, ela será cobrada ao passar turno.</p></div>
    </div>
  `, `<button class="button" type="button" data-action="activate-forte" data-spell-id="${esc(item.id)}" data-mode="reaction">Reação · 1 turno</button><button class="button" type="button" data-action="activate-forte" data-spell-id="${esc(item.id)}" data-mode="standard">Ação Padrão · 10 turnos</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function activateForte(spellId, mode) {
  const item = knownSpells().find((spell) => spell.id === spellId) ?? knownSpells().find((spell) => spell.type === "Forte");
  closeModal();
  if (!item) return addError("LAT-MAG-002", "Forte");
  const reactionMode = mode === "reaction";
  return activateSpellItem(item, reactionMode ? "reaction" : "standard", {
    turns: reactionMode ? 1 : 10,
    maintenanceCost: reactionMode ? 0 : magicMaintenanceCost(item),
  });
}

function passTurn() {
  if (state.world.status === "active" && !Number.isInteger(state.world.durationTurns)) {
    openWorldDurationModal(true);
    toast("Defina a duração do Mundo antes de passar o turno.", "warn");
    return false;
  }
  const remaining = [];
  for (const spell of (state.combat.activeSpells ?? []).filter((item) => item.type !== "Mundo")) {
    if (num(spell.maintenanceCost, 0) > 0) {
      if (!spendPm(spell.maintenanceCost, `Manter ${spell.name}`)) {
        state.combat.log.unshift(`${spell.name} foi encerrada por falta de PM.`);
        continue;
      }
    }
    if (spell.turns === null || spell.turns === undefined || spell.turns === "") {
      remaining.push(spell);
      continue;
    }
    const nextTurns = num(spell.turns, 0) - 1;
    if (nextTurns > 0) remaining.push({ ...spell, turns: nextTurns });
    else {
      state.combat.log.unshift(`${spell.name} encerrou.`);
    }
  }
  state.combat.activeSpells = remaining;
  if (state.world.status === "active") {
    if (state.world.maintenancePaidForTurn) {
      const nextDuration = num(state.world.durationTurns, 0) - 1;
      state.world.maintenancePaidForTurn = false;
      if (nextDuration <= 0) {
        state.world.status = "closed";
        state.world.durationTurns = null;
        state.combat.log.unshift("Mundo encerrado: a duração chegou a 0 turnos.");
      } else {
        state.world.durationTurns = nextDuration;
        state.combat.log.unshift(`Mundo mantido por mais um turno. Restam ${nextDuration} turno(s); a próxima manutenção está pendente.`);
      }
    } else {
      state.world.status = "closed";
      state.world.durationTurns = null;
      state.world.maintenancePaidForTurn = false;
      state.combat.log.unshift("Mundo encerrado: a manutenção não foi paga antes de passar o turno.");
    }
  }
  if (num(state.magicCore.caBoostTurns, 0) > 0) {
    state.magicCore.caBoostTurns = Math.max(0, num(state.magicCore.caBoostTurns, 0) - 1);
    if (!state.magicCore.caBoostTurns) state.combat.log.unshift("Núcleo Antebraço: bônus de +10 CA encerrado.");
  }
  state.combat.actions = { standard: true, bonus: true, movement: true, reaction: true };
  state.combat.log.unshift("Turno passado.");
  render();
}

function finishCombat() {
  state.combat.activeSpells = [];
  state.combat.actions = { standard: true, bonus: true, movement: true, reaction: true };
  state.combat.defenseAdjustments = { ca: 0, block: 0 };
  state.magicCore.preparedBoost = "";
  state.magicCore.caBoostTurns = 0;
  state.world.status = "closed";
  state.world.durationTurns = null;
  state.world.maintenancePaidForTurn = false;
  state.combat.log.unshift("Combate finalizado. Magias ativas, preparos e ações foram resetados.");
  render();
}

function removeActiveSpell(id) {
  const removed = (state.combat.activeSpells ?? []).find((spell) => spell.id === id);
  state.combat.activeSpells = (state.combat.activeSpells ?? []).filter((spell) => spell.id !== id);
  if (removed) state.combat.log.unshift(`${removed.name} encerrada manualmente.`);
  render();
}

function openAbilityModal(existing = null) {
  openModal(existing ? existing.name : "Add Habilidade", `
    <div class="grid two">
      <div class="field"><label>Nome</label><input id="abilityName" value="${esc(existing?.name ?? "")}"></div>
      <div class="field"><label>Tipo</label><select id="abilityType">${["Ativável", "Técnica", "Passiva", "Outro"].map((type) => `<option ${existing?.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></div>
      <div class="field"><label>Usos</label><input id="abilityUses" type="number" min="0" value="${esc(existing?.uses ?? 0)}"></div>
      <div class="field"><label>Alvo</label><input id="abilityTarget" value="${esc(existing?.target ?? "")}"></div>
      <div class="field"><label>Alcance</label><input id="abilityRange" value="${esc(existing?.range ?? "")}"></div>
      <div class="field"><label>Resistência</label><input id="abilityResistance" value="${esc(existing?.resistance ?? "")}"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea id="abilityDescription">${esc(existing?.description ?? "")}</textarea></div>
    <div class="field"><label>Observações</label><textarea id="abilityNotes">${esc(existing?.notes ?? "")}</textarea></div>
  `, `<button class="button" type="button" data-action="save-ability" data-id="${esc(existing?.id ?? "")}">Salvar</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function openTalentModal(id) {
  const talent = allKnownTalents().find((item) => item.id === id) ?? DB.talents.find((item) => item.name === id);
  if (!talent) return addError("LAT-DB-004", id);
  const hasConditional = ["conditional", "mixed"].includes(talent.mode);
  const note = talent.mode === "mixed"
    ? "Os bônus passivos permanecem aplicados. O switch controla apenas a parte condicional."
    : "Quando ligado, a ficha aplica somente os bônus condicionais automatizados cadastrados.";
  openModal(talent.name, `<span class="tag ${hasConditional ? "pink" : "ok"}">${esc(talent.tag)}</span><p>${esc(talent.description)}</p>${hasConditional ? `<p class="muted">${esc(note)}</p>` : ""}`);
}

function openWorldDetails() {
  const level = worldLevel();
  const spell = getSpell("Mundo");
  openModal("Detalhes do Mundo", `
    <h3>${esc(state.world.name || "Mundo sem nome")}</h3>
    <p>${esc(state.world.description || "Sem descrição.")}</p>
    <p><strong>Frase:</strong> ${esc(state.world.phrase || "-")}</p>
    <h3>Evolução base</h3>
    ${renderLevels(spell, level)}
    <h3>Leis</h3>
    <div class="stack">${state.world.laws.map((law) => `<div class="card"><strong>${esc(law.name)}</strong><p>${esc(law.effect)}</p></div>`).join("") || `<div class="empty">Nenhuma lei adicionada.</div>`}</div>
    <h3>Efeito Narrativo</h3><p>${esc(state.world.narrative || "-")}</p>
  `);
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (event.target.closest("[data-stop-close]") && button.dataset.action === "close-modal" && event.target !== button) return;
  const action = button.dataset.action;
  const beforeState = state ? persistentSignature() : "";
  if (action !== "close-modal") event.stopPropagation();

  const actions = {
    "close-modal": closeModal,
    "open-start": openStartModal,
    "start-new": () => { localStorage.removeItem(STORAGE_KEY); state = createDefaultState(); state.meta.started = true; closeModal(); render(); },
    "open-settings": openSettings,
    "tab": () => {
      const next = button.dataset.tab;
      if (button.disabled || (next === "mundo" && !worldUnlocked())) return;
      sessionUi.activeTab = next;
      render();
    },
    "open-attribute": () => openAttributeModal(button.dataset.attribute),
    "roll-attribute": () => rollAttribute(button.dataset.attribute, button.dataset.mode),
    "open-skill": () => openSkillModal(button.dataset.skill),
    "open-modifiers": () => openModifiersModal(button.dataset.skill),
    "roll-skill": () => rollSkill(button.dataset.skill, button.dataset.mode),
    "open-combat-roll": openCombatRollModal,
    "roll-combat-test": () => rollCombatTest(button.dataset.mode),
    "open-ca": openCaModal,
    "open-defense-adjust": () => openDefenseAdjustmentModal(button.dataset.defense),
    "adjust-defense": () => adjustDefense(button.dataset.defense, num(button.dataset.delta, 0)),
    "reset-defense-adjustment": () => resetDefenseAdjustment(button.dataset.defense),
    "add-temp-effect": addTempEffect,
    "remove-temp-effect": () => { state.effects = state.effects.filter((effect) => effect.id !== button.dataset.id); closeModal(); render(); openCaModal(); },
    "magic-inc": () => changeMagicLevel(button.dataset.type, 1),
    "magic-dec": () => changeMagicLevel(button.dataset.type, -1),
    "open-spell": () => openSpellModal(button.dataset.type),
    "open-spell-preview": openSpellPreviewModal,
    "toggle-extra-magic": () => { sessionUi.showExtraMagic = !sessionUi.showExtraMagic; render(); },
    "add-extra-magic": addExtraMagic,
    "evolve-extra-magic": () => evolveExtraMagic(button.dataset.id),
    "open-extra-spell": () => openSpellModal("", button.dataset.id),
    "remove-extra-magic": () => { state.magic.knownExtras = state.magic.knownExtras.filter((spell) => spell.id !== button.dataset.id); render(); },
    "open-combat-spell": () => openCombatSpellModal(button.dataset.spellId),
    "activate-magic": () => activateMagic(button.dataset.type, button.dataset.spellId),
    "activate-forte": () => activateForte(button.dataset.spellId, button.dataset.mode),
    "open-core-details": openCoreDetails,
    "prepare-core-boost": prepareCoreBoost,
    "clear-core-boost": clearCoreBoost,
    "activate-core-ca": activateCoreCa,
    "core-reduce-damage": coreReduceDamage,
    "recover-core-rest": recoverCoreRest,
    "recover-core-flat": recoverCoreFlat,
    "open-resource-max": () => openResourceMaxModal(button.dataset.resource),
    "save-resource-max": () => saveResourceMaxBonus(button.dataset.resource),
    "adjust-resource": () => adjustResource(button.dataset.resource, num(button.dataset.delta, 0)),
    "pass-turn": passTurn,
    "finish-combat": finishCombat,
    "reset-actions": passTurn,
    "toggle-action": () => { const key = button.dataset.actionKey; state.combat.actions[key] = !state.combat.actions[key]; render(); },
    "clear-combat-log": () => { state.combat.log = []; render(); },
    "remove-active-spell": () => removeActiveSpell(button.dataset.id),
    "open-armor-picker": openArmorPicker,
    "select-armor": () => selectArmor(button.dataset.armorId ?? ""),
    "open-custom-armor": () => openCustomArmorModal(button.dataset.id ?? ""),
    "save-custom-armor": () => saveCustomArmor(button.dataset.id ?? ""),
    "remove-custom-armor": () => removeCustomArmor(button.dataset.id ?? ""),
    "toggle-shield": () => { state.inventory.shield = !state.inventory.shield; render(); },
    "open-weapon-picker": () => openWeaponPicker(button.dataset.kind),
    "open-custom-weapon": () => openCustomWeapon(),
    "open-weapon-description": () => openWeaponDescription(button.dataset.index),
    "add-weapon": () => addWeaponFromModal(button.dataset.index),
    "save-custom-weapon": saveCustomWeapon,
    "select-weapon": () => { state.inventory.selectedWeaponId = button.dataset.id; render(); },
    "remove-weapon": () => { state.inventory.weapons = state.inventory.weapons.filter((weapon) => weapon.id !== button.dataset.id); render(); },
    "open-equipment-picker": () => openEquipmentPicker(button.dataset.group),
    "open-custom-equipment": () => openCustomEquipment(),
    "open-equipment-description": () => openEquipmentDescription(button.dataset.name, button.dataset.group),
    "add-equipment": () => addEquipmentFromModal(button.dataset.name, button.dataset.group),
    "save-custom-equipment": saveCustomEquipment,
    "remove-equipment": () => { state.inventory.equipment = state.inventory.equipment.filter((item) => item.id !== button.dataset.id); render(); },
    "open-evolve-skills": openEvolveSkills,
    "confirm-evolve-skills": confirmEvolveSkills,
    "open-ability-modal": () => openAbilityModal(),
    "save-ability": () => saveAbility(button.dataset.id),
    "open-ability": () => openAbilityModal(state.abilities.find((ability) => ability.id === button.dataset.id)),
    "remove-ability": () => { state.abilities = state.abilities.filter((ability) => ability.id !== button.dataset.id); render(); },
    "add-talent": addTalent,
    "open-talent": () => openTalentModal(button.dataset.id),
    "toggle-talent": () => toggleTalent(button.dataset.id),
    "remove-talent": () => removeTalent(button.dataset.id),
    "go-magic": () => { sessionUi.activeTab = "magia"; render(); },
    "world-open": openWorldAction,
    "world-duration": () => openWorldDurationModal(true),
    "roll-world-duration": rollWorldDuration,
    "confirm-world-open": confirmWorldOpen,
    "save-world-duration": saveWorldDuration,
    "world-maintain": maintainWorldAction,
    "world-law": useWorldLawAction,
    "world-close": closeWorldAction,
    "world-collapse": collapseWorldAction,
    "open-world-details": openWorldDetails,
    "add-world-law": addWorldLaw,
    "remove-world-law": () => { state.world.laws = state.world.laws.filter((law) => law.id !== button.dataset.id); render(); },
    "edit-law-field": () => openEditLawField(button.dataset.id, button.dataset.field),
    "save-law-field": () => saveLawField(button.dataset.id, button.dataset.field),
    "random-personality": () => randomPersonality(button.dataset.kind),
    "download-json": downloadJson,
    "copy-json": copyJson,
    "import-json-paste": importJsonPaste,
    "apply-json-import": () => applyJsonImport(button.dataset.mode),
    "apply-pdf-import": () => applyPdfImport(button.dataset.mode),
    "cancel-import": cancelImport,
    "open-backups": openBackups,
    "restore-backup": () => restoreBackup(button.dataset.id),
    "download-backup": () => downloadBackup(button.dataset.id),
    "print-sheet": printSheet,
    "open-errors": openErrors,
    "clear-errors": () => { state.errors = []; closeModal(); render(); },
    "request-gm-override": requestGmOverride,
    "enable-gm-override": enableGmOverride,
    "disable-gm-override": disableGmOverride,
  };
  if (actions[action]) {
    actions[action]();
    if (state && beforeState !== persistentSignature()) scheduleSave();
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.id === "combatRollSkill") updateCombatRollPreview();
  if (target.id === "customArmorIconPreset") {
    const icon = $(".armor-custom-preview .armor-icon");
    if (icon) {
      for (const [preset] of armorIconOptions()) icon.classList.remove(`armor-${preset}`);
      icon.classList.add(`armor-${target.value || "plate"}`);
    }
  }
  if (target.dataset.path) {
    let value = target.type === "checkbox" ? target.checked : target.value;
    if (target.type === "number") value = num(value, 0);
    if (target.dataset.path === "character.useIntForSkillPoints") value = value === "true";
    const skillMatch = target.dataset.path.match(/^skills\.(.+)\.added$/);
    const previousSkillValue = skillMatch ? num(state.skills[skillMatch[1]]?.added, 0) : null;
    const previousPathValue = getPath(target.dataset.path);
    const previousRegionCode = state.character.regionCode;
    setPath(target.dataset.path, value);
    if (skillMatch && rejectInvalidSkillAllocation(skillMatch[1], previousSkillValue, target)) {
      render();
      return;
    }
    if (target.dataset.path === "magicCore.selectedId") {
      resetCoreRuntime();
      state.combat.log.unshift(value ? `Núcleo selecionado: ${currentCore()?.name ?? value}.` : "Núcleo removido.");
    }
    if (target.dataset.path === "character.cultureId") {
      const culture = getCulture(value);
      if (culture) state.character.regionCode = culture.regionCode;
    }
    if (target.dataset.path === "character.regionCode") {
      const region = getRegion(value);
      if (region && !region.cultures.some((culture) => culture.id === state.character.cultureId)) state.character.cultureId = "";
    }
    const affectsSkills = target.dataset.path.startsWith("attributes.") || ["character.cultureId", "character.backgroundFamilyId", "character.backgroundPersonalId", "character.useIntForSkillPoints", "magicCore.selectedId"].includes(target.dataset.path);
    if (affectsSkills) {
      const issue = sheetSkillValidationIssue();
      if (issue) {
        setPath(target.dataset.path, previousPathValue);
        if (target.dataset.path === "character.cultureId") state.character.regionCode = previousRegionCode;
        addError(issue.reason === "limit" ? "LAT-CALC-004" : "LAT-PT-002", issue.detail);
        render();
        return;
      }
    }
    if (["ui.lawCategory", "ui.lawResistanceMode"].includes(target.dataset.path)) {
      const first = lawsForCategory(sessionUi.lawCategory, sessionUi.lawResistanceMode)[0];
      sessionUi.lawId = first?.ID ?? "";
    }
    if (!target.dataset.path.startsWith("ui.")) scheduleSave();
    render();
  }
  if (target.dataset.file === "pdf" && target.files?.[0]) importPdf(target.files[0]);
  if (target.dataset.file === "json" && target.files?.[0]) importJsonFile(target.files[0]);
}

function handleInput(event) {
  const target = event.target;
  if (target.id === "combatTargetCa") updateCombatRollPreview();
  if (target.id === "customArmorIconColor") {
    $(".armor-custom-preview .armor-icon")?.style.setProperty("--armor-color", target.value);
  }
  if (target.dataset.path && target.dataset.live) {
    setPath(target.dataset.path, target.value);
    scheduleSave();
  }
  if (target.dataset.array) {
    const list = target.dataset.array === "weapon" ? state.inventory.weapons : state.inventory.equipment;
    const item = list.find((entry) => entry.id === target.dataset.id);
    if (item) item[target.dataset.field] = target.type === "number" ? num(target.value) : target.value;
    scheduleSave();
  }
}

function rollSkill(name, mode) {
  const value = skillFinal(name);
  const roll = rollD100(mode);
  const outcome = d100Outcome(roll.result, value);
  openModal(`Rolagem: ${name}`, `<div class="stat"><span class="muted">${esc(roll.label)}</span><strong>${roll.result}</strong><small>Dados: ${roll.rolls.join(", ")}</small></div><p>Resultado contra ${value}: <strong>${outcome}</strong></p><p>${esc(successText(value))}</p>`);
}

function rollAttribute(name, mode) {
  if (!Object.hasOwn(state.attributes, name)) return addError("LAT-UI-002", `Atributo inválido: ${name}.`);
  const value = attr(name);
  const roll = rollD100(mode);
  const outcome = d100Outcome(roll.result, value);
  openModal(`Rolagem de atributo: ${name}`, `<div class="stat"><span class="muted">${esc(roll.label)}</span><strong>${roll.result}</strong><small>Dados: ${roll.rolls.join(", ")}</small></div><p>Resultado contra ${value}: <strong>${outcome}</strong></p><p>${esc(successText(value))}</p>`);
}

function rollCombatTest(mode) {
  const skillName = $("#combatRollSkill")?.value;
  const skill = combatTestSkills().find((entry) => entry.name === skillName);
  if (!skill) return addError("LAT-PT-001", skillName || "Perícia de combate não selecionada.");
  const ca = num($("#combatTargetCa")?.value, 0);
  const skillValue = skillFinal(skill.name);
  const target = combatAdjustedTarget(skill.name, ca);
  const roll = rollD100(mode);
  const outcome = d100Outcome(roll.result, target);
  const hit = outcome !== "Falha";
  state.combat.log.unshift(`${skill.label} contra CA ${ca}: ${roll.result} (${roll.label}), alvo ${target} — ${hit ? `Acerto · ${outcome}` : "Falha"}.`);
  openModal(`Teste: ${skill.label}`, `
    <div class="combat-roll-result stack">
      <div class="stat"><span class="muted">${esc(roll.label)}</span><strong>${roll.result}</strong><small>Dados: ${roll.rolls.join(", ")}</small></div>
      <div class="grid three">
        ${miniStat("Perícia", skillValue)}
        ${miniStat("CA", ca)}
        ${miniStat("Valor-alvo", target)}
      </div>
      <p class="roll-verdict ${hit ? "hit" : "miss"}"><strong>${hit ? "Acerto" : "Falha"}</strong>${hit ? ` · ${esc(outcome)}` : ""}</p>
      <p>${esc(successText(target))}</p>
    </div>
  `, `<button class="button" type="button" data-action="open-combat-roll">Novo teste</button><button class="ghost" type="button" data-action="close-modal">Fechar</button>`);
}

function changeMagicLevel(type, delta) {
  if (!MAGIC_TYPES.includes(type)) return addError("LAT-MAG-002", type);
  const current = num(state.magic.baseLevels[type], 0);
  const next = clamp(current + delta, 0, 10);
  const cost = aptitudeUpgradeCost(type, current, next);
  if (delta > 0 && aptitudeTotal() - aptitudeSpent() < cost) return addError("LAT-MAG-001", `${type} N${next}`);
  state.magic.baseLevels[type] = next;
  render();
}

function addExtraMagic() {
  const type = sessionUi.extraMagicType;
  const regionCode = sessionUi.extraMagicRegion === "Sem Região" ? "" : sessionUi.extraMagicRegion;
  if (!MAGIC_TYPES.includes(type)) return addError("LAT-MAG-004");
  const spell = getSpell(type, regionCode);
  state.magic.knownExtras.push({ id: uid(), name: spell?.name ?? `${type} Extra`, type, regionCode, level: 0 });
  render();
}

function evolveExtraMagic(id) {
  const known = state.magic.knownExtras.find((spell) => spell.id === id);
  if (!known || known.level >= 10) return;
  const cost = extraSpellUpgradeCost(known.type, known.level, known.level + 1);
  if (aptitudeTotal() - aptitudeSpent() < cost) return addError("LAT-MAG-001", known.name);
  known.level += 1;
  render();
}

function activateMagic(type, spellId = "") {
  if (type === "Mundo") {
    openWorldAction();
    return;
  }
  const item = knownSpells().find((spell) => spell.id === spellId) ?? knownSpells().find((spell) => spell.type === type);
  if (type === "Forte") return openForteActivationModal(item?.id ?? spellId);
  const map = { Mundo: "full", Fina: "bonus", Impacto: "bonus", Densa: "bonus", Forte: "standard", Etérea: "standard" };
  const structuredAction = currentLevelEntry(item)?.activationAction ?? currentLevelEntry(item)?.action;
  return activateSpellItem(item, ["full", "standard", "bonus", "movement", "reaction"].includes(structuredAction) ? structuredAction : (map[type] ?? "bonus"));
}

function useAction(cost, label, rerender = true) {
  const need = cost === "full" ? ["standard", "bonus", "movement"] : [cost];
  if (!need.every((key) => state.combat.actions[key])) {
    if (cost === "full") addError("LAT-MUN-002", label);
    else toast(`Sem ${actionCostLabel(cost)} disponível.`, "warn");
    return false;
  }
  for (const key of need) state.combat.actions[key] = false;
  state.combat.log.unshift(`${label}: ${actionCostLabel(cost)} usada.`);
  if (rerender) render();
  return true;
}

function worldDurationFormula(level = worldLevel()) {
  return num(level, 0) <= 4 ? "1d4" : "1d4+2";
}

function rollWorldDurationValue(level = worldLevel()) {
  return Math.floor(Math.random() * 4) + 1 + (num(level, 0) >= 5 ? 2 : 0);
}

function validWorldDuration(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 999 ? parsed : null;
}

function openWorldDurationModal(adjustOnly = false) {
  const formula = worldDurationFormula();
  const current = adjustOnly ? state.world.durationTurns ?? "" : "";
  openModal(adjustOnly ? "Definir duração do Mundo" : "Abrir Mundo", `
    <div class="world-duration-card stack">
      <div class="dice-mark" aria-hidden="true">⚄</div>
      <div>
        <h3>Determine a duração do Mundo</h3>
        <p>Role <strong>${esc(formula)}</strong> ou informe manualmente quantos turnos o Mundo permanecerá ativo.</p>
      </div>
      <div class="field">
        <label>Turnos de duração</label>
        <input id="worldDurationTurns" type="number" min="1" max="999" step="1" inputmode="numeric" value="${esc(current)}">
      </div>
      <p id="worldDurationFeedback" class="muted small" aria-live="polite">A rolagem preencherá este campo automaticamente.</p>
    </div>
  `, `<button class="ghost" type="button" data-action="roll-world-duration">Rolar ${esc(formula)}</button><button class="button" type="button" data-action="${adjustOnly ? "save-world-duration" : "confirm-world-open"}">${adjustOnly ? "Salvar duração" : "Confirmar e abrir"}</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function rollWorldDuration() {
  const result = rollWorldDurationValue();
  const input = $("#worldDurationTurns");
  if (input) input.value = String(result);
  const feedback = $("#worldDurationFeedback");
  if (feedback) feedback.textContent = `${worldDurationFormula()} resultou em ${result} turno(s).`;
  return result;
}

function openWorldAction() {
  if (!RULES.validateWorldAction({ status: state.world.status, action: "open" }).valid) {
    addError("LAT-MUN-002", "O Mundo já está ativo.");
    return false;
  }
  const costs = worldCosts();
  if (pmCurrent() < costs.activation) return addError("LAT-MUN-002", `Abrir Mundo: PM insuficiente (${pmCurrent()}/${costs.activation}).`);
  if (!["standard", "bonus", "movement"].every((key) => state.combat.actions[key])) return addError("LAT-MUN-002", "Abrir Mundo exige Ação Padrão, Ação Bônus e Ação de Movimento disponíveis.");
  openWorldDurationModal(false);
  return true;
}

function confirmWorldOpen() {
  const duration = validWorldDuration($("#worldDurationTurns")?.value);
  if (duration === null) {
    toast("Informe uma duração inteira entre 1 e 999 turnos.", "warn");
    $("#worldDurationTurns")?.focus();
    return false;
  }
  if (!RULES.validateWorldAction({ status: state.world.status, action: "open" }).valid) return addError("LAT-MUN-002", "O Mundo já está ativo.");
  const costs = worldCosts();
  if (pmCurrent() < costs.activation) return addError("LAT-MUN-002", `Abrir Mundo: PM insuficiente (${pmCurrent()}/${costs.activation}).`);
  if (!useAction("full", "Abrir Mundo", false)) return false;
  spendPm(costs.activation, "Abrir Mundo");
  state.world.status = "active";
  state.world.durationTurns = duration;
  state.world.maintenancePaidForTurn = false;
  state.world.lawUses = worldTier() + 1;
  state.combat.activeSpells = (state.combat.activeSpells ?? []).filter((spell) => spell.type !== "Mundo");
  state.combat.log.unshift(`Mundo aberto por ${duration} turno(s). A manutenção do primeiro turno está pendente.`);
  closeModal();
  render();
  return true;
}

function saveWorldDuration() {
  if (state.world.status !== "active") return false;
  const duration = validWorldDuration($("#worldDurationTurns")?.value);
  if (duration === null) {
    toast("Informe uma duração inteira entre 1 e 999 turnos.", "warn");
    $("#worldDurationTurns")?.focus();
    return false;
  }
  state.world.durationTurns = duration;
  state.combat.log.unshift(`Duração do Mundo definida em ${duration} turno(s).`);
  closeModal();
  render();
  return true;
}

function maintainWorldAction() {
  const costs = worldCosts();
  if (!RULES.validateWorldAction({ status: state.world.status, action: "maintain" }).valid) {
    addError("LAT-MUN-002", "O Mundo precisa estar ativo antes da manutenção.");
    return false;
  }
  if (state.world.maintenancePaidForTurn) {
    toast("A manutenção deste turno já foi paga.", "warn");
    return false;
  }
  if (!spendPm(costs.maintenance, "Manter Mundo")) return false;
  state.world.maintenancePaidForTurn = true;
  state.combat.log.unshift("Manter Mundo: manutenção paga sem gastar ação.");
  render();
  return true;
}

function useWorldLawAction() {
  const validation = RULES.validateWorldAction({ status: state.world.status, action: "law", lawCount: state.world.laws.length, lawUses: state.world.lawUses });
  if (!validation.valid) {
    const details = { "not-active": "Uma Lei só pode ser usada com o Mundo ativo.", "missing-law": "Nenhuma Lei foi adicionada ao Mundo.", "no-law-uses": "Não há usos de Lei restantes." };
    addError("LAT-MUN-003", details[validation.reason] ?? validation.reason);
    return false;
  }
  state.world.lawUses -= 1;
  state.combat.log.unshift("Lei usada como ação livre.");
  render();
  return true;
}

function endWorld(status, message) {
  if (!RULES.validateWorldAction({ status: state.world.status, action: status === "collapsed" ? "collapse" : "close" }).valid) return false;
  state.world.status = status;
  state.world.durationTurns = null;
  state.world.maintenancePaidForTurn = false;
  state.combat.activeSpells = (state.combat.activeSpells ?? []).filter((spell) => spell.type !== "Mundo");
  state.combat.log.unshift(message);
  render();
  return true;
}

function closeWorldAction() {
  return endWorld("closed", "Mundo encerrado.");
}

function collapseWorldAction() {
  return endWorld("collapsed", "Mundo colapsado sem gastar ações.");
}

function itemKey(value) {
  return fold(value).replace(/\([^)]*\)/g, " ").replace(/[^A-Z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function itemDescription(name, preferredKind = "") {
  const kinds = [preferredKind, "weapons", "equipment", "toolsKits", "mountsVehicles", "pavilions"].filter(Boolean);
  const seen = new Set();
  const target = itemKey(name);
  for (const kind of kinds) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    const map = ITEM_DESCRIPTIONS[kind] ?? {};
    if (map[name]) return map[name];
    const match = Object.entries(map).find(([key]) => itemKey(key) === target);
    if (match) return match[1];
  }
  return "";
}

function equipmentPickerGroups() {
  return [
    { id: "equipment", label: "Equipamentos", category: "Equipamento", descriptionKind: "equipment" },
    { id: "mountsVehicles", label: "Montarias e veículos", category: "Montaria/Veículo", descriptionKind: "mountsVehicles" },
    { id: "toolsKits", label: "Ferramentas e kits", category: "Ferramenta/Kit", descriptionKind: "toolsKits" },
    { id: "pavilions", label: "Pavilhões", category: "Pavilhão", descriptionKind: "pavilions" },
  ];
}

function equipmentPickerGroup(groupId = "equipment") {
  return equipmentPickerGroups().find((group) => group.id === groupId) ?? equipmentPickerGroups()[0];
}

function equipmentPickerItems(group) {
  if (group.id === "equipment") return DB.equipment;
  return Object.keys(ITEM_DESCRIPTIONS[group.descriptionKind] ?? {});
}

function openWeaponPicker(kind) {
  let weapons = DB.weapons.map((weapon) => ({ ...weapon, type: "Arma" }));
  if (kind === "cultural") {
    const culture = getCulture();
    if (!culture?.weapon) return addError("LAT-INV-003");
    weapons = parseCulturalWeapons(culture.weapon).map((weapon) => ({ ...weapon, type: "Arma Cultural" }));
  }
  window.currentWeaponPicker = weapons;
  openModal(kind === "cultural" ? "Arma cultural" : "Armas", `
    <div class="item-picker-grid">
      ${weapons.map((weapon, index) => `<div class="item-picker-card">
        <button class="item-picker-main" type="button" data-action="open-weapon-description" data-index="${index}">
          <strong>${esc(weapon.name)}</strong>
          <span>${esc(weapon.damage || "-")} · ${esc(weapon.weight || "-")}</span>
          <small>${esc(weapon.property || "Sem propriedade cadastrada.")}</small>
        </button>
        <button class="button" type="button" data-action="add-weapon" data-index="${index}">Adicionar</button>
      </div>`).join("")}
    </div>
  `);
}

function openWeaponDescription(index) {
  const weapon = window.currentWeaponPicker?.[Number(index)];
  if (!weapon) return addError("LAT-INV-001");
  const description = itemDescription(weapon.name, "weapons") || weapon.description || "Descrição ainda não cadastrada.";
  openModal(weapon.name, `
    <div class="item-description-card">
      <p>${esc(description)}</p>
      <div class="grid three">
        ${miniStat("Dano", weapon.damage || "-")}
        ${miniStat("Peso", weapon.weight || "-")}
        ${miniStat("Tipo", weapon.type || "Arma")}
      </div>
      <p class="muted">${esc(weapon.property || "Sem propriedade cadastrada.")}</p>
    </div>
  `, `<button class="button" type="button" data-action="add-weapon" data-index="${index}">Adicionar</button><button class="ghost" type="button" data-action="close-modal">Fechar</button>`);
}

function parseCulturalWeapons(text) {
  const weapons = [];
  for (const part of splitCulturalWeaponEntries(text)) {
    if (!part) continue;
    if (!weapons.length || looksLikeCulturalWeapon(part)) {
      weapons.push(culturalWeaponFromText(part));
      continue;
    }
    const previous = weapons.at(-1);
    previous.property = compact(`${previous.property} ${part}`);
    previous.description = compact(`${previous.description} ${part}`);
  }
  return weapons.filter((weapon) => weapon.name && weapon.damage);
}

function splitCulturalWeaponEntries(text) {
  const value = compact(text);
  if (!value) return [];
  const starts = [...value.matchAll(/[A-ZÀ-Ý][^;.]*?\([^)]*(?:Arma|Arco|Besta|Haste|Curta|Longa|Grande|Cultural|Espada)[^)]*\)\s*(?:[–-]\s*)?(?=(?:Causa\s+)?\d+d\d+)/g)];
  if (starts.length <= 1) return value.split(";").map((part) => compact(part));
  return starts.map((match, index) => {
    const next = starts[index + 1]?.index ?? value.length;
    return compact(value.slice(match.index, next).replace(/^;\s*/, "").replace(/;\s*$/, ""));
  });
}

function looksLikeCulturalWeapon(text) {
  const hasDamage = /\d+d\d+(?:[+-]\d+)?\s*[A-Za-zÀ-ÿ]*/i.test(text);
  const hasWeaponCategory = /\([^)]*(?:Arma|Arco|Besta|Haste|Curta|Longa|Grande|Cultural)[^)]*\)/i.test(text);
  const hasNameSeparator = /\s+[–-]\s+/.test(text) || /\)\s*(?:Causa\s+)?\d+d\d+/i.test(text);
  return hasDamage && hasWeaponCategory && hasNameSeparator;
}

function culturalWeaponFromText(text) {
  const separator = text.search(/\s+[–-]\s+/);
  const name = separator >= 0 ? text.slice(0, separator).trim() : text.trim();
  const fallbackName = text.match(/^[^(]+\([^)]*\)/)?.[0]?.trim() ?? name;
  const finalName = separator >= 0 ? name : fallbackName;
  const details = separator >= 0 ? text.slice(separator).trim() : compact(text.replace(finalName, ""));
  const damage = text.match(/\d+d\d+(?:[+-]\d+)?\s*[A-Za-zÀ-ÿ]*/i)?.[0] ?? "";
  return { name: finalName, damage, weight: "", property: details, description: text };
}

function addWeaponFromModal(index) {
  const weapon = window.currentWeaponPicker?.[Number(index)];
  if (!weapon?.name || !weapon.damage) return addError("LAT-INV-001");
  state.inventory.weapons.push({ id: uid(), ...weapon, description: weapon.description ?? "" });
  if (!state.inventory.selectedWeaponId) state.inventory.selectedWeaponId = state.inventory.weapons.at(-1).id;
  closeModal();
  render();
}

function openCustomWeapon() {
  openModal("Arma customizável", `
    <div class="grid two">
      <div class="field"><label>Nome do Item</label><input id="customWeaponName"></div>
      <div class="field"><label>Dano</label><input id="customWeaponDamage"></div>
      <div class="field"><label>Peso</label><input id="customWeaponWeight"></div>
      <div class="field"><label>Propriedade</label><input id="customWeaponProperty"></div>
    </div>
    <div class="field"><label>Descrição</label><textarea id="customWeaponDescription"></textarea></div>
    <div class="card">
      <h3>Habilidade da Arma</h3>
      <div class="grid two"><div class="field"><label>Nome da habilidade</label><input id="customWeaponAbilityName"></div><div class="field"><label>Usos</label><input type="number" id="customWeaponAbilityUses" value="0"></div></div>
      <div class="field"><label>Descrição da habilidade</label><textarea id="customWeaponAbilityDescription"></textarea></div>
    </div>
  `, `<button class="button" type="button" data-action="save-custom-weapon">Adicionar</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function saveCustomWeapon() {
  const weapon = {
    id: uid(),
    type: "Arma Customizável",
    name: $("#customWeaponName").value.trim(),
    damage: $("#customWeaponDamage").value.trim(),
    weight: $("#customWeaponWeight").value.trim(),
    property: $("#customWeaponProperty").value.trim(),
    description: $("#customWeaponDescription").value.trim(),
  };
  if (!weapon.name || !weapon.damage) return addError("LAT-INV-001");
  const abilityName = $("#customWeaponAbilityName").value.trim();
  if (abilityName) {
    const ability = {
      id: uid(),
      name: abilityName,
      type: "Ativável",
      uses: num($("#customWeaponAbilityUses").value, 0),
      target: "",
      range: "",
      resistance: "",
      description: $("#customWeaponAbilityDescription").value.trim(),
      notes: `Gerada pela arma ${weapon.name}.`,
    };
    weapon.ability = { name: ability.name, uses: ability.uses, description: ability.description };
    state.abilities.push(ability);
    addError("LAT-INV-004", "", false);
  }
  state.inventory.weapons.push(weapon);
  state.inventory.selectedWeaponId ||= weapon.id;
  closeModal();
  render();
}

function openEquipmentPicker(groupId = "equipment") {
  const group = equipmentPickerGroup(groupId);
  const tabs = equipmentPickerGroups().map((item) => `<button class="${item.id === group.id ? "button" : "ghost"}" type="button" data-action="open-equipment-picker" data-group="${item.id}">${esc(item.label)}</button>`).join("");
  const items = equipmentPickerItems(group);
  openModal("Equipamentos", `
    <div class="item-tabs">${tabs}</div>
    <div class="item-picker-grid">
      ${items.map((name) => `<div class="item-picker-card">
        <button class="item-picker-main" type="button" data-action="open-equipment-description" data-name="${esc(name)}" data-group="${group.id}">
          <strong>${esc(name)}</strong>
          <span>${esc(group.category)}</span>
          <small>${esc(itemDescription(name, group.descriptionKind) || "Clique para ver detalhes.")}</small>
        </button>
        <button class="button" type="button" data-action="add-equipment" data-name="${esc(name)}" data-group="${group.id}">Adicionar</button>
      </div>`).join("") || `<div class="empty">Nenhum item cadastrado nesta categoria.</div>`}
    </div>
  `);
}

function openEquipmentDescription(name, groupId = "equipment") {
  const group = equipmentPickerGroup(groupId);
  openModal(name, `
    <div class="item-description-card">
      <span class="tag">${esc(group.category)}</span>
      <p>${esc(itemDescription(name, group.descriptionKind) || "Descrição ainda não cadastrada.")}</p>
    </div>
  `, `<button class="button" type="button" data-action="add-equipment" data-name="${esc(name)}" data-group="${group.id}">Adicionar</button><button class="ghost" type="button" data-action="close-modal">Fechar</button>`);
}

function addEquipmentFromModal(name, groupId = "equipment") {
  const group = equipmentPickerGroup(groupId);
  if (!name) return addError("LAT-INV-002");
  state.inventory.equipment.push({ id: uid(), name, category: group.category, qty: 1, weight: "", description: itemDescription(name, group.descriptionKind) });
  closeModal();
  render();
}

function openCustomEquipment() {
  openModal("Equipamento customizável", `
    <div class="grid two"><div class="field"><label>Nome</label><input id="customEquipmentName"></div><div class="field"><label>Peso</label><input id="customEquipmentWeight"></div></div>
    <div class="field"><label>Descrição</label><textarea id="customEquipmentDescription"></textarea></div>
  `, `<button class="button" type="button" data-action="save-custom-equipment">Adicionar</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function saveCustomEquipment() {
  const name = $("#customEquipmentName").value.trim();
  if (!name) return addError("LAT-INV-002");
  state.inventory.equipment.push({ id: uid(), name, category: "Equipamento Customizável", qty: 1, weight: $("#customEquipmentWeight").value.trim(), description: $("#customEquipmentDescription").value.trim() });
  closeModal();
  render();
}

function openEvolveSkills() {
  const checked = DB.skills.filter((skill) => state.skills[skill.name]?.checked);
  if (!checked.length) return addError("LAT-PT-003");
  openModal("Evoluir perícia", `
    <div class="grid two">
      ${selectRaw("Perícia marcada", "ui.evolveSkill", checked.map((skill) => [skill.name, skill.name]))}
      <div class="field"><label>Valor 0 a 10</label><input id="evolveValue" type="number" min="0" max="10" value="1"></div>
    </div>
  `, `<button class="button" type="button" data-action="confirm-evolve-skills">Concluir</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function confirmEvolveSkills() {
  const skillName = sessionUi.evolveSkill || DB.skills.find((skill) => state.skills[skill.name]?.checked)?.name;
  const value = num($("#evolveValue").value, -1);
  if (value < 0 || value > 10) return addError("LAT-PT-004");
  if (!state.settings.gmOverride && skillFinal(skillName) + value > num(state.settings.skillLimit, 70)) {
    return addError("LAT-CALC-004", `${skillName}: a evolução ultrapassaria o limite ${state.settings.skillLimit}.`);
  }
  state.skills[skillName].evolutions.push({ value, at: new Date().toISOString() });
  state.skills[skillName].checked = false;
  closeModal();
  render();
}

function saveAbility(id = "") {
  const ability = {
    id: id || uid(),
    name: $("#abilityName").value.trim(),
    type: $("#abilityType").value,
    uses: num($("#abilityUses").value, 0),
    target: $("#abilityTarget").value.trim(),
    range: $("#abilityRange").value.trim(),
    resistance: $("#abilityResistance").value.trim(),
    description: $("#abilityDescription").value.trim(),
    notes: $("#abilityNotes").value.trim(),
  };
  if (!ability.name) return addError("LAT-UI-002", "Nome da habilidade vazio.");
  const index = state.abilities.findIndex((item) => item.id === id);
  if (index >= 0) state.abilities[index] = ability;
  else state.abilities.push(ability);
  closeModal();
  render();
}

function addTalent() {
  const select = $("select[data-path='ui.talentDraft']");
  const name = select?.value;
  const base = DB.talents.find((talent) => talent.name === name);
  if (!base) return addError("LAT-DB-004", name);
  if (!base.stackable && state.talents.some((talent) => talent.name === name)) return toast("Talento já adicionado.", "warn");
  const talent = { id: uid(), name, level: num($("#talentLevelDraft").value, 1), enabled: !["conditional", "mixed"].includes(base.mode) };
  state.talents.push(talent);
  const issue = sheetSkillValidationIssue();
  if (issue) {
    state.talents = state.talents.filter((item) => item.id !== talent.id);
    return addError(issue.reason === "limit" ? "LAT-CALC-004" : "LAT-PT-002", `${name}: ${issue.detail}`);
  }
  if (base.automationLevel !== "complete") addError("LAT-PT-006", name, false);
  render();
}

function toggleTalent(id) {
  const talent = state.talents.find((item) => item.id === id);
  if (talent) {
    const previous = talent.enabled;
    talent.enabled = !talent.enabled;
    const issue = sheetSkillValidationIssue();
    if (issue) {
      talent.enabled = previous;
      return addError(issue.reason === "limit" ? "LAT-CALC-004" : "LAT-PT-002", `${talent.name}: ${issue.detail}`);
    }
  }
  if (!talent?.enabled) addError("LAT-PT-005", talent?.name ?? id, false);
  render();
}

function removeTalent(id) {
  state.talents = state.talents.filter((talent) => talent.id !== id);
  render();
}

function addWorldLaw() {
  const resistanceMode = normalizeLawResistanceMode(sessionUi.lawResistanceMode);
  const candidates = lawsForCategory(sessionUi.lawCategory, resistanceMode);
  const selected = candidates.find((law) => law.ID === sessionUi.lawId) ?? candidates[0];
  if (!selected) return addError("LAT-MUN-005");
  const tier = worldTier();
  const effectKey = tier === 3 ? "N3 (Mundo 10)" : tier === 2 ? "N2 (Mundo 5-9)" : "N1 (Mundo 1-4)";
  const custom = selected.ID === "CUSTOM-HYB";
  const details = custom ? {
    effect: $("#customLawEffect")?.value.trim(),
    resistance: $("#customLawResistance")?.value.trim(),
    fail: "",
    pass: "",
  } : lawDetailsForResistance(selected, effectKey, resistanceMode);
  const law = {
    id: uid(),
    sourceId: selected.ID,
    category: sessionUi.lawCategory,
    ...(custom ? {} : { resistanceMode }),
    name: $("#lawNameDraft")?.value.trim() || lawNameForResistance(selected, resistanceMode),
    target: custom ? $("#customLawTarget")?.value.trim() : selected.Alvo,
    resistance: details.resistance,
    effect: details.effect,
    fail: details.fail,
    pass: details.pass,
  };
  if (!law.name || !law.target || !law.resistance || !law.effect) return addError("LAT-MUN-003");
  state.world.laws.push(law);
  state.world.lawUses ??= tier + 1;
  render();
}

function openEditLawField(id, fieldName) {
  const law = state.world.laws.find((item) => item.id === id);
  if (!law) return;
  openModal(`Editar ${fieldLabel(fieldName)}`, `<textarea id="lawFieldEdit">${esc(law[fieldName])}</textarea>`, `<button class="button" type="button" data-action="save-law-field" data-id="${esc(id)}" data-field="${fieldName}">Salvar</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function saveLawField(id, fieldName) {
  const law = state.world.laws.find((item) => item.id === id);
  if (!law) return;
  law[fieldName] = $("#lawFieldEdit").value;
  law.edited = true;
  addError("LAT-MUN-004", `${law.name}: ${fieldName}`, false);
  closeModal();
  render();
}

function randomPersonality(kind) {
  const personal = getPersonalBackground();
  const values = personal?.tables?.[kind];
  if (!values?.length) return toast("Escolha um antecedente pessoal com tabela aleatória.", "warn");
  const selected = values[Math.floor(Math.random() * values.length)];
  const pathMap = { traits: "notes.traits", ideals: "notes.ideal", flaws: "notes.flaws", bonds: "notes.bonds" };
  const path = pathMap[kind];
  setPath(path, `${getPath(path) ? `${getPath(path)}\n` : ""}${selected}`);
  render();
}

function addTempEffect() {
  const name = $("#tempEffectName").value.trim();
  if (!name) return addError("LAT-UI-002", "Efeito temporário sem nome.");
  const blockValue = num($("#tempEffectBlock").value, 0);
  state.effects.push({ id: uid(), name, ca: num($("#tempEffectCa").value, 0), block: { cortante: blockValue, perfurante: blockValue, contundente: blockValue } });
  closeModal();
  render();
  openCaModal();
}

function openSettings() {
  openModal("Configurações", `
    <div class="grid two">
      <div class="card stack"><h3>Tema</h3><div class="inline"><button class="button" type="button" data-action="set-theme" data-theme="dark">Modo Escuro</button><button class="ghost" type="button" data-action="set-theme" data-theme="light">Modo Claro</button></div></div>
      <div class="card stack">${field("Limite inicial de Perícia", "settings.skillLimit", "number")}<button class="${state.settings.gmOverride ? "danger" : "ghost"}" type="button" data-action="${state.settings.gmOverride ? "disable-gm-override" : "request-gm-override"}" role="switch" aria-checked="${Boolean(state.settings.gmOverride)}">Modo Mestre: ${state.settings.gmOverride ? "ligado" : "desligado"}</button><p class="muted small">Permite ultrapassar limite e orçamento de Perícias.</p></div>
    </div>
    <div class="grid two" style="margin-top: 12px;">
      <div class="card stack"><h3>Importar</h3><input type="file" accept="application/json" data-file="json"><textarea id="jsonPaste" placeholder="Cole um JSON exportado aqui"></textarea><button class="ghost" type="button" data-action="import-json-paste">Importar JSON colado</button></div>
      <div class="card stack"><h3>Exportar</h3><button class="button" type="button" data-action="download-json">Baixar JSON</button><button class="ghost" type="button" data-action="copy-json">Copiar JSON</button><button class="ghost" type="button" data-action="print-sheet">Imprimir/PDF completo</button></div>
    </div>
    <div class="inline" style="margin-top: 12px;"><button class="ghost" type="button" data-action="open-backups">Backups recentes</button><button class="ghost" type="button" data-action="open-errors">Log de erros</button></div>
  `);
  $$("[data-action='set-theme']").forEach((btn) => btn.addEventListener("click", () => { state.settings.theme = btn.dataset.theme; applyTheme(); scheduleSave(); }));
}

function requestGmOverride() {
  openModal("Ativar Modo Mestre", `<p>Esta exceção permite ultrapassar o limite e o orçamento de Perícias. Use somente quando o Mestre autorizar.</p>`, `<button class="danger" type="button" data-action="enable-gm-override">Ativar exceção</button><button class="ghost" type="button" data-action="close-modal">Cancelar</button>`);
}

function enableGmOverride() {
  state.settings.gmOverride = true;
  closeModal();
  render();
  toast("Modo Mestre ativado para Perícias.", "warn");
}

function disableGmOverride() {
  state.settings.gmOverride = false;
  closeModal();
  render();
  toast("Modo Mestre desativado.");
}

function openErrors() {
  openModal("Log de erros", `<div class="stack">${state.errors.map((error) => `<div class="card"><strong>${esc(error.code)} · ${esc(error.severity)}</strong><p><strong>Módulo:</strong> ${esc(error.module)}</p><p><strong>Mensagem ao usuário:</strong> ${esc(error.userMessage)}</p><p><strong>Detalhe técnico:</strong> ${esc(error.technicalDetail)}</p><p><strong>Solução sugerida:</strong> ${esc(error.suggestedSolution)}</p><p class="muted small">${esc(new Date(error.at).toLocaleString())}</p></div>`).join("") || `<div class="empty">Nenhum erro registrado.</div>`}</div>`, `<button class="danger" type="button" data-action="clear-errors">Limpar</button><button class="ghost" type="button" data-action="close-modal">Fechar</button>`);
}

function exportPayload() {
  const payload = persistentPayload();
  payload.meta = { ...payload.meta, appId: APP_ID, schemaVersion: STATE_SCHEMA_VERSION, exportedAt: new Date().toISOString() };
  return JSON.stringify(payload, null, 2);
}

function downloadText(payload, fileName) {
  const blob = new Blob([payload], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}

function readBackups() {
  try {
    const parsed = JSON.parse(localStorage.getItem(BACKUP_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    recordStorageFailure(error);
    return [];
  }
}

function createBackup(label) {
  const backup = { id: uid(), at: new Date().toISOString(), label, payload: exportPayload() };
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify([backup, ...readBackups()].slice(0, 5)));
    return backup;
  } catch (error) {
    recordStorageFailure(error);
    downloadText(backup.payload, `backup-${Date.now()}-ficha-marufia-latio.json`);
    toast("O backup foi baixado porque o armazenamento local não estava disponível.", "warn");
    return backup;
  }
}

function openBackups() {
  const backups = readBackups();
  openModal("Backups recentes", `<div class="stack">${backups.map((backup) => `<div class="card"><strong>${esc(backup.label)}</strong><p class="muted small">${esc(new Date(backup.at).toLocaleString())}</p><div class="inline"><button class="button" type="button" data-action="restore-backup" data-id="${esc(backup.id)}">Restaurar</button><button class="ghost" type="button" data-action="download-backup" data-id="${esc(backup.id)}">Baixar</button></div></div>`).join("") || `<div class="empty">Nenhum backup automático foi criado.</div>`}</div>`);
}

function backupById(id) {
  return readBackups().find((backup) => backup.id === id);
}

function restoreBackup(id) {
  const backup = backupById(id);
  if (!backup) return addError("LAT-JSON-001", "Backup não encontrado.");
  try {
    const prepared = prepareStateImport(JSON.parse(backup.payload));
    createBackup("Antes de restaurar backup");
    state = prepared.state;
    pendingImport = null;
    closeModal();
    render();
    saveStateNow();
    toast("Backup restaurado.");
  } catch (error) {
    addError(error.code || "LAT-JSON-001", error.message);
  }
}

function downloadBackup(id) {
  const backup = backupById(id);
  if (backup) downloadText(backup.payload, `backup-ficha-marufia-${backup.at.slice(0, 10)}.json`);
}

function downloadJson() {
  try {
    downloadText(exportPayload(), `${state.character.name || "ficha-marufia-latio"}.json`);
  } catch (error) {
    addError("LAT-JSON-004", error.message);
  }
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(exportPayload());
    toast("JSON copiado.");
  } catch (error) {
    addError("LAT-JSON-004", error.message);
  }
}

function importJsonText(text, fileName = "JSON colado") {
  try {
    const parsed = JSON.parse(text);
    const prepared = prepareStateImport(parsed);
    pendingImport = { kind: "json", prepared, fileName };
    const migration = prepared.migrated ? `<span class="tag warn">Migrará v${esc(prepared.sourceVersion)} para v${STATE_SCHEMA_VERSION}</span>` : `<span class="tag ok">Schema v${STATE_SCHEMA_VERSION}</span>`;
    openModal("Revisar importação JSON", `
      <p><strong>${esc(fileName)}</strong></p>
      <p>Confira como a ficha deve receber o arquivo. Nenhum dado foi alterado ainda.</p>
      <div class="inline">${migration}<span class="chip">${esc(prepared.state.character.name || "Personagem sem nome")}</span></div>
      <div class="grid two" style="margin-top:12px;">
        <div class="card"><strong>Mesclar</strong><p>Preenche dados do arquivo e preserva valores atuais quando o importado estiver vazio.</p></div>
        <div class="card"><strong>Substituir</strong><p>Troca a ficha atual pela versão validada do arquivo.</p></div>
      </div>
    `, `<button class="button" type="button" data-action="apply-json-import" data-mode="merge">Mesclar</button><button class="danger" type="button" data-action="apply-json-import" data-mode="replace">Substituir</button><button class="ghost" type="button" data-action="cancel-import">Cancelar</button>`);
  } catch (error) {
    addError(error.code || "LAT-JSON-001", error.message);
  }
}

function applyJsonImport(mode) {
  if (pendingImport?.kind !== "json") return addError("LAT-JSON-001", "Importação pendente não encontrada.");
  createBackup(`Antes de importar ${pendingImport.fileName}`);
  state = mode === "replace"
    ? pendingImport.prepared.state
    : STATE_TOOLS.mergeImported(state, pendingImport.prepared.incoming, createDefaultState(), stateToolOptions());
  pendingImport = null;
  closeModal();
  render();
  saveStateNow();
  toast("JSON importado com segurança.");
}

function cancelImport() {
  pendingImport = null;
  closeModal();
  toast("Importação cancelada. A ficha não foi alterada.");
}

async function importJsonFile(file) {
  importJsonText(await file.text(), file.name);
}

function importJsonPaste() {
  importJsonText($("#jsonPaste").value);
}

function printSheet() {
  try {
    addError("LAT-PRINT-002", "", false);
    sessionUi.printMode = true;
    render();
    setTimeout(() => {
      window.print();
      sessionUi.printMode = false;
      render();
    }, 120);
  } catch (error) {
    addError("LAT-PRINT-001", error.message);
  }
}

async function importPdf(file) {
  try {
    await importPdfWithStructuredReader(file);
  } catch (error) {
    addError("LAT-PDF-001", error.message);
  }
}

async function importPdfWithStructuredReader(file) {
  if (!window.MARUFIA_PDF_IMPORTER?.importFromPdf) throw new Error("Importador PDF auxiliar nao carregado.");
  const result = await window.MARUFIA_PDF_IMPORTER.importFromPdf(file, {
    pdfjsLib: await getPdfLibrary(),
    db: DB,
  });
  if (!result.recognized) {
    addError("LAT-PDF-004");
    return;
  }

  const candidate = createDefaultState();
  candidate.settings = { ...candidate.settings, ...state.settings };
  applyImportedPdfPayload(candidate, result.data);
  candidate.meta.started = true;
  candidate.meta.importedFromPdf = {
    fileName: file.name,
    importedAt: new Date().toISOString(),
    source: result.source,
    fieldCount: result.fieldCount,
    importedValueCount: result.importedValueCount,
  };

  const differences = pdfImportCalculatedDifferences(result.data?.calculated ?? {}, candidate);
  pendingImport = { kind: "pdf", candidate: normalizeState(candidate), result, fileName: file.name, differences };
  showPdfImportReview(result.missing, differences, result, file.name);
}

function setImportedPath(target, path, value) {
  const keys = path.split(".").filter(Boolean);
  let cursor = target;
  for (const key of keys.slice(0, -1)) {
    cursor[key] ||= {};
    cursor = cursor[key];
  }
  if (keys.length) cursor[keys.at(-1)] = value;
}

function resolvedPdfData(result) {
  const data = STATE_TOOLS.cloneSafe(result.data);
  for (const [index, conflict] of (result.conflicts ?? []).entries()) {
    const choice = $(`#pdfConflict${index}`)?.value ?? "form";
    setImportedPath(data, conflict.path, choice === "text" ? conflict.textValue : conflict.formValue);
  }
  return data;
}

function candidateFromPdfData(data, result, fileName) {
  const candidate = createDefaultState();
  candidate.settings = { ...candidate.settings, ...state.settings };
  applyImportedPdfPayload(candidate, data);
  candidate.meta.started = true;
  candidate.meta.importedFromPdf = {
    fileName,
    importedAt: new Date().toISOString(),
    source: result.source,
    fieldCount: result.fieldCount,
    importedValueCount: result.importedValueCount,
  };
  return normalizeState(candidate);
}

function applyImportedPdfPayload(targetState, data) {
  const character = data?.character ?? {};
  const attributes = data?.attributes ?? {};
  const resources = data?.resources ?? {};
  const notes = data?.notes ?? {};
  const inventory = data?.inventory ?? {};

  if (hasImportedValue(character.name)) targetState.character.name = character.name;
  if (hasImportedValue(character.age)) targetState.character.age = character.age;
  if (hasImportedValue(character.gender)) targetState.character.gender = character.gender;
  if (hasImportedValue(character.birth)) targetState.character.birth = character.birth;

  const family = findByImportedName(DB.backgrounds.family, character.familyBackgroundName);
  const personal = findByImportedName(DB.backgrounds.personal, character.personalBackgroundName);
  const culture = findByImportedName(allCultures(), character.cultureName);
  if (family) targetState.character.backgroundFamilyId = family.id;
  if (personal) targetState.character.backgroundPersonalId = personal.id;
  if (culture) {
    targetState.character.cultureId = culture.id;
    targetState.character.regionCode = culture.regionCode;
  }

  for (const attrName of DB.attributes) {
    if (hasImportedValue(attributes[attrName])) targetState.attributes[attrName] = num(attributes[attrName], targetState.attributes[attrName]);
  }

  for (const [key, value] of Object.entries(notes)) {
    if (hasImportedValue(value) && Object.hasOwn(targetState.notes, key)) targetState.notes[key] = value;
  }
  if (hasImportedValue(character.age) && !targetState.notes.age) targetState.notes.age = character.age;

  if (hasImportedValue(resources.hpCurrent)) targetState.resources.hpCurrent = num(resources.hpCurrent, null);
  if (hasImportedValue(resources.pmCurrent)) targetState.resources.pmCurrent = num(resources.pmCurrent, null);

  for (const [coin, value] of Object.entries(inventory.money ?? {})) {
    if (hasImportedValue(value) && Object.hasOwn(targetState.inventory.money, coin)) targetState.inventory.money[coin] = num(value, 0);
  }
  if (hasImportedValue(inventory.patrimonio)) targetState.inventory.patrimonio = inventory.patrimonio;

  for (const weapon of inventory.weapons ?? []) {
    if (!hasImportedValue(weapon.name) && !hasImportedValue(weapon.damage)) continue;
    targetState.inventory.weapons.push({
      id: uid(),
      type: "Arma Importada",
      name: weapon.name || "Arma importada",
      damage: weapon.damage ?? "",
      weight: "",
      property: weapon.property ?? "",
      description: weapon.description ?? "",
    });
  }
  if (!targetState.inventory.selectedWeaponId && targetState.inventory.weapons.length) targetState.inventory.selectedWeaponId = targetState.inventory.weapons[0].id;

  for (const item of inventory.equipment ?? []) {
    if (!hasImportedValue(item.name)) continue;
    targetState.inventory.equipment.push({
      id: uid(),
      name: item.name,
      category: item.category || "Equipamento Importado",
      qty: 1,
      weight: "",
      description: item.description ?? "",
    });
  }

  applyImportedPdfSkills(targetState, data?.skills ?? {});
}

function hasImportedValue(value) {
  return value !== null && value !== undefined && value !== "";
}

function findByImportedName(list, name) {
  if (!hasImportedValue(name)) return null;
  const target = fold(name);
  return list.find((item) => fold(item.name) === target || fold(item.id) === target) ?? null;
}

function findImportedSkill(name) {
  if (!hasImportedValue(name)) return null;
  const target = fold(normalizeSkillName(name));
  return DB.skills.find((skill) => fold(skill.name) === target) ?? null;
}

function applyImportedPdfSkills(targetState, skills) {
  for (const [skillName, finalValue] of Object.entries(skills)) {
    const skill = findImportedSkill(skillName);
    if (!skill || !hasImportedValue(finalValue)) continue;
    const automaticValue = baseSkillValue(skill, targetState) + skillModifiers(skill.name, targetState).reduce((sum, mod) => sum + mod.value, 0);
    targetState.skills[skill.name].added = Math.max(0, Math.round(num(finalValue, automaticValue) - automaticValue));
  }
}

function pdfImportCalculatedDifferences(calculated, targetState) {
  const differences = [];
  const compareNumber = (label, pdfValue, latioValue) => {
    if (!hasImportedValue(pdfValue)) return;
    const imported = Math.round(num(pdfValue, latioValue));
    const current = Math.round(num(latioValue, imported));
    if (imported !== current) differences.push({ label, pdf: imported, latio: current });
  };
  const compareText = (label, pdfValue, latioValue) => {
    if (!hasImportedValue(pdfValue)) return;
    if (compact(pdfValue) !== compact(latioValue)) differences.push({ label, pdf: pdfValue, latio: latioValue });
  };
  compareNumber("Vida máxima", calculated.hpMax, maxHp(targetState));
  compareNumber("Pontos de Magia máximos", calculated.pmMax, maxPm(targetState));
  compareNumber("CA", calculated.ca, caBreakdown(targetState).total);
  compareNumber("Corpo", calculated.body, bodyInfo(targetState).body);
  compareText("Bônus", calculated.bonus, bodyInfo(targetState).mod);
  compareNumber("Esquiva", calculated.dodge, skillFinal("Esquivar", targetState));
  return differences;
}

function pdfImportFieldLabel(conflict) {
  return conflict?.label || window.MARUFIA_PDF_IMPORTER?.importFieldLabel?.(conflict?.path ?? "") || "Informação da ficha";
}

function pdfImportSourceLabel(source) {
  return { "form+text": "formulário e texto visível", form: "formulário preenchido", text: "texto visível" }[source] || "conteúdo do PDF";
}

function showPdfImportReview(missing, differences, result, fileName) {
  const missingHtml = missing.length
    ? `<h3>Informações não encontradas</h3><p class="muted small">Você poderá preencher estes dados manualmente depois da importação.</p><div class="stack">${missing.map((fieldName) => `<span class="chip">${esc(fieldName)}</span>`).join("")}</div>`
    : "";
  const differencesHtml = differences.length
    ? `<h3>Conferência de cálculos</h3><p class="muted">A Latio manteve seus próprios cálculos. Use estes itens apenas como conferência.</p><div class="table-wrap"><table><thead><tr><th>Informação</th><th>PDF</th><th>Latio</th></tr></thead><tbody>${differences.map((item) => `<tr><td>${esc(item.label)}</td><td>${esc(item.pdf)}</td><td>${esc(item.latio)}</td></tr>`).join("")}</tbody></table></div>`
    : "";
  const diagnostics = result.diagnostics?.fieldObjectError || result.diagnostics?.annotationError
    ? `<p class="muted small">Alguns campos internos do PDF não puderam ser lidos. Os demais dados encontrados continuam disponíveis para revisão.</p>`
    : "";
  const conflictsHtml = result.conflicts?.length
    ? `<h3>Informações com dois valores</h3><p class="muted small">Escolha qual valor deseja usar em cada informação.</p><div class="stack">${result.conflicts.map((conflict, index) => `<div class="card"><strong>${esc(pdfImportFieldLabel(conflict))}</strong><div class="field"><label for="pdfConflict${index}">Valor que será importado</label><select id="pdfConflict${index}"><option value="form">Campo preenchido: ${esc(conflict.formValue)}</option><option value="text">Texto visível: ${esc(conflict.textValue)}</option></select></div></div>`).join("")}</div>`
    : "";
  const hasUsefulData = num(result.importedValueCount, 0) > 0;
  const sparseConfirmation = hasUsefulData && num(result.importedValueCount, 0) <= 2
    ? `<label class="check-row"><input id="confirmSparsePdf" type="checkbox"> Confirmo que desejo substituir a ficha mesmo com poucos campos encontrados.</label>`
    : "";
  const footer = hasUsefulData
    ? `<button class="button" type="button" data-action="apply-pdf-import" data-mode="merge">Mesclar</button><button class="danger" type="button" data-action="apply-pdf-import" data-mode="replace">Substituir</button><button class="ghost" type="button" data-action="cancel-import">Cancelar</button>`
    : `<button class="ghost" type="button" data-action="cancel-import">Fechar sem importar</button>`;
  openModal("Revisão da importação", `
    <p><strong>${esc(fileName)}</strong> foi lido, mas ainda não alterou a ficha. Revise os campos antes de continuar.</p>
    <p class="muted small">Leitura feita pelo ${esc(pdfImportSourceLabel(result.source))}. Informações encontradas: ${esc(result.importedValueCount ?? 0)}.</p>
    ${missingHtml}
    ${differencesHtml}
    ${conflictsHtml}
    ${!hasUsefulData ? `<div class="empty">Nenhum dado útil foi encontrado. A substituição foi bloqueada.</div>` : ""}
    ${sparseConfirmation}
    ${diagnostics}
  `, footer);
}

function applyPdfImport(mode) {
  if (pendingImport?.kind !== "pdf") return addError("LAT-PDF-001", "Importação pendente não encontrada.");
  const { result, fileName } = pendingImport;
  if (num(result.importedValueCount, 0) <= 0) return addError("LAT-PDF-001", "Nenhum dado útil foi localizado no PDF.");
  if (mode === "replace" && num(result.importedValueCount, 0) <= 2 && !$("#confirmSparsePdf")?.checked) {
    toast("Confirme a substituição com poucos campos antes de continuar.", "warn");
    return;
  }
  const importedData = resolvedPdfData(result);
  const candidate = candidateFromPdfData(importedData, result, fileName);
  const differences = pdfImportCalculatedDifferences(importedData?.calculated ?? {}, candidate);
  createBackup(`Antes de importar PDF ${fileName}`);
  if (mode === "replace") {
    state = candidate;
  } else {
    const merged = STATE_TOOLS.persistentPayload(state);
    applyImportedPdfPayload(merged, importedData);
    merged.meta.started = true;
    merged.meta.importedFromPdf = candidate.meta.importedFromPdf;
    state = normalizeState(merged);
  }
  if (result.missing.length) addError("LAT-PDF-002", result.missing.join(", "), false);
  if (differences.length || result.conflicts?.length) addError("LAT-PDF-003", [...differences.map((item) => item.label), ...(result.conflicts ?? []).map((item) => item.path)].join(", "), false);
  const pdfDiagnostics = [result.diagnostics?.fieldObjectError, result.diagnostics?.annotationError].filter(Boolean);
  if (pdfDiagnostics.length) addError("LAT-PDF-002", pdfDiagnostics.join(" | "), false);
  pendingImport = null;
  closeModal();
  render();
  saveStateNow();
  toast("PDF importado com segurança.");
}

function applyTheme() {
  document.body.classList.toggle("dark", state.settings.theme === "dark");
}

function renderFatalDatabaseError(detail) {
  const app = $("#app");
  $("#tabs").innerHTML = "";
  $("#statusLine").textContent = "Falha ao carregar a base de dados";
  app.innerHTML = `<section class="panel"><div class="section-title"><h2>Não foi possível carregar a ficha</h2></div><p>A base principal está ausente ou inválida. Seus dados salvos não foram alterados.</p><div class="card"><strong>LAT-DB-001 · CRÍTICO</strong><p>${esc(detail)}</p><p class="muted">Restaure os arquivos oficiais da ficha ou use uma cópia íntegra da pasta.</p></div></section>`;
}

if (databaseStartupError) {
  renderFatalDatabaseError(databaseStartupError);
} else {
  document.body.addEventListener("click", handleClick);
  document.body.addEventListener("change", handleChange);
  document.body.addEventListener("input", handleInput);
  document.addEventListener("keydown", handleKeydown);
  applyTheme();
  render();
  if (!state.meta.started) openStartModal();
}
