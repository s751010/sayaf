/**
 * عنوان المنيو — الوضعان معاً.
 *
 * ⚠️ **يُفحص الوضعان رغم أن الإنتاج على `path` اليوم**: وضع النطاق الفرعي
 * ينتظر شراء `cloudmenu.sa` وربط بدل عامّ، وشيفرةٌ تنتظر ولا تُفحص تتعفّن.
 * الفحص هنا يجعل يوم التحويل **تغيير ثابتين** لا مشروع هجرة.
 *
 * والوحدة تُعاد تحميلها بـ`vi.resetModules()` لكل وضع — الثابتان يُقرآن عند
 * الاستيراد، فتغييرهما يحتاج وحدة جديدة لا إسناداً.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

type MenuUrlModule = typeof import("../../shared/menu-url.mjs");

/** يعيد تحميل الوحدة بثابتين مختلفين. */
async function withMode(
  mode: "path" | "subdomain",
  domain: string | null = "cloudmenu.sa"
) {
  vi.resetModules();
  vi.doMock("../../shared/menu-url.mjs", async () => {
    const actual = (await vi.importActual("../../shared/menu-url.mjs")) as MenuUrlModule;
    return actual;
  });
  const src = await import("node:fs").then((fs) =>
    fs.readFileSync(new URL("../../shared/menu-url.mjs", import.meta.url), "utf8")
  );
  const patched = src
    .replace(
      /export const MENU_DOMAIN = (?:null|"[^"]*");/,
      `export const MENU_DOMAIN = ${domain === null ? "null" : `"${domain}"`};`
    )
    .replace(/export const MENU_MODE = "[^"]*";/, `export const MENU_MODE = "${mode}";`);
  return (await import(
    `data:text/javascript;base64,${Buffer.from(patched, "utf8").toString("base64")}`
  )) as MenuUrlModule;
}

beforeEach(() => vi.resetModules());

/* ══ قاعدة الشكل ═══════════════════════════════════════════════════════ */

describe("slugError — قاعدة تسمية DNS", () => {
  it.each(["aldiwan", "al-diwan", "cafe2026", "a1b", "x".repeat(32), "kabsa-house-99"])(
    "يقبل %s",
    async (slug) => {
      const m = await withMode("path");
      expect(m.slugError(slug), slug).toBeNull();
    }
  );

  it.each([
    ["", "فارغ"],
    ["ab", "أقصر من ٣"],
    ["x".repeat(33), "أطول من ٣٢"],
    ["AlDiwan", "حروف كبيرة"],
    ["مطعم", "عربي"],
    ["مشراق-0e94", "عربي مختلط — وهو شكل الإنتاج القديم"],
    ["-diwan", "يبدأ بشرطة"],
    ["diwan-", "ينتهي بشرطة"],
    ["al--diwan", "شرطتان متتاليتان"],
    ["al diwan", "مسافة"],
    ["al_diwan", "شرطة سفلية"],
    ["al.diwan", "نقطة"],
    ["café", "محرف بعلامة"],
    ["www", "محجوز — يفتح www.cloudmenu.sa منيو مطعم"],
    ["dashboard", "محجوز — يصطدم بمسار التطبيق"],
    ["api", "محجوز للبنية"],
  ])("يرفض %s (%s)", async (slug) => {
    const m = await withMode("path");
    expect(m.slugError(slug), slug).toBeTruthy();
  });

  it("الرسالة عربية ومفيدة لا رمز خطأ", async () => {
    const m = await withMode("path");
    expect(m.slugError("مطعم")).toContain("مرمّزاً");
    expect(m.slugError("ab")).toContain("٣");
  });
});

/* ══ menuUrl في الوضعين ════════════════════════════════════════════════ */

describe("menuUrl", () => {
  it("وضع المسار", async () => {
    const m = await withMode("path");
    expect(m.menuUrl("aldiwan")).toBe("https://cloudmenu.sa/aldiwan");
    expect(m.menuUrl("aldiwan", "?table=5")).toBe("https://cloudmenu.sa/aldiwan?table=5");
    expect(m.menuUrl("aldiwan", "preview=1")).toBe("https://cloudmenu.sa/aldiwan?preview=1");
  });

  it("وضع النطاق الفرعي", async () => {
    const m = await withMode("subdomain");
    expect(m.menuUrl("aldiwan")).toBe("https://aldiwan.cloudmenu.sa");
    expect(m.menuUrl("aldiwan", "?table=5")).toBe("https://aldiwan.cloudmenu.sa?table=5");
  });

  it("⚠️ الرابط العربي القديم يبقى على المسار حتى في وضع النطاق الفرعي", async () => {
    const m = await withMode("subdomain");
    // لا يصلح تسمية DNS، فوضعه نطاقاً فرعياً يعطي عنواناً لا يُحلّ —
    // ومنيو تسعة عشر مطعماً في الإنتاج على هذا الشكل.
    const url = m.menuUrl("مشراق-0e94");
    expect(url).toContain("cloudmenu.sa/");
    expect(url).not.toMatch(/^https:\/\/[^/]*\.cloudmenu\.sa$/);
    expect(url).toContain("%D9%85");
  });

  it("slug فارغ ⇒ null لا رابط مكسور", async () => {
    const m = await withMode("path");
    expect(m.menuUrl("")).toBeNull();
    expect(m.menuUrl(null)).toBeNull();
    expect(m.menuUrl(undefined)).toBeNull();
  });

  it("⚠️ لا يحمل نطاقاً لا يُحلّ اليوم", async () => {
    // الوحدة كما هي في المستودع — لا مُرقَّعة. هذا هو ما يدخل كود QR المطبوع.
    const live = (await import("../../shared/menu-url.mjs")) as MenuUrlModule;
    expect(live.MENU_DOMAIN).not.toBe("cloudmenu.sa");
    expect(live.menuUrl("aldiwan")).not.toContain("cloudmenu.sa");
  });
});

/* ══ slugFromRequest — العكس ═══════════════════════════════════════════ */

describe("slugFromRequest", () => {
  it("من النطاق الفرعي", async () => {
    const m = await withMode("subdomain");
    expect(m.slugFromRequest("aldiwan.cloudmenu.sa", "/")).toBe("aldiwan");
    expect(m.slugFromRequest("aldiwan.cloudmenu.sa:443", "/")).toBe("aldiwan");
    expect(m.slugFromRequest("ALDIWAN.CLOUDMENU.SA", "/")).toBe("aldiwan");
  });

  it("النطاق الجذر ليس منيواً", async () => {
    const m = await withMode("subdomain");
    expect(m.slugFromRequest("cloudmenu.sa", "/")).toBeNull();
  });

  it("⚠️ النطاقات الفرعية المحجوزة ليست منيوهات", async () => {
    const m = await withMode("subdomain");
    for (const h of ["www", "api", "app", "admin", "mail", "cdn"]) {
      expect(m.slugFromRequest(`${h}.cloudmenu.sa`, "/"), h).toBeNull();
    }
  });

  it("نطاق فرعي من مستويين ليس منيواً", async () => {
    const m = await withMode("subdomain");
    expect(m.slugFromRequest("a.b.cloudmenu.sa", "/")).toBeNull();
  });

  it("من المسار — ويعمل في الوضعين", async () => {
    for (const mode of ["path", "subdomain"] as const) {
      const m = await withMode(mode);
      expect(m.slugFromRequest("cloudmenu.sa", "/aldiwan"), mode).toBe("aldiwan");
      expect(m.slugFromRequest("cloudmenu.sa", "/مشراق-0e94"), mode).toBe("مشراق-0e94");
    }
  });

  it("ما ليس منيواً على المسار", async () => {
    const m = await withMode("path");
    for (const p of ["/", "/about", "/demo", "/blog/x", "/og.png", "/assets/a.js", "/dashboard/x"]) {
      expect(m.slugFromRequest("cloudmenu.sa", p), p).toBeNull();
    }
  });

  it("المسار المرمّز يُفكّ", async () => {
    const m = await withMode("path");
    expect(m.slugFromRequest("cloudmenu.sa", "/%D9%85%D8%B4%D8%B1%D8%A7%D9%82-0e94")).toBe(
      "مشراق-0e94"
    );
  });

  it("الذهاب والعودة يتطابقان في الوضعين", async () => {
    for (const mode of ["path", "subdomain"] as const) {
      const m = await withMode(mode);
      const url = new URL(m.menuUrl("aldiwan")!);
      expect(m.slugFromRequest(url.host, url.pathname), mode).toBe("aldiwan");
    }
  });
});

/* ══ الوضع التلقائي — وهو وضع الإنتاج اليوم ═══════════════════════════ */

describe("MENU_DOMAIN = null — النطاق هو ما فُتح عليه الموقع", () => {
  it("⚠️ المستودع اليوم على التلقائي — لا نطاق مكتوب", async () => {
    // هذا هو الفحص الذي يمنع تثبيت نطاق بلا قصد: نطاقٌ مكتوب يعني أن كل
    // كود QR يُطبع سيحمله مهما كان المضيف الذي نُشر عليه الموقع.
    const live = (await import("../../shared/menu-url.mjs")) as MenuUrlModule;
    expect(live.MENU_DOMAIN).toBeNull();
    expect(live.MENU_MODE).toBe("path");
  });

  it("يبني الرابط على الأصل المُمرَّر", async () => {
    const m = await withMode("path", null);
    expect(m.menuUrl("aldiwan", "", "https://any-domain.example")).toBe(
      "https://any-domain.example/aldiwan"
    );
    expect(m.menuUrl("aldiwan", "?table=3", "https://x.netlify.app")).toBe(
      "https://x.netlify.app/aldiwan?table=3"
    );
  });

  it("الشرطة المائلة الزائدة في الأصل تُقصّ", async () => {
    const m = await withMode("path", null);
    expect(m.menuUrl("aldiwan", "", "https://x.test/")).toBe("https://x.test/aldiwan");
  });

  it("اللاحقة المعروضة تتبع المضيف الحقيقي", async () => {
    const m = await withMode("path", null);
    expect(m.urlAffixes("https://my-site.test")).toEqual({
      before: "my-site.test/",
      after: "",
    });
  });

  it("⚠️ بلا نطاق أساس لا يُخمَّن نطاق فرعي", async () => {
    const m = await withMode("path", null);
    // `aldiwan` هنا قد يكون slug وقد يكون جزءاً من نطاق الموقع نفسه — والتخمين
    // يعني عرض منيو مطعم على عنوان ليس له.
    expect(m.slugFromRequest("aldiwan.example.com", "/")).toBeNull();
    expect(m.slugFromRequest("example.com", "/aldiwan")).toBe("aldiwan");
  });

  it("⚠️ `subdomain` بلا نطاق مكتوب يسقط إلى المسار — لا عنوان لا يُحلّ", async () => {
    const m = await withMode("subdomain", null);
    expect(m.menuUrl("aldiwan", "", "https://x.test")).toBe("https://x.test/aldiwan");
  });

  it("كتابة النطاق تُحوّل كل شيء معاً", async () => {
    const m = await withMode("path", "cloudmenu.sa");
    // الأصل المُمرَّر يُتجاهَل حين يُكتب النطاق — وهو المقصود: يوم تُربط،
    // تصير كل الروابط عليه أياً كان المضيف الذي فُتحت منه اللوحة.
    expect(m.menuUrl("aldiwan", "", "https://old.netlify.app")).toBe(
      "https://cloudmenu.sa/aldiwan"
    );
  });
});
