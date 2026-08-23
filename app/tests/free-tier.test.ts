/**
 * التسعير — الباقة الوحيدة، وحدود من لا اشتراك له.
 *
 * ═══ لماذا وُجد هذا الفحص ═══
 *
 * لا توجد طبقة مجانية تُسوَّق؛ المدخل تجربةٌ تنتهي. لكن من لا اشتراك له يبقى
 * له منيوه، وهذه الحدود تصف ما يبقى. والإغراء الطبيعي لأي
 * مساهم لاحق أن «يُكمل الناقص» فيضيف `free` إلى `PLANS` أو إلى
 * `PLAN_CATALOG` في الخادم. وذاك يفتح سطحاً يُنشئ فواتير بصفر ريال —
 * وهو حرفياً الخلل الذي أُغلق حين حُذفت `premium` من كتالوج الخادم
 * (التعليق في `_shared/plans.ts` يوثّقه: «سطحٌ ميّت يُغلق لا يُترك»).
 *
 * ويحرس كذلك أن **المنيو نفسه بلا سقف**: لا حدّ على عدد الأصناف ولا القوائم
 * لمن لا اشتراك له. وهذه سياسةُ عدم احتجاز — **لا تُسوَّق ولا تُعلَن**
 * (المنتج اشتراكٌ بتجربة تنتهي، §`plans.ts`) — لكنها تبقى قائمة: إطفاء
 * منيو مطعم عامل لأنه لم يدفع فعلٌ ثمنُه أضعاف اشتراك.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FREE_LIMITS, PLANS } from "@/lib/plans";
import { DEFAULT_ENTITLEMENTS } from "@/lib/entitlements";

const shared = readFileSync(
  fileURLToPath(new URL("../../supabase/functions/_shared/plans.ts", import.meta.url)),
  "utf8"
);

describe("الطبقة المجانية ليست باقة تُباع", () => {
  it("لا `free` في كتالوج الواجهة", () => {
    expect(PLANS.map((p) => p.id)).not.toContain("free");
  });

  it("لا `free` في كتالوج الدفع على الخادم", () => {
    // قراءة نصّية لا استيراد: الملفّ بصيغة Deno، والنصّ يفحص ما يُنشَر فعلاً.
    const catalog = shared.slice(shared.indexOf("PLAN_CATALOG"));
    expect(catalog).not.toMatch(/\bfree\b/);
  });

  it("الخادم يحمل نفس السنوي — وإلا حصّل غير ما عُرض", () => {
    // السنوي لم يعد `monthly × 11`. لو بقي مشتقّاً في الخادم لأعطى ٦٤٩
    // بينما تعرض الصفحة ٥٩٩ — أي فرقٌ يدفعه التاجر بلا أن يراه.
    expect(shared).toMatch(/yearly\s*:\s*599\b/);
    expect(shared).not.toMatch(/YEARLY_MONTHS/);
  });

  it("الباقة المدفوعة الوحيدة standard — ٩٩ شهرياً و٥٩٩ سنوياً", () => {
    // الثابت السادس: رقم الطلب في الويبهوك يُقرأ من المعرّف والسعر.
    expect(PLANS).toHaveLength(1);
    expect(PLANS[0].id).toBe("standard");
    expect(PLANS[0].monthly).toBe(99);
    // السنوي رقم مستقلّ لا مشتقّ — لو عاد اشتقاقه من الشهري لأعطى ٦٤٩،
    // أي مبلغاً غير الذي عُرض على التاجر.
    expect(PLANS[0].yearly).toBe(599);
  });
});

describe("من لا اشتراك له: المنيو يبقى بلا سقف", () => {
  it("لا حدّ على الأصناف ولا القوائم", () => {
    expect(FREE_LIMITS.maxDishes).toBeNull();
    expect(FREE_LIMITS.maxMenus).toBeNull();
  });

  it("ثنائي اللغة مجاني — المنافسون يعطونه بلا مقابل", () => {
    expect(FREE_LIMITS.english).toBe(true);
  });

  it("سلّة الطلبات مجانية — منافسو المجاني يعطون طلبات واتساب بلا مقابل", () => {
    // وضعُها خلف جدار يجعل مجانيّنا أضعف من مجانيّهم، ويحوّل أقوى ورقة
    // في يدنا إلى سبب انصراف.
    expect(FREE_LIMITS.cart).toBe(true);
  });

  it("أدوات التشغيل مغلقة في المجاني", () => {
    expect(FREE_LIMITS.loyalty).toBe(false);
    expect(FREE_LIMITS.cashier).toBe(false);
    expect(FREE_LIMITS.analytics).toBe(false);
    expect(FREE_LIMITS.cards).toBe(false);
    expect(FREE_LIMITS.api).toBe(false);
  });

  it("الدفع الإلكتروني مغلق في المجاني — وغير مُفعَّل أصلاً", () => {
    expect(FREE_LIMITS.onlinePayment).toBe(false);
  });

});

/**
 * ═══ حارسٌ رُفع بقرار صريح — ٢٠٢٦/٠٨/٢٢ ═══
 *
 * كان هنا فحصٌ يُسقط أي ادّعاء دفعٍ إلكتروني في نصّ تسويقي، لأن المسار كان
 * **مبنيّاً وغير موصول**: الصفحة كانت تعِد بـ«مدى · Apple Pay» بما لا يجده
 * التاجر، وصفحةٌ تبيع ما لا يعمل تهدم الثقة.
 *
 * والمسار وُصل: `Cart.tsx` ⇐ `CartReview.tsx` ⇐ `paylink-order-create` ⇐
 * `order-verify`، والتاجر يربط بوّابته من `PaymentSettingsCard`. فرُفع الفحص
 * **بقرار المالك** — وهو ما نصّ عليه الفحص نفسه: «يوم يُفعَّل المسار يُحذف
 * بقرار صريح، لا يمرّ الادّعاء سهواً».
 *
 * ⚠️ وما يبقى محروساً: `FREE_LIMITS.onlinePayment` مغلق (أعلاه)، فالدفع
 * ميزةُ اشتراك لا شيءٌ يُفتح لمن لم يدفع.
 */

describe("الحالة الابتدائية تسقط إلى الأقلّ لا الأكثر", () => {
  it("قبل حسم الصلاحيات لا تُمنح أداة مدفوعة", () => {
    // وميضُ صلاحية ثم إغلاقها أسوأ من انتظار — والاتجاه الصحيح للسقوط
    // هنا هو الأقلّ: لا نمنح ما لم يُدفع ثمنه.
    expect(DEFAULT_ENTITLEMENTS.loading).toBe(true);
    expect(DEFAULT_ENTITLEMENTS.active).toBe(false);
    expect(DEFAULT_ENTITLEMENTS.analytics).toBe(false);
    expect(DEFAULT_ENTITLEMENTS.loyalty).toBe(false);
    expect(DEFAULT_ENTITLEMENTS.onlinePayment).toBe(false);
  });

  it("لكنّ المنيو نفسه يبقى بلا سقف حتى أثناء التحميل", () => {
    expect(DEFAULT_ENTITLEMENTS.maxDishes).toBeNull();
  });
});
