/**
 * محرّر الخيارات والإضافات.
 *
 * كان الحقل مربّع نصّ يُطلب فيه من صاحب المطعم كتابة JSON بيده
 * (`[{"name":"جبن إضافي","price":5}]`) — وهذا ليس شيئاً يُطلب من تاجر.
 * هنا صفوف: اسم + سعر اختياري، والتسلسل إلى JSON يحدث خلف الكواليس.
 */
import { useState } from "react";
import { parseOptions, serializeOptions, type DishOption } from "@/lib/options";
import { Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Icon } from "@/lib/icons";

/**
 * الصفوف حالة داخلية مقصودة: صفّ جديد فارغ لا يُسلسل (يختفي فوراً لو اشتُقّت
 * الصفوف من `value` في كل رسم). المُستدعي يمرّر `key` بمعرّف الطبق كي يُعاد
 * التركيب عند تبديل الطبق المحرَّر.
 */
export function OptionsEditor({
  value,
  onChange,
}: {
  /** النص المخزَّن كما هو في `dishes.options`. */
  value: string;
  onChange: (next: string) => void;
}) {
  const [rows, setRows] = useState<DishOption[]>(() => parseOptions(value));

  function push(next: DishOption[]) {
    setRows(next);
    onChange(serializeOptions(next) ?? "");
  }

  /**
   * صفوف فيها سعر بلا اسم. `serializeOptions` تُسقطها (إضافة بلا اسم لا معنى
   * لها للزبون)، وكان ذلك يحدث بصمت: التاجر يكتب «5» ويحفظ فتختفي الإضافة.
   * نُظهر التحذير بدل الحذف الصامت.
   */
  const priceWithoutName = rows.some((r) => !r.name.trim() && r.price !== undefined);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-bold text-ink">الخيارات والإضافات</span>

      {rows.length === 0 && (
        <p className="text-xs text-faint">
          لا توجد إضافات. مثال: «جبن إضافي +5 ر.س» أو «حجم كبير +10 ر.س».
        </p>
      )}

      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              value={row.name}
              placeholder="اسم الإضافة (مطلوب)"
              className={cn(
                "flex-1",
                !row.name.trim() && row.price !== undefined && "border-bad/50"
              )}
              aria-invalid={!row.name.trim() && row.price !== undefined}
              onChange={(e) =>
                push(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))
              }
            />
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              dir="ltr"
              value={row.price ?? ""}
              placeholder="+ر.س"
              className="w-24 text-center"
              aria-label="سعر الإضافة (اختياري)"
              onChange={(e) => {
                const n = e.target.value === "" ? undefined : Number(e.target.value);
                push(
                  rows.map((r, j) =>
                    j === i
                      ? { ...r, price: n !== undefined && Number.isFinite(n) ? n : undefined }
                      : r
                  )
                );
              }}
            />
            <button
              type="button"
              aria-label={`حذف ${row.name || "الإضافة"}`}
              onClick={() => push(rows.filter((_, j) => j !== i))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-dim transition-colors hover:bg-bad/10 hover:text-bad"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>

      {priceWithoutName && (
        <p className="text-xs text-bad">
          اكتب اسم الإضافة — السعر وحده لا يظهر للزبون ولن يُحفظ.
        </p>
      )}

      <button
        type="button"
        onClick={() => push([...rows, { name: "" }])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-line-gold px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-gold/10"
      >
        ＋ إضافة خيار
      </button>
    </div>
  );
}
