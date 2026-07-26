import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * وسيط بين صفحة المنيو العامة ودالة `paylink-order-create`.
 *
 * الفائدة من المرور هنا بدل نداء الدالة من المتصفح مباشرة: لا حاجة لـCORS،
 * ولا يُكشف مسار الدالة في حزمة العميل، ويبقى مكان واحد لإضافة أي حدّ معدّل
 * لاحقاً. المنطق الأمني الحقيقي (إعادة حساب الأسعار، وقراءة بيانات اعتماد
 * المطعم) يبقى داخل الدالة نفسها.
 */
export async function POST(request: Request) {
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) {
    return NextResponse.json({ error: "الخدمة غير مهيّأة." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  try {
    const res = await fetch(`${url}/functions/v1/paylink-order-create`, {
      method: "POST",
      headers: {
        apikey: anonKey!,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "تعذّر الاتصال ببوابة الدفع." }, { status: 502 });
  }
}
