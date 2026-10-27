/**
 * معاينة مصغّرة لطابع المنيو — في مُنتقي اللوحة وفي معرض الطوابع بالهبوط.
 *
 * مربّع اللون وحده لا يكفي: التاجر يحتاج أن يرى الغلاف وشكل الشعار وتخطيط
 * الأطباق قبل أن يختار. وواجهة المتجر **تتبع قاعدة `MenuHeader` نفسها** (كتلةٌ
 * بلون العلامة، إلا الداكن المؤطَّر فغلافه داكنٌ مزخرف) — فما يختاره هنا هو ما
 * يراه زبونه. والطوابع ذات البنية الخاصّة (`design.skin`) لكلٍّ منها رسمها:
 * فاتورةٌ على طاولة، ولوحة حروفٍ على جدار، وملصقات، ولافتة على طوب، وصفحة
 * مجلّة، وأقواس، وبيت طين، وكيس بنّ، ولوحة دكّان على رفّ، وجدارٌ بالقطّ العسيري،
 * ودفتر جلدٍ بخيطٍ ذهبيّ (فاخر)، وورق شبكةٍ بمسطرة (عصري).
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

function LetterboardMini({ v }: { v: Vars }) {
  const felt = `repeating-linear-gradient(180deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px, rgba(0,0,0,.4) 3px 4px), ${v["--m-bg"]}`;
  return (
    <div
      className="relative h-28 overflow-hidden"
      style={{
        backgroundColor: v["--m-page"] ?? "#ebe7df",
        backgroundImage: "linear-gradient(rgba(0,0,0,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.07) 1px, transparent 1px)",
        backgroundSize: "18px 9px",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-[18%] bottom-2.5 top-2.5 flex flex-col items-center gap-1.5 px-3 pt-3"
        style={{ background: felt, border: "5px solid #a8743f", boxShadow: "0 10px 18px -10px rgba(0,0,0,.55)" }}
      >
        <span className="h-1.5 w-16 rounded-[1px]" style={{ background: v["--m-text"] }} />
        <span className="h-1 w-9 rounded-[1px]" style={{ background: v["--m-accent"] }} />
        <div className="mt-1.5 flex w-full flex-col gap-1.5">
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="h-1 w-10 rounded-[1px]" style={{ background: v["--m-text"], opacity: 0.85 }} />
              <span className="h-px flex-1 border-b border-dotted" style={{ borderColor: v["--m-muted"] }} />
              <span className="h-1 w-3 rounded-[1px]" style={{ background: v["--m-accent"] }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StickerMini({ v }: { v: Vars }) {
  const ink = v["--m-text"];
  const outline = `1.5px solid ${ink}`;
  const card = (tilt: string, bg: string): CSSProperties => ({
    background: bg,
    border: outline,
    boxShadow: `2px 3px 0 ${ink}`,
    borderRadius: "7px",
    transform: `rotate(${tilt})`,
  });
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <div
        className="absolute inset-x-2.5 top-2.5 h-11 overflow-hidden rounded-[10px]"
        style={{
          backgroundColor: v["--m-accent"],
          backgroundImage: `radial-gradient(circle, color-mix(in srgb, ${ink} 18%, transparent) 0.8px, transparent 1.1px)`,
          backgroundSize: "6px 6px",
          border: outline,
          boxShadow: `3px 3px 0 ${ink}`,
        }}
      >
        <span className="absolute left-1/2 top-1.5 h-4 w-4 -translate-x-1/2 rounded-full" style={{ background: v["--m-surface"], border: outline }} />
        <span className="absolute left-1/2 top-7 h-2 w-16 -translate-x-1/2 rounded-[2px]" style={{ background: ink, boxShadow: "0 0 0 1.5px #fff" }} />
      </div>
      <span className="absolute -inset-x-2 top-[3.85rem] h-2.5 -rotate-2" style={{ background: ink }} />
      <div className="absolute inset-x-3 bottom-2 flex gap-2">
        <span className="h-8 flex-1" style={card("-2deg", v["--m-accent-2"])} />
        <span className="h-8 flex-1" style={card("1.5deg", v["--m-surface"])} />
        <span className="h-8 flex-1" style={card("-1deg", v["--m-bg-2"])} />
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

/** تراثي: جدار طينٍ بشُرفاته، وبابٌ بلون العلامة في وسطه، والسدو عتبة. */
function NajdiMini({ v }: { v: Record<string, string> }) {
  const mud = `color-mix(in srgb, ${v["--m-bg-2"]} 80%, ${v["--m-text"]})`;
  const crenel =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='7'%3E%3Cpath d='M1 7V5H3V3H5V1H9V3H11V5H13V7Z'/%3E%3C/svg%3E\") 0 0 / 14px 7px repeat-x";
  const card: CSSProperties = {
    background: v["--m-surface"],
    boxShadow: `inset 0 0 0 1px ${v["--m-border"]}`,
    borderRadius: "4px",
  };
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute inset-x-0 top-1 h-[7px]" style={{ background: mud, WebkitMask: crenel, mask: crenel }} />
      <div className="absolute inset-x-0 top-2 h-10" style={{ background: mud }}>
        <span
          className="absolute bottom-0 left-1/2 h-7 w-6 -translate-x-1/2"
          style={{ background: v["--m-accent"], boxShadow: `0 0 0 2px color-mix(in srgb, ${v["--m-text"]} 55%, ${v["--m-bg-2"]})` }}
        />
      </div>
      <span
        className="absolute inset-x-0 top-12 h-2"
        style={{
          backgroundColor: v["--m-bg-2"],
          backgroundImage: patternImage("sadu", v["--m-accent"], 1),
          backgroundSize: "20px 20px",
          borderBlock: `1px solid ${v["--m-accent"]}`,
        }}
      />
      <span className="absolute left-1/2 top-[3.9rem] h-1.5 w-14 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"], opacity: 0.8 }} />
      <span className="absolute inset-x-2.5 bottom-2 flex gap-1.5">
        <span className="h-7 flex-1" style={card} />
        <span className="h-7 flex-1" style={card} />
      </span>
    </div>
  );
}

/** محمصة: كيس كرافت بلحامٍ مخدّد وصمّام، ولاصقٌ أبيض بمنحنى تحميص، وسطورٌ تحته. */
function RoasteryMini({ v }: { v: Record<string, string> }) {
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span
        className="absolute inset-x-0 top-0 h-2"
        style={{ background: `repeating-linear-gradient(90deg, ${v["--m-bg-2"]} 0 2px, ${v["--m-border"]} 2px 3px)` }}
      />
      <span
        className="absolute end-2.5 top-3.5 h-4 w-4 rounded-full"
        style={{ background: v["--m-bg-2"], boxShadow: `inset 0 0 0 1.5px ${v["--m-text"]}, inset 0 0 0 4px ${v["--m-bg-2"]}, inset 0 0 0 5px ${v["--m-muted"]}` }}
      />
      <span
        className="absolute left-1/2 top-4 flex h-11 w-24 -translate-x-1/2 flex-col items-center justify-center gap-1"
        style={{ background: v["--m-surface"], boxShadow: `0 0 0 1px ${v["--m-text"]}`, borderRadius: "3px" }}
      >
        <span className="block h-1.5 w-12 rounded-full" style={{ background: v["--m-text"], opacity: 0.85 }} />
        <svg viewBox="0 0 60 12" className="h-3 w-16" fill="none">
          <path d="M1 11 C8 11 10 4 16 5 S26 8 35 6 S50 2 59 1" stroke={v["--m-accent"]} strokeWidth="1.5" />
        </svg>
      </span>
      <div className="absolute inset-x-2.5 bottom-2 flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center gap-1 border-b pb-1" style={{ borderColor: v["--m-border"] }}>
            <span className="h-1.5 w-10 rounded-sm" style={{ background: v["--m-text"], opacity: 0.8 }} />
            <span className="flex flex-1 items-end gap-[1.5px]">
              {[2, 3, 4].map((h, k) => (
                <span key={k} className="w-[2px]" style={{ height: `${h}px`, background: k < 2 ? v["--m-accent"] : v["--m-border"] }} />
              ))}
            </span>
            <span className="h-1.5 w-4 rounded-sm" style={{ background: v["--m-accent"] }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** دكّان: لوحة صفيحٍ بلون التمييز معلّقةٌ بسلكين، وتحتها رفٌّ عليه سلعتان بسعرٍ على لوح طباشير. */
function DukkanMini({ v }: { v: Record<string, string> }) {
  const wood = "#9a6a3c";
  const item: CSSProperties = {
    background: v["--m-surface"],
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${v["--m-text"]} 18%, transparent)`,
    borderRadius: "3px",
  };
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute start-[34%] top-0 h-3 w-px" style={{ background: v["--m-muted"] }} />
      <span className="absolute end-[34%] top-0 h-3 w-px" style={{ background: v["--m-muted"] }} />
      <span
        className="absolute left-1/2 top-3 flex h-10 w-28 -translate-x-1/2 items-center justify-center rounded-[3px]"
        style={{
          background: v["--m-accent"],
          boxShadow: `inset 0 0 0 3px ${v["--m-accent"]}, inset 0 0 0 4px ${v["--m-on-accent"]}`,
        }}
      >
        <span className="block h-1.5 w-14 rounded-full" style={{ background: v["--m-on-accent"] }} />
      </span>
      <div className="absolute inset-x-3 bottom-[18px] flex justify-center gap-3">
        {[0, 1].map((i) => (
          <span key={i} className="relative block h-8 w-[38%]" style={item}>
            <span className="absolute bottom-1 start-1 h-2 w-5 rounded-[1px]" style={{ background: "#263029", boxShadow: `0 0 0 1px ${wood}` }} />
          </span>
        ))}
      </div>
      <span className="absolute inset-x-2 bottom-3 h-1.5 rounded-[1px]" style={{ background: wood }} />
    </div>
  );
}

/** عسير: شريطٌ ومثلّثات بألوان القطّ، والشعار في حلقات، وسطران بخطٍّ متعرّج. */
function AsirMini({ v }: { v: Record<string, string> }) {
  const band = `repeating-linear-gradient(90deg, ${v["--m-accent"]} 0 12px, #e8b51f 12px 24px, #17704a 24px 36px, #2b5a9e 36px 48px)`;
  const tri =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 7' preserveAspectRatio='none'%3E%3Cpath d='M0 0H12L6 7Z'/%3E%3C/svg%3E\") 0 0 / 12px 7px repeat-x";
  const ink = v["--m-text"];
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span
        className="absolute inset-x-0 top-0 h-2.5"
        style={{ background: `linear-gradient(${ink} 0 1px, #e8b51f 1px 4px, ${ink} 4px 5px, ${v["--m-accent"]} 5px 9px, ${ink} 9px 10px)` }}
      />
      <span className="absolute inset-x-0 top-2.5 h-[7px]" style={{ background: band, mask: tri, WebkitMask: tri }} />
      <span
        className="absolute left-1/2 top-7 h-6 w-6 -translate-x-1/2 rounded-full"
        style={{ background: v["--m-surface"], boxShadow: `0 0 0 2px ${v["--m-accent"]}, 0 0 0 4px #e8b51f, 0 0 0 5px ${ink}` }}
      />
      <span className="absolute left-1/2 top-[3.6rem] h-1.5 w-14 -translate-x-1/2 rounded-full" style={{ background: ink, opacity: 0.85 }} />
      <div className="absolute inset-x-3 bottom-2 flex flex-col gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="flex items-center gap-1.5 pb-1" style={{ borderBottom: `1px dashed color-mix(in srgb, ${ink} 35%, transparent)` }}>
            <span className="h-1.5 w-12 rounded-sm" style={{ background: ink, opacity: 0.8 }} />
            <span className="flex-1" />
            <span className="h-1.5 w-4 rounded-sm" style={{ background: v["--m-accent"] }} />
            <span className="h-4 w-4" style={{ background: v["--m-bg-2"], boxShadow: `0 0 0 1.5px #e8b51f, 0 0 0 2.5px ${ink}` }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** فاخر: دفتر جلدٍ بغرزٍ ذهبية، والشعار في حلقةٍ مذهّبة، والاسم ذهبٌ فوق خيطٍ بمعيّن. */
function GoldMini({ theme }: { theme: MenuTheme }) {
  const v = theme.vars;
  const accent = v["--m-accent"];
  const { pattern } = theme.design;
  return (
    <div className="relative h-28 overflow-hidden" style={{ backgroundColor: v["--m-bg"] }} aria-hidden="true">
      <div
        className="absolute inset-x-2 top-2 flex h-[4.4rem] flex-col items-center rounded-md pt-3"
        style={{
          backgroundColor: v["--m-bg-2"],
          backgroundImage: patternImage(pattern, accent, 0.1),
          backgroundSize: PATTERN_SIZE[pattern],
          boxShadow: `inset 0 1px 0 ${accent}40`,
        }}
      >
        <span className="absolute inset-[4px] rounded-[4px] border border-dashed" style={{ borderColor: `${accent}99` }} />
        <span className="h-5 w-5 rounded-full" style={{ background: v["--m-bg"], boxShadow: `0 0 0 1.5px ${accent}` }} />
        <span className="mt-1.5 h-1.5 w-14 rounded-full" style={{ background: accent }} />
        <span className="mt-1.5 flex items-center gap-1">
          <span className="h-px w-5" style={{ background: `linear-gradient(90deg, transparent, ${accent})` }} />
          <span className="h-1 w-1 rotate-45" style={{ background: accent }} />
          <span className="h-px w-5" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
        </span>
      </div>
      <span className="absolute inset-x-2 bottom-2 flex gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="h-5 flex-1 rounded" style={{ background: "rgba(255,255,255,.05)", boxShadow: `inset 0 1px 0 ${accent}66` }} />
        ))}
      </span>
    </div>
  );
}

/** عصري: ورق شبكة، وشريطٌ أسود، وخليّة الشعار بلون العلامة، والاسم عريضاً فوق مسطرة. */
function ModernMini({ v }: { v: Vars }) {
  const ink = v["--m-text"];
  return (
    <div
      className="relative h-28 overflow-hidden px-2.5 pt-2"
      style={{
        backgroundColor: v["--m-bg"],
        backgroundImage: `radial-gradient(circle, ${ink}2e 0.6px, transparent 1px)`,
        backgroundSize: "8px 8px",
      }}
      aria-hidden="true"
    >
      <span className="block h-[3px]" style={{ background: ink }} />
      <span className="mt-1.5 flex items-center gap-1.5">
        <span className="h-5 w-5 rounded-[2px]" style={{ background: v["--m-accent"] }} />
        <span className="flex flex-col gap-1">
          <span className="h-1 w-7 rounded-[1px]" style={{ background: ink }} />
          <span className="h-1 w-10 rounded-[1px]" style={{ background: v["--m-muted"] }} />
        </span>
      </span>
      <span className="mt-1.5 block h-2.5 w-20 rounded-[1px]" style={{ background: ink }} />
      <span
        className="mt-1.5 block h-1.5"
        style={{
          borderBottom: `1px solid ${ink}`,
          backgroundImage: `repeating-linear-gradient(90deg, ${ink}80 0 1px, transparent 1px 5px)`,
        }}
      />
      <span className="absolute inset-x-2.5 bottom-2 flex gap-1.5">
        {[0, 1].map((i) => (
          <span key={i} className="h-5 flex-1 rounded-[3px]" style={{ background: v["--m-surface"], boxShadow: `inset 0 0 0 1px ${ink}22` }} />
        ))}
      </span>
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
    case "letterboard":
      return <LetterboardMini v={v} />;
    case "sticker":
      return <StickerMini v={v} />;
    case "neon":
      return <NeonMini v={v} />;
    case "editorial":
      return <EditorialMini v={v} />;
    case "roshan":
      return <RoshanMini theme={theme} />;
    case "najdi":
      return <NajdiMini v={v} />;
    case "roastery":
      return <RoasteryMini v={v} />;
    case "dukkan":
      return <DukkanMini v={v} />;
    case "asir":
      return <AsirMini v={v} />;
    case "gold":
      return <GoldMini theme={theme} />;
    case "modern":
      return <ModernMini v={v} />;
    default:
      return <StoreMini theme={theme} />;
  }
}
