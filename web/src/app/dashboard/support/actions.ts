"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase, getCurrentUser } from "@/lib/supabase/server";
import { getMyRestaurant } from "@/lib/owner";
import type { ActionState } from "@/app/dashboard/actions";

export const TICKET_CATEGORIES = [
  { id: "technical", label: "مشكلة تقنية" },
  { id: "billing", label: "الفوترة والاشتراك" },
  { id: "feature", label: "اقتراح ميزة" },
  { id: "other", label: "أخرى" },
] as const;

/** إرسال تذكرة دعم — نفس عقد النسخة القديمة (subject يسبقه التصنيف). */
export async function createSupportTicket(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createServerSupabase();
  const user = await getCurrentUser();
  if (!supabase || !user) return { error: "الجلسة منتهية. سجّل الدخول مجدداً." };

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const category =
    TICKET_CATEGORIES.find((c) => c.id === formData.get("category")) ??
    TICKET_CATEGORIES[0];
  if (!subject) return { error: "يرجى إدخال الموضوع." };
  if (!message) return { error: "يرجى كتابة رسالتك." };

  const restaurant = await getMyRestaurant();
  const { error } = await supabase.from("support_tickets").insert({
    user_id: user.id,
    user_name:
      (user.user_metadata as { name?: string } | null)?.name || user.email,
    email: user.email,
    restaurant_name: restaurant?.name ?? "",
    subject: `[${category.label}] ${subject}`,
    message,
    status: "open",
    admin_read: false,
  });
  if (error) return { error: "تعذّر إرسال التذكرة. حاول مجدداً." };

  revalidatePath("/dashboard/support");
  return { message: "تم إرسال تذكرتك — سنرد عليك قريباً." };
}
