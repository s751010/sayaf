import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import { BillingClient } from "@/components/billing/billing-client";
import { Card } from "@/components/ui/card";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { features } = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-cream">الاشتراك والدفع</h1>
      <p className="mt-1 text-warm">اختر باقتك وادفع بالطريقة التي تناسبك.</p>
      <div className="mt-8">
        {features.payment_enabled ? (
          <BillingClient
            userId={user.id}
            userName={user.email ?? ""}
            provider={features.payment_provider}
          />
        ) : (
          <Card className="text-center text-warm">
            الدفع الإلكتروني معطّل مؤقتاً. تواصل معنا لتفعيل اشتراكك.
          </Card>
        )}
      </div>
    </div>
  );
}
