/**
 * حارس كود الخصم — ثغرة `ILIKE` التي كانت تبيع الاشتراك بخمسة ريالات.
 *
 * ═══ ما كان ═══
 *
 * `paylink-create` كان يمرّر ما يكتبه التاجر إلى `ilike("code", …)` بعد
 * `trim().toUpperCase()` وحدهما. و`%` في `ILIKE` **محرف بدل** لا حرفٌ عادي،
 * فـ`promo_code: "%"` يطابق **كل** صفّ في `promo_codes`، و`limit(1)` يعيد
 * كوداً عشوائياً ⇒ خصمٌ **بلا معرفة أي كود**.
 *
 * وأثره مالٌ لا إزعاج: لو وُجد كود ١٠٠٪ هبط المبلغ إلى `PAYLINK_MIN_AMOUNT`
 * (٥ ريالات لباقة ٩٩ أو ٥٩٩)، و`paylink-webhook` يقبل أي مبلغ داخل المدى
 * فيُفعَّل الاشتراك كاملاً. والردّ كان يعيد `promo.code` الحقيقي، فصارت
 * `%` ثم `L%` ثم `LA%` **آلة تعداد** تكشف كل أكواد الخصم واحداً واحداً.
 *
 * ═══ لماذا `sanitizePromo` هي العلاج الصحيح ═══
 *
 * ليست تضييقاً جديداً: `buildOrderNumber` يمرّ بها أصلاً قبل ترميز الكود في
 * رقم الطلب، والويبهوك يقرؤه من هناك. أي أن النظام **يفترض سلفاً** أن الأكواد
 * حروف وأرقام فقط — وكودٌ بمحرف خارجها كان مكسوراً في الويبهوك قبل هذا
 * التغيير. فتطبيقها عند البحث **توحيدٌ** لا قيد.
 *
 * و`ilike` تبقى: عدم حساسية حالة الأحرف مقصودة، وقد زال البدل.
 */
import { describe, expect, it } from "vitest";

import {
  buildOrderNumber,
  parseOrderNumber,
  sanitizePromo,
} from "../../supabase/functions/_shared/plans";

/** محارف البدل في `LIKE`/`ILIKE` — هذه وحدها ما يجعل الكود استعلاماً. */
const WILDCARDS = ["%", "_"];

describe("sanitizePromo يقتل محارف البدل", () => {
  it.each([
    ["بدل وحده", "%"],
    ["بدل مزدوج", "%%"],
    ["شرطة سفلية", "_"],
    ["بادئة تعداد", "L%"],
    ["بادئة أطول", "LA%"],
    ["بدل داخل كود", "EID%2026"],
    ["بدل في الطرفين", "%EID%"],
    ["شرطة سفلية كبادئة", "_ID"],
    ["هروب SQL", "\\%"],
  ])("%s ⇒ بلا بدل", (_label, raw) => {
    const clean = sanitizePromo(raw);
    for (const w of WILDCARDS) expect(clean).not.toContain(w);
  });

  it("«%» وحدها تصير فارغة — فلا بحث أصلاً", () => {
    // الفراغ مهمّ: `resolveDiscount` يردّ `null` قبل أن يلمس القاعدة.
    expect(sanitizePromo("%")).toBe("");
    expect(sanitizePromo("%%%")).toBe("");
    expect(sanitizePromo("___")).toBe("");
  });

  it("الكود المشروع يمرّ كما هو (بأحرف كبيرة)", () => {
    expect(sanitizePromo("eid2026")).toBe("EID2026");
    expect(sanitizePromo("  ramadan50  ")).toBe("RAMADAN50");
    expect(sanitizePromo("WELCOME")).toBe("WELCOME");
  });

  it("يقصّ عند ٢٤ محرفاً فلا يُبنى رقم طلب بلا سقف", () => {
    expect(sanitizePromo("A".repeat(80))).toHaveLength(24);
  });
});

describe("parseOrderNumber ينظّف الكود عند الخروج", () => {
  /**
   * ⚠️ هذا هو الطرف الثاني للثغرة. الويبهوك يسقط إلى `merchantOrderNumber`
   * **من جسم الطلب** حين تخلو الفاتورة من رقم — وجسم ويبهوك PayLink **بلا
   * توقيع**، أي مدخل مهاجم. فكود `%` كان يصل إلى `ilike` هناك أيضاً.
   */
  const USER = "11111111-2222-3333-4444-555555555555";

  it("رقم طلب مصنوع بكود بدل لا يُخرج بدلاً", () => {
    const forged = ["cm", USER, "standard", "monthly", "abc", "%"].join("~");
    const parsed = parseOrderNumber(forged);
    expect(parsed).not.toBeNull();
    // `%` تُنظَّف إلى فراغ ⇒ تُعامَل كـ«بلا كود» لا ككود يطابق الجميع.
    expect(parsed?.promoCode).toBeNull();
  });

  it("بادئة تعداد في رقم الطلب تُنزع", () => {
    const forged = ["cm", USER, "standard", "monthly", "abc", "LA%"].join("~");
    expect(parseOrderNumber(forged)?.promoCode).toBe("LA");
  });

  it("الكود المشروع يبقى سليماً ذهاباً وإياباً", () => {
    const built = buildOrderNumber(USER, "standard", "monthly", "EID2026");
    const parsed = parseOrderNumber(built);
    expect(parsed?.promoCode).toBe("EID2026");
    expect(parsed?.userId).toBe(USER);
    expect(parsed?.planId).toBe("standard");
    expect(parsed?.cycle).toBe("monthly");
  });

  it("بلا كود يبقى بلا كود", () => {
    const built = buildOrderNumber(USER, "standard", "yearly");
    expect(parseOrderNumber(built)?.promoCode).toBeNull();
  });
});

describe("لا يعود الكود الخام إلى استعلام في الشيفرة", () => {
  /**
   * حارس نصّي: إن أعاد أحدٌ يوماً `trim().toUpperCase()` مكان `sanitizePromo`
   * قبل `ilike` سقط هذا الفحص. أرخص من انتظار ظهور الخصم في `revenue_log`.
   */
  it("resolveDiscount يستدعي sanitizePromo", async () => {
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const src = readFileSync(
      fileURLToPath(
        new URL("../../supabase/functions/paylink-create/index.ts", import.meta.url),
      ),
      "utf8",
    );
    expect(src).toContain("sanitizePromo(rawCode)");
    expect(src).not.toContain("rawCode.trim().toUpperCase()");
  });
});
