/** مكوّنات الواجهة الأساسية — نظام تصميم واحد لكل التطبيق. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { K, getItem, setItem } from "@/lib/storage";

/* ── زر ────────────────────────────────────────────────────────────── */
type ButtonVariant = "gold" | "outline" | "ghost" | "danger";

export function Button({
  variant = "gold",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const styles: Record<ButtonVariant, string> = {
    gold: "bg-gold text-on-gold hover:bg-gold2 shadow-[0_4px_18px_-4px_var(--c-glow)]",
    outline: "border border-line-gold text-ink hover:bg-gold/10",
    ghost: "text-dim hover:text-ink hover:bg-ink/5",
    danger: "border border-bad/40 text-bad hover:bg-bad/10",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
        "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}

/* ── بطاقة ─────────────────────────────────────────────────────────── */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-panel p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── شارة ──────────────────────────────────────────────────────────── */
type BadgeVariant = "gold" | "green" | "red" | "neutral";

export function Badge({
  variant = "gold",
  className,
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}) {
  const styles: Record<BadgeVariant, string> = {
    gold: "bg-gold/12 text-gold border-gold/25",
    green: "bg-good/12 text-good border-good/25",
    red: "bg-bad/12 text-bad border-bad/25",
    neutral: "bg-ink/6 text-dim border-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ── حقول النماذج ──────────────────────────────────────────────────── */
export const fieldClass =
  "w-full rounded-xl border border-line bg-panel2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint transition-colors focus:border-gold/50 focus:bg-panel";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-24", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, "appearance-none", className)} {...props} />;
}

export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40",
        checked ? "bg-gold" : "bg-ink/15"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "right-0.5" : "right-[22px]"
        )}
      />
    </button>
  );
}

/* ── حالات العرض ───────────────────────────────────────────────────── */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent",
        className
      )}
      role="status"
      aria-label="جارٍ التحميل"
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmptyState({
  emoji,
  title,
  desc,
  action,
}: {
  emoji: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="font-bold text-ink">{title}</p>
      {desc && <p className="max-w-sm text-sm text-dim">{desc}</p>}
      {action && <div className="mt-3">{action}</div>}
    </Card>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
      {children}
    </p>
  );
}

/* ── مودال ─────────────────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "anim-fade-up max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
      >
        {(title || true) && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-extrabold text-ink">{title}</h2>
            <button
              onClick={onClose}
              aria-label="إغلاق"
              className="flex h-8 w-8 items-center justify-center rounded-full text-dim hover:bg-ink/8 hover:text-ink"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── توست ──────────────────────────────────────────────────────────── */
type Toast = { id: number; text: string; kind: "ok" | "err" };
const ToastContext = createContext<(text: string, kind?: Toast["kind"]) => void>(
  () => {}
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "anim-fade-up w-full rounded-xl border px-4 py-3 text-center text-sm font-bold shadow-xl backdrop-blur",
              t.kind === "ok"
                ? "border-good/30 bg-panel/95 text-good"
                : "border-bad/30 bg-panel/95 text-bad"
            )}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/* ── مبدّل الوضع (داكن/فاتح) ───────────────────────────────────────── */
export function applyStoredTheme() {
  const stored = getItem(K.THEME);
  if (stored === "light") document.documentElement.dataset.theme = "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const [light, setLight] = useState(
    () => document.documentElement.dataset.theme === "light"
  );
  const toggle = () => {
    const next = !light;
    setLight(next);
    if (next) document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    setItem(K.THEME, next ? "light" : "dark");
  };
  return (
    <button
      onClick={toggle}
      aria-label={light ? "الوضع الداكن" : "الوضع الفاتح"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border border-line text-base hover:bg-ink/6",
        className
      )}
    >
      {light ? "🌙" : "☀️"}
    </button>
  );
}
