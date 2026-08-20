/**
 * بطاقة الولاء داخل صفحة المنيو — انضمام الزبون ومتابعة طوابعه.
 *
 * البطاقة تُحفظ **محلياً** بمفتاح `cm2_loyalty_<id>`: الزبون بلا حساب، فلا
 * سبيل لربطه بصفّه في القاعدة إلا بما يبقى على جهازه.
 */
import { useEffect, useState } from "react";
import { mFont } from "@/components/menu/chrome";
import { getLoyaltyCustomer, joinLoyalty } from "@/lib/data";
import { getJSON, setJSON } from "@/lib/storage";
import type { LoyaltyCustomer, Restaurant } from "@/lib/types";

type LocalCard = { id: string; name: string };

export function LoyaltyCard({ restaurant, en }: { restaurant: Restaurant; en: boolean }) {
  const storeKey = `cm2_loyalty_${restaurant.id}`;
  const [card, setCard] = useState<LocalCard | null>(() => getJSON<LocalCard>(storeKey));
  const [customer, setCustomer] = useState<LoyaltyCustomer | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (card) getLoyaltyCustomer(card.id).then(setCustomer).catch(() => {});
  }, [card]);

  // الهدف يأتي من قاعدة البيانات وقد يكون سالباً أو كسرياً في صفوف قديمة/مستوردة،
  // و`Array(-1)` يرمي RangeError فيُسقط منيو الزبون كاملاً. نحصره في مدى معقول.
  const goal = Math.min(20, Math.max(1, Math.round(restaurant.loyalty_goal ?? 5)));
  const stamps = customer?.stamps ?? 0;

  async function join() {
    if (!name.trim()) return setMsg(en ? "Enter your name" : "أدخل اسمك");
    if (!phone.trim()) return setMsg(en ? "Enter your phone" : "أدخل رقم جوالك");
    setBusy(true);
    setMsg("");
    try {
      const c = await joinLoyalty({
        restaurant_id: restaurant.id,
        name: name.trim(),
        phone: phone.trim(),
      });
      const local = { id: c.id, name: c.name ?? name.trim() };
      setJSON(storeKey, local);
      setCard(local);
      setCustomer(c);
    } catch {
      setMsg(en ? "Couldn't join. Try again." : "تعذّر الانضمام. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="mx-auto mt-8 w-full max-w-md border p-5"
      style={{
        borderColor: "var(--m-border)",
        background: "var(--m-surface)",
        borderRadius: "calc(var(--m-radius) * 1.2)",
      }}
    >
      <p className="text-center font-black" style={{ color: "var(--m-text)", ...mFont }}>
        💛 {en ? "Loyalty Card" : "بطاقة الولاء"}
      </p>
      <p className="mt-1 text-center text-xs" style={{ color: "var(--m-muted)" }}>
        {en
          ? `${goal} visits → ${restaurant.loyalty_reward ?? "a reward"}`
          : `${goal} زيارات → ${restaurant.loyalty_reward ?? "مكافأة"}`}
      </p>

      {!card ? (
        <div className="mt-4 flex flex-col gap-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={en ? "Your name" : "اسمك"}
            className="min-h-11 rounded-xl border bg-transparent px-3.5 py-2.5 text-sm"
            style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
            placeholder={en ? "Phone number" : "رقم الجوال"}
            dir="ltr"
            inputMode="tel"
            className="min-h-11 rounded-xl border bg-transparent px-3.5 py-2.5 text-sm"
            style={{ borderColor: "var(--m-border)", color: "var(--m-text)" }}
          />
          {msg && (
            <p className="text-center text-xs" style={{ color: "var(--m-accent)" }}>
              {msg}
            </p>
          )}
          <button
            onClick={join}
            disabled={busy}
            className="min-h-11 rounded-xl py-2.5 text-sm font-black disabled:opacity-50"
            style={{ background: "var(--m-accent)", color: "var(--m-on-accent)" }}
          >
            {busy ? "…" : en ? "Join now" : "انضم الآن"}
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[...Array(goal)].map((_, i) => (
              <span
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border text-sm"
                style={
                  i < stamps
                    ? { background: "var(--m-accent)", color: "var(--m-on-accent)", borderColor: "var(--m-accent)" }
                    : { borderColor: "var(--m-border)", color: "var(--m-muted)" }
                }
              >
                {i < stamps ? "✓" : i + 1}
              </span>
            ))}
          </div>
          <p className="mt-3 text-center text-xs" style={{ color: "var(--m-muted)" }}>
            {stamps >= goal
              ? en
                ? "🎉 Reward unlocked! Show this to the staff."
                : "🎉 استحققت المكافأة! أرِ هذه البطاقة لموظف المطعم."
              : en
                ? `${goal - stamps} visits left — staff stamps your card on each visit.`
                : `باقي ${goal - stamps} زيارة — الموظف يختم بطاقتك عند كل زيارة.`}
          </p>
          <p className="mt-2 text-center text-xs" style={{ color: "var(--m-muted)" }}>
            {en ? "Card holder:" : "صاحب البطاقة:"} {card.name}
          </p>
        </div>
      )}
    </section>
  );
}

/* ── الصفحة ───────────────────────────────────────────────────────── */
