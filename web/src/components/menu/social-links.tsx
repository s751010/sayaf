import { AtSign, MapPin, MessageCircle, Star } from "lucide-react";
import type { PublicRestaurant } from "@/lib/types";
import { safeExternalUrl, safeWhatsAppUrl } from "@/lib/safe-url";

export function SocialLinks({ restaurant }: { restaurant: PublicRestaurant }) {
  // كل رابط يمرّ بالمعقِّم: `https` فقط. رابط بمخطَّط آخر (مثل `javascript:`)
  // يُسقط بصمت بدل أن يُعرض للزبون على نطاق المنصّة.
  const items: { href: string | null; label: string; icon?: React.ReactNode }[] = [
    {
      href: safeExternalUrl(restaurant.google_review_url),
      label: "قيّمنا على قوقل",
      icon: <Star size={14} className="text-[#FBBC05]" />,
    },
    {
      href: safeWhatsAppUrl(restaurant.social_whatsapp),
      label: "واتساب",
      icon: <MessageCircle size={14} />,
    },
    { href: safeExternalUrl(restaurant.social_instagram), label: "Instagram", icon: <AtSign size={14} /> },
    { href: safeExternalUrl(restaurant.social_twitter), label: "X" },
    { href: safeExternalUrl(restaurant.social_tiktok), label: "TikTok" },
    { href: safeExternalUrl(restaurant.social_snapchat), label: "Snapchat" },
    { href: safeExternalUrl(restaurant.social_maps), label: "الموقع", icon: <MapPin size={14} /> },
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
          rel="noreferrer nofollow ugc"
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
