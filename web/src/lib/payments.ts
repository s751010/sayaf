/**
 * بوابات الدفع المدعومة على مستوى المنصّة. البوابة النشطة يحددها المؤسس من
 * `site_settings.features.payment_provider`، والأسرار تعيش في
 * Supabase Edge Function Secrets (دالة `payments`) — لا شيء سرّي هنا.
 */

export type PaymentProvider = "moyasar" | "paylink" | "paytabs" | "myfatoorah";

export type PaymentProviderInfo = {
  id: PaymentProvider;
  /** الاسم الظاهر للمؤسس والتاجر. */
  label: string;
  /** embedded = نموذج مدمج في الصفحة، redirect = تحويل لصفحة دفع مستضافة. */
  flow: "embedded" | "redirect";
};

export const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  { id: "moyasar", label: "ميسر (Moyasar)", flow: "embedded" },
  { id: "paylink", label: "باي لينك (Paylink)", flow: "redirect" },
  { id: "paytabs", label: "باي تابس (PayTabs)", flow: "redirect" },
  { id: "myfatoorah", label: "ماي فاتورة (MyFatoorah)", flow: "redirect" },
];

export const DEFAULT_PAYMENT_PROVIDER: PaymentProvider = "moyasar";

export function isPaymentProvider(value: unknown): value is PaymentProvider {
  return PAYMENT_PROVIDERS.some((p) => p.id === value);
}

export function providerInfo(id: PaymentProvider): PaymentProviderInfo {
  return PAYMENT_PROVIDERS.find((p) => p.id === id) ?? PAYMENT_PROVIDERS[0];
}
