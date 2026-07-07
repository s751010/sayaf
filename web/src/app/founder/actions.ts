"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import {
  DEFAULT_PAYMENT_PROVIDER,
  isPaymentProvider,
} from "@/lib/payments";
import type { ActionState } from "@/app/dashboard/actions";

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** عميل Supabase بعد التحقق من هوية المؤسس — null إذا لم يكن المؤسس. */
async function founderClient() {
  if (!(await isFounder())) return null;
  return createServerSupabase();
}

// ── الإعلانات ──────────────────────────────────────────────────────
export async function saveAnnouncement(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await founderClient();
  if (!supabase) return { error: "هذه العملية للمؤسس فقط." };

  const title = strOrNull(formData.get("title"));
  const body = strOrNull(formData.get("body"));
  if (!title || !body) return { error: "أدخل عنوان الإعلان ونصّه." };

  const { error } = await supabase.from("announcements").insert({
    title,
    body,
    type: strOrNull(formData.get("type")) ?? "info",
    audience: strOrNull(formData.get("audience")) ?? "all",
    status: "active",
  });
  if (error) return { error: "تعذّر نشر الإعلان." };

  revalidatePath("/founder/announcements");
  revalidatePath("/dashboard");
  return { message: "تم نشر الإعلان ✅" };
}

export async function toggleAnnouncement(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  const next = strOrNull(formData.get("next")) ?? "active";
  if (!supabase || !id) return;
  await supabase.from("announcements").update({ status: next }).eq("id", id);
  revalidatePath("/founder/announcements");
  revalidatePath("/dashboard");
}

export async function deleteAnnouncement(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  if (!supabase || !id) return;
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/founder/announcements");
  revalidatePath("/dashboard");
}

// ── أكواد الخصم ────────────────────────────────────────────────────
export async function createPromo(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await founderClient();
  if (!supabase) return { error: "هذه العملية للمؤسس فقط." };

  const code = strOrNull(formData.get("code"))?.toUpperCase();
  const discount = parseInt(String(formData.get("discount") ?? ""), 10);
  if (!code) return { error: "أدخل الكود." };
  if (!Number.isFinite(discount) || discount < 1 || discount > 100)
    return { error: "نسبة الخصم يجب أن تكون بين 1 و 100." };

  const maxUses = parseInt(String(formData.get("max_uses") ?? ""), 10);
  const { error } = await supabase.from("promo_codes").insert({
    code,
    description: strOrNull(formData.get("description")),
    discount,
    expiry_date: strOrNull(formData.get("expiry_date")),
    max_uses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : null,
    uses: 0,
    active: true,
  });
  if (error) return { error: "تعذّر إنشاء الكود — قد يكون مكرراً." };

  revalidatePath("/founder/promos");
  return { message: "تم إنشاء الكود ✅" };
}

export async function togglePromo(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  const next = formData.get("next") === "true";
  if (!supabase || !id) return;
  await supabase.from("promo_codes").update({ active: next }).eq("id", id);
  revalidatePath("/founder/promos");
}

export async function deletePromo(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  if (!supabase || !id) return;
  await supabase.from("promo_codes").delete().eq("id", id);
  revalidatePath("/founder/promos");
}

// ── تذاكر الدعم ────────────────────────────────────────────────────
export async function replyTicket(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await founderClient();
  if (!supabase) return { error: "هذه العملية للمؤسس فقط." };

  const id = strOrNull(formData.get("id"));
  const reply = strOrNull(formData.get("admin_reply"));
  if (!id || !reply) return { error: "اكتب الرد أولاً." };

  const { error } = await supabase
    .from("support_tickets")
    .update({
      admin_reply: reply,
      admin_read: true,
      status: strOrNull(formData.get("status")) ?? "resolved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "تعذّر حفظ الرد." };

  revalidatePath("/founder/support");
  revalidatePath("/dashboard/support");
  return { message: "تم إرسال الرد ✅" };
}

export async function setTicketStatus(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  const status = strOrNull(formData.get("status"));
  if (!supabase || !id || !status) return;
  await supabase
    .from("support_tickets")
    .update({ status, admin_read: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/founder/support");
  revalidatePath("/dashboard/support");
}

// ── إعدادات الموقع (features + footer) ─────────────────────────────
export async function saveSiteSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await founderClient();
  if (!supabase) return { error: "هذه العملية للمؤسس فقط." };

  const providerRaw = strOrNull(formData.get("payment_provider"));
  const features = {
    orders_enabled: formData.get("orders_enabled") === "on",
    payment_enabled: formData.get("payment_enabled") === "on",
    payment_provider: isPaymentProvider(providerRaw)
      ? providerRaw
      : DEFAULT_PAYMENT_PROVIDER,
  };
  const footer = {
    about: strOrNull(formData.get("about")) ?? "",
    terms: strOrNull(formData.get("terms")) ?? "",
    privacy: strOrNull(formData.get("privacy")) ?? "",
  };

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("site_settings")
    .upsert(
      [
        { key: "features", value: features, updated_at: now },
        { key: "footer", value: footer, updated_at: now },
      ],
      { onConflict: "key" }
    );
  if (error) return { error: "تعذّر حفظ الإعدادات." };

  revalidatePath("/founder/settings");
  revalidatePath("/", "layout");
  return { message: "تم حفظ إعدادات الموقع ✅" };
}

// ── المطاعم (تحرير/حذف من المؤسس) ──────────────────────────────────
export async function updateRestaurantFounder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await founderClient();
  if (!supabase) return { error: "هذه العملية للمؤسس فقط." };

  const id = strOrNull(formData.get("id"));
  if (!id) return { error: "معرّف المطعم مفقود." };
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "اسم المطعم مطلوب." };

  const rawSlug = strOrNull(formData.get("slug"));
  const fields = {
    name,
    type: strOrNull(formData.get("type")),
    slug: rawSlug ? slugify(rawSlug) : null,
    phone: strOrNull(formData.get("phone")),
    address: strOrNull(formData.get("address")),
    google_review_url: strOrNull(formData.get("google_review_url")),
    social_whatsapp: strOrNull(formData.get("social_whatsapp")),
    social_instagram: strOrNull(formData.get("social_instagram")),
  };

  const { error } = await supabase.from("restaurants").update(fields).eq("id", id);
  if (error) return { error: "تعذّر حفظ المطعم — قد يكون الرابط (slug) مستخدماً." };

  revalidatePath(`/founder/restaurants/${id}`);
  revalidatePath("/founder/restaurants");
  if (fields.slug) revalidatePath(`/${fields.slug}`);
  return { message: "تم حفظ بيانات المطعم ✅" };
}

export async function deleteRestaurantFounder(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  if (!supabase || !id) return;
  // حذف متسلسل يدوي (لا cascade على مستوى المفاتيح الأجنبية).
  await supabase.from("dishes").delete().eq("restaurant_id", id);
  await supabase.from("loyalty_customers").delete().eq("restaurant_id", id);
  await supabase.from("menus").delete().eq("restaurant_id", id);
  await supabase.from("restaurants").delete().eq("id", id);
  revalidatePath("/founder/restaurants");
  redirect("/founder/restaurants");
}

// ── الاشتراكات (منح/تمديد/إلغاء من المؤسس) ─────────────────────────
export async function grantSubscription(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await founderClient();
  if (!supabase) return { error: "هذه العملية للمؤسس فقط." };

  const userId = strOrNull(formData.get("user_id"));
  const planId = strOrNull(formData.get("plan_id"));
  const months = parseInt(String(formData.get("months") ?? "1"), 10);
  if (!userId) return { error: "هذا المطعم غير مرتبط بحساب مستخدم." };
  if (planId !== "standard" && planId !== "premium")
    return { error: "اختر باقة صحيحة." };
  if (!Number.isFinite(months) || months < 1 || months > 36)
    return { error: "عدد الأشهر يجب أن يكون بين 1 و 36." };

  // نُلغِي أي اشتراك نشط سابق لنفس المستخدم ثم نُنشئ الجديد (سجل واحد نشط).
  await supabase
    .from("subscriptions")
    .update({ active: false, cancelled_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("active", true);

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + months);

  const { error } = await supabase.from("subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    start_date: now.toISOString(),
    end_date: end.toISOString(),
    active: true,
    payment_ref: "founder-grant",
  });
  if (error) return { error: "تعذّر منح الاشتراك." };

  revalidatePath("/founder/restaurants");
  return { message: `تم تفعيل الباقة لمدة ${months} شهر ✅` };
}

export async function cancelSubscription(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const userId = strOrNull(formData.get("user_id"));
  if (!supabase || !userId) return;
  await supabase
    .from("subscriptions")
    .update({ active: false, cancelled_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("active", true);
  revalidatePath("/founder/restaurants");
}

// ── الأصناف (تحكّم المؤسس عبر أي متجر) ─────────────────────────────
export async function toggleDishFounder(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  const restaurantId = strOrNull(formData.get("restaurant_id"));
  const next = formData.get("next") === "true";
  if (!supabase || !id) return;
  await supabase.from("dishes").update({ available: next }).eq("id", id);
  if (restaurantId) revalidatePath(`/founder/restaurants/${restaurantId}`);
}

export async function deleteDishFounder(formData: FormData): Promise<void> {
  const supabase = await founderClient();
  const id = strOrNull(formData.get("id"));
  const restaurantId = strOrNull(formData.get("restaurant_id"));
  if (!supabase || !id) return;
  await supabase.from("dishes").delete().eq("id", id);
  if (restaurantId) revalidatePath(`/founder/restaurants/${restaurantId}`);
}
