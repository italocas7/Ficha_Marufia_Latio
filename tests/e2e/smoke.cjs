const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..", "..");
const root = process.env.MARUFIA_E2E_ROOT
  ? path.resolve(projectRoot, process.env.MARUFIA_E2E_ROOT)
  : projectRoot;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".pdf": "application/pdf",
};

function server() {
  return http.createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = requestPath === "/" ? "index.html" : requestPath.slice(1);
    const fakeSupabase = relative === "vendor/supabase.js";
    const target = fakeSupabase
      ? path.resolve(projectRoot, "tests", "e2e", "fake_supabase.js")
      : path.resolve(root, relative);
    if ((!fakeSupabase && !target.startsWith(root)) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream" });
    fs.createReadStream(target).pipe(response);
  });
}

async function exercise(page, url, viewport) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url);
  await page.getByRole("button", { name: "Criar ficha nova" }).click();
  const tabNames = await page.getByRole("tab").allTextContents();
  assert.equal(tabNames.length, 7, "A ficha deve manter as sete abas.");
  assert.ok(tabNames.some((name) => name.startsWith("Mundo")), "A aba Mundo deve permanecer presente.");
  const tabs = ["Resumo", "Combate", "Magia", "Inventário", "P&T", "Antecedentes"];
  for (const tab of tabs) {
    await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
    await page.locator("#app").waitFor({ state: "visible" });
    assert.ok((await page.locator("#app").innerText()).trim(), `A aba ${tab} não pode ficar vazia.`);
  }
  await page.getByRole("tab", { name: /^Resumo/ }).click();
  let name = page.locator('[data-path="character.name"]');
  await name.fill("Teste de regressão");
  assert.equal(await name.inputValue(), "Teste de regressão", "Campo Nome não permaneceu editável.");
  await page.waitForTimeout(350);
  await page.reload();
  name = page.locator('[data-path="character.name"]');
  assert.equal(await name.inputValue(), "Teste de regressão", "O texto não persistiu enquanto o campo estava focado.");

  await page.evaluate(() => {
    window.__marufiaOriginalRandom = Math.random;
    Math.random = () => 0;
  });
  await page.locator('[data-action="roll-skill"][data-mode="normal"]').first().click();
  const rollModal = page.locator("#modalRoot .modal");
  assert.match(await rollModal.innerText(), /Normal\s+1\s+Dados: 1/i, "A rolagem d100 deve usar a camada central e manter o resultado exibido.");
  assert.match(await rollModal.innerText(), /Crítico natural/i);
  await rollModal.getByRole("button", { name: "Fechar" }).last().click();
  await page.evaluate(() => {
    Math.random = window.__marufiaOriginalRandom;
    delete window.__marufiaOriginalRandom;
  });

  const level = page.locator('[data-path="character.level"]');
  await level.fill("3");
  await page.reload();
  assert.equal(await page.locator('[data-path="character.level"]').inputValue(), "3", "O campo numérico ativo não foi salvo ao recarregar.");

  const stateBeforeOnlineImport = await page.evaluate(() => JSON.stringify(window.MARUFIA_APP_BRIDGE.snapshot()));
  await page.evaluate(() => {
    const backup = window.LATIO_STATE.createOnlineBackup(window.MARUFIA_APP_BRIDGE.snapshot(), {
      characterId: "44444444-4444-4444-8444-000000000001",
      campaignId: "33333333-3333-4333-8333-000000000002",
      revision: 7,
      origin: "player",
    });
    window.importJsonText(JSON.stringify(backup), "backup-online.json");
  });
  const onlineBackupReview = page.locator("#modalRoot .modal");
  await onlineBackupReview.waitFor({ state: "visible" });
  assert.match(await onlineBackupReview.innerText(), /Backup online/i, "O importador deve reconhecer o envelope online.");
  await onlineBackupReview.getByRole("button", { name: "Cancelar" }).click();
  assert.equal(
    await page.evaluate(() => JSON.stringify(window.MARUFIA_APP_BRIDGE.snapshot())),
    stateBeforeOnlineImport,
    "Cancelar a importação online não pode alterar a ficha local.",
  );

  const accountButton = page.locator("#onlineAccountButton");
  const syncStatus = page.locator("#onlineSyncStatus");
  await accountButton.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("#onlineAccountButton")?.dataset.authState === "offline");
  assert.equal(await syncStatus.getAttribute("data-sync-state"), "offline");
  assert.equal((await syncStatus.innerText()).trim(), "Offline");
  await accountButton.click();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Nome exibido").fill("Jogador Teste");
  await page.getByLabel("Email").fill("jogador@example.com");
  await page.getByLabel("Senha").fill("senha-segura");
  await page.locator("#onlineAuthForm").getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.waitForFunction(() => document.querySelector("#onlineAccountButton")?.dataset.authState === "online");
  await page.evaluate(() => {
    window.__marufiaRemoteEvents = [];
    window.addEventListener("marufia:remote-character-updated", (event) => {
      window.__marufiaRemoteEvents.push({
        event: event.detail?.event,
        id: event.detail?.character?.id,
        name: event.detail?.character?.name,
      });
    });
  });
  assert.equal(await page.locator("#onlineAccountLabel").textContent(), "Jogador Teste", "O perfil autenticado não apareceu no cabeçalho.");
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "online");
  assert.equal((await syncStatus.innerText()).trim(), "Online");
  const localImport = page.locator("[data-online-character-import-modal]");
  await localImport.waitFor({ state: "visible" });
  assert.match(await localImport.innerText(), /Encontramos uma ficha existente/i);
  assert.match(await localImport.innerText(), /Teste de regressão/);
  assert.match(await localImport.innerText(), /backup local/i);
  await localImport.getByRole("button", { name: "Importar para minha conta" }).click();
  assert.match(await localImport.innerText(), /importado com segurança/i);
  const importState = await page.evaluate(() => ({
    backups: JSON.parse(localStorage.getItem("marufia-latio-backups-v1") || "[]"),
    characters: JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]"),
    local: JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null"),
  }));
  assert.match(importState.backups[0]?.label ?? "", /Antes de importar a ficha local/i);
  assert.equal(JSON.parse(importState.backups[0]?.payload ?? "null")?.character?.name, "Teste de regressão");
  assert.equal(importState.characters.length, 1, "A importação deve criar somente um personagem remoto.");
  assert.equal(importState.characters[0].campaign_id, null, "A ficha importada deve nascer fora de campanhas.");
  assert.equal(importState.characters[0].state.character.name, "Teste de regressão");
  assert.equal(importState.local.character.name, "Teste de regressão", "A ficha local original não pode ser alterada.");
  await localImport.getByRole("button", { name: "Continuar" }).click();
  await page.waitForFunction(() => document.querySelector("#onlineAccountButton")?.dataset.realtimeState === "subscribed");

  const homeButton = page.locator("#onlineHomeButton");
  await homeButton.waitFor({ state: "visible" });
  await homeButton.click();
  const onlineHome = page.locator('[data-online-home-modal][data-online-home-view="home"]');
  await onlineHome.waitFor({ state: "visible" });
  await page.waitForFunction(() => !document.querySelector("[data-online-home-action='refresh']")?.disabled);
  const onlineVisual = await page.evaluate(() => {
    const card = document.querySelector(".online-home-card");
    const modal = document.querySelector(".online-home-modal-shell");
    const style = getComputedStyle(card);
    return {
      cardDisplay: style.display,
      cardMinHeight: Number.parseFloat(style.minHeight),
      cardRadius: Number.parseFloat(style.borderRadius),
      modalWidth: modal?.getBoundingClientRect().width ?? 0,
      viewportWidth: document.documentElement.clientWidth,
      onlineStylesheet: [...document.styleSheets].some((sheet) => sheet.href?.endsWith("/marufia_online_design.css")),
    };
  });
  assert.equal(onlineVisual.onlineStylesheet, true, "A identidade do Marufia Online deve estar carregada.");
  assert.equal(onlineVisual.cardDisplay, "grid");
  assert.ok(onlineVisual.cardMinHeight >= 80, "Os destinos online precisam manter área de toque legível.");
  assert.ok(onlineVisual.cardRadius >= 10, "Os cards online devem seguir os cantos do tema oficial.");
  assert.ok(onlineVisual.modalWidth <= onlineVisual.viewportWidth, "O início online não pode exceder a tela.");
  assert.match(await onlineHome.innerText(), /MARUFIA ONLINE/i);
  assert.match(await onlineHome.innerText(), /1 ficha · 0 campanhas/i);
  for (const destination of ["Minhas fichas", "Campanhas", "Entrar em campanha", "Configurações"]) {
    assert.equal(await onlineHome.getByRole("button", { name: new RegExp(destination, "i") }).count(), 1, `O início deve mostrar ${destination}.`);
  }
  await onlineHome.getByRole("button", { name: /Minhas fichas/i }).click();
  const ownCharacters = page.locator('[data-online-home-modal][data-online-home-view="characters"]');
  await ownCharacters.waitFor({ state: "visible" });
  assert.match(await ownCharacters.innerText(), /Teste de regressão/);
  assert.match(await ownCharacters.innerText(), /Schema v5/);
  await ownCharacters.getByRole("button", { name: "Voltar ao início" }).click();
  await page.locator('[data-online-home-modal][data-online-home-view="home"]').getByRole("button", { name: /Entrar em campanha/i }).click();
  await page.locator("[data-online-campaign-join-form]").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.locator("#modalRoot .modal").getByRole("button", { name: "Fechar" }).last().click();
  await homeButton.click();
  await page.locator('[data-online-home-modal][data-online-home-view="home"]').getByRole("button", { name: /Configurações/i }).click();
  const settingsModal = page.locator("#modalRoot .modal");
  const onlineSettings = settingsModal.locator("[data-online-settings]");
  await onlineSettings.waitFor({ state: "visible" });
  assert.match(await settingsModal.innerText(), /Limite inicial de Perícia/i);
  assert.match(await onlineSettings.innerText(), /Jogador Teste/i);
  assert.match(await onlineSettings.innerText(), /Sincronização/i);
  assert.match(await onlineSettings.innerText(), /ficha (?:está )?vinculada/i);
  assert.match(await onlineSettings.innerText(), /Dados locais/i);
  assert.match(await onlineSettings.innerText(), /Marufia Online Alpha · v0\.1\.0/i);
  await settingsModal.getByRole("button", { name: "Modo Escuro" }).click();
  assert.equal(await page.locator("body").evaluate((body) => body.classList.contains("dark")), true);
  assert.equal(await settingsModal.getByRole("button", { name: "Modo Escuro" }).getAttribute("aria-pressed"), "true");
  await settingsModal.getByRole("button", { name: "Modo Claro" }).click();
  assert.equal(await page.locator("body").evaluate((body) => body.classList.contains("dark")), false);
  assert.equal(await settingsModal.getByRole("button", { name: "Modo Claro" }).getAttribute("aria-pressed"), "true");
  const settingsLayout = await settingsModal.evaluate((modal) => ({
    scrollWidth: modal.scrollWidth,
    clientWidth: modal.clientWidth,
    columns: getComputedStyle(modal.querySelector(".online-settings-grid")).gridTemplateColumns.split(" ").length,
  }));
  assert.ok(settingsLayout.scrollWidth <= settingsLayout.clientWidth + 1, "Configurações não podem criar estouro horizontal.");
  assert.equal(settingsLayout.columns, viewport.width <= 620 ? 1 : 2, "Configurações devem adaptar a grade à tela.");
  await onlineSettings.getByRole("button", { name: "Gerenciar conta" }).click();
  const settingsAccount = page.locator("[data-online-auth-modal]");
  await settingsAccount.waitFor({ state: "visible" });
  assert.match(await settingsAccount.innerText(), /Jogador Teste/i);
  await page.locator("#modalRoot .modal").getByRole("button", { name: "Fechar" }).last().click();

  name = page.locator('[data-path="character.name"]');
  await name.fill("Teste s");
  await page.waitForTimeout(300);
  await name.fill("Teste sinc");
  await page.waitForTimeout(300);
  await name.fill("Teste sincron");
  await page.waitForTimeout(300);
  await name.fill("Teste sincronizado");
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "syncing");
  assert.equal((await syncStatus.innerText()).trim(), "Sincronizando");
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]");
    return local?.character?.name === "Teste sincronizado"
      && remote[0]?.state?.character?.name === "Teste sincronizado";
  });
  const synchronized = await page.evaluate(() => ({
    character: JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0],
    writes: Number(JSON.parse(localStorage.getItem("marufia-e2e-character-writes") || "0")),
  }));
  assert.equal(synchronized.character.name, "Teste sincronizado", "O nome remoto deve ser derivado do estado atualizado.");
  assert.equal(synchronized.character.schema_version, 5, "A versão remota deve continuar alinhada ao schema v5.");
  assert.equal(synchronized.writes, 1, "Uma rajada de edições deve produzir somente uma gravação remota.");
  await page.waitForFunction(() => window.__marufiaRemoteEvents?.some((event) => (
    event.event === "UPDATE" && event.name === "Teste sincronizado"
  )));
  const eventsBeforeFailure = await page.evaluate(() => window.__marufiaRemoteEvents.length);
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "online");

  await page.evaluate(() => localStorage.setItem("marufia-e2e-character-save-fails", "true"));
  await name.fill("Falha remota preservada localmente");
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "syncing");
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "error");
  assert.equal((await syncStatus.innerText()).trim(), "Erro de sincronização");
  const failedSave = await page.evaluate(() => ({
    local: JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null"),
    remote: JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0],
  }));
  assert.equal(failedSave.local.character.name, "Falha remota preservada localmente");
  assert.equal(failedSave.remote.state.character.name, "Teste sincronizado");
  assert.equal(
    await page.evaluate(() => window.__marufiaRemoteEvents.length),
    eventsBeforeFailure,
    "Uma gravação remota recusada não pode emitir uma atualização em tempo real.",
  );

  await page.evaluate(() => localStorage.removeItem("marufia-e2e-character-save-fails"));
  await name.fill("Teste recuperado");
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "syncing");
  await page.waitForFunction(() => {
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]");
    return remote[0]?.state?.character?.name === "Teste recuperado"
      && document.querySelector("#onlineSyncStatus")?.dataset.syncState === "online";
  });
  await page.waitForFunction(() => window.__marufiaRemoteEvents?.some((event) => event.name === "Teste recuperado"));

  const writesBeforeConflict = await page.evaluate(() => Number(JSON.parse(
    localStorage.getItem("marufia-e2e-character-writes") || "0",
  )));
  await name.fill("Edição local concorrente");
  await page.evaluate(() => {
    const character = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    const externalState = JSON.parse(JSON.stringify(character.state));
    externalState.resources.hpCurrent = 18;
    externalState.meta.updatedAt = new Date().toISOString();
    window.__marufiaFakeRemoteUpdate(character.id, externalState, "gm");
  });
  const conflictModal = page.locator("[data-online-character-conflict-modal]");
  await conflictModal.waitFor({ state: "visible" });
  assert.match(await conflictModal.innerText(), /Nenhuma das duas versões foi sobrescrita/i);
  assert.match(await conflictModal.innerText(), /Teste recuperado/);
  assert.match(await conflictModal.innerText(), /Revisão \d+/);
  assert.match(await conflictModal.innerText(), /Mæstre/);
  assert.equal(await name.inputValue(), "Edição local concorrente", "Uma edição concorrente não pode substituir silenciosamente a ficha local.");
  assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0])).state.resources.hpCurrent, 18);
  await page.getByRole("button", { name: "Manter minha versão" }).click();
  await page.waitForFunction(() => {
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    return remote?.state?.character?.name === "Edição local concorrente"
      && document.querySelector("#onlineSyncStatus")?.dataset.syncState === "online";
  });
  assert.equal(
    await page.evaluate(() => Number(JSON.parse(localStorage.getItem("marufia-e2e-character-writes") || "0"))),
    writesBeforeConflict + 1,
    "A versão local só deve sobrescrever a remota depois da confirmação explícita.",
  );

  const writesBeforeOffline = await page.evaluate(() => Number(JSON.parse(
    localStorage.getItem("marufia-e2e-character-writes") || "0",
  )));
  await page.context().setOffline(true);
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "offline");
  await name.fill("Edição preservada offline");
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const queue = JSON.parse(localStorage.getItem("marufia-online-pending-saves-v1") || "{}");
    return local?.character?.name === "Edição preservada offline"
      && Object.values(queue)[0]?.state?.character?.name === "Edição preservada offline";
  });
  const whileOffline = await page.evaluate(() => ({
    remote: JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0],
    writes: Number(JSON.parse(localStorage.getItem("marufia-e2e-character-writes") || "0")),
  }));
  assert.equal(whileOffline.remote.state.character.name, "Edição local concorrente", "A fila offline não pode fingir que a gravação remota terminou.");
  assert.equal(whileOffline.writes, writesBeforeOffline, "Nenhuma requisição de gravação deve ser iniciada enquanto o navegador está offline.");

  await page.context().setOffline(false);
  await page.waitForFunction(() => {
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    const queue = JSON.parse(localStorage.getItem("marufia-online-pending-saves-v1") || "{}");
    return remote?.state?.character?.name === "Edição preservada offline"
      && Object.keys(queue).length === 0
      && document.querySelector("#onlineSyncStatus")?.dataset.syncState === "online";
  });
  assert.equal(
    await page.evaluate(() => Number(JSON.parse(localStorage.getItem("marufia-e2e-character-writes") || "0"))),
    writesBeforeOffline + 1,
    "A reconexão deve enviar apenas a versão offline mais recente.",
  );

  const campaignsButton = page.locator("#onlineCampaignsButton");
  await campaignsButton.waitFor({ state: "visible" });
  await campaignsButton.click();
  assert.match(await page.locator("[data-online-campaign-modal]").innerText(), /ainda não participa de campanhas/i);
  assert.match(await page.locator("[data-online-campaign-modal]").innerText(), /papel é definido separadamente em cada campanha/i);
  await page.getByRole("button", { name: "Entrar com código" }).click();
  await page.getByLabel("Código da campanha").fill("invalido");
  await page.locator("#onlineCampaignJoinForm").getByRole("button", { name: "Entrar na campanha" }).click();
  assert.match(await page.getByRole("alert").innerText(), /MRF-XXXX-XX/);
  await page.getByLabel("Código da campanha").fill("mrf-play-er");
  await page.locator("#onlineCampaignJoinForm").getByRole("button", { name: "Entrar na campanha" }).click();
  const invitedCampaign = page.locator(".campaign-card").filter({ hasText: "Campanha Convidada" });
  await invitedCampaign.waitFor({ state: "visible" });
  assert.match(await invitedCampaign.innerText(), /Você: Jogador/);
  assert.doesNotMatch(await invitedCampaign.innerText(), /participante/);

  await page.getByRole("button", { name: "Nova campanha" }).click();
  await page.getByLabel("Nome da campanha").fill("A Coroa Partida");
  await page.getByLabel("Descrição").fill("Campanha de teste do Mæstre.");
  await page.locator("#onlineCampaignForm").getByRole("button", { name: "Criar campanha" }).click();
  const ownedCampaign = page.locator(".campaign-card").filter({ hasText: "A Coroa Partida" });
  await ownedCampaign.waitFor({ state: "visible" });
  assert.match(await ownedCampaign.locator("code").textContent(), /^MRF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/);
  assert.match(await ownedCampaign.innerText(), /1 participante/);
  assert.match(await ownedCampaign.innerText(), /Você: Mæstre/);

  await page.waitForFunction(() => {
    const local = window.MARUFIA_APP_BRIDGE.snapshot();
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0]?.state;
    return JSON.stringify(local) === JSON.stringify(remote)
      && document.querySelector("#onlineSyncStatus")?.dataset.syncState === "online";
  });

  const linkedRollTarget = await page.evaluate(async () => {
    const character = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    const campaign = JSON.parse(localStorage.getItem("marufia-e2e-campaigns") || "[]")
      .find((item) => item.name === "A Coroa Partida");
    const service = window.MARUFIA_CHARACTERS.createCharacterService(
      window.MARUFIA_SUPABASE.getSupabaseClient(),
      window.LATIO_STATE,
    );
    const associated = await service.associate(character.id, campaign.id);
    return { characterId: associated.id, campaignId: associated.campaign_id };
  });
  assert.match(linkedRollTarget.characterId, /^[0-9a-f-]{36}$/i);
  assert.match(linkedRollTarget.campaignId, /^[0-9a-f-]{36}$/i);
  await page.waitForTimeout(250);
  const associationStatus = await page.evaluate(() => ({
    sync: document.querySelector("#onlineSyncStatus")?.dataset.syncState,
    realtime: document.querySelector("#onlineAccountButton")?.dataset.realtimeState,
    conflict: Boolean(document.querySelector("[data-online-character-conflict-modal]")),
  }));
  assert.deepEqual(associationStatus, { sync: "online", realtime: "subscribed", conflict: false }, "A associação não pode criar conflito com um estado de ficha idêntico.");
  await page.locator("#modalRoot").getByRole("button", { name: "Fechar" }).last().click();
  await page.getByRole("tab", { name: /^Resumo/ }).click();

  await page.evaluate(() => {
    window.__marufiaOriginalRandom = Math.random;
    Math.random = () => 0;
  });
  await page.locator('[data-action="roll-skill"][data-mode="normal"]').first().click();
  await page.locator("#modalRoot .modal").getByRole("button", { name: "Fechar" }).last().click();
  await page.evaluate(() => {
    Math.random = window.__marufiaOriginalRandom;
    delete window.__marufiaOriginalRandom;
  });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("marufia-e2e-rolls") || "[]").length === 1);
  const registeredRoll = await page.evaluate(() => JSON.parse(localStorage.getItem("marufia-e2e-rolls") || "[]")[0]);
  assert.equal(registeredRoll.character_id, linkedRollTarget.characterId);
  assert.equal(registeredRoll.campaign_id, linkedRollTarget.campaignId);
  assert.equal(registeredRoll.user_id, "11111111-1111-4111-8111-111111111111");
  assert.equal(registeredRoll.roll_type, "skill");
  assert.equal(registeredRoll.formula, "1d100");
  assert.deepEqual(registeredRoll.raw_roll, [1]);
  assert.equal(registeredRoll.modifier, 0);
  assert.equal(registeredRoll.total, 1);
  assert.equal(registeredRoll.outcome, "Crítico natural");
  assert.equal(registeredRoll.visibility, "gm", "Uma rolagem feita pelo Mæstre deve permanecer somente com seu autor.");
  assert.equal(registeredRoll.character_name, "Edição preservada offline");

  await page.context().setOffline(true);
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "offline");
  await page.locator('[data-action="roll-skill"][data-mode="normal"]').first().click();
  await page.locator("#modalRoot .modal").getByRole("button", { name: "Fechar" }).last().click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("marufia-online-pending-rolls-v1") || "[]").length === 1);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("marufia-e2e-rolls") || "[]").length), 1);
  await page.context().setOffline(false);
  await page.waitForFunction(() => (
    JSON.parse(localStorage.getItem("marufia-e2e-rolls") || "[]").length === 2
    && JSON.parse(localStorage.getItem("marufia-online-pending-rolls-v1") || "[]").length === 0
  ));

  await page.evaluate(({ campaignId }) => {
    const playerId = "88888888-8888-4888-8888-888888888888";
    const memberships = JSON.parse(localStorage.getItem("marufia-e2e-campaign-memberships") || "[]");
    memberships.push({ campaign_id: campaignId, user_id: playerId, role: "player", joined_at: new Date().toISOString() });
    localStorage.setItem("marufia-e2e-campaign-memberships", JSON.stringify(memberships));

    const characters = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]");
    const state = JSON.parse(JSON.stringify(characters[0].state));
    state.character.name = "Kael";
    state.resources.hpCurrent = 21;
    state.resources.pmCurrent = 20;
    const now = new Date().toISOString();
    characters.push({
      id: "99999999-9999-4999-8999-999999999999",
      owner_id: playerId,
      campaign_id: campaignId,
      name: "Kael",
      state,
      schema_version: 5,
      revision: 1,
      last_change_origin: "player",
      created_at: now,
      updated_at: now,
    });
    localStorage.setItem("marufia-e2e-characters", JSON.stringify(characters));
    localStorage.setItem("marufia-e2e-campaign-presence", JSON.stringify([
      { campaign_id: campaignId, user_id: playerId, seen_at: now },
    ]));
  }, { campaignId: linkedRollTarget.campaignId });

  await page.reload();
  await page.waitForFunction(() => document.querySelector("#onlineAccountButton")?.dataset.authState === "online");
  await page.waitForFunction(() => document.querySelector("#onlineSyncStatus")?.dataset.syncState === "online");
  await page.waitForFunction(() => document.querySelector("#onlineAccountButton")?.dataset.realtimeState === "subscribed");
  assert.equal(await page.locator("#onlineAccountLabel").textContent(), "Jogador Teste", "A sessão não foi recuperada após recarregar.");
  assert.equal(await page.locator("[data-online-character-import-modal]").count(), 0, "A mesma ficha não deve ser importada ou oferecida novamente.");
  await homeButton.waitFor({ state: "visible" });
  await homeButton.click();
  const restoredHome = page.locator('[data-online-home-modal][data-online-home-view="home"]');
  await restoredHome.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelectorAll("[data-online-home-action='gm']").length === 1);
  assert.match(await restoredHome.innerText(), /1 ficha · 2 campanhas/i);
  assert.equal(await restoredHome.getByRole("button", { name: /Painel do Mæstre · A Coroa Partida/i }).count(), 1);
  assert.doesNotMatch(await restoredHome.innerText(), /Painel do Mæstre · Campanha Convidada/i);
  await restoredHome.getByRole("button", { name: /Painel do Mæstre · A Coroa Partida/i }).click();
  const homeGmPanel = page.locator("[data-online-gm-panel]");
  await homeGmPanel.waitFor({ state: "visible" });
  assert.match(await homeGmPanel.innerText(), /A Coroa Partida/);
  await page.locator("#modalRoot").getByRole("button", { name: "Fechar" }).last().click();
  await campaignsButton.waitFor({ state: "visible" });
  await campaignsButton.click();
  await ownedCampaign.waitFor({ state: "visible" });
  assert.match(await ownedCampaign.innerText(), /2 participantes/);
  assert.match(await ownedCampaign.innerText(), /Você: Mæstre/);
  await invitedCampaign.waitFor({ state: "visible" });
  assert.match(await invitedCampaign.innerText(), /Você: Jogador/);
  assert.equal(await invitedCampaign.locator('[data-online-gm-panel-action="open"]').count(), 0, "Jogadores não recebem o painel do Mæstre.");
  assert.equal(await ownedCampaign.locator('[data-online-gm-panel-action="open"]').count(), 1);
  await ownedCampaign.getByRole("button", { name: "Painel do Mæstre" }).click();
  const gmPanel = page.locator("[data-online-gm-panel]");
  await gmPanel.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("[data-online-gm-panel]")?.dataset.connection === "live");
  assert.match(await gmPanel.innerText(), /A Coroa Partida/);
  assert.match(await gmPanel.innerText(), /Online: 1/);
  assert.match(await gmPanel.innerText(), /Ausentes: 0 · Offline: 0/);
  const sessionName = "A Coroa — Sessão E2E";
  await gmPanel.locator("[data-online-gm-session-name]").fill(sessionName);
  await gmPanel.getByRole("button", { name: "Iniciar sessão" }).click();
  await page.waitForFunction((expectedName) => {
    const panel = document.querySelector("[data-online-gm-panel]");
    return panel?.querySelector('[data-campaign-session-status="active"]')
      && panel.innerText.includes(expectedName);
  }, sessionName);
  await page.waitForTimeout(250);
  const ownCard = gmPanel.locator(".gm-character-card").filter({ hasText: "Edição preservada offline" });
  await ownCard.locator("[data-online-gm-hp-input]").fill("29");
  await ownCard.getByRole("button", { name: "Alterar PV" }).click();
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    return local?.resources?.hpCurrent === 29
      && remote?.state?.resources?.hpCurrent === 29
      && remote?.last_change_origin === "gm";
  });
  assert.equal(await page.locator("[data-online-character-conflict-modal]").count(), 0, "PV do Mæstre deve entrar ao vivo quando a cópia local está intacta.");
  await page.waitForFunction(() => document.querySelector("[data-online-gm-panel]")?.innerText.includes("PV máximo → 29"));
  assert.match(await gmPanel.innerText(), /Histórico da campanha/);
  await page.waitForTimeout(250);
  await ownCard.locator("[data-online-gm-pm-input]").fill("13");
  await ownCard.getByRole("button", { name: "Alterar PM" }).click();
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    return local?.resources?.pmCurrent === 13 && remote?.state?.resources?.pmCurrent === 13;
  });
  await page.waitForTimeout(250);
  await ownCard.locator(".gm-character-management > summary").click();
  await ownCard.locator("[data-online-gm-condition-name]").fill("Marcado pelo Mæstre");
  await ownCard.locator("[data-online-gm-condition-ca]").fill("-2");
  await ownCard.locator("[data-online-gm-condition-block]").fill("1");
  await ownCard.getByRole("button", { name: "Adicionar condição" }).click();
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    return local?.effects?.some((effect) => effect.name === "Marcado pelo Mæstre")
      && remote?.state?.effects?.some((effect) => effect.name === "Marcado pelo Mæstre");
  });
  await page.waitForTimeout(250);
  await ownCard.locator(".gm-character-management > summary").click();
  await ownCard.getByRole("button", { name: "Remover condição Marcado pelo Mæstre" }).click();
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    return !local?.effects?.some((effect) => effect.name === "Marcado pelo Mæstre")
      && !remote?.state?.effects?.some((effect) => effect.name === "Marcado pelo Mæstre");
  });
  await page.waitForTimeout(250);
  await ownCard.locator(".gm-character-management > summary").click();
  await ownCard.locator("[data-online-gm-item-name]").fill("Tocha do Mæstre");
  await ownCard.locator("[data-online-gm-item-quantity]").fill("2");
  await ownCard.locator("[data-online-gm-item-weight]").fill("1");
  await ownCard.locator("[data-online-gm-item-description]").fill("Item temporário da sessão.");
  await ownCard.getByRole("button", { name: "Adicionar item" }).click();
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    return local?.inventory?.equipment?.some((item) => item.name === "Tocha do Mæstre" && item.qty === 2)
      && remote?.state?.inventory?.equipment?.some((item) => item.name === "Tocha do Mæstre" && item.qty === 2);
  });
  await page.waitForTimeout(250);
  await ownCard.locator(".gm-character-management > summary").click();
  await ownCard.getByRole("button", { name: "Remover item Tocha do Mæstre" }).click();
  await page.waitForFunction(() => {
    const local = JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null");
    const remote = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    return !local?.inventory?.equipment?.some((item) => item.name === "Tocha do Mæstre")
      && !remote?.state?.inventory?.equipment?.some((item) => item.name === "Tocha do Mæstre");
  });
  assert.equal(await page.locator("[data-online-character-conflict-modal]").count(), 0, "As ações granulares do Mæstre devem chegar ao jogador sem conflito quando a cópia local está intacta.");
  await page.waitForFunction((expectedName) => {
    const sessions = JSON.parse(localStorage.getItem("marufia-e2e-campaign-sessions") || "[]");
    const events = JSON.parse(localStorage.getItem("marufia-e2e-campaign-events") || "[]");
    const active = sessions.find((session) => session.name === expectedName && session.status === "active");
    const sessionTypes = new Set(events.filter((event) => event.session_id === active?.id).map((event) => event.event_type));
    return Boolean(active && ["hp_changed", "pm_changed", "conditions_changed", "item_changed"].every((type) => sessionTypes.has(type)));
  }, sessionName);
  assert.match(await gmPanel.innerText(), new RegExp(sessionName));
  assert.equal(await gmPanel.locator("[data-campaign-session-id]").count() >= 4, true, "As ações do Mæstre devem exibir a sessão vinculada.");
  await gmPanel.getByRole("button", { name: "Encerrar sessão" }).click();
  await page.waitForFunction((expectedName) => {
    const panel = document.querySelector("[data-online-gm-panel]");
    const sessions = JSON.parse(localStorage.getItem("marufia-e2e-campaign-sessions") || "[]");
    return panel?.querySelector('[data-campaign-session-status="idle"]')
      && sessions.some((session) => session.name === expectedName && session.status === "ended" && session.ended_at);
  }, sessionName);
  await page.waitForTimeout(250);
  assert.match(await gmPanel.innerText(), /Sessões anteriores \(1\)/);
  const kaelCard = gmPanel.locator(".gm-character-card").filter({ hasText: "Kael" });
  await kaelCard.waitFor({ state: "visible" });
  assert.equal(await kaelCard.locator("[data-online-gm-hp-input]").inputValue(), "21");
  assert.equal(await kaelCard.locator("[data-online-gm-hp-input]").getAttribute("max"), "33");
  assert.equal(await kaelCard.locator("[data-online-gm-pm-input]").inputValue(), "20");
  assert.equal(await kaelCard.locator("[data-online-gm-pm-input]").getAttribute("max"), "26");
  assert.match(await kaelCard.innerText(), /Online/);
  await kaelCard.getByRole("button", { name: "Abrir ficha" }).click();
  const gmViewer = page.locator("[data-online-gm-character-view]");
  await gmViewer.waitFor({ state: "visible" });
  assert.match(await page.locator("#modalRoot .modal header").innerText(), /VISUALIZAÇÃO DO MÆSTRE/);
  const viewedSheet = page.frameLocator(".gm-character-view-frame");
  await viewedSheet.locator("body.gm-view-ready").waitFor({ state: "attached" });
  assert.match(await viewedSheet.locator(".gm-view-badge").innerText(), /VISUALIZAÇÃO DO MÆSTRE/);
  assert.equal(await viewedSheet.locator('[data-path="character.name"]').inputValue(), "Kael");
  assert.equal(await viewedSheet.locator('[data-path="character.name"]').isDisabled(), true, "A ficha vista pelo Mæstre deve permanecer somente leitura.");
  assert.equal(await viewedSheet.getByRole("tab").count(), 7);
  await viewedSheet.getByRole("tab", { name: /^Inventário/ }).click();
  assert.ok((await viewedSheet.locator("#app").innerText()).trim(), "As abas da ficha visualizada devem reutilizar o conteúdo completo.");
  assert.equal(await viewedSheet.locator("html").evaluate((node) => node.scrollWidth <= node.clientWidth + 1), true, "A visualização do Mæstre não deve criar estouro horizontal.");
  await page.locator("#modalRoot").getByRole("button", { name: "Fechar visualização" }).click();

  await campaignsButton.click();
  await ownedCampaign.waitFor({ state: "visible" });
  await invitedCampaign.waitFor({ state: "visible" });
  assert.equal(
    await invitedCampaign.locator('[data-online-live-rolls-action="open"]').count(),
    1,
    "Todo participante deve poder abrir as rolagens autorizadas da campanha.",
  );
  await ownedCampaign.getByRole("button", { name: "Rolagens da campanha" }).click();
  const liveRollsPanel = page.locator("[data-online-live-rolls-panel]");
  await liveRollsPanel.waitFor({ state: "visible" });
  await page.waitForFunction(() => document.querySelector("[data-online-live-rolls-panel]")?.dataset.connection === "live");
  assert.match(await liveRollsPanel.innerText(), /Edição preservada offline/);
  assert.match(await liveRollsPanel.innerText(), /Perícia/);
  assert.match(await liveRollsPanel.innerText(), /1d100/);
  assert.match(await liveRollsPanel.innerText(), /Crítico natural/);
  assert.match(await liveRollsPanel.innerText(), /Privada do Mæstre/);
  assert.ok(await liveRollsPanel.locator("time").count() >= 1, "A rolagem deve mostrar seu horário.");

  await page.evaluate(() => {
    const roll = window.LATIO_ROLLS.rollD100("normal", () => 0.49);
    window.publishRollResult("skill", roll, {
      skillName: "Percepção",
      target: 60,
      outcome: window.d100Outcome(roll.result, 60),
    });
  });
  const realtimeRoll = liveRollsPanel.locator(".live-roll-card").filter({ hasText: "Percepção" });
  await realtimeRoll.waitFor({ state: "visible" });
  assert.match(await realtimeRoll.innerText(), /1d100/);
  assert.match(await realtimeRoll.innerText(), /50/);
  assert.match(await realtimeRoll.innerText(), /Normal/);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("marufia-e2e-rolls") || "[]").length === 3);
  await page.locator("#modalRoot").getByRole("button", { name: "Fechar" }).last().click();

  const playerVisibility = await page.evaluate(async () => {
    const character = JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0];
    const campaign = JSON.parse(localStorage.getItem("marufia-e2e-campaigns") || "[]")
      .find((item) => item.name === "Campanha Convidada");
    const characterService = window.MARUFIA_CHARACTERS.createCharacterService(
      window.MARUFIA_SUPABASE.getSupabaseClient(),
      window.LATIO_STATE,
    );
    await characterService.associate(character.id, campaign.id);
    const rollService = window.MARUFIA_ONLINE_ROLLS.createRollService(
      window.MARUFIA_SUPABASE.getSupabaseClient(),
      window.crypto,
    );
    const base = {
      rollType: "skill",
      mode: "normal",
      formula: "1d100",
      rawRoll: [42],
      modifier: 0,
      target: 60,
      total: 42,
      outcome: "Normal",
    };
    const secret = await rollService.record(character.id, { ...base, skillName: "Sigilo" }, crypto.randomUUID(), "secret");
    const publicRoll = await rollService.record(character.id, { ...base, skillName: "Vontade" }, crypto.randomUUID(), "public");
    return { campaignId: campaign.id, secret: secret.visibility, public: publicRoll.visibility };
  });
  assert.match(playerVisibility.campaignId, /^[0-9a-f-]{36}$/i);
  assert.deepEqual(playerVisibility, { campaignId: playerVisibility.campaignId, secret: "secret", public: "public" });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("marufia-e2e-rolls") || "[]").length === 5);
  const associationConflict = page.locator("[data-online-character-conflict-modal]");
  if (await associationConflict.isVisible()) {
    await page.getByRole("button", { name: "Decidir depois" }).click();
  }
  await campaignsButton.click();
  await invitedCampaign.waitFor({ state: "visible" });
  await invitedCampaign.getByRole("button", { name: "Rolagens da campanha" }).click();
  await page.waitForFunction(() => document.querySelector("[data-online-live-rolls-panel]")?.dataset.connection === "live");
  const playerPanel = page.locator("[data-online-live-rolls-panel]");
  const secretRoll = playerPanel.locator(".live-roll-card").filter({ hasText: "Sigilo" });
  const publicRoll = playerPanel.locator(".live-roll-card").filter({ hasText: "Vontade" });
  await secretRoll.waitFor({ state: "visible" });
  await publicRoll.waitFor({ state: "visible" });
  assert.match(await secretRoll.innerText(), /Secreta/);
  assert.match(await publicRoll.innerText(), /Pública/);
  assert.doesNotMatch(await playerPanel.innerText(), /Privada do Mæstre/, "Jogadores não podem ver rolagens privadas de outra campanha.");
  await page.locator("#modalRoot").getByRole("button", { name: "Fechar" }).last().click();
  await accountButton.click();
  assert.match(await page.locator("[data-online-auth-modal]").innerText(), /Sessão ativa/);
  assert.match(await page.locator("[data-online-auth-modal]").innerText(), /jogador@example\.com/);
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await page.waitForFunction(() => document.querySelector("#onlineAccountButton")?.dataset.authState === "offline");
  await page.waitForFunction(() => document.querySelector("#onlineAccountButton")?.dataset.realtimeState === "closed");
  assert.equal(await page.locator("#onlineAccountLabel").textContent(), "Entrar", "O logout não limpou a sessão local.");
  assert.equal(await syncStatus.getAttribute("data-sync-state"), "offline");
  await name.fill("Alteração somente local");
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("marufia-latio-state-v1") || "null")?.character?.name === "Alteração somente local");
  await page.waitForTimeout(100);
  const afterLogout = await page.evaluate(() => JSON.parse(localStorage.getItem("marufia-e2e-characters") || "[]")[0]);
  assert.equal(afterLogout.state.character.name, "Edição preservada offline", "Sem sessão, a ficha remota não pode ser alterada.");

  const layout = await page.evaluate(() => {
    const tabsElement = document.querySelector("#tabs");
    const app = document.querySelector("#app");
    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.clientWidth,
      tabsClientWidth: tabsElement.clientWidth,
      tabsScrollWidth: tabsElement.scrollWidth,
      tabsTop: tabsElement.getBoundingClientRect().top,
      appTop: app.getBoundingClientRect().top,
    };
  });
  assert.ok(layout.bodyScrollWidth <= layout.documentWidth + 1, `A página excedeu a largura em ${viewport.width}px.`);
  if (viewport.width >= 1000) {
    assert.ok(layout.tabsTop < layout.appTop, "As abas devem permanecer acima da ficha no desktop.");
    assert.ok(layout.tabsScrollWidth <= layout.tabsClientWidth + 1, "As abas não devem transbordar no desktop.");
  } else {
    assert.ok(layout.tabsScrollWidth > layout.tabsClientWidth, "As abas devem ser roláveis no celular.");
  }
  if (errors.length) throw new Error(`Erros novos no navegador: ${errors.join(" | ")}`);
}

(async () => {
  const web = server();
  await new Promise((resolve) => web.listen(0, "127.0.0.1", resolve));
  const port = web.address().port;
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      await exercise(await context.newPage(), `http://127.0.0.1:${port}/`, viewport);
      await context.close();
    }
    console.log("Smoke test desktop/mobile concluído.");
  } finally {
    await browser.close();
    web.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
