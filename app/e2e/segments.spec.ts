/**
 * صفحات الشرائح `/for/<slug>` — تُقلع، ولا تفيض أفقياً على 320 ولا 1280، ونداؤها
 * الوحيد يقود إلى التسجيل، والجوّال فيها منيوٌ حقيقي يبدّل طابعه.
 *
 * ⚠️ الشبكة إلى Supabase محجوبة هنا (أيام التجربة · إعدادات الذيل): `watch`
 * يتجاهل ضجيج الشبكة ويُسقط الفحص على `pageerror` وحده — أي على عطلنا.
 */
import { expect, test } from "@playwright/test";
import { watch } from "./watch";

const SEGMENTS = [
  { path: "/for/specialty-coffee", heading: "منيو يقول لزبونك كم كافيين في كوبه" },
  { path: "/for/traditional-restaurants", heading: "منيو بروح مكانك، وأسعاره تتعدّل بضغطة" },
  { path: "/for/food-trucks", heading: "العربة تتنقّل، والكود ثابت" },
] as const;

const WIDTHS = [320, 1280] as const;

for (const s of SEGMENTS) {
  test(`${s.path} تُقلع بلا فيض على ${WIDTHS.join(" و")} ونداؤها إلى التسجيل`, async ({ page }) => {
    const { crashes } = watch(page);

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(s.path);
      await expect(page.getByRole("heading", { level: 1, name: s.heading })).toBeVisible();
      // الإطار يُعلن جاهزيته ثم تُرسَل الهوية — انتظار قصير كي يُقاس ما سيُرى.
      await page.waitForTimeout(800);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw, `${s.path} @${width}: scrollWidth ${sw}`).toBeLessThanOrEqual(width);
    }

    // طابع المعاينة: ثلاثة، والأوّل مختار، والضغط يبدّل.
    const radios = page.getByRole("radiogroup", { name: "طابع المعاينة" }).getByRole("radio");
    await expect(radios).toHaveCount(3);
    await expect(radios.first()).toHaveAttribute("aria-checked", "true");
    await radios.nth(1).click();
    await expect(radios.nth(1)).toHaveAttribute("aria-checked", "true");

    // النداء الوحيد: كل رابطٍ بلفظه يقود إلى التسجيل.
    const ctas = page.getByRole("link", { name: "ابدأ تجربتك" });
    const count = await ctas.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(ctas.nth(i)).toHaveAttribute("href", "/login?mode=signup");
    }
    await page.locator("main").getByRole("link", { name: "ابدأ تجربتك" }).first().click();
    await expect(page).toHaveURL(/\/login\?mode=signup$/);
    await expect(page.getByText("البريد الإلكتروني").first()).toBeVisible();

    expect(crashes, crashes.join("\n")).toEqual([]);
  });
}

test("شريحة مجهولة تعرض «غير موجودة»، و`/for` وحدها تعود إلى الهبوط", async ({ page }) => {
  const { crashes } = watch(page);
  await page.goto("/for/nope");
  await expect(page.getByRole("heading", { name: "الصفحة غير موجودة" })).toBeVisible();
  await page.goto("/for");
  await expect(page).toHaveURL(/\/$/);
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("الذيل يربط الشرائح الثلاث", async ({ page }) => {
  await page.goto("/for/food-trucks");
  const footer = page.locator("footer");
  for (const label of ["للكافيه المختصّ", "للمطعم الشعبي", "لعربات الطعام"]) {
    await expect(footer.getByRole("link", { name: label })).toHaveCount(1);
  }
});
