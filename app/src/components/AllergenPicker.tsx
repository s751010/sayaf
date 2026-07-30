/**
 * منتقي مسببات الحساسية.
 *
 * كان الحقل نصاً واحداً يُطلب فيه من التاجر كتابة «مكسرات، جلوتين، حليب» بفواصل
 * — إدخال حر يعني أخطاء إملائية وصيغاً متعددة لنفس المسبب، وهذه معلومة سلامة
 * لا تحتمل ذلك. هنا كل المسببات المعتمدة ظاهرة بالضغط، مع إمكانية إضافة مسبب
 * غير مذكور.
 */
import { useState } from "react";
import {
  ALLERGENS,
  customAllergens,
  knownAllergenIds,
} from "@/lib/allergens";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui";

export function AllergenPicker({
  value,
  onChange,
}: {
  /** القيم المخزَّنة كما هي في `dishes.allergens`. */
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = new Set(knownAllergenIds(value));
  const custom = customAllergens(value);
  const [draft, setDraft] = useState("");

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // نحافظ على المسببات المخصّصة كما هي ونعيد بناء المعروفة.
    onChange([...next, ...custom]);
  }

  function addCustom() {
    const v = draft.trim();
    if (!v) return;
    // لو طابق مسبباً معروفاً، فعّله بدل تخزينه كنص حر.
    onChange([...selected, ...custom, v]);
    setDraft("");
  }

  function removeCustom(v: string) {
    onChange([...selected, ...custom.filter((c) => c !== v)]);
  }

  return (
    <div className="space-y-3">
      <div>
        <span className="block text-sm font-bold text-ink">مسببات الحساسية</span>
        <span className="mt-0.5 block text-xs text-faint">
          اضغط على ما يحتويه الطبق — تظهر للزبون داخل تفاصيل الطبق وفي صفحة
          المسببات.
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ALLERGENS.map((a) => {
          const on = selected.has(a.id);
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(a.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-bold transition-colors",
                on
                  ? "border-gold bg-gold/12 text-ink"
                  : "border-line text-dim hover:border-line-gold hover:bg-ink/5"
              )}
            >
              <span aria-hidden>{a.emoji}</span>
              {a.ar}
              {on && <span className="text-gold">✓</span>}
            </button>
          );
        })}
      </div>

      {custom.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {custom.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line-gold bg-gold/[.06] px-3 py-1.5 text-sm text-ink"
            >
              ⚠️ {c}
              <button
                type="button"
                aria-label={`حذف ${c}`}
                onClick={() => removeCustom(c)}
                className="text-dim hover:text-bad"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-1.5">
        <Input
          value={draft}
          placeholder="مسبب غير مذكور (اختياري)"
          className="flex-1"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // لا نُرسل الفورم كله بضغط Enter داخل هذا الحقل.
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!draft.trim()}
          className="rounded-xl border border-line-gold px-3 py-2 text-xs font-bold text-ink transition-colors hover:bg-gold/10 disabled:opacity-40"
        >
          ＋ إضافة
        </button>
      </div>
    </div>
  );
}
