/**
 * «إعداد منيوك» — منطق الخطوات والاستئناف (`lib/setup.ts`) وقرار ما بعد فشل
 * القراءة (`lib/scan.ts`). كلّها دوالّ خالصة؛ والمتصفّح في `e2e/setup.spec.ts`.
 */
import { describe, expect, it } from "vitest";
import {
  SETUP_STEPS,
  STEP_EVENT,
  blankRow,
  checkReview,
  chunk,
  completeStep,
  dismissSetup,
  freshProgress,
  goToStep,
  nextStepId,
  parseDraft,
  parseProgress,
  progressPercent,
  resumeProgress,
  setupPending,
  skipStep,
  starterRows,
  toReviewRows,
} from "../src/lib/setup";
import { SCAN_BUSY, SCAN_FAILED, SCAN_OFFLINE, imageKey, scanFailure } from "../src/lib/scan";

describe("الخطوات", () => {
  it("أربع بالترتيب الذي يُنتج منيواً: أصناف ⇐ طابع ⇐ شعار ⇐ نشر", () => {
    expect(SETUP_STEPS.map((s) => s.id)).toEqual(["dishes", "look", "brand", "publish"]);
    expect(SETUP_STEPS.filter((s) => s.optional).map((s) => s.id)).toEqual(["brand"]);
    expect(nextStepId("dishes")).toBe("look");
    expect(nextStepId("publish")).toBeNull();
  });

  it("لكل خطوة حدثٌ مستقلّ — والأسماء لا تتكرّر", () => {
    const events = SETUP_STEPS.map((s) => STEP_EVENT[s.id]);
    expect(new Set(events).size).toBe(SETUP_STEPS.length);
    for (const e of events) expect(e).toMatch(/^setup_/);
  });

  it("تسمية الشريط كلمةٌ واحدة — أربعة أعمدة على ٣٢٠px", () => {
    for (const s of SETUP_STEPS) expect(s.label.trim().split(/\s+/)).toHaveLength(1);
  });
});

describe("الانتقالات", () => {
  it("الإنجاز ينقل لما بعده، والأخيرة تُنهي", () => {
    let p = freshProgress();
    p = completeStep(p, "dishes");
    expect(p).toMatchObject({ step: "look", done: ["dishes"], finished: false });
    p = completeStep(completeStep(completeStep(p, "look"), "brand"), "publish");
    expect(p.finished).toBe(true);
    expect(progressPercent(p)).toBe(100);
  });

  it("التخطّي لا يُحسب إنجازاً، ويبقى للعودة إليه", () => {
    const p = skipStep(completeStep(freshProgress(), "dishes"), "look");
    expect(p.done).toEqual(["dishes"]);
    expect(p.skipped).toEqual(["look"]);
    expect(p.step).toBe("brand");
    expect(progressPercent(p)).toBe(50);
    // يعود إليه من الشريط ويُنجزه: يخرج من المتخطّى.
    const back = completeStep(goToStep(p, "look"), "look");
    expect(back.skipped).toEqual([]);
    expect(back.done).toEqual(["dishes", "look"]);
  });

  it("تخطّي خطوةٍ أُنجزت من قبل لا يمحو إنجازها", () => {
    const p = skipStep(goToStep(completeStep(freshProgress(), "dishes"), "dishes"), "dishes");
    expect(p.done).toEqual(["dishes"]);
    expect(p.skipped).toEqual([]);
  });

  it("لا تكرار حين تُنجَز الخطوة مرّتين", () => {
    const p = completeStep(completeStep(freshProgress(), "dishes"), "dishes");
    expect(p.done).toEqual(["dishes"]);
  });

  it("«أخفِ» تُنهي فلا تظهر بطاقة الاستئناف · «أكمل لاحقاً» لا تُنهي", () => {
    const p = completeStep(freshProgress(), "dishes");
    expect(setupPending(p)).toBe(true);
    expect(setupPending(dismissSetup(p))).toBe(false);
    expect(setupPending(null)).toBe(false);
  });
});

describe("الاستئناف", () => {
  it("أوّل مرّة بلا أصناف: من الأصناف", () => {
    expect(resumeProgress(null, { dishCount: 0 })).toEqual(freshProgress());
  });

  it("أوّل مرّة على جهازٍ آخر وله أصناف: من الطابع، وتُحسب له الأصناف", () => {
    const p = resumeProgress(null, { dishCount: 12 });
    expect(p.step).toBe("look");
    expect(p.done).toEqual(["dishes"]);
  });

  it("المخزَّن يغلب: يعود حيث توقّف حرفياً", () => {
    const stored = goToStep(completeStep(freshProgress(), "dishes"), "brand");
    expect(resumeProgress(stored, { dishCount: 5 })).toEqual(stored);
  });

  it("توقّف عند الأصناف ثم أضافها من صفحة الأطباق: تُحسب وينتقل", () => {
    const stored = freshProgress();
    const p = resumeProgress(stored, { dishCount: 3 });
    expect(p).toMatchObject({ step: "look", done: ["dishes"] });
  });

  it("تخطّى الأصناف ثم أضافها: تخرج من المتخطّى ولا يُنقل عن خطوته", () => {
    const stored = skipStep(freshProgress(), "dishes"); // الآن عند الطابع
    const p = resumeProgress(stored, { dishCount: 4 });
    expect(p.skipped).toEqual([]);
    expect(p.done).toEqual(["dishes"]);
    expect(p.step).toBe("look");
  });

  it("عدد الأصناف لم يُحسم (`null`): لا يُشتقّ شيءٌ من غيابه", () => {
    expect(resumeProgress(null, { dishCount: null })).toEqual(freshProgress());
  });

  it("المخزَّن المعطوب يُقرأ `null` لا انهياراً", () => {
    expect(parseProgress(null)).toBeNull();
    expect(parseProgress("x")).toBeNull();
    expect(parseProgress({ v: 2, step: "dishes" })).toBeNull();
    expect(parseProgress({ v: 1, step: "nowhere" })).toBeNull();
    const p = parseProgress({ v: 1, step: "brand", done: ["dishes", "dishes", "bogus"], skipped: "x" });
    expect(p).toEqual({ v: 1, step: "brand", done: ["dishes"], skipped: [], finished: false });
  });
});

describe("المراجعة قبل الحفظ", () => {
  it("بلا سعر لا يُحفظ — والسعر الصفري لا يُخترع", () => {
    const rows = toReviewRows([
      { name: "كبسة", price: 45, category: "رئيسي", description: null, emoji: "", line: 1 },
      { name: "شاي", price: null, category: null, description: null, emoji: "", line: 2 },
    ]);
    const c = checkReview(rows);
    expect(c.missingPrice).toBe(1);
    expect(c.error).toMatch(/بلا سعر/);
    // استبعاده يرفع المنع.
    expect(checkReview([rows[0], { ...rows[1], include: false }]).error).toBeNull();
  });

  it("الصفّ بلا اسم يُتجاهَل لا يمنع — «أضِف بيدك» يبدأ بثلاثة فارغة", () => {
    const rows = [{ ...blankRow(1), name: "قهوة", price: 10 }, blankRow(2), blankRow(3)];
    const c = checkReview(rows);
    expect(c.error).toBeNull();
    expect(c.chosen).toHaveLength(1);
  });

  it("لا شيء مختار ⇒ رسالة، والسالب مرفوض", () => {
    expect(checkReview([blankRow(1)]).error).toMatch(/لم تختر/);
    expect(checkReview([{ ...blankRow(1), name: "x", price: -1 }]).error).toMatch(/سالب/);
  });

  it("القائمة الجاهزة لا تعود فارغة، وأيقوناتها من مجموعتنا", () => {
    const rows = starterRows("كافيه");
    expect(rows.length).toBeGreaterThan(3);
    for (const r of rows) {
      expect(r.include).toBe(true);
      expect(r.price).toBeGreaterThan(0);
      expect(r.emoji.startsWith("cm:")).toBe(true);
    }
    // نوعٌ حرّ لا يطابق شيئاً يسقط إلى «مطعم» لا إلى فراغ.
    expect(starterRows("general").length).toBeGreaterThan(0);
  });

  it("المسوّدة المحفوظة تُقرأ بتسامح — وما لا يُفهم يُسقَط", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft({ v: 1, source: "x", rows: [] })).toBeNull();
    const d = parseDraft({
      v: 1,
      source: "scan",
      rows: [{ name: "فول", price: "12" }, { price: 3 }, { name: "تميس", price: 2, include: false }],
    });
    expect(d?.rows).toHaveLength(2);
    expect(d?.rows[0].price).toBeNull(); // نصّ لا رقم ⇒ يُطلب من التاجر
    expect(d?.rows[1].include).toBe(false);
  });

  it("الدفعات تحفظ الترتيب ولا تُسقط شيئاً", () => {
    const xs = Array.from({ length: 120 }, (_, i) => i);
    const parts = chunk(xs, 50);
    expect(parts.map((p) => p.length)).toEqual([50, 50, 20]);
    expect(parts.flat()).toEqual(xs);
  });
});

describe("قراءة الصورة: البصمة وما بعد الفشل", () => {
  const file = { name: "menu.jpg", size: 2_400_000, lastModified: 1_761_000_000_000, type: "image/jpeg" };

  it("الملفّ نفسه بصمته نفسها، وأيّ فرق يغيّرها", () => {
    expect(imageKey(file)).toBe(imageKey({ ...file }));
    expect(imageKey(file)).not.toBe(imageKey({ ...file, size: file.size + 1 }));
    expect(imageKey(file)).not.toBe(imageKey({ ...file, lastModified: 1 }));
  });

  it("انقطاع الشبكة: عربيٌّ بإعادة محاولة — لا «Failed to fetch»", () => {
    const r = scanFailure(new TypeError("Failed to fetch"));
    expect(r).toEqual({ message: SCAN_OFFLINE, retry: true });
  });

  it("الخادم مشغول (٥xx): إعادة محاولة، ورسالته إن كانت عربية", () => {
    const err = (status: number, message: string) => Object.assign(new Error(message), { status });
    expect(scanFailure(err(503, "menu-scan 503"))).toEqual({ message: SCAN_BUSY, retry: true });
    expect(scanFailure(err(502, "الخدمة مزدحمة"))).toEqual({ message: "الخدمة مزدحمة", retry: true });
  });

  it("الحدّ (٤٢٩): بلا زرّ إعادة — الضغط يرتطم بالحدّ ثانيةً", () => {
    const r = scanFailure(Object.assign(new Error("جرّبت كثيراً خلال ساعة. انتظر قليلاً."), { status: 429 }));
    expect(r.retry).toBe(false);
    expect(r.message).toMatch(/انتظر/);
  });

  it("صورة مرفوضة (٤xx) أو رسالة إنجليزية: عربيٌّ بلا إعادة", () => {
    expect(scanFailure(Object.assign(new Error("bad_image"), { status: 400 }))).toEqual({
      message: SCAN_FAILED,
      retry: false,
    });
    expect(scanFailure("weird")).toEqual({ message: SCAN_FAILED, retry: false });
  });
});
