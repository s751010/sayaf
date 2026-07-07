import { ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";

/** بطاقة رفض الوصول لصفحات المؤسس. */
export function FounderDenied({
  message = "هذه المنطقة مخصّصة للمؤسس فقط.",
}: {
  message?: string;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="flex flex-col items-center gap-3">
          <ShieldAlert className="text-gold" size={28} />
          <h1 className="font-bold text-cream">لوحة المؤسس</h1>
          <p className="text-sm text-warm">{message}</p>
        </Card>
      </div>
    </main>
  );
}
