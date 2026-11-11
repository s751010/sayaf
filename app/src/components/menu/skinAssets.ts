/**
 * خامة الطابع وترويسته **عند الطلب** (§18، الدفعة ب ٢٠٢٦/١١/١١).
 *
 * ═══ لماذا ═══
 *
 * كانت ملفّات `styles/skins/<id>.css` مستورَدةً من رأس `menu-skins.css`، وترويسات
 * `heads/*Head.tsx` مستورَدةً من `SkinHeads` و`SectionHeading` — فدخلت كلّها الحزمة
 * المشتركة: زائر الهبوط وزبون منيو «فاخر» ينزّلان ستّاً وعشرين خامةً وترويسةً لا
 * يريان منها شيئاً (‎+٢٢٫٦KB CSS و‎+٢٠٫٥KB JS مضغوطةً مع الاثني عشر الأخيرة وحدها).
 *
 * الآن كلّ طابعٍ في ملفّه **قطعتان**: CSS خامته، ووحدة ترويسته وعنوان قسمه — تُنزَّلان
 * حين يُرسم ذلك الطابع، لا قبل.
 *
 * ═══ لا وميض بلا خامة ═══
 *
 * المنيو **لا يُرسم** بطابعٍ قطعتاه لم تصلا: `useSkinAssets` يبقيه على هيكل التحميل
 * حتى تصلا (`MenuPage`). والطابع معروفٌ من `menus.theme` مع البيانات نفسها، فالرحلة
 * واحدة لا سلسلة. وفشل التنزيل لا يحبس الزبون: يُرسم المنيو بلا خامة (واجهة متجر)
 * — أهون من هيكلٍ لا ينتهي.
 *
 * ═══ الترتيب ═══
 *
 * ملفّ الخامة يصل بعد `menu-skins.css` لا قبله كما كان في `@import`. فكلّ انتقائيٍّ
 * فيه يبدأ بصنف خامته (`skin-files.test.ts`) — يغلب نظيره العامّ بالخصوصية لا
 * بالترتيب، فلا يتغيّر شيء بتغيّر الموضع.
 *
 * ⚠️ **طابعٌ جديد في ملفّه = سطرٌ هنا.** المسارات حرفيّة عمداً: Vite يحلّل `import()`
 * ساكناً، ومسارٌ مبنيّ من متغيّر لا يُحزَّم. و`skin-files.test.ts` يُسقط ملفّاً بلا سطر.
 */
import { useEffect, useState, type ComponentType } from "react";
import type { HeaderShape, HeadingStyle, MenuDesign } from "@/lib/themes";
import type { HeadProps } from "./SkinHeads";
import type { SkinHeadingProps } from "./heads/DukkanHead";

export interface SkinParts {
  Head: ComponentType<HeadProps>;
  Heading: ComponentType<SkinHeadingProps>;
}

interface FileSkin {
  /** شكل الترويسة الذي ترسمه وحدته — كما في `design.header` لطابعه. */
  header: HeaderShape;
  /** نمط عنوان القسم — كما في `design.heading`. */
  heading: HeadingStyle;
  css: () => Promise<unknown>;
  parts: () => Promise<SkinParts>;
}

export const FILE_SKINS = {
  dukkan: {
    header: "tin",
    heading: "shelf",
    css: () => import("@/styles/skins/dukkan.css"),
    parts: () => import("./heads/DukkanHead").then((m) => ({ Head: m.DukkanHead, Heading: m.DukkanHeading })),
  },
  asir: {
    header: "mural",
    heading: "frieze",
    css: () => import("@/styles/skins/asir.css"),
    parts: () => import("./heads/AsirHead").then((m) => ({ Head: m.AsirHead, Heading: m.AsirHeading })),
  },
  harbor: {
    header: "harbor",
    heading: "rope",
    css: () => import("@/styles/skins/harbor.css"),
    parts: () => import("./heads/HarborHead").then((m) => ({ Head: m.HarborHead, Heading: m.HarborHeading })),
  },
  patisserie: {
    header: "awning",
    heading: "doily",
    css: () => import("@/styles/skins/patisserie.css"),
    parts: () => import("./heads/PatisserieHead").then((m) => ({ Head: m.PatisserieHead, Heading: m.PatisserieHeading })),
  },
  juice: {
    header: "slice",
    heading: "tile",
    css: () => import("@/styles/skins/juice.css"),
    parts: () => import("./heads/JuiceHead").then((m) => ({ Head: m.JuiceHead, Heading: m.JuiceHeading })),
  },
  burger: {
    header: "griddle",
    heading: "melt",
    css: () => import("@/styles/skins/burger.css"),
    parts: () => import("./heads/BurgerHead").then((m) => ({ Head: m.BurgerHead, Heading: m.BurgerHeading })),
  },
  bakery: {
    header: "oven",
    heading: "peel",
    css: () => import("@/styles/skins/bakery.css"),
    parts: () => import("./heads/BakeryHead").then((m) => ({ Head: m.BakeryHead, Heading: m.BakeryHeading })),
  },
  breakfast: {
    header: "tray",
    heading: "plate",
    css: () => import("@/styles/skins/breakfast.css"),
    parts: () => import("./heads/BreakfastHead").then((m) => ({ Head: m.BreakfastHead, Heading: m.BreakfastHeading })),
  },
  grill: {
    header: "brazier",
    heading: "skewer",
    css: () => import("@/styles/skins/grill.css"),
    parts: () => import("./heads/GrillHead").then((m) => ({ Head: m.GrillHead, Heading: m.GrillHeading })),
  },
  pizza: {
    header: "table",
    heading: "box",
    css: () => import("@/styles/skins/pizza.css"),
    parts: () => import("./heads/PizzaHead").then((m) => ({ Head: m.PizzaHead, Heading: m.PizzaHeading })),
  },
  dallah: {
    header: "majlis",
    heading: "finjan",
    css: () => import("@/styles/skins/dallah.css"),
    parts: () => import("./heads/DallahHead").then((m) => ({ Head: m.DallahHead, Heading: m.DallahHeading })),
  },
  barista: {
    header: "machine",
    heading: "cup",
    css: () => import("@/styles/skins/barista.css"),
    parts: () => import("./heads/BaristaHead").then((m) => ({ Head: m.BaristaHead, Heading: m.BaristaHeading })),
  },
  karak: {
    header: "kiosk",
    heading: "glass",
    css: () => import("@/styles/skins/karak.css"),
    parts: () => import("./heads/KarakHead").then((m) => ({ Head: m.KarakHead, Heading: m.KarakHeading })),
  },
  samovar: {
    header: "rug",
    heading: "istikan",
    css: () => import("@/styles/skins/samovar.css"),
    parts: () => import("./heads/SamovarHead").then((m) => ({ Head: m.SamovarHead, Heading: m.SamovarHeading })),
  },
  v60: {
    header: "dripper",
    heading: "brew",
    css: () => import("@/styles/skins/v60.css"),
    parts: () => import("./heads/V60Head").then((m) => ({ Head: m.V60Head, Heading: m.V60Heading })),
  },
  latte: {
    header: "saucer",
    heading: "art",
    css: () => import("@/styles/skins/latte.css"),
    parts: () => import("./heads/LatteHead").then((m) => ({ Head: m.LatteHead, Heading: m.LatteHeading })),
  },
  grinder: {
    header: "mill",
    heading: "grind",
    css: () => import("@/styles/skins/grinder.css"),
    parts: () => import("./heads/GrinderHead").then((m) => ({ Head: m.GrinderHead, Heading: m.GrinderHeading })),
  },
  drive: {
    header: "lane",
    heading: "sleeve",
    css: () => import("@/styles/skins/drive.css"),
    parts: () => import("./heads/DriveHead").then((m) => ({ Head: m.DriveHead, Heading: m.DriveHeading })),
  },
  woodfire: {
    header: "dome",
    heading: "hearth",
    css: () => import("@/styles/skins/woodfire.css"),
    parts: () => import("./heads/WoodfireHead").then((m) => ({ Head: m.WoodfireHead, Heading: m.WoodfireHeading })),
  },
  pizzabox: {
    header: "carton",
    heading: "wedge",
    css: () => import("@/styles/skins/pizzabox.css"),
    parts: () => import("./heads/PizzaboxHead").then((m) => ({ Head: m.PizzaboxHead, Heading: m.PizzaboxHeading })),
  },
  slices: {
    header: "counter",
    heading: "lightbox",
    css: () => import("@/styles/skins/slices.css"),
    parts: () => import("./heads/SlicesHead").then((m) => ({ Head: m.SlicesHead, Heading: m.SlicesHeading })),
  },
  napoli: {
    header: "signboard",
    heading: "brush",
    css: () => import("@/styles/skins/napoli.css"),
    parts: () => import("./heads/NapoliHead").then((m) => ({ Head: m.NapoliHead, Heading: m.NapoliHeading })),
  },
  shawarma: {
    header: "spit",
    heading: "panel",
    css: () => import("@/styles/skins/shawarma.css"),
    parts: () => import("./heads/ShawarmaHead").then((m) => ({ Head: m.ShawarmaHead, Heading: m.ShawarmaHeading })),
  },
  steakhouse: {
    header: "cuts",
    heading: "cut",
    css: () => import("@/styles/skins/steakhouse.css"),
    parts: () => import("./heads/SteakhouseHead").then((m) => ({ Head: m.SteakhouseHead, Heading: m.SteakhouseHeading })),
  },
  ocakbasi: {
    header: "hood",
    heading: "ocak",
    css: () => import("@/styles/skins/ocakbasi.css"),
    parts: () => import("./heads/OcakbasiHead").then((m) => ({ Head: m.OcakbasiHead, Heading: m.OcakbasiHeading })),
  },
  smokehouse: {
    header: "chalk",
    heading: "smoke",
    css: () => import("@/styles/skins/smokehouse.css"),
    parts: () => import("./heads/SmokehouseHead").then((m) => ({ Head: m.SmokehouseHead, Heading: m.SmokehouseHeading })),
  },
} satisfies Record<string, FileSkin>;

export type FileSkinId = keyof typeof FILE_SKINS;

const IDS = Object.keys(FILE_SKINS) as FileSkinId[];
const BY_HEADER = new Map<string, FileSkinId>(IDS.map((id) => [FILE_SKINS[id].header, id]));
const BY_HEADING = new Map<string, FileSkinId>(IDS.map((id) => [FILE_SKINS[id].heading, id]));

export function isFileSkin(id: string): id is FileSkinId {
  return Object.prototype.hasOwnProperty.call(FILE_SKINS, id);
}

type Shape = Pick<MenuDesign, "skin" | "header" | "heading">;

/** الطوابع التي يحتاج هذا التصميم قطعها: خامته، وصاحب ترويسته، وصاحب عنوانه. */
export function skinsOf(design: Shape): FileSkinId[] {
  const out = new Set<FileSkinId>();
  if (isFileSkin(design.skin)) out.add(design.skin);
  const h = BY_HEADER.get(design.header);
  if (h) out.add(h);
  const t = BY_HEADING.get(design.heading);
  if (t) out.add(t);
  return [...out];
}

/** ما وصل (أو فشل نهائياً: `null`) — يُقرأ متزامناً في الرسم. */
const done = new Map<FileSkinId, SkinParts | null>();
const pending = new Map<FileSkinId, Promise<void>>();

function loadOne(id: FileSkinId): Promise<void> {
  if (done.has(id)) return Promise.resolve();
  let p = pending.get(id);
  if (!p) {
    const s: FileSkin = FILE_SKINS[id];
    // لا يرمي أبداً: الخامة الفاشلة تُرسم بلا خامة، لا هيكل تحميلٍ إلى الأبد.
    p = Promise.all([s.css().catch(() => undefined), s.parts().catch(() => null)]).then(([, parts]) => {
      done.set(id, parts);
      pending.delete(id);
    });
    pending.set(id, p);
  }
  return p;
}

/** يبدأ تنزيل قطع التصميم (إن لم تبدأ) ويُرضى حين تصل — لا يرمي. */
export function loadSkinAssets(design: Shape): Promise<void> {
  return Promise.all(skinsOf(design).map(loadOne)).then(() => undefined);
}

export function skinAssetsReady(design: Shape): boolean {
  return skinsOf(design).every((id) => done.has(id));
}

/**
 * ترويسة الشكل من ملفّها: `undefined` إن لم يكن الشكل من ملفّ أصلاً، و`null` إن كان
 * ولم تصل وحدته (أو فشلت) — والمتّصل يرسم البديل.
 */
export function headFor(shape: HeaderShape): ComponentType<HeadProps> | null | undefined {
  const id = BY_HEADER.get(shape);
  if (!id) return undefined;
  return done.get(id)?.Head ?? null;
}

export function headingFor(style: HeadingStyle): ComponentType<SkinHeadingProps> | null | undefined {
  const id = BY_HEADING.get(style);
  if (!id) return undefined;
  return done.get(id)?.Heading ?? null;
}

/**
 * هل وصلت قطع الطابع؟ `null` تصميمٌ لم يُعرف بعد (البيانات في الطريق) ⇒ `false`
 * ولا تنزيل. يُعاد الرسم مرّةً حين تصل.
 */
export function useSkinAssets(design: Shape | null): boolean {
  const key = design ? `${design.skin}|${design.header}|${design.heading}` : "";
  const ready = design ? skinAssetsReady(design) : false;
  const [, bump] = useState(0);
  useEffect(() => {
    if (!design || skinAssetsReady(design)) return;
    let alive = true;
    void loadSkinAssets(design).then(() => alive && bump((n) => n + 1));
    return () => {
      alive = false;
    };
    // المفتاح نصّ الثلاثة: كائن التصميم يُبنى من جديد مع كلّ `getTheme`.
  }, [key]);
  return ready;
}
