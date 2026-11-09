/**
 * @vitest-environment jsdom
 *
 * مزوّد القياس — **الذي يُركَّب هو الذي طُلب**.
 *
 * ═══ لماذا وُجد هذا الفحص ═══
 *
 * `LAUNCH.md` كان يطلب من المالك إدراج `{"provider":"ga4","id":"G-…"}` في
 * `site_settings.analytics`. و`installProvider` كانت تحمّل **سكربت Plausible
 * دائماً** وتمرّر المعرّف في `data-domain` — أي أن اتّباع التعليمة حرفياً
 * يُركّب مزوّداً خاطئاً بمعرّفٍ لا يفهمه.
 *
 * وأسوأ ما فيه أنه **ينجح ظاهرياً**: سكربتٌ يُحمَّل، ولا خطأ في الطرفية، ولا
 * حدث يصل. فيمضي المالك شهراً يظنّ أنه يقيس، ثم يفتح لوحته فيجدها فارغة —
 * وهو الشهر الذي كان سيقرّر به أين يسقط التجّار.
 *
 * فالفحص هنا يسأل سؤالاً واحداً: **أي سكربت رُكّب فعلاً؟**
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSiteSetting = vi.fn();
vi.mock("@/lib/data", () => ({ getSiteSetting: (k: string) => getSiteSetting(k) }));

/** يعيد تحميل الوحدة: حالتها (الإعداد والطابور) محفوظة في مستوى الملفّ. */
async function freshTrack() {
  vi.resetModules();
  return await import("@/lib/track");
}

const installed = () =>
  document.querySelector("script[data-cm-analytics]")?.getAttribute("src") ?? null;

beforeEach(() => {
  document.head.innerHTML = "";
  getSiteSetting.mockReset();
  delete (window as { gtag?: unknown }).gtag;
  delete (window as { dataLayer?: unknown }).dataLayer;
});

afterEach(() => {
  document.head.innerHTML = "";
});

describe("GA4 مرفوض بلا بوّابة موافقة — السياسة تَعِد «بلا ملفّات تعريف»", () => {
  /**
   * مراجعة الأمن ٢٠٢٦/١١/٠٩ (البند ٦): كان يكفي معرّف `G-…` ليُحمَّل `gtag`
   * لكل زائر بلا سؤال. والفحص يسأل: **هل حُمِّل أيّ سكربت؟ هل أُرسل حدث؟**
   */
  for (const cfg of [
    { provider: "ga4", id: "G-ABC123XYZ" },
    { id: "G-ONLYID999" },
    { id: "GT-ONLYID999" },
    { id: "AW-123456" },
  ]) {
    it(`${JSON.stringify(cfg)} ⇒ صفر سكربت وصفر gtag`, async () => {
      getSiteSetting.mockResolvedValue(cfg);
      const { track } = await freshTrack();
      track("signup_started");
      await new Promise((r) => setTimeout(r, 30));
      track("first_dish_added");
      expect(installed()).toBeNull();
      expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull();
      expect(window.gtag).toBeUndefined();
      expect(window.dataLayer).toBeUndefined();
    });
  }
});

describe("Plausible يبقى الافتراض لمعرّف نطاق", () => {
  it("نطاقٌ ⇒ سكربت Plausible بـ`data-domain`", async () => {
    getSiteSetting.mockResolvedValue({ id: "cloudmenu.sa" });
    const { track } = await freshTrack();
    track("first_dish_added");
    await vi.waitFor(() => expect(installed()).toBeTruthy());

    expect(installed()).toContain("plausible.io/js/script.js");
    expect(
      document.querySelector("script[data-cm-analytics]")?.getAttribute("data-domain")
    ).toBe("cloudmenu.sa");
  });
});

describe("بلا إعداد لا يُحمَّل شيء", () => {
  it("إعدادٌ غائب ⇒ صفر سكربت (الحالة اليوم)", async () => {
    getSiteSetting.mockResolvedValue(null);
    const { track } = await freshTrack();
    track("signup_started");
    await new Promise((r) => setTimeout(r, 30));
    expect(installed()).toBeNull();
  });

  it("ومعرّفٌ فارغ لا يُركّب مزوّداً بمعرّفٍ فارغ", async () => {
    getSiteSetting.mockResolvedValue({ provider: "ga4", id: "" });
    const { track } = await freshTrack();
    track("signup_started");
    await new Promise((r) => setTimeout(r, 30));
    expect(installed()).toBeNull();
  });
});
