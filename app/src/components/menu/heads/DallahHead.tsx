/**
 * «دلّة» — قهوة المجلس (٢٠٢٦/١١/٠٧).
 *
 * - `DallahHead`    **صفُّ الدلال** كما يُصفّ في كمار المجلس: دلّةٌ كبيرة من نحاسٍ أصفر
 *   وشعارك محفورٌ في بطنها، والبخار يطلع من منقارها، ودلّتان أصغر منها على جانبيها، وأمامها
 *   فنجالان وصحن تمر — كلّها على رفٍّ من خشبٍ داكن بمساميرَ من نحاس. والاسم تحته بالأميري.
 * - `DallahHeading` عنوان القسم **فنجال**: فنجالٌ بلا أذن بحافّةٍ ذهبية والقهوة الشقراء فيه
 *   وبخاره، ثم الاسم، ثم صفُّ حبّات هيلٍ إلى العدد — والعدد **تمرة**.
 *
 * الخامة والحركة في `styles/skins/dallah.css`. ما يتبع العلامة: النقش على الرفّ والسعر
 * والأزرار. وما لا يتبعها خامة: النحاس والخزف والقهوة والتمر والخشب — الدلّة نحاسٌ أيّاً
 * كان لون التاجر.
 *
 * ⚠️ **ومختلفٌ عمداً** عن «فوّال» (صينيّة نحاسٍ تطلع كالشمس فوق بلاط)، و«نجدي» (جدار طينٍ
 * وباب)، و«روشان» (أقواسٌ ومشربيّات): لا صينيّة ولا جدار ولا قوس — الدلّة نفسها هي الترويسة.
 */
import { useId, type CSSProperties, type ReactNode } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/**
 * الدلّة — مسارٌ واحدٌ لكلّ القطع في `viewBox="0 0 120 136"`: القمّة والغطاء والرقبة
 * والكتف والبطن والقاعدة، والمنقار يرتفع من الكتف هلالاً إلى ما فوق الرقبة (هذا ما
 * يجعلها دلّة لا إبريقاً)، والأذن قوسٌ مفتوحٌ إلى الخلف.
 */
const POT = {
  finial: "M70 0.5 72.6 6H67.4Z",
  lid: "M56 30C56 20 62 13 70 13S84 20 84 30Z",
  brim: "M52 29.5H88a1.8 1.8 0 0 1 0 3.6H52a1.8 1.8 0 0 1 0-3.6Z",
  neck: "M55 33H85C82 44 80.5 54 81.5 64H58.5C59.5 54 58 44 55 33Z",
  collar: "M55.5 63H84.5a2 2 0 0 1 0 4H55.5a2 2 0 0 1 0-4Z",
  belly: "M57 67C40 72 31 88 33 104C35 119 50 127 70 127S105 119 107 104C109 88 100 72 83 67Z",
  foot: "M55 125C55 129 51 132.5 48.5 135H91.5C89 132.5 85 129 85 125Z",
  beak: "M45 76C33 71 25 60 19.5 47.5 15.5 38.5 12 29.5 6.5 21.5 15 27.5 21 37 26.5 45.5 33 55.5 41.5 63 52.5 68.5Z",
} as const;

/** نقطة طرف المنقار بنسبة الصندوق — منها يطلع البخار. */
const BEAK_TIP = { x: 6.5 / 120, y: 21.5 / 136 };
/** مركز البطن وقطر الوسام (بنسبة العرض) — حيث يُحفر الشعار. */
const BELLY = { x: 70 / 120, y: 99 / 136, d: 50 / 120 };

function Pot({ width, logo, className, style }: { width: string; logo?: ReactNode; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const brass = `dl-brass-${id}`;
  const shade = `dl-shade-${id}`;
  return (
    <span className={`relative block shrink-0 ${className ?? ""}`} style={{ width, aspectRatio: "120 / 136", ...style }} aria-hidden={logo ? undefined : true}>
      <svg viewBox="0 0 120 136" aria-hidden="true" className="m-dl-pot-svg absolute inset-0 block h-full w-full overflow-visible">
        <defs>
          {/* نحاسٌ أصفر: ضوءٌ على الثلث الأيسر وظلٌّ على الطرفين — يلمع ولا يتبع العلامة. */}
          <linearGradient id={brass} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#5b3a0b" />
            <stop offset=".2" stopColor="#a5761f" />
            <stop offset=".36" stopColor="#f4dc96" />
            <stop offset=".48" stopColor="#d6a944" />
            <stop offset=".72" stopColor="#9b6c1c" />
            <stop offset="1" stopColor="#56370a" />
          </linearGradient>
          <linearGradient id={shade} x1="0" x2="0" y1="0" y2="1">
            <stop offset=".55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#2a1804" stopOpacity=".38" />
          </linearGradient>
        </defs>
        {/* الأذن خلف كلّ شيء: قوسٌ من أعلى الرقبة إلى البطن، بلفّةٍ صغيرة في أوّله. */}
        <path d="M84 38C103 37 112 53 106.5 71 103 83 99 89 99.5 95" fill="none" stroke="#7a5214" strokeWidth="5" strokeLinecap="round" />
        <path d="M84 38C103 37 112 53 106.5 71 103 83 99 89 99.5 95" fill="none" stroke="#e9c873" strokeWidth="1.4" strokeLinecap="round" opacity=".55" />
        <path d={POT.beak} fill={`url(#${brass})`} stroke="#5b3a0b" strokeWidth=".9" />
        {[POT.foot, POT.belly, POT.neck, POT.collar, POT.lid, POT.brim, POT.finial].map((d) => (
          <path key={d} d={d} fill={`url(#${brass})`} stroke="#5b3a0b" strokeWidth=".9" strokeLinejoin="round" />
        ))}
        <path d={POT.belly} fill={`url(#${shade})`} />
        <circle cx="70" cy="9" r="3.6" fill={`url(#${brass})`} stroke="#5b3a0b" strokeWidth=".9" />
        {/* النقش: حلقتان على الرقبة، وحزامٌ مخرَّمٌ على البطن، ولمعةٌ طوليّة. */}
        <g fill="none" stroke="#5b3a0b" strokeLinecap="round" opacity=".55">
          <path d="M57.5 42.5H82.5" strokeWidth="1" />
          <path d="M58.6 50H81.4" strokeWidth="1" />
          <path d="M39 113C54 121 86 121 101 113" strokeWidth="1.1" />
          <path d="M42 117.5C56 124 84 124 98 117.5" strokeWidth=".8" strokeDasharray="1.2 2.6" />
        </g>
        <ellipse cx="52" cy="92" rx="4.2" ry="15" fill="#fff" opacity=".22" transform="rotate(12 52 92)" />
        <ellipse cx="64" cy="45" rx="1.8" ry="9" fill="#fff" opacity=".28" />
      </svg>
      {logo && (
        <span
          className="m-dl-seal absolute block rounded-full p-[4px]"
          style={{
            left: `${BELLY.x * 100}%`,
            top: `${BELLY.y * 100}%`,
            width: `${BELLY.d * 100}%`,
            aspectRatio: "1",
            translate: "-50% -50%",
          }}
        >
          {logo}
        </span>
      )}
    </span>
  );
}

/** ثلاثة خيوط بخارٍ من طرف المنقار — تعلو مرّتين ثم تسكن (`m-dl-rise`). */
function Steam() {
  return (
    <svg
      viewBox="0 0 40 64"
      aria-hidden="true"
      className="m-dl-steam absolute block h-16 w-10"
      style={{ left: `${BEAK_TIP.x * 100}%`, top: `${BEAK_TIP.y * 100}%`, translate: "-50% -100%" }}
    >
      {["M14 62c-6-9 7-14 0-24s6-14 2-24", "M22 62c-7-10 8-15 0-26s7-15 1-26", "M30 62c-5-8 6-13 0-22s5-13 1-20"].map((d, i) => (
        <path key={i} className="m-dl-wisp" d={d} fill="none" strokeWidth="2.4" strokeLinecap="round" />
      ))}
    </svg>
  );
}

/**
 * الفنجال من جانبه وقد مال قليلاً نحو العين: حافّةٌ بيضاء والقهوة الشقراء فيه، وخطٌّ
 * ذهبيّ تحت الحافّة وعند القاعدة. بلا أذن — هذا ما يقول «فنجال» لا «كوب».
 */
export function Finjan({ className, style }: { className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  const glaze = `dl-glaze-${id}`;
  return (
    <svg viewBox="0 0 40 34" aria-hidden="true" className={className} style={style}>
      <defs>
        <linearGradient id={glaze} x1="0" x2="1">
          <stop offset="0" stopColor="#e6dccb" />
          <stop offset=".35" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d9cdb8" />
        </linearGradient>
      </defs>
      <path d="M3.5 7C4 16.5 8.5 26.5 14 29L13.4 31.6H26.6L26 29C31.5 26.5 36 16.5 36.5 7Z" fill={`url(#${glaze})`} stroke="#b9a988" strokeWidth=".8" />
      <path d="M5 11C12 14.4 28 14.4 35 11" fill="none" stroke="#c9a04a" strokeWidth="1.7" />
      <path d="M13.4 31.2H26.6" stroke="#c9a04a" strokeWidth="1.4" />
      <ellipse cx="20" cy="7" rx="16.5" ry="4.2" fill="#fffdf8" stroke="#b9a988" strokeWidth=".8" />
      <g className="m-dl-coffee">
        <ellipse cx="20" cy="7.3" rx="13.6" ry="3" fill="#d7a443" />
        <ellipse cx="17" cy="6.6" rx="5" ry="1" fill="#f6dc96" opacity=".7" />
      </g>
    </svg>
  );
}

/** صحن تمرٍ من خزف: خمس تمرات بلمعتها. */
function Dates({ className }: { className?: string }) {
  const DATES: [number, number, number][] = [
    [16, 14, -18], [27, 12, 8], [38, 14, 22], [21, 8.5, -4], [33, 8, 14],
  ];
  return (
    <svg viewBox="0 0 54 28" aria-hidden="true" className={className}>
      {DATES.map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="6.4" ry="3.6" fill="#5a2a12" />
          <ellipse cx={x - 1.4} cy={y - 1.3} rx="3.2" ry="1" fill="#b46a3c" opacity=".7" />
        </g>
      ))}
      <path d="M2 15.5C5 26 49 26 52 15.5Z" fill="#fbf7ef" stroke="#b9a988" strokeWidth=".8" />
      <path d="M2 15.5H52" stroke="#c9a04a" strokeWidth="1.3" />
    </svg>
  );
}

export function DallahHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-majlis relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-dl-room relative px-3 pt-12">
        <span aria-hidden="true" className="m-dl-lamp absolute inset-0 block" />
        {/* صفّ الدلال على الرفّ: الكبيرة في الوسط بشعارك، والصغيرتان خلفها على جانبيها. */}
        <div className="relative mx-auto flex max-w-[22rem] items-end justify-center">
          <Pot width="5.6rem" className="m-dl-pot m-dl-pot-2 z-[1] -me-5" />
          <span className="m-dl-pot m-dl-pot-1 relative z-[2] block">
            <Pot
              width="9.6rem"
              logo={
                <LogoMark
                  restaurant={restaurant}
                  size="relative h-full w-full"
                  style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
                  fallbackStyle={{ color: "var(--m-accent)" }}
                  letterSize="1.9rem"
                />
              }
            />
            <Steam />
          </span>
          <Pot width="4.6rem" className="m-dl-pot m-dl-pot-3 z-[1] -ms-4" style={{ transform: "scaleX(-1)" }} />
          {/* أمام الصفّ: الفنجالان تحت منقار الكبيرة (يساراً في الاتّجاهين — المنقار يسار الرسم، ومنه
              تصبّ حين يُضاف صنف)، وصحن التمر في الجهة الأخرى. */}
          <span aria-hidden="true" className="m-dl-cups absolute bottom-0 left-[8%] z-[3] flex items-end gap-0.5">
            <Finjan className="m-dl-finjan block h-[1.55rem] w-[1.85rem]" />
            <Finjan className="m-dl-finjan block h-[1.55rem] w-[1.85rem]" />
          </span>
          <Dates className="m-dl-dates absolute bottom-0 right-[7%] z-[3] block h-[1.6rem] w-[3.1rem]" />
        </div>
        <span aria-hidden="true" className="m-dl-shelf relative z-[4] -mx-3 block h-[18px]" />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2.15rem] font-bold leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-dl-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** الفنجال وبخاره، ثم الاسم، ثم حبّات الهيل إلى العدد — والعدد تمرة. */
export function DallahHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-finjan-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <span aria-hidden="true" className="m-dl-cup relative block shrink-0">
          <svg viewBox="0 0 20 18" className="m-dl-cup-steam absolute bottom-[78%] left-1/2 block h-4 w-5 -translate-x-1/2">
            <path className="m-dl-wisp" d="M7 17c-3-4 3-6 0-10s3-5 1-7" fill="none" strokeWidth="1.6" strokeLinecap="round" />
            <path className="m-dl-wisp" d="M13 17c-3-4 3-6 0-10s3-5 1-7" fill="none" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <Finjan className="block h-[1.9rem] w-[2.25rem]" />
        </span>
        <h2 className="min-w-0 text-[1.45rem] font-bold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-dl-pods block h-2.5 min-w-6 flex-1" />
        {items && <span className="m-dl-date shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-dl-photo mt-3">{photo}</div>}
    </div>
  );
}
