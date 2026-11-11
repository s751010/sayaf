/**
 * طبقة التفاعل المشتركة للطوابع (٢٠٢٦/١١/٠٩، طلب المالك «متفاعلة أكثر»).
 *
 * ═══ لماذا ═══
 *
 * حركات الطوابع كلّها **تحدث مرّةً عند الفتح** (الآلة توضع، الدلال تُصفّ) أو مع دخول
 * عنصرٍ الشاشة (`animation-timeline: view()`). والمالك يريد منيواً **يردّ على الزبون**:
 * التقطير يتقدّم وهو يمرّر، والذراع يدور، والكوب يُختم حين يضيف. فهذه الطبقة تقول للـCSS
 * ثلاثة أشياء، ولا ترسم شيئاً بنفسها:
 *
 * | ما يُكتب | أين | معناه |
 * |---|---|---|
 * | `--m-scroll` | الشريط اللاصق (`SCROLL_READERS`) | تقدّم التمرير في الصفحة كلّها ‎0..1 |
 * | `--m-scroll-y` | ترويسة الطابع (`SCROLL_Y_READERS`) | ما مُرِّر بالبكسل (رقمٌ بلا وحدة، حتى `SCROLL_Y_MAX`) — للترويسة: تُرى أوّل شاشة وحدها |
 * | `data-m-scrolling` | جذر المنيو | يمرّر الآن — يسقط بعد `SCROLL_IDLE_MS` من آخر حركة |
 * | `data-m-added` | الجذر، وغلاف البطاقة التي أُضيفت | أُضيف للسلّة لتوّه — يسقط بعد `ADDED_MS` |
 * | `data-m-in` | كلّ `.m-sec` | دخل القسم الشاشة (مرّةً، ولا يسقط) |
 * | `data-m-motion` | جذر المنيو | الطبقة تعمل — للحالات التمهيدية التي لا تُخفى إلا حين تعمل |
 *
 * ═══ ثلاثة قيود ═══
 *
 * 1. **لا إعادة رسمٍ لكلّ تمرير**: المتغيّر يُكتب على الـDOM مباشرةً (`style.setProperty`)
 *    لا في حالة React، داخل `requestAnimationFrame` واحد، و**مكمَّماً** (`SCROLL_STEP`):
 *    متغيّرٌ موروث يغيّره الجذر يعيد حساب أنماط الشجرة، فلا يُكتب إلا حين يتغيّر درجةً.
 *    مستمعٌ واحد `passive`، ومراقب تقاطعٍ واحد للأقسام.
 * 2. **مع «تقليل الحركة» لا يعمل أصلاً**: لا مستمع ولا سمة — والـCSS كلّه داخل
 *    `prefers-reduced-motion: no-preference` كما في الطوابع كلّها، فالشكل الساكن كاملٌ.
 * 3. **باختيار الطابع** (`MOTION_SKINS`): منيوٌ بطابعٍ لا يقرأ هذه الإشارات لا يدفع ثمنها.
 *    والموجات التالية تضيف طوابعها هنا سطراً.
 *
 * والحساب نفسه دوالّ خالصة (`scrollProgress` · `scrollDepth`) يحرسها `skin-motion.test.ts`.
 */
import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { MenuSkin } from "./themes";

/** الطوابع التي تقرأ الطبقة — والباقي بلا مستمعٍ ولا سمة. */
export const MOTION_SKINS: ReadonlySet<MenuSkin> = new Set<MenuSkin>([
  "v60", "latte", "grinder", "drive",
  // ٠٩/١١ (الموجة ٢): البيتزا — حطب · علبة · شريحة · نابولي.
  "woodfire", "pizzabox", "slices", "napoli",
  // ٠٩/١١ (الموجة ٣): المشاوي — شاورما (و«ستيك» و«أوجاق» و«مدخنة» حذفها المالك ١١/١١).
  "shawarma",
  // ١٠/١١ (الموجة ٤): الأربعة القائمة لهذه الأقسام — دلّة · باريستا · ريحان · جمر.
  "dallah", "barista", "pizza", "grill",
]);

/** درجة `--m-scroll`: مئتان وخمسون درجةً للصفحة كلّها — أنعم ممّا تميّزه العين في شريط. */
export const SCROLL_STEP = 0.004;
/** درجة `--m-scroll-y` بالبكسل. */
export const SCROLL_Y_STEP = 4;
/** بعدها لا يتغيّر `--m-scroll-y`: الترويسة خرجت من الشاشة منذ زمن. */
export const SCROLL_Y_MAX = 1600;
/** سكونٌ بعد آخر تمرير ⇒ `data-m-scrolling` يسقط. */
export const SCROLL_IDLE_MS = 160;
/** عمر إشارة «أُضيف» — أطول قليلاً من أطول حركة إضافةٍ في الطوابع. */
export const ADDED_MS = 1200;

/**
 * من يحمل كلّ متغيّر — **القارئ وحده**، لا جذر المنيو:
 * `--m-scroll` (تقدّم الصفحة) للشريط اللاصق وعنصرَيه الزائفين، و`--m-scroll-y`
 * (ما مُرِّر بالبكسل) لترويسة الطابع. `skin-motion.test.ts` يحرس أن CSS لا
 * يقرأ أحدهما من غير صاحبه.
 */
export const SCROLL_READERS = ".m-nav";
export const SCROLL_Y_READERS = "header";

/** تقدّم التمرير ‎0..1 مكمَّماً — صفحةٌ لا تتمرّر (أقصر من الشاشة) صفر. */
export function scrollProgress(y: number, docHeight: number, viewHeight: number): number {
  const room = docHeight - viewHeight;
  if (!(room > 0) || !Number.isFinite(y)) return 0;
  const p = Math.min(1, Math.max(0, y / room));
  return Number((Math.round(p / SCROLL_STEP) * SCROLL_STEP).toFixed(3));
}

/** ما مُرِّر بالبكسل حتى `SCROLL_Y_MAX` — مكمَّماً، ولا سالب (ارتداد iOS عند القمّة). */
export function scrollDepth(y: number): number {
  if (!Number.isFinite(y)) return 0;
  const d = Math.min(SCROLL_Y_MAX, Math.max(0, y));
  return Math.round(d / SCROLL_Y_STEP) * SCROLL_Y_STEP;
}

/** هل يقرأ هذا الطابع الطبقة؟ */
export function wantsMotion(skin: MenuSkin): boolean {
  return MOTION_SKINS.has(skin);
}

function reducedMotion(): boolean {
  return typeof window === "undefined" || !window.matchMedia || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** يعيد تشغيل حركةٍ مربوطةٍ بسمة: تُنزع، ثم تُقرأ هندسةٌ (يُفرغ المتصفّح أنماطه)، ثم تعود. */
function retrigger(el: Element, attr: string): void {
  el.removeAttribute(attr);
  void (el as HTMLElement).offsetWidth;
  el.setAttribute(attr, "");
}

export interface SkinMotion {
  /**
   * «أُضيف للسلّة» — من زرّ البطاقة (`from` غلافها) أو من نافذة الطبق (بلا `from`).
   * لا يفعل شيئاً لطابعٍ خارج `MOTION_SKINS` ولا مع «تقليل الحركة».
   */
  added: (from?: Element | null) => void;
}

/**
 * يربط الطبقة بجذر المنيو. `key` يتغيّر حين تتغيّر الأقسام (البحث، وصول البيانات)
 * فتُراقَب الأقسام الجديدة — والقسم الذي دخل الشاشة مرّةً يبقى `data-m-in`.
 *
 * ⚠️ يُستدعى **فوق العوائد المبكّرة** في `MenuPage` كبقيّة الخطّافات (React #310)، و`root`
 * فارغٌ في رسمة التحميل — فالأثر لا يعمل حتى يُركَّب الجذر ويتغيّر `key`.
 */
export function useSkinMotion(root: RefObject<HTMLElement | null>, skin: MenuSkin, key: string): SkinMotion {
  const on = wantsMotion(skin);

  useEffect(() => {
    const el = root.current;
    if (!on || !el || reducedMotion()) return;
    el.setAttribute("data-m-motion", "");

    let frame = 0;
    let idle = 0;
    let lastP = "";
    let lastY = "";
    /**
     * ⚠️ المتغيّران يُكتبان على **قرّائهما وحدهم** (الترويسة والشريط اللاصق) لا
     * على جذر المنيو. المتغيّر المخصّص موروث: كتابته على الجذر في كلّ إطار كانت
     * تُعيد حساب أنماط **كلّ** بطاقة تحته — ٣٠ مهمّة طويلة حتى ٣٠٠ms في تمريرةٍ
     * واحدة على جوالٍ متوسّط (مراجعة الجودة ٢٠٢٦/١١/١٠)، وقبل الطبقة كانت صفراً.
     * والقرّاء عشرات العناصر لا آلاف. ولكلّ متغيّرٍ صاحبه: `--m-scroll` للشريط
     * و`--m-scroll-y` للترويسة — وهذه لا تُكتب بعد أن تخرج من الشاشة.
     */
    let heads: HTMLElement[] = [];
    let navs: HTMLElement[] = [];
    /** أسفل الترويسة في الصفحة: بعده لا يراها أحد فلا يُكتب لها شيء. */
    let headEnd = 0;
    const readers = () => {
      const gone = (list: HTMLElement[]) => list.some((t) => !t.isConnected);
      if (heads.length + navs.length === 0 || gone(heads) || gone(navs)) {
        heads = Array.from(el.querySelectorAll<HTMLElement>(SCROLL_Y_READERS));
        navs = Array.from(el.querySelectorAll<HTMLElement>(SCROLL_READERS));
        headEnd = 0;
        lastP = lastY = "";
      }
      if (!headEnd && heads.length) {
        headEnd = Math.max(...heads.map((h) => h.getBoundingClientRect().bottom)) + window.scrollY;
      }
    };
    const write = () => {
      frame = 0;
      const doc = document.documentElement;
      readers();
      const p = String(scrollProgress(window.scrollY, doc.scrollHeight, window.innerHeight));
      if (p !== lastP) {
        lastP = p;
        for (const t of navs) t.style.setProperty("--m-scroll", p);
      }
      // الترويسة خارج الشاشة ⇒ لا كتابة: رسمها لا يُرى، وحسابه ليس مجّاناً.
      if (window.scrollY > headEnd) return;
      const y = String(scrollDepth(window.scrollY));
      if (y !== lastY) {
        lastY = y;
        for (const t of heads) t.style.setProperty("--m-scroll-y", y);
      }
    };
    const onResize = () => {
      headEnd = 0;
      onScroll();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
      if (!el.hasAttribute("data-m-scrolling")) el.setAttribute("data-m-scrolling", "");
      window.clearTimeout(idle);
      idle = window.setTimeout(() => el.removeAttribute("data-m-scrolling"), SCROLL_IDLE_MS);
    };
    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                if (!e.isIntersecting) continue;
                e.target.setAttribute("data-m-in", "");
                io?.unobserve(e.target);
              }
            },
            // يدخل حين يتجاوز حافّة الشاشة السفلى بقليل — لا حين يلمسها.
            { rootMargin: "0px 0px -12% 0px", threshold: 0 }
          );
    el.querySelectorAll(".m-sec:not([data-m-in])").forEach((s) => io?.observe(s));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      el.removeAttribute("data-m-scrolling");
      for (const t of navs) t.style.removeProperty("--m-scroll");
      for (const t of heads) t.style.removeProperty("--m-scroll-y");
      io?.disconnect();
    };
  }, [on, root, key]);

  const timer = useRef(0);
  const marked = useRef<Element[]>([]);
  const added = useCallback(
    (from?: Element | null) => {
      const el = root.current;
      if (!on || !el || reducedMotion()) return;
      for (const m of marked.current) m.removeAttribute("data-m-added");
      const targets = from ? [el, from] : [el];
      for (const t of targets) retrigger(t, "data-m-added");
      marked.current = targets;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        for (const t of targets) t.removeAttribute("data-m-added");
        marked.current = [];
      }, ADDED_MS);
    },
    [on, root]
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { added };
}
