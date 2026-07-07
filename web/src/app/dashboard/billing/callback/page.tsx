import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { isPaymentProvider } from "@/lib/payments";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/** اسم بارامتر مرجع الدفعة الذي تعيده كل بوابة في رابط الرجوع. */
const REF_PARAM: Record<string, string> = {
  moyasar: "id",
  paylink: "transactionNo",
  paytabs: "ref",
  myfatoorah: "paymentId",
};

type Status = "paid" | "already" | "pending" | "failed" | "error";

/**
 * صفحة الرجوع بعد الدفع: تتحقق من الدفعة سيرفر-لسيرفر عبر edge function
 * `payments` (op=verify) — التفعيل يحدث هناك حصراً، لا شيء يُفعَّل من هنا.
 */
export default async function BillingCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const provider =
    typeof params.provider === "string" ? params.provider : "";

  const supabase = await createServerSupabase();
  if (!supabase) redirect("/login");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const refValue = params[REF_PARAM[provider] ?? ""];
  const ref = typeof refValue === "string" ? refValue : "";

  let status: Status = "error";
  if (isPaymentProvider(provider) && ref) {
    const { url, anonKey } = getSupabaseEnv();
    try {
      const res = await fetch(`${url}/functions/v1/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey!,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ op: "verify", provider, ref }),
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        status?: string;
        already?: boolean;
      };
      if (data.ok && data.status === "paid") {
        status = data.already ? "already" : "paid";
      } else if (data.status === "pending") {
        status = "pending";
      } else if (data.status === "failed") {
        status = "failed";
      }
    } catch {
      status = "error";
    }
  }

  const view: Record<Status, { icon: string; title: string; body: string }> = {
    paid: {
      icon: "🎉",
      title: "تم تفعيل اشتراكك",
      body: "شكراً لك! اشتراكك أصبح فعّالاً ويمكنك الاستفادة من كل مزايا باقتك الآن.",
    },
    already: {
      icon: "✅",
      title: "اشتراكك مفعّل مسبقاً",
      body: "هذه الدفعة سبق تفعيلها — لا حاجة لأي إجراء إضافي.",
    },
    pending: {
      icon: "⏳",
      title: "الدفعة قيد المعالجة",
      body: "لم تُحسم الدفعة بعد. سيُفعَّل اشتراكك تلقائياً فور اكتمالها — حدّث هذه الصفحة بعد قليل.",
    },
    failed: {
      icon: "😕",
      title: "تعذّر إتمام الدفع",
      body: "لم تكتمل عملية الدفع. لم يُخصم منك أي مبلغ مؤكد — يمكنك المحاولة مرة أخرى.",
    },
    error: {
      icon: "⚠️",
      title: "تعذّر التحقق من الدفعة",
      body: "لم نتمكن من التحقق من حالة الدفعة. إن كنت أتممت الدفع فلا تقلق — تواصل مع الدعم وسنفعّل اشتراكك.",
    },
  };
  const v = view[status];

  return (
    <div className="mx-auto max-w-md">
      <Card className="text-center">
        <div className="text-5xl">{v.icon}</div>
        <h1 className="mt-4 font-display text-xl font-bold text-cream">
          {v.title}
        </h1>
        <p className="mt-2 text-sm text-warm">{v.body}</p>
        <div className="mt-6 flex flex-col gap-3">
          {status === "paid" || status === "already" ? (
            <Link href="/dashboard" className={buttonVariants({ variant: "gold" })}>
              الانتقال إلى لوحة التحكم
            </Link>
          ) : (
            <Link
              href="/dashboard/billing"
              className={buttonVariants({ variant: "gold" })}
            >
              العودة لصفحة الاشتراك
            </Link>
          )}
          <Link
            href="/dashboard/support"
            className="text-xs text-muted hover:text-warm"
          >
            تحتاج مساعدة؟ تواصل مع الدعم
          </Link>
        </div>
      </Card>
    </div>
  );
}
