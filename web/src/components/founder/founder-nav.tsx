"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Megaphone,
  Ticket,
  LifeBuoy,
  PenSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/founder", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/founder/restaurants", label: "المطاعم والاشتراكات", icon: Store },
  { href: "/founder/announcements", label: "الإعلانات", icon: Megaphone },
  { href: "/founder/promos", label: "أكواد الخصم", icon: Ticket },
  { href: "/founder/support", label: "الدعم", icon: LifeBuoy },
  { href: "/founder/blog", label: "المدونة", icon: PenSquare },
  { href: "/founder/settings", label: "الإعدادات", icon: Settings },
];

export function FounderNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex flex-wrap gap-1.5 rounded-2xl border border-line-dim bg-charcoal-2 p-1.5">
      {nav.map((item) => {
        const active =
          item.href === "/founder"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
              active
                ? "bg-gold/10 text-gold"
                : "text-warm hover:bg-white/5 hover:text-cream"
            )}
          >
            <item.icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
