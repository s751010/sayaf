/**
 * معرض الطوابع — **شريطٌ يُسحب لكلّ نوع، و«شوف الكلّ» للشبكة** (طلب المالك ٢٠٢٦/١١/١١).
 *
 * كان المعرض ثمانيةً وثلاثين بطاقة تحت بعضها على الحاسوب — ثلث طول الصفحة.
 * فصار رفّاً واحداً لنوع الزائر (يتبع نوعه في البطل حتى يختار هنا غيره)،
 * والشبكة الكاملة مطويّة: تُرسم حين تُطلب لا قبل (٣٨ معاينة = مئات العقد).
 *
 * - الشريط `scroll-snap` (CSS وحده)، وسهمان على الحاسوب، ولوحة المفاتيح: الشريط
 *   نفسه يُركَّز (`tabIndex=0`) فيُمرَّر بالأسهم، وكلّ بطاقة زرٌّ في ترتيب Tab.
 * - المعاينة «تتحرّك» عند الوقوف والتركيز واللمس — CSS داخل `no-preference`.
 * - «جرّبه» يلبس الطابع لجوّال البطل كما كان.
 */
import { useRef, useState } from "react";
import { ThemePreview } from "@/components/menu/ThemePreview";
import { ThemeCategoryTabs } from "@/components/ThemeCategoryTabs";
import { SuitsLine } from "@/components/ThemeSuggest";
import { ALL_THEMES, type MenuTheme } from "@/lib/themes";
import { themesOf, type ThemeCategoryId } from "@/lib/themeCategories";
import { THEME_COUNT } from "@/lib/facts";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

function Card({ t, on, onTry, rail }: { t: MenuTheme; on: boolean; onTry: (id: string) => void; rail?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onTry(t.id)}
      aria-pressed={on}
      className={cn(
        "gal-card press group flex h-full w-full flex-col overflow-hidden rounded-[18px] border bg-panel text-start transition-colors",
        rail && "snap-start",
        on ? "border-ink" : "border-line hover:border-ink/35"
      )}
    >
      <span className="gal-prev block overflow-hidden">
        <ThemePreview theme={t} />
      </span>
      <span className="flex items-start justify-between gap-3 p-4">
        <span className="min-w-0">
          <span className="block font-bold text-ink">{t.name}</span>
          <span className="mt-1 block text-sm leading-relaxed text-dim">{t.tagline}</span>
          <SuitsLine theme={t} className="mt-1.5 text-xs font-bold" />
        </span>
        <span className="mt-0.5 shrink-0 text-xs font-bold text-gold group-hover:underline">جرّبه ↑</span>
      </span>
    </button>
  );
}

export function ThemeGallery({
  category,
  onCategory,
  current,
  onTry,
}: {
  category: ThemeCategoryId;
  onCategory: (id: ThemeCategoryId) => void;
  current: string;
  onTry: (id: string) => void;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [all, setAll] = useState(false);
  const shelf = themesOf(category, ALL_THEMES);

  /** سهما الحاسوب: بطاقةٌ إلى جهة السهم المرئية (اليسار «التالي» في العربية). */
  const nudge = (dir: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".gal-card");
    el.scrollBy({ left: dir * -1 * ((card?.offsetWidth ?? 280) + 16), behavior: "smooth" });
  };

  return (
    <div>
      <ThemeCategoryTabs
        value={category}
        onChange={(id) => {
          if (!id) return;
          onCategory(id);
          rail.current?.scrollTo({ left: 0 });
        }}
        withAll={false}
        tone="ink"
        label="الطوابع حسب نوع المطعم"
        panelId="landing-themes"
        className="-mx-5 mb-6 sm:mx-0"
        listClassName="sm:mx-auto sm:max-w-4xl sm:justify-center"
      />

      <div className="relative">
        <div
          ref={rail}
          id="landing-themes"
          role="tabpanel"
          tabIndex={0}
          aria-label="طوابع هذا النوع — مرّرها بالأسهم"
          className="gal-rail -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:mx-0 sm:scroll-px-0 sm:px-0"
        >
          {shelf.map((t) => (
            <div key={t.id} className="w-[78%] shrink-0 sm:w-[300px]">
              <Card t={t} on={current === t.id} onTry={onTry} rail />
            </div>
          ))}
        </div>
        {shelf.length > 3 && (
          <div className="pointer-events-none absolute inset-x-0 top-[38%] hidden justify-between lg:flex">
            <button
              type="button"
              onClick={() => nudge(-1)}
              aria-label="الطابع السابق"
              className="press pointer-events-auto -ms-6 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-panel text-ink shadow-[0_10px_24px_-14px_rgba(0,0,0,.5)] hover:border-ink/35"
            >
              <Icon name="chevron" size={20} />
            </button>
            <button
              type="button"
              onClick={() => nudge(1)}
              aria-label="الطابع التالي"
              className="press pointer-events-auto -me-6 flex h-12 w-12 items-center justify-center rounded-full border border-line bg-panel text-ink shadow-[0_10px_24px_-14px_rgba(0,0,0,.5)] hover:border-ink/35"
            >
              {/* الرمز يُعكس في RTL (`flip`) — فالسهمان يشيران إلى الخارج كلٌّ بجهته. */}
              <Icon name="chevron" size={20} className="rotate-180" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-expanded={all}
          aria-controls="landing-themes-all"
          className="press inline-flex min-h-12 items-center gap-2 rounded-[12px] border border-line bg-panel px-6 font-bold text-ink hover:border-ink/35"
        >
          {all ? "اطوِ الطوابع" : `شوف الكلّ (${THEME_COUNT})`}
          <Icon name="chevron" size={16} className={cn("transition-transform", all ? "-rotate-90" : "rotate-90")} />
        </button>
      </div>
      <div id="landing-themes-all" hidden={!all}>
        {all && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ALL_THEMES.map((t) => (
              <Card key={t.id} t={t} on={current === t.id} onTry={onTry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
