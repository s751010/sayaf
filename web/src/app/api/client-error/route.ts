import { NextResponse } from "next/server";
import { createPublicServerClient } from "@/lib/supabase/server";

/**
 * استقبال أخطاء المتصفح من حدود الأخطاء (`error.tsx`).
 *
 * جدول `client_errors` موجود في القاعدة منذ فترة لكن لم تكن أي شيفرة في
 * `web/` تكتب فيه — أي أن انهيار أي صفحة عند تاجر كان يمرّ بلا أثر. هذا
 * المسار يملؤه، والقيم تُقصّ هنا لتوافق قيود CHECK بدل أن يُرفض الصفّ.
 */
const CAP = { message: 500, stack_head: 2000, component_stack: 2000, page: 500, user_agent: 400 };

const cut = (v: unknown, max: number): string | null => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const message = cut(body.message, CAP.message);
    if (!message) return NextResponse.json({ ok: false }, { status: 400 });

    const supabase = createPublicServerClient();
    if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

    await supabase.from("client_errors").insert({
      message,
      stack_head: cut(body.stack_head, CAP.stack_head),
      component_stack: cut(body.component_stack, CAP.component_stack),
      page: cut(body.page, CAP.page),
      user_agent: cut(request.headers.get("user-agent"), CAP.user_agent),
      signature: cut(body.digest, 32),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // تسجيل الأخطاء لا يجوز أن يصير هو نفسه مصدر خطأ.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
