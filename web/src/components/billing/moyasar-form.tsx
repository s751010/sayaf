"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Moyasar?: {
      init: (opts: Record<string, unknown>) => void;
    };
  }
}

const MOYASAR_VERSION = "1.14.0";

/**
 * Mounts the Moyasar hosted payment form. Supports the methods Moyasar offers
 * in Saudi Arabia (mada/credit card, Apple Pay, STC Pay) so the customer picks
 * how to pay. Uses the publishable key (safe in the browser).
 */
export function MoyasarForm({
  amountHalalas,
  description,
  metadata,
  methods = ["creditcard", "applepay", "stcpay"],
}: {
  amountHalalas: number;
  description: string;
  metadata: Record<string, string>;
  methods?: string[];
}) {
  const mounted = useRef(false);
  const pk = process.env.NEXT_PUBLIC_MOYASAR_PK;

  useEffect(() => {
    if (mounted.current || !pk) return;
    mounted.current = true;

    // Stylesheet
    if (!document.getElementById("moyasar-css")) {
      const link = document.createElement("link");
      link.id = "moyasar-css";
      link.rel = "stylesheet";
      link.href = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.css`;
      document.head.appendChild(link);
    }

    const start = () => {
      window.Moyasar?.init({
        element: ".moyasar-form",
        amount: amountHalalas,
        currency: "SAR",
        description,
        publishable_api_key: pk,
        // صفحة الرجوع الموحّدة: تتحقق من الدفعة سيرفرياً وتفعّل الاشتراك
        callback_url: `${window.location.origin}/dashboard/billing/callback?provider=moyasar`,
        methods,
        metadata,
      });
    };

    if (window.Moyasar) {
      start();
    } else {
      const script = document.createElement("script");
      script.src = `https://cdn.moyasar.com/mpf/${MOYASAR_VERSION}/moyasar.js`;
      script.onload = start;
      document.body.appendChild(script);
    }
  }, [amountHalalas, description, methods, metadata, pk]);

  if (!pk) {
    return (
      <p className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
        لم يُضبط مفتاح Moyasar (NEXT_PUBLIC_MOYASAR_PK).
      </p>
    );
  }

  // TODO(production): استبدل pk_test بمفتاح pk_live في متغيّر البيئة قبل الإطلاق.
  const isTest = pk.startsWith("pk_test");

  return (
    <div>
      {isTest && (
        <p className="mb-3 rounded-xl border border-gold/30 bg-gold/10 p-3 text-center text-xs text-gold">
          وضع تجريبي — لن يُخصم أي مبلغ فعلي. للإطلاق الحقيقي استبدل المفتاح بـ pk_live.
        </p>
      )}
      <div className="moyasar-form" />
    </div>
  );
}
