/**
 * التصميم — شكل منيوك كما يراه الزبون.
 *
 * ═══ لماذا صفحة مستقلّة ═══
 *
 * مُنتقي الطوابع كان مدفوناً أسفل صفحة «القوائم»، وصاحب القائمة الواحدة —
 * وهو الأغلب — لا يعود إليها بعد اليوم الأول. والدليل على أن ذلك عُرف ولم
 * يُحلّ: أُضيف إلى «نظرة عامة» رابطُ ضمادة «🎨 صمّم منيوك ← القوائم». هذا
 * أجمل ما في المنتج، ومكانه أن يكون عنصراً في القائمة لا هامشاً في صفحة أخرى.
 *
 * وتجتمع هنا الهوية البصرية كلها: الطابع واللون وشكل العرض والشعار والغلاف
 * والزينة الموسمية — فالتاجر الذي جاء «يزيّن منيوه» يجد كل أدواته في مكان واحد
 * بدل أن يتنقّل بين ثلاث صفحات.
 */
import { useEffect, useState } from "react";
import { uploadImage } from "@/lib/api";
import { renderOgImage } from "@/lib/ogImage";
import {
  Button,
  Card,
  Input,
  SavedBadge,
  Switch,
  useToast,
} from "@/components/ui";
import { PreviewMenuButton } from "@/components/site";
import { ImageUploader } from "@/components/ImageUploader";
import { ThemePreview } from "@/components/menu/ThemePreview";
import { SuggestBadge, SuitsLine, ThemeOrderNote, useThemeOrder } from "@/components/ThemeSuggest";
import { LAYOUT_OPTIONS, LayoutGlyph } from "@/components/LayoutOptions";
import {
  applyThemeToAllMenus,
  updateBrandColor,
  updateRestaurantFields,
  type RestaurantSettingsPayload,
  reportSilentFailure,
} from "@/lib/data";
import {
  getTheme,
  isHex,
  splitThemeId,
  themeBaseOf,
  themeIdOf,
} from "@/lib/themes";
import { SEASONS, seasonWindowOpen } from "@/lib/seasons";
import { cn } from "@/lib/utils";
import { useDashboard } from "./Dashboard";
import { Icon } from "@/lib/icons";

export default function Design() {
  const { restaurant, setRestaurant, menus, refreshMenus } = useDashboard();
  // يرتّب المُنتقي حسب نوع النشاط ويعلّم المقترح — لا يطبّق شيئاً (`lib/themeSuggest.ts`).
  const themeOrder = useThemeOrder(restaurant.type);
  const toast = useToast();

  const activeThemeId = menus?.find((m) => m.theme)?.theme ?? null;
  const parsedTheme = splitThemeId(activeThemeId);
  /** الطابع المطبَّق حالياً بلا اللون — عليه تُبنى الاختيارات والمعاينات. */
  // `themeBaseOf` لا `parsedTheme.base`: طابعٌ خرج من القائمة («royal») يُردّ
  // إلى الباقي الذي يُعرض به فعلاً، فيُعلَّم في المُنتقي بدل ألّا يُعلَّم شيء.
  const activeBase = themeBaseOf(activeThemeId);
  const [brandHex, setBrandHex] = useState(
    () => parsedTheme.hex ?? (restaurant.cover_color && isHex(restaurant.cover_color) ? restaurant.cover_color : "#d4a843")
  );
  const [useBrand, setUseBrand] = useState(() => parsedTheme.hex !== null);
  const activeLayout = parsedTheme.layout;

  /* الهوية البصرية — تُحفظ بزرّها لا بزرّ عامّ في قاع صفحة أخرى. */
  const [logo, setLogo] = useState(restaurant.logo_image ?? "");
  const [banner, setBanner] = useState(restaurant.banner_image ?? "");
  const [season, setSeason] = useState(restaurant.season ?? "");
  const [savingBrand, setSavingBrand] = useState(false);
  const [makingOg, setMakingOg] = useState(false);
  const brandDirty =
    logo !== (restaurant.logo_image ?? "") || banner !== (restaurant.banner_image ?? "");
  const seasonDirty = season !== (restaurant.season ?? "");

  useEffect(() => {
    document.title = "التصميم — كلاود منيو";
  }, []);

  async function pickTheme(id: string) {
    try {
      await applyThemeToAllMenus(restaurant.id, id);
      const hex = splitThemeId(id).hex;
      // ⚠️ **نجاحٌ جزئي كان يُعرض نجاحاً كاملاً.** الطابع يُطبَّق على القوائم،
      // ثم يُحفظ اللون في `cover_color` (يستخدمه تدرّج ترويسة المنيو) — وكان
      // فشل الثانية مبتلَعاً بـ`catch` فارغة: يقرأ التاجر «طُبّق ✓» ويفتح
      // منيوه فيجد ترويسةً بلون آخر، بلا سببٍ ظاهر ولا أثرٍ عندنا.
      let colorSaved = true;
      if (hex) {
        await updateBrandColor(restaurant.id, hex).catch((e) => {
          colorSaved = false;
          reportSilentFailure("updateBrandColor", e);
        });
        setRestaurant({ ...restaurant, cover_color: hex });
      }
      await refreshMenus();
      toast(
        colorSaved
          ? "طُبّق الطابع على منيوك ✓"
          : "طُبّق الطابع — وتعذّر حفظ لون العلامة، حاول مرّة أخرى.",
        colorSaved ? undefined : "err"
      );
    } catch {
      toast("تعذّر تطبيق الطابع.", "err");
    }
  }

  /** حفظ جزئي: حقول هذا القسم وحدها — لا يمسّ ما ضبطه التاجر في غيره. */
  async function saveFields(fields: Partial<RestaurantSettingsPayload>, done: string) {
    setSavingBrand(true);
    try {
      await updateRestaurantFields(restaurant.id, fields);
      setRestaurant({ ...restaurant, ...fields });
      toast(done);
    } catch {
      toast("تعذّر الحفظ. حاول مجدداً.", "err");
    } finally {
      setSavingBrand(false);
    }
  }

  /** الزينة تظهر في نافذتها فقط — أو إن كانت مشغّلة الآن كي يتمكّن من إطفائها. */
  const seasons = SEASONS.filter((s) => seasonWindowOpen(s.id) || restaurant.season === s.id);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">التصميم</h1>
          <p className="mt-1 text-sm text-dim">شكل منيوك كما يراه زبونك — جرّب وعاين فوراً.</p>
        </div>
        <PreviewMenuButton slug={restaurant.slug} label="عاين النتيجة" />
      </div>

      {/* ── الطابع ── */}
      <section className="mt-6">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="palette" size={17} className="shrink-0 text-gold" />{" "}
          طابع منيوك</h2>
        <p className="mt-1 text-sm text-dim">
          كل طابع تصميم كامل — زخرفة وترويسة وتخطيط أطباق وخطّ، لا لوناً فقط.
        </p>
        <ThemeOrderNote
          typeLabel={themeOrder.typeLabel}
          isCafe={themeOrder.isCafe}
          flavor={themeOrder.flavor}
          setFlavor={themeOrder.setFlavor}
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {themeOrder.ordered.map((t) => {
            const on = activeBase === t.id;
            const id = themeIdOf(t.id, useBrand ? brandHex : null, activeLayout);
            return (
              <div key={t.id} className="flex flex-col">
                <button
                  onClick={() => pickTheme(id)}
                  className={cn(
                    "overflow-hidden rounded-2xl border-2 text-start transition-transform hover:scale-[1.02]",
                    on ? "border-gold" : "border-line"
                  )}
                >
                  <ThemePreview theme={getTheme(id)} />
                  <div className={cn("px-3 py-2", on ? "bg-gold/10" : "bg-panel")}>
                    <SuggestBadge on={t.id === themeOrder.suggested} />
                    <p className={cn("text-xs font-bold", on ? "text-gold" : "text-ink")}>
                      {t.name} {on && "✓"}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-faint">{t.tagline}</p>
                    <SuitsLine theme={t} />
                  </div>
                </button>
                {/* معاينة كاملة قبل الالتزام: البطاقة المصغّرة تكفي للمفاضلة
                    ولا تُري منيواً حقيقياً بهذا الطابع أمام الزبائن. */}
                <a
                  href={`/demo?theme=${encodeURIComponent(t.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-center text-[11px] font-bold text-dim hover:text-gold"
                >
                  عاينه كاملاً ↗
                </a>
              </div>
            );
          })}
        </div>

        {/* شكل عرض الأطباق — يُطبَّق فوق الطابع المختار ولا يُلغي شخصيته. */}
        <Card className="mt-4">
          <p className="text-sm font-bold text-ink">🗂️ شكل عرض الأطباق</p>
          <p className="mt-1 text-xs text-dim">
            لكل طابع شكله الافتراضي، لكن الاختيار لك: زخرفة الطابع وترويسته وخطّه
            تبقى كما هي ويتغيّر شكل البطاقات وحده.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {LAYOUT_OPTIONS.map((o) => {
              const on = activeLayout === o.value;
              return (
                <button
                  key={o.label}
                  onClick={() => pickTheme(themeIdOf(activeBase, useBrand ? brandHex : null, o.value))}
                  className={cn(
                    "rounded-xl border-2 px-2 py-2.5 text-center transition-colors",
                    on ? "border-gold bg-gold/10" : "border-line bg-panel2 hover:border-gold/40"
                  )}
                >
                  <LayoutGlyph value={o.value} />
                  <p className={cn("mt-1.5 text-[11px] font-bold", on ? "text-gold" : "text-ink")}>
                    {o.label} {on && "✓"}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-faint">{o.hint}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* لون العلامة يُطبَّق **على الطابع** لا بديلاً عنه. */}
        <Card className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-ink">🖌️ لون علامتك</p>
              <p className="mt-1 text-xs text-dim">
                يُصبغ به الطابع المختار مع بقاء زخرفته وتخطيطه.
              </p>
            </div>
            <Switch checked={useBrand} onChange={setUseBrand} label="استخدم لوني" />
          </div>
          {useBrand && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={isHex(brandHex) ? brandHex : "#d4a843"}
                  onChange={(e) => setBrandHex(e.target.value)}
                  aria-label="لون العلامة"
                  className="h-11 w-16 cursor-pointer rounded-xl border border-line bg-panel2 p-1"
                />
                <Input
                  dir="ltr"
                  value={brandHex}
                  onChange={(e) => setBrandHex(e.target.value)}
                  className="w-32 text-center"
                  aria-label="كود اللون"
                />
                <Button
                  onClick={() => pickTheme(themeIdOf(activeBase, brandHex, activeLayout))}
                  disabled={!isHex(brandHex)}
                >
                  طبّق اللون على «{getTheme(activeBase).name}»
                </Button>
              </div>
              {!isHex(brandHex) && (
                <p className="mt-2 text-xs text-bad">كود اللون غير صالح — استخدم صيغة #RRGGBB.</p>
              )}
            </>
          )}
        </Card>

      </section>

      {/* ── الهوية البصرية ── */}
      <section className="mt-9">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="tag" size={17} className="shrink-0 text-gold" />{" "}
          شعارك وغلافك</h2>
        <p className="mt-1 text-sm text-dim">أول ما تراه عين الزبون أعلى المنيو.</p>
        <Card className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader
              label="شعار المطعم"
              value={logo}
              onChange={setLogo}
              bucket="restaurant-images"
              pathPrefix={`${restaurant.id}/logo`}
              shape="square"
            />
            <ImageUploader
              label="صورة الغلاف"
              value={banner}
              onChange={setBanner}
              bucket="restaurant-images"
              pathPrefix={`${restaurant.id}/banner`}
              shape="wide"
            />
          </div>
          {/* ── صورة المشاركة ───────────────────────────────────────────
              ⚠️ **١٧ من ١٩ مطعماً بلا بانر**، وبطاقة المشاركة تسقط عندها إلى
              صورة عامّة واحدة نفسها للجميع — فرابط المنيو على واتساب يبدو
              مجهولاً. وتوليدها على الحافة غير ممكن عملياً: واتساب وفيسبوك لا
              يعرضان SVG، وتحويله PNG هناك وزنٌ ومخاطرة. فتُولَّد هنا مرّة
              واحدة وتُرفع كصورة غلاف حقيقية. */}
          {!banner.trim() && (
            <div className="mt-4 rounded-xl border border-gold/30 bg-gold/[.05] p-3.5">
              <p className="text-sm font-bold text-ink">
                ✨ ما عندك صورة غلاف — ولّدها بضغطة
              </p>
              <p className="mt-1 text-xs leading-relaxed text-faint">
                نصنع بطاقة أنيقة باسم مطعمك ولون علامتك، تظهر حين يُشارَك رابط
                منيوك على واتساب. تقدر تستبدلها بصورتك في أي وقت.
              </p>
              <Button
                className="mt-3"
                variant="outline"
                disabled={makingOg}
                onClick={async () => {
                  setMakingOg(true);
                  try {
                    const blob = await renderOgImage({
                      name: restaurant.name,
                      accent: restaurant.cover_color && isHex(restaurant.cover_color) ? restaurant.cover_color : "#d4a843",
                      logo: restaurant.logo,
                      type: restaurant.type,
                    });
                    const url = await uploadImage(
                      "restaurant-images",
                      `${restaurant.id}/banner/og-${Date.now()}.png`,
                      blob
                    );
                    setBanner(url);
                    await saveFields({ banner_image: url }, "وُلّدت صورة المشاركة ✓");
                  } catch {
                    toast("تعذّر توليد الصورة.", "err");
                  } finally {
                    setMakingOg(false);
                  }
                }}
              >
                {makingOg ? "جارٍ التوليد…" : "ولّد صورة المشاركة"}
              </Button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              disabled={savingBrand || !brandDirty}
              onClick={() =>
                saveFields(
                  { logo_image: logo.trim() || null, banner_image: banner.trim() || null },
                  "حُفظت هويتك البصرية ✓"
                )
              }
            >
              {savingBrand ? "جارٍ الحفظ…" : "حفظ"}
            </Button>
            <SavedBadge dirty={brandDirty} />
          </div>
        </Card>
      </section>

      {/* ── الزينة الموسمية ── */}
      {seasons.length > 0 && (
        <section className="mt-9">
          <h2 className="inline-flex items-center gap-2 font-display text-lg font-extrabold text-ink">
          <Icon name="star" size={17} className="shrink-0 text-gold" />{" "}
          زينة الموسم</h2>
          <p className="mt-1 text-sm text-dim">
            لمسة تُضاف فوق طابعك بلا أن تبدّله — وتُطفئها متى شئت.
          </p>
          <Card className="mt-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {[{ id: "", name: "بلا زينة", emoji: "—" }, ...seasons].map((s) => {
                const on = season === s.id;
                return (
                  <button
                    key={s.id || "none"}
                    type="button"
                    onClick={() => setSeason(s.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-bold transition-colors",
                      on
                        ? "border-gold bg-gold/12 text-ink"
                        : "border-line text-dim hover:border-line-gold hover:text-ink"
                    )}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    {s.name}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                disabled={savingBrand || !seasonDirty}
                onClick={() => saveFields({ season: season || null }, "حُفظت الزينة ✓")}
              >
                {savingBrand ? "جارٍ الحفظ…" : "حفظ"}
              </Button>
              <SavedBadge dirty={seasonDirty} />
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
