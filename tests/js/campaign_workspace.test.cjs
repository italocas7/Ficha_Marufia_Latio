"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const workspace = require("../../src/online/campaign_workspace.js");

test("renders role-aware campaign navigation with one accessible active view", () => {
  const gm = workspace.campaignWorkspaceNavigationHtml({
    campaignId: "campaign-1",
    campaignName: "A <Coroa>",
    activeView: "gm",
    role: "gm",
  });
  assert.match(gm, /data-campaign-workspace-view="campaign"/);
  assert.match(gm, /data-campaign-workspace-view="gm" aria-current="page"/);
  assert.match(gm, /data-campaign-workspace-view="rolls"/);
  assert.equal((gm.match(/aria-current="page"/g) ?? []).length, 1);
  assert.doesNotMatch(gm, /A <Coroa>/);

  const player = workspace.campaignWorkspaceNavigationHtml({
    campaignId: "campaign-1",
    campaignName: "A Coroa",
    activeView: "rolls",
    role: "player",
  });
  assert.match(player, />Campanha<\/button>/);
  assert.match(player, />Rolagens<\/button>/);
  assert.doesNotMatch(player, /Painel do Mæstre|data-online-gm-panel-action/);
});

test("stops the previous realtime view before activating another campaign view", async () => {
  const view = {};
  const calls = [];
  const unregisterGm = workspace.registerWorkspaceView(view, "gm", async () => {
    await Promise.resolve();
    calls.push("gm-stopped");
  });
  const unregisterRolls = workspace.registerWorkspaceView(view, "rolls", () => calls.push("rolls-stopped"));

  await workspace.deactivateWorkspaceViews(view, "rolls");
  assert.deepEqual(calls, ["gm-stopped"]);
  await workspace.deactivateWorkspaceViews(view, "campaign");
  assert.deepEqual(calls.sort(), ["gm-stopped", "gm-stopped", "rolls-stopped"].sort());

  unregisterGm();
  unregisterRolls();
  calls.length = 0;
  await workspace.deactivateWorkspaceViews(view, "campaign");
  assert.deepEqual(calls, []);
});

test("recognizes lost campaign access without treating network failures as removal", () => {
  assert.equal(workspace.isCampaignAccessUnavailable({ message: "membership required" }), true);
  assert.equal(workspace.isCampaignAccessUnavailable({ userMessage: "Somente o Mæstre desta campanha pode abrir este painel." }), true);
  assert.equal(workspace.isCampaignAccessUnavailable({ code: "PGRST116" }), true);
  assert.equal(workspace.isCampaignAccessUnavailable({ message: "network offline" }), false);
});
