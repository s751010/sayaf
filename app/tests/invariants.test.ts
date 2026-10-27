/**
 * حراسة الثوابت — كل فحص هنا يقابل **عطلاً وقع فعلاً** ووُثّق، لا سطراً
 * يُغطّى. لا سعي وراء نسبة تغطية: اختبارٌ لا يحرس شيئاً يُطيل التشغيل
 * ويعطي طمأنينة كاذبة.
 */
import { describe, expect, it } from "vitest";

import { ALL_THEMES, getTheme, splitThemeId, themeBaseOf, bestOnAccent, isHex, normalizeHex } from "@/lib/themes";
import { canonOf, matchKnownCategory, sortCategories } from "@/lib/categories";
import { inTimeWindow } from "@/lib/hours";
import { checkPassword, MIN_PASSWORD } from "@/lib/password";
import { burnMinutes, isHighSodium, isSfdaCompliant } from "@/lib/nutrition";
import { aliasType } from "@/lib/starterMenus";
import { itemsLabel, sectionCover } from "@/components/menu/SectionHeading";
import { monogramOf } from "@/components/menu/LogoMark";
import { menuSkinsCss } from "./skin-css";

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

/** خلط `color-mix(in srgb, a p, b)` كما يحسبه المتصفّح (قناةً قناة). */
function mixHex(a: string, b: string, p: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  return `#${[1, 3, 5]
    .map((i) => Math.round(ch(a, i) * p + ch(b, i) * (1 - p)).toString(16).padStart(2, "0"))
    .join("")}`;
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
  function fingerprint(themes: { id: string; vars: Record<string, string> }[]): string {
    let h = 0;
    for (const t of themes) {
      const line = t.id + "|" + Object.entries(t.vars).sort().map(([k, v]) => `${k}=${v}`).join(",");
      for (let i = 0; i < line.length; i++) h = (Math.imul(31, h) + line.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16);
  }

  /**
   * ═══ بصمتان لا بصمة واحدة (٢٠٢٦/١٠/٢٦) ═══
   *
   * كانت مجموعاً متدحرجاً على `ALL_THEMES` كلّها، فإضافة طابعٍ **توجب** إعادة
   * الأساس — وفي الدفعة نفسها يختبئ تغييرٌ غير مقصود لقيمةٍ قائمة، لأن الرقم
   * الجديد يُنسخ من رسالة الفشل بلا سؤال.
   *
   * الآن: التسعة **مجمّدة** بترتيبها وبصمتها التاريخية نفسها (`54082e2b` —
   * القيمة التي حملها هذا الفحص منذ «٨ ⇒ ٩»، بلا تغيير)، ولا يُحدَّث هذا الرقم
   * إلا بقرار مالكٍ مكتوب. وكلّ طابعٍ يُضاف بعدها له **بصمته وحده** في
   * `ADDED` — فإضافة طابع لا تلمس بصمة التسعة أبداً.
   */
  const FROZEN = ["dark-gold", "receipt", "neon", "sticker", "letterboard", "editorial", "roshan", "najdi", "modern"];
  const ADDED: Record<string, string> = {
    // «محمصة» (٢٠٢٦/١٠/٢٦) — الطابع العاشر، للكافيه المختصّ.
    roastery: "4fc8ff26",
    // «دكّان» و«عسير» (٢٠٢٦/١٠/٢٧) — خطّة المالك، الموجة ٢ البند ٧.
    dukkan: "131b99f1",
    asir: "36df99e3",
  };

  it("بصمة التسعة المجمّدة لم تتغيّر", () => {
    // سجلّ هذا الرقم: «بحري» و«مجلس» (٢٠٢٦-٠٨-٢٠) · **٢١ ⇒ ٦** بقرار مكتوب
    // (docs/design.md §18) · **٦ ⇒ ٨** · **٨ ⇒ ٩** (٢٠٢٦-١٠-٢١). وفي كلّها
    // `dark-gold` بقيمه حرفياً، والمحذوف يُردّ إلى أقرب باقٍ بلونه.
    const nine = FROZEN.map((id) => ALL_THEMES.find((t) => t.id === id));
    expect(nine.every(Boolean), "طابعٌ من التسعة اختفى").toBe(true);
    expect(fingerprint(nine as typeof ALL_THEMES)).toBe("54082e2b");
  });

  it("كلّ طابعٍ بعد التسعة له بصمته وحده", () => {
    // طابعٌ جديد: شغّل الفحص، وأضف سطره إلى `ADDED` من رسالة الفشل — سطرٌ
    // جديد في المراجعة، لا رقمٌ قديم تغيّر.
    for (const t of ALL_THEMES.filter((x) => !FROZEN.includes(x.id))) {
      expect(fingerprint([t]), `«${t.id}» بلا بصمة في ADDED`).toBe(ADDED[t.id]);
    }
    expect(Object.keys(ADDED).every((id) => ALL_THEMES.some((t) => t.id === id))).toBe(true);
  });

  it("عدد الطوابع كما تعلنه الصفحات", () => {
    // `lib/facts.ts` يشتقّه من هنا، لكن الرقم يظهر للزائر — فلو نقص طابع
    // بحذف غير مقصود لتغيّر ما تَعِد به الصفحة بلا أن يلاحظ أحد.
    // ٩ ⇒ ١٠ (٢٠٢٦/١٠/٢٦): «محمصة» بقرار اجتماع الطوابع — تعديلٌ متعمَّد لا تعطيل.
    // ١٠ ⇒ ١٢ (٢٠٢٦/١٠/٢٧): «دكّان» و«عسير» باختيار المالك (خطّة الموجة ٢).
    expect(ALL_THEMES.length).toBe(12);
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

  it("السبّورة ⇒ لوحة حروف، ولون التاجر عليها يبقى", () => {
    expect(themeBaseOf("chalk")).toBe("letterboard");
    const t = getTheme("chalk:#1d4ed8:grid");
    expect(splitThemeId(t.id).base).toBe("letterboard");
    expect(t.vars["--m-accent"]).toBe("#1d4ed8");
    expect(t.design.layout).toBe("grid");
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
   * ═══ و`--m-bg-2` لكلّ الطوابع (٢٠٢٦/١٠/٢٧، الدرس ٥٤) ═══
   *
   * النوافذ كلّها (الطبق · السلّة · التذكرة · ساعات العمل) على `--m-bg-2`، والفحص
   * أعلاه يقيس الأرضية والسطح وحدهما — فخافت «نجدي» كان ‎3.98:1 في كلّ نافذة منذ
   * وُلد ولم يمسكه شيء. وفحص المضافة أدناه يقيسها للثلاثة الجديدة وحدها؛ وهذا
   * للاثني عشر **بالحدّ الذي وُلدت عليه** (٤٫٥ لا ٧)، فلا تُمسّ قيمة في التسعة.
   *
   * والخافت يُقاس **كما يُرسم في النافذة**: طابعٌ يخلط خافته بحبره داخل `.m-sheet`
   * (نجدي — بلا مسّ قيمته) يُحسب بالخلط نفسه المكتوب في CSS، فإن حُذفت القاعدة
   * سقط الفحص.
   */
  it.each(ALL_THEMES.map((t) => [t.id, t] as const))("«%s»: النصّ والخافت ≥ 4.5 فوق `--m-bg-2` (أرضية النوافذ)", (_, t) => {
    const v = t.vars;
    const css = menuSkinsCss();
    const bg2 = v["--m-bg-2"];
    expect(isHex(bg2), "‏`bg-2` مُصمت").toBe(true);
    expect(ratio(v["--m-text"], bg2), `نصّ فوق ${bg2}`).toBeGreaterThanOrEqual(4.5);
    // ‏`.m-skin-<skin> .m-sheet { --m-muted: color-mix(in srgb, var(--m-muted-root) N%, var(--m-text)) }`
    const rule = new RegExp(
      `\\.m-skin-${t.design.skin} \\.m-sheet \\{\\s*--m-muted: color-mix\\(in srgb, var\\(--m-muted-root\\) (\\d+)%, var\\(--m-text\\)\\)`
    ).exec(css);
    const muted = rule ? mixHex(v["--m-muted"], v["--m-text"], Number(rule[1]) / 100) : v["--m-muted"];
    expect(ratio(muted, bg2), `خافتٌ ${rule ? "(مخلوطٌ في النافذة) " : ""}فوق ${bg2}`).toBeGreaterThanOrEqual(4.5);
  });

  it("«نجدي» وحده يحتاج خلط الخافت في النافذة — والفحص يجد قاعدته", () => {
    // الفحص أعلاه يثبت أوّلاً أنه وجد ما يفحصه (الدرس ٤٧): بلا القاعدة كان سيقيس
    // ‎3.98 ويسقط، لا ينجح صامتاً.
    const v = getTheme("najdi").vars;
    expect(ratio(v["--m-muted"], v["--m-bg-2"])).toBeLessThan(4.5);
    expect(menuSkinsCss()).toMatch(/\.m-skin-najdi \.m-sheet \{\s*--m-muted: color-mix\(in srgb, var\(--m-muted-root\) \d+%/);
  });

  /**
   * ⚠️ لون العلامة يأتي من التاجر: أصفرٌ على «عصري» الأبيض كان يكتب الأسعار
   * بتباين 2.2:1، وأحمرُ داكن على «سبّورة» 2.9:1. `--m-accent-ink` نسخة
   * التمييز التي يُكتب بها النصّ، ولا تنزل عن 4.5 أيّاً كان لون التاجر.
   */
  it.each([
    ["modern", "#e0a526"],
    ["modern", "#f2d16b"],
    ["letterboard", "#c8102e"],
    ["sticker", "#ffd400"],
    ["neon", "#1d4ed8"],
    ["dark-gold", "#111113"],
    ["receipt", "#ffd400"],
  ])("«%s» بلون %s: نصّ التمييز ≥ 4.5 فوق الأرضية", (base, hex) => {
    const t = getTheme(`${base}:${hex}`);
    expect(t.vars["--m-accent"]).toBe(hex);
    expect(ratio(t.vars["--m-accent-ink"], t.vars["--m-bg"])).toBeGreaterThanOrEqual(4.5);
  });

  /**
   * الطوابع المضافة بعد التسعة بحدٍّ أعلى، **وعلى `--m-bg-2` أيضاً**: النوافذ كلّها
   * (الطبق · السلّة · التذكرة) على `bg-2`، والفحص أعلاه لا يقيسها — فخافت «نجدي»
   * كان ‎3.98:1 في كلّ نافذةٍ منذ وُلد (الدرس ٥٤). النصّ ≥ ٧ والخافت ≥ ٤٫٥، ونصّ
   * التمييز (السعر) ≥ ٤٫٥ على الثلاث.
   */
  it.each(Object.keys(ADDED))("«%s» (مضاف): النصّ ≥ 7 والخافت والسعر ≥ 4.5 على الأرضيات الثلاث", (id) => {
    const t = getTheme(id);
    const v = t.vars;
    expect(isHex(v["--m-surface"]), "سطحٌ مُصمت يُقاس كما هو").toBe(true);
    for (const ground of [v["--m-bg"], v["--m-bg-2"], v["--m-surface"]]) {
      expect(ratio(v["--m-text"], ground), `نصّ فوق ${ground}`).toBeGreaterThanOrEqual(7);
      expect(ratio(v["--m-muted"], ground), `خافت فوق ${ground}`).toBeGreaterThanOrEqual(4.5);
      expect(ratio(v["--m-accent-ink"], ground), `سعرٌ فوق ${ground}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(v["--m-on-accent"]).toBe(bestOnAccent(v["--m-accent"]));
  });

  it("لونٌ مقروء أصلاً لا يُمسّ", () => {
    expect(getTheme("dark-gold").vars["--m-accent-ink"]).toBe("#d4a843");
    expect(getTheme("modern:#1d4ed8").vars["--m-accent-ink"]).toBe("#1d4ed8");
    expect(getTheme("modern").vars["--m-accent-ink"]).toBe("#111113");
  });

  /**
   * نصّ التمييز (السعر) ≥ ٤٫٥ **حيث يُكتب**: الأرضية، والبطاقة (السطح مركّباً
   * فوقها)، والنافذة (`--m-bg-2`) — لكلّ طابع، ولكلّ لونٍ قديم يُردّ إلى «فاخر» أو
   * «عصري»، ولألوان علامةٍ صعبة. كان يُحلّ على الأرضية وحدها، فـ`crimson` (فاخر
   * بالمرجاني) يكتب أسعار بطاقاته ‎4.38:1 (قياس رفع عصري وفاخر ٢٧/١٠).
   */
  it.each([
    ...ALL_THEMES.map((t) => t.id),
    "royal", "emerald", "hijazi", "oud", "crimson", "ocean", "coffee", "majlis", "purple", "red", "blue", "brown",
    "qatt", "bahri", "sahra", "lulu", "light-luxe", "specialty", "cream",
    "dark-gold:#111113", "dark-gold:#e0533d", "modern:#f2d16b", "modern:#e0a526", "modern:#ffd400",
  ])("«%s»: نصّ التمييز ≥ 4.5 على الأرضية والبطاقة والنافذة", (id) => {
    const v = getTheme(id).vars;
    const parse = (c: string) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      return m ? m[1].split(",").map((s) => Number(s.trim())) : null;
    };
    const p = parse(v["--m-surface"]);
    const card = p
      ? mixHex(
          `#${p.slice(0, 3).map((n) => n.toString(16).padStart(2, "0")).join("")}`,
          v["--m-bg"],
          p[3] ?? 1
        )
      : v["--m-surface"];
    for (const ground of [v["--m-bg"], card, v["--m-bg-2"]]) {
      expect(ratio(v["--m-accent-ink"], ground), `${v["--m-accent-ink"]} فوق ${ground}`).toBeGreaterThanOrEqual(4.5);
    }
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
  // بملفّات `skins/<id>.css` في مواضع استيرادها — كما يبنيها Vite.
  const css = menuSkinsCss();
  const special = ALL_THEMES.filter((t) => t.design.skin !== "store");

  /**
   * طابعٌ بخامةٍ لا قاعدة لها في `menu-skins.css` يُرسم **واجهة متجرٍ عارية**
   * بلا ورقٍ ولا طباشير ولا طوب — وكلّ شيءٍ سليمٌ في الأنواع والبناء.
   */
  it.each(special.map((t) => [t.id, t.design.skin] as const))("«%s» ⇒ `.m-skin-%s` معرّفة", (_, skin) => {
    expect(css).toContain(`.m-skin-${skin} `);
  });

  it("الترويسة الخاصّة لا تأتي بلا خامتها", () => {
    // ‏`paper` بلا `m-skin-receipt` ترويسةُ فاتورة بلا ورقة تحتها، و`letterboard`
    // بلا خامتها حروفٌ بيضاء على لا لبّاد.
    const store = new Set(["arch", "band", "frame", "soft"]);
    for (const t of ALL_THEMES) {
      expect(store.has(t.design.header), t.id).toBe(t.design.skin === "store");
    }
  });

  /**
   * «عصري» و«فاخر» صارا خامتين (٢٠٢٦/١٠/٢٧) — ولكلٍّ منهما ألوانٌ قديمة تُردّ
   * إليه (`LEGACY`). المردود يلبس **البنية نفسها** بلونه، لا واجهة المتجر العارية.
   * و`store` بقيت لـ«لون علامتي» (`custom:`) وحده.
   */
  it.each([
    ["dark-gold", "gold", "folio"],
    ["royal", "gold", "folio"],
    ["crimson", "gold", "folio"],
    [null, "gold", "folio"],
    ["modern", "modern", "grid"],
    ["qatt", "modern", "grid"],
    ["specialty", "modern", "grid"],
    ["minimal", "modern", "grid"],
  ])("«%s» ⇒ خامة %s وترويسة %s", (id, skin, header) => {
    const t = getTheme(id);
    expect(t.design.skin).toBe(skin);
    expect(t.design.header).toBe(header);
  });

  it("«لون علامتي» القديم (`custom:`) يبقى واجهة متجر محايدة", () => {
    expect(getTheme("custom:#2fa8a0").design.skin).toBe("store");
  });

  it("`deck` شكل عرضٍ يُحفظ ويُقرأ كأخواته", () => {
    expect(splitThemeId("neon:#ff3d81:deck").layout).toBe("deck");
    expect(getTheme("modern:deck").design.layout).toBe("deck");
    expect(getTheme("neon").design.layout).toBe("deck");
  });
});

describe("حرف الشعار — لا يلتقط واو العطف", () => {
  // «مطبخ ومشويات الديوان» كانت تعطي «و» وتُقرأ «9» في ثلاثة طوابع (الجودة ٢٦/١٠).
  it.each([
    ["مطعم الديوان", "د"],
    ["مطبخ ومشويات الديوان للمأكولات الشعبية", "د"],
    ["مطعم وكافيه الورد", "و"],
    ["مشويات والديوان", "د"],
    // واوٌ تبدأ اسماً حقيقياً تبقى: «وليد» ليست «و» + «ليد».
    ["مطعم وليد", "و"],
    ["ورد", "و"],
    ["The Kitchen", "T"],
  ])("«%s» ⇒ «%s»", (name, ch) => {
    expect(monogramOf(name)).toBe(ch);
  });
});

describe("الطوابع الثلاث بعد الرفع — الضغط والسعر والنافذة (٢٠٢٦/١٠/٢٦)", () => {
  // بملفّات `skins/<id>.css` في مواضع استيرادها — كما يبنيها Vite.
  const css = menuSkinsCss();

  it("أرقام السعر من خطٍّ أرقامه بعرضٍ واحد — لا `tabular-nums` على خطٍّ بلا `tnum`", () => {
    // طجوال والمراعي بلا `tnum`: الخاصية وحدها لا تصفّ رقماً (قيس 20.7 مقابل 29.6).
    expect(css).toMatch(/\.m-price \{\s*font-family: var\(--font-cairo\)/);
  });

  it.each(["receipt", "neon", "sticker", "letterboard", "editorial", "roshan", "najdi", "roastery", "dukkan", "asir", "gold", "modern"])(
    "«%s» له حركة نافذةٍ خاصّة داخل `no-preference`",
    (skin) => {
      const block = css.split("@media (prefers-reduced-motion: no-preference)").slice(1).join("");
      expect(block).toContain(`.m-skin-${skin} .m-sheet.anim-fade-up`);
    }
  );

  it("مدّة كل حركة نافذة ≤ 320ms", () => {
    const ms = [...css.matchAll(/\.m-sheet\.anim-fade-up \{[^}]*animation:\s*[\w-]+ ([\d.]+)s/g)].map((m) => Number(m[1]) * 1000);
    expect(ms.length).toBeGreaterThanOrEqual(9);
    for (const v of ms) expect(v).toBeLessThanOrEqual(320);
  });

  it("الضغط: التحويل داخل `no-preference` وحده", () => {
    // خارجها: ظلٌّ وخلفيّةٌ وحافّة — حالةٌ تُرى مع «تقليل الحركة» بلا حركة.
    const start = css.indexOf("── الضغط ──");
    expect(start).toBeGreaterThan(0);
    const before = css.slice(start, css.indexOf("@media (prefers-reduced-motion: no-preference)", start));
    expect(before).toContain(":active");
    expect(before).not.toMatch(/:active[^{]*\{[^}]*transform:/);
  });

  it("لا `letter-spacing` على اسم الطبق", () => {
    expect(css).not.toMatch(/\.m-name[^{]*\{[^}]*letter-spacing/);
  });
});

describe("عنوان القسم — العدد والغلاف", () => {
  it.each([
    [1, "صنف واحد"],
    [2, "صنفان"],
    [3, "3 أصناف"],
    [10, "10 أصناف"],
    [11, "11 صنفاً"],
    [24, "24 صنفاً"],
  ])("%i ⇒ «%s»", (n, label) => {
    expect(itemsLabel(n, false)).toBe(label);
  });

  it("الإنجليزية مفردٌ وجمع", () => {
    expect(itemsLabel(1, true)).toBe("1 item");
    expect(itemsLabel(4, true)).toBe("4 items");
  });

  /** غلاف القسم يختاره التاجر بتمييز طبقٍ فيه — فالمميّز يسبق ترتيب الأطباق. */
  it("الغلاف: المميّز بصورةٍ أوّلاً، ثم أوّل طبقٍ بصورة، وبلا صورٍ لا غلاف", () => {
    const d = (id: string, image: string | null, featured = false) =>
      ({ id, name: id, name_en: null, image, featured }) as unknown as Parameters<typeof sectionCover>[0][number];
    expect(sectionCover([d("a", "a.jpg"), d("b", "b.jpg", true)], false)?.src).toBe("b.jpg");
    expect(sectionCover([d("a", null), d("b", " "), d("c", "c.jpg")], false)?.src).toBe("c.jpg");
    expect(sectionCover([d("a", null, true), d("b", null)], false)).toBeNull();
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
