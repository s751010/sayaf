/**
 * طبقة بيانات لوحة المؤسس.
 *
 * ═══ لماذا `rest()` مباشرة لا `founderAdmin()` ═══
 *
 * سياسات RLS تمنح المؤسس وصولاً كاملاً بجلسته هو: كل سياسات الكتابة على
 * `restaurants` و`menus` و`dishes` و`subscriptions` وغيرها تحمل
 * `OR is_founder()`. ودور `authenticated` يملك صلاحية على كل الأعمدة (بخلاف
 * `anon` المقيَّد على مستوى العمود — القاعدة (و) تخصّه وحده). فلا داعي لتمرير
 * كل نداء عبر دالة الحافة: نداء أقصر، وRLS هي الحارس، ومصدر واحد للحقيقة.
 *
 * `founder-admin` تبقى بوابة السرّ الاحتياطية كما في §10 من `CLAUDE.md`، وهي
 * ما يفتح اللوحة لمن لا جلسة له. أما الأقسام المبنية على الدوال المجمّعة أدناه
 * فتتطلّب **جلسة** لأن `is_founder()` تقرأ الـJWT — وهذا مذكور صراحةً للمستخدم
 * في القشرة بدل أن يرى قسماً فارغاً بلا تفسير.
 *
 * ═══ خصوصية زبائن التجّار (قرار المالك) ═══
 *
 * لا يُطلب `phone` ولا `name` من `loyalty_customers` في أي نداء هنا — العدد
 * المجمّع فقط، وهو يأتي من `founder_merchants()`. هؤلاء زبائن التجّار لا زبائن
 * المنصة. وكذلك `restaurant_payment_settings.secret_key` لا يُقرأ إطلاقاً.
 */
import { rest } from "./api";
import type { Dish, Menu, Restaurant } from "./types";

/* ── الأنواع ──────────────────────────────────────────────────────── */

export interface FounderOverview {
  revenue_total: number;
  revenue_30d: number;
  restaurants_total: number;
  restaurants_new_7d: number;
  restaurants_no_dish: number;
  menus_total: number;
  dishes_total: number;
  users_total: number;
  subs_active: number;
  subs_trial: number;
  subs_paid: number;
  subs_expiring_7d: number;
  views_30d: number;
  views_7d: number;
  tickets_open: number;
  tickets_unread: number;
}

export interface FounderMerchant {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  created_at: string;
  owner_id: string | null;
  owner_email: string | null;
  menus_count: number;
  active_menus: number;
  dishes_count: number;
  views_30d: number;
  last_view: string | null;
  sub_plan: string | null;
  sub_end: string | null;
  sub_active: boolean;
  tickets_open: number;
  has_staff_pin: boolean;
  /** عدد فقط — لا أسماء ولا جوالات (قرار المالك). */
  loyalty_count: number;
}

export interface Subscription {
  id: string;
  user_id: string | null;
  plan_id: string;
  payment_ref: string | null;
  start_date: string | null;
  end_date: string;
  active: boolean | null;
  cancelled_at: string | null;
  created_at: string | null;
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  target_name: string | null;
  details: Record<string, unknown>;
}

/* ── القراءات المجمّعة (دوال القاعدة) ──────────────────────────────── */

/** `returns table` في PostgREST يصل مصفوفةً بصفّ واحد. */
export async function getOverview(): Promise<FounderOverview> {
  const rows = await rest<FounderOverview[]>("rpc/founder_overview", {
    method: "POST",
    body: {},
  });
  return rows[0];
}

export async function getMerchants(): Promise<FounderMerchant[]> {
  return rest<FounderMerchant[]>("rpc/founder_merchants", { method: "POST", body: {} });
}

/* ── سجل التدقيق ──────────────────────────────────────────────────── */

/**
 * يسجّل إجراءً قبل تنفيذه.
 *
 * **لا يرمي أبداً**: فشل التسجيل يجب ألّا يمنع الإجراء نفسه، وإلا صار السجل
 * نقطة عطل بدل أن يكون توثيقاً. الفشل يُبلَّغ في الطرفية فقط.
 */
export async function logAudit(
  action: string,
  opts: {
    table?: string;
    id?: string | null;
    name?: string | null;
    details?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    await rest("founder_audit", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: {
        action,
        target_table: opts.table ?? null,
        target_id: opts.id ?? null,
        target_name: opts.name ?? null,
        details: opts.details ?? {},
      },
    });
  } catch (err) {
    console.error("تعذّر تسجيل الإجراء في سجل التدقيق:", err);
  }
}

export async function getAudit(limit = 100): Promise<AuditEntry[]> {
  return rest<AuditEntry[]>(`founder_audit?select=*&order=at.desc&limit=${limit}`);
}

/* ── التحكّم بالاشتراكات ───────────────────────────────────────────── */

export async function getSubscriptionsOf(userId: string): Promise<Subscription[]> {
  return rest<Subscription[]>(
    `subscriptions?user_id=eq.${userId}&select=*&order=end_date.desc`
  );
}

/**
 * يمنح اشتراكاً يدوياً.
 *
 * `payment_ref` عليه قيد تفرّد في القاعدة، فيحمل الوقت كي لا يصطدم منحان.
 * وقيمته تقول من أين جاء الصف: `founder-grant` لا دفعة من بوابة — فلا يختلط
 * على أحد لاحقاً في `revenue_log`.
 */
export async function grantSubscription(
  userId: string,
  days: number,
  planId = "standard"
): Promise<void> {
  const end = new Date(Date.now() + days * 86400_000).toISOString();
  await rest("subscriptions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: {
      user_id: userId,
      plan_id: planId,
      active: true,
      end_date: end,
      payment_ref: `founder-grant:${Date.now()}`,
    },
  });
}

/** يمدّد اشتراكاً قائماً — من نهايته إن كانت مستقبلية، ومن اليوم إن كانت ماضية. */
export async function extendSubscription(sub: Subscription, days: number): Promise<void> {
  const base = Math.max(new Date(sub.end_date).getTime(), Date.now());
  await rest(`subscriptions?id=eq.${sub.id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { end_date: new Date(base + days * 86400_000).toISOString(), active: true },
  });
}

export async function cancelSubscription(id: string): Promise<void> {
  await rest(`subscriptions?id=eq.${id}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: { active: false, cancelled_at: new Date().toISOString() },
  });
}

/* ── بطاقة التاجر ─────────────────────────────────────────────────── */

export async function getRestaurantById(id: string): Promise<Restaurant> {
  const rows = await rest<Restaurant[]>(`restaurants?id=eq.${id}&select=*&limit=1`);
  if (!rows.length) throw new Error("لا يوجد مطعم بهذا المعرّف.");
  return rows[0];
}

export async function getMenusOf(restaurantId: string): Promise<Menu[]> {
  return rest<Menu[]>(
    `menus?restaurant_id=eq.${restaurantId}&select=*&order=created_at.asc`
  );
}

export async function getDishesOf(restaurantId: string): Promise<Dish[]> {
  return rest<Dish[]>(
    `dishes?restaurant_id=eq.${restaurantId}&select=*&order=category.asc,sort_order.asc`
  );
}

/**
 * الحذف النهائي لمطعم.
 *
 * صفّ واحد يكفي: كل المفاتيح الأجنبية إلى `restaurants` معرّفة
 * `ON DELETE CASCADE` (القوائم، الأطباق، الولاء، رموز الكاشير، الاستبيان،
 * إعدادات الدفع)، والتحليلات تتتالى عبر القائمة. تحقّقتُ من ذلك في
 * `information_schema` قبل الاعتماد عليه.
 *
 * حساب المالك في `auth.users` **لا يُحذف** — قد يملك مطعماً آخر، وحذف الحسابات
 * يحتاج واجهة الإدارة لا PostgREST.
 */
export async function deleteRestaurant(id: string): Promise<void> {
  await rest(`restaurants?id=eq.${id}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}
