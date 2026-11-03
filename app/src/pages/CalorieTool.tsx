/**
 * `/tools/calorie-calculator` — **حاسبة السعرات مجاناً، بلا تسجيل**.
 *
 * ═══ لماذا صفحة مستقلّة والحاسبة في الهبوط أصلاً ═══
 *
 * من يبحث في قوقل عن «حاسبة سعرات المنيو» أو «كم سعرة في لاتيه» يريد الأداة
 * نفسها لا صفحة تسويق: صفحةٌ عنوانها الأداة تُفهرَس على هذا البحث، والهبوط
 * لا يُفهرَس عليه. وكل من يستعملها صاحب مطعم يواجه الاشتراط نفسه الذي نبيع حلّه.
 *
 * ⚠️ **مساران لا مسار**: `/tools/<أداة>` مقطعان، و`slugFromRequest` لا يقرأ
 * منيواً إلا من مقطعٍ واحد — فلا يصطدم برابط مطعم ولا يحتاج حجزاً في
 * `shared/menu-url.mjs` (قائمة حمراء). وكذلك لا رابط إلى `/tools` وحدها.
 *
 * الحاسبة هي `HeroCalculator` نفسها (كسولة، و`motion` فيها وحدها).
 */
import { Suspense, lazy } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Card } from "@/components/ui";
import { useSeo } from "@/lib/seo";
import { STATIC_SEO } from "@/lib/routeSeo";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/lib/facts";
import { INGREDIENTS } from "@/lib/ingredients";
import { DAILY_CAFFEINE_MAX_MG, DAILY_KCAL } from "@/lib/nutrition";

const HeroCalculator = lazy(() =>
  import("@/components/landing/HeroCalculator").then((m) => ({ default: m.HeroCalculator }))
);

/** ارتفاعٌ محجوز قبل أن تصل الحاسبة الكسولة — كي لا تقفز الصفحة تحت القارئ. */
const CALC_MIN_H = "min-h-[850px] md:min-h-[480px]";

const NUM = (n: number) => n.toLocaleString("ar-SA-u-nu-latn");

export default function CalorieTool() {
  useSeo(STATIC_SEO.calories);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-20 pt-10">
        <p className="text-sm font-bold text-gold">أداة مجانية — بلا تسجيل</p>
        <h1 className="mt-2 font-display text-3xl font-black leading-tight text-ink sm:text-4xl">
          حاسبة السعرات الحرارية لأصناف المنيو
        </h1>
        <p className="mt-3 max-w-[62ch] text-lg leading-relaxed text-dim">
          اكتب وصفة الصنف كما تقولها، مثل «شوتين إسبريسو، حليب ٢٠٠ مل»، فتطلع لك السعرات والدهون والسكريات
          والصوديوم والكافيين على ملصقٍ بنمط هيئة الغذاء. الحساب يجري في متصفّحك، ولا نحفظ ما تكتبه.
        </p>

        <div className={`mt-8 min-w-0 ${CALC_MIN_H}`}>
          <Suspense fallback={<div className={`skeleton mx-auto max-w-4xl rounded-[20px] ${CALC_MIN_H}`} />}>
            <HeroCalculator />
          </Suspense>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Card className="grid gap-3">
            <h2 className="font-display text-xl font-bold text-ink">ماذا تطلب هيئة الغذاء في المنيو؟</h2>
            <ul className="grid list-disc gap-2 ps-5 text-[15px] leading-relaxed text-dim">
              <li>السعرات الحرارية لكل صنف.</li>
              <li>علامة الملح على الصنف الذي يزيد صوديومه عن ٦٠٠ ملغم.</li>
              <li>كمية الكافيين في المشروبات.</li>
              <li>
                جملة الاحتياج اليومي: {NUM(DAILY_KCAL)} سعرة للبالغ، وحدّ {NUM(DAILY_CAFFEINE_MAX_MG)} ملغم
                كافيين.
              </li>
              <li>وتشمل المنيو المطبوع والرقمي ومنيو QR وتطبيقات التوصيل.</li>
            </ul>
          </Card>
          <Card className="grid gap-3">
            <h2 className="font-display text-xl font-bold text-ink">كيف نحسب؟</h2>
            <p className="text-[15px] leading-relaxed text-dim">
              لكل مكوّن من {NUM(INGREDIENTS.length)} مكوّناً قيمه لكل ١٠٠ غرام من قاعدة USDA FoodData Central.
              نحوّل الكمية التي كتبتها (مل، غرام، ملعقة، حبّة، شوت) إلى غرامات، ثم نجمع قيم المكوّنات.
            </p>
            <p className="text-[15px] leading-relaxed text-dim">
              الأرقام تقديرٌ من الوصفة لا تحليل مختبر، ويُستحسن أن يراجعها أخصّائي تغذية. والمسؤولية النظامية
              عن المنيو على المنشأة.
            </p>
          </Card>
        </div>

        <Card className="mt-5 grid gap-4 border-gold/30 bg-gold/[.05] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-ink">لكل أصناف منيوك مرّةً واحدة</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-dim">
              في كلاود منيو تُحفظ الأرقام على كل صنف، وتظهر وحدها في منيو QR، وفي المنيو المطبوع A4، وفي ملفّ
              تطبيقات التوصيل، مع قائمةٍ تقول لك ما ينقصك قبل التفتيش.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login?mode=signup"
              className="press inline-flex min-h-12 items-center rounded-[12px] bg-gold px-6 font-bold text-on-gold hover:bg-gold2"
            >
              {CTA_PRIMARY}
            </Link>
            <Link
              to="/demo?kind=cafe"
              className="press inline-flex min-h-12 items-center rounded-[12px] border border-line bg-panel px-5 font-bold text-ink hover:border-ink/35"
            >
              {CTA_SECONDARY}
            </Link>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
