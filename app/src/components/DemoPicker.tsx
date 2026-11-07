/**
 * شريط `/demo`: «أيّ مطعمٍ مطعمك؟» ثم طوابع قسمه — فوق المنيو التجريبي.
 *
 * الزائر المستقلّ يصل إلى `/demo` بمنيو الستيك («الديوان»)، وصاحب الفوّال لا يرى فيه
 * نفسه. فيختار قسمه هنا فيتبدّل المنيو إلى منيو ذلك النوع (`kind` القسم)، ثم يقلّب
 * طوابع القسم على أصنافه. والاختيار يُكتب في الرابط (`?kind=` و`?theme=` نفسيهما)
 * فيُشارَك ويبقى بعد التحديث.
 *
 * ⚠️ **غير لاصق، ويُطوى**: شريط تصنيفات المنيو لاصقٌ على `top-0`، وشريطٌ لاصقٌ فوقه
 * كان سيأكل نصف شاشة ٣٢٠ طوال التصفّح. فهو في مجرى الصفحة يمرّ مع التمرير، وزرّه
 * يطويه سطراً واحداً. ولا يُرسم داخل إطار الهبوط أصلاً (`Demo.tsx`).
 */
import { useState } from "react";
import { RAIL, ThemeCategoryTabs } from "@/components/ThemeCategoryTabs";
import { Icon } from "@/lib/icons";
import { ALL_THEMES, getTheme } from "@/lib/themes";
import { categoryById, themesOf, type ThemeCategory, type ThemeCategoryId } from "@/lib/themeCategories";
import { cn } from "@/lib/utils";

export function DemoPicker({
  category,
  theme,
  onPick,
}: {
  category: ThemeCategoryId | null;
  /** معرّف الطابع المعروض الآن (بلا لون). */
  theme: string;
  /** يكتب `kind` و`theme` في الرابط. */
  onPick: (cat: ThemeCategory, themeId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const cat = categoryById(category);
  const themes = themesOf(category, ALL_THEMES);
  const current = getTheme(theme);

  return (
    <div data-demo-picker className="border-b border-line bg-panel">
      <div className="mx-auto max-w-3xl px-3">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-xs font-bold text-ink">
            {cat ? (
              <>
                <span className="text-dim">مطعمك: </span>
                {cat.name}
                <span className="text-faint"> · </span>
                {current.name}
              </>
            ) : (
              "اختر نوع مطعمك — يتبدّل المنيو وطوابعه"
            )}
          </p>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="demo-picker-body"
            onClick={() => setOpen((o) => !o)}
            className="press inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-bold text-dim hover:text-ink"
          >
            {open ? "اطوِ" : "غيّر"}
            {/* السهم معكوسٌ في العربية (`cm-icon-flip`: «>»)، و`rotate` يُطبَّق بعد العكس:
                ‏-٩٠ ⇒ «^» (اطوِ) و٩٠ ⇒ «v» (افتح). */}
            <Icon name="chevron" size={14} className={open ? "-rotate-90" : "rotate-90"} />
          </button>
        </div>

        {open && (
          <div id="demo-picker-body" className="pb-2">
            <ThemeCategoryTabs
              value={category}
              onChange={(id) => {
                const next = categoryById(id);
                if (next) onPick(next, next.themes[0]);
              }}
              withAll={false}
              tone="ink"
              label="نوع مطعمك"
              panelId="demo-picker-themes"
              className="-mx-3 sm:mx-0"
            />
            {cat && (
              <div
                id="demo-picker-themes"
                role="tabpanel"
                className={cn(RAIL, "-mx-3 mt-1 sm:mx-0")}
              >
                <div role="group" aria-label={`طوابع «${cat.name}»`} className="flex w-max gap-1.5 px-3 py-1 sm:w-auto sm:flex-wrap sm:px-0">
                  {themes.map((t) => {
                    const on = t.id === current.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => onPick(cat, t.id)}
                        title={t.tagline}
                        className={cn(
                          "press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[11px] border px-3 text-[13px] font-bold transition-colors",
                          on ? "border-ink bg-ink text-page" : "border-line bg-page text-dim hover:text-ink"
                        )}
                      >
                        {/* قرص الطابع: أرضيته وحلقة تمييزه — كما في مُنتقي البطل. */}
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 rounded-full"
                          style={{
                            background: t.vars["--m-bg"],
                            boxShadow: `inset 0 0 0 3.5px ${t.vars["--m-accent"]}, 0 0 0 1px rgba(0,0,0,.08)`,
                          }}
                        />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
