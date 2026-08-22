/**
 * فحوص التكافؤ — **أثمن ما في هذه المجموعة**.
 *
 * ثلاثة أزواج من الملفّات مكتوبة بيد مرّتين لأن وحدات النشر مختلفة (Vite في
 * `app/` · Deno في `supabase/functions/` · Deno على حافة Netlify). ولكل زوج
 * منها **عطل وقع فعلاً** بسبب تباعد نسخة عن أصلها:
 *
 *  · `options`: المعرّف موضعٌ في المصفوفة، فتباعد التحليل يشير إلى إضافة أخرى.
 *  · `plans`: اسم الباقة في الخادم كان «الأساسية» والمنتج «كلاود منيو»، فكل
 *    دفعة تُسجَّل باسم باقة لا وجود لها.
 *  · مفتاح `anon` في دالة الحافة: نسخة قديمة ⇒ ٤٠١ ⇒ صمت كامل ولا وسوم.
 *
 * التعليق «حافظ عليهما متطابقين» لا يحرس شيئاً. هذه الفحوص تُسقط CI.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { parseOptions } from "@/lib/options";
import { PLANS, CURRENCY_CODE } from "@/lib/plans";
import { parseDishOptions } from "../../supabase/functions/_shared/options";

const repo = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url));

/* ══ ١) محلّل الإضافات: الواجهة ⟷ الخادم ══════════════════════════════ */

describe("تكافؤ parseOptions ⟷ parseDishOptions", () => {
  /** حالات مقصودة: كلٌّ منها شكل رآه المنتج أو يستطيع API التاجر كتابته. */
  const CASES: [label: string, raw: string | null][] = [
    ["فارغ", ""],
    ["null", null],
    ["مسافات", "   "],
    ["الصيغة المعتمدة", '[{"name":"حار","price":9}]'],
    ["عدّة خيارات", '[{"name":"وسط","price":5},{"name":"كبير","price":8}]'],
    ["بلا سعر", '[{"name":"بدون بصل"}]'],
    ["سعر صفر", '[{"name":"عادي","price":0}]'],
    // ⚠️ التباعد الذي كان قائماً: الخادم يحصّل ٥ والواجهة تعرضه مجّاناً.
    ["سعر نصّي", '[{"name":"جبن","price":"5"}]'],
    ["سعر نصّي بمسافات", '[{"name":"جبن","price":" 7 "}]'],
    ["سعر نصّي فارغ", '[{"name":"جبن","price":""}]'],
    ["سعر غير رقمي", '[{"name":"جبن","price":"abc"}]'],
    ["سعر null", '[{"name":"جبن","price":null}]'],
    ["سعر منطقي", '[{"name":"جبن","price":true}]'],
    ["سعر سالب", '[{"name":"خصم","price":-3}]'],
    ["سعر كسري", '[{"name":"نصف","price":2.5}]'],
    ["Infinity", '[{"name":"x","price":1e999}]'],
    ["مصفوفة نصوص", '["حار","وسط"]'],
    ["نصّ فارغ داخل المصفوفة", '["حار","  ","وسط"]'],
    ["اسم فارغ", '[{"name":"  ","price":5},{"name":"صالح","price":2}]'],
    ["اسم غير نصّي", '[{"name":5,"price":5},{"name":"صالح"}]'],
    ["عنصر null", '[null,{"name":"صالح"}]'],
    ["عنصر رقم", '[7,{"name":"صالح"}]'],
    ["أسماء بمسافات طرفية", '[{"name":"  حار  ","price":3}]'],
    ["JSON ليس مصفوفة", '{"name":"حار"}'],
    ["JSON تالف", "[{name:"],
    ["نصّ حرّ بأسطر", "حار\nوسط\nكبير"],
    ["نصّ حرّ بفواصل عربية", "حار، وسط، كبير"],
    ["نصّ حرّ بفواصل لاتينية", "حار, وسط"],
    ["نصّ حرّ بفراغات زائدة", "  حار ,, وسط  "],
    ["الشكل المُجمَّع القديم", '[{"items":[{"id":1,"name":"حار"}]}]'],
  ];

  it.each(CASES)("%s", (_label, raw) => {
    const app = parseOptions(raw).map((o) => ({ name: o.name, price: o.price ?? 0 }));
    const edge = parseDishOptions(raw).map((o) => ({ name: o.name, price: o.price }));
    // الترتيب جزء من العقد لا تفصيل عرض: المعرّف هو الموضع.
    expect(app).toEqual(edge);
  });

  it("السعر النصّي يُحصَّل ويُعرض بنفس القيمة", () => {
    const raw = '[{"name":"جبن","price":"5"}]';
    expect(parseOptions(raw)[0].price).toBe(5);
    expect(parseDishOptions(raw)[0].price).toBe(5);
  });

  it("الموضع يبقى ثابتاً حين يسقط عنصر غير صالح", () => {
    const raw = '[{"name":"  "},{"name":"أول"},null,{"name":"ثانٍ"}]';
    const app = parseOptions(raw);
    const edge = parseDishOptions(raw);
    expect(app.map((o) => o.name)).toEqual(["أول", "ثانٍ"]);
    expect(edge.map((o) => o.name)).toEqual(["أول", "ثانٍ"]);
  });
});

/* ══ ٢) الباقات: الواجهة ⟷ _shared/plans.ts ═══════════════════════════ */

describe("تكافؤ plans.ts ⟷ _shared/plans.ts", () => {
  const shared = readFileSync(repo("supabase/functions/_shared/plans.ts"), "utf8");

  it("كل باقة في الواجهة موجودة في الخادم بنفس الاسم والسعر", () => {
    for (const plan of PLANS) {
      // القراءة نصّية لا بالاستيراد: الملفّ يستعمل صيغة Deno، وقراءته كنصّ
      // تفحص **ما يُنشَر فعلاً** لا نسخة تُترجَم بإعدادات أخرى.
      expect(shared, `المعرّف ${plan.id} مفقود`).toContain(`"${plan.id}"`);
      expect(shared, `اسم ${plan.id} مختلف`).toContain(plan.name);
      expect(shared, `سعر ${plan.id} مختلف`).toMatch(
        new RegExp(`monthly\\s*:\\s*${plan.monthly}\\b`)
      );
    }
  });

  /**
   * ⚠️ **هذا الفحص وُجد لأن الجدول كان ثلاث نسخ.** `moyasar-webhook` كانت
   * تحمل نسختها الخاصّة بـ٩٩ شهرياً و١٠٨٩ سنوياً — أي أرقام ما قبل توحيد
   * الباقات على ٥٩/٥٩٩. فكان فحص المبلغ فيها **يرفض كل دفعة صحيحة**
   * (`amount_mismatch`) ولا يُفعَّل اشتراك من دفع. والنسخة لا تُكتشف
   * بالقراءة: الدالّتان تعملان، وكلٌّ منهما «صحيحة» وحدها.
   *
   * فأي دالّة حافة تذكر سعراً برقم بدل استيراده من `_shared/plans.ts` تُسقط
   * CI هنا. والاستثناء الوحيد `_shared/plans.ts` نفسه — وهو المصدر.
   */
  it("لا دالّة حافة تكتب سعراً برقم", () => {
    const dir = repo("supabase/functions");
    const offenders: string[] = [];
    const walk = (p: string) => {
      for (const e of readdirSync(p, { withFileTypes: true })) {
        const full = `${p}/${e.name}`;
        if (e.isDirectory()) {
          // `_archive` و`_tombstones` شيفرة ميّتة محفوظة عمداً.
          if (e.name === "_archive" || e.name === "_tombstones") continue;
          walk(full);
        } else if (e.name.endsWith(".ts") && full !== repo("supabase/functions/_shared/plans.ts")) {
          const src = readFileSync(full, "utf8");
          for (const price of PLANS.flatMap((p) => [p.monthly, p.yearly, 99, 199, 1089])) {
            if (new RegExp(`(monthly|yearly)\\s*:\\s*${price}\\b`).test(src)) {
              offenders.push(`${full.split("/functions/")[1]} ← ${price}`);
            }
          }
        }
      }
    };
    walk(dir);
    expect(offenders, `سعر مكتوب بيد خارج _shared/plans.ts:\n${offenders.join("\n")}`)
      .toEqual([]);
  });

  it("الخادم لا يسعّر باقة لا تبيعها الواجهة", () => {
    const ids = [...shared.matchAll(/^\s*(?:")?([a-z_]+)(?:")?\s*:\s*\{/gm)].map((m) => m[1]);
    const known = new Set([...PLANS.map((p) => p.id), "trial"]);
    for (const id of ids) {
      if (/^(monthly|yearly|name|features|limits)$/.test(id)) continue;
      expect(known.has(id), `الخادم يعرف باقة «${id}» لا تبيعها الواجهة`).toBe(true);
    }
  });

  it("رمز العملة معياري — قوقل يتجاهل السعر بغيره", () => {
    expect(CURRENCY_CODE).toBe("SAR");
  });
});

/* ══ ٣) دالة الحافة ⟷ config.ts ═══════════════════════════════════════ */

describe("تكافؤ دالة الحافة ⟷ config.ts", () => {
  const config = readFileSync(repo("app/src/lib/config.ts"), "utf8");
  const edge = readFileSync(repo("netlify/edge-functions/menu-meta.ts"), "utf8");
  const grab = (src: string, name: string) =>
    src.match(new RegExp(`${name}\\s*[:=]\\s*\\n?\\s*"([^"]+)"`))?.[1];

  it("مفتاح anon مطابق", () => {
    // ⚠️ عدم التطابق **صامت تماماً**: الاستعلام يعود ٤٠١، والدالة تعيد الردّ
    // الأصلي كما صُمّمت، فلا خطأ ولا سجلّ — ووسوم المطاعم لا تُحقن أبداً.
    // وقد وقع هذا فعلاً عند أول كتابة للدالة.
    expect(grab(edge, "SUPABASE_ANON_KEY")).toBe(grab(config, "SUPABASE_ANON_KEY"));
  });

  it("عنوان Supabase مطابق", () => {
    expect(grab(edge, "SUPABASE_URL")).toBe(grab(config, "SUPABASE_URL"));
  });
});

/* ══ ٤) معيار الظهور: الدليل ⟷ خريطة الموقع ══════════════════════════ */

describe("تكافؤ معيار الظهور العام", () => {
  /**
   * قارئان لنفس السؤال: «أي مطعم يستحق أن يُعرَض؟». `sitemap.mjs` يجيب لقوقل،
   * و`listPublicRestaurants()` تجيب للزائر. تباعدهما **لا يُسقط شيئاً**: يظهر
   * مطعمٌ في الخريطة ويغيب عن الدليل (أو العكس) بلا خطأ ولا سجلّ.
   *
   * ولا يمكن استيراد الحدّ من الطرف الآخر: السكربت `.mjs` يعمل في Node بلا
   * بناء، فلا يقرأ TypeScript. فالفحص هو الرابط.
   */
  it("حدّ الأصناف واحد في الاثنين", async () => {
    const { DIRECTORY_MIN_DISHES } = await import("@/lib/data");
    const script = readFileSync(repo("app/scripts/sitemap.mjs"), "utf8");
    const inScript = Number(script.match(/const MIN_DISHES\s*=\s*(\d+)/)?.[1]);
    expect(inScript, "لم يُقرأ MIN_DISHES من sitemap.mjs").toBeGreaterThan(0);
    expect(inScript).toBe(DIRECTORY_MIN_DISHES);
  });
});

/* ══ ٥) نوع النشاط كما يراه الزبون ═══════════════════════════════════ */

describe("نوع النشاط المعروض للزبون", () => {
  /**
   * `restaurants.type` حقلٌ حرّ، وفيه قيم إنجليزية قديمة — `general` لأربعة
   * عشر مطعماً من تسعة عشر. وكانت تُطبع كما هي تحت اسم المطعم في ترويسة
   * منيوه وفي `servesCuisine` داخل JSON-LD الذي يقرؤه قوقل.
   */
  it("يترجم القيم الإنجليزية القديمة", async () => {
    const { restaurantTypeLabel } = await import("@/lib/menuText");
    expect(restaurantTypeLabel("general")).toBe("مطعم");
    expect(restaurantTypeLabel("cafe")).toBe("كافيه");
    expect(restaurantTypeLabel("restaurant")).toBe("مطعم");
  });

  it("يعرض كلمات التاجر العربية كما كتبها", async () => {
    const { restaurantTypeLabel } = await import("@/lib/menuText");
    // تصنيفٌ نختاره له أفقر ممّا كتب عن نفسه.
    expect(restaurantTypeLabel("مأكولات سعودية وعالمية")).toBe("مأكولات سعودية وعالمية");
    expect(restaurantTypeLabel("كافيه")).toBe("كافيه");
  });

  it("الفراغ فراغ — لا نملأه بتخمين", async () => {
    const { restaurantTypeLabel } = await import("@/lib/menuText");
    expect(restaurantTypeLabel(null)).toBeNull();
    expect(restaurantTypeLabel("")).toBeNull();
    expect(restaurantTypeLabel("   ")).toBeNull();
  });
});

/* ══ ٦) المبالغ تحمل عملتها ══════════════════════════════════════════ */

describe("المبلغ المعروض", () => {
  /**
   * `formatPrice` تعيد الرقم عارياً، وكانت «ر.س» تُلصق يدوياً حيث تذكّر
   * الكاتب — فخرجت **سبعة مواضع** بلا عملة: بطاقة الكاشير تقول «٨٦»
   * وحدها، وشاشة الزبون تقول «الإجمالي ٨٦»، وتذكرة الطباعة تخلط السطرين.
   * والمبلغ العاري في شاشة دفع لا يعرف قارئه أهي ريالات أم قطع.
   */
  it("يحمل عملته بالعربية والإنجليزية", async () => {
    const { formatMoney } = await import("@/lib/utils");
    expect(formatMoney(86)).toBe("86 ر.س");
    expect(formatMoney(86, true)).toBe("86 SAR");
    expect(formatMoney(1250.5)).toBe("1,250.5 ر.س");
  });

  it("شاشات الطلب لا تعرض رقماً عارياً", () => {
    const files = [
      "app/src/pages/OrderStatus.tsx",
      "app/src/pages/dashboard/Orders.tsx",
      "app/src/components/menu/PickupTicket.tsx",
    ];
    for (const f of files) {
      const src = readFileSync(repo(f), "utf8");
      // `formatPrice` بلا عملة في سطرها = رقم عارٍ.
      const bare = src
        .split("\n")
        .filter((l) => /\bformatPrice\(/.test(l) && !/ر\.س|SAR/.test(l));
      expect(bare, `${f}: مبلغ بلا عملة\n${bare.join("\n")}`).toEqual([]);
    }
  });
});

/* ══ ٧) رسائل الخطأ التي يقرؤها الإنسان ══════════════════════════════ */

describe("خطأ دالة الحافة كما يراه التاجر", () => {
  /**
   * دوالّ الحافة تُعيد حقلين: `error` رمزٌ للشيفرة و`message` نصٌّ عربي.
   * وكانت `callFunction` تقرأ `error` وحدها — فظهر على شاشة التاجر
   * **«not_configured»** حرفياً عند أول فحص لقارئ المنيو. الرمز
   * الإنجليزي في وجه المستخدم أسوأ من «حدث خطأ».
   */
  /** نفس منطق الاختيار في `callFunction` — الفحص يحرس القاعدة لا النصّ. */
  const pickMessage = (parsed: unknown, fallback: string) => {
    const o = (parsed ?? {}) as { message?: unknown; error?: unknown };
    return typeof o.message === "string" && o.message.trim()
      ? o.message
      : typeof o.error === "string"
        ? o.error
        : fallback;
  };

  it("تُفضّل message العربية على رمز error", () => {
    expect(
      pickMessage({ error: "not_configured", message: "الميزة غير مفعّلة بعد." }, "x")
    ).toBe("الميزة غير مفعّلة بعد.");
  });

  it("تسقط إلى الرمز حين لا رسالة", () => {
    expect(pickMessage({ error: "forbidden" }, "x")).toBe("forbidden");
    expect(pickMessage({ error: "e", message: "   " }, "x")).toBe("e");
  });

  it("وإلى النصّ الاحتياطي حين لا شيء", () => {
    expect(pickMessage(null, "menu-scan 502")).toBe("menu-scan 502");
    expect(pickMessage({}, "menu-scan 502")).toBe("menu-scan 502");
  });

  it("والمصدر نفسه يقرأ message أوّلاً", () => {
    const src = readFileSync(repo("app/src/lib/api.ts"), "utf8");
    const i = src.indexOf("obj.message");
    const j = src.indexOf("obj.error");
    expect(i, "obj.message غير موجودة في callFunction").toBeGreaterThan(0);
    expect(i, "تُقرأ error قبل message").toBeLessThan(j);
  });
});

/* ══ ٨) بوّابة المؤسّس: نسخة واحدة لا نسختان ══════════════════════════ */

describe("بوّابة سرّ المؤسّس مشتركة", () => {
  /**
   * ⚠️ **نفس درس `safe-equal.ts` حرفياً، ووقع ثانيةً.** حين نُقل السرّ من
   * أسرار الدوال إلى `internal_secrets`، كُتبت الدالّة **نسختين متطابقتين
   * بيد** في `founder-admin` و`billing-admin` — لأن كلّاً منهما ملفّ مستقلّ
   * ينشر وحده.
   *
   * والنسختان بوّابة **مصادقة**: مَن يشدّ إحداهما لاحقاً (طول أعلى، سجلّ
   * محاولات، حدّ معدّل) يترك الأخرى مفتوحة بالقدر القديم — ولا شيء يصرخ،
   * فكلتاهما تمرّ `deno check` وكلتاهما «تعمل». والفرق لا يظهر إلا لمن يفتح
   * الملفَّين جنباً إلى جنب، وهو ما لا يفعله أحد.
   *
   * فالفحص يمنع عودة النسخة اليدوية: البوّابة تصل بالاستيراد أو لا تصل.
   */
  const GATED = ["founder-admin", "billing-admin"] as const;

  it.each(GATED)("%s يستورد البوّابة ولا ينسخها", (fn) => {
    const src = readFileSync(repo(`supabase/functions/${fn}/index.ts`), "utf8");
    expect(src, "لا يستورد البوّابة المشتركة").toContain(
      'from "../_shared/founder-secret.ts"'
    );
    // النسخة اليدوية تُعرَف بجلب `internal_secrets` داخل الدالّة نفسها.
    expect(src, "نسخة يدوية عادت: تقرأ internal_secrets بنفسها").not.toContain(
      "internal_secrets?key=eq.founder_secret"
    );
    expect(src, "نسخة يدوية عادت: تعرّف hasFounderSecret").not.toMatch(
      /function\s+hasFounderSecret/
    );
  });

  it("المشترك وحده يقرأ السرّ — ويقارنه بزمن ثابت", () => {
    const shared = readFileSync(repo("supabase/functions/_shared/founder-secret.ts"), "utf8");
    expect(shared).toContain("internal_secrets?key=eq.founder_secret");
    // ⚠️ `!==` تسرّب طول البادئة الصحيحة — نفس سبب وجود `safe-equal.ts`.
    expect(shared).toContain("safeEqual(sent, expected)");
    // ومتغيّر البيئة يبقى احتياطاً: من ضبطه سابقاً لا ينكسر عنده شيء.
    expect(shared).toContain('Deno.env.get("FOUNDER_SECRET")');
  });

  it("ولا سرّ مكتوب في المستودع", () => {
    /**
     * 🚫 السرّ ٦٤ محرفاً hex. أي ثابت بهذا الشكل في مصدر الدالّتين أو في
     * المشترك يعني أن قيمةً حقيقية سُرّبت إلى git — ولا تُسحب من التاريخ.
     */
    const HEX64 = /["'`][0-9a-f]{64}["'`]/;
    for (const rel of [
      "supabase/functions/_shared/founder-secret.ts",
      "supabase/functions/founder-admin/index.ts",
      "supabase/functions/billing-admin/index.ts",
    ]) {
      expect(readFileSync(repo(rel), "utf8"), `سرّ مكتوب في ${rel}`).not.toMatch(HEX64);
    }
  });
});
