import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";

/**
 * تسجيل مشاهدة منيو عام.
 *
 * لم يعد يستقبل `owner_id` من المتصفح: دالة `track_menu_view` في قاعدة البيانات
 * (SECURITY DEFINER) تستنتج مالك القائمة بنفسها من `menu_id`. هذا يعني أن
 * `restaurants.user_id` لم يعد يحتاج المرور عبر صفحة عامة أصلاً — وهو ما سمح
 * بسحب صلاحية قراءته من دور الزائر.
 */
export async function POST(request: Request) {
  try {
    const { menu_id } = await request.json();
    if (typeof menu_id !== "string" || !menu_id) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = createPublicServerClient();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

    await supabase.rpc("track_menu_view", { p_menu_id: menu_id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
