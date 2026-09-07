"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const versionTools = require("../../tools/check_version.cjs");

const root = path.resolve(__dirname, "..", "..");
const versioningDocument = fs.readFileSync(path.join(root, "docs", "versioning.md"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const versionSource = fs.readFileSync(path.join(root, "src", "online", "version.js"), "utf8");

test("adopts one consistent Semantic Version for the Alpha product", () => {
  const contract = versionTools.assertVersionContract();
  assert.equal(contract.packageVersion, "0.3.0");
  assert.equal(contract.runtime.displayName, "Marufia Online Alpha");
  assert.match(contract.packageVersion, versionTools.SEMVER_PATTERN);
});

test("shows the canonical version below the sheet name", () => {
  const label = {
    textContent: "",
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  const window = {
    document: {
      querySelectorAll(selector) {
        assert.equal(selector, "[data-marufia-version]");
        return [label];
      },
    },
  };
  vm.runInNewContext(versionSource, { window });
  assert.match(index, /data-marufia-version/);
  assert.equal(label.textContent, "v0.3.0");
  assert.equal(label.attributes["aria-label"], "Versão 0.3.0 do Marufia Online");
  assert.equal(window.MARUFIA_VERSION.version, "0.3.0");
});

test("loads the version contract before online consumers", () => {
  const versionPosition = index.indexOf('src="src/online/version.js"');
  const settingsPosition = index.indexOf('src="src/online/settings.js"');
  assert.ok(versionPosition >= 0 && settingsPosition > versionPosition);
});

test("keeps product, sheet schema, backup, and database versions independent", () => {
  assert.match(versioningDocument, /Produto.*0\.3\.0/is);
  assert.match(versioningDocument, /schema da ficha.*v5/is);
  assert.match(versioningDocument, /backup online.*v1/is);
  assert.match(versioningDocument, /migrations.*timestamp/is);
  assert.match(versioningDocument, /não altera automaticamente/i);
});

test("defines the Alpha progression without creating a release tag", () => {
  assert.match(versioningDocument, /0\.1\.0.*0\.2\.0.*0\.3\.0.*1\.0\.0/s);
  assert.match(versioningDocument, /autorização explícita/i);
  assert.match(versioningDocument, /release.*somente depois.*manifesto/is);
  assert.equal(require("../../package.json").scripts["test:version"], "node tools/check_version.cjs");
});
