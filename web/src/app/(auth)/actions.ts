"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthState = { error?: string; message?: string };

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  return { email, password };
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "الخدمة غير مهيأة. تحقق من إعدادات Supabase." };

  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "أدخل البريد وكلمة المرور." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "بيانات الدخول غير صحيحة." };

  redirect("/dashboard");
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "الخدمة غير مهيأة. تحقق من إعدادات Supabase." };

  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "أدخل البريد وكلمة المرور." };
  if (password.length < 8)
    return { error: "كلمة المرور يجب أن تكون ٨ أحرف على الأقل." };

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: "تعذّر إنشاء الحساب. جرّب بريداً آخر." };

  if (!data.session) {
    return { message: "تم إنشاء الحساب! تحقق من بريدك لتفعيل الحساب." };
  }
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
