/** AI advisory board personas (matches the legacy app — see ../../CLAUDE.md §3d). */
export interface Persona {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
}

export const PERSONAS: Persona[] = [
  { id: "all", name: "الفريق كاملاً", role: "جميع الأعضاء", emoji: "👥", color: "#D4A843" },
  { id: "ceo", name: "أحمد", role: "المدير التنفيذي", emoji: "👔", color: "#D4A843" },
  { id: "cmo", name: "نورة", role: "مديرة التسويق", emoji: "📣", color: "#F472B6" },
  { id: "cto", name: "فارس", role: "مدير التقنية", emoji: "💻", color: "#60A5FA" },
  { id: "cfo", name: "ريم", role: "مديرة المالية", emoji: "💰", color: "#34D399" },
  { id: "cs", name: "خالد", role: "مدير نجاح العملاء", emoji: "🤝", color: "#A78BFA" },
  { id: "growth", name: "سلمى", role: "محللة النمو", emoji: "📊", color: "#F97316" },
];
