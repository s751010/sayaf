/**
 * مفتاح الزائر لحدّ المعدّل (`_shared/visitor.ts` — أمن ٢٠٢٦/١١/٠٩، البندان ٢ و٥).
 * هاشٌ لا عنوان، ثابتٌ للزائر نفسه، ومختلفٌ بين النطاقين وبين الـpepper.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { clientIp, uuidFromBytes, visitorKey } from "../../supabase/functions/_shared/visitor";

const H = (o: Record<string, string>) => ({ get: (k: string) => o[k.toLowerCase()] ?? null });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("clientIp", () => {
  it("أوّل قيمة في x-forwarded-for", () => {
    expect(clientIp(H({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
  });
  it("x-real-ip احتياطاً، و`null` بلا عنوان", () => {
    expect(clientIp(H({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(H({}))).toBeNull();
    expect(clientIp(H({ "x-forwarded-for": " , " }))).toBeNull();
  });
  it("قيمةٌ عبثية الطول تُرفض", () => {
    expect(clientIp(H({ "x-forwarded-for": "x".repeat(200) }))).toBeNull();
  });
});

describe("visitorKey", () => {
  it("uuid صالح، ثابتٌ للزائر نفسه، ولا يحمل العنوان", async () => {
    const a = await visitorKey("1.2.3.4", "orders_visitor", "pepper");
    expect(a).toMatch(UUID);
    expect(await visitorKey("1.2.3.4", "orders_visitor", "pepper")).toBe(a);
    expect(a).not.toContain("1.2.3.4");
  });
  it("يختلف بين الزوّار والنطاقين والـpepper", async () => {
    const base = await visitorKey("1.2.3.4", "orders_visitor", "p");
    expect(await visitorKey("1.2.3.5", "orders_visitor", "p")).not.toBe(base);
    expect(await visitorKey("1.2.3.4", "verify_visitor", "p")).not.toBe(base);
    expect(await visitorKey("1.2.3.4", "orders_visitor", "q")).not.toBe(base);
  });
  it("بلا عنوان ⇒ `null` (و`abuse_rate_hit` تمرّره)", async () => {
    expect(await visitorKey(null, "orders_visitor", "p")).toBeNull();
  });
  it("uuidFromBytes بصيغة الإصدار ٤", () => {
    expect(uuidFromBytes(new Uint8Array(32).fill(255))).toMatch(UUID);
  });
});

describe("الدالّتان تمرّان بحدّ الزائر قبل العمل", () => {
  const read = (f: string) =>
    readFileSync(new URL(`../../supabase/functions/${f}/index.ts`, import.meta.url), "utf8");
  it("‏paylink-order-create: الزائر قبل المطعم، و٤٢٩ برسالة عربية", () => {
    const s = read("paylink-order-create");
    expect(s.indexOf('rpc("abuse_rate_hit"')).toBeGreaterThan(0);
    expect(s.indexOf('rpc("abuse_rate_hit"')).toBeLessThan(s.indexOf('rpc("order_rate_hit"'));
    expect(s).toMatch(/visitorOk === false\) \{\s*return json\(\{ error: "[^"]*[؀-ۿ]/);
  });
  it("‏order-verify: قبل سؤال PayLink", () => {
    const s = read("order-verify");
    expect(s.indexOf('rpc("abuse_rate_hit"')).toBeGreaterThan(0);
    expect(s.indexOf('rpc("abuse_rate_hit"')).toBeLessThan(s.indexOf("getInvoice("));
    expect(s).toMatch(/429\)/);
  });
  it("الهجرة تعرّف الدالّتين بصلاحيات service_role وحده", () => {
    const sql = readFileSync(new URL("../../supabase/migrations/20261109_rate_functions.sql", import.meta.url), "utf8");
    for (const fn of ["abuse_rate_hit(text, uuid, integer)", "order_rate_hit(uuid, integer)"]) {
      expect(sql).toContain(`revoke all on function public.${fn} from public, anon, authenticated;`);
      expect(sql).toContain(`grant execute on function public.${fn} to service_role;`);
    }
  });
});
