/**
 * حراسة الثوابت — كل فحص هنا يقابل **عطلاً وقع فعلاً** ووُثّق، لا سطراً
 * يُغطّى. لا سعي وراء نسبة تغطية: اختبارٌ لا يحرس شيئاً يُطيل التشغيل
 * ويعطي طمأنينة كاذبة.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { ALL_THEMES, getTheme, splitThemeId, themeBaseOf, bestOnAccent, isHex, normalizeHex } from "@/lib/themes";
import { canonOf, matchKnownCategory, sortCategories } from "@/lib/categories";
import { inTimeWindow } from "@/lib/hours";
import { checkPassword, MIN_PASSWORD } from "@/lib/password";
import { burnMinutes, isHighSodium, isSfdaCompliant } from "@/lib/nutrition";
import { aliasType } from "@/lib/starterMenus";

/** تباين WCAG بين لونين سداسيّين. */
function ratio(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, b2] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2);
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/* ══ §18 · ألوان الطوابع لا تتغيّر ═════════════════════════════════════ */

describe("ثابت §18 — ألوان الطوابع", () => {
  /**
   * ⚠️ **ثمانية عشر مطعماً حقيقياً على هذه القيم**، و`dark-gold` هو الطابع
   * الافتراضي أي شكل المنتج لمن لم يختر. تغيير قيمة واحدة يغيّر منيو تاجر
   * لم نقصد تغييره — والمنيو مطبوع كوده على طاولاته.
   *
   * اللقطة **مجموع تجزئة** لا قائمة: قائمةٌ بمئة قيمة تُقرأ ولا تُراجَع، أما
   * رقم واحد يتغيّر فيوقف الدفعة ويجبر على السؤال «هل قصدتَ هذا؟».
   */
  function fingerprint(): string {
    let h = 0;
    for (const t of ALL_THEMES) {
      const line = t.id + "|" + Object.entries(t.vars).sort().map(([k, v]) => `${k}=${v}`).join(",");
      for (let i = 0; i < line.length; i++) h = (Math.imul(31, h) + line.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16);
  }

  it("بصمة الألوان لم تتغيّر", () => {
    // عند تغيير طابع **عن قصد**: شغّل الفحص، خذ الرقم الجديد من رسالة الفشل،
    // وحدّثه هنا في نفس الدفعة — فيبقى التغيير مرئياً في المراجعة.
    // حُدّثت مع إضافة «بحري» و«مجلس» (٢٠٢٦-٠٨-٢٠) — إضافة طابعين جديدين،
    // لا تغيير قيمة في أي طابع قائم.
    // ثم ٢٠٢٦-١٠-٢١: **٢١ ⇒ ٦ بقرار مكتوب** (docs/design.md §18). `dark-gold`
    // بقيمه حرفياً، والمحذوف يُردّ إلى أقرب باقٍ بلونه (الفحص التالي).
    // ثم اليوم نفسه: **٦ ⇒ ٨** — خمسة طوابع بنيتها جديدة (فاتورة · نيون ·
    // سبّورة · مجلّة · روشان) مكان ثلاثة كانت ألواناً. `dark-gold` بقيمه حرفياً.
    expect(fingerprint()).toBe("7e9382b4");
  });

  it("عدد الطوابع كما تعلنه الصفحات", () => {
    // `lib/facts.ts` يشتقّه من هنا، لكن الرقم يظهر للزائر — فلو نقص طابع
    // بحذف غير مقصود لتغيّر ما تَعِد به الصفحة بلا أن يلاحظ أحد.
    expect(ALL_THEMES.length).toBe(8);
  });

  /**
   * الطوابع المحذوفة **في قاعدة الإنتاج** — لا يجوز أن يسقط أيّها إلى
   * الافتراضي بلا لونه، فيتبدّل منيو تاجرٍ عامل إلى غير ما اختار.
   */
  it.each([
    ["royal", "dark-gold", "#d4af37"],
    ["emerald", "dark-gold", "#d9b65f"],
    ["hijazi", "dark-gold", "#e07a5f"],
    ["crimson", "dark-gold", "#e0533d"],
    ["qatt", "modern", "#c0392b"],
    ["sahra", "modern", "#a9744a"],
    ["lulu", "modern", "#5f6b7a"],
    ["green", "dark-gold", "#d9b65f"],
    // الثلاثة التي خرجت يوم دخلت ⇒ الطابع الذي ورث فكرتها.
    ["specialty", "modern", "#3f6f52"],
    ["urban", "neon", "#ff5a1f"],
    ["marble", "editorial", "#8a6a3f"],
  ])("المحذوف «%s» ⇒ %s بلونه %s", (old, base, accent) => {
    const t = getTheme(old);
    expect(splitThemeId(t.id).base).toBe(base);
    expect(t.vars["--m-accent"]).toBe(accent);
  });

  it("لون التاجر يغلب لون الطابع المحذوف، وشكل العرض يبقى", () => {
    const t = getTheme("royal:#123456:list");
    expect(t.vars["--m-accent"]).toBe("#123456");
    expect(t.design.layout).toBe("list");
    expect(themeBaseOf("royal:#123456")).toBe("dark-gold");
  });

  /**
   * التباين محسوبٌ لا مُقدَّر — نصّ الطبق ووصفه يُقرآن في مطعمٍ مُضاء بخفوت.
   * السطح الشفّاف (`rgba`) يُركَّب فوق الأرضية قبل الحساب، فهو ما تراه العين.
   */
  it.each(ALL_THEMES.map((t) => [t.id, t] as const))("«%s»: النصّ والخافت ≥ 4.5 فوق الأرضية والسطح", (_, t) => {
    const parse = (c: string): [number, number, number, number] => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const [r, g, b, a = "1"] = m[1].split(",").map((s) => s.trim());
        return [+r, +g, +b, +a];
      }
      return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)).concat(1) as [number, number, number, number];
    };
    const over = (top: string, under: string) => {
      const [r, g, b, a] = parse(top);
      const [R, G, B] = parse(under);
      const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
      return `#${hex(r * a + R * (1 - a))}${hex(g * a + G * (1 - a))}${hex(b * a + B * (1 - a))}`;
    };
    const v = t.vars;
    const surface = over(v["--m-surface"], v["--m-bg"]);
    for (const ground of [v["--m-bg"], surface]) {
      expect(ratio(v["--m-text"], ground), `نصّ فوق ${ground}`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(v["--m-muted"], ground), `خافت فوق ${ground}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(ratio(v["--m-on-accent"], v["--m-accent"]), "النصّ فوق التمييز").toBeGreaterThanOrEqual(4.5);
  });

  /**
   * ⚠️ لون العلامة يأتي من التاجر: أصفرٌ على «عصري» الأبيض كان يكتب الأسعار
   * بتباين 2.2:1، وأحمرُ داكن على «سبّورة» 2.9:1. `--m-accent-ink` نسخة
   * التمييز التي يُكتب بها النصّ، ولا تنزل عن 4.5 أيّاً كان لون التاجر.
   */
  it.each([
    ["modern", "#e0a526"],
    ["modern", "#f2d16b"],
    ["chalk", "#c8102e"],
    ["neon", "#1d4ed8"],
    ["dark-gold", "#111113"],
    ["receipt", "#ffd400"],
  ])("«%s» بلون %s: نصّ التمييز ≥ 4.5 فوق الأرضية", (base, hex) => {
    const t = getTheme(`${base}:${hex}`);
    expect(t.vars["--m-accent"]).toBe(hex);
    expect(ratio(t.vars["--m-accent-ink"], t.vars["--m-bg"])).toBeGreaterThanOrEqual(4.5);
  });

  it("لونٌ مقروء أصلاً لا يُمسّ", () => {
    expect(getTheme("dark-gold").vars["--m-accent-ink"]).toBe("#d4a843");
    expect(getTheme("modern:#1d4ed8").vars["--m-accent-ink"]).toBe("#1d4ed8");
  });

  it("الافتراضي dark-gold وتخطيطه grid", () => {
    const d = getTheme(null);
    expect(d.id).toBe("dark-gold");
    expect(d.design.layout).toBe("grid");
  });

  it("لكل طابع معرّف فريد", () => {
    const ids = ALL_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

/* ══ §2 · تحليل معرّف الطابع غير مرتبط بالترتيب ════════════════════════ */

describe("splitThemeId — المقاطع بأي ترتيب", () => {
  it.each([
    ["najdi", "najdi", null, null],
    ["najdi:#e07a5f", "najdi", "#e07a5f", null],
    ["najdi:list", "najdi", null, "list"],
    ["najdi:#e07a5f:list", "najdi", "#e07a5f", "list"],
    // ⚠️ الترتيب المقلوب: المقطع الذي يصلح لوناً لون، والمطابق لتخطيط تخطيط.
    ["najdi:list:#e07a5f", "najdi", "#e07a5f", "list"],
    ["najdi:showcase", "najdi", null, "showcase"],
  ])("%s", (raw, id, hex, layout) => {
    const s = splitThemeId(raw);
    expect(s.base).toBe(id);
    expect(s.hex).toBe(hex);
    expect(s.layout).toBe(layout);
  });

  it("مقطع مجهول يُتجاهل بلا انهيار", () => {
    expect(() => splitThemeId("najdi:zzz:list")).not.toThrow();
    expect(splitThemeId("najdi:zzz:list").layout).toBe("list");
  });

  it("معرّف مجهول يسقط إلى الافتراضي", () => {
    expect(getTheme("لا-وجود-له").id).toBe("dark-gold");
  });

  it("صيغة custom القديمة تبقى تعمل", () => {
    expect(splitThemeId("custom:#123456").hex).toBe("#123456");
  });
});

/* ══ §3‑ز · التباين بمقارنة فعلية لا بعتبة سطوع ════════════════════════ */

/* ══ §18 · الطوابع ذات البنية الخاصّة ══════════════════════════════════ */

describe("خامات الطوابع — البنية والـCSS معاً", () => {
  const css = readFileSync(fileURLToPath(new URL("../src/styles/menu-skins.css", import.meta.url)), "utf8");
  const special = ALL_THEMES.filter((t) => t.design.skin !== "store");

  /**
   * طابعٌ بخامةٍ لا قاعدة لها في `menu-skins.css` يُرسم **واجهة متجرٍ عارية**
   * بلا ورقٍ ولا طباشير ولا طوب — وكلّ شيءٍ سليمٌ في الأنواع والبناء.
   */
  it.each(special.map((t) => [t.id, t.design.skin] as const))("«%s» ⇒ `.m-skin-%s` معرّفة", (_, skin) => {
    expect(css).toContain(`.m-skin-${skin} `);
  });

  it("الترويسة الخاصّة لا تأتي بلا خامتها", () => {
    // ‏`paper` بلا `m-skin-receipt` ترويسةُ فاتورة بلا ورقة تحتها.
    const store = new Set(["arch", "band", "frame", "soft"]);
    for (const t of ALL_THEMES) {
      expect(store.has(t.design.header), t.id).toBe(t.design.skin === "store");
    }
  });

  it("`deck` شكل عرضٍ يُحفظ ويُقرأ كأخواته", () => {
    expect(splitThemeId("neon:#ff3d81:deck").layout).toBe("deck");
    expect(getTheme("modern:deck").design.layout).toBe("deck");
    expect(getTheme("neon").design.layout).toBe("deck");
  });
});

describe("bestOnAccent — حدّ WCAG AA", () => {
  function contrast(a: string, b: string): number {
    const lum = (hex: string) => {
      const [r, g, b2] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b2);
    };
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  }

  it("المرجاني #e07a5f — العطل الأصلي: الأبيض عليه 2.95:1", () => {
    // العتبة الثابتة القديمة كانت تختار الأبيض هنا، دون حدّ AA.
    expect(contrast("#e07a5f", bestOnAccent("#e07a5f"))).toBeGreaterThanOrEqual(4.5);
  });

  it("ألوان تمييز متنوّعة تمرّ جميعها", () => {
    for (const hex of ["#c9a227", "#0f766e", "#e11d48", "#f5f5f4", "#111827", "#7c3aed", "#84cc16"]) {
      expect(contrast(hex, bestOnAccent(hex)), hex).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("⚠️ الصيغة القصيرة #abc **ليست** مدعومة — والمقطع يُتجاهل بلا انهيار", () => {
    // `isHex` يشترط ستّ خانات بالضبط، فمقطع من ثلاث لا يُقرأ لوناً. هذا هو
    // العقد الفعلي: لا توسيع ضمنيّ يجعل لوناً يظهر لم يكتبه التاجر.
    expect(isHex("#abc")).toBe(false);
    expect(splitThemeId("najdi:#abc").hex).toBeNull();
    expect(normalizeHex("ABC123")).toBe("#abc123");
  });
});

/* ══ §20 · قاموس التصنيفات ═════════════════════════════════════════════ */

describe("التصنيفات", () => {
  it("«فطور» و«إفطار» كلمتان لمعنى واحد", () => {
    expect(canonOf("فطور")?.ar).toBe(canonOf("الإفطار")?.ar);
  });

  it("المجهول يبقى مجهولاً — لا نخمّن على التاجر", () => {
    for (const raw of ["Shy", "11", "]p]p", "قسم ١"]) {
      expect(canonOf(raw), raw).toBeNull();
    }
  });

  it("matchKnownCategory: رسماً أولاً ثم معنى", () => {
    expect(matchKnownCategory("فطور", ["الإفطار", "مشاوي"])).toBe("الإفطار");
    expect(matchKnownCategory("المقبلات", ["مقبلات"])).toBe("مقبلات");
    expect(matchKnownCategory("لا يوجد", ["مقبلات"])).toBeNull();
  });

  it("الترتيب الافتراضي يُقرأ كمنيو لا أبجدياً", () => {
    const sorted = sortCategories(["المشروبات", "الحلويات", "المقبلات", "الأطباق الرئيسية"], []);
    expect(sorted[0]).toBe("المقبلات");
    expect(sorted[sorted.length - 1]).toBe("المشروبات");
  });

  it("⚠️ ترتيب التاجر المحفوظ يغلب الرتب", () => {
    const merchant = ["المشروبات", "المقبلات"];
    expect(sortCategories(["المقبلات", "المشروبات"], merchant)).toEqual(merchant);
  });
});

/* ══ §19 · تطبيع نوع المطعم ════════════════════════════════════════════ */

describe("aliasType — الثقب الذي ابتلع ١٦ من ١٩ تاجراً", () => {
  it("لا يعيد فراغاً أبداً", () => {
    for (const raw of ["general", "cafe", "مأكولات سعودية وعالمية", "", "  ", "???"]) {
      expect(aliasType(raw), JSON.stringify(raw)).toBeTruthy();
    }
  });

  it("⚠️ الأخصّ أولاً: «مطعم مشويات» لا يخرج بالقالب العامّ", () => {
    expect(aliasType("مطعم مشويات")).not.toBe(aliasType("مطعم"));
  });
});

/* ══ §2 · نافذة ظهور القائمة ═══════════════════════════════════════════ */

describe("inTimeWindow", () => {
  /** الساعة بتوقيت الرياض (UTC+3) — نبنيها من UTC صراحةً. */
  const at = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return new Date(Date.UTC(2026, 7, 6, h - 3, m));
  };

  it("بلا نافذة ⇒ تظهر دائماً", () => {
    expect(inTimeWindow(null, null, at("03:00"))).toBe(true);
    expect(inTimeWindow("", "", at("03:00"))).toBe(true);
  });

  it("نافذة نهارية عادية", () => {
    expect(inTimeWindow("07:00", "11:00", at("09:00"))).toBe(true);
    expect(inTimeWindow("07:00", "11:00", at("06:59"))).toBe(false);
    expect(inTimeWindow("07:00", "11:00", at("11:00"))).toBe(false);
  });

  it("⚠️ نافذة تعبر منتصف الليل", () => {
    expect(inTimeWindow("22:00", "02:00", at("23:30"))).toBe(true);
    expect(inTimeWindow("22:00", "02:00", at("01:00"))).toBe(true);
    expect(inTimeWindow("22:00", "02:00", at("03:00"))).toBe(false);
    expect(inTimeWindow("22:00", "02:00", at("12:00"))).toBe(false);
  });

  it("بداية = نهاية ⇒ طوال اليوم", () => {
    expect(inTimeWindow("09:00", "09:00", at("03:00"))).toBe(true);
  });
});

/* ══ §3‑د · الأعمدة المحسوبة — التعبير يُكرَّر حرفياً ══════════════════ */

describe("nutrition يطابق الأعمدة المحسوبة في Postgres", () => {
  it("burn_minutes = round(calories / 4)", () => {
    expect(burnMinutes(400)).toBe(100);
    expect(burnMinutes(401)).toBe(100);
    expect(burnMinutes(402)).toBe(101); // round لا floor
    expect(burnMinutes(null)).toBeNull();
  });

  it("is_high_sodium = sodium_mg > 600", () => {
    expect(isHighSodium(601)).toBe(true);
    expect(isHighSodium(600)).toBe(false);
    expect(isHighSodium(null)).toBe(false);
  });

  it("sfda_compliant = كلاهما ليس NULL", () => {
    expect(isSfdaCompliant(100, 200)).toBe(true);
    expect(isSfdaCompliant(100, null)).toBe(false);
    expect(isSfdaCompliant(null, 200)).toBe(false);
    expect(isSfdaCompliant(0, 0)).toBe(true); // الصفر قيمة لا غياب
  });
});

/* ══ §24 · قوّة كلمة المرور ════════════════════════════════════════════ */

describe("checkPassword", () => {
  it.each([
    ["1234567", false, "أقصر من الحدّ"],
    ["password123", false, "شائعة"],
    ["aaaaaaaa", false, "محرف مكرّر"],
    // ⚠️ الحالة التي كشفت ثغرة الصنفين: العربية كانت تُحتسب رمزاً وعربياً معاً.
    ["مطعمالديوان", false, "صنف واحد ودون ١٢"],
    ["مطعمالديوانالرياض", true, "صنف واحد لكن ١٢ فأكثر"],
    ["kabsa2026", true, "حروف وأرقام"],
    ["Riyadh#99", true, "أصناف متعدّدة"],
    ["مطعم2026", true, "عربي ورقم"],
  ])("%s ⇒ %s (%s)", (pw, ok) => {
    expect(checkPassword(pw).ok).toBe(ok);
  });

  it("الرفض يحمل رسالة والقبول لا", () => {
    expect(checkPassword("123").error).toBeTruthy();
    expect(checkPassword("Riyadh#99").error).toBe("");
  });

  it("الحدّ الأدنى ثمانية", () => {
    expect(MIN_PASSWORD).toBe(8);
  });
});
