"use server";

import { createPublicServerClient } from "@/lib/supabase/server";
import {
  NOTE_MAX_LENGTH,
  SCORE_MAX,
  SCORE_MIN,
  SURVEY_QUESTION_IDS,
} from "@/lib/survey";

export type SurveyState = { error?: string; ok?: boolean };

/**
 * استقبال تقييم زبون من صفحة المنيو العامة (بلا تسجيل دخول).
 *
 * ثلاثة أخطاء في النسخة القديمة عولجت هنا:
 *  1. كانت تحسب `avg_score` في المتصفح وترسله — أي أن أي عميل يقدر يرسل أي
 *     درجة. الآن يُحسب هنا، ويقيّده CHECK في قاعدة البيانات أيضاً.
 *  2. كانت تقبل أي مفاتيح في `answers`. الآن تُصفّى بقائمة الأسئلة المعروفة.
 *  3. كانت تبتلع فشل الشبكة وتعرض «تم الإرسال» للزبون. الآن يُرجَع الخطأ فعلاً.
 */
export async function submitSurvey(
  _prev: SurveyState,
  formData: FormData
): Promise<SurveyState> {
  const restaurantId = String(formData.get("restaurant_id") ?? "").trim();
  if (!restaurantId) return { error: "طلب غير صالح." };

  // لا نقبل إلا الأسئلة المعروفة، وبقيم صحيحة ضمن المدى.
  const answers: Record<string, number> = {};
  for (const id of SURVEY_QUESTION_IDS) {
    const raw = formData.get(`answer_${id}`);
    if (raw === null || String(raw).trim() === "") continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < SCORE_MIN || value > SCORE_MAX) {
      return { error: "قيمة تقييم غير صالحة." };
    }
    answers[id] = value;
  }

  if (Object.keys(answers).length === 0) {
    return { error: "اختر تقييماً واحداً على الأقل." };
  }

  const note = String(formData.get("note") ?? "").trim();
  if (note.length > NOTE_MAX_LENGTH) {
    return { error: "الملاحظة طويلة جداً." };
  }

  const values = Object.values(answers);
  const avgScore =
    Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 10) / 10;

  const supabase = createPublicServerClient();
  if (!supabase) return { error: "الخدمة غير متاحة حالياً." };

  // سياسة RLS تسمح بالإدراج فقط لمطعم موجود ومفعِّل التقييمات.
  const { error } = await supabase.from("survey_responses").insert({
    restaurant_id: restaurantId,
    answers,
    note: note || null,
    avg_score: avgScore,
  });

  if (error) return { error: "تعذّر إرسال التقييم. حاول مرة أخرى." };
  return { ok: true };
}
