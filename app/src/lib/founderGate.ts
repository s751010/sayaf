/**
 * بوّابة لوحة المؤسّس — من يدخل، ولماذا يُردّ إن رُدّ.
 *
 * ═══ لماذا أُعيدت (٢٠٢٦/١١/٢٦) ═══
 *
 * كانت البوّابة تسأل دالّة الحافة `founder-admin` «هل تقبلني؟» — بينما **لا
 * قسم في اللوحة يحتاجها**: كلّها تقرأ بـ`rest()` وجلسة المؤسّس، وRLS تحرسها
 * بـ`is_founder()`. فكان أيّ خلل في تلك الدالّة وحدها (نطاقٌ خارج
 * `ALLOWED_ORIGINS`، نسخةٌ منشورة قديمة، بريدٌ مخبَّأ في نسخة دافئة) يقفل
 * اللوحة كلّها برسالة واحدة مبهمة — وقال المالك: «ما اشتغلت معي مهما حصل».
 *
 * الآن البوّابة هي **السؤال نفسه** الذي تسأله القاعدة لكلّ قسم:
 * `rpc/is_founder` بجلسة المستخدم. إن قالت «نعم» فتحت الأقسام كلّها حتماً،
 * وإن قالت «لا» عرفنا السبب بدقّة: البريد ليس بريد المؤسّس.
 *
 * ═══ لا سرّ احتياطي في الواجهة بعد اليوم ═══
 *
 * السرّ كان يفتح الباب ثم يقول «الأقسام تحتاج جلسة» — نصفُ دخولٍ يُربك أكثر
 * مما يُنقذ. والطريق الاحتياطي الحقيقي إن ضاعت كلمة المرور: «نسيت كلمة
 * المرور»، أو تعديل `founder_email()` من محرّر SQL (أدناه).
 */
import { ApiError, rest } from "./api";
import { SUPABASE_URL } from "./config";

/** معرّف المشروع من رابطه — لرابط محرّر SQL المباشر. */
export const SUPABASE_REF = new URL(SUPABASE_URL).hostname.split(".")[0];

/** محرّر SQL في لوحة Supabase، مفتوحاً على استعلام جديد. */
export const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_REF}/sql/new`;

export type LoginFailure = "wrong" | "unconfirmed" | "unreachable";

/**
 * يصنّف فشل الدخول من GoTrue.
 *
 * `fetch` نفسها ترمي `TypeError` حين لا يصل الردّ (شبكة/حجب)، وGoTrue يردّ
 * «Invalid login credentials» و«Email not confirmed» نصّاً — فالتمييز بلا تخمين.
 */
export function classifyLoginError(err: unknown): LoginFailure {
  if (err instanceof TypeError) return "unreachable";
  const msg = err instanceof Error ? err.message : String(err);
  if (/not\s*confirmed|confirm/i.test(msg)) return "unconfirmed";
  return "wrong";
}

export const LOGIN_FAILURE_TEXT: Record<LoginFailure, string> = {
  wrong: "الإيميل أو كلمة المرور غلط.",
  unconfirmed:
    "الإيميل صحيح لكنه غير مؤكَّد. افتح رسالة التأكيد في بريدك، أو استعمل خطوة «اجعل هذا الإيميل إيميل المؤسس» أدناه — تؤكّده معها.",
  unreachable: "ما قدرنا نوصل للخادم. تأكّد من الإنترنت وجرّب مرة ثانية.",
};

/** نتيجة سؤال القاعدة: مؤسّس · ليس مؤسّساً · لم نصل. */
export type FounderCheck = "yes" | "no" | "unreachable";

/**
 * هل الجلسة الحالية جلسة المؤسّس؟ — بالسؤال الذي تسأله RLS نفسها.
 *
 * `is_founder()` تُنادى من سياسات RLS بدور `authenticated`، فصلاحية تنفيذها
 * موجودة لهذا الدور، وPostgREST يعرضها في `rpc/` (ومنها تقرأ صفحة الدخول
 * أصلاً `isFounder()`). ردٌّ من الخادم = جوابٌ عن الهوية · لا ردّ = عطل وصول.
 */
export async function checkFounder(): Promise<FounderCheck> {
  try {
    const ok = await rest<boolean>("rpc/is_founder", { method: "POST", body: {} });
    return ok === true ? "yes" : "no";
  } catch (err) {
    return err instanceof ApiError ? "no" : "unreachable";
  }
}

/**
 * إيميلٌ يصلح أن يُكتب حرفياً داخل SQL.
 *
 * لا علامات اقتباس ولا مسافات ولا فواصل منقوطة — فلا يمكن أن يكسر النصّ أو
 * يُلحق به أمراً. (الإيميل يأتي من جلسة GoTrue أصلاً، والفحص حزام أمان.)
 */
export function isSqlSafeEmail(email: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

/**
 * سطور SQL تجعل `email` إيميل المؤسّس — يلصقها المالك في محرّر SQL.
 *
 * ثلاث خطوات، كلّها آمنة للتكرار:
 *   ١. تأكيد البريد إن لم يُؤكَّد (البوّابة القديمة كانت تشترطه بصمت).
 *   ٢. `founder_email()` تُعيد هذا البريد — ومنها تقرأ `is_founder()` وكل
 *      سياسات RLS، فيتغيّر المؤسّس في مكانٍ واحد.
 *   ٣. إعادة حجبها عن `anon` و`authenticated` (كما في هجرة التصلّب) احتياطاً.
 *
 * `null` إن لم يكن الإيميل آمناً للكتابة حرفياً.
 */
export function founderEmailSql(email: string): string | null {
  const e = email.trim().toLowerCase();
  if (!isSqlSafeEmail(e)) return null;
  return [
    "-- اجعل هذا الإيميل إيميل المؤسس في كلاود منيو",
    `update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where lower(email) = '${e}';`,
    "",
    "create or replace function public.founder_email() returns text",
    "language sql stable set search_path = '' as",
    `$$ select '${e}'::text $$;`,
    "",
    "revoke all on function public.founder_email() from public, anon, authenticated;",
  ].join("\n");
}
