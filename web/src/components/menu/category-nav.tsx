"use client";

import { useEffect, useState } from "react";
import { categoryId as slugId } from "@/lib/utils";

/** Sticky category bar with scroll-spy that highlights the section in view. */
export function CategoryNav({ categories }: { categories: string[] }) {
  const [active, setActive] = useState(categories[0] ?? "");

  useEffect(() => {
    const ids = categories.map(slugId);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  if (categories.length < 2) return null;

  return (
    <nav
      className="sticky top-0 z-30 -mx-4 mb-2 border-b px-4 backdrop-blur-md"
      style={{ background: "color-mix(in srgb, var(--m-bg) 80%, transparent)", borderColor: "var(--m-border)" }}
    >
      <div className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((cat) => {
          const id = slugId(cat);
          const isActive = active === id;
          return (
            <a
              key={cat}
              href={`#${id}`}
              className="whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors"
              style={
                isActive
                  ? { background: "var(--m-accent)", color: "var(--m-on-accent)", borderColor: "var(--m-accent)" }
                  : { background: "transparent", color: "var(--m-muted)", borderColor: "var(--m-border)" }
              }
            >
              {cat}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
