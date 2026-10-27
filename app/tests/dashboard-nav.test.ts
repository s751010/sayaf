/**
 * شريط اللوحة — **لا شاشة تختفي حين يُفعّل التاجر ميزة**.
 *
 * ═══ لماذا وُجد هذا الفحص ═══
 *
 * كانت «الطلبات» تحلّ **محلّ** «التحليلات» عند ربط بوّابة دفع، بحجّة أن ستّة
 * عناصر تسع ٣٩٠px وسابعها يفيض. وكلفة ذلك ظهرت عند المالك نفسه:
 *
 *  ١. شاشة الأرقام تختفي بلا أن يطلب أحد إخفاءها.
 *  ٢. **وشاشة الولاء معها** — وهي لا تُبلَغ إلا من تبويبات التحليلات
 *     (`InsightTabs`)، فمسارها `/dashboard/loyalty` يبقى يعمل ولا يقود إليه
 *     رابطٌ واحد.
 *
 * أي أن ربط بوّابة الدفع كان يُطفئ شاشتين، إحداهما هي التي تُعيد الزبون.
 * والفيض نفسه معالَجٌ أصلاً في `ScrollRow`.
 *
 * فالقاعدة المحروسة هنا: **تفعيل ميزة يزيد ولا ينقص**.
 */
import { describe, expect, it } from "vitest";
import {
  DASHBOARD_NAV,
  FOUNDER_ITEM,
  ORDERS_ITEM,
  buildDashboardNav,
} from "@/lib/nav";

const paths = (ordersOn: boolean, founder: boolean | null = false) =>
  buildDashboardNav({ ordersOn, founder }).map((n) => n.to);

describe("التحليلات لا تختفي بحال", () => {
  it("موجودة بلا بوّابة دفع", () => {
    expect(paths(false)).toContain("/dashboard/analytics");
  });

  it("وموجودة **مع** بوّابة الدفع — وهذا ما كان مكسوراً", () => {
    expect(paths(true)).toContain("/dashboard/analytics");
  });

  it("والولاء يبقى مبلوغاً: بابه هو التحليلات", () => {
    // `InsightTabs` تعرض «الأرقام» و«الولاء» داخل قسم التحليلات؛ فبقاء الباب
    // هو بقاء الشاشتين. ولو صار للولاء عنصرٌ مستقلّ فلْيُضَف هنا صراحةً.
    for (const on of [false, true]) {
      expect(paths(on)).toContain("/dashboard/analytics");
    }
  });
});

describe("الطلبات تُضاف لمن ربط بوّابة — ولا تُبدّل شيئاً", () => {
  it("لا تظهر بلا بوّابة", () => {
    expect(paths(false)).not.toContain(ORDERS_ITEM.to);
  });

  it("تظهر مع البوّابة، وبعد التحليلات مباشرةً", () => {
    const p = paths(true);
    expect(p).toContain(ORDERS_ITEM.to);
    expect(p.indexOf(ORDERS_ITEM.to)).toBe(p.indexOf("/dashboard/analytics") + 1);
  });

  it("تفعيل البوّابة **يزيد** عنصراً ولا يحذف واحداً", () => {
    const off = paths(false);
    const on = paths(true);
    expect(on).toHaveLength(off.length + 1);
    for (const item of off) expect(on).toContain(item);
  });
});

describe("لوحة المؤسّس", () => {
  it("لا تظهر قبل أن يُحسم القرار (null) ولا لغير المؤسّس", () => {
    expect(paths(false, null)).not.toContain(FOUNDER_ITEM.to);
    expect(paths(false, false)).not.toContain(FOUNDER_ITEM.to);
  });

  it("تُلحق آخر الشريط للمؤسّس — وسبعة عناصر حالةٌ قائمة لا افتراض", () => {
    const p = paths(true, true);
    expect(p[p.length - 1]).toBe(FOUNDER_ITEM.to);
    expect(p.length).toBe(DASHBOARD_NAV.length + 2);
  });
});

describe("شارة الطلبات الجديدة", () => {
  const ordersItem = (ordersOn: boolean, newOrders?: number) =>
    buildDashboardNav({ ordersOn, founder: false, newOrders }).find(
      (n) => n.to === ORDERS_ITEM.to
    );

  it("تظهر على «الطلبات» بعدد ما لم يُرَ — وعليها وحدها", () => {
    const items = buildDashboardNav({ ordersOn: true, founder: false, newOrders: 3 });
    expect(items.find((n) => n.to === ORDERS_ITEM.to)?.badge).toBe("3");
    expect(items.filter((n) => n.badge)).toHaveLength(1);
  });

  it("لا شارة للصفر ولا قبل أن يُحسب العدد", () => {
    expect(ordersItem(true, 0)?.badge).toBeUndefined();
    expect(ordersItem(true)?.badge).toBeUndefined();
  });

  it("«9+» فوق التسعة — الشارة تُلمح ولا تمدّ الشريط", () => {
    expect(ordersItem(true, 40)?.badge).toBe("9+");
  });

  it("لا تُعدّل العنصر المشترك نفسه (نسخةٌ لا تحوير)", () => {
    ordersItem(true, 5);
    expect(ORDERS_ITEM.badge).toBeUndefined();
  });
});
