/**
 * معايناتٌ مصغّرة لطوابع المشاوي الأربعة (٢٠٢٦/١١/٠٩، الموجة ٣) — شاورما · ستيك · أوجاق · مدخنة.
 *
 * كأخواتها في `PizzaMinis.tsx`: **أشكالٌ لا نصوص**، والألوان من `vars` الطابع (بلون علامة التاجر إن
 * صبغه)، والخامات (لحم، ورق جزّار، نحاس، أردواز) ثابتة كما في `skins/<id>.css`. وتسجيلها في
 * `ThemePreview.tsx` (`switch`).
 */
import type { ReactNode } from "react";

type Vars = Record<string, string>;

function Frame({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: bg }} aria-hidden="true">
      <svg viewBox="0 0 160 112" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 block h-full w-full">
        {children}
      </svg>
    </div>
  );
}

function Lines({ v, y = 88, text }: { v: Vars; y?: number; text?: string }) {
  return (
    <>
      <rect x="50" y={y} width="60" height="5" rx="2.5" fill={text ?? v["--m-text"]} />
      <rect x="62" y={y + 8} width="36" height="3" rx="1.5" fill={v["--m-muted"]} opacity=".7" />
    </>
  );
}

/** شاورما: لوح لهبٍ برتقاليّ، ومخروطٌ بطبقاتٍ أمامه، وقرصٌ بلون العلامة في رأسه. */
export function ShawarmaMini({ v }: { v: Vars }) {
  return (
    <Frame bg={`linear-gradient(180deg, #ffffff 0 74%, ${v["--m-bg"]} 74%)`}>
      <rect x="86" y="14" width="26" height="58" rx="3" fill="#3a3633" />
      <rect x="90" y="18" width="18" height="50" rx="1" fill="#ff7a1a" />
      <path d="M90 30H108M90 42H108M90 54H108" stroke="#d9360f" strokeWidth="1.4" />
      <rect x="78.5" y="8" width="3" height="70" rx="1.5" fill="#a9a49d" />
      <path d="M64 20H96L88 70H72Z" fill="#b8692f" />
      <path d="M64 20H96L88 70H72Z" fill="none" stroke="#7a3a14" strokeWidth=".8" />
      <path d="M66 28H94M67 36H93M69 44H91M70 52H90M71 60H89" stroke="#8a4218" strokeWidth="1.4" />
      <path d="M72 20L76 70M84 20L82 70" stroke="#5a240a" strokeWidth="2" strokeOpacity=".5" />
      <circle cx="80" cy="14" r="7" fill={v["--m-accent"]} />
      <circle cx="80" cy="14" r="4.5" fill={v["--m-surface"]} />
      <rect x="62" y="72" width="36" height="5" rx="2" fill="#c9c4bd" />
      <Lines v={v} y={89} />
    </Frame>
  );
}

/** ستيك: ورقة جزّارٍ على جدارٍ داكن، وعليها ثورٌ مقسوم قطعتُه الأولى بلون العلامة. */
export function SteakhouseMini({ v }: { v: Vars }) {
  return (
    <Frame bg={v["--m-bg"]}>
      <path d="M68 6L80 2L92 6" stroke="#b39a72" fill="none" />
      <rect x="28" y="8" width="104" height="66" rx="1.5" fill="#e6cfa6" transform="rotate(-1.5 80 41)" />
      <g fill="none" stroke="#2a1a12" strokeWidth="1.3" strokeLinejoin="round" transform="translate(30 16) scale(.32)">
        <path d="M74 56L60 44L52 30L48 40L40 42L26 52L18 70L22 82L34 86L46 84L58 98L76 108Z" />
        <path d="M122 46L168 42L168 100L122 102Z" fill={v["--m-accent"]} />
        <path d="M168 42L208 42L208 99L168 100ZM208 42L248 46L246 100L208 99ZM74 56L122 46L122 102L76 108Z" />
        <path d="M248 46L276 52L290 70L292 96L282 124L256 132L246 100ZM76 108L122 102L122 138L96 140L80 126ZM122 102L184 100L184 138L122 138ZM184 100L246 100L256 132L222 138L184 138Z" />
        <path d="M94 140V182M120 140V182M244 134V182M274 128V182" />
      </g>
      <circle cx="118" cy="20" r="6" fill="#f6eee6" stroke="#c9a36b" strokeWidth="2" />
      <Lines v={v} y={86} />
    </Frame>
  );
}

/** أوجاق: قبّة نحاسٍ بحزامٍ ووسام، وجمرٌ تحتها ودخانٌ يصعد، وبلاطٌ أزرق. */
export function OcakbasiMini({ v }: { v: Vars }) {
  return (
    <Frame bg={`linear-gradient(180deg, #e3d9c4 0 72%, ${v["--m-bg"]} 72%)`}>
      <path d="M68 46C64 40 72 38 68 32M92 46C96 40 88 38 92 32" stroke="#9a948c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M70 4H90V10L122 30H38L70 10Z" fill={v["--m-accent"]} />
      <path d="M70 4H90V10L122 30H38L70 10Z" fill="#c06a32" fillOpacity=".45" />
      <rect x="36" y="29" width="88" height="4" rx="1" fill="#c99a4a" />
      <circle cx="80" cy="20" r="5" fill="#c99a4a" />
      <circle cx="80" cy="20" r="3.4" fill={v["--m-surface"]} />
      <rect x="40" y="50" width="80" height="5" rx="1.5" fill="#2a1410" />
      <g fill="#ff7a1a">
        {[46, 56, 66, 76, 86, 96, 106, 114].map((x) => (
          <circle key={x} cx={x} cy="52.5" r="2.4" />
        ))}
      </g>
      <circle cx="58" cy="46" r="3.5" fill="#d23a22" />
      <circle cx="100" cy="46" r="3.5" fill="#d23a22" />
      <rect x="38" y="56" width="84" height="16" fill="#f6f2ea" />
      <g fill="#1d5d8f">
        {[44, 54, 64, 74, 84, 94, 104, 114].map((x) => (
          <circle key={x} cx={x} cy="64" r="2.6" />
        ))}
      </g>
      <Lines v={v} y={87} />
    </Frame>
  );
}

/** مدخنة: سبّورةٌ بإطار خشب، ووسمٌ محروق، وخطّ طباشير، ومدخّنة برميلٍ ودخان. */
export function SmokehouseMini({ v }: { v: Vars }) {
  return (
    <Frame bg={v["--m-bg"]}>
      <rect x="24" y="6" width="112" height="98" rx="2" fill="#5a3a22" />
      <rect x="29" y="11" width="102" height="88" fill="#232a27" />
      <path d="M30 70C60 54 90 84 130 60" stroke="#e9e6df" strokeOpacity=".12" strokeWidth="8" fill="none" strokeLinecap="round" />
      <circle cx="80" cy="28" r="10" fill="none" stroke="#3a1d0c" strokeWidth="3" />
      <circle cx="80" cy="28" r="7.5" fill="#efe3cf" />
      <circle cx="80" cy="28" r="11.5" fill="none" stroke={v["--m-accent"]} strokeWidth="1.2" />
      <rect x="52" y="46" width="56" height="5" rx="2" fill="#f2f0ea" opacity=".9" />
      <path d="M60 56C70 54 80 57 100 55" stroke="#f2f0ea" strokeOpacity=".6" fill="none" />
      <g fill="none" stroke="#f2f0ea" strokeOpacity=".8" strokeWidth="1.3" strokeLinecap="round">
        <rect x="38" y="76" width="30" height="11" rx="5.5" />
        <path d="M68 80H74V92M44 87L41 94M62 87L65 94M43 76V70H47V76" />
        <path d="M104 74V90M109 74V90M114 74V90M119 74V90M101 87L122 77" />
      </g>
    </Frame>
  );
}
