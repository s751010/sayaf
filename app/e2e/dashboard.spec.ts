/**
 * فحص إقلاع لوحة التاجر — الصفحات التي يدفع التاجر من أجلها.
 *
 * ═══ لماذا وُجد ═══
 *
 * `smoke.spec.ts` يفحص الصفحات العامّة وحدها، لأن اللوحة تحتاج جلسةً وقاعدة.
 * لكن الوعد الذي يُباع اليوم («سعراتك محسوبة، لا مكتوبة») كلّه خلف الدخول:
 * شاشة الامتثال والحاسبة والمنيو المطبوع. فعطلُ خطّافاتٍ فيها كان سيمرّ من
 * كل الفحوص — كما مرّ `React #310` قبله.
 *
 * ═══ الشبكة مُحاكاة بالكامل ═══
 *
 * كل طلب إلى Supabase يُردّ من هنا: لا قاعدة في العدّاء، ولا يُلمس مشروع
 * حقيقي. والجلسة مزروعة في `localStorage` بالصيغة التي يكتبها `session.ts`.
 * فالفحص يفحص **التركيب** لا البيانات: الصفحة تُرسم، والحاسبة تحسب، ولا انهيار.
 */
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";

const UID = "00000000-0000-4000-8000-000000000001";
const RID = "00000000-0000-4000-8000-0000000000aa";
const MID = "00000000-0000-4000-8000-0000000000bb";

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
  accepting_orders: false,
  online_payment_enabled: false,
  api_enabled: false,
  prices_include_vat: true,
  min_order_amount: 0,
};

const menus = [
  { id: MID, restaurant_id: RID, user_id: UID, name: "المنيو", theme: "dark-gold", active: true, language: "ar", created_at: "2026-10-01T00:00:00Z" },
];

/** ثلاث حالات امتثال: بلا أرقام · ينقصه الكافيين · مكتمل. */
const dishes = [
  { id: "d1", menu_id: MID, restaurant_id: RID, user_id: UID, name: "لاتيه", category: "مشروبات", price: 18, available: true, sort_order: 0, calories: null, sodium_mg: null, caffeine_mg: null, allergens: [] },
  { id: "d2", menu_id: MID, restaurant_id: RID, user_id: UID, name: "قهوة مقطّرة", category: "مشروبات", price: 14, available: true, sort_order: 1, calories: 5, sodium_mg: 10, caffeine_mg: null, allergens: [] },
  { id: "d3", menu_id: MID, restaurant_id: RID, user_id: UID, name: "كرواسون", category: "مخبوزات", price: 12, available: true, sort_order: 2, calories: 310, sodium_mg: 380, caffeine_mg: null, allergens: ["gluten", "milk"] },
];

const now = Date.now();
const subscriptions = [
  { id: "s1", user_id: UID, plan_id: "standard", active: true, start_date: new Date(now - 5 * 864e5).toISOString(), end_date: new Date(now + 300 * 864e5).toISOString(), created_at: new Date(now - 5 * 864e5).toISOString() },
];

const session = {
  access_token: "e2e.mock.token",
  refresh_token: "e2e-refresh",
  expires_at: Math.floor(now / 1000) + 86400,
  user: { id: UID, email: "e2e@example.com" },
};

function bodyFor(url: URL, method: string): unknown {
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
  return [];
}

async function signedIn(page: Page): Promise<void> {
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
  await page.addInitScript((s) => localStorage.setItem("cm2_session", JSON.stringify(s)), session);
}

test("شاشة الامتثال تُقلع وتعدّ حالات الأصناف", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page);
  await page.goto("/dashboard/nutrition");

  await expect(page.getByRole("heading", { name: "الامتثال الغذائي" })).toBeVisible();
  // واحدٌ من ثلاثة مكتمل: الكرواسون (لا كافيين في المخبوزات).
  await expect(page.getByText("1 من 3", { exact: false }).first()).toBeVisible();

  await page.waitForTimeout(1000);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("الحاسبة تحسب وصفةً حقيقية داخل النافذة", async ({ page }) => {
  // أثقل مسار جديد: نافذة ⇒ تحليل سطور ⇒ ملصق يتحدّث مع كل حرف.
  const { crashes } = watch(page);
  await signedIn(page);
  await page.goto("/dashboard/nutrition");

  await page.getByRole("button", { name: /احسب من الوصفة/ }).first().click();
  const dialog = page.getByRole("dialog").first();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("textbox").first().fill("شوتين إسبريسو\nحليب كامل الدسم 200 مل");
  // الرقم نفسه الذي يثبّته `recipe.test.ts` للاتيه (٢ شوت + ٢٠٠ مل حليب).
  await expect(dialog.getByText("127", { exact: true }).first()).toBeVisible();
  await expect(dialog.getByText("السعرات الحرارية").first()).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("المنيو المطبوع يُقلع بورقته وكوده", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page);
  await page.goto("/dashboard/print");

  await expect(page.getByRole("heading", { name: "المنيو المطبوع" })).toBeVisible();
  await expect(page.getByText("مقهى الفحص").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /CSV/ })).toBeVisible();

  await page.waitForTimeout(1000);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("فشل جلب المطعم لا يعرض شاشة الإنشاء — بل «أعد المحاولة» التي تُصلحه", async ({ page }) => {
  /**
   * كان الفشل يُحسم إلى «لا مطعم» فيظهر نموذج «أهلاً بك، عرّفنا على مطعمك»
   * لتاجرٍ له مطعم وكوده مطبوع — فيُنشئ مطعماً ثانياً برابط جديد (الدرس ٣٢).
   * والمسار المسجَّل لاحقاً أولى من الأوّل في Playwright، و`fallback` يُرجع
   * الطلب إلى المحاكاة العادية حين يعود الاتصال.
   */
  const { crashes } = watch(page);
  await signedIn(page);
  let down = true;
  await page.route(/\/rest\/v1\/restaurants/, (route) =>
    down
      ? route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"boom"}' })
      : route.fallback()
  );
  await page.goto("/dashboard");

  const retry = page.getByRole("button", { name: "أعد المحاولة" });
  await expect(retry).toBeVisible();
  await expect(page.getByText("أهلاً بك في كلاود منيو")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /أنشئ مطعمي/ })).toHaveCount(0);

  down = false;
  await retry.click();
  await expect(page.getByText("مقهى الفحص").first()).toBeVisible();
  await expect(retry).toHaveCount(0);

  expect(crashes, crashes.join("\n")).toEqual([]);
});

test.describe("اللوحة على ٣٢٠px", () => {
  /**
   * أضيق جوال يُباع — وعرض الجوال في المشروع ٤١٢ فلا يرى الفيض (الدرس ٣٤).
   * كانت الترويسة وحدها تمدّ الصفحة إلى ٣٨٩px. والاشتراك هنا تجربةٌ تنتهي
   * اليوم: «تنتهي اليوم» أطول شارة مختصرة، فالفحص على أسوأ حالة لا أسهلها.
   */
  test.use({ viewport: { width: 320, height: 640 } });

  // `/dashboard/kit`: تبويبات الطباعة صارت أربعاً — الرابع كان سيمدّ الصفحة.
  for (const path of ["/dashboard", "/dashboard/design", "/dashboard/dishes", "/dashboard/qr", "/dashboard/kit"]) {
    test(`${path} بلا تمرير أفقي`, async ({ page }) => {
      const { crashes } = watch(page);
      await signedIn(page);
      const endsSoon = [{ ...subscriptions[0], plan_id: "trial", end_date: new Date(Date.now() + 12 * 36e5).toISOString() }];
      await page.route(/\/rest\/v1\/subscriptions/, (route) =>
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(endsSoon) })
      );
      await page.goto(path);

      // الشارة المختصرة نفسها ظاهرة — مدخل الفوترة باقٍ على الجوال.
      await expect(page.locator("header").getByRole("link", { name: /الاشتراك والفوترة/ })).toBeVisible();
      await expect(page.locator("header").getByText("تنتهي اليوم", { exact: true })).toBeVisible();
      await page.waitForLoadState("networkidle");

      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width).toBeLessThanOrEqual(320);
      expect(crashes, crashes.join("\n")).toEqual([]);
    });
  }
});

test("الطباعة: الورقة وحدها ظاهرة — وصفحةٌ أخرى لا تخرج بيضاء", async ({ page }) => {
  /**
   * عطلان لا يُريان على الشاشة إطلاقاً:
   * - قاعدة الطباعة كانت عامّة (`body * { visibility: hidden }`) فتخرج طباعة
   *   أي صفحة غير هذه **بيضاء** — المنيو والشروط والمدونة.
   * - ولمّا حُصرت بـ`:has(.print-root)` صار وزنها أعلى من قاعدة الإظهار فخرجت
   *   **الورقة نفسها** بيضاء. فيُفحص الاتّجاهان معاً.
   */
  await signedIn(page);
  await page.goto("/dashboard/print");
  await expect(page.getByText("مقهى الفحص").first()).toBeVisible();

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".print-sheet").getByText("مقهى الفحص").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "المنيو المطبوع" })).toBeHidden();

  await page.goto("/demo");
  await expect(page.getByText("مطعم الديوان", { exact: false }).first()).toBeVisible();
});

test("ملفّ الامتثال: من شاشة الامتثال إلى ورقةٍ تُطبع — تقديرية، بلا حكم", async ({ page }) => {
  /**
   * اللاتيه بلا أرقام ⇒ «غير مُدخَل» في الورقة لا فراغ. والورقة **وحدها** في
   * الطباعة (القاعدة نفسها في المنيو المطبوع). ولا كلمة حكم في نصّها المطبوع.
   */
  const { crashes } = watch(page);
  await signedIn(page);
  await page.goto("/dashboard/nutrition");
  await page.getByRole("link", { name: /ملفّ الامتثال/ }).click();
  await expect(page).toHaveURL(/\/dashboard\/nutrition\/file$/);

  const sheet = page.locator("[data-compliance-file]");
  await expect(sheet.getByText("مقهى الفحص").first()).toBeVisible();
  await expect(sheet.locator("[data-estimate-note]")).toContainText("تقديرية");
  await expect(sheet.getByRole("row").filter({ hasText: "لاتيه" })).toContainText("غير مُدخَل");
  await expect(sheet.getByRole("row").filter({ hasText: "كرواسون" })).toContainText("310");
  await expect(sheet).toContainText("2,000");

  const text = (await sheet.innerText()).toLowerCase();
  for (const w of ["ممتثل", "امتثال", "معتمد", "مطابق", "compliant", "approved"]) expect(text).not.toContain(w);

  await page.emulateMedia({ media: "print" });
  await expect(sheet.getByText("مقهى الفحص").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "ملفّ الامتثال" })).toBeHidden();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

/**
 * المُنتقي يرتّب حسب نوع النشاط **ولا يطبّق شيئاً** (قرار ٢٦/١٠).
 *
 * المطعم هنا «مقهى» بلا وصف ⇒ مختصّ ⇒ «محمصة» أوّلاً وعليها الشارة وحدها. وعدم
 * التطبيق يُقاس بالشبكة: صفر طلب كتابةٍ إلى `menus` من فتح الصفحة — اقتراحٌ
 * صامت يكتب الطابع كان سيغيّر منيو التاجر أمام زبائنه وهو يتصفّح فقط.
 */
test("مُنتقي الطوابع: المقترح لنوع النشاط أوّلاً بشارته، ولا كتابة", async ({ page }) => {
  const { crashes } = watch(page);
  const writes: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/rest/v1/menus") && r.method() !== "GET" && r.method() !== "HEAD") writes.push(r.method());
  });
  await signedIn(page);
  await page.goto("/dashboard/design");

  const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "طابع منيوك" }) });
  const first = section.locator(".grid > div").first();
  await expect(first.getByText("محمصة", { exact: true })).toBeVisible();
  await expect(first.getByText("يناسب نوع نشاطك")).toBeVisible();
  await expect(section.getByText("يناسب نوع نشاطك")).toHaveCount(1);

  // «شعبي» يعيد الترتيب ولا يحفظ: «نجدي» أوّلاً.
  await section.getByRole("button", { name: "شعبي", exact: true }).click();
  await expect(section.locator(".grid > div").first().getByText("نجدي", { exact: true })).toBeVisible();

  await page.waitForTimeout(800);
  expect(writes, "المُنتقي كتب طابعاً بلا ضغطة").toEqual([]);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

/**
 * «اربط منيوك بقوقل ماب» في صفحة الأكواد.
 *
 * الخطر الذي يحرسه: الصفحة تعرض رابطاً يحمل `?table=` حين يُكتب رقم طاولة،
 * ولو نسخته البطاقة لصار كل زائرٍ من الخرائط «جالساً على طاولة» في طلبه. فيُكتب
 * رقمٌ أوّلاً، ثم يُفحص ما نُسخ فعلاً. والإخفاء يبقى بعد إعادة التحميل.
 */
test("بطاقة قوقل ماب: تنسخ الرابط العام لا رابط الطاولة، وتُخفى وتبقى مخفيّة", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __copied: string[] };
    w.__copied = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async (t: string) => void w.__copied.push(t) },
    });
  });
  await page.goto("/dashboard/qr");

  const tip = page.locator("section").filter({ has: page.getByRole("heading", { name: "اربط منيوك بقوقل ماب" }) });
  await expect(tip).toBeVisible();
  await expect(tip.getByRole("link", { name: "كيف؟" })).toHaveAttribute("href", "/blog/google-maps-menu-link");

  await page.getByPlaceholder("مثال: 5").fill("5");
  await expect(page.locator('input[dir="ltr"][readonly]')).toHaveValue(/table=5/);

  await tip.getByRole("button", { name: /انسخ الرابط/ }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __copied: string[] }).__copied))
    .toHaveLength(1);
  const [copied] = await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied);
  expect(copied).toMatch(/\/e2e-cafe$/);
  expect(copied).not.toContain("table");

  await tip.getByRole("button", { name: "إخفاء بطاقة قوقل ماب" }).click();
  await expect(tip).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "أكواد QR" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "اربط منيوك بقوقل ماب" })).toHaveCount(0);

  expect(crashes, crashes.join("\n")).toEqual([]);
});

/**
 * عدّة الطباعة بالطابع (`/dashboard/kit`) — **تُبنى وتُعايَن، ولا تُطبع قبل النطاق**.
 *
 * قرار المالك (٢٠٢٦/١٠/٢٥): الكود المطبوع لا يُحدَّث، و`MENU_DOMAIN` فارغ اليوم.
 * فالوعد «لا يطبع» يُقاس بما يحدث فعلاً (الدرس ٤٨): صفر تنزيل وصفر نافذة طباعة
 * حتى مع ضغطٍ قسري على الزرّين — لا بخاصية `disabled` وحدها.
 */
test("عدّة الطباعة: ثلاث قطع تُعايَن، والتنزيل والطباعة مطفآن قبل النطاق", async ({ page }) => {
  const { crashes } = watch(page);
  await signedIn(page);
  await page.addInitScript(() => {
    const w = window as unknown as { __opened: number; open: typeof window.open };
    w.__opened = 0;
    w.open = (() => {
      w.__opened++;
      return null;
    }) as typeof window.open;
  });
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  await page.goto("/dashboard/kit");

  await expect(page.getByRole("heading", { name: "عدّة الطباعة" })).toBeVisible();
  const pieces = page.locator("[data-kit-piece]");
  await expect(pieces).toHaveCount(3);
  for (const id of ["tent", "stickers", "counter"]) {
    const piece = page.locator(`[data-kit-piece="${id}"]`);
    // المعاينة رُسمت فعلاً (لوحةٌ بأبعاد) — بالمحرّك نفسه الذي يُطبع به.
    await expect.poll(() => piece.locator("canvas").evaluate((c: HTMLCanvasElement) => c.width)).toBeGreaterThan(100);
    for (const name of [/نزّل PNG/, /اطبع/]) {
      const btn = piece.getByRole("button", { name });
      await expect(btn).toBeDisabled();
      await expect(btn).toHaveAttribute("aria-describedby", "kit-gate-note");
      await btn.click({ force: true });
    }
  }
  const note = page.locator("#kit-gate-note");
  await expect(note).toContainText("النطاق");
  await expect(note).toContainText("لا يُحدَّث");

  await page.waitForTimeout(800);
  expect(downloads, "نُزّل ملفّ قبل النطاق").toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { __opened: number }).__opened), "فُتحت نافذة طباعة").toBe(0);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

/**
 * كود كلّ قطعة **يُقرأ** — للطوابع الاثني عشر، بالمحرّك الحقيقي وبدقّة ٣٠٠.
 *
 * لا فاكّ QR في `node_modules`، فالمسبار (`e2e/qr-probe.ts`) أقسى من الفكّ:
 * يطابق مركز **كلّ وحدة** بالمصفوفة المتوقَّعة من الرابط (صفر مخالفة — الفاكّ
 * يتسامح مع ١٥٪)، ويقيس منطقة الهدوء بالوحدات على الجهات الأربع (المواصفة ٤)،
 * وتباين الحبر الفعلي (٧:١). والستاند بوجهيه، والعلوي مقلوب.
 */
test("عدّة الطباعة: كود كلّ قطعة يطابق مصفوفته وحدةً وحدة — الطوابع الاثنا عشر", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "رسمٌ بدقّة الطباعة — مرّةً واحدة تكفي");
  test.setTimeout(240_000);
  await page.goto("/about");
  const themes = ["dark-gold", "receipt", "neon", "sticker", "letterboard", "editorial", "roshan", "najdi", "modern", "roastery", "dukkan", "asir"];
  const origin = new URL(page.url()).origin;
  const faces = await page.evaluate(
    async ({ themes, origin }) => {
      // `import()` عبر `Function`: محوّل Playwright قد يحوّل `import()` في جسم
      // الدالّة إلى `require` — والدالّة تُنفَّذ في المتصفّح حيث vite يخدم الملفّ.
      const load = new Function("p", "return import(p)") as (p: string) => Promise<typeof import("./qr-probe")>;
      const m = await load("/e2e/qr-probe.ts");
      const out: { key: string; mismatches: number; modules: number; quiet: number; contrast: number; moduleMm: number }[] = [];
      for (const theme of themes) {
        for (const size of ["tent-a5", "sticker", "counter"] as const) {
          const faces = await m.probe({
            size, layout: "centered", style: "brand", kit: true,
            name: "مطعم مشراق للمأكولات الشعبية", logo: null, emoji: "☕",
            themeId: theme, brandHex: null, url: `${origin}/mishraq`,
          });
          faces.forEach((f, i) =>
            out.push({ key: `${theme}/${size}/${i}`, mismatches: f.mismatches, modules: f.modules, quiet: Math.min(...f.quiet), contrast: f.contrast, moduleMm: f.moduleMm })
          );
        }
      }
      return out;
    },
    { themes, origin }
  );
  // ١٢ طابعاً × (وجها الستاند + الملصق + الكاونتر).
  expect(faces).toHaveLength(48);
  for (const f of faces) {
    expect(f.modules, f.key).toBeGreaterThan(400); // يثبت أنه وجد كوداً
    expect(f.mismatches, f.key).toBe(0);
    expect(f.quiet, `${f.key} منطقة الهدوء`).toBeGreaterThanOrEqual(4);
    expect(f.contrast, `${f.key} تباين الحبر`).toBeGreaterThanOrEqual(7);
    expect(f.moduleMm, `${f.key} مقاس الوحدة`).toBeGreaterThanOrEqual(0.8);
  }
});
