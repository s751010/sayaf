/**
 * «اقترب من الشاشة» — مرّةً ولا يعود: ما ثقُل من الهبوط يُحمَّل حين يقترب
 * الزائر منه لا عند الإقلاع.
 *
 * ═══ لماذا (تدقيق المنتج ٢٠٢٦/١١/٠٩، البند ٣) ═══
 *
 * الهبوط كان يحمّل حاسبة البطل (`motion` + المحرّك + جدول المكوّنات) **وإطار
 * `/demo`** — أي نسخةً ثانية من التطبيق كلّه — في أوّل تحميل، فبلغ زمن الحجب
 * (TBT) على جوالٍ مخنوق أكثر من ثانية. `lazy()` وحده لا يكفي: يجلب الحزمة لحظة
 * يُرسم مكانها، ومكانها يُرسم فوراً.
 *
 * ‏`afterLoad`: ولا قبل حدث `load` ولحظة خمول — كي لا ينافس ما في أوّل شاشة.
 * وبلا `IntersectionObserver` (متصفّح قديم) يُحمَّل كما كان.
 */
import { useEffect, useState, type RefObject } from "react";

export function useNearViewport(
  ref: RefObject<Element>,
  { rootMargin = "400px", afterLoad = false }: { rootMargin?: string; afterLoad?: boolean } = {}
): boolean {
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    let cancelled = false;
    // ⚠️ معرّفا الخمول والمؤقّت من فضاءين مختلفين — والرقم نفسه قد يكون مؤقّتاً
    // لغيرنا. فكلٌّ يُلغى بدالّته وحدها (كان `clearTimeout(idleId)` يقتل مؤقّت
    // `useFirstInteraction` فيبقى إطار البطل هيكلاً).
    let idleId: number | null = null;
    let timerId: number | null = null;
    const go = () => {
      if (cancelled) return;
      if (!afterLoad) return setNear(true);
      const idle = () => {
        // تُنادى على `window` لا منسوخةً: `requestIdleCallback` مفصولةً عن
        // كائنها ترمي «Illegal invocation» — داخل مراقبٍ يبتلع الخطأ بصمت.
        if (typeof window.requestIdleCallback === "function")
          idleId = window.requestIdleCallback(() => !cancelled && setNear(true), { timeout: 2000 });
        else timerId = window.setTimeout(() => !cancelled && setNear(true), 200);
      };
      if (document.readyState === "complete") idle();
      else window.addEventListener("load", idle, { once: true });
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          go();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
      if (idleId !== null && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [near, ref, rootMargin, afterLoad]);
  return near;
}

/**
 * أوّل تفاعلٍ من الزائر (لمسٌ · تمرير · فأرة · لوحة مفاتيح) — أو مهلةٌ من
 * التركيب إن بقي ساكناً. لِما يكلّف كثيراً ويظهر في أوّل شاشة: إطار `/demo` في
 * البطل يبني نسخةً ثانية من التطبيق، وقياسه وحده كان **كلّ** زمن الحجب في
 * الهبوط (٥٤٠ms مقابل صفر بدونه، جوال ٣٩٠ · 3G سريع · CPU ×٤).
 */
export function useFirstInteraction(fallbackMs: number): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (on) return;
    const events = ["pointerdown", "touchstart", "keydown", "wheel", "scroll", "mousemove"] as const;
    const fire = () => setOn(true);
    for (const e of events) window.addEventListener(e, fire, { once: true, passive: true });
    // من التركيب لا من `load`: الصفحة كسولة فتُركَّب قرب `load`، وانتظاره كان
    // يفوت الحدث أحياناً فيبقى الإطار هيكلاً بلا نهاية لمن لم يلمس شيئاً.
    const timer = window.setTimeout(fire, fallbackMs);
    return () => {
      for (const e of events) window.removeEventListener(e, fire);
      window.clearTimeout(timer);
    };
  }, [on, fallbackMs]);
  return on;
}
