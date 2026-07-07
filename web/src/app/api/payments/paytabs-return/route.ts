import { NextResponse } from "next/server";

/**
 * PayTabs يعيد العميل بعد الدفع بطلب POST (نموذج مُرمَّز) إلى عنوان return —
 * صفحات Next لا تستقبل POST، لذا يحوّل هذا الـroute إلى صفحة الرجوع
 * الموحّدة بـ 303 حيث يتم التحقق والتفعيل سيرفرياً.
 */
function callbackUrl(request: Request, tranRef: string | null): URL {
  const url = new URL("/dashboard/billing/callback", request.url);
  url.searchParams.set("provider", "paytabs");
  if (tranRef) url.searchParams.set("ref", tranRef);
  return url;
}

export async function POST(request: Request) {
  let tranRef: string | null = null;
  try {
    const form = await request.formData();
    const value = form.get("tranRef");
    tranRef = typeof value === "string" ? value : null;
  } catch {
    // حمولة غير متوقعة — صفحة الرجوع ستعرض حالة الخطأ
  }
  return NextResponse.redirect(callbackUrl(request, tranRef), 303);
}

export async function GET(request: Request) {
  const tranRef = new URL(request.url).searchParams.get("tranRef");
  return NextResponse.redirect(callbackUrl(request, tranRef), 303);
}
