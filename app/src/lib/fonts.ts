/**
 * خطوط الطوابع — تُحمَّل عند الطلب لا مع كل زيارة.
 *
 * ═══ لماذا ═══
 *
 * `main.tsx` كان يستورد أربع عائلات عربية لكل زائر: أميري (١٠٠ك للعربية وحدها)
 * وريم كوفي وطجوال وكايرو. وأكثر ما يُفتح في هذا المنتج **صفحة المنيو** من كود
 * QR على بيانات جوال داخل مطعم — فكل عائلة لا يستعملها طابع ذلك المطعم بايتات
 * يدفعها زبون التاجر بلا مقابل. ومع كل طابع جديد يكبر الحمل على الجميع.
 *
 * الآن: **كايرو وطجوال وحدهما ثابتان** (واجهة التطبيق كلها مبنيّة عليهما، من
 * اللاندنق إلى اللوحة)، وكل ما عداهما يُحمَّل حين يطلبه طابع فعلاً.
 *
 * ═══ لماذا `@fontsource/x/400.css` لا `arabic-400.css` ═══
 *
 * الملف الكامل يعرّف `@font-face` لكل مجموعة محارف بـ`unicode-range` خاصّ بها،
 * والمتصفح لا ينزّل إلا المجموعات التي تظهر على الصفحة فعلاً. فاستيراد المجموعة
 * العربية وحدها لا يوفّر شيئاً ويكسر الأرقام اللاتينية في الأسعار
 * («189 ر.س») وواجهة اللغة الإنجليزية.
 *
 * ═══ الوصل مع بطاقات الكاشير ═══
 *
 * `renderCard` ينتظر `document.fonts.ready`، وهي **تُرضى فوراً** إن لم يُطلب
 * الخطّ أصلاً — فتُرسم البطاقة بالخطّ الاحتياطي بصمت والمعاينة على الشاشة تبدو
 * سليمة. لذلك على كل من يرسم بخطّ طابع أن ينادي `loadThemeFont` أولاً.
 */

/** أسماء العائلات كما تُكتب في `font-family` — تُستعمل مع `document.fonts.check`. */
const FAMILY: Record<string, string> = {
  "--font-cairo": "Cairo Variable",
  "--font-tajawal": "Tajawal",
  "--font-reem": "Reem Kufi",
  "--font-amiri": "Amiri",
  "--font-noto-kufi": "Noto Kufi Arabic",
  "--font-almarai": "Almarai",
  "--font-ruqaa": "Aref Ruqaa",
};

/**
 * محمَّلات الخطوط غير الثابتة.
 *
 * المسارات حرفية عمداً: Vite يحلّل `import()` ساكناً، فمسارٌ مبنيّ من متغيّر
 * (`import(\`@fontsource/${name}/400.css\`)`) لا يُحزَّم إطلاقاً ويفشل وقت
 * التشغيل. كلٌّ هنا يصير قطعة CSS مستقلّة.
 */
const LOADERS: Record<string, () => Promise<unknown>> = {
  "--font-reem": () =>
    Promise.all([
      import("@fontsource/reem-kufi/400.css"),
      import("@fontsource/reem-kufi/600.css"),
      import("@fontsource/reem-kufi/700.css"),
    ]),
  "--font-amiri": () =>
    Promise.all([import("@fontsource/amiri/400.css"), import("@fontsource/amiri/700.css")]),
  "--font-noto-kufi": () =>
    Promise.all([
      import("@fontsource/noto-kufi-arabic/400.css"),
      import("@fontsource/noto-kufi-arabic/600.css"),
      import("@fontsource/noto-kufi-arabic/800.css"),
    ]),
  "--font-almarai": () =>
    Promise.all([
      import("@fontsource/almarai/300.css"),
      import("@fontsource/almarai/400.css"),
      import("@fontsource/almarai/700.css"),
      import("@fontsource/almarai/800.css"),
    ]),
  "--font-ruqaa": () =>
    Promise.all([import("@fontsource/aref-ruqaa/400.css"), import("@fontsource/aref-ruqaa/700.css")]),
};

/** ما بدأ تحميله — النداء الثاني ينتظر الأول ولا يبدأ تحميلاً ثانياً. */
const started = new Map<string, Promise<void>>();

/** يستخرج اسم المتغيّر من `var(--font-x)`؛ ويقبل الاسم مجرّداً أيضاً. */
function varNameOf(value: string): string | null {
  const m = /var\((--[a-z0-9-]+)\)/i.exec(value);
  if (m) return m[1];
  return value.startsWith("--") ? value : null;
}

/** اسم العائلة الأول في مكدّس الخطوط — لفحص `document.fonts.check`. */
export function familyOf(value: string | undefined | null): string | null {
  if (!value) return null;
  const name = varNameOf(value);
  if (name) return FAMILY[name] ?? null;
  const first = value.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
  return first || null;
}

/**
 * يضمن جاهزية خطّ الطابع.
 *
 * لا يرمي أبداً: خطّ لم يُحمَّل يعني منيو بخطّ احتياطي — وهذا أهون بكثير من
 * صفحة منيو بيضاء أو زرّ تنزيل بطاقة معطّل.
 */
export async function loadThemeFont(value: string | undefined | null): Promise<void> {
  if (!value) return;
  const name = varNameOf(value);
  if (!name) return;
  const load = LOADERS[name];
  if (!load) return; // كايرو وطجوال — ثابتان في `main.tsx`.

  let pending = started.get(name);
  if (!pending) {
    pending = load().then(
      () => undefined,
      () => undefined
    );
    started.set(name, pending);
  }
  await pending;

  // حقن الـCSS لا يعني تنزيل الملف: المتصفح كسول حتى يُطلب المحرف. `fonts.load`
  // يجبره، وبدونها يرسم canvas بخطّ احتياطي رغم أن `@font-face` موجود.
  const family = FAMILY[name];
  if (family && document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`400 16px "${family}"`, "بسم"),
      document.fonts.load(`700 16px "${family}"`, "بسم"),
    ]).catch(() => undefined);
  }
}
