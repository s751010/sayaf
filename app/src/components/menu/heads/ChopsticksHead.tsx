/**
 * «عيدان» — مطعم السوشي والمطبخ الآسيوي (٢٠٢٦/١١/١١، الموجة ب).
 *
 * - `ChopsticksHead`    **ستارة مدخلٍ** (نورين) بلون العلامة على عصا خشب **وشعارك في دائرتها**، وتحتها **لوحُ
 *   خشبٍ** عليه نيغيري سلمون وتونة وثلاث قطع ماكي وزنجبيلٌ ووسابي، و**صحن صويا**، و**عيدانٌ على مسندها**. وفي
 *   أسفل المسرح **سيرٌ ناقل** (كايتن) تمرّ عليه الصحون مع التمرير (`--m-scroll-y`، `lib/skinMotion.ts`).
 *   و**حين يُضاف صنفٌ تلتقط العيدان قطعة التونة** وترفعها ثم تردّها.
 * - `ChopsticksHeading` عنوان القسم **ختمٌ أحمر** (هانكو) برمز القسم — رمزٌ لا حرف — والاسم بخطّ الرقعة فوق
 *   **ضربة فرشاة** بالحبر، والعدد صغيراً في آخر السطر.
 *
 * ⚠️ **بلا حروفٍ يابانية ولا علامةٍ قائمة**: الستارة دائرةٌ وخطوط، والختم رمز القسم.
 *
 * الخامة والحركة في `styles/skins/chopsticks.css`. ما يتبع العلامة: الستارة والختم وحافّة صحون السير
 * والأزرار. وما لا يتبعها خامة: الخشب والأرزّ والسمك والنوري والوسابي والزنجبيل والصويا.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** نيغيري: كتلة أرزٍّ وشريحة سمكٍ فوقها بخطوط دهنها. */
function Nigiri({ x, fish, fat, className }: { x: number; fish: string; fat: string; className?: string }) {
  return (
    <g className={className}>
      <rect x={x} y="104" width="34" height="14" rx="7" fill="#fbf8f0" stroke="#e6dfcd" strokeWidth=".8" />
      <path d={`M${x - 2} 109Q${x} 96 ${x + 17} 97Q${x + 35} 96 ${x + 37} 109Q${x + 17} 104 ${x - 2} 109Z`} fill={fish} />
      <path d={`M${x + 6} 101.5l4 5M${x + 14} 99.5l4 6M${x + 22} 99.5l4 6M${x + 30} 101.5l3 5`} stroke={fat} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  );
}

/** قطعة ماكي من فوق: نوري، وأرزّ، وحشوة. */
function Maki({ cx, fill }: { cx: number; fill: string }) {
  return (
    <g>
      <circle cx={cx} cy="111" r="10" fill="#1e2522" />
      <circle cx={cx} cy="111" r="7.6" fill="#fbf8f0" />
      <circle cx={cx} cy="111" r="3.4" fill={fill} />
      <circle cx={cx - 3.6} cy="108.4" r=".7" fill="#e6dfcd" />
      <circle cx={cx + 4} cy="113.6" r=".7" fill="#e6dfcd" />
    </g>
  );
}

/** المشهد بإحداثيات 260×176: الستارة أعلى، واللوح في الوسط، والصويا والعيدان أمامه. */
function Board() {
  return (
    <svg viewBox="0 0 260 176" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      {/* الستارة: عصا خشب، وثلاث شققٍ بلون العلامة، ودائرة الشعار البيضاء. */}
      <rect x="22" y="6" width="216" height="6" rx="3" fill="#8a5a32" />
      <g className="m-ch-noren">
        <rect x="32" y="10" width="62" height="46" className="m-ch-cloth" />
        <rect x="99" y="10" width="62" height="52" className="m-ch-cloth" />
        <rect x="166" y="10" width="62" height="46" className="m-ch-cloth" />
        <path d="M40 46H86M174 46H220" stroke="#ffffff" strokeOpacity=".5" strokeWidth="1.4" />
        <path d="M40 50H86M174 50H220" stroke="#ffffff" strokeOpacity=".3" strokeWidth="1.4" />
      </g>
      <circle cx="130" cy="33" r="19" fill="#ffffff" />

      {/* اللوح: وجهٌ فاتح بعروقه، وحافّةٌ أغمق، وقدمان. */}
      <rect x="40" y="132" width="16" height="10" rx="2" fill="#a77c48" />
      <rect x="204" y="132" width="16" height="10" rx="2" fill="#a77c48" />
      <rect x="24" y="90" width="212" height="38" rx="4" fill="#dcb47e" />
      <rect x="24" y="124" width="212" height="9" rx="3" fill="#b98d55" />
      <path d="M32 98H120M138 98H226M32 120H96M150 120H226" stroke="#c99f66" strokeWidth="1.2" strokeLinecap="round" />

      {/* القطع: وسابي، ونيغيري سلمون، ونيغيري تونة (تلتقطه العيدان)، وثلاث ماكي، وزنجبيل. */}
      <path d="M33 117q2-9 8-9q6 0 8 9Z" fill="#8fbf4a" />
      <path d="M37 112q3-3 6 0" fill="none" stroke="#b9dc84" strokeWidth="1.2" strokeLinecap="round" />
      <Nigiri x={56} fish="#f2875a" fat="#ffd2bb" />
      <Nigiri x={98} fish="#c7323e" fat="#ea7a82" className="m-ch-pick" />
      <Maki cx={152} fill="#f2875a" />
      <Maki cx={175} fill="#8db54a" />
      <Maki cx={198} fill="#f2875a" />
      <g fill="#f4b9a9" stroke="#e6998a" strokeWidth=".6">
        <path d="M214 116q-2-10 7-12q5 6-2 12Z" />
        <path d="M220 117q0-9 9-9q2 7-6 10Z" />
      </g>

      {/* صحن الصويا أمام اللوح يساراً. */}
      <ellipse cx="46" cy="158" rx="20" ry="8" fill="#ffffff" stroke="#ddd6c8" strokeWidth="1" />
      <ellipse className="m-ch-soy" cx="46" cy="157.5" rx="14" ry="5" fill="#3a1f12" />
      <path d="M38 156q4-2 8-1" fill="none" stroke="#ffffff" strokeOpacity=".35" strokeWidth="1.2" strokeLinecap="round" />

      {/* العيدان على مسندها — تلتقط التونة حين يُضاف صنف. */}
      <ellipse cx="206" cy="160" rx="9" ry="4" fill="#e9e2d4" stroke="#cfc6b4" strokeWidth=".8" />
      <g className="m-ch-sticks">
        <path d="M120 156L250 146" className="m-ch-stick" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M122 162L251 152" className="m-ch-stick" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M120 156L140 154.5M122 162L142 160.5" stroke="#d6b183" strokeWidth="3.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** صحون السير: صحنٌ بحافّةٍ ملوّنة وقطعةٌ عليه — كلّ ٦٤ بكسلاً. */
const PLATES = Array.from({ length: 42 }, (_, i) => i);
const BELT_W = PLATES.length * 64;

function Belt() {
  return (
    <div aria-hidden="true" className="m-ch-belt relative h-[38px] overflow-hidden" dir="ltr">
      <div className="m-ch-track absolute inset-y-0 start-0" style={{ width: BELT_W }}>
        <svg viewBox={`0 0 ${BELT_W} 38`} width={BELT_W} height="38" className="block">
          <rect x="0" y="6" width={BELT_W} height="26" className="m-ch-rail" />
          <path d={`M0 9H${BELT_W}M0 29H${BELT_W}`} stroke="#ffffff" strokeOpacity=".18" strokeWidth="1" />
          {PLATES.map((i) => {
            const cx = 32 + i * 64;
            return (
              <g key={i}>
                <ellipse cx={cx} cy="20" rx="20" ry="9" className={`m-ch-plate m-ch-p${i % 3}`} />
                <ellipse cx={cx} cy="19.5" rx="15" ry="6.4" fill="#fffdf8" />
                {i % 2 ? (
                  <g>
                    <rect x={cx - 9} y="15" width="18" height="7" rx="3.5" fill="#fbf8f0" />
                    <path d={`M${cx - 10} 18q1-6 10-6q9 0 10 6q-10-2-20 0Z`} fill={i % 4 === 1 ? "#f2875a" : "#c7323e"} />
                  </g>
                ) : (
                  <g>
                    <circle cx={cx - 5} cy="18" r="5" fill="#1e2522" />
                    <circle cx={cx - 5} cy="18" r="3.6" fill="#fbf8f0" />
                    <circle cx={cx - 5} cy="18" r="1.6" fill="#f2875a" />
                    <circle cx={cx + 6} cy="18" r="5" fill="#1e2522" />
                    <circle cx={cx + 6} cy="18" r="3.6" fill="#fbf8f0" />
                    <circle cx={cx + 6} cy="18" r="1.6" fill="#8db54a" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function ChopsticksHead({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-chopsticks relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-ch-stage relative overflow-hidden pt-14">
        <div className="m-ch-scene relative mx-auto aspect-[260/176] w-full max-w-[20rem]">
          <Board />
          <span className="m-ch-seal absolute left-1/2 top-[18.75%] z-[2] block aspect-square w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="1.2rem"
            />
          </span>
        </div>
        <Belt />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[2.1rem] leading-[1.45]" style={{ ...display, color: "var(--m-text)" }}>
          {restaurant.name}
        </h1>
        {typeLabel && (
          <p className="text-[13px]" style={{ color: "var(--m-muted)" }}>
            {typeLabel}
          </p>
        )}
      </div>
      {banner && (
        <div className="px-4">
          <div className="m-ch-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** الختم برمز القسم، ثم الاسم فوق ضربة الفرشاة، ثم العدد. */
export function ChopsticksHeading({ name, items, icon = "fish", photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-ch-h mb-5">
      <div className="flex items-center gap-3 px-1">
        <span aria-hidden="true" className="m-ch-hanko flex h-10 w-10 shrink-0 items-center justify-center">
          <Icon name={icon} size={21} />
        </span>
        <div className="relative min-w-0 flex-1">
          <svg viewBox="0 0 160 14" preserveAspectRatio="none" aria-hidden="true" className="m-ch-brush absolute bottom-0.5 start-0 block h-3 w-40 max-w-full">
            <path d="M2 9C30 3 78 2 158 5C150 8 120 9 96 10C64 11 30 13 6 12C3 11.6 2 10.5 2 9Z" />
          </svg>
          <h2 className="relative text-[1.55rem] leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
            {name}
          </h2>
        </div>
        {items && <span className="m-ch-count shrink-0 text-[11px]">{items}</span>}
      </div>
      {photo && <div className="m-ch-photo mt-3">{photo}</div>}
    </div>
  );
}
