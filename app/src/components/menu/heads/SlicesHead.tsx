/**
 * «شريحة» — محلّ البيتزا بالشريحة (٢٠٢٦/١١/٠٩). أصليٌّ: لا لافتة محلٍّ قائم ولا ألوانه.
 *
 * - `SlicesHead`    **لوحة أسعارٍ مضيئة** فوق الكاونتر: شريطٌ بلون العلامة، وشعارك واسمك بحروفٍ
 *   مضاءة، وتحتهما أسطرُ أقسامك الأولى بنقاطٍ إلى بطاقة سعر — **تشتعل عند الفتح** كما تشتعل لوحة
 *   الفلورسنت. وتحتها **كاونتر زجاج** تحت ثلاثة مصابيح تسخين فيه ثلاث صوانٍ (مارغريتا · بيبروني ·
 *   خضار) مقطوعةٌ شرائح، تدخل واحدةً بعد أخرى، ولمعة الزجاج تجري مع التمرير. وعلى وجه الكاونتر
 *   شريطٌ بلون العلامة وموزّع أرقام الدور: **حين يُضاف صنفٌ تُرفع شريحةٌ من الصينيّة ويخرج رقمك**.
 * - `SlicesHeading` عنوان القسم **شريطٌ من لوحة الأسعار**: شريحةٌ صفراء، والاسم مضاءً، والعدد على
 *   بطاقة سعرٍ صفراء — يشتعل حين يدخل القسم.
 *
 * الخامة والحركة في `styles/skins/slices.css`. ما يتبع العلامة: شريط اللوحة، وشريط الكاونتر،
 * وبطاقات السعر، والأزرار. وما لا يتبعها خامة: اللوحة السوداء والزجاج والستيل والبيتزا. والنصّ على
 * اللوحة أبيضُ على أسودها (≥ ‎15:1) أيّاً كان لون التاجر.
 */
import { useId, type CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { categoryLabel } from "@/lib/categories";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** أسطر اللوحة: أوّل ثلاثة أقسام — لوحةٌ بعشرة أسطر لا تُقرأ من الطابور. */
const BOARD_ROWS = 3;

/** شريحةٌ صغيرة من فوق: مثلّثٌ بحافّة خبزٍ ودائرتَي بيبروني — للّوحة وعنوان القسم. */
function SliceGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
      <path d="M3 4.5Q10 1.5 17 4.5L10 18.5Z" fill="#ffc61a" />
      <path d="M3 4.5Q10 1.5 17 4.5L16.2 6.2Q10 3.6 3.8 6.2Z" fill="#c98b45" />
      <circle cx="9" cy="8.6" r="1.7" fill="#d23a26" />
      <circle cx="11.6" cy="12.4" r="1.4" fill="#d23a26" />
    </svg>
  );
}

type PieKind = "margherita" | "pepperoni" | "veggie";

/** بيتزا على صينيّتها بإحداثيات الكاونتر: إهليلجٌ، وشرائح ثمانٍ، وحشوتها. */
function TrayPie({ cx, kind, pick = false }: { cx: number; kind: PieKind; pick?: boolean }) {
  const cy = 62;
  const rx = 40;
  const ry = 12.5;
  const at = (deg: number, k = 1) => {
    const a = (deg * Math.PI) / 180;
    return [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)] as const;
  };
  const wedge = (a0: number, a1: number, k = 1) => {
    const [x0, y0] = at(a0, k);
    const [x1, y1] = at(a1, k);
    return `M${cx} ${cy}L${x0.toFixed(1)} ${y0.toFixed(1)}A${rx * k} ${ry * k} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`;
  };
  const top = kind === "margherita" ? "#d9482a" : "#f3cf72";
  const spots: [number, number][] = [
    [-0.55, -0.35], [0.1, -0.5], [0.55, -0.15], [-0.25, 0.25], [0.35, 0.45], [-0.62, 0.42], [0.72, 0.3],
  ];
  return (
    <g>
      {/* الصينيّة: ستيلٌ بحافّة. */}
      <path d={`M${cx - 46} ${cy - 3}L${cx + 46} ${cy - 3}L${cx + 50} ${cy + 15}L${cx - 50} ${cy + 15}Z`} fill="#9aa3ad" />
      <path d={`M${cx - 50} ${cy + 15}H${cx + 50}V${cy + 18}H${cx - 50}Z`} fill="#6c747d" />
      <ellipse cx={cx} cy={cy + 1.5} rx={rx + 1} ry={ry + 1} fill="#000" fillOpacity=".18" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#d79a52" />
      <ellipse cx={cx} cy={cy} rx={rx * 0.88} ry={ry * 0.84} fill={top} />
      <g>
        {spots.map(([u, v], i) => {
          const x = cx + u * rx * 0.8;
          const y = cy + v * ry * 0.8;
          if (kind === "margherita")
            return i % 3 === 2 ? (
              <ellipse key={i} cx={x} cy={y} rx="2.8" ry="1.2" fill="#2f7a3a" />
            ) : (
              <ellipse key={i} cx={x} cy={y} rx="4.4" ry="2" fill="#fff6e0" />
            );
          if (kind === "pepperoni") return <ellipse key={i} cx={x} cy={y} rx="3.6" ry="1.7" fill="#b3261e" />;
          return i % 2 ? (
            <ellipse key={i} cx={x} cy={y} rx="1.9" ry="1" fill="none" stroke="#1d1a17" strokeWidth="1.2" />
          ) : (
            <path key={i} d={`M${x - 3.5} ${y}q3.5 -2.4 7 0`} fill="none" stroke="#3f8f3a" strokeWidth="1.6" strokeLinecap="round" />
          );
        })}
      </g>
      <g stroke="#8a4f1f" strokeOpacity=".55" strokeWidth=".8">
        {Array.from({ length: 4 }, (_, i) => {
          const [x0, y0] = at(i * 45 + 22.5);
          const [x1, y1] = at(i * 45 + 202.5);
          return <path key={i} d={`M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`} />;
        })}
      </g>
      {pick && (
        <>
          {/* مكان الشريحة المرفوعة: الصينيّة تحتها، فلا تبقى البيتزا كاملةً وقد رُفعت منها شريحة. */}
          <path d={wedge(-112.5, -67.5)} fill="#9aa3ad" />
          <g className="m-sl-pick">
            <path d={wedge(-112.5, -67.5)} fill="#d79a52" />
            <path d={wedge(-112.5, -67.5, 0.88)} fill={top} />
            <ellipse cx={cx - 1} cy={cy - 7} rx="3.6" ry="1.7" fill="#b3261e" />
            <path d={wedge(-112.5, -67.5)} fill="none" stroke="#8a4f1f" strokeOpacity=".55" strokeWidth=".8" />
          </g>
        </>
      )}
    </g>
  );
}

/** الكاونتر بإحداثيات 320×128: المصابيح، والزجاج ولمعته، والصواني، والوجه وموزّع الأرقام. */
function Counter() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 128" aria-hidden="true" className="block h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`m-sl-steel-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9edf1" />
          <stop offset=".45" stopColor="#c3cad2" />
          <stop offset="1" stopColor="#9aa3ad" />
        </linearGradient>
        <linearGradient id={`m-sl-heat-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb347" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`m-sl-glass-${uid}`}>
          <path d="M8 18Q3 54 14 90H306Q317 54 312 18Z" />
        </clipPath>
      </defs>
      {/* داخل الكاونتر: جدارٌ فاتح ورفّ. */}
      <path d="M12 18H308V90H12Z" fill="#eef1f4" />
      <path d="M12 80H308V90H12Z" fill="#cfd5dc" />
      {/* مصابيح التسخين ووهجها على الصواني. */}
      {[60, 160, 260].map((x, i) => (
        <g key={x} className="m-sl-lamp" style={{ "--n": i } as CSSProperties}>
          <path d={`M${x - 26} 22L${x + 26} 22L${x + 44} 80L${x - 44} 80Z`} fill={`url(#m-sl-heat-${uid})`} />
          <path d={`M${x - 12} 18H${x + 12}L${x + 8} 26H${x - 8}Z`} fill="#2a2f36" />
          <ellipse cx={x} cy="26" rx="7" ry="1.6" fill="#ffd27a" />
        </g>
      ))}
      <g className="m-sl-tray" style={{ "--n": 0 } as CSSProperties}>
        <TrayPie cx={62} kind="margherita" />
      </g>
      <g className="m-sl-tray" style={{ "--n": 1 } as CSSProperties}>
        <TrayPie cx={160} kind="pepperoni" pick />
      </g>
      <g className="m-sl-tray" style={{ "--n": 2 } as CSSProperties}>
        <TrayPie cx={258} kind="veggie" />
      </g>
      {/* الزجاج المقوّس ولمعته — اللمعة تجري مع التمرير. */}
      <path d="M8 18Q3 54 14 90H306Q317 54 312 18Z" fill="#bfe0ff" fillOpacity=".16" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" />
      <g clipPath={`url(#m-sl-glass-${uid})`}>
        <path className="m-sl-glare" d="M40 18L62 18L30 90L8 90Z" fill="#fff" fillOpacity=".42" />
        <path className="m-sl-glare" d="M70 18L78 18L46 90L38 90Z" fill="#fff" fillOpacity=".3" />
      </g>
      {/* الحافّة العليا والوجه: ستيلٌ وشريطٌ بلون العلامة. */}
      <rect x="4" y="12" width="312" height="7" rx="2" fill={`url(#m-sl-steel-${uid})`} />
      <rect x="6" y="90" width="308" height="38" rx="2" fill={`url(#m-sl-steel-${uid})`} />
      <rect x="6" y="98" width="308" height="7" style={{ fill: "var(--m-accent)" }} />
      <path d="M6 90H314" stroke="#fff" strokeOpacity=".8" />
      {/* موزّع الأرقام: يخرج منه رقمك حين تضيف. */}
      <g>
        <rect x="270" y="108" width="34" height="18" rx="3" fill="#20242b" />
        <rect className="m-sl-ticket" x="279" y="99" width="16" height="12" rx="1" fill="#fffdf6" stroke="#b9bfc7" strokeWidth=".6" />
        <rect x="276" y="109" width="22" height="3" rx="1.5" fill="#0c0e11" />
        <circle cx="287" cy="119" r="3" fill="#ffc61a" />
      </g>
    </svg>
  );
}

export function SlicesHead({ restaurant, en, tags = [], corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  const rows = tags.slice(0, BOARD_ROWS).map((t) => categoryLabel(t, en));
  return (
    <header className="m-head m-head-counter relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-sl-shop relative px-3 pt-14">
        <div className="m-sl-board relative mx-auto max-w-[22rem] overflow-hidden px-4 pb-3.5 pt-4">
          <span aria-hidden="true" className="m-sl-band absolute inset-x-0 top-0 block h-1.5" />
          <div className="m-sl-lit relative flex items-center gap-3">
            <LogoMark
              restaurant={restaurant}
              size="relative h-14 w-14 shrink-0"
              style={{ borderRadius: "9999px", background: "var(--m-surface)", boxShadow: "0 0 0 2.5px #ffc61a" }}
              fallbackStyle={{ color: "var(--m-accent-ink, var(--m-accent))" }}
              letterSize="1.6rem"
            />
            <div className="min-w-0 flex-1 text-start">
              <h1 className="m-title m-sl-name text-[1.95rem] font-normal leading-[1.35]" style={display}>
                {restaurant.name}
              </h1>
              {typeLabel && <p className="m-sl-type text-[12.5px] font-bold">{typeLabel}</p>}
            </div>
          </div>
          {rows.length > 0 && (
            // زينةٌ تكرّر أسماء الأقسام: القارئ الآلي يجدها في الشريط تحت.
            <ul aria-hidden="true" className="m-sl-lit m-sl-rows relative mt-3 grid gap-1.5">
              {rows.map((r) => (
                <li key={r} className="flex items-center gap-2 text-[12.5px] font-bold">
                  <SliceGlyph className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate">{r}</span>
                  <span className="m-sl-dots block h-1 min-w-6 flex-1" />
                  <span className="m-sl-tag block h-3.5 w-9 shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="m-sl-counter relative mx-auto -mt-1 max-w-[22rem]">
          <Counter />
        </div>
      </div>
      {banner && (
        <div className="px-4">
          <div className="m-sl-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** شريطٌ من لوحة الأسعار: الشريحة، والاسم مضاءً، والعدد على بطاقة سعرٍ صفراء. */
export function SlicesHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-sl-h mb-4">
      <div className="m-sl-strip flex items-center gap-2.5 px-3 py-2">
        <SliceGlyph className="h-6 w-6 shrink-0" />
        <h2 className="m-sl-hname min-w-0 flex-1 text-[1.35rem] font-normal leading-[1.5]" style={display}>
          {name}
        </h2>
        {items && <span className="m-sl-count shrink-0 px-2 py-0.5 text-[11px] font-black">{items}</span>}
      </div>
      {photo && <div className="m-sl-photo mt-3">{photo}</div>}
    </div>
  );
}
