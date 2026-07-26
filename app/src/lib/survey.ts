/**
 * أسئلة استبيان رضا الزبون — المصدر الوحيد للأسئلة ولتسمياتها.
 *
 * مطابق لـ `web/src/lib/survey.ts` (نفس المعرّفات) حتى تبقى البيانات المجمَّعة
 * من النسختين قابلة للمقارنة في نفس الجدول.
 */

export const SURVEY_QUESTIONS = [
  { id: "overall", label: "التجربة العامة", labelEn: "Overall experience", icon: "✨" },
  { id: "food", label: "جودة الطعام", labelEn: "Food quality", icon: "🍽" },
  { id: "service", label: "الخدمة والموظفين", labelEn: "Service & staff", icon: "🤝" },
  { id: "speed", label: "سرعة التقديم", labelEn: "Speed of service", icon: "⏱" },
  { id: "return", label: "نيّة العودة", labelEn: "Would return", icon: "🔁" },
] as const;

export type SurveyQuestionId = (typeof SURVEY_QUESTIONS)[number]["id"];

export const SURVEY_QUESTION_IDS: readonly string[] = SURVEY_QUESTIONS.map((q) => q.id);

/** تسمية عربية لكل معرّف — تُستخدم في لوحة التاجر. */
export const SURVEY_LABELS: Record<string, string> = Object.fromEntries(
  SURVEY_QUESTIONS.map((q) => [q.id, q.label])
);

export const SCORE_MIN = 1;
export const SCORE_MAX = 5;

/** أقصى طول للملاحظة الحرّة — مطابق لقيد CHECK في قاعدة البيانات. */
export const NOTE_MAX_LENGTH = 2000;

/** لون يعبّر عن الدرجة (مشترك بين البطاقات والأشرطة). */
export function scoreColor(score: number): string {
  if (score >= 4.5) return "#22c55e";
  if (score >= 3.5) return "#84cc16";
  if (score >= 2.5) return "#f59e0b";
  return "#ef5350";
}
