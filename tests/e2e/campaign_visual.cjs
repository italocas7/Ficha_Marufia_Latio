"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const campaign = require("../../src/online/campaigns.js");
const gm = require("../../src/online/gm_panel.js");
const rolls = require("../../src/online/live_rolls.js");

const root = path.resolve(__dirname, "../..");
const output = path.join(root, "tmp", "visual-v042");
const campaignId = "a0000000-0000-4000-8000-000000000001";
const userId = "b0000000-0000-4000-8000-000000000001";
const names = ["Aurelius Bellator", "Egrymir", "Nanýmir", "Castella", "Lapimeš", "Mira", "Alina", "Tarek"];
const css = ["styles.css", "marufia_latio_design.css", "marufia_online_design.css", "campaign_workspace.css"]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");

function fixture(view) {
  const characters = names.map((name, index) => {
    const id = `c0000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    return {
      character: { id, name, revision: 1, updated_at: new Date().toISOString(), state: { effects: [], inventory: { weapons: [], equipment: [] } } },
      resources: { hp: { current: 18 + index, maximum: 36 }, pm: { current: 11 + index, maximum: 29 } },
      presence: index < 3 ? "online" : "offline", playerName: `Jogador ${index + 1}`, portraitPath: "",
    };
  });
  if (view === "campaign") return campaign.campaignDialogHtml({
    mode: "detail", selectedCampaignId: campaignId, currentUserId: userId,
    campaigns: [{ id: campaignId, owner_id: userId, name: "A Coroa Partida", description: "Jornada pelos reinos de Marufia.", join_code: "MRF-K7P4-N2", skill_limit: 70 }],
    memberships: [{ campaign_id: campaignId, user_id: userId, role: "gm" }],
    characters: [], partyByCampaign: { [campaignId]: characters.map((item) => ({
      id: item.character.id, name: item.character.name, playerName: item.playerName, ownerId: "other",
      hp: item.resources.hp.current, pm: item.resources.pm.current, presence: item.presence, portraitPath: "",
    })) },
  });
  if (view === "gm") return gm.gmPanelHtml({
    campaignId, campaignName: "A Coroa Partida", connection: "live", loading: false,
    characters, playersOnline: 3, playersAway: 0, playersTotal: 8,
    sessions: [{ id: campaignId, name: "Sessão da Coroa", status: "active", startedAt: new Date().toISOString() }],
    activeSession: { id: campaignId, name: "Sessão da Coroa", status: "active", startedAt: new Date().toISOString() },
    events: Array.from({ length: 25 }, (_, index) => ({
      id: String(index), eventType: "hp_changed", payload: { character_name: names[index % names.length], old_value: 25, new_value: 22 }, createdAt: new Date().toISOString(), sessionId: campaignId,
    })),
  });
  return rolls.liveRollsPanelHtml({ campaignId, campaignName: "A Coroa Partida", role: "gm", connection: "live", rolls: [] });
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [width, height] of [[390, 844], [768, 1024], [1366, 768], [1600, 900], [1920, 1080], [2560, 1440], [3840, 2160]]) {
      for (const theme of ["light", "dark"]) {
        const page = await browser.newPage({ viewport: { width, height } });
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        for (const view of ["campaign", "gm", "rolls"]) {
          await page.setContent(`<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body class="${theme === "dark" ? "dark" : ""}"><div class="modal-backdrop"><div class="modal"><header><h2>Centro de Campanha</h2><button class="icon-button" type="button" aria-label="Fechar">×</button></header><div class="modal-body">${fixture(view)}</div></div></div></body></html>`);
          const dimensions = await page.evaluate(() => {
            const modal = document.querySelector(".modal");
            const body = modal.querySelector(".modal-body");
            const nested = [...body.querySelectorAll(".campaign-list,.gm-character-list,.gm-history-list,.live-roll-list")]
              .filter((item) => ["auto", "scroll"].includes(getComputedStyle(item).overflowY));
            const box = modal.getBoundingClientRect();
            return { pageWidth: document.documentElement.scrollWidth, viewportWidth: document.documentElement.clientWidth,
              modalWidth: modal.scrollWidth, modalClient: modal.clientWidth, bodyWidth: body.scrollWidth, bodyClient: body.clientWidth,
              left: box.left, right: box.right, nested: nested.length, nav: getComputedStyle(body.querySelector(".campaign-workspace-nav")).position };
          });
          assert.ok(dimensions.pageWidth <= dimensions.viewportWidth + 1, `${view} ${theme} ${width}: página transborda`);
          assert.ok(dimensions.modalWidth <= dimensions.modalClient + 1, `${view} ${theme} ${width}: janela transborda`);
          assert.ok(dimensions.bodyWidth <= dimensions.bodyClient + 1, `${view} ${theme} ${width}: corpo transborda`);
          assert.ok(dimensions.left >= -1 && dimensions.right <= width + 1, `${view} ${theme} ${width}: janela cortada`);
          assert.equal(dimensions.nested, 0, `${view} ${theme} ${width}: rolagem aninhada`);
          assert.equal(dimensions.nav, "sticky", `${view} ${theme} ${width}: abas não fixas`);
          if ([390, 1920, 3840].includes(width)) await page.screenshot({ path: path.join(output, `${view}-${theme}-${width}.png`) });
        }
        assert.deepEqual(errors, []);
        await page.close();
      }
    }
    console.log("Centro de Campanha: 42 combinações visuais aprovadas.");
  } finally { await browser.close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
