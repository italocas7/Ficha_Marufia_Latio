"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const releaseRoot = path.join(projectRoot, "src-tauri", "target", "release");
const manifestPath = path.join(releaseRoot, "bundle", "windows-artifacts.json");
const expectedNames = Object.freeze(["Marufia.exe", "Marufia-Setup.exe"]);
const expectedUpdaterName = "Marufia-Setup.exe.sig";

function assertInside(parent, target) {
  const relative = path.relative(parent, target);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Artefato fora da pasta release autorizada: ${target}`);
  }
}

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function assertPortableExecutable(filePath) {
  const signature = fs.readFileSync(filePath, { encoding: null, flag: "r" }).subarray(0, 2);
  if (signature.toString("ascii") !== "MZ") {
    throw new Error(`Estrutura PE inválida para ${path.basename(filePath)}.`);
  }
}

function getAuthenticodeStatus(filePath) {
  if (process.platform !== "win32") {
    throw new Error("A verificação Authenticode só pode ser executada em Windows.");
  }
  const command = [
    "$ErrorActionPreference = 'Stop'",
    "Import-Module Microsoft.PowerShell.Security -ErrorAction Stop",
    "if (-not (Test-Path -LiteralPath $env:MARUFIA_SIGNATURE_TARGET -PathType Leaf)) { throw 'Artefato não recebido pelo verificador Authenticode.' }",
    "$signature = Get-AuthenticodeSignature -LiteralPath $env:MARUFIA_SIGNATURE_TARGET",
    "$status = $signature.Status.ToString()",
    "$result = [PSCustomObject]@{ status = $status; signer = if ($signature.SignerCertificate) { $signature.SignerCertificate.Subject } else { $null } }",
    "$result | ConvertTo-Json -Compress",
  ].join("; ");
  const systemRoot = process.env.SystemRoot || "C:\\Windows";
  const powershell = path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const systemModulePath = path.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "Modules");
  const result = spawnSync(powershell, ["-NoProfile", "-NonInteractive", "-Command", command], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      MARUFIA_SIGNATURE_TARGET: filePath,
      PSModulePath: systemModulePath,
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`O Windows não conseguiu verificar a assinatura: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout.trim());
}

function verifyArtifact(artifact) {
  const filePath = path.resolve(projectRoot, artifact.path);
  assertInside(releaseRoot, filePath);
  if (path.basename(filePath) !== artifact.name) {
    throw new Error(`Nome e caminho divergentes no relatório: ${artifact.name}.`);
  }
  if (!fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Artefato Windows ausente: ${filePath}`);
  }
  if (sha256(filePath) !== artifact.sha256) {
    throw new Error(`SHA-256 divergente para ${artifact.name}.`);
  }
  assertPortableExecutable(filePath);

  const signature = getAuthenticodeStatus(filePath);
  if (signature.status === "NotSigned") {
    console.log(`${artifact.name}: hash válido; sem assinatura, como documentado para o Alpha.`);
  } else if (signature.status === "Valid" && signature.signer) {
    console.log(`${artifact.name}: hash e assinatura Authenticode válidos (${signature.signer}).`);
  } else {
    throw new Error(`Assinatura Authenticode inválida para ${artifact.name}: ${signature.status}.`);
  }
}

function verifyUpdaterArtifact(updater, releaseVersion) {
  if (updater?.name !== expectedUpdaterName) throw new Error("Assinatura do atualizador ausente no relatório.");
  const filePath = path.resolve(projectRoot, updater.path);
  assertInside(releaseRoot, filePath);
  const stat = fs.statSync(filePath, { throwIfNoEntry: false });
  if (!stat?.isFile() || stat.size !== updater.bytes || sha256(filePath) !== updater.sha256) {
    throw new Error("Integridade divergente para a assinatura do atualizador.");
  }
  const signature = fs.readFileSync(filePath, "utf8").trim();
  if (signature !== updater.signature || signature.length < 64 || !/^[A-Za-z0-9+/=]+$/.test(signature)) {
    throw new Error("Conteúdo da assinatura do atualizador inválido.");
  }
  const updaterManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, updater.manifestPath), "utf8"));
  const platform = updaterManifest.platforms?.["windows-x86_64"];
  if (updaterManifest.version !== releaseVersion || platform?.signature !== signature || platform?.url !== updater.downloadUrl) {
    throw new Error("Manifesto e assinatura do atualizador não correspondem.");
  }
  console.log(`${expectedUpdaterName}: assinatura do atualizador e manifesto correspondentes.`);
}

function main() {
  if (!fs.statSync(manifestPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error("Relatório de integridade ausente. Execute pnpm build:windows primeiro.");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const manifestNames = manifest.files?.map((artifact) => artifact.name) || [];
  if (manifestNames.length !== expectedNames.length || expectedNames.some((name) => !manifestNames.includes(name))) {
    throw new Error("O relatório deve conter exatamente os dois artefatos Windows.");
  }
  for (const artifact of manifest.files) verifyArtifact(artifact);
  verifyUpdaterArtifact(manifest.updater, manifest.version);
  console.log("Verificação Windows concluída sem desativar proteções do sistema.");
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = { assertInside, assertPortableExecutable, getAuthenticodeStatus, main, sha256, verifyArtifact, verifyUpdaterArtifact };
