/**
 * «من نحن» — `/about`.
 *
 * ═══ ⚠️ القاعدة الحاكمة: لا يُخترع شيء ═══
 *
 * صفحات «من نحن» أكثر صفحات الموقع إغراءً بالتأليف: سنة تأسيس، وفريق، وعدد
 * عملاء، وجوائز. **لا شيء من ذلك هنا.** كل جملة في هذه الصفحة يقابلها قرار
 * قائم في الشيفرة يستطيع الزائر التحقّق منه بنفسه:
 *
 *  · «أموالك تصلك مباشرة» ⇐ `paylink-order-create` تُنشئ الفاتورة على حساب
 *    التاجر لا حسابنا، ولا عمولة في المسار (§13).
 *  · «لا نرى مفتاحك» ⇐ الحقل **كتابة فقط** والعرض عبر `has_secret` (§13).
 *  · «لا نرى زبائنك» ⇐ لوحة المؤسّس تعرض `loyalty_count` عدداً فقط، بلا اسم
 *    ولا جوّال (§11)، والويبهوك كذلك (§16).
 *  · «صفر بايت طرف ثالث» ⇐ `lib/pixels.ts` لا يحقن شيئاً بلا معرّف، والخطوط
 *    ذاتية الاستضافة (§15).
 *
 * وما لا يُشتقّ من الشيفرة — من يملك المنصّة، ومتى بدأت — يبقى في كتلة
 * `OWNER_STORY_TODO` **مرئية للمالك** لا مدفونة، بنفس منطق `IDENTITY_TODO` في
 * `Legal.tsx`: نقصٌ ظاهر أفضل من فراغ صامت، وكلاهما أفضل من اختراع.
 *
 * ═══ الأرقام من `lib/facts.ts` ═══
 *
 * لا مكتوبة هنا. الرقم المكتوب في موضعين يتباعد — وقد حدث (§17).
 */
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";
import { Icon } from "@/lib/icons";
import { SITE_NAME } from "@/lib/config";
import { CARD_SIZE_COUNT, PRINT_DPI, THEME_COUNT } from "@/lib/facts";
import { CURRENCY, PLANS } from "@/lib/plans";
import { ORGANIZATION, absoluteUrl, useJsonLd, useSeo } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";

/**
 * ⚠️ **قصّة المنشأة — تحتاج كلماتك أنت.**
 *
 * اتركها `true` حتى تكتب فقرتك، فتظهر الكتلة تذكيراً. ولا تُملأ باختراع:
 * زائرٌ يقرأ قصّة مؤلّفة ثم يكتشف ذلك يخسر ثقته في كل ما سبقها.
 */
const OWNER_STORY_TODO = true;

const PLAN = PLANS[0];

/* ── لبنات ──────────────────────────────────────────────────────────── */

function Section({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      {kicker && (
        <p className="text-xs font-black uppercase tracking-widest text-gold">{kicker}</p>
      )}
      <h2 className="mt-1.5 font-display text-2xl font-black text-ink">{title}</h2>
      <div className="mt-4 flex flex-col gap-3 leading-relaxed text-dim">{children}</div>
    </section>
  );
}

/**
 * مبدأ = وعدٌ + **ما يقابله في المنتج**. الشقّ الثاني هو الفرق بين صفحة
 * «من نحن» وقائمة شعارات: الوعد وحده يقوله الجميع.
 */
function Principle({
  icon,
  title,
  promise,
  proof,
}: {
  icon: string;
  title: string;
  promise: string;
  proof: string;
}) {
  return (
    <li className="rounded-2xl border border-line bg-panel p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
      </div>
      <p className="mt-3 leading-relaxed text-dim">{promise}</p>
      <p className="mt-2 border-t border-line pt-2 text-sm leading-relaxed text-faint">
        <b className="text-dim">كيف تتأكّد: </b>
        {proof}
      </p>
    </li>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-5 text-center">
      <p className="font-display text-3xl font-black text-gold">{value}</p>
      <p className="mt-1 text-xs leading-snug text-dim">{label}</p>
    </div>
  );
}

/* ── الصفحة ─────────────────────────────────────────────────────────── */

export default function About() {
  useSeo({
    title: "من نحن",
    description: `${SITE_NAME} منصّة سعودية لمنيو المطاعم الرقمي عبر رمز QR — بلا تطبيق يحمّله زبونك، وبأموالٍ تصل حساب مطعمك مباشرة.`,
    path: "/about",
  });

  useJsonLd("about", {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `من نحن — ${SITE_NAME}`,
    url: absoluteUrl("/about"),
    inLanguage: "ar",
    mainEntity: {
      ...ORGANIZATION,
      description: `منصّة سعودية تحوّل منيو المطعم إلى تجربة رقمية عبر رمز QR، بلا تطبيق على جهاز الزبون.`,
      areaServed: "SA",
    },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        {/* ── الترويسة ─────────────────────────────────────────────── */}
        <p className="text-xs font-black uppercase tracking-widest text-gold">من نحن</p>
        <h1 className="mt-2 font-display text-3xl font-black leading-snug text-ink sm:text-4xl">
          نبني المنيو الرقمي الذي
          <br />
          <span className="text-gold">يليق بمطعمك السعودي</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-dim">
          {SITE_NAME} منصّة سعودية تحوّل منيو مطعمك إلى صفحة يفتحها زبونك برمز
          QR — بلا تطبيق يحمّله، وبلا وسيط يقف بينك وبين أموالك.
        </p>

        {/* ── لماذا ────────────────────────────────────────────────── */}
        <Section kicker="لماذا" title="ثلاث مشكلات رأيناها تتكرّر">
          <p>
            لم نبدأ من فكرة «منصّة منيو» — بدأنا من ثلاثة أشياء يعرفها كل من
            جلس في مطعم سعودي:
          </p>
          <ul className="flex flex-col gap-3">
            {[
              {
                t: "كود QR على ورقة A4 بيضاء",
                d: "مطعمٌ أنفق على ديكوره وتشطيبه، ثم وضع على الطاولة ورقة مطبوعة على عجل. المنيو الرقمي كان يُعامَل كإجراء لا كجزء من التجربة.",
              },
              {
                t: "منيو يُقرأ بالإنجليزية أولاً",
                d: "أدوات مبنيّة لواجهات تبدأ من اليسار، ثم تُقلَب إلى العربية فيخرج الخطّ والتباعد والأرقام مرتبكة. العربية كانت ترجمة لا أصلاً.",
              },
              {
                t: "أموال تمرّ بطرف ثالث",
                d: "حلول تأخذ عمولة على كل طلب، أو تُدخل نفسها بينك وبين البنك — فتتردّد في تشغيل الطلب الإلكتروني أصلاً.",
              },
            ].map((x) => (
              <li key={x.t} className="rounded-2xl border border-line bg-panel p-4">
                <p className="font-bold text-ink">{x.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-dim">{x.d}</p>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── المبادئ ──────────────────────────────────────────────── */}
        <Section
          kicker="ما نؤمن به"
          title="خمسة مبادئ — ولكلٍّ ما يقابله في المنتج"
        >
          <p>
            المبدأ الذي لا يقابله قرارٌ في الشيفرة شعار. فبجانب كل واحد هنا،
            كيف تتحقّق منه بنفسك.
          </p>
          <ul className="mt-2 flex flex-col gap-4">
            <Principle
              icon="money"
              title="أموالك تصلك مباشرة"
              promise="طلبات زبائنك تُدفَع إلى حساب مطعمك أنت عبر بوّابة باسمك — لا تمرّ بنا ولا نأخذ عليها عمولة. نبيع اشتراكاً شهرياً واضحاً، لا نسبة من مبيعاتك."
              proof="فعّل الدفع الإلكتروني وجرّب طلباً بنفسك: الفاتورة تصدر باسم مطعمك، والمبلغ يظهر في لوحة بوّابتك لا في لوحتنا."
            />
            <Principle
              icon="lock"
              title="لا نرى ما لا يلزمنا"
              promise="مفتاح بوّابة الدفع الخاص بك حقل كتابة فقط — يُحفظ ولا يُعرض لأحد بعدها، ولا لنا. وبيانات زبائن الولاء (الاسم والجوّال) لا تظهر لنا إطلاقاً، نرى عدداً فقط."
              proof="افتح إعدادات الدفع بعد الحفظ: ترى «محفوظ» لا المفتاح. وشاشة الكاشير نفسها تعرض آخر أربعة أرقام من جوّال الزبون لا الرقم كاملاً."
            />
            <Principle
              icon="qr"
              title="زبونك لا يحمّل شيئاً"
              promise="يمسح الكود فيفتح المنيو في متصفّحه مباشرة. لا تطبيق، ولا حساب، ولا تسجيل دخول، ولا إذن إشعارات."
              proof="امسح كود المنيو التجريبي من صفحتنا الرئيسية بجوال لم يزُر الموقع قطّ."
            />
            <Principle
              icon="palette"
              title="العربية أصل لا ترجمة"
              promise="بُنيت الواجهة من اليمين إلى اليسار من أول سطر. والطوابع تحمل زخارف من هنا — السدو والقطّ العسيري والمشربية والنخيل — لا قوالب عامّة مصبوغة بلون."
              proof={`افتح /demo?theme=qatt ثم /demo?theme=najdi: يختلفان في الزخرفة وشكل الترويسة والخطّ والتخطيط، لا في اللون وحده. و${THEME_COUNT} طابعاً كلّها كذلك.`}
            />
            <Principle
              icon="eye"
              title="صفر تتبّع لا تطلبه أنت"
              promise="صفحة منيوك لا تُرسل بايتاً واحداً إلى أي طرف ثالث ما لم تضع أنت معرّف إعلاناتك. والخطوط مستضافة عندنا لا من خوادم خارجية."
              proof="افتح منيو أي مطعم وراقب تبويب الشبكة في متصفّحك: كل الطلبات إلى نطاقنا ونطاق قاعدتنا، ولا شيء غيرهما."
            />
          </ul>
        </Section>

        {/* ── الأرقام ──────────────────────────────────────────────── */}
        <Section
          kicker="المنتج بالأرقام"
          title="أرقام من داخل المنتج لا من السوق"
        >
          <p>
            لا نعرض هنا عدد عملاء ولا حجم سوق. كل رقم أدناه شيء تراه وتستعمله
            بعد دقيقة من التسجيل.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={String(THEME_COUNT)} label="طابعاً كاملاً للمنيو" />
            <Stat value={String(CARD_SIZE_COUNT)} label="قياسات بطاقة للطباعة" />
            <Stat value={String(PRINT_DPI)} label="DPI دقّة ملفّ الطباعة" />
            <Stat value="٠" label="تطبيقات يحمّلها زبونك" />
          </div>
          <p className="mt-3 text-sm text-faint">
            والسعر واحد ظاهر:{" "}
            <b className="text-dim">
              {formatPrice(PLAN.monthly)} {CURRENCY} شهرياً
            </b>{" "}
            بكل المزايا بلا حدود — لا باقات تُخفي مزايا خلف بعضها.
          </p>
        </Section>

        {/* ── ما لا نفعله ──────────────────────────────────────────── */}
        <Section kicker="بصراحة" title="أشياء لا نفعلها — وهذا مقصود">
          <ul className="flex flex-col gap-2.5">
            {[
              "لا نأخذ عمولة على طلبات زبائنك. اشتراك شهري واحد، وانتهى.",
              "لا نبيع بياناتك ولا بيانات زبائنك، ولا نشاركها مع معلنين.",
              "لا نقفل منيوك في تطبيق. رابط منيوك رابط ويب عادي يعمل في أي متصفّح.",
              "لا نَعِد بما لم يُبنَ بعد: ما تراه في الموقع موجود ويعمل اليوم.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5 leading-relaxed">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* ── التواصل · وقصّة المنشأة ──────────────────────────────── */}
        <div className="mt-14 rounded-2xl border border-line-gold bg-gold/[.06] p-5">
          <p className="text-sm font-black text-ink">تواصل معنا مباشرة</p>
          <p className="mt-2 text-sm leading-relaxed text-dim">
            بريد الدعم وواتساب الدعم في تذييل هذه الصفحة، ومركز المساعدة فيه
            إجابات الأسئلة المتكرّرة. وإن كان لديك مطعم وسؤال قبل الاشتراك،
            اسأل — لن نطلب بريدك مقابل الإجابة.
          </p>
          {/**
           * ⚠️ سطر مرئيّ **لك** حتى تكتب فقرتك: من يقف خلف المنصّة، ومتى
           * بدأت، ولماذا. تُركت فارغة عمداً — ولا تُملأ باختراع: زائرٌ يقرأ
           * قصّة مؤلّفة ثم يكتشف ذلك يخسر ثقته في كل ما سبقها على هذه الصفحة.
           * اقلب `OWNER_STORY_TODO` إلى `false` بعد كتابتها.
           */}
          {OWNER_STORY_TODO && (
            <p className="mt-3 border-t border-line-gold pt-3 text-xs leading-relaxed text-faint">
              <b className="text-dim">قسم «من يقف خلف المنصّة» </b>
              — يُكتب بكلمات صاحبها: القصّة والفريق وتاريخ البداية. تُستكمل
              قبل التفعيل التجاري، كما في بيانات المنشأة على صفحتَي الشروط
              والخصوصية.
            </p>
          )}
        </div>

        {/* ── الدعوة ───────────────────────────────────────────────── */}
        <div className="mt-14 rounded-3xl border border-line-gold bg-gold/[.06] p-7 text-center">
          <h2 className="font-display text-2xl font-black text-ink">
            جرّبه قبل أن تصدّقنا
          </h2>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-dim">
            افتح المنيو التجريبي من جوالك الآن — هو منيو حقيقي بكل مزايا المنتج،
            بلا تسجيل ولا بريد.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/demo"
              className="inline-flex min-h-11 items-center rounded-xl bg-gold px-6 py-3 text-sm font-bold text-on-gold hover:bg-gold2"
            >
              شاهد منيو تجريبي
            </Link>
            <Link
              to="/login?mode=signup"
              className="inline-flex min-h-11 items-center rounded-xl border border-line px-6 py-3 text-sm font-bold text-ink hover:border-line-gold hover:text-gold"
            >
              أنشئ منيو مطعمك
            </Link>
          </div>
          <p className="mt-5 text-sm text-dim">
            أسئلة أكثر؟{" "}
            <Link to="/help" className="font-bold text-gold hover:underline">
              مركز المساعدة
            </Link>{" "}
            ·{" "}
            <Link to="/blog" className="font-bold text-gold hover:underline">
              المدونة
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
