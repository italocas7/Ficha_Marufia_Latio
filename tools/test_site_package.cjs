"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const configTools = require("../src/online/config.js");
const { loadPublicConfig } = require("./public_config.cjs");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");

for (const relative of ["index.html", "gm_view.html", "src/online/project.js", "src/online/app_update.js", "_headers", "og.png"]) {
  if (!fs.existsSync(path.join(client, relative))) {
    throw new Error(`Pacote web ausente ou incompleto: client/${relative}. Execute pnpm build:site.`);
  }
}
if (!fs.existsSync(path.join(client, ".marufia", "app-update.json")) || fs.existsSync(path.join(client, "app-update.json"))) {
  throw new Error("O manifesto do aplicativo deve ser servido pelo Worker, não diretamente como arquivo estático.");
}
if (!fs.existsSync(path.join(dist, "server", "index.js"))) {
  throw new Error("Pacote web ausente ou incompleto: server/index.js. Execute pnpm build:site.");
}
const generatedProject = require(path.join(client, "src", "online", "project.js"));
const generatedConfig = configTools.readPublicConfig(generatedProject);
const expectedConfig = loadPublicConfig();
if (generatedConfig.supabaseUrl !== expectedConfig.supabaseUrl
  || generatedConfig.publishableKey !== expectedConfig.publishableKey
  || generatedProject.siteUrl !== expectedConfig.siteUrl
  || generatedProject.authRedirectUrl !== expectedConfig.authRedirectUrl
  || generatedProject.backendMode !== expectedConfig.backendMode) {
  throw new Error("O pacote web não contém o ambiente público selecionado.");
}

const result = spawnSync(process.execPath, [path.join(root, "tests", "e2e", "smoke.cjs")], {
  cwd: root,
  env: { ...process.env, MARUFIA_E2E_ROOT: "dist/client" },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
