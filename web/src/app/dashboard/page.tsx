import { BookOpen, UtensilsCrossed, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";

const stats = [
  { label: "القوائم", value: "—", icon: BookOpen },
  { label: "الأصناف", value: "—", icon: UtensilsCrossed },
  { label: "المشاهدات", value: "—", icon: Eye },
];

export default function DashboardHome() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-cream">نظرة عامة</h1>
      <p className="mt-1 text-warm">أهلاً بك في لوحة تحكم مطعمك.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/12 text-gold">
              <s.icon size={22} />
            </span>
            <div>
              <p className="text-sm text-warm">{s.label}</p>
              <p className="font-display text-2xl font-black text-cream">
                {s.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-bold text-cream">الخطوات التالية</h2>
        <p className="mt-2 text-sm leading-relaxed text-warm">
          إدارة القوائم والأصناف، توليد أكواد QR، والإحصائيات قيد التطوير ضمن
          خطة الهجرة. تابع التقدّم في{" "}
          <code className="text-gold">web/MIGRATION.md</code>.
        </p>
      </Card>
    </div>
  );
}
