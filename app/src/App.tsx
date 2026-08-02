import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider, Spinner } from "@/components/ui";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import Landing from "@/pages/Landing";
import MenuPage from "@/pages/MenuPage";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";

// لوحة التحكم والمدونة والمؤسس تُحمَّل عند الطلب — صفحة المنيو العامة
// (الأكثر زيارة عبر QR) تبقى في الحزمة الرئيسية لأسرع فتح ممكن.
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPostPage = lazy(() => import("@/pages/BlogPost"));
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const Founder = lazy(() => import("@/pages/founder/Founder"));
const Demo = lazy(() => import("@/pages/Demo"));
const Help = lazy(() => import("@/pages/Help"));
const ApiDocs = lazy(() => import("@/pages/ApiDocs"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Stamp = lazy(() => import("@/pages/Stamp"));

function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/help" element={<Help />} />
                <Route path="/docs/api" element={<ApiDocs />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/login" element={<Login />} />
                {/* قبل `/:slug` — مسارات ثابتة لا يجوز أن يلتقطها slug مطعم. */}
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/stamp" element={<Stamp />} />
                <Route path="/dashboard/*" element={<Dashboard />} />
                {/* `/*` لأن اللوحة صارت أقساماً براوتر فرعي داخلها. */}
                <Route path="/founder/*" element={<Founder />} />
                {/* slug المطعم — يلتقط أي مسار من مستوى واحد.
                    حاجز خطأ خاص: انهيار منيو مطعم لا يجب أن يُسقط التطبيق كله. */}
                <Route
                  path="/:slug"
                  element={
                    <ErrorBoundary>
                      <MenuPage />
                    </ErrorBoundary>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
