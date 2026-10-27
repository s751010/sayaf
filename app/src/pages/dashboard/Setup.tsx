/**
 * «إعداد منيوك» `/dashboard/setup` — من مطعمٍ أُنشئ لتوّه إلى منيوٍ منشور في
 * خمس دقائق: أصنافك ⇐ الطابع ⇐ الشعار واللون ⇐ النشر.
 *
 * المنطق كلّه خالص في `lib/setup.ts` (الاستئناف والتخطّي والنسبة)، وهنا الربط:
 * يُحسم عدد الأصناف أوّلاً، ثم يُستأنف من حيث توقّف التاجر، وكل انتقالٍ يُكتب
 * على الجهاز **قبل** أن يُرسم — فمن أغلق الصفحة في منتصف خطوة يعود إليها.
 *
 * ⚠️ **الفشل ليس «لا أصناف»** (الدرس ٣٢): لو حُسم فشل جلب الأصناف إلى `[]` لبدأ
 * من له منيو كامل من «أضِف أصنافك» — وقد يضيفها ثانيةً. فالفشل حالةٌ ثالثة
 * بإعادة محاولة، ولا تُرسم خطوةٌ قبل الحسم.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, ErrorNote, Skeleton, useToast } from "@/components/ui";
import { getMyDishes } from "@/lib/data";
import {
  SETUP_STEPS,
  STEP_EVENT,
  completeStep,
  goToStep,
  parseProgress,
  resumeProgress,
  setupKey,
  skipStep,
  type SetupProgress,
  type SetupStepId,
} from "@/lib/setup";
import { getJSON, setJSON } from "@/lib/storage";
import { track } from "@/lib/track";
import type { Dish } from "@/lib/types";
import { useDashboard } from "./Dashboard";
import { SetupProgressBar } from "./setup/parts";
import { StepDishes } from "./setup/StepDishes";
import { StepLook } from "./setup/StepLook";
import { StepBrand } from "./setup/StepBrand";
import { StepPublish } from "./setup/StepPublish";

export default function Setup() {
  const { restaurant } = useDashboard();
  const navigate = useNavigate();
  const toast = useToast();
  const key = setupKey(restaurant.id);
  /** `null` = يُحمَّل · وإلا الأصناف. والفشل في `failed` لا هنا. */
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState<SetupProgress | null>(null);

  useEffect(() => {
    document.title = "إعداد منيوك — كلاود منيو";
  }, []);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    getMyDishes(restaurant.id)
      .then((ds) => alive && setDishes(ds))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [restaurant.id, attempt]);

  // الاستئناف بعد حسم الأصناف وحده — قبلها لا يُشتقّ شيءٌ من غيابها.
  useEffect(() => {
    if (dishes === null || progress !== null) return;
    const stored = parseProgress(getJSON(key));
    const p = resumeProgress(stored, { dishCount: dishes.length });
    if (!stored) track("setup_started");
    setJSON(key, p);
    setProgress(p);
  }, [dishes, progress, key]);

  /** كل انتقالٍ يُكتب على الجهاز في اللحظة نفسها — لا عند المغادرة. */
  const commit = useCallback(
    (next: SetupProgress) => {
      setJSON(key, next);
      setProgress(next);
      window.scrollTo({ top: 0 });
    },
    [key]
  );

  const done = useCallback(
    (id: SetupStepId) => {
      if (!progress) return;
      track(STEP_EVENT[id]);
      const next = completeStep(progress, id);
      commit(next);
      if (next.finished && id === "publish") {
        toast("منيوك جاهز 🎉");
        navigate("/dashboard");
      }
    },
    [progress, commit, toast, navigate]
  );

  const skip = useCallback(
    (id: SetupStepId) => {
      if (!progress) return;
      track("setup_skipped");
      commit(skipStep(progress, id));
    },
    [progress, commit]
  );

  if (failed && dishes === null) {
    return (
      <Card className="text-center">
        <div role="alert">
          <p className="font-display text-lg font-black text-ink">تعذّر تحميل أصناف منيوك</p>
          <p className="mt-1 text-sm text-dim">غالباً انقطاعٌ في الاتصال — لم يتغيّر شيء في منيوك.</p>
        </div>
        <Button className="mt-4" onClick={() => setAttempt((a) => a + 1)}>
          أعد المحاولة
        </Button>
      </Card>
    );
  }

  if (dishes === null || progress === null) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const step = SETUP_STEPS.find((s) => s.id === progress.step) ?? SETUP_STEPS[0];

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black text-ink">إعداد منيوك</h1>
          <p className="mt-1 text-sm text-dim">أربع خطوات، حوالي خمس دقائق — وكل خطوة تُحفظ فوراً.</p>
        </div>
        {/* المخرج في كل لحظة: التقدّم محفوظ، وبطاقة «أكمل الإعداد» في الرئيسية تعيده. */}
        <Link
          to="/dashboard"
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-dim hover:text-ink"
        >
          أكمل لاحقاً
        </Link>
      </div>

      <SetupProgressBar progress={progress} onGo={(id) => commit(goToStep(progress, id))} />

      <section className="mt-6" aria-labelledby="setup-step-title">
        <h2 id="setup-step-title" className="font-display text-xl font-extrabold text-ink">
          {step.title}
          {step.optional && <span className="ms-2 text-xs font-bold text-faint">اختياري</span>}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-dim">{step.hint}</p>
        <div className="mt-4">
          {step.id === "dishes" && (
            <StepDishes
              dishes={dishes}
              onSaved={(created) => setDishes((ds) => [...(ds ?? []), ...created])}
              onDone={() => done("dishes")}
              onSkip={() => skip("dishes")}
            />
          )}
          {step.id === "look" && <StepLook onDone={() => done("look")} onSkip={() => skip("look")} />}
          {step.id === "brand" && <StepBrand onDone={() => done("brand")} onSkip={() => skip("brand")} />}
          {step.id === "publish" && (
            <StepPublish
              dishCount={dishes.length}
              onBackToDishes={() => commit(goToStep(progress, "dishes"))}
              onDone={() => done("publish")}
            />
          )}
        </div>
      </section>
      {failed && (
        <div className="mt-4">
          <ErrorNote>تعذّر تحديث عدد أصنافك — المعروض آخر ما وصلنا.</ErrorNote>
        </div>
      )}
    </div>
  );
}
