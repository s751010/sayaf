/* CloudMenu service worker — offline shell + font caching.
   Conservative by design: never caches Supabase/Moyasar/API responses
   so menu data is always fresh. */
const VERSION = 'cm-v1';
const SHELL = 'cm-shell-' + VERSION;
const FONTS = 'cm-fonts-' + VERSION;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL).then((c) => c.add('/')).then(() => self.skipWaiting())
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

  // App shell (navigations): network-first, fall back to cached shell offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/', { ignoreSearch: true }))
    );
    return;
  }

  // Google fonts: stale-while-revalidate.
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(
      caches.open(FONTS).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req).then((res) => {
            if (res.ok) c.put(req, res.clone());
            return res;
          });
          return hit || net;
        })
      )
    );
  }
});
