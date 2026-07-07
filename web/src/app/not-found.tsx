import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display text-6xl font-black text-gold">٤٠٤</p>
      <h1 className="mt-4 text-2xl font-bold text-cream">الصفحة غير موجودة</h1>
      <p className="mt-2 max-w-sm text-warm">
        قد يكون الرابط غير صحيح أو أن المطعم لم يعد متاحاً.
      </p>
      <Link href="/" className={`${buttonVariants({ size: "lg" })} mt-8`}>
        العودة للرئيسية
      </Link>
    </main>
  );
}
