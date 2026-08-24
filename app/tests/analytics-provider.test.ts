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

describe("GA4 يُركَّب GA4 — لا Plausible بمعرّف GA4", () => {
  it("مع `provider: ga4` يُحمَّل googletagmanager", async () => {
    getSiteSetting.mockResolvedValue({ provider: "ga4", id: "G-ABC123XYZ" });
    const { track } = await freshTrack();
    track("signup_started");
    await vi.waitFor(() => expect(installed()).toBeTruthy());

    expect(installed()).toContain("googletagmanager.com/gtag/js");
    expect(installed()).toContain("G-ABC123XYZ");
    expect(installed()).not.toContain("plausible");
  });

  it("ويُستنتج من شكل المعرّف بلا `provider` — فلا يُشترط على المالك أن يكتبه", async () => {
    getSiteSetting.mockResolvedValue({ id: "G-ONLYID999" });
    const { track } = await freshTrack();
    track("qr_downloaded");
    await vi.waitFor(() => expect(installed()).toBeTruthy());
    expect(installed()).toContain("googletagmanager.com");
  });

  it("و`gtag` تُعرَّف بدالّة تقرأ `arguments` — لا سهم يكسر تنسيقها", async () => {
    getSiteSetting.mockResolvedValue({ provider: "ga4", id: "G-ABC123XYZ" });
    const { track } = await freshTrack();
    track("signup_started");
    await vi.waitFor(() => expect(typeof window.gtag).toBe("function"));
    // `js` و`config` عند التركيب، ثم الحدث المطلوب.
    await vi.waitFor(() => expect((window.dataLayer ?? []).length).toBeGreaterThanOrEqual(3));
  });
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
