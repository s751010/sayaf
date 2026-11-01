/**
 * القائمة التي يكتب فيها المسار — أصنافاً كانت أو طابعاً.
 *
 * ⚠️ **لا تُنشأ قائمة لأن الجلب فشل**: `menus` في سياق اللوحة كانت تُحسم إلى
 * `[]` عند فشل جلبها، فالاعتماد عليها وحدها كان سيُنشئ «القائمة الرئيسية» ثانيةً
 * لتاجرٍ له قائمة (الدرس ٣٢). وصار الفشل `null` + `menusFailed` (٢٠٢٦/١٠/٢٨)،
 * لكن `null` يعني أيضاً «ما زالت تُحمَّل» — فالقائمة الفارغة أو الغائبة لا تكفي
 * دليلاً، ويُسأل الخادم مباشرةً، وفشلُه يرمي فيظهر خطأٌ بإعادة محاولة. والطابع
 * يحتاجها أيضاً: `applyThemeToAllMenus` على مطعمٍ بلا قائمة ينجح **بلا صفّ
 * واحد** — «طُبّق ✓» ولا شيء طُبّق.
 *
 * وصفحة الأطباق تمرّ منها أيضاً (كان لها نسخةٌ تثق بـ`menus` وحدها)، و`onCreated`
 * لها تقول للتاجر إن قائمةً أُنشئت فعلاً.
 */
import { createMenu, getMyMenus, reportSilentFailure } from "@/lib/data";
import type { Menu } from "@/lib/types";

export async function ensureMenuId(ctx: {
  restaurantId: string;
  userId: string;
  menus: Menu[] | null;
  refreshMenus: () => Promise<void>;
  onCreated?: () => void;
}): Promise<string> {
  const known = ctx.menus?.[0]?.id;
  if (known) return known;
  const fresh = await getMyMenus(ctx.restaurantId);
  let id = fresh[0]?.id;
  if (!id) {
    id = (await createMenu({ name: "القائمة الرئيسية", restaurant_id: ctx.restaurantId, user_id: ctx.userId })).id;
    ctx.onCreated?.();
  }
  await ctx.refreshMenus().catch((e) => reportSilentFailure("setup:refreshMenus", e));
  return id;
}
