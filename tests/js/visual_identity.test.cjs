const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const onlineCss = fs.readFileSync(path.join(root, "marufia_online_design.css"), "utf8");

test("loads the online identity after the official Marufia theme", () => {
  const base = index.indexOf('href="styles.css"');
  const officialTheme = index.indexOf('href="marufia_latio_design.css"');
  const onlineTheme = index.indexOf('href="marufia_online_design.css"');
  assert.ok(base >= 0 && officialTheme > base && onlineTheme > officialTheme);
});

test("covers every existing online surface with shared visual language", () => {
  for (const surface of [
    "data-online-home-modal",
    "data-online-settings",
    "data-online-auth-modal",
    "data-online-campaign-modal",
    "data-online-character-import-modal",
    "data-online-character-conflict-modal",
    "data-online-live-rolls-panel",
    "data-online-gm-panel",
  ]) {
    assert.match(onlineCss, new RegExp(`\\[${surface.replaceAll("-", "\\-")}\\]`));
  }
  assert.match(onlineCss, /--online-gold:\s*var\(--accent-2\)/);
  assert.match(onlineCss, /--online-red:\s*var\(--accent\)/);
});

test("keeps light, dark, mobile, reduced-motion, and print treatments explicit", () => {
  assert.match(onlineCss, /body:not\(\.dark\)/);
  assert.match(onlineCss, /@media \(max-width: 620px\)/);
  assert.match(onlineCss, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(onlineCss, /@media print/);
  assert.match(onlineCss, /\.online-home-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s);
});
