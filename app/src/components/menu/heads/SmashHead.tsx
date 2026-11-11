/**
 * «سماش» — محلّ السماش برجر الليلي (٢٠٢٦/١١/١١).
 *
 * - `SmashHead`    **لافتة نيون** على جدارٍ داكن: أنبوبٌ بلون العلامة حول شعارك واسمك، فوق **صاجٍ حديديّ**
 *   عليه البرجر **مفكّكاً طبقاتٍ** — خبزٌ ولحمٌ وجبنٌ وخبز — **يُبنى طبقةً طبقة وأنت تمرّر**
 *   (`--m-scroll-y`، `lib/skinMotion.ts`)، وبجانبه كرة لحمٍ تحت **المكبس**: حين يُضاف صنفٌ ينزل المكبس
 *   **فتُضغط الكرة على الصاج** ويطشّ.
 * - `SmashHeading` عنوان القسم: **قرص لحمٍ** صغير يُكبس حين يدخل القسم، والاسم، وشريطُ صاجٍ إلى العدد في
 *   **أنبوب نيون**.
 *
 * الخامة والحركة في `styles/skins/smash.css`. ما يتبع العلامة: أنبوب النيون والعدد والأزرار والسعر. وما لا
 * يتبعها خامة: الخبز واللحم والجبن والحديد والمكبس.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** قرص لحمٍ مكبوس بحافّته المقرمشة — بإحداثيات 0..32 × 0..14. */
function Patty() {
  return (
    <>
      <path
        d="M2 7.5q0-2 2-2.6q1-1.6 3-1.2q1.4-1.4 3.6-.8q1.6-1.2 3.8-.6q2-1 4 0q2-.8 3.8.4q2.2-.4 3.4 1q2 0 2.8 1.6q1.8.8 1.6 2.6q.4 1.8-1.4 2.6q-.8 1.6-2.8 1.6q-1.2 1.4-3.4 1h-15q-2 .4-3.2-1.2q-2 0-2.8-1.6q-1.6-1-1.4-2.8Z"
        fill="#5a2f1a"
      />
      <path d="M6 6.4q10-2.4 20 0" fill="none" stroke="#8a4a22" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 9.6q11 2 22 0" fill="none" stroke="#3a1c0e" strokeWidth="1" strokeLinecap="round" />
    </>
  );
}

/** المشهد بإحداثيات 320×180: الصاج بعرضه، والبرجر بطبقاته في الوسط، والمكبس فوق الكرة يميناً. */
function Flattop() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {/* الصاج: سطحٌ حديديّ بحافّةٍ لامعة، ووجهٌ أمامي بمقبضين، ورجلان. */}
      <rect x="20" y="168" width="10" height="12" fill="#1c1c20" />
      <rect x="290" y="168" width="10" height="12" fill="#1c1c20" />
      <path d="M8 138H312L306 150H14Z" fill="#45464c" />
      <rect x="8" y="136" width="304" height="3" rx="1.5" fill="#6d6f76" />
      <rect className="m-sm-heat" x="40" y="139" width="240" height="2" rx="1" fill="#ff7a2a" fillOpacity=".55" />
      <rect x="14" y="150" width="292" height="20" rx="3" fill="#2b2c31" />
      <rect x="14" y="150" width="292" height="2" fill="#000" fillOpacity=".35" />
      {[44, 276].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="160" r="6" fill="#c9ced2" />
          <rect x={cx - 1} y="155" width="2" height="5" rx="1" fill="#2b2c31" />
        </g>
      ))}
      <rect x="140" y="156" width="40" height="8" rx="2" fill="#1c1c20" />

      {/* البرجر طبقاتٍ — من تحت: الخبز، ثم اللحم، ثم الجبن، ثم الخبز. */}
      <g className="m-sm-stack">
        <g className="m-sm-l0">
          <path d="M74 124H166Q168 136 160 138H80Q72 136 74 124Z" fill="#d68f3c" />
          <rect x="74" y="122" width="92" height="5" rx="2.5" fill="#f2cf95" />
        </g>
        <g className="m-sm-l1">
          <g transform="translate(64 100) scale(3.5 1.8)">
            <Patty />
          </g>
        </g>
        <g className="m-sm-l2">
          <path d="M76 104H164L170 112L160 109L154 118L146 110H96L88 118L82 109L70 112Z" fill="#ffc93c" />
          <path d="M76 104H164" stroke="#ffe08a" strokeWidth="2" strokeLinecap="round" />
        </g>
        <g className="m-sm-l3">
          <path d="M70 104Q70 66 120 64Q170 66 170 104Z" fill="#e0953a" />
          <path d="M80 92Q86 74 112 70" fill="none" stroke="#f2b866" strokeWidth="5" strokeLinecap="round" />
          <rect x="70" y="100" width="100" height="5" rx="2.5" fill="#c97a2a" />
          <g fill="#fff3d6">
            {[
              [100, 76, -20],
              [118, 72, 10],
              [136, 76, 30],
              [110, 86, -10],
              [128, 85, 20],
              [146, 88, 40],
              [92, 90, -30],
            ].map(([x, y, r]) => (
              <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="1.3" transform={`rotate(${r} ${x} ${y})`} />
            ))}
          </g>
        </g>
      </g>

      {/* محطّة السماش: كرة لحمٍ على الصاج، والمكبس فوقها، وقرصٌ مكبوس يظهر لحظة الضغط. */}
      <ellipse className="m-sm-flat" cx="254" cy="134" rx="24" ry="3.6" fill="#5a2f1a" />
      <g className="m-sm-ball">
        <circle cx="254" cy="124" r="12" fill="#7a3f22" />
        <path d="M246 118q4-5 10-4" fill="none" stroke="#a25a32" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="258" cy="128" r="1.4" fill="#4a2412" />
        <circle cx="249" cy="126" r="1.1" fill="#4a2412" />
      </g>
      <g className="m-sm-sizzle" fill="none" stroke="#fff3d6" strokeWidth="2" strokeLinecap="round" strokeOpacity=".8">
        <path d="M224 126l-8-4M226 116l-9-1M284 126l8-4M282 116l9-1" />
      </g>
      <g className="m-sm-press">
        <rect x="251" y="56" width="6" height="28" rx="2" fill="#2b2c31" />
        <rect x="242" y="50" width="24" height="9" rx="4.5" style={{ fill: "var(--m-accent-2)" }} />
        <rect x="228" y="84" width="52" height="8" rx="2" fill="#c9ced2" />
        <rect x="228" y="84" width="52" height="2" rx="1" fill="#ffffff" />
      </g>
    </svg>
  );
}

export function SmashHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-flattop relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-sm-wall relative px-4 pt-16">
        {/* لافتة النيون: أنبوبٌ بلون العلامة حول الشعار والاسم. */}
        <div className="m-sm-sign relative mx-auto flex max-w-sm items-center gap-3 px-4 py-3">
          <span className="m-sm-ring block shrink-0 rounded-full p-[3px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-14 w-14"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="1.6rem"
            />
          </span>
          <div className="min-w-0 text-start">
            <h1 className="m-title m-sm-neon text-[1.85rem] leading-[1.35]" style={display}>
              {restaurant.name}
            </h1>
            {typeLabel && (
              <p className="mt-0.5 text-[13px] font-bold" style={{ color: "var(--m-muted)" }}>
                {typeLabel}
              </p>
            )}
          </div>
        </div>
        <div className="m-sm-scene relative mx-auto mt-3 aspect-[16/9] w-full max-w-[22rem]">
          <Flattop />
        </div>
      </div>
      {banner && (
        <div className="px-4">
          <div className="m-sm-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** قرصٌ يُكبس، ثم الاسم، ثم شريط الصاج إلى العدد في أنبوب النيون. */
export function SmashHeading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-sm-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <svg viewBox="0 0 32 14" aria-hidden="true" className="m-sm-patty block h-4 w-9 shrink-0 overflow-visible">
          <Patty />
        </svg>
        <h2 className="min-w-0 text-[1.45rem] leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-sm-strip block h-[5px] min-w-6 flex-1" />
        {items && <span className="m-sm-count shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-sm-photo mt-3">{photo}</div>}
    </div>
  );
}
