/**
 * مشاركة رابط المنيو.
 *
 * التاجر السعودي يشارك منيوه في واتساب وحالة إنستقرام قبل أن يفكّر في طباعة
 * QR — وكانت اللوحة تعطيه «نسخ الرابط» وحده. والمشاركة ليست ترفاً تسويقياً:
 * كل مشاهدة تأتي منها تُغذّي تحليلاته، وهي أول ما يُريه أن المنتج يعمل.
 *
 * `navigator.share` حين يتوفّر (الجوال) لأنه يفتح ورقة النظام بكل التطبيقات؛
 * وواتساب صريح دائماً لأنه الوجهة الفعلية في ٩ من ١٠ حالات.
 */
import { Button, useToast } from "@/components/ui";

export function ShareMenu({ name, url }: { name: string; url: string }) {
  const toast = useToast();
  const text = `منيو ${name} 👇\n${url}`;

  async function nativeShare() {
    // `navigator.share` يرمي AbortError إن أغلق المستخدم الورقة — ليس خطأً.
    try {
      await navigator.share({ title: `منيو ${name}`, text: `منيو ${name}`, url });
    } catch {
      /* أُلغيت المشاركة — لا شيء يُقال. */
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-xl bg-good/15 px-4 py-2 text-sm font-bold text-good hover:bg-good/25"
      >
        💬 واتساب
      </a>
      <Button
        variant="outline"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(
            () => toast("نُسخ الرابط ✓"),
            () => toast("تعذّر النسخ", "err")
          );
        }}
      >
        📋 نسخ الرابط
      </Button>
      {typeof navigator !== "undefined" && "share" in navigator && (
        <Button variant="outline" onClick={nativeShare}>
          📤 مشاركة
        </Button>
      )}
    </div>
  );
}
