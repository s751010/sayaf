/**
 * حارس الروابط الصادرة (SSRF) — `supabase/functions/_shared/url-guard.ts`.
 *
 * الحارس يعيش في Deno ولا يُشغَّل في بيئة التطوير، فلولا هذا الملفّ لبقي
 * **غير مفحوص** — وهو آخر ما يُترك بلا فحص: دالّة تقرّر إلى أين يُرسل خادمنا
 * طلباً بمفتاح الخدمة.
 */
import { describe, expect, it } from "vitest";
import { checkWebhookUrl, classifyFetchError } from "../../supabase/functions/_shared/url-guard";

describe("checkWebhookUrl — يُرفض", () => {
  const rejected: [string, string][] = [
    // ── العناوين الحرفية: أشهر أهداف SSRF ──
    ["https://127.0.0.1/hook", "ip_literal"],
    ["https://169.254.169.254/latest/meta-data/", "ip_literal"],
    ["https://10.0.0.5/hook", "ip_literal"],
    ["https://192.168.1.1/hook", "ip_literal"],
    ["https://172.16.0.1/hook", "ip_literal"],
    ["https://0.0.0.0/hook", "ip_literal"],
    ["https://[::1]/hook", "ip_literal"],
    ["https://[fd00::1]/hook", "ip_literal"],
    // عنوان عامّ حرفي يُرفض كذلك: الوجهة المشروعة اسم نطاق.
    ["https://8.8.8.8/hook", "ip_literal"],

    // ── أسماء داخلية ──
    ["https://localhost/hook", "internal_host"],
    ["https://metadata.google.internal/x", "internal_host"],
    ["https://printer.local/hook", "internal_host"],
    ["https://db.internal/hook", "internal_host"],
    ["https://intranet/hook", "internal_host"],

    // ── مخطّط ومنفذ ──
    ["http://example.com/hook", "not_https"],
    ["file:///etc/passwd", "not_https"],
    ["gopher://example.com/", "not_https"],
    ["https://example.com:8080/hook", "bad_port"],
    ["https://example.com:22/", "bad_port"],

    // ── مشوّه ──
    ["", "malformed"],
    ["not a url", "malformed"],
    ["//example.com/hook", "malformed"],
  ];

  for (const [url, why] of rejected) {
    it(`${why}: ${url || "(فارغ)"}`, () => {
      expect(checkWebhookUrl(url)).toBe(why);
    });
  }
});

describe("checkWebhookUrl — يُقبل", () => {
  const accepted = [
    "https://example.com/webhooks/cloudmenu",
    "https://hooks.slack.com/services/T/B/X",
    "https://api.my-pos.sa:443/cm",
    "https://sub.domain.example.co.uk/a/b?c=1",
    "  https://example.com/hook  ", // المسافات تُقصّ
  ];
  for (const url of accepted) {
    it(url.trim(), () => expect(checkWebhookUrl(url)).toBeNull());
  }
});

describe("classifyFetchError — صنف لا نصّ", () => {
  /**
   * ⚠️ جوهر الفحص: **لا يعود شيء من نصّ الخطأ الأصلي**. النصّ الخام كان
   * يميّز «رُفض الاتصال» من «انتهت المهلة»، وهو عرّافٌ يمسح به التاجر
   * المنافذ الداخلية طلباً بعد طلب.
   */
  const cases: [string, string][] = [
    ["The signal has been aborted", "timeout"],
    ["operation timed out", "timeout"],
    ["error sending request: dns error: failed to lookup", "dns"],
    ["invalid peer certificate: UnknownIssuer", "tls"],
    ["tcp connect error: Connection refused (os error 111)", "unreachable"],
  ];
  for (const [message, want] of cases) {
    it(`${want} ← ${message.slice(0, 34)}…`, () => {
      expect(classifyFetchError(new Error(message))).toBe(want);
    });
  }

  it("لا يسرّب أي جزء من النصّ الأصلي", () => {
    const secretish = "tcp connect error to 10.0.0.7:6379 (redis)";
    const out = classifyFetchError(new Error(secretish));
    expect(out).toBe("unreachable");
    expect(out).not.toContain("10.0.0.7");
    expect(out).not.toContain("6379");
  });

  it("يبتلع ما ليس Error", () => {
    expect(classifyFetchError(null)).toBe("unreachable");
    expect(classifyFetchError({ weird: true })).toBe("unreachable");
  });
});

/* ══════════════════════════════════════════════════════════════════════
   حارس استعلام `founder-admin` — `_shared/founder-query.ts`
   ══════════════════════════════════════════════════════════════════════ */
import { checkFounderQuery } from "../../supabase/functions/_shared/founder-query";

describe("checkFounderQuery — المورد المضمَّن يعبر القائمة البيضاء", () => {
  /**
   * ⚠️ جوهر العطل: القائمة تحرس **اسم الجدول**، وPostgREST يتيح في `select`
   * الوصول إلى الجداول المرتبطة بالمفاتيح الأجنبية. فثمانية جداول مسموحة
   * كانت باباً إلى مفاتيح PayLink وهاشات مفاتيح API ورموز الكاشير.
   */
  const blocked = [
    "?select=*,restaurant_payment_settings(*)",
    "?select=id,name,api_keys(key_hash)",
    "?select=*,staff_pins(pin_hash)",
    "?select=*,subscriptions(user_id,plan_id)",
    "?id=eq.1&select=name,menus(dishes(price))",
  ];
  for (const q of blocked) {
    it(`يُرفض: ${q.slice(0, 46)}`, () =>
      expect(checkFounderQuery(q)).toBe("embedded_select"));
  }
});

describe("checkFounderQuery — ما تحتاجه اللوحة يبقى يعمل", () => {
  const ok = [
    "",                                        // بلا استعلام
    "?select=key&limit=1",                     // نداء البوّابة الخفيف
    "?select=*",                               // كل أعمدة الجدول المسموح
    "?select=*&order=created_at.desc&limit=50",
    "?id=eq.0e9411ce-421d-4d51-980a-5614467a20c7",
    "?user_id=eq.x&active=eq.true&select=id,plan_id,end_date",
    "?or=(status.eq.open,status.eq.pending)&select=*",
  ];
  for (const q of ok) {
    it(q || "(فارغ)", () => expect(checkFounderQuery(q)).toBeNull());
  }
});

describe("checkFounderQuery — الأشكال الأخرى", () => {
  it("يرفض ما لا يبدأ بعلامة استفهام (تغيير المسار)", () =>
    expect(checkFounderQuery("/../auth/v1/admin/users")).toBe("not_query"));
  it("يرفض استعلاماً ضخماً", () =>
    expect(checkFounderQuery("?select=" + "a".repeat(2100))).toBe("too_long"));
  it("يرفض معاملاً ليس عموداً ولا معاملاً معروفاً", () =>
    expect(checkFounderQuery("?some thing=1")).toBe("unknown_param"));
});
