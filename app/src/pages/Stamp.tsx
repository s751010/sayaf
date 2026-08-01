/**
 * وضع الكاشير `/stamp` — ختم بطاقات الولاء بصلاحية محدودة.
 *
 * التاجر قال: «أنا المالك، بس اللي بيختم بطاقات الولاء هو الكاشير. ما أبي
 * أعطيه حسابي كامل — يقدر يحذف كل الأطباق.»
 *
 * فلا حساب هنا ولا جلسة: رمز من ٦ خانات يولّده المالك، وكل عملية تمرّ من دالة
 * `staff_stamp` في قاعدة البيانات. الرمز لا يفتح شيئاً غير البحث عن زبون وختم
 * بطاقته وصرف مكافأته — لا أطباق ولا إعدادات ولا قائمة زبائن.
 *
 * الشاشة مصمّمة لجوال خلف الكاشير: أزرار كبيرة وخطوة واحدة ظاهرة في كل مرة.
 */
import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Logo } from "@/components/site";
import { Button, Card, ErrorNote, Field, Input, Spinner, ThemeToggle } from "@/components/ui";
import { staffAction, type StaffCustomer } from "@/lib/data";
import { K, getJSON, removeItem, setJSON } from "@/lib/storage";

type Saved = { slug: string; pin: string };

const ERRORS: Record<string, string> = {
  not_found: "لا يوجد مطعم بهذا الرابط. تأكد من الرابط الذي أعطاك إياه صاحب المطعم.",
  no_pin: "لم يفعّل صاحب المطعم وضع الكاشير بعد.",
  bad_pin: "الرمز غير صحيح.",
  locked: "أُقفل الإدخال مؤقتاً بعد محاولات خاطئة كثيرة. راجع صاحب المطعم لتبديل الرمز.",
  short_query: "اكتب ٣ أحرف على الأقل للبحث.",
  customer_not_found: "لم نجد هذا الزبون.",
  not_enough: "لم تكتمل أختام البطاقة بعد.",
  bad_action: "طلب غير مفهوم.",
};

function msg(error?: string): string {
  return (error && ERRORS[error]) || "تعذّرت العملية. حاول مجدداً.";
}

export default function Stamp() {
  const [params] = useSearchParams();
  const [saved, setSaved] = useState<Saved | null>(() => getJSON<Saved>(K.STAFF, true));
  const [slug, setSlug] = useState(params.get("m") ?? "");
  const [pin, setPin] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StaffCustomer[] | null>(null);
  const [picked, setPicked] = useState<StaffCustomer | null>(null);
  const [info, setInfo] = useState<{ goal: number; reward: string | null; name: string } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "ختم بطاقات الولاء — كلاود منيو";
  }, []);

  function signOut() {
    removeItem(K.STAFF, true);
    setSaved(null);
    setResults(null);
    setPicked(null);
    setInfo(null);
    setQuery("");
    setPin("");
  }

  /** الدخول = أول بحث ناجح؛ لا «تسجيل دخول» منفصل يخفي خطأ الرمز للحظة. */
  async function unlock(e: FormEvent) {
    e.preventDefault();
    const s = slug.trim().replace(/^.*\//, "");
    const p = pin.trim().toUpperCase();
    if (!s || !p) return setError("أدخل رابط المطعم والرمز.");
    setBusy(true);
    setError("");
    try {
      // بحث فارغ المعنى لكنه يتحقّق من الرمز قبل حفظه.
      const res = await staffAction({ slug: s, pin: p, action: "lookup", query: "___" });
      if (!res.ok && res.error !== "short_query") return setError(msg(res.error));
      const next = { slug: s, pin: p };
      setJSON(K.STAFF, next, true);
      setSaved(next);
      setPin("");
    } catch {
      setError("تعذّر الاتصال. تحقّق من الإنترنت.");
    } finally {
      setBusy(false);
    }
  }

  async function search(e: FormEvent) {
    e.preventDefault();
    if (!saved) return;
    setBusy(true);
    setError("");
    setNotice("");
    setPicked(null);
    try {
      const res = await staffAction({ ...saved, action: "lookup", query: query.trim() });
      if (!res.ok) {
        if (res.error === "bad_pin" || res.error === "no_pin") signOut();
        return setError(msg(res.error));
      }
      setResults(res.customers ?? []);
      setInfo({ goal: res.goal ?? 5, reward: res.reward ?? null, name: res.restaurant ?? "" });
    } catch {
      setError("تعذّر الاتصال. تحقّق من الإنترنت.");
    } finally {
      setBusy(false);
    }
  }

  async function act(action: "stamp" | "redeem", c: StaffCustomer) {
    if (!saved) return;
    if (action === "redeem" && !window.confirm(`صرف المكافأة لـ${c.name ?? "الزبون"}؟`)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await staffAction({ ...saved, action, customerId: c.id });
      if (!res.ok) return setError(msg(res.error));
      const updated = res.customer!;
      setPicked(updated);
      setResults((rs) => rs?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
      const goal = res.goal ?? info?.goal ?? 5;
      setNotice(
        action === "redeem"
          ? "صُرفت المكافأة ✓"
          : updated.stamps >= goal
            ? `🎉 اكتملت البطاقة — يستحق ${res.reward ?? "المكافأة"}!`
            : `خُتمت الزيارة ✓ (${updated.stamps} من ${goal})`
      );
    } catch {
      setError("تعذّر الاتصال. تحقّق من الإنترنت.");
    } finally {
      setBusy(false);
    }
  }

  /* ── شاشة إدخال الرمز ─────────────────────────────────────────────── */
  if (!saved) {
    return (
      <Shell>
        <Card className="p-7">
          <h1 className="font-display text-xl font-black text-ink">ختم بطاقات الولاء 💛</h1>
          <p className="mt-1 text-sm text-dim">
            أدخل الرمز الذي أعطاك إياه صاحب المطعم. هذه الشاشة تختم البطاقات فقط.
          </p>
          <form onSubmit={unlock} className="mt-6 flex flex-col gap-4">
            <Field label="رابط المطعم" hint="الجزء الأخير من رابط المنيو، مثال: aldiwan">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                dir="ltr"
                placeholder="aldiwan"
                autoCapitalize="off"
                required
              />
            </Field>
            <Field label="رمز الكاشير">
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                dir="ltr"
                placeholder="ABC123"
                autoComplete="off"
                className="text-center text-2xl font-black tracking-[0.3em]"
                maxLength={12}
                required
              />
            </Field>
            {error && <ErrorNote>{error}</ErrorNote>}
            <Button type="submit" disabled={busy} className="w-full py-3.5 text-base">
              {busy ? <Spinner className="h-4 w-4 border-on-gold" /> : "ابدأ"}
            </Button>
          </form>
        </Card>
      </Shell>
    );
  }

  /* ── شاشة العمل ───────────────────────────────────────────────────── */
  const goal = info?.goal ?? 5;
  return (
    <Shell>
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-lg font-black text-ink">
              {info?.name || "ختم البطاقات"}
            </h1>
            <p className="text-xs text-faint">وضع الكاشير · صلاحية الختم فقط</p>
          </div>
          <button onClick={signOut} className="text-xs font-bold text-dim hover:text-bad">
            إنهاء
          </button>
        </div>

        <form onSubmit={search} className="mt-5 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="رمز البطاقة، آخر أرقام الجوال، أو الاسم"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={busy} className="px-5">
            {busy ? <Spinner className="h-4 w-4 border-on-gold" /> : "بحث"}
          </Button>
        </form>

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}
        {notice && (
          <p className="mt-4 rounded-xl border border-good/30 bg-good/10 px-4 py-3 text-center text-sm font-bold text-good">
            {notice}
          </p>
        )}

        {results !== null && results.length === 0 && !error && (
          <p className="mt-5 rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-faint">
            لا يوجد زبون بهذا البحث. اطلب منه رمز بطاقته من صفحة المنيو.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3">
          {(results ?? []).map((c) => {
            const shown = picked?.id === c.id ? picked : c;
            const complete = shown.stamps >= goal;
            return (
              <div key={c.id} className="rounded-2xl border border-line bg-panel2 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-bold text-ink">{shown.name || "زبون"}</p>
                  <span className="text-xs text-faint" dir="ltr">
                    {shown.card_code} · ****{shown.phone_tail}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...Array(goal)].map((_, i) => (
                    <span
                      key={i}
                      className={
                        i < shown.stamps
                          ? "flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm text-on-gold"
                          : "flex h-7 w-7 items-center justify-center rounded-full border border-line text-sm text-faint"
                      }
                    >
                      {i < shown.stamps ? "★" : ""}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-dim">
                  {shown.stamps} من {goal} · {shown.total_visits} زيارة
                  {info?.reward && ` · المكافأة: ${info.reward}`}
                </p>

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => act("stamp", c)}
                    disabled={busy}
                    className="flex-1 py-3 text-base"
                  >
                    ＋ ختم زيارة
                  </Button>
                  {complete && (
                    <Button
                      variant="outline"
                      onClick={() => act("redeem", c)}
                      disabled={busy}
                      className="flex-1 py-3 text-base"
                    >
                      🎁 صرف المكافأة
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow-bg flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/" aria-label="الرئيسية">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-2">
        <div className="anim-fade-up w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
