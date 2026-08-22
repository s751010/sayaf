// @vitest-environment jsdom
/**
 * منقّي محتوى المدوّنة — `app/src/pages/BlogPost.tsx`.
 *
 * ═══ لماذا يستحقّ بيئة jsdom كاملة ═══
 *
 * المنقّي يعمل بـ`DOMParser`، وجوهر عطله القديم كان **دورة تحليل⇄تسلسل**:
 * يُحلّل النصّ ثم يُعيده نصّاً، وReact يُعيد تحليله. فحصٌ على النصّ وحده
 * (تعابير نمطية) كان سيمرّ على ما يمرّ على المتصفّح. فالفحص هنا على محلّل
 * HTML حقيقي أو لا يكون فحصاً.
 *
 * والكاتب هو المؤسّس وحده — لكن المنقّي **يوجد لأن الثقة ليست ضماناً**، وهذه
 * الاختبارات تحرس أن يبقى كذلك.
 */
import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "@/pages/BlogPost";

/** لا وسم تنفيذي ولا معالج حدث ولا مخطّط خطر — مهما كان الشكل. */
function assertInert(out: string) {
  expect(out).not.toMatch(/<script/i);
  expect(out).not.toMatch(/<iframe/i);
  expect(out).not.toMatch(/<object/i);
  expect(out).not.toMatch(/<embed/i);
  expect(out).not.toMatch(/\son[a-z]+\s*=/i);
  expect(out).not.toMatch(/javascript:/i);
  expect(out).not.toMatch(/\sstyle\s*=/i);
}

describe("الوسوم التنفيذية", () => {
  const payloads = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    '<iframe src="https://evil.example"></iframe>',
    '<object data="x"></object>',
    '<embed src="x">',
    '<form action="https://evil.example"><input name=a></form>',
    '<base href="https://evil.example/">',
    '<link rel=stylesheet href="https://evil.example/x.css">',
    '<meta http-equiv=refresh content="0;url=https://evil.example">',
    '<body onload=alert(1)>',
  ];
  for (const html of payloads) {
    it(html.slice(0, 46), () => assertInert(sanitizeHtml(html)));
  }
});

describe("mXSS — الأشكال التي كانت تعبر القائمة السوداء", () => {
  /**
   * ⚠️ هذه بالضبط ما لم تكن القائمة السوداء تحذفه: `noscript` و`template`
   * و`svg` و`math`. وقواعد تحليلها تختلف عن تسلسلها، فما يبدو بريئاً بعد
   * التنقية يعود وسماً تنفيذياً بعد التحليل الثاني في React.
   */
  const payloads = [
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
    '<template><script>alert(1)</script></template>',
    '<svg><use href="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+"/></svg>',
    '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
    '<svg><animate onbegin=alert(1) attributeName=x dur=1s>',
    '<style><img src=x onerror=alert(1)></style>',
  ];
  for (const html of payloads) {
    it(html.slice(0, 48), () => assertInert(sanitizeHtml(html)));
  }
});

describe("سمة style — تغطية الصفحة والتقاط النقرات", () => {
  it("تُنزع من وسم مسموح", () => {
    const out = sanitizeHtml(
      '<div style="position:fixed;inset:0;z-index:9999">اضغط</div>',
    );
    expect(out).not.toContain("style");
    expect(out).toContain("اضغط");
  });
});

describe("مخطّطات الروابط", () => {
  const bad = [
    '<a href="javascript:alert(1)">x</a>',
    '<a href="JaVaScRiPt:alert(1)">x</a>',
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
    '<img src="javascript:alert(1)">',
  ];
  for (const html of bad) {
    it(`يُنزع: ${html.slice(0, 40)}`, () => {
      const out = sanitizeHtml(html);
      expect(out).not.toMatch(/javascript:|vbscript:|data:text\/html/i);
    });
  }

  const good = [
    ["https://example.com/a", "https"],
    ["http://example.com/a", "http"],
    ["mailto:a@b.co", "mailto"],
    ["tel:+966500000000", "tel"],
    ["#section", "مرساة"],
    ["/blog/x", "مسار نسبي"],
  ];
  for (const [href, label] of good) {
    it(`يبقى (${label}): ${href}`, () => {
      expect(sanitizeHtml(`<a href="${href}">x</a>`)).toContain(href);
    });
  }
});

describe("المحتوى المشروع لا يُخسَر", () => {
  it("يُبقي بنية المقال كما كتبها المؤسّس", () => {
    const src = `<h2>عنوان</h2><p>فقرة فيها <strong>تشديد</strong> و<em>ميل</em>.</p>
<ul><li>واحد</li><li>اثنان</li></ul>
<blockquote>اقتباس</blockquote><pre><code>const x = 1;</code></pre>
<table><tr><th scope="col">أ</th><td colspan="2">ب</td></tr></table>
<figure><img src="https://cdn.example/a.png" alt="صورة" loading="lazy"><figcaption>وصف</figcaption></figure>`;
    const out = sanitizeHtml(src);
    for (const tag of ["h2", "p", "strong", "em", "ul", "li", "blockquote", "pre", "code", "table", "th", "td", "figure", "img", "figcaption"]) {
      expect(out).toContain(`<${tag}`);
    }
    expect(out).toContain('alt="صورة"');
    expect(out).toContain('colspan="2"');
    expect(out).toContain("const x = 1;");
  });

  it("الوسم غير المعروف يُستبدَل بمحتواه لا يُحذف معه", () => {
    // ⚠️ خسارةُ نصٍّ كتبه المؤسّس بلا أن يدري أسوأ من وسمٍ غير مدعوم.
    const out = sanitizeHtml("<section><p>نصّ مهمّ</p></section>");
    expect(out).toContain("نصّ مهمّ");
    expect(out).toContain("<p>");
  });

  it("نصّ الوسم التنفيذي لا يُبقى محتواه", () => {
    // ونقيضها: محتوى `<script>` ليس نصّاً للقارئ.
    expect(sanitizeHtml("<script>alert(1)</script>")).not.toContain("alert");
  });
});

describe("target=_blank يكتسب rel", () => {
  it("noopener noreferrer", () => {
    const out = sanitizeHtml('<a href="https://x.example" target="_blank">x</a>');
    expect(out).toContain('rel="noopener noreferrer"');
  });
});

describe("المدخلات الحدّية", () => {
  it("الفارغ", () => expect(sanitizeHtml("")).toBe(""));
  it("نصّ عارٍ يبقى", () => expect(sanitizeHtml("مرحبا")).toBe("مرحبا"));
  it("HTML مكسور لا يرمي", () => {
    expect(() => sanitizeHtml("<p>غير مغلق <div><span>")).not.toThrow();
  });
});
