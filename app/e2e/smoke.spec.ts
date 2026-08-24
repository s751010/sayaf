/**
 * فحص الإقلاع — خمس صفحات في متصفّح حقيقي.
 *
 * ═══ ما يفحصه، وما لا يفحصه ═══
 *
 * لا يفحص منطقاً ولا بيانات: يفحص أن الصفحة **تُركَّب ولا تنهار**، وأن مرساةً
 * واحدة من محتواها ظهرت فعلاً. هذا بالضبط ما فات على `typecheck` و`test`
 * و`build` يوم أطفأ `React #310` كل منيو.
 *
 * ═══ لماذا يُفرَّق بين `pageerror` وخطأ الشبكة ═══
 *
 * `pageerror` استثناءٌ غير ملتقَط في التطبيق نفسه — وهو **دائماً** عطلنا.
 * أمّا خطأ console من نوع «تعذّر تحميل مورد» فقد يكون شبكةً محجوبة في بيئة
 * الفحص (لا Supabase في العدّاء)، وإسقاط الفحص عليه يجعله ينذر بما لا يملك
 * إصلاحه — وحارسٌ ينذر كذباً يُطفأ بعد أسبوع.
 *
 * ⚠️ **و`/demo` هي أهمّ سطر هنا**: بيانات محلّية بلا شبكة إطلاقاً، فنجاحها
 * يعني أن شجرة المنيو كاملةً (ترويسة · بطاقات · نافذة الطبق · سلّة) تُركَّب
 * سليمة — وهي الشجرة نفسها التي يفتحها زبون التاجر من كود QR.
 */
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

/** أخطاء يسبّبها انقطاع الشبكة لا الشيفرة — تُسجَّل ولا تُسقِط. */
const NETWORK_NOISE = /Failed to load resource|net::ERR_|ERR_CONNECTION|fetch/i;

function watch(page: Page): { crashes: string[] } {
  const crashes: string[] = [];
  page.on("pageerror", (e) => crashes.push(`pageerror: ${e.message}`));
  page.on("console", (m: ConsoleMessage) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (!NETWORK_NOISE.test(text)) crashes.push(`console: ${text}`);
  });
  return { crashes };
}

/**
 * ⚠️ **المرساة تُقرأ من محتوى الصفحة لا من شريط التنقّل.**
 *
 * كانت مرساة `/help` كلمة «المساعدة»، وأوّل مطابقٍ لها **رابطٌ في الترويسة**
 * — وهو مخفيّ على الجوال (القائمة مطويّة)، فسقط الفحص على صفحة سليمة تماماً.
 * ولذلك صار ما يُفحص عنواناً (`heading`) حيث للصفحة عنوان.
 */
const PAGES = [
  { path: "/", anchor: "ابدأ تجربتك", role: "link", label: "الهبوط" },
  { path: "/demo", anchor: "مطعم الديوان", role: "text", label: "المنيو التجريبي" },
  { path: "/login", anchor: "البريد الإلكتروني", role: "text", label: "الدخول" },
  { path: "/restaurants", anchor: "دليل المطاعم", role: "heading", label: "الدليل" },
  { path: "/help", anchor: "المساعدة والتواصل", role: "heading", label: "المساعدة" },
] as const;

for (const p of PAGES) {
  test(`${p.label} (${p.path}) تُقلع بلا انهيار`, async ({ page }) => {
    const { crashes } = watch(page);

    await page.goto(p.path);

    // الجذر مركَّب — `ErrorBoundary` يفرغ الشجرة عند الانهيار فيسقط هذا أوّلاً.
    //
    // ⚠️ **بالعنصر الابن لا بـ`toBeEmpty`**: تلك تعدّ العنصر فارغاً إن لم يكن
    // فيه **نصّ**، وهيكل التحميل (`skeleton`) عناصر بلا حرف واحد — فكانت
    // تُسقط الفحص على حالةٍ سليمة تماماً.
    await expect(page.locator("#root > *").first()).toBeAttached();
    const anchor =
      p.role === "heading"
        ? page.getByRole("heading", { name: p.anchor })
        : p.role === "link"
          ? page.getByRole("link", { name: p.anchor })
          : page.getByText(p.anchor, { exact: false });
    await expect(anchor.first()).toBeVisible();

    // مهلة قصيرة بعد الرسم: عطل الخطّافات لا يقع عند التركيب بل بعد أوّل
    // تحديث حالة — أي بعد أن تعود الشبكة (أو تفشل) وتُعاد الشجرة.
    await page.waitForTimeout(1500);
    expect(crashes, `انهيارات في ${p.path}:\n${crashes.join("\n")}`).toEqual([]);
  });
}

test("المنيو التجريبي يفتح نافذة الطبق", async ({ page }) => {
  // أثقل مسار في المنتج: بطاقة ⇒ نافذة ⇒ إضافات. وهو المسار الذي انهار فعلاً.
  const { crashes } = watch(page);
  await page.goto("/demo");

  await page.getByText("مطعم الديوان", { exact: false }).first().waitFor();
  await page.getByRole("button").filter({ hasText: /ر\.س/ }).first().click();

  await expect(page.getByRole("dialog").first()).toBeVisible();
  expect(crashes, crashes.join("\n")).toEqual([]);
});

test("رابط منيو لا وجود له لا ينهار", async ({ page }) => {
  /**
   * المسار `/:slug` يبتلع كل عنوان من مقطع واحد — أي أن **خطأً مطبعياً في
   * كود QR** يمرّ من هنا. والمطلوب أن يرى الزائر شيئاً (هيكل تحميل ثم رسالة)
   * لا شاشةً بيضاء ولا انهياراً.
   *
   * ولا يُفحص نصّ «غير موجود» بعينه: بلوغه يحتاج ردّاً من القاعدة، وبيئة
   * الفحص قد تكون بلا شبكة — ففحصُه يجعل الحارس ينذر بما لا يملك إصلاحه.
   */
  const { crashes } = watch(page);
  await page.goto("/لا-يوجد-هذا-المسار-إطلاقاً");
  await expect(page.locator("#root > *").first()).toBeAttached();
  await page.waitForTimeout(1500);
  expect(crashes, crashes.join("\n")).toEqual([]);
});
