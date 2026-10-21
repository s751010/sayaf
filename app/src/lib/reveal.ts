/**
 * أدوات الحركة على صفحة الهبوط.
 *
 * ═══ لماذا `IntersectionObserver` لا مستمع تمرير ═══
 *
 * مستمع `scroll` يعمل عشرات المرات في الثانية على الخيط الرئيسي ويقيس مواضع
 * العناصر (`getBoundingClientRect` يجبر إعادة تخطيط)، فيتقطّع التمرير على
 * الأجهزة الضعيفة — وهي أغلب من يفتح صفحتنا. المراقب يعمل خارج الخيط الرئيسي
 * ولا يوقظنا إلا عند تغيّر فعلي.
 *
 * ═══ حارس تقليل الحركة ═══
 *
 * `global.css` يوقف حركات CSS عبر `prefers-reduced-motion`، لكنه **لا يوقف
 * حركة تُحسب في JS** (العدّادات). فتُفحص هنا صراحةً: من يطلب تقليل
 * الحركة يراها ساكنة كاملةً لا نصف ساكنة.
 */
import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * يكشف العنصر عند دخوله الشاشة — مرة واحدة ثم يتوقّف عن مراقبته.
 *
 * `once` مقصود: عنصر يختفي ويعود كلما مرّ عليه التمرير يشتّت لا يُبهر، ويجعل
 * القراءة عودةً للخلف مزعجة.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(margin = "-10%") {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) return setShown(true);
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setShown(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: `0px 0px ${margin} 0px` }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);

  return { ref, shown };
}

/**
 * عدّاد يبدأ عند ظهور الرقم لا عند تحميل الصفحة.
 *
 * عدّاد يعمل قبل أن يراه أحد ليس حركة بل هدر: الزائر يصل إلى القسم فيجد الرقم
 * ثابتاً وقد فاتته الحركة كلها.
 */
export function useCountUp(target: number, shown: boolean, ms = 1100): number {
  const [n, setN] = useState(() => (prefersReducedMotion() ? target : 0));

  useEffect(() => {
    if (!shown) return;
    if (prefersReducedMotion()) return setN(target);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // الحدّ الأدنى ليس احتياطاً: طابع `requestAnimationFrame` هو زمن **بداية
      // الإطار**، وقد يسبق `performance.now()` الذي أخذناه عند الجدولة — فيصير
      // `t` سالباً ويظهر الرقم بالسالب إطاراً كاملاً قبل أن يعتدل.
      const t = Math.min(1, Math.max(0, (now - start) / ms));
      // تباطؤ في النهاية — العدّ الخطّي يبدو آلياً.
      setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, shown, ms]);

  return n;
}
