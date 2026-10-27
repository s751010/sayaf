/**
 * عدّة الطباعة بالطابع (`lib/printKit.ts`) — البوّابة واللوحة والقطع.
 *
 * ═══ ما يحرسه ═══
 *
 * 1. **لا طباعة قبل النطاق** (قرار المالك ٢٠٢٦/١٠/٢٥): `printGate` مغلقة ما دام
 *    `MENU_DOMAIN` فارغاً أو مؤقّتاً، وما دام الرابط في الكود ليس عليه. الكود
 *    المطبوع لا يُحدَّث — فخطأٌ هنا يُطبع على مئة طاولة.
 * 2. **كلّ نصٍّ AA على الأرضية الفعلية** لكلّ طابعٍ من الاثني عشر، بلونه وبلون
 *    علامةٍ يختاره التاجر (أصفر فاتح · رمادي متوسّط · كحلي): الأرضية تدرّجٌ
 *    وزخرفة وملمس، لا `--m-bg` وحده (الدرس ٥٤).
 * 3. **حبر الكود ٧:١** على لوحه الأبيض. (وحداته ومنطقة هدوئه تُقاس بالبكسل في
 *    `e2e/print-kit.spec.ts` — هنا اللون وحده.)
 * 4. **لا قيمة لون في طابع تتغيّر**: اللوحة اشتقاقٌ على القطعة.
 */
import { describe, expect, it } from "vitest";
import {
  KIT_PIECES,
  contrastRatio,
  displayWeightOf,
  isProvisionalHost,
  kitFileName,
  kitPalette,
  printGate,
  sheetHtml,
} from "@/lib/printKit";
import { hasMotif } from "@/lib/printMotifs";
import { ALL_THEMES, getTheme } from "@/lib/themes";
import { MENU_DOMAIN, menuUrl } from "@/lib/menuUrl";
import { CARD_SIZES, KIT_SIZES, perSheet, sizeOf } from "@/lib/cards";

describe("printGate — لا طباعة قبل النطاق النهائي", () => {
  it("اليوم مغلقة: `MENU_DOMAIN` فارغ ⇒ لا تنزيل ولا طباعة", () => {
    // ⟵ يوم يُكتب النطاق في `shared/menu-url.mjs` يسقط هذا السطر عمداً:
    // تحويلُ البوّابة قرارٌ يُرى في الفرق، لا أثرٌ جانبيّ.
    expect(MENU_DOMAIN).toBeNull();
    const g = printGate(MENU_DOMAIN, menuUrl("mishraq", "", "https://neon-frangollo-2c189e.netlify.app"));
    expect(g.ready).toBe(false);
    if (!g.ready) {
      expect(g.reason).toBe("no-domain");
      expect(g.host).toBe("neon-frangollo-2c189e.netlify.app");
      expect(g.note).toMatch(/النطاق/);
      expect(g.note).toMatch(/لا يُحدَّث/);
    }
  });

  it("نطاقٌ مكتوبٌ نهائي والرابط عليه ⇒ مفتوحة (مساراً ونطاقاً فرعياً)", () => {
    expect(printGate("cloudmenu.sa", "https://cloudmenu.sa/mishraq")).toEqual({ ready: true, host: "cloudmenu.sa" });
    expect(printGate("cloudmenu.sa", "https://mishraq.cloudmenu.sa").ready).toBe(true);
    expect(printGate("CloudMenu.sa.", "https://cloudmenu.sa/x?table=5").ready).toBe(true);
  });

  it.each([
    ["neon-frangollo-2c189e.netlify.app", "https://neon-frangollo-2c189e.netlify.app/x"],
    ["deploy-preview-41--neon.netlify.app", "https://deploy-preview-41--neon.netlify.app/x"],
    ["localhost", "http://localhost:5173/x"],
    ["127.0.0.1", "http://127.0.0.1:4319/x"],
    ["cloudmenu.vercel.app", "https://cloudmenu.vercel.app/x"],
  ])("نطاقٌ مؤقّت مكتوب (%s) ⇒ مغلقة", (domain, url) => {
    const g = printGate(domain, url);
    expect(g.ready).toBe(false);
    if (!g.ready) expect(g.reason).toBe("provisional-domain");
  });

  it("الرابط في الكود على مضيفٍ آخر ⇒ مغلقة (يُفحص ما في الكود لا ما يُفترض)", () => {
    const g = printGate("cloudmenu.sa", "https://neon-frangollo-2c189e.netlify.app/mishraq");
    expect(g.ready).toBe(false);
    if (!g.ready) expect(g.reason).toBe("host-mismatch");
    // نطاقٌ يشبهه ولا يتبعه — لا يُقبل بالتطابق النصّي الساذج.
    expect(printGate("cloudmenu.sa", "https://evilcloudmenu.sa/x").ready).toBe(false);
  });

  it("بلا رابط ⇒ مغلقة بسببٍ يقوله", () => {
    for (const url of [null, undefined, "", "ليس رابطاً"]) {
      const g = printGate("cloudmenu.sa", url);
      expect(g.ready).toBe(false);
      if (!g.ready) expect(g.reason).toBe("no-url");
    }
  });

  it("isProvisionalHost: النطاق الحقيقي ليس مؤقّتاً، ومضيفات الاستضافة والتطوير مؤقّتة", () => {
    expect(isProvisionalHost("cloudmenu.sa")).toBe(false);
    expect(isProvisionalHost("menu.example-restaurant.com")).toBe(false);
    for (const h of ["x.netlify.app", "netlify.app", "localhost", "192.168.1.4", "intranet", "", null, "a.github.io", "a.pages.dev"]) {
      expect(isProvisionalHost(h)).toBe(true);
    }
  });
});

/** ألوان علامةٍ تختبر الحلّ: فاتحٌ صعب، ومتوسّطٌ هو أسوأ حالات `bestOnAccent`، وغامق. */
const BRANDS = [null, "#f1c40f", "#7f7f7f", "#0b1f3a", "#ff9eb5", "#2fa8a0"];

describe("kitPalette — كلّ نصٍّ AA على الأرضية الفعلية للقطعة", () => {
  it("يمرّ على الطوابع الاثني عشر كلّها — لا على عيّنة", () => {
    expect(ALL_THEMES.length).toBe(12);
  });

  for (const t of ALL_THEMES) {
    it.each(BRANDS)(`«${t.name}» (${t.id}) بلون %s`, (brand) => {
      const id = brand ? `${t.id}:${brand}` : t.id;
      const p = kitPalette(id);
      // يثبت أوّلاً أنه يفحص شيئاً: أرضياتٌ تسع (٣ × سادة/زخرفة/ملمس).
      expect(p.grounds.length).toBe(9);
      for (const g of p.grounds) {
        expect(contrastRatio(p.text, g), `الاسم على ${g}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.muted, g), `سطر الدعوة والتذييل على ${g}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.accentInk, g), `العرض الترويجي على ${g}`).toBeGreaterThanOrEqual(4.5);
      }
      // ما يُكتب على كتلة التمييز (شارة الطاولة، الشريط، رمز الشعار).
      expect(contrastRatio(p.onAccent, p.accentBlock)).toBeGreaterThanOrEqual(4.5);
      // الكود: الماسح أقسى من العين — ٧:١ كما في صفحة الأكواد.
      expect(p.qrLight).toBe("#ffffff");
      expect(contrastRatio(p.qrDark, p.qrLight)).toBeGreaterThanOrEqual(7);
    });
  }

  it("لا يمسّ قيمة لونٍ في الطابع — الأرضيّتان والتمييز كما هي", () => {
    for (const t of ALL_THEMES) {
      const p = kitPalette(t.id);
      expect(p.bg).toBe(t.vars["--m-bg"].toLowerCase());
      expect(p.bg2).toBe(t.vars["--m-bg-2"].toLowerCase());
      expect(p.accent).toBe(t.vars["--m-accent"].toLowerCase());
      // والطابع نفسه لم يتغيّر بالنداء (لا تعديل في مكانه).
      expect(getTheme(t.id).vars["--m-muted"]).toBe(t.vars["--m-muted"]);
    }
  });

  it("ما كان يسقط فعلاً: خافت «نجدي» فوق السدو ‎3.57:1 ⇐ محلولٌ على البطاقة", () => {
    const najdi = ALL_THEMES.find((t) => t.id === "najdi")!;
    const p = kitPalette("najdi");
    const raw = Math.min(...p.grounds.map((g) => contrastRatio(najdi.vars["--m-muted"], g)));
    expect(raw).toBeLessThan(4.5); // يثبت أن الفحص يمسك ما وُجد
    expect(Math.min(...p.grounds.map((g) => contrastRatio(p.muted, g)))).toBeGreaterThanOrEqual(4.5);
  });

  it("الطابع المحذوف يُردّ بلونه (`LEGACY`) — `crimson` ⇐ فاخر بالمرجاني", () => {
    const p = kitPalette("crimson");
    expect(p.skin).toBe("gold");
    expect(p.accent).toBe("#e0533d");
  });
});

describe("خطّ العرض بالوزن الذي يملكه", () => {
  it("لاله‌زار ٤٠٠ (وزنٌ واحد) · الرقعة وأميري وريم ٧٠٠ · المراعي ونوتو ٨٠٠", () => {
    expect(displayWeightOf("var(--font-lalezar)")).toBe("400");
    expect(displayWeightOf("var(--font-ruqaa)")).toBe("700");
    expect(displayWeightOf("var(--font-amiri)")).toBe("700");
    expect(displayWeightOf("var(--font-reem)")).toBe("700");
    expect(displayWeightOf("var(--font-almarai)")).toBe("800");
    expect(displayWeightOf("var(--font-noto-kufi)")).toBe("800");
    expect(displayWeightOf("var(--font-cairo)")).toBe("900");
  });

  it("كلّ طابعٍ يُحلّ إلى وزنٍ من أوزانه — ولاله‌زار لا يُسمَّن", () => {
    for (const t of ALL_THEMES) {
      const p = kitPalette(t.id);
      if ((t.vars["--m-display"] ?? t.vars["--m-font"]).includes("lalezar")) expect(p.displayWeight).toBe("400");
    }
  });
});

describe("القطع الثلاث", () => {
  it("ستاند الطاولة A5 يُطوى إلى وجهين A6 · ملصقات ٨٠مم ستّة في A4 · كاونتر ١٠٠×١٥٠", () => {
    expect(KIT_PIECES.map((p) => p.id)).toEqual(["tent", "stickers", "counter"]);
    expect(sizeOf("tent-a5").mm).toEqual([148, 210]);
    expect(sizeOf("sticker").mm).toEqual([80, 80]);
    expect(sizeOf("sticker").perSheet).toBe(6);
    expect(perSheet([80, 80])).toBe(6);
    expect(sizeOf("counter").mm).toEqual([100, 150]);
    // كلّ قطعة تُبلَغ من قياسٍ معروف للمحرّك (لا سقوط صامت إلى الأوّل).
    for (const p of KIT_PIECES) expect(sizeOf(p.size).id).toBe(p.size);
  });

  it("قياس العدّة خارج قائمة الاستوديو — الهبوط يعدّ تلك («٦ قياسات»)", () => {
    expect(CARD_SIZES.map((s) => s.id)).not.toContain("tent-a5");
    expect(CARD_SIZES).toHaveLength(6);
    expect(KIT_SIZES.map((s) => s.id)).toEqual(["tent-a5"]);
  });

  it("لكلّ طابعٍ في المُنتقي حافّةٌ مطبوعة — لا طابع يخرج بطاقةً ملوّنة فحسب", () => {
    for (const t of ALL_THEMES) expect(hasMotif(t.design.skin), t.id).toBe(true);
    // «لون علامتي» محايدٌ على الشاشة، فعلى الورق كذلك.
    expect(hasMotif("store")).toBe(false);
  });

  it("ورقة الطباعة: هامش ٨مم وفاصل ٦مم — ما يحسب عليه `perSheet`", () => {
    const html = sheetHtml("data:image/png;base64,AAAA", [80, 80], 6, "ملصقات <QR>");
    expect(html).toContain("@page{size:A4;margin:8mm}");
    expect(html).toContain("gap:6mm");
    expect(html.match(/<img /g)).toHaveLength(6);
    expect(html).toContain("width:80mm;height:80mm");
    expect(html).not.toContain("<QR>");
  });

  it("اسم الملفّ يحمل المطعم والقطعة وحدود القصّ", () => {
    expect(kitFileName("mishraq", "tent")).toBe("cloudmenu-mishraq-tent.png");
    expect(kitFileName("mishraq", "stickers", true)).toBe("cloudmenu-mishraq-stickers-bleed.png");
  });
});
