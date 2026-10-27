/**
 * «إعداد منيوك» من أوّله إلى آخره — من «أنشئ مطعمي» إلى منيوٍ منشورٍ ورابطٍ
 * يُشارَك، على ٣٢٠ و١٢٨٠. والشبكة مُحاكاة **بحالة**: ما يُنشأ يُعاد في الجلب
 * التالي، فيُفحص المسار كما يعيشه تاجر لا شاشاتٍ منفصلة.
 *
 * ثلاثة وعودٍ تُعدّ بالشبكة لا تُرى بالعين (الدرس ٤٨):
 * - **فشل القراءة عربيٌّ بإعادة محاولة** — الطلب الأوّل إلى `menu-scan` يُقطع.
 * - **الصورة نفسها لا تُقرأ ثانيةً**: «صورة أخرى» بالملفّ نفسه، ثم إعادة تحميل
 *   الصفحة قبل الحفظ — والعدّاد يبقى عند نداءين (الفاشل والناجح).
 * - **المُنتقي لا يكتب باللمس**: صفر كتابة إلى `menus` قبل «طبّق».
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";

const UID = "00000000-0000-4000-8000-000000000001";
const RID = "00000000-0000-4000-8000-0000000000cc";
const MID = "00000000-0000-4000-8000-0000000000dd";
const SLUG = "e2e-new";

const now = Date.now();
const session = {
  access_token: "e2e.mock.token",
  refresh_token: "e2e-refresh",
  expires_at: Math.floor(now / 1000) + 86400,
  user: { id: UID, email: "e2e@example.com" },
};

/** صورة PNG بنقطة واحدة — تكفي الضغط في المتصفّح؛ والقراءة مُحاكاة. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

/** ما «قرأه» النموذج — وصنفٌ بلا سعر يجب أن يملأه التاجر قبل الحفظ. */
const SCANNED = [
  { name: "قهوة سعودية", price: 12, category: "القهوة الساخنة", description: null },
  { name: "لاتيه", price: 18, category: "القهوة الساخنة", description: null },
  { name: "كرواسون", price: null, category: "المخبوزات", description: null },
];

type Row = Record<string, unknown>;

interface World {
  restaurants: Row[];
  menus: Row[];
  dishes: Row[];
  scanCalls: number;
  menuWrites: string[];
}

async function mockNetwork(page: Page): Promise<World> {
  const w: World = { restaurants: [], menus: [], dishes: [], scanCalls: 0, menuWrites: [] };
  const json = (body: unknown) => ({
    status: 200,
    contentType: "application/json",
    headers: { "access-control-expose-headers": "content-range", "content-range": "0-0/1" },
    body: JSON.stringify(body),
  });

  await page.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const method = req.method();
    const body = method === "GET" || method === "HEAD" ? null : req.postDataJSON();

    if (p.includes("/auth/v1/user")) return route.fulfill(json(session.user));
    if (p.includes("/auth/v1/")) return route.fulfill(json(session));
    if (p.includes("/functions/v1/menu-scan")) {
      w.scanCalls += 1;
      // الأوّل ينقطع (لا شبكة) — والثاني يقرأ.
      if (w.scanCalls === 1) return route.abort("internetdisconnected");
      return route.fulfill(json({ items: SCANNED }));
    }
    if (p.includes("/rpc/is_menu_published")) return route.fulfill(json(true));
    if (p.includes("/rpc/is_founder")) return route.fulfill(json(false));
    if (p.includes("/rpc/")) return route.fulfill(json([]));

    const table = (p.split("/rest/v1/")[1] ?? "").split("?")[0];
    if (table === "restaurants") {
      if (method === "POST") {
        const r = {
          id: RID, created_at: new Date().toISOString(), logo: null, logo_image: null,
          english_enabled: false, loyalty_enabled: false, accepting_orders: false,
          online_payment_enabled: false, api_enabled: false, prices_include_vat: true,
          min_order_amount: 0, ...(body as Row),
        };
        w.restaurants = [r];
        return route.fulfill(json([r]));
      }
      if (method === "PATCH") {
        w.restaurants = w.restaurants.map((r) => ({ ...r, ...(body as Row) }));
        return route.fulfill({ status: 204, body: "" });
      }
      return route.fulfill(json(w.restaurants));
    }
    if (table === "menus") {
      if (method === "POST") {
        const m = { id: MID, theme: "dark-gold", active: true, language: "ar", created_at: new Date().toISOString(), ...(body as Row) };
        w.menus = [m];
        return route.fulfill(json([m]));
      }
      if (method === "PATCH") {
        w.menuWrites.push(JSON.stringify(body));
        w.menus = w.menus.map((m) => ({ ...m, ...(body as Row) }));
        return route.fulfill({ status: 204, body: "" });
      }
      return route.fulfill(json(w.menus));
    }
    if (table === "dishes") {
      if (method === "POST") {
        const rows = (Array.isArray(body) ? body : [body]).map((d: Row, i: number) => ({
          id: `d${w.dishes.length + i + 1}`, created_at: new Date().toISOString(), ...d,
        }));
        w.dishes.push(...rows);
        return route.fulfill(json(rows));
      }
      return route.fulfill(json(w.dishes));
    }
    if (table === "subscriptions") {
      if (method !== "GET") return route.fulfill({ status: 201, body: "" });
      return route.fulfill(json([{
        id: "s1", user_id: UID, plan_id: "trial", active: true,
        start_date: new Date(now).toISOString(), end_date: new Date(now + 7 * 864e5).toISOString(),
        created_at: new Date(now).toISOString(),
      }]));
    }
    return route.fulfill(json([]));
  });
  await page.addInitScript((s) => localStorage.setItem("cm2_session", JSON.stringify(s)), session);
  return w;
}

/**
 * لقطات للمراجعة — تُكتب حين يُطلب مجلّدها وحده (`SETUP_SHOTS`). بقدر الشاشة لا
 * الصفحة كلّها: اللقطة الطويلة تضع الترويسة والشريط اللاصقَين في منتصفها، فلا
 * تُري ما يراه التاجر. والهدف يُمرَّر إليه أوّلاً.
 */
async function shot(page: Page, name: string, target = "#setup-step-title"): Promise<void> {
  const dir = process.env.SETUP_SHOTS;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  await page.locator(target).first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(dir, `${name}.png`) });
}

/**
 * يختار الصورة في حقل «اختر صورة» — **الملفّ نفسه** في كل مرّة (الاسم والحجم
 * وتاريخ التعديل)، كمن يختار الصورة ذاتها من معرض جواله ثانيةً.
 *
 * ⚠️ لا `setInputFiles`: مع كروميوم البيئة المثبّت (`PW_CHROMIUM_PATH`، نسخةٌ
 * غير نسخة المكتبة) لم يُطلق حدثاً واحداً على الحقل — قيستْ: صفر `change` وصفر
 * `input`. والحقن بـ`DataTransfer` هو ما يفعله المتصفّح نفسه عند الاختيار.
 */
async function pickImage(page: Page): Promise<void> {
  await page.evaluate((b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const file = new File([bytes], "menu.png", { type: "image/png", lastModified: 1_761_000_000_000 });
    const input = document.querySelectorAll<HTMLInputElement>('input[type="file"]:not([capture])')[0];
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, PNG.toString("base64"));
}

async function noSideScroll(page: Page, width: number): Promise<void> {
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, "تمريرٌ أفقي").toBeLessThanOrEqual(width);
}

for (const size of [
  { width: 320, height: 640 },
  { width: 1280, height: 800 },
]) {
  test.describe(`إعداد منيوك على ${size.width}px`, () => {
    test.use({ viewport: size, reducedMotion: "reduce", serviceWorkers: "block" });

    test("من «أنشئ مطعمي» إلى منيوٍ منشور — وفشل القراءة يُستعاد بلا قراءة ثانية", async ({ page }, info) => {
      test.setTimeout(90_000);
      const { crashes } = watch(page);
      const w = await mockNetwork(page);
      const tag = `${info.project.name}-${size.width}`;

      // ── التسجيل ──
      await page.goto("/dashboard");
      await page.getByPlaceholder("مثال: مطعم الديوان").fill("مقهى المسار");
      await page.getByLabel("رابط منيوك").fill(SLUG);
      await page.locator("select").selectOption("كافيه");
      await expect(page.getByText(/متاح ✓/)).toBeVisible();
      await page.getByRole("button", { name: /أنشئ مطعمي/ }).click();

      await expect(page).toHaveURL(/\/dashboard\/setup$/);
      await expect(page.getByRole("heading", { name: "إعداد منيوك" })).toBeVisible();
      await expect(page.getByText("الخطوة 1 من 4")).toBeVisible();
      await expect(page.getByRole("progressbar", { name: "تقدّم الإعداد" })).toHaveAttribute("aria-valuenow", "0");
      await shot(page, `${tag}-1-dishes`);
      if (size.width === 320) await noSideScroll(page, 320);

      // ── ١: أصنافك — القراءة تنقطع، ثم تُعاد بالصورة نفسها ──
      await page.getByRole("button", { name: /صوّر منيوك/ }).click();
      await pickImage(page);
      const alert = page.getByRole("alert").filter({ hasText: "انقطع الاتصال" });
      await expect(alert).toBeVisible();
      await expect(page.getByText("Failed to fetch")).toHaveCount(0);
      await shot(page, `${tag}-1b-scan-failed`, '[role="alert"]');
      await page.getByRole("button", { name: /أعد المحاولة بالصورة نفسها/ }).click();
      await expect(page.getByText("كرواسون").first()).toBeVisible();
      expect(w.scanCalls).toBe(2);

      // الملفّ نفسه مرّةً ثالثة ⇒ الحصيلة من الذاكرة، بلا نداء مدفوع.
      await page.getByRole("button", { name: "صورة أخرى" }).click();
      await pickImage(page);
      await expect(page.getByText("كرواسون").first()).toBeVisible();
      expect(w.scanCalls, "الصورة نفسها قُرئت ثانيةً").toBe(2);

      await page.getByRole("button", { name: /راجع الأصناف/ }).click();
      await expect(page.getByLabel("اسم الصنف 3")).toHaveValue("كرواسون");

      // المغادرة قبل الحفظ لا تُضيّع القراءة ولا تُعيدها.
      await page.reload();
      await expect(page.getByLabel("اسم الصنف 3")).toHaveValue("كرواسون");
      expect(w.scanCalls).toBe(2);

      // صنفٌ بلا سعر يمنع الحفظ — لا صفرَ مخترَع.
      await page.getByRole("button", { name: /احفظ 3 صنفاً/ }).click();
      await expect(page.getByRole("alert").filter({ hasText: "بلا سعر" })).toBeVisible();
      expect(w.dishes).toHaveLength(0);
      await page.getByLabel("سعر الصنف 3").fill("11");
      await expect(page.getByRole("alert").filter({ hasText: "بلا سعر" })).toHaveCount(0);
      await shot(page, `${tag}-1c-review`, '[aria-label="اسم الصنف 2"]');
      if (size.width === 320) await noSideScroll(page, 320);
      await page.getByRole("button", { name: /احفظ 3 صنفاً/ }).click();

      // ── ٢: الطابع — يرتّب ويعاين ولا يكتب قبل «طبّق» ──
      await expect(page.getByText("الخطوة 2 من 4")).toBeVisible();
      expect(w.dishes.map((d) => d.price)).toEqual([12, 18, 11]);
      const grid = page.locator("[data-setup-themes]");
      await expect(grid.locator(":scope > div").first().getByText("محمصة", { exact: true })).toBeVisible();
      await expect(grid.getByText("يناسب نوع نشاطك")).toHaveCount(1);
      await grid.getByRole("button", { name: /محمصة/ }).click();
      await expect(grid.getByRole("button", { name: /محمصة/ })).toHaveAttribute("aria-pressed", "true");
      await page.waitForTimeout(600);
      expect(w.menuWrites, "المُنتقي كتب طابعاً باللمس").toEqual([]);
      await shot(page, `${tag}-2-look`, "[data-setup-themes]");
      if (size.width === 320) await noSideScroll(page, 320);
      await page.getByRole("button", { name: "طبّق «محمصة»" }).click();

      // ── ٣: الشعار واللون ──
      await expect(page.getByText("الخطوة 3 من 4")).toBeVisible();
      expect(w.menuWrites).toEqual([JSON.stringify({ theme: "roastery" })]);
      await page.getByRole("radio", { name: "#1f7a72" }).click();
      await page.getByRole("button", { name: "طبّق اللون" }).click();
      await expect(page.getByText("طُبّق ✓")).toBeVisible();
      expect(w.menuWrites.at(-1)).toBe(JSON.stringify({ theme: "roastery:#1f7a72" }));
      expect(w.restaurants[0].cover_color).toBe("#1f7a72");
      await shot(page, `${tag}-3-brand`);
      if (size.width === 320) await noSideScroll(page, 320);
      await page.getByRole("button", { name: /التالي: النشر/ }).click();

      // ── ٤: النشر — الرابط من `menuUrl` لا من يد ──
      await expect(page.getByText("الخطوة 4 من 4")).toBeVisible();
      await expect(page.locator("[data-setup-url]")).toHaveText(new RegExp(`/${SLUG}$`));
      await expect(page.getByRole("link", { name: /واتساب/ })).toHaveAttribute("href", new RegExp(`${SLUG}`));
      await expect(page.locator('iframe[title="معاينة منيوك"]')).toHaveAttribute("src", new RegExp(`/${SLUG}\\?preview=1$`));
      await shot(page, `${tag}-4-publish`, "[data-setup-url]");
      // المعاينة هي المنيو الحقيقي بوضع المعاينة — يُرسم فيها اسم المطعم.
      await page.locator('iframe[title="معاينة منيوك"]').scrollIntoViewIfNeeded();
      await expect(page.frameLocator('iframe[title="معاينة منيوك"]').getByText("مقهى المسار").first()).toBeVisible();
      await shot(page, `${tag}-4b-preview`, 'iframe[title="معاينة منيوك"]');
      if (size.width === 320) await noSideScroll(page, 320);

      // يُستأنف من حيث توقّف — لا من البداية.
      await page.reload();
      await expect(page.getByText("الخطوة 4 من 4")).toBeVisible();

      await page.getByRole("button", { name: /تمّ — إلى لوحتي/ }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByText("أكمل إعداد منيوك")).toHaveCount(0);
      expect(w.scanCalls, "نداءات القراءة المدفوعة").toBe(2);

      expect(crashes, crashes.join("\n")).toEqual([]);
    });
  });
}

test("التخطّي في أي لحظة يُحفظ — وبطاقة «أكمل إعداد منيوك» تعيده إلى حيث توقّف", async ({ page }) => {
  const { crashes } = watch(page);
  const w = await mockNetwork(page);
  // مطعمٌ قائم بلا أصناف — كأنه خرج بعد التسجيل.
  w.restaurants = [{ id: RID, user_id: UID, name: "مقهى المسار", slug: SLUG, type: "كافيه", created_at: new Date(now).toISOString() }];
  w.menus = [{ id: MID, restaurant_id: RID, user_id: UID, name: "القائمة الرئيسية", theme: "dark-gold", active: true, created_at: new Date(now).toISOString() }];

  await page.goto("/dashboard/setup");
  await expect(page.getByText("الخطوة 1 من 4")).toBeVisible();
  // «لاحقاً» في الأصناف ⇒ إلى الطابع، وتُحسب متخطّاةً لا منجزة.
  await page.getByRole("button", { name: "لاحقاً" }).click();
  await expect(page.getByText("الخطوة 2 من 4")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "تقدّم الإعداد" })).toHaveAttribute("aria-valuenow", "25");

  await page.getByRole("link", { name: "أكمل لاحقاً" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const card = page.getByText("أكمل إعداد منيوك");
  await expect(card).toBeVisible();
  await page.getByRole("link", { name: /أكمل من حيث توقّفت/ }).click();
  await expect(page.getByText("الخطوة 2 من 4")).toBeVisible();

  // الإخفاء نهائي.
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "إخفاء بطاقة الإعداد" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: /أهلاً/ })).toBeVisible();
  await expect(page.getByText("أكمل إعداد منيوك")).toHaveCount(0);
  expect(w.menuWrites).toEqual([]);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("فشل جلب الأصناف لا يُبدأ من «أضِف أصنافك» — بل «أعد المحاولة»", async ({ page }) => {
  const { crashes } = watch(page);
  const w = await mockNetwork(page);
  w.restaurants = [{ id: RID, user_id: UID, name: "مقهى المسار", slug: SLUG, type: "كافيه", created_at: new Date(now).toISOString() }];
  w.menus = [{ id: MID, restaurant_id: RID, user_id: UID, name: "القائمة الرئيسية", theme: "dark-gold", active: true }];
  w.dishes = [{ id: "d1", restaurant_id: RID, menu_id: MID, name: "لاتيه", price: 18 }];
  let down = true;
  await page.route(/\/rest\/v1\/dishes/, (route) =>
    down ? route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' }) : route.fallback()
  );

  await page.goto("/dashboard/setup");
  const retry = page.getByRole("button", { name: "أعد المحاولة" });
  await expect(retry).toBeVisible();
  await expect(page.getByRole("button", { name: /صوّر منيوك/ })).toHaveCount(0);

  down = false;
  await retry.click();
  // له صنف ⇒ يُستأنف من الطابع، لا من الأصناف.
  await expect(page.getByText("الخطوة 2 من 4")).toBeVisible();
  expect(crashes, crashes.join("\n")).toEqual([]);
});
