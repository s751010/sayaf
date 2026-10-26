/**
 * جرس الطلب الجديد.
 *
 * ⚠️ **بلا ملفّ صوت.** إضافة ملفّ تعني طلب شبكة قد يفشل، وحجماً في الحزمة،
 * وإذناً للتشغيل التلقائي قد يُرفض. نغمتان قصيرتان من `AudioContext` تكفيان
 * الغرض ولا تكلّفان بايتاً. (انتقل من `Orders.tsx` حين صار الجرس للوحة كلّها.)
 *
 * ═══ لماذا زرّ «شغّل صوت الطلبات» ═══
 *
 * المتصفّح يُبقي `AudioContext` **معلّقاً** حتى يلمس المستخدم الصفحة. وكانت
 * صفحة الطلبات تفترض أن التاجر «فتحها بنقرة» — لكن لوح الكاونتر يُفتح مرّة
 * صباحاً ويُترك، ويُعاد تحميله بلا لمس فيصمت الجرس بلا علامة. فالزرّ نفسه هو
 * اللمسة التي تفتح الصوت، ويرنّ مرّة ليسمع الكاشير ما سيسمعه. والتفضيل يُحفظ
 * (`K.ORDER_SOUND`)، وبعد إعادة التحميل تكفي أي لمسة في الصفحة (`unlockAudio`).
 *
 * سياقٌ واحد مشترك لا سياقٌ لكل رنّة: المتصفّحات تحدّ عدد السياقات المفتوحة،
 * والسياق الذي فُتح بلمسة يبقى مفتوحاً — والجديد يولد معلّقاً من جديد.
 */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
    return ctx;
  } catch {
    return null;
  }
}

/** يُنادى من داخل لمسة المستخدم — هي ما يسمح للمتصفّح بفتح الصوت. */
export function unlockAudio(): void {
  const c = context();
  if (c && c.state === "suspended") void c.resume().catch(() => {});
}

/** هل يُسمع الجرس الآن فعلاً؟ — `false` حتى أوّل لمسة بعد التحميل. */
export function audioReady(): boolean {
  return ctx?.state === "running";
}

export function chime(): void {
  try {
    const c = context();
    if (!c) return;
    if (c.state === "suspended") void c.resume().catch(() => {});
    [0, 0.18].forEach((offset, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 0 ? 880 : 1174;
      gain.gain.setValueAtTime(0.0001, c.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, c.currentTime + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + offset + 0.16);
      osc.connect(gain).connect(c.destination);
      osc.start(c.currentTime + offset);
      osc.stop(c.currentTime + offset + 0.18);
    });
  } catch {
    // الصوت رفاهية — فشله لا يمسّ الطلب.
  }
}
