"use strict";

const assert = require("node:assert/strict");
const { createClient } = require("@supabase/supabase-js");

const baseUrl = required("MARUFIA_TUNNEL_URL").replace(/\/$/, "");
const publicKey = required("MARUFIA_TUNNEL_PUBLIC_KEY");
const mode = required("MARUFIA_TUNNEL_MODE");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável de teste ausente: ${name}.`);
  return value;
}

async function fetchWithRetry(path, options = {}, attempts = 20) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: AbortSignal.timeout(10_000),
      });
      if (response.status !== 502 && response.status !== 503 && response.status !== 504) {
        return response;
      }
      lastError = new Error(`Gateway ainda indisponível (${response.status}).`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(500 * attempt, 2_000)));
  }
  throw lastError;
}

async function assertRealtimeWebSocket() {
  const client = createClient(baseUrl, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { timeout: 15_000 },
  });
  const channel = client.channel(`phase8-tunnel-${Date.now()}`);
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Tempo esgotado ao abrir o WebSocket.")), 20_000);
      channel.subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          resolve();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          clearTimeout(timer);
          reject(error || new Error(`Realtime retornou ${status}.`));
        }
      });
    });
    assert.equal(client.getChannels().length, 1);
  } finally {
    await client.removeAllChannels();
    assert.equal(client.getChannels().length, 0);
    client.realtime.disconnect();
  }
}

async function main() {
  const url = new URL(baseUrl);
  assert.equal(url.protocol, "https:", "O endereço público deve usar HTTPS.");

  const root = await fetchWithRetry("/");
  assert.equal(root.status, 404, "A raiz/Studio não deve estar publicada.");

  const health = await fetchWithRetry("/auth/v1/health", {
    headers: { apikey: publicKey },
  });
  assert.equal(health.status, 200, "O Auth não respondeu pelo Tunnel.");

  if (mode === "Quick") {
    const signup = await fetchWithRetry("/auth/v1/signup", {
      method: "POST",
      headers: { apikey: publicKey, "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(signup.status, 404, "O ensaio temporário não pode publicar cadastro.");
    const rest = await fetchWithRetry("/rest/v1/profiles?select=id&limit=1", {
      headers: { apikey: publicKey },
    });
    assert.equal(rest.status, 404, "O ensaio temporário não pode publicar dados REST.");
  } else if (mode === "Named") {
    const rest = await fetchWithRetry("/rest/v1/profiles?select=id&limit=1", {
      headers: { apikey: publicKey },
    });
    assert.ok([200, 401, 403].includes(rest.status), `REST retornou ${rest.status}.`);
    if (rest.status === 200) assert.deepEqual(await rest.json(), [], "Acesso anônimo retornou dados privados.");
  } else {
    throw new Error("Modo de teste do Tunnel inválido.");
  }

  await assertRealtimeWebSocket();
  console.log("HTTPS, Auth, bloqueios públicos e WebSocket Realtime: OK.");
}

main().catch((error) => {
  console.error(`Falha no ensaio do Tunnel: ${error.message}`);
  process.exitCode = 1;
});
