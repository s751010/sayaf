/**
 * صفحة شريحة — `/for/<slug>`: الكافيه المختصّ · المطعم الشعبي · عربة الطعام.
 *
 * ═══ لماذا صفحةٌ لكل شريحة ═══
 *
 * الهبوط يكلّم «المطاعم والمقاهي» كلّها بجملة واحدة، وصاحب المحمصة يقرأ فيها
 * مشاوي، وصاحب العربة يقرأ فيها طاولات. هنا يرى كلٌّ منهم **منتجنا كما هو اليوم**
 * من زاويته: الطوابع التي يضعها له المُنتقي أوّلاً، والمزايا التي تخصّه، وفعلاً
 * واحداً: التسجيل.
 *
 * ═══ ما يحرسها ═══
 *
 * - المحتوى في `lib/segments.ts`، ولكل وعدٍ دليلٌ في الشيفرة يفحصه
 *   `segments.test.ts`. والطوابع من `SUGGESTED` لا منسوخة.
 * - السعر من `lib/plans.ts`، والنداء من `lib/facts.ts` (`landing-cta.test.ts`).
 * - الصفحة كسولة (`App.tsx`)، و`motion` لا تدخلها — الحركة `Reveal` بـCSS داخل
 *   `prefers-reduced-motion: no-preference`.
 *
 * والجوّال هو `PhoneMenu` نفسه من الهبوط: المنيو التجريبي الحقيقي في إطار،
 * يلبس الطابع الذي يختاره الزائر من الثلاثة.
 */
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Reveal } from "@/components/landing/Reveal";
import { DEFAULT_BRAND, PhoneMenu, type Brand } from "@/components/landing/LiveMenu";
import { daysLabel, useTrialDays } from "@/components/landing/PricingCards";
import { CTA_PRIMARY } from "@/lib/facts";
import { Icon } from "@/lib/icons";
import { CURRENCY, PLAN } from "@/lib/plans";
import { useSeo } from "@/lib/seo";
import { segmentBySlug, segmentThemes, type Segment } from "@/lib/segments";
import { SEGMENT_LINKS, segmentPath } from "@/lib/segmentLinks";
import { SETUP_STEPS } from "@/lib/setup";
import { STATIC_POSTS } from "@/lib/articles";
import { cn, formatPrice } from "@/lib/utils";
import NotFound from "./NotFound";

/** مسار التسجيل — الفعل الوحيد في الصفحة (`e2e/segments.spec.ts` يتبعه). */
const SIGNUP_PATH = "/login?mode=signup";

export default function SegmentRoute() {
  const { segment } = useParams();
  const seg = segmentBySlug(segment);
  // ⚠️ `key`: التنقّل بين شريحتين من الذيل يُبقي المكوّن نفسه، فيبقى طابع
  // الشريحة السابقة في الجوّال. المفتاح يعيد الحالة من أوّلها.
  return seg ? <SegmentPage key={seg.slug} seg={seg} /> : <NotFound />;
}

function SignupButton({ className }: { className?: string }) {
  return (
    <Link
      to={SIGNUP_PATH}
      className={cn(
        "press inline-flex min-h-12 items-center rounded-[12px] bg-gold px-7 font-bold text-on-gold shadow-[0_10px_30px_-10px_var(--c-glow)] hover:bg-gold2",
        className
      )}
    >
      {CTA_PRIMARY}
    </Link>
  );
}

function SegmentPage({ seg }: { seg: Segment }) {
  const themes = segmentThemes(seg);
  const [brand, setBrand] = useState<Brand>({ ...DEFAULT_BRAND, theme: themes[0]?.id ?? DEFAULT_BRAND.theme });
  const current = themes.find((t) => t.id === brand.theme) ?? themes[0];
  const trial = daysLabel(useTrialDays());
  const reading = seg.articles
    .map((slug) => STATIC_POSTS.find((p) => p.slug === slug))
    .filter((p): p is (typeof STATIC_POSTS)[number] => !!p);
  const others = SEGMENT_LINKS.filter((l) => l.slug !== seg.slug);
  const path = segmentPath(seg.slug);

  useSeo({ title: seg.seoTitle, description: seg.seoDescription, path, image: "/og.png" });

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="flex-1">
        {/* البطل — الوعد بلغة الشريحة، ومنيوٌ حقيقي بطابعها. */}
        <section className="glow-bg relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-10 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-14">
            <div className="min-w-0 text-center lg:text-start">
              <p className="anim-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-panel/70 px-3.5 py-1.5 text-xs font-semibold text-dim">
                <span className="h-1.5 w-1.5 rounded-full bg-sadu" aria-hidden="true" />
                {seg.label}
              </p>
              <h1 className="font-display text-[2.1rem] font-bold leading-[1.25] text-ink sm:text-[3rem]">
                {seg.headline}
              </h1>
              <p className="anim-fade-up mx-auto mt-5 max-w-[46ch] text-lg leading-[1.8] text-dim lg:mx-0">
                {seg.lede}
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 lg:items-start">
                <SignupButton />
                <p className="text-sm text-dim">
                  {trial} مجاناً — بلا بطاقة بنكية · ثم {formatPrice(PLAN.monthly)} {CURRENCY} شهرياً
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <PhoneMenu brand={brand} />
              {/* بعرض الجوّال تقريباً، وكافٍ لأطول اسم («لوحة حروف») بلا قصّ. */}
              <div className="mx-auto mt-5 w-full max-w-[340px]">
                <p className="text-center text-xs font-bold text-dim">
                  المنيو التجريبي بطابع «{current?.name}» — مرّره وافتح أي صنف
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="طابع المعاينة">
                  {themes.map((t) => {
                    const on = brand.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setBrand((b) => ({ ...b, theme: t.id }))}
                        title={t.tagline}
                        className={cn(
                          "press flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-[11px] border px-1 text-[13px] font-bold transition-colors",
                          on ? "border-ink bg-ink text-page" : "border-line bg-panel text-dim hover:text-ink"
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 shrink-0 rounded-full"
                          style={{ background: t.vars["--m-bg"], boxShadow: `inset 0 0 0 3px ${t.vars["--m-accent"]}` }}
                        />
                        <span className="truncate">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
                {current && <p className="mt-2 text-center text-xs leading-relaxed text-faint">{current.tagline}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* ما يهمّ الشريحة — كل سطرٍ ميزةٌ قائمة اليوم (`segments.test.ts`). */}
        <section className="border-y border-line bg-panel/60">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <Reveal className="mx-auto mb-10 max-w-2xl text-center">
              <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-12 bg-[linear-gradient(to_left,var(--c-rule)_70%,var(--c-sadu)_70%)]" />
              <h2 className="font-display text-3xl font-bold leading-[1.3] text-ink">ما يهمّ {seg.audience}</h2>
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {seg.features.map((f, i) => (
                <Reveal key={f.title} delay={(i % 3) * 70} className="h-full">
                  <div className="flex h-full flex-col rounded-[18px] border border-line bg-panel p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-gold/12 text-gold">
                      <Icon name={f.icon} size={21} />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-ink">{f.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-dim">{f.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* من التسجيل إلى منيو منشور — خطوات «إعداد منيوك» نفسها (`lib/setup.ts`). */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <Reveal className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold leading-[1.3] text-ink">
              من التسجيل إلى منيو منشور في {SETUP_STEPS.length} خطوات
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-dim">
              اختر «{seg.typeKey}» نوعاً لنشاطك حين تنشئ مطعمك، فنقترح لك قائمة بداية لنوعك، ويضع مُنتقي الطوابع
              {themes.length ? ` «${themes.map((t) => t.name).join("» و«")}» ` : " "}
              أوّلاً.
            </p>
          </Reveal>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SETUP_STEPS.map((s, i) => (
              <li key={s.id} className="flex items-center gap-3 rounded-[16px] border border-line bg-panel p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-page">
                  {i + 1}
                </span>
                <span className="font-bold text-ink">{s.title}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* للقراءة — مقالات قائمة في المدونة، لا وعود جديدة. */}
        {reading.length > 0 && (
          <section className="mx-auto w-full max-w-6xl px-5 pb-16">
            <h2 className="mb-4 font-display text-xl font-bold text-ink">اقرأ قبل أن تبدأ</h2>
            <ul className="grid gap-3 md:grid-cols-3">
              {reading.map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="flex h-full min-h-14 items-center gap-3 rounded-[14px] border border-line bg-panel p-4 text-[15px] font-bold leading-relaxed text-ink hover:border-ink/35"
                  >
                    <Icon name="doc" size={18} className="shrink-0 text-gold" />
                    <span className="min-w-0">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* الدعوة الأخيرة — الفعل نفسه، على شريط الحبر. */}
        <section className="bg-ink text-page">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center">
            <div className="sadu-band mx-auto mb-7 w-32 opacity-90" aria-hidden="true" />
            <h2 className="font-display text-3xl font-bold leading-[1.3]">منيوك باسمك — جاهز اليوم</h2>
            <div className="mt-8 flex justify-center">
              <SignupButton className="shadow-none" />
            </div>
            <p className="mt-4 text-sm opacity-70">
              {trial} مجاناً · ثم {formatPrice(PLAN.monthly)} {CURRENCY} شهرياً · ألغِ متى شئت
            </p>
            <p className="mt-6 text-sm opacity-80">
              {others.map((o, i) => (
                <span key={o.slug}>
                  {i > 0 && " · "}
                  <Link to={segmentPath(o.slug)} className="inline-flex min-h-9 items-center underline-offset-4 hover:underline">
                    {o.label}
                  </Link>
                </span>
              ))}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
