/**
 * منيو تجريبي حيّ على `/demo`.
 *
 * يعيد استخدام `MenuPage` نفسها ببيانات محقونة — لا شبكة، ولا تتبّع مشاهدات،
 * ولا صف في قاعدة البيانات. العميل المحتمل يجرّب التجربة الحقيقية كاملة (بحث،
 * تصنيفات، تفاصيل الطبق، الإضافات، بطاقة الولاء) قبل أن يسجّل.
 *
 * `?kind=cafe|shaabi|truck|seafood|sweets|juice|burger|bakery|breakfast|grill|pizza` يفتح منيو نوع نشاطٍ آخر
 * (`lib/demoMenus.ts`) — صفحات الشرائح تفتح منيوها هي لا منيو مطعم الستيك.
 * و`?theme=` وحده يختار منيو عالم الطابع (`demoKindForSuits`).
 */
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getTheme, isHex, splitThemeId, themeBaseOf, themeIdOf } from "@/lib/themes";
import MenuPage, { type MenuData } from "./MenuPage";
import { CTA_PRIMARY } from "@/lib/facts";
import { demoData, demoKindForSuits } from "@/lib/demoMenus";

export default function Demo() {
  const [params] = useSearchParams();
  useEffect(() => {
    document.title = "منيو تجريبي — كلاود منيو";
  }, []);

  /**
   * `?theme=` يعاين أي طابع على منيو كامل.
   *
   * مُنتقي الطوابع في اللوحة يعرض بطاقة مصغّرة، وهي تكفي للمفاضلة السريعة لكنها
   * لا تُري التاجر منيواً حقيقياً بذلك الطابع قبل أن يطبّقه على منيوه أمام
   * زبائنه. القيمة تمرّ على `getTheme` كأي قيمة مخزَّنة، فالمعرّف المجهول يسقط
   * إلى الافتراضي ولا يكسر شيئاً.
   */
  const theme = params.get("theme")?.trim();
  // بلا `kind`: الطابع المعايَن وحده يختار منيو عالمه («مرفأ» ⇒ مطعم أسماك).
  const kind = params.get("kind") ?? (theme ? demoKindForSuits(getTheme(theme).suits, themeBaseOf(theme)) : null);
  const DEMO = useMemo(() => demoData(kind), [kind]);

  /**
   * هوية الزائر من صفحة الهبوط — اسمه وشعاره ولونه وطابعه، **من نفس الأصل وحده**.
   *
   * ⚠️ رسائل من أصلٍ آخر تُرمى: الإطار يقبل التعليمات من صفحتنا لا من أي
   * موقع يؤطّره. والشعار رابط `blob:` أنشأته الصفحة الأمّ من ملفٍّ على جهاز
   * الزائر — لا يُرفع إلى أي مكان، ولا يُقبل غيره (لا روابط خارجية تُحمَّل هنا).
   */
  const [brand, setBrand] = useState<{ name?: string; color?: string; theme?: string; logo?: string }>({});
  const embeddedParam = params.get("embed") === "1";
  useEffect(() => {
    if (!embeddedParam) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as Record<string, unknown> | null;
      if (!d || d.type !== "cm-brand") return;
      setBrand({
        name: typeof d.name === "string" ? d.name.trim().slice(0, 40) : undefined,
        color: typeof d.color === "string" && isHex(d.color) ? d.color : undefined,
        theme: typeof d.theme === "string" ? d.theme.slice(0, 24) : undefined,
        logo: typeof d.logo === "string" && d.logo.startsWith("blob:") ? d.logo : undefined,
      });
    };
    window.addEventListener("message", onMessage);
    // الأمّ لا تعرف متى صار الإطار جاهزاً للاستماع — فيُعلنها هو.
    window.parent?.postMessage({ type: "cm-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [embeddedParam]);

  const data: MenuData = useMemo(() => {
    const base = brand.theme ?? theme;
    if (!base && !brand.color && !brand.name && !brand.logo) return DEMO;
    return {
      ...DEMO,
      restaurant: {
        ...DEMO.restaurant,
        name: brand.name || DEMO.restaurant.name,
        // «مأكولات سعودية معاصرة» تحت «برجر البيت» تكذب — فتُخفى مع اسم الزائر.
        type: brand.name ? null : DEMO.restaurant.type,
        logo_image: brand.logo ?? DEMO.restaurant.logo_image,
      },
      menus: DEMO.menus.map((m) => ({
        ...m,
        theme: themeIdOf(splitThemeId(base ?? m.theme).base ?? "dark-gold", brand.color ?? splitThemeId(base).hex),
      })),
    };
  }, [DEMO, brand, theme]);

  /**
   * `?embed=1` — الديمو معروضاً داخل إطار جوّال في صفحة الهبوط.
   *
   * الشريط العلوي يشرح للزائر المستقلّ أن هذا عرض تجريبي ويعيده إلى التسجيل.
   * وداخل الإطار **يصير ضجيجاً**: القسم المحيط يقول إنه ديمو أصلاً، والشريط
   * يسرق ارتفاعاً من شاشة ضيّقة ويضع دعوةً ثانية تنافس دعوة الصفحة. فيُكبح،
   * ويبقى المنيو وحده — وهو المقصود بالعرض.
   */
  const embedded = embeddedParam;

  return (
    <div className="relative">
      {!embedded && (
        /* شريط علوي يوضّح أن هذا عرض تجريبي ويعيد الزائر إلى التسجيل.
           ⚠️ غير لاصق: شريط التصنيفات لاصقٌ على `top-0` أيضاً، فكان هذا يغطّيه
           طوال التصفّح — والزائر يرى منيواً بلا تصنيفات. */
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-line bg-panel px-4 py-2 text-center">
          <span className="text-xs font-bold text-dim">
            👋 هذا منيو تجريبي — جرّبه كما يراه زبونك تماماً.
          </span>
          <Link
            to="/login?mode=signup"
            className="inline-flex min-h-11 items-center text-xs font-black text-gold hover:underline"
          >
            {CTA_PRIMARY} →
          </Link>
        </div>
      )}

      <MenuPage demo={data} />
    </div>
  );
}
