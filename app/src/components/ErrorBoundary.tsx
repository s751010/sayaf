/**
 * حاجز أخطاء — يمنع الشاشة البيضاء.
 *
 * صفحة المنيو تُفتح من كود QR مطبوع على الطاولة؛ أي استثناء أثناء الرسم كان
 * يترك الزبون أمام صفحة بيضاء تماماً بلا أي طريق للخروج. هنا نعرض رسالة عربية
 * واضحة مع زر إعادة محاولة.
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/data";
import { isChunkLoadError, mayReload, reloadOnce } from "@/lib/chunkReload";
import { K, getItem } from "@/lib/storage";

type Props = { children: ReactNode; fallback?: ReactNode };
/** `reloading`: قطعةٌ قديمة والتحديث مسموح — نعرض «نحدّث» لا «حدث خطأ». */
type State = { error: Error | null; reloading?: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return {
      error,
      reloading: isChunkLoadError(error) && mayReload(getItem(K.CHUNK_RELOAD, true)),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // قطعةٌ قديمة بعد نشر: تحديثٌ واحد يكفي — لا انهيار ولا بلاغ (`lib/chunkReload.ts`).
    if (isChunkLoadError(error) && reloadOnce()) return;
    /**
     * ⚠️ كان هنا `console.error` وحده، وتعليقٌ يقول «خرائط المصدر مفعّلة في
     * البناء فالأثر قابل للقراءة» — و§23 أطفأها (`sourcemap: false`). فكان
     * السطر الوحيد الباقي أثراً **مُصغَّراً في console جهاز الزبون**: لا
     * يقرؤه أحد، ولا يصل إلينا، ولا يخبرنا أن منيو تاجر انهار أصلاً.
     *
     * الآن يُرسَل إلى `client_errors` (بلا هوية، والخادم يجمّعه بالتوقيع
     * ويحدّ معدّله)، ويبقى `console.error` لمن يفتح الأدوات وقت الحدث.
     */
    console.error("[CloudMenu] خطأ غير متوقع:", error, info.componentStack);
    reportClientError(error, info.componentStack);
  }

  private reset = () => this.setState({ error: null, reloading: false });

  render() {
    if (!this.state.error) return this.props.children;
    // التحديث جارٍ (`componentDidCatch`) — لا نُري «حدث خطأ» لحظةً قبله.
    if (this.state.reloading) {
      return (
        <div className="flex min-h-dvh items-center justify-center px-6 text-center text-sm text-dim">
          نحدّث الصفحة لأحدث نسخة…
        </div>
      );
    }
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="text-5xl">⚠️</span>
        <h1 className="font-display text-xl font-extrabold text-ink">
          حدث خطأ غير متوقع
        </h1>
        <p className="max-w-sm text-sm text-dim">
          نعتذر — واجهت الصفحة مشكلة أثناء العرض. جرّب إعادة المحاولة، وإن تكرّر
          الأمر أعد تحميل الصفحة.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={this.reset}
            className="inline-flex items-center justify-center rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-on-gold transition-all active:scale-[0.98]"
          >
            إعادة المحاولة
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-xl border border-line-gold px-4 py-2.5 text-sm font-bold text-ink transition-all hover:bg-gold/10 active:scale-[0.98]"
          >
            تحديث الصفحة
          </button>
        </div>
      </div>
    );
  }
}
