/**
 * ترتيب المُنتقي حسب نوع النشاط — لصفحتَي التصميم والقوائم معاً.
 *
 * يرتّب ويعلّم **ولا يطبّق**: الضغط على البطاقة هو ما يطبّق، كما كان. والسؤال
 * «مختصّ أم شعبي؟» للكافيه وحده، يعيد الترتيب **ولا يُحفظ** (قرار ٢٦/١٠ — لا
 * عمود، وإن حُفظ يوماً فمكانه `restaurants.type` نفسه). المنطق كلّه خالص في
 * `lib/themeSuggest.ts`، وهذا الملفّ عرضٌ فقط.
 */
import { useState } from "react";
import { DESIGN_THEMES, type MenuTheme } from "@/lib/themes";
import { cafeFlavor, rankThemes, type CafeFlavor } from "@/lib/themeSuggest";
import { categoryById, categoryForType, fillColumns, themesOf, type ThemeCategoryId } from "@/lib/themeCategories";
import { cn } from "@/lib/utils";

/**
 * الترتيب والقسم معاً (٠٧/١١): **قسم نشاط التاجر ينفتح أوّلاً** (`categoryForType`)،
 * وبلا نشاطٍ معروف «الكل» — و«الكل» بترتيب `rankThemes` كما كان. وزرّ «مختصّ أم
 * شعبي؟» يبدّل الاثنين: الكافيه الشعبي يُفتح على «شعبي» حيث مقترحه.
 */
export function useThemeOrder(rawType: string | null | undefined) {
  const [flavor, setFlavorState] = useState<CafeFlavor>(() => cafeFlavor(rawType));
  const home = categoryForType(rawType, flavor);
  const [category, setCategory] = useState<ThemeCategoryId | null>(home);
  const order = rankThemes(DESIGN_THEMES, rawType, flavor);
  const setFlavor = (f: CafeFlavor) => {
    setFlavorState(f);
    setCategory(categoryForType(rawType, f));
  };
  // مفتاح الصفّ نفسه لغير الكافيه: النوع، أو صفّه الفرعيّ («مخبز ومعجّنات» · «فطور شعبي»).
  const typeLabel = order.isCafe ? (flavor === "popular" ? "كافيه شعبي" : "كافيه مختصّ") : order.key;
  // داخل القسم ترتيب المالك؛ وفي «الكل» ترتيب نوع النشاط.
  const visible = category ? themesOf(category, DESIGN_THEMES) : order.ordered;
  return { ...order, flavor, setFlavor, typeLabel, home, category, setCategory, visible };
}

/**
 * أعمدة شبكة المُنتقي: اثنان على الجوّال دائماً (أضيق من ذلك تُقصّ المعاينة)، ثم
 * ما لا يترك طابعاً وحيداً في آخر صفّ — أربعةٌ من قسمٍ بأربعة على العريض لا ثلاثةٌ
 * وواحد. الأصناف نصوصٌ كاملة كي يجدها Tailwind.
 */
const PICKER_SM = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" } as const;
const PICKER_LG = { 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as const;
export function pickerCols(n: number): string {
  return `grid-cols-2 ${PICKER_SM[fillColumns(n, [3, 2] as const)]} ${PICKER_LG[fillColumns(n, [4, 3] as const)]}`;
}

/** اسم القسم المفتوح — لسطر الترتيب. */
export function categoryName(id: ThemeCategoryId | null): string | null {
  return categoryById(id)?.name ?? null;
}

/** سطر الترتيب تحت عنوان «طابع منيوك»، وسؤال الكافيه. */
export function ThemeOrderNote({
  typeLabel,
  isCafe,
  flavor,
  setFlavor,
  home,
}: {
  typeLabel: string;
  isCafe: boolean;
  flavor: CafeFlavor;
  setFlavor: (f: CafeFlavor) => void;
  /** قسم نشاط التاجر — إن عُرف قيل أيّ قسمٍ فُتح ولماذا. */
  home?: ThemeCategoryId | null;
}) {
  const homeName = categoryName(home ?? null);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-xs text-dim">
        {homeName
          ? `«${homeName}» قسمُ نشاطك (${typeLabel}) — والطوابع كلّها في «الكل» مرتّبةً لنشاطك، والقرار لك.`
          : `رتّبناها حسب نوع نشاطك (${typeLabel}) — والقرار لك، وكلّها متاحة.`}
      </p>
      {isCafe && (
        <div className="flex items-center gap-1.5" role="group" aria-label="مقهاك مختصّ أم شعبي؟">
          <span className="text-xs font-bold text-ink">مقهاك مختصّ أم شعبي؟</span>
          {(["specialty", "popular"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={flavor === f}
              onClick={() => setFlavor(f)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-xs font-bold",
                flavor === f ? "border-gold bg-gold/10 text-gold" : "border-line text-dim hover:text-ink"
              )}
            >
              {f === "specialty" ? "مختصّ" : "شعبي"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** شارة المقترح — على الأوّل وحده، فوق اسمه. «يناسب» لا «الأفضل لك». */
export function SuggestBadge({ on }: { on: boolean }) {
  if (!on) return null;
  return (
    <span className="mb-1 inline-flex rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-bold text-gold">
      يناسب نوع نشاطك
    </span>
  );
}

/** «يناسب: …» — تحت سطر الطابع في بطاقته. */
export function SuitsLine({ theme }: { theme: MenuTheme }) {
  if (!theme.suits?.length) return null;
  return <p className="mt-1 text-[10px] leading-snug text-dim">يناسب: {theme.suits.join(" · ")}</p>;
}
