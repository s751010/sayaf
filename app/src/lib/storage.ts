/**
 * خريطة مفاتيح التخزين المحلي + قراءة/كتابة آمنة (لا ترمي أخطاء في وضع الخصوصية).
 * `cm2_session` مفتاح جديد كي لا يتعارض مع جلسة النسخة القديمة (`cm_session`).
 */
export const K = {
  /** معرّف آخر طلب دفعه الزبون — احتياط حين يقصّ رابط العودة معاملاته. */
  LAST_ORDER: "cm_last_order",
  SESSION: "cm2_session",
  THEME: "cm2_theme",
  /** سر المؤسس — sessionStorage فقط (نفس سلوك النسخة الأصلية). */
  FSECRET: "cm_fsecret",
  /** رقم الطاولة من ?table= — sessionStorage (يخص الزيارة الحالية). */
  TABLE: "cm_table",
  /**
   * رمز الكاشير وslug مطعمه — sessionStorage كي لا يبقى الرمز على جهاز مشترك
   * بعد إغلاق المتصفح، وكي لا يعيد الكاشير إدخاله مع كل زبون.
   */
  STAFF: "cm_staff",
  /**
   * الإعلانات التي أخفاها التاجر — localStorage، معرّفات مفصولة بفواصل.
   * الإخفاء محلي عمداً: لا عمود «مقروء لكل تاجر» في القاعدة، وكتابة صف لكل
   * (تاجر × إعلان) ثمنٌ لا يستحقه إخفاء شريط.
   */
  SEEN_ANNOUNCEMENTS: "cm2_seen_ann",
  /**
   * سلة الزبون — sessionStorage، ويُلحق بها معرّف المطعم (`cm_cart_<id>`).
   *
   * الجلسة لا الدائم: سلة الأمس على طاولة مطعم آخر ليست نيّة الزبون، والسلة
   * لا تحمل مبلغاً ولا هوية — أسطر ونيّة فقط، والتسعير على الخادم.
   */
  CART: "cm_cart",
  /**
   * نصّ وصفة الطبق في الحاسبة — localStorage، ويُلحق به معرّف الطبق
   * (`cm2_recipe_<id>`).
   *
   * ⚠️ **على هذا الجهاز وحده**: لا عمود للوصفة في القاعدة بعد (قرار المالك —
   * LAUNCH.md). فالأرقام المحسوبة تُحفظ في القاعدة، والنصّ الذي أنتجها لا.
   */
  RECIPE: "cm2_recipe",
  /**
   * موافقة زبون المنيو على أدوات التتبّع الإعلانية للتاجر — localStorage،
   * `yes` أو `no`. الرفض يُحفظ كالقبول: سؤالٌ يتكرّر مع كل فتح منيو إزعاجٌ
   * يدفع إلى «قبول» لا يُقصد، وتلك ليست موافقة.
   */
  PIXEL_CONSENT: "cm2_pixel_consent",
  /**
   * أخفى التاجر بطاقة «اربط منيوك بقوقل ماب» في صفحة الأكواد — localStorage،
   * القيمة `1`. محلي عمداً كإخفاء الإعلانات: نصيحةٌ لا حالة حساب، ولا تستحقّ
   * عموداً ولا نداءً.
   */
  MAPS_TIP_DISMISSED: "cm2_maps_tip",
} as const;

function store(session: boolean): Storage | null {
  try {
    return session ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

export function getItem(key: string, session = false): string | null {
  try {
    return store(session)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string, session = false): void {
  try {
    store(session)?.setItem(key, value);
  } catch {
    /* التخزين ممتلئ أو محجوب — نتجاهل بصمت */
  }
}

export function removeItem(key: string, session = false): void {
  try {
    store(session)?.removeItem(key);
  } catch {
    /* نتجاهل */
  }
}

export function getJSON<T>(key: string, session = false): T | null {
  const raw = getItem(key, session);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setJSON(key: string, value: unknown, session = false): void {
  setItem(key, JSON.stringify(value), session);
}
