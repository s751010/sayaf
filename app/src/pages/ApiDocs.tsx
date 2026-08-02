/**
 * توثيق واجهة API العامة `/docs/api`.
 *
 * صفحة عامة لا تحتاج جلسة: مطوّر التاجر (شركة نقطة البيع غالباً) ليس مالك
 * الحساب ولا يملك دخولاً للوحة — وإرساله لصفحة خلف تسجيل دخول يعني أن يستنسخ
 * التاجر التوثيق في واتساب.
 *
 * الأمثلة بـ`curl` لا بمكتبة: تعمل من أي لغة وأي جهاز، ولا تُلزمنا بنشر SDK
 * وصيانته.
 */
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { Navbar, Footer } from "@/components/site";
import { SUPABASE_URL } from "@/lib/config";

const BASE = `${SUPABASE_URL}/functions/v1/api/v1`;

function Code({ children }: { children: string }) {
  return (
    <pre
      dir="ltr"
      className="mt-2 overflow-x-auto rounded-xl border border-line bg-panel2 p-3 text-start text-xs leading-relaxed text-ink"
    >
      <code>{children}</code>
    </pre>
  );
}

function Row({
  method,
  path,
  children,
}: {
  method: string;
  path: string;
  children: ReactNode;
}) {
  const tone =
    method === "GET"
      ? "bg-good/12 text-good"
      : method === "DELETE"
        ? "bg-bad/12 text-bad"
        : "bg-gold/12 text-gold";
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line py-2.5 last:border-0">
      <span className={`rounded-md px-2 py-0.5 text-[11px] font-black ${tone}`} dir="ltr">
        {method}
      </span>
      <code dir="ltr" className="text-sm font-bold text-ink">
        {path}
      </code>
      <span className="w-full text-xs text-dim sm:w-auto sm:flex-1">{children}</span>
    </li>
  );
}

export default function ApiDocs() {
  useEffect(() => {
    document.title = "واجهة API — كلاود منيو";
  }, []);

  const h2 = "font-display text-lg font-extrabold text-ink";

  return (
    <div className="min-h-dvh">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-black text-ink">واجهة API</h1>
        <p className="mt-2 text-dim">
          اربط منيوك بنظام نقاط البيع أو موقعك أو أي أتمتة. المفتاح يُصدَر من
          إعدادات لوحتك بعد أن نفتح لك الواجهة —{" "}
          <Link to="/help" className="font-bold text-gold hover:underline">
            راسلنا لفتحها
          </Link>
          .
        </p>

        <Card className="mt-6">
          <h2 className={h2}>التوثيق</h2>
          <p className="mt-1 text-sm text-dim">
            أرسل المفتاح في ترويسة <code dir="ltr">Authorization</code> مع كل طلب.
          </p>
          <Code>{`curl "${BASE}/menu" \\
  -H "Authorization: Bearer cm_live_..."`}</Code>
          <ul className="mt-4 space-y-1.5 text-sm text-dim">
            <li>
              • كل مفتاح مربوط <b className="text-ink">بمطعم واحد</b>. لا يمكنه رؤية
              أي مطعم آخر مهما كان الطلب — ولا حاجة لإرسال معرّف المطعم إطلاقاً.
            </li>
            <li>
              • مفاتيح القراءة فقط ترفض أي كتابة بـ<code dir="ltr">403</code>.
            </li>
            <li>
              • الحدّ <b className="text-ink">٦٠ طلباً في الدقيقة</b> لكل مفتاح، ثم{" "}
              <code dir="ltr">429</code>.
            </li>
            <li>
              • المفتاح المُبطَل يردّ <code dir="ltr">401</code> فوراً.
            </li>
          </ul>
        </Card>

        <Card className="mt-5">
          <h2 className={h2}>المسارات</h2>
          <ul className="mt-2">
            <Row method="GET" path="/v1/menu">
              المطعم وقوائمه وأطباقه في نداء واحد — الأنسب لعرض المنيو في موقعك.
            </Row>
            <Row method="GET" path="/v1/restaurant">
              بيانات المطعم.
            </Row>
            <Row method="PATCH" path="/v1/restaurant">
              تعديل بياناته (يحتاج صلاحية التعديل).
            </Row>
            <Row method="GET" path="/v1/menus">
              قوائم المطعم.
            </Row>
            <Row method="GET" path="/v1/dishes">
              الأطباق. معاملات اختيارية: <code dir="ltr">limit</code> ·{" "}
              <code dir="ltr">offset</code> · <code dir="ltr">category</code> ·{" "}
              <code dir="ltr">available</code>.
            </Row>
            <Row method="POST" path="/v1/dishes">
              إضافة طبق. <code dir="ltr">menu_id</code> اختياري — بدونه يُضاف لأول
              قائمة.
            </Row>
            <Row method="GET" path="/v1/dishes/:id">
              طبق واحد.
            </Row>
            <Row method="PATCH" path="/v1/dishes/:id">
              تعديل طبق — مفيد لتحديث السعر أو إطفاء صنف نفد.
            </Row>
            <Row method="DELETE" path="/v1/dishes/:id">
              حذف طبق.
            </Row>
            <Row method="GET" path="/v1/analytics">
              المشاهدات. <code dir="ltr">days</code> حتى ٩٠ (افتراضي ٣٠).
            </Row>
            <Row method="GET" path="/v1/loyalty/summary">
              أعداد الولاء فقط — لا أسماء ولا جوالات.
            </Row>
          </ul>
        </Card>

        <Card className="mt-5">
          <h2 className={h2}>أمثلة</h2>

          <p className="mt-3 text-sm font-bold text-ink">إطفاء صنف نفد</p>
          <Code>{`curl -X PATCH "${BASE}/dishes/<id>" \\
  -H "Authorization: Bearer cm_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"available": false}'`}</Code>

          <p className="mt-5 text-sm font-bold text-ink">إضافة طبق</p>
          <Code>{`curl -X POST "${BASE}/dishes" \\
  -H "Authorization: Bearer cm_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "برجر لحم",
    "price": 32,
    "category": "الأطباق الرئيسية",
    "calories": 800,
    "sodium_mg": 700
  }'`}</Code>

          <p className="mt-5 text-sm font-bold text-ink">
            الإضافات داخل الطبق (<code dir="ltr">options</code>)
          </p>
          <p className="mt-1 text-xs text-dim">
            نصّ يحمل مصفوفة JSON. ترتيبها مهم: هو ما يميّز الإضافة عند الطلب.
          </p>
          <Code>{`-d '{"name":"شاورما","price":18,
     "options":"[{\\"name\\":\\"جبن\\",\\"price\\":5},{\\"name\\":\\"حار\\"}]"}'`}</Code>
        </Card>

        <Card className="mt-5">
          <h2 className={h2}>حقول تحسبها المنصّة</h2>
          <p className="mt-1 text-sm text-dim">
            ثلاثة حقول <b className="text-ink">تُقرأ ولا تُكتب</b> — تحسبها قاعدة
            البيانات من السعرات والصوديوم، وإرسال قيمة لها يردّ الطلب بـ
            <code dir="ltr">400</code> بدل أن يتجاهلها بصمت:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-dim">
            <li>
              • <code dir="ltr">burn_minutes</code> = السعرات ÷ ٤
            </li>
            <li>
              • <code dir="ltr">is_high_sodium</code> = الصوديوم أكثر من ٦٠٠ ملغم
            </li>
            <li>
              • <code dir="ltr">sfda_compliant</code> = السعرات والصوديوم كلاهما
              مذكور
            </li>
          </ul>
        </Card>

        <Card className="mt-5">
          <h2 className={h2}>الأخطاء</h2>
          <p className="mt-1 text-sm text-dim">
            كل خطأ يعود بـ<code dir="ltr">{`{"error": "..."}`}</code> ورسالة عربية
            تشرح السبب.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-dim">
            <li>
              • <code dir="ltr">401</code> مفتاح مفقود أو غير صالح أو مُبطَل
            </li>
            <li>
              • <code dir="ltr">403</code> المفتاح للقراءة فقط، أو المورد ليس لمطعمك
            </li>
            <li>
              • <code dir="ltr">400</code> حقل غير مسموح أو جسم غير صالح
            </li>
            <li>
              • <code dir="ltr">404</code> المورد غير موجود في مطعمك
            </li>
            <li>
              • <code dir="ltr">429</code> تجاوز حدّ المعدّل — أعد المحاولة بعد دقيقة
            </li>
          </ul>
        </Card>

        <Card className="mt-5">
          <h2 className={h2}>حماية مفتاحك</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-dim">
            <li>
              • <b className="text-ink">لا تضعه في متصفح ولا تطبيق جوال.</b> المفتاح
              للخادم فقط — أي شيء يصل للمتصفح يصل لزبائنك أيضاً.
            </li>
            <li>
              • يُعرض <b className="text-ink">مرة واحدة</b> عند الإنشاء. نحن لا نحتفظ
              إلا ببصمته، فلا يمكن لأحد — ولا لنا — استعادته.
            </li>
            <li>
              • تسرّب؟ أبطِله من إعدادات لوحتك وأنشئ غيره. الإبطال فوري.
            </li>
          </ul>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
