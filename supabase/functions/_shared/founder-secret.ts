/**
 * السرّ الاحتياطي للمؤسّس — **من القاعدة أولاً، ومتغيّر البيئة احتياطاً**.
 *
 * ═══ ⚠️ لماذا مشتركة ═══
 *
 * نفس درس `safe-equal.ts` حرفياً: كُتبت أوّل مرّة **نسختين متطابقتين بيد** في
 * `founder-admin` و`billing-admin`. والنسختان بوّابة **مصادقة** — ومَن يشدّ
 * إحداهما لاحقاً (شرط طول أعلى، سجلّ محاولات، حدّ معدّل) يترك الأخرى مفتوحة
 * بالقدر القديم، ولا شيء يصرخ: كلتاهما تمرّ `deno check`، وكلتاهما «تعمل».
 *
 * فبوّابة واحدة في ملفّ واحد، لا نسختان تُراجَعان معاً بالانضباط.
 *
 * ═══ ولماذا القاعدة لا أسرار الدوال ═══
 *
 * كان `Deno.env.get("FOUNDER_SECRET")` وحده، وله ثلاثة عيوب ظهرت عملياً:
 *
 *   • **يُضبط بالنقر في اللوحة فيُنسى عند أي نقل** — وهو حرفياً ما حدث
 *     لتوصيل `notify-support` عند نقل المشروع، وموثَّق في هجرة النقل.
 *   • **ولا يُقرأ ولا يُدار من أي أداة** — فمن نسيه لا يعرف إن كان مضبوطاً
 *     أصلاً: الدالّة تردّ «غير مصرّح» للسرّ الخطأ وللسرّ الغائب سواءً.
 *   • وشرط الطول (٢٤ فأكثر) يجعل قيمةً قصيرة **تُعطّل المسار بصمت**.
 *
 * والقاعدة تحلّ الثلاثة: تُضبط بأمر واحد، وتسافر مع المشروع، وتُدار كبقيّة
 * الأسرار. ونفس نمط `webhook_cron_secret` و`support_notify_secret` القائم.
 *
 * ⚠️ و`internal_secrets` محجوب عن كل جلسة مستخدم: RLS مفعّل **بصفر سياسات**،
 * والمنح لـ`service_role` وحده. فلا يقرؤه إلا خادمٌ بمفتاح الخدمة.
 *
 * ومتغيّر البيئة يبقى احتياطاً: من ضبطه سابقاً لا ينكسر عنده شيء.
 */
import { safeEqual } from "./safe-equal.ts";

/** أقلّ طول مقبول — أقصر منه يُعطّل المسار الاحتياطي بدل أن يُضعفه. */
const MIN_LENGTH = 24;

/**
 * ⚠️ **مخزَّن في ذاكرة النسخة بعد أول قراءة.** فتدوير السرّ في القاعدة لا
 * ينفذ حتى يُعاد نشر الدوالّ المستوردة (أو تُعاد نسخها). التدوير خطوتان.
 */
let cached: string | null = null;

async function getFounderSecret(): Promise<string> {
  if (cached !== null) return cached;
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  let value = "";
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/internal_secrets?key=eq.founder_secret&select=value`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      );
      if (res.ok) {
        const rows = (await res.json()) as { value?: string }[];
        value = String(rows?.[0]?.value ?? "").trim();
      }
    } catch {
      // عطل شبكة لا يُسقط المسار الآخر (جلسة البريد) — يُترك فارغاً.
    }
  }
  if (!value) value = (Deno.env.get("FOUNDER_SECRET") ?? "").trim();
  cached = value;
  return value;
}

/** هل يحمل الطلب سرّ المؤسس الصحيح؟ (المسار الاحتياطي حين تنكسر الجلسة) */
export async function hasFounderSecret(req: Request): Promise<boolean> {
  const sent = req.headers.get("x-founder-secret") ?? "";
  // ⚠️ لا نقرأ السرّ لطلبٍ لا يحمله أصلاً: أغلب الطلبات تأتي بجلسة البريد،
  // فقراءةُ القاعدة لكلٍّ منها رحلةٌ زائدة بلا مقابل.
  if (!sent) return false;
  const expected = await getFounderSecret();
  if (expected.length < MIN_LENGTH) return false;
  return safeEqual(sent, expected);
}
