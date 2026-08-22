const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const cli = path.join(root, "node_modules", "supabase", "dist", "supabase.js");
const testFile = path.join(root, "supabase", "tests", "rls_security.test.sql");
const result = spawnSync(process.execPath, [cli, "db", "query", "--linked", "--file", testFile], {
  cwd: root,
  encoding: "utf8",
  windowsHide: true,
});
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

if (result.error) throw result.error;
if (result.status !== 0) {
  process.stderr.write(output);
  process.exitCode = result.status || 1;
} else if (/not ok\b|failed\s+\d+\s+test/i.test(output)) {
  process.stderr.write(output);
  process.exitCode = 1;
} else if (/"security_results"\s*:\s*null/i.test(output)) {
  process.stderr.write("O relatório remoto não coletou os resultados dos ataques.\n");
  process.exitCode = 1;
} else {
  const completed = output.match(/ok \d+ -/g) ?? [];
  if (completed.length !== 35) {
    process.stderr.write(`Relatório remoto incompleto: ${completed.length}/35 ataques verificados.\n`);
    process.exitCode = 1;
  } else {
    console.log("Segurança remota aprovada: 35 ataques transacionais negados ou autorizados exatamente como esperado.");
  }
}
