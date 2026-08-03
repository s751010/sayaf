/**
 * زر «راسلنا واتساب» لدعم المنصة.
 *
 * صندوق التذاكر ممتاز لكن التاجر السعودي يراسل واتساب — والتذكرة تبقى خياراً
 * ثانياً لمن يريد أثراً مكتوباً.
 *
 * الرقم يأتي من `site_settings.support_whatsapp` ليغيّره المؤسس بلا نشر جديد.
 * لا رقم ⇒ لا زر: رابط إلى رقم لا يردّ أسوأ من غياب الزر.
 */
import { useEffect, useState } from "react";
import { getSiteSetting } from "@/lib/data";
import { SUPPORT_WHATSAPP } from "@/lib/config";
import { cn, whatsappUrl } from "@/lib/utils";
import { Icon } from "@/lib/icons";

/** الرقم المعتمد، أو null إن لم يُضبط بعد. */
export function useSupportWhatsApp(): string | null {
  const [number, setNumber] = useState<string | null>(SUPPORT_WHATSAPP || null);
  useEffect(() => {
    getSiteSetting<string>("support_whatsapp")
      .then((v) => {
        // القيمة قد تُحفظ نصاً أو ككائن {number} — نتسامح مع الاثنين.
        const raw = typeof v === "string" ? v : ((v as { number?: string } | null)?.number ?? "");
        if (raw.trim()) setNumber(raw.trim());
      })
      .catch(() => {});
  }, []);
  return number;
}

export function SupportWhatsAppButton({
  message,
  className,
  label = "راسلنا واتساب",
}: {
  /** رسالة معبّأة مسبقاً — اسم المطعم والبريد يوفّران على التاجر شرح من هو. */
  message?: string;
  className?: string;
  label?: string;
}) {
  const number = useSupportWhatsApp();
  if (!number) return null;
  return (
    <a
      href={whatsappUrl(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-good px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98]",
        className
      )}
    >
      <Icon name="share" size={16} /> {label}
    </a>
  );
}
