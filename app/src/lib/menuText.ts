/**
 * نصوص المنيو بلغة الزبون — **مصدر واحد** لسؤالٍ يتكرّر في كل شاشة يراها
 * الزبون: «أي الاسمين أعرض؟».
 *
 * ═══ لماذا مستقلّة ═══
 *
 * كانت هذه الدوال داخل `MenuPage.tsx`، فلمّا احتاجتها السلّة كُتب المنطق
 * فيها مرّة ثانية سطراً بسطر (`en && d.name_en ? d.name_en : d.name`). ونسختان
 * تعنيان أن إضافة لغة ثالثة أو تغيير قاعدة السقوط إلى العربية يُصلح إحداهما
 * وينسى الأخرى — فيقرأ الزبون بطاقةً بالإنجليزية وسلّةً بالعربية.
 *
 * كلّها **خالصة**: بلا حالة ولا شبكة ولا DOM.
 */
import { ALLERGENS, displayAllergens } from "@/lib/allergens";
import { aliasType } from "@/lib/starterMenus";
import type { Dish } from "@/lib/types";

/**
 * الاسم المعروض. **السقوط إلى العربية مقصود**: `english_enabled` مفتاح مطعم
 * لا وعدٌ بأن كل طبق مُترجَم، والاسم العربي أنفع للزبون من فراغ.
 */
export function dishName(d: Dish, en: boolean): string {
  return en && d.name_en ? d.name_en : d.name;
}

/** الوصف المعروض — نفس قاعدة السقوط، و`null` إن لم يكتب التاجر وصفاً. */
export function dishDesc(d: Dish, en: boolean): string | null {
  return en && d.description_en ? d.description_en : d.description;
}

/** اسم المسبّب بلغة الزبون — من نفس مصدر `ALLERGENS` فلا يتباعد الاسمان. */
export function allergenLabel(id: string, en: boolean): string {
  const a = ALLERGENS.find((x) => x.id === id);
  return a ? (en ? a.en : a.ar) : id;
}

/**
 * نوع النشاط كما **يُعرَض للزبون**.
 *
 * ═══ العطل الذي أوجدها ═══
 *
 * `restaurants.type` حقلٌ حرّ، وفيه قيم قديمة بالإنجليزية من نسخة سابقة —
 * `general` لأربعة عشر مطعماً من تسعة عشر. وكانت تُطبع كما هي تحت اسم المطعم
 * في ترويسة منيوه، وتُرسَل في `servesCuisine` داخل JSON-LD الذي يقرؤه قوقل.
 * أي أن زبون «القرموشي» كان يقرأ كلمة **general** تحت اسم مطعمه.
 *
 * القاعدة: كلمات التاجر العربية تُعرض كما كتبها — «مأكولات سعودية وعالمية»
 * أنفع من أي تصنيف نختاره له. وما لا حرف عربي فيه يُترجَم عبر `aliasType`
 * (نفس القاموس الذي يختار قالب قائمة البداية، فلا مفردتان لشيء واحد).
 */
export function restaurantTypeLabel(type: string | null | undefined): string | null {
  const v = (type ?? "").trim();
  if (!v) return null;
  return /[؀-ۿ]/.test(v) ? v : aliasType(v);
}

/** فهرس «مسبب → الأطباق التي تحتويه» لصفحة المسببات، الأكثر شيوعاً أوّلاً. */
export function buildAllergenIndex(dishes: Dish[], en: boolean) {
  const map = new Map<string, { label: string; emoji: string; dishes: string[] }>();
  for (const d of dishes) {
    for (const a of displayAllergens(d.allergens, en)) {
      const entry = map.get(a.key) ?? { label: a.label, emoji: a.emoji, dishes: [] };
      entry.dishes.push(dishName(d, en));
      map.set(a.key, entry);
    }
  }
  return [...map.values()].sort((x, y) => y.dishes.length - x.dishes.length);
}
