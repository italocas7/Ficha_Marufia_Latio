"use strict";

const { createClient } = require("@supabase/supabase-js");
const project = require("../src/online/project.js");

const FAILURE_STATES = new Set(["CHANNEL_ERROR", "TIMED_OUT"]);

async function main(timeoutMs = 15_000) {
  const client = createClient(project.supabaseUrl, project.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  let channel;
  let timer;
  try {
    await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Realtime não confirmou a conexão dentro do prazo.")), timeoutMs);
      channel = client
        .channel(`marufia-tauri-readiness-${Date.now()}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "rolls" }, () => {})
        .subscribe((status, error) => {
          if (status === "SUBSCRIBED") resolve();
          else if (FAILURE_STATES.has(status)) reject(error || new Error(`Realtime respondeu ${status}.`));
        });
    });
    console.log("Realtime aprovado: canal de rolagens conectado com a chave pública.");
  } finally {
    clearTimeout(timer);
    if (channel) await client.removeChannel(channel);
    client.realtime.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  });
}

module.exports = { FAILURE_STATES, main };
