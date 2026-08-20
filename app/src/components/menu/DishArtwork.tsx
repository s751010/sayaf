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
 * فالبديل هنا **مقصود**: تدرّجٌ من لون طابع المطعم، وزخرفة خفيفة، والأيقونة
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
import { DishGlyph } from "@/lib/icons";

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

/** أربع صياغات للخلفية — تُختار بالهاش فتتنوّع الشبكة بلا فوضى. */
const SHAPES = ["arcs", "rings", "corner", "waves"] as const;

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
  const shape = SHAPES[h % SHAPES.length];
  // زاوية التدرّج من الهاش: تنويعٌ محسوس بلا أن يخرج عن لون الطابع.
  const angle = (h >> 3) % 360;
  const offset = ((h >> 7) % 30) - 15;

  return (
    <span
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        // التدرّج من لون التمييز نفسه: البطاقة تنتمي للطابع لا تُقحَم عليه.
        background:
          `linear-gradient(${angle}deg, ` +
          "color-mix(in srgb, var(--m-accent) 14%, var(--m-bg-2)) 0%, " +
          "color-mix(in srgb, var(--m-accent) 4%, var(--m-bg-2)) 100%)",
        ...style,
      }}
      aria-hidden="true"
    >
      {/* الزخرفة: SVG واحد خفيف الوزن، لونه من التمييز بشفافية منخفضة. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <g
          fill="none"
          stroke="var(--m-accent)"
          strokeOpacity={0.22}
          strokeWidth={1.4}
          strokeLinecap="round"
        >
          {shape === "arcs" && (
            <>
              <path d={`M -10 ${70 + offset} Q 50 ${30 + offset} 110 ${70 + offset}`} />
              <path d={`M -10 ${84 + offset} Q 50 ${44 + offset} 110 ${84 + offset}`} />
              <path d={`M -10 ${98 + offset} Q 50 ${58 + offset} 110 ${98 + offset}`} />
            </>
          )}
          {shape === "rings" && (
            <>
              <circle cx={50 + offset} cy={50} r={44} />
              <circle cx={50 + offset} cy={50} r={33} strokeOpacity={0.16} />
              <circle cx={50 + offset} cy={50} r={22} strokeOpacity={0.1} />
            </>
          )}
          {shape === "corner" && (
            <>
              <path d={`M ${100 + offset} 0 L ${40 + offset} 0 L ${100 + offset} 60 Z`} fill="var(--m-accent)" fillOpacity={0.07} stroke="none" />
              <path d={`M 0 ${100 - offset} L 0 ${45 - offset} L 55 ${100 - offset} Z`} fill="var(--m-accent)" fillOpacity={0.05} stroke="none" />
            </>
          )}
          {shape === "waves" && (
            <>
              <path d={`M -10 ${30 + offset} q 15 -12 30 0 t 30 0 t 30 0 t 30 0`} />
              <path d={`M -10 ${58 + offset} q 15 -12 30 0 t 30 0 t 30 0 t 30 0`} strokeOpacity={0.14} />
              <path d={`M -10 ${86 + offset} q 15 -12 30 0 t 30 0 t 30 0 t 30 0`} strokeOpacity={0.1} />
            </>
          )}
        </g>
      </svg>

      {/* الأيقونة المرسومة يدوياً — تسقط إلى الإيموجي إن لم يكن للتصنيف رمز. */}
      <span
        style={{
          position: "relative",
          color: "var(--m-accent)",
          opacity: 0.85,
          display: "flex",
        }}
      >
        <DishGlyph value={emoji} size={glyphSize} />
      </span>
    </span>
  );
}
