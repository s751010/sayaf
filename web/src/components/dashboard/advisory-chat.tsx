"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { PERSONAS } from "@/lib/personas";
import { askAdvisor } from "@/app/dashboard/ai/actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "advisor"; text: string };

export function AdvisoryChat() {
  const [personaId, setPersonaId] = useState("all");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);

  const persona = PERSONAS.find((p) => p.id === personaId)!;

  async function send() {
    const q = input.trim();
    if (!q || pending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setPending(true);
    const res = await askAdvisor(personaId, q);
    setMessages((m) => [
      ...m,
      { role: "advisor", text: res.reply ?? res.error ?? "حدث خطأ." },
    ]);
    setPending(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Persona picker */}
      <div className="flex flex-wrap gap-2 lg:flex-col">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPersonaId(p.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
              personaId === p.id
                ? "border-gold/40 bg-gold/10 text-cream"
                : "border-line-dim text-warm hover:bg-white/5"
            )}
          >
            <span>{p.emoji}</span>
            <span className="font-medium">{p.name}</span>
            <span className="hidden text-xs text-muted lg:inline">· {p.role}</span>
          </button>
        ))}
      </div>

      {/* Chat */}
      <Card className="flex min-h-[60vh] flex-col">
        <div className="mb-3 flex items-center gap-2 border-b border-line-dim pb-3">
          <span className="text-xl">{persona.emoji}</span>
          <div>
            <p className="font-bold text-cream">{persona.name}</p>
            <p className="text-xs text-warm">{persona.role}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              اسأل {persona.name} عن أي تحدٍّ في مطعمك.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user"
                  ? "ms-auto bg-gold text-charcoal"
                  : "bg-white/5 text-cream"
              )}
            >
              {m.text}
            </div>
          ))}
          {pending && <p className="text-sm text-muted">⏳ يكتب...</p>}
        </div>

        <div className="mt-3 flex gap-2 border-t border-line-dim pt-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="اكتب سؤالك..."
            className={fieldClass}
          />
          <Button onClick={send} disabled={pending} aria-label="إرسال">
            <Send size={16} />
          </Button>
        </div>
      </Card>
    </div>
  );
}
