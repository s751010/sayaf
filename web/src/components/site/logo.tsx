import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 no-underline", className)}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/35 bg-charcoal">
        <svg viewBox="0 0 120 120" className="h-6 w-6" aria-hidden>
          <g fill="#d4a843" transform="translate(60,60)">
            <path d="M-28-6a28 22 0 0 1 56 0c0 2-1 4-3 4h-50c-2 0-3-2-3-4z" />
            <rect x="-30" y="2" width="60" height="7" rx="3.5" />
          </g>
        </svg>
      </span>
      <span className="font-display text-xl font-black text-cream">
        كلاود منيو
      </span>
    </Link>
  );
}
