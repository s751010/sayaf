import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getMyEntitlements } from "@/lib/entitlements";
import { DashboardSidebar } from "@/components/dashboard/sidebar";

/**
 * تصيير ديناميكي إلزامي.
 *
 * `getCurrentUser()` يتجاوز قراءة الكوكيز حين تكون متغيّرات Supabase غائبة،
 * فإن بُني الموقع بلا متغيّرات بيئة صحيحة لم تُعتبر الصفحة ديناميكية، و«صُوِّرت»
 * لوحة التاجر كلّها وقت البناء كتحويلٍ ثابت إلى `/login` (تحقّقنا: 307 مع
 * `x-nextjs-prerender: 1`) — أي لوحة معطّلة تماماً في الإنتاج بلا أي خطأ بناء.
 * هذا السطر يجعل الفشل مستحيلاً بدل الاعتماد على صحّة إعدادات Netlify.
 */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ent = await getMyEntitlements();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        email={user.email}
        entitlements={{ ai: ent.ai, loyalty: ent.loyalty }}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
    </div>
  );
}
