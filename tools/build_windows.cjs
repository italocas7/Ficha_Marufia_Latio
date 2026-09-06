"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { assertProductionBackend, loadPublicConfig, tauriConfigOverlay } = require("./public_config.cjs");

const root = path.resolve(__dirname, "..");
const tauriRoot = path.join(root, "src-tauri");
const releaseRoot = path.join(tauriRoot, "target", "release");
const nsisRoot = path.join(releaseRoot, "bundle", "nsis");
const sourceExecutable = path.join(releaseRoot, "marufia-online.exe");
const deliverableExecutable = path.join(releaseRoot, "Marufia.exe");
const deliverableInstaller = path.join(releaseRoot, "bundle", "Marufia-Setup.exe");
const deliverableSignature = path.join(releaseRoot, "bundle", "Marufia-Setup.exe.sig");
const artifactManifestPath = path.join(releaseRoot, "bundle", "windows-artifacts.json");
const updaterManifestPath = path.join(root, "tauri-update.json");
const releaseDownloadRoot = "https://github.com/italocas7/Ficha_Marufia_Latio/releases/download";

function assertInside(parent, target) {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Destino de build fora da pasta autorizada: ${target}`);
  }
}

function assertOutside(parent, target) {
  const relative = path.relative(parent, target);
  if (!relative || (!relative.startsWith("..") && !path.isAbsolute(relative))) {
    throw new Error("A chave privada do atualizador deve permanecer fora do projeto.");
  }
}

function assertWindows() {
  if (process.platform !== "win32") {
    throw new Error("O instalador do Marufia só pode ser gerado em Windows.");
  }
}

function assertSigningEnvironment(environment = process.env) {
  const keyReference = String(environment.TAURI_SIGNING_PRIVATE_KEY ?? "").trim();
  const keyPath = path.resolve(keyReference);
  const password = String(environment.TAURI_SIGNING_PRIVATE_KEY_PASSWORD ?? "");
  if (!keyReference || !path.isAbsolute(keyReference)) {
    throw new Error("Build recusado: informe o caminho absoluto da chave privada do atualizador.");
  }
  assertOutside(root, keyPath);
  if (!fs.statSync(keyPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error("Build recusado: a chave privada do atualizador não foi encontrada.");
  }
  if (password.length < 12) {
    throw new Error("Build recusado: a senha da chave do atualizador está ausente ou é muito curta.");
  }
  return keyPath;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: options.env ?? process.env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${options.label ?? command} reprovado com código ${result.status}.`);
}

function pythonExecutable(environment = process.env) {
  const candidates = [
    String(environment.MARUFIA_PYTHON ?? "").trim(),
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe"),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()) return candidate;
  }
  const locator = spawnSync(process.platform === "win32" ? "where.exe" : "which", ["python"], {
    encoding: "utf8",
    env: environment,
  });
  const located = locator.status === 0 ? locator.stdout.split(/\r?\n/).find(Boolean) : "";
  if (located && fs.statSync(located, { throwIfNoEntry: false })?.isFile()) return located;
  throw new Error("Python não encontrado para validar o site antes do build Windows.");
}

function runTauriBuild(publicConfig, environment = process.env) {
  assertSigningEnvironment(environment);
  const tauriCli = path.join(root, "node_modules", "@tauri-apps", "cli", "tauri.js");
  if (!fs.existsSync(tauriCli)) {
    throw new Error("Tauri CLI ausente. Execute pnpm install antes do build.");
  }
  const overlayConfig = tauriConfigOverlay(publicConfig);
  const overlay = JSON.stringify(overlayConfig);
  const buildEnvironment = { ...environment, LATIO_NODE: process.execPath };
  run(process.execPath, [tauriCli, "build", "--bundles", "nsis", "--config", overlay], {
    env: buildEnvironment,
    label: "Build Windows",
  });
}

function runSiteBuild(environment = process.env) {
  run(pythonExecutable(environment), ["tools/build_site.py"], {
    env: { ...environment, LATIO_NODE: process.execPath },
    label: "Build final do site",
  });
}

function currentReleaseVersion() {
  return JSON.parse(fs.readFileSync(path.join(tauriRoot, "tauri.conf.json"), "utf8")).version;
}

function findGeneratedInstaller(version = currentReleaseVersion()) {
  if (!fs.existsSync(nsisRoot)) throw new Error("O Tauri não gerou a pasta do instalador NSIS.");
  const expectedSuffix = `_${version}_${process.arch}-setup.exe`.toLowerCase();
  const installers = fs.readdirSync(nsisRoot)
    .filter((name) => name.toLowerCase().endsWith(expectedSuffix))
    .map((name) => path.join(nsisRoot, name));
  if (installers.length !== 1) {
    throw new Error(`Era esperado um instalador NSIS ${version} ${process.arch}; foram encontrados ${installers.length}.`);
  }
  return installers[0];
}

function generatedSignaturePath(installerPath) {
  const signaturePath = `${installerPath}.sig`;
  if (!fs.statSync(signaturePath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error("O Tauri não gerou a assinatura obrigatória do instalador.");
  }
  return signaturePath;
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

function readUpdaterSignature(filePath) {
  const signature = fs.readFileSync(filePath, "utf8").trim();
  if (signature.length < 64 || signature.length > 4096 || !/^[A-Za-z0-9+/=]+$/.test(signature)) {
    throw new Error("A assinatura gerada pelo Tauri está vazia ou possui formato inválido.");
  }
  return signature;
}

function writeUpdaterManifest(version, signature) {
  const legacy = JSON.parse(fs.readFileSync(path.join(root, "app-update.json"), "utf8"));
  if (legacy.version !== version) throw new Error("O manifesto legado não corresponde à versão Windows.");
  const downloadUrl = `${releaseDownloadRoot}/v${version}/Marufia-Setup.exe`;
  const manifest = {
    version,
    notes: legacy.notes,
    pub_date: legacy.publishedAt,
    platforms: {
      "windows-x86_64": {
        url: downloadUrl,
        signature,
      },
    },
  };
  fs.writeFileSync(updaterManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { downloadUrl, manifest };
}

function copyDeliverables(generatedInstaller, publicConfig) {
  for (const destination of [deliverableExecutable, deliverableInstaller, deliverableSignature, artifactManifestPath]) {
    assertInside(releaseRoot, destination);
  }
  if (!fs.existsSync(sourceExecutable)) {
    throw new Error(`Executável release ausente: ${sourceExecutable}`);
  }
  const generatedSignature = generatedSignaturePath(generatedInstaller);
  fs.mkdirSync(path.dirname(deliverableInstaller), { recursive: true });
  fs.copyFileSync(sourceExecutable, deliverableExecutable);
  fs.copyFileSync(generatedInstaller, deliverableInstaller);
  fs.copyFileSync(generatedSignature, deliverableSignature);
  assertPortableExecutable(deliverableExecutable);
  assertPortableExecutable(deliverableInstaller);

  const tauriConfig = JSON.parse(fs.readFileSync(path.join(tauriRoot, "tauri.conf.json"), "utf8"));
  const signature = readUpdaterSignature(deliverableSignature);
  const { downloadUrl } = writeUpdaterManifest(tauriConfig.version, signature);
  const files = [deliverableExecutable, deliverableInstaller].map((filePath) => ({
    name: path.basename(filePath),
    path: path.relative(root, filePath).replaceAll(path.sep, "/"),
    bytes: fs.statSync(filePath).size,
    sha256: sha256(filePath),
  }));
  const updater = {
    name: path.basename(deliverableSignature),
    path: path.relative(root, deliverableSignature).replaceAll(path.sep, "/"),
    bytes: fs.statSync(deliverableSignature).size,
    sha256: sha256(deliverableSignature),
    signature,
    downloadUrl,
    manifestPath: path.relative(root, updaterManifestPath).replaceAll(path.sep, "/"),
  };
  fs.writeFileSync(artifactManifestPath, `${JSON.stringify({
    productName: tauriConfig.productName,
    version: tauriConfig.version,
    architecture: process.arch,
    backendMode: publicConfig.backendMode,
    backendUrl: publicConfig.supabaseUrl,
    files,
    updater,
  }, null, 2)}\n`);
  return { files, updater };
}

function main() {
  assertWindows();
  assertSigningEnvironment(process.env);
  const publicConfig = assertProductionBackend(loadPublicConfig());
  runTauriBuild(publicConfig, process.env);
  const artifacts = copyDeliverables(findGeneratedInstaller(), publicConfig);
  runSiteBuild(process.env);
  console.log("\nBuild Windows assinado concluído:");
  for (const file of artifacts.files) console.log(`- ${file.path} (${file.sha256})`);
  console.log(`- ${artifacts.updater.path} (${artifacts.updater.sha256})`);
  console.log(`- ${path.relative(root, artifactManifestPath).replaceAll(path.sep, "/")}`);
  console.log(`- ${path.relative(root, updaterManifestPath).replaceAll(path.sep, "/")}`);
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
  assertOutside,
  assertPortableExecutable,
  assertSigningEnvironment,
  copyDeliverables,
  currentReleaseVersion,
  findGeneratedInstaller,
  generatedSignaturePath,
  main,
  pythonExecutable,
  readUpdaterSignature,
  sha256,
  writeUpdaterManifest,
};
