/* Shikaku Master service worker — makes the PWA work offline (PRD §4).
 *
 * Strategy:
 *  - Precache the app shell on install.
 *  - Runtime: network-first for navigations/same-origin GETs, falling back to
 *    cache when offline; successful responses are cached for next time.
 *  Gameplay is fully client-side, so once visited the game runs with no network.
 */
const CACHE = 'shikaku-v1';
const SHELL = ['/', '/play', '/themes', '/stats', '/achievements', '/settings', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Navigation fallback to the cached home shell.
        if (req.mode === 'navigate') return (await caches.match('/')) ?? Response.error();
        return Response.error();
      }),
  );
});
