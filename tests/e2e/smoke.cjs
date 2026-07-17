const { chromium } = require("playwright");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "..");
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
    const target = path.resolve(root, relative);
    if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mime[path.extname(target)] || "application/octet-stream" });
    fs.createReadStream(target).pipe(response);
  });
}

async function exercise(page, url) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(url);
  await page.getByRole("button", { name: "Criar ficha nova" }).click();
  const tabs = ["Resumo", "Combate", "Magia", "Inventário", "P&T", "Antecedentes"];
  for (const tab of tabs) {
    await page.getByRole("button", { name: new RegExp(`^${tab}`) }).click();
    await page.locator("#app").waitFor({ state: "visible" });
  }
  await page.getByRole("button", { name: /^Resumo/ }).click();
  const name = page.locator('[data-path="character.name"]');
  await name.fill("Teste de regressão");
  if ((await name.inputValue()) !== "Teste de regressão") throw new Error("Campo Nome não permaneceu editável.");
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
      await exercise(await context.newPage(), `http://127.0.0.1:${port}/`);
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
