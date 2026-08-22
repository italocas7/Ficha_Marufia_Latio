"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tauriRoot = path.join(root, "src-tauri");
const releaseRoot = path.join(tauriRoot, "target", "release");
const nsisRoot = path.join(releaseRoot, "bundle", "nsis");
const sourceExecutable = path.join(releaseRoot, "marufia-online.exe");
const deliverableExecutable = path.join(releaseRoot, "Marufia.exe");
const deliverableInstaller = path.join(releaseRoot, "bundle", "Marufia-Setup.exe");
const manifestPath = path.join(releaseRoot, "bundle", "windows-artifacts.json");

function assertInside(parent, target) {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Destino de build fora da pasta autorizada: ${target}`);
  }
}

function assertWindows() {
  if (process.platform !== "win32") {
    throw new Error("O instalador do Marufia só pode ser gerado em Windows.");
  }
}

function runTauriBuild() {
  const tauriCli = path.join(root, "node_modules", "@tauri-apps", "cli", "tauri.js");
  if (!fs.existsSync(tauriCli)) {
    throw new Error("Tauri CLI ausente. Execute pnpm install antes do build.");
  }
  const result = spawnSync(process.execPath, [tauriCli, "build", "--bundles", "nsis"], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Build Windows reprovado com código ${result.status}.`);
}

function findGeneratedInstaller() {
  if (!fs.existsSync(nsisRoot)) throw new Error("O Tauri não gerou a pasta do instalador NSIS.");
  const installers = fs.readdirSync(nsisRoot)
    .filter((name) => name.toLowerCase().endsWith("-setup.exe"))
    .map((name) => path.join(nsisRoot, name));
  if (installers.length !== 1) {
    throw new Error(`Era esperado um instalador NSIS; foram encontrados ${installers.length}.`);
  }
  return installers[0];
}

function assertPortableExecutable(filePath) {
  const handle = fs.openSync(filePath, "r");
  try {
    const signature = Buffer.alloc(2);
    fs.readSync(handle, signature, 0, signature.length, 0);
    if (signature.toString("ascii") !== "MZ") {
      throw new Error(`Arquivo Windows inválido: ${filePath}`);
    }
  } finally {
    fs.closeSync(handle);
  }
}

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function copyDeliverables(generatedInstaller) {
  for (const destination of [deliverableExecutable, deliverableInstaller, manifestPath]) {
    assertInside(releaseRoot, destination);
  }
  if (!fs.existsSync(sourceExecutable)) {
    throw new Error(`Executável release ausente: ${sourceExecutable}`);
  }
  fs.mkdirSync(path.dirname(deliverableInstaller), { recursive: true });
  fs.copyFileSync(sourceExecutable, deliverableExecutable);
  fs.copyFileSync(generatedInstaller, deliverableInstaller);
  assertPortableExecutable(deliverableExecutable);
  assertPortableExecutable(deliverableInstaller);

  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
  const files = [deliverableExecutable, deliverableInstaller].map((filePath) => ({
    name: path.basename(filePath),
    path: path.relative(root, filePath).replaceAll(path.sep, "/"),
    bytes: fs.statSync(filePath).size,
    sha256: sha256(filePath),
  }));
  fs.writeFileSync(manifestPath, `${JSON.stringify({
    productName: packageJson.productName,
    version: packageJson.version,
    architecture: process.arch,
    files,
  }, null, 2)}\n`);
  return files;
}

function main() {
  assertWindows();
  runTauriBuild();
  const files = copyDeliverables(findGeneratedInstaller());
  console.log("\nBuild Windows concluído:");
  for (const file of files) console.log(`- ${file.path} (${file.sha256})`);
  console.log(`- ${path.relative(root, manifestPath).replaceAll(path.sep, "/")}`);
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
  assertInside,
  assertPortableExecutable,
  copyDeliverables,
  findGeneratedInstaller,
  main,
  sha256,
};
