const INDEX_PATH = "/index.html";
const UPDATE_MANIFEST_PATH = "/app-update.json";
const UPDATE_MANIFEST_ASSET_PATH = "/.marufia/app-update.json";
const TAURI_UPDATE_MANIFEST_PATH = "/tauri-update.json";
const TAURI_UPDATE_MANIFEST_ASSET_PATH = "/.marufia/tauri-update.json";

function updateManifestResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cache-Control", "no-store, max-age=0");
  headers.set("CDN-Cache-Control", "no-store");
  headers.set("Cloudflare-CDN-Cache-Control", "no-store");
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function withPath(request, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = "";
  return new Request(url, request);
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    const manifestAssetPath = pathname === UPDATE_MANIFEST_PATH
      ? UPDATE_MANIFEST_ASSET_PATH
      : pathname === TAURI_UPDATE_MANIFEST_PATH
        ? TAURI_UPDATE_MANIFEST_ASSET_PATH
        : "";
    if (manifestAssetPath) {
      const response = await env.ASSETS.fetch(withPath(request, manifestAssetPath));
      return updateManifestResponse(response);
    }
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    return env.ASSETS.fetch(withPath(request, INDEX_PATH));
  },
};
