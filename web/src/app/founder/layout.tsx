/**
 * تخطيط لوحة المؤسس — لا يضيف واجهة، وظيفته الوحيدة منع التصوير المسبق.
 *
 * كل صفحة تحت `/founder` تتحقق من `isFounder()` بنفسها، لكن التحقق يقرأ
 * الكوكيز؛ وإن بُني الموقع بلا متغيّرات Supabase تجاوزت الدالة القراءة
 * فأصبحت الصفحة قابلة للتصوير الثابت بمحتوى «غير مصرّح» محفوظ في الكاش.
 * انظر التعليق نفسه في `dashboard/layout.tsx`.
 */
export const dynamic = "force-dynamic";

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
