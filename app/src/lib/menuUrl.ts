/**
 * واجهة مُنمَّطة لـ`shared/menu-url.mjs`.
 *
 * ═══ لماذا وسيطٌ بدل استيراد الملفّ المشترك مباشرة ═══
 *
 * الملفّ المشترك **جافاسكربت خالص** لأن Deno على حافة Netlify يقرؤه كما هو،
 * وسكربت خريطة الموقع كذلك، وVitest يستورد الطرفين. فلو كُتب TypeScript
 * لاحتاج بناءً قبل أن تراه الحافة.
 *
 * وهذا الملفّ يعطي الواجهة الأنواع، ويجعل الصفحات تستورد `@/lib/menuUrl`
 * كبقيّة المكتبة بدل مسار نسبيّ يخرج من `app/`.
 *
 * ⚠️ **لا منطق هنا** — إعادة تصدير فقط. أي شرط يُكتب هنا لن تراه الحافة،
 * فيتباعد ما يعرضه المتصفّح عمّا يحقنه الخادم.
 */
// @ts-expect-error — وحدة JS خالصة بلا تعريفات؛ الأنواع مُصرَّح بها أدناه.
import * as shared from "../../../shared/menu-url.mjs";

export const MENU_DOMAIN: string = shared.MENU_DOMAIN;
export const MENU_MODE: "path" | "subdomain" = shared.MENU_MODE;
export const SLUG_MIN: number = shared.SLUG_MIN;
export const SLUG_MAX: number = shared.SLUG_MAX;
export const RESERVED: Set<string> = shared.RESERVED;

/** رسالة عربية تشرح ما الخطأ، أو `null` إن كان الرابط صالحاً. */
export const slugError: (value: string | null | undefined) => string | null = shared.slugError;

export const isValidSlug: (value: string | null | undefined) => boolean = shared.isValidSlug;

/** أصل الموقع (اللوحة والصفحات العامّة). */
export const siteOrigin: () => string = shared.siteOrigin;

/**
 * عنوان منيو مطعم — **المصدر الوحيد**. لا تبنِ الرابط بيدك في صفحة:
 * `window.location.origin` هو مضيف اللوحة لا مضيف المنيو.
 */
export const menuUrl: (slug: string | null | undefined, extra?: string) => string | null =
  shared.menuUrl;

/** يستخرج الـslug من المضيف أو المسار — نفس منطق الحافة حرفياً. */
export const slugFromRequest: (
  host: string | null | undefined,
  pathname: string | null | undefined
) => string | null = shared.slugFromRequest;

/** ما يُعرض قبل خانة الكتابة وبعدها في حقل اختيار الرابط. */
export const urlAffixes: () => { before: string; after: string } = shared.urlAffixes;
