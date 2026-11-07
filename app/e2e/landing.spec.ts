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
  await page.goto("/");

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
