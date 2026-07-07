import { createPublicServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_PAYMENT_PROVIDER,
  type PaymentProvider,
} from "@/lib/payments";

/**
 * إعدادات الموقع القابلة للتعديل من لوحة المؤسس (`site_settings`).
 * تُقرأ قراءة عامة (settings_select) وتُكتب من المؤسس فقط.
 */

/** أعلام ميزات عامّة على مستوى المنصّة كلها. */
export interface SiteFeatures {
  /** تفعيل سلة الطلبات في المنيو العام. */
  orders_enabled: boolean;
  /** تفعيل تدفّق الدفع/الترقية. عند الإيقاف تُخفى أزرار الدفع. */
  payment_enabled: boolean;
  /** بوابة الدفع النشطة لاشتراكات التجار (تتطلب ضبط أسرارها في Supabase). */
  payment_provider: PaymentProvider;
}

/** محتوى تذييل الموقع القابل للتحرير. */
export interface SiteFooter {
  about: string;
  terms: string;
  privacy: string;
}

export const DEFAULT_FEATURES: SiteFeatures = {
  orders_enabled: true,
  payment_enabled: true,
  payment_provider: DEFAULT_PAYMENT_PROVIDER,
};

export const DEFAULT_FOOTER: SiteFooter = {
  about: "كلاود منيو — المنيو الرقمي الذكي للمطاعم",
  terms: "الشروط والأحكام",
  privacy: "سياسة الخصوصية",
};

export interface SiteSettings {
  features: SiteFeatures;
  footer: SiteFooter;
}

/**
 * يقرأ كل إعدادات الموقع دفعة واحدة مع دمج القيم الافتراضية، حتى لا يتعطّل أي
 * شيء إذا كان المفتاح غير موجود أو ناقص حقلاً.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createPublicServerClient();
  if (!supabase) return { features: DEFAULT_FEATURES, footer: DEFAULT_FOOTER };

  const { data } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", ["features", "footer"]);

  const rows = (data ?? []) as { key: string; value: unknown }[];
  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const features = {
    ...DEFAULT_FEATURES,
    ...(byKey.get("features") as Partial<SiteFeatures> | undefined),
  };
  const footer = {
    ...DEFAULT_FOOTER,
    ...(byKey.get("footer") as Partial<SiteFooter> | undefined),
  };

  return { features, footer };
}
