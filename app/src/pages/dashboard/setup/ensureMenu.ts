/**
 * القائمة التي يكتب فيها المسار — أصنافاً كانت أو طابعاً.
 *
 * ⚠️ **لا تُنشأ قائمة لأن الجلب فشل**: `menus` في سياق اللوحة تُحسم إلى `[]`
 * عند فشل جلبها، فالاعتماد عليها وحدها كان سيُنشئ «القائمة الرئيسية» ثانيةً
 * لتاجرٍ له قائمة (الدرس ٣٢). فيُسأل الخادم مباشرةً، وفشلُه يرمي فيظهر خطأٌ
 * بإعادة محاولة. والطابع يحتاجها أيضاً: `applyThemeToAllMenus` على مطعمٍ بلا
 * قائمة ينجح **بلا صفّ واحد** — «طُبّق ✓» ولا شيء طُبّق.
 */
import { createMenu, getMyMenus, reportSilentFailure } from "@/lib/data";
import type { Menu } from "@/lib/types";

export async function ensureMenuId(ctx: {
  restaurantId: string;
  userId: string;
  menus: Menu[] | null;
  refreshMenus: () => Promise<void>;
}): Promise<string> {
  const known = ctx.menus?.[0]?.id;
  if (known) return known;
  const fresh = await getMyMenus(ctx.restaurantId);
  const id =
    fresh[0]?.id ??
    (await createMenu({ name: "القائمة الرئيسية", restaurant_id: ctx.restaurantId, user_id: ctx.userId })).id;
  await ctx.refreshMenus().catch((e) => reportSilentFailure("setup:refreshMenus", e));
  return id;
}
