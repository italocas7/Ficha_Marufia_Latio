"use strict";

const vm = require("node:vm");
const configTools = require("../src/online/config.js");
const { loadPublicConfig } = require("./public_config.cjs");

const expectedProject = loadPublicConfig();
const LIVE_URL = String(process.env.MARUFIA_LIVE_URL || expectedProject.siteUrl).replace(/\/+$/, "");

async function fetchChecked(pathname, expectedType) {
  const response = await fetch(`${LIVE_URL}${pathname}`, {
    headers: { "cache-control": "no-cache" },
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Site publicado indisponível em ${pathname}: HTTP ${response.status}.`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes(expectedType)) {
    throw new Error(`Tipo inesperado em ${pathname}: ${contentType || "ausente"}.`);
  }
  return response;
}

async function main() {
  const page = await fetchChecked("/", "text/html");
  const html = await page.text();
  if (!html.includes("Ficha de Marufia (Latio)") || !html.includes("src/online/project.js")) {
    throw new Error("O endereço publicado não contém a versão online esperada da ficha.");
  }

  const project = await fetchChecked("/src/online/project.js", "javascript");
  const source = await project.text();
  const sandbox = {};
  vm.runInNewContext(source, sandbox, { timeout: 1000 });
  const actualProject = sandbox.MARUFIA_ONLINE_CONFIG;
  const actual = configTools.readPublicConfig(actualProject);
  if (actual.supabaseUrl !== expectedProject.supabaseUrl
    || actual.publishableKey !== expectedProject.publishableKey
    || source.includes("sb_secret_")) {
    throw new Error("A identidade pública do backend no site é inválida.");
  }

  await fetchChecked("/og.png", "image/png");
  console.log(`Site publicado aprovado: ${LIVE_URL}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

module.exports = { LIVE_URL, fetchChecked, main };
