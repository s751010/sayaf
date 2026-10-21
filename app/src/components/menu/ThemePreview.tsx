/**
 * معاينة مصغّرة لطابع المنيو — في مُنتقي اللوحة وفي معرض الطوابع بالهبوط.
 *
 * مربّع اللون وحده لا يكفي: التاجر يحتاج أن يرى الغلاف وشكل الشعار وتخطيط
 * الأطباق قبل أن يختار. وواجهة المتجر **تتبع قاعدة `MenuHeader` نفسها** (كتلةٌ
 * بلون العلامة، إلا الداكن المؤطَّر فغلافه داكنٌ مزخرف) — فما يختاره هنا هو ما
 * يراه زبونه. والطوابع الخمسة ذات البنية الخاصّة (`design.skin`) لكلٍّ منها
 * رسمها: فاتورةٌ على طاولة، وسبّورة بإطار، ولافتة على طوب، وصفحة مجلّة، وأقواس.
 *
 * ⚠️ أشكالٌ لا نصوص: خطوط الطوابع لا تُحمَّل في اللوحة ولا في الهبوط، وحرفٌ
 * بخطٍّ احتياطي يكذب على التاجر في أوّل ما يراه من الطابع.
 */
import type { CSSProperties } from "react";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import { isDarkTheme, type MenuTheme } from "@/lib/themes";

type Vars = Record<string, string>;

/** سنّ الورق — القناع نفسه الذي تُقصّ به الفاتورة في `menu-skins.css`. */
const TEETH_UP =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='4'%3E%3Cpath d='M0 4h8L4 0z'/%3E%3C/svg%3E\") 0 0 / 8px 4px repeat-x";

function ReceiptMini({ v }: { v: Vars }) {
  const ink = { background: v["--m-text"] };
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-page"] ?? "#24221f" }} aria-hidden="true">
      <span className="absolute inset-x-[24%] top-[6px] h-1" style={{ background: v["--m-bg"], mask: TEETH_UP, WebkitMask: TEETH_UP }} />
      <div
        className="absolute inset-x-[24%] bottom-0 top-2.5 flex flex-col items-center px-3 pt-2.5"
        style={{ background: v["--m-bg"], boxShadow: "0 12px 22px -12px rgba(0,0,0,.7)" }}
      >
        <span className="h-3.5 w-3.5 rounded-full" style={{ boxShadow: `inset 0 0 0 1.5px ${v["--m-text"]}` }} />
        <span className="mt-1.5 h-1.5 w-12 rounded-[1px]" style={ink} />
        <span className="mt-2 w-full border-t-[1.5px] border-dashed" style={{ borderColor: v["--m-muted"] }} />
        <div className="mt-2 flex w-full flex-col gap-1.5">
          {[10, 8, 11].map((w, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="h-1 rounded-[1px]" style={{ ...ink, width: `${w * 3}px`, opacity: 0.85 }} />
              <span className="h-px flex-1 border-b border-dotted" style={{ borderColor: v["--m-muted"] }} />
              <span className="h-1 w-3 rounded-[1px]" style={ink} />
            </span>
          ))}
        </div>
        <span className="mt-2 rounded-[2px] px-1.5 py-[1px]" style={{ background: v["--m-accent"] }}>
          <span className="block h-1 w-6" style={{ background: v["--m-on-accent"], opacity: 0.9 }} />
        </span>
      </div>
    </div>
  );
}

function ChalkMini({ v }: { v: Vars }) {
  const accent = v["--m-accent"];
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: "linear-gradient(#9a6a41, #57351d)" }} />
      <div className="flex flex-col items-center pt-4">
        <span className="h-5 w-5 rounded-full" style={{ outline: `1.5px dashed ${v["--m-muted"]}`, outlineOffset: "2px", background: v["--m-bg-2"] }} />
        {/* «كتابة» بخطّ اليد: موجةٌ بلون الطباشير، وتحتها خطٌّ بلون التمييز. */}
        <svg viewBox="0 0 80 14" className="mt-1.5 h-3.5 w-20" fill="none" stroke={v["--m-text"]} strokeWidth="2.2" strokeLinecap="round">
          <path d="M76 9c-4-6-8 3-12-1s-6-5-10 0-6 2-9-2-7 4-11 1-5-5-9 0-7 1-10-1" />
        </svg>
        <svg viewBox="0 0 200 14" preserveAspectRatio="none" className="h-1.5 w-16" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round">
          <path d="M197 8 C 162 3, 131 12, 96 7 S 33 4, 3 9" />
        </svg>
      </div>
      <div className="absolute inset-x-3 bottom-2.5 flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center justify-between">
            <span className="h-1 w-14 rounded-full" style={{ background: v["--m-text"], opacity: 0.8 }} />
            <span className="h-1 w-4 rounded-full" style={{ background: accent }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function NeonMini({ v }: { v: Vars }) {
  const accent = v["--m-accent"];
  const glow = `0 0 4px ${accent}, 0 0 10px ${accent}`;
  const card: CSSProperties = {
    background: v["--m-surface"],
    border: `1px solid color-mix(in srgb, ${accent} 50%, transparent)`,
    boxShadow: `0 0 10px -3px ${accent}`,
    borderRadius: "5px",
  };
  return (
    <div
      className="relative h-28 overflow-hidden"
      style={{
        backgroundColor: "#110e15",
        backgroundImage: `radial-gradient(60% 55% at 50% 30%, color-mix(in srgb, ${accent} 26%, transparent), transparent 75%), repeating-linear-gradient(0deg, #0c0a0e 0 1px, transparent 1px 8px)`,
      }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center pt-4">
        <span className="h-4 w-4 rounded-full" style={{ boxShadow: `0 0 0 1.5px ${v["--m-accent-2"]}, 0 0 8px ${v["--m-accent-2"]}` }} />
        <span className="mt-2 h-1.5 w-20 rounded-full" style={{ background: "#fff", boxShadow: glow }} />
      </div>
      <div className="absolute inset-x-0 bottom-2 flex items-end justify-center gap-1.5">
        <span className="h-7 w-[22%] opacity-50" style={card} />
        <span className="h-9 w-[38%]" style={card} />
        <span className="h-7 w-[22%] opacity-50" style={card} />
      </div>
    </div>
  );
}

function EditorialMini({ v }: { v: Vars }) {
  const ink = v["--m-text"];
  return (
    <div className="relative h-28 overflow-hidden px-3 pt-2.5" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="block h-[5px]" style={{ borderTop: `2px solid ${ink}`, borderBottom: `1px solid ${ink}` }} />
      <span className="mx-auto mt-2 block h-2.5 w-24 rounded-[1px]" style={{ background: ink }} />
      <span className="mt-2 block h-[5px]" style={{ borderTop: `2px solid ${ink}`, borderBottom: `1px solid ${ink}` }} />
      <div className="mt-2 flex items-end gap-2">
        <span className="text-[22px] font-bold leading-none" style={{ color: v["--m-accent"], fontFamily: "Georgia, serif" }}>
          01
        </span>
        <span className="mb-0.5 h-1.5 w-12 rounded-[1px]" style={{ background: ink, opacity: 0.85 }} />
      </div>
      <div className="mt-1.5 flex flex-col gap-1">
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center justify-between pb-1" style={{ borderBottom: `1px solid ${v["--m-border"]}` }}>
            <span className="h-1 w-16 rounded-[1px]" style={{ background: ink, opacity: 0.75 }} />
            <span className="h-1 w-4 rounded-[1px]" style={{ background: v["--m-accent"] }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function RoshanMini({ theme }: { theme: MenuTheme }) {
  const v = theme.vars;
  const arch = "999px 999px 2px 2px";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <div
        className="relative h-10"
        style={{
          backgroundColor: v["--m-accent"],
          backgroundImage: patternImage("mashrabiya", v["--m-on-accent"], 0.2),
          backgroundSize: PATTERN_SIZE.mashrabiya,
        }}
      >
        <span
          className="absolute inset-x-0 -bottom-px h-3"
          style={{ background: `radial-gradient(ellipse 5px 9px at 50% 100%, ${v["--m-bg"]} 92%, transparent 100%) 50% 100% / 14px 12px repeat-x` }}
        />
      </div>
      <span
        className="absolute left-1/2 top-5 h-8 w-6 -translate-x-1/2"
        style={{ borderRadius: arch, background: v["--m-bg-2"], boxShadow: `0 0 0 2px ${v["--m-bg"]}, 0 0 0 3px ${v["--m-border"]}` }}
      />
      <div className="absolute inset-x-3 bottom-2 flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="flex h-10 w-[28%] flex-col p-1"
            style={{ background: v["--m-surface"], boxShadow: `inset 0 0 0 1px ${v["--m-border"]}`, borderRadius: "4px" }}
          >
            <span className="block flex-1" style={{ borderRadius: arch, background: v["--m-bg-2"] }} />
            <span className="mt-1 block h-1 w-3/4 rounded-full" style={{ background: v["--m-text"], opacity: 0.7 }} />
          </span>
        ))}
      </div>
    </div>
  );
}

function StoreMini({ theme }: { theme: MenuTheme }) {
  const v = theme.vars;
  const { pattern, header, layout } = theme.design;
  const accent = v["--m-accent"];
  const framed = header === "frame";
  const darkCover = framed && isDarkTheme(theme);

  const cover: CSSProperties = darkCover
    ? {
        backgroundColor: v["--m-bg-2"],
        backgroundImage: patternImage(pattern, accent, 0.12),
        backgroundSize: PATTERN_SIZE[pattern],
      }
    : {
        backgroundColor: accent,
        backgroundImage: patternImage(pattern, v["--m-on-accent"], 0.14),
        backgroundSize: PATTERN_SIZE[pattern],
      };
  const card: CSSProperties = {
    background: `linear-gradient(${v["--m-surface"]}, ${v["--m-surface"]}), ${v["--m-bg"]}`,
    boxShadow: `inset 0 0 0 1px ${v["--m-border"]}`,
    borderRadius: `calc(${v["--m-radius"]} * 0.5)`,
  };
  const ink = { background: v["--m-text"], opacity: 0.8 };

  return (
    <div className="relative h-28 overflow-hidden" style={{ backgroundColor: v["--m-bg"] }} aria-hidden="true">
      <div className="relative h-10" style={cover}>
        {header === "band" && (
          <span
            className="absolute inset-x-0 bottom-0 h-2"
            style={{
              backgroundColor: v["--m-bg-2"],
              backgroundImage: patternImage("sadu", accent, 1),
              backgroundSize: "20px 20px",
              borderTop: `1px solid ${accent}`,
            }}
          />
        )}
      </div>

      {/* الشعار على حافّة الغلاف في أوّل السطر — كما في المنيو. */}
      <span
        className="absolute start-2.5 top-6 h-7 w-7"
        style={{
          background: darkCover ? accent : v["--m-bg"],
          borderRadius: framed ? "3px" : "8px",
          boxShadow: `0 0 0 2px ${v["--m-bg"]}${framed ? `, 0 0 0 3px ${accent}` : ""}`,
        }}
      />
      <span className="absolute start-2.5 top-[3.6rem] h-1.5 w-14 rounded-full" style={ink} />

      {/* الأطباق حسب التخطيط — هذا ما يريه الفرق الحقيقي. */}
      <div className="absolute inset-x-2.5 bottom-2">
        {layout === "list" ? (
          <div className="flex flex-col gap-1.5">
            {[0, 1].map((i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="h-1.5 w-10 rounded-sm" style={ink} />
                <span className="h-px flex-1 border-b border-dotted" style={{ borderColor: v["--m-muted"], opacity: 0.5 }} />
                <span className="h-1.5 w-4 rounded-sm" style={{ background: accent }} />
              </span>
            ))}
          </div>
        ) : layout === "showcase" || layout === "deck" ? (
          <span className="block h-7" style={card} />
        ) : (
          <span className="flex gap-1.5">
            <span className="h-7 flex-1" style={card} />
            <span className="h-7 flex-1" style={card} />
          </span>
        )}
      </div>
    </div>
  );
}

export function ThemePreview({ theme }: { theme: MenuTheme }) {
  const v = theme.vars;
  switch (theme.design.skin) {
    case "receipt":
      return <ReceiptMini v={v} />;
    case "chalk":
      return <ChalkMini v={v} />;
    case "neon":
      return <NeonMini v={v} />;
    case "editorial":
      return <EditorialMini v={v} />;
    case "roshan":
      return <RoshanMini theme={theme} />;
    default:
      return <StoreMini theme={theme} />;
  }
}
