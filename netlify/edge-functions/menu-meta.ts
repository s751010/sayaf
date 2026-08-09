/**
 * دالة حافة Netlify: تحقن وسوم المشاركة في `/:slug` قبل أن تصل الزاحف.
 *
 * ═══ ⚠️ قشرة بلا منطق — عمداً ═══
 *
 * كل قرار (أهذا مسار منيو؟ · أي صورة؟ · كيف تُحقن الوسوم؟) في
 * `shared/menu-meta.mjs` **دوالّ خالصة تفحصها Vitest**. هنا ثلاثة أشياء فقط:
 * اجلب الصفّ، نادِ الحقن، أعِد الردّ. فالجزء الذي لا تستطيع بيئة التطوير
 * تشغيله (Deno + Netlify) هو أصغر جزء وأقلّه احتمالاً للخطأ.
 *
 * ═══ ⚠️ أي فشل ⇒ الردّ الأصلي كما هو ═══
 *
 * شبكة، أو slug غير موجود، أو مهلة، أو صفحة بلا وسوم — كلّها تعيد ما جاء من
 * `context.next()` بلا مساس. **صفحة المنيو لا تنكسر لأن حقن وسمٍ فشل**؛ نفس
 * مبدأ `lib/billing.ts` في §٢١: عطلٌ عندنا يُبقي منيوهات التجّار تعمل.
 */
import type { Config, Context } from "https://edge.netlify.com";
import { injectMeta } from "../../shared/menu-meta.mjs";
import { menuUrl, slugFromRequest } from "../../shared/menu-url.mjs";

/**
 * مضمّنة لا مستوردة من `app/src/lib/config.ts`: ذاك ملفّ TypeScript يمرّ
 * بـVite، وDeno على الحافة لا يفهم `@/` ولا يمرّ ببناء التطبيق. والقيم عامّة
 * بطبيعتها (مفتاح anon محمي بـRLS، §٧).
 *
 * ⚠️ **نسخة ثانية بيد ⇒ فحص يحرسها.** أول كتابة لهذه الكتلة حملت مفتاحاً
 * قديماً، وكان أثره **صمتاً كاملاً**: الاستعلام يعود ٤٠١، والدالة تعيد الردّ
 * الأصلي كما صُمّمت، فلا خطأ ولا سجلّ ولا شيء يُلاحَظ — ووسوم المطاعم لا
 * تُحقن أبداً. `config-parity.test.ts` يقارن الملفّين ويُسقط CI عند التباعد.
 */
const SUPABASE_URL = "https://wjqpsbpebpntpeinqccl.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXBzYnBlYnBudHBlaW5xY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNTE1MDEsImV4cCI6MjA5NTcyNzUwMX0.c2kB9phWo2SbOsaUmb_h5A9y0pcd7eKLzEbGmC41I4M";

/**
 * ⚠️ أعمدة صريحة — القاعدة (و) تنطبق هنا كما تنطبق في المتصفّح: صلاحيات
 * `anon` ممنوحة على مستوى العمود، و`select=*` يفشل كلّه بعمود واحد غير ممنوح.
 */
const COLS = "name,description,logo_image,banner_image,slug";

/** الزاحف ينتظر ثانيتين لا أكثر؛ ولا يجوز أن يعلّق زبوناً على طاولة أطول. */
const TIMEOUT_MS = 1500;

export default async function handler(request: Request, context: Context) {
  const response = await context.next();

  try {
    // ما ليس صفحة HTML لا وسوم فيه (الأصول تمرّ من هنا أيضاً).
    const type = response.headers.get("content-type") ?? "";
    if (!type.includes("text/html")) return response;

    const url = new URL(request.url);
    // من المضيف **أو** المسار — نفس الدالة التي يقرأ بها المتصفّح، فلا يختلف
    // فهم «ما هو منيو» بين الطرفين.
    const slug = slugFromRequest(url.host, url.pathname);
    if (!slug) return response;

    const query =
      `${SUPABASE_URL}/rest/v1/restaurants` +
      `?slug=eq.${encodeURIComponent(slug)}&select=${COLS}&limit=1`;

    const data = await fetch(query, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!data.ok) return response;

    const rows = await data.json();
    const restaurant = Array.isArray(rows) ? rows[0] : null;

    /**
     * ⚠️ **الاسم القديم يُحوَّل ٣٠١ قبل تحميل التطبيق.**
     *
     * التاجر يغيّر رابطه مرّة واحدة، وكود QR المطبوع على طاولاته يحمل القديم
     * ولا يُحدَّث. فبلا هذا التحويل يفتح الزبون «المطعم غير موجود» — أي أن
     * تغيير رابط يُطفئ منيو مطعم عامل.
     *
     * والتحويل هنا لا في التطبيق: أرخص (لا يُحمَّل SPA ليعيد التوجيه)، ويُبقي
     * قوقل على رابط واحد بدل صفحتين بمحتوى واحد.
     */
    if (!restaurant) {
      const ask = (q: string) =>
        fetch(`${SUPABASE_URL}/rest/v1/${q}`, {
          headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);

      const alias = await ask(
        `restaurant_slug_aliases?old_slug=eq.${encodeURIComponent(slug)}&select=restaurant_id&limit=1`
      );
      const id = Array.isArray(alias) ? alias[0]?.restaurant_id : null;
      if (id) {
        const target = await ask(`restaurants?id=eq.${id}&select=slug&limit=1`);
        const next = Array.isArray(target) ? target[0]?.slug : null;
        // أصل الطلب لا نطاق مفترَض: التحويل يبقى على النطاق الذي جاء منه الزائر.
        const to = next ? menuUrl(next, url.search, url.origin) : null;
        if (to) return Response.redirect(to, 301);
      }
      return response;
    }

    const html = injectMeta(await response.text(), restaurant, url.origin, slug);

    const headers = new Headers(response.headers);
    // الوسوم تتبع اسم المطعم وصورته، فتغييرهما يجب أن يظهر بسرعة — لكن
    // خمس دقائق على الحافة تكفي لتحمّل انتشار رابط واحد على واتساب.
    headers.set("Netlify-CDN-Cache-Control", "public, s-maxage=300, must-revalidate");
    headers.delete("content-length"); // تغيّر بعد الحقن
    return new Response(html, { status: response.status, headers });
  } catch {
    return response;
  }
}

export const config: Config = {
  path: "/*",
  // ما لا يمكن أن يكون منيواً يُستبعَد قبل أن تعمل الدالة أصلاً — أرخص من
  // فحصه بداخلها، ويُبقي الأصول خارج مسار الحافة تماماً.
  excludedPath: ["/assets/*", "/*.*", "/dashboard/*", "/founder/*", "/docs/*", "/blog/*"],
};
