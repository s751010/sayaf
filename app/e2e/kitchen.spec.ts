/**
 * شاشة الكاشير وجرس الطلبات — بجلسة مزروعة وشبكة مُحاكاة كاملة.
 *
 * ═══ ما يُفحص هنا ولا يُفحص في الدوالّ الخالصة ═══
 *
 * `order-alerts.test.ts` يحرس منطق «جديد» والرنّة الواحدة. وهنا ما لا يظهر إلا
 * في متصفّح: الشاشة تُقلع ولا تنهار (الخطّافات، الدرس ٩)، والزرّ يرسل الحالة
 * الصحيحة إلى الطلب الصحيح، والفشل يقول «لم نصل» لا «لا طلبات»، والتراجع يمنع
 * إغراق الشبكة، واللوح بعرضيه وطوليه بلا فيض — ببيانات مُجهَدة (الدرس ٤٦):
 * اسمٌ طويل، وخيارات طويلة، وملاحظة طويلة، وطلبٌ بخمسة أصناف.
 *
 * لا يُلمس مشروعٌ حقيقي: كل طلب إلى Supabase يُردّ من هنا.
 */
import { expect, test, type Page, type Route } from "@playwright/test";
import { watch } from "./watch";

const UID = "00000000-0000-4000-8000-000000000001";
const RID = "00000000-0000-4000-8000-0000000000aa";

const restaurant = {
  id: RID,
  user_id: UID,
  name: "مقهى الفحص",
  slug: "e2e-cafe",
  type: "مقهى",
  logo: "☕",
  created_at: "2026-10-01T00:00:00Z",
  english_enabled: false,
  loyalty_enabled: false,
  accepting_orders: true,
  online_payment_enabled: true,
  api_enabled: false,
  prices_include_vat: true,
  min_order_amount: 0,
  prep_minutes: 15,
};

const now = Date.now();
const ago = (min: number) => new Date(now - min * 60_000).toISOString();

const subscriptions = [
  { id: "s1", user_id: UID, plan_id: "standard", active: true, start_date: ago(5 * 1440), end_date: new Date(now + 300 * 864e5).toISOString(), created_at: ago(5 * 1440) },
];

const session = {
  access_token: "e2e.mock.token",
  refresh_token: "e2e-refresh",
  expires_at: Math.floor(now / 1000) + 86400,
  user: { id: UID, email: "e2e@example.com" },
};

type Row = {
  id: string;
  code: number;
  status: string;
  total: number;
  vat_included: boolean;
  created_at: string;
  paid_at: string | null;
  ready_eta: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  note: string | null;
  order_items: { name: string; options_label: string | null; qty: number; line_total: number }[];
};

/** بيانات مُجهَدة: أطول ما يكتبه بشر في حقلٍ حرّ. */
function freshOrders(): Row[] {
  return [
    {
      id: "o1", code: 117, status: "new", total: 96, vat_included: true,
      created_at: ago(2), paid_at: ago(2), ready_eta: new Date(now + 13 * 60_000).toISOString(),
      customer_name: "عبدالرحمن بن عبدالعزيز آل عبدالمحسن العتيبي",
      customer_phone: "0500000000",
      note: "بدون سكر نهائياً لو سمحت، والحليب يكون خالي من اللاكتوز، وأبي الكوب كبير مع غطاء محكم لأني بالسيارة",
      order_items: [
        { name: "لاتيه إسباني بارد بحليب الشوفان", options_label: "حجم كبير · شوت إضافي · حليب شوفان · بدون ثلج · صوص كراميل مملّح", qty: 2, line_total: 52 },
        { name: "كرواسون زعتر", options_label: null, qty: 1, line_total: 12 },
        { name: "كوكيز", options_label: null, qty: 3, line_total: 18 },
        { name: "ماء", options_label: null, qty: 1, line_total: 2 },
        { name: "قهوة مقطّرة V60 إثيوبي", options_label: "حارّة", qty: 1, line_total: 12 },
      ],
    },
    {
      id: "o2", code: 116, status: "preparing", total: 18, vat_included: true,
      created_at: ago(25), paid_at: ago(25), ready_eta: ago(5),
      customer_name: "سارة", customer_phone: null, note: null,
      order_items: [{ name: "لاتيه", options_label: null, qty: 1, line_total: 18 }],
    },
    {
      id: "o3", code: 115, status: "ready", total: 14, vat_included: true,
      created_at: ago(40), paid_at: ago(40), ready_eta: ago(30),
      customer_name: null, customer_phone: null, note: null,
      order_items: [{ name: "قهوة اليوم", options_label: null, qty: 1, line_total: 14 }],
    },
  ];
}

type Mock = {
  orders: Row[];
  /** `true` = طلبات الطلبات تفشل بـ٥٠٠ (الشبكة ساقطة). */
  down: boolean;
  patches: { url: string; body: unknown }[];
  /** طلبات `listOrders` (الشاشة) — بأصنافها. */
  listCalls: number;
};

function json(route: Route, body: unknown, status = 200) {
  const n = Array.isArray(body) ? body.length : 1;
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: { "content-range": `0-${Math.max(n - 1, 0)}/${n}`, "access-control-expose-headers": "content-range" },
    body: JSON.stringify(body),
  });
}

async function signedIn(page: Page, mock: Mock): Promise<void> {
  await page.route(/supabase\.co/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname;
    const method = req.method();
    if (p.includes("/auth/v1/user")) return json(route, session.user);
    if (p.includes("/auth/v1/")) return json(route, session);
    if (p.includes("/rpc/is_founder")) return json(route, false);
    if (p.includes("/rpc/")) return json(route, []);
    const table = p.split("/rest/v1/")[1] ?? "";
    if (table.startsWith("orders")) {
      if (method === "PATCH") {
        mock.patches.push({ url: req.url(), body: req.postDataJSON() });
        const id = url.searchParams.get("id")?.replace("eq.", "");
        const status = (req.postDataJSON() as { status: string }).status;
        mock.orders = mock.orders.map((o) => (o.id === id ? { ...o, status } : o));
        return route.fulfill({ status: 204, body: "" });
      }
      const select = url.searchParams.get("select") ?? "";
      if (select.includes("order_items")) mock.listCalls += 1;
      if (mock.down) return json(route, { message: "boom" }, 500);
      if (url.searchParams.get("status") === "eq.new") {
        return json(route, mock.orders.filter((o) => o.status === "new").map(({ id, code }) => ({ id, code })));
      }
      return json(route, mock.orders);
    }
    if (method !== "GET") return json(route, []);
    if (table.startsWith("restaurants")) return json(route, [restaurant]);
    if (table.startsWith("subscriptions")) return json(route, subscriptions);
    return json(route, []);
  });
  await page.addInitScript((s) => localStorage.setItem("cm2_session", JSON.stringify(s)), session);
}

const newMock = (): Mock => ({ orders: freshOrders(), down: false, patches: [], listCalls: 0 });

test("شاشة الكاشير: الرقم والاسم والأصناف وخياراتها والملاحظة — والزرّ ينقل الطلب", async ({ page }) => {
  const { crashes } = watch(page);
  const mock = newMock();
  await signedIn(page, mock);
  await page.goto("/dashboard/kitchen");

  await expect(page.getByRole("heading", { name: "شاشة الكاشير" })).toBeVisible();
  const ticket = page.getByRole("article", { name: "طلب رقم 117" });
  await expect(ticket).toBeVisible();
  await expect(ticket.getByText("117", { exact: true })).toBeVisible();
  await expect(ticket.getByText(/عبدالرحمن بن عبدالعزيز/)).toBeVisible();
  await expect(ticket.getByText(/لاتيه إسباني بارد/)).toBeVisible();
  await expect(ticket.getByText(/صوص كراميل مملّح/)).toBeVisible();
  await expect(ticket.getByText(/خالي من اللاكتوز/)).toBeVisible();
  // جوال الزبون لا يظهر على شاشةٍ مقابل الصالة.
  await expect(page.getByText("0500000000")).toHaveCount(0);

  // الرقم أكبر عنصر في البطاقة — ما يُنادى به.
  const codeSize = await ticket.getByText("117", { exact: true }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(codeSize).toBeGreaterThanOrEqual(44);

  // الطلب المتأخّر عن وعده يُقال صراحةً.
  await expect(page.getByRole("article", { name: "طلب رقم 116" }).getByText("تأخّر")).toBeVisible();

  await ticket.getByRole("button", { name: "ابدأ التحضير" }).click();
  await expect.poll(() => mock.patches.length).toBe(1);
  expect(mock.patches[0].url).toContain("id=eq.o1");
  expect(mock.patches[0].body).toEqual({ status: "preparing" });

  // انتقل إلى مسار «قيد التحضير» وصار زرّه التالي «جاهز للاستلام».
  const preparing = page.getByRole("region", { name: "قيد التحضير" });
  await expect(preparing.getByRole("article", { name: "طلب رقم 117" })).toBeVisible();
  await expect(
    preparing.getByRole("article", { name: "طلب رقم 117" }).getByRole("button", { name: "جاهز للاستلام" })
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "جديد" }).getByText("لا طلب جديد")).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("فشل الشبكة قبل أوّل جلب: «لم نصل» وإعادة — لا «لا طلبات»", async ({ page }) => {
  const { crashes } = watch(page);
  const mock = { ...newMock(), down: true };
  await signedIn(page, mock);
  await page.goto("/dashboard/kitchen");

  const retry = page.getByRole("button", { name: "أعد المحاولة" });
  await expect(retry).toBeVisible();
  await expect(page.getByText("لم نصل إلى طلباتك")).toBeVisible();
  await expect(page.getByText("لا طلب جديد")).toHaveCount(0);
  await expect(page.getByText(/لا طلبات/)).toHaveCount(0);

  mock.down = false;
  await retry.click();
  await expect(page.getByRole("article", { name: "طلب رقم 117" })).toBeVisible();
  await expect(retry).toHaveCount(0);

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("الشبكة ساقطة خمس دقائق: التراجع يمنع الإغراق", async ({ page }) => {
  /**
   * بلا تراجع: جولة كل ٢٠ث = ١٥ طلباً في خمس دقائق من كل لوح. ومع التراجع
   * (٢٠ ← ٤٠ ← ٨٠ ← ١٦٠ ← ٣٠٠ث) خمسةٌ أو ستّة. الساعة مزيّفة فلا ينتظر الفحص.
   */
  const mock = { ...newMock(), down: true };
  await page.clock.install();
  await signedIn(page, mock);
  await page.goto("/dashboard/kitchen");
  await expect(page.getByText("لم نصل إلى طلباتك")).toBeVisible();

  const before = mock.listCalls;
  for (let i = 0; i < 30; i++) await page.clock.runFor(10_000);
  const during = mock.listCalls - before;
  test.info().annotations.push({ type: "طلبات في ٥ دقائق", description: String(during) });
  expect(during).toBeGreaterThan(0);
  expect(during).toBeLessThanOrEqual(6);

  // وأوّل نجاح يُعيد الإيقاع ويعرض الطلبات. (الساعة تُستأنف: فحص «ثبات»
  // العنصر قبل الضغط ينتظر إطارات رسم، والساعة المزيّفة توقفها.)
  await page.clock.resume();
  mock.down = false;
  await page.getByRole("button", { name: "أعد المحاولة" }).click();
  await expect(page.getByRole("article", { name: "طلب رقم 117" })).toBeVisible();
});

test("شارة «الطلبات» تعدّ الجديد من أي صفحة، وتختفي حين تُفتح الطلبات", async ({ page }) => {
  const { crashes } = watch(page);
  const mock = newMock();
  await signedIn(page, mock);
  await page.goto("/dashboard/dishes");

  const link = page.getByRole("link", { name: /الطلبات.*1 طلب جديد/ }).first();
  await expect(link).toBeVisible();
  await expect(page).toHaveTitle(/^\(1\) /);

  await link.click();
  await expect(page.getByRole("link", { name: /افتح شاشة الكاشير/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /طلب جديد/ })).toHaveCount(0);
  await expect(page).not.toHaveTitle(/^\(\d/);

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test.describe("الجوال على ٣٢٠px", () => {
  /**
   * «الطلبات» على ٣٢٠ خارج الشريط الظاهر (يُمرَّر إليها) — فشارتها وحدها لا
   * تُرى. الشريط تحت الترويسة هو ما يراه التاجر، ولا يجوز أن يمدّ الصفحة.
   */
  test.use({ viewport: { width: 320, height: 640 } });

  test("شريط «طلب جديد ينتظرك» ظاهر بلا فيض، ويقود إلى الطلبات", async ({ page }) => {
    const { crashes } = watch(page);
    await signedIn(page, newMock());
    await page.goto("/dashboard/analytics");

    const strip = page.locator("header").getByRole("link", { name: /طلب جديد ينتظرك/ });
    await expect(strip).toBeVisible();
    await expect(strip).toBeInViewport();
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

    await strip.click();
    await expect(page).toHaveURL(/\/dashboard\/orders$/);
    await expect(strip).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect(crashes, crashes.join("\n")).toEqual([]);
  });
});

test.describe("اللوح بالطول والعرض", () => {
  for (const [w, h] of [[768, 1024], [1024, 768], [1024, 1366], [1366, 1024]] as const) {
    test(`${w}×${h} بلا فيض، والمسارات ${w > h ? "متجاورة" : "متراصّة"}`, async ({ page }) => {
      const { crashes } = watch(page);
      await page.setViewportSize({ width: w, height: h });
      await signedIn(page, newMock());
      await page.goto("/dashboard/kitchen");
      await expect(page.getByRole("article", { name: "طلب رقم 117" })).toBeVisible();

      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(w);

      const box = async (name: string) => (await page.getByRole("region", { name }).boundingBox())!;
      const fresh = await box("جديد");
      const prep = await box("قيد التحضير");
      if (w > h) expect(Math.abs(fresh.y - prep.y)).toBeLessThan(2);
      else expect(prep.y).toBeGreaterThan(fresh.y + fresh.height - 1);

      // زرّ النقل هدف لمس يُضغط بإبهام مستعجل.
      const btn = await page.getByRole("button", { name: "ابدأ التحضير" }).boundingBox();
      expect(btn!.height).toBeGreaterThanOrEqual(48);

      expect(crashes, crashes.join("\n")).toEqual([]);
    });
  }
});
