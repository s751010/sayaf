/**
 * «لاتيه» — بار الحليب (٢٠٢٦/١١/٠٩).
 *
 * - `LatteHead`    **فنجانٌ من فوق** على صحنه فوق طاولة سنديان: حافّته مطليّةٌ بلون العلامة،
 *   والإسبريسو في قلبه، و**وردة الحليب تُرسم فيه عند الفتح** ورقةً ورقة من القاع إلى القمّة ثم
 *   يشقّها الخطّ. وشعارك على **قاعدةٍ ورقية** بجانبه، وملعقةٌ على الصحن. والرسمة تدور مع التمرير
 *   كأنّ الزبون يدير فنجانه (`--m-scroll-y`، `lib/skinMotion.ts`).
 * - `LatteHeading` عنوان القسم **فنجانٌ صغير ورسمته**: لكلّ قسمٍ رسمةٌ بترتيبه (قلب · وردة ·
 *   توليب · قلبٌ في قلب)، تُرسم حين يدخل القسم الشاشة — ثم الاسم، ثم خطٌّ إلى العدد على رغوة.
 *
 * الخامة والحركة في `styles/skins/latte.css`. ما يتبع العلامة: طلاء الفنجان وحبر العنوان والسعر
 * والأزرار. وما لا يتبعها خامة: الخزف والقهوة والرغوة والسنديان والورق.
 */
import type { CSSProperties, ReactElement } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };
const FOAM = "#fff7ea";

/**
 * ورقةٌ من الوردة: هلالٌ مقوّسٌ إلى الأسفل، عرضه `w` ومركزه `(cx, y)`. سُمكه في قلبه نحو نصف `d`
 * (منتصف المنحنى التربيعيّ في منتصف نقطة التحكّم) — فالورقات تتلاصق بخيطٍ من القهوة بينها.
 */
function leaf(cx: number, y: number, w: number, d: number): string {
  // طرفا الورقة يرتفعان كما يرتدّ الحليب عند هزّ الإبريق — ورقةٌ مقوّسة لا صحن.
  const tip = y - w * 0.42;
  return `M${cx - w} ${tip}Q${cx} ${y + d} ${cx + w} ${tip}Q${cx} ${y - d * 0.15} ${cx - w} ${tip}Z`;
}

/** قلبٌ مركزه `(cx, cy)` ونصف عرضه `r`. */
function heart(cx: number, cy: number, r: number): string {
  const t = cy - r * 0.55;
  return (
    `M${cx} ${cy + r}` +
    `C${cx - r * 1.35} ${cy + r * 0.2} ${cx - r * 1.1} ${t - r * 0.5} ${cx - r * 0.45} ${t}` +
    `C${cx - r * 0.15} ${t - r * 0.12} ${cx} ${t + r * 0.12} ${cx} ${t + r * 0.32}` +
    `C${cx} ${t + r * 0.12} ${cx + r * 0.15} ${t - r * 0.12} ${cx + r * 0.45} ${t}` +
    `C${cx + r * 1.1} ${t - r * 0.5} ${cx + r * 1.35} ${cy + r * 0.2} ${cx} ${cy + r}Z`
  );
}

/** الفنجان على صحنه والملعقة — بإحداثيات 320×200، ومركز الفنجان (184, 98). */
function CupFromAbove() {
  const cx = 184;
  const cy = 98;
  // الوردة: أعرض في ثلثها الأسفل، وتضيق إلى القلب في القمّة.
  const widths = [22, 26, 26, 23, 19, 14.5, 10];
  const leaves = widths.map((w, i) => ({ y: 126 - i * 7.6, w, d: 11 - i * 0.6 }));
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <radialGradient id="m-lt-crema" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#c58a55" />
          <stop offset=".72" stopColor="#a8683a" />
          <stop offset=".93" stopColor="#7a4524" />
          <stop offset="1" stopColor="#5e321a" />
        </radialGradient>
        <radialGradient id="m-lt-china" cx=".42" cy=".38" r=".7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".8" stopColor="#f3efe8" />
          <stop offset="1" stopColor="#e2dcd2" />
        </radialGradient>
      </defs>
      {/* الصحن: خزفٌ أبيض بحلقةٍ غائرة، وظلّه على الطاولة. */}
      <ellipse cx={cx + 3} cy={cy + 7} rx="80" ry="78" fill="rgba(40,25,15,.18)" />
      <circle cx={cx} cy={cy} r="78" fill="url(#m-lt-china)" stroke="#ddd5c9" strokeWidth="1" />
      <circle cx={cx} cy={cy} r="62" fill="none" stroke="#e4ddd2" strokeWidth="2.4" />
      {/* الملعقة على الصحن: رأسٌ بيضويّ وساقٌ من ستيل. */}
      <g transform={`rotate(-38 ${cx} ${cy})`}>
        <rect x={cx + 62} y={cy - 3} width="44" height="6" rx="3" fill="#b9bfc4" />
        <rect x={cx + 62} y={cy - 3} width="44" height="2" rx="1" fill="#eef0f2" />
        <ellipse cx={cx + 60} cy={cy} rx="11" ry="7.5" fill="#c9ced2" stroke="#9aa1a7" strokeWidth=".8" />
      </g>
      {/* الأذن: مطليّةٌ بلون العلامة كالحافّة. */}
      <rect className="m-lt-glaze" x={cx + 50} y={cy - 9} width="30" height="18" rx="9" style={{ fill: "var(--m-accent)" }} />
      <rect x={cx + 60} y={cy - 4} width="14" height="8" rx="4" fill="#f3efe8" />
      {/* الفنجان: حافّةٌ مطليّة، ثم جدار الخزف الداخلي، ثم الإسبريسو. */}
      <circle className="m-lt-glaze" cx={cx} cy={cy} r="56" style={{ fill: "var(--m-accent)" }} />
      <circle cx={cx} cy={cy} r="56" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r="50.5" fill="#fbf8f2" />
      <circle cx={cx} cy={cy} r="45" fill="url(#m-lt-crema)" />
      {/* وردة الحليب: سبع ورقاتٍ من القاع، وقلبٌ في القمّة، والخطّ يشقّها. */}
      <g className="m-lt-art" fill={FOAM}>
        <ellipse className="m-lt-base" cx={cx} cy={cy + 33} rx="15" ry="6" opacity=".96" />
        {leaves.map((l, i) => (
          <path key={i} className={`m-lt-leaf m-lt-leaf-${i}`} d={leaf(cx, l.y, l.w, l.d)} />
        ))}
        <path className="m-lt-top" d={heart(cx, cy - 33, 7.5)} />
        <path className="m-lt-line" d={`M${cx} ${cy - 40}L${cx} ${cy + 39}`} stroke={FOAM} strokeWidth="2.2" strokeLinecap="round" fill="none" />
      </g>
      {/* بريق الحافّة. */}
      <path d={`M${cx - 44} ${cy - 30}A54 54 0 0 1 ${cx - 6} ${cy - 54}`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function LatteHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-saucer relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-lt-table relative px-3 pt-10">
        <div className="m-lt-scene relative mx-auto aspect-[16/10] w-full max-w-[21rem]">
          {/* البخار فوق الفنجان — يطلع مرّتين ثم يسكن. */}
          <span aria-hidden="true" className="m-lt-steam absolute block">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`m-lt-wisp m-lt-wisp-${i} absolute block`} />
            ))}
          </span>
          <CupFromAbove />
          {/* القاعدة الورقية وشعارك عليها — بحافّةٍ مسنّنة كقواعد الأكواب. */}
          <span className="m-lt-coaster absolute left-[3%] top-[44%] z-[2] block aspect-square w-[25%]">
            <span className="absolute inset-[16%] block rounded-full p-[3px]" style={{ background: "#fffdf8" }}>
              <LogoMark
                restaurant={restaurant}
                size="relative h-full w-full"
                style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                fallbackStyle={{ color: "var(--m-accent)" }}
                letterSize="1.5rem"
              />
            </span>
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-3 text-[1.85rem] font-extrabold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
      </div>
      {banner && (
        <div className="px-4">
          <div className="m-lt-window mx-auto mt-5 max-w-sm overflow-hidden">
            <SafeImage
              src={banner}
              alt=""
              loading="eager"
              className="h-28 w-full object-cover"
              wrapperClassName="h-28 w-full"
              fallback={<span />}
            />
          </div>
        </div>
      )}
      {children && (
        <div className="m-chips mt-5 flex flex-wrap items-center justify-center gap-2 px-4">{children}</div>
      )}
    </header>
  );
}

/**
 * الرسمات الأربع لعناوين الأقسام — بإحداثيات فنجانٍ 44×44 مركزه (22, 22) ونصف قطر قهوته 12.
 * القسم الأوّل قلب، والثاني وردة، والثالث توليب، والرابع قلبٌ في قلب — ثم تعود.
 */
const ARTS: readonly ((k: string) => ReactElement)[] = [
  (k) => <path key={k} className="m-lt-mark" d={heart(22, 21.5, 6.2)} />,
  (k) => (
    <g key={k}>
      {[0, 1, 2, 3].map((i) => (
        <path key={i} className="m-lt-mark" style={{ "--k": i } as CSSProperties} d={leaf(22, 29 - i * 3.6, 7.2 - i * 1.3, 3.4)} />
      ))}
      <path className="m-lt-mark" style={{ "--k": 4 } as CSSProperties} d={heart(22, 14.8, 2.4)} />
      <path className="m-lt-mark" style={{ "--k": 5 } as CSSProperties} d="M22 12.5V31.5" stroke={FOAM} strokeWidth="1" fill="none" />
    </g>
  ),
  (k) => (
    <g key={k}>
      <path className="m-lt-mark" style={{ "--k": 0 } as CSSProperties} d="M14 27.5Q22 22 30 27.5Q22 31.5 14 27.5Z" />
      <path className="m-lt-mark" style={{ "--k": 1 } as CSSProperties} d="M15.5 22.8Q22 17.6 28.5 22.8Q22 26.6 15.5 22.8Z" />
      <path className="m-lt-mark" style={{ "--k": 2 } as CSSProperties} d={heart(22, 15.8, 3.6)} />
      <path className="m-lt-mark" style={{ "--k": 3 } as CSSProperties} d="M22 12.4V30.6" stroke={FOAM} strokeWidth="1" fill="none" />
    </g>
  ),
  (k) => (
    <g key={k}>
      <path className="m-lt-mark" d={heart(22, 21.8, 7)} />
      <path className="m-lt-mark m-lt-inner" style={{ "--k": 1 } as CSSProperties} d={heart(22, 22.6, 3.6)} fill="#a8683a" />
    </g>
  ),
];

/** فنجانٌ صغير من فوق: طلاءٌ بحبر العلامة (`currentColor`)، وقهوةٌ ورسمة القسم. */
function MiniCup({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 44 44" aria-hidden="true" className="block h-11 w-11 overflow-visible">
      <circle cx="22.6" cy="23.4" r="20.5" fill="rgba(40,25,15,.14)" />
      <circle cx="22" cy="22" r="20.5" fill="#fbf8f3" stroke="#e2dbd0" strokeWidth=".8" />
      <rect x="35" y="19" width="8" height="6" rx="3" fill="currentColor" />
      <circle cx="22" cy="22" r="15.6" fill="currentColor" />
      <circle cx="22" cy="22" r="13.6" fill="#fbf8f2" />
      <circle cx="22" cy="22" r="12" fill="#a8683a" />
      <circle cx="22" cy="22" r="12" fill="none" stroke="#7a4524" strokeWidth="1.2" />
      <g fill={FOAM}>{ARTS[index % ARTS.length](`a${index}`)}</g>
    </svg>
  );
}

/** الفنجان الصغير ورسمته، ثم الاسم، ثم خطٌّ إلى العدد على رغوة. */
export function LatteHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-lt-h mb-4">
      <div className="flex items-center gap-3 px-1">
        <span className="m-lt-cup shrink-0" style={{ color: "var(--m-accent)" }}>
          <MiniCup index={index} />
        </span>
        <h2 className="min-w-0 text-[1.35rem] font-extrabold leading-[1.55]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-lt-rule block h-px min-w-6 flex-1" />
        {items && <span className="m-lt-count shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-lt-photo mt-3">{photo}</div>}
    </div>
  );
}
