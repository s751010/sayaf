/** مكوّنات الموقع العام: الشعار، الشريط العلوي، التذييل. */
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { getSiteSetting } from "@/lib/data";
import { SITE_NAME } from "@/lib/config";
import { menuUrl } from "@/lib/menuUrl";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui";
import { SupportWhatsAppButton } from "@/components/SupportWhatsApp";
import { Icon } from "@/lib/icons";

export function Logo({ compact }: { compact?: boolean }) {
  return (
    <span className="inline-flex select-none items-center gap-2">
      <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0c96a" />
            <stop offset="1" stopColor="#c99a2e" />
          </linearGradient>
        </defs>
        <path
          d="M13 30a7 7 0 0 1 .6-13.97A10 10 0 0 1 33 14a8 8 0 0 1 2 15.75V30H13Z"
          fill="url(#lg)"
        />
        <rect x="16" y="33" width="16" height="2.6" rx="1.3" fill="url(#lg)" opacity=".85" />
        <rect x="19" y="38" width="10" height="2.6" rx="1.3" fill="url(#lg)" opacity=".55" />
      </svg>
      {!compact && (
        <span className="font-display text-lg font-black tracking-tight text-ink">
          كلاود<span className="text-gold"> منيو</span>
        </span>
      )}
    </span>
  );
}

/**
 * رابط معاينة المنيو كما يراه الزبون.
 *
 * `?preview=1` وحده لا يمنح شيئاً: `MenuPage` يتحقّق أن الجلسة الحالية تخصّ
 * صاحب المطعم قبل تجاوز قفل النشر، فيبقى القفل فعّالاً أمام العموم.
 */
export function menuPreviewUrl(slug: string | null | undefined): string | null {
  return menuUrl(slug, "?preview=1");
}

/**
 * زر «معاينة المنيو» — التاجر كان يضيف ٢٠ طبقاً وهو يخمّن شكل النتيجة، والرابط
 * الوحيد للمنيو كان مدفوناً في صفحة «نظرة عامة» فقط.
 */
export function PreviewMenuButton({
  slug,
  label = "معاينة المنيو",
  className,
}: {
  slug: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const url = menuPreviewUrl(slug);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line-gold px-3.5 py-2 text-sm font-bold text-ink transition-colors hover:bg-gold/10",
        className
      )}
    >
      <Icon name="eye" size={15} /> {label}
    </a>
  );
}

const NAV_LINKS = [
  { to: "/demo", label: "منيو تجريبي" },
  { to: "/#features", label: "المزايا" },
  { to: "/#pricing", label: "الأسعار" },
  { to: "/about", label: "من نحن" },
  { to: "/help", label: "المساعدة" },
  { to: "/blog", label: "المدونة" },
];

export function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all",
        scrolled
          ? "border-b border-line bg-page/85 backdrop-blur-lg"
          : "bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link to="/" aria-label={SITE_NAME}>
          <Logo />
        </Link>
        {/**
         * ⚠️ **`md:` لا `sm:` — والفرق مقيس لا مذوق.**
         *
         * كان `sm:flex` (٦٤٠px) وهو **يقصّ الصفّ أصلاً**: قياسٌ على البناء
         * أعطى فائضاً ١٣px بخمسة روابط — أي أن آخر رابط كان مقصوصاً بلا
         * تمرير أفقي يكشفه (`justify-between` يبتلعه بصمت). وبستّة صار ٦١px.
         *
         * والعلاج ليس تضييق `gap` (يوفّر ٤٠px من ٦١ فيبقى القصّ)، بل رفع
         * العتبة إلى حيث يتّسع الصفّ فعلاً: ٧٦٨px ⇒ فائض **صفر**. وما دون
         * ذلك يتصرّف كالجوال — والتذييل يحمل كل رابط، فلا يُفقد شيء.
         */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) =>
            l.to.startsWith("/#") ? (
              <a key={l.to} href={l.to} className="inline-flex min-h-11 items-center text-sm font-bold text-dim hover:text-gold">
                {l.label}
              </a>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn("inline-flex min-h-11 items-center text-sm font-bold hover:text-gold", isActive ? "text-gold" : "text-dim")
                }
              >
                {l.label}
              </NavLink>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex min-h-11 items-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-on-gold hover:bg-gold2"
            >
              لوحة التحكم
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden min-h-11 items-center px-3 py-2 text-sm font-bold text-dim hover:text-ink sm:inline-flex">
                دخول
              </Link>
              <Link
                to="/login?mode=signup"
                className="inline-flex min-h-11 items-center rounded-xl bg-gold px-4 py-2 text-sm font-bold text-on-gold hover:bg-gold2"
              >
                ابدأ مجاناً
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

type FooterSettings = {
  about?: string;
  email?: string;
  phone?: string;
  twitter?: string;
  instagram?: string;
};

export function Footer() {
  const [s, setS] = useState<FooterSettings | null>(null);
  useEffect(() => {
    getSiteSetting<FooterSettings>("footer").then(setS).catch(() => {});
  }, []);

  return (
    <footer className="mt-auto border-t border-line bg-panel">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-dim">
            {s?.about ??
              "منصة سعودية تحوّل منيو مطعمك إلى تجربة رقمية فاخرة عبر رمز QR — بلا تطبيقات وبلا تعقيد."}
          </p>
        </div>
        <div>
          <p className="mb-3 font-display font-extrabold text-ink">روابط</p>
          <ul className="flex flex-col gap-2 text-sm text-dim">
            <li><Link to="/about" className="inline-flex min-h-9 items-center hover:text-gold">من نحن</Link></li>
            <li><Link to="/demo" className="inline-flex min-h-9 items-center hover:text-gold">منيو تجريبي</Link></li>
            <li><Link to="/restaurants" className="inline-flex min-h-9 items-center hover:text-gold">دليل المطاعم</Link></li>
            <li><a href="/#features" className="inline-flex min-h-9 items-center hover:text-gold">المزايا</a></li>
            <li><a href="/#pricing" className="inline-flex min-h-9 items-center hover:text-gold">الأسعار</a></li>
            <li><Link to="/help" className="inline-flex min-h-9 items-center hover:text-gold">المساعدة والأسئلة</Link></li>
            <li><Link to="/blog" className="inline-flex min-h-9 items-center hover:text-gold">المدونة</Link></li>
            <li><Link to="/login" className="inline-flex min-h-9 items-center hover:text-gold">دخول التجّار</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 font-display font-extrabold text-ink">تواصل معنا</p>
          <ul className="flex flex-col gap-2 text-sm text-dim">
            {s?.email && (
              <li><a href={`mailto:${s.email}`} className="inline-flex min-h-9 items-center hover:text-gold" dir="ltr">{s.email}</a></li>
            )}
            {s?.phone && (
              <li><a href={`tel:${s.phone}`} className="inline-flex min-h-9 items-center hover:text-gold" dir="ltr">{s.phone}</a></li>
            )}
            {s?.twitter && (
              <li><a href={s.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center hover:text-gold">تويتر / X</a></li>
            )}
            {s?.instagram && (
              <li><a href={s.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center hover:text-gold">إنستغرام</a></li>
            )}
            {!s?.email && !s?.phone && (
              <li>
                <a href="mailto:support@cloudsmenu.app" className="inline-flex min-h-9 items-center hover:text-gold" dir="ltr">
                  support@cloudsmenu.app
                </a>
              </li>
            )}
            <li><Link to="/help" className="inline-flex min-h-9 items-center hover:text-gold">مركز المساعدة</Link></li>
          </ul>
          <SupportWhatsAppButton className="mt-3" />
          <ul className="mt-3 flex flex-col text-xs text-faint">
            <li>
              <Link to="/help#policy" className="inline-flex min-h-9 items-center hover:text-gold">
                سياسة الاشتراك والإلغاء
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="inline-flex min-h-9 items-center hover:text-gold">
                سياسة الخصوصية
              </Link>
            </li>
            <li>
              <Link to="/terms" className="inline-flex min-h-9 items-center hover:text-gold">
                شروط الاستخدام
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-faint">
        © {new Date().getFullYear()} {SITE_NAME} — صُنع بحب في السعودية 🇸🇦
      </div>
    </footer>
  );
}
