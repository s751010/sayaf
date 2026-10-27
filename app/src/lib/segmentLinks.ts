/**
 * روابط صفحات الشرائح (`/for/<slug>`) — **بلا أي استيراد، عمداً**.
 *
 * يقرؤها الذيل (`components/site.tsx`)، والذيل في الحزمة الرئيسية لأن `Login`
 * و`NotFound` تُحمَّلان معها. فلو استوردت هذه القائمة `lib/segments.ts` (وهو
 * يسحب `themeSuggest` وقوائم البداية) لدفع كل زائر منيو ثمن رابطٍ في ذيل صفحة
 * تسويق. فالمحتوى في `segments.ts` (كسول مع صفحته)، وهنا الأسماء وحدها.
 *
 * ⚠️ `for` محجوزة في `shared/menu-url.mjs` (`RESERVED_PATHS`) — وإلا أخذها تاجرٌ
 * رابطاً لمنيوه. و`segments.test.ts` يحرس الحجز وأن كل slug هنا له محتوى.
 */

export const SEGMENT_BASE = "/for";

export type SegmentSlug = "specialty-coffee" | "traditional-restaurants" | "food-trucks";

export const SEGMENT_LINKS: readonly { slug: SegmentSlug; label: string }[] = [
  { slug: "specialty-coffee", label: "للكافيه المختصّ" },
  { slug: "traditional-restaurants", label: "للمطعم الشعبي" },
  { slug: "food-trucks", label: "لعربات الطعام" },
];

export function segmentPath(slug: SegmentSlug): string {
  return `${SEGMENT_BASE}/${slug}`;
}
