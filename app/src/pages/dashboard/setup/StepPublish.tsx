/**
 * الخطوة ٤ — انشر وشارك: المنيو كما يراه الزبون، ورابطه، وزرّ المشاركة.
 *
 * ⚠️ **الرابط من `menuUrl` وحده** (الثابت «رابط المنيو لا يُبنى بيد»):
 * `location.origin` مضيف اللوحة لا مضيف المنيو. والمعاينة في الإطار بـ
 * `?preview=1` — وضعٌ لا يُحسب فيه زيارةٌ في تحليلات التاجر، ولا يمنحه
 * `MenuPage` إلا لصاحب المطعم.
 *
 * ولا «اطبع كودك» هنا: قرار ٢٥/١٠ — لا يُدفع التاجر إلى الطباعة قبل قرار
 * النطاق، فالمطبوع لا يُحدَّث. المشاركة بالرابط تُحدَّث.
 */
import { useState } from "react";
import { Button, ErrorNote } from "@/components/ui";
import { ShareMenu } from "@/components/ShareMenu";
import { menuPreviewUrl } from "@/components/site";
import { updateMenu } from "@/lib/data";
import { menuUrl } from "@/lib/menuUrl";
import { Icon } from "@/lib/icons";
import { useDashboard } from "../Dashboard";
import { StepFooter } from "./parts";

export function StepPublish({
  dishCount,
  onBackToDishes,
  onDone,
}: {
  dishCount: number;
  onBackToDishes: () => void;
  onDone: () => void;
}) {
  const { restaurant, menus, refreshMenus } = useDashboard();
  const url = menuUrl(restaurant.slug);
  const preview = menuPreviewUrl(restaurant.slug);
  const hidden = menus !== null && menus.length > 0 && menus.every((m) => m.active === false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  /** كل القوائم مخفيّة ⇒ تُظهَر الأولى: منيوٌ «منشور» بلا قائمة ظاهرة صفحةٌ فارغة. */
  async function unhide() {
    if (!menus?.[0]) return;
    setBusy(true);
    setError("");
    try {
      await updateMenu(menus[0].id, { active: true });
      await refreshMenus();
    } catch {
      setError("تعذّر إظهار قائمتك — تحقّق من اتصالك وأعد المحاولة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {dishCount === 0 && (
        <div className="rounded-xl border border-gold/30 bg-gold/[.06] p-4">
          <p className="flex items-start gap-2 text-sm font-bold text-ink">
            <Icon name="warn" size={17} className="mt-px shrink-0 text-gold" />
            منيوك بلا أصناف بعد — زبونك سيرى صفحةً فارغة.
          </p>
          <Button variant="outline" className="mt-3" onClick={onBackToDishes}>
            → أضِف أصنافك
          </Button>
        </div>
      )}

      {hidden && (
        <div role="alert" className="rounded-xl border border-bad/30 bg-bad/10 p-4">
          <p className="text-sm font-bold text-ink">قائمتك مخفيّة — لن يراها الزبون.</p>
          <Button className="mt-3" onClick={() => void unhide()} disabled={busy}>
            {busy ? "جارٍ النشر…" : "انشرها الآن"}
          </Button>
        </div>
      )}
      {error && <div role="alert"><ErrorNote>{error}</ErrorNote></div>}

      {url && (
        <section className="rounded-[14px] border border-line-gold bg-gold/[.04] p-4">
          <p className="text-sm font-bold text-ink">
            {hidden || dishCount === 0 ? "رابط منيوك" : "منيوك منشور على هذا الرابط"}
          </p>
          {/* الرابط كاملاً بلا قصّ — هو ما سيكتبه الزبون أو يقرؤه التاجر بصوته. */}
          <p dir="ltr" className="mt-2 break-all rounded-lg bg-panel px-3 py-2 text-start text-sm font-bold text-ink" data-setup-url>
            {url.replace(/^https?:\/\//, "")}
          </p>
          <div className="mt-3">
            <ShareMenu name={restaurant.name} url={url} />
          </div>
        </section>
      )}

      {preview && (
        <section>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-ink">كما يراه زبونك</p>
            <a
              href={preview}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-dim hover:text-ink"
            >
              افتحه كاملاً ↗
            </a>
          </div>
          {/* `frame-ancestors 'self'` يسمح به ما دام المنيو على نطاق اللوحة
              (`MENU_DOMAIN = null`). ويوم يُربط نطاقٌ آخر يُحجب الإطار — ويبقى
              «افتحه كاملاً» فوقه طريقاً لا يُحجب. */}
          <iframe
            src={preview}
            title="معاينة منيوك"
            loading="lazy"
            className="mx-auto mt-2 block h-[520px] w-full max-w-[380px] rounded-[20px] border border-line bg-panel"
          />
        </section>
      )}

      <StepFooter>
        <Button onClick={onDone}>تمّ — إلى لوحتي ←</Button>
      </StepFooter>
    </div>
  );
}
