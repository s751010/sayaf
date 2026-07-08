/** أدوات صغيرة مشتركة عبر التطبيق. */

/** يدمج أصناف CSS مع تجاهل القيم الفارغة. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** تنسيق سعر بأرقام عربية غربية مع فواصل (١٬٠٨٩ تربك القراءة في الأسعار). */
export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
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

/** حقل رقمي من نموذج → رقم أو null (عند الفراغ/قيمة غير صالحة). */
export function numOrNull(v: string | null | undefined): number | null {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** نص من نموذج → نص أو null عند الفراغ. */
export function strOrNull(v: string | null | undefined): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

/** نص مفصول بفواصل (عربية أو إنجليزية) → مصفوفة نظيفة. */
export function csvToArray(v: string | null | undefined): string[] {
  return String(v ?? "")
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
