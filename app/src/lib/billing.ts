/**
 * الفوترة — مصدر واحد لإعدادات التحصيل ولبدء الاشتراك.
 *
 * ═══ لماذا هذا الملف أصلاً ═══
 *
 * كان قفل نشر المنيو مشتقّاً من **مفتاح بوّابة الدفع** في الكود:
 *
 * ```ts
 * export const ENFORCE_MENU_PUBLISHING = !MOYASAR_PK.startsWith("pk_test");
 * ```
 *
 * وهذا اقتران بين قرارين لا علاقة لأحدهما بالآخر. أثره العملي: تبديل مفتاح
 * الدفع — أو حذف البوّابة كما فعلنا — **يُطفئ منيوهات كل التجّار دفعةً واحدة**
 * لأن `is_menu_published` تشترط اشتراكاً نشطاً غير منتهٍ، والقاعدة فيها ١٨
 * اشتراك تجربة تنتهي في يوم واحد.
 *
 * صار القفل **قرارك أنت** في `site_settings.billing`، تفتحه من لوحتك بعد أن
 * تتأكّد أن أول دفعة وصلت فعلاً.
 *
 * ═══ السقوط الآمن مقصود ═══
 *
 * أي فشل — شبكة، مفتاح غائب، JSON تالف — يعيد `enforce_publishing: false`.
 * عطلٌ عابر عندنا يجب أن يُبقي منيوهات التجّار تعمل لا أن يُطفئها. والقفل
 * **ميزة تحصيل لا حدّ أمني**: محتوى المنيو عام بطبعه (يُقرأ من كود QR على
 * الطاولة)، والحماية الحقيقية للبيانات في سياسات RLS.
 */
import { callFunction, rest } from "./api";

export type BillingSettings = {
  /** هل تُقبل اشتراكات جديدة؟ `false` = مفتاح إيقاف الطوارئ. */
  enabled: boolean;
  /** هل يُقفل نشر منيو من لا اشتراك له؟ */
  enforce_publishing: boolean;
};

/** الافتراضي عند أي غياب أو فشل — الأكثر تسامحاً مع التاجر. */
export const BILLING_FALLBACK: BillingSettings = {
  enabled: true,
  enforce_publishing: false,
};

type SettingRow = { key: string; value: unknown };

function parse(value: unknown): BillingSettings {
  if (!value || typeof value !== "object") return BILLING_FALLBACK;
  const v = value as Record<string, unknown>;
  return {
    enabled: v.enabled !== false,
    enforce_publishing: v.enforce_publishing === true,
  };
}

/**
 * ذاكرة لعمر الصفحة: صفحة المنيو تسأل مرّة عند التحميل، ولا معنى لتكرار
 * الطلب — والقيمة تتغيّر بقرار مؤسّس لا بحدثٍ لحظي.
 */
let cached: Promise<BillingSettings> | null = null;

export function getBillingSettings(): Promise<BillingSettings> {
  cached ??= rest<SettingRow[]>("site_settings?key=eq.billing&select=key,value", {
    anonymous: true,
  })
    .then((rows) => parse(rows[0]?.value))
    .catch(() => BILLING_FALLBACK);
  return cached;
}

/** يُبطل الذاكرة — ينادى بعد أن يغيّر المؤسّس المفاتيح من لوحته. */
export function clearBillingCache(): void {
  cached = null;
}

/* ══ بدء الاشتراك ═════════════════════════════════════════════════════ */

export type CheckoutSession = {
  /** رابط صفحة الدفع في PayLink — نغادر إليه. */
  url: string;
  transactionNo: string;
  /** المبلغ **كما حسبه الخادم** — هو الصادق لا ما حسبناه في المتصفّح. */
  amount: number;
  discount: number;
  promo_code: string | null;
  plan_name: string;
};

/**
 * ينشئ فاتورة PayLink ويعيد رابط الدفع.
 *
 * ⚠️ **لا نُرسل مبلغاً إطلاقاً** — `plan_id` و`cycle` فقط، والخادم يشتقّ السعر
 * من جدوله. نفس قاعدة سلة الزبون (§13): أي مبلغ من العميل قابل للعبث.
 *
 * والتفعيل **لا يحدث هنا ولا عند العودة**: `paylink-webhook` وحدها تُنشئ
 * الاشتراك بعد أن تسأل PayLink بمفاتيحنا عن حالة الفاتورة.
 */
export function startSubscription(
  cycle: "monthly" | "yearly",
  promoCode?: string
): Promise<CheckoutSession> {
  return callFunction<CheckoutSession>("paylink-create", {
    plan_id: "standard",
    cycle,
    ...(promoCode?.trim() ? { promo_code: promoCode.trim() } : {}),
  });
}
