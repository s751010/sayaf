/**
 * منيو تجريبي حيّ على `/demo`.
 *
 * يعيد استخدام `MenuPage` نفسها ببيانات محقونة — لا شبكة، ولا تتبّع مشاهدات،
 * ولا صف في قاعدة البيانات. العميل المحتمل يجرّب التجربة الحقيقية كاملة (بحث،
 * تصنيفات، تفاصيل الطبق، الإضافات، بطاقة الولاء) قبل أن يسجّل.
 *
 * `?kind=cafe|shaabi|truck|seafood|sweets|juice|burger|bakery|breakfast|grill|pizza|qahwa|espresso|karak|teahouse|broast|icecream|sushi|manakish` يفتح منيو نوع نشاطٍ آخر
 * (`lib/demoMenus.ts`) — صفحات الشرائح تفتح منيوها هي لا منيو مطعم الستيك.
 * و`?theme=` وحده يختار منيو عالم الطابع (`demoKindForSuits`).
 *
 * وفوقه شريط الأقسام (`DemoPicker`، ٠٧/١١): يختار الزائر نوع مطعمه فيكتب الشريط
 * `?kind=` و`?theme=` نفسيهما — لا معامل ثالث، والمعاملان يعملان كما كانا. والقسم
 * المُضاء يُقرأ منهما (`demoCategoryOf`).
 */
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getTheme, isHex, splitThemeId, themeBaseOf, themeIdOf } from "@/lib/themes";
import MenuPage, { type MenuData } from "./MenuPage";
import { CTA_PRIMARY } from "@/lib/facts";
import { demoData, demoKindForSuits, isDemoKind, type DemoKind } from "@/lib/demoMenus";
import { demoCategoryOf, type ThemeCategory } from "@/lib/themeCategories";
import { DemoPicker } from "@/components/DemoPicker";

export default function Demo() {
  const [params, setParams] = useSearchParams();
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
  /**
   * نوع المنيو من الهبوط برسالة (`cm-brand.kind`، ٢٠٢٦/١١/١١): «وش نوع مطعمك؟» يبدّل
   * منيو الجوّال **بلا إعادة تحميل الإطار** — تغيير `src` كان يبني التطبيق كلّه ثانيةً
   * مع كل نقرة. ولا يُقبل إلا نوعٌ معروف (`isDemoKind`).
   */
  const [msgKind, setMsgKind] = useState<DemoKind | null>(null);
  // بلا `kind`: الطابع المعايَن وحده يختار منيو عالمه («مرفأ» ⇒ مطعم أسماك).
  const kind =
    msgKind ?? params.get("kind") ?? (theme ? demoKindForSuits(getTheme(theme).suits, themeBaseOf(theme)) : null);
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
    /**
     * «لمحة»: جولة الهبوط تمرّر المنيو قليلاً ثم تعيده — فيُرى الطابع **يتحرّك**
     * (طبقة `skinMotion` تقرأ التمرير) لا لقطةً ساكنة. ولا لمحة لمن طلب تقليل الحركة.
     */
    let back: number | undefined;
    const peek = () => {
      if (!window.matchMedia || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
      window.clearTimeout(back);
      window.scrollTo({ top: 260, behavior: "smooth" });
      back = window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 1500);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as Record<string, unknown> | null;
      if (d?.type === "cm-peek") return peek();
      if (!d || d.type !== "cm-brand") return;
      if (typeof d.kind === "string" && isDemoKind(d.kind)) setMsgKind(d.kind);
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
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(back);
    };
  }, [embeddedParam]);

  const data: MenuData = useMemo(() => {
    const base = brand.theme ?? theme;
    /**
     * داخل إطار الهبوط **لا ساعات عمل**: الإطار واجهة المنتج، وزائرٌ يفتح الهبوط
     * الثالثة فجراً كان يرى «يفتح 13:00 · مغلق للطلبات الآن» بلا زرّ إضافة — منيو
     * مطفأ في أوّل شاشة. وبلا ساعات يبقى الطلب مفتوحاً (`?? true` في `MenuPage`)
     * ولا تُعرض حالةٌ أصلاً — فلا ساعة مزيّفة ولا «مفتوح الآن» مدّعاة.
     */
    const hours = embeddedParam ? null : DEMO.restaurant.working_hours;
    if (!base && !brand.color && !brand.name && !brand.logo) {
      return embeddedParam ? { ...DEMO, restaurant: { ...DEMO.restaurant, working_hours: hours } } : DEMO;
    }
    return {
      ...DEMO,
      restaurant: {
        ...DEMO.restaurant,
        working_hours: hours,
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
  }, [DEMO, brand, theme, embeddedParam]);

  /**
   * `?embed=1` — الديمو معروضاً داخل إطار جوّال في صفحة الهبوط.
   *
   * الشريط العلوي يشرح للزائر المستقلّ أن هذا عرض تجريبي ويعيده إلى التسجيل.
   * وداخل الإطار **يصير ضجيجاً**: القسم المحيط يقول إنه ديمو أصلاً، والشريط
   * يسرق ارتفاعاً من شاشة ضيّقة ويضع دعوةً ثانية تنافس دعوة الصفحة. فيُكبح،
   * ويبقى المنيو وحده — وهو المقصود بالعرض.
   */
  const embedded = embeddedParam;

  /**
   * الإطار يُعرَف بـ`?embed=1` (`PhoneMenu` في الهبوط وصفحات الشرائح) — وبأنه إطارٌ
   * فعلاً احتياطاً: شريط الأقسام **لا يُرسم داخل جوّال البطل** أيّاً كان رابطه، فهناك
   * مُنتقي الطابع حوله، وشريطٌ ثانٍ في شاشةٍ مصغّرة يسرق نصفها.
   */
  const framed = embedded || (typeof window !== "undefined" && window.self !== window.top);

  /** الطابع المعروض فعلاً: المعامل، أو طابع منيو النوع. */
  const shownTheme = themeBaseOf(theme ?? DEMO.menus[0]?.theme);
  // بلا معاملٍ إطلاقاً لا قسم: «الديوان» منيو الهبوط، لا «راقي ومناسبات» مختاراً عن الزائر.
  const category = params.has("kind") || theme ? demoCategoryOf(kind, shownTheme) : null;
  const pick = (cat: ThemeCategory, themeId: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("kind", cat.kind);
        next.set("theme", themeId);
        return next;
      },
      { replace: true }
    );

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

      {!framed && <DemoPicker category={category} theme={shownTheme} onPick={pick} />}

      {/* منيو نوعٍ آخر شجرةٌ جديدة: سلّةٌ وتصنيفٌ مفتوح من منيو المخبز لا يبقيان في منيو البحري. */}
      <MenuPage key={kind ?? "restaurant"} demo={data} />
    </div>
  );
}
