const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const packagePath = require.resolve("@supabase/supabase-js/package.json", { paths: [root] });
const packageRoot = path.dirname(packagePath);
const source = path.join(packageRoot, "dist", "umd", "supabase.js");
const target = path.join(root, "vendor", "supabase.js");

if (!fs.existsSync(source)) throw new Error("O pacote Supabase instalado não contém o bundle UMD esperado.");
fs.copyFileSync(source, target);
console.log(`Cliente Supabase copiado para vendor/supabase.js (${require(packagePath).version}).`);
