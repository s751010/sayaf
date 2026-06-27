import {
  QrCode,
  Sparkles,
  BarChart3,
  Smartphone,
  Palette,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { PLANS, PRICE_UNIT_LABEL } from "@/lib/plans";

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
              <Button size="lg">ابدأ مجاناً الآن</Button>
              <Button variant="outline" size="lg">
                شاهد عرضاً حياً
              </Button>
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
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center font-display text-3xl font-bold md:text-4xl">
              باقات تناسب كل مطعم
            </h2>
            <p className="mt-3 text-center text-warm">أسعار شهرية بالريال السعودي</p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {PLANS.map((p) => (
                <Card
                  key={p.id}
                  className={
                    p.featured
                      ? "border-gold/40 bg-gold/[0.04] md:-translate-y-3"
                      : ""
                  }
                >
                  {p.featured && <Badge>الأكثر اختياراً</Badge>}
                  <h3 className="mt-3 text-xl font-bold text-cream">{p.name}</h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-black text-gold">
                      {formatPrice(p.price)}
                    </span>
                    <span className="text-sm text-warm">{PRICE_UNIT_LABEL}</span>
                  </div>
                  <ul className="mt-6 flex flex-col gap-3">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm text-cream">
                        <Check size={16} className="shrink-0 text-success" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={p.featured ? "gold" : "outline"}
                    className="mt-7 w-full"
                  >
                    اختر الباقة
                  </Button>
                </Card>
              ))}
            </div>
          </div>
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
            <Button size="lg" className="mt-8">
              أنشئ حسابك المجاني
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
