/**
 * معايناتٌ مصغّرة لطابعَي الوجبات السريعة (٢٠٢٦/١١/١١، الموجة أ) — سطل · سماش.
 *
 * كأخواتها في `GrillMinis.tsx`: **أشكالٌ لا نصوص**، والألوان من `vars` الطابع (بلون علامة التاجر إن
 * صبغه)، والخامات (قطع البروست، الصوص، الخبز، الصاج) ثابتة كما في `skins/<id>.css`. وتسجيلها في
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

function Lines({ v, y = 90 }: { v: Vars; y?: number }) {
  return (
    <>
      <rect x="50" y={y} width="60" height="5" rx="2.5" fill={v["--m-text"]} />
      <rect x="62" y={y + 8} width="36" height="3" rx="1.5" fill={v["--m-muted"]} opacity=".7" />
    </>
  );
}

/** سطل: سطلٌ مقلّم بلون العلامة يفيض بقطعٍ ذهبيّة، وملصقٌ أبيض، وكوبا صوص. */
export function BucketMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={`linear-gradient(180deg, color-mix(in srgb, ${a} 14%, ${v["--m-bg"]}) 0 76%, ${v["--m-bg"]} 76%)`}>
      <rect x="0" y="84" width="160" height="1.6" fill={a} />
      <path d="M60 30c-4-8 4-16 12-14c8 2 10 10 6 16Z" fill="#d98a2b" />
      <path d="M74 26c2-10 16-14 22-6c4 6 2 12-4 14H76Z" fill="#d98a2b" />
      <path d="M90 30c2-8 12-10 16-4c2 4 0 8-4 10H92Z" fill="#d98a2b" />
      <circle cx="68" cy="24" r="1.4" fill="#b3621d" />
      <circle cx="86" cy="22" r="1.4" fill="#b3621d" />
      <circle cx="98" cy="28" r="1.4" fill="#b3621d" />
      <path d="M58 36H102L97 82H63Z" fill="#ffffff" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${61 + i * 11} 36h5.5l-1 46h-5.5Z`} fill={a} />
      ))}
      <rect x="56" y="32" width="48" height="6" rx="3" fill="#ffffff" />
      <circle cx="80" cy="62" r="9" fill="#ffffff" stroke={a} strokeWidth="2" />
      <circle cx="80" cy="62" r="5" fill={v["--m-surface"]} />
      <path d="M30 70H46L44.5 82H31.5Z" fill="#ffffff" />
      <ellipse cx="38" cy="70" rx="8" ry="2" fill="#f6efdc" />
      <path d="M114 70H130L128.5 82H115.5Z" fill="#ffffff" />
      <ellipse cx="122" cy="70" rx="8" ry="2" fill="#c81d12" />
      <Lines v={v} y={92} />
    </Frame>
  );
}

/** سماش: لافتة نيون بلون العلامة على جدارٍ داكن، وصاجٌ عليه برجرٌ بطبقاته وكرةٌ تحت المكبس. */
export function SmashMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={`linear-gradient(180deg, #19191c 0 80%, ${v["--m-bg"]} 80%)`}>
      <rect x="34" y="8" width="92" height="24" rx="12" fill="none" stroke={a} strokeWidth="2.4" />
      <circle cx="50" cy="20" r="7" fill={a} />
      <circle cx="50" cy="20" r="4.5" fill={v["--m-surface"]} />
      <rect x="62" y="16" width="52" height="5" rx="2.5" fill={v["--m-text"]} />
      <rect x="62" y="24" width="30" height="3" rx="1.5" fill={v["--m-muted"]} />
      <path d="M50 66Q50 46 74 45Q98 46 98 66Z" fill="#e0953a" />
      <path d="M50 66H98L101 70L95 68L92 73L88 68H60L56 73L53 68L47 70Z" fill="#ffc93c" />
      <rect x="46" y="68" width="56" height="7" rx="3.5" fill="#5a2f1a" />
      <path d="M50 75H98Q99 81 94 82H54Q49 81 50 75Z" fill="#d68f3c" />
      <rect x="112" y="40" width="26" height="4" rx="1" fill="#c9ced2" />
      <rect x="123.5" y="30" width="3" height="10" fill="#2b2c31" />
      <circle cx="125" cy="76" r="6" fill="#7a3f22" />
      <rect x="10" y="82" width="140" height="4" rx="1" fill="#45464c" />
      <rect x="14" y="86" width="132" height="4" fill="#2b2c31" />
      <Lines v={v} y={95} />
    </Frame>
  );
}
