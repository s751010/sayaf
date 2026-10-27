/**
 * استطلاعٌ يحترم البطارية والشبكة — **مشترك بين الجرس وشاشتَي الطلبات**.
 *
 * ═══ لماذا استطلاع لا realtime ═══
 *
 * الاشتراك الحيّ يحتاج اتصالاً مفتوحاً يسقط مع كل قفل شاشة على جهاز الكاشير،
 * والاستطلاع البسيط أصدق في هذه البيئة (كان هذا قرار `Orders.tsx` من قبل).
 *
 * ═══ ثلاثة قيود ═══
 *
 *  ١. **لا يستطلع والتبويب مخفيّ** — ويستطلع فوراً حين يعود ظاهراً، فالتاجر
 *     الذي رجع إلى التبويب يرى الحاضر لا ما قبل دقيقة.
 *  ٢. **يتراجع عند الفشل** — ٢٠ث ثم ٤٠ ثم ٨٠… حتى خمس دقائق. شبكةٌ ساقطة
 *     لا تُغرَق بطلبٍ كل عشرين ثانية من كل لوح مفتوح، وأوّل نجاح يعيد الإيقاع.
 *  ٣. **`setTimeout` متسلسل لا `setInterval`** — الجولة التالية تُجدوَل بعد
 *     انتهاء السابقة، فلا تتراكم طلبات على شبكة بطيئة.
 */
import { useCallback, useEffect, useRef, useState } from "react";

/** إيقاع الطلبات — حوالي عشرين ثانية كما طلب المالك. */
export const ORDER_POLL_MS = 20_000;
/** سقف التراجع: خمس دقائق — أبعد من ذلك يبدو للتاجر توقّفاً لا تراجعاً. */
export const MAX_BACKOFF_MS = 5 * 60_000;

/** المهلة قبل الجولة التالية بعد `failures` فشلاً متتالياً. */
export function nextPollDelay(
  failures: number,
  base = ORDER_POLL_MS,
  max = MAX_BACKOFF_MS
): number {
  const n = Math.max(0, Math.min(Math.floor(failures), 16));
  return Math.min(base * 2 ** n, max);
}

export type PollState = {
  /** فشلٌ متتالٍ منذ آخر نجاح — `0` = الأخيرة نجحت. */
  failures: number;
  /** وقت آخر نجاح (ms) — `null` = لم ينجح شيء بعد. */
  lastOk: number | null;
  /** جولة فورية (زرّ «تحديث» أو «أعد المحاولة») — تُصفّر التراجع. */
  refresh: () => void;
};

/**
 * يشغّل `task` الآن ثم كل `intervalMs` ما دام التبويب ظاهراً و`enabled`.
 *
 * `task` يرمي عند الفشل — والفشل يُعدّ هنا ولا يُبتلع: من يعرض الشاشة يقرأ
 * `failures` ليقول للتاجر «لم نصل» بدل أن يعرض «لا طلبات» (القاعدة ج).
 */
export function usePolling(
  task: () => Promise<void>,
  { intervalMs = ORDER_POLL_MS, enabled = true }: { intervalMs?: number; enabled?: boolean } = {}
): PollState {
  const [failures, setFailures] = useState(0);
  const [lastOk, setLastOk] = useState<number | null>(null);
  // المهمّة في مرجع: تتغيّر مع كل تصيير ولا يجوز أن تُعيد جدولة المؤقّت.
  const taskRef = useRef(task);
  taskRef.current = task;
  const fails = useRef(0);
  const timer = useRef<number | null>(null);
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    /**
     * ⚠️ **محلّيٌّ للتأثير لا مرجع.** كان مرجعاً (`useRef`) فيعيش بين تركيبين:
     * في StrictMode يُركَّب التأثير ويُفكّ ويُركَّب، فيجد التركيب الثاني الراية
     * مرفوعةً من جولة الأوّل (التي ماتت بـ`alive = false`) فيعود بلا جولة ولا
     * جدولة — استطلاعٌ ميّت بصمت، وفشلٌ لا يُعدّ أبداً فتبقى الشاشة «تُحمَّل».
     * أمسكه `e2e/kitchen.spec.ts` (فشل الشبكة قبل أوّل جلب).
     */
    let running = false;

    const schedule = (ms: number) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(run, ms);
    };

    async function run() {
      // جولةٌ يدوية (`refresh`) تُلغي المجدولة — وإلا جرت جولتان متتاليتان.
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      if (!alive) return;
      // مخفيّ: لا جولة ولا جدولة — `visibilitychange` يوقظنا.
      if (document.visibilityState !== "visible") return;
      if (running) return;
      running = true;
      try {
        await taskRef.current();
        if (!alive) return;
        fails.current = 0;
        setFailures(0);
        setLastOk(Date.now());
      } catch {
        if (!alive) return;
        fails.current += 1;
        setFailures(fails.current);
      } finally {
        running = false;
      }
      if (alive) schedule(nextPollDelay(fails.current, intervalMs));
    }

    kick.current = () => {
      fails.current = 0;
      void run();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && timer.current === null && !running) {
        void run();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    void run();

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = null;
      kick.current = () => {};
    };
  }, [enabled, intervalMs]);

  const refresh = useCallback(() => kick.current(), []);
  return { failures, lastOk, refresh };
}
