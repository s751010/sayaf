"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { isFounder } from "@/lib/founder";
import type { ActionState } from "@/app/dashboard/actions";

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
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
