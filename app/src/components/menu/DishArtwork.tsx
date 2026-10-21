/**
 * صورة الطبق المولَّدة — بديل الفراغ حين لا يرفع التاجر صورة.
 *
 * ═══ لماذا وُجدت ═══
 *
 * الواقع في القاعدة: **٦ أطباق من ٢١ لها صورة**. والبقيّة كانت تُعرض إمّا
 * بفراغ (تخطيط القائمة لا يرسم شيئاً بلا صورة) أو بإيموجي شاحب على مربّع
 * رمادي. فمنيو التاجر الجديد يبدو **ناقصاً** لا بسيطاً — وهذا أسوأ ما يمكن
 * أن يبدو عليه منتجٌ يُباع على جماله.
 *
 * فالبديل هنا **مقصود**: تدرّجٌ من لون طابع المطعم، وصحنٌ دائري، والأيقونة
 * المرسومة يدوياً للتصنيف في القلب. منيو بلا صورة واحدة يبدو مصمَّماً.
 *
 * ═══ حتمية لا عشوائية ═══
 *
 * كل شيء مشتقّ من **اسم الطبق** عبر هاش بسيط: الزاوية، وموضع الأقواس،
 * والحجم. فالطبق نفسه يبدو نفسه في كل زيارة وعلى كل جهاز — والعشوائية
 * الحقيقية كانت ستجعل المنيو يرقص بين تحديثين.
 *
 * ولا شيء يُخزَّن: تُرسم في الوقت الحقيقي من `name` و`category` و`emoji`،
 * فلا عمود جديد ولا رفع ولا سعة.
 */
import type { CSSProperties } from "react";
import { Icon, iconNameOf, type IconName } from "@/lib/icons";

/**
 * هاش نصّي ثابت (FNV-1a مبسّط).
 *
 * ⚠️ ليس للأمان — للتوزيع فقط. الغرض أن يعطي الاسم نفسه الرقم نفسه دائماً،
 * وأن تختلف الأسماء المتقاربة («شاي» و«شاي أخضر») اختلافاً مرئياً.
 */
function hashOf(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * الإيموجي ⇒ رمزٌ مرسوم من مجموعتنا.
 *
 * ⚠️ الإيموجي يُرسم بخطّ نظام الجوال لا بخطّ الطابع: ألوانه ثابتة، وحجمه
 * يختلف بين آيفون وأندرويد، ولا يلبس لون العلامة. فكان «🥩» على أرضية ذهبية
 * يبدو ملصقاً لا جزءاً من التصميم. والمجهول يسقط إلى الصحن لا إلى الإيموجي.
 */
const EMOJI_GLYPH: Record<string, IconName> = {
  "🥩": "skewer", "🍖": "skewer", "🍢": "skewer", "🥓": "skewer",
  "🍤": "fish", "🐟": "fish", "🦐": "fish", "🦞": "fish", "🦀": "fish", "🍣": "fish",
  "🥗": "salad", "🥬": "salad", "🥒": "salad",
  "🍚": "kabsa", "🍛": "kabsa", "🍗": "kabsa", "🥘": "pot", "🍲": "pot",
  "🍳": "egg", "🥚": "egg",
  "🍰": "cake", "🎂": "cake", "🧁": "cake", "🍮": "cake", "🍩": "cake", "🍪": "cake", "🍫": "cake", "🍨": "cake", "🍦": "cake",
  "☕": "cup", "🍵": "istikana", "🧋": "icedcup", "🥤": "icedcup",
  "🍹": "juice", "🧃": "juice", "🍊": "juice", "🍋": "juice", "🥭": "juice",
  "🍔": "burger", "🍕": "pizza", "🍟": "fries", "🥐": "croissant", "🥖": "bread", "🍞": "bread", "🫓": "bread",
  "🥪": "sandwich", "🌯": "sandwich", "🥙": "sandwich", "🌮": "sandwich",
  "🥣": "soup", "🧆": "mezze", "🫒": "mezze", "🧀": "mezze",
  "🌰": "sides", "🥜": "sides", "🍽️": "plate", "🍽": "plate",
};

function glyphOf(value: string | null | undefined): IconName {
  return iconNameOf(value) ?? EMOJI_GLYPH[value?.trim() ?? ""] ?? "plate";
}

export function DishArtwork({
  name,
  emoji,
  className,
  style,
  glyphSize = 34,
}: {
  name: string;
  emoji: string | null | undefined;
  className?: string;
  style?: CSSProperties;
  glyphSize?: number;
}) {
  const h = hashOf(name || "طبق");
  // زاوية التدرّج من الهاش: تنويعٌ محسوس بين البطاقات بلا أن يخرج عن لون الطابع.
  const angle = 120 + ((h >> 3) % 120);

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background:
          `radial-gradient(70% 60% at 50% 42%, color-mix(in srgb, var(--m-accent) 16%, transparent) 0%, transparent 70%), ` +
          `linear-gradient(${angle}deg, color-mix(in srgb, var(--m-accent) 10%, var(--m-bg-2)) 0%, var(--m-bg-2) 100%)`,
        ...style,
      }}
      aria-hidden="true"
    >
      {/* الرمز في «صحنٍ» دائري: يملأ المربّع بنسبةٍ ثابتة مهما كان حجمه، فلا
          يبدو صغيراً تائهاً في بطاقة كبيرة ولا مزدحماً في صغيرة. */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: glyphSize * 2.1,
          height: glyphSize * 2.1,
          borderRadius: "9999px",
          background: "color-mix(in srgb, var(--m-accent) 10%, var(--m-bg))",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--m-accent) 22%, transparent)",
          color: "var(--m-accent-ink, var(--m-accent))",
        }}
      >
        <Icon name={glyphOf(emoji)} size={glyphSize} strokeWidth={1.5} />
      </span>
    </span>
  );
}
