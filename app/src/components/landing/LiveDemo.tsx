/**
 * «جرّبه الآن» — المنيو التجريبي **حيّاً** داخل إطار جوّال.
 *
 * ═══ لماذا وُجد هذا القسم ═══
 *
 * الصفحة ليس فيها دليل اجتماعي — ولا يمكن أن يكون: لا يوجد عميل واحد بعد،
 * وكل الحسابات في القاعدة تخصّ المالك. فلا شهادة ولا شعار ولا «انضمّ إلى
 * كذا مطعماً»، وأي رقم من هذا النوع كذبٌ صريح.
 *
 * فالدليل الوحيد المتاح هو **المنتج نفسه**. وجهاز البطل يعرض ماكيتاً يتحرّك
 * تلقائياً — والزائر يعرف أنه إعلان. هذا القسم يقلب العلاقة: لا تصدّقني، المسه.
 *
 * ═══ ثلاثة قرارات مقيسة ═══
 *
 * ١) **الإطار لا التركيب المباشر.** تركيب `MenuPage` داخل اللاندنق أرخص بايتاً
 *    (هي في الحزمة الرئيسية أصلاً) لكنه يفتح ثلاثة أبواب: `useSeo` تدهس عنوان
 *    الصفحة ووصفها، و`useSearchParams` تكتب في مسار الهبوط، و`--m-*` تخرج من
 *    قفصها إلى الجذر. الإطار مستندٌ منفصل فيغلق الثلاثة **بنيوياً لا انضباطاً**.
 *
 * ٢) **مؤجَّل حتى الظهور.** الإطار يُقلع نسخة ثانية من التطبيق داخله. الأصول
 *    مخبّأة سنةً (`_headers`) فالتحميل شبه صفر، لكن **زمن التنفيذ ليس صفراً**.
 *    فلا يُركَّب `<iframe>` إلا حين يدخل القسم الشاشة، وقبلها إطارٌ ساكن.
 *
 * ٣) **قناع اللمس على الجوال.** إطارٌ قابل للتمرير في منتصف صفحة **يخطف تمرير
 *    الإصبع** فيعلق الزائر. القناع يُزال بأول نقرة ويعود حين يغادر القسم
 *    الشاشة — فلا يُحبس أحد داخل الإطار وهو يحاول متابعة الصفحة.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { prefersReducedMotion, useReveal } from "@/lib/reveal";
import type { MenuTheme } from "@/lib/themes";

export function LiveDemo({ theme }: { theme: MenuTheme }) {
  const { ref: seen, shown } = useReveal<HTMLDivElement>("-15%");
  const [armed, setArmed] = useState(false);
  const frame = useRef<HTMLDivElement | null>(null);

  /**
   * القناع يعود حين يغادر القسم الشاشة.
   *
   * لو بقي مرفوعاً بعد أن يمرّر الزائر بعيداً، ثم عاد لأعلى، لوجد الإطار
   * يبتلع إصبعه بلا إنذار. مراقبٌ مستقلّ عن `useReveal` لأن ذاك يُفصَل بعد
   * أول ظهور عمداً (ظهورٌ واحد يكفيه) وهذا يحتاج المتابعة.
   */
  useEffect(() => {
    const el = frame.current;
    if (!el || !armed) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) setArmed(false);
      },
      { rootMargin: "0px", threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  // الطابع المختار أعلى الصفحة يتبع الزائر إلى الديمو — فالتجربة تكمل اختياره
  // بدل أن تعيده إلى الافتراضي.
  const src = `/demo?embed=1&theme=${encodeURIComponent(theme.id)}`;

  // تقليل الحركة يعني كذلك تقليل المفاجآت: يُحمَّل الإطار مباشرةً بلا انتظار
  // ظهور، وبلا قناع يتحرّك — والحالة الافتراضية مكشوفة كما في بقية المشروع.
  const calm = prefersReducedMotion();
  const mounted = calm || shown;

  return (
    <section id="try" className="border-t border-line bg-page py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-[52ch]">
            <p className="text-[0.8125rem] font-semibold text-gold">جرّبه الآن</p>
            <h2 className="mt-3 font-display text-3xl font-black leading-tight text-ink sm:text-4xl">
              لا تصدّقنا — المَس المنيو بنفسك
            </h2>
            <p className="mt-4 text-lg leading-[1.85] text-dim">
              هذا ليس صورة ولا فيديو. إنه منيو حقيقي يعمل بالكامل: ابحث، افتح
              طبقاً، اقرأ السعرات ومسبّبات الحساسية، أضِف إلى السلّة. نفس ما
              سيراه زبونك على طاولتك تماماً.
            </p>

            <ul className="mt-7 flex flex-col gap-3">
              {[
                "يعمل بلا أن يحمّل زبونك أي تطبيق",
                "يتبع الطابع الذي اخترته للتوّ أعلى الصفحة",
                "نفس الشيفرة التي تخدم المنيوهات الحقيقية — لا نسخة عرض",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[0.95rem] text-ink">
                  <span className="mt-0.5 shrink-0 text-good">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/demo"
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-gold px-5 text-sm font-bold text-ink transition-colors hover:bg-gold/10"
            >
              افتحه بملء الشاشة ↗
            </Link>
          </div>

          {/* الإطار — عرض جوّال حقيقي، وارتفاع يكفي لعرض صفّين من الأطباق. */}
          <div ref={seen} className="justify-self-center">
            <div
              ref={frame}
              className="relative mx-auto w-[320px] max-w-full overflow-hidden rounded-[2rem] border border-line-gold bg-panel2 shadow-[0_0_60px_-22px_var(--c-glow)]"
              style={{ height: "min(600px, 78dvh)" }}
            >
              {mounted ? (
                <iframe
                  src={src}
                  title="منيو تجريبي حيّ"
                  loading="lazy"
                  className="h-full w-full border-0"
                />
              ) : (
                /* قبل الظهور: سطحٌ ساكن بلون الطابع — لا فراغ ولا هيكل يومض. */
                <div
                  className="h-full w-full"
                  style={{ background: theme.vars["--m-bg"] }}
                  aria-hidden="true"
                />
              )}

              {/* قناع اللمس — الجوال وحده. `lg:hidden` لأن الفأرة لا تخطف تمريراً. */}
              {mounted && !armed && (
                <button
                  type="button"
                  onClick={() => setArmed(true)}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-page/55 backdrop-blur-[2px] transition-opacity lg:hidden"
                >
                  <span className="rounded-full border border-line-gold bg-panel px-4 py-2 text-sm font-bold text-ink">
                    المس للتجربة
                  </span>
                  <span className="text-xs text-dim">ثم مرّر داخل المنيو</span>
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-dim">منيو تجريبي — بيانات عرض</p>
          </div>
        </div>
      </div>
    </section>
  );
}
