// RED Browser — Service Worker
// Self-contained proxy. No importScripts needed.

const PREFIX = '/~/';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only intercept proxied requests
  if (!url.pathname.startsWith(PREFIX)) return;

  const encoded = url.pathname.slice(PREFIX.length) + url.search + url.hash;
  let target;
  try {
    target = decodeURIComponent(encoded);
    if (!target.startsWith('http')) target = 'https://' + target;
  } catch {
    event.respondWith(errorPage('Invalid URL', encoded));
    return;
  }

  event.respondWith(proxyFetch(event.request, target));
});

async function proxyFetch(originalReq, targetUrl) {
  const method = originalReq.method;
  const headers = new Headers();

  // Copy safe headers
  for (const [k, v] of originalReq.headers.entries()) {
    const lower = k.toLowerCase();
    if (['accept','accept-language','content-type','range'].includes(lower)) {
      headers.set(k, v);
    }
  }
  headers.set('Origin', new URL(targetUrl).origin);

  try {
    const res = await fetch(targetUrl, {
      method,
      headers,
      body: ['GET','HEAD'].includes(method) ? null : await originalReq.arrayBuffer(),
      redirect: 'follow',
      credentials: 'omit',
    });

    const resHeaders = new Headers(res.headers);
    // Remove headers that block framing/CORS
    resHeaders.delete('x-frame-options');
    resHeaders.delete('content-security-policy');
    resHeaders.delete('content-security-policy-report-only');
    resHeaders.set('access-control-allow-origin', '*');

    const body = await res.arrayBuffer();
    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    return errorPage(err.message, targetUrl);
  }
}

function errorPage(msg, url) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body{background:#070707;color:#ff0033;font-family:'Courier New',monospace;
       display:flex;flex-direction:column;align-items:center;justify-content:center;
       height:100vh;margin:0;text-align:center;}
  h1{font-size:64px;text-shadow:0 0 20px #ff0033,0 0 60px rgba(255,0,51,.4);
     margin:0;letter-spacing:8px;}
  .err{color:#fff;margin:20px 0;font-size:16px;}
  .url{color:#555;font-size:12px;word-break:break-all;max-width:500px;}
  .msg{color:#ff4466;font-size:13px;margin-top:8px;}
</style></head><body>
  <h1>RED</h1>
  <div class="err">Connection Failed</div>
  <div class="url">${url}</div>
  <div class="msg">${msg}</div>
</body></html>`;
  return new Response(html, {
    status: 502,
    headers: { 'Content-Type': 'text/html' }
  });
}
