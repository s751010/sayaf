/**
 * «كلفة التحويل» — الاعتراضان اللذان يمنعان الاشتراك ولا تجيبهما الصفحة.
 *
 * ═══ لماذا وُجد هذا القسم ═══
 *
 * صاحب مطعم لا يمتنع عن الاشتراك لأن المنتج ناقص، بل لأن **الانتقال** يبدو
 * مكلفاً. وسؤالاه دائماً:
 *
 *   ١) «كم ساعة حتى يشتغل؟» — والصفحة تقول «تجهيز في دقائق» شريحةً عائمة بلا
 *      آلية. والمنتج يملك آليتين حقيقيتين ولا يسمّيهما: `StarterMenu` (قائمة
 *      بداية حسب نوع النشاط) و`lib/import.ts` (لصق المنيو من Excel أو CSV —
 *      وتعليقه نفسه يقول إن إدخال ستّين صنفاً يدوياً أكبر سبب تسرّب في المنتج).
 *
 *   ٢) «وأكوادي المطبوعة على الطاولات؟» — وهذا **أخطر ما لا تقوله الصفحة**.
 *      الجواب ليس وعداً تسويقياً بل ضمانٌ في قاعدة البيانات: `changeSlug` تمرّ
 *      حصراً بدالة `change_restaurant_slug` التي تسجّل الاسم القديم بديلاً **في
 *      نفس المعاملة**، وتريجر يرفض أي تغيير لا يمرّ بها. و`isSlugTaken` تفحص
 *      البدائل أيضاً فلا يأخذ أحدٌ اسماً يحوّل اليوم إلى مطعم آخر. ودالة الحافة
 *      تعرف البديل قبل أن تُقلع الواجهة أصلاً.
 *
 * ⚠️ لا يُذكر للزائر اسم جدول ولا دالة. الشيفرة تحمل مصدر الادّعاء، والصفحة
 * تحمل الادّعاء وحده — نفس عرف `facts.ts` في هذا المستودع.
 */
import { Icon } from "@/lib/icons";
import { Reveal } from "./Reveal";

type Objection = {
  fear: string;
  answer: string;
  body: string;
  icon: "clock" | "qr" | "pulse";
  points: string[];
};

const OBJECTIONS: Objection[] = [
  {
    fear: "«ما عندي وقت أدخل ستّين صنفاً»",
    answer: "ابدأ بقائمة جاهزة، أو الصق منيوك كما هو",
    body: "اختر نوع مطعمك فتُملأ قائمة بداية بالأصناف الشائعة، واحذف ما لا تبيعه. أو انسخ منيوك من Excel والصقه مباشرة — نقرأ الأعمدة ونرتّبها ونعرضها عليك للمراجعة قبل الحفظ.",
    icon: "clock",
    points: ["قائمة بداية حسب نوع النشاط", "لصق من Excel أو ملف CSV", "مراجعة قبل الحفظ لا بعده"],
  },
  {
    fear: "«أكوادي مطبوعة على الطاولات — لو تغيّر شيء تروح»",
    answer: "غيّر اسم رابطك متى شئت. الكود المطبوع يبقى يعمل",
    body: "حين تغيّر رابط منيوك، يُحفظ القديم بديلاً دائماً ويظلّ يفتح منيوك الجديد. وهذا مضمون في قاعدة البيانات نفسها لا مربوطاً بأن نتذكّره — لا يمكن أن يتغيّر رابط دون أن يُسجَّل بديله.",
    icon: "qr",
    points: ["الرابط القديم يحوّل إلى الجديد", "بلا إعادة طباعة ولا ملصقات", "ولا يأخذ أحدٌ رابطك القديم"],
  },
  {
    fear: "«وكل ما يتغيّر سعر أطبع من جديد؟»",
    answer: "لا. غيّر السعر من جوالك ويظهر فوراً",
    body: "سعرٌ ارتفع، أو صنف نفد، أو منيو رمضان — تعدّله من اللوحة فيراه الزبون في مسحته التالية. الورق يُطبع مرّة واحدة، والمنيو يتغيّر كل يوم.",
    icon: "pulse",
    points: ["تحديث فوري بلا كود جديد", "إخفاء صنف نفد بضغطة", "قوائم موسمية بنافذة زمنية"],
  },
];

export function SwitchCost() {
  return (
    <section className="border-t border-line bg-panel/40 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <p className="text-[0.8125rem] font-semibold text-gold">من الورق إلى الكود</p>
          <h2 className="mt-3 max-w-[24ch] font-display text-3xl font-black leading-tight text-ink sm:text-4xl">
            الانتقال أرخص ممّا تظنّ
          </h2>
          <p className="mt-4 max-w-[58ch] text-lg leading-[1.85] text-dim">
            ثلاثة أشياء يخافها كل صاحب مطعم قبل أن يبدّل منيوه. هذه إجاباتها
            بلا تجميل.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {OBJECTIONS.map((o, i) => (
            <Reveal key={o.answer} delay={i * 90}>
              <article className="flex h-full flex-col rounded-2xl border border-line bg-panel p-6">
                {/* الخوف أولاً وبخطّ خافت — ثم الجواب عريضاً. نمط اعتراض/جواب
                    لا نمط ميزة، لأن القارئ يبحث عن اعتراضه لا عن مزايانا. */}
                <p className="text-sm leading-relaxed text-dim">{o.fear}</p>

                <div className="mt-4 flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-xl border border-line-gold p-2 text-gold">
                    <Icon name={o.icon} size={20} />
                  </span>
                  <h3 className="font-display text-lg font-extrabold leading-snug text-ink">
                    {o.answer}
                  </h3>
                </div>

                <p className="mt-3 text-[0.95rem] leading-[1.8] text-dim">{o.body}</p>

                <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
                  {o.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-ink">
                      <span className="mt-0.5 shrink-0 text-good">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
