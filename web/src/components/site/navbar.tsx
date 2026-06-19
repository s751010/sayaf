"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#features", label: "المميزات" },
  { href: "#pricing", label: "الأسعار" },
  { href: "#contact", label: "تواصل" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line bg-charcoal/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-[var(--page-px,clamp(16px,5vw,60px))]">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 text-[13px] font-semibold text-warm transition-colors hover:text-cream"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm">
            دخول
          </Button>
          <Button size="sm">ابدأ مجاناً</Button>
        </div>

        <button
          type="button"
          aria-label="القائمة"
          className="text-cream md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-1 border-b border-line bg-charcoal-2 px-6 py-4 md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-semibold text-warm hover:bg-white/5 hover:text-cream"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              دخول
            </Button>
            <Button size="sm" className="flex-1">
              ابدأ مجاناً
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
