/**
 * لوحتي v2 — حسابات `lib/founderInsights.ts`: الأيام بتوقيت الرياض، واتساب،
 * الشرائح، حالة الاشتراك، ملخّص الطلبات، خيط «آخر ما حصل».
 */
import { describe, expect, it } from "vitest";
import {
  SEGMENTS,
  activityFeed,
  ago,
  dailyCounts,
  dailySums,
  dayKey,
  groupSegments,
  lastDays,
  normalizeSaPhone,
  segmentOf,
  subState,
  summarizeOrders,
  total,
  trend,
  waLink,
} from "../src/lib/founderInsights";
import type { FounderMerchant, PlatformOrder, Subscription } from "../src/lib/founder";

const NOW = Date.parse("2026-11-26T12:00:00Z"); // ٣م الرياض
const DAY = 86_400_000;

const merchant = (o: Partial<FounderMerchant> = {}): FounderMerchant => ({
  id: "r",
  name: "مطعم",
  slug: "r",
  logo: null,
  created_at: "2026-11-01T00:00:00Z",
  owner_id: "u",
  owner_email: "a@x.com",
  menus_count: 1,
  active_menus: 1,
  dishes_count: 10,
  views_30d: 50,
  last_view: null,
  sub_plan: "trial",
  sub_end: new Date(NOW + 10 * DAY).toISOString(),
  sub_active: true,
  tickets_open: 0,
  has_staff_pin: false,
  loyalty_count: 0,
  ...o,
});

describe("الأيام بتوقيت الرياض", () => {
  it("بعد منتصف ليل الرياض يومٌ جديد ولو كان UTC أمس", () => {
    expect(dayKey("2026-11-25T21:30:00Z")).toBe("2026-11-26"); // ٠٠:٣٠ الرياض
    expect(dayKey("2026-11-25T20:30:00Z")).toBe("2026-11-25");
  });

  it("النافذة كاملة وآخرها اليوم", () => {
    const d = lastDays(7, NOW);
    expect(d).toHaveLength(7);
    expect(d[6]).toBe("2026-11-26");
    expect(d[0]).toBe("2026-11-20");
  });

  it("العدّ يضع صفراً لليوم الفارغ ويتجاهل ما خارج النافذة", () => {
    const pts = dailyCounts(
      ["2026-11-26T08:00:00Z", "2026-11-26T09:00:00Z", "2026-11-24T08:00:00Z", "2026-10-01T00:00:00Z"],
      3,
      NOW
    );
    expect(pts.map((p) => p.n)).toEqual([1, 0, 2]);
    expect(total(pts)).toBe(3);
  });

  it("جمع القيم بيومها الجاهز", () => {
    const pts = dailySums(
      [
        { date: "2026-11-26", value: 5 },
        { date: "2026-11-26", value: 2 },
        { date: "2026-11-25", value: 1 },
      ],
      2,
      NOW
    );
    expect(pts.map((p) => p.n)).toEqual([1, 7]);
  });

  it("الاتجاه بين النصفين، و null حين لا أساس", () => {
    expect(trend([{ day: "a", n: 2 }, { day: "b", n: 2 }, { day: "c", n: 3 }, { day: "d", n: 3 }])).toBe(50);
    expect(trend([{ day: "a", n: 0 }, { day: "b", n: 4 }])).toBeNull();
  });
});

describe("واتساب", () => {
  it("يوحّد الصيغ السعودية الشائعة", () => {
    for (const raw of ["0551234567", "551234567", "+966 55 123 4567", "00966551234567", "966-55-1234567", "٠٥٥١٢٣٤٥٦٧"]) {
      expect(normalizeSaPhone(raw)).toBe("966551234567");
    }
  });

  it("يرفض ما ليس جوالاً سعودياً", () => {
    for (const raw of [null, "", "0112345678", "12345", "+971501234567"]) {
      expect(normalizeSaPhone(raw)).toBeNull();
    }
  });

  it("الرابط يرمّز النصّ", () => {
    expect(waLink("966551234567", "هلا & مرحبا")).toBe(
      `https://wa.me/966551234567?text=${encodeURIComponent("هلا & مرحبا")}`
    );
  });
});

describe("الشرائح", () => {
  it("كلّ تاجرٍ في شريحةٍ واحدة بترتيب الإلحاح", () => {
    expect(segmentOf(merchant({ sub_end: new Date(NOW + 2 * DAY).toISOString(), dishes_count: 0 }), NOW)).toBe(
      "trial-ending"
    );
    expect(segmentOf(merchant({ dishes_count: 0 }), NOW)).toBe("no-dishes");
    expect(segmentOf(merchant({ sub_active: false, sub_end: new Date(NOW - DAY).toISOString() }), NOW)).toBe("expired");
    expect(segmentOf(merchant({ views_30d: 0 }), NOW)).toBe("quiet");
    expect(segmentOf(merchant({ sub_plan: "standard" }), NOW)).toBe("paid");
    expect(segmentOf(merchant(), NOW)).toBeNull();
  });

  it("التجميع يعدّ كل شريحة، ولكل شريحة رسالة باسم المطعم", () => {
    const g = groupSegments([merchant({ id: "a", dishes_count: 0 }), merchant({ id: "b", sub_plan: "standard" })], NOW);
    expect(g["no-dishes"].map((m) => m.id)).toEqual(["a"]);
    expect(g.paid.map((m) => m.id)).toEqual(["b"]);
    for (const s of SEGMENTS) {
      const msg = s.message("مقهى الورد");
      expect(msg).toContain("«مقهى الورد»");
      // قائمة الصدق: لا تفضيل ولا أرقام مخترعة
      expect(msg).not.toMatch(/الأفضل|الأرخص|معتمد|٪|%/);
    }
  });
});

describe("حالة الاشتراك", () => {
  const sub = (o: Partial<Subscription>): Subscription => ({
    id: "s",
    user_id: "u",
    plan_id: "standard",
    payment_ref: null,
    start_date: null,
    end_date: new Date(NOW + 60 * DAY).toISOString(),
    active: true,
    cancelled_at: null,
    created_at: null,
    ...o,
  });
  it("الإلغاء ثم الانتهاء ثم القرب ثم النوع", () => {
    expect(subState(sub({ cancelled_at: "x" }), NOW)).toBe("cancelled");
    expect(subState(sub({ end_date: new Date(NOW - DAY).toISOString() }), NOW)).toBe("expired");
    expect(subState(sub({ end_date: new Date(NOW + 3 * DAY).toISOString() }), NOW)).toBe("expiring");
    expect(subState(sub({ plan_id: "trial" }), NOW)).toBe("trial");
    expect(subState(sub({}), NOW)).toBe("active");
  });
});

describe("ملخّص الطلبات", () => {
  const order = (o: Partial<PlatformOrder>): PlatformOrder => ({
    id: Math.random().toString(),
    restaurant_id: "r1",
    status: "picked_up",
    total: 30,
    created_at: new Date(NOW - 60_000).toISOString(),
    paid_at: null,
    ...o,
  });
  it("المدفوع وحده في المبيعات، والملغى والمعلّق خارجها", () => {
    const s = summarizeOrders(
      [
        order({}),
        order({ status: "new", total: 20, restaurant_id: "r2" }),
        order({ status: "pending_payment", total: 99 }),
        order({ status: "cancelled", total: 50, paid_at: "x" }),
        order({ created_at: new Date(NOW - 10 * DAY).toISOString() }),
        order({ created_at: new Date(NOW - 40 * DAY).toISOString() }),
      ],
      NOW
    );
    expect(s.today).toBe(4);
    expect(s.week).toBe(4);
    expect(s.month).toBe(5);
    expect(s.paidMonth).toBe(3);
    expect(s.gmvMonth).toBe(80);
    expect(s.avgTicket).toBeCloseTo(26.67, 2);
    expect(s.byRestaurant[0].restaurant_id).toBe("r1");
  });
});

describe("آخر ما حصل", () => {
  it("يدمج المصادر، الأحدث أوّلاً، بحدٍّ أعلى", () => {
    const f = activityFeed(
      {
        merchants: [merchant({ id: "r1", name: "الورد", owner_id: "u1", created_at: "2026-11-20T00:00:00Z" })],
        subs: [
          {
            id: "s",
            user_id: "u1",
            plan_id: "standard",
            payment_ref: null,
            start_date: null,
            end_date: "2027-01-01T00:00:00Z",
            active: true,
            cancelled_at: null,
            created_at: "2026-11-25T00:00:00Z",
          },
        ],
        revenue: [{ id: "v", amount: 99, plan_name: "standard", user_name: null, action: null, created_at: "2026-11-25T00:00:01Z" }],
        tickets: [{ id: "t", subject: "سؤال", restaurant_name: "الورد", created_at: "2026-11-21T00:00:00Z" }],
      },
      3
    );
    expect(f.map((a) => a.kind)).toEqual(["payment", "subscription", "ticket"]);
    expect(f[1].text).toBe("«الورد» اشترك");
    expect(f[1].to).toBe("/founder/merchants/r1");
  });

  it("الزمن النسبي", () => {
    expect(ago(new Date(NOW - 30_000).toISOString(), NOW)).toBe("الحين");
    expect(ago(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe("قبل 5 د");
    expect(ago(new Date(NOW - 3 * 3600_000).toISOString(), NOW)).toBe("قبل 3 س");
    expect(ago(new Date(NOW - DAY).toISOString(), NOW)).toBe("أمس");
  });
});
