/**
 * معايناتٌ مصغّرة لطوابع «التوقيع» (٢٠٢٦/١١/١٥) — سبّورة · قائمة زمان · دعوة · فتلة · وصفة · صباح الخير ·
 * لوحة مضيئة · لفّة ورق · وَسْم · بسطة · صندوق فواكه.
 *
 * كأخواتها: **أشكالٌ لا نصوص**، والألوان من `vars` الطابع (بلون علامة التاجر إن صبغه)، والخامات ثابتة كما في
 * `skins/<id>.css`. وتسجيلها في `ThemePreview.tsx` (`switch`).
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

function Lines({ v, y = 90, w = 60 }: { v: Vars; y?: number; w?: number }) {
  return (
    <>
      <rect x={80 - w / 2} y={y} width={w} height="5" rx="2.5" fill={v["--m-text"]} />
      <rect x="62" y={y + 8} width="36" height="3" rx="1.5" fill={v["--m-muted"]} opacity=".7" />
    </>
  );
}

/** سبّورة: إطار خشب، وكوب طباشير ببخاره، وخطّان أصفران، ورفّ الطباشير. */
export function SlateMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg"]}>
      <rect x="0" y="0" width="160" height="7" fill="#9a6a38" />
      <rect x="0" y="0" width="5" height="112" fill="#9a6a38" />
      <rect x="155" y="0" width="5" height="112" fill="#9a6a38" />
      <g fill="none" stroke="#f4f1e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M62 32h36l-3 20q-1 6-8 6H73q-7 0-8-6Z" />
        <path d="M97 37q9-1 8 6q-1 6-10 6" />
        <path d="M56 62q24 5 48 0" />
        <path d="M72 26c-3-4 3-6 0-11M82 24c-3-5 3-7 0-13M92 26c-3-4 3-6 0-11" strokeWidth="1.6" />
      </g>
      <rect x="50" y="72" width="60" height="5" rx="2.5" fill="#f4f1e6" />
      <path d="M46 84q34-4 68-1M56 90q24-3 48-1" fill="none" stroke={a} strokeWidth="2" strokeLinecap="round" />
      <rect x="5" y="100" width="150" height="8" fill="#9a6a38" />
      <rect x="96" y="96" width="18" height="4" rx="2" fill="#f4f1e6" />
      <rect x="118" y="96" width="14" height="4" rx="2" fill={a} />
      <rect x="136" y="96" width="10" height="4" rx="2" fill={v["--m-accent-2"]} />
    </Frame>
  );
}

/** قائمة زمان: شريط أحمر بحافّة مقوّسة، ونجمة خضراء بالشعار، وأسطرٌ مرقّمة. */
export function ZamanMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  const g = v["--m-accent-2"];
  return (
    <Frame bg={v["--m-bg"]}>
      <rect x="0" y="0" width="160" height="16" fill={a} />
      {[10, 30, 50, 70, 90, 110, 130, 150].map((x) => (
        <circle key={x} cx={x} cy="16" r="6" fill={v["--m-bg"]} />
      ))}
      <rect x="0" y="0" width="3" height="112" fill={a} />
      <rect x="157" y="0" width="3" height="112" fill={a} />
      <polygon fill={g} points="80,22 84,28 91,26 91,33 98,35 94,41 98,47 91,49 91,56 84,54 80,60 76,54 69,56 69,49 62,47 66,41 62,35 69,33 69,26 76,28" />
      <circle cx="80" cy="41" r="11" fill={v["--m-surface"]} stroke={a} strokeWidth="2" />
      <rect x="52" y="66" width="56" height="6" rx="1" fill={a} />
      {[80, 92, 104].map((y, i) => (
        <g key={y}>
          <circle cx="132" cy={y} r="4" fill="none" stroke={a} strokeWidth="1.5" />
          <rect x="62" y={y - 2} width="62" height="4" rx="2" fill={v["--m-text"]} opacity={i ? 0.75 : 1} />
          <rect x="28" y={y - 4} width="22" height="8" rx="2" fill={a} />
        </g>
      ))}
    </Frame>
  );
}

/** دعوة: بطاقة بإطارين مذهّبين، وإكليل حول الشعار، وشريط حرير، وختم شمع. */
export function InviteMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg"]}>
      <rect x="14" y="8" width="132" height="88" fill={v["--m-surface"]} stroke={a} strokeWidth="1" />
      <rect x="18" y="12" width="124" height="80" fill="none" stroke={a} strokeWidth=".6" opacity=".6" />
      <rect x="124" y="8" width="8" height="30" fill={v["--m-accent-2"]} />
      <path d="M124 38l4-5l4 5Z" fill={v["--m-surface"]} />
      <circle cx="80" cy="36" r="13" fill="none" stroke="#c9a54a" strokeWidth="5" strokeDasharray="5 2.5" />
      <circle cx="80" cy="36" r="8" fill={v["--m-surface"]} stroke={a} strokeWidth="1.2" />
      <rect x="54" y="60" width="52" height="5" rx="2.5" fill={v["--m-text"]} />
      <path d="M58 74h16M86 74h16" stroke={a} strokeWidth="1" />
      <path d="M80 70l4 4l-4 4l-4-4Z" fill={a} />
      <circle cx="80" cy="96" r="9" fill={v["--m-accent-2"]} />
      <circle cx="80" cy="96" r="5" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1" />
    </Frame>
  );
}

/** فتلة: استكانة شاي بخيطها، وبطاقةٌ معلّقة بالشعار. */
export function FatlaMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg"]}>
      <ellipse cx="70" cy="82" rx="34" ry="5" fill="#fffdf6" stroke="#cdbb9b" />
      <path d="M52 30h36q3 16-4 26q6 8 5 18q-1 6-7 6H58q-6 0-7-6q-1-10 5-18q-7-10-4-26Z" fill={a} fillOpacity=".85" stroke="#fff" strokeWidth="2" />
      <path d="M64 22c-3-4 3-6 0-11M76 22c-3-4 3-6 0-11" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M86 32h24v14" fill="none" stroke="#b9a686" strokeWidth="1.6" />
      <path d="M100 52q0-6 10-6t10 6v24h-20Z" fill="#fffaf0" stroke={a} strokeWidth="1.5" />
      <circle cx="110" cy="52" r="2" fill={v["--m-bg"]} stroke="#d9c9a8" />
      <circle cx="110" cy="66" r="6" fill={a} opacity=".85" />
      <path d="M26 78q-2-12 9-16q5 10-4 17Z" fill={v["--m-accent-2"]} />
      <Lines v={v} y={94} />
    </Frame>
  );
}

/** وصفة: مفرش مربّعات، وبطاقة مسطّرة بمشبك خشب، وقلبان. */
export function RecipeMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg"]}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={i * 20 + (i % 2 ? 0 : 0)} y="0" width="10" height="18" fill={a} opacity=".3" />
      ))}
      <rect x="0" y="0" width="160" height="9" fill={a} opacity=".22" />
      <g transform="rotate(-3 80 56)">
        <rect x="40" y="14" width="80" height="74" rx="3" fill="#fff" stroke="rgba(44,36,48,.15)" />
        {[30, 42, 54, 66, 78].map((y) => (
          <path key={y} d={`M44 ${y}h72`} stroke="rgba(77,132,196,.3)" strokeWidth="1" />
        ))}
        <circle cx="80" cy="36" r="10" fill={v["--m-bg-2"]} stroke={a} strokeWidth="1.5" strokeDasharray="3 2" />
        <rect x="56" y="54" width="48" height="6" rx="3" fill={a} />
        <rect x="64" y="66" width="32" height="3" rx="1.5" fill={v["--m-muted"]} opacity=".7" />
      </g>
      <rect x="76" y="4" width="8" height="20" rx="2" fill="#d9a766" stroke="#a8773c" />
      <path d="M22 72q-6-7 0-10q4-1 4 4q0-5 4-4q6 3 0 10l-4 4Z" fill={a} />
      <path d="M134 86q-5-6 0-8q3-1 3 3q0-4 3-3q5 2 0 8l-3 3Z" fill={v["--m-accent-2"]} />
      <rect x="50" y="98" width="60" height="5" rx="2.5" fill={v["--m-text"]} />
    </Frame>
  );
}

/** صباح الخير: أشعّة شمس، وبيضة عيون صفارها الشعار، وحافّة مربّعات. */
export function SabahMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg-2"]}>
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d="M80 44L74-40L86-40Z" fill="#fff" opacity=".5" transform={`rotate(${i * 30} 80 44)`} />
      ))}
      <path d="M48 46q-6-18 14-24q10-12 26-6q18-4 24 12q14 8 6 24q-4 14-24 12q-12 8-26 0q-20 2-20-18Z" fill="#fffdf6" stroke="#eadfc4" strokeWidth="1.5" />
      <circle cx="80" cy="44" r="14" fill="#ffb400" />
      <circle cx="80" cy="44" r="8" fill="#fff" opacity=".55" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <rect key={i} x={i * 18} y="76" width="9" height="8" fill={a} />
      ))}
      <rect x="0" y="84" width="160" height="28" fill={v["--m-bg"]} />
      <Lines v={v} y={92} />
    </Frame>
  );
}

/** لوحة مضيئة: لوحةٌ معلّقة بثلاثة ألواح، وشريطٌ نقطيّ، ولوحان مرقّمان. */
export function MenuboardMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  const y = v["--m-accent-2"];
  return (
    <Frame bg={v["--m-bg"]}>
      <rect x="36" y="0" width="3" height="12" fill="#c9ccd4" />
      <rect x="121" y="0" width="3" height="12" fill="#c9ccd4" />
      <rect x="14" y="12" width="132" height="40" rx="4" fill="#2a2c32" />
      <rect x="18" y="16" width="30" height="32" rx="2" fill={y} />
      <rect x="52" y="16" width="56" height="32" rx="2" fill="#fdfcf6" />
      <rect x="112" y="16" width="30" height="32" rx="2" fill={y} />
      <circle cx="80" cy="26" r="6" fill="#fff" stroke={a} strokeWidth="1.5" />
      <rect x="62" y="36" width="36" height="4" rx="2" fill="#17181c" />
      <rect x="27" y="26" width="12" height="12" rx="6" fill={a} />
      <rect x="121" y="24" width="12" height="16" rx="2" fill={a} />
      <rect x="14" y="56" width="132" height="7" rx="2" fill="#2a1c00" />
      <path d="M20 59.5h120" stroke={y} strokeWidth="2.5" strokeDasharray="2 3" />
      {[20, 84].map((x, i) => (
        <g key={x}>
          <rect x={x} y="70" width="56" height="36" rx="3" fill="#fdfcf6" />
          <circle cx={x + 48} cy="78" r="5" fill={a} />
          <rect x={x + 8} y="86" width="30" height="4" rx="2" fill="#17181c" />
          <rect x={x + 8} y="95" width="18" height="6" rx="3" fill={y} opacity={i ? 0.9 : 1} />
        </g>
      ))}
    </Frame>
  );
}

/** لفّة ورق: حاملٌ ولفّة، وورقٌ ينزل منها، واسمٌ بالماركر، وخطّ الألوان الثلاثة. */
export function RollMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  const g = v["--m-accent-2"];
  return (
    <Frame bg="#dfe3e2">
      <rect x="22" y="14" width="116" height="98" fill={v["--m-bg"]} />
      <path d="M14 0v12q0 4 4 4M146 0v12q0 4-4 4" fill="none" stroke="#1c1b19" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="18" y="6" width="124" height="18" rx="9" fill="#e6dcc4" stroke="#a89c80" />
      <path d="M50 8v14M80 8v14M110 8v14" stroke="#b9ad90" />
      <circle cx="80" cy="42" r="10" fill={v["--m-surface"]} stroke="#191613" strokeWidth="2.5" />
      <path d="M32 40q8-5 16 0L40 62Z" fill="#f6c85a" stroke="#191613" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="122" cy="48" r="7" fill={a} stroke="#191613" strokeWidth="2" />
      <rect x="46" y="62" width="68" height="8" rx="2" fill="#191613" />
      <rect x="52" y="76" width="18" height="4" rx="2" fill={g} />
      <rect x="71" y="76" width="18" height="4" rx="2" fill="#fff" stroke="#191613" strokeWidth=".6" />
      <rect x="90" y="76" width="18" height="4" rx="2" fill={a} />
      <rect x="64" y="90" width="50" height="4" rx="2" fill="#191613" opacity=".8" />
      <rect x="36" y="87" width="20" height="10" rx="3" fill="none" stroke={a} strokeWidth="2" />
    </Frame>
  );
}

/** وَسْم: لوح بلّوط بمساميره وسير جلد، ودائرةٌ مكويّة بالشعار، وسيخان. */
export function WasmMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg"]}>
      {[14, 34, 58, 86, 108, 132, 150].map((x) => (
        <path key={x} d={`M${x} 0q3 56 0 112`} fill="none" stroke="rgba(94,56,20,.22)" strokeWidth="1.2" />
      ))}
      <rect x="72" y="0" width="16" height="12" rx="3" fill="#6a401c" />
      {[[10, 10], [150, 10], [10, 102], [150, 102]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#8d8f94" stroke="#33343a" />
      ))}
      <circle cx="80" cy="42" r="19" fill="rgba(94,40,6,.14)" stroke="#2e1708" strokeWidth="3.5" />
      <circle cx="80" cy="42" r="24" fill="none" stroke={a} strokeWidth="1.5" opacity=".6" />
      <circle cx="80" cy="42" r="9" fill="#2e1708" opacity=".85" />
      <rect x="46" y="72" width="68" height="7" rx="2" fill="#2e1708" />
      <path d="M52 96l56-8M52 88l56 8" stroke="#3a3b3f" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="70" y="88" width="8" height="7" rx="2" fill="#7a3b1a" />
      <rect x="84" y="87" width="8" height="7" rx="2" fill={a} />
    </Frame>
  );
}

/** بسطة: سمكةٌ على الثلج، وبطاقة سعرٍ مغروزة بالشعار، وليمونة. */
export function BastaMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg-2"]}>
      <path d="M0 112V62l12-6l14 5l12-8l16 6l14-7l16 7l14-6l16 7l14-6l14 5l18-5v58Z" fill="#fff" />
      <path d="M12 56l14 5l-6 12ZM54 59l14-7l-4 16ZM98 52l16 7l-12 9ZM128 53l14 5l-10 12Z" fill="#cfe4f0" />
      <path d="M124 44l20-12q2 12-2 16q5 5 4 16Z" fill="#8fb3c7" stroke="#0d2436" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M40 46q16-18 50-16q24 1 38 15q-15 14-40 14q-32 1-48-13Z" fill="#b9d3e2" stroke="#0d2436" strokeWidth="1.6" />
      <circle cx="52" cy="43" r="3.2" fill="#fff" stroke="#0d2436" strokeWidth="1.2" />
      <path d="M63 36q-5 10 0 20" fill="none" stroke="#0d2436" strokeWidth="1.2" />
      <rect x="14" y="10" width="26" height="24" rx="3" fill="#fff" stroke={a} strokeWidth="2" />
      <circle cx="27" cy="22" r="6" fill={a} opacity=".85" />
      <rect x="26" y="34" width="2" height="22" fill="#8d9aa3" />
      <path d="M118 74a11 11 0 0 1 22 0Z" fill="#ffe36b" stroke="#d9b21f" />
      <rect x="46" y="84" width="68" height="6" rx="3" fill={a} />
      <rect x="62" y="96" width="36" height="3" rx="1.5" fill={v["--m-accent-2"]} />
    </Frame>
  );
}

/** صندوق فواكه: ألواح خشب، وملصقٌ بشمسٍ مشعّة وشعار، وشريحتا برتقال، وشريطٌ أخضر. */
export function CrateMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  const g = v["--m-accent-2"];
  return (
    <Frame bg="#c99a5b">
      <path d="M0 37h160M0 75h160" stroke="rgba(60,36,12,.55)" strokeWidth="2" />
      {[[8, 8], [152, 8], [8, 104], [152, 104]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#6a6c70" />
      ))}
      <rect x="28" y="10" width="104" height="92" rx="5" fill="#fff8e4" stroke={a} strokeWidth="2" />
      <rect x="32" y="14" width="96" height="84" rx="3" fill="none" stroke={g} strokeWidth="1" />
      <clipPath id="cm-cr-clip">
        <rect x="33" y="15" width="94" height="82" rx="2" />
      </clipPath>
      <g clipPath="url(#cm-cr-clip)">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M80 44L73-30L87-30Z" fill={a} opacity=".2" transform={`rotate(${i * 30} 80 44)`} />
        ))}
      </g>
      <circle cx="80" cy="44" r="15" fill={a} />
      <circle cx="80" cy="44" r="10" fill="#fff8e4" />
      <circle cx="54" cy="56" r="9" fill={a} />
      <circle cx="54" cy="56" r="6.5" fill="#fff4d6" />
      <path d="M54 50v12M48 56h12" stroke={a} strokeWidth="1.5" />
      <path d="M100 56q3-12 20-12q-1 12-20 12Z" fill={g} />
      <rect x="52" y="70" width="56" height="7" rx="2" fill={a} />
      <path d="M50 84h60l-5 5l5 5H50l5-5Z" fill={g} />
    </Frame>
  );
}
