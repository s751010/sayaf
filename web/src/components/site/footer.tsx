import { Logo } from "./logo";
import { getSiteSettings } from "@/lib/settings";

export async function Footer() {
  const { footer } = await getSiteSettings();

  return (
    <footer
      id="contact"
      className="border-t border-line-dim bg-charcoal-2 px-[var(--page-px,clamp(16px,5vw,60px))] py-12"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center">
        <Logo />
        <p className="max-w-md text-sm leading-relaxed text-warm">{footer.about}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{footer.terms}</span>
          <span aria-hidden>·</span>
          <span>{footer.privacy}</span>
        </div>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} كلاود منيو · صُنع في السعودية 🇸🇦
        </p>
      </div>
    </footer>
  );
}
