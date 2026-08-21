/**
 * لا خطّاف تحت عودة مبكّرة — **الفحص الذي كان غيابه يُطفئ المنيو**.
 *
 * ═══ العطل ═══
 *
 * `MenuPage` تعود مبكّراً في `loading` و`unpublished` و`notfound`. وهبطت
 * ثلاثة خطّافات تحت تلك العوائد لإرضاء `tsc` — كانت تقرأ `restaurant` قبل
 * تعريفه، فبدا النقل تحتها إصلاحاً. ورضي المترجم فعلاً.
 *
 * لكن React يعدّ الخطّافات: رسمة التحميل تشغّل عدداً، والرسمة الجاهزة
 * تشغّل ثلاثة أكثر ⇒ **React #310** وشاشة «واجهت الصفحة مشكلة» على **كل
 * منيو** لحظة وصول البيانات. أهمّ صفحة في المنتج لا تفتح.
 *
 * ولم يمسكه شيء: `tsc` يرى النوع لا الترتيب، وبقيّة الفحوص لا ترسم، والبناء
 * ينجح، والصفحة تُرسَم صحيحةً حتى تصل الشبكة. لا يظهر إلا في متصفّح.
 *
 * ═══ لماذا ماسح أقواس لا تعبير نمطي ═══
 *
 * أول محاولة اشترطت عودةً بمسافتين بادئتين، والعودة الحقيقية داخل `if`
 * بأربع — فمرّت النسخة المعطوبة خضراء. والتساهل الآخر (أي عودة بأي إزاحة)
 * كان يشعل كل `if (!x) return;` داخل `useEffect`، وهي في كل ملفّ.
 *
 * فالتمييز يحتاج عمقاً حقيقياً: عودةٌ في **جسم المكوّن** تُحسب، وعودةٌ داخل
 * دالة مُمرَّرة لا تُحسب. والقوس يفتح دالةً ممرَّرة إن سبقه `=>` مباشرة أو
 * `function` — لا إن وُجدا في السطر: `const { a } = useMemo(() => {` فيه
 * قوسا تفكيك قبل السهم، وهما كتلة لا دالة.
 *
 * ⚠️ **الماسح مُثبَت على الطرفين**: يرصد النسخة المعطوبة (سطرا ٦١٥ و٦٢٣)
 * وينظّف المُصلَحة. فحصٌ يمرّ على العطل الذي وُلد له زينةٌ لا حارس.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}${e.name}`;
    if (e.isDirectory()) out.push(...tsxFiles(`${full}/`));
    else if (e.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function findLateHooks(src: string) {
  const lines = src.split("\n");
  const bad: { line: number; text: string; after: number }[] = [];
  let stack: { callback: boolean }[] = [];            // إطارات الأقواس: {callback:boolean}
  let earlyReturn = 0;       // سطر أول عودة في جسم المكوّن (لا في دالة ممرَّرة)
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // تعرية التعليقات والنصوص حتى لا تُعدّ أقواسها.
    let code = "";
    for (let j = 0; j < line.length; j++) {
      if (inBlockComment) {
        if (line[j] === "*" && line[j + 1] === "/") { inBlockComment = false; j++; }
        continue;
      }
      if (line[j] === "/" && line[j + 1] === "*") { inBlockComment = true; j++; continue; }
      if (line[j] === "/" && line[j + 1] === "/") break;
      if (line[j] === '"' || line[j] === "'" || line[j] === "`") {
        const q = line[j];
        j++;
        while (j < line.length && line[j] !== q) { if (line[j] === "\\") j++; j++; }
        continue;
      }
      code += line[j];
    }
    if (!code.trim()) continue;

    const depthBefore = stack.length;

    // عودة في جسم المكوّن: العمق ≥١ وما فوق إطار المكوّن كتلٌ لا دوال ممرَّرة.
    if (/(^|[\s{(;])return([\s(;]|$)/.test(code) && depthBefore >= 1) {
      const insideCallback = stack.slice(1).some((f) => f.callback);
      if (!insideCallback && !earlyReturn) earlyReturn = i + 1;
    }

    // خطّاف على المستوى الأعلى من جسم المكوّن (عمق ١ بالضبط).
    if (depthBefore === 1 && /^\s*(?:const\s*(?:\[[^\]]*\]|[\w{}\s,:]+)\s*=\s*)?use[A-Z]\w*\s*\(/.test(code)) {
      if (earlyReturn) bad.push({ line: i + 1, text: line.trim().slice(0, 64), after: earlyReturn });
    }

    // تحديث المكدّس. القوس يفتح **دالة ممرَّرة** إن سبقه `=>` مباشرة أو
    // كلمة `function` بلا قوس بينهما — لا مجرّد وجودهما في السطر: سطرٌ مثل
    // `const { a, b } = useMemo(() => {` فيه قوسا تفكيك قبل السهم.
    for (let j = 0; j < code.length; j++) {
      if (code[j] === "{") {
        const prefix = code.slice(0, j).trimEnd();
        const callback = prefix.endsWith("=>") || /\bfunction\b[^{}]*$/.test(prefix);
        stack.push({ callback });
      } else if (code[j] === "}") {
        stack.pop();
        if (stack.length === 0) earlyReturn = 0;  // انتهى المكوّن
      }
    }
  }
  return bad;
}

describe("لا خطّاف تحت عودة مبكّرة", () => {
  const files = tsxFiles(SRC);

  it("تُفحص ملفّات فعلية — لا مجموعة فارغة تمرّ", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  /** الماسح يرصد الشكل الذي أطفأ المنيو فعلاً — وإلا فالفحص زينة. */
  it("الماسح يرصد الشكل المعطوب", () => {
    const broken = [
      "export default function Page() {",
      '  const [a, setA] = useState(0);',
      '  if (!a) {',
      "    return <div />;",
      "  }",
      "  const b = useMemo(() => 1, []);",
      "  return <div>{b}</div>;",
      "}",
    ].join("\n");
    expect(findLateHooks(broken)).toHaveLength(1);
  });

  /** ولا يشعل النمط الشائع: عودة حارسة **داخل** دالة ممرَّرة. */
  it("لا يشعل العودة داخل دالة ممرَّرة", () => {
    const fine = [
      "export default function Page() {",
      "  useEffect(() => {",
      "    if (!x) return;",
      "    go();",
      "  }, [x]);",
      "  const b = useMemo(() => 1, []);",
      "  return <div>{b}</div>;",
      "}",
    ].join("\n");
    expect(findLateHooks(fine)).toEqual([]);
  });

  it.each(files.map((f) => [f.slice(SRC.length), f] as const))("%s", (_label, file) => {
    const bad = findLateHooks(readFileSync(file, "utf8"));
    const report = bad.map((b) => `  سطر ${b.line}: ${b.text}  (بعد عودة ${b.after})`).join("\n");
    expect(bad, `خطّاف تحت عودة مبكّرة ⇒ React #310:\n${report}`).toEqual([]);
  });
});
