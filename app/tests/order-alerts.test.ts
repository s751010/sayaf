/**
 * جرس الطلبات — **رنّة واحدة لكل طلب، وشارةٌ حتى يُرى**.
 *
 * ═══ ما يحرسه ═══
 *
 * - «جديد» = حالته `new` ولم تعرضه شاشةٌ على التاجر منذ آخر زيارة.
 * - لا رنّة مكرّرة: لا مع تكرار الاستطلاع، ولا مع إعادة التحميل (الحالة محفوظة).
 * - الرؤية لا تُسكت الجرس: صفحة الطلبات قد تجلب الطلب قبل استطلاع الجرس —
 *   ولو عُدّت رؤيتها رنيناً لصمت الجرس عن طلبٍ وصل فعلاً.
 * - المقارنة بالمعرّفات لا بالعدد: طلبٌ يصل وآخر يُحضَّر في الجولة نفسها
 *   يُبقيان العدد ثابتاً، والعدّ كان سيُصمت الجرس.
 * - التراجع عند الفشل محدود، ومسار الأزرار عند التاجر هو مراحل الزبون نفسها.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  badgeText,
  notificationText,
  parseAlertState,
  reconcile,
  titleWithCount,
  type AlertState,
} from "@/lib/orderAlerts";
import { MAX_BACKOFF_MS, ORDER_POLL_MS, nextPollDelay } from "@/lib/poll";
import { LABEL, NEXT, OPEN, clockTime, flowFrom, isLate } from "@/lib/orderFlow";

/** جولات متتالية كما يجريها المزوّد: الحالة تُحمل من جولة إلى التالية. */
function rounds(steps: { ids: string[]; seen?: boolean }[], start: AlertState | null = null) {
  let state = start;
  return steps.map(({ ids, seen }) => {
    const r = reconcile(state, ids, { seen });
    state = r.state;
    return r;
  });
}

describe("أوّل تشغيل على الجهاز", () => {
  it("ما ينتظر لا يُرنّ له (عمره مجهول) — لكن الشارة تعدّه", () => {
    const r = reconcile(null, ["a", "b"]);
    expect(r.toAlert).toEqual([]);
    expect(r.unseen).toBe(2);
    expect(r.state.alerted.sort()).toEqual(["a", "b"]);
  });

  it("وإن فتحه من شاشة الطلبات: صفرٌ في الشارة من أوّل لحظة", () => {
    expect(reconcile(null, ["a"], { seen: true }).unseen).toBe(0);
  });
});

describe("طلبٌ يصل", () => {
  it("يُرنّ له مرّة واحدة مهما تكرّر الاستطلاع", () => {
    const [, second, third, fourth] = rounds([
      { ids: [] },
      { ids: ["x"] },
      { ids: ["x"] },
      { ids: ["x"] },
    ]);
    expect(second.toAlert).toEqual(["x"]);
    expect(third.toAlert).toEqual([]);
    expect(fourth.toAlert).toEqual([]);
  });

  it("ولا يُرنّ له بعد إعادة التحميل — الحالة المحفوظة تُقرأ لا الذاكرة", () => {
    const first = reconcile({ alerted: [], seen: [] }, ["x"]);
    const saved = JSON.parse(JSON.stringify(first.state));
    expect(reconcile(parseAlertState(saved), ["x"]).toAlert).toEqual([]);
  });

  it("والشارة تبقى بعد الرنين حتى تعرضه شاشة", () => {
    const [arrive, again, opened] = rounds([
      { ids: ["x"] },
      { ids: ["x"] },
      { ids: ["x"], seen: true },
    ], { alerted: [], seen: [] });
    expect(arrive.unseen).toBe(1);
    expect(again.unseen).toBe(1);
    expect(opened.unseen).toBe(0);
  });

  it("⚠️ الرؤية لا تُسكت الجرس: الصفحة رأته أوّلاً والجرس يرنّ مع ذلك — مرّة", () => {
    const [pageSaw, bellPoll, bellAgain] = rounds([
      { ids: ["x"], seen: true },
      { ids: ["x"] },
      { ids: ["x"] },
    ], { alerted: [], seen: [] });
    expect(pageSaw.toAlert).toEqual(["x"]); // تسليم الصفحة نفسه يرنّ
    expect(bellPoll.toAlert).toEqual([]);
    expect(bellAgain.toAlert).toEqual([]);
  });

  it("⚠️ يصل واحد ويُحضَّر آخر في الجولة نفسها: العدد ثابت والجرس يرنّ", () => {
    const [, swap] = rounds([{ ids: ["a"] }, { ids: ["b"] }], { alerted: [], seen: [] });
    expect(swap.toAlert).toEqual(["b"]);
  });

  it("الطلب الذي غادر `new` يُقلَّم من الحالة — لا تنمو بلا حدّ", () => {
    const [, gone] = rounds([{ ids: ["a", "b"], seen: true }, { ids: ["b"] }], { alerted: [], seen: [] });
    expect(gone.state.alerted).toEqual(["b"]);
    expect(gone.state.seen).toEqual(["b"]);
  });

  it("المعرّف المكرّر في القائمة لا يُرنّ له مرّتين", () => {
    const r = reconcile({ alerted: [], seen: [] }, ["x", "x"]);
    expect(r.toAlert).toEqual(["x"]);
    expect(r.unseen).toBe(1);
  });
});

describe("الحالة المحفوظة التالفة تُعامل كأوّل تشغيل", () => {
  it.each([null, undefined, "x", 3, [], {}, { alerted: "a", seen: [] }, { alerted: [] }])(
    "%j ⇒ null",
    (raw) => expect(parseAlertState(raw)).toBeNull()
  );

  it("وتُسقط العناصر غير النصّية بلا انهيار", () => {
    expect(parseAlertState({ alerted: ["a", 1, null], seen: [] })).toEqual({ alerted: ["a"], seen: [] });
  });
});

describe("الشارة والعنوان والإشعار", () => {
  it("لا شارة للصفر، و«9+» فوق التسعة", () => {
    expect(badgeText(0)).toBeNull();
    expect(badgeText(-1)).toBeNull();
    expect(badgeText(NaN)).toBeNull();
    expect(badgeText(3)).toBe("3");
    expect(badgeText(9)).toBe("9");
    expect(badgeText(12)).toBe("9+");
  });

  it("العنوان: بادئةٌ تُستبدل لا تتراكم، وتُنزع عند الصفر", () => {
    const t = titleWithCount("الأطباق — كلاود منيو", 2);
    expect(t).toBe("(2) الأطباق — كلاود منيو");
    expect(titleWithCount(t, 3)).toBe("(3) الأطباق — كلاود منيو");
    expect(titleWithCount(titleWithCount(t, 12), 12)).toBe("(9+) الأطباق — كلاود منيو");
    expect(titleWithCount("(9+) الأطباق — كلاود منيو", 0)).toBe("الأطباق — كلاود منيو");
  });

  it("الإشعار: طلبٌ واحد برقمه، والأكثر بعددها", () => {
    expect(notificationText([42]).title).toBe("طلب جديد — رقم 42");
    const many = notificationText([1, 2, 3, 4, 5, 6, 7]);
    expect(many.title).toBe("7 طلبات جديدة");
    expect(many.body).toBe("الأرقام: 1، 2، 3، 4، 5 …");
  });
});

describe("التراجع عند الفشل", () => {
  it("الإيقاع حوالي عشرين ثانية بلا فشل", () => {
    expect(nextPollDelay(0)).toBe(ORDER_POLL_MS);
    expect(ORDER_POLL_MS).toBe(20_000);
  });

  it("يتضاعف مع كل فشل متتالٍ", () => {
    expect(nextPollDelay(1)).toBe(40_000);
    expect(nextPollDelay(2)).toBe(80_000);
  });

  it("وله سقف — شبكةٌ ساقطة ساعةً لا تؤجّل الجولة التالية ساعات", () => {
    expect(nextPollDelay(5)).toBe(MAX_BACKOFF_MS);
    expect(nextPollDelay(1000)).toBe(MAX_BACKOFF_MS);
  });

  it("قيمٌ شاذّة لا تُنتج مهلة أقصر من الإيقاع", () => {
    expect(nextPollDelay(-3)).toBe(ORDER_POLL_MS);
  });
});

describe("مسار الطلب عند التاجر = مراحل الزبون", () => {
  /**
   * مراحل الزبون تُقرأ من `OrderStatus.tsx` نفسه لا من نسخةٍ هنا: لو أضاف
   * أحدٌ مرحلةً للزبون («في الطريق») ولم يُضف زرّها للكاشير، لبقي الطلب عالقاً
   * عند الزبون في مرحلةٍ لا يستطيع أحدٌ نقله منها.
   */
  const src = readFileSync(
    fileURLToPath(new URL("../src/pages/OrderStatus.tsx", import.meta.url)),
    "utf8"
  );
  const block = src.slice(src.indexOf("const STEPS"), src.indexOf("];", src.indexOf("const STEPS")));
  const customerSteps = [...block.matchAll(/key:\s*"([a-z_]+)"/g)].map((m) => m[1]);

  it("الفحص وجد مراحل الزبون فعلاً (لا يمرّ على فراغ)", () => {
    expect(customerSteps.length).toBeGreaterThanOrEqual(4);
  });

  it("أزرار التاجر تمشي المراحل نفسها بترتيبها", () => {
    expect(flowFrom("new")).toEqual(customerSteps);
  });

  it("كل حالةٍ مفتوحة لها زرّ تالٍ — لا طلب يعلق على الكاونتر", () => {
    for (const s of OPEN) expect(NEXT[s], s).not.toBeNull();
    expect(NEXT.picked_up).toBeNull();
    expect(NEXT.cancelled).toBeNull();
  });

  it("زرّ «جاهز» عند التاجر هو اسم المرحلة التي يقرؤها الزبون", () => {
    expect(NEXT.preparing?.label).toBe(LABEL.ready.text);
  });
});

describe("وقت الطلب وتأخّره", () => {
  it("الساعة بتوقيت الرياض وأرقام لاتينية — لا بمنطقة اللوح", () => {
    expect(clockTime("2026-10-26T17:05:00Z")).toBe("20:05");
    expect(clockTime("ليس تاريخاً")).toBe("");
  });

  it("المتأخّر: تجاوز وعده ولم يجهز", () => {
    const now = Date.parse("2026-10-26T18:00:00Z");
    expect(isLate({ status: "preparing", ready_eta: "2026-10-26T17:50:00Z" }, now)).toBe(true);
    expect(isLate({ status: "ready", ready_eta: "2026-10-26T17:50:00Z" }, now)).toBe(false);
    expect(isLate({ status: "new", ready_eta: null }, now)).toBe(false);
  });
});
