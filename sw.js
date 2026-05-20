// RED Browser — Scramjet Service Worker
// Handles proxied requests via the /~/ route prefix

importScripts('/static/scramjet/scramjet.codecs.js');
importScripts('/static/scramjet/scramjet.worker.js');

// BareMux transport config — points to our bare server
const config = {
  prefix: '/~/',
  bare: '/bare/',
  codec: 'plain',
};

// Boot Scramjet SW
if (typeof ScramjetServiceWorker !== 'undefined') {
  const sw = new ScramjetServiceWorker(config);
  sw.init();
} else {
  // Fallback passthrough handler if scramjet files aren't loaded yet
  self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/~/')) {
      const target = decodeURIComponent(url.pathname.slice(3)) + url.search;
      event.respondWith(
        fetch(target, {
          method: event.request.method,
          headers: (() => {
            const h = new Headers(event.request.headers);
            h.set('X-Forwarded-For', '127.0.0.1');
            return h;
          })(),
          body: ['GET','HEAD'].includes(event.request.method) ? null : event.request.body,
          redirect: 'follow',
          credentials: 'omit',
        }).catch(() => new Response('Proxy unavailable — run npm install then node setup.js', {
          status: 502,
          headers: { 'Content-Type': 'text/plain' }
        }))
      );
    }
  });
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
