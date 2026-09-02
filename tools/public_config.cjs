"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PROJECT_TEMPLATE = path.join(ROOT, "src", "online", "project.js");
const CONFIG_TOKEN = "__MARUFIA_PUBLIC_CONFIG__";
const BACKEND_MODES = new Set(["cloud", "local", "selfhosted"]);
const BUILD_ENVIRONMENTS = new Set(["development", "production", "local"]);
const PUBLIC_VARIABLES = Object.freeze([
  "MARUFIA_BACKEND_MODE",
  "MARUFIA_BUILD_ENV",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "MARUFIA_SITE_URL",
  "MARUFIA_AUTH_REDIRECT_URL",
]);

function parseEnv(source = "") {
  const values = {};
  for (const line of String(source).split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match) throw new Error(`Linha inválida em arquivo de ambiente: ${trimmed}`);
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }
  return values;
}

function readEnvFile(filePath) {
  return fs.existsSync(filePath) ? parseEnv(fs.readFileSync(filePath, "utf8")) : {};
}

function publicProcessEnv(environment = process.env) {
  return Object.fromEntries(PUBLIC_VARIABLES
    .filter((name) => Object.prototype.hasOwnProperty.call(environment, name))
    .map((name) => [name, String(environment[name] ?? "")]));
}

function requireChoice(value, allowed, label) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!allowed.has(normalized)) {
    throw new Error(`${label} inválido: ${normalized || "ausente"}.`);
  }
  return normalized;
}

function isLoopback(hostname) {
  return ["127.0.0.1", "localhost", "[::1]", "::1"].includes(String(hostname).toLowerCase());
}

function parsePublicUrl(value, label) {
  let url;
  try {
    url = new URL(String(value ?? "").trim());
  } catch {
    throw new Error(`${label} inválida.`);
  }
  if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) {
    throw new Error(`${label} deve conter somente a origem do serviço.`);
  }
  if (!isLoopback(url.hostname) && url.protocol !== "https:") {
    throw new Error(`${label} externa deve usar HTTPS.`);
  }
  if (isLoopback(url.hostname) && !["http:", "https:"].includes(url.protocol)) {
    throw new Error(`${label} local deve usar HTTP ou HTTPS.`);
  }
  return url;
}

function validateBackendUrl(value, backendMode) {
  const url = parsePublicUrl(value, "SUPABASE_URL");
  const loopback = isLoopback(url.hostname);
  if (backendMode === "local" && !loopback) {
    throw new Error("O backend local deve usar localhost ou um endereço de loopback.");
  }
  if (backendMode === "selfhosted" && /(?:^|\.)supabase\.co$/i.test(url.hostname)) {
    throw new Error("O modo selfhosted não pode apontar para o Supabase Cloud.");
  }
  return url.origin;
}

function validateSiteUrl(value) {
  return parsePublicUrl(value, "MARUFIA_SITE_URL").origin;
}

function validateAuthRedirectUrl(value, fallback) {
  const candidate = String(value ?? "").trim() || fallback;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error("MARUFIA_AUTH_REDIRECT_URL inválida.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("MARUFIA_AUTH_REDIRECT_URL não pode conter credenciais, consulta ou fragmento.");
  }
  if (!isLoopback(url.hostname) && url.protocol !== "https:") {
    throw new Error("MARUFIA_AUTH_REDIRECT_URL externa deve usar HTTPS.");
  }
  if (isLoopback(url.hostname) && !["http:", "https:"].includes(url.protocol)) {
    throw new Error("MARUFIA_AUTH_REDIRECT_URL local deve usar HTTP ou HTTPS.");
  }
  return url.href.replace(/\/$/, "");
}

function decodeJwtPayload(value) {
  const parts = String(value).split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function validatePublishableKey(value) {
  const key = String(value ?? "").trim();
  if (!key) throw new Error("SUPABASE_PUBLISHABLE_KEY está ausente.");
  const payload = decodeJwtPayload(key);
  if (/^sb_secret_/i.test(key) || payload?.role === "service_role") {
    throw new Error("Uma chave administrativa não pode ser incluída no aplicativo.");
  }
  return key;
}

function loadPublicConfig(options = {}) {
  const root = path.resolve(options.root ?? ROOT);
  const processValues = publicProcessEnv(options.env ?? process.env);
  const baseValues = readEnvFile(path.join(root, ".env"));
  const localValues = readEnvFile(path.join(root, ".env.local"));
  const buildEnvironment = requireChoice(
    processValues.MARUFIA_BUILD_ENV
      ?? localValues.MARUFIA_BUILD_ENV
      ?? baseValues.MARUFIA_BUILD_ENV
      ?? "production",
    BUILD_ENVIRONMENTS,
    "MARUFIA_BUILD_ENV",
  );
  const environmentValues = readEnvFile(path.join(root, `.env.${buildEnvironment}`));
  const backendMode = requireChoice(
    processValues.MARUFIA_BACKEND_MODE
      ?? localValues.MARUFIA_BACKEND_MODE
      ?? environmentValues.MARUFIA_BACKEND_MODE
      ?? baseValues.MARUFIA_BACKEND_MODE
      ?? "cloud",
    BACKEND_MODES,
    "MARUFIA_BACKEND_MODE",
  );
  const profileValues = readEnvFile(path.join(root, "config", "public-backends", `${backendMode}.env`));
  const values = {
    ...profileValues,
    ...baseValues,
    ...environmentValues,
    ...localValues,
    ...processValues,
  };
  const publishableKey = values.SUPABASE_PUBLISHABLE_KEY || values.SUPABASE_ANON_KEY;
  const siteUrl = validateSiteUrl(values.MARUFIA_SITE_URL);
  return Object.freeze({
    backendMode,
    buildEnvironment,
    supabaseUrl: validateBackendUrl(values.SUPABASE_URL, backendMode),
    publishableKey: validatePublishableKey(publishableKey),
    siteUrl,
    authRedirectUrl: validateAuthRedirectUrl(values.MARUFIA_AUTH_REDIRECT_URL, siteUrl),
  });
}

function websocketOrigin(httpOrigin) {
  const url = new URL(httpOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildTauriCsp(config) {
  const connectOrigins = unique([
    "'self'",
    config.supabaseUrl,
    websocketOrigin(config.supabaseUrl),
    config.siteUrl,
  ]).join(" ");
  const imageOrigins = unique(["'self'", "data:", "blob:", config.siteUrl]).join(" ");
  return [
    "default-src 'self'",
    `connect-src ${connectOrigins}`,
    `img-src ${imageOrigins}`,
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self'",
  ].join("; ");
}

function tauriConfigOverlay(config = loadPublicConfig()) {
  return { app: { security: { csp: buildTauriCsp(config) } } };
}

function renderProjectSource(config = loadPublicConfig(), source = fs.readFileSync(PROJECT_TEMPLATE, "utf8")) {
  const marker = JSON.stringify(CONFIG_TOKEN);
  const occurrences = source.split(marker).length - 1;
  if (occurrences !== 1) throw new Error("O template público do projeto está inválido.");
  return source.replace(marker, JSON.stringify(config));
}

function renderProjectFile(destination, config = loadPublicConfig()) {
  const target = path.resolve(destination);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, renderProjectSource(config));
  return target;
}

function main(args = process.argv.slice(2)) {
  const [command, destination] = args;
  if (command !== "render" || !destination) {
    throw new Error("Uso: node tools/public_config.cjs render <arquivo-project.js>");
  }
  const config = loadPublicConfig();
  renderProjectFile(destination, config);
  console.log(`Configuração pública gerada para ${config.backendMode}/${config.buildEnvironment}.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = {
  BACKEND_MODES,
  BUILD_ENVIRONMENTS,
  CONFIG_TOKEN,
  PUBLIC_VARIABLES,
  buildTauriCsp,
  isLoopback,
  loadPublicConfig,
  parseEnv,
  renderProjectFile,
  renderProjectSource,
  tauriConfigOverlay,
  validateBackendUrl,
  validateAuthRedirectUrl,
  validatePublishableKey,
  validateSiteUrl,
  websocketOrigin,
};
