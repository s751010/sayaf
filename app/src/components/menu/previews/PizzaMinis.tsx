/**
 * معايناتٌ مصغّرة لطوابع البيتزا الأربعة (٢٠٢٦/١١/٠٩) — حطب · علبة · شريحة · نابولي.
 *
 * كأخواتها في `CoffeeMinis.tsx`: **أشكالٌ لا نصوص**، والألوان من `vars` الطابع (بلون علامة التاجر
 * إن صبغه)، والخامات (نار، كرتون، ستيل، بلاط) ثابتة كما في `skins/<id>.css`. وتسجيلها في
 * `ThemePreview.tsx` (`switch`).
 */
import type { ReactNode } from "react";

type Vars = Record<string, string>;

/** المشهد 160×112 كاملاً في الوسط — وما يمتدّ بعرض البطاقة خلفيّةٌ للإطار لا رسمٌ يُقصّ. */
function Frame({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: bg }} aria-hidden="true">
      <svg viewBox="0 0 160 112" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 block h-full w-full">
        {children}
      </svg>
    </div>
  );
}

/** سطر الاسم وسطر النوع. */
function Lines({ v, y = 88 }: { v: Vars; y?: number }) {
  return (
    <>
      <rect x="50" y={y} width="60" height="5" rx="2.5" fill={v["--m-text"]} />
      <rect x="62" y={y + 8} width="36" height="3" rx="1.5" fill={v["--m-muted"]} opacity=".7" />
    </>
  );
}

/** حطب: قبّةٌ بفسيفساء بلون العلامة على قاعدةٍ حجرية، وفوهةٌ تتّقد، ووسامٌ فوقها. */
export function WoodfireMini({ v }: { v: Vars }) {
  return (
    <Frame bg={`linear-gradient(180deg, #2a1d17 0 72%, ${v["--m-bg"]} 72%)`}>
      <ellipse cx="80" cy="74" rx="46" ry="6" fill="#ff8a1c" opacity=".35" />
      <path d="M38 74C38 40 56 18 80 18C104 18 122 40 122 74Z" fill={v["--m-accent"]} />
      <g stroke="#1a0f0a" strokeOpacity=".5" strokeWidth=".8" fill="none">
        <path d="M39 62H121M42 50H118M48 38H112M58 27H102" />
        <path d="M60 74V62M80 74V62M100 74V62M50 62V50M70 62V50M90 62V50M110 62V50M64 50V38M96 50V38M80 38V27" />
      </g>
      <path d="M62 74V60A18 18 0 0 1 98 60V74Z" fill="#d6c2a3" />
      <path d="M68 74V61A12 12 0 0 1 92 61V74Z" fill="#1a0c05" />
      <path d="M72 74C72 66 77 64 80 56C83 64 88 66 88 74Z" fill="#ff8a1c" />
      <path d="M76 74C76 69 79 68 80 63C81 68 84 69 84 74Z" fill="#ffe08a" />
      <circle cx="80" cy="36" r="7" fill="#e2a06a" />
      <circle cx="80" cy="36" r="5" fill={v["--m-surface"]} />
      <rect x="30" y="73" width="100" height="8" rx="1.5" fill="#8f8070" />
      <Lines v={v} y={89} />
    </Frame>
  );
}

/** علبة: غطاءٌ مفتوحٌ بختمٍ مطبوع، وفي العلبة بيتزا بشرائح وواحدةٌ خارجة. */
export function PizzaboxMini({ v }: { v: Vars }) {
  return (
    <Frame bg={v["--m-bg"]}>
      <rect x="46" y="4" width="68" height="34" rx="1.5" fill="#dcc59f" stroke="#a98451" strokeWidth=".8" />
      <circle cx="80" cy="21" r="11" fill="none" stroke={v["--m-accent"]} strokeWidth="2" />
      <circle cx="80" cy="21" r="6.5" fill={v["--m-surface"]} />
      <path d="M44 38H116L130 78H30Z" fill="#c9a774" />
      <rect x="30" y="78" width="100" height="5" fill="#a98451" />
      <ellipse cx="80" cy="58" rx="34" ry="16" fill="#e3a057" />
      <ellipse cx="80" cy="58" rx="29" ry="13" fill="#d9482a" />
      <ellipse cx="80" cy="58" rx="27" ry="12" fill="#f3cf72" />
      <g stroke="#8a4f1f" strokeOpacity=".6" strokeWidth=".8">
        <path d="M46 58H114M80 42V74M56 47L104 69M104 47L56 69" />
      </g>
      {/* الشريحة الخارجة: تنفصل كما تنفصل شريحة القسم. */}
      <path d="M86 52L116 58A34 16 0 0 0 108 47Z" fill="#e3a057" transform="translate(5 -3)" />
      <circle cx="104" cy="51" r="2" fill="#b3261e" />
      <Lines v={v} y={90} />
    </Frame>
  );
}

/** شريحة: لوحةٌ سوداء مضيئة بشريطٍ بلون العلامة، وتحتها كاونتر زجاجٍ بثلاث صوان. */
export function SlicesMini({ v }: { v: Vars }) {
  return (
    <Frame bg={`linear-gradient(180deg, #e3e6ea 0 76%, ${v["--m-bg"]} 76%)`}>
      <rect x="28" y="6" width="104" height="34" rx="4" fill="#16181d" stroke="#c3cad2" strokeWidth="2" />
      <rect x="28" y="6" width="104" height="3" fill={v["--m-accent"]} />
      <circle cx="44" cy="22" r="7" fill={v["--m-surface"]} stroke="#ffc61a" strokeWidth="1.4" />
      <rect x="56" y="17" width="54" height="5" rx="2" fill="#ffffff" />
      <rect x="56" y="27" width="34" height="2.4" rx="1.2" fill="#c9ced6" />
      <rect x="116" y="26" width="10" height="4" rx="1" fill={v["--m-accent"]} />
      <rect x="20" y="44" width="120" height="3" rx="1" fill="#c3cad2" />
      <path d="M20 47Q18 60 22 72H138Q142 60 140 47Z" fill="#eef1f4" />
      {[42, 80, 118].map((x) => (
        <g key={x}>
          <rect x={x - 17} y="62" width="34" height="5" fill="#9aa3ad" />
          <ellipse cx={x} cy="61" rx="15" ry="5" fill="#d79a52" />
          <ellipse cx={x} cy="61" rx="13" ry="4.2" fill="#f3cf72" />
        </g>
      ))}
      <path d="M40 47L48 47L36 72L28 72Z" fill="#fff" opacity=".45" />
      <rect x="20" y="72" width="120" height="12" fill="#c3cad2" />
      <rect x="20" y="75" width="120" height="3" fill={v["--m-accent"]} />
      <Lines v={v} y={92} />
    </Frame>
  );
}

/** نابولي: بلاطٌ أبيض بزهرٍ أخضر وأحمر، ولافتةٌ بلون العلامة على سلسلتين بخيطٍ ذهبيّ. */
export function NapoliMini({ v }: { v: Vars }) {
  const tiles: [number, number][] = [];
  for (let y = 0; y < 3; y++) for (let x = 0; x < 9; x++) tiles.push([x * 20, y * 20]);
  return (
    <Frame bg={v["--m-bg"]}>
      {tiles.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="20" height="20" fill="#fbfaf5" stroke="#d9d3c4" strokeWidth=".5" />
          <circle cx={x + 10} cy={y + 10} r="4" fill={v["--m-accent-2"]} opacity=".7" />
          <circle cx={x + 10} cy={y + 10} r="1.6" fill={v["--m-accent"]} />
          <circle cx={x} cy={y} r="3" fill={v["--m-accent"]} opacity=".75" />
        </g>
      ))}
      <rect x="0" y="54" width="160" height="58" fill={v["--m-bg"]} opacity=".9" />
      <rect x="40" y="4" width="80" height="3" rx="1.5" fill="#c9a24a" />
      <path d="M56 7V16M104 7V16" stroke="#8a6a2a" strokeWidth="1.6" strokeDasharray="2 1" />
      <rect x="34" y="16" width="92" height="34" rx="3" fill={v["--m-accent"]} stroke="#5a3d22" strokeWidth="2" />
      <rect x="38.5" y="20.5" width="83" height="25" rx="2" fill="none" stroke="#e8c46a" strokeWidth="1" />
      <rect x="54" y="27" width="52" height="6" rx="3" fill={v["--m-on-accent"]} />
      <path d="M62 39Q80 36 98 39" stroke="#e8c46a" strokeWidth="1.4" fill="none" />
      <circle cx="80" cy="66" r="10" fill="#fbfaf5" stroke={v["--m-accent-2"]} strokeWidth="1.6" />
      <circle cx="80" cy="66" r="6" fill={v["--m-surface"]} />
      <Lines v={v} y={86} />
    </Frame>
  );
}
