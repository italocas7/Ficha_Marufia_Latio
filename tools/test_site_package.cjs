"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

for (const relative of ["index.html", "gm_view.html", "server/index.js"]) {
  if (!fs.existsSync(path.join(dist, relative))) {
    throw new Error(`Pacote web ausente ou incompleto: ${relative}. Execute pnpm build:site.`);
  }
}

const result = spawnSync(process.execPath, [path.join(root, "tests", "e2e", "smoke.cjs")], {
  cwd: root,
  env: { ...process.env, MARUFIA_E2E_ROOT: "dist" },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
