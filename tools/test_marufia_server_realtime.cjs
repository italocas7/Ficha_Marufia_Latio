"use strict";

const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");

function requiredEnvironment(name) {
  const value = String(process.env[name] ?? "").trim();
  if (!value) throw new Error(`Variável temporária ausente: ${name}.`);
  return value;
}

const config = Object.freeze({
  url: requiredEnvironment("MARUFIA_REALTIME_URL"),
  key: requiredEnvironment("MARUFIA_REALTIME_PUBLIC_KEY"),
  password: requiredEnvironment("MARUFIA_REALTIME_TEST_PASSWORD"),
  runId: requiredEnvironment("MARUFIA_REALTIME_RUN_ID"),
  gmEmail: requiredEnvironment("MARUFIA_REALTIME_GM_EMAIL"),
  playerEmail: requiredEnvironment("MARUFIA_REALTIME_PLAYER_EMAIL"),
  outsiderEmail: requiredEnvironment("MARUFIA_REALTIME_OUTSIDER_EMAIL"),
});

function client() {
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { timeout: 10_000, heartbeatIntervalMs: 5_000 },
  });
}

function requireResult(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code || "erro"}.`);
  return result.data;
}

async function signUp(target, email, displayName) {
  const data = requireResult(await target.auth.signUp({
    email,
    password: config.password,
    options: { data: { display_name: displayName } },
  }), `Cadastro ${displayName}`);
  assert.ok(data.user?.id, `${displayName} não recebeu usuário.`);
  assert.ok(data.session?.access_token, `${displayName} não recebeu sessão.`);
  await target.realtime.setAuth(data.session.access_token);
  return data;
}

async function subscribe(channel, label, timeoutMs = 10_000) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} não confirmou SUBSCRIBED.`)), timeoutMs);
    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
        clearTimeout(timer);
        reject(error || new Error(`${label} respondeu ${status}.`));
      }
    });
  });
}

async function waitUntil(predicate, label, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`${label} não chegou pelo Realtime dentro do prazo.`);
}

function receivedCounts(received) {
  return Object.fromEntries(Object.entries(received).map(([name, events]) => [name, {
    count: events.length,
    revisions: events.map((event) => event.new?.revision).filter(Number.isFinite),
  }]));
}

function characterState(name, hpCurrent) {
  return {
    meta: { appId: "marufia-latio", schemaVersion: 5 },
    character: { name },
    resources: { hpCurrent, pmCurrent: 10 },
    effects: [],
    inventory: { weapons: [], equipment: [] },
  };
}

async function main() {
  const gm = client();
  const player = client();
  const outsider = client();
  const clients = [gm, player, outsider];
  try {
    await signUp(gm, config.gmEmail, "Mestre Realtime");
    await signUp(player, config.playerEmail, "Jogador Realtime");
    await signUp(outsider, config.outsiderEmail, "Externo Realtime");

    const campaignA = requireResult(await gm
      .from("campaigns")
      .insert({ name: "Campanha A Realtime", description: "Teste descartável" })
      .select("id,join_code")
      .single(), "Criação da campanha A");
    const campaignB = requireResult(await outsider
      .from("campaigns")
      .insert({ name: "Campanha B Realtime", description: "Isolamento descartável" })
      .select("id,join_code")
      .single(), "Criação da campanha B");
    requireResult(await player.rpc("join_campaign", { p_join_code: campaignA.join_code }), "Entrada do jogador");

    const initialPlayerState = characterState("Personagem A Realtime", 20);
    const initialOutsiderState = characterState("Personagem B Realtime", 18);
    const playerCharacter = requireResult(await player
      .from("characters")
      .insert({ state: initialPlayerState })
      .select("id,revision")
      .single(), "Criação do personagem A");
    const outsiderCharacter = requireResult(await outsider
      .from("characters")
      .insert({ state: initialOutsiderState })
      .select("id,revision")
      .single(), "Criação do personagem B");
    const linkedPlayer = requireResult(await player
      .from("characters")
      .update({ campaign_id: campaignA.id })
      .eq("id", playerCharacter.id)
      .select("id,revision,campaign_id")
      .single(), "Vínculo do personagem A");
    requireResult(await outsider
      .from("characters")
      .update({ campaign_id: campaignB.id })
      .eq("id", outsiderCharacter.id)
      .select("id,revision,campaign_id")
      .single(), "Vínculo do personagem B");
    assert.equal(linkedPlayer.revision, 2);

    const received = {
      gmCharacters: [],
      gmRolls: [],
      gmEvents: [],
      gmPresence: [],
      gmSessions: [],
      gmCampaigns: [],
      playerCharacters: [],
      outsider: [],
    };
    const gmChannel = gm.channel(`phase7-gm-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.gmCharacters.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "rolls", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.gmRolls.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "campaign_events", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.gmEvents.push(payload))
      .on("postgres_changes", {
        event: "*", schema: "public", table: "campaign_presence", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.gmPresence.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "campaign_sessions", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.gmSessions.push(payload))
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${campaignA.id}`,
      }, (payload) => received.gmCampaigns.push(payload));
    const playerChannel = player.channel(`phase7-player-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `id=eq.${playerCharacter.id}`,
      }, (payload) => received.playerCharacters.push(payload));
    const outsiderChannel = outsider.channel(`phase7-outsider-${config.runId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "characters", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "rolls", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "campaign_events", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "*", schema: "public", table: "campaign_presence", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "campaign_sessions", filter: `campaign_id=eq.${campaignA.id}`,
      }, (payload) => received.outsider.push(payload))
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${campaignA.id}`,
      }, (payload) => received.outsider.push(payload));
    await Promise.all([
      subscribe(gmChannel, "Canal do Mestre"),
      subscribe(playerChannel, "Canal do Jogador"),
      subscribe(outsiderChannel, "Canal externo"),
    ]);
    assert.deepEqual(clients.map((target) => target.getChannels().length), [1, 1, 1]);

    const barrierSave = requireResult(await player.rpc("save_character_state", {
      p_character_id: playerCharacter.id,
      p_state: initialPlayerState,
      p_expected_revision: 2,
    }), "Barreira inicial de Realtime");
    assert.equal(barrierSave.revision, 3);
    await waitUntil(
      () => received.gmCharacters.some((event) => event.new?.revision === 3)
        && received.playerCharacters.some((event) => event.new?.revision === 3),
      "Barreira inicial de Realtime",
    );
    assert.equal(received.outsider.length, 0, "O usuário externo recebeu evento durante a barreira.");
    for (const events of Object.values(received)) events.length = 0;

    const playerChangedState = characterState("Personagem A Realtime", 21);
    const playerSave = requireResult(await player.rpc("save_character_state", {
      p_character_id: playerCharacter.id,
      p_state: playerChangedState,
      p_expected_revision: 3,
    }), "Alteração do Jogador");
    assert.equal(playerSave.revision, 4);

    const gmSave = requireResult(await gm.rpc("gm_set_character_hp", {
      p_character_id: playerCharacter.id,
      p_hp_current: 7,
      p_expected_revision: 4,
    }), "Alteração do Mestre");
    assert.equal(gmSave.revision, 5);

    requireResult(await player.rpc("touch_campaign_presence", {
      p_campaign_id: campaignA.id,
      p_active: true,
    }), "Presença do Jogador");

    const rollId = crypto.randomUUID();
    requireResult(await player.rpc("record_roll", {
      p_roll_id: rollId,
      p_character_id: playerCharacter.id,
      p_roll_type: "skill",
      p_skill_name: "Atletismo",
      p_mode: "normal",
      p_formula: "1d100",
      p_raw_roll: [20],
      p_modifier: 0,
      p_target: 50,
      p_total: 20,
      p_outcome: "Normal",
      p_visibility: "secret",
    }), "Rolagem do Jogador");

    const session = requireResult(await gm.rpc("start_campaign_session", {
      p_campaign_id: campaignA.id,
      p_name: "Sessão Realtime",
    }), "Sessão da campanha");
    assert.equal(session.status, "active");

    requireResult(await gm.rpc("update_campaign", {
      p_campaign_id: campaignA.id,
      p_name: "Campanha A Realtime Atualizada",
      p_description: "Teste descartável",
    }), "Atualização da campanha");
    try {
      await waitUntil(
        () => received.gmCharacters.length === 2
          && received.playerCharacters.length === 2
          && received.gmRolls.length === 1
          && received.gmEvents.length === 3
          && received.gmPresence.length === 1
          && received.gmSessions.length === 1
          && received.gmCampaigns.length === 1,
        "Conjunto de eventos",
      );
    } catch (error) {
      throw new Error(`${error.message} Contagens: ${JSON.stringify(receivedCounts(received))}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, 750));

    assert.equal(received.gmCharacters.length, 2, "O Mestre recebeu personagem duplicado.");
    assert.equal(received.playerCharacters.length, 2, "O Jogador recebeu personagem duplicado.");
    assert.equal(received.gmRolls.length, 1, "O Mestre recebeu rolagem duplicada.");
    assert.equal(received.gmEvents.length, 3, "O Mestre recebeu histórico duplicado ou incompleto.");
    assert.equal(received.gmPresence.length, 1, "O Mestre recebeu presença duplicada.");
    assert.equal(received.gmSessions.length, 1, "O Mestre recebeu sessão duplicada.");
    assert.equal(received.gmCampaigns.length, 1, "O Mestre recebeu atualização de campanha duplicada.");
    assert.equal(received.outsider.length, 0, "O usuário externo recebeu evento da Campanha A.");
    assert.ok(received.gmCharacters.every((event) => event.new.id === playerCharacter.id));
    assert.ok(received.playerCharacters.every((event) => event.new.id === playerCharacter.id));
    assert.deepEqual(received.gmCharacters.map((event) => event.new.revision), [4, 5]);
    assert.deepEqual(received.playerCharacters.map((event) => event.new.revision), [4, 5]);
    assert.deepEqual(received.gmCharacters.map((event) => event.new.last_change_origin), ["player", "gm"]);
    assert.equal(received.gmRolls[0].new.id, rollId);
    assert.deepEqual(
      received.gmEvents.map((event) => event.new.event_type).sort(),
      ["hp_changed", "hp_changed", "roll"],
    );
    assert.equal(new Set(received.gmEvents.map((event) => event.new.id)).size, 3);
    assert.equal(received.gmPresence[0].new.campaign_id, campaignA.id);
    assert.equal(received.gmSessions[0].new.campaign_id, campaignA.id);
    assert.equal(received.gmCampaigns[0].new.id, campaignA.id);

    await Promise.all(clients.map((target) => target.removeAllChannels()));
    assert.deepEqual(clients.map((target) => target.getChannels().length), [0, 0, 0]);
    console.log("Realtime local aprovado: seis tabelas, filtros RLS, canais únicos e limpeza completa.");
  } finally {
    await Promise.allSettled(clients.map((target) => target.removeAllChannels()));
    for (const target of clients) target.realtime.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
