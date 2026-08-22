const INDEX_PATH = "/index.html";
const UPDATE_MANIFEST_PATH = "/app-update.json";
const UPDATE_MANIFEST_ASSET_PATH = "/.marufia/app-update.json";

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
    if (pathname === UPDATE_MANIFEST_PATH) {
      const response = await env.ASSETS.fetch(withPath(request, UPDATE_MANIFEST_ASSET_PATH));
      return updateManifestResponse(response);
    }
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) return response;
    return env.ASSETS.fetch(withPath(request, INDEX_PATH));
  },
};
