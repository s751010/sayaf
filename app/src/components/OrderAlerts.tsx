/**
 * جرس الطلبات — **يسمعه التاجر أينما كان في اللوحة**.
 *
 * كان الجرس داخل صفحة الطلبات وحدها: تاجرٌ يعدّل أطباقه أو تصميمه لا يعرف
 * أن زبوناً دفع وينتظر. فخرج إلى غلاف اللوحة: استطلاعٌ خفيف كل عشرين ثانية
 * (`listNewOrders` — طلبات `new` بعمودين)، وشارةٌ بعدد ما لم يُرَ على عنصر
 * «الطلبات»، وعددٌ في عنوان التبويب، ورنّة، وإشعار نظام لمن أذن.
 *
 * ═══ من يستطلع ═══
 *
 * الغلاف يستطلع، وشاشتا الطلبات والكاشير تستطلعان بأنفسهما (تحتاجان الأصناف).
 * فالشاشتان **تُسلّمان** ما جلبتاه هنا (`sync`) — يرنّ الجرس بأسرع الجولتين،
 * ويُعلَّم الطلب «مرئياً»، ويتخطّى الغلاف جولته إن سبقته شاشةٌ بها؛ فلا طلبان
 * إلى الشبكة كل عشرين ثانية لنفس السؤال.
 *
 * ═══ ما لا يفعله ═══
 *
 * - **لا يعمل في «الدخول كتاجر»**: المؤسّس يشاهد، والرنين وعلامة «رأيته» تخصّ
 *   التاجر — وكانت ستُكتب في جهاز المؤسّس باسم مطعمٍ ليس له.
 * - **لا يستطلع لمطعمٍ بلا بوّابة دفع**: لا سلّة عنده فلا طلب يصل؛ و`sync` من
 *   الشاشتين يبقى يعمل إن فتحهما.
 * - **لا يحفظ اسماً ولا جوالاً**: معرّفات طلبات فقط (`lib/orderAlerts.ts`).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui";
import { listNewOrders, type NewOrderPing, type OrderStatus } from "@/lib/data";
import { chime, unlockAudio } from "@/lib/chime";
import { Icon } from "@/lib/icons";
import {
  notificationText,
  parseAlertState,
  reconcile,
  titleWithCount,
} from "@/lib/orderAlerts";
import { ORDER_POLL_MS, usePolling } from "@/lib/poll";
import { K, getItem, getJSON, setItem, setJSON } from "@/lib/storage";
import { cn } from "@/lib/utils";

type NotifyState = NotificationPermission | "unsupported";

export type OrderAlertsCtx = {
  /** طلبات `new` لم تعرضها شاشةٌ أمام التاجر — رقم الشارة. */
  unseen: number;
  /** صوت الطلبات مفعّل على هذا الجهاز. */
  sound: boolean;
  setSound: (on: boolean) => void;
  notify: NotifyState;
  requestNotify: () => Promise<void>;
  /**
   * تسليم قائمةٍ جلبتها شاشة. `seen` = الشاشة تعرض الطلبات للتاجر الآن.
   * يكفي فيها `id` و`code` و`status` — والجرس يأخذ منها `new` وحدها.
   */
  sync: (orders: readonly { id: string; code: number; status: OrderStatus }[], opts?: { seen?: boolean }) => void;
};

/** بلا مزوّد (فحصٌ يركّب صفحةً وحدها): لا جرس ولا انهيار. */
const NOOP: OrderAlertsCtx = {
  unseen: 0,
  sound: false,
  setSound: () => {},
  notify: "unsupported",
  requestNotify: async () => {},
  sync: () => {},
};

const AlertsContext = createContext<OrderAlertsCtx>(NOOP);

export function useOrderAlerts(): OrderAlertsCtx {
  return useContext(AlertsContext);
}

function notifyPermission(): NotifyState {
  return typeof window !== "undefined" && "Notification" in window
    ? Notification.permission
    : "unsupported";
}

/**
 * إشعار النظام — بالمُنشئ، ثم عبر عامل الخدمة.
 *
 * ⚠️ كروم أندرويد (وأكثر ألواح الكاونتر أندرويد) **يرمي** عند `new Notification`
 * ويشترط `registration.showNotification`. فالأوّل يُجرَّب ثم الثاني. و`tag`
 * واحد للمطعم: الإشعار الجديد يحلّ محلّ السابق فلا تتكدّس عشرة في الدرج.
 */
function showSystemNotification(restaurantId: string, codes: number[], onClick: () => void) {
  if (notifyPermission() !== "granted") return;
  const { title, body } = notificationText(codes);
  const options: NotificationOptions = { body, tag: `cm-orders-${restaurantId}`, icon: "/icon-192.png" };
  try {
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      onClick();
      n.close();
    };
  } catch {
    navigator.serviceWorker
      ?.getRegistration()
      .then((reg) => reg?.showNotification(title, options))
      .catch(() => {});
  }
}

export function OrderAlertsProvider({
  restaurantId,
  pollEnabled,
  disabled,
  children,
}: {
  restaurantId: string;
  /** الغلاف يستطلع بنفسه — لمن ربط بوّابة دفع. */
  pollEnabled: boolean;
  /** وضع «الدخول كتاجر»: لا رنين ولا كتابة. */
  disabled: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [unseen, setUnseen] = useState(0);
  const [sound, setSoundState] = useState(() => getItem(K.ORDER_SOUND) === "on");
  const [notify, setNotify] = useState<NotifyState>(notifyPermission);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  /** آخر تسليمٍ من شاشة — يتخطّى الغلاف جولته إن كان أحدث من إيقاعه. */
  const lastSync = useRef(0);
  const key = `${K.ORDER_ALERTS}_${restaurantId}`;

  const handle = useCallback(
    (pings: readonly NewOrderPing[], seen: boolean) => {
      if (disabled) return;
      // يُقرأ من التخزين في كل جولة لا من الذاكرة: تبويبٌ آخر (أو شاشة الكاشير
      // على اللوح نفسه) ربما رنّ لهذا الطلب قبل ثانية — فلا رنّة ثانية.
      const prev = parseAlertState(getJSON<unknown>(key));
      const r = reconcile(prev, pings.map((p) => p.id), { seen });
      setJSON(key, r.state);
      setUnseen(r.unseen);
      if (r.toAlert.length === 0) return;
      if (soundRef.current) chime();
      const wanted = new Set(r.toAlert);
      const codes = pings.filter((p) => wanted.has(p.id)).map((p) => p.code);
      showSystemNotification(restaurantId, codes, () => navigate("/dashboard/orders"));
    },
    [disabled, key, restaurantId, navigate]
  );

  const sync = useCallback<OrderAlertsCtx["sync"]>(
    (orders, opts = {}) => {
      lastSync.current = Date.now();
      handle(
        orders.filter((o) => o.status === "new").map((o) => ({ id: o.id, code: o.code })),
        opts.seen === true
      );
    },
    [handle]
  );

  usePolling(
    async () => {
      if (Date.now() - lastSync.current < ORDER_POLL_MS - 1000) return;
      handle(await listNewOrders(restaurantId), false);
    },
    { enabled: pollEnabled && !disabled }
  );

  // عنوان التبويب يحمل العدد — يُقرأ من شريط التبويبات والتاجر في غيره.
  // والمسار في التبعيات: كل صفحة تضبط عنوانها عند الدخول (وتأثير الابن يجري
  // قبل الأب)، فتُعاد البادئة فوق العنوان الجديد بدل أن تضيع.
  useEffect(() => {
    document.title = titleWithCount(document.title, unseen);
  }, [unseen, pathname]);
  useEffect(
    () => () => {
      document.title = titleWithCount(document.title, 0);
    },
    []
  );

  /**
   * بعد إعادة التحميل يولد سياق الصوت معلّقاً: أوّل لمسة في الصفحة تفتحه.
   * ومن لم يفعّل الصوت لا نفتح له سياقاً أصلاً.
   */
  useEffect(() => {
    if (!sound) return;
    const once = () => unlockAudio();
    window.addEventListener("pointerdown", once, { once: true });
    window.addEventListener("keydown", once, { once: true });
    return () => {
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
    };
  }, [sound]);

  const setSound = useCallback((on: boolean) => {
    setItem(K.ORDER_SOUND, on ? "on" : "off");
    setSoundState(on);
    if (on) {
      // داخل الضغطة نفسها: هي ما يسمح للمتصفّح بالصوت — والرنّة تأكيدٌ مسموع.
      unlockAudio();
      chime();
    }
  }, []);

  const requestNotify = useCallback(async () => {
    if (notifyPermission() === "unsupported") return;
    try {
      setNotify(await Notification.requestPermission());
    } catch {
      setNotify(notifyPermission());
    }
  }, []);

  const value = useMemo<OrderAlertsCtx>(
    () => ({ unseen, sound, setSound, notify, requestNotify, sync }),
    [unseen, sound, setSound, notify, requestNotify, sync]
  );

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

/**
 * مفتاحا الصوت والإشعار — في صفحة الطلبات وشاشة الكاشير.
 *
 * الحالة تُقال بالكلمة لا باللون وحده: «الصوت مطفأ» تحت عين الكاشير أوضح من
 * أيقونة باهتة. وإشعار النظام لا يُطلب إلا بضغطة (المتصفّحات تحجب الطلب
 * التلقائي وتعاقب الموقع بإخفاء السؤال لاحقاً).
 */
export function AlertControls({ className, large }: { className?: string; large?: boolean }) {
  const { sound, setSound, notify, requestNotify } = useOrderAlerts();
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* الحجم داخل وسم لا في `className`: `cn` تجمع ولا تدمج، و`text-sm` في
          الزرّ كان يغلب `text-base` بترتيب CSS. */}
      <Button
        variant={sound ? "outline" : "gold"}
        aria-pressed={sound}
        onClick={() => setSound(!sound)}
      >
        <Icon name="bell" size={large ? 18 : 15} />
        <span className={large ? "text-base" : undefined}>
          {sound ? "صوت الطلبات يعمل" : "شغّل صوت الطلبات"}
        </span>
      </Button>
      {notify === "default" && (
        <Button variant="outline" onClick={() => void requestNotify()}>
          <span className={large ? "text-base" : undefined}>فعّل إشعار الجهاز</span>
        </Button>
      )}
      {notify === "denied" && (
        <span className="text-xs text-faint">إشعارات الجهاز محجوبة من إعدادات المتصفّح</span>
      )}
    </div>
  );
}
