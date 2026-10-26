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
import { aliasType } from "@/lib/starterMenus";
import { cafeFlavor, rankThemes, type CafeFlavor } from "@/lib/themeSuggest";
import { cn } from "@/lib/utils";

export function useThemeOrder(rawType: string | null | undefined) {
  const [flavor, setFlavor] = useState<CafeFlavor>(() => cafeFlavor(rawType));
  const order = rankThemes(DESIGN_THEMES, rawType, flavor);
  const type = aliasType(rawType);
  const typeLabel = order.isCafe ? (flavor === "popular" ? "كافيه شعبي" : "كافيه مختصّ") : type;
  return { ...order, flavor, setFlavor, typeLabel };
}

/** سطر الترتيب تحت عنوان «طابع منيوك»، وسؤال الكافيه. */
export function ThemeOrderNote({
  typeLabel,
  isCafe,
  flavor,
  setFlavor,
}: {
  typeLabel: string;
  isCafe: boolean;
  flavor: CafeFlavor;
  setFlavor: (f: CafeFlavor) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-xs text-dim">
        رتّبناها حسب نوع نشاطك ({typeLabel}) — والقرار لك، وكلّها متاحة.
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
