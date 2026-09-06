"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const packageJson = require("../package.json");
const { pythonExecutable } = require("./build_windows.cjs");
const node = process.execPath;
const python = process.env.LATIO_PYTHON || pythonExecutable(process.env);

const STEPS = Object.freeze([
  ["Ficha web", python, ["tools/build_site.py"]],
  ["Navegador desktop/celular", node, ["tools/test_site_package.cjs"]],
  ["Site publicado", node, ["tools/test_live_site.cjs"]],
  ["Backend público", node, ["tools/test_supabase_connection.cjs"]],
  ["Realtime", node, ["tools/test_realtime_connection.cjs"]],
]);

function assertTauriScope() {
  const tauriRoot = path.join(root, "src-tauri");
  if (!fs.existsSync(tauriRoot)) throw new Error("A estrutura Tauri autorizada pela Fase 43 está ausente.");
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const tauriDependency = Object.keys(dependencies).find(
    (name) => name.startsWith("@tauri-apps/") && name !== "@tauri-apps/cli",
  );
  if (tauriDependency) throw new Error(`Integração nativa não autorizada: ${tauriDependency}.`);
  const lockfile = fs.readFileSync(path.join(root, "pnpm-lock.yaml"), "utf8");
  const nativePackages = [...lockfile.matchAll(/@tauri-apps\/([a-z0-9-]+)/gi)].map((match) => match[1]);
  const unexpected = nativePackages.find((name) => !name.startsWith("cli"));
  if (unexpected) throw new Error(`Pacote nativo não autorizado no lockfile: @tauri-apps/${unexpected}.`);
}

function checkedCleanBuild(name) {
  const target = path.resolve(root, name);
  if (path.dirname(target) !== root || !["dist", "dist.next"].includes(path.basename(target))) {
    throw new Error(`Destino temporário inseguro: ${target}`);
  }
  fs.rmSync(target, { recursive: true, force: true });
}

function runStep([label, command, args]) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(command, args, { cwd: root, env: process.env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} reprovado com código ${result.status}.`);
}

function main() {
  assertTauriScope();
  checkedCleanBuild("dist");
  checkedCleanBuild("dist.next");
  try {
    for (const step of STEPS) runStep(step);
    assertTauriScope();
    console.log("\nFase 42 aprovada: ficha, backend e Realtime estão prontos para iniciar Tauri.");
  } finally {
    checkedCleanBuild("dist");
    checkedCleanBuild("dist.next");
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = { STEPS, assertTauriScope, checkedCleanBuild, main };
