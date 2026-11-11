/**
 * معاينةٌ مصغّرة لطابع المشاوي «شاورما» (٢٠٢٦/١١/٠٩، الموجة ٣) — وُلدت مع «ستيك» و«أوجاق» و«مدخنة»،
 * وحذف المالك الثلاثة (٢٠٢٦/١١/١١).
 *
 * كأخواتها في `PizzaMinis.tsx`: **أشكالٌ لا نصوص**، والألوان من `vars` الطابع (بلون علامة التاجر إن
 * صبغه)، والخامات (لحم، لهب، ستيل) ثابتة كما في `skins/<id>.css`. وتسجيلها في
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
