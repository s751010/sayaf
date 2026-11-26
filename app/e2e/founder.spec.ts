/**
 * لوحة المؤسّس — البوّابة والأقسام الستّة بشبكة مُحاكاة.
 *
 * ═══ لماذا وُجد ═══
 *
 * قال المالك: «ما اشتغلت معي مهما حصل». والعطل كان في البوّابة وحدها: تسأل
 * دالّة حافة لا يحتاجها أيّ قسم. فالفحص هنا يثبت المسارين اللذين يهمّانه:
 * المؤسّس يدخل فيرى «اليوم»، وغير المؤسّس يرى **الإيميل الذي دخل به** وسبب
 * الرفض — لا جملةً تتّهم كلمة المرور.
 */
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";

const UID = "00000000-0000-4000-8000-000000000009";
const now = Date.now();
const iso = (d: number) => new Date(now + d * 864e5).toISOString();

const session = {
  access_token: "e2e.mock.token",
  refresh_token: "e2e-refresh",
  expires_at: Math.floor(now / 1000) + 86400,
  user: { id: UID, email: "owner@example.com" },
};

const overview = {
  revenue_total: 1188, revenue_30d: 99, restaurants_total: 3, restaurants_new_7d: 1, restaurants_no_dish: 1,
  menus_total: 3, dishes_total: 40, users_total: 3, subs_active: 2, subs_trial: 1, subs_paid: 1,
  subs_expiring_7d: 1, views_30d: 420, views_7d: 96, tickets_open: 1, tickets_unread: 1,
};

const merchants = [
  { id: "r1", name: "مقهى الورد", slug: "ward", logo: null, created_at: iso(-2), owner_id: UID, owner_email: "a@x.com", menus_count: 1, active_menus: 1, dishes_count: 0, views_30d: 4, last_view: iso(-1), sub_plan: "trial", sub_end: iso(5), sub_active: true, tickets_open: 1, has_staff_pin: false, loyalty_count: 0 },
  { id: "r2", name: "مشاوي البيت", slug: "bait", logo: null, created_at: iso(-40), owner_id: UID, owner_email: "b@x.com", menus_count: 1, active_menus: 1, dishes_count: 24, views_30d: 300, last_view: iso(0), sub_plan: "standard", sub_end: iso(200), sub_active: true, tickets_open: 0, has_staff_pin: true, loyalty_count: 12 },
];

const subscriptions = [
  { id: "s1", user_id: UID, plan_id: "trial", payment_ref: null, start_date: iso(-9), end_date: iso(5), active: true, cancelled_at: null, created_at: iso(-9) },
];

const orders = [
  { id: "o1", restaurant_id: "r2", status: "picked_up", total: 42, created_at: iso(0), paid_at: iso(0) },
  { id: "o2", restaurant_id: "r2", status: "new", total: 18, created_at: iso(-1), paid_at: iso(-1) },
];

const contacts = [
  { id: "r1", phone: "0551234567", social_whatsapp: null },
  { id: "r2", phone: null, social_whatsapp: null },
];

const tickets = [
  { id: "t1", subject: "كيف أغيّر الشعار؟", message: "ما لقيت مكان الشعار", email: "a@x.com", restaurant_name: "مقهى الورد", status: "open", admin_reply: null, admin_read: false, created_at: iso(0) },
];

function mock(page: Page, founder: boolean) {
  return page.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    let body: unknown = [];
    if (p.includes("/auth/v1/user")) body = session.user;
    else if (p.includes("/auth/v1/")) body = session;
    else if (p.endsWith("/rpc/is_founder")) body = founder;
    else if (p.endsWith("/rpc/founder_overview")) body = [overview];
    else if (p.endsWith("/rpc/founder_merchants")) body = merchants;
    else if (p.includes("/rpc/")) body = [];
    else if (req.method() === "GET" && p.endsWith("/support_tickets")) body = tickets;
    else if (req.method() === "GET" && p.endsWith("/subscriptions")) body = subscriptions;
    else if (req.method() === "GET" && p.endsWith("/orders")) body = orders;
    else if (req.method() === "GET" && p.endsWith("/restaurants") && url.search.includes("phone")) body = contacts;
    else if (req.method() === "GET" && p.endsWith("/restaurants")) body = merchants.map((m) => ({ id: m.id, slug: m.slug, created_at: m.created_at }));
    else if (req.method() === "GET" && p.endsWith("/analytics")) body = [{ date: iso(0).slice(0, 10), views: 7, menu_id: "m" }];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/1", "access-control-expose-headers": "content-range" },
      body: JSON.stringify(body),
    });
  });
}

async function signedIn(page: Page, founder: boolean) {
  await mock(page, founder);
  await page.addInitScript((s) => localStorage.setItem("cm2_session", JSON.stringify(s)), session);
}

test("المؤسّس يدخل فيرى «اليوم» وما ينتظره", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, true);
  await page.goto("/founder");

  await expect(page.getByRole("heading", { name: "وش ينتظرك اليوم" })).toBeVisible();
  await expect(page.getByText("تذكرة دعم ما قريتها")).toBeVisible();
  await expect(page.getByText("مطعم سجّل وما أضاف ولا طبق")).toBeVisible();
  await expect(page.getByText("مقهى الورد").first()).toBeVisible();

  // الأقسام الأكثر استعمالاً ظاهرة بلا تمرير على الجهازين.
  const nav = page.getByRole("navigation", { name: "أقسام لوحتي" }).locator("visible=true");
  for (const label of ["اليوم", "التجّار", "الدعم", "الفلوس"]) {
    await expect(nav.getByRole("link", { name: new RegExp(label) })).toBeInViewport();
  }
  await expect(page.getByText("آخر ما حصل")).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("الدعم: التذكرة تُفتح ويُكتب الردّ في حقل لا نافذة نظام", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, true);
  await page.goto("/founder/support");

  await page.getByRole("button", { name: /كيف أغيّر الشعار/ }).click();
  await page.getByPlaceholder(/اكتب ردّك/).fill("من «التصميم» ⇐ الشعار");
  await expect(page.getByRole("button", { name: "أرسل الرد" })).toBeEnabled();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("مهامي تُرسم بمجموعاتها", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, true);
  await page.goto("/founder/tasks");

  await expect(page.getByRole("heading", { name: "مهامي" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "قبل أوّل ريال" })).toBeVisible();
  await expect(page.getByText("اختر دومين الموقع")).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("غير المؤسّس يرى الإيميل الذي دخل به وسبب الرفض", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, false);
  await page.goto("/founder");

  await expect(page.getByRole("heading", { name: "هذا الحساب ما يفتح لوحتك" })).toBeVisible();
  await expect(page.getByText("owner@example.com").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "ادخل بإيميل ثاني" })).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("بلا جلسة: شاشة دخول واحدة بلا سرّ احتياطي", async ({ page }) => {
  const { crashes } = watch(page);
  await mock(page, false);
  await page.goto("/founder");

  await expect(page.getByRole("heading", { name: "لوحتي" })).toBeVisible();
  await expect(page.getByLabel("الإيميل")).toBeVisible();
  await expect(page.getByText(/سر المؤسس/)).toHaveCount(0);

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("الأقسام الجديدة تُقلع: الاشتراكات · الطلبات · التسويق · الفنّي", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, true);

  await page.goto("/founder/subscriptions");
  await expect(page.getByRole("heading", { name: "الاشتراكات", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "مدّد أسبوع" }).first()).toBeVisible();

  await page.goto("/founder/orders");
  await expect(page.getByRole("heading", { name: "الطلبات", exact: true })).toBeVisible();
  await expect(page.getByText("مشاوي البيت").first()).toBeVisible();

  await page.goto("/founder/marketing");
  await expect(page.getByRole("heading", { name: "حملات واتساب" })).toBeVisible();
  // «مقهى الورد» تجربته تخلص خلال ٥ أيام — والشريحة الأعجل تغلب «بلا أطباق».
  await page.getByRole("button", { name: /تجربتهم تخلص قريب/ }).click();
  await expect(page.getByRole("link", { name: /واتساب/ }).first()).toHaveAttribute("href", /^https:\/\/wa\.me\/966551234567\?text=/);

  await page.goto("/founder/tech");
  await expect(page.getByRole("heading", { name: "الفنّي", exact: true })).toBeVisible();
  await expect(page.getByText("فحص حيّ الحين")).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("البحث يجد التاجر ويفتح بطاقته", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page, true);
  await page.goto("/founder");

  await page.getByRole("button", { name: "ابحث عن تاجر" }).locator("visible=true").first().click();
  await page.getByRole("textbox", { name: "ابحث عن تاجر" }).fill("مشاوي");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/founder\/merchants\/r2$/);

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("الروابط القديمة تتحوّل لمكانها الجديد", async ({ page }) => {
  await signedIn(page, true);
  await page.goto("/founder/health");
  await expect(page).toHaveURL(/\/founder\/tech$/);
  await page.goto("/founder/comms");
  await expect(page).toHaveURL(/\/founder\/marketing\?tab=content$/);
});
