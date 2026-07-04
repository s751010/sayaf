import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider, Spinner } from "@/components/ui";

import Landing from "@/pages/Landing";
import MenuPage from "@/pages/MenuPage";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// لوحة التحكم والمدونة والمؤسس تُحمَّل عند الطلب — صفحة المنيو العامة
// (الأكثر زيارة عبر QR) تبقى في الحزمة الرئيسية لأسرع فتح ممكن.
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Founder = lazy(() => import("@/pages/Founder"));

function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
              <Route path="/founder" element={<Founder />} />
              {/* slug المطعم — يلتقط أي مسار من مستوى واحد */}
              <Route path="/:slug" element={<MenuPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
