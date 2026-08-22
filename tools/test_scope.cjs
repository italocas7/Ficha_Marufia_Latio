"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const SCOPE_DOCUMENT = "docs/deferred-scope.md";
const DEFERRED_CAPABILITIES = Object.freeze([
  "mapas",
  "tokens",
  "grid",
  "iluminação",
  "voz",
  "vídeo",
  "marketplace",
  "mods",
  "Steam",
  "Android",
  "iOS",
  "IA",
  "Discord",
  "música",
  "chat complexo",
  "criação de mapas",
  "animações pesadas",
]);

const FORBIDDEN_DEPENDENCIES = Object.freeze([
  "@google/generative-ai",
  "@mapbox/mapbox-gl-js",
  "@steamworks/steamworks.js",
  "anthropic",
  "babylonjs",
  "discord.js",
  "gsap",
  "leaflet",
  "lottie-web",
  "mapbox-gl",
  "mediasoup-client",
  "openai",
  "openlayers",
  "phaser",
  "simple-peer",
  "steamworks.js",
  "three",
]);

const FORBIDDEN_ROOTS = Object.freeze(["android", "ios", "maps", "marketplace", "mods"]);
const SOURCE_ROOTS = Object.freeze(["src", "server", "supabase/migrations", "src-tauri"]);
const ROOT_FILES = Object.freeze(["package.json", "index.html", "gm_view.html"]);
const SOURCE_EXTENSIONS = new Set([".cjs", ".css", ".html", ".js", ".json", ".mjs", ".sql", ".toml"]);
const IGNORED_DIRECTORIES = new Set(["gen", "icons", "node_modules", "target"]);
const FORBIDDEN_MARKERS = Object.freeze([
  Object.freeze({ label: "motor de mapa", pattern: /\b(?:leaflet|mapbox-gl|openlayers|google\.maps)\b/i }),
  Object.freeze({ label: "voz ou vídeo em tempo real", pattern: /\b(?:getUserMedia|RTCPeerConnection|MediaRecorder)\b/ }),
  Object.freeze({ label: "Steam ou Discord", pattern: /\b(?:steamworks|discord\.js|discord\.com\/api)\b/i }),
  Object.freeze({ label: "SDK de IA", pattern: /(?:@google\/generative-ai|\bopenai\b|\banthropic\b)/i }),
  Object.freeze({ label: "música integrada", pattern: /\b(?:AudioContext|HTMLAudioElement|spotify-web-api)\b/ }),
  Object.freeze({ label: "chat complexo", pattern: /\b(?:chat_messages|chat_threads|message_threads)\b/i }),
  Object.freeze({ label: "animação pesada", pattern: /\b(?:babylonjs|gsap|lottie-web|three\.js)\b/i }),
  Object.freeze({ label: "projeto móvel", pattern: /(?:com\.android\.application|android\.permission|\.xcodeproj\b|\bInfo\.plist\b)/i }),
]);

function walk(relativeRoot) {
  const absoluteRoot = path.join(root, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];
  const files = [];
  const pending = [absoluteRoot];
  while (pending.length) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) pending.push(absolute);
      else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(absolute);
    }
  }
  return files;
}

function productionFiles() {
  const files = ROOT_FILES.map((file) => path.join(root, file)).filter(fs.existsSync);
  for (const sourceRoot of SOURCE_ROOTS) files.push(...walk(sourceRoot));
  return [...new Set(files)].sort();
}

function assertDeferredScope() {
  if (DEFERRED_CAPABILITIES.length !== 17 || new Set(DEFERRED_CAPABILITIES).size !== 17) {
    throw new Error("A Fase 52 precisa manter exatamente os 17 recursos adiados.");
  }
  const documentPath = path.join(root, SCOPE_DOCUMENT);
  const document = fs.readFileSync(documentPath, "utf8");
  for (const capability of DEFERRED_CAPABILITIES) {
    if (!document.toLocaleLowerCase("pt-BR").includes(capability.toLocaleLowerCase("pt-BR"))) {
      throw new Error(`Recurso adiado ausente na documentação: ${capability}.`);
    }
  }
  return true;
}

function assertNoDeferredFootprint() {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const dependencies = { ...(manifest.dependencies ?? {}), ...(manifest.devDependencies ?? {}) };
  for (const dependency of FORBIDDEN_DEPENDENCIES) {
    if (Object.hasOwn(dependencies, dependency)) throw new Error(`Dependência fora do escopo da Fase 52: ${dependency}.`);
  }
  for (const relative of FORBIDDEN_ROOTS) {
    if (fs.existsSync(path.join(root, relative))) throw new Error(`Estrutura fora do escopo da Fase 52: ${relative}/.`);
  }
  const files = productionFiles();
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const marker of FORBIDDEN_MARKERS) {
      if (marker.pattern.test(source)) {
        throw new Error(`${marker.label} encontrado fora de fase em ${path.relative(root, file)}.`);
      }
    }
  }
  return files.length;
}

function main() {
  assertDeferredScope();
  const scannedFiles = assertNoDeferredFootprint();
  process.stdout.write(`Fase 52: ${DEFERRED_CAPABILITIES.length} recursos permanecem adiados.\n`);
  process.stdout.write(`${scannedFiles} arquivos de produção verificados sem expansão de escopo.\n`);
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
  DEFERRED_CAPABILITIES,
  FORBIDDEN_DEPENDENCIES,
  FORBIDDEN_ROOTS,
  SCOPE_DOCUMENT,
  assertDeferredScope,
  assertNoDeferredFootprint,
  main,
  productionFiles,
});
