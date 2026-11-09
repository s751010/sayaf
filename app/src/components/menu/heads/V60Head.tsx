/**
 * «تقطير» — بار التقطير (٢٠٢٦/١١/٠٩).
 *
 * - `V60Head`    **قمع V60 من خزفٍ بلون العلامة** بأضلاعه الحلزونية وورقة الفلتر على حافّته،
 *   وشعارك وسامٌ على وجهه، يجلس على **إبريقٍ زجاجيّ** فوق ميزانٍ رقميّ؛ والغلّاية بعنقها
 *   الرفيع تصبّ في القمع، والقطرات تسقط منه في الإبريق. **والقهوة في الزجاج تعلو مع التمرير**
 *   (`--m-scroll-y` من `lib/skinMotion.ts`)، والقطرات تسقط ما دام الزبون يمرّر.
 * - `V60Heading` عنوان القسم: **قمعٌ صغير فوق فنجان** بحبر العلامة، والاسم، وخطٌّ شعريّ إلى
 *   العدد على ملصق مختبر — وقطرةٌ تسقط من القمع إلى الفنجان حين يدخل القسم الشاشة.
 *
 * الخامة والحركة في `styles/skins/v60.css`. ما يتبع العلامة: خزف القمع ووسامه، وحبر العنوان،
 * والسعر والأزرار. وما لا يتبعها خامة: الزجاج والقهوة والورق والستيل والميزان.
 */
import type { CSSProperties } from "react";
import { SafeImage } from "@/components/ui";
import { restaurantTypeLabel } from "@/lib/menuText";
import { Corner, type HeadProps } from "../SkinHeads";
import { LogoMark } from "../LogoMark";
import type { SkinHeadingProps } from "./DukkanHead";

const display: CSSProperties = { fontFamily: "var(--m-display, var(--m-font))" };

/** جسم الإبريق — مسارٌ واحد للزجاج وللقهوة داخله (القهوة تُقصّ به). */
const SERVER = "M127 124Q121 150 131 171Q136 179 147 179H173Q184 179 189 171Q199 150 193 124Z";

/** المشهد كلّه بإحداثيات 320×200: الغلّاية والقمع والإبريق والميزان. */
function BrewBar() {
  return (
    <svg viewBox="0 0 320 200" aria-hidden="true" className="absolute inset-0 block h-full w-full overflow-visible">
      <defs>
        <clipPath id="m-v6-server">
          <path d={SERVER} />
        </clipPath>
        <clipPath id="m-v6-cone">
          <path d="M116 60H204L172 110H148Z" />
        </clipPath>
        <linearGradient id="m-v6-coffee" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a4a22" />
          <stop offset=".18" stopColor="#5c2c12" />
          <stop offset="1" stopColor="#2e1408" />
        </linearGradient>
        <linearGradient id="m-v6-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d949a" />
          <stop offset=".45" stopColor="#f2f4f5" />
          <stop offset="1" stopColor="#9aa1a7" />
        </linearGradient>
        <linearGradient id="m-v6-gloss" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".22" />
          <stop offset=".3" stopColor="#fff" stopOpacity=".28" />
          <stop offset=".42" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".18" />
        </linearGradient>
      </defs>

      {/* الميزان: لوحٌ داكن بشاشةٍ صغيرة مضيئة — بلا رقم (زخرفةٌ لا نصّ). */}
      <rect x="98" y="179" width="124" height="13" rx="4" fill="#1f2326" />
      <rect x="98" y="179" width="124" height="3" rx="1.5" fill="#3a4045" />
      <rect className="m-v6-lcd" x="196" y="183.5" width="18" height="5" rx="1" fill="#9fe3c4" />

      {/* الإبريق: القهوة داخله (تعلو)، ثم الزجاج فوقها بلمعته وتدريجه. */}
      <g clipPath="url(#m-v6-server)">
        <rect className="m-v6-level" x="118" y="118" width="84" height="62" fill="url(#m-v6-coffee)" />
      </g>
      <path d={SERVER} fill="rgba(255,255,255,.18)" stroke="rgba(60,70,75,.55)" strokeWidth="1.4" />
      <path d="M136 132Q133 150 139 167" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
      <g stroke="rgba(60,70,75,.45)" strokeWidth="1">
        <path d="M181 140h6M182 150h5M182 160h6" />
      </g>
      {/* الأذن: زجاجٌ سميك على الجانب. */}
      <path d="M192 130Q211 133 208 151Q206 164 190 166" fill="none" stroke="rgba(60,70,75,.5)" strokeWidth="5" strokeLinecap="round" />
      <path d="M192 130Q211 133 208 151Q206 164 190 166" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.2" strokeLinecap="round" />
      {/* فم الإبريق: حلقة زجاجٍ تحت قاعدة القمع. */}
      <rect x="124" y="118" width="72" height="7" rx="3.5" fill="rgba(255,255,255,.35)" stroke="rgba(60,70,75,.5)" strokeWidth="1.2" />

      {/* القمع: الورقة فوق الحافّة، ثم الخزف بأضلاعه، ثم القاعدة المستديرة. */}
      <path d="M118 60L122 46L128 55L134 44L140 54L147 43L153 53L160 42L167 53L173 43L180 54L186 44L192 55L198 46L202 60Z" fill="#fbfaf6" stroke="#ddd8cc" strokeWidth=".8" />
      <path className="m-v6-ceramic" d="M116 60H204L172 110H148Z" style={{ fill: "var(--m-accent)" }} />
      <g clipPath="url(#m-v6-cone)" stroke="#000" strokeOpacity=".16" strokeWidth="2.4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <path key={i} d={`M${100 + i * 15} 60Q${118 + i * 13} 86 ${132 + i * 10} 112`} fill="none" />
        ))}
      </g>
      <path d="M116 60H204L172 110H148Z" fill="url(#m-v6-gloss)" />
      {/* الحافّة العريضة والأذن على جانب القمع. */}
      <rect className="m-v6-ceramic" x="110" y="56" width="100" height="7" rx="3.5" style={{ fill: "var(--m-accent)" }} />
      <rect x="110" y="56" width="100" height="3" rx="1.5" fill="#fff" fillOpacity=".28" />
      <path className="m-v6-ceramic" d="M206 64Q224 64 222 80Q220 92 196 92" fill="none" style={{ stroke: "var(--m-accent)" }} strokeWidth="6" strokeLinecap="round" />
      <rect className="m-v6-ceramic" x="138" y="108" width="44" height="11" rx="2.5" style={{ fill: "var(--m-accent)" }} />
      <rect x="138" y="108" width="44" height="11" rx="2.5" fill="url(#m-v6-gloss)" />

      {/* الغلّاية: جسمٌ من ستيل، وعنقٌ رفيع يصبّ في القمع، ومقبضٌ من خشب. */}
      <path d="M34 34Q20 34 18 52Q17 64 30 70" fill="none" stroke="#2c2622" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 22H84Q96 40 94 70H32Q30 40 40 22Z" fill="url(#m-v6-steel)" stroke="#6f767c" strokeWidth=".8" />
      <rect x="44" y="16" width="36" height="7" rx="3.5" fill="url(#m-v6-steel)" stroke="#6f767c" strokeWidth=".8" />
      <circle cx="62" cy="13" r="3.6" fill="#3a2a1e" />
      <path d="M90 60Q112 62 112 44Q112 33 124 31L128 30" fill="none" stroke="#8a9096" strokeWidth="4.2" strokeLinecap="round" />
      <path d="M90 60Q112 62 112 44Q112 33 124 31L128 30" fill="none" stroke="#f4f6f7" strokeWidth="1.4" strokeLinecap="round" />
      {/* خيط الماء من العنق إلى قلب القمع. */}
      <path className="m-v6-pour" d="M128.6 31.6Q136 38 141 58" fill="none" stroke="#bfe0f2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function V60Head({ restaurant, corner, children }: HeadProps) {
  const typeLabel = restaurantTypeLabel(restaurant.type);
  const banner = restaurant.banner_image?.trim();
  return (
    <header className="m-head m-head-dripper relative overflow-hidden pb-1">
      <Corner>{corner}</Corner>
      <div className="m-v6-wall relative px-3 pt-11">
        <span aria-hidden="true" className="m-v6-light absolute inset-0 block" />
        <div className="m-v6-bar relative mx-auto aspect-[16/10] w-full max-w-[21rem]">
          <BrewBar />
          {/* القطرات من ثقب القمع إلى سطح القهوة — داخل الزجاج. */}
          <span aria-hidden="true" className="m-v6-drops absolute block">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`m-v6-drop m-v6-drop-${i} absolute block`} />
            ))}
          </span>
          {/* الوسام على وجه القمع: شعارك في حلقةٍ من خزفٍ أبيض. */}
          <span className="m-v6-seal absolute left-1/2 top-[41.5%] z-[2] block aspect-square w-[13%] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3px]">
            <LogoMark
              restaurant={restaurant}
              size="relative h-full w-full"
              style={{ borderRadius: "9999px", background: "var(--m-surface)" }}
              fallbackStyle={{ color: "var(--m-accent)" }}
              letterSize="1.35rem"
            />
          </span>
        </div>
        <span aria-hidden="true" className="m-v6-counter -mx-3 block h-[14px]" />
      </div>
      <div className="px-4 text-center">
        <h1 className="m-title mt-4 text-[1.85rem] font-extrabold leading-[1.5]" style={{ ...display, color: "var(--m-text)" }}>
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
          <div className="m-v6-window mx-auto mt-5 max-w-sm overflow-hidden">
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

/** قمعٌ صغير فوق فنجان — حبره `currentColor` فيلبس لون العلامة بنسخته المقروءة. */
function MiniBrew() {
  return (
    <svg viewBox="0 0 30 40" aria-hidden="true" className="block h-[2.6rem] w-[1.95rem]">
      <path d="M4 5h22l-8.5 13h-5Z" fill="currentColor" />
      <path d="M2.5 4.2h25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="11" y="17.5" width="8" height="3" rx="1" fill="currentColor" />
      <path d="M8 7.5l3 6M13 7l1.6 7M18.5 7l-1.4 7" stroke="#fff" strokeOpacity=".4" strokeWidth="1" />
      <path d="M7 29h16l-1.6 7.4a2 2 0 0 1-2 1.6h-8.8a2 2 0 0 1-2-1.6Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M23 30.5c3.2 0 3.6 4.6-.6 4.9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.4 31.2h13.2" stroke="currentColor" strokeOpacity=".45" strokeWidth="2.6" />
    </svg>
  );
}

/** القمع الصغير والقطرة، ثم الاسم، ثم خطٌّ شعريّ إلى ملصق المختبر بالعدد. */
export function V60Heading({ name, items, photo }: SkinHeadingProps) {
  return (
    <div className="m-h m-brew-h mb-4">
      <div className="flex items-center gap-3 px-1">
        <span className="m-v6-mini relative shrink-0" style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
          <MiniBrew />
          <span aria-hidden="true" className="m-v6-minidrop absolute block" />
        </span>
        <h2 className="min-w-0 text-[1.35rem] font-extrabold leading-[1.55]" style={{ ...display, color: "var(--m-text)" }}>
          {name}
        </h2>
        <span aria-hidden="true" className="m-v6-rule block h-px min-w-6 flex-1" />
        {items && <span className="m-v6-tag shrink-0 px-2.5 py-1 text-[11px] font-bold">{items}</span>}
      </div>
      {photo && <div className="m-v6-photo mt-3">{photo}</div>}
    </div>
  );
}
