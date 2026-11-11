/**
 * معايناتٌ مصغّرة لطوابع الموجة ب (٢٠٢٦/١١/١١) — مغرفة · عيدان.
 *
 * كأخواتها في `FastMinis.tsx`: **أشكالٌ لا نصوص**، والألوان من `vars` الطابع (بلون علامة التاجر إن صبغه)،
 * والخامات (البسكوتة والفانيلا والشوكولاتة · الخشب والأرزّ والسمك · العجين والحديد والكيس) ثابتة كما في
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

function Lines({ v, y = 90 }: { v: Vars; y?: number }) {
  return (
    <>
      <rect x="50" y={y} width="60" height="5" rx="2.5" fill={v["--m-text"]} />
      <rect x="62" y={y + 8} width="36" height="3" rx="1.5" fill={v["--m-muted"]} opacity=".7" />
    </>
  );
}

/** مغرفة: لافتةٌ بلون العلامة وشعارها، وثلّاجةٌ بأربعة أحواض، وبسكوتةٌ بكرة. */
export function ScoopMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  const flavors = [a, "#fbeccb", v["--m-accent-2"], "#6e3a22"];
  return (
    <Frame bg={`linear-gradient(180deg, color-mix(in srgb, ${a} 12%, ${v["--m-bg"]}) 0 78%, ${v["--m-bg"]} 78%)`}>
      <rect x="44" y="6" width="62" height="18" rx="6" fill={a} />
      <circle cx="75" cy="15" r="6.5" fill="#ffffff" />
      <circle cx="75" cy="15" r="4.5" fill={v["--m-surface"]} />
      <path d="M20 58L26 32H124L130 58Z" fill="#eef6f8" />
      {flavors.map((f, i) => (
        <g key={i}>
          <path d={`M${30 + i * 24} 52q3-10 10-9q7-1 10 9Z`} fill={f} />
          <rect x={29 + i * 24} y="51" width="22" height="7" rx="1.5" fill="#dfe5e8" />
        </g>
      ))}
      <rect x="20" y="58" width="110" height="26" rx="3" fill="#ffffff" />
      <rect x="20" y="68" width="110" height="5" fill={a} />
      <path d="M137 58H151L144 80Z" fill="#e2a55a" />
      <circle cx="144" cy="54" r="7" fill={a} />
      <Lines v={v} y={92} />
    </Frame>
  );
}

/** عيدان: ستارةٌ بلون العلامة ودائرة الشعار، ولوح خشبٍ بقطع سوشي، وعيدانٌ وسيرٌ ناقل. */
export function ChopsticksMini({ v }: { v: Vars }) {
  const a = v["--m-accent"];
  return (
    <Frame bg={v["--m-bg"]}>
      <rect x="34" y="4" width="92" height="3" rx="1.5" fill="#8a5a32" />
      <rect x="38" y="6" width="26" height="18" fill={a} />
      <rect x="67" y="6" width="26" height="22" fill={a} />
      <rect x="96" y="6" width="26" height="18" fill={a} />
      <circle cx="80" cy="16" r="7" fill="#ffffff" />
      <circle cx="80" cy="16" r="5" fill={v["--m-surface"]} />
      <rect x="26" y="40" width="108" height="20" rx="2" fill="#dcb47e" />
      <rect x="26" y="57" width="108" height="5" rx="1.5" fill="#b98d55" />
      <rect x="36" y="46" width="18" height="8" rx="4" fill="#fbf8f0" />
      <path d="M35 49q1-6 10-6q9 0 10 6q-10-2-20 0Z" fill="#f2875a" />
      <rect x="60" y="46" width="18" height="8" rx="4" fill="#fbf8f0" />
      <path d="M59 49q1-6 10-6q9 0 10 6q-10-2-20 0Z" fill="#c7323e" />
      {[92, 106, 120].map((x) => (
        <g key={x}>
          <circle cx={x} cy="50" r="6" fill="#1e2522" />
          <circle cx={x} cy="50" r="4.4" fill="#fbf8f0" />
          <circle cx={x} cy="50" r="2" fill={x === 106 ? "#8db54a" : "#f2875a"} />
        </g>
      ))}
      <path d="M70 70L140 64M71 74L141 68" stroke={v["--m-accent-2"]} strokeWidth="2" strokeLinecap="round" />
      <rect x="0" y="78" width="160" height="10" fill={v["--m-accent-2"]} />
      {[14, 44, 74, 104, 134].map((x, i) => (
        <ellipse key={x} cx={x} cy="83" rx="9" ry="3.5" fill={i % 2 ? "#e8c25a" : a} />
      ))}
      <Lines v={v} y={94} />
    </Frame>
  );
}
