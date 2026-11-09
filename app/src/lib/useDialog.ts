/**
 * سلوك النافذة كلّه في مكانٍ واحد: التركيز يدخل ويُحبس ويعود، و«Esc» يغلق،
 * والتمرير خلفها مقفول — و«رجوع» الجهاز يغلقها بدل أن يغادر الصفحة.
 *
 * ═══ لماذا (تدقيق المنتج ٢٠٢٦/١١/٠٩، البندان ١ و٢) ═══
 *
 * ١. **التركيز كان يهرب من نافذة الطبق**: `lib/focusTrap.ts` كُتب لـ`MenuSheet`
 *    وحدها، و`DishModal` و`Modal` اللوحة نسختا منطق «Esc» وقفل التمرير بيدٍ
 *    ولم تنسخا الحبس. فالجذر **التكرار** لا الحابس: ثلاث نسخ، واحدة كاملة.
 *    والآن نسخة واحدة يناديها الثلاث.
 *
 * ٢. **«رجوع» أندرويد والطبق مفتوح كان يُخرج الزبون من منيو المطعم كلّه**.
 *    فالنافذة تدفع إدخالاً في السجلّ عند الفتح، و`popstate` يغلقها؛ والإغلاق
 *    بالزرّ يرجع خطوةً واحدة فلا تتراكم الإدخالات مع الفتح والإغلاق المتكرّر.
 *
 * ونافذة الطبق لا تستعمل هذا: `MenuPage` يكتبها في الرابط (`?dish=`) ليُشارَك
 * الطبق، ويملك سجلّها بنفسه.
 *
 * ⚠️ الإدخال يحمل حالة الراوتر كما هي (`idx` و`key`) ويضيف إليها قائمة
 * النوافذ المفتوحة — فالراوتر لا يرى تنقّلاً، والنافذة الداخلية تُغلق وحدها
 * حين ينسحب إدخالها وتبقى التي تحتها.
 */
import { useEffect, useRef, type RefObject } from "react";
import { trapTab } from "@/lib/focusTrap";

const KEY = "cmDialogs";

type HistState = Record<string, unknown> | null | undefined;

/** حالة السجلّ بعد فتح النافذة `id` — حالة الراوتر محفوظة كما هي. */
export function withDialog(state: HistState, id: string): Record<string, unknown> {
  const base = state && typeof state === "object" ? state : {};
  const open = Array.isArray(base[KEY]) ? (base[KEY] as string[]) : [];
  return { ...base, [KEY]: open.includes(id) ? open : [...open, id] };
}

/** هل إدخال السجلّ الحاليّ ما زال يحمل النافذة `id`؟ */
export function hasDialog(state: HistState, id: string): boolean {
  const open = state && typeof state === "object" ? state[KEY] : null;
  return Array.isArray(open) && open.includes(id);
}

/**
 * داخل إطار؟ (بطل الهبوط يضع `/demo` في `<iframe>`). هناك يشترك الإطار في سجلّ
 * الصفحة الأمّ، فإدخالٌ منه يجعل «رجوع» الزائر يغلق نافذةً لا يراها بدل أن يرجع.
 */
export function inFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.top !== window.self;
  } catch {
    return true; // إطارٌ من أصلٍ آخر يرمي عند لمس `top`
  }
}

let seq = 0;

export function useDialog(
  ref: RefObject<HTMLElement>,
  onClose: () => void,
  opts: { active?: boolean; backButton?: boolean } = {}
): void {
  const { active = true, backButton = false } = opts;
  // `onClose` دالّة مضمَّنة تتجدّد مع كل رسم؛ لو دخلت التبعيات لعاد التركيز
  // إلى الزرّ ثم إلى النافذة مع كل ضغطة، ولدُفع إدخالٌ جديد في السجلّ.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // ثابت عبر إعادة التركيب المزدوجة في StrictMode — فلا يُدفع إدخالان.
  const idRef = useRef(`d${++seq}`);
  // جيل التركيب: إن رُكّبت النافذة ثانيةً قبل أن تنقضي المهلة فلا رجوع.
  const genRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    const prev = document.activeElement as HTMLElement | null;
    // النافذة نفسها لا أوّل زرّ: قارئ الشاشة يبدأ من العنوان، ولا حلقة تركيز
    // على «إغلاق» لمن فتح بلمسة.
    root?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      else if (ref.current) trapTab(e, ref.current);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow === "hidden" ? "hidden" : "";
      if (prev?.isConnected) prev.focus({ preventScroll: true });
    };
  }, [active, ref]);

  useEffect(() => {
    if (!active || !backButton || typeof window === "undefined" || inFrame()) return;
    const id = idRef.current;
    const gen = ++genRef.current;
    let poppedAway = false;
    if (!hasDialog(window.history.state, id)) {
      window.history.pushState(withDialog(window.history.state, id), "");
    }
    const onPop = () => {
      if (hasDialog(window.history.state, id)) return; // انسحبت نافذةٌ فوقها لا هي
      poppedAway = true;
      closeRef.current();
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // بعد مهلة صغرى: StrictMode يفكّ ثم يركّب فوراً — فلا يُسحب إدخالٌ
      // ستحتاجه النافذة نفسها بعد لحظة.
      queueMicrotask(() => {
        if (genRef.current !== gen || poppedAway) return;
        if (hasDialog(window.history.state, id)) window.history.back();
      });
    };
  }, [active, backButton]);
}
