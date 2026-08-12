/**
 * الطبقة المجانية — حدودها، وأنها ليست باقة تُشترى.
 *
 * ═══ لماذا وُجد هذا الفحص ═══
 *
 * المجاني هنا **ليس باقة** بل حالة من لا اشتراك له. والإغراء الطبيعي لأي
 * مساهم لاحق أن «يُكمل الناقص» فيضيف `free` إلى `PLANS` أو إلى
 * `PLAN_CATALOG` في الخادم. وذاك يفتح سطحاً يُنشئ فواتير بصفر ريال —
 * وهو حرفياً الخلل الذي أُغلق حين حُذفت `premium` من كتالوج الخادم
 * (التعليق في `_shared/plans.ts` يوثّقه: «سطحٌ ميّت يُغلق لا يُترك»).
 *
 * ويحرس كذلك القاعدة التي يقوم عليها نموذج العمل: **المنيو نفسه مجاني**.
 * أي حدّ يُوضع على عدد الأصناف أو القوائم في الطبقة المجانية يجعل المنتج
 * أضعف من منيو مجاني في السوق، ويعيد الجدار إلى حيث لا يحمي إيراداً.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FREE_FEATURES, FREE_LIMITS, PLANS } from "@/lib/plans";
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

  it("الباقة المدفوعة الوحيدة ما زالت standard بـ٩٩", () => {
    // الثابت السادس: رقم الطلب في الويبهوك يُقرأ من المعرّف والسعر.
    expect(PLANS).toHaveLength(1);
    expect(PLANS[0].id).toBe("standard");
    expect(PLANS[0].monthly).toBe(99);
  });
});

describe("المنيو نفسه مجاني بلا سقف", () => {
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

  it("قائمة مزايا المجاني ليست فارغة ولا تعِد بأداة مدفوعة", () => {
    expect(FREE_FEATURES.length).toBeGreaterThan(3);
    const text = FREE_FEATURES.join(" ");
    for (const paid of ["الولاء", "الكاشير", "تحليلات", "API"]) {
      expect(text, `المجاني يعِد بأداة مدفوعة: ${paid}`).not.toContain(paid);
    }
  });
});

/**
 * ═══ الحارس الأهمّ ═══
 *
 * الدفع الإلكتروني **مبنيّ وغير مُفعَّل**. وقد كانت الصفحة تصدّر بطاقة الـ٩٩
 * بـ«سلّة طلبات ودفع إلكتروني» وتضع في البطل شريحة «مدى · Apple Pay» — أي
 * أنها تعِد بما لا يجده التاجر. وصفحةٌ تبيع ما لا يعمل أسوأ من صفحة تنقصها
 * ميزة: الأولى تهدم الثقة، والثانية تؤجّلها.
 *
 * فيسقط هذا الفحص إن عاد أي ادّعاء دفعٍ إلى نصّ تسويقي — ويوم يُفعَّل المسار
 * يُحذف الفحص بقرار صريح، لا يمرّ الادّعاء سهواً.
 */
describe("لا ادّعاء دفعٍ إلكتروني قبل تفعيله", () => {
  const CLAIMS = ["Apple Pay", "مدى", "دفع إلكتروني", "الدفع الإلكتروني", "بلا عمولة على أي طلب"];

  it("لا في مزايا المجاني", () => {
    const text = FREE_FEATURES.join(" ");
    for (const c of CLAIMS) expect(text, `ادّعاء دفع: ${c}`).not.toContain(c);
  });

  it("ولا في مزايا الباقة المدفوعة", () => {
    const text = PLANS.flatMap((p) => p.features).join(" ");
    for (const c of CLAIMS) expect(text, `ادّعاء دفع: ${c}`).not.toContain(c);
  });
});

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
