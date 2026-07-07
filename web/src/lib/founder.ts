import "server-only";
import { getCurrentUser } from "@/lib/supabase/server";

/**
 * حارس المؤسس — يتحقق أن المستخدم الحالي هو صاحب البريد المحدّد في
 * FOUNDER_EMAIL. يُستخدم في صفحات /founder وserver actions الخاصة بها.
 */
export async function isFounder(): Promise<boolean> {
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) return false;
  const user = await getCurrentUser();
  return user?.email?.toLowerCase() === founderEmail.toLowerCase();
}
