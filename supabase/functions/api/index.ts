/**
 * api — واجهة برمجية عامة للتاجر على `/functions/v1/api/v1/…`.
 *
 * ينشر بـ `verify_jwt = false`: التوثيق بمفتاح API لا بجلسة Supabase، والمستهلك
 * خادمٌ لدى التاجر (نقطة بيع، موقعه، أتمتة) لا متصفّح مسجَّل.
 *
 * ── المبادئ ──────────────────────────────────────────────────────────
 * 1. **المفتاح يحدّد المطعم، لا الطلب.** `restaurant_id` يُشتق من صفّ المفتاح
 *    ويُفرض على كل استعلام وكل كتابة. أي `restaurant_id` في جسم الطلب أو في
 *    الاستعلام يُتجاهَل. فمفتاح مطعم أ لا يستطيع رؤية مطعم ب مهما كتب.
 * 2. **المفتاح لا يُخزَّن.** يُخزَّن هاش SHA-256 وحده، فتسريب قاعدة البيانات لا
 *    يُنتج مفاتيح صالحة.
 * 3. **الأعمدة المحسوبة ممنوعة** (القاعدة د): `burn_minutes` و`is_high_sodium`
 *    و`sfda_compliant` مولّدة في Postgres، وإرسال أي قيمة لها يرفض الطلب كاملاً.
 * 4. **جوالات زبائن الولاء وأسماؤهم لا تخرج أبداً** (قرار المالك، §11) —
 *    `/v1/loyalty/summary` تعيد أعداداً فقط.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...CORS, ...extra, "Content-Type": "application/json; charset=utf-8" },
  });
}

const err = (message: string, status: number, extra?: Record<string, string>) =>
  json({ error: message }, status, extra);

/** ٦٠ طلباً في الدقيقة لكل مفتاح — سخيّ لنقطة بيع، ضيّق على السحب الجماعي. */
const RATE_LIMIT = 60;

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* ── القوائم البيضاء للكتابة ─────────────────────────────────────────
   نسخة مطابقة لـ`DishPayload` في app/src/lib/data.ts — بلا الأعمدة المحسوبة
   وبلا `restaurant_id`/`menu_id`/`user_id` (تُفرض من المفتاح). */
const DISH_FIELDS = [
  "name", "description", "price", "category", "emoji", "image", "featured",
  "available", "calories", "sodium_mg", "caffeine_mg", "allergens",
  "name_en", "description_en", "options", "sort_order",
] as const;

const RESTAURANT_FIELDS = [
  "name", "type", "phone", "address", "logo_image", "banner_image",
  "working_hours", "allergens_text", "google_review_url",
  "social_whatsapp", "social_instagram", "social_twitter", "social_tiktok",
  "social_snapchat", "social_maps", "english_enabled",
  "loyalty_enabled", "loyalty_goal", "loyalty_reward",
  "prices_include_vat", "vat_number", "season", "category_order",
] as const;

/**
 * يُبقي المفاتيح المسموحة فقط. الحقل غير المذكور **يُرفض صراحةً** بدل أن
 * يُسقَط بصمت: مستهلك API يرسل `burn_minutes` ويظنّه حُفظ أسوأ من خطأ واضح.
 */
function pick(
  body: Record<string, unknown>,
  allowed: readonly string[]
): { data: Record<string, unknown> } | { rejected: string[] } {
  const rejected = Object.keys(body).filter((k) => !allowed.includes(k));
  if (rejected.length) return { rejected };
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];
  return { data };
}

const PUBLIC_DISH_COLS =
  "id,menu_id,restaurant_id,name,description,price,category,emoji,image,featured," +
  "available,sort_order,views,calories,sodium_mg,caffeine_mg,burn_minutes," +
  "is_high_sodium,sfda_compliant,allergens,name_en,description_en,options,created_at";

const RESTAURANT_COLS =
  "id,name,type,phone,address,logo,cover_color,logo_image,banner_image,slug," +
  "google_review_url,allergens_text,working_hours,social_instagram,social_twitter," +
  "social_tiktok,social_snapchat,social_whatsapp,social_maps,english_enabled," +
  "loyalty_enabled,loyalty_goal,loyalty_reward,prices_include_vat,vat_number," +
  "category_order,season,online_payment_enabled,created_at";

const MENU_COLS =
  "id,restaurant_id,name,description,theme,language,cover_image,active,views," +
  "window_from,window_to,created_at";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  // ── التوثيق ────────────────────────────────────────────────────────
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token.startsWith("cm_live_")) {
    return err("مفتاح API مفقود. أرسل: Authorization: Bearer cm_live_…", 401, {
      "WWW-Authenticate": "Bearer",
    });
  }

  const { data: keyRows } = await admin
    .from("api_keys")
    .select("id, restaurant_id, scopes, revoked_at")
    .eq("key_hash", await sha256Hex(token))
    .limit(1);

  const key = keyRows?.[0] as
    | { id: string; restaurant_id: string; scopes: string[]; revoked_at: string | null }
    | undefined;

  if (!key) return err("مفتاح API غير صالح.", 401);
  if (key.revoked_at) return err("هذا المفتاح مُبطَل.", 401);

  const { data: allowed } = await admin.rpc("api_rate_hit", {
    p_key: key.id,
    p_limit: RATE_LIMIT,
  });
  if (allowed === false) {
    return err(`تجاوزت الحدّ: ${RATE_LIMIT} طلباً في الدقيقة.`, 429, {
      "Retry-After": "60",
    });
  }

  // لا ننتظره: تحديث الطابع لا يجوز أن يبطّئ ردّ المستهلك.
  admin
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", key.id)
    .then(() => {});

  const canWrite = key.scopes.includes("write");
  const R = key.restaurant_id;

  // ── التوجيه ────────────────────────────────────────────────────────
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/functions\/v1/, "").replace(/^\/api/, "") || "/";
  const seg = path.split("/").filter(Boolean); // ["v1","dishes","<id>"]
  const method = req.method;

  if (seg[0] !== "v1") {
    return err("المسار غير معروف. كل المسارات تبدأ بـ /v1/ — انظر /docs/api.", 404);
  }

  let body: Record<string, unknown> = {};
  if (method === "POST" || method === "PATCH") {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return err("جسم الطلب ليس JSON صالحاً.", 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return err("جسم الطلب يجب أن يكون كائن JSON.", 400);
    }
  }
  const needWrite = () =>
    canWrite ? null : err("هذا المفتاح للقراءة فقط (scope: read).", 403);

  const resource = seg[1];
  const id = seg[2];

  try {
    /* ── /v1/menu — المنيو كاملاً في نداء واحد ──────────────────────── */
    if (resource === "menu" && !id && method === "GET") {
      const [{ data: restaurant }, { data: menus }] = await Promise.all([
        admin.from("restaurants").select(RESTAURANT_COLS).eq("id", R).single(),
        admin.from("menus").select(MENU_COLS).eq("restaurant_id", R).eq("active", true),
      ]);
      const { data: dishes } = await admin
        .from("dishes")
        .select(PUBLIC_DISH_COLS)
        .eq("restaurant_id", R)
        .order("sort_order", { ascending: true });
      return json({ restaurant, menus: menus ?? [], dishes: dishes ?? [] });
    }

    /* ── /v1/restaurant ─────────────────────────────────────────────── */
    if (resource === "restaurant" && !id) {
      if (method === "GET") {
        const { data } = await admin
          .from("restaurants")
          .select(RESTAURANT_COLS)
          .eq("id", R)
          .single();
        return json(data);
      }
      if (method === "PATCH") {
        const blocked = needWrite();
        if (blocked) return blocked;
        const picked = pick(body, RESTAURANT_FIELDS);
        if ("rejected" in picked) {
          return err(`حقول غير مسموحة: ${picked.rejected.join("، ")}`, 400);
        }
        const { data, error } = await admin
          .from("restaurants")
          .update(picked.data)
          .eq("id", R)
          .select(RESTAURANT_COLS)
          .single();
        if (error) return err(error.message, 400);
        return json(data);
      }
    }

    /* ── /v1/menus ──────────────────────────────────────────────────── */
    if (resource === "menus" && !id && method === "GET") {
      const { data } = await admin
        .from("menus")
        .select(MENU_COLS)
        .eq("restaurant_id", R)
        .order("created_at", { ascending: true });
      return json(data ?? []);
    }

    /* ── /v1/dishes ─────────────────────────────────────────────────── */
    if (resource === "dishes") {
      if (!id && method === "GET") {
        const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 100));
        const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
        let q = admin
          .from("dishes")
          .select(PUBLIC_DISH_COLS)
          .eq("restaurant_id", R)
          .order("sort_order", { ascending: true })
          .range(offset, offset + limit - 1);
        const category = url.searchParams.get("category");
        if (category) q = q.eq("category", category);
        const available = url.searchParams.get("available");
        if (available === "true" || available === "false") {
          q = q.eq("available", available === "true");
        }
        const { data } = await q;
        return json(data ?? []);
      }

      if (!id && method === "POST") {
        const blocked = needWrite();
        if (blocked) return blocked;
        const picked = pick(body, [...DISH_FIELDS, "menu_id"]);
        if ("rejected" in picked) {
          return err(
            `حقول غير مسموحة: ${picked.rejected.join("، ")}. ` +
              "الأعمدة burn_minutes و is_high_sodium و sfda_compliant تحسبها القاعدة.",
            400
          );
        }
        // القائمة يجب أن تخصّ هذا المطعم — وإلا زُرع طبق في منيو غيره.
        const { data: menus } = await admin
          .from("menus")
          .select("id, user_id")
          .eq("restaurant_id", R)
          .order("created_at", { ascending: true });
        const owned = (menus ?? []) as { id: string; user_id: string | null }[];
        if (owned.length === 0) return err("لا توجد قائمة في هذا المطعم بعد.", 409);
        const wanted = typeof picked.data.menu_id === "string" ? picked.data.menu_id : null;
        const menu = wanted ? owned.find((m) => m.id === wanted) : owned[0];
        if (!menu) return err("القائمة المطلوبة ليست لهذا المطعم.", 403);

        const { data, error } = await admin
          .from("dishes")
          .insert({
            ...picked.data,
            menu_id: menu.id,
            restaurant_id: R,
            user_id: menu.user_id,
          })
          .select(PUBLIC_DISH_COLS)
          .single();
        if (error) return err(error.message, 400);
        return json(data, 201);
      }

      if (id && method === "GET") {
        const { data } = await admin
          .from("dishes")
          .select(PUBLIC_DISH_COLS)
          .eq("id", id)
          .eq("restaurant_id", R)
          .maybeSingle();
        return data ? json(data) : err("الطبق غير موجود.", 404);
      }

      if (id && method === "PATCH") {
        const blocked = needWrite();
        if (blocked) return blocked;
        const picked = pick(body, DISH_FIELDS);
        if ("rejected" in picked) {
          return err(
            `حقول غير مسموحة: ${picked.rejected.join("، ")}. ` +
              "الأعمدة burn_minutes و is_high_sodium و sfda_compliant تحسبها القاعدة.",
            400
          );
        }
        const { data, error } = await admin
          .from("dishes")
          .update(picked.data)
          .eq("id", id)
          .eq("restaurant_id", R)
          .select(PUBLIC_DISH_COLS)
          .maybeSingle();
        if (error) return err(error.message, 400);
        return data ? json(data) : err("الطبق غير موجود.", 404);
      }

      if (id && method === "DELETE") {
        const blocked = needWrite();
        if (blocked) return blocked;
        const { data, error } = await admin
          .from("dishes")
          .delete()
          .eq("id", id)
          .eq("restaurant_id", R)
          .select("id")
          .maybeSingle();
        if (error) return err(error.message, 400);
        return data ? json({ deleted: id }) : err("الطبق غير موجود.", 404);
      }
    }

    /* ── /v1/analytics ──────────────────────────────────────────────── */
    if (resource === "analytics" && !id && method === "GET") {
      const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days")) || 30));
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const { data: menus } = await admin.from("menus").select("id").eq("restaurant_id", R);
      const menuIds = (menus ?? []).map((m) => (m as { id: string }).id);
      if (menuIds.length === 0) return json({ days, total_views: 0, by_date: [] });

      const { data: rows } = await admin
        .from("analytics")
        .select("date, views, dish_id, table_no")
        .in("menu_id", menuIds)
        .gte("date", since);

      const list = (rows ?? []) as {
        date: string | null;
        views: number | null;
        dish_id: string | null;
      }[];
      const byDate = new Map<string, number>();
      let total = 0;
      for (const row of list) {
        if (row.dish_id) continue; // مشاهدات المنيو لا فتح الأطباق
        const v = Number(row.views ?? 0);
        total += v;
        if (row.date) byDate.set(row.date, (byDate.get(row.date) ?? 0) + v);
      }
      return json({
        days,
        total_views: total,
        by_date: [...byDate.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, views]) => ({ date, views })),
      });
    }

    /* ── /v1/loyalty/summary — أعداد فقط ────────────────────────────── */
    if (resource === "loyalty" && id === "summary" && method === "GET") {
      const { count: customers } = await admin
        .from("loyalty_customers")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", R);
      const { data: agg } = await admin
        .from("loyalty_customers")
        .select("stamps, rewards_used")
        .eq("restaurant_id", R);
      const rows = (agg ?? []) as { stamps: number | null; rewards_used: number | null }[];
      return json({
        // ⚠️ بلا جوالات ولا أسماء — قرار مالك صريح، لا تُضِفها لاحقاً.
        customers: customers ?? 0,
        total_stamps: rows.reduce((s, r) => s + Number(r.stamps ?? 0), 0),
        rewards_used: rows.reduce((s, r) => s + Number(r.rewards_used ?? 0), 0),
      });
    }

    return err(`المسار ${method} ${path} غير معروف — انظر /docs/api.`, 404);
  } catch (e) {
    console.error("api:", e instanceof Error ? e.message : e);
    return err("خطأ داخلي.", 500);
  }
});
