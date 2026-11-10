/**
 * البطل التفاعلي — الحاسبة تعمل للزائر **بلا تسجيل ولا شبكة**.
 *
 * هذا وعد الصفحة الأولى كلّه: «جرّبها هنا قبل أن تسجّل». فإن انكسر (تحميلٌ
 * كسول لم يصل، أو محرّكٌ لم يُفهم سطراً من أمثلته) صار البطل صندوقاً فارغاً
 * أمام كل زائر — بلا أي خطأ يراه أحد.
 */
import { expect, test } from "@playwright/test";
import { watch } from "./watch";

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
  const sodium = page.locator(".nlabel-row").filter({ hasText: "الصوديوم" }).first();
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
