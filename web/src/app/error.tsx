"use client";

import { useEffect } from "react";
import Link from "next/link";

/** حد أخطاء عام: يلتقط أي خطأ غير متوقع أثناء العرض ويعرض بديلاً عربياً. */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="font-display text-2xl font-bold text-cream">
        حدث خطأ غير متوقع
      </h1>
      <p className="max-w-md text-sm text-warm">
        نعتذر عن الإزعاج — وقع خطأ أثناء تحميل هذه الصفحة. جرّب إعادة المحاولة،
        وإن تكرر الخطأ تواصل معنا.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => unstable_retry()}
          className="rounded-xl bg-gradient-to-br from-gold to-gold-dark px-6 py-2.5 text-sm font-bold text-charcoal"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="rounded-xl border border-line px-6 py-2.5 text-sm font-bold text-cream hover:border-gold hover:text-gold"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
