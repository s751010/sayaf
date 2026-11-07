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
 *
 * ═══ ملصقٌ لا مربّع (٢٠٢٦/١١/٠٧) ═══
 *
 * تدقيقٌ بالعين على الطوابع الستّة عشر: في البطاقة العريضة («صاج»، والسحب
 * الأفقي في «نيون») كان الرسم **حقلاً فارغاً بعرض الشاشة وفي قلبه دائرةٌ
 * صغيرة** — وثلث الأطباق بالرمز نفسه (الصحن العامّ). فصار الرسم ثلاث طبقات:
 *
 * ١. **رمز الطبق مكبَّراً خلف الصحن**، مائلاً ومقصوصاً بحافّة البطاقة في جهةٍ
 *    يختارها الهاش — كما يُطبع الشكل الكبير خلف العنوان في ملصق. يملأ الحقل
 *    العريض بشيءٍ من الطبق نفسه لا بزخرفةٍ عامّة، ويفرّق بين بطاقتين متجاورتين.
 * ٢. **صحنٌ بحافّةٍ وقاع**: حلقةٌ داخلية تجعل الدائرة صحناً يُرى من فوق، وظلٌّ
 *    تحته يرفعه عن المفرش.
 * ٣. **الرمز من الاسم** حين لا يختار التاجر رمزاً (`lib/foodGlyph.ts`): «مندي
 *    دجاج» صحن رزّ، و«لبن» قارورة — لا صحنٌ عامّ لكلّ ما لا يعرفه القاموس.
 *
 * وكلّ طبقةٍ متغيّرٌ يلبسه الطابع (`--m-art-*` في `menu-skins.css`): نيونٌ
 * يتوهّج، وملصقٌ بحدٍّ أسود، وشارة مينا في «دكّان»، وشبكة «عصري» — والقيمة
 * المضمَّنة هنا الافتراض.
 *
 * ⚠️ `--m-art-ring` و`--m-art-lift` يُجمعان في `box-shadow` واحد: لا تضع
 * لأحدهما `none` (يُبطل الخاصّية كلّها) — «لا ظلّ» هو `0 0 transparent`.
 */
import type { CSSProperties } from "react";
import { Icon, iconNameOf, type IconName } from "@/lib/icons";
import { categoryIcon } from "@/lib/categories";
import { guessGlyph } from "@/lib/foodGlyph";

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
  "🍤": "fish", "🐟": "fish", "🦐": "fish", "🦞": "fish", "🦀": "fish", "🍣": "fish", "🦑": "fish", "🐠": "fish",
  "🥗": "salad", "🥬": "salad", "🥒": "salad", "🥑": "juice",
  "🍚": "kabsa", "🍛": "kabsa", "🍗": "kabsa", "🥘": "pot", "🍲": "pot", "🫘": "pot",
  "🍳": "egg", "🥚": "egg",
  "🍰": "cake", "🎂": "cake", "🧁": "cake", "🍮": "cake", "🍩": "cake", "🍪": "cake", "🍫": "cake", "🍨": "cake", "🍦": "cake",
  "🍯": "cake", "🥧": "cake",
  "☕": "cup", "🍵": "istikana", "🫖": "istikana", "🧋": "icedcup", "🥤": "icedcup", "🧊": "icedcup",
  "🍹": "juice", "🧃": "juice", "🍊": "juice", "🍋": "juice", "🥭": "juice", "🍓": "juice", "🫐": "juice", "🍍": "juice", "🍉": "juice",
  "🥛": "bottle", "💧": "bottle", "🍼": "bottle", "🫗": "bottle",
  "🍔": "burger", "🍕": "pizza", "🍝": "pizza", "🍟": "fries", "🧅": "fries",
  "🥐": "croissant", "🥖": "bread", "🍞": "bread", "🫓": "bread", "🥯": "bread",
  "🥪": "sandwich", "🌯": "sandwich", "🥙": "sandwich", "🌮": "sandwich",
  "🥣": "soup", "🧆": "mezze", "🫒": "mezze", "🧀": "mezze",
  "🌰": "sides", "🥜": "sides", "🍽️": "plate", "🍽": "plate",
};

/**
 * رمز الرسم، بهذا الترتيب:
 *
 * ١. **ما اختاره التاجر من مجموعتنا** (`cm:…`) — قرارٌ صريح لا يُخمَّن فوقه.
 * ٢. **اسم الطبق** — أصدق من الإيموجي: «🍗» على «مندي دجاج» وعلى «ساندويتش
 *    دجاج» وعلى «تندر» معاً، والاسم وحده يفرّق رزّاً من رغيفٍ من علبة.
 * ٣. الإيموجي، ثم **التصنيف** (القاموس ثم الكلمة)، ثم الصحن العامّ.
 */
export function artGlyphOf(name: string, emoji: string | null | undefined, category?: string | null): IconName {
  const picked = iconNameOf(emoji);
  if (picked) return picked;
  return guessGlyph(name) ?? EMOJI_GLYPH[emoji?.trim() ?? ""] ?? (category ? categoryIcon(category) : "plate");
}

/** دون هذا لا يُرسم الرمز الكبير خلف الصحن: صورةٌ مصغّرة لا تحمل طبقتين. */
const MARK_MIN = 26;

export function DishArtwork({
  name,
  emoji,
  category,
  className,
  style,
  glyphSize = 34,
}: {
  name: string;
  emoji: string | null | undefined;
  /** تصنيف الطبق — آخر مصدرٍ للرمز حين لا يدلّ عليه الاسم ولا الإيموجي. */
  category?: string | null;
  className?: string;
  style?: CSSProperties;
  glyphSize?: number;
}) {
  const h = hashOf(name || "طبق");
  const glyph = artGlyphOf(name, emoji, category);
  // زاوية التدرّج من الهاش: تنويعٌ محسوس بين البطاقات بلا أن يخرج عن لون الطابع.
  const angle = 120 + ((h >> 3) % 120);
  // الرمز الكبير: جهته وميله وارتفاعه من الهاش — بطاقتان متجاورتان لا تتطابقان.
  const markStart = (h >> 7) % 2 === 0;
  const tilt = ((h >> 9) % 31) - 15;
  const drop = ((h >> 13) % 5) * 4 - 22;
  const plate = glyphSize * 2.1;

  return (
    <span
      // ‏`m-art` خطافٌ للطابع: يعيد رسم الأرضية والصحن عبر `--m-art-*` (ورق شبكةٍ
      // في «عصري»، حلقةٌ مذهّبة في «فاخر») — القيمة المضمَّنة تغلب أيّ قاعدة.
      className={className ? `m-art ${className}` : "m-art"}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        isolation: "isolate",
        background:
          `var(--m-art-bg, radial-gradient(70% 60% at 50% 42%, color-mix(in srgb, var(--m-accent) 16%, transparent) 0%, transparent 70%), ` +
          `linear-gradient(${angle}deg, color-mix(in srgb, var(--m-accent) 10%, var(--m-bg-2)) 0%, var(--m-bg-2) 100%))`,
        ...style,
      }}
      aria-hidden="true"
    >
      {glyphSize >= MARK_MIN && (
        <span
          className="m-art-mark"
          style={{
            position: "absolute",
            top: `${drop}%`,
            [markStart ? "insetInlineStart" : "insetInlineEnd"]: "-14%",
            height: "128%",
            aspectRatio: "1",
            transform: `rotate(${tilt}deg)`,
            color: "var(--m-art-mark, color-mix(in srgb, var(--m-accent) 10%, transparent))",
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <Icon name={glyph} className="h-full w-full" strokeWidth={0.85} />
        </span>
      )}
      {/* الصحن: يرتفع عن المفرش بظلّ، وفيه حافّةٌ وقاع — دائرةٌ مسطّحة كانت
          تُقرأ زرّاً لا صحناً. ويملأ المربّع بنسبةٍ ثابتة مهما كان حجمه. */}
      <span
        className="m-art-plate"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: plate,
          height: plate,
          borderRadius: "9999px",
          background: "var(--m-art-plate, color-mix(in srgb, var(--m-accent) 10%, var(--m-bg)))",
          boxShadow:
            "var(--m-art-ring, inset 0 0 0 1px color-mix(in srgb, var(--m-accent) 22%, transparent)), " +
            // ظلٌّ محايد لا من `--m-text`: نصّ الطوابع الداكنة فاتح، فكان «الظلّ» هالةً بيضاء.
            "var(--m-art-lift, 0 12px 22px -16px rgba(0, 0, 0, 0.55))",
          color: "var(--m-accent-ink, var(--m-accent))",
        }}
      >
        <span
          className="m-art-well"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "74%",
            height: "74%",
            borderRadius: "9999px",
            boxShadow: "var(--m-art-well, inset 0 0 0 1px color-mix(in srgb, var(--m-accent) 13%, transparent))",
          }}
        >
          <Icon name={glyph} size={glyphSize} strokeWidth={1.5} />
        </span>
      </span>
    </span>
  );
}
