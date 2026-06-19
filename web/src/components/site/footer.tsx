import { Logo } from "./logo";

export function Footer() {
  return (
    <footer
      id="contact"
      className="border-t border-line-dim bg-charcoal-2 px-[var(--page-px,clamp(16px,5vw,60px))] py-12"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center">
        <Logo />
        <p className="max-w-md text-sm leading-relaxed text-warm">
          المنيو الرقمي الذكي للمطاعم السعودية. أنشئ قائمتك، شارك QR، وتابع
          أداءك لحظياً.
        </p>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} كلاود منيو · صُنع في السعودية 🇸🇦
        </p>
      </div>
    </footer>
  );
}
