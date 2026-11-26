/**
 * بحث التجّار من أيّ مكان في «لوحتي» — بالاسم أو الرابط أو الإيميل.
 *
 * القائمة تُجلب عند أوّل فتح فقط (لا عند كل صفحة)، والمطابقة بـ`normalizeAr`
 * نفسها التي يبحث بها زبون المنيو: «قهوه» تجد «قهوة».
 * Ctrl/⌘+K يفتحه على الحاسوب.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui";
import { normalizeAr } from "@/lib/arabic";
import { getMerchants, type FounderMerchant } from "@/lib/founder";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function MerchantSearch({ compact }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="ابحث عن تاجر"
        className={cn(
          compact
            ? "flex h-10 w-10 items-center justify-center rounded-xl text-dim hover:text-ink"
            : "flex min-h-10 w-full items-center gap-2 rounded-xl border border-line bg-page px-3 text-sm text-faint hover:border-ink/30"
        )}
      >
        <Icon name="search" size={compact ? 18 : 15} />
        {!compact && (
          <>
            <span className="flex-1 text-start">ابحث عن تاجر…</span>
            <kbd className="rounded border border-line px-1 text-[10px]" dir="ltr">
              Ctrl K
            </kbd>
          </>
        )}
      </button>
      {open && <SearchDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [all, setAll] = useState<FounderMerchant[] | null>(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMerchants().then(setAll).catch(() => setAll([]));
    input.current?.focus();
  }, []);

  const results = useMemo(() => {
    if (!all) return [];
    const n = normalizeAr(q.trim());
    if (!n) return all.slice(0, 8);
    return all
      .filter((m) =>
        [m.name, m.slug ?? "", m.owner_email ?? ""].some((f) => normalizeAr(f).includes(n))
      )
      .slice(0, 8);
  }, [all, q]);

  function go(m: FounderMerchant) {
    onClose();
    navigate(`/founder/merchants/${m.id}`);
  }

  return (
    <Modal open onClose={onClose} title="ابحث عن تاجر">
      <input
        ref={input}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setCursor(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, results.length - 1));
          if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
          if (e.key === "Enter" && results[cursor]) go(results[cursor]);
        }}
        placeholder="اسم المطعم، الرابط، أو الإيميل"
        aria-label="ابحث عن تاجر"
        className="min-h-11 w-full rounded-xl border border-line bg-page px-3 text-sm text-ink outline-none focus:border-gold"
      />
      <ul className="mt-3 max-h-80 overflow-y-auto">
        {all === null ? (
          <li className="py-6 text-center text-sm text-faint">يحمّل…</li>
        ) : results.length === 0 ? (
          <li className="py-6 text-center text-sm text-faint">ما لقينا أحد.</li>
        ) : (
          results.map((m, i) => (
            <li key={m.id}>
              <button
                onClick={() => go(m)}
                onMouseEnter={() => setCursor(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start",
                  i === cursor ? "bg-gold/12" : "hover:bg-ink/5"
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{m.name}</span>
                  <span className="block truncate text-[11px] text-faint" dir="ltr">
                    /{m.slug ?? "—"} · {m.owner_email ?? ""}
                  </span>
                </span>
                <Icon name="chevron" size={14} className="text-faint rtl:rotate-180" />
              </button>
            </li>
          ))
        )}
      </ul>
    </Modal>
  );
}
