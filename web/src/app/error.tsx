"use client";

import Link from "next/link";

import { useErrorReport } from "@/components/site/error-report";

/**
 * حدّ الأخطاء العام. قبله كان أي استثناء في التصيير يترك شاشة بيضاء عند
 * الزبون أو التاجر بلا أي أثر في أي مكان.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useErrorReport(error);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-5xl">🍽️</p>
      <h1 className="text-xl font-bold text-cream">حدث خلل غير متوقّع</h1>
      <p className="max-w-md text-sm text-muted">
        سُجّل الخطأ لدينا تلقائياً. جرّب إعادة المحاولة، وإن تكرّر راسل الدعم.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink"
        >
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="rounded-full border border-gold/40 px-5 py-2 text-sm font-bold text-gold"
        >
          الصفحة الرئيسية
        </Link>
      </div>
      {error.digest && <p className="text-[11px] text-muted">المرجع: {error.digest}</p>}
    </main>
  );
}
