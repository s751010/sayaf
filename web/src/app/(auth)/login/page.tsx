"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "../actions";
import { Logo } from "@/components/site/logo";
import { Button } from "@/components/ui/button";

const initial: AuthState = {};

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? login : signup;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-line bg-charcoal-2 p-7">
          <div className="mb-6 flex rounded-xl bg-white/5 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 transition-colors ${
                mode === "login" ? "bg-gold text-charcoal" : "text-warm"
              }`}
            >
              دخول
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-lg py-2 transition-colors ${
                mode === "signup" ? "bg-gold text-charcoal" : "text-warm"
              }`}
            >
              حساب جديد
            </button>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm text-warm">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                dir="ltr"
                autoComplete="email"
                className="rounded-xl border border-line-dim bg-white/5 px-4 py-2.5 text-cream outline-none focus:border-gold/40"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm text-warm">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                dir="ltr"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="rounded-xl border border-line-dim bg-white/5 px-4 py-2.5 text-cream outline-none focus:border-gold/40"
              />
            </div>

            {state.error && (
              <p className="text-sm text-danger">{state.error}</p>
            )}
            {state.message && (
              <p className="text-sm text-success">{state.message}</p>
            )}

            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending
                ? "جارٍ..."
                : mode === "login"
                  ? "تسجيل الدخول"
                  : "إنشاء الحساب"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-warm">
          <Link href="/" className="hover:text-gold">
            ← العودة للرئيسية
          </Link>
        </p>
      </div>
    </main>
  );
}
