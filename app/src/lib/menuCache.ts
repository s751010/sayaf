/**
 * آخر منيو ناجح لكل مطعم — على جهاز الزبون (`cm2_menu_cache_<slug>`).
 *
 * ═══ لماذا ═══
 *
 * الزبون يمسح الكود من طاولةٍ في قبوٍ أو خيمةٍ أو مجمّعٍ ضعيف الإشارة. وكان
 * أيّ فشلٍ في الشبكة يعرض «تعذّر تحميل المنيو» — حتى لمن فتح المنيو نفسه قبل
 * دقائق. الآن يُعرض آخر ما حُمّل بنجاح مع شريط «قد يكون قديماً — لا اتصال الآن».
 *
 * ⚠️ **الفشل ≠ الفارغ** (القاعدة «ج»): بلا نسخةٍ محفوظة تبقى حالة الفشل كما هي،
 * ولا يُعرض منيو فارغ مكانها.
 *
 * ═══ ما يُحفظ ═══
 *
 * القوائم **المفعّلة كلّها** وأطباقها — لا ما ظهر لحظة الحفظ وحده: نافذة العرض
 * (قائمة الفطور) تُطبَّق من جديد عند العرض بـ`visibleMenu`، فمن حُفظ له المنيو
 * صباحاً لا يرى قائمة الفطور مساءً. ولا يُحفظ ما جُلب بجلسة المالك (المعاينة
 * تقرأ `select=*`) — النسخة المحفوظة ما يراه الزائر المجهول حرفاً.
 *
 * كل قراءة وكتابة داخل `try/catch`: وضع الخصوصية والتخزين الممتلئ يُسقطان
 * الحفظ بصمت ولا يُسقطان المنيو.
 */
import { inTimeWindow } from "@/lib/hours";
import { K, getItem, removeItem, setItem } from "@/lib/storage";
import type { Dish, Menu, Restaurant } from "@/lib/types";

export type MenuSnapshot = { restaurant: Restaurant; menus: Menu[]; dishes: Dish[] };
/** ‏`savedAt` بالميلي ثانية — متى حُمّل هذا المنيو آخر مرّة بنجاح. */
export type CachedMenu = MenuSnapshot & { savedAt: number };

/** يُرفع حين يتغيّر الشكل: نسخةٌ بشكلٍ قديم تُتجاهل ولا تُقرأ خطأً. */
const VERSION = 1;

export function menuCacheKey(slug: string): string {
  return `${K.MENU_CACHE}_${slug}`;
}

/**
 * ما يراه الزبون الآن من القوائم المفعّلة وأطباقها.
 *
 * نافذة العرض (قائمة فطور رمضان مثلاً): لو أسقط الترشيح كل القوائم نعرضها
 * كلها — منيو فارغ أمام زبون على الطاولة أسوأ بكثير من قائمة تظهر خارج وقتها.
 *
 * ⚠️ ترشيح الأطباق **يعوّض `menu_id=in.(…)` الذي كان على الخادم**، ولا يجوز أن
 * يتساهل عنه: `getRestaurantDishes` تُعيد أطباق كل القوائم بما فيها المعطّلة
 * وخارج نافذتها، فبلا هذا الشرط يرى الزبون أصنافاً أطفأها التاجر. والترتيب
 * محفوظ لأن الخادم رتّب أصلاً بـ`sort_order` ثم `created_at`، و`filter` لا يعيد
 * الترتيب. و`menu_id` قابل لأن يكون `null` (صنف يتيم بلا قائمة) فيُستبعد كما
 * كان يستبعده الخادم.
 */
export function visibleMenu(
  active: Menu[],
  allDishes: Dish[],
  now = new Date()
): { menus: Menu[]; dishes: Dish[] } {
  const inWindow = active.filter((m) => inTimeWindow(m.window_from, m.window_to, now));
  const menus = inWindow.length ? inWindow : active;
  return { menus, dishes: dishesOf(menus, allDishes) };
}

function dishesOf(menus: Menu[], dishes: Dish[]): Dish[] {
  const ids = new Set(menus.map((m) => m.id));
  return dishes.filter((d) => d.menu_id !== null && ids.has(d.menu_id));
}

/** يحفظ القوائم المفعّلة وأطباقها وحدها — أطباق القوائم المطفأة لا تُخزَّن. */
export function saveMenuCache(slug: string, data: MenuSnapshot, now = Date.now()): void {
  if (!slug) return;
  try {
    const value = {
      v: VERSION,
      savedAt: now,
      restaurant: data.restaurant,
      menus: data.menus,
      dishes: dishesOf(data.menus, data.dishes),
    };
    setItem(menuCacheKey(slug), JSON.stringify(value));
  } catch {
    /* التخزين ممتلئ أو محجوب — المنيو يعمل بلا نسخة محفوظة */
  }
}

/** النسخة المحفوظة إن كانت سليمة الشكل، وإلا `null` (لا انهيار على صفٍّ تالف). */
export function parseMenuCache(raw: string | null): CachedMenu | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown> | null;
    if (!o || typeof o !== "object" || o.v !== VERSION) return null;
    const { savedAt, restaurant, menus, dishes } = o;
    if (typeof savedAt !== "number" || !Number.isFinite(savedAt)) return null;
    if (!isObject(restaurant)) return null;
    if (typeof restaurant.id !== "string" || typeof restaurant.name !== "string") return null;
    if (!Array.isArray(menus) || !Array.isArray(dishes)) return null;
    // عنصرٌ تالف داخل المصفوفة يُسقَط وحده — `visibleMenu` يقرأ `menu_id` من كلٍّ منها.
    return {
      savedAt,
      restaurant: restaurant as unknown as Restaurant,
      menus: menus.filter(isObject) as unknown as Menu[],
      dishes: dishes.filter(isObject) as unknown as Dish[],
    };
  } catch {
    return null;
  }
}

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

export function readMenuCache(slug: string): CachedMenu | null {
  if (!slug) return null;
  try {
    return parseMenuCache(getItem(menuCacheKey(slug)));
  } catch {
    return null;
  }
}

/** مطعمٌ غير موجود أو غير منشور: نسخته المحفوظة لا تُعرض بعد اليوم. */
export function clearMenuCache(slug: string): void {
  if (!slug) return;
  try {
    removeItem(menuCacheKey(slug));
  } catch {
    /* نتجاهل */
  }
}
