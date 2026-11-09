/**
 * «علبة» — بيتزا التوصيل (٢٠٢٦/١١/٠٩).
 *
 * - `PizzaboxHead`    **المنيو علبةُ كرتون**: غطاؤها **ينفتح عند الفتح** (دورانٌ حول مفصله، وباطنه
 *   مطبوعٌ بحبر العلامة وفيه شعارك)، **وينغلق وأنت تمرّر**. وفي العلبة بيتزا كاملة **مقطوعةٌ شرائح
 *   بعدد أقسامك** (حتى ثمانٍ): كلّ شريحةٍ رابطٌ إلى قسمها برمزه، **تنفصل عن دائرتها حين تختارها**
 *   (لمسٌ أو مؤشّرٌ أو تركيز) ويمضي المنيو إليه. وبلا أقسامٍ تكفي بيتزا بثماني شرائح للزينة.
 * - `PizzaboxHeading` عنوان القسم **شريحةٌ تخرج من دائرتها** — شريحة القسم في موضعه من ثمانٍ
 *   (القسم الأوّل في الأعلى، والثاني بعده مع عقارب الساعة)، تنسلّ حين يدخل القسم الشاشة — والاسم،
 *   وخطُّ ثنية الكرتون إلى العدد على **لاصق التوصيل** بلون العلامة.
 *
 * الخامة والحركة في `styles/skins/pizzabox.css`. ما يتبع العلامة: حبر الطباعة على الغطاء والعلبة،
 * واللاصق، والسعر، والأزرار. وما لا يتبعها خامة: الكرتون والبيتزا — البيتزا بيتزا.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { categoryIcon, categoryLabel } from "@/lib/categories";
import { GLYPHS } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { categoryId } from "@/lib/utils";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** أكثر ما تُقطع إليه البيتزا: شريحةٌ أضيق من ٤٥° لا تُلمس بإصبع. */
export const MAX_SLICES = 8;

/** البيتزا في العلبة بإحداثيات 320×220: إهليلجٌ لأنّ العلبة تُرى من فوقٍ مائل. */
const PIE = { cx: 160, cy: 116, rx: 102, ry: 60 };

/** نقطةٌ على الإهليلج بنسبةٍ من نصف قطره — الزاوية بالدرجات مع عقارب الساعة من الشرق. */
function onPie(deg: number, k = 1): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [PIE.cx + PIE.rx * k * Math.cos(a), PIE.cy + PIE.ry * k * Math.sin(a)];
}

function wedge(a0: number, a1: number, k = 1): string {
  const [x0, y0] = onPie(a0, k);
  const [x1, y1] = onPie(a1, k);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${PIE.cx} ${PIE.cy}L${x0.toFixed(1)} ${y0.toFixed(1)}A${(PIE.rx * k).toFixed(1)} ${(PIE.ry * k).toFixed(1)} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`;
}

/** رمز القسم داخل الرسم نفسه — مسارات `GLYPHS` لا `<Icon>`، فينفصل مع شريحته. */
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
      {g.f?.map((d, i) => <path key={`f${i}`} d={d} fill="currentColor" stroke="none" />)}
    </g>
  );
}

/** حشوة الشرائح بالتناوب: بيبروني · زيتون · ريحان · فلفل — حتى لا تتشابه شريحتان متجاورتان. */
const TOPPING = ["pep", "olive", "basil", "pepper"] as const;

function Toppings({ mid, span, kind }: { mid: number; span: number; kind: (typeof TOPPING)[number] }) {
  const spots = [onPie(mid - span * 0.24, 0.8), onPie(mid + span * 0.26, 0.74), onPie(mid + span * 0.05, 0.3)];
  return (
    <g>
      {spots.map(([x, y], i) => {
        if (kind === "pep") return <ellipse key={i} cx={x} cy={y} rx="6.2" ry="3.8" fill="#b3261e" stroke="#7a160f" strokeWidth=".6" />;
        if (kind === "olive")
          return <ellipse key={i} cx={x} cy={y} rx="3.6" ry="2.3" fill="none" stroke="#1d1a17" strokeWidth="2" />;
        if (kind === "basil")
          return <ellipse key={i} cx={x} cy={y} rx="4.6" ry="2.2" fill="#2f7a3a" transform={`rotate(${i * 50 - 30} ${x} ${y})`} />;
        return <path key={i} d={`M${x - 5} ${y}q5 -4 10 0`} fill="none" stroke="#3f8f3a" strokeWidth="2.2" strokeLinecap="round" />;
      })}
    </g>
  );
}

interface Slice {
  key: string;
  label: string | null;
  href: string | null;
  icon: string;
}

/** العلبة من فوقٍ مائل: الحافّة والقاع، والبيتزا شرائح — كلّ شريحةٍ قسم. */
function Tray({ slices }: { slices: Slice[] }) {
  const uid = useId().replace(/:/g, "");
  const n = slices.length;
  const span = 360 / n;
  return (
    <svg viewBox="0 0 320 220" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <radialGradient id={`m-pb-crust-${uid}`} cx=".5" cy=".5" r=".5">
          <stop offset=".84" stopColor="#e9b36a" />
          <stop offset=".93" stopColor="#c98b45" />
          <stop offset="1" stopColor="#9c6230" />
        </radialGradient>
        <radialGradient id={`m-pb-sauce-${uid}`} cx=".5" cy=".45" r=".55">
          <stop offset="0" stopColor="#d9482a" />
          <stop offset="1" stopColor="#b8321c" />
        </radialGradient>
      </defs>
      {/* العلبة: الحافّة العليا، ثم القاع أغمق قليلاً، ثم وجهها الأمامي المضلّع. */}
      <path d="M56 30H264L304 196H16Z" fill="#c9a774" />
      <path d="M68 39H252L288 189H32Z" fill="#b8925d" />
      <path d="M68 39H252L288 189H32Z" fill="none" stroke="#7d5a2e" strokeOpacity=".35" />
      <rect x="16" y="196" width="288" height="20" rx="1.5" fill="#a98451" />
      <path d="M16 196H304" stroke="#e6cf9f" strokeWidth="1.4" />
      <g className="m-pb-ink" fill="none" style={{ stroke: "var(--m-accent)" }} strokeWidth="2">
        <path d="M120 206H200" />
        <path d="M106 206H112M208 206H214" />
      </g>
      {/* ظلّ البيتزا على القاع. */}
      <ellipse cx={PIE.cx} cy={PIE.cy + 5} rx={PIE.rx} ry={PIE.ry} fill="#5a3a18" fillOpacity=".3" />
      {slices.map((s, i) => {
        const a0 = -90 + i * span;
        const a1 = a0 + span;
        const mid = a0 + span / 2;
        const m = (mid * Math.PI) / 180;
        const [gx, gy] = onPie(mid, n <= 2 ? 0.46 : 0.56);
        const style = {
          "--dx": `${(Math.cos(m) * 11).toFixed(1)}px`,
          "--dy": `${(Math.sin(m) * 7).toFixed(1)}px`,
          "--i": i,
        } as CSSProperties;
        const body = (
          <>
            <path d={wedge(a0, a1)} fill={`url(#m-pb-crust-${uid})`} />
            <path d={wedge(a0, a1, 0.87)} fill={`url(#m-pb-sauce-${uid})`} />
            <path d={wedge(a0, a1, 0.83)} fill="#f6dc9a" fillOpacity=".88" />
            <Toppings mid={mid} span={span} kind={TOPPING[i % TOPPING.length]} />
            <path d={wedge(a0, a1)} fill="none" stroke="#7a3c14" strokeOpacity=".55" strokeWidth="1" />
            {s.label && (
              <g style={{ color: "#2b1a0e" }}>
                <ellipse cx={gx} cy={gy} rx="12.5" ry="11" fill="#fbf2dc" stroke="#7a3c14" strokeOpacity=".4" />
                <GlyphAt name={s.icon} x={gx} y={gy} size={15} />
              </g>
            )}
          </>
        );
        return s.href ? (
          <a key={s.key} href={s.href} aria-label={s.label ?? undefined} className="m-pb-slice" style={style}>
            <title>{s.label}</title>
            {body}
          </a>
        ) : (
          <g key={s.key} className="m-pb-slice" style={style} aria-hidden="true">
            {body}
          </g>
        );
      })}
    </svg>
  );
}

export function PizzaboxHead({ restaurant, en, tags = [], corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  // قسمان فأكثر: شريحةٌ لكلّ قسم (حتى ثمانٍ) — وإلا فبيتزا بثماني شرائح للزينة.
  const linked = tags.length >= 2;
  const slices: Slice[] = linked
    ? tags.slice(0, MAX_SLICES).map((t) => ({
        key: t,
        label: categoryLabel(t, en),
        href: `#${categoryId(t)}`,
        icon: categoryIcon(t),
      }))
    : Array.from({ length: MAX_SLICES }, (_, i) => ({ key: String(i), label: null, href: null, icon: "pizza" }));
  return (
    <header className="m-head m-head-carton relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-pb-table relative px-3 pt-8">
        <div className="m-pb-scene relative mx-auto aspect-[320/330] w-full max-w-[21rem]">
          {/* الغطاء: مفصله الحافّة الخلفية للعلبة (y=140 من 330)، وباطنه إلى الزبون. */}
          <div aria-hidden="true" className="m-pb-hinge absolute left-[17.5%] top-[9.1%] h-[33.3%] w-[65%]">
            <div className="m-pb-lid relative h-full w-full">
              <div className="m-pb-face m-pb-in absolute inset-0 flex items-center justify-center">
                <span className="m-pb-stamp relative block aspect-square h-[78%]">
                  <span className="absolute inset-[14%] block">
                    <LogoMark
                      restaurant={restaurant}
                      size="relative h-full w-full"
                      style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                      fallbackStyle={{ color: "var(--m-accent-ink, var(--m-accent))" }}
                      letterSize="1.6rem"
                    />
                  </span>
                </span>
              </div>
              <div className="m-pb-face m-pb-out absolute inset-0 flex items-center justify-center">
                <span className="m-pb-ring block aspect-square h-[70%]" />
              </div>
            </div>
          </div>
          <div className="m-pb-base absolute inset-x-0 bottom-0 h-[66.67%]">
            <Tray slices={slices} />
          </div>
        </div>
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-3 text-[2rem] font-extrabold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-pb-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** بيتزا صغيرة بشريحةٍ خارجة: موضعها من ثمانٍ بترتيب القسم. */
function Pie({ index }: { index: number }) {
  const slot = index % MAX_SLICES;
  const a0 = -90 + slot * 45;
  const a1 = a0 + 45;
  const at = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(19 + r * Math.cos(a)).toFixed(2)} ${(19 + r * Math.sin(a)).toFixed(2)}`;
  };
  const part = (from: number, to: number, r: number) =>
    `M19 19L${at(from, r)}A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${at(to, r)}Z`;
  const m = ((a0 + 22.5) * Math.PI) / 180;
  const out = { "--dx": `${(Math.cos(m) * 3.4).toFixed(2)}px`, "--dy": `${(Math.sin(m) * 3.4).toFixed(2)}px` } as CSSProperties;
  return (
    <svg viewBox="0 0 38 38" aria-hidden="true" className="m-pb-pie block h-[38px] w-[38px] shrink-0 overflow-visible">
      <circle cx="19" cy="19" r="17.5" fill="#b8925d" />
      {/* الدائرة بلا شريحة القسم. */}
      <path d={part(a1, a0 + 360, 15)} fill="#d9a35e" />
      <path d={part(a1, a0 + 360, 12.6)} fill="#c8361f" />
      <path d={part(a1, a0 + 360, 11.8)} fill="#f6dc9a" fillOpacity=".85" />
      <g className="m-pb-loose" style={out}>
        <path d={part(a0, a1, 15)} fill="#e9b36a" />
        <path d={part(a0, a1, 12.6)} fill="#d9482a" />
        <path d={part(a0, a1, 11.8)} fill="#f6dc9a" />
        <circle cx={at(a0 + 22.5, 8).split(" ")[0]} cy={at(a0 + 22.5, 8).split(" ")[1]} r="2.2" fill="#b3261e" />
      </g>
    </svg>
  );
}

/** الشريحة الخارجة، ثم الاسم، ثم ثنية الكرتون إلى لاصق التوصيل بالعدد. */
export function PizzaboxHeading({ name, items, index, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-pb-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <Pie index={index} />
        <h2 className="min-w-0 text-[1.4rem] font-extrabold leading-[1.55]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-pb-crease block h-0 min-w-6 flex-1" />
        {items && <span className="m-pb-tape shrink-0 px-2.5 py-1 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-pb-photo mt-3">{photo}</div>}
    </div>
  );
}
