"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const { assertVersionContract } = require("./check_version.cjs");

const root = path.resolve(__dirname, "..");
const windowsReleaseRoot = path.join(root, "src-tauri", "target", "release");
const manifestPath = path.join(windowsReleaseRoot, "bundle", "windows-artifacts.json");
const expectedNames = Object.freeze(["Marufia.exe", "Marufia-Setup.exe"]);

function assertInside(parent, target) {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Artefato fora da pasta Windows autorizada: ${target}`);
  }
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readReleaseContract() {
  const version = assertVersionContract().packageVersion;
  const tag = `v${version}`;
  const notesPath = path.join(root, "docs", "releases", `${tag}.md`);
  if (!fs.statSync(notesPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Notas da release ausentes: ${path.relative(root, notesPath)}.`);
  }
  if (!fs.statSync(manifestPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error("Artefatos Windows ausentes. Execute pnpm build:windows primeiro.");
  }
  return {
    version,
    tag,
    notesPath,
    notes: fs.readFileSync(notesPath, "utf8"),
    manifest: JSON.parse(fs.readFileSync(manifestPath, "utf8")),
  };
}

function assertReleaseContract(contract = readReleaseContract()) {
  const { manifest, notes, tag, version } = contract;
  if (manifest.productName !== "Marufia Online" || manifest.version !== version || manifest.architecture !== "x64") {
    throw new Error("O relatório Windows não corresponde ao Marufia Online Alpha x64 atual.");
  }
  const files = Array.isArray(manifest.files) ? manifest.files : [];
  const names = files.map((file) => file.name);
  if (files.length !== expectedNames.length || expectedNames.some((name) => !names.includes(name))) {
    throw new Error("A release precisa conter exatamente o portátil e o instalador Windows.");
  }
  for (const artifact of files) {
    const filePath = path.resolve(root, artifact.path);
    assertInside(windowsReleaseRoot, filePath);
    if (path.basename(filePath) !== artifact.name || !expectedNames.includes(artifact.name)) {
      throw new Error(`Nome de artefato inesperado: ${artifact.name}.`);
    }
    const stat = fs.statSync(filePath, { throwIfNoEntry: false });
    if (!stat?.isFile() || stat.size !== artifact.bytes || sha256(filePath) !== artifact.sha256) {
      throw new Error(`Integridade divergente para ${artifact.name}.`);
    }
    if (fs.readFileSync(filePath).subarray(0, 2).toString("ascii") !== "MZ") {
      throw new Error(`Arquivo Windows inválido: ${artifact.name}.`);
    }
    if (!notes.includes(artifact.name) || !notes.includes(artifact.sha256)) {
      throw new Error(`As notas não registram o artefato ${artifact.name} e seu SHA-256.`);
    }
  }
  if (!notes.includes(`Marufia Online Alpha ${version}`)
    || !notes.includes(`\`${tag}\``)
    || !/pré-lançamento/i.test(notes)
    || !/sem assinatura digital/i.test(notes)) {
    throw new Error("As notas não identificam claramente versão, tag, canal Alpha e assinatura.");
  }
  return contract;
}

function main() {
  const contract = assertReleaseContract();
  console.log(`Release local ${contract.tag} pronta: notas e dois artefatos Windows íntegros.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = { assertInside, assertReleaseContract, expectedNames, readReleaseContract, sha256 };
