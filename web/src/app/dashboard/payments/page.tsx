import { getMyRestaurant } from "@/lib/owner";
import { getMyPaymentSettings } from "@/lib/payments";
import { getSiteSettings } from "@/lib/settings";
import { RestaurantOnboarding } from "@/components/dashboard/restaurant-onboarding";
import { PaymentSettingsForm } from "@/components/dashboard/payment-settings-form";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const restaurant = await getMyRestaurant();
  if (!restaurant) return <RestaurantOnboarding />;

  const [settings, { features }] = await Promise.all([
    getMyPaymentSettings(restaurant.id),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-cream">استقبال المدفوعات</h1>
      <p className="mt-1 text-warm">
        اربط حساب PayLink الخاص بمطعمك ليدفع الزبون طلبه إلكترونياً — والمبلغ يصل
        لحسابك مباشرة، لا يمرّ على كلاود منيو.
      </p>

      {!features.orders_enabled && (
        <Card className="mt-6 border-gold/30 bg-gold/[0.06] text-sm text-cream">
          سلة الطلبات معطّلة حالياً على مستوى المنصّة، فلن يظهر زر الدفع في منيوك
          حتى تُفعَّل. يمكنك حفظ بياناتك من الآن.
        </Card>
      )}

      <div className="mt-6">
        <PaymentSettingsForm
          restaurantId={restaurant.id}
          configured={settings.configured}
          enabled={settings.enabled}
          apiId={settings.apiId}
        />
      </div>

      <Card className="mt-6 text-sm leading-relaxed text-warm">
        <h2 className="mb-2 font-bold text-cream">كيف أحصل على البيانات؟</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pr-5">
          <li>
            أنشئ حساب تاجر في{" "}
            <a
              href="https://my.paylink.sa"
              target="_blank"
              rel="noreferrer"
              className="text-gold hover:underline"
            >
              my.paylink.sa
            </a>{" "}
            واشترك في باقة تدعم الـAPI.
          </li>
          <li>من لوحة PayLink انسخ «API ID» و«Secret Key».</li>
          <li>الصقهما هنا وفعّل الدفع.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">
          المفتاح السري يُخزَّن مشفَّر الوصول: لا يُرسل لأي متصفح ولا يظهر في منيوك
          العام — تقرأه دالة الدفع على الخادم فقط لحظة إنشاء الفاتورة.
        </p>
      </Card>
    </div>
  );
}
