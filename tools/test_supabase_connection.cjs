const configTools = require("../src/online/config.js");
const supabaseTools = require("../src/online/supabase.js");
const supabaseSdk = require("@supabase/supabase-js");
const { loadPublicConfig } = require("./public_config.cjs");

async function requireOk(label, url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const details = (await response.text()).trim().slice(0, 300);
    throw new Error(`${label} respondeu com HTTP ${response.status}${details ? `: ${details}` : "."}`);
  }
  return response.status;
}

async function requireReachableDataApi(config, headers) {
  const probeTable = "__marufia_connection_probe";
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/${probeTable}?select=*&limit=0`,
    { headers },
  );
  if (response.ok) return `${response.status}`;

  const details = (await response.text()).trim().slice(0, 300);
  let errorCode = "";
  try {
    errorCode = String(JSON.parse(details).code || "");
  } catch {
    // A resposta textual ainda será exibida no erro abaixo.
  }
  if (response.status === 404 && errorCode === "PGRST205") {
    return "acessível (sonda controlada PGRST205)";
  }
  throw new Error(`Supabase Data API respondeu com HTTP ${response.status}${details ? `: ${details}` : "."}`);
}

(async () => {
  const config = configTools.readPublicConfig(loadPublicConfig());
  const client = supabaseTools.createSupabaseClient(config, supabaseSdk);
  if (!client) throw new Error("O cliente Supabase não foi criado.");
  const headers = {
    apikey: config.publishableKey,
  };
  const [authStatus, dataStatus] = await Promise.all([
    requireOk("Supabase Auth", `${config.supabaseUrl}/auth/v1/health`, headers),
    requireReachableDataApi(config, headers),
  ]);
  console.log(`Conexão Supabase aprovada: Auth ${authStatus}, Data API ${dataStatus}.`);
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
