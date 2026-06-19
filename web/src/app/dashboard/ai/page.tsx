import { AdvisoryChat } from "@/components/dashboard/advisory-chat";

export default function AiPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-cream">
        المجلس الاستشاري الذكي
      </h1>
      <p className="mt-1 text-warm">
        استشر فريقاً افتراضياً من الخبراء لتنمية مطعمك.
      </p>
      <div className="mt-8">
        <AdvisoryChat />
      </div>
    </div>
  );
}
