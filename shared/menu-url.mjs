/**
 * عنوان المنيو العام — **مصدر واحد** تقرؤه الواجهة ودالة الحافة وسكربت خريطة
 * الموقع والاختبارات.
 *
 * ═══ لماذا وُجد ═══
 *
 * كان الرابط يُبنى في **عشرة مواضع**، ثمانية منها من `window.location.origin`
 * واثنان من `SITE_URL`. و`location.origin` هو **مضيف اللوحة لا مضيف المنيو**:
 * المؤسّس يفتح اللوحة من نطاق والتاجر من آخر، والكود المطبوع يحمل أيّهما
 * صادف. ⚠️ وبطاقات الكاشير تُصدَّر ٣٠٠ DPI و**تُطبع على طاولات** — فرابطٌ
 * خاطئ فيها خسارةٌ مادية لا يعيدها تراجُع في git.
 *
 * ═══ ⚠️ الثابتان أدناه هما كل ما يتغيّر يوم يجهز النطاق ═══
 *
 * `cloudmenu.sa` **لم يُشترَ بعد** (مُتحقَّق: لا يُحلّ في DNS). ولا يجوز أن
 * يُكتب نطاقٌ لا يُحلّ داخل كود QR يطبعه تاجر على مئة طاولة. فالوضعان مبنيّان
 * ومفحوصان **الآن** معاً، ويبقى التحويل سطرين.
 */

/**
 * النطاق الذي يُعرض ويُطبع — و**`null` يعني تلقائياً**: هو ما فُتح عليه
 * الموقع فعلاً.
 *
 * ═══ ⚠️ لماذا `null` وليس نطاقاً مكتوباً ═══
 *
 * كُتب هنا `"cloudsmenu.netlify.app"` مرّةً، فصار كل رابط يُبنى منه **بغضّ
 * النظر عن المضيف الذي وصل عليه الطلب**. ومقيسٌ على البناء: صفحة المنيو تفتح
 * على أي مضيف، لكن `canonical` و`og:url` — و**كود QR في بطاقة تُطبع** — تخرج
 * كلها بالنطاق المكتوب. أي أن توجيه نطاق جديد إلى الموقع كان سيترك كل مطبوع
 * يشير إلى القديم حتى يعدّل أحدٌ هذا السطر.
 *
 * فالتلقائي هو الافتراض: انشر على ما شئت ويعمل. وكتابةُ النطاق قرارٌ يُتَّخذ
 * **بعد** ربطه فعلاً، لا قبله.
 *
 * ⟵ اكتبه (`"cloudmenu.sa"`) يوم يُربَط، فتنتقل المواضع كلها معاً.
 */
export const MENU_DOMAIN = null;

/**
 * `"subdomain"` ⇒ `aldiwan.cloudmenu.sa` · `"path"` ⇒ `cloudmenu.sa/aldiwan`.
 *
 * ⚠️ **لا يعمل إلا مع `MENU_DOMAIN` مكتوب**: بلا نطاق أساس لا يمكن معرفة أي
 * جزء من المضيف هو الـslug — ولا يجوز التخمين. فيبقى `"path"` حتى ذلك اليوم.
 *
 * ⟵ يصير `"subdomain"` بعد كتابة النطاق **و**إضافة بدل عامّ `*` في DNS
 * وشهادة wildcard. وقبلهما يعطي نطاقاً فرعياً لا يُحلّ.
 */
export const MENU_MODE = "path";

/** هل النطاق الفرعي مُفعَّل فعلاً؟ الوضع وحده لا يكفي — يحتاج نطاقاً أساساً. */
const subdomainMode = () => MENU_MODE === "subdomain" && !!MENU_DOMAIN;

/**
 * أصل الموقع وقت النداء.
 *
 * الترتيب: النطاق المكتوب إن وُجد ⇐ ثم المضيف الحقيقي في المتصفّح ⇐ ثم
 * `fallback` لمن يعمل بلا متصفّح (سكربت الخريطة ودالة الحافة يمرّرانه).
 */
function resolveOrigin(fallback) {
  if (MENU_DOMAIN) return `https://${MENU_DOMAIN}`;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return String(fallback ?? "").replace(/\/+$/, "");
}

/** المضيف وحده (بلا مخطّط) — لعرضه في حقل اختيار الرابط. */
function resolveHost(fallback) {
  return resolveOrigin(fallback).replace(/^https?:\/\//, "");
}

/**
 * ⚠️ **وضع المسار يبقى للأبد** ولا يُحذف يوم التحويل: تسعة عشر رابطاً في
 * الإنتاج عربية (`مشراق-0e94`) و**لا تصلح نطاقاً فرعياً** — تسمية DNS لا تقبل
 * إلا `a-z0-9-`. فهما وضعان متعايشان لا مرحلتان.
 */

/** مسارات التطبيق — مطعم يحملها صفحته غير قابلة للوصول (الراوتر أسبق). */
export const RESERVED_PATHS = new Set([
  "demo", "help", "about", "blog", "login", "dashboard", "founder",
  "stamp", "reset-password", "docs", "privacy", "terms", "assets",
]);

/**
 * نطاقات فرعية محجوزة للبنية التحتية — لا يجوز أن يأخذها تاجر.
 * `www` خصوصاً: أخذُها يعني أن `www.cloudmenu.sa` يفتح منيو مطعم.
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "mail", "smtp", "imap", "pop", "ftp", "ns", "ns1", "ns2",
  "cdn", "static", "assets", "admin", "dashboard", "founder", "status",
  "blog", "help", "docs", "demo", "support", "cpanel", "webmail", "test",
  "staging", "dev", "beta", "m", "go", "link", "qr",
]);

/** كل ما لا يجوز أن يكون رابط مطعم، في أي وضع. */
export const RESERVED = new Set([...RESERVED_PATHS, ...RESERVED_SUBDOMAINS]);

/** الحدّان — من قيود تسمية DNS لا من ذوق. */
export const SLUG_MIN = 3;
export const SLUG_MAX = 32;

/**
 * ⚠️ **القاعدة هي قاعدة تسمية DNS حرفياً**: حروف لاتينية صغيرة وأرقام وشرطة،
 * ولا شرطة في الطرفين. ليست تضييقاً تعسّفياً — ما لا يصلح تسمية DNS لا يصلح
 * نطاقاً فرعياً. وزيادةً على ذلك: الرابط العربي يُرمَّز في شريط العنوان إلى
 * `%D9%85%D8%B4…`، فلا يستطيع التاجر إملاءه على الهاتف ولا كتابته على لوحة.
 */
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** أرقام عربية-هندية للنصّ المعروض — بقيّة واجهة المنتج عليها. */
const ar = (n) => String(n).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);

/** رسالة الخطأ بالعربية، أو `null` إن كان الرابط صالحاً. */
export function slugError(value) {
  const v = String(value ?? "").trim();
  if (!v) return "اكتب رابط منيوك.";
  if (v.length < SLUG_MIN) return `الرابط قصير — ${ar(SLUG_MIN)} أحرف على الأقل.`;
  if (v.length > SLUG_MAX) return `الرابط طويل — ${ar(SLUG_MAX)} حرفاً كحدّ أقصى.`;
  if (/[A-Z]/.test(v)) return "بحروف صغيرة فقط (العناوين لا تفرّق بين الحالتين).";
  if (/[؀-ۿ]/.test(v))
    return "بحروف إنجليزية وأرقام — الرابط العربي يظهر مرمّزاً ولا يمكن إملاؤه على الهاتف.";
  if (/^-|-$/.test(v)) return "لا يبدأ ولا ينتهي بشرطة.";
  if (v.includes("--")) return "لا شرطتين متتاليتين.";
  if (!SLUG_RE.test(v)) return "حروف إنجليزية صغيرة وأرقام وشرطة فقط.";
  if (RESERVED.has(v)) return "هذا الاسم محجوز — اختر غيره.";
  return null;
}

export function isValidSlug(value) {
  return slugError(value) === null;
}

/** أصل الموقع (اللوحة والصفحات) — لا يتغيّر بوضع الرابط. */
export function siteOrigin(fallback) {
  return resolveOrigin(fallback);
}

/**
 * عنوان منيو مطعم — **المصدر الوحيد**. لا تبنِ الرابط بيدك في صفحة.
 *
 * `extra` لمعاملات مثل `?table=5` أو `?preview=1`.
 */
export function menuUrl(slug, extra = "", origin) {
  const s = String(slug ?? "").trim();
  if (!s) return null;
  const q = extra ? (extra.startsWith("?") ? extra : `?${extra}`) : "";
  const base = resolveOrigin(origin);

  // ⚠️ الرابط العربي القديم يبقى على المسار حتى في وضع النطاق الفرعي:
  // لا يصلح تسمية DNS، ووضعه في نطاق فرعي يعطي عنواناً لا يُحلّ.
  if (subdomainMode() && isValidSlug(s)) {
    return `https://${s}.${MENU_DOMAIN}${q}`;
  }
  return `${base}/${encodeURIComponent(s)}${q}`;
}

/**
 * ما يُعرض **قبل** خانة الكتابة وما يُعرض **بعدها** في حقل اختيار الرابط.
 *
 * ⚠️ مشتقّ من `MENU_MODE` لا مكتوب في الصفحة: في وضع النطاق الفرعي يأتي
 * النطاق **بعد** ما يكتبه التاجر (`aldiwan` `.cloudmenu.sa`)، وفي وضع المسار
 * يأتي **قبله** (`cloudmenu.sa/` `aldiwan`). ولاحقةٌ مكتوبة بيد في الصفحة
 * كانت ستكذب على التاجر في أحد الوضعين — وهو يقرأ منها ما سيُطبع على طاولاته.
 */
export function urlAffixes(origin) {
  return subdomainMode()
    ? { before: "", after: `.${MENU_DOMAIN}` }
    : { before: `${resolveHost(origin)}/`, after: "" };
}

/**
 * العكس: يستخرج الـslug من طلب وارد — من المضيف أو من المسار.
 *
 * تقرؤها `MenuPage` في المتصفّح ودالة الحافة على الخادم، فيبقى فهم «ما هو
 * منيو» واحداً في الطرفين.
 */
export function slugFromRequest(host, pathname) {
  const h = String(host ?? "").toLowerCase().split(":")[0];

  /**
   * ١) نطاق فرعي: `aldiwan.cloudmenu.sa`
   *
   * ⚠️ **يُتخطّى تماماً بلا نطاق أساس مكتوب.** بدونه لا يمكن معرفة أي جزء من
   * المضيف هو الـslug: أهو `aldiwan` في `aldiwan.example.com`، أم أن المضيف
   * كلّه نطاق الموقع؟ والتخمين هنا يعني عرض منيو مطعم على عنوان ليس له.
   */
  if (MENU_DOMAIN && h.endsWith(`.${MENU_DOMAIN}`)) {
    const label = h.slice(0, -(MENU_DOMAIN.length + 1));
    // نطاق فرعي من مستويين (`a.b.cloudmenu.sa`) ليس منيواً.
    if (label && !label.includes(".") && !RESERVED.has(label) && isValidSlug(label)) {
      return label;
    }
    return null;
  }

  // ٢) مسار: `/aldiwan` — ويبقى عاملاً في الوضعين للروابط القديمة.
  const parts = decodeURIComponent(String(pathname ?? "")).split("/").filter(Boolean);
  if (parts.length !== 1) return null;
  const slug = parts[0];
  if (RESERVED.has(slug.toLowerCase())) return null;
  // نقطة في المقطع تعني ملفّاً (`og.png` · `sw.js`) لا slug.
  if (slug.includes(".")) return null;
  return slug;
}
