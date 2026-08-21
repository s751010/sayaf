/** أدوات صغيرة مشتركة عبر التطبيق. */

/** يدمج أصناف CSS مع تجاهل القيم الفارغة. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** تنسيق سعر بأرقام عربية غربية مع فواصل (١٬٠٨٩ تربك القراءة في الأسعار). */
export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

/**
 * مبلغ **مع عملته** — لكل موضع يقرأ فيه إنسانٌ مالاً.
 *
 * ═══ لماذا دالة لا لصقُ «ر.س» عند كل نداء ═══
 *
 * `formatPrice` تعيد الرقم عارياً، والعملة كانت تُلصق يدوياً حيث تذكّر
 * الكاتب. فخرجت ستّة مواضع بلا عملة، أظهرها بطاقةُ الكاشير التي تقول
 * **«٨٦»** وحدها، وشاشةُ الزبون التي تقول «الإجمالي ٨٦». والمبلغ العاري
 * في شاشة دفع أسوأ من مبلغ خطأ: لا يعرف قارئه أهي ريالات أم قطع.
 *
 * تبقى `formatPrice` لما تُعرض عملته منفصلةً بتنسيق آخر (بطاقة الطبق).
 */
export function formatMoney(n: number, en = false): string {
  return `${formatPrice(n)} ${en ? "SAR" : "ر.س"}`;
}

/** تاريخ مقروء بالعربية. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("ar-SA", { dateStyle: "long" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** معرّف عنصر (anchor) من اسم تصنيف — يدعم العربية. */
export function categoryId(name: string): string {
  return `cat-${name.trim().replace(/\s+/g, "-")}`;
}

/** slug لاتيني/عربي نظيف من اسم المطعم. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * أرقام عربية-هندية (٠١٢٣…) و فارسية (۰۱۲۳…) → أرقام لاتينية.
 * لوحة المفاتيح العربية على الجوال تُدخلها افتراضياً، و`Number("١٢٥")` = NaN،
 * فكان السعر يسقط إلى صفر بصمت.
 */
export function normalizeDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) =>
    String(d.charCodeAt(0) & 0x0f)
  );
}

/** حقل رقمي من نموذج → رقم أو null (عند الفراغ/قيمة غير صالحة). */
export function numOrNull(v: string | null | undefined): number | null {
  const s = normalizeDigits(String(v ?? "").trim())
    // فاصلة عشرية عربية + فواصل آلاف
    .replace(/٫/g, ".")
    .replace(/[٬,\s]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** نص من نموذج → نص أو null عند الفراغ. */
export function strOrNull(v: string | null | undefined): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/**
 * التاجر قد يكتب «instagram.com/x» بلا مخطَّط، فينتج رابط نسبي مكسور.
 * نضيف https:// عند الحاجة ونرفض المخططات غير الآمنة.
 */
export function httpUrl(raw: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (/^(javascript|data|vbscript):/i.test(v)) return "#";
  return `https://${v.replace(/^\/+/, "")}`;
}

/**
 * رقم مجرّد → رابط wa.me، ورابط كامل يُترك كما هو.
 * `text` رسالة معبّأة مسبقاً (تُتجاهل مع الروابط الكاملة التي تحمل معاملاتها).
 */
export function whatsappUrl(raw: string, text?: string): string {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const digits = normalizeDigits(v).replace(/\D/g, "");
  if (!digits) return "#";
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${q}`;
}

/** نص مفصول بفواصل (عربية أو إنجليزية) → مصفوفة نظيفة. */
export function csvToArray(v: string | null | undefined): string[] {
  return String(v ?? "")
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
