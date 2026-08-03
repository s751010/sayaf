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

export type PatternId =
  | "sadu"
  | "mashrabiya"
  | "girih"
  | "palm"
  | "crescent"
  | "qatt"
  | "najma"
  | "none";

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
 * نسيج السدو النجدي — أشرطة معيّنات ومثلثات **متلاصقة** بخيوط فاصلة.
 * أشهر نمط بصري سعودي، ويقرأه الزبون فوراً بلا شرح.
 *
 * ⚠️ النسخة الأولى كانت معيّنات متباعدة ومثلثات متفرّقة، فتُقرأ **سهاماً** لا
 * نسيجاً — وقد ظهر هذا صارخاً على البطاقة المطبوعة حيث تكبر البلاطة. السدو
 * الحقيقي محكم النسج: الأشكال تتلامس عند رؤوسها فتُنتج سلسلة متّصلة، وتفصل
 * بينها **خيوط سداة** رفيعة. المسافة بين الأشكال هي ما كسر الإيحاء.
 */
function sadu(color: string, opacity: number): string {
  return wrap(
    64,
    `<g fill='${color}' fill-opacity='${opacity}'>
      <path d='M0 8 L8 0 L16 8 L8 16 Z M16 8 L24 0 L32 8 L24 16 Z
               M32 8 L40 0 L48 8 L40 16 Z M48 8 L56 0 L64 8 L56 16 Z'/>
      <path d='M0 19 h64 v2 H0 Z M0 24 h64 v1 H0 Z'/>
      <path d='M0 44 L8 28 L16 44 Z M16 28 L24 44 L32 28 Z
               M32 44 L40 28 L48 44 Z M48 28 L56 44 L64 28 Z'/>
      <path d='M0 47 h64 v1 H0 Z M0 51 h64 v2 H0 Z'/>
      <path d='M2 58 L8 52 L14 58 L8 64 Z M18 58 L24 52 L30 58 L24 64 Z
               M34 58 L40 52 L46 58 L40 64 Z M50 58 L56 52 L62 58 L56 64 Z'/>
     </g>`
  );
}

/**
 * القطّ العسيري — نقش نساء عسير على جدران البيوت، المدرَج في قائمة اليونسكو
 * للتراث الثقافي غير المادي (٢٠١٧).
 *
 * **إنشاء أصلي** بأشكال هندسية بسيطة تتبع بنية النقش الموصوفة في المراجع:
 * أشرطة أفقية متعاقبة، كل شريط بوحدة واحدة مكرّرة — مثلثات، ثم أعمدة قصيرة
 * («الأسنان»)، ثم صفّ نقاط. لم أجد بلاطة متكرّرة بترخيص CC0 تصلح (بحث
 * OpenClipart وWikimedia Commons عن «al-qatt» و«Asir painting» يعيد صوراً
 * فوتوغرافية بـCC BY-SA لا أنماطاً متجهة)، فأُنشئت من الصفر.
 */
function qatt(color: string, opacity: number): string {
  return wrap(
    56,
    `<g fill='${color}' fill-opacity='${opacity}'>
      <path d='M0 14 L7 2 L14 14 Z M14 14 L21 2 L28 14 Z
               M28 14 L35 2 L42 14 Z M42 14 L49 2 L56 14 Z'/>
      <path d='M0 17 h56 v2 H0 Z'/>
      <path d='M3 22 h4 v9 H3 Z M17 22 h4 v9 h-4 Z M31 22 h4 v9 h-4 Z M45 22 h4 v9 h-4 Z'/>
      <path d='M10 25 h4 v6 h-4 Z M24 25 h4 v6 h-4 Z M38 25 h4 v6 h-4 Z M52 25 h4 v6 h-4 Z'/>
      <path d='M0 34 h56 v2 H0 Z'/>
      <path d='M0 42 L7 54 L14 42 Z M14 42 L21 54 L28 42 Z
               M28 42 L35 54 L42 42 Z M42 42 L49 54 L56 42 Z'/>
     </g>`
  );
}

/**
 * نجمة ثمانية (نجمة سليمان) — مربّعان متراكبان أحدهما مُدار ٤٥°.
 *
 * **إنشاء أصلي**: البناء الهندسي للنجمة الثمانية عمره قرون وهو مِلكية عامة
 * بذاته، والرسم هنا مسارَا مربّعين بإحداثيات محسوبة على بلاطة ٦٤ — دون عتبة
 * الأصالة أصلاً، فلا حقوق عليه لأحد.
 */
function najma(color: string, opacity: number): string {
  /**
   * ⚠️ **ضلعا المربّعين متساويان أو لا تكون نجمة.**
   *
   * أول محاولة أعطت المربّع المُدار قطراً ٥٨ (ضلع ٤١) والمربّع القائم ضلعاً
   * ٤٥٫٣ — فخرج شكل مائل لا نجمة منتظمة: رؤوس أطول من رؤوس. الضلع واحد هنا
   * (`S`)، فيُشتقّ نصف القطر منه بـ`S·√2/2` لا العكس.
   */
  const S = 44;
  const half = S / 2; //           المربّع القائم: 32 ± 22
  const diag = (S * Math.SQRT2) / 2; // المُدار: 32 ± 31.1 (يتجاوز البلاطة قليلاً
  //                                   فتتّصل رؤوسه برؤوس البلاطة المجاورة)
  const r = (n: number) => Math.round(n * 100) / 100;
  return wrap(
    64,
    `<g stroke='${color}' stroke-opacity='${opacity}' stroke-width='1.4' fill='none'
        stroke-linejoin='miter'>
      <path d='M${32 - half} ${32 - half} H${32 + half} V${32 + half} H${32 - half} Z'/>
      <path d='M32 ${r(32 - diag)} L${r(32 + diag)} 32 L32 ${r(32 + diag)} L${r(32 - diag)} 32 Z'/>
      <circle cx='32' cy='32' r='5'/>
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
  qatt,
  najma,
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
  sadu: "64px 64px",
  mashrabiya: "48px 48px",
  girih: "96px 96px",
  palm: "72px 72px",
  crescent: "72px 72px",
  qatt: "56px 56px",
  najma: "64px 64px",
  none: "auto",
};

/**
 * مقاس البلاطة **بالمليمتر** — للطباعة لا للشاشة.
 *
 * البطاقة كانت تكرّر الزخرفة ببلاطة = ٢٢٪ من عرضها ≈ ٢٦مم، فتخرج كتلاً كبيرة
 * لا نسيجاً (بدا السدو على الستاند المثلث كأسهم عملاقة). النسيج يُقرأ نسيجاً
 * عند مقاس فيزيائي ثابت مهما كبرت الورقة — تماماً كقماش حقيقي: بلاطته لا تكبر
 * لأن الثوب كبر.
 */
export const PATTERN_MM: Record<PatternId, number> = {
  sadu: 12,
  mashrabiya: 10,
  girih: 20,
  palm: 16,
  crescent: 16,
  qatt: 11,
  najma: 14,
  none: 0,
};
