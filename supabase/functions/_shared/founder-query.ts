/**
 * ⚠️ **القائمة البيضاء تحرس الجدول والأعمدة معاً، أو لا تحرس شيئاً.**
 *
 * كان `query` يُمرَّر إلى PostgREST كما هو (بعد التأكّد أنه يبدأ بـ`?`) —
 * وPostgREST يفهم في `select` **الموارد المضمَّنة** عبر المفاتيح الأجنبية:
 *
 *   restaurants?select=*,restaurant_payment_settings(*)   ⇒ مفاتيح PayLink
 *   restaurants?select=*,api_keys(*)                      ⇒ هاشات المفاتيح
 *   restaurants?select=*,staff_pins(*)                    ⇒ هاشات رموز الكاشير
 *
 * أي أن ثمانية جداول مسموحة كانت باباً إلى السكيما كلّها. والبوّابة سرٌّ في
 * `sessionStorage` أو جلسة — وكلاهما يُسرق بـXSS واحد على نطاق اللوحة.
 *
 * فالفحص هنا على ثلاثة محاور: معاملات معروفة فقط · `select` بلا أقواس ·
 * وسقف طول يمنع استعلاماً مُصمَّماً لإرهاق القاعدة.
 */

/** معاملات PostgREST المسموحة — وما عداها مرفوض لا مُتجاهَل. */
const ALLOWED_PARAMS = new Set([
  "select", "order", "limit", "offset", "and", "or", "on_conflict",
]);

/** أعمدة الترشيح (`?id=eq.x`) تُقبل بأسمائها: حرف/رقم/شرطة سفلية فقط. */
const COLUMN_RE = /^[a-z_][a-z0-9_]*$/i;

export type QueryRejection =
  | "not_query"
  | "too_long"
  | "embedded_select"
  | "unknown_param";

const MAX_QUERY = 2000;

export function checkFounderQuery(query: string): QueryRejection | null {
  if (!query) return null;
  if (!query.startsWith("?")) return "not_query";
  if (query.length > MAX_QUERY) return "too_long";

  const params = new URLSearchParams(query.slice(1));
  for (const [key, value] of params) {
    if (key === "select") {
      /**
       * القوس هو **كل** ما يميّز المورد المضمَّن في نحو PostgREST
       * (`table(cols)`)، فرفضه يقطع المسار كلّه. والنجمة تبقى مقبولة:
       * المؤسّس يقرأ أعمدة جدوله كاملةً، والحدّ هو ألّا يعبر إلى غيره.
       */
      if (value.includes("(") || value.includes(")")) return "embedded_select";
      continue;
    }
    if (ALLOWED_PARAMS.has(key)) continue;
    // ما تبقّى ترشيحٌ على عمود (`id=eq.x`) — يُقبل إن كان اسم عمود سليماً.
    if (!COLUMN_RE.test(key)) return "unknown_param";
  }
  return null;
}
