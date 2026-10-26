/**
 * شعار المطعم في ترويسة المنيو — صورته، أو حرفٌ من اسمه حين لا صورة.
 *
 * مستقلٌّ عن `MenuHeader` لأن الترويسات كلّها تحمله بأشكالٍ مختلفة (حلقة
 * الفاتورة، قوس الروشان، حلقة النيون) والقاعدة واحدة: **هويّةٌ تُقرأ، لا مكانٌ
 * فارغ ينتظر صورة**.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import type { Restaurant } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * كلماتٌ تسبق اسم المطعم ولا تميّزه — «مطعم الديوان» حرفه «د» لا «م».
 * و«ال» تُنزع من الكلمة المختارة للسبب نفسه: «الديوان» ⇒ «د».
 */
const GENERIC = new Set([
  "مطعم", "مطاعم", "مقهى", "مقاهي", "كافيه", "كافي", "كوفي", "مطبخ", "مخبز", "مخابز",
  "محمصة", "قهوة", "حلويات", "مشويات", "بيت", "دار", "cafe", "café", "coffee", "restaurant", "the", "kitchen",
]);

/**
 * واو العطف لا تبدأ اسماً: «مطبخ **و**مشويات الديوان» كانت تعطي «و» — وتُقرأ
 * «9» في الفاتورة والروشان والنيون (قياس الجودة ٢٠٢٦/١٠/٢٦).
 *
 * ⚠️ لكن الواو تبدأ أسماءً حقيقية («مطعم **و**ليد»، «**و**رد»). فلا تُنزع إلا
 * من كلمةٍ بعد الأولى **وما بعدها كلمةٌ عامّة** («ومشويات» ⇒ «مشويات» ⇒
 * تُتجاوز)، أو «وال…» (عطفٌ على معرَّف: «والديوان» ⇒ «ديوان»).
 */
function isConjoinedGeneric(w: string, i: number): boolean {
  return i > 0 && w.length > 2 && w.startsWith("و") && GENERIC.has(w.slice(1).toLowerCase());
}
function dropConjunction(w: string, i: number): string {
  return i > 0 && w.length > 4 && w.startsWith("وال") ? w.slice(1) : w;
}

/** الحرف الذي يمثّل المطعم حين لا شعار. */
export function monogramOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const at = words.findIndex((w, i) => !GENERIC.has(w.toLowerCase()) && !isConjoinedGeneric(w, i));
  const word = at >= 0 ? dropConjunction(words[at], at) : words[0] ?? "";
  const bare = word.length > 2 && word.startsWith("ال") ? word.slice(2) : word;
  const ch = [...bare][0] ?? "";
  return /[a-z]/i.test(ch) ? ch.toUpperCase() : ch;
}

/** الشعار المكتوب (إيموجي) الافتراضي — لا يُعدّ اختياراً من التاجر. */
const DEFAULT_GLYPHS = new Set(["🍽️", "🍽"]);

export function LogoMark({
  restaurant,
  size,
  style,
  fallbackStyle,
  letterSize = "2.75rem",
}: {
  restaurant: Restaurant;
  /** صنف المقاس (والتوسيط إن لزم) — يُطبَّق على الصورة وبديلها معاً. */
  size: string;
  /** الإطار: نصف القطر والحلقة والأرضية. */
  style: CSSProperties;
  /** ما يختلف في البديل وحده: أرضية الحرف ولونه. */
  fallbackStyle?: CSSProperties;
  letterSize?: string;
}) {
  const glyph = restaurant.logo?.trim();
  const customGlyph = glyph && !DEFAULT_GLYPHS.has(glyph) ? glyph : null;
  const fallback = (
    <span className={cn("m-logo flex items-center justify-center", size)} style={{ ...style, ...fallbackStyle }}>
      {customGlyph ? (
        <span className="leading-none" style={{ fontSize: `calc(${letterSize} * .95)` }}>
          {customGlyph}
        </span>
      ) : (
        <span
          className="font-black leading-none"
          // خطّ القراءة لا خطّ العرض: حرفٌ منفردٌ بخطٍّ زخرفيّ (ريم كوفي) يُقرأ
          // شكلاً آخر — «د» كانت تبدو «ط».
          style={{ fontSize: letterSize, fontFamily: "var(--m-font)" }}
        >
          {monogramOf(restaurant.name)}
        </span>
      )}
    </span>
  );
  return (
    <SafeImage
      src={restaurant.logo_image}
      alt={restaurant.name}
      className={cn("m-logo object-cover", size)}
      wrapperClassName={size}
      style={style}
      fallback={fallback}
    />
  );
}
