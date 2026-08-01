/**
 * التصنيفات: توحيدها وترتيبها.
 *
 * مشكلتان أبلغ عنهما التاجر: التصنيف حقل نصّي حر فيصبح «مشاوي» و«المشاوي»
 * تصنيفين، وترتيب التصنيفات في المنيو خارج سيطرته (كان ترتيب أول ظهور لطبق).
 *
 * الترتيب يُخزَّن في `restaurants.category_order` نصّاً يحمل JSON — نفس
 * اتفاقية `working_hours` و`dishes.options` القائمة في المشروع.
 */
import type { Dish } from "./types";

/** مفتاح المقارنة: بلا «ال» التعريف ولا تشكيل، بهمزات وتاء مربوطة موحّدة. */
export function categoryKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/^ال/, "")
    .replace(/\s+/g, " ");
}

/** يعيد التصنيف المعروف المطابق (ولو اختلف رسمه)، أو `null`. */
export function matchKnownCategory(raw: string, known: string[]): string | null {
  const key = categoryKey(raw);
  if (!key) return null;
  return known.find((k) => categoryKey(k) === key) ?? null;
}

/** التصنيفات الموجودة فعلاً في الأطباق، بلا تكرار. */
export function categoriesOf(dishes: Dish[]): string[] {
  const seen = new Map<string, string>();
  for (const d of dishes) {
    const c = d.category?.trim();
    if (!c) continue;
    const k = categoryKey(c);
    if (!seen.has(k)) seen.set(k, c);
  }
  return [...seen.values()];
}

/** `restaurants.category_order` → مصفوفة أسماء. أي تلف في القيمة = بلا ترتيب. */
export function parseCategoryOrder(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && v.trim() !== "");
  } catch {
    return [];
  }
}

export function serializeCategoryOrder(order: string[]): string | null {
  return order.length ? JSON.stringify(order) : null;
}

/**
 * يرتّب أسماء التصنيفات حسب ترتيب التاجر.
 * ما ليس في الترتيب المحفوظ (تصنيف جديد) يأتي بعده مرتّباً أبجدياً — فلا
 * يختفي ولا يقفز إلى الأعلى.
 */
export function sortCategories(names: string[], order: string[]): string[] {
  const rank = new Map(order.map((name, i) => [categoryKey(name), i]));
  return [...names].sort((a, b) => {
    const ra = rank.get(categoryKey(a));
    const rb = rank.get(categoryKey(b));
    if (ra !== undefined && rb !== undefined) return ra - rb;
    if (ra !== undefined) return -1;
    if (rb !== undefined) return 1;
    return a.localeCompare(b, "ar");
  });
}

/**
 * يدمج ترتيباً محفوظاً مع التصنيفات الحالية:
 * يُسقط ما لم يعد له أطباق، ويُلحق الجديد في آخر القائمة.
 */
export function reconcileOrder(order: string[], current: string[]): string[] {
  const currentKeys = new Set(current.map(categoryKey));
  const kept = order.filter((n) => currentKeys.has(categoryKey(n)));
  const keptKeys = new Set(kept.map(categoryKey));
  const added = current.filter((n) => !keptKeys.has(categoryKey(n)));
  return [...kept, ...added];
}

/** يحرّك عنصراً من موضع إلى آخر (للسحب وأزرار ▲▼). */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
