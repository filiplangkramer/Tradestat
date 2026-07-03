/* ═══════════════════════════════════════════════════════════════════
   Service Worker — sdílený pro launcher, TradeStat i Shiftbook
   Strategie:
   - HTML (navigace): network-first s revalidací → stránka je po
     deployi vždy čerstvá; cache jen jako offline fallback
   - statické assety + CDN knihovny: stale-while-revalidate
   - Firebase/Firestore/API: nedotýkáme se (passthrough)
   ═══════════════════════════════════════════════════════════════════ */
const CACHE = 'filip-apps-v1';

const PRECACHE = [
  './',
  './tradestat/',
  './shiftbook/',
  './manifest.webmanifest',
  './tradestat/manifest.webmanifest',
  './shiftbook/manifest.webmanifest',
  './icon-192.png',
  './tradestat/icon-192.png',
  './shiftbook/icon-192.png',
];

/* CDN hosty, které je bezpečné cachovat (verzované/immutable soubory) */
const CACHEABLE_HOSTS = [
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // per-item, aby jeden výpadek neshodil celou instalaci
      Promise.allSettled(PRECACHE.map(u => cache.add(u)))
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  /* ── HTML navigace: network-first, vždy revalidovat ── */
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-cache' });
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        // fallback na index dané appky (…/tradestat/cokoliv → …/tradestat/)
        const dir = url.pathname.replace(/[^/]*$/, '');
        const shell = await caches.match(dir);
        if (shell) return shell;
        throw err;
      }
    })());
    return;
  }

  /* ── statické assety: stale-while-revalidate ── */
  const cacheable = sameOrigin || CACHEABLE_HOSTS.includes(url.hostname);
  if (!cacheable) return; // Firebase, Finnhub, CoinGecko, clearbit… → síť

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
