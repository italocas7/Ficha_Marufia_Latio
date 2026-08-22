"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const client = path.join(dist, "client");

for (const relative of ["index.html", "gm_view.html", "src/online/project.js", "src/online/app_update.js", "app-update.json", "og.png"]) {
  if (!fs.existsSync(path.join(client, relative))) {
    throw new Error(`Pacote web ausente ou incompleto: client/${relative}. Execute pnpm build:site.`);
  }
}
if (!fs.existsSync(path.join(dist, "server", "index.js"))) {
  throw new Error("Pacote web ausente ou incompleto: server/index.js. Execute pnpm build:site.");
}

const result = spawnSync(process.execPath, [path.join(root, "tests", "e2e", "smoke.cjs")], {
  cwd: root,
  env: { ...process.env, MARUFIA_E2E_ROOT: "dist/client" },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
