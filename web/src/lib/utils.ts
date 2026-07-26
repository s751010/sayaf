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

/**
 * يوحّد قيمة الـslug القادمة من مسار الرابط.
 *
 * المسارات غير اللاتينية (العربية) تصل أحياناً مُرمَّزة بنسبة مئوية
 * (`%D9%85...`) وأحياناً مفكوكة، فيفشل مطابقتها بقاعدة البيانات ويظهر 404
 * لمطعم موجود فعلاً — وهو ما كان يحدث لكل مطعم باسم عربي.
 * فكّ الترميز آمن في الحالتين: نص بلا `%` يعود كما هو.
 */
export function normalizeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
