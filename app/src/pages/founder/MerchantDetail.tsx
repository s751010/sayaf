/**
 * بطاقة التاجر — كل شيء عنه في شاشة واحدة، وكل أزرار التحكّم فيه.
 *
 * ═══ ما لا يظهر هنا عمداً ═══
 *
 * - **جوالات زبائن الولاء وأسماؤهم**: العدد فقط. هؤلاء زبائن التاجر لا زبائن
 *   المنصة، وقرار المالك ألّا تُعرض إطلاقاً. لذلك لا نداء لـ`loyalty_customers`
 *   من هنا — العدد يأتي محسوباً من `founder_merchants()`.
 * - **مفاتيح بوابة الدفع**: `restaurant_payment_settings.secret_key` لا يُقرأ.
 *
 * ═══ كل إجراء يُسجَّل ═══
 *
 * `logAudit` تُنادى **قبل** كل تغيير. اللوحة تعدّل بيانات تجّار وتحذفها، فسجل
 * لا يُنقَّح هو ما يجعل ذلك مقبولاً.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Badge,
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  Modal,
  Skeleton,
  Switch,
  useToast,
} from "@/components/ui";
import {
  cancelSubscription,
  deleteRestaurant,
  extendSubscription,
  getDishesOf,
  getMenusOf,
  getMerchants,
  getRestaurantById,
  getSubscriptionsOf,
  grantSubscription,
  logAudit,
  setApiEnabled,
  type FounderMerchant,
  type Subscription,
} from "@/lib/founder";
import { updateRestaurant, type RestaurantSettingsPayload } from "@/lib/data";
import { getTheme } from "@/lib/themes";
import type { Dish, Menu, Restaurant } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/utils";
import { SubBadge } from "./Merchants";
import { Icon, DishGlyph } from "@/lib/icons";

/** يبني الـpayload كاملاً من الصف الحالي — القاعدة (أ): مفتاح ناقص يُسقَط بصمت. */
function payloadOf(r: Restaurant): RestaurantSettingsPayload {
  return {
    name: r.name,
    type: r.type,
    phone: r.phone,
    address: r.address,
    logo_image: r.logo_image,
    banner_image: r.banner_image,
    working_hours: r.working_hours,
    allergens_text: r.allergens_text,
    google_review_url: r.google_review_url,
    social_whatsapp: r.social_whatsapp,
    social_instagram: r.social_instagram,
    social_twitter: r.social_twitter,
    social_tiktok: r.social_tiktok,
    social_snapchat: r.social_snapchat,
    social_maps: r.social_maps,
    english_enabled: r.english_enabled ?? false,
    loyalty_enabled: r.loyalty_enabled ?? false,
    loyalty_goal: r.loyalty_goal,
    loyalty_reward: r.loyalty_reward,
    prices_include_vat: r.prices_include_vat ?? true,
    vat_number: r.vat_number,
    season: r.season,
    meta_pixel_id: r.meta_pixel_id,
    ga_measurement_id: r.ga_measurement_id,
    snap_pixel_id: r.snap_pixel_id,
  };
}

export default function MerchantDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [row, setRow] = useState<FounderMerchant | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[] | null>(null);
  const [dishes, setDishes] = useState<Dish[] | null>(null);
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const [all, r, m, d] = await Promise.all([
        getMerchants(),
        getRestaurantById(id),
        getMenusOf(id),
        getDishesOf(id),
      ]);
      const mine = all.find((x) => x.id === id) ?? null;
      setRow(mine);
      setRestaurant(r);
      setName(r.name);
      setMenus(m);
      setDishes(d);
      setSubs(mine?.owner_id ? await getSubscriptionsOf(mine.owner_id) : []);
    } catch {
      setError("تعذّر تحميل بطاقة التاجر.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** غلاف واحد لكل إجراء: يشغّل، يسجّل، يعيد التحميل، ويبلّغ. */
  async function act(label: string, fn: () => Promise<void>, audit: () => Promise<void>) {
    setBusy(true);
    try {
      await audit();
      await fn();
      await load();
      toast(`${label} ✓`);
    } catch {
      toast(`تعذّر ${label}.`, "err");
    } finally {
      setBusy(false);
    }
  }

  async function saveBasics() {
    if (!restaurant) return;
    const next = name.trim();
    if (!next) return toast("الاسم لا يكون فارغاً.", "err");
    await act(
      "حفظ البيانات",
      () => updateRestaurant(restaurant.id, { ...payloadOf(restaurant), name: next }),
      () =>
        logAudit("تعديل بيانات مطعم", {
          table: "restaurants",
          id: restaurant.id,
          name: restaurant.name,
          details: { from: restaurant.name, to: next },
        })
    );
    setEditing(false);
  }

  async function toggleFeature(key: keyof RestaurantSettingsPayload, value: boolean) {
    if (!restaurant) return;
    await act(
      "تحديث المزايا",
      () => updateRestaurant(restaurant.id, { ...payloadOf(restaurant), [key]: value }),
      () =>
        logAudit("تبديل ميزة", {
          table: "restaurants",
          id: restaurant.id,
          name: restaurant.name,
          details: { feature: key, value },
        })
    );
  }

  /**
   * `api_enabled` خارج `RestaurantSettingsPayload` عمداً (القاعدة هـ): قرار
   * منصّة لا إعداد تاجر، وتريجر `guard_api_enabled` في القاعدة يرفض تغييره
   * لغير المؤسس — فحتى لو نادى تاجر PostgREST مباشرة رُدّ.
   */
  async function toggleApi(value: boolean) {
    if (!restaurant) return;
    await act(
      "تحديث واجهة API",
      () => setApiEnabled(restaurant.id, value),
      () =>
        logAudit(value ? "فتح واجهة API لتاجر" : "إغلاق واجهة API عن تاجر", {
          table: "restaurants",
          id: restaurant.id,
          name: restaurant.name,
          details: { api_enabled: value },
        })
    );
  }

  async function doDelete() {
    if (!restaurant || confirmName.trim() !== restaurant.name) return;
    setBusy(true);
    try {
      await logAudit("حذف مطعم نهائياً", {
        table: "restaurants",
        id: restaurant.id,
        name: restaurant.name,
        details: {
          slug: restaurant.slug,
          menus: menus?.length ?? 0,
          dishes: dishes?.length ?? 0,
          owner: row?.owner_email,
        },
      });
      await deleteRestaurant(restaurant.id);
      toast("حُذف المطعم وكل بياناته.");
      navigate("/founder/merchants", { replace: true });
    } catch {
      toast("تعذّر الحذف.", "err");
      setBusy(false);
    }
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!restaurant || !row) return <Skeleton className="h-96" />;

  const activeSub = subs?.find((s) => s.active && new Date(s.end_date) > new Date()) ?? null;

  return (
    <div>
      <Link to="/founder/merchants" className="text-sm font-bold text-dim hover:text-ink">
        ← كل التجّار
      </Link>

      {/* الترويسة */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-black text-ink">
            {restaurant.logo} {restaurant.name}
          </h1>
          <p className="mt-1 text-sm text-dim" dir="ltr">
            {row.owner_email ?? "— بلا مالك —"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SubBadge m={row} />
            <Badge variant="neutral">أُنشئ {formatDate(restaurant.created_at)}</Badge>
            {row.has_staff_pin && <Badge variant="neutral">🔐 رمز كاشير مضبوط</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {restaurant.slug && (
            <a
              href={`/${restaurant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-line-gold px-3 py-2 text-sm font-bold text-ink hover:bg-gold/10"
            >
              افتح منيوه ↗
            </a>
          )}
          {/* الدخول كتاجر — ترى لوحته كما يراها ليسهل دعمه. قراءة فقط. */}
          <Link
            to={`/dashboard?as=${restaurant.id}`}
            className="rounded-xl border border-line-gold px-3 py-2 text-sm font-bold text-ink hover:bg-gold/10"
          >
            👁️ افتح لوحته
          </Link>
          <Button variant="outline" onClick={() => setEditing((v) => !v)}>
            {editing ? "إلغاء" : "✏️ تعديل"}
          </Button>
        </div>
      </div>

      {/* أرقامه */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "القوائم", v: `${row.menus_count}`, s: `${row.active_menus} مفعّلة` },
          { l: "الأطباق", v: `${row.dishes_count}`, s: row.dishes_count === 0 ? "⚠️ منيو فارغ" : "" },
          { l: "مشاهدات ٣٠ يوماً", v: `${row.views_30d}`, s: row.last_view ? `آخرها ${row.last_view}` : "لم يُشاهَد" },
          { l: "زبائن الولاء", v: `${row.loyalty_count}`, s: "عدد فقط" },
        ].map((c) => (
          <Card key={c.l}>
            <p className="text-xs text-dim">{c.l}</p>
            <p className="font-display text-xl font-black text-ink">{c.v}</p>
            {c.s && <p className="text-[11px] text-faint">{c.s}</p>}
          </Card>
        ))}
      </div>

      {/* تعديل البيانات */}
      {editing && (
        <Card className="mt-5">
          <h2 className="font-display text-base font-extrabold text-ink">✏️ بياناته</h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="اسم المطعم" className="min-w-56 flex-1">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Button onClick={saveBasics} disabled={busy}>
              حفظ
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-4">
            <Switch
              checked={restaurant.english_enabled ?? false}
              onChange={(v) => toggleFeature("english_enabled", v)}
              label="الإنجليزية"
            />
            <Switch
              checked={restaurant.loyalty_enabled ?? false}
              onChange={(v) => toggleFeature("loyalty_enabled", v)}
              label="بطاقة الولاء"
            />
            <Switch
              checked={restaurant.prices_include_vat ?? true}
              onChange={(v) => toggleFeature("prices_include_vat", v)}
              label="الأسعار شاملة الضريبة"
            />
            {/* بوّابة الـAPI: أنت تفتحها، والتاجر يولّد مفتاحه بنفسه من إعداداته
                فلا يمرّ السرّ بك ولا بقناة محادثة. خارج `toggleFeature` لأن
                العمود خارج whitelist الإعدادات (القاعدة هـ). */}
            <Switch
              checked={restaurant.api_enabled ?? false}
              onChange={(v) => toggleApi(v)}
              label="🔌 واجهة API"
            />
          </div>
          {restaurant.api_enabled && (
            <p className="mt-3 text-xs text-faint">
              البوّابة مفتوحة — يولّد التاجر مفاتيحه من إعداداته (حتى خمسة)، وأنت
              لا ترى أسرارها. إغلاقها هنا يمنع توليد جديد؛ ولإيقاف مفتاح قائم
              فوراً أبطِله من لوحة التاجر.
            </p>
          )}
          <p className="mt-3 text-xs text-faint">
            الرابط ({restaurant.slug ?? "—"}) لا يُعدَّل من هنا: تغييره يكسر أكواد QR مطبوعة عند
            التاجر.
          </p>
        </Card>
      )}

      {/* الاشتراك */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-extrabold text-ink">📦 الاشتراك</h2>
        <Card>
          {!row.owner_id ? (
            <p className="text-sm text-dim">
              هذا المطعم بلا مالك مسجَّل، فلا يمكن ربط اشتراك به. (يظهر في تنبيهات الصحة.)
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <SubBadge m={row} />
                {activeSub && (
                  <span className="text-sm text-dim">
                    ينتهي {formatDate(activeSub.end_date)} · {activeSub.plan_id}
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[30, 90, 365].map((d) => (
                  <Button
                    key={d}
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      act(
                        `منح ${d} يوماً`,
                        () => grantSubscription(row.owner_id!, d),
                        () =>
                          logAudit("منح اشتراك", {
                            table: "subscriptions",
                            id: row.owner_id,
                            name: restaurant.name,
                            details: { days: d, plan: "standard" },
                          })
                      )
                    }
                  >
                    ＋ منح {d} يوماً
                  </Button>
                ))}
                {activeSub && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        act(
                          "تمديد ٣٠ يوماً",
                          () => extendSubscription(activeSub, 30),
                          () =>
                            logAudit("تمديد اشتراك", {
                              table: "subscriptions",
                              id: activeSub.id,
                              name: restaurant.name,
                              details: { days: 30 },
                            })
                        )
                      }
                    >
                      ⏩ تمديد ٣٠ يوماً
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        act(
                          "إلغاء الاشتراك",
                          () => cancelSubscription(activeSub.id),
                          () =>
                            logAudit("إلغاء اشتراك", {
                              table: "subscriptions",
                              id: activeSub.id,
                              name: restaurant.name,
                            })
                        )
                      }
                    >
                      إلغاء الاشتراك
                    </Button>
                  </>
                )}
              </div>
              <p className="mt-3 text-xs text-faint">
                الأثر يظهر عند التاجر فوراً في صفحة الاشتراك وفي قفل نشر المنيو — كلاهما يقرأ نفس
                الجدول.
              </p>
              {subs && subs.length > 1 && (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="text-xs font-bold text-dim">السجل</p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-xs text-faint">
                    {subs.map((s) => (
                      <li key={s.id}>
                        {s.plan_id} · حتى {formatDate(s.end_date)} ·{" "}
                        {s.active ? "نشط" : "منتهٍ/ملغى"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Card>
      </section>

      {/* قوائمه وأطباقه */}
      <section className="mt-8">
        <h2 className="inline-flex items-center gap-2 mb-3 font-display text-lg font-extrabold text-ink">
          <Icon name="plate" size={17} className="shrink-0 text-gold" />{" "}
          قوائمه وأطباقه</h2>
        {menus === null || dishes === null ? (
          <Skeleton className="h-32" />
        ) : menus.length === 0 ? (
          <Card className="text-center text-sm text-dim">لا توجد قوائم.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {menus.map((m) => {
              const mine = dishes.filter((d) => d.menu_id === m.id);
              return (
                <Card key={m.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-ink">
                      {m.name}{" "}
                      <span className="text-xs font-normal text-faint">
                        · {getTheme(m.theme).name}
                      </span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.active === false ? "red" : "green"}>
                        {m.active === false ? "معطّلة" : "مفعّلة"}
                      </Badge>
                      <Badge variant="neutral">{mine.length} طبق</Badge>
                    </div>
                  </div>
                  {mine.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {mine.slice(0, 12).map((d) => (
                        <li
                          key={d.id}
                          className="rounded-lg border border-line px-2 py-1 text-xs text-dim"
                        >
                          <DishGlyph value={d.emoji} size={16} /> {d.name} · {formatPrice(d.price ?? 0)}
                        </li>
                      ))}
                      {mine.length > 12 && (
                        <li className="px-2 py-1 text-xs text-faint">+{mine.length - 12}</li>
                      )}
                    </ul>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* منطقة الخطر */}
      <section className="mt-10">
        <Card className="border-bad/30">
          <h2 className="inline-flex items-center gap-2 font-display text-base font-extrabold text-bad">
          <Icon name="warn" size={17} className="shrink-0 text-gold" />{" "}
          منطقة الخطر</h2>
          <p className="mt-1.5 text-sm text-dim">
            حذف المطعم يمحو قوائمه ({menus?.length ?? 0}) وأطباقه ({dishes?.length ?? 0}) وبطاقات
            ولائه ({row.loyalty_count}) ورمز كاشيره وتحليلاته — نهائياً وبلا تراجع. حساب المالك
            نفسه لا يُحذف.
          </p>
          <Button variant="danger" className="mt-3" onClick={() => setDeleting(true)}>
            حذف المطعم نهائياً
          </Button>
        </Card>
      </section>

      <Modal open={deleting} onClose={() => setDeleting(false)} title="تأكيد الحذف النهائي">
        <p className="text-sm text-dim">
          اكتب اسم المطعم حرفياً للتأكيد: <span className="font-bold text-ink">{restaurant.name}</span>
        </p>
        <Input
          className="mt-3"
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder={restaurant.name}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(false)}>
            تراجع
          </Button>
          <Button
            variant="danger"
            disabled={busy || confirmName.trim() !== restaurant.name}
            onClick={doDelete}
          >
            احذف نهائياً
          </Button>
        </div>
      </Modal>
    </div>
  );
}
