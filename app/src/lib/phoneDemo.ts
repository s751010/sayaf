/**
 * محرّك تمثيل هاتف اللاندنق.
 *
 * ═══ لماذا وحدة مستقلّة تُستورد ديناميكياً ═══
 *
 * `App.tsx` يستورد `Landing` و`MenuPage` **معاً في الحزمة الرئيسية** عمداً:
 * صفحة المنيو أكثر ما يُفتح عبر QR فتبقى في أسرع حزمة. والنتيجة أن أي شيفرة
 * تُضاف للاندنق يحمّلها **زبون المطعم وهو واقف يمسح الكود**. فالقشرة الساكنة
 * تبقى هناك (وهي مدفوعة أصلاً)، وهذا المحرّك في قطعة مستقلّة لا تُطلب إلا حين
 * يصل البطل إلى شاشة زائرٍ فعلاً.
 *
 * ═══ لماذا مؤقّتات لا حلقة إطارات ═══
 *
 * لا `requestAnimationFrame` ولا مستمع تمرير: المشهد سلسلة انتقالات CSS
 * تُشغّلها تبديلات أصناف. فالخيط الرئيسي فارغ بين المشاهد، والمتصفّح ينفّذ
 * الحركة على المُركِّب.
 *
 * ═══ التوقيتات ═══
 *
 * كلها ١٥٠–٣٠٠ملي كما تفرض إرشادات الحركة، والخروج **أسرع من الدخول**
 * (ease-in للهبوط، ease-out للصعود). هذه ليست زخرفة: توقيتات الواجهة الحقيقية
 * هي ما يجعل المشهد يُقرأ تسجيلَ شاشة لا رسماً متحرّكاً.
 */

/** موضع الإصبع داخل الهاتف بالبكسل، من أعلى-يسار مربّعه. */
type Spot = { x: number; y: number };

/**
 * المشهد بأكمله. كل خطوة: تأخير قبلها بالمللي ثانية، ثم فعلها.
 *
 * الأرقام تراكمية في `at` كي يُقرأ الجدول كسيناريو لا كسلسلة جمع ذهني.
 */
export function playPhoneDemo(stage: HTMLElement): () => void {
  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

  const q = <T extends HTMLElement>(sel: string) => stage.querySelector<T>(sel);
  const finger = q("[data-finger]");
  const scroll = stage.querySelector<HTMLElement>(".ph-scroll");
  const sheet = q("[data-sheet]");
  const cart = q("[data-cart]");
  const add = q("[data-add]");
  const listA = q('[data-list="0"]');
  const listB = q('[data-list="1"]');
  const chips = [...stage.querySelectorAll<HTMLElement>("[data-chip]")];

  /**
   * ⚠️ الإصبع يُصوَّب إلى **العنصر نفسه** لا إلى نسبة مئوية محفوظة.
   *
   * كانت المواضع أرقاماً مئوية مضبوطة يدوياً على تخطيط بعينه، فكل تغيير في
   * هندسة الجهاز أو ترتيب المحتوى كان ينقل الضغطة إلى فراغ **بلا أن يفشل شيء
   * ظاهر** — المشهد يعمل والإصبع يضغط الهواء. القياس من الهدف يجعل ذلك
   * مستحيلاً بالبناء.
   */
  const spotOf = (el: Element | null | undefined): Spot | null => {
    if (!el) return null;
    const s = stage.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top };
  };
  /** خارج الإطار من أسفل — نقطة الدخول والخروج. */
  const OUT: Spot = { x: stage.offsetWidth / 2, y: stage.offsetHeight + 40 };

  /** ينقل الإصبع، ويومض موجة ضغط عند `tap`. */
  const move = (p: Spot | null, tap = false) => {
    if (!finger || !p) return;
    finger.style.transform = `translate(-50%,-50%) translate(${p.x}px, ${p.y}px)`;
    finger.classList.toggle("is-tap", tap);
    if (tap) at(220, () => finger.classList.remove("is-tap"));
  };

  /** ينكمش العنصر ٢٪ ثم يعود — إحساس اللمس لا مجرّد تغيّر حالة. */
  const press = (el: HTMLElement | null) => {
    if (!el) return;
    el.classList.add("is-press");
    at(160, () => el.classList.remove("is-press"));
  };

  stage.classList.add("ph-live");
  stage.classList.remove("ph-settled");

  // ١) الإصبع يدخل من أسفل الإطار.
  move(OUT);
  at(120, () => move({ x: stage.offsetWidth / 2, y: stage.offsetHeight * 0.7 }));

  // ٢) تمرير القائمة — إزاحة واحدة بتباطؤ قصوري.
  at(700, () => {
    if (scroll) scroll.style.transform = "translateY(-104px)";
  });

  // ٣) ضغط شريحة «المقبلات» ⇒ تبديل القائمة.
  at(1500, () => move(spotOf(chips[1])));
  at(1900, () => {
    move(spotOf(chips[1]), true);
    press(chips[1] ?? null);
    chips.forEach((c, i) => c.classList.toggle("is-on", i === 1));
    listA?.classList.add("ph-list-off");
    listB?.classList.remove("ph-list-off");
  });

  // ٤) ضغط طبق ⇒ اللوح يصعد.
  at(2900, () => move(spotOf(listB?.children[1])));
  at(3300, () => {
    move(spotOf(listB?.children[1]), true);
    sheet?.classList.add("is-up");
  });

  // ٥) ضغط «أضِف للطلب» ⇒ انكماش ثم هبوط اللوح.
  at(4400, () => move(spotOf(add)));
  at(4800, () => {
    move(spotOf(add), true);
    press(add);
  });
  at(5100, () => sheet?.classList.remove("is-up"));

  // ٦) شريط السلة يصعد · الإصبع يخرج · سكون.
  at(5300, () => cart?.classList.add("is-up"));
  at(5700, () => move(OUT));
  at(6300, () => {
    // `will-change` يُزال عند السكون: تركه محجوزاً يستهلك ذاكرة GPU بلا حركة.
    stage.classList.remove("ph-live");
    stage.classList.add("ph-settled");
  });

  return () => {
    timers.forEach(clearTimeout);
    stage.classList.remove("ph-live");
  };
}
