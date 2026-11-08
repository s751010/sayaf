/**
 * شريط أقسام الطوابع — للوحة («التصميم» · «إعداد منيوك» · «القوائم») وللهبوط و`/demo`.
 *
 * الأقسام نفسها من `lib/themeCategories.ts` وحده؛ وهذا عرضٌ فقط. شريطٌ أفقيّ يُسحب
 * على الجوّال (`RAIL`: بلا شريط تمرير، ويتلاشى عند طرفيه فيُقرأ «هناك المزيد»)،
 * وكلّ زرٍّ ‎≥ 44px.
 *
 * ‏`role="tab"` لا زرّ: الشريط يبدّل ما تحته ولا يطبّق شيئاً — وزرٌّ اسمه «شعبي»
 * كان سيلتبس بزرّ «مختصّ أم شعبي؟» بجانبه. والأسهم تنقل بين الأقسام بترتيبها
 * المرئي (اليسار «التالي» في العربية).
 */
import { useEffect, useRef, type KeyboardEvent } from "react";
import { Icon, type IconName } from "@/lib/icons";
import { THEME_CATEGORIES, type ThemeCategoryId } from "@/lib/themeCategories";
import { cn } from "@/lib/utils";

/**
 * الشريط المسحوب: يُسحب على الجوّال وحده، ومن `sm` يلتفّ ظاهراً كلّه — والتلاشي
 * عند الطرفين علامة «هناك المزيد»، فلا معنى له حين لا مزيد.
 *
 * ⚠️ **أصناف Tailwind لا `.theme-rail`**: تلك قاعدةٌ خارج الطبقات في `global.css`،
 * والقاعدة خارج الطبقات تغلب `sm:[mask-image:none]` أيّاً كانت دقّتها — فبقي القسم
 * المختار في طرف الصفّ باهتاً على الحاسوب.
 */
export const RAIL =
  "overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
  "[mask-image:linear-gradient(to_left,transparent,#000_14px,#000_calc(100%_-_14px),transparent)] " +
  "sm:overflow-visible sm:[mask-image:none]";

type Item = { id: ThemeCategoryId | null; name: string; icon: IconName };

const ALL: Item = { id: null, name: "الكل", icon: "palette" };

export function ThemeCategoryTabs({
  value,
  onChange,
  label,
  withAll = true,
  tone = "gold",
  panelId,
  home,
  className,
  listClassName,
}: {
  /** ‏`null` ⇒ «الكل». */
  value: ThemeCategoryId | null;
  onChange: (id: ThemeCategoryId | null) => void;
  label: string;
  /** «الكل» أوّلاً — و`/demo` بلا «الكل»: لكلّ قسمٍ منيوه. */
  withAll?: boolean;
  /** ذهب اللوحة، أو حبر الهبوط. */
  tone?: "gold" | "ink";
  /** معرّف ما يبدّله الشريط (`aria-controls`). */
  panelId?: string;
  /** قسم نشاط التاجر — نقطةٌ عليه تبقى وإن فتح غيره. */
  home?: ThemeCategoryId | null;
  className?: string;
  listClassName?: string;
}) {
  const items: Item[] = [...(withAll ? [ALL] : []), ...THEME_CATEGORIES];
  const rail = useRef<HTMLDivElement>(null);

  // القسم المفتوح يُرى: «بحري» ثامنُ الشريط، وعلى ٣٩٠ خارج الشاشة. بالتمرير
  // الأفقيّ وحده — `scrollIntoView` كان سيحرّك الصفحة رأسياً أيضاً.
  useEffect(() => {
    const box = rail.current;
    const tab = box?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!box || !tab || box.scrollWidth <= box.clientWidth) return;
    box.scrollTo({ left: tab.offsetLeft - (box.clientWidth - tab.offsetWidth) / 2 });
  }, [value]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = items.findIndex((it) => it.id === value);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[e.key];
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : step ? (i + step + items.length) % items.length : -1;
    if (next < 0) return;
    e.preventDefault();
    onChange(items[next].id);
    e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <div ref={rail} className={cn("relative", RAIL, className)}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKey}
        className={cn("flex w-max gap-2 px-3 py-1 sm:w-auto sm:flex-wrap sm:px-0", listClassName)}
      >
        {items.map((it, idx) => {
          const on = it.id === value;
          // بلا قسمٍ مفتوح (`/demo` بلا معامل) يبقى الأوّل في ترتيب Tab — وإلا لا يُبلَغ الشريط بلوحة المفاتيح.
          const focusable = on || (idx === 0 && !items.some((x) => x.id === value));
          return (
            <button
              key={it.id ?? "all"}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={focusable ? 0 : -1}
              data-category={it.id ?? "all"}
              onClick={() => onChange(it.id)}
              className={cn(
                "press relative flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-sm font-bold transition-colors",
                tone === "gold"
                  ? on
                    ? "border-gold bg-gold/10 text-gold"
                    : // لمسة الرمز (§20) بالذهب والخطّ بحبر الشريحة — كما في شريط المنيو.
                      "border-line bg-panel text-dim hover:border-gold/40 hover:text-ink [--cm-tint:color-mix(in_srgb,var(--color-gold)_30%,transparent)]"
                  : on
                    ? "border-ink bg-ink text-page"
                    : "border-line bg-panel text-dim hover:border-ink/35 hover:text-ink"
              )}
            >
              <Icon name={it.icon} size={16} />
              {it.name}
              {home && it.id === home && !on && (
                <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", tone === "gold" ? "bg-gold" : "bg-ink")} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
