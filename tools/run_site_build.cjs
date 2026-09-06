"use strict";

const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pythonExecutable } = require("./build_windows.cjs");

const root = path.resolve(__dirname, "..");
const result = spawnSync(pythonExecutable(process.env), ["tools/build_site.py"], {
  cwd: root,
  env: { ...process.env, LATIO_NODE: process.execPath },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
