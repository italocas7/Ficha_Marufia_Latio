"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { loadPublicConfig, tauriConfigOverlay } = require("./public_config.cjs");

const root = path.resolve(__dirname, "..");

function tauriCliPath() {
  const executable = path.join(root, "node_modules", "@tauri-apps", "cli", "tauri.js");
  if (!fs.existsSync(executable)) {
    throw new Error("Tauri CLI ausente. Execute pnpm install antes de iniciar o aplicativo.");
  }
  return executable;
}

function tauriArguments(args, config = loadPublicConfig()) {
  if (!Array.isArray(args) || !args.length) throw new Error("Informe o comando Tauri a executar.");
  return [tauriCliPath(), ...args, "--config", JSON.stringify(tauriConfigOverlay(config))];
}

function run(args = process.argv.slice(2)) {
  const result = spawnSync(process.execPath, tauriArguments(args), {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Tauri foi encerrado com código ${result.status}.`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = { run, tauriArguments, tauriCliPath };
