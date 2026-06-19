"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  UtensilsCrossed,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/site/logo";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/dashboard/menus", label: "القوائم", icon: BookOpen },
  { href: "/dashboard/dishes", label: "الأصناف", icon: UtensilsCrossed },
  { href: "/dashboard/qr", label: "أكواد QR", icon: QrCode },
  { href: "/dashboard/analytics", label: "الإحصائيات", icon: BarChart3 },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

export function DashboardSidebar({ email }: { email?: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-l border-line-dim bg-charcoal-2 p-4">
      <div className="px-2 py-2">
        <Logo />
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-gold/10 text-gold"
                  : "text-warm hover:bg-white/5 hover:text-cream"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 border-t border-line-dim pt-4">
        {email && (
          <p className="truncate px-2 pb-2 text-xs text-muted" dir="ltr">
            {email}
          </p>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-warm transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  );
}
