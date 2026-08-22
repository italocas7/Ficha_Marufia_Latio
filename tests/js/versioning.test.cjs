"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const versionTools = require("../../tools/check_version.cjs");

const root = path.resolve(__dirname, "..", "..");
const versioningDocument = fs.readFileSync(path.join(root, "docs", "versioning.md"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("adopts one consistent Semantic Version for the Alpha product", () => {
  const contract = versionTools.assertVersionContract();
  assert.equal(contract.packageVersion, "0.1.0");
  assert.equal(contract.runtime.displayName, "Marufia Online Alpha");
  assert.match(contract.packageVersion, versionTools.SEMVER_PATTERN);
});

test("loads the version contract before online consumers", () => {
  const versionPosition = index.indexOf('src="src/online/version.js"');
  const settingsPosition = index.indexOf('src="src/online/settings.js"');
  assert.ok(versionPosition >= 0 && settingsPosition > versionPosition);
});

test("keeps product, sheet schema, backup, and database versions independent", () => {
  assert.match(versioningDocument, /Produto.*0\.1\.0/is);
  assert.match(versioningDocument, /schema da ficha.*v5/is);
  assert.match(versioningDocument, /backup online.*v1/is);
  assert.match(versioningDocument, /migrations.*timestamp/is);
  assert.match(versioningDocument, /não altera automaticamente/i);
});

test("defines the initial development progression without creating a release tag", () => {
  assert.match(versioningDocument, /0\.1\.0.*0\.2\.0.*0\.3\.0.*1\.0\.0/s);
  assert.match(versioningDocument, /Fase 48/);
  assert.equal(require("../../package.json").scripts["test:version"], "node tools/check_version.cjs");
});
