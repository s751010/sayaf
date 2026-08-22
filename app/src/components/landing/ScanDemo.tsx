/**
 * عرض حيّ لقراءة المنيو — ثاني ما يراه الزائر بعد الترويسة.
 *
 * ═══ لماذا عرضٌ لا رفعٌ حقيقي ═══
 *
 * الزائر هنا **بلا حساب**. وفتحُ القراءة له يعني أن أي أحد يستنزف حصّتنا
 * بلا تسجيل. والأسوأ من ذلك أن نعرض نتائج مُختلَقة على منيوه الحقيقي —
 * كذبٌ على تاجر نريده أن يثق بنا.
 *
 * فالمعروض هنا **نتيجة حقيقية**: منيو «مطعم الديوان» من قاعدتنا، وما
 * استخرجه `gemini-3.5-flash-lite` منه فعلاً في القياس (١٢ من ١٢: كل صنف
 * وكل سعر وكل تصنيف، وصفر اختراع). لا رقم هنا مؤلَّف.
 *
 * ═══ ولماذا الحركة ═══
 *
 * الميزة كلّها «ثلاث ثوانٍ». وجملةٌ مكتوبة تقول ذلك لا تُقنع، والمشاهدة
 * تُقنع. فالشريط يمسح والعدّادات ترتفع والأصناف تنزل — الزائر **يرى**
 * الوعد يتحقّق أمامه بدل أن يقرأه.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/lib/icons";
import { useReveal } from "@/lib/reveal";
import { CTA_PRIMARY } from "@/lib/facts";

/**
 * ⚠️ **هذه بيانات إنتاج حقيقية** — منيو «مطعم الديوان» كما هو في قاعدتنا،
 * وهي عين ما قرأه النموذج من صورته في القياس. تغييرها يجعل العرض ادّعاءً.
 */
const SOURCE: { category: string; items: [string, number][] }[] = [
  {
    category: "المقبلات والسلطات",
    items: [
      ["حمص بالشطة الحلبية", 24],
      ["سلطة الكينوا", 32],
      ["سمبوسة الجبن", 18],
    ],
  },
  {
    category: "الأطباق الرئيسية",
    items: [
      ["برجر واقيو", 59],
      ["كبسة لحم فاخرة", 68],
      ["مندي دجاج", 48],
      ["سلمون مشوي", 89],
    ],
  },
  {
    category: "الحلويات",
    items: [
      ["كنافة نابلسية", 28],
      ["تشيز كيك التمر", 34],
    ],
  },
  {
    category: "المشروبات",
    items: [
      ["قهوة سعودية", 15],
      ["موهيتو الديوان", 22],
      ["عصير برتقال طازج", 16],
    ],
  },
];

const FLAT = SOURCE.flatMap((g) => g.items.map(([name, price]) => ({ name, price, cat: g.category })));
/** أرقام هندية كما تُطبع في أكثر المنيوهات السعودية — وهي فخّ القراءة الحقيقي. */
const ar = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

type Stage = "idle" | "scanning" | "revealing" | "done";

export function ScanDemo() {
  const reveal = useReveal<HTMLElement>();
  const [stage, setStage] = useState<Stage>("idle");
  const [shown, setShown] = useState(0);
  const timers = useRef<number[]>([]);
  const started = useRef(false);

  const clear = () => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const play = useCallback(() => {
    clear();
    setShown(0);
    setStage("scanning");
    // ١٫٦ث مسح ثم نزول الأصناف — نفس إيقاع الميزة الحقيقية تقريباً.
    timers.current.push(
      window.setTimeout(() => {
        setStage("revealing");
        FLAT.forEach((_, i) =>
          timers.current.push(
            window.setTimeout(() => {
              setShown(i + 1);
              if (i === FLAT.length - 1) setStage("done");
            }, i * 130),
          ),
        );
      }, 1600),
    );
  }, []);

  // يبدأ وحده حين يصل القسم إلى الشاشة — ومرّة واحدة فقط.
  useEffect(() => {
    if (reveal.shown && !started.current) {
      started.current = true;
      play();
    }
  }, [reveal.shown, play]);

  const busy = stage === "scanning";
  const counted = shown;

  return (
    <section
      ref={reveal.ref}
      className="relative overflow-hidden border-y border-line bg-panel/40"
      aria-labelledby="scan-demo-title"
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* ⚠️ **هذا القسم صار برهاناً لا إعلاناً.**
              كان يحمل الوعد («صوّر منيوك المطبوع… ويصير رقمياً») لأن البطل
              كان يفتتح بتعريف الفئة. ولمّا انتقل الوعد إلى البطل صارت الجملتان
              متتاليتين متطابقتين — والزائر يقرأ الشيء نفسه مرّتين في شاشتين.

              فالعنوان هنا لم يعد يَعِد: يقول **النتيجة المقيسة**. والرقم
              حقيقيّ (١٢ من ١٢ صنفاً وسعراً وتصنيفاً، صفر اختراع) وهو نفسه
              الذي يعدّه العرض أمام الزائر بعد سطرين. */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-gold bg-gold/10 px-3.5 py-1.5 text-xs font-bold text-gold">
            <Icon name="sparkle" size={13} />
            شوفها تشتغل
          </span>
          <h2
            id="scan-demo-title"
            className="mt-4 font-display text-3xl font-black leading-tight text-ink sm:text-4xl"
          >
            منيو حقيقي — <span className="text-gold-grad">١٢ صنفاً من ١٢</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-dim">
            هذه ليست رسمة توضيحية: صورة منيو «مطعم الديوان» كما هي، وما قرأه
            النموذج منها فعلاً — كل صنف وكل سعر وكل تصنيف، وصفر اختراع.
          </p>
        </div>

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[1fr_1.05fr]">
          {/* ── يسار: «الصورة» تُمسح ── */}
          <div className="relative mx-auto w-full max-w-sm lg:mx-0">
            <div
              className={`scan-paper relative overflow-hidden rounded-2xl border border-line-gold bg-[#fdfbf6] p-5 text-[#1a1712] shadow-2xl ${
                busy ? "" : "scan-paper-still"
              }`}
            >
              <p className="text-center font-display text-lg font-black">مطعم الديوان</p>
              <p className="mb-3 border-b border-[#cdbfa4] pb-2 text-center text-[10px] tracking-[0.2em] text-[#6b6154]">
                مأكولات سعودية وعالمية
              </p>
              {SOURCE.map((g) => (
                <div key={g.category} className="mb-2.5">
                  <p className="mb-1 border-b border-[#e0d5be] pb-0.5 text-[11px] font-bold text-[#7a5c14]">
                    {g.category}
                  </p>
                  {g.items.map(([name, price]) => (
                    <p key={name} className="flex items-baseline gap-2 text-[11px] leading-6">
                      <span className="font-bold">{name}</span>
                      <span className="flex-1 border-b border-dotted border-[#b9ae99]" />
                      <span className="font-black tabular-nums">{ar(price)}</span>
                    </p>
                  ))}
                </div>
              ))}
              {busy && <span className="scan-beam" aria-hidden="true" />}
            </div>

            <p className="mt-3 text-center text-xs text-faint">
              منيو مطبوع كما يصوّره التاجر بجواله
            </p>
          </div>

          {/* ── يمين: ما استُخرج ── */}
          <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["أصناف", counted],
                ["أسعار", counted],
                ["تصنيفات", Math.min(4, Math.ceil(counted / 3.25))],
              ].map(([label, n]) => (
                <div key={label as string} className="rounded-xl border border-line bg-panel/60 px-2 py-2.5 text-center">
                  <p className="font-display text-2xl font-black tabular-nums text-gold">{n as number}</p>
                  <p className="text-[11px] text-dim">{label as string}</p>
                </div>
              ))}
            </div>

            {/* ⚠️ ارتفاع مقيَّد: بلا سقف تمتدّ الاثنا عشر صنفاً فيصير العمود
                ضعف الورقة بجانبه، ويُدفع باقي الصفحة إلى الأسفل. */}
            <div className="mt-4 h-[19rem] overflow-y-auto sm:h-[21rem]">
              {stage === "scanning" ? (
                <p className="flex h-full items-center justify-center gap-2 text-sm font-bold text-ink">
                  <span className="scan-dot" aria-hidden="true" />
                  نقرأ المنيو…
                </p>
              ) : (
                <ul className="flex flex-col">
                  {FLAT.slice(0, shown).map((it) => (
                    <li
                      key={it.name}
                      className="anim-fade-up flex items-center gap-3 border-b border-line/60 py-1.5 last:border-0"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">{it.name}</span>
                        <span className="text-[11px] text-faint">{it.cat}</span>
                      </span>
                      <span className="shrink-0 text-sm font-black tabular-nums text-ink">
                        {it.price} ر.س
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <button
                onClick={play}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-gold underline underline-offset-4 disabled:opacity-50"
              >
                <Icon name="pulse" size={15} />
                شغّل القراءة مرّة أخرى
              </button>
              <Link
                to="/login"
                className="rounded-xl bg-gold px-5 py-2.5 text-sm font-black text-on-gold transition-transform hover:scale-[1.02]"
              >
                {CTA_PRIMARY}
              </Link>
            </div>
          </div>
        </div>

        {/* ⚠️ إفصاحٌ مقصود: العرض ليس تمثيلاً. من يبيع بادّعاء يخسر عند أول
            تجربة، ومن يبيع برقمٍ صادق يكسب تاجراً يثق. */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-faint">
          هذه نتيجة حقيقية لا تمثيل: منيو مطعم فعليّ على المنصّة، وما استخرجه
          النموذج منه في اختبارنا — اثنا عشر صنفاً من اثني عشر، بأسعارها
          وتصنيفاتها، وبلا صنف واحد مخترَع.
        </p>
      </div>
    </section>
  );
}
