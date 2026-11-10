/**
 * «ستيك» — ستيك هاوس أنيقٌ وداكن (٢٠٢٦/١١/٠٩، الموجة ٣).
 *
 * - `SteakhouseHead`    **ورقة جزّارٍ** معلّقة بخيطٍ على جدارٍ داكن، عليها **خريطة قطعيات اللحم**
 *   بحبرٍ واحد: ثورٌ من جانبه مقسومٌ ثماني قطع. **كلّ قطعةٍ قسمٌ من منيوك** (حتى ثمانية، بترتيب
 *   الأقسام: الريب آي أوّلاً ثم التي بون…) برمزه، و**تضغطها فتتلوّن ويمضي المنيو إلى قسمها** — رابطٌ
 *   حقيقيّ (`#القسم`) يُلمس ويُركَّز. وشعارك **ختمٌ نحاسيّ** في ركن الورقة. وبقسمٍ واحد تبقى الخريطة زينة.
 * - `SteakhouseHeading` عنوان القسم **ثورٌ صغير قطعتُه ملوّنة** (قطعة القسم في الخريطة نفسها)، والاسم
 *   بخطٍّ أنيق، وخطٌّ نحاسيّ منقّط إلى العدد على بطاقة نحاس.
 *
 * الرسم أصليّ: ثورٌ هندسيّ مبسّط وقطعٌ مستقيمة الحدود — لا نسخة مخطّطٍ قائم.
 *
 * الخامة والحركة في `styles/skins/steakhouse.css`. ما يتبع العلامة: القطعة المختارة، والقطعة في عنوان
 * القسم، والسعر، والأزرار. وما لا يتبعها خامة: الورق والحبر والنحاس والخيط.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { categoryIcon, categoryLabel } from "@/lib/categories";
import { GLYPHS } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { categoryId } from "@/lib/utils";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** القطع الثماني بإحداثيات 320×200 — بترتيب الأقسام، ولكلٍّ موضع رمزه. */
const CUTS: readonly { d: string; x: number; y: number }[] = [
  // ريب آي · تي بون · سرلوين · كتف · فخذ · صدر · بطن · خاصرة.
  { d: "M122 46L168 42L168 100L122 102Z", x: 145, y: 72 },
  { d: "M168 42L208 42L208 99L168 100Z", x: 188, y: 71 },
  { d: "M208 42L248 46L246 100L208 99Z", x: 227, y: 72 },
  { d: "M74 56L122 46L122 102L76 108Z", x: 99, y: 79 },
  { d: "M248 46L276 52L290 70L292 96L282 124L256 132L246 100Z", x: 268, y: 90 },
  { d: "M76 108L122 102L122 138L96 140L80 126Z", x: 101, y: 122 },
  { d: "M122 102L184 100L184 138L122 138Z", x: 153, y: 119 },
  { d: "M184 100L246 100L256 132L222 138L184 138Z", x: 216, y: 119 },
];
export const MAX_CUTS = CUTS.length;

/** الرأس والقرن والأرجل والذيل — حبرٌ لا روابط. */
const HEAD = "M74 56L60 44L52 30L48 40L40 42L26 52L18 70L22 82L34 86L46 84L58 98L76 108Z";
const BODY_LINES = [
  "M52 30L44 19L50 33",
  "M94 139L92 182H104L106 140",
  "M112 139L114 182H126L124 138",
  "M236 136L238 182H250L250 133",
  "M262 130L268 182H280L281 124",
  "M290 66C300 80 302 100 296 120L301 130",
];

function GlyphAt({ name, x, y, size }: { name: string; x: number; y: number; size: number }) {
  const g = GLYPHS[name] ?? GLYPHS.plate;
  if (!g) return null;
  return (
    <g
      transform={`translate(${(x - size / 2).toFixed(1)} ${(y - size / 2).toFixed(1)}) scale(${(size / 24).toFixed(3)})`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {g.t?.map((d, i) => <path key={`t${i}`} d={d} className="cm-tint" fill="currentColor" fillOpacity=".22" stroke="none" />)}
      {g.s?.map((d, i) => <path key={`s${i}`} d={d} />)}
    </g>
  );
}

interface Cut {
  key: string;
  label: string | null;
  href: string | null;
  icon: string;
}

/** الخريطة على الورقة: القطع روابط (إن وُجدت أقسام)، والرأس والأرجل حبر. */
function Chart({ cuts }: { cuts: Cut[] }) {
  return (
    <svg viewBox="0 0 320 200" className="m-st-chart absolute inset-0 block h-full w-full overflow-visible">
      <g fill="none" stroke="#2a1a12" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d={HEAD} fill="#e6cfa6" />
        <circle cx="36" cy="62" r="2" fill="#2a1a12" stroke="none" />
        {BODY_LINES.map((d, i) => (
          <path key={i} d={d} fill={i > 0 && i < 5 ? "#e6cfa6" : "none"} />
        ))}
        <path d="M92 182H104M114 182H126M238 182H250M268 182H280" strokeWidth="4" />
      </g>
      {CUTS.map((c, i) => {
        const cut = cuts[i];
        const body = (
          <>
            <path className="m-st-cutfill" d={c.d} />
            <path d={c.d} fill="none" stroke="#2a1a12" strokeWidth="2" strokeLinejoin="round" />
            {cut?.label && (
              <g className="m-st-glyph">
                <GlyphAt name={cut.icon} x={c.x} y={c.y} size={17} />
              </g>
            )}
          </>
        );
        const style = { "--i": i } as CSSProperties;
        return cut?.href ? (
          <a key={i} href={cut.href} aria-label={cut.label ?? undefined} className="m-st-cut" style={style}>
            <title>{cut.label}</title>
            {body}
          </a>
        ) : (
          <g key={i} className="m-st-cut m-st-idle" style={style} aria-hidden="true">
            {body}
          </g>
        );
      })}
    </svg>
  );
}

export function SteakhouseHead({ restaurant, en, tags = [], corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  // قسمان فأكثر: قطعةٌ لكلّ قسم (حتى ثمانٍ) — وإلا فالخريطة زينةٌ بلا روابط.
  const cuts: Cut[] =
    tags.length >= 2
      ? tags.slice(0, MAX_CUTS).map((t) => ({ key: t, label: categoryLabel(t, en), href: `#${categoryId(t)}`, icon: categoryIcon(t) }))
      : [];
  return (
    <header className="m-head m-head-cuts relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      {/* الورقة تنزل تحت مبدّل اللغة (‎top-3 بارتفاع ‎≈40px) فلا يركب ركنها ولا خيطها — كان يركبهما على 390. */}
      <div className="m-st-wall relative px-4 pt-16">
        {/* الخيط من المسمار إلى ركنَي الورقة. */}
        <span aria-hidden="true" className="m-st-twine absolute left-1/2 top-7 block h-9 w-[56%] max-w-[13rem] -translate-x-1/2" />
        <div className="m-st-paper relative mx-auto aspect-[320/215] w-full max-w-[22rem]">
          <Chart cuts={cuts} />
          {/* ختم الجزّار النحاسيّ: شعارك في ركن الورقة **فوق الذيل** — خارج جسم الثور فلا يغطّي قطعةً تُضغط
              (كان على «الفخذ»). والثور غير معكوسٍ في الاتّجاهين، فالركن فيزيائيّ (`right`) لا منطقيّ. */}
          <span className="m-st-seal absolute right-[2.5%] top-[2.5%] z-[2] block aspect-square w-[14%] rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "#f6eee6" }}
              fallbackStyle={{ color: "#2a1a12" }}
              letterSize="1.1rem"
            />
          </span>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-5 text-[2.1rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
        <span aria-hidden="true" className="m-st-rule mx-auto mt-3 block h-px w-28" />
      </div>
      {banner && (
        <div className="px-4">
          <div className="m-st-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** ثورٌ صغير بقطعة القسم ملوّنة — القطعة نفسها التي تقود إليه في الخريطة. */
function MiniCut({ index }: { index: number }) {
  const at = index % MAX_CUTS;
  return (
    <svg viewBox="14 16 292 172" aria-hidden="true" className="m-st-mini block h-[30px] w-[52px] shrink-0">
      <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
        <path d={HEAD} />
        {CUTS.map((c, i) => (
          <path key={i} d={c.d} className={i === at ? "m-st-on" : undefined} />
        ))}
        <path d="M94 140V182M120 140V182M244 134V182M274 128V182" />
      </g>
    </svg>
  );
}

/** الثور الصغير، ثم الاسم، ثم خطٌّ نحاسيّ منقّط إلى بطاقة العدد. */
export function SteakhouseHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-st-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <MiniCut index={index} />
        <h2 className="min-w-0 text-[1.5rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-st-dots block h-[3px] min-w-6 flex-1" />
        {items && <span className="m-st-tag shrink-0 px-2.5 py-1 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-st-photo mt-3">{photo}</div>}
    </div>
  );
}
