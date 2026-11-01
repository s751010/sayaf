/**
 * فشل الجلب ليس «فارغاً» (الدرس ٣٢ · القاعدة «ج»).
 *
 * كان فشل جلب القوائم يُحسم `[]` فتعرض «القوائم» «أنشئ القائمة الأولى» لتاجرٍ
 * له قائمة — ومن ضغطها أنشأ ثانية. وكان فشل جلب الأطباق يجعل الرئيسية تقول
 * «منيوك فارغ». هذا الفحص يُسقط الجلب ثم يعيده، ويتأكّد أن الشاشة تقول «تعذّر»
 * لا «فارغ»، وأن «أعد المحاولة» تُرجع البيانات.
 */
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";

const FIXED = new Date("2026-10-27T11:00:00Z");
const NOW = FIXED.getTime();
const UID = "00000000-0000-4000-8000-000000000001";
const RID = "00000000-0000-4000-8000-0000000000aa";
const MID = "00000000-0000-4000-8000-0000000000bb";

const restaurant = {
  id: RID, user_id: UID, name: "مقهى الفحص", slug: "e2e-cafe", type: "مقهى", logo: "☕",
  created_at: "2026-10-01T00:00:00Z", english_enabled: false, loyalty_enabled: false,
  accepting_orders: false, online_payment_enabled: false, api_enabled: false,
  prices_include_vat: true, min_order_amount: 0,
};
const menus = [
  { id: MID, restaurant_id: RID, user_id: UID, name: "قائمة الإفطار", theme: "dark-gold", active: true, language: "ar", created_at: "2026-10-01T00:00:00Z" },
];
const dishes = [
  { id: "d1", menu_id: MID, restaurant_id: RID, user_id: UID, name: "لاتيه", category: "مشروبات", price: 18, available: true, sort_order: 0, views: 40, created_at: "2026-10-01T00:00:00Z" },
];
const subscriptions = [
  { id: "s1", user_id: UID, plan_id: "standard", active: true, start_date: new Date(NOW - 5 * 864e5).toISOString(), end_date: new Date(NOW + 300 * 864e5).toISOString(), created_at: new Date(NOW - 5 * 864e5).toISOString() },
];
const session = {
  access_token: "e2e.mock.token", refresh_token: "e2e-refresh",
  expires_at: Math.floor(NOW / 1000) + 86400, user: { id: UID, email: "e2e@example.com" },
};

/** `failing` جدولٌ يردّ ٥٠٠ ما دام مفتاحه `true` — يُطفأ ليثبت «أعد المحاولة». */
async function signedIn(page: Page, failing: { menus?: boolean; dishes?: boolean }): Promise<void> {
  await page.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const table = p.split("/rest/v1/")[1] ?? "";
    if ((failing.menus && table.startsWith("menus")) || (failing.dishes && table.startsWith("dishes"))) {
      await route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' });
      return;
    }
    let body: unknown = [];
    if (p.includes("/auth/v1/user")) body = session.user;
    else if (p.includes("/auth/v1/")) body = session;
    else if (p.includes("/rpc/is_menu_published")) body = true;
    else if (p.includes("/rpc/is_founder")) body = false;
    else if (req.method() === "GET" || req.method() === "HEAD") {
      if (table.startsWith("restaurants")) body = [restaurant];
      else if (table.startsWith("menus")) body = menus;
      else if (table.startsWith("dishes")) body = dishes;
      else if (table.startsWith("subscriptions")) body = subscriptions;
    }
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

test("القوائم: فشل الجلب يعرض «تعذّر» لا «أنشئ القائمة الأولى» — وإعادة المحاولة تُرجعها", async ({ page }) => {
  const { crashes } = watch(page);
  const failing = { menus: true };
  await signedIn(page, failing);
  await page.goto("/dashboard/menus");

  await expect(page.getByText("تعذّر تحميل قوائمك")).toBeVisible();
  await expect(page.getByRole("button", { name: /أنشئ القائمة الأولى/ })).toHaveCount(0);

  failing.menus = false;
  await page.getByRole("button", { name: "أعد المحاولة" }).click();
  await expect(page.getByText("قائمة الإفطار").first()).toBeVisible();
  await expect(page.getByText("تعذّر تحميل قوائمك")).toHaveCount(0);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("الرئيسية: فشل جلب الأطباق لا يقول «منيوك فارغ» — وإعادة المحاولة تُرجعها", async ({ page }) => {
  const { crashes } = watch(page);
  const failing = { dishes: true };
  await signedIn(page, failing);
  await page.goto("/dashboard");

  await expect(page.getByText("تعذّر تحميل أرقام لوحتك")).toBeVisible();
  await expect(page.getByText(/منيوك فارغ/)).toHaveCount(0);
  await expect(page.getByText("أضف أول طبق لمنيوك")).toHaveCount(0);

  failing.dishes = false;
  await page.getByRole("button", { name: "أعد المحاولة" }).click();
  await expect(page.getByText("تعذّر تحميل أرقام لوحتك")).toHaveCount(0);
  await expect(page.getByText("لاتيه").first()).toBeVisible();
  expect(crashes, crashes.join("\n")).toEqual([]);
});
