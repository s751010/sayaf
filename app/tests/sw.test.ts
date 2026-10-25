/**
 * عامل الخدمة — لا يُخزَّن إلا ردٌّ سليم.
 *
 * ═══ لماذا وُجد هذا الفحص ═══
 *
 * `public/sw.js` كان يخزّن أيّ ردّ. و`_redirects` يعيد `index.html` بحالة ٢٠٠
 * لكل مسار مجهول — فبعد نشرٍ جديد، قطعة JS قديمة لم تعد موجودة تُخزَّن HTML
 * وتُقدَّم من الذاكرة أولاً إلى الأبد، فتسقط الصفحة المؤجّلة على ذلك الجهاز
 * وحده. وكان ردّ 5xx يكتب فوق القشرة `/` فيصير العمل دون شبكة صفحةَ خطأ.
 *
 * الفحص يحمّل `sw.js` **الحقيقي** (لا نسخة منه) في سياق مُحاكى: `self`
 * و`caches` و`fetch` مزيّفة، ثم يطلق أحداثه كما يطلقها المتصفّح.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

const SW_SOURCE = readFileSync(fileURLToPath(new URL("../public/sw.js", import.meta.url)), "utf8");
const ORIGIN = "https://cloudmenu.test";

type Req = { url: string; method: string; mode: string };
type Handler = (e: FakeEvent) => void;

/** حدثٌ يجمع وعود `waitUntil` و`respondWith` كي ينتظرها الفحص. */
class FakeEvent {
  pending: Promise<unknown>[] = [];
  response: Promise<Response | undefined> | null = null;
  constructor(public request?: Req) {}
  waitUntil(p: Promise<unknown>) {
    this.pending.push(p);
  }
  respondWith(p: Promise<Response | undefined>) {
    this.response = p;
  }
  /** ينتظر الردّ ثم كل `waitUntil` — بما فيها ما أُضيف أثناء الانتظار. */
  async settle(): Promise<Response | undefined> {
    const res = this.response ? await this.response : undefined;
    for (let i = 0; i < this.pending.length; i++) await this.pending[i];
    return res;
  }
}

const keyOf = (r: Req | string) => new URL(typeof r === "string" ? r : r.url, ORIGIN).href;

/** ذاكرة في الذاكرة: Map بالاسم ⇐ Map بالرابط ⇐ Response. ترتيب الإدراج محفوظ. */
class FakeCache {
  store = new Map<string, Response>();
  async put(r: Req | string, res: Response) {
    const k = keyOf(r);
    this.store.delete(k);
    this.store.set(k, res);
  }
  async match(r: Req | string) {
    return this.store.get(keyOf(r))?.clone();
  }
  async keys() {
    return [...this.store.keys()].map((url) => ({ url }));
  }
  async delete(r: Req | string) {
    return this.store.delete(keyOf(r));
  }
  async addAll(paths: string[]) {
    for (const p of paths) {
      const res = await fakeFetch(p);
      if (!res.ok) throw new TypeError("addAll: bad response");
      await this.put(p, res);
    }
  }
}

class FakeCaches {
  named = new Map<string, FakeCache>();
  async open(name: string) {
    if (!this.named.has(name)) this.named.set(name, new FakeCache());
    return this.named.get(name)!;
  }
  async keys() {
    return [...this.named.keys()];
  }
  async delete(name: string) {
    return this.named.delete(name);
  }
  async match(r: Req | string) {
    for (const c of this.named.values()) {
      const hit = await c.match(r);
      if (hit) return hit;
    }
    return undefined;
  }
  /** كل الروابط المخزَّنة عبر كل الذاكرات. */
  allKeys() {
    return [...this.named.values()].flatMap((c) => [...c.store.keys()]);
  }
}

// ── الشبكة المزيّفة: جدولٌ من الرابط إلى الردّ، أو رميٌ حين «لا شبكة». ──
let routes: Record<string, () => Response>;
let offline: boolean;
async function fakeFetch(r: Req | string): Promise<Response> {
  if (offline) throw new TypeError("Failed to fetch");
  const route = routes[new URL(keyOf(r)).pathname];
  return route ? route() : html(INDEX_HTML); // كـ`/* /index.html 200`
}

const INDEX_HTML =
  '<!doctype html><script type="module" crossorigin src="/assets/index-AAA.js"></script>' +
  '<link rel="stylesheet" crossorigin href="/assets/index-BBB.css">';
const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=UTF-8" } });
const js = (body = "export{}") =>
  new Response(body, { status: 200, headers: { "content-type": "application/javascript" } });
const css = () => new Response("a{}", { status: 200, headers: { "content-type": "text/css" } });

let caches: FakeCaches;
let handlers: Record<string, Handler>;

function boot() {
  handlers = {};
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: Handler) => (handlers[type] = fn),
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  // `new Function` يجعل self/caches/fetch معاملاتٍ محلّية — فتُقرأ من هنا لا من العامّ.
  new Function("self", "caches", "fetch", SW_SOURCE)(self, caches, fakeFetch);
}

async function fire(type: string, request?: Req) {
  const e = new FakeEvent(request);
  handlers[type](e);
  const res = await e.settle();
  return res;
}
const get = (path: string, mode = "cors"): Req => ({ url: ORIGIN + path, method: "GET", mode });

beforeEach(() => {
  offline = false;
  routes = {
    "/": () => html(INDEX_HTML),
    "/icon.svg": () => new Response("<svg/>", { headers: { "content-type": "image/svg+xml" } }),
    "/manifest.webmanifest": () =>
      new Response("{}", { headers: { "content-type": "application/manifest+json" } }),
    "/assets/index-AAA.js": () => js(),
    "/assets/index-BBB.css": () => css(),
  };
  caches = new FakeCaches();
  boot();
});

describe("sw.js — الأصول المُهشَّرة", () => {
  it("ردّ HTML لطلب ‎.js‎ (قطعة حذفها نشرٌ جديد) لا يُخزَّن — ويُعاد كما جاء", async () => {
    // لا مسار لها ⇐ الشبكة المزيّفة تعيد index.html بحالة ٢٠٠، كما يفعل Netlify.
    const res = await fire("fetch", get("/assets/Menu-OLD.js"));
    expect(res?.headers.get("content-type")).toMatch(/text\/html/);
    expect(caches.allKeys()).not.toContain(`${ORIGIN}/assets/Menu-OLD.js`);
  });

  it("ردّ JS بحالة 500 لا يُخزَّن", async () => {
    routes["/assets/x.js"] = () =>
      new Response("boom", { status: 500, headers: { "content-type": "application/javascript" } });
    await fire("fetch", get("/assets/x.js"));
    expect(caches.allKeys()).not.toContain(`${ORIGIN}/assets/x.js`);
  });

  it("ردّ ناجح بنوعه الصحيح يُخزَّن، ويُقدَّم بعدها دون شبكة", async () => {
    routes["/assets/Menu-NEW.js"] = () => js("export const ok=1");
    await fire("fetch", get("/assets/Menu-NEW.js"));
    expect(caches.allKeys()).toContain(`${ORIGIN}/assets/Menu-NEW.js`);

    offline = true;
    const res = await fire("fetch", get("/assets/Menu-NEW.js"));
    expect(await res?.text()).toBe("export const ok=1");
  });

  it("CSS وخطٌّ بأنواعهما يُخزَّنان — وHTML بامتداد ‎.css‎ لا", async () => {
    routes["/assets/f.woff2"] = () =>
      new Response("x", { status: 200, headers: { "content-type": "font/woff2" } });
    await fire("fetch", get("/assets/index-BBB.css"));
    await fire("fetch", get("/assets/f.woff2"));
    await fire("fetch", get("/assets/gone.css")); // ⇐ index.html
    const keys = caches.allKeys();
    expect(keys).toContain(`${ORIGIN}/assets/index-BBB.css`);
    expect(keys).toContain(`${ORIGIN}/assets/f.woff2`);
    expect(keys).not.toContain(`${ORIGIN}/assets/gone.css`);
  });

  it("Supabase لا يُعترَض أصلاً", async () => {
    const e = new FakeEvent({ url: "https://x.supabase.co/rest/v1/dishes", method: "GET", mode: "cors" });
    handlers.fetch(e);
    expect(e.response).toBeNull();
  });
});

describe("sw.js — القشرة والتنقّل", () => {
  it("ردّ 500 لتنقّل لا يُخزَّن ولا يكتب فوق `/`", async () => {
    await fire("install");
    routes["/some-restaurant"] = () => html("<h1>502 Bad Gateway</h1>", 500);
    const res = await fire("fetch", get("/some-restaurant", "navigate"));
    expect(res?.status).toBe(500); // الزائر يرى ما أعادته الشبكة — لا نُخفيه

    offline = true;
    const shell = await fire("fetch", get("/another", "navigate"));
    expect(await shell?.text()).toBe(INDEX_HTML);
    expect(caches.allKeys()).not.toContain(`${ORIGIN}/some-restaurant`);
  });

  it("تنقّلٌ ناجح يحدّث القشرة، ويخدمها دون شبكة", async () => {
    await fire("install");
    const fresh = INDEX_HTML.replace("AAA", "CCC");
    routes["/r"] = () => html(fresh);
    await fire("fetch", get("/r", "navigate"));

    offline = true;
    const shell = await fire("fetch", get("/anything", "navigate"));
    expect(await shell?.text()).toBe(fresh);
  });

  it("install يعبّئ القشرة وأصول index.html نفسها — فالعمل دون شبكة لا ينقطع لحظة الترقية", async () => {
    await fire("install");
    const keys = caches.allKeys();
    for (const p of ["/", "/icon.svg", "/manifest.webmanifest", "/assets/index-AAA.js", "/assets/index-BBB.css"]) {
      expect(keys).toContain(ORIGIN + p);
    }
  });
});

describe("sw.js — الذاكرة بإصدار", () => {
  it("activate يحذف الذاكرات القديمة (ومنها cm2-shell-v1 المسمومة) ويُبقي الحالية", async () => {
    const old = await caches.open("cm2-shell-v1");
    await old.put("/assets/Menu-OLD.js", html(INDEX_HTML)); // HTML مكان JS — ما كانت تخزّنه v1
    await caches.open("something-else");
    await fire("install");
    await fire("activate");

    const names = await caches.keys();
    expect(names).not.toContain("cm2-shell-v1");
    expect(names).not.toContain("something-else");
    expect(names.length).toBeGreaterThan(0);
    // وما عُبّئ في install باقٍ بعد activate.
    expect(caches.allKeys()).toContain(`${ORIGIN}/`);
  });

  it("ذاكرة الأصول تُقصّ — لا تتراكم بين النشرات بلا حدّ", async () => {
    for (let i = 0; i < 200; i++) {
      routes[`/assets/c${i}.js`] = () => js();
      await fire("fetch", get(`/assets/c${i}.js`));
    }
    const assetKeys = caches.allKeys().filter((k) => k.includes("/assets/"));
    expect(assetKeys.length).toBeLessThan(200);
    // الأحدث باقٍ، والأقدم هو ما سقط.
    expect(assetKeys).toContain(`${ORIGIN}/assets/c199.js`);
    expect(assetKeys).not.toContain(`${ORIGIN}/assets/c0.js`);
  });
});
