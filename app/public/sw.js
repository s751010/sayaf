/**
 * Service worker كلاود منيو v2:
 * - التنقلات: network-first مع سقوط إلى القشرة المخبأة (أوفلاين).
 * - أصول /assets/ (بأسماء hash ثابتة): cache-first.
 * - Supabase وMoyasar لا يُخبآن أبداً — بيانات المنيو والدفع تبقى طازجة.
 *
 * ═══ لا يُخزَّن إلا ردٌّ سليم (٢٠٢٦/١٠/٢٥) ═══
 *
 * كانت النسخة الأولى تخزّن **أيّ** ردّ. و`_redirects` ينتهي بـ
 * `/* /index.html 200` — فبعد نشرٍ جديد، طلبُ قطعة JS مُهشَّرة لم تعد موجودة
 * يعيد Netlify فيه `index.html` بحالة ٢٠٠. فيُخزَّن HTML مكان JS، ويُقدَّم من
 * الذاكرة أولاً **إلى الأبد**، وتسقط الصفحة المؤجّلة على ذلك الجهاز وحده —
 * عطلٌ لا يراه أحد غير الزبون. وكان كل تنقّل يكتب فوق `/` حتى ردّ 5xx،
 * فيصير «العمل دون شبكة» صفحةَ خطأ.
 *
 * فالآن: `isCacheableAsset` تشترط ٢٠٠ ونوع محتوى يطابق الامتداد، و
 * `isShellResponse` تشترط ٢٠٠ وHTML بلا تحويل. `app/tests/sw.test.ts` يحرسهما.
 *
 * ═══ الذاكرة بإصدار ═══
 *
 * رفعُ `VERSION` يحذف عند `activate` كل ذاكرة سواه — ومنها `cm2-shell-v1`
 * التي قد تحمل HTML مسموماً على أجهزة قائمة. والقشرة تُعبّأ في `install` قبل
 * ذلك، ومعها أصول `index.html` نفسها، فلا ينقطع العمل دون شبكة لحظة الترقية.
 * والأصول المُهشَّرة تتراكم بين النشرات داخل الإصدار الواحد، فتُقصّ إلى
 * `MAX_ASSETS` بالأقدم أولاً.
 */
const VERSION = "v2";
const SHELL_CACHE = "cm2-shell-" + VERSION;
const ASSET_CACHE = "cm2-assets-" + VERSION;
const KEEP = [SHELL_CACHE, ASSET_CACHE];
const SHELL = ["/", "/icon.svg", "/manifest.webmanifest"];
// بناءٌ كامل اليوم ≈ ٣٨ JS و١٤ CSS و٥٨ woff2 — والمتصفّح لا يطلب إلا بعضها.
const MAX_ASSETS = 150;

/** نوع المحتوى المقبول لكل امتداد. ما لا يُذكر يُقبل ما لم يكن HTML. */
const EXPECTED_TYPE = {
  js: /javascript|ecmascript/,
  mjs: /javascript|ecmascript/,
  css: /^text\/css/,
  woff2: /^font\/|^application\/(font|x-font|octet-stream)/,
  woff: /^font\/|^application\/(font|x-font|octet-stream)/,
  ttf: /^font\/|^application\/(font|x-font|octet-stream)/,
  otf: /^font\/|^application\/(font|x-font|octet-stream)/,
  svg: /^image\/svg\+xml/,
  png: /^image\//,
  jpg: /^image\//,
  jpeg: /^image\//,
  webp: /^image\//,
  avif: /^image\//,
  gif: /^image\//,
  ico: /^image\//,
  json: /json/,
  webmanifest: /json/,
};

function contentType(res) {
  return ((res.headers && res.headers.get("content-type")) || "").toLowerCase();
}

/** هل يصلح هذا الردّ أن يُخزَّن لهذا المسار؟ ٢٠٠ فقط، وبالنوع الذي يطلبه الامتداد. */
function isCacheableAsset(pathname, res) {
  if (!res || res.status !== 200 || res.redirected) return false;
  const ct = contentType(res);
  const m = /\.([a-z0-9]+)$/i.exec(pathname);
  const want = m && EXPECTED_TYPE[m[1].toLowerCase()];
  if (want) return want.test(ct);
  return ct !== "" && !ct.startsWith("text/html");
}

/** هل يصلح هذا الردّ قشرةً (`/`)؟ ٢٠٠ وHTML بلا تحويل — لا 5xx ولا 404 ولا opaqueredirect. */
function isShellResponse(res) {
  return !!res && res.status === 200 && !res.redirected && contentType(res).startsWith("text/html");
}

/** أصول `/assets/` التي يحمّلها `index.html` نفسه — تُعبّأ مع القشرة. */
function assetsInShell(html) {
  const out = new Set();
  const re = /(?:src|href)="(\/assets\/[^"?#]+)"/g;
  let m;
  while ((m = re.exec(html))) out.add(m[1]);
  return [...out];
}

/** يقصّ ذاكرة الأصول إلى `MAX_ASSETS` — الأقدم إدراجاً أوّلاً. */
function trimAssets(cache) {
  return cache.keys().then((keys) => {
    const extra = keys.length - MAX_ASSETS;
    if (extra <= 0) return;
    return Promise.all(keys.slice(0, extra).map((k) => cache.delete(k)));
  });
}

/** يجلب أصلاً ويخزّنه إن كان سليماً. يعيد الردّ كما جاء — سليماً أو لا. */
function fetchAndCacheAsset(request, pathname) {
  return fetch(request).then((res) => {
    if (!isCacheableAsset(pathname, res)) return { res, stored: Promise.resolve() };
    const copy = res.clone();
    const stored = caches
      .open(ASSET_CACHE)
      .then((c) => c.put(request, copy).then(() => trimAssets(c)))
      .catch(() => {});
    return { res, stored };
  });
}

/** تعبئة أصول القشرة — بلا إسقاط التثبيت إن فشلت (القشرة وحدها تكفي لتعمل). */
function precacheShellAssets(shell) {
  return shell
    .match("/")
    .then((res) => (res ? res.text() : ""))
    .then((html) =>
      Promise.all(
        assetsInShell(html).map((path) =>
          fetchAndCacheAsset(path, path)
            .then((r) => r.stored)
            .catch(() => {})
        )
      )
    )
    .catch(() => {});
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((c) => c.addAll(SHELL).then(() => precacheShellAssets(c)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // لا كاش أبداً للخلفية والدفع.
  if (url.hostname.endsWith(".supabase.co") || url.hostname.endsWith("moyasar.com")) return;

  // أصول مبنية بأسماء hash — كاش أولاً، ولا يُخزَّن إلا السليم.
  if (url.origin === self.location.origin && url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetchAndCacheAsset(e.request, url.pathname).then(({ res, stored }) => {
            e.waitUntil(stored);
            return res;
          })
      )
    );
    return;
  }

  // تنقلات SPA — شبكة أولاً ثم القشرة. ولا يكتب فوق القشرة إلا ردٌّ سليم.
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (isShellResponse(res)) {
            const copy = res.clone();
            e.waitUntil(
              caches
                .open(SHELL_CACHE)
                .then((c) => c.put("/", copy))
                .catch(() => {})
            );
          }
          return res;
        })
        .catch(() => caches.match("/"))
    );
  }
});
