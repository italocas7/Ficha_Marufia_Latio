const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rolls = require("../../src/core/rolls.js");
const tray = require("../../src/online/dice_tray.js");
const live = require("../../src/online/live_rolls.js");

const campaign = "11111111-1111-4111-8111-111111111111";
const author = "22222222-2222-4222-8222-222222222222";
const other = "33333333-3333-4333-8333-333333333333";
const character = "44444444-4444-4444-8444-444444444444";
const id = "55555555-5555-4555-8555-555555555555";

function row(overrides = {}) {
  return {
    id, campaign_id: campaign, character_id: character, user_id: author,
    character_name: "Aldren", player_name: "Ítalo", roll_type: "tray",
    dice_pool: [{ type: "d4", count: 1 }, { type: "d100", count: 1 }],
    raw_roll: [{ type: "d4", result: 3 }, { type: "d100", tens: 0, units: 0, result: 100 }],
    formula: "1d4 + 1d100", total: 103, visibility: "public", dice_theme: "wine",
    session_id: null, created_at: "2026-09-26T10:00:00Z", ...overrides,
  };
}

test("rolls each of the seven permitted dice and totals mixed pools", () => {
  assert.deepEqual(rolls.TRAY_DICE, ["d4", "d6", "d8", "d10", "d12", "d20", "d100"]);
  const pool = rolls.TRAY_DICE.map((type) => ({ type, count: 1 }));
  const result = rolls.rollTray(pool, () => 0);
  assert.equal(result.formula, "1d4 + 1d6 + 1d8 + 1d10 + 1d12 + 1d20 + 1d100");
  assert.deepEqual(result.dice.map((die) => die.result), [1, 1, 1, 1, 1, 1, 100]);
  assert.equal(result.total, 106);
  assert.deepEqual(rolls.normalizeTrayPool([{ type: "d6", count: 2 }, { type: "d6", count: 1 }]), [{ type: "d6", count: 3 }]);
});

test("creates valid online identifiers even without randomUUID", () => {
  const value = tray.randomUuid({ getRandomValues: (bytes) => bytes.fill(0) });
  assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("caps pools at 50 and rejects unsupported or malformed dice", () => {
  assert.equal(rolls.rollTray([{ type: "d4", count: 50 }], () => 0).dice.length, 50);
  assert.throws(() => rolls.normalizeTrayPool([{ type: "d4", count: 51 }]), /50/);
  assert.throws(() => rolls.normalizeTrayPool([]), /50/);
  assert.throws(() => rolls.normalizeTrayPool([{ type: "d2", count: 1 }]), /inválido/);
  assert.throws(() => rolls.normalizeTrayPool([{ type: "d6", count: 1.5 }]), /inválido/);
});

test("resolves every d100 tens/units pair including 00 + 0", () => {
  for (let tens = 0; tens < 10; tens += 1) {
    for (let units = 0; units < 10; units += 1) {
      const expected = tens === 0 && units === 0 ? 100 : tens * 10 + units;
      assert.equal(rolls.trayD100(tens, units), expected);
      const result = rolls.rollTray([{ type: "d100", count: 1 }], (() => {
        const samples = [tens / 10, units / 10];
        return () => samples.shift();
      })());
      assert.deepEqual(result.dice[0], { type: "d100", tens: tens * 10, units, result: expected });
    }
  }
});

test("validates authoritative server results and rejects client-chosen totals", () => {
  const result = tray.normalizeTrayRow(row());
  assert.equal(result.total, 103);
  assert.equal(result.dice[1].result, 100);
  assert.equal(result.local, false);
  assert.throws(() => tray.normalizeTrayRow(row({ total: 104 })), /total/);
  assert.throws(() => tray.normalizeTrayRow(row({ formula: "2d20" })), /total/);
  assert.throws(() => tray.normalizeTrayRow(row({ visibility: "gm" })), /inválido/);
  assert.throws(() => tray.normalizeTrayRow(row({ dice_theme: "hack" })), /inválido/);
  assert.throws(() => tray.normalizeTrayRow(row({ raw_roll: [{ type: "d4", result: 8 }] })), /incompleto/);
  assert.equal(live.normalizedLiveRoll(row()).rollType, "tray");
});

test("keeps at most 50 recent entries, deduplicates, and filters private rows", () => {
  const own = tray.normalizeTrayRow(row());
  const privateOther = { ...own, id: other, userId: other, visibility: "secret" };
  const history = tray.mergeHistory([own], [own, privateOther]);
  assert.equal(history.length, 2);
  assert.deepEqual(tray.allowedHistory(history, "all", author, "player"), [own]);
  assert.deepEqual(tray.allowedHistory(history, "private", author, "gm"), [privateOther]);
  assert.deepEqual(tray.allowedHistory(history, "mine", author, "gm"), [own]);
  const many = Array.from({ length: 60 }, (_, index) => ({ ...own, id: `local-${index}`, createdAt: new Date(Date.UTC(2026, 8, 26, 0, index)).toISOString() }));
  assert.equal(tray.mergeHistory(many, []).length, 50);
  assert.equal(tray.mergeHistory(many, [])[0].id, "local-59");
});

test("renders names safely and keeps the d100 decomposition available", () => {
  const html = tray.historyItemHtml({ ...tray.normalizeTrayRow(row()), playerName: '<img src=x onerror="alert(1)">' });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /d10 dezenas: 00/);
  assert.match(html, /d10 unidades: 0/);
  assert.equal(tray.THEMES.length, 10);
});

test("keeps all ten die themes legible in light and dark panels", () => {
  const css = fs.readFileSync(path.resolve(__dirname, "../../dice_tray.css"), "utf8");
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255)
      .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  for (const [id] of tray.THEMES) {
    const rule = css.match(new RegExp(`[^\\n]*data-dice-theme="${id}"[^\\n]*\\{[^}]+\\}`))?.[0];
    const face = rule?.match(/--die-face:\s*(#[0-9a-f]{6})/i)?.[1];
    const ink = rule?.match(/--die-ink:\s*(#[0-9a-f]{6})/i)?.[1];
    assert.ok(face && ink, `${id} precisa de cores próprias.`);
    const ratio = (Math.max(luminance(face), luminance(ink)) + 0.05)
      / (Math.min(luminance(face), luminance(ink)) + 0.05);
    assert.ok(ratio >= 4.5, `${id} precisa de contraste legível: ${ratio.toFixed(2)}.`);
  }
});

test("keeps online outcomes server-side and forbids direct roll inserts", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../../supabase/migrations/20260926010000_dice_tray.sql"), "utf8");
  assert.match(source, /security definer/);
  assert.match(source, /characters\.owner_id = v_user_id/);
  assert.match(source, /private\.campaign_role\(v_campaign_id\)/);
  assert.match(source, /v_total_count > 50/);
  assert.match(source, /pg_catalog\.random\(\)/);
  assert.match(source, /pg_catalog\.substring\(v_type, 2\)/);
  assert.match(source, /p_visibility not in \('public', 'secret'\)/);
  assert.doesNotMatch(source, /grant insert .*public\.rolls/i);
  assert.match(source, /revoke all privileges on function public\.roll_dice_tray/);
});
