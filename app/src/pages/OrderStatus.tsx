/**
 * `/o/:id` — صفحة متابعة الطلب.
 *
 * ═══ لماذا صفحة مستقلّة لا لوحة داخل المنيو ═══
 *
 * الزبون يدفع ثم يقفل الجوال ويجلس ينتظر. لوحةٌ داخل المنيو تختفي بأول
 * تحديث، ورقمٌ يُنسى. فالطلب يستحقّ **رابطاً**: يُحفظ في المتصفّح، يُرسَل
 * لمن سيستلم بدلاً عنه، ويُفتح مرّةً بعد مرّة فيجد صاحبه حالته الحيّة.
 *
 * ═══ الاستطلاع ═══
 *
 * `getOrderStatus` تقرأ الصفّ وحده — لا تسأل PayLink. سؤال البوّابة يقع
 * مرّة واحدة في `verifyOrder` عند العودة من الدفع؛ وبعدها كل نداء إليها
 * إهدارٌ لحصّة التاجر. والاستطلاع يتوقّف حين تُخفى الصفحة وحين يكتمل الطلب.
 *
 * ═══ بطابع المطعم لا بألوان المنصّة (٢٠٢٦/١٠/٢٦) ═══
 *
 * كانت بذهب كلاود منيو وخطّه — يخرج الزبون من منيو «محمصة» إلى صفحةٍ لا تشبه
 * المطعم الذي دفع له. الآن تقرأ طابع المطعم من رابطه (`restaurant_slug` في ردّ
 * الطلب ⇐ `getRestaurantBySlug` ⇐ `getActiveMenus`، استعلامان عامّان بأعمدة
 * صريحة) وتلبسه كما يلبسه المنيو: الصنف `m-skin-*` ومتغيّرات `--m-*` وورقة
 * `m-paper`. وفشلُ جلب الطابع **لا يحجب الطلب**: يسقط إلى الطابع الافتراضي.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getActiveMenus,
  getOrderStatus,
  getRestaurantBySlug,
  type OrderStatus as Status,
  type PublicOrder,
} from "@/lib/data";
import { cn, formatMoney, httpUrl } from "@/lib/utils";
import { vatAddedOnTop } from "@/lib/vat";
import { getTheme, skinClass } from "@/lib/themes";
import { loadThemeFont } from "@/lib/fonts";
import { Icon, type IconName } from "@/lib/icons";
import { LoyaltyProgress } from "@/components/menu/LoyaltyProgress";
import { ReviewNudge, TicketStub, wantsReview } from "@/components/menu/PickupTicket";

/** المراحل كما يعيشها الزبون. الإلغاء ليس مرحلة — لذلك خارج المسار. */
const STEPS: { key: Status; label: string; icon: IconName }[] = [
  { key: "new", label: "وصل المطعم", icon: "check" },
  { key: "preparing", label: "قيد التحضير", icon: "flame" },
  { key: "ready", label: "جاهز للاستلام", icon: "bell" },
  { key: "picked_up", label: "تم الاستلام", icon: "star" },
];

const HEADLINE: Record<string, { title: string; body: string }> = {
  new: { title: "وصل طلبك للمطعم", body: "سيبدأ التحضير بعد قليل." },
  preparing: { title: "طلبك قيد التحضير الآن", body: "لحظات ويجهز." },
  ready: { title: "طلبك جاهز!", body: "توجّه للكاشير وأرِه رقمك." },
  picked_up: { title: "تم الاستلام", body: "بالهناء والشفاء." },
  cancelled: { title: "أُلغي الطلب", body: "راجع المطعم إن خُصم المبلغ." },
};

/** ما يُقرأ من المطعم لهذه الصفحة: طابعه ورابط تقييمه — لا أكثر. */
type Brand = { themeId: string | null; reviewUrl: string | null };

function etaText(iso: string | null, status: Status): string | null {
  if (!iso || status === "picked_up" || status === "cancelled") return null;
  const mins = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (status === "ready") return null;
  if (mins <= 0) return "متوقّع خلال لحظات";
  if (mins === 1) return "متوقّع خلال دقيقة";
  return `متوقّع خلال ${mins} دقيقة`;
}

export default function OrderStatusPage() {
  const { id = "" } = useParams();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  /** `undefined` يُجلب الآن · `null` لا طابع (فشل أو لا رابط) ⇒ الافتراضي. */
  const [brand, setBrand] = useState<Brand | null | undefined>(undefined);
  const busy = useRef(false);

  const load = useCallback(async () => {
    if (busy.current || !id) return;
    busy.current = true;
    try {
      const row = await getOrderStatus(id);
      if (row) {
        setOrder(row);
        setState("ok");
      } else {
        setState((prev) => (prev === "ok" ? "ok" : "missing"));
      }
    } catch {
      // فشل شبكة لا يمسح ما على الشاشة.
    } finally {
      busy.current = false;
    }
  }, [id]);

  useEffect(() => {
    document.title = "متابعة الطلب — كلاود منيو";
    load();
  }, [load]);

  const done = order?.status === "picked_up" || order?.status === "cancelled";
  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 10000);
    const onShow = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [load, done]);

  /**
   * طابع المطعم — مرّةً واحدة لكل رابط، لا مع كل استطلاع.
   *
   * ⚠️ **الطابع زينة والطلب هو الصفحة**: فشلُ الجلب يُسقط إلى الافتراضي ولا
   * يُبلَّغ — ومهلةٌ قصيرة تمنع شبكةً بطيئة من حبس رقم الاستلام خلف لونٍ.
   */
  const slug = order?.restaurant_slug ?? null;
  useEffect(() => {
    if (state !== "ok") return;
    if (!slug) {
      setBrand(null);
      return;
    }
    let alive = true;
    const giveUp = window.setTimeout(() => alive && setBrand((b) => (b === undefined ? null : b)), 2500);
    (async () => {
      try {
        const restaurant = await getRestaurantBySlug(slug);
        if (!restaurant) throw new Error("no restaurant");
        const menus = await getActiveMenus(restaurant.id);
        if (!alive) return;
        setBrand({
          themeId: menus.find((m) => m.theme)?.theme ?? null,
          // نفس شرط زرّ الترويسة في المنيو: `!== false` لأن القديم `null`.
          reviewUrl:
            restaurant.reviews_enabled !== false && restaurant.google_review_url?.trim()
              ? httpUrl(restaurant.google_review_url)
              : null,
        });
      } catch {
        if (alive) setBrand(null);
      } finally {
        window.clearTimeout(giveUp);
      }
    })();
    return () => {
      alive = false;
      window.clearTimeout(giveUp);
    };
  }, [slug, state]);

  const theme = useMemo(() => getTheme(brand?.themeId ?? null), [brand?.themeId]);
  useEffect(() => {
    if (brand === undefined) return;
    void loadThemeFont(theme.vars["--m-font"]);
    void loadThemeFont(theme.vars["--m-display"]);
  }, [theme.vars, brand]);
  // أرضية الطابع تحت الصفحة كلّها — كما في المنيو، فلا يلمع لون المنصّة عند السحب.
  const pageBg = theme.vars["--m-page"] ?? theme.vars["--m-bg"];
  useEffect(() => {
    if (brand === undefined || !pageBg) return;
    const prev = document.body.style.backgroundColor;
    document.body.style.backgroundColor = pageBg;
    return () => {
      document.body.style.backgroundColor = prev;
    };
  }, [pageBg, brand]);

  if (state === "loading" || (state === "ok" && brand === undefined)) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5">
        <p className="text-sm text-muted">نجلب طلبك…</p>
      </main>
    );
  }

  if (state === "missing" || !order) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-5 text-center">
        <span className="text-muted">
          <Icon name="search" size={36} />
        </span>
        <h1 className="text-lg font-black text-ink">لم نجد هذا الطلب</h1>
        <p className="text-sm text-muted">
          تأكّد من الرابط. وإن كنت دفعت للتوّ فقد يستغرق التأكيد لحظات — حدّث
          الصفحة.
        </p>
        <button onClick={load} className="mt-1 text-sm font-bold text-gold underline">
          تحديث
        </button>
      </main>
    );
  }

  const head = HEADLINE[order.status] ?? HEADLINE.new;
  const eta = etaText(order.ready_eta, order.status);
  const activeIndex = STEPS.findIndex((s) => s.key === order.status);
  const cancelled = order.status === "cancelled";
  const vatAdded = vatAddedOnTop(order.total, order.items);
  const reviewUrl = brand?.reviewUrl ?? null;

  return (
    <div
      dir="rtl"
      className={cn("min-h-dvh", skinClass(theme.design))}
      style={
        {
          ...theme.vars,
          backgroundColor: "var(--m-page, var(--m-bg))",
          color: "var(--m-text)",
          // خطّ المنيو نفسه — لا خطّ المنصّة (انظر جذر `MenuPage`).
          fontFamily: "var(--font-tajawal)",
        } as CSSProperties
      }
    >
      {/* ‏`m-paper`: ورقة الفاتورة ولبّاد لوحة الحروف — بدونها يقع نصّ لوحة
          الحروف الفاتح على جدار البلاط الفاتح. وفي بقية الطوابع غلافٌ بلا أثر. */}
      <div className="m-paper">
        <main className="m-order mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
          {/* رقم الاستلام — أكبر شيء في الصفحة عمداً: هو ما يُنادى به. */}
          <TicketStub code={order.code} restaurant={order.restaurant} en={false} cancelled={cancelled} size="xl" />

          <section className="m-o-card px-4 py-4">
            <h1 className="m-o-title text-base font-black" style={{ color: "var(--m-text)" }}>
              {head.title}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: "var(--m-muted)" }}>
              {head.body}
            </p>
            {eta && (
              <p className="m-o-chip mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold" style={{ color: "var(--m-text)" }}>
                <span style={{ color: "var(--m-accent-ink, var(--m-accent))" }}>
                  <Icon name="clock" size={13} />
                </span>
                {eta}
              </p>
            )}

            {!cancelled && (
              <ol className="mt-4 flex flex-col gap-0">
                {STEPS.map((step, i) => {
                  const reached = i <= activeIndex;
                  const current = i === activeIndex;
                  return (
                    <li key={step.key} className="flex items-stretch gap-3">
                      <div className="flex flex-col items-center">
                        {/* المرحلة المبلوغة «مختارة»: بلون العلامة وعليها لونها المقروء. */}
                        <span className={`m-o-step-dot flex h-7 w-7 items-center justify-center ${reached ? "m-o-badge-on" : ""}`}>
                          <Icon name={step.icon} size={13} />
                        </span>
                        {i < STEPS.length - 1 && (
                          <span
                            className="w-0.5 flex-1"
                            style={{
                              minHeight: 18,
                              background: i < activeIndex ? "var(--m-accent)" : "var(--m-line, var(--m-border))",
                            }}
                          />
                        )}
                      </div>
                      <p
                        className={`pb-3 pt-1 text-sm ${current ? "font-black" : ""}`}
                        style={{ color: current ? "var(--m-text)" : "var(--m-muted)" }}
                      >
                        {step.label}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {reviewUrl && wantsReview(order.status) && <ReviewNudge url={reviewUrl} en={false} />}

          <section className="m-o-card px-4 py-4">
            <h2 className="m-o-title text-sm font-black" style={{ color: "var(--m-text)" }}>
              تفاصيل الطلب
            </h2>
            <ul className="mt-2 flex flex-col gap-1.5">
              {order.items.map((item, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1" style={{ color: "var(--m-text)" }}>
                    <span className="m-o-num font-bold">{item.qty}×</span> {item.name}
                    {item.options ? (
                      <span className="text-xs" style={{ color: "var(--m-muted)" }}>
                        {" "}
                        — {item.options}
                      </span>
                    ) : null}
                  </span>
                  <span className="m-o-num shrink-0" style={{ color: "var(--m-muted)" }}>
                    {formatMoney(item.line_total)}
                  </span>
                </li>
              ))}
            </ul>
            {/* الولاء قبل الإجمالي: هذه الصفحة يفتحها الزبون مرّاتٍ وهو ينتظر
                طلبه — وهي أطول لحظة انتباه في رحلته. */}
            {order.loyalty && <LoyaltyProgress loyalty={order.loyalty} en={false} />}

            {vatAdded > 0 && (
              <div className="mt-3 flex items-baseline justify-between text-sm" style={{ color: "var(--m-muted)" }}>
                <span>ضريبة القيمة المضافة ١٥٪</span>
                <span className="m-o-num">{formatMoney(vatAdded)}</span>
              </div>
            )}

            <div className="m-o-total mt-3 flex items-baseline justify-between pt-3" style={{ color: "var(--m-text)" }}>
              <span className="m-o-title text-sm font-black">الإجمالي</span>
              <span className="m-o-num text-sm font-black">{formatMoney(order.total)}</span>
            </div>
            {/* ⚠️ لا «شامل الضريبة» هنا أبداً: الادّعاء يشترط رقماً ضريبياً صالحاً،
                و`order_public_status` لا تُرجع الرقم (وإرجاعه هجرة). فلا يبقى إلا
                ما يُثبته الطلب نفسه: ضريبةٌ أُضيفت فوق البنود، ومبلغها أعلاه. */}
            {vatAdded > 0 && (
              <p className="mt-1 text-[11px]" style={{ color: "var(--m-muted)" }}>
                الأسعار غير شاملة — أُضيفت الضريبة أعلاه
              </p>
            )}
          </section>

          {(order.address || order.maps || order.restaurant_phone) && (
            <section className="m-o-card px-4 py-4">
              <h2 className="m-o-title text-sm font-black" style={{ color: "var(--m-text)" }}>
                الاستلام من الفرع
              </h2>
              {order.address && (
                <p className="mt-1 text-sm" style={{ color: "var(--m-muted)" }}>
                  {order.address}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {order.maps && (
                  <a
                    href={httpUrl(order.maps)}
                    target="_blank"
                    rel="noreferrer"
                    className="m-o-ghost inline-flex min-h-10 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                  >
                    <Icon name="pin" size={13} /> الاتجاهات
                  </a>
                )}
                {order.restaurant_phone && (
                  <a
                    href={`tel:${order.restaurant_phone.replace(/[^\d+]/g, "")}`}
                    className="m-o-ghost inline-flex min-h-10 items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                  >
                    <Icon name="bell" size={13} /> اتصل بالمطعم
                  </a>
                )}
              </div>
            </section>
          )}

          {order.restaurant_slug && (
            <Link
              to={`/${order.restaurant_slug}`}
              className="py-2 text-center text-sm font-bold underline underline-offset-4"
              style={{ color: "var(--m-text)" }}
            >
              العودة لمنيو {order.restaurant}
            </Link>
          )}
        </main>
      </div>
    </div>
  );
}
