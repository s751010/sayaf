/**
 * معاينة مصغّرة لطابع المنيو.
 *
 * مربّع اللون وحده لا يكفي بعد أن صار الثيم طابعاً كاملاً: التاجر يحتاج أن يرى
 * الزخرفة وشكل الترويسة وتخطيط الأطباق قبل أن يختار — لا أن يقرأ اسماً ويكتشف
 * النتيجة على منيوه أمام زبائنه.
 */
import type { CSSProperties } from "react";
import { patternImage, PATTERN_SIZE } from "@/lib/patterns";
import type { MenuTheme } from "@/lib/themes";

export function ThemePreview({ theme }: { theme: MenuTheme }) {
  const v = theme.vars;
  const { pattern, patternOpacity, header, layout } = theme.design;
  const accent = v["--m-accent"];

  const card: CSSProperties = {
    background: v["--m-surface"],
    border: `1px solid ${v["--m-border"]}`,
    borderRadius: `calc(${v["--m-radius"]} * 0.5)`,
  };

  return (
    <div
      className="relative h-24 overflow-hidden"
      style={{
        backgroundColor: v["--m-bg"],
        backgroundImage: patternImage(pattern, accent, Math.max(patternOpacity, 0.05)),
        backgroundSize: PATTERN_SIZE[pattern],
      }}
    >
      {/* الترويسة المصغّرة */}
      <div className="relative h-9" style={{ background: v["--m-bg-2"] }}>
        {header === "band" && (
          <span
            className="absolute inset-x-0 bottom-0 h-2.5"
            style={{
              backgroundColor: v["--m-bg"],
              backgroundImage: patternImage("sadu", accent, 1),
              backgroundSize: "24px 24px",
              borderTop: `1px solid ${accent}`,
              borderBottom: `1px solid ${accent}`,
            }}
          />
        )}
        {header === "arch" && (
          <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-4 w-full">
            <path d="M0 8 Q25 8 38 2 Q50 -3 62 2 Q75 8 100 8 L100 12 L0 12 Z" style={{ fill: v["--m-bg"] }} />
            <path d="M0 8 Q25 8 38 2 Q50 -3 62 2 Q75 8 100 8" fill="none" style={{ stroke: accent, strokeWidth: 1 }} vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>

      {/* الشعار */}
      <span
        className="absolute start-1/2 top-5 h-7 w-7 -translate-x-1/2 border"
        style={{
          background: v["--m-bg-2"],
          borderColor: accent,
          borderRadius: header === "frame" ? "2px" : "8px",
          transform: "translateX(50%)",
        }}
      />

      {/* الأطباق حسب التخطيط — هذا ما يريه الفرق الحقيقي */}
      <div className="absolute inset-x-2 bottom-2">
        {layout === "list" ? (
          <div className="flex flex-col gap-1.5">
            {[0, 1].map((i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="h-1.5 w-8 rounded-sm" style={{ background: v["--m-text"], opacity: 0.75 }} />
                <span className="h-px flex-1 border-b border-dotted" style={{ borderColor: v["--m-border"] }} />
                <span className="h-1.5 w-4 rounded-sm" style={{ background: accent }} />
              </span>
            ))}
          </div>
        ) : layout === "showcase" ? (
          <span className="block h-9" style={card} />
        ) : (
          <span className="flex gap-1.5">
            <span className="h-9 flex-1" style={card} />
            <span className="h-9 flex-1" style={card} />
          </span>
        )}
      </div>
    </div>
  );
}
