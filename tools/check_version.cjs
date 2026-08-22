"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function cargoPackageVersion(source) {
  const packageStart = source.indexOf("[package]");
  if (packageStart < 0) return "";

  const afterPackage = source.slice(packageStart + "[package]".length);
  const nextSection = afterPackage.search(/^\s*\[[^\]]+\]\s*$/m);
  const packageSection = nextSection >= 0
    ? afterPackage.slice(0, nextSection)
    : afterPackage;
  return packageSection.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m)?.[1] ?? "";
}

function readVersionContract() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const tauriConfig = JSON.parse(fs.readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"));
  const cargo = fs.readFileSync(path.join(root, "src-tauri", "Cargo.toml"), "utf8");
  delete require.cache[require.resolve("../src/online/version.js")];
  const runtime = require("../src/online/version.js");
  return Object.freeze({
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    tauriVersion: tauriConfig.version,
    cargoVersion: cargoPackageVersion(cargo),
    windowTitle: tauriConfig.app?.windows?.[0]?.title,
    runtime,
  });
}

function assertVersionContract(contract = readVersionContract()) {
  if (contract.packageName !== "marufia-online") {
    throw new Error(`Pacote inesperado: ${contract.packageName}.`);
  }
  if (!SEMVER_PATTERN.test(contract.packageVersion)) {
    throw new Error(`Versão não compatível com Semantic Versioning: ${contract.packageVersion}.`);
  }
  for (const [source, version] of [
    ["Tauri", contract.tauriVersion],
    ["Cargo", contract.cargoVersion],
    ["interface", contract.runtime.version],
  ]) {
    if (version !== contract.packageVersion) {
      throw new Error(`Versão divergente em ${source}: ${version || "ausente"}; esperado ${contract.packageVersion}.`);
    }
  }
  if (contract.runtime.productName !== "Marufia Online"
    || contract.runtime.channel !== "alpha"
    || contract.runtime.channelLabel !== "Alpha"
    || contract.runtime.displayName !== "Marufia Online Alpha"
    || contract.windowTitle !== contract.runtime.displayName) {
    throw new Error("A identidade visível do canal Alpha está divergente.");
  }
  return contract;
}

function main() {
  const contract = assertVersionContract();
  console.log(`${contract.runtime.displayName} v${contract.packageVersion}: contrato SemVer consistente.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = { SEMVER_PATTERN, cargoPackageVersion, readVersionContract, assertVersionContract, main };
