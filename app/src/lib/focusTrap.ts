/**
 * حبس «Tab» داخل نافذة مفتوحة — بلا مكتبة.
 *
 * نوافذ المنيو السفلية (`MenuSheet`) كانت تترك «Tab» يتجوّل خلف الغطاء: قارئ
 * الشاشة ولوحة المفاتيح يصلان أزرار المنيو المحجوبة، والتركيز يبقى على الزرّ
 * الذي فتحها. فالنافذة تأخذ التركيز عند الفتح، وتحبسه وهي مفتوحة، وتعيده إلى
 * من فتحها عند الإغلاق — كما تفعل `DishModal`.
 *
 * القرار خالص (`trapStep`) ليُفحص بلا متصفّح؛ وما يلمس DOM في `focusables`.
 */

/** ما يقبل التركيز بـ«Tab» — والمعطَّل و`tabindex="-1"` خارجه. */
export const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * أين يذهب التركيز بعد «Tab» داخل نافذة فيها `count` عنصراً، والتركيز الآن على
 * العنصر `index` (‎-1 = على النافذة نفسها أو خارجها).
 *
 * - رقمٌ ⇐ ركّز هذا العنصر وامنع سلوك المتصفّح.
 * - ‎-1 ⇐ لا شيء يقبل التركيز: أبقِه على النافذة وامنع الخروج.
 * - `null` ⇐ اترك المتصفّح: الخطوة داخل النافذة أصلاً.
 */
export function trapStep(count: number, index: number, shift: boolean): number | null {
  if (count <= 0) return -1;
  if (index < 0 || index >= count) return shift ? count - 1 : 0;
  if (!shift && index === count - 1) return 0;
  if (shift && index === 0) return count - 1;
  return null;
}

/** العناصر الظاهرة القابلة للتركيز داخل `root` بترتيب الصفحة. */
export function focusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getClientRects().length > 0
  );
}

/** يعالج «Tab» داخل `root` — يُنادى من مستمع `keydown`. */
export function trapTab(e: KeyboardEvent, root: HTMLElement): void {
  if (e.key !== "Tab") return;
  const items = focusables(root);
  const step = trapStep(items.length, items.indexOf(document.activeElement as HTMLElement), e.shiftKey);
  if (step === null) return;
  e.preventDefault();
  (step < 0 ? root : items[step]).focus();
}
