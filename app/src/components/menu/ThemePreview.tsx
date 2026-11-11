/**
 * معاينة مصغّرة لطابع المنيو — في مُنتقي اللوحة وفي معرض الطوابع بالهبوط.
 *
 * مربّع اللون وحده لا يكفي: التاجر يحتاج أن يرى الغلاف وشكل الشعار وتخطيط
 * الأطباق قبل أن يختار. وواجهة المتجر **تتبع قاعدة `MenuHeader` نفسها** (كتلةٌ
 * بلون العلامة، إلا الداكن المؤطَّر فغلافه داكنٌ مزخرف) — فما يختاره هنا هو ما
 * يراه زبونه. والطوابع ذات البنية الخاصّة (`design.skin`) لكلٍّ منها رسمها:
 * فاتورةٌ على طاولة، ولوحة حروفٍ على جدار، وملصقات، ولافتة على طوب، وصفحة
 * مجلّة، وأقواس، وبيت طين، وكيس بنّ، ولوحة دكّان على رفّ، وجدارٌ بالقطّ العسيري،
 * ودفتر جلدٍ بخيطٍ ذهبيّ (فاخر)، وورق شبكةٍ بمسطرة (عصري)، ولوح كاونترٍ يسيل منه
 * الجبن فوق صاجٍ حديديّ (صاج)، وفوهة فرنٍ متّقدة فوق ختمٍ (فرن)، وصينيّة نحاسٍ تطلع
 * فوق بلاطٍ مزخرف (فوّال)، وسيخٌ فوق منقلٍ متّقد (جمر)، وبيتزا على مفرشٍ مائل (ريحان)،
 * وصفُّ دلالٍ على رفٍّ بمساميرَ نحاس (دلّة)، وآلة إسبريسو بعدّاد ضغطٍ (باريستا)، وعربة كركٍ تحت
 * حبل مصابيح (كرك)، وسجّادةٌ معلّقة أمامها سماورٌ واستكانات (سماور)، وقمعٌ يقطر في إبريق زجاج
 * (تقطير)، وفنجانٌ من فوق بوردة حليب (لاتيه)، ومطحنة جوزٍ ونحاس (مطحنة)، وكشكٌ عند نافذة سيارة
 * (درايف) — والأربعة في `previews/CoffeeMinis.tsx`؛ وفرن قبّةٍ يتّقد (حطب)، وعلبةٌ مفتوحة ببيتزا
 * مقطوعة (علبة)، ولوحةٌ مضيئة فوق كاونتر زجاج (شريحة)، ولافتةٌ فوق بلاط (نابولي) — في
 * `previews/PizzaMinis.tsx`؛ وسيخ شاورما أمام لهب (شاورما) — في `previews/GrillMinis.tsx`؛ وسطلٌ مقلّم
 * يفيض بالقطع بين كوبَي صوص (سطل)، ولافتة نيون فوق صاجٍ عليه برجرٌ وكرةٌ تحت المكبس (سماش) — في
 * `previews/FastMinis.tsx`؛ وثلّاجة آيسكريم بأحواضها وبسكوتة (مغرفة)، وستارةٌ فوق لوح سوشي وسيرٍ ناقل (عيدان)،
 * وكيسٌ مختوم وصاجٌ ولوح مناقيش (زعتر) — في `previews/TreatMinis.tsx`.
 *
 * ⚠️ أشكالٌ لا نصوص: خطوط الطوابع لا تُحمَّل في اللوحة ولا في الهبوط، وحرفٌ
 * بخطٍّ احتياطي يكذب على التاجر في أوّل ما يراه من الطابع.
 */
import type { CSSProperties } from "react";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import { isDarkTheme, type MenuTheme } from "@/lib/themes";
import { DriveMini, GrinderMini, LatteMini, V60Mini } from "./previews/CoffeeMinis";
import { NapoliMini, PizzaboxMini, SlicesMini, WoodfireMini } from "./previews/PizzaMinis";
import { ShawarmaMini } from "./previews/GrillMinis";
import { BucketMini, SmashMini } from "./previews/FastMinis";
import { ChopsticksMini, ScoopMini, ZaatarMini } from "./previews/TreatMinis";

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

/** مرفأ: لوحٌ بلون البحر في إطار حبل، وطوق نجاةٍ فوقه، وموجٌ في الأسفل. */
function HarborMini({ v }: { v: Record<string, string> }) {
  const rope = "repeating-linear-gradient(-50deg, #c8a46a 0 3px, #8b6a3b 3px 4.5px)";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute left-1/2 top-4 block h-12 w-32 -translate-x-1/2 rounded-[10px] p-[3px]" style={{ background: rope }}>
        <span className="flex h-full w-full items-end justify-center rounded-[8px] pb-2" style={{ background: v["--m-accent"] }}>
          <span className="block h-1.5 w-14 rounded-full" style={{ background: v["--m-on-accent"] }} />
        </span>
      </span>
      <span
        className="absolute left-1/2 top-1.5 block h-6 w-6 -translate-x-1/2 rounded-full"
        style={{
          background: `conic-gradient(from 45deg, ${v["--m-accent-2"]} 0 25%, #fffdf8 0 50%, ${v["--m-accent-2"]} 0 75%, #fffdf8 0)`,
          boxShadow: `inset 0 0 0 5px transparent, 0 0 0 1px rgba(0,0,0,.2)`,
        }}
      >
        <span className="absolute inset-[6px] rounded-full" style={{ background: v["--m-surface"] }} />
      </span>
      <div className="absolute inset-x-3 bottom-6 flex gap-2">
        {[0, 1].map((i) => (
          <span key={i} className="block h-3 flex-1 rounded-[3px]" style={{ background: v["--m-surface"], boxShadow: `inset 0 0 0 1px ${v["--m-border"]}` }} />
        ))}
      </div>
      <span
        className="absolute inset-x-0 bottom-0 h-3"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${v["--m-accent"]} 6px, transparent 6.5px) 0 0 / 14px 12px repeat-x`,
          opacity: 0.85,
        }}
      />
    </div>
  );
}

/** حلواني: مظلّةٌ مقلّمة بحافّةٍ مموّجة، وعلبة الكيك تحتها بدرزةٍ منقّطة. */
function PatisserieMini({ v }: { v: Record<string, string> }) {
  const stripes = `repeating-linear-gradient(90deg, ${v["--m-accent"]} 0 10px, ${v["--m-surface"]} 10px 20px)`;
  const scallop =
    "linear-gradient(#000 0 0) 0 0 / 100% calc(100% - 5px) no-repeat, radial-gradient(circle at 50% 0, #000 4.8px, transparent 5.2px) 0 100% / 10px 5px repeat-x";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute inset-x-0 top-0 block h-7" style={{ background: stripes, WebkitMask: scallop, mask: scallop }} />
      <span
        className="absolute left-1/2 top-10 flex h-10 w-28 -translate-x-1/2 items-center justify-center rounded-[14px]"
        style={{
          background: v["--m-surface"],
          boxShadow: `0 0 0 1.5px ${v["--m-accent"]}`,
          outline: `1px dashed ${v["--m-accent"]}`,
          outlineOffset: "-5px",
        }}
      >
        <span className="block h-1.5 w-12 rounded-full" style={{ background: v["--m-text"] }} />
      </span>
      <div className="absolute inset-x-6 bottom-3 flex justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="block h-5 w-5 rounded-full" style={{ background: v["--m-bg-2"], boxShadow: `0 0 0 1.5px ${v["--m-surface"]}` }} />
        ))}
      </div>
    </div>
  );
}

/** عصّارة: شريحة برتقالٍ خلف الشعار، وبلاطتان بمربّع فاكهة. */
function JuiceMini({ v }: { v: Record<string, string> }) {
  const fruits = [v["--m-accent"], "#6a9a12", "#b8325f"];
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span
        className="absolute left-1/2 top-2 block h-14 w-14 -translate-x-1/2 rounded-full"
        style={{
          background: `radial-gradient(circle, #fff8e6 0 12%, transparent 13%), repeating-conic-gradient(from 8deg, color-mix(in srgb, ${v["--m-accent"]} 62%, #ffc56b) 0 32deg, #fff1d2 32deg 36deg)`,
          boxShadow: `inset 0 0 0 4px #fff1d2, 0 0 0 3px ${v["--m-accent"]}`,
        }}
      />
      <div className="absolute inset-x-3 bottom-3 grid gap-1.5">
        {/* البلاطة وعليها شريحة الفاكهة — كعنوان القسم في `JuiceHead.tsx`. */}
        {fruits.slice(0, 2).map((c, i) => (
          <span
            key={i}
            className="flex h-4 items-center gap-1.5 rounded-[5px] ps-1"
            style={{ background: v["--m-surface"], boxShadow: `inset 0 0 0 1px ${v["--m-border"]}` }}
          >
            <span
              className="block h-2.5 w-2.5 rounded-full"
              style={{ background: `repeating-conic-gradient(color-mix(in srgb, ${c} 70%, #fff3d6) 0 40deg, #fff4dc 40deg 45deg)`, boxShadow: `0 0 0 1.5px ${c}` }}
            />
            <span className="block h-1 w-10 rounded-full" style={{ background: v["--m-text"], opacity: 0.55 }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** قطرات الجبن — القناع نفسه الذي تُقصّ به في `skins/burger.css`، بنصف مقاسه. */
const DRIP =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 26'%3E%3Cpath d='M0 0H60V7H0ZM11.5 6V16.5A3.5 3.5 0 0 1 4.5 16.5V6ZM23.5 6V9.5A2.5 2.5 0 0 1 18.5 9.5V6ZM39 6V21A4 4 0 0 1 31 21V6ZM52.5 6V12.5A2.5 2.5 0 0 1 47.5 12.5V6Z'/%3E%3C/svg%3E\") 0 0 / 30px 13px repeat-x";

/** صاج: لوحٌ بلون العلامة بختمٍ مموّج، وجبنٌ يسيل تحته، وقسمٌ على صاجٍ داكن فوق بطاقة. */
function BurgerMini({ v }: { v: Record<string, string> }) {
  const steel = "#2b2420";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span
        className="absolute left-1/2 top-2 flex h-11 w-32 -translate-x-1/2 flex-col items-center justify-center gap-1 rounded-[12px]"
        style={{ background: v["--m-accent"], boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${v["--m-accent"]} 78%, #000)` }}
      >
        <span
          className="block h-5 w-5 rounded-full"
          style={{ background: "repeating-conic-gradient(#fff4dc 0 15deg, #efdcb6 15deg 30deg)" }}
        />
        <span className="block h-1.5 w-14 rounded-full" style={{ background: v["--m-on-accent"] }} />
      </span>
      <span
        className="absolute left-1/2 top-[51px] block h-[13px] w-28 -translate-x-1/2"
        style={{ background: "#f2ac2b", WebkitMask: DRIP, mask: DRIP }}
      />
      <span className="absolute inset-x-4 top-[71px] flex h-3.5 items-center justify-between rounded-[5px] px-1.5" style={{ background: steel }}>
        <span className="block h-1 w-10 rounded-full" style={{ background: "#fff4dc" }} />
        <span className="block h-1.5 w-3 rounded-full" style={{ background: v["--m-accent"] }} />
      </span>
      <span
        className="absolute inset-x-4 bottom-2 flex h-[18px] items-end justify-end rounded-[6px] px-1.5 pb-1"
        style={{ background: v["--m-surface"], boxShadow: `inset 0 0 0 1px ${v["--m-border"]}` }}
      >
        <span className="block h-[3px] w-5 rounded-full" style={{ background: v["--m-accent-2"] }} />
      </span>
    </div>
  );
}

/** فرن: قوسُ طوبٍ بجوفٍ متّقد ورغيفٍ ذهبيّ، وعتبة، والاسم في ختمٍ مزدوج، ومطرحةٌ تحته. */
function BakeryMini({ v }: { v: Record<string, string> }) {
  const bricks =
    "repeating-conic-gradient(from -90deg at 50% 40px, #ead9bc 0 2deg, #b9653a 2deg 16deg, #ead9bc 16deg 18deg, #a2532d 18deg 30deg)";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute left-1/2 top-1.5 block h-[52px] w-20 -translate-x-1/2 rounded-t-full" style={{ background: bricks }}>
        <span
          className="absolute inset-x-[7px] bottom-0 top-[7px] flex items-end justify-center rounded-t-full pb-1"
          style={{ background: "radial-gradient(120% 95% at 50% 100%, #ffb04c 0%, #e2601d 28%, #5a1f0c 55%, #1b0d07 80%)" }}
        >
          <span
            className="block h-5 w-5 rounded-full"
            style={{ background: "radial-gradient(circle at 38% 30%, #ecb86e, #c98a3c 45%, #94541f)" }}
          />
        </span>
      </span>
      <span className="absolute left-1/2 top-[58px] block h-1.5 w-[5.6rem] -translate-x-1/2 rounded-[2px]" style={{ background: "#e6d6ba" }} />
      <span
        className="absolute left-1/2 top-[70px] flex h-[18px] w-24 -translate-x-1/2 -rotate-2 items-center justify-center rounded-[5px]"
        style={{ boxShadow: `inset 0 0 0 1.5px ${v["--m-accent"]}, inset 0 0 0 3px ${v["--m-bg"]}, inset 0 0 0 4px ${v["--m-accent"]}` }}
      >
        <span className="block h-1.5 w-14 rounded-full" style={{ background: v["--m-accent"] }} />
      </span>
      <span className="absolute inset-x-5 bottom-2 flex items-center">
        <span className="block h-3 w-12 rounded-s-full rounded-e-[3px]" style={{ background: "#dcb37a" }} />
        <span className="block h-1 flex-1 rounded-e-full" style={{ background: "#c4955a" }} />
        <span className="ms-1.5 block h-2.5 w-4 -rotate-6 rounded-[2px]" style={{ boxShadow: `inset 0 0 0 1px ${v["--m-accent"]}` }} />
      </span>
    </div>
  );
}

/** فوّال: صينيّة نحاسٍ تطلع بأشعّتها فوق بلاطٍ مزخرف، والصحن عليه، وصحنا نحاسٍ تحته. */
function BreakfastMini({ v }: { v: Record<string, string> }) {
  const copper = "radial-gradient(circle at 36% 30%, #eaa874, #b8682f 50%, #7f3f18)";
  const tiles = `radial-gradient(circle, ${v["--m-accent-2"]} 0 1.8px, transparent 2.2px) 0 0 / 11px 11px, radial-gradient(circle, ${v["--m-accent"]} 0 3.5px, transparent 4px) -5.5px -5.5px / 11px 11px, ${v["--m-surface"]}`;
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span
        className="absolute inset-x-0 top-0 block h-[52px]"
        style={{
          background: "repeating-conic-gradient(from -90deg at 50% 100%, rgba(242,184,75,.35) 0 8deg, transparent 8deg 17deg)",
          WebkitMask: "radial-gradient(farthest-side at 50% 100%, #000 40%, transparent)",
          mask: "radial-gradient(farthest-side at 50% 100%, #000 40%, transparent)",
        }}
      />
      <span
        className="absolute left-1/2 top-[14px] block h-[38px] w-[76px] -translate-x-1/2 rounded-t-full"
        style={{ background: copper, boxShadow: "inset 0 0 0 1.5px #7f3f18" }}
      />
      <span className="absolute inset-x-0 top-[52px] block h-2.5" style={{ background: tiles, boxShadow: `inset 0 1px 0 ${v["--m-text"]}, inset 0 -1px 0 ${v["--m-text"]}` }} />
      <span className="absolute left-1/2 top-[38px] block h-7 w-7 -translate-x-1/2 rounded-full p-[3px]" style={{ background: copper }}>
        <span className="block h-full w-full rounded-full" style={{ background: v["--m-surface"] }} />
      </span>
      <span className="absolute left-1/2 top-[72px] block h-2 w-16 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"] }} />
      <div className="absolute inset-x-6 bottom-2 flex justify-center gap-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: copper }}>
            <span className="block h-2.5 w-2.5 rounded-full" style={{ background: "#e7e2d8" }} />
          </span>
        ))}
      </div>
    </div>
  );
}

/** جمر: ليلٌ يضيئه الفحم، وسيخٌ بقطعه والشعار قطعةٌ منه، ومنقلٌ بلون العلامة بفتحاتٍ تتّقد،
    وكاونتر ستيل، والاسم، وسيخ القسم. */
function GrillMini({ v }: { v: Record<string, string> }) {
  const steel = "#d3d7da";
  const piece = (c: string, i: number) => (
    <span key={i} className="relative block h-[14px] w-[11px] rounded-[3px]" style={{ background: c, boxShadow: "inset 0 -2px 0 rgba(0,0,0,.25)" }} />
  );
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span
        className="absolute inset-x-0 top-0 block h-[68px]"
        style={{ background: "radial-gradient(55% 60% at 50% 100%, rgba(255,118,38,.45), transparent 75%), linear-gradient(180deg, #2b2421, #13100e)" }}
      />
      {[28, 47, 66].map((x, i) => (
        <span
          key={x}
          className="absolute top-0 block h-9 w-3 rounded-full"
          style={{ left: `${x}%`, background: "rgba(236,229,221,.13)", filter: "blur(3px)", transform: `rotate(${i % 2 ? 8 : -8}deg)` }}
        />
      ))}
      <span className="absolute inset-x-[8%] top-[20px] z-[1] flex items-center justify-center gap-[2px]">
        <span className="absolute inset-x-0 top-1/2 block h-[2px] -translate-y-1/2" style={{ background: steel }} />
        <span className="absolute start-[-4px] top-1/2 block h-2.5 w-2.5 -translate-y-1/2 rounded-full" style={{ boxShadow: `inset 0 0 0 2px ${steel}` }} />
        {["#c7341c", "#8a4320", "#efe2c4", "#8a4320"].map(piece)}
        <span
          className="relative mx-0.5 block h-[30px] w-[30px] rounded-full p-[3px]"
          style={{ background: "radial-gradient(circle at 35% 30%, #c0703a, #8a4320 55%, #5a2810)", boxShadow: "0 3px 8px rgba(255,120,40,.5)" }}
        >
          <span className="block h-full w-full rounded-full" style={{ background: v["--m-surface"] }} />
        </span>
        {["#8a4320", "#4f7d2a", "#8a4320", "#efe2c4"].map(piece)}
      </span>
      <span
        className="absolute left-1/2 top-[40px] block h-[9px] w-[76%] -translate-x-1/2 rounded-t-[3px]"
        style={{ background: "radial-gradient(circle, #ffd27a 0 1px, transparent 1.6px) 0 0 / 7px 5px, linear-gradient(#c2410c, #6e1c08)" }}
      />
      <span
        className="absolute left-1/2 top-[49px] flex h-[15px] w-[76%] -translate-x-1/2 items-center justify-center gap-[8px]"
        style={{ background: v["--m-accent"], clipPath: "polygon(0 0, 100% 0, 95% 100%, 5% 100%)" }}
      >
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="block h-[4px] w-[4px] rounded-full" style={{ background: "#ffb04a" }} />
        ))}
      </span>
      <span className="absolute inset-x-0 top-[65px] block h-[3px]" style={{ background: "linear-gradient(#f3f5f6, #959ba0)" }} />
      <span className="absolute left-1/2 top-[77px] block h-2 w-20 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"] }} />
      <span className="absolute inset-x-6 bottom-[11px] flex items-center gap-[2px]">
        <span className="absolute inset-x-1 top-1/2 block h-[2px] -translate-y-1/2" style={{ background: "#8d9399" }} />
        <span className="relative block h-2.5 w-2.5 rounded-full" style={{ boxShadow: "inset 0 0 0 2px #8d9399" }} />
        {["#8a4320", "#efe2c4"].map(piece)}
        <span className="relative mx-1 block h-1.5 w-12 rounded-full" style={{ background: v["--m-text"], boxShadow: `0 0 0 3px ${v["--m-bg"]}` }} />
        {["#c7341c", "#8a4320"].map(piece)}
      </span>
    </div>
  );
}

/** ريحان: مفرش مربّعاتٍ مائلٌ بلون العلامة على رخام، وبيتزا من فوق مقطّعةً والشعار في
    قلبها، وورقتا ريحانٍ على المفرش، والاسم تحت رأسه. */
function PizzaMini({ v }: { v: Record<string, string> }) {
  const ck = `color-mix(in srgb, ${v["--m-accent"]} 44%, transparent)`;
  const cloth = `repeating-linear-gradient(0deg, ${ck} 0 6px, transparent 6px 12px), repeating-linear-gradient(90deg, ${ck} 0 6px, transparent 6px 12px), #fbf6ea`;
  // الصلصة والموزاريلا، وستّ قطعاتٍ رفيعة فوقهما.
  const pie =
    "repeating-conic-gradient(from 30deg, rgba(110,45,15,.55) 0 1.5deg, transparent 1.5deg 60deg), " +
    "radial-gradient(circle, #fff3d6 0 3px, transparent 3.6px) 2px 3px / 12px 11px, #c4361f";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute left-1/2 top-[44px] block h-0 w-0">
        <span
          className="absolute -left-[36px] -top-[36px] block h-[72px] w-[72px] rotate-45"
          style={{ background: cloth, outline: `2.5px dotted ${v["--m-accent"]}`, boxShadow: "0 8px 12px -8px rgba(60,40,20,.5)" }}
        />
      </span>
      <span
        className="absolute left-1/2 top-[17px] flex h-[54px] w-[54px] -translate-x-1/2 items-center justify-center rounded-full"
        style={{ background: "radial-gradient(circle closest-side, #f2c47e 0 78%, #d99a4e 88%, #a5622a)", boxShadow: "0 5px 8px -4px rgba(70,40,15,.5)" }}
      >
        <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full" style={{ background: pie }}>
          <span className="block h-4 w-4 rounded-full" style={{ background: v["--m-surface"], boxShadow: "0 0 0 2.5px #f7e7c2" }} />
        </span>
      </span>
      {[
        [38, 26, 35],
        [-46, 50, -50],
      ].map(([dx, y, r]) => (
        <span
          key={dx}
          className="absolute block h-[11px] w-[7px]"
          style={{ left: `calc(50% + ${dx}px)`, top: y, background: "#2f7a3a", borderRadius: "50% 50% 50% 50% / 65% 65% 35% 35%", transform: `rotate(${r}deg)` }}
        />
      ))}
      <span className="absolute left-1/2 top-[99px] block h-2 w-20 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"] }} />
    </div>
  );
}

/** صورة الدلّة الظلّية للمعاينة — القطع نفسها في `heads/DallahHead.tsx` مختصرةً في مسارٍ واحد. */
const DALLAH_PATH =
  "M70 .5 72.6 6H67.4ZM56 30C56 20 62 13 70 13S84 20 84 30ZM52 29.5H88V33H52ZM55 33H85C82 44 80.5 54 81.5 64H58.5C59.5 54 58 44 55 33Z" +
  "M55.5 63H84.5V67H55.5ZM57 67C40 72 31 88 33 104 35 119 50 127 70 127S105 119 107 104C109 88 100 72 83 67Z" +
  "M55 125C55 129 51 132.5 48.5 135H91.5C89 132.5 85 129 85 125Z" +
  "M45 76C33 71 25 60 19.5 47.5 15.5 38.5 12 29.5 6.5 21.5 15 27.5 21 37 26.5 45.5 33 55.5 41.5 63 52.5 68.5Z";

function MiniPot({ h, flip, style }: { h: number; flip?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 120 136" className="absolute block" style={{ height: h, width: (h * 120) / 136, transform: flip ? "scaleX(-1)" : undefined, ...style }}>
      <path d="M84 38C103 37 112 53 106.5 71 103 83 99 89 99.5 95" fill="none" stroke="#7a5214" strokeWidth="6" />
      <path d={DALLAH_PATH} fill="#c8973a" stroke="#6b4710" strokeWidth="2" />
      <ellipse cx="54" cy="94" rx="6" ry="17" fill="#f4dc96" opacity=".55" />
    </svg>
  );
}

/** دلّة: صفّ دلالٍ من نحاسٍ على رفٍّ بمساميرَ والشعار في بطن الكبيرة، والاسم، وفنجال القسم
    وعدده تمرة. */
function DallahMini({ v }: { v: Record<string, string> }) {
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span
        className="absolute inset-x-0 top-0 block h-[80px]"
        style={{ background: `radial-gradient(45% 55% at 50% 55%, rgba(255,226,150,.6), transparent 75%), linear-gradient(180deg, #e7e1c6, ${v["--m-bg"]})` }}
      />
      <MiniPot h={38} style={{ left: "calc(50% - 50px)", top: 34 }} />
      <MiniPot h={32} flip style={{ left: "calc(50% + 24px)", top: 40 }} />
      <MiniPot h={64} style={{ left: "calc(50% - 32px)", top: 8 }} />
      <span
        className="absolute block h-[21px] w-[21px] rounded-full"
        style={{ left: "calc(50% + 2.5px - 10.5px)", top: 44, background: v["--m-surface"], boxShadow: "0 0 0 2px #e9c873, 0 0 0 3px #6b4710" }}
      />
      <span
        className="absolute inset-x-0 top-[72px] block h-[8px]"
        style={{
          background: `radial-gradient(circle, #f6de98 0 1px, transparent 1.6px) 3px 50% / 11px 100% repeat-x, linear-gradient(${v["--m-accent"]}, ${v["--m-accent"]}) 0 100% / 100% 2px no-repeat, linear-gradient(#6b4426, #3a2212)`,
        }}
      />
      <span className="absolute left-1/2 top-[88px] block h-2 w-20 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"] }} />
      <span className="absolute inset-x-5 bottom-[6px] flex items-center gap-1.5">
        <span className="block h-[8px] w-[11px]" style={{ background: "#fbf7ef", clipPath: "polygon(0 0,100% 0,72% 100%,28% 100%)", boxShadow: "inset 0 2px 0 #d7a443" }} />
        <span className="block h-1.5 w-10 rounded-full" style={{ background: v["--m-text"] }} />
        <span className="block h-[3px] flex-1" style={{ background: "radial-gradient(circle, #6f8a35 0 1.2px, transparent 1.7px) 0 50% / 7px 100% repeat-x" }} />
        <span className="block h-[9px] w-5 rounded-[50%]" style={{ background: "#4f240f" }} />
      </span>
    </div>
  );
}

/** باريستا: آلة إسبريسو بلون العلامة بإطار ستيل وعدّاد ضغطٍ وجهه الشعار، ورأسان يصبّان في
    فنجانين، وصينيّة تقطير، وكاونتر سنديان، والاسم، وكوب القسم الورقيّ بختمه. */
function BaristaMini({ v }: { v: Record<string, string> }) {
  const chrome = "linear-gradient(180deg, #f4f6f7, #9aa1a7)";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: v["--m-bg"] }} aria-hidden="true">
      <span className="absolute inset-x-[22%] top-[5px] flex justify-between">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="block h-[5px] w-[8px]" style={{ background: "#fff", clipPath: "polygon(18% 0,82% 0,100% 100%,0 100%)" }} />
        ))}
      </span>
      <span
        className="absolute inset-x-[12%] top-[12px] block h-[38px] rounded-t-[8px] rounded-b-[2px]"
        style={{
          background: `${chrome} 0 0 / 100% 4px no-repeat, linear-gradient(180deg, #e9ecee, #8d949a) 0 100% / 100% 5px no-repeat, linear-gradient(104deg, transparent 16%, rgba(255,255,255,.3) 20%, transparent 26%), ${v["--m-accent"]}`,
          boxShadow: "0 6px 8px -5px rgba(0,0,0,.5)",
        }}
      />
      <span
        className="absolute left-1/2 top-[15px] flex h-[28px] w-[28px] -translate-x-1/2 items-center justify-center rounded-full"
        style={{ background: "radial-gradient(circle closest-side, #fbfaf7 0 70%, #8a9096 72%, #f6f7f8 78%, #8a9096 100%)" }}
      >
        <span className="block h-[18px] w-[18px] rounded-full" style={{ background: v["--m-surface"], boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" }} />
      </span>
      <span className="absolute inset-x-[15%] top-[50px] block h-[20px]" style={{ background: "linear-gradient(#2f3337, #1d2023)" }} />
      {[27, 73].map((x) => (
        <span key={x} className="absolute top-[48px] block" style={{ left: `${x}%` }}>
          <span className="absolute -left-[8px] top-0 block h-[6px] w-[16px] rounded-b-[3px]" style={{ background: "linear-gradient(90deg,#6f757b,#fff 45%,#6c7277)" }} />
          <span className="absolute -left-[1px] top-[6px] block h-[7px] w-[2px]" style={{ background: "#8a4f26" }} />
          <span className="absolute -left-[5px] top-[13px] block h-[6px] w-[10px] rounded-b-[2px]" style={{ background: "#fbfaf7" }} />
        </span>
      ))}
      <span className="absolute inset-x-[13%] top-[69px] block h-[3px]" style={{ background: "repeating-linear-gradient(90deg,#5d6268 0 1px,#dfe2e4 1px 3px)" }} />
      <span className="absolute inset-x-0 top-[72px] block h-[7px]" style={{ background: "linear-gradient(180deg, #f0dcb6, #c9a774)" }} />
      <span className="absolute left-1/2 top-[88px] block h-2 w-20 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"] }} />
      <span className="absolute inset-x-5 bottom-[5px] flex items-center gap-1.5">
        <span className="relative block h-[12px] w-[9px]" style={{ background: "#fdfcf9", clipPath: "polygon(0 0,100% 0,85% 100%,15% 100%)", boxShadow: "inset 0 3px 0 #2b2420" }}>
          <span className="absolute left-1/2 top-[5px] block h-[4px] w-[4px] -translate-x-1/2 rounded-full" style={{ boxShadow: `inset 0 0 0 1px ${v["--m-accent"]}` }} />
        </span>
        <span className="block h-1.5 w-12 rounded-full" style={{ background: v["--m-text"] }} />
        <span className="block h-px flex-1" style={{ background: v["--m-muted"], opacity: 0.4 }} />
        <span className="block h-[8px] w-5 rounded-[2px]" style={{ background: "#fff", boxShadow: "0 0 0 1px rgba(0,0,0,.08)" }} />
      </span>
    </div>
  );
}

/** كرك: حبل مصابيح فوق عربةٍ بلون العلامة على الليل، وشبّاكٌ مضاءٌ فيه برّادٌ وكاسات، ولوحة
    الشعار المضيئة على الواجهة وعجلتان، والاسم، وكاسة القسم وسلكها إلى بطاقة الصفيح. */
function KarakMini({ v }: { v: Record<string, string> }) {
  const a = v["--m-accent"];
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(180deg, #08121a, ${v["--m-bg"]} 70%)` }} aria-hidden="true">
      <svg viewBox="0 0 200 22" className="absolute inset-x-0 top-0 block w-full">
        <path d="M-6 2Q50 14 100 3T206 2" fill="none" stroke="#000" strokeWidth="1" />
        {[[20, 6], [42, 8.4], [64, 7.6], [136, 6.6], [158, 8.4], [180, 6.8]].map(([x, y]) => (
          <g key={x}>
            <circle cx={x} cy={y + 3} r="6" fill="#ffd27a" opacity=".22" />
            <circle cx={x} cy={y + 3} r="2.4" fill="#ffe2a0" />
          </g>
        ))}
      </svg>
      <span className="absolute left-1/2 top-[20px] block h-[6px] w-[104px] -translate-x-1/2" style={{ background: `color-mix(in srgb, ${a} 60%, #000)`, clipPath: "polygon(0 0,100% 0,93% 100%,7% 100%)" }} />
      <span className="absolute left-1/2 top-[26px] block h-[34px] w-[96px] -translate-x-1/2 rounded-t-[3px] p-[3px] pb-0" style={{ background: a }}>
        <span className="relative block h-full w-full overflow-hidden rounded-t-[2px]" style={{ background: "radial-gradient(70% 90% at 50% 20%, #ffeec4, #f7cd7c 45%, #d98d3e)" }}>
          <span className="absolute right-[10px] top-[10px] block h-[14px] w-[22px] rounded-t-[11px]" style={{ background: "linear-gradient(90deg,#5b6168,#e9edf0 40%,#8d949a)" }} />
          <span className="absolute bottom-0 right-[8px] block h-[3px] w-[26px] bg-[#24282c]" />
          {[8, 18, 28].map((x) => (
            <span key={x} className="absolute bottom-0 block h-[9px] w-[7px]" style={{ left: x, background: "linear-gradient(#f3dfba 0 2px, #c98a4c 2px)", clipPath: "polygon(0 0,100% 0,88% 100%,12% 100%)" }} />
          ))}
        </span>
      </span>
      <span className="absolute left-1/2 top-[60px] block h-[3px] w-[104px] -translate-x-1/2" style={{ background: "linear-gradient(#f2f4f5,#7c838a)" }} />
      <span
        className="absolute left-1/2 top-[63px] block h-[18px] w-[96px] -translate-x-1/2 rounded-b-[3px]"
        style={{ background: `repeating-linear-gradient(90deg, color-mix(in srgb, ${a} 78%, #000) 0 1px, ${a} 1px 5px)` }}
      />
      <span
        className="absolute left-1/2 top-[57px] block h-[22px] w-[22px] -translate-x-1/2 rounded-full"
        style={{ background: v["--m-text"], boxShadow: "0 0 0 3px #3a4046, 0 0 0 4px #ffe2a0, 0 0 10px rgba(255,196,102,.7)" }}
      />
      {["calc(50% - 40px)", "calc(50% + 30px)"].map((left) => (
        <span key={left} className="absolute top-[76px] block h-[10px] w-[10px] rounded-full" style={{ left, background: "radial-gradient(circle,#c9ced2 0 20%,#16191c 26%)" }} />
      ))}
      <span className="absolute left-1/2 top-[92px] block h-2 w-20 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"] }} />
      <span className="absolute inset-x-5 bottom-[4px] flex items-center gap-1.5">
        <span className="block h-[10px] w-[7px]" style={{ background: "linear-gradient(#f3dfba 0 2px, #c98a4c 2px)", clipPath: "polygon(0 0,100% 0,85% 100%,15% 100%)" }} />
        <span className="block h-1.5 w-10 rounded-full" style={{ background: v["--m-text"] }} />
        <span className="block h-[4px] flex-1" style={{ background: "radial-gradient(circle, #ffe2a0 0 1.3px, transparent 1.8px) 0 50% / 8px 100% repeat-x" }} />
        <span className="block h-[8px] w-5 rounded-[2px]" style={{ background: "#f4e6c8", rotate: "-4deg" }} />
      </span>
    </div>
  );
}

/** سماور: سجّادةٌ معلّقة ميدانها بلون العلامة والشعار في ترنجها، وسماور نحاسٍ واستكاناتٌ أمامها
    على حاشية سجّاد، والاسم، واستكانة القسم وحاشيتها إلى صحنها. */
function SamovarMini({ v }: { v: Record<string, string> }) {
  const a = v["--m-accent"];
  const zig = "linear-gradient(135deg, #f3e9d2 25%, transparent 25%) -3px 0 / 6px 6px repeat-x, linear-gradient(225deg, #f3e9d2 25%, transparent 25%) -3px 0 / 6px 6px repeat-x";
  return (
    <div className="relative h-28 overflow-hidden" style={{ background: `linear-gradient(180deg, #dfe8dc, ${v["--m-bg"]})` }} aria-hidden="true">
      <span className="absolute left-1/2 top-[5px] block h-[3px] w-[82px] -translate-x-1/2 rounded-full bg-[#6b3d1c]" />
      <span className="absolute left-1/2 top-[7px] block h-[54px] w-[74px] -translate-x-1/2 p-[4px]" style={{ background: `${zig}, #a63c27`, boxShadow: "0 4px 6px -2px rgba(29,26,43,.3)" }}>
        <span className="relative block h-full w-full" style={{ background: a, boxShadow: "inset 0 0 0 1px #f3e9d2" }}>
          <span className="absolute left-1/2 top-1/2 block h-[26px] w-[34px] -translate-x-1/2 -translate-y-1/2 bg-[#f3e9d2]" style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />
          <span className="absolute left-1/2 top-1/2 block h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: v["--m-surface"], boxShadow: "0 0 0 1px #a63c27" }} />
        </span>
      </span>
      <span className="absolute left-1/2 top-[61px] block h-[4px] w-[74px] -translate-x-1/2" style={{ background: "repeating-linear-gradient(90deg,#f3e9d2 0 1px,transparent 1px 3px)" }} />
      <svg viewBox="0 0 100 172" className="absolute block" style={{ height: 50, width: 29, left: "calc(50% + 26px)", top: 24 }}>
        <path d="M30 38C28 28 36 15 52 15S76 28 74 38Z" fill="#f8f5ef" />
        <path d="M31 27H73" stroke={a} strokeWidth="5" />
        <path d="M30 50H70C76 54 84 64 86 84 88 104 80 120 66 128H34C20 120 12 104 14 84 16 64 24 54 30 50Z" fill="#c06a32" />
        <ellipse cx="38" cy="86" rx="6" ry="18" fill="#ffd1a0" opacity=".6" />
        <path d="M38 38H66L62 50H42ZM38 128H62L59 142H41ZM24 142H76L80 158H20Z" fill="#9a4a1e" />
      </svg>
      {[0, 1].map((i) => (
        <span key={i} className="absolute top-[54px] block" style={{ left: `calc(50% - ${52 - i * 12}px)` }}>
          <span className="block h-[14px] w-[9px]" style={{ background: "linear-gradient(#d6a944 0 2px, #b4461c 2px)", clipPath: "polygon(0 0,100% 0,72% 50%,100% 100%,0 100%,28% 50%)" }} />
          <span className="-mx-[2px] block h-[3px] w-[13px] rounded-[50%] bg-[#fbf8f1]" style={{ boxShadow: "0 0 0 .5px #c9a04a" }} />
        </span>
      ))}
      <span className="absolute inset-x-0 top-[72px] block h-[7px]" style={{ background: `${zig}, ${a}`, boxShadow: "inset 0 1px 0 #a63c27, inset 0 -1px 0 #a63c27" }} />
      <span className="absolute left-1/2 top-[88px] block h-2 w-20 -translate-x-1/2 rounded-full" style={{ background: v["--m-text"] }} />
      <span className="absolute inset-x-5 bottom-[5px] flex items-center gap-1.5">
        <span className="block h-[11px] w-[7px]" style={{ background: "linear-gradient(#d6a944 0 2px, #b4461c 2px)", clipPath: "polygon(0 0,100% 0,72% 50%,100% 100%,0 100%,28% 50%)" }} />
        <span className="block h-1.5 w-10 rounded-full" style={{ background: v["--m-text"] }} />
        <span className="block h-[5px] flex-1" style={{ background: `${zig}, ${a}` }} />
        <span className="block h-[8px] w-5 rounded-[50%] bg-[#fbf8f1]" style={{ boxShadow: "inset 0 0 0 1px #c9a04a" }} />
      </span>
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
    case "harbor":
      return <HarborMini v={v} />;
    case "patisserie":
      return <PatisserieMini v={v} />;
    case "juice":
      return <JuiceMini v={v} />;
    case "burger":
      return <BurgerMini v={v} />;
    case "bakery":
      return <BakeryMini v={v} />;
    case "breakfast":
      return <BreakfastMini v={v} />;
    case "grill":
      return <GrillMini v={v} />;
    case "pizza":
      return <PizzaMini v={v} />;
    case "dallah":
      return <DallahMini v={v} />;
    case "barista":
      return <BaristaMini v={v} />;
    case "karak":
      return <KarakMini v={v} />;
    case "samovar":
      return <SamovarMini v={v} />;
    case "v60":
      return <V60Mini v={v} />;
    case "latte":
      return <LatteMini v={v} />;
    case "grinder":
      return <GrinderMini v={v} />;
    case "drive":
      return <DriveMini v={v} />;
    case "woodfire":
      return <WoodfireMini v={v} />;
    case "pizzabox":
      return <PizzaboxMini v={v} />;
    case "slices":
      return <SlicesMini v={v} />;
    case "napoli":
      return <NapoliMini v={v} />;
    case "shawarma":
      return <ShawarmaMini v={v} />;
    case "bucket":
      return <BucketMini v={v} />;
    case "smash":
      return <SmashMini v={v} />;
    case "scoop":
      return <ScoopMini v={v} />;
    case "chopsticks":
      return <ChopsticksMini v={v} />;
    case "zaatar":
      return <ZaatarMini v={v} />;
    case "gold":
      return <GoldMini theme={theme} />;
    case "modern":
      return <ModernMini v={v} />;
    default:
      return <StoreMini theme={theme} />;
  }
}
