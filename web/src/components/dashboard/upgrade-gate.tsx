import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** شاشة قفل تظهر للميزات الحصرية بباقة «الاحترافية». */
export function UpgradeGate({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-md text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold/12 text-gold">
        <Lock size={22} />
      </span>
      <h2 className="mt-4 text-lg font-bold text-cream">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-warm">{desc}</p>
      <Link
        href="/dashboard/billing"
        className={cn(buttonVariants({ variant: "gold" }), "mt-5")}
      >
        الترقية إلى الاحترافية
      </Link>
    </Card>
  );
}
