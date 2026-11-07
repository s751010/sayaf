/**
 * منيو الزبون `/:slug` بشبكةٍ مُحاكاة — ما لا تراه الدوالّ الخالصة.
 *
 * - **آخر منيو ناجح محفوظ**: يُحمَّل المنيو، ثم تنقطع الشبكة ويُعاد التحميل ⇒
 *   المنيو نفسه مع «قد يكون قديماً — لا اتصال الآن». وبلا نسخة محفوظة يبقى
 *   «تعذّر تحميل المنيو» (الفشل ≠ الفارغ، القاعدة «ج»).
 * - **أهداف اللمس ≥ 44** قياساً في المتصفّح: الشكل كما هو (٣٦ · ٤٠)، وما يُلمس
 *   فوقه وتحته يصيب العنصر نفسه.
 * - **`MenuSheet`**: التركيز يدخل اللوح ويُحبس فيه ويعود إلى الزرّ عند الإغلاق.
 * - **البيان**: باسم المطعم و`start_url` رابطه، والأصلي يعود عند المغادرة.
 * - **عبارتا الهيئة في الذيل** (`lib/sfdaStatements.ts`): الملح بجانب علامته متى
 *   وُجد صنفٌ بها، و«متاحة عند الطلب» متى وُجد صنفٌ بسعرات — وبالإنجليزية لزبون EN.
 * - **علامة الملح على البطاقة** (`SaltMark` في `DishCard`): صنفٌ صوديومه ٢٤٠٠ يحملها
 *   وصنفٌ ٨٨٠ لا يحملها، في التخطيطات الأربعة — وعلى ٣٢٠ في الطوابع كلّها: داخل
 *   اسمها لا مقصوصة، ونصّها مقروء، وسطر الاسم بارتفاعه، والصفحة بلا فيضٍ أفقي.
 */
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";
import { ALL_THEMES } from "../src/lib/themes";

const SLUG = "e2e-cafe";
const RID = "00000000-0000-4000-8000-0000000000aa";
const MID = "00000000-0000-4000-8000-0000000000bb";
/** ‏٢٠:٠٠ بتوقيت الرياض — داخل ساعات العمل أدناه. */
const FIXED = new Date("2026-11-07T17:00:00Z");

const day = { open: true, from: "08:00", to: "23:00" };
const restaurant = {
  id: RID, name: "مقهى الفحص", slug: SLUG, type: "مقهى", logo: "☕",
  english_enabled: true, accepting_orders: false, online_payment_enabled: false,
  working_hours: JSON.stringify({ sat: day, sun: day, mon: day, tue: day, wed: day, thu: day, fri: day }),
};
const menus = [{ id: MID, restaurant_id: RID, name: "القائمة", theme: "dark-gold", active: true, created_at: "2026-10-01T00:00:00Z" }];
const dishes = [
  { id: "d1", menu_id: MID, restaurant_id: RID, name: "لاتيه", category: "مشروبات", price: 18, available: true, sort_order: 0 },
  { id: "d2", menu_id: MID, restaurant_id: RID, name: "كرواسون", category: "مخبوزات", price: 12, available: true, sort_order: 1 },
];

/** ‏`net.offline = true` ⇒ كل طلبٍ إلى Supabase ينقطع كما ينقطع في قبوٍ بلا إشارة. */
async function mockMenu(
  page: Page,
  net: { offline: boolean },
  list: unknown[] = dishes,
  theme = "dark-gold"
): Promise<void> {
  await page.route(/supabase\.co/, async (route) => {
    if (net.offline) return route.abort("internetdisconnected");
    const req = route.request();
    const p = new URL(req.url()).pathname;
    const table = p.split("/rest/v1/")[1] ?? "";
    let body: unknown = [];
    if (p.includes("/rpc/")) body = null;
    else if (req.method() === "GET") {
      if (table.startsWith("restaurants")) body = [restaurant];
      else if (table.startsWith("menus")) body = menus.map((m) => ({ ...m, theme }));
      else if (table.startsWith("dishes")) body = list;
    }
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.clock.setFixedTime(FIXED);
}

async function openMenu(page: Page): Promise<void> {
  await page.goto(`/${SLUG}`);
  await expect(page.getByText("لاتيه").first()).toBeVisible();
}

test("انقطاع الشبكة يعرض آخر منيو ناجح مع «قد يكون قديماً»", async ({ page }) => {
  const { crashes } = watch(page);
  const net = { offline: false };
  await mockMenu(page, net);
  await openMenu(page);
  await expect(page.locator("[data-stale-menu]")).toHaveCount(0);
  const saved = await page.evaluate((k) => localStorage.getItem(k), `cm2_menu_cache_${SLUG}`);
  expect(saved).toContain("لاتيه");

  net.offline = true;
  await page.reload();
  await expect(page.getByText("لاتيه").first()).toBeVisible();
  await expect(page.getByText("قد يكون قديماً — لا اتصال الآن")).toBeVisible();
  await expect(page.getByText("تعذّر تحميل المنيو")).toHaveCount(0);

  // وعودة الشبكة تعيد المنيو حيّاً بلا الشريط.
  net.offline = false;
  await page.getByRole("button", { name: "أعد المحاولة" }).click();
  await expect(page.getByText("لاتيه").first()).toBeVisible();
  await expect(page.locator("[data-stale-menu]")).toHaveCount(0);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("بلا نسخة محفوظة: الفشل «تعذّر تحميل المنيو» لا منيو فارغ", async ({ page }) => {
  const { crashes } = watch(page);
  await mockMenu(page, { offline: true });
  await page.goto(`/${SLUG}`);
  await expect(page.getByText("تعذّر تحميل المنيو")).toBeVisible();
  await expect(page.getByRole("button", { name: "أعد المحاولة" })).toBeVisible();
  await expect(page.locator("[data-stale-menu]")).toHaveCount(0);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("أهداف اللمس ≥ 44: مبدّل اللغة والشرائح والتبويبات — والشكل كما هو", async ({ page }) => {
  await mockMenu(page, { offline: false });
  await openMenu(page);

  const targets = [
    { name: "مبدّل اللغة", el: page.getByRole("group", { name: "اللغة / Language" }).getByRole("button").first(), h: 36 },
    { name: "شريحة الساعات", el: page.getByRole("button", { name: /مفتوح الآن/ }), h: 36 },
    { name: "تبويب القسم", el: page.locator(".m-tab").first(), h: 40 },
  ];
  for (const t of targets) {
    await t.el.scrollIntoViewIfNeeded();
    const box = await t.el.boundingBox();
    expect(box, t.name).not.toBeNull();
    expect(Math.round(box!.height), `${t.name}: الشكل`).toBe(t.h);
    expect(box!.width, `${t.name}: العرض`).toBeGreaterThanOrEqual(44);
    // ما يُلمس: نقطتان داخل الـ٤٤ وخارج الشكل المرئي، فوقه وتحته.
    const ext = (44 - box!.height) / 2;
    const hits = await t.el.evaluate(
      (el, { x, ys }) => ys.map((y) => el.contains(document.elementFromPoint(x, y))),
      { x: box!.x + box!.width / 2, ys: [box!.y - ext + 0.5, box!.y + box!.height + ext - 0.5] }
    );
    expect(hits, `${t.name}: منطقة اللمس`).toEqual([true, true]);
  }
});

test("لوح الساعات يحبس «Tab» ويعيد التركيز إلى زرّه", async ({ page }) => {
  const { crashes } = watch(page);
  await mockMenu(page, { offline: false });
  await openMenu(page);

  const trigger = page.getByRole("button", { name: /مفتوح الآن/ });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const inside = () => dialog.evaluate((d) => d.contains(document.activeElement));
  expect(await inside()).toBe(true);

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect(await inside(), `Tab ${i + 1}`).toBe(true);
  }
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(await inside(), `Shift+Tab ${i + 1}`).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(await trigger.evaluate((el) => el === document.activeElement)).toBe(true);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("«أضف إلى الشاشة الرئيسية»: بيانٌ باسم المطعم ورابطه، والأصلي يعود عند المغادرة", async ({ page }) => {
  const { crashes } = watch(page);
  await mockMenu(page, { offline: false });
  await openMenu(page);

  const link = page.locator('link[rel="manifest"]');
  await expect(link).toHaveAttribute("href", /^blob:/);
  const manifest = await link.evaluate(async (el) => {
    const res = await fetch((el as HTMLLinkElement).href);
    return (await res.json()) as { name: string; start_url: string; icons: { src: string }[] };
  });
  expect(manifest.name).toBe("مقهى الفحص");
  expect(manifest.start_url).toBe(new URL(`/${SLUG}`, page.url()).href);
  for (const i of manifest.icons) expect(i.src).toMatch(/^https?:\/\//);

  // مغادرةٌ داخل التطبيق (توقيع المنصّة في الذيل) ⇒ بيان المنصّة.
  await page.locator("footer a[href='/']").first().click();
  await expect(page).toHaveURL(/\/$/);
  await expect(link).toHaveAttribute("href", "/manifest.webmanifest");
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("عبارتا الهيئة تظهران بشرطهما في الذيل، وبالإنجليزية لزبون EN", async ({ page }) => {
  const { crashes } = watch(page);
  const salty = [
    { ...dishes[0], calories: 127, sodium_mg: 95, caffeine_mg: 126, is_high_sodium: false },
    { id: "d3", menu_id: MID, restaurant_id: RID, name: "شاورما", category: "رئيسية", price: 22, available: true, sort_order: 2, calories: 640, sodium_mg: 2400, is_high_sodium: true },
  ];
  await mockMenu(page, { offline: false }, salty);
  await openMenu(page);

  const salt = page.locator("[data-salt-statement]");
  await expect(salt).toContainText("الصنف يحتوي على كمية ملح أعلى من الكمية الموصى بها يوميًا");
  await expect(salt).toContainText("5 جرام (2000 ملجم صوديوم)");
  await expect(salt.locator("svg")).toHaveCount(1);
  await expect(page.getByText("البيانات التغذوية الإضافية متاحة عند الطلب.")).toBeVisible();

  await page.getByRole("group", { name: "اللغة / Language" }).getByRole("button", { name: "EN" }).click();
  await expect(salt).toContainText("This item contains more salt than the recommended daily amount.");
  await expect(page.getByText("Additional nutrition information is available on request.")).toBeVisible();
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("عبارتا الهيئة تغيبان عن منيو بلا سعرات ولا علامة ملح", async ({ page }) => {
  await mockMenu(page, { offline: false });
  await openMenu(page);
  await expect(page.locator("[data-salt-statement]")).toHaveCount(0);
  await expect(page.getByText("البيانات التغذوية الإضافية متاحة عند الطلب.")).toHaveCount(0);
});

/* ── علامة الملح على بطاقة الصنف ─────────────────────────────────────── */

/** ‏٢٤٠٠ فوق حدّ الهيئة (٢٠٠٠) و٨٨٠ تحته — الثاني مثال البطل الذي كان يُوسَم على ٦٠٠. */
const SALT_MENU = [
  { id: "s1", menu_id: MID, restaurant_id: RID, name: "مندي لحم", category: "رئيسية", price: 48, available: true, sort_order: 0, calories: 980, sodium_mg: 2400, is_high_sodium: true },
  { id: "s2", menu_id: MID, restaurant_id: RID, name: "شاورما", category: "رئيسية", price: 22, available: true, sort_order: 1, calories: 640, sodium_mg: 880, is_high_sodium: false },
];
const card = (page: Page, name: string) => page.locator(".m-card").filter({ hasText: name });

async function openSaltMenu(page: Page, theme: string): Promise<void> {
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await mockMenu(page, { offline: false }, SALT_MENU, theme);
  await page.goto(`/${SLUG}`);
  await expect(card(page, "مندي لحم")).toBeVisible();
}

test("علامة الملح على بطاقة الصنف فوق ٢٠٠٠ وحده — في التخطيطات الأربعة، وبالإنجليزية لزبون EN", async ({ page }) => {
  const { crashes } = watch(page);
  for (const layout of ["grid", "list", "showcase", "deck"]) {
    await openSaltMenu(page, `dark-gold:${layout}`);
    const salty = card(page, "مندي لحم");
    await expect(salty.locator("[data-salt-mark]"), layout).toHaveCount(1);
    await expect(salty.getByRole("img", { name: "عالي الملح" }), layout).toBeVisible();
    // الأيقونة نفسها التي بجانب عبارة الذيل.
    const glyph = (sel: string) => page.locator(sel).locator("svg").first().innerHTML();
    expect(await glyph("[data-salt-mark]"), layout).toBe(await glyph("[data-salt-statement]"));
    await expect(card(page, "شاورما").locator("[data-salt-mark]"), layout).toHaveCount(0);
  }

  await page.getByRole("group", { name: "اللغة / Language" }).getByRole("button", { name: "EN" }).click();
  await expect(card(page, "مندي لحم").getByRole("img", { name: "High in salt" })).toBeVisible();
  await expect(card(page, "شاورما").locator("[data-salt-mark]")).toHaveCount(0);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("علامة الملح على ٣٢٠ في الطوابع كلّها: داخل اسمها، مقروءة، ولا تكسر البطاقة", async ({ page }) => {
  test.slow();
  const { crashes } = watch(page);
  await page.setViewportSize({ width: 320, height: 720 });
  expect(ALL_THEMES.length).toBeGreaterThanOrEqual(18);
  for (const t of ALL_THEMES) {
    await openSaltMenu(page, t.id);
    const salty = card(page, "مندي لحم");
    const mark = salty.locator("[data-salt-mark]");
    await mark.scrollIntoViewIfNeeded();
    await expect(mark, t.id).toBeVisible();
    const m = await mark.evaluate((el) => {
      const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const lum = (c: string) => {
        const [r, g, b] = rgb(c).map((v) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const cs = getComputedStyle(el);
      const [a, b] = [lum(cs.color), lum(cs.backgroundColor)].sort((x, y) => y - x);
      // الصندوق المرسوم: ما داخل الاسم يبقى داخله بعد الميل والتكبير، و`line-clamp`
      // يقصّ ما يخرج عنه.
      const box = el.getBoundingClientRect();
      const name = el.closest(".m-name")!.getBoundingClientRect();
      const host = el.closest(".m-card")!.getBoundingClientRect();
      return {
        ratio: (a + 0.05) / (b + 0.05),
        inName: box.top >= name.top - 0.5 && box.bottom <= name.bottom + 0.5 && box.left >= name.left - 0.5 && box.right <= name.right + 0.5,
        inCard: box.left >= host.left && box.right <= host.right,
        size: box.height,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
      };
    });
    expect(m.ratio, `${t.id}: الأيقونة فوق حبّتها`).toBeGreaterThanOrEqual(4.5);
    expect(m.inName, `${t.id}: داخل سطر الاسم لا مقصوصة`).toBe(true);
    expect(m.inCard, `${t.id}: داخل البطاقة`).toBe(true);
    expect(m.size, `${t.id}: بارزة الحجم`).toBeGreaterThanOrEqual(16);
    expect(m.overflow, `${t.id}: بلا فيضٍ أفقي`).toBeLessThanOrEqual(0);
    // سطر الاسم بارتفاعه: الاسمان سطرٌ واحد، والموسوم لا يطول عن جاره. ارتفاع
    // التخطيط لا الصندوق المرسوم: ملصقات «ملصقات» مائلة وبطاقات السحب تكبر حين تتوسّط.
    const h = (name: string) => card(page, name).locator(".m-name").evaluate((el) => parseFloat(getComputedStyle(el).height));
    expect(Math.abs((await h("مندي لحم")) - (await h("شاورما"))), `${t.id}: سطر الاسم`).toBeLessThanOrEqual(0.5);
  }
  expect(crashes, crashes.join("\n")).toEqual([]);
});
