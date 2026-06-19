"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { callFounderAdmin, type FounderResult } from "./actions";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/site/logo";

export default function FounderPage() {
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<FounderResult | null>(null);
  const [pending, setPending] = useState(false);

  async function test() {
    setPending(true);
    setResult(await callFounderAdmin(secret, "ping"));
    setPending(false);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-gold">
            <ShieldAlert size={20} />
            <h1 className="font-bold">لوحة المؤسس</h1>
          </div>
          <p className="text-sm text-warm">
            منطقة محميّة. أدخل سر المؤسس للوصول لعمليات الإدارة العليا.
          </p>

          <Field label="سر المؤسس" htmlFor="secret">
            <Input
              id="secret"
              type="password"
              dir="ltr"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </Field>

          <Button onClick={test} disabled={pending}>
            {pending ? "جارٍ التحقق..." : "اختبار الاتصال"}
          </Button>

          {result && (
            <pre
              dir="ltr"
              className="overflow-auto rounded-xl bg-charcoal-3 p-3 text-xs text-warm"
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          )}

          <p className="text-xs text-muted">
            ملاحظة: عقد دالة founder-admin يحتاج تأكيداً لإكمال العمليات
            (الإحصائيات العامة، إدارة المطاعم، إلخ).
          </p>
        </Card>
      </div>
    </main>
  );
}
