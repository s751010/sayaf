import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-xl border border-line-dim bg-white/5 px-4 py-2.5 text-cream outline-none transition-colors focus:border-gold/40 placeholder:text-muted";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-warm">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={cn(fieldClass, "min-h-20 resize-y", props.className)}
    />
  );
}
