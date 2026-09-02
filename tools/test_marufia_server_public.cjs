"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

function required(name) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) throw new Error(`Variável temporária ausente: ${name}.`);
  return value;
}

const config = Object.freeze({
  url: required("MARUFIA_ACCEPTANCE_URL"),
  key: required("MARUFIA_ACCEPTANCE_PUBLIC_KEY"),
  password: required("MARUFIA_ACCEPTANCE_PASSWORD"),
  runId: required("MARUFIA_ACCEPTANCE_RUN_ID"),
  gmEmail: required("MARUFIA_ACCEPTANCE_GM_EMAIL"),
  playerEmails: JSON.parse(required("MARUFIA_ACCEPTANCE_PLAYER_EMAILS")),
  outsiderEmail: required("MARUFIA_ACCEPTANCE_OUTSIDER_EMAIL"),
  statePath: required("MARUFIA_ACCEPTANCE_STATE_PATH"),
  mode: required("MARUFIA_ACCEPTANCE_MODE"),
});

assert.equal(new URL(config.url).protocol, "https:", "O ensaio público exige HTTPS.");
assert.ok(Array.isArray(config.playerEmails) && config.playerEmails.length >= 2);
assert.ok(path.basename(config.statePath).startsWith("marufia-phase13-"));

function client() {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { timeout: 20_000, heartbeatIntervalMs: 5_000 },
  });
}

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code || "erro"}.`);
  return result.data;
}

async function signIn(target, email) {
  const data = requireResult(await target.auth.signInWithPassword({
    email,
    password: config.password,
  }), "Login público");
  assert.ok(data.user?.id && data.session?.access_token, "Login sem sessão válida.");
  await target.realtime.setAuth(data.session.access_token);
  return data;
}

async function subscribe(channel, label) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} não conectou.`)), 20_000);
    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
        clearTimeout(timer);
        reject(error || new Error(`${label}: ${status}.`));
      }
    });
  });
}

async function waitUntil(predicate, label, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  throw new Error(`${label} não chegou dentro do prazo.`);
}

function state(name, hpCurrent) {
  return {
    meta: { appId: "marufia-latio", schemaVersion: 5 },
    character: { name },
    resources: { hpCurrent, hpMaximum: 40, pmCurrent: 15, pmMaximum: 20 },
    effects: [],
    inventory: { weapons: [], equipment: [], selectedWeaponId: "" },
  };
}

function rollArgs(characterId, index, suffix) {
  return {
    p_roll_id: crypto.randomUUID(),
    p_character_id: characterId,
    p_roll_type: "skill",
    p_skill_name: `Atletismo ${suffix}`,
    p_mode: "normal",
    p_formula: "1d100",
    p_raw_roll: [20 + index],
    p_modifier: 0,
    p_target: 50,
    p_total: 20 + index,
    p_outcome: "Normal",
    p_visibility: "public",
  };
}

async function openClients() {
  const gm = client();
  const players = config.playerEmails.map(() => client());
  const outsider = client();
  await Promise.all([
    signIn(gm, config.gmEmail),
    ...players.map((target, index) => signIn(target, config.playerEmails[index])),
    signIn(outsider, config.outsiderEmail),
  ]);
  return { gm, players, outsider, all: [gm, ...players, outsider] };
}

async function closeClients(clients) {
  await Promise.allSettled(clients.map((target) => target.removeAllChannels()));
  for (const target of clients) target.realtime.disconnect();
}

async function runInitial() {
  const connections = await openClients();
  const { gm, players, outsider, all } = connections;
  try {
    const campaign = requireResult(await gm.from("campaigns")
      .insert({ name: `Aceitação ${config.runId}`, description: "Teste público descartável" })
      .select("id,join_code")
      .single(), "Criação da campanha");
    const outsiderCampaign = requireResult(await outsider.from("campaigns")
      .insert({ name: `Isolamento ${config.runId}`, description: "Teste descartável" })
      .select("id")
      .single(), "Criação da campanha isolada");

    await Promise.all(players.map(async (target) => requireResult(
      await target.rpc("join_campaign", { p_join_code: campaign.join_code }),
      "Entrada de jogador",
    )));

    const characters = [];
    for (let index = 0; index < players.length; index += 1) {
      const name = `Personagem Fase 13 ${index + 1}`;
      const created = requireResult(await players[index].from("characters")
        .insert({ state: state(name, 35 - index) })
        .select("id,revision")
        .single(), "Criação de personagem");
      const linked = requireResult(await players[index].from("characters")
        .update({ campaign_id: campaign.id })
        .eq("id", created.id)
        .select("id,revision,campaign_id")
        .single(), "Vínculo de personagem");
      assert.equal(linked.revision, 2);
      characters.push({ id: linked.id, name, revision: linked.revision, hp: 35 - index });
    }

    const received = { characters: [], rolls: [], presence: [], sessions: [], campaigns: [], player: [], outsider: [] };
    const gmChannel = gm.channel(`phase13-gm-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => received.characters.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "rolls", filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => received.rolls.push(payload))
      .on("postgres_changes", {
        event: "*", schema: "public", table: "campaign_presence", filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => received.presence.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "campaign_sessions", filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => received.sessions.push(payload))
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${campaign.id}`,
      }, (payload) => received.campaigns.push(payload));
    const playerChannel = players[0].channel(`phase13-player-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${characters[0].id}`,
      }, (payload) => received.player.push(payload));
    const outsiderChannel = outsider.channel(`phase13-outsider-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "rolls", filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "campaign_sessions", filter: `campaign_id=eq.${campaign.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${campaign.id}`,
      }, (payload) => received.outsider.push(payload));
    await Promise.all([
      subscribe(gmChannel, "Canal do Mestre"),
      subscribe(playerChannel, "Canal do Jogador"),
      subscribe(outsiderChannel, "Canal isolado"),
    ]);

    const initialBarrier = requireResult(await players[0].rpc("save_character_state", {
      p_character_id: characters[0].id,
      p_state: state(characters[0].name, characters[0].hp),
      p_expected_revision: characters[0].revision,
    }), "Barreira inicial de Realtime");
    characters[0].revision = initialBarrier.revision;
    await waitUntil(() => received.characters.some((event) => event.new?.revision === initialBarrier.revision)
      && received.player.some((event) => event.new?.revision === initialBarrier.revision), "Barreira inicial de Realtime");
    for (const events of Object.values(received)) events.length = 0;

    await Promise.all(players.map(async (target, index) => {
      const saved = requireResult(await target.rpc("save_character_state", {
        p_character_id: characters[index].id,
        p_state: state(characters[index].name, characters[index].hp - 1),
        p_expected_revision: characters[index].revision,
      }), "Alteração do Jogador");
      characters[index].revision = saved.revision;
      characters[index].hp -= 1;
      requireResult(await target.rpc("touch_campaign_presence", {
        p_campaign_id: campaign.id,
        p_active: true,
      }), "Presença do Jogador");
      requireResult(await target.rpc("record_roll", rollArgs(characters[index].id, index, "inicial")), "Rolagem do Jogador");
    }));

    try {
      await waitUntil(() => received.characters.length >= players.length
        && received.rolls.length >= players.length
        && received.presence.length >= players.length, "Eventos públicos iniciais");
    } catch (error) {
      throw new Error(`${error.message} Contagens: ${JSON.stringify({
        characters: received.characters.length,
        rolls: received.rolls.length,
        presence: received.presence.length,
        player: received.player.length,
        outsider: received.outsider.length,
      })}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
    assert.equal(received.characters.length, players.length, "Alteração duplicada no Mestre.");
    assert.equal(received.rolls.length, players.length, "Rolagem duplicada no Mestre.");
    assert.equal(received.presence.length, players.length, "Presença duplicada no Mestre.");
    assert.equal(received.outsider.length, 0, "Conta externa recebeu evento privado.");

    const playerEventCount = received.player.length;
    const gmChanged = requireResult(await gm.rpc("gm_set_character_hp", {
      p_character_id: characters[0].id,
      p_hp_current: 12,
      p_expected_revision: characters[0].revision,
    }), "Alteração do Mestre");
    characters[0].revision = gmChanged.revision;
    characters[0].hp = 12;
    await waitUntil(() => received.player.length === playerEventCount + 1, "Alteração do Mestre para o Jogador");
    assert.equal(received.player.at(-1).new.last_change_origin, "gm");

    const session = requireResult(await gm.rpc("start_campaign_session", {
      p_campaign_id: campaign.id,
      p_name: "Sessão de aceitação",
    }), "Início da sessão");
    requireResult(await gm.rpc("update_campaign", {
      p_campaign_id: campaign.id,
      p_name: `Aceitação pública ${config.runId}`,
      p_description: "Teste público descartável",
    }), "Atualização da campanha");
    await waitUntil(() => received.sessions.length === 1 && received.campaigns.length === 1, "Eventos da campanha");
    assert.equal(received.outsider.length, 0, "Conta externa recebeu evento de campanha.");
    const visibleCharacters = requireResult(await gm.from("characters")
      .select("id,revision")
      .eq("campaign_id", campaign.id), "Abertura de fichas pelo Mestre");
    assert.equal(visibleCharacters.length, players.length);
    const leaked = requireResult(await outsider.from("characters")
      .select("id")
      .eq("campaign_id", campaign.id), "Teste de isolamento");
    assert.equal(leaked.length, 0);

    fs.writeFileSync(config.statePath, JSON.stringify({
      campaignId: campaign.id,
      outsiderCampaignId: outsiderCampaign.id,
      sessionId: session.id,
      characters,
    }), { encoding: "utf8", mode: 0o600 });
    console.log(`PUBLIC_INITIAL=PASS clients=${all.length} players=${players.length}`);
  } finally {
    await closeClients(all);
  }
}

async function runResume() {
  const savedState = JSON.parse(fs.readFileSync(config.statePath, "utf8"));
  const connections = await openClients();
  const { gm, players, outsider, all } = connections;
  const extraClients = [];
  try {
    const campaign = requireResult(await gm.from("campaigns")
      .select("id,name")
      .eq("id", savedState.campaignId)
      .single(), "Campanha após retorno");
    assert.equal(campaign.id, savedState.campaignId);
    const memberships = requireResult(await gm.from("campaign_members")
      .select("user_id,role")
      .eq("campaign_id", savedState.campaignId), "Participantes após retorno");
    assert.equal(memberships.length, players.length + 1);

    for (let index = 0; index < players.length; index += 1) {
      const row = requireResult(await players[index].from("characters")
        .select("id,revision,state,campaign_id")
        .eq("id", savedState.characters[index].id)
        .single(), "Ficha após retorno");
      assert.equal(row.campaign_id, savedState.campaignId);
      assert.equal(row.revision, savedState.characters[index].revision);
      assert.equal(row.state.resources.hpCurrent, savedState.characters[index].hp);
    }
    const activeSession = requireResult(await gm.from("campaign_sessions")
      .select("id,status")
      .eq("id", savedState.sessionId)
      .single(), "Sessão após retorno");
    assert.equal(activeSession.status, "active");

    const received = { characters: [], rolls: [], outsider: [] };
    const gmChannel = gm.channel(`phase13-resume-gm-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `campaign_id=eq.${savedState.campaignId}`,
      }, (payload) => received.characters.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "rolls", filter: `campaign_id=eq.${savedState.campaignId}`,
      }, (payload) => received.rolls.push(payload));
    const outsiderChannel = outsider.channel(`phase13-resume-outsider-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `campaign_id=eq.${savedState.campaignId}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "rolls", filter: `campaign_id=eq.${savedState.campaignId}`,
      }, (payload) => received.outsider.push(payload));
    await Promise.all([
      subscribe(gmChannel, "Canal do Mestre após retorno"),
      subscribe(outsiderChannel, "Canal isolado após retorno"),
    ]);

    const resumeBarrier = requireResult(await players[0].rpc("save_character_state", {
      p_character_id: savedState.characters[0].id,
      p_state: state(savedState.characters[0].name, savedState.characters[0].hp),
      p_expected_revision: savedState.characters[0].revision,
    }), "Barreira de Realtime após retorno");
    savedState.characters[0].revision = resumeBarrier.revision;
    await waitUntil(() => received.characters.some((event) => event.new?.revision === resumeBarrier.revision), "Barreira após retorno");
    for (const events of Object.values(received)) events.length = 0;

    await Promise.all(players.map(async (target, index) => {
      const character = savedState.characters[index];
      const updated = requireResult(await target.rpc("save_character_state", {
        p_character_id: character.id,
        p_state: state(character.name, character.hp - 1),
        p_expected_revision: character.revision,
      }), "Sincronização após retorno");
      character.revision = updated.revision;
      character.hp -= 1;
      requireResult(await target.rpc("touch_campaign_presence", {
        p_campaign_id: savedState.campaignId,
        p_active: true,
      }), "Presença após retorno");
      requireResult(await target.rpc("record_roll", rollArgs(character.id, index, "retorno")), "Rolagem após retorno");
    }));
    try {
      await waitUntil(() => received.characters.length >= players.length
        && received.rolls.length >= players.length, "Eventos após retorno");
    } catch (error) {
      throw new Error(`${error.message} Contagens: ${JSON.stringify({
        characters: received.characters.length,
        rolls: received.rolls.length,
        outsider: received.outsider.length,
      })}.`);
    }

    const rival = client();
    extraClients.push(rival);
    await signIn(rival, config.playerEmails[0]);
    const contested = savedState.characters[0];
    const attempts = await Promise.all([
      players[0].rpc("save_character_state", {
        p_character_id: contested.id,
        p_state: state(contested.name, 9),
        p_expected_revision: contested.revision,
      }),
      rival.rpc("save_character_state", {
        p_character_id: contested.id,
        p_state: state(contested.name, 8),
        p_expected_revision: contested.revision,
      }),
    ]);
    assert.equal(attempts.filter((result) => !result.error).length, 1, "Conflito não preservou uma única versão.");
    assert.equal(attempts.filter((result) => result.error).length, 1, "Escrita concorrente não foi recusada.");
    await waitUntil(() => received.characters.length >= players.length + 1, "Evento do conflito controlado");
    await new Promise((resolve) => setTimeout(resolve, 750));
    assert.equal(received.characters.length, players.length + 1, "Evento de ficha duplicado após retorno.");
    assert.equal(received.rolls.length, players.length, "Rolagem duplicada após retorno.");
    assert.equal(received.outsider.length, 0, "Conta externa recebeu evento após retorno.");

    const finalCharacter = requireResult(await players[0].from("characters")
      .select("revision,state")
      .eq("id", contested.id)
      .single(), "Ficha após conflito");
    assert.equal(finalCharacter.revision, contested.revision + 1);
    assert.ok([8, 9].includes(finalCharacter.state.resources.hpCurrent));

    const ended = requireResult(await gm.rpc("end_campaign_session", {
      p_session_id: savedState.sessionId,
    }), "Encerramento da sessão");
    assert.equal(ended.status, "ended");
    const outsiderCampaign = requireResult(await outsider.from("campaigns")
      .select("id")
      .eq("id", savedState.campaignId), "Isolamento de campanha");
    assert.equal(outsiderCampaign.length, 0);
    console.log(`PUBLIC_RESUME=PASS clients=${all.length + extraClients.length} players=${players.length}`);
  } finally {
    await closeClients([...all, ...extraClients]);
  }
}

async function runRecoveryProbe() {
  const gm = client();
  const player = client();
  try {
    const savedState = JSON.parse(fs.readFileSync(config.statePath, "utf8"));
    await Promise.all([
      signIn(gm, config.gmEmail),
      signIn(player, config.playerEmails[0]),
    ]);
    const received = [];
    const channel = gm.channel(`phase13-recovery-${config.runId}-${crypto.randomUUID()}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "campaign_presence", filter: `campaign_id=eq.${savedState.campaignId}`,
      }, (payload) => received.push(payload));
    await subscribe(channel, "Canal de recuperação");
    requireResult(await player.rpc("touch_campaign_presence", {
      p_campaign_id: savedState.campaignId,
      p_active: true,
    }), "Barreira de recuperação");
    await waitUntil(() => received.length > 0, "Recuperação efetiva do Realtime", 15_000);
    await new Promise((resolve) => setTimeout(resolve, 500));
    assert.equal(received.length, 1, "A recuperação produziu presença duplicada.");
    console.log("PUBLIC_REALTIME_RECOVERY=PASS");
  } finally {
    await closeClients([gm, player]);
  }
}

const runner = config.mode === "Initial" ? runInitial
  : config.mode === "Resume" ? runResume
    : config.mode === "Recovery" ? runRecoveryProbe
    : null;
if (!runner) throw new Error("Modo de aceitação inválido.");
runner().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
