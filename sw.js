// RED Browser — Service Worker v3
// Works under any base path (root or /ale/ or any subdir).
// No importScripts — fully self-contained.

// Match our proxy prefix wherever it appears in the path
const PROXY_MARKER = '/~/';

// CORS proxy fallback chain — tried in order if direct fetch fails CORS
const CORS_PROXIES = [
  url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

self.addEventListener('install',  ()  => self.skipWaiting());
self.addEventListener('activate', evt => evt.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const { pathname, search, hash } = new URL(event.request.url);

  // Only handle requests that contain our proxy marker
  const markerIdx = pathname.indexOf(PROXY_MARKER);
  if (markerIdx === -1) return; // let browser handle normally

  const encoded = pathname.slice(markerIdx + PROXY_MARKER.length) + search + hash;
  let target;
  try {
    target = decodeURIComponent(encoded);
    if (!target.startsWith('http')) target = 'https://' + target;
    new URL(target); // throw if invalid
  } catch {
    event.respondWith(errorPage('Invalid proxy URL', encoded));
    return;
  }

  event.respondWith(handleProxy(event.request, target));
});

// ── Proxy handler ──────────────────────────────────────────────────────────

async function handleProxy(req, targetUrl) {
  // 1. Try direct fetch (fast, no third-party; works if site allows CORS)
  try {
    const res = await fetchDirect(req, targetUrl);
    // Treat any non-5xx as success
    if (res.status < 500) return sanitizeResponse(res);
  } catch (_) {
    // CORS error or network error — fall through to proxies
  }

  // 2. Try public CORS proxies in order
  for (const makeUrl of CORS_PROXIES) {
    try {
      const proxyUrl = makeUrl(targetUrl);
      const res = await fetch(proxyUrl, {
        credentials: 'omit',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (res.status < 500) return sanitizeResponse(res);
    } catch (_) {
      continue;
    }
  }

  return errorPage(
    'Could not reach this site through the proxy. It may block all proxy access.',
    targetUrl
  );
}

async function fetchDirect(req, targetUrl) {
  const method = req.method;
  const safeHeaders = new Headers();
  for (const [k, v] of req.headers) {
    if (['accept','accept-language','content-type','range'].includes(k.toLowerCase())) {
      safeHeaders.set(k, v);
    }
  }
  return fetch(targetUrl, {
    method,
    headers: safeHeaders,
    body: ['GET','HEAD'].includes(method) ? null : await req.arrayBuffer(),
    redirect: 'follow',
    credentials: 'omit',
    mode: 'cors',
  });
}

// Strip headers that prevent iframe embedding and add permissive CORS
function sanitizeResponse(res) {
  const h = new Headers(res.headers);
  ['x-frame-options',
   'content-security-policy',
   'content-security-policy-report-only',
   'cross-origin-opener-policy',
   'cross-origin-embedder-policy',
   'cross-origin-resource-policy',
  ].forEach(k => h.delete(k));
  h.set('access-control-allow-origin', '*');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

function errorPage(msg, url) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#070707;color:#ff0033;font-family:'Courier New',monospace;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:100vh;gap:14px;text-align:center;padding:20px}
  h1{font-size:72px;text-shadow:0 0 20px #ff0033,0 0 60px rgba(255,0,51,.3);
    letter-spacing:8px;font-family:Georgia,serif}
  .label{color:#888;font-size:12px;letter-spacing:3px}
  .url{color:#444;font-size:11px;word-break:break-all;max-width:520px;margin:4px 0}
  .msg{color:#ff4466;font-size:13px;max-width:480px;line-height:1.6}
  .hint{color:#333;font-size:11px;max-width:420px;line-height:1.7}
</style></head><body>
  <h1>RED</h1>
  <div class="label">PROXY ERROR</div>
  <div class="url">${url}</div>
  <div class="msg">${msg}</div>
  <div class="hint">Some sites actively detect and block proxy connections.<br>
    Try searching for a cached version, or open the link in a new tab.</div>
</body></html>`;
  return new Response(html, { status: 502, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
