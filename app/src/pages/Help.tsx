/**
 * صفحة المساعدة والتواصل `/help`.
 *
 * كانت `Billing.tsx` تحيل التاجر إلى «صفحة التواصل» وهي غير موجودة أصلاً،
 * و`Login.tsx` يذكر الشروط والخصوصية كنص بلا رابط. هذه الصفحة تسدّ الفجوتين
 * وتشرح الخطوات الأولى بلغة صاحب المطعم لا بلغة المطوّر.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { Navbar, Footer } from "@/components/site";

const STEPS = [
  {
    n: "١",
    title: "عرّفنا على مطعمك",
    body: "الاسم ورابط المنيو ونوع النشاط. الرابط هو ما سيفتحه زبونك، مثل cloudsmenu.netlify.app/aldiwan — اختره قصيراً وسهل النطق.",
  },
  {
    n: "٢",
    title: "أنشئ قائمة ثم أضف أطباقك",
    body: "من صفحة «القوائم» أنشئ قائمة (مثل: القائمة الرئيسية)، ثم من «الأطباق» أضف الأصناف. الاسم والسعر والقائمة فقط مطلوبة — البقية اختيارية.",
  },
  {
    n: "٣",
    title: "ارفع صور الأطباق",
    body: "اضغط «رفع صورة» واختر من جهازك. نصغّرها ونضغطها تلقائياً حتى يفتح المنيو بسرعة على بيانات الجوال. بدون صورة؟ اختر إيموجي مناسباً وسيظهر بدلاً منها.",
  },
  {
    n: "٤",
    title: "اطبع كود QR وضعه على الطاولات",
    body: "من صفحة «كود QR» نزّل الكود أو اطبع أكواداً مرقّمة لكل طاولة. الكود المرقّم يفتح المنيو ويحدّد رقم الطاولة تلقائياً.",
  },
];

const FAQ = [
  {
    q: "كيف أضيف إضافات للطبق (جبن إضافي، حجم كبير…)؟",
    a: "داخل محرر الطبق اضغط «＋ إضافة خيار»، اكتب اسم الإضافة وسعرها إن وُجد. اتركه فارغاً إن كانت الإضافة مجانية — ستظهر للزبون بدون سعر.",
  },
  {
    q: "ما مقاس الصورة المناسب؟",
    a: "أي مقاس يعمل — نصغّر الصورة تلقائياً. الأفضل صورة مربّعة للطبق وعريضة للغلاف، وبإضاءة جيدة. الحد الأقصى للملف ١٥ ميغابايت قبل الضغط.",
  },
  {
    q: "غيّرت السعر ولم يظهر التغيير للزبون",
    a: "المنيو يُحدَّث فوراً. لو كانت الصفحة مفتوحة على جوال الزبون من قبل، يكفي أن يسحبها للأسفل لإعادة التحميل.",
  },
  {
    q: "طبق أضفته لا يظهر في المنيو",
    a: "تأكد أن مفتاح «متاح الآن» مفعّل في صفحة الأطباق، وأن الطبق مربوط بقائمة نشطة من صفحة القوائم.",
  },
  {
    q: "كيف أفعّل الإنجليزية أو برنامج الولاء؟",
    a: "كلاهما ضمن باقة الاحترافية. بعد الاشتراك فعّلهما من صفحة «الإعدادات»، ثم أضف الأسماء الإنجليزية داخل محرر كل طبق.",
  },
  {
    q: "هل تُخصم مبالغ حقيقية الآن؟",
    a: "لا. المنصة تعمل حالياً بمفتاح دفع تجريبي، وستجد تنبيهاً واضحاً في صفحة الاشتراك. لن تُخصم أي مبالغ حتى تفعيل الدفع الحقيقي.",
  },
];

export default function Help() {
  useEffect(() => {
    document.title = "المساعدة — كلاود منيو";
  }, []);

  return (
    <div className="min-h-dvh">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-3xl font-black text-ink sm:text-4xl">
          المساعدة والتواصل
        </h1>
        <p className="mt-2 text-dim">
          كل ما تحتاجه لتشغيل منيوك — وإن لم تجد إجابتك، راسلنا مباشرة.
        </p>

        {/* البداية السريعة */}
        <h2 className="mt-10 font-display text-xl font-extrabold text-ink">
          البداية في ٤ خطوات
        </h2>
        <div className="mt-4 grid gap-3">
          {STEPS.map((s) => (
            <Card key={s.n} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/12 font-black text-gold">
                {s.n}
              </span>
              <div>
                <p className="font-bold text-ink">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-dim">{s.body}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/demo"
            className="inline-flex items-center justify-center rounded-xl border border-line-gold px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-gold/10"
          >
            👀 شاهد منيو تجريبي
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-on-gold transition-all active:scale-[0.98]"
          >
            الذهاب إلى لوحة التحكم
          </Link>
        </div>

        {/* الأسئلة الشائعة */}
        <h2 className="mt-12 font-display text-xl font-extrabold text-ink">
          أسئلة شائعة
        </h2>
        <div className="mt-4 space-y-2">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="rounded-2xl border border-line bg-panel px-5 py-4 [&[open]]:pb-5"
            >
              <summary className="cursor-pointer list-none font-bold text-ink marker:hidden">
                {f.q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-dim">{f.a}</p>
            </details>
          ))}
        </div>

        {/* التواصل */}
        <h2 className="mt-12 font-display text-xl font-extrabold text-ink">
          لم تجد إجابتك؟
        </h2>
        <Card className="mt-4">
          <p className="text-sm leading-relaxed text-dim">
            راسلنا وسنرد في أقرب وقت. أرفق اسم مطعمك ورابط منيوك حتى نصل للمشكلة
            أسرع.
          </p>
          <a
            href="mailto:support@cloudsmenu.app?subject=%D8%B7%D9%84%D8%A8%20%D8%AF%D8%B9%D9%85%20%E2%80%94%20%D9%83%D9%84%D8%A7%D9%88%D8%AF%20%D9%85%D9%86%D9%8A%D9%88"
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-on-gold transition-all active:scale-[0.98]"
          >
            ✉️ راسل الدعم
          </a>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
