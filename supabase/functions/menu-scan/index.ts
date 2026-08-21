/**
 * `menu-scan` — يقرأ صورة منيو مطبوع ويُخرج أصنافه وأسعاره وتصنيفاته.
 *
 * ═══ لماذا في الحافة لا في المتصفّح ═══
 *
 * مفتاح النموذج **سرٌّ**. ولو نُودي من الواجهة لكان في الحزمة التي يُنزّلها
 * كل زائر — يفتح أدوات المطوّر ويأخذه، ثم يستنزف الحصّة أو يورّط المالك
 * بفاتورة. فالمفتاح هنا في `GEMINI_API_KEY` (أسرار Supabase) ولا يخرج.
 *
 * ═══ لماذا `gemini-3.5-flash-lite` ═══
 *
 * قياسٌ فعليّ على ثلاث صور اختبار من منيو مطعم حقيقي (١٢ صنفاً، مرجعٌ
 * دقيق من القاعدة):
 *
 *   3.5-flash-lite  ٣/٣ تامّة · ٣ ثوانٍ   ← وثابت: ٣ إعادات ١٢/١٢
 *   2.5-flash       ٢/٣      · ١٥ ثانية  ← **خلط ثمانية أسعار بين الأطباق**
 *   3.7-flash       ١/٣      · ١٤٦ ثانية
 *   gemma-4-31b     ٠/٣                 ← يشرح التعليمة بدل تنفيذها
 *
 * ⚠️ والنماذج تموت: `2.5-pro` و`2.5-flash-lite` رُدّا بـ٤٠٤ «لم يعد متاحاً
 * للحسابات الجديدة» أثناء نفس القياس. لذلك المعرّف **متغيّر بيئة**
 * (`MENU_SCAN_MODEL`) يُبدَّل بلا نشر جديد.
 *
 * ═══ الحراسة ═══
 *
 * جلسة تاجر صالحة · ملكية المطعم · حدّ معدّل · حدّ حجم · صيغ صور فقط.
 */
const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI = Deno.env.get("GEMINI_API_KEY") ?? "";
const MODEL = Deno.env.get("MENU_SCAN_MODEL") ?? "gemini-3.5-flash-lite";

/** ٦ ميغابايت بعد base64 — أكبر من أي صورة يضغطها المتصفّح، وأقلّ من حدّ الطلب. */
const MAX_B64 = 6_000_000;
const OK_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

/**
 * التعليمة — **نفسها التي قيست بها النماذج**. تغييرها يُبطل القياس، فأي
 * تعديل عليها يوجب إعادة `bench2.mjs` قبل اعتماده.
 */
const PROMPT = `أنت تقرأ صورة منيو مطعم سعودي.
استخرج كل صنف فيه. أعِد JSON فقط بلا أي نصّ آخر، بهذا الشكل:
{"items":[{"name":"اسم الصنف","price":24,"category":"اسم التصنيف","description":"وصف قصير أو null"}]}

قواعد:
- السعر رقم إنجليزي بلا عملة. الأرقام الهندية (٢٤) تُحوَّل إلى 24.
- التصنيف هو العنوان الذي يقع الصنف تحته في المنيو.
- ⚠️ في المنيو ذي العمودين احرص أن يبقى كل سعر مع صنفه — لا تُزحزح الأسعار.
- لا تخترع صنفاً غير موجود. إن لم تجد سعراً اجعله null.
- الوصف من المنيو نفسه إن وُجد، وإلا null. لا تؤلّف وصفاً.
- تجاهل الترويسة والعنوان والهاتف وملاحظة الضريبة وأوقات العمل.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  // ── جلسة التاجر ────────────────────────────────────────────────────
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token === ANON) return json({ error: "unauthorized" }, 401);

  const who = await fetch(`${URL_}/auth/v1/user`, {
    headers: { apikey: ANON, authorization: `Bearer ${token}` },
  });
  if (!who.ok) return json({ error: "unauthorized" }, 401);
  const user = await who.json();
  const uid: string | undefined = user?.id;
  if (!uid) return json({ error: "unauthorized" }, 401);

  // ⚠️ **بعد التحقّق من الجلسة لا قبله**: كانت تُجيب غير المصرَّح له بأن
  // الميزة «غير مفعّلة» — إفصاحٌ عن حال الإعداد لمن لا يملك حساباً.
  if (!GEMINI) {
    return json({ error: "not_configured", message: "الميزة غير مفعّلة بعد." }, 503);
  }

  // ── المدخلات ───────────────────────────────────────────────────────
  let body: { restaurant_id?: string; image?: string; mime?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_json" }, 400);
  }
  const { restaurant_id, image, mime } = body;
  if (!restaurant_id || !image) return json({ error: "missing" }, 400);
  if (image.length > MAX_B64) {
    return json({ error: "too_large", message: "الصورة كبيرة — صوّرها بجودة أقل." }, 413);
  }
  if (mime && !OK_MIME.includes(mime)) {
    return json({ error: "bad_type", message: "ارفع صورة (JPG أو PNG)." }, 415);
  }

  // ── الملكية: التاجر يقرأ منيو مطعمه هو ─────────────────────────────
  const own = await fetch(
    `${URL_}/rest/v1/restaurants?id=eq.${restaurant_id}&select=id,user_id`,
    { headers: { apikey: SERVICE, authorization: `Bearer ${SERVICE}` } },
  ).then((r) => r.json());
  if (!Array.isArray(own) || own[0]?.user_id !== uid) {
    return json({ error: "forbidden" }, 403);
  }

  // ── حدّ المعدّل: نداء النموذج يكلّف، فلا يُترك مفتوحاً ──────────────
  const hit = await fetch(`${URL_}/rest/v1/rpc/abuse_hit`, {
    method: "POST",
    headers: {
      apikey: SERVICE,
      authorization: `Bearer ${SERVICE}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      p_scope: "menu_scan",
      p_key: restaurant_id,
      p_limit: 20,
      p_minutes: 60,
    }),
  });
  if (hit.ok && (await hit.json()) === false) {
    return json(
      { error: "rate_limited", message: "جرّبت كثيراً خلال ساعة. انتظر قليلاً." },
      429,
    );
  }

  // ── النموذج ────────────────────────────────────────────────────────
  let raw = "";
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                { inline_data: { mime_type: mime ?? "image/jpeg", data: image } },
              ],
            },
          ],
          generationConfig: { responseMimeType: "application/json", temperature: 0 },
        }),
      },
    );
    const j = await r.json();
    if (!r.ok) {
      // ٥٠٣/٤٢٩ ازدحامٌ عابر — نقولها كما هي بدل «فشل» مبهم.
      const busy = r.status === 503 || r.status === 429;
      return json(
        {
          error: busy ? "busy" : "model_error",
          message: busy
            ? "الخدمة مزدحمة الآن. أعد المحاولة بعد لحظات."
            : "تعذّرت قراءة الصورة. جرّب صورة أوضح.",
        },
        busy ? 503 : 502,
      );
    }
    raw = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch {
    return json({ error: "model_unreachable", message: "تعذّر الوصول للخدمة." }, 502);
  }

  // ── التنظيف: النموذج قد يغلّف JSON بنصّ أو بسياج ─────────────────
  let items: unknown[] = [];
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const parsed = JSON.parse(m[0]);
      if (Array.isArray(parsed?.items)) items = parsed.items;
    } catch { /* يُترك فارغاً فتظهر رسالة «لم نتعرّف» */ }
  }

  /** الأرقام الهندية قد تعود كما هي رغم التعليمة — نُحوّلها هنا لا نأمل. */
  const toNum = (v: unknown): number | null => {
    const s = String(v ?? "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
    const n = Number(s.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  };
  const str = (v: unknown, max: number): string | null => {
    const s = String(v ?? "").trim().slice(0, max);
    return s && s !== "null" ? s : null;
  };

  const clean = items
    .map((it) => {
      const o = it as Record<string, unknown>;
      return {
        name: str(o.name, 120),
        price: toNum(o.price),
        category: str(o.category, 60),
        description: str(o.description, 400),
      };
    })
    .filter((x) => x.name)
    .slice(0, 300); // سقفٌ يمنع ردّاً ضخماً من نموذج شارد

  return json({ items: clean, model: MODEL, count: clean.length });
});
