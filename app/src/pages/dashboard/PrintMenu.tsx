/**
 * المنيو المطبوع — ورقةٌ تطبع نفس أرقام المنيو الرقمي.
 *
 * ═══ لماذا صفحةٌ تُطبع لا ملفٌّ يُرسم ═══
 *
 * بطاقات الكاشير تُرسم على `canvas` لأنها قطعة واحدة بقياس ثابت. أمّا المنيو
 * فطوله يتبع عدد الأطباق، والمتصفّح أمهر من أي رسّام يدوي في **تقسيم الصفحات
 * وتشكيل الحروف العربية**. فتُرسم الورقة HTML بقياس A4، ويطبعها المتصفّح أو
 * يحفظها PDF — والقواعد في `@media print` (global.css) تُخفي كل ما عداها.
 *
 * ⚠️ الإلزام يشمل الورق: السعرات بجانب كل صنف، والكافيين للمشروبات، وتنبيه
 * الصوديوم المرتفع، ومسبّبات الحساسية، وعبارة الاحتياج اليومي. كل ذلك هنا من
 * نفس أعمدة القاعدة التي يقرؤها المنيو الرقمي — رقمٌ واحد في كل مكان.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, EmptyState, Select, Skeleton, Switch } from "@/components/ui";
import { DAILY_KCAL } from "@/components/NutritionLabel";
import { useDashboard } from "./Dashboard";
import { PrintTabs } from "./Tabs";
import { getMyDishes } from "@/lib/data";
import { getTheme, qrSafeColor } from "@/lib/themes";
import { loadThemeFont } from "@/lib/fonts";
import { groupByCategory, parseCategoryOrder } from "@/lib/categories";
import { displayAllergens } from "@/lib/allergens";
import { menuUrl } from "@/lib/menuUrl";
import { qrDataUrl } from "@/lib/qr";
import { burnMinutes, isHighSodium } from "@/lib/nutrition";
import { Icon } from "@/lib/icons";
import { formatPrice } from "@/lib/utils";
import type { Dish } from "@/lib/types";

const INK = "#15130f";
const MUTED = "#5a5346";

export default function PrintMenu() {
  const { restaurant, menus } = useDashboard();
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [menuId, setMenuId] = useState<string>("");
  const [columns, setColumns] = useState<1 | 2>(2);
  const [showDesc, setShowDesc] = useState(true);
  const [qr, setQr] = useState<string | null>(null);
  /** فشل التحميل ليس «لا أطباق» (القاعدة «ج») — ولا تُطبع ورقةٌ ناقصة. */
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    getMyDishes(restaurant.id).then(setDishes).catch(() => setFailed(true));
  }, [restaurant.id]);

  useEffect(() => {
    document.title = "المنيو المطبوع — كلاود منيو";
    load();
  }, [load]);

  const menu = useMemo(() => {
    if (!menus?.length) return null;
    return menus.find((m) => m.id === menuId) ?? menus.find((m) => m.active) ?? menus[0];
  }, [menus, menuId]);

  const theme = getTheme(menu?.theme);
  // اللون الخام للزخرفة، والمُغمَّق للنصّ: عنوانٌ بذهبٍ مصمَّم لأرضيةٍ داكنة
  // (`dark-gold` ≈2:1 على الأبيض) يكاد يختفي على الورق. و`qrSafeColor` يغمّقه
  // في عائلته نفسها حتى ٧:١ — أشدّ من حاجة النصّ، لكنه يُبقي `themes.ts` بلا
  // سطرٍ جديد (ثابت §18: الفرق عليه صفر).
  const accent = theme.vars["--m-accent"] ?? INK;
  const accentText = qrSafeColor(accent);
  const bodyFont = theme.vars["--m-font"];
  const displayFont = theme.vars["--m-display"] ?? bodyFont;

  useEffect(() => {
    void loadThemeFont(bodyFont);
    void loadThemeFont(displayFont);
  }, [bodyFont, displayFont]);

  const url = menuUrl(restaurant.slug);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    qrDataUrl(url, null, 360, { dark: INK, light: "#ffffff" })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(null));
    return () => {
      alive = false;
    };
  }, [url]);

  const sections = useMemo(() => {
    if (!dishes || !menu) return null;
    const mine = dishes.filter((d) => d.menu_id === menu.id && d.available !== false);
    return groupByCategory(mine, parseCategoryOrder(restaurant.category_order), "أطباق");
  }, [dishes, menu, restaurant.category_order]);

  const usedAllergens = useMemo(() => {
    const all = new Set<string>();
    for (const s of sections ?? []) for (const d of s.items) for (const a of d.allergens ?? []) all.add(a);
    return displayAllergens([...all], false);
  }, [sections]);

  /**
   * ملف CSV لتطبيقات التوصيل — الإلزام يشملها، ولكل تطبيق نموذج رفع مختلف.
   * فالملف أعمدة واضحة يُنسخ منها، لا نموذجُ تطبيقٍ بعينه يتقادم. وBOM في
   * أوّله كي يفتحه Excel بالعربية لا برموز مكسورة.
   */
  const downloadCsv = () => {
    const head = ["الاسم", "Name", "التصنيف", "السعر", "السعرات", "دقائق المشي", "الصوديوم (ملغم)", "صوديوم مرتفع", "الكافيين (ملغم)", "مسبّبات الحساسية"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = (sections ?? []).flatMap((s) =>
      s.items.map((d) => [
        d.name,
        d.name_en ?? "",
        s.name,
        d.price ?? "",
        d.calories ?? "",
        burnMinutes(d.calories) ?? "",
        d.sodium_mg ?? "",
        isHighSodium(d.sodium_mg) ? "نعم" : "",
        d.caffeine_mg ?? "",
        displayAllergens(d.allergens, false).map((a) => a.label).join("، "),
      ])
    );
    const csv = "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = href;
    a.download = `${restaurant.slug || "menu"}-nutrition.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const missing = useMemo(
    () => (sections ?? []).flatMap((s) => s.items).filter((d) => d.calories === null).length,
    [sections]
  );

  return (
    <div className="grid gap-5">
      <div className="no-print grid gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-black text-ink">المنيو المطبوع</h1>
            <p className="mt-1 text-sm text-dim">ورقة A4 بأرقام الهيئة نفسها التي في منيوك الرقمي — اطبعها أو احفظها PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadCsv} disabled={!sections?.length}>
              <Icon name="download" size={16} /> ملف لتطبيقات التوصيل (CSV)
            </Button>
            <Button onClick={() => window.print()} disabled={!sections?.length}>
              <Icon name="printer" size={16} /> اطبع أو احفظ PDF
            </Button>
          </div>
        </div>
        <PrintTabs />

        <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
          {menus && menus.length > 1 && (
            <label className="flex items-center gap-2 text-sm font-semibold text-ink">
              القائمة
              <Select value={menu?.id ?? ""} onChange={(e) => setMenuId(e.target.value)} className="min-h-9 w-44 py-1.5">
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </label>
          )}
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            الأعمدة
            {([1, 2] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColumns(c)}
                className={`press min-h-9 rounded-[8px] border px-3 text-sm ${columns === c ? "border-ink bg-ink text-page" : "border-line text-dim"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Switch checked={showDesc} onChange={setShowDesc} label="الأوصاف" />
            الأوصاف
          </label>
        </Card>

        {missing > 0 && (
          <p className="flex items-center gap-2 rounded-[10px] bg-gold/10 px-3 py-2 text-sm text-gold">
            <Icon name="warn" size={16} />
            {missing} طبقاً بلا سعرات — ستظهر في الورقة بلا رقم.{" "}
            <Link to="/dashboard/nutrition" className="font-semibold underline">
              احسبها من الوصفة
            </Link>
          </p>
        )}
      </div>

      {failed ? (
        <EmptyState
          icon="warn"
          title="تعذّر تحميل الأطباق"
          desc="تحقّق من الاتصال ثم أعد المحاولة."
          action={<Button onClick={load}>أعد المحاولة</Button>}
        />
      ) : sections === null ? (
        <Skeleton className="h-[60vh]" />
      ) : sections.length === 0 ? (
        <EmptyState icon="doc" title="لا أطباق في هذه القائمة" desc="أضف أطباقاً ثم عُد لطباعتها." />
      ) : (
        <div className="print-root overflow-x-auto pb-6">
          {/* ورقة A4 بلا هامش — **ما دامت هذه الصفحة مركّبة فقط**؛ في global.css
              كانت تفرض نفسها على طباعة كل صفحة أخرى. */}
          <style>{"@media print { @page { size: A4; margin: 0; } }"}</style>
          <article
            className="print-sheet relative mx-auto bg-white shadow-[0_2px_4px_rgba(0,0,0,0.06),0_24px_60px_-24px_rgba(0,0,0,0.35)]"
            style={{ width: "210mm", minHeight: "297mm", padding: "14mm 14mm 12mm", color: INK, fontFamily: bodyFont }}
            dir="rtl"
          >
            {/* حدود الصفحات على الشاشة فقط — لتعرف أين يقطع الورق. */}
            <div
              aria-hidden="true"
              className="no-print pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent 0 calc(297mm - 1px), rgba(0,0,0,0.16) calc(297mm - 1px) 297mm)",
              }}
            />

            <header className="text-center" style={{ breakAfter: "avoid" }}>
              {restaurant.logo_image ? (
                <img src={restaurant.logo_image} alt="" className="mx-auto mb-2 h-14 w-14 rounded-full object-cover" />
              ) : null}
              <h2 style={{ fontFamily: displayFont, fontSize: "26pt", lineHeight: 1.15, fontWeight: 700 }}>
                {restaurant.name}
              </h2>
              {restaurant.type && <p style={{ color: MUTED, fontSize: "10pt", marginTop: "1mm" }}>{restaurant.type}</p>}
              <div
                aria-hidden="true"
                style={{
                  height: "3.2mm",
                  margin: "5mm auto 0",
                  width: "60%",
                  background: `linear-gradient(135deg, ${accent} 25%, transparent 25%) 0 0.6mm / 4mm 2mm repeat-x, linear-gradient(225deg, ${accent} 25%, transparent 25%) 0 0.6mm / 4mm 2mm repeat-x, linear-gradient(to bottom, ${INK} 0 0.4mm, transparent 0.4mm 2.8mm, ${INK} 2.8mm)`,
                }}
              />
            </header>

            <div style={{ columnCount: columns, columnGap: "10mm", marginTop: "8mm" }}>
              {sections.map((s) => (
                <section key={s.name} style={{ marginBottom: "6mm" }}>
                  <h3
                    style={{
                      fontFamily: displayFont,
                      fontSize: "14pt",
                      fontWeight: 700,
                      borderBottom: `0.6mm solid ${INK}`,
                      paddingBottom: "1.2mm",
                      marginBottom: "2.5mm",
                      breakAfter: "avoid",
                      color: accentText,
                    }}
                  >
                    {s.name}
                  </h3>
                  {s.items.map((d) => {
                    const al = displayAllergens(d.allergens, false);
                    return (
                      <div key={d.id} style={{ breakInside: "avoid", padding: "1.6mm 0", borderBottom: "0.2mm solid #e3dfd6" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "3mm" }}>
                          <span style={{ fontWeight: 700, fontSize: "10.5pt" }}>{d.name}</span>
                          <span style={{ flex: 1, borderBottom: "0.3mm dotted #b9b2a3", transform: "translateY(-1mm)" }} />
                          {d.price != null && (
                            <span style={{ fontWeight: 700, fontSize: "10.5pt", fontVariantNumeric: "tabular-nums" }}>
                              {formatPrice(d.price)} <span style={{ fontSize: "8pt", color: MUTED }}>ر.س</span>
                            </span>
                          )}
                        </div>
                        {showDesc && d.description && (
                          <p style={{ color: MUTED, fontSize: "8.5pt", marginTop: "0.6mm", lineHeight: 1.5 }}>{d.description}</p>
                        )}
                        <p style={{ fontSize: "8pt", marginTop: "0.8mm", color: INK, display: "flex", flexWrap: "wrap", gap: "1mm 3mm", fontVariantNumeric: "tabular-nums" }}>
                          <span style={{ fontWeight: 700 }}>{d.calories != null ? `${d.calories} سعرة` : "— سعرة"}</span>
                          {d.calories != null && <span style={{ color: MUTED }}>{burnMinutes(d.calories)} د مشي</span>}
                          {d.caffeine_mg != null && d.caffeine_mg > 0 && <span>{d.caffeine_mg} ملغم كافيين</span>}
                          {isHighSodium(d.sodium_mg) && (
                            <span style={{ fontWeight: 700, color: "#b3261e" }}>⚠ صوديوم مرتفع</span>
                          )}
                          {al.length > 0 && <span aria-label="مسبّبات الحساسية">{al.map((a) => a.emoji).join(" ")}</span>}
                        </p>
                      </div>
                    );
                  })}
                </section>
              ))}
            </div>

            <footer
              style={{
                marginTop: "6mm",
                borderTop: `1.2mm solid ${INK}`,
                paddingTop: "3mm",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "6mm",
                alignItems: "center",
                breakInside: "avoid",
                fontSize: "8pt",
                color: MUTED,
              }}
            >
              <div style={{ display: "grid", gap: "1.6mm" }}>
                <p style={{ color: INK, fontWeight: 700 }}>
                  يحتاج البالغ في المتوسّط إلى {DAILY_KCAL.toLocaleString("ar-SA-u-nu-latn")} سعرة حرارية يومياً.
                </p>
                {usedAllergens.length > 0 && (
                  <p>مسبّبات الحساسية: {usedAllergens.map((a) => `${a.emoji} ${a.label}`).join(" · ")}</p>
                )}
                <p>«د مشي» دقائق المشي التقريبية لحرق سعرات الصنف.{restaurant.prices_include_vat ? " الأسعار شاملة ضريبة القيمة المضافة." : ""}</p>
              </div>
              {qr && (
                <div style={{ textAlign: "center" }}>
                  <img src={qr} alt="رمز المنيو الرقمي" style={{ width: "22mm", height: "22mm" }} />
                  <p style={{ fontSize: "7pt", marginTop: "0.6mm" }}>المنيو الرقمي</p>
                </div>
              )}
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
