/**
 * عميل PayLink المشترك بين دوال الحافة.
 *
 * ⚠️ `PAYLINK_SECRET_KEY` سرّ خادم بحت — لا يُرسل للمتصفح ولا يُسجَّل في أي log.
 * التبديل بين التجريبي والإنتاج يتم بمتغيّر `PAYLINK_ENV` فقط.
 *
 * التوثيق: https://developer.paylink.sa/docs/authentication
 *          https://developer.paylink.sa/docs/add-invoice
 *          https://developer.paylink.sa/docs/get-invoice
 */

const BASE_URLS = {
  test: "https://restpilot.paylink.sa",
  production: "https://restapi.paylink.sa",
} as const;

/** أقل مبلغ تقبله PayLink (موثّق في دليلهم). */
export const PAYLINK_MIN_AMOUNT = 5;

export function paylinkBase(): string {
  const env = (Deno.env.get("PAYLINK_ENV") ?? "test").toLowerCase();
  return env === "production" ? BASE_URLS.production : BASE_URLS.test;
}

export function isProduction(): boolean {
  return (Deno.env.get("PAYLINK_ENV") ?? "test").toLowerCase() === "production";
}

/**
 * بيانات اعتماد PayLink. تُترك فارغة لاستخدام حساب المنصّة (من أسرار الدالة)،
 * وتُمرَّر صراحةً عند الدفع لحساب مطعم بعينه (طلبات الزبائن).
 */
export type PaylinkCredentials = { apiId: string; secretKey: string };

/**
 * يجلب رمز وصول قصير العمر (30 دقيقة) — نطلبه لكل نداء بدل تخزينه،
 * فالدالة قصيرة العمر أصلاً و`persistToken:false` أضيق نطاقاً.
 */
async function authToken(creds?: PaylinkCredentials): Promise<string> {
  const apiId = creds?.apiId ?? Deno.env.get("PAYLINK_API_ID");
  const secretKey = creds?.secretKey ?? Deno.env.get("PAYLINK_SECRET_KEY");
  if (!apiId || !secretKey) {
    throw new Error("بيانات اعتماد PayLink غير مضبوطة.");
  }

  const res = await fetch(`${paylinkBase()}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ apiId, secretKey, persistToken: false }),
  });

  if (!res.ok) {
    // لا نُدرج نص الرد كاملاً في الخطأ حتى لا تتسرّب أي بيانات اعتماد.
    throw new Error(`فشل التوثيق مع PayLink (${res.status}).`);
  }
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("لم تُعِد PayLink رمز وصول.");
  return data.id_token;
}

export type PaylinkProduct = {
  title: string;
  price: number;
  qty: number;
};

export type AddInvoiceInput = {
  orderNumber: string;
  amount: number;
  callBackUrl: string;
  cancelUrl?: string;
  clientName: string;
  clientEmail?: string;
  clientMobile: string;
  products: PaylinkProduct[];
  note?: string;
};

export type AddInvoiceResult = {
  url: string;
  transactionNo: string;
  orderStatus: string;
  amount: number;
  success?: boolean;
};

export async function addInvoice(
  input: AddInvoiceInput,
  creds?: PaylinkCredentials
): Promise<AddInvoiceResult> {
  const token = await authToken(creds);
  const res = await fetch(`${paylinkBase()}/api/addInvoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ currency: "SAR", ...input }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`تعذّر إنشاء الفاتورة (${res.status}): ${text.slice(0, 200)}`);

  const data = JSON.parse(text) as AddInvoiceResult;
  if (!data.url || !data.transactionNo) throw new Error("رد PayLink بلا رابط دفع.");
  return data;
}

export type InvoiceDetails = {
  orderStatus: string;
  amount: number;
  transactionNo: string;
  gatewayOrderRequest?: { orderNumber?: string; amount?: number };
};

/**
 * المصدر الموثوق الوحيد لحالة الدفع.
 *
 * webhook الخاص بـ PayLink **لا يحمل توقيعاً ولا هاش** (موثّق كذلك في دليلهم)،
 * فأي جهة تستطيع استدعاء رابط الويبهوك بجسم مزوَّر. لذلك لا يُعتمد على جسم
 * الويبهوك إطلاقاً في تفعيل أي اشتراك — يُعاد سؤال PayLink بمفاتيحنا الخاصة،
 * وردّ هذه الدالة هو ما يُبنى عليه القرار.
 */
export async function getInvoice(transactionNo: string): Promise<InvoiceDetails> {
  const token = await authToken();
  const res = await fetch(
    `${paylinkBase()}/api/getInvoice/${encodeURIComponent(transactionNo)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
  if (!res.ok) throw new Error(`تعذّر التحقق من الفاتورة (${res.status}).`);
  return (await res.json()) as InvoiceDetails;
}

/** حالة «مدفوعة» تصل بحالات أحرف مختلفة حسب النقطة — نوحّدها. */
export function isPaid(orderStatus: string | undefined): boolean {
  return (orderStatus ?? "").trim().toLowerCase() === "paid";
}
