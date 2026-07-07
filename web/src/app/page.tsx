import {
  QrCode,
  Sparkles,
  BarChart3,
  Smartphone,
  Palette,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { PricingSection } from "@/components/site/pricing-section";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: QrCode, title: "QR كود فوري", desc: "أنشئ منيو رقمي وشاركه بكود QR لكل طاولة في دقائق." },
  { icon: Sparkles, title: "ذكاء اصطناعي", desc: "اقتراح أسعار ووصف للأصناف ومجلس استشاري ذكي لنمو مطعمك." },
  { icon: BarChart3, title: "إحصائيات حية", desc: "تابع أكثر الأصناف مشاهدةً وأداء قائمتك لحظياً." },
  { icon: Smartphone, title: "تجربة جوال أولاً", desc: "تصميم RTL سريع ومحسّن للهواتف، يفتح حتى مع إنترنت ضعيف." },
  { icon: Palette, title: "هوية مطعمك", desc: "شعار، ألوان، وروابط تواصل تعكس علامتك التجارية." },
  { icon: ShieldCheck, title: "مدفوعات آمنة", desc: "تكامل مع مدى وآبل باي عبر بوابة Moyasar السعودية." },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="relative overflow-hidden px-[var(--page-px,clamp(16px,5vw,60px))] py-20 md:py-28">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-gold/10 blur-3xl"
          />
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge>الأسرع نمواً للمطاعم السعودية</Badge>
            <h1 className="mt-6 font-display text-4xl font-black leading-tight md:text-6xl">
              منيو مطعمك الرقمي،
              <br />
              <span className="text-gradient">أذكى وأجمل.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-warm">
              أنشئ قائمة QR احترافية، أضف الأصناف بالذكاء الاصطناعي، وتابع
              أداء مطعمك لحظياً — بدون أي خبرة تقنية.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                ابدأ مجاناً الآن
              </Link>
              <a href="#features" className={buttonVariants({ variant: "outline", size: "lg" })}>
                اكتشف المميزات
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="px-[var(--page-px,clamp(16px,5vw,60px))] py-16"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
              كل ما يحتاجه مطعمك في مكان واحد
            </h2>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card key={f.title}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/12 text-gold">
                    <f.icon size={22} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-cream">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-warm">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="px-[var(--page-px,clamp(16px,5vw,60px))] py-16"
        >
          <PricingSection />
        </section>

        {/* CTA */}
        <section className="px-[var(--page-px,clamp(16px,5vw,60px))] py-16">
          <div className="mx-auto max-w-4xl rounded-3xl border border-line bg-gradient-to-br from-charcoal-2 to-charcoal-3 p-10 text-center md:p-16">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              جاهز تطلق منيو مطعمك؟
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-warm">
              انضم لمئات المطاعم السعودية التي تدير قوائمها رقمياً مع كلاود منيو.
            </p>
            <Link href="/login" className={`${buttonVariants({ size: "lg" })} mt-8`}>
              أنشئ حسابك المجاني
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
