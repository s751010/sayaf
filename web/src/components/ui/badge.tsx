import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold",
  {
    variants: {
      variant: {
        gold: "text-gold bg-gold/12 border border-gold/30",
        green: "text-success bg-success/12 border border-success/30",
        red: "text-danger bg-danger/12 border border-danger/30",
        neutral: "text-warm bg-white/5 border border-white/10",
      },
    },
    defaultVariants: { variant: "gold" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
