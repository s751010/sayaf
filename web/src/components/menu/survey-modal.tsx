"use client";

import { useActionState, useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { submitSurvey, type SurveyState } from "@/app/[slug]/actions";
import { NOTE_MAX_LENGTH, SCORE_MAX, SURVEY_QUESTIONS } from "@/lib/survey";

/**
 * استبيان رضا الزبون. يُفتح من زر في صفحة المنيو ويُرسل عبر server action.
 *
 * بخلاف النسخة القديمة: لا يُعرض «تم الإرسال» إلا عند نجاح فعلي، والفشل يظهر
 * للزبون مع إمكانية إعادة المحاولة بدل ابتلاعه بصمت.
 */
export function SurveyModal({
  restaurantId,
  accent,
  en = false,
}: {
  restaurantId: string;
  accent: string;
  en?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [state, action, pending] = useActionState<SurveyState, FormData>(
    submitSurvey,
    {}
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const answered = Object.keys(scores).length;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-bold transition-transform hover:scale-[1.03]"
        style={{
          borderColor: "var(--m-border)",
          background: "var(--m-surface)",
          color: "var(--m-text)",
        }}
      >
        <Star size={14} style={{ color: accent }} />
        {en ? "Rate your visit" : "قيّم تجربتك"}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={en ? "Rate your visit" : "تقييم التجربة"}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto border p-5"
        style={{
          background: "var(--m-bg-2)",
          borderColor: "var(--m-border)",
          borderRadius: "calc(var(--m-radius) * 1.4)",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-black" style={{ color: "var(--m-text)" }}>
            {state.ok
              ? en
                ? "Thank you!"
                : "شكراً لك!"
              : en
                ? "How was your visit?"
                : "كيف كانت تجربتك؟"}
          </h3>
          <button
            onClick={() => setOpen(false)}
            aria-label={en ? "Close" : "إغلاق"}
            style={{ color: "var(--m-muted)" }}
          >
            <X size={20} />
          </button>
        </div>

        {state.ok ? (
          <div className="py-8 text-center">
            <span className="text-5xl">🎉</span>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--m-muted)" }}>
              {en
                ? "Your feedback reached the restaurant. We appreciate it."
                : "وصل تقييمك للمطعم. نقدّر لك وقتك."}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-xl py-3 text-sm font-bold"
              style={{ background: accent, color: "var(--m-bg)" }}
            >
              {en ? "Done" : "تم"}
            </button>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="restaurant_id" value={restaurantId} />

            {SURVEY_QUESTIONS.map((q) => (
              <div key={q.id}>
                <p className="mb-2 text-sm font-bold" style={{ color: "var(--m-text)" }}>
                  {q.icon} {en ? q.labelEn : q.label}
                </p>
                <input type="hidden" name={`answer_${q.id}`} value={scores[q.id] ?? ""} />
                <div className="flex gap-1.5" role="group" aria-label={en ? q.labelEn : q.label}>
                  {Array.from({ length: SCORE_MAX }, (_, i) => i + 1).map((value) => {
                    const active = (scores[q.id] ?? 0) >= value;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value}`}
                        aria-pressed={active}
                        onClick={() => setScores((s) => ({ ...s, [q.id]: value }))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border transition-transform hover:scale-110"
                        style={{
                          borderColor: active ? accent : "var(--m-border)",
                          background: active ? `${accent}22` : "transparent",
                        }}
                      >
                        <Star
                          size={16}
                          style={{ color: active ? accent : "var(--m-muted)" }}
                          fill={active ? accent : "none"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <label
                htmlFor="survey-note"
                className="mb-1.5 block text-sm font-bold"
                style={{ color: "var(--m-text)" }}
              >
                {en ? "Anything to add? (optional)" : "ملاحظة إضافية؟ (اختياري)"}
              </label>
              <textarea
                id="survey-note"
                name="note"
                rows={3}
                maxLength={NOTE_MAX_LENGTH}
                className="w-full rounded-xl border p-3 text-sm outline-none"
                style={{
                  background: "var(--m-bg)",
                  borderColor: "var(--m-border)",
                  color: "var(--m-text)",
                }}
              />
            </div>

            {state.error && (
              <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "#ef535022", color: "#ef5350" }}>
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || answered === 0}
              className="w-full rounded-xl py-3 text-sm font-bold disabled:opacity-50"
              style={{ background: accent, color: "var(--m-bg)" }}
            >
              {pending
                ? en
                  ? "Sending…"
                  : "جارٍ الإرسال…"
                : en
                  ? "Send rating"
                  : "إرسال التقييم"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
