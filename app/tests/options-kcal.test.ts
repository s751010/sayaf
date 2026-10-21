/**
 * سعرات الإضافات داخل `dishes.options` — `lib/options.ts`.
 *
 * الهيئة تطلب سعرات الإضافات الجانبية منفصلة، وكانت الإضافة اسماً وسعراً فقط.
 * فصار لها `kcal` في JSON العمود نفسه. وما يحرسه هذا الملفّ أمران:
 *
 *  · المفتاح الجديد **لا يُزيح شيئاً**: المعرّف في الطلب موضعٌ في المصفوفة،
 *    والخادم لا يقرأ `kcal` — فالموضع والسعر يجب أن يبقيا كما كانا حرفياً.
 *  · القيمة الفاسدة لا تُعرض: «−50 سعرة» أو «NaN سعرة» على منيو زبون.
 */
import { describe, expect, it } from "vitest";
import { parseOptions, serializeOptions } from "@/lib/options";
import { parseDishOptions } from "../../supabase/functions/_shared/options";

describe("سعرات الإضافات", () => {
  it("تُقرأ وتُكتب ذهاباً وإياباً", () => {
    const opts = [{ name: "جبن إضافي", price: 5, kcal: 80 }, { name: "بلا بصل" }, { name: "شوت إضافي", price: 4, kcal: 3 }];
    const raw = serializeOptions(opts);
    expect(parseOptions(raw)).toEqual(opts);
  });

  it("لا تُزيح الموضع ولا السعر عمّا يقرؤه الخادم", () => {
    const raw = '[{"name":"جبن","price":5,"kcal":80},{"name":"  "},{"name":"صوص","price":2,"kcal":"45"}]';
    const app = parseOptions(raw);
    const edge = parseDishOptions(raw);
    expect(app.map((o) => ({ name: o.name, price: o.price ?? 0 }))).toEqual(
      edge.map((o) => ({ name: o.name, price: o.price }))
    );
    expect(app.map((o) => o.kcal)).toEqual([80, 45]);
  });

  it.each([
    ["سالبة", -50],
    ["صفر", 0],
    ["نصّ غير رقمي", "كثير"],
    ["null", null],
    ["Infinity", 1e999],
  ])("قيمة %s لا تُعرض", (_l, kcal) => {
    const raw = JSON.stringify([{ name: "إضافة", price: 3, kcal }]);
    expect(parseOptions(raw)[0]).toEqual({ name: "إضافة", price: 3 });
  });

  it("الكسور تُقرَّب — لا «79.6 سعرة» على المنيو", () => {
    expect(parseOptions('[{"name":"جبن","kcal":79.6}]')[0].kcal).toBe(80);
    expect(serializeOptions([{ name: "جبن", kcal: 79.6 }])).toBe('[{"name":"جبن","kcal":80}]');
  });

  it("الصفوف القديمة بلا سعرات تبقى كما هي", () => {
    expect(serializeOptions(parseOptions('[{"name":"حار","price":9}]'))).toBe('[{"name":"حار","price":9}]');
  });
});
