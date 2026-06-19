import { AtSign, MapPin, Star } from "lucide-react";
import type { Restaurant } from "@/lib/types";

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-line-dim bg-white/5 px-3.5 py-1.5 text-[13px] font-semibold text-cream transition-colors hover:border-gold hover:text-gold";

export function SocialLinks({ restaurant }: { restaurant: Restaurant }) {
  const items: { href: string | null; label: string; icon?: React.ReactNode }[] = [
    {
      href: restaurant.google_review_url,
      label: "قيّمنا على قوقل",
      icon: <Star size={14} className="text-[#FBBC05]" />,
    },
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
          className={chip}
        >
          {i.icon}
          {i.label}
        </a>
      ))}
    </div>
  );
}
