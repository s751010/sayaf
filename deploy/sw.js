/**
 * Service worker كلاود منيو v2:
 * - التنقلات: network-first مع سقوط إلى القشرة المخبأة (أوفلاين).
 * - أصول /assets/ (بأسماء hash ثابتة): cache-first.
 * - Supabase وMoyasar لا يُخبآن أبداً — بيانات المنيو والدفع تبقى طازجة.
 */
const CACHE = "cm2-shell-v1";
const SHELL = ["/", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // لا كاش أبداً للخلفية والدفع.
  if (url.hostname.endsWith(".supabase.co") || url.hostname.endsWith("moyasar.com")) return;

  // أصول مبنية بأسماء hash — كاش أولاً.
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
      )
    );
    return;
  }

  // تنقلات SPA — شبكة أولاً ثم القشرة.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("/", copy));
          return res;
        })
        .catch(() => caches.match("/"))
    );
  }
});
