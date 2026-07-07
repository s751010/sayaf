/* CloudMenu (web/) service worker — offline shell + static asset caching.
   Conservative by design: never caches Supabase/Moyasar/API responses so
   menu data, auth and payments are always fresh. */
const VERSION = 'cmweb-v1';
const PAGES = 'cmweb-pages-' + VERSION;
const ASSETS = 'cmweb-assets-' + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(PAGES).then((c) => c.add('/')).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never touch dynamic backends — always go to network.
  if (/supabase\.co|moyasar\.com/.test(url.hostname)) return;
  // API routes (view tracking…) must never be served from cache.
  if (url.pathname.startsWith('/api/')) return;

  // Next static assets are content-hashed → safe to cache-first.
  if (url.pathname.startsWith('/_next/static/') || /fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(
      caches.open(ASSETS).then((c) =>
        c.match(req).then(
          (hit) =>
            hit ||
            fetch(req).then((res) => {
              if (res.ok) c.put(req, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // Navigations: network-first, offline falls back to the last cached copy
  // of the same page, then to the home shell.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(url.pathname, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(url.pathname, { ignoreSearch: true })
            .then((hit) => hit || caches.match('/', { ignoreSearch: true }))
        )
    );
  }
});
