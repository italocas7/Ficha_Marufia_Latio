"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const packageJson = require("../../package.json");

test("keeps the offline build and the hosted test package as separate commands", () => {
  assert.equal(packageJson.scripts.build, "python tools/build.py");
  assert.equal(packageJson.scripts["build:site"], "python tools/build_site.py");
  assert.equal(packageJson.scripts["test:site"], "node tools/test_site_package.cjs");
});

test("builds the hosted package only from the validated runtime files", () => {
  const source = fs.readFileSync(path.join(root, "tools", "build_site.py"), "utf8");
  assert.match(source, /offline_build\.REQUIRED_FILES/);
  assert.match(source, /subprocess\.run\(\[sys\.executable, "tools\/build\.py"\]/);
  assert.match(source, /resolved\.parent != ROOT\.resolve\(\)/);
  assert.match(source, /"server\/index\.js"/);
  assert.match(source, /STAGE \/ "client" \/ relative/);
  assert.match(source, /offline_build\.REQUIRED_FILES/);
});

test("keeps browser files in dist/client and the Worker in dist/server", () => {
  const source = fs.readFileSync(path.join(root, "tools", "test_site_package.cjs"), "utf8");
  assert.match(source, /path\.join\(dist, "client"\)/);
  assert.match(source, /MARUFIA_E2E_ROOT: "dist\/client"/);
  assert.match(source, /path\.join\(dist, "server", "index\.js"\)/);
});

test("serves static assets first and falls back to the sheet entry page", () => {
  const worker = fs.readFileSync(path.join(root, "server", "index.js"), "utf8");
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
  assert.match(worker, /response\.status !== 404/);
  assert.match(worker, /INDEX_PATH = "\/index\.html"/);
  assert.match(worker, /UPDATE_MANIFEST_PATH = "\/app-update\.json"/);
  assert.match(worker, /Access-Control-Allow-Origin/);
  assert.match(worker, /Cache-Control", "no-store, max-age=0/);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, ".openai", "hosting.json"), "utf8")), {
    project_id: "appgprj_6a550a6f1e1c81918743f6c740049806",
  });
});

test("serves the update manifest cross-origin without browser or edge caching", async () => {
  const source = fs.readFileSync(path.join(root, "server", "index.js"), "utf8");
  const worker = (await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`)).default;
  const response = await worker.fetch(
    new Request("https://example.test/app-update.json?check=1"),
    { ASSETS: { fetch: async () => new Response("{}", { status: 200 }) } },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("cdn-cache-control"), "no-store");
  assert.equal(response.headers.get("cloudflare-cdn-cache-control"), "no-store");
  assert.match(response.headers.get("content-type"), /^application\/json/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});

test("applies the update manifest headers when the static asset is served before the Worker", () => {
  const headers = fs.readFileSync(path.join(root, "_headers"), "utf8");
  assert.match(headers, /^\/app-update\.json$/m);
  assert.match(headers, /^\s+Access-Control-Allow-Origin: \*$/m);
  assert.match(headers, /^\s+Cache-Control: no-store, max-age=0$/m);
  assert.match(headers, /^\s+CDN-Cache-Control: no-store$/m);
  assert.match(headers, /^\s+Cloudflare-CDN-Cache-Control: no-store$/m);
  assert.match(headers, /^\s+Cross-Origin-Resource-Policy: cross-origin$/m);
  assert.match(headers, /^\s+X-Content-Type-Options: nosniff$/m);
  assert.match(fs.readFileSync(path.join(root, "tools", "build.py"), "utf8"), /"_headers"/);
});

test("packages the strict desktop update manifest without changing sheet data", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "app-update.json"), "utf8"));
  assert.deepEqual(Object.keys(manifest).sort(), [
    "appId", "channel", "notes", "publishedAt", "releaseUrl", "schemaVersion", "version",
  ]);
  assert.equal(manifest.appId, "com.marufia.online");
  assert.equal(manifest.channel, "alpha");
  assert.equal(manifest.version, require("../../package.json").version);
  assert.equal(manifest.releaseUrl, `https://github.com/italocas7/Ficha_Marufia_Latio/releases/tag/v${manifest.version}`);
  const build = fs.readFileSync(path.join(root, "tools", "build.py"), "utf8");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(build, /"app-update\.json"/);
  assert.match(build, /"src\/online\/app_update\.js"/);
  assert.match(index, /src="src\/online\/app_update\.js"/);
});

test("publishes a site-specific social preview from the trusted production origin", () => {
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(index, /property="og:title" content="Ficha de Marufia \(Latio\)"/);
  assert.match(index, /property="og:image" content="https:\/\/ficha-marufia-latio\.italocas7\.chatgpt\.site\/og\.png"/);
  assert.match(index, /name="twitter:card" content="summary_large_image"/);
  assert.equal(fs.existsSync(path.join(root, "og.png")), true);
});
