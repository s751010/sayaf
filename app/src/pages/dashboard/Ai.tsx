/** المستشار الذكي — المجلس الاستشاري (٧ شخصيات) عبر ai-proxy. */
import { useEffect, useRef, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { askAI } from "@/lib/api";
import { PERSONAS, buildSystemPrompt } from "@/lib/personas";
import { cn } from "@/lib/utils";
import { useDashboard, UpgradeGate } from "./Dashboard";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "كيف أزيد مبيعات العشاء في أيام الأسبوع؟",
  "هل أسعاري مناسبة لمطعم برجر في الرياض؟",
  "أعطني ٣ أفكار محتوى لإنستغرام هذا الأسبوع",
];

export default function Ai() {
  const { ent } = useDashboard();
  const [personaId, setPersonaId] = useState("all");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = "المستشار الذكي — كلاود منيو";
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const persona = PERSONAS.find((p) => p.id === personaId)!;

  if (!ent.ai) {
    return (
      <div>
        <h1 className="font-display text-2xl font-black text-ink">المستشار الذكي</h1>
        <UpgradeGate
          title="المستشار الذكي متاح في باقة الاحترافية"
          desc="مجلس استشاري كامل: تسويق، مالية، تقنية، ونمو — يجيب عن أسئلة مطعمك على مدار الساعة."
        />
      </div>
    );
  }

  async function send(text?: string) {
    const q = (text ?? input).trim();
    if (!q || pending) return;
    const history: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(history);
    setInput("");
    setPending(true);
    // نرسل آخر ١٠ رسائل حتى يحتفظ المستشار بسياق الحوار.
    const res = await askAI(buildSystemPrompt(personaId), history.slice(-10));
    setMessages((m) => [
      ...m,
      { role: "assistant", content: res.text ?? res.error ?? "حدث خطأ." },
    ]);
    setPending(false);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink">المستشار الذكي</h1>
      <p className="mt-1 text-sm text-dim">اختر عضو المجلس واسأله عن أي تحدٍّ في مطعمك.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[230px_1fr]">
        {/* الشخصيات */}
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersonaId(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                personaId === p.id
                  ? "border-gold/40 bg-gold/10 text-ink"
                  : "border-line text-dim hover:bg-ink/5"
              )}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-base"
                style={{ background: `${p.color}22` }}
              >
                {p.emoji}
              </span>
              <span className="font-bold">{p.name}</span>
              <span className="hidden text-xs text-faint lg:inline">· {p.role}</span>
            </button>
          ))}
        </div>

        {/* المحادثة */}
        <Card className="flex min-h-[60vh] flex-col p-4">
          <div className="mb-3 flex items-center gap-2.5 border-b border-line pb-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
              style={{ background: `${persona.color}22` }}
            >
              {persona.emoji}
            </span>
            <div>
              <p className="font-bold text-ink">{persona.name}</p>
              <p className="text-xs text-dim">{persona.role}</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
                <p className="text-sm text-faint">اسأل {persona.name} عن أي شيء — أو جرّب:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-line px-4 py-1.5 text-xs text-dim hover:border-gold/40 hover:text-gold"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ms-auto bg-gold text-on-gold"
                    : "bg-panel2 text-ink"
                )}
              >
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 text-sm text-faint">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: `${persona.color}22` }}
                >
                  {persona.emoji}
                </span>
                يكتب…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="mt-3 flex gap-2 border-t border-line pt-3"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك…"
            />
            <Button type="submit" disabled={pending || !input.trim()} aria-label="إرسال">
              ↑
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
