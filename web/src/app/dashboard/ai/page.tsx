import { AdvisoryChat } from "@/components/dashboard/advisory-chat";
import { UpgradeGate } from "@/components/dashboard/upgrade-gate";
import { getMyEntitlements } from "@/lib/entitlements";

export default async function AiPage() {
  const ent = await getMyEntitlements();

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-cream">
        المجلس الاستشاري الذكي
      </h1>
      <p className="mt-1 text-warm">
        استشر فريقاً افتراضياً من الخبراء لتنمية مطعمك.
      </p>
      {ent.ai ? (
        <div className="mt-8">
          <AdvisoryChat />
        </div>
      ) : (
        <UpgradeGate
          title="المستشار الذكي متاح في باقة الاحترافية"
          desc="فعّل المستشار الذكي للحصول على توصيات تسويقية ومالية وتشغيلية لمطعمك من فريق خبراء بالذكاء الاصطناعي."
        />
      )}
    </div>
  );
}
