/**
 * معاينة مصغّرة لطابع المنيو — في مُنتقي اللوحة وفي معرض الطوابع بالهبوط.
 *
 * مربّع اللون وحده لا يكفي: التاجر يحتاج أن يرى الغلاف وشكل الشعار وتخطيط
 * الأطباق قبل أن يختار. و**تتبع قاعدة `MenuHeader` نفسها** (كتلةٌ بلون العلامة،
 * إلا الداكن المؤطَّر فغلافه داكنٌ مزخرف) — فما يختاره هنا هو ما يراه زبونه.
 */
import type { CSSProperties } from "react";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import { isDarkTheme, type MenuTheme } from "@/lib/themes";

export function ThemePreview({ theme }: { theme: MenuTheme }) {
  const v = theme.vars;
  const { pattern, header, layout } = theme.design;
  const accent = v["--m-accent"];
  const framed = header === "frame";
  const darkCover = framed && isDarkTheme(theme);

  const cover: CSSProperties = darkCover
    ? {
        backgroundColor: v["--m-bg-2"],
        backgroundImage: patternImage(pattern, accent, 0.12),
        backgroundSize: PATTERN_SIZE[pattern],
      }
    : {
        backgroundColor: accent,
        backgroundImage: patternImage(pattern, v["--m-on-accent"], 0.14),
        backgroundSize: PATTERN_SIZE[pattern],
      };
  const card: CSSProperties = {
    background: `linear-gradient(${v["--m-surface"]}, ${v["--m-surface"]}), ${v["--m-bg"]}`,
    boxShadow: `inset 0 0 0 1px ${v["--m-border"]}`,
    borderRadius: `calc(${v["--m-radius"]} * 0.5)`,
  };
  const ink = { background: v["--m-text"], opacity: 0.8 };

  return (
    <div className="relative h-28 overflow-hidden" style={{ backgroundColor: v["--m-bg"] }} aria-hidden="true">
      <div className="relative h-10" style={cover}>
        {header === "band" && (
          <span
            className="absolute inset-x-0 bottom-0 h-2"
            style={{
              backgroundColor: v["--m-bg-2"],
              backgroundImage: patternImage("sadu", accent, 1),
              backgroundSize: "20px 20px",
              borderTop: `1px solid ${accent}`,
            }}
          />
        )}
      </div>

      {/* الشعار على حافّة الغلاف في أوّل السطر — كما في المنيو. */}
      <span
        className="absolute start-2.5 top-6 h-7 w-7"
        style={{
          background: darkCover ? accent : v["--m-bg"],
          borderRadius: framed ? "3px" : "8px",
          boxShadow: `0 0 0 2px ${v["--m-bg"]}${framed ? `, 0 0 0 3px ${accent}` : ""}`,
        }}
      />
      <span className="absolute start-2.5 top-[3.6rem] h-1.5 w-14 rounded-full" style={ink} />

      {/* الأطباق حسب التخطيط — هذا ما يريه الفرق الحقيقي. */}
      <div className="absolute inset-x-2.5 bottom-2">
        {layout === "list" ? (
          <div className="flex flex-col gap-1.5">
            {[0, 1].map((i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="h-1.5 w-10 rounded-sm" style={ink} />
                <span className="h-px flex-1 border-b border-dotted" style={{ borderColor: v["--m-muted"], opacity: 0.5 }} />
                <span className="h-1.5 w-4 rounded-sm" style={{ background: accent }} />
              </span>
            ))}
          </div>
        ) : layout === "showcase" ? (
          <span className="block h-7" style={card} />
        ) : (
          <span className="flex gap-1.5">
            <span className="h-7 flex-1" style={card} />
            <span className="h-7 flex-1" style={card} />
          </span>
        )}
      </div>
    </div>
  );
}
