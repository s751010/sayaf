/**
 * معايناتٌ مصغّرة لطوابع القهوة الأربعة (٢٠٢٦/١١/٠٩) — تقطير · لاتيه · مطحنة · درايف.
 *
 * في ملفٍّ وحده كي لا يتجاوز `ThemePreview.tsx` حجمه، وتسجيلها هناك (`switch`). والقاعدة نفسها:
 * **أشكالٌ لا نصوص** — والألوان من `vars` الطابع (بلون علامة التاجر إن صبغه)، والخامات (زجاج،
 * خزف، نحاس، إسفلت) ثابتة كما في `skins/<id>.css`.
 */
import type { ReactNode } from "react";

type Vars = Record<string, string>;

/**
 * المشهد في إطارٍ واحد: 160×112 **كاملاً في الوسط** (`meet`) — البطاقة أعرض منه في المعرض، فما
 * يمتدّ بعرضها (سماءٌ وطاولةٌ وإسفلت) خلفيّةٌ للإطار نفسه لا رسمٌ يُقصّ.
 */
function Frame({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: bg }} aria-hidden="true">
      <svg viewBox="0 0 160 112" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 block h-full w-full">
        {children}
      </svg>
    </div>
  );
}

/** سطر الاسم وسطر القسم بشكلَيهما — مشتركٌ في الأربعة. */
function Lines({ v, y = 86 }: { v: Vars; y?: number }) {
  return (
    <>
      <rect x="50" y={y} width="60" height="5" rx="2.5" fill={v["--m-text"]} />
      <rect x="62" y={y + 8} width="36" height="3" rx="1.5" fill={v["--m-muted"]} opacity=".7" />
    </>
  );
}

/** تقطير: قمعٌ بلون العلامة فوق إبريق زجاجٍ نصفه قهوة، على ميزانٍ داكن. */
export function V60Mini({ v }: { v: Vars }) {
  return (
    <Frame bg={v["--m-bg"]}>
      <g transform="translate(80 42) scale(1.32) translate(-80 -42)">
      <rect x="54" y="70" width="52" height="5" rx="2" fill="#1f2326" />
      <path d="M60 46Q57 58 62 68H98Q103 58 100 46Z" fill="rgba(255,255,255,.35)" stroke="rgba(60,70,75,.5)" />
      <path d="M59.5 56Q59 63 62 68H98Q101 63 100.5 56Z" fill="#5c2c12" />
      <path d="M100 50Q108 51 107 58Q106 63 99 64" fill="none" stroke="rgba(60,70,75,.5)" strokeWidth="2.4" />
      <path d="M58 18L61 14L64 17L67 13L70 16L73 12L76 16L80 12L84 16L87 12L90 16L93 13L96 17L99 14L102 18Z" fill="#fbfaf6" />
      <path d="M57 18H103L87 40H73Z" fill={v["--m-accent"]} />
      <rect x="54" y="16" width="52" height="4" rx="2" fill={v["--m-accent"]} />
      <rect x="71" y="39" width="18" height="5" rx="1.5" fill={v["--m-accent"]} />
      <circle cx="80" cy="27" r="5.5" fill="#fbfaf6" />
      <circle cx="80" cy="27" r="3.6" fill={v["--m-surface"]} />
      <path d="M80 45c1.6 2.4 2.4 3.6 2.4 4.6a2.4 2.4 0 0 1-4.8 0c0-1 .8-2.2 2.4-4.6z" fill="#5c2c12" />
      </g>
      <Lines v={v} y={92} />
      {/* ورقة التذوّق: خطٌّ متقطّع تحت الاسم. */}
      <path d="M22 108H138" stroke={v["--m-muted"]} strokeOpacity=".4" strokeDasharray="2 2" />
    </Frame>
  );
}

/** لاتيه: فنجانٌ من فوق بطلاءٍ بلون العلامة على صحنه، ووردة حليب، وقاعدةٌ ورقية بجانبه. */
export function LatteMini({ v }: { v: Vars }) {
  const leaves = [0, 1, 2, 3, 4];
  return (
    <Frame bg={`linear-gradient(180deg, #e9d6b4 0 69.6%, ${v["--m-bg"]} 69.6%)`}>
      <g transform="translate(80 38) scale(1.18) translate(-80 -38)">
      <circle cx="96" cy="40" r="32" fill="#fbf8f3" stroke="#ddd5c9" />
      <rect x="114" y="36" width="16" height="8" rx="4" fill={v["--m-accent"]} />
      <circle cx="96" cy="40" r="23" fill={v["--m-accent"]} />
      <circle cx="96" cy="40" r="20.5" fill="#fbf8f2" />
      <circle cx="96" cy="40" r="18.5" fill="#a8683a" />
      <g fill="#fff7ea">
        {leaves.map((i) => {
          const y = 52 - i * 4.4;
          const w = 12 - i * 1.8;
          return <path key={i} d={`M${96 - w} ${y}Q96 ${y + 5} ${96 + w} ${y}Q96 ${y + 2} ${96 - w} ${y}Z`} />;
        })}
        <path d="M96 33c-3-2-3.6-4-2.4-5s2.4-.4 2.4.6c0-1 1.2-1.6 2.4-.6s.6 3-2.4 5z" />
        <path d="M96 26V56" stroke="#fff7ea" strokeWidth="1" />
      </g>
      <circle cx="42" cy="50" r="15" fill="#e9d7b8" stroke="#c9ad80" />
      <circle cx="42" cy="50" r="9.5" fill={v["--m-surface"]} />
      </g>
      <Lines v={v} y={90} />
    </Frame>
  );
}

/** مطحنة: صندوقٌ من جوز ووعاءٌ نحاسيّ وذراعه، ودرجٌ بلون العلامة وإطار الشعار. */
export function GrinderMini({ v }: { v: Vars }) {
  return (
    <Frame bg={v["--m-bg"]}>
      <ellipse cx="80" cy="16" rx="50" ry="22" fill="rgba(255,214,140,.35)" />
      <rect x="40" y="76" width="80" height="5" fill="#6b4227" />
      <rect x="56" y="40" width="48" height="37" rx="2" fill="#6b4227" />
      <rect x="61" y="60" width="38" height="14" rx="1.5" fill={v["--m-accent"]} />
      <circle cx="80" cy="67" r="2" fill="#e9cf86" />
      <circle cx="80" cy="49" r="7" fill="#d9b866" />
      <circle cx="80" cy="49" r="5" fill={v["--m-surface"]} />
      <path d="M62 38L59 27Q80 23 101 27L98 38Z" fill="#d9b866" />
      <ellipse cx="80" cy="26.5" rx="20" ry="3.5" fill="#3b2414" />
      <rect x="78.8" y="15" width="2.4" height="11" fill="#c9a24a" />
      <rect x="80" y="14" width="28" height="2.4" rx="1.2" fill="#d9b866" />
      <rect x="105.5" y="6" width="5" height="10" rx="2.5" fill="#4a2d1a" />
      <circle cx="80" cy="15.2" r="2.6" fill="#e9cf86" />
      <Lines v={v} y={88} />
    </Frame>
  );
}

/** درايف (أُعيد رسمه ١١/١١): كشكٌ بلون العلامة بمظلّةٍ ولافتة ولوحة منيو، وسيارةٌ كاملة عند الشبّاك والكوب يُناوَل. */
export function DriveMini({ v }: { v: Vars }) {
  return (
    <Frame bg={`linear-gradient(180deg, #d6e8f0 0 62%, #d5d8d3 62% 65%, #2e3236 65% 80%, ${v["--m-bg"]} 80%)`}>
      {/* الكشك: سقفٌ داكن ولافتة، ومظلّةٌ مقلّمة، وشبّاكٌ ولوحة منيو. */}
      <rect x="100" y="16" width="56" height="4" fill="#2b2f33" />
      <circle cx="128" cy="11" r="7" fill="#ffffff" stroke={v["--m-text"]} strokeWidth="1.4" />
      <rect x="102" y="20" width="52" height="50" fill={v["--m-accent"]} />
      <rect x="100" y="24" width="56" height="7" fill="#ffffff" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={100 + i * 9.4} y="24" width="4.7" height="7" fill={v["--m-accent"]} />
      ))}
      <rect x="105" y="36" width="28" height="22" rx="1.5" fill="#fff0c7" stroke="#23272b" strokeWidth="2" />
      <rect x="138" y="37" width="13" height="20" rx="1" fill="#1f2327" />
      {/* السيارة كاملةً بظلّها وعجلتيها. */}
      <ellipse cx="50" cy="83" rx="40" ry="2" fill="#000" opacity=".28" />
      <path d="M10 76V66Q10 61 15 61L24 60L31 50Q32 48 35 48H62Q65 48 67 50L76 59L84 61Q89 62 89 67V76Z" fill="#2a8796" />
      <path d="M27 59L33 51H45V59ZM48 51H62L70 59H48Z" fill="#26323b" />
      <circle cx="27" cy="77" r="6.5" fill="#1b1f23" />
      <circle cx="27" cy="77" r="3.2" fill="#c9ced2" />
      <circle cx="72" cy="77" r="6.5" fill="#1b1f23" />
      <circle cx="72" cy="77" r="3.2" fill="#c9ced2" />
      {/* الكوب يُناوَل بين الشبّاك والسيارة. */}
      <path d="M86 46H96L94.5 58H87.5Z" fill="#fdfcf9" />
      <rect x="85" y="44" width="12" height="3" rx="1" fill="#2b2420" />
      <rect x="86.6" y="50" width="8.8" height="4" fill="#c9a46e" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={4 + i * 34} y="85" width="16" height="2" fill="#f4f1e6" opacity=".85" />
      ))}
      <Lines v={v} y={92} />
    </Frame>
  );
}
