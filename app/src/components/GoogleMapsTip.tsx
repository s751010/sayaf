/**
 * «اربط منيوك بقوقل ماب» — بطاقة صغيرة في صفحة الأكواد.
 *
 * من يبحث عن المطعم في قوقل يرى ملفّه قبل أن يصل، وفي الملفّ خانة «رابط
 * القائمة». البطاقة تعطي التاجر الرابط الصحيح بضغطة، والشرح في المقال.
 *
 * ═══ ⚠️ الرابط العام وحده — لا رابط الطاولة ═══
 *
 * صفحة الأكواد فيها خانة «رقم الطاولة» تُلحق `?table=` برابطها. ولو نُسخ ذلك
 * الرابط إلى قوقل لصار كل زائرٍ من الخرائط «جالساً على الطاولة 5» في طلبه.
 * فالبطاقة تأخذ `slug` لا الرابط المعروض، وتبني منه `menuUrl(slug)` بلا لاحقة.
 *
 * والإخفاء محلي (`K.MAPS_TIP_DISMISSED`) كإخفاء الإعلانات: نصيحةٌ لا حالة حساب.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, useToast } from "@/components/ui";
import { Icon } from "@/lib/icons";
import { K, getItem, setItem } from "@/lib/storage";
import { menuUrl } from "@/lib/menuUrl";

export const MAPS_GUIDE_PATH = "/blog/google-maps-menu-link";

export function GoogleMapsTip({ slug }: { slug: string | null }) {
  const toast = useToast();
  const [hidden, setHidden] = useState(() => getItem(K.MAPS_TIP_DISMISSED) === "1");
  const url = menuUrl(slug);

  // بلا رابط لا شيء يُنسخ — وصفحة الأكواد تقول له أصلاً أن يضبطه أولاً.
  if (hidden || !url) return null;

  function dismiss() {
    setHidden(true);
    setItem(K.MAPS_TIP_DISMISSED, "1");
  }

  function copy() {
    if (!navigator.clipboard) {
      toast("تعذّر النسخ — انسخ الرابط من «الرئيسية».", "err");
      return;
    }
    navigator.clipboard.writeText(url!).then(
      () => toast("نُسخ رابط منيوك ✓ — الصقه في «رابط القائمة»"),
      () => toast("تعذّر النسخ", "err")
    );
  }

  return (
    <section
      aria-labelledby="maps-tip-title"
      className="mt-5 flex items-start gap-3 rounded-[14px] border border-gold/25 bg-gold/[.04] p-4"
    >
      <Icon name="pin" size={20} className="mt-0.5 shrink-0 text-gold" />
      <div className="min-w-0 flex-1">
        <h2 id="maps-tip-title" className="text-sm font-black text-ink">
          اربط منيوك بقوقل ماب
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-dim">
          الصق رابط منيوك في خانة «رابط القائمة» بملفّ نشاطك على قوقل، فيرى
          منيوك من يبحث عن مطعمك قبل أن يصل.
        </p>
        <p className="mt-1.5 truncate text-right text-xs text-gold" dir="ltr">
          {url.replace(/^https?:\/\//, "")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={copy}>
            <Icon name="copy" size={14} /> انسخ الرابط
          </Button>
          <Link
            to={MAPS_GUIDE_PATH}
            className="inline-flex min-h-9 items-center px-2 text-xs font-bold text-gold underline-offset-4 hover:underline"
          >
            كيف؟
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="إخفاء بطاقة قوقل ماب"
        className="-m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-dim hover:bg-ink/5 hover:text-ink"
      >
        <Icon name="close" size={16} />
      </button>
    </section>
  );
}
