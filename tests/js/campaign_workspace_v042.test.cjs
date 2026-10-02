"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const campaign = require("../../src/online/campaigns.js");
const workspace = require("../../src/online/campaign_workspace.js");
const rolls = require("../../src/online/live_rolls.js");

const root = path.resolve(__dirname, "../..");

test("campaign navigation hides the GM area from players", () => {
  const player = workspace.campaignWorkspaceNavigationHtml({ campaignId: "campaign", campaignName: "Teste", role: "player" });
  const gm = workspace.campaignWorkspaceNavigationHtml({ campaignId: "campaign", campaignName: "Teste", role: "gm" });
  assert.doesNotMatch(player, /Painel do Mæstre/);
  assert.match(gm, /Painel do Mæstre/);
});

test("party cards show only summary and restrict full-sheet actions", () => {
  const fixture = { id: "campaign", name: "Teste" };
  const member = { id: "character", name: "Heroi", hp: 12, pm: 7, ownerId: "owner", playerName: "Jogador", presence: "online", portraitPath: "" };
  const playerHtml = campaign.partySummaryHtml(fixture, { currentUserId: "other", partyByCampaign: { campaign: [member] } });
  assert.match(playerHtml, /Jogador/);
  assert.match(playerHtml, /PV <strong>12/);
  assert.doesNotMatch(playerHtml, /Abrir ficha|data-sheet-state/);
  const ownerHtml = campaign.partySummaryHtml(fixture, { currentUserId: "owner", partyByCampaign: { campaign: [member] } });
  assert.match(ownerHtml, /Abrir ficha/);
  const gmHtml = campaign.partySummaryHtml(fixture, { currentUserId: "gm", memberships: [{ campaign_id: "campaign", user_id: "gm", role: "gm" }], partyByCampaign: { campaign: [member] } });
  assert.match(gmHtml, /open-character-from-campaign/);
  assert.doesNotMatch(gmHtml, /data-online-gm-panel-action="open"/);
});

test("private roll filter appears only for GM and layout has one scroll area", () => {
  const player = rolls.liveRollsPanelHtml({ campaignId: "campaign", campaignName: "Teste", role: "player", rolls: [] });
  const gm = rolls.liveRollsPanelHtml({ campaignId: "campaign", campaignName: "Teste", role: "gm", rolls: [] });
  assert.doesNotMatch(player, />Privadas<\/button>/);
  assert.match(gm, />Privadas<\/button>/);
  const css = fs.readFileSync(path.join(root, "campaign_workspace.css"), "utf8");
  assert.match(css, /\.modal:has\(\[data-campaign-workspace-nav\]\) > \.modal-body\s*\{[^}]*overflow-y: auto/s);
  assert.match(css, /\.campaign-list,[\s\S]*\.gm-history-list\s*\{\s*max-height: none; overflow: visible/);
});
