import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";

/**
 * Records a public menu view into `analytics`. Called by a small client beacon
 * on the public menu page. The owner's user_id is attached so the row is
 * visible to the owner under the analytics RLS policy (auth.uid() = user_id).
 */
export async function POST(request: Request) {
  try {
    const { menu_id, owner_id } = await request.json();
    if (!menu_id) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = createPublicServerClient();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

    const now = new Date();
    await supabase.from("analytics").insert({
      menu_id,
      user_id: owner_id ?? null,
      date: now.toISOString().slice(0, 10),
      hour: now.getUTCHours(),
      views: 1,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
