import { isFounder } from "@/lib/founder";
import { getSiteSettings } from "@/lib/settings";
import { FounderNav } from "@/components/founder/founder-nav";
import { FounderDenied } from "@/components/founder/denied";
import { SettingsForm } from "@/components/founder/settings-form";

export const dynamic = "force-dynamic";

export default async function FounderSettingsPage() {
  if (!(await isFounder())) return <FounderDenied />;

  const settings = await getSiteSettings();

  return (
    <main className="flex-1 px-[var(--page-px,clamp(16px,5vw,60px))] py-10">
      <div className="mx-auto max-w-3xl">
        <FounderNav />
        <h1 className="font-display text-2xl font-bold text-cream">⚙️ إعدادات الموقع</h1>
        <p className="mt-1 text-warm">
          تحكّم عام بالميزات ومحتوى التذييل — تُطبَّق على الموقع فوراً.
        </p>
        <div className="mt-6">
          <SettingsForm settings={settings} />
        </div>
      </div>
    </main>
  );
}
