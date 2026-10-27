/**
 * روابط صفحات الشرائح (`/for/<slug>`) — **بلا أي استيراد، عمداً**.
 *
 * يقرؤها الذيل (`components/site.tsx`)، والذيل في الحزمة الرئيسية لأن `Login`
 * و`NotFound` تُحمَّلان معها. فلو استوردت هذه القائمة `lib/segments.ts` (وهو
 * يسحب `themeSuggest` وقوائم البداية) لدفع كل زائر منيو ثمن رابطٍ في ذيل صفحة
 * تسويق. فالمحتوى في `segments.ts` (كسول مع صفحته)، وهنا الأسماء وحدها.
 *
 * ⚠️ `/for/<slug>` مقطعان فلا يصطدم برابط منيو. و`/for` وحدها **لم تُحجز**
 * (`shared/menu-url.mjs` في القائمة الحمراء): تبقى لمسار المنيو كما كانت.
 * و`segments.test.ts` يحرس ذلك، وأن كل slug هنا له محتوى.
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
