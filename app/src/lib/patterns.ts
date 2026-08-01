/**
 * زخارف المنيو — SVG داخل الكود، لا صور ولا CDN.
 *
 * لماذا داخل الكود لا ملفات: الزخرفة تأخذ لون الطابع (أو لون علامة التاجر)
 * فتتناغم معه بدل أن تكون صورة ثابتة بلون واحد. وتصل كـdata-URI داخل الـCSS فلا
 * طلب شبكة إضافي على أهم صفحة في المنتج، وتعمل أوفلاين مع الـservice worker.
 *
 * ═══ مصادر الزخارف ورخصها ═══
 *
 * `girih` مُشتقّة من ملف **CC0** (مِلكية عامة) من OpenClipart:
 *   «tile pattern» — https://openclipart.org/detail/223246/tile-pattern
 *   استُخرجت منه بلاطة التكرار (354.33×354.33) وأُعيد تأسيس إحداثياتها على
 *   أصل البلاطة. OpenClipart تنشر كل محتواها تحت CC0 فلا يلزم إسناد — والإسناد
 *   هنا للأمانة لا للالتزام.
 *
 * `sadu` · `mashrabiya` · `palm` · `crescent`: **إنشاء أصلي** بأشكال هندسية
 * بسيطة تتبع المراجع التراثية الموصوفة فوق كل دالة. بحثتُ عن مصادر مِلكية عامة
 * صالحة في OpenClipart وWikimedia Commons وfreesvg فلم أجد بلاطات متكرّرة
 * تصلح: أغلب ما في Commons تحت CC BY-SA (رخصة عدوى لا تناسب منتجاً تجارياً
 * مغلقاً)، وبحث «mashrabiya lattice» في OpenClipart يعيد صفراً. أذكر هذا
 * صراحةً بدل ادّعاء مصدر غير موجود.
 *
 * ملاحظة على الحقوق: الأنماط التراثية نفسها (السدو، الجيري، المشربية) مِلكية
 * عامة بذاتها لقِدَمها، والأشكال الهندسية البسيطة دون عتبة الأصالة أصلاً —
 * فالاستعمال التجاري لكل ما هنا سليم.
 */

export type PatternId = "sadu" | "mashrabiya" | "girih" | "palm" | "crescent" | "none";

/**
 * SVG → قيمة `background-image`.
 *
 * ⚠️ الترميز هنا ليس تجميلاً:
 * - `#` في قيم الألوان يجب أن يصير `%23` وإلا اعتبره المتصفح بداية fragment
 *   فينكسر الـdata-URI ولا تظهر الزخرفة إطلاقاً.
 * - علامتا الاقتباس والمسافات يجب أن تُرمَّزا أيضاً: القيمة قد تُوضع داخل
 *   خاصية `style="…"` في HTML، فاقتباس واحد غير مرمَّز يُنهي الخاصية ويُفرِّغ
 *   الصورة (`url("")`). الترميز الكامل يجعلها تعمل في كائن style وفي HTML معاً.
 */
function svgUrl(svg: string): string {
  const encoded = svg
    .replace(/\s+/g, " ")
    .trim()
    .replace(/%/g, "%25")
    .replace(/#/g, "%23")
    .replace(/</g, "%3C")
    .replace(/>/g, "%3E")
    .replace(/&/g, "%26")
    .replace(/"/g, "%22")
    .replace(/'/g, "%27")
    .replace(/ /g, "%20");
  // اقتباس مفرد للغلاف: المحتوى بالداخل لم يعد يحمل أي اقتباس بعد الترميز،
  // فتبقى القيمة صالحة داخل `style="…"` في HTML وداخل كائن style في React معاً.
  return `url('data:image/svg+xml,${encoded}')`;
}

function wrap(size: number, body: string): string {
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`
  );
}

/**
 * نسيج السدو النجدي — أشرطة معيّنات ومثلثات متعاقبة.
 * أشهر نمط بصري سعودي، ويقرأه الزبون فوراً بلا شرح.
 */
function sadu(color: string, opacity: number): string {
  return wrap(
    60,
    `<g fill='${color}' fill-opacity='${opacity}'>
      <path d='M0 8 L10 0 L20 8 L10 16 Z'/>
      <path d='M20 8 L30 0 L40 8 L30 16 Z'/>
      <path d='M40 8 L50 0 L60 8 L50 16 Z'/>
      <path d='M0 30 h60 v3 H0 Z'/>
      <path d='M0 44 L10 52 L0 60 Z'/>
      <path d='M20 44 L30 52 L20 60 Z'/>
      <path d='M40 44 L50 52 L40 60 Z'/>
      <path d='M10 44 h10 v2 H10 Z M30 44 h10 v2 H30 Z M50 44 h10 v2 H50 Z'/>
     </g>`
  );
}

/** شبكة الرواشين الخشبية الحجازية — مربّعات مائلة متداخلة. */
function mashrabiya(color: string, opacity: number): string {
  return wrap(
    48,
    `<g stroke='${color}' stroke-opacity='${opacity}' stroke-width='1.2' fill='none'>
      <path d='M24 0 L48 24 L24 48 L0 24 Z'/>
      <path d='M24 12 L36 24 L24 36 L12 24 Z'/>
      <path d='M0 0 L12 12 M48 0 L36 12 M0 48 L12 36 M48 48 L36 36'/>
     </g>`
  );
}

/**
 * تشابك هندسي إسلامي (جيري) — **مشتقّ من ملف CC0**.
 *
 * المصدر: «tile pattern» — https://openclipart.org/detail/223246/tile-pattern
 * الرخصة: CC0 1.0 (مِلكية عامة) — سياسة OpenClipart لكل محتواها.
 *
 * ما فعلتُه بالملف: الأصل لوحة كاملة لا بلاطة. قِستُ صناديق مساراته فوجدتُ أن
 * ثمانية منها تشكّل بلاطة تكرار مربّعة ضلعها 354.33، فاستخرجتُها وأعدتُ تأسيس
 * إحداثياتها على أصل البلاطة (0,0) وتحقّقتُ بصرياً أنها تتلاقى عند الحواف بلا
 * فاصل. الأشرطة الثمانية تلتقي في وسط البلاطة وأركانها فتُنتج نجمة ثمانية
 * متّصلة عبر التكرار — وهو البناء الأصلي للجيري لا شكلاً يحاكيه.
 *
 * `stroke-width` هنا بمقياس البلاطة (354) لا بالبكسل: البلاطة تُعرض عند
 * `PATTERN_SIZE` (96px) فتُقسَم على ~3.7، و7 وحدات تعطي ~1.9px مرئية.
 */
function girih(color: string, opacity: number): string {
  return wrap(
    354.33,
    `<g stroke='${color}' stroke-opacity='${opacity}' stroke-width='7' fill='none'
        stroke-linecap='square' stroke-linejoin='miter'>
      <path d='m 0,177.17 21.49,-51.89 134.18,0 94.88,-94.88 103.78,42.99'/>
      <path d='m 354.33,177.17 -21.49,-51.89 -134.18,0 -94.88,-94.88 -103.78,42.99'/>
      <path d='m 0,177.17 21.49,51.89 134.18,0 94.88,94.88 103.78,-42.99'/>
      <path d='m 354.33,177.17 -21.49,51.89 -134.18,0 -94.88,94.88 -103.78,-42.99'/>
      <path d='m 177.17,0 51.89,21.49 0,134.18 94.88,94.88 -42.99,103.78'/>
      <path d='m 177.17,354.33 51.89,-21.49 0,-134.18 94.88,-94.88 -42.99,-103.78'/>
      <path d='m 177.17,0 -51.89,21.49 0,134.18 -94.88,94.88 42.99,103.78'/>
      <path d='m 177.17,354.33 -51.89,-21.49 0,-134.18 -94.88,-94.88 42.99,-103.78'/>
     </g>`
  );
}

/**
 * نخلة — لطبقة اليوم الوطني ويوم التأسيس.
 * السعف يخرج من القمة ويتقوّس **للخارج ثم للأسفل** كنخلة حقيقية؛ السعف
 * المستقيم المائل للأعلى يخرج شبيهاً بسنبلة قمح لا بنخلة.
 */
function palm(color: string, opacity: number): string {
  return wrap(
    72,
    `<g stroke='${color}' stroke-opacity='${opacity}' stroke-width='1.5' fill='none' stroke-linecap='round'>
      <path d='M36 66 C35 52 35 40 36 26'/>
      <path d='M36 27 C28 17 18 14 8 16 C16 22 26 26 36 27'/>
      <path d='M36 27 C44 17 54 14 64 16 C56 22 46 26 36 27'/>
      <path d='M36 29 C30 22 20 20 12 24 C20 28 28 30 36 29'/>
      <path d='M36 29 C42 22 52 20 60 24 C52 28 44 30 36 29'/>
      <path d='M36 26 C33 18 34 10 36 5 C38 10 39 18 36 26'/>
     </g>`
  );
}

/**
 * أهلّة وفوانيس — لطبقة رمضان.
 * الهلال دائرتان متداخلتان بقاعدة `evenodd`: الثانية تُحدث الثقب. رسمه بقوسين
 * متتاليين في مسار واحد يخرج شكلاً مصمتاً لا هلالاً.
 */
function crescent(color: string, opacity: number): string {
  return wrap(
    72,
    `<g fill='${color}' fill-opacity='${opacity}' fill-rule='evenodd'>
      <path d='M22 6 a12 12 0 1 0 0 24 a12 12 0 1 0 0 -24 Z
               M27 8 a10 10 0 1 0 0 20 a10 10 0 1 0 0 -20 Z'/>
      <path d='M54 42 a9 9 0 1 0 0 18 a9 9 0 1 0 0 -18 Z
               M58 44 a7.5 7.5 0 1 0 0 15 a7.5 7.5 0 1 0 0 -15 Z'/>
     </g>
     <g stroke='${color}' stroke-opacity='${opacity}' stroke-width='1.2' fill='none' stroke-linejoin='round'>
      <path d='M52 6 h8 M56 6 v4 M50 10 h12 l-2 14 h-8 Z M52 28 h8'/>
      <path d='M14 44 h8 M18 44 v4 M12 48 h12 l-2 12 h-8 Z M14 62 h8'/>
     </g>`
  );
}

const BUILDERS: Record<Exclude<PatternId, "none">, (c: string, o: number) => string> = {
  sadu,
  mashrabiya,
  girih,
  palm,
  crescent,
};

/**
 * قيمة `background-image` للزخرفة، أو `"none"`.
 * `opacity` تُحقن داخل الـSVG نفسه لا على العنصر، كي لا تُخفت المحتوى فوقها.
 */
export function patternImage(id: PatternId, color: string, opacity = 0.06): string {
  if (id === "none") return "none";
  return BUILDERS[id](color, Math.min(1, Math.max(0, opacity)));
}

/** مقاس تكرار الزخرفة — يُضبط مع `background-size` كي لا تتمدّد على الشاشات العريضة. */
export const PATTERN_SIZE: Record<PatternId, string> = {
  sadu: "60px 60px",
  mashrabiya: "48px 48px",
  girih: "96px 96px",
  palm: "72px 72px",
  crescent: "72px 72px",
  none: "auto",
};
