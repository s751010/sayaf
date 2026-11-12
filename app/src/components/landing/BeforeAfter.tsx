/**
 * «قبل وبعد» — منيو PDF على الجوّال مقابل منيو كلاود منيو، بسحبة إصبع بينهما.
 *
 * ═══ لماذا ═══
 *
 * أكثر ما يملكه التاجر اليوم منيو PDF أو صورة تُفتح من الكود: صفحة A4 كاملة في
 * شاشة عرضها ستّة سنتيمترات، فيكبّر الزبون ويسحب ويضيع. الجملة لا تُقنع؛
 * **رؤية الاثنين في الجهاز نفسه** تُقنع. والصفحة مرسومةٌ هنا (أصلية، بلا اسم
 * أحد ولا لقطة من منتج آخر)، والجهة الثانية بطابع الزائر نفسه (`theme.vars`).
 *
 * ═══ الوصول ═══
 *
 «بعد» على اليمين حيث يبدأ السطر العربي (على اليسار كانت تظهر أسعارٌ بلا أسماء)،
 * و«قبل» على اليسار. المقبض `role="slider"` بقيمةٍ من ٠ إلى ١٠٠ (نصيب «بعد» من
 * العرض) — الأسهم تحرّكه ٥ باتّجاه الصفحة (اليسار يزيد في RTL)، و`Home`/`End`
 * إلى الطرفين. والسحب بالمؤشّر على الجوّال كلّه لا
 * على المقبض وحده (هدفٌ بعرض الشاشة أسهل من دائرة).
 *
 * والتلميح (المقبض يتأرجح مرّة حين يظهر القسم) حركةُ CSS على `--ba` بـ`@property`
 * داخل `no-preference` — بلا إطار JS واحد، ويسقط عند أوّل لمسة.
 */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { DishArtwork } from "@/components/menu/DishArtwork";
import { getTheme } from "@/lib/themes";
import { Icon } from "@/lib/icons";

/** أطباقٌ عامّة للتوضيح — لا مطعم بعينه. */
const ROWS = [
  { name: "شاورما دجاج", desc: "خبز صاج، ثوم، مخلّل", price: 14 },
  { name: "برجر لحم مدخّن", desc: "جبنة شيدر، بصل مكرمل", price: 32 },
  { name: "لاتيه بارد", desc: "حليب طازج، شوتين", price: 18 },
  { name: "كنافة بالقشطة", desc: "تُقدَّم ساخنة", price: 22 },
];

/** سطور صفحة الـPDF: أسماءٌ وأسعار بخطٍّ لا يُقرأ إلا بالتكبير — كما هو فعلاً. */
const PDF_SECTIONS = [
  { title: "المقبلات", items: ["حمص بالطحينة", "متبل باذنجان", "فلافل ٦ حبات", "سلطة فتوش", "ورق عنب", "بطاطس بالكزبرة"] },
  { title: "الأطباق الرئيسية", items: ["شاورما دجاج عربي", "برجر لحم مدخّن", "مشاوي مشكّلة", "كبسة دجاج", "مندي لحم", "فاهيتا دجاج"] },
  { title: "المشروبات", items: ["لاتيه بارد", "قهوة سعودية", "شاي كرك", "عصير برتقال", "ليمون بالنعناع"] },
  { title: "الحلويات", items: ["كنافة بالقشطة", "أم علي", "تشيز كيك", "بسبوسة"] },
];

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

export function BeforeAfter({ themeId }: { themeId: string }) {
  const theme = getTheme(themeId);
  /** موضع المقبض من اليسار (٪) — و«بعد» يمينه، فنصيبه `100 - x`. */
  const [x, setX] = useState(50);
  const pos = 100 - x;
  const [hint, setHint] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // التلميح مرّة حين يظهر القسم — لا قبل، ولا ثانيةً.
  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setHint(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fromX = (px: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width) setX(clamp(((px - r.left) / r.width) * 100));
  };
  const down = (e: PointerEvent<HTMLDivElement>) => {
    setHint(false);
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    fromX(e.clientX);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) fromX(e.clientX);
  };
  const up = () => {
    dragging.current = false;
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    // القيمة نصيب «بعد»: اليسار والأعلى يزيدانه (المقبض يتّجه يساراً).
    const next = { ArrowLeft: pos + 5, ArrowRight: pos - 5, ArrowUp: pos + 5, ArrowDown: pos - 5, Home: 0, End: 100, PageUp: pos + 20, PageDown: pos - 20 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setHint(false);
    setX(100 - clamp(next));
  };

  return (
    <figure className="mx-auto w-fit">
      <div className="phone-shell relative rounded-[42px] bg-[#0d0d0f] p-[9px] shadow-[0_40px_80px_-34px_rgba(0,0,0,.5),inset_0_0_0_1px_rgba(255,255,255,.08)]">
        <div
          ref={box}
          dir="ltr"
          className="ba relative h-[540px] w-[262px] touch-pan-y select-none overflow-hidden rounded-[33px] bg-[#e9e7e2]"
          style={{ "--ba-pos": `${x}%` } as CSSProperties}
          data-hint={hint || undefined}
          onAnimationEnd={() => setHint(false)}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          {/* قبل: عارض PDF وصفحة A4 مصغّرة إلى عرض الشاشة. */}
          <div className="absolute inset-0 flex flex-col" aria-hidden="true">
            <div className="flex items-center justify-between bg-[#3a3a3c] px-3 pb-2 pt-8 text-[10px] text-white/85">
              <span>menu-final-v3.pdf</span>
              <span>١ / ٤</span>
            </div>
            <div className="flex flex-1 items-start justify-center px-2.5 pt-4">
              <div dir="rtl" className="aspect-[1/1.414] w-full bg-white px-3 py-3 text-[#222] shadow-[0_2px_10px_rgba(0,0,0,.25)]">
                <div className="mx-auto h-5 w-5 rounded-full border border-[#999]" />
                <p className="mt-1 text-center text-[7px] font-bold">قائمة الطعام</p>
                <div className="mt-2 grid grid-cols-2 gap-x-2.5 gap-y-2">
                  {PDF_SECTIONS.map((s) => (
                    <div key={s.title}>
                      <p className="border-b border-[#bbb] text-[5px] font-bold">{s.title}</p>
                      {s.items.map((it, i) => (
                        <p key={it} className="flex justify-between text-[3.6px] leading-[6px] text-[#444]">
                          <span>{it}</span>
                          <span>{12 + i * 4}</span>
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-center text-[3.4px] text-[#777]">الأسعار تشمل ضريبة القيمة المضافة · السعرات متوفرة عند الطلب</p>
              </div>
            </div>
            <div className="ba-pinch absolute bottom-16 left-5 flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-[11px] font-bold text-white" dir="rtl">
              <Icon name="search" size={13} /> كبّر لتقرأ…
            </div>
          </div>

          {/* بعد: منيو كلاود منيو بطابع الزائر — مقصوصٌ إلى نصيبه من العرض. */}
          <div
            className="ba-after absolute inset-0"
            aria-hidden="true"
            style={{ ...(theme.vars as CSSProperties), background: "var(--m-bg)", color: "var(--m-text)" }}
          >
            <div dir="rtl" className="flex h-full flex-col">
              <div className="px-3.5 pb-3 pt-9" style={{ background: "var(--m-surface)" }}>
                <p className="text-lg font-black" style={{ fontFamily: "var(--m-display, var(--m-font))" }}>
                  مطعمك
                </p>
                <p className="text-[11px] opacity-80">مفتوح الآن · طاولة ٧</p>
                <div className="mt-2.5 flex gap-1.5 text-[11px] font-bold">
                  <span className="rounded-full px-2.5 py-1" style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}>
                    الأكثر طلباً
                  </span>
                  <span className="rounded-full border px-2.5 py-1" style={{ borderColor: "var(--m-border)" }}>
                    المشروبات
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-2 p-3">
                {ROWS.map((r) => (
                  <li
                    key={r.name}
                    className="flex items-center gap-2.5 rounded-[12px] border p-2"
                    style={{ background: "var(--m-surface)", borderColor: "var(--m-border)" }}
                  >
                    <DishArtwork name={r.name} emoji={null} className="h-14 w-14 shrink-0 rounded-[10px]" glyphSize={22} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-black">{r.name}</span>
                      <span className="block truncate text-[11px] opacity-75">{r.desc}</span>
                    </span>
                    <span className="text-[13px] font-black" style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
                      {r.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* المقبض */}
          <div className="ba-rule pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.18)]" aria-hidden="true" />
          <div
            role="slider"
            tabIndex={0}
            aria-label="قارن: منيو PDF ومنيو كلاود منيو"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pos}
            aria-valuetext={`منيو كلاود منيو يظهر في ${pos}٪ من الشاشة`}
            onKeyDown={key}
            className="ba-knob absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-[#15130f] shadow-[0_6px_18px_rgba(0,0,0,.3)] outline-none focus-visible:ring-4 focus-visible:ring-gold/60"
          >
            <span aria-hidden="true" className="text-base font-black leading-none">‹ ›</span>
          </div>
        </div>
      </div>
      <figcaption className="mt-4 flex justify-between gap-6 px-2 text-sm font-bold text-dim" dir="ltr">
        <span>← منيو PDF</span>
        <span>كلاود منيو →</span>
      </figcaption>
    </figure>
  );
}
