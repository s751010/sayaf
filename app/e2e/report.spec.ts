/**
 * تقرير الأسبوع — `/dashboard/report`.
 *
 * الحساب مفحوصٌ بأرقامه في `weekly-report.test.ts`؛ وهذا يفحص ما لا تفحصه
 * الدوالّ الخالصة: أن الشاشة تُقلع بخطّافاتها، وتعرض الأرقام نفسها، و**تفرّق
 * بين الفشل والفراغ** (الدرس ٣٢)، وتسع ٣٢٠px بلا تمرير أفقي ببياناتٍ مُجهَدة.
 *
 * الشبكة مُحاكاة كلّها كما في `dashboard.spec.ts`، والساعة **مثبّتة** (الدرس ٥٢):
 * الثلاثاء ٢٧/١٠/٢٠٢٦ الساعة ١٤:٠٠ بتوقيت الرياض — فحدود الأسبوع لا تتبع
 * ساعة العدّاء.
 */
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";

const FIXED = new Date("2026-10-27T11:00:00Z");
const NOW = FIXED.getTime();

const UID = "00000000-0000-4000-8000-000000000001";
const RID = "00000000-0000-4000-8000-0000000000aa";
const MID = "00000000-0000-4000-8000-0000000000bb";

const baseRestaurant = {
  id: RID,
  user_id: UID,
  name: "مقهى الفحص",
  slug: "e2e-cafe",
  type: "مقهى",
  logo: "☕",
  created_at: "2026-10-01T00:00:00Z",
  english_enabled: false,
  loyalty_enabled: false,
  accepting_orders: false,
  online_payment_enabled: false,
  api_enabled: false,
  prices_include_vat: true,
  min_order_amount: 0,
};

const menus = [
  { id: MID, restaurant_id: RID, user_id: UID, name: "المنيو", theme: "dark-gold", active: true, language: "ar", created_at: "2026-10-01T00:00:00Z" },
];

/** الاسم الطويل مُجهِدٌ عمداً (الدرس ٤٦): بيانات `/demo` ألطف من مطعمٍ حقيقي. */
const LONG = "سندويتش دجاج مشوي بالأعشاب الجبلية وصلصة الثوم والليمون مع بطاطس مقرمشة";
const dishes = [
  { id: "d1", menu_id: MID, restaurant_id: RID, user_id: UID, name: "لاتيه", category: "مشروبات", price: 18, available: true, sort_order: 0, views: 40, created_at: "2026-10-01T00:00:00Z" },
  { id: "d2", menu_id: MID, restaurant_id: RID, user_id: UID, name: "قهوة مقطّرة", category: "مشروبات", price: 14, available: true, sort_order: 1, views: 3, created_at: "2026-10-01T00:00:00Z" },
  { id: "d3", menu_id: MID, restaurant_id: RID, user_id: UID, name: LONG, category: "مخبوزات", price: 1234.5, available: true, sort_order: 2, views: 9, created_at: "2026-10-01T00:00:00Z" },
];

const a = (date: string, hour: number, views: number, dish_id: string | null = null) => ({
  id: `${date}-${hour}-${dish_id ?? "m"}`, menu_id: MID, user_id: UID, date, hour, views, dish_id, table_no: null, lang: "ar",
});

/**
 * هذا الأسبوع (الأحد ٢٥ ⇐ الآن): ٦ + ٩ + ٣ = ١٨ فتحاً للمنيو.
 * والمدّة نفسها قبل أسبوع (حتى الثلاثاء ٢٠ الساعة ١٤): ٤ + ٥ = ٩ ⇒ ▲ ١٠٠٪.
 * والخميس ٢٢ (٣٠) خارج المقارنة الجارية وداخل «الأسبوع الماضي» كاملاً: ٣٩.
 * والذي قبله: ١٣ ⇒ ▲ ٢٠٠٪.
 */
const analytics = [
  a("2026-10-25", 20, 6),
  a("2026-10-26", 21, 9),
  a("2026-10-27", 10, 3),
  a("2026-10-26", 21, 5, "d1"),
  a("2026-10-27", 10, 2, "d3"),
  a("2026-10-18", 20, 4),
  a("2026-10-19", 21, 5),
  a("2026-10-22", 21, 30),
  a("2026-10-15", 20, 13),
];

/** طلبان حيّان هذا الأسبوع (٢٥٫٥ + ٣٠) وملغى؛ وطلبٌ واحد في المدّة المقابلة. */
const orders = [
  { status: "picked_up", total: 25.5, created_at: "2026-10-25T09:00:00Z" },
  { status: "new", total: 30, created_at: "2026-10-27T08:00:00Z" },
  { status: "cancelled", total: 900, created_at: "2026-10-26T08:00:00Z" },
  { status: "picked_up", total: 20, created_at: "2026-10-19T09:00:00Z" },
];

const subscriptions = [
  { id: "s1", user_id: UID, plan_id: "standard", active: true, start_date: new Date(NOW - 5 * 864e5).toISOString(), end_date: new Date(NOW + 300 * 864e5).toISOString(), created_at: new Date(NOW - 5 * 864e5).toISOString() },
];

const session = {
  access_token: "e2e.mock.token",
  refresh_token: "e2e-refresh",
  expires_at: Math.floor(NOW / 1000) + 86400,
  user: { id: UID, email: "e2e@example.com" },
};

type Opts = { rows?: unknown[]; ordersOn?: boolean };

async function signedIn(page: Page, opts: Opts = {}): Promise<void> {
  const restaurant = { ...baseRestaurant, online_payment_enabled: Boolean(opts.ordersOn) };
  const rows = opts.rows ?? analytics;
  const bodyFor = (url: URL, method: string): unknown => {
    const p = url.pathname;
    if (p.includes("/auth/v1/user")) return session.user;
    if (p.includes("/auth/v1/")) return session;
    if (p.includes("/rpc/is_menu_published")) return true;
    if (p.includes("/rpc/is_founder")) return false;
    if (p.includes("/rpc/")) return [];
    if (method !== "GET" && method !== "HEAD") return [];
    const table = p.split("/rest/v1/")[1] ?? "";
    if (table.startsWith("restaurants")) return [restaurant];
    if (table.startsWith("menus")) return menus;
    if (table.startsWith("dishes")) return dishes;
    if (table.startsWith("subscriptions")) return subscriptions;
    if (table.startsWith("analytics")) return rows;
    // استعلام التقرير وحده يحمل `created_at=gte` — والجرس (`status=eq.new`) يأخذ لا شيء.
    if (table.startsWith("orders")) return url.search.includes("created_at=gte") ? orders : [];
    return [];
  };
  await page.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const body = bodyFor(new URL(req.url()), req.method());
    const n = Array.isArray(body) ? body.length : 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": `0-${Math.max(n - 1, 0)}/${n}`, "access-control-expose-headers": "content-range" },
      body: JSON.stringify(body),
    });
  });
  await page.clock.setFixedTime(FIXED);
  await page.addInitScript((s) => localStorage.setItem("cm2_session", JSON.stringify(s)), session);
}

/** بطاقة الرقم باسمها — النصّ وحده يتكرّر في أماكن أخرى من الشاشة. */
const tile = (page: Page, label: string) => page.getByRole("group", { name: label, exact: true });

test("التقرير يُقلع بأرقام الأسبوع ومقارنته — ويبدّل إلى الأسبوع الماضي", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page);
  await page.goto("/dashboard/report");

  await expect(page.getByRole("heading", { name: "تقرير الأسبوع" })).toBeVisible();
  await expect(page.getByText("الأحد 25/10 — اليوم 27/10")).toBeVisible();

  const views = tile(page, "فتح المنيو");
  await expect(views.getByText("18", { exact: true })).toBeVisible();
  await expect(views.getByText("▲ 100%")).toBeVisible();

  await expect(page.getByText(/الاثنين 26\/10 · الزيارات/)).toBeVisible();
  // سبعة أيام من الأحد: الاثنين ٩، والأربعاء لم يأتِ بعد ⇒ «—» لا «0».
  const days = page.getByRole("list", { name: "فتح المنيو في كل يوم" }).getByRole("listitem");
  await expect(days).toHaveCount(7);
  await expect(days.nth(0)).toContainText("الأحد");
  await expect(days.nth(1)).toContainText("9");
  await expect(days.nth(3)).toContainText("—");
  const top = page.getByRole("list", { name: "الأكثر فتحاً هذا الأسبوع" }).getByRole("listitem");
  await expect(top).toHaveCount(2);
  await expect(top.first()).toContainText("لاتيه");
  await expect(top.first()).toContainText("5");
  await expect(page.getByText("1 طبقاً لم يفتحه أحد هذا الأسبوع")).toBeVisible();
  await expect(page.getByText("قهوة مقطّرة", { exact: true })).toBeVisible();
  // الخطوة التالية من السلّم نفسه الذي في الرئيسية (أطباقٌ بلا صور).
  await expect(page.getByText("خطوتك التالية")).toBeVisible();
  // بلا بوّابة: لا قسم طلبات — لا «صفر طلب».
  await expect(page.getByText("الطلبات", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "الأسبوع الماضي" }).click();
  await expect(page.getByText("الأحد 18/10 — السبت 24/10")).toBeVisible();
  await expect(views.getByText("39", { exact: true })).toBeVisible();
  await expect(views.getByText("▲ 200%")).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("فشل الشبكة يعرض «أعد المحاولة» لا أسبوعاً فارغاً — والإعادة تُصلحه", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page);
  let down = true;
  await page.route(/\/rest\/v1\/analytics/, (route) =>
    down
      ? route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' })
      : route.fallback()
  );
  await page.goto("/dashboard/report");

  const retry = page.getByRole("button", { name: "أعد المحاولة" });
  await expect(retry).toBeVisible();
  await expect(page.getByText("تعذّر تحميل التقرير")).toBeVisible();
  await expect(page.getByText(/لا زيارة لمنيوك/)).toHaveCount(0);

  down = false;
  await retry.click();
  await expect(tile(page, "فتح المنيو").getByText("18", { exact: true })).toBeVisible();
  await expect(retry).toHaveCount(0);

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("أسبوعٌ بلا زيارة يقول ذلك — ويعرض طريقاً لأوّل زبون", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, { rows: [] });
  await page.goto("/dashboard/report");

  await expect(page.getByText("لا زيارة لمنيوك منذ الأحد بعد")).toBeVisible();
  await expect(page.getByRole("link", { name: "اطبع كود QR" })).toBeVisible();
  await expect(page.getByRole("button", { name: "اعرض الأسبوع الماضي" })).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("لمن ربط بوّابة: الطلبات والإيراد بتوقيت الرياض، والملغى خارجها", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, { ordersOn: true });
  await page.goto("/dashboard/report");

  const count = tile(page, "الطلبات");
  await expect(count.getByText("2", { exact: true })).toBeVisible();
  await expect(count.getByText("▲ 100%")).toBeVisible();
  await expect(tile(page, "الإيراد (ر.س)").getByText("55.5", { exact: true })).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("بطاقة «هذا الأسبوع» في الرئيسية تقود إلى التقرير بالرقم نفسه", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page);
  await page.goto("/dashboard");

  const card = page.locator("div", { has: page.getByRole("link", { name: /تقرير الأسبوع/ }) }).last();
  await expect(page.getByText(/منيوك شوهد/)).toContainText("18");
  await card.getByRole("link", { name: /تقرير الأسبوع/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/report$/);
  await expect(tile(page, "فتح المنيو").getByText("18", { exact: true })).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test.describe("التقرير على ٣٢٠px", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const mode of ["هذا الأسبوع", "الأسبوع الماضي"]) {
    test(`«${mode}» بالطلبات والاسم الطويل بلا تمرير أفقي`, async ({ page }) => {
      const { crashes } = watch(page);
      await signedIn(page, { ordersOn: true });
      await page.goto("/dashboard/report");
      await page.getByRole("button", { name: mode }).click();
      await expect(tile(page, "الطلبات")).toBeVisible();
      await page.waitForLoadState("networkidle");

      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(320);
      expect(crashes, crashes.join("\n")).toEqual([]);
    });
  }
});
