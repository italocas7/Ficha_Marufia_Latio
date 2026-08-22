const projectConfig = require("../src/online/project.js");
const configTools = require("../src/online/config.js");

const tables = [
  "profiles",
  "campaigns",
  "campaign_members",
  "characters",
  "rolls",
  "campaign_events",
  "campaign_presence",
  "campaign_sessions",
];

async function requireLockedTable(config, table) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/${table}?select=*&limit=1`,
    { headers: { apikey: config.publishableKey } },
  );
  const body = await response.text();
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(body).code || "");
  } catch {
    // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
  }

  if (![401, 403].includes(response.status) || errorCode !== "42501") {
    throw new Error(
      `${table}: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`,
    );
  }
}

async function requireAuthenticatedJoin(config) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/join_campaign`,
    {
      method: "POST",
      headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_join_code: "MRF-TEST-XX" }),
    },
  );
  const body = await response.text();
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(body).code || "");
  } catch {
    // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
  }

  if (![401, 403].includes(response.status) || errorCode !== "42501") {
    throw new Error(
      `join_campaign: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`,
    );
  }
}

async function requireAnonymousCharacterUpdateBlocked(config) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/characters?id=eq.00000000-0000-4000-8000-000000000000`,
    {
      method: "PATCH",
      headers: {
        apikey: config.publishableKey,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        state: {
          meta: { appId: "marufia-latio", schemaVersion: 5 },
          character: { name: "Teste anônimo bloqueado" },
        },
      }),
    },
  );
  const body = await response.text();
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(body).code || "");
  } catch {
    // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
  }

  if (![401, 403].includes(response.status) || errorCode !== "42501") {
    throw new Error(
      `characters update: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`,
    );
  }
}

async function requireAnonymousConflictSaveBlocked(config) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/save_character_state`,
    {
      method: "POST",
      headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_character_id: "00000000-0000-4000-8000-000000000000",
        p_state: {
          meta: { appId: "marufia-latio", schemaVersion: 5 },
          character: { name: "Teste anônimo bloqueado" },
        },
        p_expected_revision: 1,
      }),
    },
  );
  const body = await response.text();
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(body).code || "");
  } catch {
    // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
  }

  if (![401, 403].includes(response.status) || errorCode !== "42501") {
    throw new Error(
      `save_character_state: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`,
    );
  }
}

async function requireAnonymousRollBlocked(config) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/record_roll`,
    {
      method: "POST",
      headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_roll_id: "00000000-0000-4000-8000-000000000001",
        p_character_id: "00000000-0000-4000-8000-000000000000",
        p_roll_type: "skill",
        p_skill_name: "Atletismo",
        p_mode: "normal",
        p_formula: "1d100",
        p_raw_roll: [1],
        p_modifier: 0,
        p_target: 50,
        p_total: 1,
        p_outcome: "Crítico natural",
        p_visibility: "public",
      }),
    },
  );
  const body = await response.text();
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(body).code || "");
  } catch {
    // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
  }

  if (![401, 403].includes(response.status) || errorCode !== "42501") {
    throw new Error(
      `record_roll: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`,
    );
  }
}

async function requireAnonymousPresenceBlocked(config) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/touch_campaign_presence`,
    {
      method: "POST",
      headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({ p_campaign_id: "00000000-0000-4000-8000-000000000000" }),
    },
  );
  const body = await response.text();
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(body).code || "");
  } catch {
    // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
  }

  if (![401, 403].includes(response.status) || errorCode !== "42501") {
    throw new Error(
      `touch_campaign_presence: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`,
    );
  }
}

async function requireAnonymousGmHpBlocked(config) {
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/rpc/gm_set_character_hp`,
    {
      method: "POST",
      headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        p_character_id: "00000000-0000-4000-8000-000000000000",
        p_hp_current: 29,
        p_expected_revision: 1,
      }),
    },
  );
  const body = await response.text();
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(body).code || "");
  } catch {
    // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
  }
  if (![401, 403].includes(response.status) || errorCode !== "42501") {
    throw new Error(
      `gm_set_character_hp: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`,
    );
  }
}

async function requireAnonymousGmActionsBlocked(config) {
  const characterId = "00000000-0000-4000-8000-000000000000";
  const operations = [
    { name: "gm_set_character_pm", body: { p_character_id: characterId, p_pm_current: 10, p_expected_revision: 1 } },
    { name: "gm_add_character_condition", body: { p_character_id: characterId, p_condition_name: "Teste", p_ca: 0, p_block: 0, p_expected_revision: 1 } },
    { name: "gm_remove_character_condition", body: { p_character_id: characterId, p_condition_id: "teste", p_expected_revision: 1 } },
    { name: "gm_add_character_item", body: { p_character_id: characterId, p_item_kind: "equipment", p_name: "Teste", p_category: "Equipamento", p_quantity: 1, p_weight: "", p_damage: "", p_property: "", p_description: "", p_expected_revision: 1 } },
    { name: "gm_remove_character_item", body: { p_character_id: characterId, p_item_kind: "equipment", p_item_id: "teste", p_expected_revision: 1 } },
  ];
  await Promise.all(operations.map(async (operation) => {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/rpc/${operation.name}`,
      {
        method: "POST",
        headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify(operation.body),
      },
    );
    const body = await response.text();
    let errorCode = "";
    try {
      errorCode = String(JSON.parse(body).code || "");
    } catch {
      // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
    }
    if (![401, 403].includes(response.status) || errorCode !== "42501") {
      throw new Error(`${operation.name}: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`);
    }
  }));
}

async function requireAnonymousSessionLifecycleBlocked(config) {
  const requests = [
    {
      operation: "start_campaign_session",
      body: { p_campaign_id: "00000000-0000-4000-8000-000000000000", p_name: "Sessão anônima bloqueada" },
    },
    {
      operation: "end_campaign_session",
      body: { p_session_id: "00000000-0000-4000-8000-000000000000" },
    },
  ];
  await Promise.all(requests.map(async ({ operation, body: requestBody }) => {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/rpc/${operation}`,
      {
        method: "POST",
        headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );
    const body = await response.text();
    let errorCode = "";
    try {
      errorCode = String(JSON.parse(body).code || "");
    } catch {
      // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
    }
    if (![401, 403].includes(response.status) || errorCode !== "42501") {
      throw new Error(`${operation}: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`);
    }
  }));
}

async function requireAnonymousCampaignManagementBlocked(config) {
  const requests = [
    {
      operation: "update_campaign",
      body: {
        p_campaign_id: "00000000-0000-4000-8000-000000000000",
        p_name: "Alteração anônima bloqueada",
        p_description: "",
      },
    },
    {
      operation: "delete_campaign",
      body: {
        p_campaign_id: "00000000-0000-4000-8000-000000000000",
        p_confirmation_name: "Exclusão anônima bloqueada",
      },
    },
  ];
  await Promise.all(requests.map(async ({ operation, body: requestBody }) => {
    const response = await fetch(
      `${config.supabaseUrl}/rest/v1/rpc/${operation}`,
      {
        method: "POST",
        headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );
    const body = await response.text();
    let errorCode = "";
    try {
      errorCode = String(JSON.parse(body).code || "");
    } catch {
      // O erro sanitizado abaixo não inclui credenciais nem conteúdo do banco.
    }
    if (![401, 403].includes(response.status) || errorCode !== "42501") {
      throw new Error(`${operation}: proteção inesperada (HTTP ${response.status}, código ${errorCode || "ausente"}).`);
    }
  }));
}

(async () => {
  const config = configTools.readPublicConfig(projectConfig);
  await Promise.all([
    ...tables.map((table) => requireLockedTable(config, table)),
    requireAuthenticatedJoin(config),
    requireAnonymousCharacterUpdateBlocked(config),
    requireAnonymousConflictSaveBlocked(config),
    requireAnonymousRollBlocked(config),
    requireAnonymousPresenceBlocked(config),
    requireAnonymousGmHpBlocked(config),
    requireAnonymousGmActionsBlocked(config),
    requireAnonymousSessionLifecycleBlocked(config),
    requireAnonymousCampaignManagementBlocked(config),
  ]);
  console.log(`Banco Supabase aprovado: ${tables.length} tabelas bloqueadas, entrada autenticada e gravações anônimas negadas.`);
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
