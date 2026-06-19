import { BillingClient } from "@/components/billing/billing-client";

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-bold text-cream">الاشتراك والدفع</h1>
      <p className="mt-1 text-warm">اختر باقتك وادفع بالطريقة التي تناسبك.</p>
      <div className="mt-8">
        <BillingClient />
      </div>
    </div>
  );
}
