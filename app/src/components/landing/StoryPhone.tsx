/**
 * جوّال القصّة — **أربع محطّات من المنتج نفسه، لا صور** (طلب المالك ٢٠٢٦/١١/١١).
 *
 * ═══ لماذا مكوّنات لا إطار ═══
 *
 * إطار `/demo` نسخةٌ ثانية من التطبيق كلّه، وكان وحده كلّ زمن الحجب في الهبوط
 * (#64). فالصفحة تحمل **إطاراً واحداً** (البطل)، والقصّة تُرسم بقطع المنيو
 * الحقيقية: `DishCard` (بشارة «الأكثر طلباً» وعلامة الملح) · `CartBar` ·
 * `LoyaltyProgress` · `NutritionLabel` — بطابع الزائر نفسه (`theme.vars`)،
 * وأطباق منيو نوعه (`demoData`). فما يُرى هنا هو ما سيراه زبونه.
 *
 * والملفّ كسول: يُجلب حين تقترب القصّة (`useNearViewport` في الهبوط)، ومعه
 * `menu-skins.css` الذي تلبسه البطاقات — لا يدفعه زائرٌ لم يبلغ القسم.
 *
 * ═══ الحركة ═══
 *
 * المحطّة تتبدّل بـ`data-on` (يكتبه مراقبٌ واحد في الهبوط، لا مستمع تمرير)،
 * والانتقال CSS داخل `no-preference` (`styles/landing.css`). وما «يشتغل» داخل
 * المحطّة (السلّة تمتلئ، الختم يُضاف) خطواتٌ بمؤقّتات قصيرة **حين تُفتح المحطّة
 * وحدها** — ومع تقليل الحركة تظهر بحالتها الأخيرة مباشرة.
 */
import "@/styles/menu-skins.css";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { DishCard } from "@/components/menu/DishCard";
import { CartBar } from "@/components/menu/Cart";
import { LoyaltyProgress } from "@/components/menu/LoyaltyProgress";
import { NutritionLabel } from "@/components/NutritionLabel";
import { demoData, type DemoKind } from "@/lib/demoMenus";
import { getTheme, type MenuDesign } from "@/lib/themes";
import { burnMinutes, isHighSodium } from "@/lib/nutrition";
import { Icon } from "@/lib/icons";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/types";

const calm = () =>
  typeof window === "undefined" || !window.matchMedia || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

/** خطواتٌ تُعدّ حين تُفتح المحطّة — ومع تقليل الحركة آخرُها فوراً. */
function useSteps(on: boolean, last: number, ms: number): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return setN(0);
    if (calm()) return setN(last);
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= last) window.clearInterval(t);
    }, ms);
    return () => window.clearInterval(t);
  }, [on, last, ms]);
  return n;
}

const noop = () => {};

export default function StoryPhone({ active, themeId, kind }: { active: number; themeId: string; kind: DemoKind }) {
  const theme = getTheme(themeId);
  const data = useMemo(() => demoData(kind), [kind]);
  const dishes = useMemo(
    () => data.dishes.filter((d) => d.available !== false && (d.price ?? 0) > 0),
    [data]
  );
  const name = data.restaurant.name;
  const grid: MenuDesign = { ...theme.design, layout: "grid" };
  const list: MenuDesign = { ...theme.design, layout: "list" };

  // ١: طبقان بارزان — المميّز أوّلاً، و«الأكثر طلباً» على الثاني.
  const featured = dishes.find((d) => d.featured) ?? dishes[0];
  const shelf = [featured, ...dishes.filter((d) => d !== featured)].filter(Boolean).slice(0, 4) as Dish[];

  // ٢: الزبون يضيف طبقين ⇒ السلّة تمتلئ ⇒ الدفع.
  const cartSteps = useSteps(active === 1, 3, 700);
  const picks = shelf.slice(0, 2);
  const cartCount = Math.min(cartSteps, 2);
  const cartTotal = picks.slice(0, cartCount).reduce((a, d) => a + (d.price ?? 0), 0);

  // ٣: ختمٌ جديد يُضاف — من ٢ إلى ٣ من خمسة.
  const stampSteps = useSteps(active === 2, 1, 900);

  // ٤: طبقٌ بقيمه — والصوديوم فوق حدّ الهيئة (٢٠٠٠ ملغم) فتظهر علامة الملح.
  const salty: Dish | undefined = shelf[1] ?? shelf[0];
  const labelled: Dish | undefined = salty && {
    ...salty,
    calories: salty.calories ?? 640,
    sodium_mg: 2150,
    caffeine_mg: null,
    allergens: salty.allergens?.length ? salty.allergens : ["gluten", "milk"],
  };

  const vars = { ...theme.vars, background: "var(--m-bg)", color: "var(--m-text)" } as CSSProperties;

  return (
    <div className="story-screen absolute inset-0 overflow-hidden text-start" dir="rtl" style={vars} aria-hidden="true">
      {/* الترويسة الثابتة: اسم المطعم بطابعه — تبقى والمحطّات تتبدّل تحتها. */}
      <div className="flex items-center gap-2 border-b px-3 pb-2 pt-7" style={{ borderColor: "var(--m-border)" }}>
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black"
          style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
        >
          {name.trim().charAt(0)}
        </span>
        <p className="min-w-0 truncate text-sm font-black" style={{ fontFamily: "var(--m-display, var(--m-font))" }}>
          {name}
        </p>
        <span className="ms-auto rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--m-surface)" }}>
          طاولة ٧
        </span>
      </div>

      {/* ١. يعرض أطباقك */}
      <div className="story-station" data-on={active === 0 || undefined}>
        <div className="grid grid-cols-2 gap-2 p-3">
          {shelf.map((d, i) => (
            <DishCard key={d.id} dish={d} en={false} design={grid} popular={i === 1} onOpen={noop} />
          ))}
        </div>
      </div>

      {/* ٢. يطلب ويدفع */}
      <div className="story-station" data-on={active === 1 || undefined}>
        <div className="flex flex-col gap-2 p-3">
          {picks.map((d, i) => (
            <div key={d.id} className="relative">
              <DishCard dish={d} en={false} design={list} onOpen={noop} />
              <span
                className="story-pop absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full"
                data-on={cartSteps > i || undefined}
                style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
              >
                <Icon name="check" size={14} />
              </span>
            </div>
          ))}
        </div>
        <div className="story-sheet absolute inset-x-0 bottom-0 px-3 pb-3" data-on={cartSteps >= 3 || undefined}>
          <div className="rounded-[16px] border p-3" style={{ background: "var(--m-surface)", borderColor: "var(--m-border)" }}>
            <p className="text-xs font-black">الدفع — {formatPrice(cartTotal)} ر.س</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] font-bold">
              <span className="flex h-9 items-center justify-center rounded-[10px] bg-black text-white">Apple Pay</span>
              <span className="flex h-9 items-center justify-center rounded-[10px] border" style={{ borderColor: "var(--m-border)" }}>
                مدى
              </span>
            </div>
            <p className="mt-2 text-[10px] opacity-75">يصل المبلغ حساب المطعم مباشرة.</p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0" style={{ visibility: cartSteps >= 3 ? "hidden" : undefined }}>
          {cartCount > 0 && <CartBar count={cartCount} total={cartTotal} en={false} onOpen={noop} prepMinutes={15} />}
        </div>
      </div>

      {/* ٣. يرجّع لك الزبون */}
      <div className="story-station" data-on={active === 2 || undefined}>
        <div className="p-3">
          <div className="rounded-[16px] border p-4 text-center" style={{ background: "var(--m-surface)", borderColor: "var(--m-border)" }}>
            <p className="text-[11px] font-bold opacity-75">رقم طلبك</p>
            <p className="mt-1 text-4xl font-black" style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
              27
            </p>
            <p className="mt-1 text-xs font-bold">جاهزٌ خلال ١٥ دقيقة تقريباً</p>
            <div className="text-start">
              <LoyaltyProgress
                loyalty={{ stamps: 2 + stampSteps, goal: 5, reward: "مشروبٌ عليك", card_code: null }}
                en={false}
              />
            </div>
          </div>
          <p className="story-pop mt-3 text-center text-[11px] font-bold" data-on={stampSteps > 0 || undefined}>
            +١ ختم — بلا تطبيق ولا بطاقة ورقية
          </p>
        </div>
      </div>

      {/* ٤. جاهز لاشتراطات الهيئة */}
      <div className="story-station" data-on={active === 3 || undefined}>
        {labelled && (
          <div className="flex flex-col gap-2 p-3">
            <DishCard dish={labelled} en={false} design={list} onOpen={noop} />
            <div className="origin-top scale-[.86]">
              <NutritionLabel
                values={{
                  kcal: labelled.calories,
                  sodium: labelled.sodium_mg,
                  caffeine: null,
                  burnMinutes: burnMinutes(labelled.calories),
                  highSodium: isHighSodium(labelled.sodium_mg),
                  allergens: labelled.allergens ?? [],
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
