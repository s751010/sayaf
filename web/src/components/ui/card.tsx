import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line-dim bg-white/[0.03] p-5 transition-colors hover:border-line",
        className
      )}
      {...props}
    />
  );
}
