/** الولاء (لوحة التاجر): قائمة العملاء + ختم الزيارات + صرف المكافآت. */
import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  SavedBadge,
  Skeleton,
  useToast,
} from "@/components/ui";
import { CashierCard } from "@/components/CashierCard";
import { getLoyaltyCustomers, redeemLoyalty, setupLoyalty, stampLoyalty } from "@/lib/data";
import { normalizeDigits } from "@/lib/utils";
import type { LoyaltyCustomer } from "@/lib/types";
import { useDashboard } from "./Dashboard";
import { InsightTabs } from "./Tabs";

export default function Loyalty() {
  const { restaurant, setRestaurant } = useDashboard();
  const toast = useToast();
  const [customers, setCustomers] = useState<LoyaltyCustomer[] | null>(null);
  const [q, setQ] = useState("");
  const [setupGoal, setSetupGoal] = useState(String(restaurant.loyalty_goal ?? 5));
  const [setupReward, setSetupReward] = useState(restaurant.loyalty_reward ?? "");
  const [activating, setActivating] = useState(false);

  async function activate() {
    const g = Number(normalizeDigits(setupGoal));
    if (!setupReward.trim()) return toast("اكتب المكافأة أولاً.", "err");
    setActivating(true);
    const patch = {
      enabled: true,
      goal: Number.isFinite(g) ? g : 5,
      reward: setupReward.trim(),
    };
    try {
      await setupLoyalty(restaurant.id, patch);
      setRestaurant({
        ...restaurant,
        loyalty_enabled: true,
        loyalty_goal: Math.min(20, Math.max(1, Math.round(patch.goal))),
        loyalty_reward: patch.reward,
      });
      toast(restaurant.loyalty_enabled ? "حُفظ ✓" : "💛 فُعّلت بطاقة الولاء — ظاهرة لزبائنك الآن.");
    } catch {
      toast("تعذّر التفعيل. حاول مجدداً.", "err");
    } finally {
      setActivating(false);
    }
  }

  useEffect(() => {
    document.title = "الولاء — كلاود منيو";
    getLoyaltyCustomers(restaurant.id).then(setCustomers).catch(() => setCustomers([]));
  }, [restaurant.id]);

  const goal = Math.min(20, Math.max(1, Math.round(restaurant.loyalty_goal ?? 5)));
  /** تعديل غير محفوظ في حقلَي الهدف والمكافأة. */
  const settingsDirty =
    Number(normalizeDigits(setupGoal)) !== goal ||
    setupReward.trim() !== (restaurant.loyalty_reward ?? "").trim();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers ?? [];
    return (customers ?? []).filter((c) =>
      [c.name, c.phone, c.card_code].filter(Boolean).some((v) => v!.toLowerCase().includes(s))
    );
  }, [customers, q]);

  async function stamp(c: LoyaltyCustomer) {
    try {
      const updated = await stampLoyalty(c);
      if (updated) {
        setCustomers((cs) => cs?.map((x) => (x.id === c.id ? updated : x)) ?? null);
        toast(`ختم لـ${updated.name ?? "العميل"} — ${updated.stamps}/${goal} ✓`);
      }
    } catch {
      toast("تعذّر الختم.", "err");
    }
  }

  async function redeem(c: LoyaltyCustomer) {
    if (!window.confirm(`صرف مكافأة «${restaurant.loyalty_reward ?? "المكافأة"}» لـ${c.name ?? "العميل"}؟ ستُصفَّر أختامه.`)) return;
    try {
      const updated = await redeemLoyalty(c);
      if (updated) {
        setCustomers((cs) => cs?.map((x) => (x.id === c.id ? updated : x)) ?? null);
        toast("🎉 صُرفت المكافأة!");
      }
    } catch {
      toast("تعذّر الصرف.", "err");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-ink">الولاء</h1>
          <p className="mt-1 text-sm text-dim">{customers?.length ?? "…"} عميل في البرنامج</p>
        </div>
        <Badge variant={restaurant.loyalty_enabled ? "green" : "neutral"}>
          {restaurant.loyalty_enabled ? "مفعّل للزبائن" : "غير مفعّل"}
        </Badge>
      </div>

      <InsightTabs />

      {/* ⚠️ التفعيل هنا لا في الإعدادات — انظر `setupLoyalty`: من فتح هذه
          الصفحة جاء ليفعّل، فإرساله لصفحة أخرى هو ما جعل ١٨ من ١٩ لا يفعّلون. */}
      {!restaurant.loyalty_enabled ? (
        <Card className="mt-5 flex flex-col gap-4 border-gold/40">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">
              💛 فعّل بطاقة الولاء
            </h2>
            <p className="mt-1 text-sm text-dim">
              بطاقة أختام رقمية تظهر أسفل منيوك. الزبون ينضم بنفسه من جواله،
              وموظفك يختم له بضغطة — سبب يرجّعه إليك بدل المطعم المجاور.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عدد الزيارات للمكافأة">
              <Input
                type="number"
                inputMode="numeric"
                min="2"
                max="20"
                dir="ltr"
                value={setupGoal}
                onChange={(e) => setSetupGoal(e.target.value)}
              />
            </Field>
            <Field label="المكافأة" hint="اكتبها كما يفهمها زبونك">
              <Input
                value={setupReward}
                onChange={(e) => setSetupReward(e.target.value)}
                placeholder="قهوة مجانية"
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={activate} disabled={activating}>
              {activating ? "جارٍ التفعيل…" : "فعّل الآن"}
            </Button>
            <span className="text-xs text-faint">
              يظهر للزبائن فوراً في منيوك — وتقدر تطفئه متى شئت.
            </span>
          </div>
        </Card>
      ) : (
        /**
         * التعديل هنا لا برابط إلى الإعدادات.
         *
         * ⚠️ كان الرابط يشير إلى قسم الولاء في «الإعدادات» — وقد كان **مكرّراً**
         * هناك بحقول قد تتعارض مع هذه. حُذف ذلك القسم فصار الرابط يرسل التاجر
         * إلى صفحة لا يجد فيها ما جاء له. الحقلان صارا هنا حيث يستعملهما.
         */
        <Card className="mt-5 flex flex-col gap-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عدد الزيارات للمكافأة">
              <Input
                type="number"
                inputMode="numeric"
                min="2"
                max="20"
                dir="ltr"
                value={setupGoal}
                onChange={(e) => setSetupGoal(e.target.value)}
              />
            </Field>
            <Field label="المكافأة">
              <Input
                value={setupReward}
                onChange={(e) => setSetupReward(e.target.value)}
                placeholder="قهوة مجانية"
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={activate} disabled={activating || !settingsDirty}>
              {activating ? "جارٍ الحفظ…" : "حفظ"}
            </Button>
            <SavedBadge dirty={settingsDirty} />
            <span className="ms-auto text-xs text-faint">
              حالياً: مكافأة بعد <b className="text-dim">{goal}</b> زيارات
            </span>
          </div>
        </Card>
      )}

      {/* رمز الكاشير بلا معنى قبل التفعيل — لا بطاقات ليختمها. */}
      {restaurant.loyalty_enabled && <CashierCard restaurant={restaurant} />}

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="🔍 ابحث بالاسم أو الجوال أو رمز البطاقة…"
        className="mt-5"
      />

      {customers === null ? (
        <div className="mt-5 flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            emoji="💛"
            title={q ? "لا نتائج" : "لا يوجد عملاء بعد"}
            desc={q ? undefined : "الزبائن ينضمون من صفحة المنيو — عند كل زيارة اختم بطاقتهم من هنا."}
          />
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-2.5">
          {filtered.map((c) => {
            const stamps = c.stamps ?? 0;
            const complete = stamps >= goal;
            return (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="font-bold text-ink">
                    {c.name ?? "عميل"}{" "}
                    {c.card_code && (
                      <span className="text-xs font-normal text-faint" dir="ltr">#{c.card_code}</span>
                    )}
                  </p>
                  <p className="text-xs text-faint" dir="ltr">{c.phone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={complete ? "gold" : "neutral"}>
                    {complete ? "🎁 يستحق المكافأة" : `${stamps}/${goal} ختم`}
                  </Badge>
                  <span className="text-xs text-faint">إجمالي {c.total_visits ?? 0} زيارة</span>
                  {complete ? (
                    <Button className="px-3 py-1.5 text-xs" onClick={() => redeem(c)}>
                      صرف المكافأة
                    </Button>
                  ) : (
                    <Button variant="outline" className="px-3 py-1.5 text-xs" onClick={() => stamp(c)}>
                      ＋ ختم زيارة
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
