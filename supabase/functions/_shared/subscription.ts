/**
 * «هل هذا التاجر مشترك؟» — **تعريفٌ واحد** لكل دوال الحافة.
 *
 * ═══ لماذا مشترك ═══
 *
 * كان الفحص مكتوباً في `api/index.ts` وحدها، لأن الـ`api` كانت **الميزة
 * المدفوعة الوحيدة المحروسة فعلاً**. وبقيّة ما يعلن `FREE_LIMITS` أنه مدفوع
 * — الدفع الإلكتروني والكاشير والولاء والتحليلات — لم يكن يقرؤه سطر واحد،
 * فتاجرٌ انتهى اشتراكه يحتفظ بكل شيء.
 *
 * وحين تُفرض البوّابات في أكثر من موضع، فنسخُ الشرط بيد في كل موضع يعني أن
 * تعريف «مشترك» يتباعد بصمت: موضعٌ يقبل `end_date` الفارغ وآخر يرفضه، فيرى
 * التاجر «مشترك» في لوحته و«غير مشترك» عند الدفع. لذلك واحدة هنا.
 *
 * ═══ الشرط ═══
 *
 * ⚠️ **نفس شرط `getActiveSubscription`** في `app/src/lib/data.ts` حرفاً بحرف:
 * `active = true` **و** `end_date` في المستقبل (أو فارغ = مدى الحياة). شرطٌ
 * ثالثٌ مختلف هنا يعني تاجراً يرى «مشترك» في لوحته ورفضاً في الخادم.
 *
 * ولا عمود `status` في الجدول — بل `active` منطقيّة.
 *
 * ═══ ما لا تفعله ═══
 *
 * **لا تحرس المنيو ولا السلّة ولا طلبات واتساب.** المقابل «أدوات لا ظهور»:
 * إطفاء منيو تاجرٍ لم يدفع عقوبةٌ لا تبيع اشتراكاً، وهو ما يجعل
 * `enforce_publishing` مطفأً عمداً. هذه الدالّة لأدوات التشغيل وحدها.
 */
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

/** هل للمستخدم اشتراك نشط غير منتهٍ؟ */
export async function userHasActiveSubscription(
  admin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  if (!userId) return false;
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("active", true)
    .or(`end_date.is.null,end_date.gt.${nowIso}`)
    .limit(1);

  /**
   * ⚠️ **عطل القراءة يُعامَل «غير مشترك» لا «مشترك».**
   *
   * هذه بوّابة ميزة لا بوّابة منيو: الفتح عند الشكّ يعطي ميزةً مدفوعة مجاناً
   * لكل من يستطيع إسقاط الاستعلام. والتاجر المشترك الذي يصادف عطلاً عابراً
   * يعيد المحاولة — بينما المنيو نفسه لا يمرّ من هنا أصلاً فلا ينطفئ.
   */
  if (error) {
    console.error("subscription check:", error.message);
    return false;
  }
  return Boolean(data?.length);
}

/** هل لمالك هذا المطعم اشتراك نشط؟ */
export async function restaurantHasActiveSubscription(
  admin: SupabaseClient,
  restaurantId: string,
): Promise<boolean> {
  if (!restaurantId) return false;
  const { data: owner, error } = await admin
    .from("restaurants")
    .select("user_id")
    .eq("id", restaurantId)
    .single();
  if (error || !owner?.user_id) return false;
  return userHasActiveSubscription(admin, String(owner.user_id));
}
