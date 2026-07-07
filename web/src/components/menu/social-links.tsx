import { AtSign, MapPin, MessageCircle, Star } from "lucide-react";
import type { Restaurant } from "@/lib/types";

function waLink(v: string | null): string | null {
  if (!v) return null;
  return v.startsWith("http") ? v : `https://wa.me/${v.replace(/[^\d]/g, "")}`;
}

export function SocialLinks({ restaurant }: { restaurant: Restaurant }) {
  const items: { href: string | null; label: string; icon?: React.ReactNode }[] = [
    {
      href: restaurant.google_review_url,
      label: "قيّمنا على قوقل",
      icon: <Star size={14} className="text-[#FBBC05]" />,
    },
    { href: waLink(restaurant.social_whatsapp), label: "واتساب", icon: <MessageCircle size={14} /> },
    { href: restaurant.social_instagram, label: "Instagram", icon: <AtSign size={14} /> },
    { href: restaurant.social_twitter, label: "X" },
    { href: restaurant.social_tiktok, label: "TikTok" },
    { href: restaurant.social_snapchat, label: "Snapchat" },
    { href: restaurant.social_maps, label: "الموقع", icon: <MapPin size={14} /> },
  ];
  const visible = items.filter((i) => i.href);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {visible.map((i) => (
        <a
          key={i.label}
          href={i.href!}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:opacity-80"
          style={{
            background: "var(--m-surface)",
            borderColor: "var(--m-border)",
            color: "var(--m-text)",
          }}
        >
          {i.icon}
          {i.label}
        </a>
      ))}
    </div>
  );
}
