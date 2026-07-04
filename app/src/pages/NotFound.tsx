import { Link } from "react-router-dom";
import { Navbar, Footer } from "@/components/site";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center">
        <span className="text-6xl">🧭</span>
        <h1 className="font-display text-3xl font-black text-ink">الصفحة غير موجودة</h1>
        <p className="max-w-sm text-dim">
          الرابط الذي فتحته غير صحيح أو تم نقله. إن كنت تبحث عن منيو مطعم، تأكد من الرابط المطبوع على كود QR.
        </p>
        <Link to="/" className="mt-2 rounded-xl bg-gold px-6 py-3 font-bold text-on-gold hover:bg-gold2">
          → الصفحة الرئيسية
        </Link>
      </main>
      <Footer />
    </div>
  );
}
