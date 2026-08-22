const assert = require("node:assert/strict");
const test = require("node:test");

const campaignTools = require("../../src/online/campaigns.js");

function fakeClient(options = {}) {
  const calls = { select: [], insert: [], rpc: [], attempts: 0, campaignIds: [], memberCampaignIds: [], ownUserIds: [] };
  const campaigns = options.campaigns ?? [];
  const memberships = options.memberships ?? [];
  return {
    calls,
    client: {
      auth: {
        async getSession() {
          return {
            data: { session: options.signedOut ? null : { user: { id: options.userId ?? "user-1" } } },
            error: options.sessionError ?? null,
          };
        },
      },
      async rpc(name, args) {
        calls.rpc.push({ name, args });
        return { data: options.joinData ?? null, error: options.joinError ?? null };
      },
      from(table) {
        if (table === "campaigns") {
          let payload = null;
          return {
            select(columns) {
              calls.select.push({ table, columns });
              return this;
            },
            in(column, values) {
              assert.equal(column, "id");
              calls.campaignIds.push(...values);
              return this;
            },
            order(column, ordering) {
              assert.equal(column, "created_at");
              assert.deepEqual(ordering, { ascending: false });
              return Promise.resolve({ data: campaigns, error: options.listError ?? null });
            },
            insert(value) {
              payload = value;
              calls.insert.push(value);
              return this;
            },
            async single() {
              calls.attempts += 1;
              if (options.collisions && calls.attempts <= options.collisions) {
                return { data: null, error: { code: "23505", message: "duplicate key" } };
              }
              return {
                data: options.created ?? { id: "campaign-1", ...payload, owner_id: "user-1", join_code: "MRF-K7P4-N2" },
                error: options.createError ?? null,
              };
            },
          };
        }
        if (table === "campaign_members") {
          return {
            select(columns) {
              calls.select.push({ table, columns });
              return this;
            },
            in(column, values) {
              assert.equal(column, "campaign_id");
              calls.memberCampaignIds.push(...values);
              return this;
            },
            eq(column, value) {
              assert.equal(column, "user_id");
              calls.ownUserIds.push(value);
              return this;
            },
            order(column, ordering) {
              assert.equal(column, "joined_at");
              assert.deepEqual(ordering, { ascending: true });
              return Promise.resolve({ data: memberships, error: options.membersError ?? null });
            },
          };
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    },
  };
}

test("validates campaign fields without changing their meaning", () => {
  assert.deepEqual(campaignTools.validateCampaignInput({ name: "  A Coroa Partida  ", description: "  Jornada inicial  " }), {
    name: "A Coroa Partida",
    description: "Jornada inicial",
  });
  assert.throws(() => campaignTools.validateCampaignInput({ name: "" }), /nome/i);
  assert.throws(() => campaignTools.validateCampaignInput({ name: "a".repeat(101) }), /100/);
  assert.throws(() => campaignTools.validateCampaignInput({ name: "Válida", description: "a".repeat(5001) }), /5\.000/);
});

test("normalizes invitation codes without accepting a different format", () => {
  assert.equal(campaignTools.normalizeJoinCode("  mrf-k7p4-n2  "), "MRF-K7P4-N2");
  assert.throws(() => campaignTools.normalizeJoinCode("MRF-INVALIDO"), /MRF-XXXX-XX/);
  assert.throws(() => campaignTools.normalizeJoinCode(""), /MRF-XXXX-XX/);
});

test("loads the authenticated identity and lists only referenced campaigns", async () => {
  const expected = [{ id: "campaign-1", name: "A Coroa Partida", join_code: "MRF-K7P4-N2" }];
  const { client, calls } = fakeClient({ campaigns: expected });
  const service = campaignTools.createCampaignService(client);
  assert.equal(await service.currentUserId(), "user-1");
  assert.deepEqual(await service.listVisible(["campaign-1", "campaign-1"]), expected);
  assert.deepEqual(calls.campaignIds, ["campaign-1"]);
  assert.deepEqual(calls.select[0], { table: "campaigns", columns: campaignTools.CAMPAIGN_COLUMNS });
  const signedOut = fakeClient({ signedOut: true });
  await assert.rejects(() => campaignTools.createCampaignService(signedOut.client).currentUserId(), /sessão expirou/i);
});

test("loads the user's own role rows before campaign details", async () => {
  const memberships = [{ campaign_id: "campaign-1", user_id: "user-2", role: "player", joined_at: "2026-08-20" }];
  const { client, calls } = fakeClient({ memberships, userId: "user-2" });
  assert.deepEqual(await campaignTools.createCampaignService(client).listOwnMemberships("user-2"), memberships);
  assert.deepEqual(calls.ownUserIds, ["user-2"]);
});

test("lists visible campaign memberships with an explicit campaign filter", async () => {
  const memberships = [{ campaign_id: "campaign-1", user_id: "user-1", role: "gm", joined_at: "2026-08-20" }];
  const { client, calls } = fakeClient({ memberships });
  const service = campaignTools.createCampaignService(client);
  assert.deepEqual(await service.listVisibleMembers(["campaign-1", "campaign-1"]), memberships);
  assert.deepEqual(calls.memberCampaignIds, ["campaign-1"]);
  assert.deepEqual(calls.select[0], { table: "campaign_members", columns: campaignTools.MEMBERSHIP_COLUMNS });
  assert.deepEqual(await service.listVisibleMembers([]), []);
});

test("creates campaigns without sending owner or invitation code", async () => {
  const { client, calls } = fakeClient();
  const campaign = await campaignTools.createCampaignService(client).create({ name: "A Coroa Partida", description: "Teste" });
  assert.deepEqual(calls.insert[0], { name: "A Coroa Partida", description: "Teste" });
  assert.equal(campaign.owner_id, "user-1");
  assert.match(campaign.join_code, campaignTools.JOIN_CODE_PATTERN);
});

test("retries only server-side invitation-code collisions", async () => {
  const { client, calls } = fakeClient({ collisions: 2 });
  const campaign = await campaignTools.createCampaignService(client).create({ name: "Campanha" });
  assert.equal(calls.attempts, 3);
  assert.equal(campaign.join_code, "MRF-K7P4-N2");

  const failed = fakeClient({ createError: new Error("Failed to fetch") });
  await assert.rejects(() => campaignTools.createCampaignService(failed.client).create({ name: "Campanha" }), /ficha local continua disponível/i);
  assert.equal(failed.calls.attempts, 1);
});

test("joins campaigns through the restricted operation with a normalized code", async () => {
  const joinData = [{
    campaign_id: "campaign-2",
    campaign_name: "Campanha Convidada",
    member_role: "player",
    already_member: false,
  }];
  const { client, calls } = fakeClient({ joinData });
  const result = await campaignTools.createCampaignService(client).join({ code: "mrf-k7p4-n2" });
  assert.deepEqual(calls.rpc, [{ name: "join_campaign", args: { p_join_code: "MRF-K7P4-N2" } }]);
  assert.deepEqual(result, joinData[0]);
});

test("preserves existing membership results and explains server rejections", async () => {
  const existing = fakeClient({ joinData: [{
    campaign_id: "campaign-1",
    campaign_name: "A Coroa Partida",
    member_role: "gm",
    already_member: true,
  }] });
  assert.deepEqual(await campaignTools.createCampaignService(existing.client).join({ code: "MRF-K7P4-N2" }), {
    campaign_id: "campaign-1",
    campaign_name: "A Coroa Partida",
    member_role: "gm",
    already_member: true,
  });

  const missing = fakeClient({ joinError: { code: "P0002", message: "campaign not found" } });
  await assert.rejects(
    () => campaignTools.createCampaignService(missing.client).join({ code: "MRF-K7P4-N2" }),
    /não encontrado/i,
  );
  assert.equal(missing.calls.rpc.length, 1);

  const invalid = fakeClient();
  await assert.rejects(() => campaignTools.createCampaignService(invalid.client).join({ code: "inválido" }), /MRF-XXXX-XX/);
  assert.equal(invalid.calls.rpc.length, 0);
});

test("renders campaign content safely and accessibly", () => {
  const html = campaignTools.campaignDialogHtml({
    mode: "list",
    campaigns: [{ id: "1", owner_id: "user-1", name: "<script>não</script>", description: "Descrição", join_code: "MRF-K7P4-N2" }],
    memberships: [{ campaign_id: "1", user_id: "user-1", role: "gm" }],
    currentUserId: "user-1",
  });
  assert.match(html, /data-online-campaign-modal/);
  assert.match(html, /MRF-K7P4-N2/);
  assert.match(html, /1 participante/);
  assert.match(html, /Você: Mæstre/);
  assert.match(html, /data-online-live-rolls-action="open"/);
  assert.match(html, /Rolagens da campanha/);
  assert.match(html, /data-online-gm-panel-action="open"/);
  assert.match(html, /Painel do Mæstre/);
  assert.doesNotMatch(html, /<script>/);

  const playerHtml = campaignTools.campaignDialogHtml({
    mode: "list",
    campaigns: [{ id: "2", owner_id: "user-2", name: "Outra campanha", description: "", join_code: "MRF-P7K4-N2" }],
    memberships: [{ campaign_id: "2", user_id: "user-1", role: "player" }],
    currentUserId: "user-1",
  });
  assert.match(playerHtml, /data-online-live-rolls-action="open"/);
  assert.match(playerHtml, /Rolagens da campanha/);
  assert.doesNotMatch(playerHtml, /data-online-gm-panel-action="open"/);

  const form = campaignTools.campaignDialogHtml({ mode: "create", busy: false });
  assert.match(form, /data-online-campaign-form/);
  assert.match(form, /maxlength="100"/);
  assert.match(form, /maxlength="5000"/);

  const joinForm = campaignTools.campaignDialogHtml({ mode: "join", busy: false });
  assert.match(joinForm, /data-online-campaign-join-form/);
  assert.match(joinForm, /for="campaignJoinCode"/);
  assert.match(joinForm, /maxlength="11"/);
  assert.match(joinForm, /Entrar na campanha/);
  assert.match(joinForm, /nunca concede poderes de Mæstre/);
});

test("keeps membership roles scoped to each campaign", () => {
  const campaign = { id: "campaign-1", owner_id: "user-1" };
  const summary = campaignTools.membershipSummary(campaign, [
    { campaign_id: "campaign-1", user_id: "user-1", role: "gm" },
    { campaign_id: "campaign-1", user_id: "user-2", role: "player" },
    { campaign_id: "campaign-2", user_id: "user-1", role: "player" },
  ], "user-1");
  assert.deepEqual(summary, { count: 2, role: "gm", roleLabel: "Mæstre" });
  assert.deepEqual(campaignTools.membershipSummary(campaign, [
    { campaign_id: "campaign-1", user_id: "user-2", role: "player" },
  ], "user-2"), { count: 1, role: "player", roleLabel: "Jogador" });
  assert.equal(campaignTools.MEMBER_ROLE_LABELS.assistant_gm, "Mæstre assistente");
  assert.equal(campaignTools.MEMBER_ROLE_LABELS.spectator, "Espectador");
});
