import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable DOM id for a menu category (used by the sticky nav + sections). */
export function categoryId(name: string): string {
  return "cat-" + encodeURIComponent(name.trim().replace(/\s+/g, "-"));
}

export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (!Number.isFinite(n)) return "0";
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 2,
  }).format(n as number);
}
