// ════════════════════════════════════════════════════════════
//  محوّلات بوابات الدفع — كل بوابة توفّر عمليتين:
//  create: إنشاء صفحة دفع مستضافة وإرجاع رابط التحويل
//  verify: تحقق سيرفر-لسيرفر من حالة الدفعة بالمفتاح السرّي
//  الأسرار تُقرأ من Supabase Edge Function Secrets فقط.
// ════════════════════════════════════════════════════════════

export type ProviderId = "moyasar" | "paylink" | "paytabs" | "myfatoorah";

export interface CreateInput {
  /** المبلغ بالريال السعودي. */
  amountSar: number;
  /** مرجع الطلب المرمّز سيرفرياً: cm_<user_id>_<plan_id>_<cycle>_<ts> */
  orderRef: string;
  description: string;
  /** صفحة الرجوع بعد الدفع (تستدعي verify). */
  callbackUrl: string;
  /** صفحة الرجوع عند الإلغاء/الفشل. */
  errorUrl: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
}

export interface CreateResult {
  redirectUrl: string;
  /** مرجع الدفعة لدى البوابة (يُمرَّر لاحقاً إلى verify). */
  ref: string;
}

export interface VerifyResult {
  paid: boolean;
  /** الدفعة لم تُحسم بعد (قيد المعالجة). */
  pending: boolean;
  /** المبلغ بالريال كما تؤكده البوابة (للمطابقة مع السعر المتوقع). */
  amountSar: number | null;
  /** مرجع الطلب كما ترجعه البوابة نفسها — لا يُؤخذ من العميل أبداً. */
  orderRef: string | null;
}

/** يرمي خطأ provider_unconfigured عند غياب أي سر مطلوب — تدهور آمن. */
export class UnconfiguredError extends Error {
  constructor(provider: string) {
    super(`provider_unconfigured:${provider}`);
  }
}

function env(name: string): string | undefined {
  const v = Deno.env.get(name);
  return v && v.trim() !== "" ? v.trim() : undefined;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ── Paylink (باي لينك) — https://developer.paylink.sa ──────────────

const PAYLINK_BASE = () => env("PAYLINK_BASE_URL") ?? "https://restapi.paylink.sa";

async function paylinkToken(): Promise<string> {
  const apiId = env("PAYLINK_API_ID");
  const secretKey = env("PAYLINK_SECRET_KEY");
  if (!apiId || !secretKey) throw new UnconfiguredError("paylink");

  const res = await fetch(`${PAYLINK_BASE()}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiId, secretKey, persistToken: false }),
  });
  const data = await readJson(res);
  const token = data.id_token as string | undefined;
  if (!res.ok || !token) throw new Error(`paylink_auth_failed:${res.status}`);
  return token;
}

async function paylinkCreate(input: CreateInput): Promise<CreateResult> {
  const token = await paylinkToken();
  const res = await fetch(`${PAYLINK_BASE()}/api/addInvoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      orderNumber: input.orderRef,
      amount: input.amountSar,
      callBackUrl: input.callbackUrl,
      cancelUrl: input.errorUrl,
      clientName: input.customerName,
      clientMobile: input.customerMobile,
      currency: "SAR",
      products: [
        { title: input.description, price: input.amountSar, qty: 1 },
      ],
    }),
  });
  const data = await readJson(res);
  const url = data.url as string | undefined;
  const transactionNo = data.transactionNo as string | number | undefined;
  if (!res.ok || !url || transactionNo === undefined) {
    throw new Error(`paylink_create_failed:${res.status}`);
  }
  return { redirectUrl: url, ref: String(transactionNo) };
}

async function paylinkVerify(ref: string): Promise<VerifyResult> {
  const token = await paylinkToken();
  const res = await fetch(
    `${PAYLINK_BASE()}/api/getInvoice/${encodeURIComponent(ref)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await readJson(res);
  if (!res.ok) throw new Error(`paylink_verify_failed:${res.status}`);
  const status = String(data.orderStatus ?? "").toUpperCase();
  return {
    paid: status === "PAID",
    pending: status === "PENDING",
    amountSar: typeof data.amount === "number" ? data.amount : null,
    orderRef: (data.orderNumber as string | undefined) ?? null,
  };
}

// ── PayTabs (باي تابس السعودية) — https://docs.paytabs.com ─────────

const PAYTABS_BASE = () => env("PAYTABS_BASE_URL") ?? "https://secure.paytabs.sa";

function paytabsCreds(): { profileId: number; serverKey: string } {
  const profile = env("PAYTABS_PROFILE_ID");
  const serverKey = env("PAYTABS_SERVER_KEY");
  if (!profile || !serverKey) throw new UnconfiguredError("paytabs");
  return { profileId: Number(profile), serverKey };
}

async function paytabsCreate(input: CreateInput): Promise<CreateResult> {
  const { profileId, serverKey } = paytabsCreds();
  const res = await fetch(`${PAYTABS_BASE()}/payment/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: serverKey,
    },
    body: JSON.stringify({
      profile_id: profileId,
      tran_type: "sale",
      tran_class: "ecom",
      cart_id: input.orderRef,
      cart_currency: "SAR",
      cart_amount: input.amountSar,
      cart_description: input.description,
      paypage_lang: "ar",
      hide_shipping: true,
      customer_details: {
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerMobile,
        country: "SA",
      },
      // PayTabs يعيد العميل إلى return بطلب POST — يستقبله route وسيط في التطبيق
      return: input.callbackUrl,
    }),
  });
  const data = await readJson(res);
  const redirectUrl = data.redirect_url as string | undefined;
  const tranRef = data.tran_ref as string | undefined;
  if (!res.ok || !redirectUrl || !tranRef) {
    throw new Error(`paytabs_create_failed:${res.status}`);
  }
  return { redirectUrl, ref: tranRef };
}

async function paytabsVerify(ref: string): Promise<VerifyResult> {
  const { profileId, serverKey } = paytabsCreds();
  const res = await fetch(`${PAYTABS_BASE()}/payment/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: serverKey,
    },
    body: JSON.stringify({ profile_id: profileId, tran_ref: ref }),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(`paytabs_verify_failed:${res.status}`);
  const result = (data.payment_result ?? {}) as Record<string, unknown>;
  const status = String(result.response_status ?? "");
  const amount = Number(data.cart_amount);
  return {
    // A = Authorized/مقبولة، P = Pending
    paid: status === "A",
    pending: status === "P",
    amountSar: Number.isFinite(amount) ? amount : null,
    orderRef: (data.cart_id as string | undefined) ?? null,
  };
}

// ── MyFatoorah (ماي فاتورة السعودية) — https://docs.myfatoorah.com ──

const MYFATOORAH_BASE = () =>
  env("MYFATOORAH_BASE_URL") ?? "https://api-sa.myfatoorah.com";

function myfatoorahKey(): string {
  const key = env("MYFATOORAH_API_KEY");
  if (!key) throw new UnconfiguredError("myfatoorah");
  return key;
}

async function myfatoorahCreate(input: CreateInput): Promise<CreateResult> {
  const res = await fetch(`${MYFATOORAH_BASE()}/v2/SendPayment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${myfatoorahKey()}`,
    },
    body: JSON.stringify({
      NotificationOption: "LNK",
      CustomerName: input.customerName,
      InvoiceValue: input.amountSar,
      DisplayCurrencyIso: "SAR",
      CustomerReference: input.orderRef,
      CallBackUrl: input.callbackUrl,
      ErrorUrl: input.errorUrl,
      Language: "ar",
    }),
  });
  const data = await readJson(res);
  const inner = (data.Data ?? {}) as Record<string, unknown>;
  const url = inner.InvoiceURL as string | undefined;
  const invoiceId = inner.InvoiceId as number | string | undefined;
  if (!res.ok || data.IsSuccess !== true || !url || invoiceId === undefined) {
    throw new Error(`myfatoorah_create_failed:${res.status}`);
  }
  return { redirectUrl: url, ref: String(invoiceId) };
}

async function myfatoorahVerify(
  ref: string,
  keyType: "PaymentId" | "InvoiceId"
): Promise<VerifyResult> {
  const res = await fetch(`${MYFATOORAH_BASE()}/v2/GetPaymentStatus`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${myfatoorahKey()}`,
    },
    body: JSON.stringify({ Key: ref, KeyType: keyType }),
  });
  const data = await readJson(res);
  if (!res.ok || data.IsSuccess !== true) {
    throw new Error(`myfatoorah_verify_failed:${res.status}`);
  }
  const inner = (data.Data ?? {}) as Record<string, unknown>;
  const status = String(inner.InvoiceStatus ?? "");
  const amount = Number(inner.InvoiceValue);
  return {
    paid: status === "Paid",
    pending: status === "Pending",
    amountSar: Number.isFinite(amount) ? amount : null,
    orderRef: (inner.CustomerReference as string | undefined) ?? null,
  };
}

// ── Moyasar (ميسر) — https://docs.moyasar.com ───────────────────────
// الإنشاء يتم عبر النموذج المدمج في المتصفح (publishable key)،
// لذا المحوّل هنا يوفّر verify فقط. البيانات تعود من metadata الدفعة.

export interface MoyasarVerifyResult extends VerifyResult {
  metadata: Record<string, string>;
}

export async function moyasarVerify(ref: string): Promise<MoyasarVerifyResult> {
  const sk = env("MOYASAR_SK");
  if (!sk) throw new UnconfiguredError("moyasar");

  const res = await fetch(
    `https://api.moyasar.com/v1/payments/${encodeURIComponent(ref)}`,
    { headers: { Authorization: `Basic ${btoa(`${sk}:`)}` } }
  );
  const data = await readJson(res);
  if (!res.ok) throw new Error(`moyasar_verify_failed:${res.status}`);
  const status = String(data.status ?? "");
  const halalas = Number(data.amount);
  return {
    paid: status === "paid",
    pending: status === "initiated" || status === "authorized",
    amountSar: Number.isFinite(halalas) ? halalas / 100 : null,
    orderRef: null,
    metadata: (data.metadata ?? {}) as Record<string, string>,
  };
}

// ── الواجهة الموحّدة ────────────────────────────────────────────────

export function createPayment(
  provider: ProviderId,
  input: CreateInput
): Promise<CreateResult> {
  switch (provider) {
    case "paylink":
      return paylinkCreate(input);
    case "paytabs":
      return paytabsCreate(input);
    case "myfatoorah":
      return myfatoorahCreate(input);
    default:
      throw new Error("embedded_provider");
  }
}

export function verifyPayment(
  provider: ProviderId,
  ref: string
): Promise<VerifyResult> {
  switch (provider) {
    case "paylink":
      return paylinkVerify(ref);
    case "paytabs":
      return paytabsVerify(ref);
    case "myfatoorah":
      // صفحة الرجوع تصل بـ paymentId من MyFatoorah
      return myfatoorahVerify(ref, "PaymentId");
    case "moyasar":
      return moyasarVerify(ref);
    default:
      throw new Error("unknown_provider");
  }
}
