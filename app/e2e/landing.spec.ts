/**
 * البطل التفاعلي — الحاسبة تعمل للزائر **بلا تسجيل ولا شبكة**.
 *
 * هذا وعد الصفحة الأولى كلّه: «جرّبها هنا قبل أن تسجّل». فإن انكسر (تحميلٌ
 * كسول لم يصل، أو محرّكٌ لم يُفهم سطراً من أمثلته) صار البطل صندوقاً فارغاً
 * أمام كل زائر — بلا أي خطأ يراه أحد.
 */
import { expect, test, type Page } from "@playwright/test";
import { watch } from "./watch";
import { CTA_PRIMARY, CTA_SECONDARY } from "../src/lib/facts";

test("البطل يحسب وصفة الزائر بلا تسجيل", async ({ page }) => {
  const { crashes } = watch(page);
  const chunks: string[] = [];
  page.on("request", (r) => chunks.push(r.url()));
  await page.goto("/");
  // الحاسبة لا تُجلب عند الإقلاع — حين يقترب قسمها (تدقيق ٢٠٢٦/١١/٠٩، البند ٣).
  await page.waitForTimeout(500);
  expect(chunks.some((u) => /HeroCalculator/.test(u)), "الحاسبة جُلبت قبل الاقتراب").toBe(false);
  await page.locator("#calories").scrollIntoViewIfNeeded();

  const recipe = page.locator("#hero-recipe");
  await expect(recipe).toBeVisible();

  // مثالٌ جاهز: الشاورما صوديومها ٨٨٠ ⇒ يظهر رقمه، **بلا** «مرتفع» —
  // علامة الملح فوق ٢٠٠٠ ملغم (٥ غ ملح) بنصّ الهيئة، لا فوق ٦٠٠.
  await page.getByRole("button", { name: "شاورما دجاج" }).click();
  // داخل قسم الحاسبة: جوّال القصّة يحمل ملصقاً ثانياً.
  const sodium = page.locator("#calories .nlabel-row").filter({ hasText: "الصوديوم" }).first();
  await expect(sodium).toContainText("880");
  await expect(sodium).not.toContainText("مرتفع");

  // وصفة الزائر نفسه: سطرٌ واحد يُفهم ويُحسب.
  await recipe.fill("حليب كامل الدسم 200 مل");
  await expect(page.getByText("فهمنا المكوّن")).toBeVisible();
  await expect(page.getByText("126", { exact: true }).first()).toBeVisible();

  expect(crashes, crashes.join("\n")).toEqual([]);
});

/**
 * أهداف اللمس ≥ ٤٤ في الصفحات العامّة (تدقيق ٢٠٢٦/١١/٠٩، البنود ١٨–٢٠):
 * الشكل كما هو، و`.hit` يمدّ ما يُلمس — نقيس بـ`elementFromPoint` فوق الشكل وتحته.
 */
test("أهداف اللمس ≥ ٤٤: تبويبا الدخول و«نسيت كلمة المرور؟» ورابط الذيل", async ({ page }) => {
  const check = async (el: import("@playwright/test").Locator) => {
    await el.scrollIntoViewIfNeeded();
    const box = (await el.boundingBox())!;
    expect(box).not.toBeNull();
    const ext = Math.max(0, (44 - box.height) / 2);
    const hits = await el.evaluate(
      (node, { x, ys }) => ys.map((y) => node.contains(document.elementFromPoint(x, y))),
      { x: box.x + box.width / 2, ys: [box.y - ext + 0.5, box.y + box.height + ext - 0.5] }
    );
    expect(hits, await el.textContent()).toEqual([true, true]);
  };
  await page.goto("/login");
  await check(page.getByRole("button", { name: "نسيت كلمة المرور؟" }));
  await check(page.getByRole("button", { name: "حساب جديد" }));
  await page.goto("/help");
  await check(page.locator("footer").getByRole("link", { name: "المدونة" }));
});

test("كلمة مرور قصيرة عند الإنشاء: رسالتها مرّة واحدة لا مرّتين", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "حساب جديد" }).click();
  await page.locator('input[type="email"]').fill("a@b.co");
  await page.locator("#cm-password").fill("abc");
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText(/محارف على الأقل/)).toHaveCount(1);
  await expect(page.locator("#cm-password")).toBeFocused();
});

test("إطار المنيو في البطل: لا يُحمَّل عند الإقلاع، ويصل وحده لزائرٍ ساكن", async ({ page }) => {
  await page.goto("/");
  const frame = page.locator('iframe[title="معاينة منيو مطعمك"]');
  await page.waitForTimeout(800);
  await expect(frame).toHaveCount(0);
  // بلا لمسٍ ولا تمرير: المهلة (٤ث) تأتي به — كان مؤقّتها يُلغى بمعرّف خمولٍ مشترك.
  await expect(frame).toHaveCount(1, { timeout: 12_000 });
});

/* ══ «عرض حيّ للمنتج» (٢٠٢٦/١١/١١، §22) ══════════════════════════════════ */

const heroCtas = (page: Page) => {
  const hero = page.locator("section").first();
  return [hero.getByRole("link", { name: CTA_PRIMARY }), hero.getByRole("link", { name: CTA_SECONDARY })];
};

for (const [w, h] of [[390, 844], [1280, 800]] as const) {
  test(`زرّا التجربة فوق الطيّ على ${w}×${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");
    for (const link of heroCtas(page)) {
      await expect(link).toBeVisible();
      const box = (await link.boundingBox())!;
      expect(box.y + box.height, `${await link.textContent()} تحت الطيّ`).toBeLessThanOrEqual(h);
    }
  });
}

test("«وش نوع مطعمك؟»: تبديل النوع يبدّل منيو الجوّال بلا إعادة تحميل الإطار", async ({ page }) => {
  const { crashes } = watch(page);
  await page.goto("/");
  const frameEl = page.locator('iframe[title="معاينة منيو مطعمك"]');
  await expect(frameEl).toHaveCount(1, { timeout: 12_000 });
  const src = await frameEl.getAttribute("src");
  const frame = page.frameLocator('iframe[title="معاينة منيو مطعمك"]');
  await expect(frame.getByText("محمصة نخلة").first()).toBeVisible({ timeout: 15_000 });

  await page.getByRole("tab", { name: "بيتزا وإيطالي" }).first().click();
  await expect(frame.getByText("بيتزيريا ريحانة").first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/منيو بيتزا وإيطالي بطابع/)).toBeVisible();
  // الرسالة لا الرابط: الإطار نفسه، لم يُبنَ ثانيةً.
  expect(await frameEl.getAttribute("src")).toBe(src);
  // أوّل لمسة توقف الجولة نهائياً.
  await expect(page.getByRole("button", { name: "أوقف الجولة" })).toHaveCount(0);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("قبل وبعد: المنزلق بلوحة المفاتيح", async ({ page }) => {
  await page.goto("/");
  // القسم كسول: يُرسم حين يقترب — فيُمرَّر إلى عنوانه أوّلاً.
  await page.getByRole("heading", { name: /منيوك اليوم ملفّ PDF/ }).scrollIntoViewIfNeeded();
  const slider = page.getByRole("slider", { name: /منيو PDF/ });
  await slider.scrollIntoViewIfNeeded();
  await expect(slider).toHaveAttribute("aria-valuenow", "50");
  await slider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "55");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveAttribute("aria-valuenow", "45");
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
});

test("شريط التجربة الثابت: يظهر بعد زرّ البطل، ويغيب عند الكتابة وعند زرّ الخاتمة", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const dock = page.getByTestId("cta-dock");
  await expect(dock).not.toHaveClass(/is-up/);

  await page.locator("#how").scrollIntoViewIfNeeded();
  await expect(dock).toHaveClass(/is-up/);
  // لا يغطّي محتوى: الصفحة محشوّة أسفلها بارتفاعه.
  const pad = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("#root > div")!).paddingBottom));
  expect(pad).toBeGreaterThanOrEqual(76);

  await page.locator("#calories").scrollIntoViewIfNeeded();
  const recipe = page.locator("#hero-recipe");
  await recipe.scrollIntoViewIfNeeded();
  await recipe.focus();
  await expect(dock).not.toHaveClass(/is-up/);
  await recipe.blur();
  await expect(dock).toHaveClass(/is-up/);

  // زرّ الخاتمة ظاهر ⇒ الشريط يغيب (لا زرّان للشيء نفسه في شاشةٍ واحدة).
  await page.locator("section.bg-ink").getByRole("link", { name: CTA_PRIMARY }).scrollIntoViewIfNeeded();
  await expect(dock).not.toHaveClass(/is-up/);
});

test("الحاسبة تمتلئ وحدها حين تدخل الشاشة — والملصق يعدّ", async ({ page }) => {
  await page.goto("/");
  await page.locator("#calories").scrollIntoViewIfNeeded();
  const recipe = page.locator("#hero-recipe");
  await recipe.scrollIntoViewIfNeeded();
  await expect(recipe).not.toHaveValue("", { timeout: 10_000 });
  // سطرٌ مكتمل ⇒ رقم سعراتٍ في الملصق لا «—».
  const kcal = page.locator("#calories .nlabel .font-display.text-4xl").first();
  await expect(kcal).toHaveText(/\d/, { timeout: 15_000 });
});

test("تقليل الحركة: الحاسبة مملوءة بلا كتابة، ولا جولة أنواع", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#calories").scrollIntoViewIfNeeded();
  const recipe = page.locator("#hero-recipe");
  await expect(recipe).toBeVisible();
  const full = await recipe.inputValue();
  expect(full.split("\n").length).toBeGreaterThan(1);
  await page.waitForTimeout(600);
  expect(await recipe.inputValue()).toBe(full);
  await expect(page.getByRole("button", { name: "أوقف الجولة" })).toHaveCount(0);
});

test("معرض الطوابع: رفّ النوع، و«شوف الكلّ» يفتح الشبكة، و«جرّبه» يلبس الجوّال", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /اختر ما يشبه مكانك/ }).scrollIntoViewIfNeeded();
  const all = page.getByRole("button", { name: /^شوف الكلّ/ });
  await all.scrollIntoViewIfNeeded();
  const rail = page.locator("#landing-themes");
  const shelf = await rail.locator(".gal-card").count();
  expect(shelf).toBeGreaterThan(2);
  expect(shelf).toBeLessThan(12);
  await expect(page.locator("#landing-themes-all .gal-card")).toHaveCount(0);
  await all.click();
  expect(await page.locator("#landing-themes-all .gal-card").count()).toBeGreaterThan(30);
  await rail.locator(".gal-card").nth(1).click();
  await expect(page.getByText(/مرّره وافتح أي طبق|اضغطه وجرّبه على جوّالك/).locator("visible=true")).toBeInViewport();
});

/**
 * جوّال البطل واجهة المنتج: زائرٌ يفتح الهبوط الثالثة فجراً بتوقيت الرياض كان يرى
 * «مغلق للطلبات الآن» بلا زرّ إضافة. داخل الإطار (`?embed=1`) لا ساعات عمل — والصفحة
 * المستقلّة `/demo` تبقى بساعاتها (هناك تُعرض الميزة نفسها).
 */
test("إطار الهبوط مفتوح للطلب في أي ساعة — الثالثة فجراً بتوقيت الرياض", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-10T00:00:00Z")); // 03:00 الرياض
  await page.goto("/demo?embed=1");
  await expect(page.getByRole("button", { name: /^أضِف / }).first()).toBeVisible();
  await expect(page.getByText(/مغلق/)).toHaveCount(0);
  await expect(page.getByText(/^يفتح /)).toHaveCount(0);
});

/**
 * الجوّال ليس حاسوباً مصغّراً (ملاحظة المالك ٢٠٢٦/١١/١٣): القصّة كانت بجوّالٍ ملتصق
 * وبطاقاتٍ ملتصقة تتراكب فوقه وفوق بعضها. على الشاشة الضيّقة لكلّ محطّةٍ شاشتها تحت
 * نصّها، ولا شيء يلتصق في القسم.
 */
test("القصّة على الجوّال: أربع شاشات تحت بطاقاتها، ولا التصاق", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("#how").scrollIntoViewIfNeeded();
  await expect(page.locator("#how .phone-shell:visible")).toHaveCount(4);
  const sticky = await page.locator("#how").evaluate((root) =>
    [...root.querySelectorAll("*")].filter((el) => getComputedStyle(el).position === "sticky" && (el as HTMLElement).offsetParent !== null).length
  );
  expect(sticky).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
