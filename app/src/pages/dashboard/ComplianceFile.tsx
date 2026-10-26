/**
 * ملفّ الامتثال — ورقة A4 بجدول أرقام كل طبق، يطبعها التاجر أو يحفظها PDF
 * ويضعها أمام مفتّش الهيئة (§26). يُفتح من شاشة «الامتثال الغذائي».
 *
 * ═══ لماذا صفحةٌ تُطبع لا مكتبة PDF ═══
 *
 * كالمنيو المطبوع (`PrintMenu.tsx`): المتصفّح أمهر من أي مكتبة في تقسيم
 * الصفحات وتشكيل العربية، و«حفظ PDF» في نافذة الطباعة نفسها. فالورقة HTML بقياس
 * A4 داخل `.print-root`، وقواعد `@media print` في `global.css` تُخفي ما عداها.
 * وبلا تبعية جديدة.
 *
 * ⚠️ **الورقة لا تحكم**: لا «مطابق» ولا «مقبول» — تصف ما أدخله التاجر وتقول إنه
 * تقديري راجعه بنفسه. النصوص كلّها في `lib/complianceFile.ts` ويحرسها فحصها.
 */
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { useDashboard } from "./Dashboard";
import { getMyDishes } from "@/lib/data";
import { parseCategoryOrder } from "@/lib/categories";
import {
  buildComplianceFile,
  ESTIMATE_NOTE,
  FILE_TITLE,
  fileDate,
  NOT_ENTERED,
  type ComplianceDish,
} from "@/lib/complianceFile";
import { Icon } from "@/lib/icons";

const INK = "#15130f";
const MUTED = "#5a5346";
const RULE = "#d9d4c9";

export default function ComplianceFile() {
  const { restaurant, menus } = useDashboard();
  /** `null` = يُحمَّل · `[]` = لا أطباق فعلاً (القاعدة «ج»). */
  const [dishes, setDishes] = useState<ComplianceDish[] | null>(null);
  /** فشل التحميل ليس «لا أطباق» — ولا تُطبع ورقةٌ ناقصة أمام مفتّش. */
  const [failed, setFailed] = useState(false);
  // التاريخ يُثبَّت عند فتح الصفحة: ورقةٌ تُطبع بعد منتصف الليل تحمل يوم إعدادها.
  const [today] = useState(() => fileDate(new Date()));

  const load = useCallback(() => {
    setFailed(false);
    getMyDishes(restaurant.id).then(setDishes).catch(() => setFailed(true));
  }, [restaurant.id]);

  useEffect(() => {
    document.title = "ملفّ الامتثال — كلاود منيو";
    load();
  }, [load]);

  const file = useMemo(
    () =>
      dishes && menus
        ? buildComplianceFile(dishes, menus, parseCategoryOrder(restaurant.category_order))
        : null,
    [dishes, menus, restaurant.category_order]
  );

  const th: CSSProperties = {
    textAlign: "start",
    fontWeight: 700,
    padding: "1.6mm 1.8mm",
    borderBottom: `0.5mm solid ${INK}`,
    whiteSpace: "nowrap",
  };
  const td: CSSProperties = {
    padding: "1.4mm 1.8mm",
    borderBottom: `0.2mm solid ${RULE}`,
    verticalAlign: "top",
  };
  /** «غير مُدخَل» بخطٍّ مائل خافت — يُميَّز عن الرقم بنظرة دون أن يُقرأ رقماً. */
  const missing = (v: string): CSSProperties => (v === NOT_ENTERED ? { color: MUTED, fontStyle: "italic" } : {});

  return (
    <div className="grid gap-5">
      <div className="no-print flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/dashboard/nutrition" className="text-sm font-semibold text-dim hover:text-ink">
            → الامتثال الغذائي
          </Link>
          <h1 className="mt-1 font-display text-2xl font-black text-ink">ملفّ الامتثال</h1>
          <p className="mt-1 max-w-xl text-sm text-dim">
            جدولٌ بأرقام كل طبق في قوائمك المفعّلة، لمفتّش الهيئة — اطبعه أو احفظه PDF. ما لم تُدخله
            يظهر «غير مُدخَل»، والورقة تقول إن الأرقام تقديرية راجعتَها بنفسك.
          </p>
        </div>
        <Button onClick={() => window.print()} disabled={!file?.total}>
          <Icon name="printer" size={16} /> اطبع أو احفظ PDF
        </Button>
      </div>

      {failed ? (
        <EmptyState
          icon="warn"
          title="تعذّر تحميل الأطباق"
          desc="تحقّق من الاتصال ثم أعد المحاولة."
          action={<Button onClick={load}>أعد المحاولة</Button>}
        />
      ) : file === null ? (
        <Skeleton className="h-[60vh]" />
      ) : file.total === 0 ? (
        <EmptyState icon="plate" title="لا أطباق في قوائمك المفعّلة" desc="أضف أطباقك ثم عُد لطباعة الملفّ." />
      ) : (
        <div className="print-root overflow-x-auto pb-6">
          <style>{"@media print { @page { size: A4; margin: 0; } }"}</style>
          <article
            className="print-sheet relative mx-auto bg-white shadow-[0_2px_4px_rgba(0,0,0,0.06),0_24px_60px_-24px_rgba(0,0,0,0.35)]"
            style={{ width: "210mm", minHeight: "297mm", padding: "14mm 12mm 12mm", color: INK, fontSize: "9pt" }}
            dir="rtl"
            data-compliance-file=""
          >
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "6mm", borderBottom: `1.2mm solid ${INK}`, paddingBottom: "3mm" }}>
              <div>
                <p style={{ color: MUTED, fontSize: "9pt", fontWeight: 700 }}>{FILE_TITLE}</p>
                <h2 style={{ fontSize: "20pt", fontWeight: 800, lineHeight: 1.2, marginTop: "1mm" }}>{restaurant.name}</h2>
              </div>
              <p style={{ fontSize: "9pt", textAlign: "end", whiteSpace: "nowrap" }}>
                <span style={{ color: MUTED }}>تاريخ الإعداد: </span>
                <b>{today}</b>
              </p>
            </header>

            {/* الإقرار قبل الأرقام — من يقرأ الورقة يقرؤه أوّلاً. */}
            <p
              style={{ marginTop: "4mm", padding: "2.4mm 3mm", border: `0.4mm solid ${INK}`, lineHeight: 1.6, fontWeight: 600 }}
              data-estimate-note=""
            >
              {ESTIMATE_NOTE}
            </p>

            <p style={{ marginTop: "3mm", color: MUTED, fontVariantNumeric: "tabular-nums" }}>
              عدد الأطباق: <b style={{ color: INK }}>{file.total}</b> · بسعراتٍ مُدخَلة:{" "}
              <b style={{ color: INK }}>{file.withCalories}</b> · بصوديومٍ مُدخَل:{" "}
              <b style={{ color: INK }}>{file.withSodium}</b>
            </p>

            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "4mm", fontVariantNumeric: "tabular-nums" }}>
              <thead style={{ display: "table-header-group" }}>
                <tr>
                  <th style={th}>الطبق</th>
                  <th style={th}>السعرات</th>
                  <th style={th}>الصوديوم (ملغم)</th>
                  <th style={th}>الكافيين (ملغم)</th>
                  <th style={th}>مسبّبات الحساسية</th>
                  {file.hasUpdated && <th style={th}>آخر تحديث</th>}
                </tr>
              </thead>
              {file.sections.map((s) => (
                <tbody key={s.name}>
                  <tr style={{ breakInside: "avoid", breakAfter: "avoid" }}>
                    <td colSpan={file.hasUpdated ? 6 : 5} style={{ ...td, fontWeight: 800, paddingTop: "3mm", borderBottom: `0.3mm solid ${INK}` }}>
                      {s.name}
                    </td>
                  </tr>
                  {s.rows.map((r) => (
                    <tr key={r.id} style={{ breakInside: "avoid" }}>
                      <td style={{ ...td, fontWeight: 700 }}>{r.name}</td>
                      <td style={{ ...td, ...missing(r.calories) }}>{r.calories}</td>
                      <td style={{ ...td, ...missing(r.sodium) }}>
                        {r.sodium}
                        {r.highSodium && <span style={{ fontWeight: 700, color: "#b3261e" }}> ⚠ مرتفع</span>}
                      </td>
                      <td style={{ ...td, ...missing(r.caffeine) }}>{r.caffeine}</td>
                      <td style={{ ...td, ...missing(r.allergens) }}>{r.allergens}</td>
                      {file.hasUpdated && <td style={{ ...td, whiteSpace: "nowrap" }}>{r.updated ?? "—"}</td>}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>

            <footer style={{ marginTop: "6mm", borderTop: `1.2mm solid ${INK}`, paddingTop: "3mm", display: "grid", gap: "1.6mm", breakInside: "avoid" }}>
              {file.statements.map((t) => (
                <p key={t} style={{ fontWeight: 700 }}>
                  {t}
                </p>
              ))}
              <p style={{ color: MUTED }}>«غير مُدخَل»: لم يُدخل التاجر هذه القيمة بعد — وليس معناها صفراً ولا خلوّاً.</p>
              <div style={{ display: "flex", gap: "10mm", marginTop: "6mm", color: MUTED }}>
                <p style={{ flex: 1, borderTop: `0.3mm solid ${MUTED}`, paddingTop: "1.2mm" }}>اسم المراجِع من المنشأة</p>
                <p style={{ flex: 1, borderTop: `0.3mm solid ${MUTED}`, paddingTop: "1.2mm" }}>التوقيع</p>
              </div>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
